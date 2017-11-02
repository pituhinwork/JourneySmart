import React from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  BackHandler,
  TouchableOpacity,
  Keyboard,
  AsyncStorage,
} from 'react-native';
import { EventRegister } from "react-native-event-listeners";
import Menu, { MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import Spinner from 'react-native-spinkit';
import { autobind } from 'core-decorators';

import { AlterStyles } from '../react-native-common-utils';
import JourneyDetails from './JourneyDetails';
import DB from '../DB';
import BT from '../Bluetooth';
import SceneTitle from '../SceneTitle';
import StaticUtils from '../StaticUtils';
import BaseComponent from '../BaseComponent';
import JourneyTypesMenu from '../JourneyTypesMenu';

const styles = require('../styles')('journeySummary');
const strings = require('../strings')('journeySummary');

@autobind
export default class JourneySummary extends BaseComponent {
  constructor(props) {
    super(props, 'JourneySummary');
    this.state = {};
  }

  async componentWillMount() {
    super.componentWillMount();

    BackHandler.addEventListener('hardwareBackPress', this.onBack);

    console.log(`Summary for journey #${this.props.route.inputParams.rowid} ` + 'requested.');

    this.state.journeyTypes = await DB.getJourneyTypes(true);
    if (this.state.journeyTypes.length > 1) {
      StaticUtils.sortJourneyTypes(this.state.journeyTypes);

      this.state.menuOptions = this.state.journeyTypes.map((type, index) => (
        <MenuOption key={index} value={index}>
          <View style={styles.type}>
            <Text style={styles.typeText}>{type.name}</Text>
          </View>
        </MenuOption>
      ));
    }

    this.state.journey = await DB.loadFinishedJourney(this.props.route.inputParams.rowid);

    let journeyTypeIndex = 0;

    if (this.state.journey) {
      if (!this.state.journey.type) {
        BT.showJourneySummaryNotification();
      }

      // = Route modes / points to show = //
      this.state.routeModes = [];

      [
        [
          require('../../img/routeModeActual.png'),
          require('../../img/routeModeActualSelected.png'),
          ['actual'],
        ],
        [
          require('../../img/routeModeFastest.png'),
          require('../../img/routeModeFastestSelected.png'),
          ['fastest', 'duration'],
        ],
        [
          require('../../img/routeModeShortest.png'),
          require('../../img/routeModeShortestSelected.png'),
          ['shortest', 'distance'],
        ],
      ].forEach(
        (routeMode) =>
          (this.state.journey[routeMode[2][0]] ? this.state.routeModes.push(routeMode) : undefined),
      );

      this.state.pointsToShow = !this.state.journey.actual
        ? this.state.journey.points
        : [
          this.state.journey.points[0],
          this.state.journey.points[this.state.journey.points.length - 1],
        ];

      // = Load = //
      journeyTypeIndex = Math.max(
        this.state.journeyTypes.findIndex(
          (journeyType) => journeyType.rowid === this.state.journey.type,
        ),
        0,
      );

      this.state.routeMode = Math.max(
        this.state.routeModes.findIndex(
          (routeMode) => routeMode[2][0] === this.state.journey.routeMode,
        ),
        0,
      );

      // = Resolve coords = //
      this.state.unresolvedIndex = 0;
      this.state.unresolved = [];

      this.state.pointsToShow.forEach(
        (point, index) => (point.getPostcode() ? undefined : this.state.unresolved.push(index)),
      );

      this.resolvePosition();
    }

    this.setJourneyType(journeyTypeIndex);
  }

  componentWillUnmount() {
    super.componentWillUnmount();

    BackHandler.removeEventListener('hardwareBackPress', this.onBack);

    if (this.timeoutId !== undefined) {
      clearTimeout(this.timeoutId);
    }
  }

  onBack() {
    return this.state.journey && !this.state.journey.type;
  }

  parseError(error) {
    return error === 'TypeError: Network request failed'
      ? strings.all.startJourney.errors.offline
      : error;
  }

  async resolvePosition() {
    if (this.state.unresolvedIndex === this.state.unresolved.length) {
      this.getRoute(this.state.routeModes[0][2][0] !== 'actual');
    } else {
      const point = this.state.pointsToShow[this.state.unresolved[this.state.unresolvedIndex]];

      try {
        this.parseAddress(point, await (await StaticUtils.latLngToAddress(point)).json());
      } catch (error) {
        console.log(error);

        this.setState({ error: this.parseError(error) });
      }
    }
  }

  parseAddress(point, response) {
    console.log(
      'JourneySummary. Parse address response status for point ' +
        `${point.getJourneyRowId()}.${point.getRowId()}: ${response.status}.`,
    );

    switch (response.status) {
      case 'ZERO_RESULTS':
        this.setState({
          error: strings.all.startJourney.errors.reverseGeocodeZeroResults,
        });
        break;

      case 'OK': {
        StaticUtils.setAddress(point, response);

        if (DB.updateJourneyPoint(this.state.journey.rowid, point)) {
          this.timeoutId = setTimeout(() => {
            this.timeoutId = undefined;
            this.state.unresolvedIndex += 1;
            this.resolvePosition();
            this.forceUpdate();
          }, 1000);
        }

        break;
      }
      default:
        break;
    }
  }

  async getRoute(alternatives) {
    const origin = this.state.journey.points[0];

    const destination = this.state.journey.points[this.state.journey.points.length - 1];

    let url =
      'https://maps.googleapis.com/maps/api/directions/json?' +
      `origin=${origin.getLatitude()},${origin.getLongitude()}` +
      `&destination=${destination.getLatitude()},${destination.getLongitude()}` +
      `&key=${StaticUtils.GOOGLE_API_KEY}` +
      `&alternatives=${alternatives}` +
      `&language=${strings.all.getLanguage()}`;

    if (this.state.journey.points.length > 2) {
      url += '&waypoints=';

      for (let i = 1; i < Math.min(23, this.state.journey.points.length - 1); i++) {
        const point = this.state.journey.points[i];

        if (i > 1) {
          url += '|';
        }

        url += `via:${point.getLatitude()},${point.getLongitude()}`;
      }
    }

    const avoid = [
      [this.state.journey.tolls, 'tolls'],
      [this.state.journey.motorways, 'highways'],
      [this.state.journey.ferries, 'ferries'],
    ].reduce((previous, current) => {
      return !current[0] ? previous : (previous ? `${previous}|` : '') + current[1];
    }, undefined);

    if (avoid) {
      url += `&avoid=${avoid}`;
    }

    console.log(url);

    try {
      const response = await (await fetch(url)).json();

      console.log(
        `Alternatives: ${alternatives}; ` + `directions response status: ${response.status}.`,
      );

      if (response.status === 'OK') {
        if (!alternatives) {
          const data = {
            distance: response.routes[0].legs[0].distance.value,

            duration: StaticUtils.round((destination.getMillis() - origin.getMillis()) / 1000, 0),
          };

          console.log(`Actual data: ${JSON.stringify(data)}.`);

          this.state.routeModes[0].push(data);

          this.getRoute(true);
        } else {
          const data = response.routes.map((route) => {
            return {
              distance: route.legs[0].distance.value,
              duration: route.legs[0].duration.value,
            };
          });

          console.log(`Data: ${JSON.stringify(data)}.`);

          this.timeoutId = setTimeout(() => {
            this.timeoutId = undefined;

            for (
              let i = +(this.state.routeModes[0][2][0] === 'actual');
              i < this.state.routeModes.length;
              i += 1
            ) {
              const routeMode = this.state.routeModes[i];
              const fieldName = routeMode[2][1];

              routeMode.push(
                data.reduce(
                  (previous, current) =>
                    (current[fieldName] < previous[fieldName]
                      ? {
                        distance: current.distance,
                        duration: current.duration,
                      }
                      : previous),
                ),
              );
            }

            this.forceUpdate();
          }, 1000);
        }
      }
    } catch (error) {
      console.log(error);

      this.setState({ error: this.parseError(error) });
    }
  }

  setJourneyType(index) {
    this.setState({ journeyType: this.state.journeyTypes[index] });
  }

  onRouteMode(index) {
    this.setState({ routeMode: index });
  }

  async onDone(finish) {
    if (finish) {
      BT.cancelNotification();

      const routeMode = this.state.routeModes[this.state.routeMode];

      const data = {
        type: this.state.journeyType.rowid,
        reason: this.state.journey.reason,
        notes: this.refs.journeyDetails.state.notes,
      };

      if (routeMode[3]) {
        data.routeMode = routeMode[2][0];
        data.distance = routeMode[3].distance;
        data.duration = routeMode[3].duration;
      }
      
      if ((await DB.updateFinishedJourney(this.state.journey.rowid, data)) && this.parent) {
        delete data.type;

        data.rowid = this.state.journey.rowid;

        ['name', 'rate', 'currency', 'metric'].forEach((key) => {
          data[key] = this.state.journeyType[key];
        });

        this.parent.onJourneyUpdated(data);
      }
    } else if (this.state.journey && !this.state.journey.type) {
      DB.deleteJourney(this.state.journey.rowid);
    }
    AsyncStorage.setItem("journeyStarted", "0");
    EventRegister.emit("storageChanged");
    this.props.nav.pop();
  }

  render() {
    const spinner = (
      <Spinner
        style={styles.all.startJourney.$spinner.style}
        size={styles.all.startJourney.$spinner.size}
        type={styles.all.startJourney.$spinner.type}
        color={styles.all.startJourney.$spinner.color}
      />
    );

    let view;

    if (this.state.journey) {
      if (!this.state.error && this.state.unresolvedIndex < this.state.unresolved.length) {
        view = (
          <View style={styles.all.centerCenterFlex1}>
            <Text style={styles.typeText}>
              {strings.all.formatString(
                strings.resolvePosition,
                this.state.unresolvedIndex + 1,
                this.state.unresolved.length,
              )}
            </Text>
            {spinner}
          </View>
        );
      } else {
        const routeModes = this.state.routeModes.map((routeMode, index) => (
          <TouchableOpacity
            key={index}
            disabled={this.state.routeMode === index || !!this.state.error}
            activeOpacity={styles.all.activeOpacity}
            onPress={this.onRouteMode.bind(null, index)}
            style={new AlterStyles(styles.routeMode)
              .addProperty(
                'backgroundColor',
                this.state.routeMode === index,
                this.state.error ? styles.all.textColorDisabled : styles._routeModeText.color,
              )
              .build()}
          >
            <Image source={routeMode[(this.state.routeMode == index) | 0]} />
            <Text
              style={new AlterStyles(styles.routeModeText)
                .addProperty('color', this.state.routeMode === index, 'white')
                .build()}
            >
              {strings[routeMode[2][0]]}
            </Text>
          </TouchableOpacity>
        ));

        const routeMode = this.state.routeModes[this.state.routeMode];
        const noRouteDataNoError = !routeMode[3] && !this.state.error;

        view = (
          <View style={{ flex: 1, margin: 0 }}>
            <View style={{ margin: styles.all.marginPadding }}>
              <Menu onSelect={this.setJourneyType} renderer={JourneyTypesMenu}>
                <MenuTrigger>
                  <View style={styles.$container}>
                    <Text style={styles.typeText}>{this.state.journeyType.name}</Text>
                    {this.state.journeyTypes.length > 1 ? <View style={styles.triangle} /> : null}
                  </View>
                </MenuTrigger>
                <MenuOptions>{this.state.menuOptions}</MenuOptions>
              </Menu>
              <TextInput
                onSubmitEditing={Keyboard.dismiss}
                style={styles.reason}
                placeholder={strings.reason}
                placeholderTextColor={styles.all.textColorDisabled}
                underlineColorAndroid={'transparent'}
                maxLength={15}
                defaultValue={this.state.journey.reason}
                onChangeText={(text) => {
                  this.state.journey.reason = text;
                }}
              />
              <View style={styles.routeModes}>{routeModes}</View>
              {noRouteDataNoError ? (
                spinner
              ) : (
                <JourneyDetails
                  ref="journeyDetails"
                  error={this.state.error}
                  routeMode={routeMode[2][0]}
                  points={this.state.pointsToShow}
                  distance={routeMode[3] && routeMode[3].distance}
                  journeyType={this.state.journeyType}
                  duration={routeMode[3] && routeMode[3].duration}
                  notes={this.state.journey.notes}
                />
              )}
            </View>
            <View style={styles.all.bottomView}>
              {[
                this.state.journey.type ? strings.all.cancel : strings.discard,
                strings.all.finish,
              ].map((value, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                      styles.all.logoBlueButton.container,
                      {
                        flexDirection: "row",
                        height: 40,
                        marginLeft: 0,
                        backgroundColor:
                          index && noRouteDataNoError
                            ? styles.all.textColorDisabled
                            : styles.all.logoBlueButton.container
                                .backgroundColor
                      }
                    ]}
                  disabled={!!index && noRouteDataNoError}
                  activeOpacity={styles.all.activeOpacity}
                  onPress={this.onDone.bind(null, !!index)}
                >
                  <Text style={styles.all.logoBlueButton.text}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ position: 'absolute', width: 3, backgroundColor: '#41C5F4', height: 30, left: '50%', bottom: 5 }} />
          </View>
        );
      }
    }

    return (
      <View style={{ flex: 1 }}>
        <SceneTitle title={strings.title} />
        {view}
      </View>
    );
  }
}
