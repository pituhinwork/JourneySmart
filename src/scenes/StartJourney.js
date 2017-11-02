import React from 'React';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  Vibration,
  Dimensions,
  AsyncStorage,
} from 'react-native';
import Spinner from 'react-native-spinkit';
import { autobind } from 'core-decorators';
// import { BackgroundTimer as timer } from "react-native-background-timer";
import timer from 'react-native-timer';
import BaseComponent from '../BaseComponent';
import { Preferences } from '../react-native-common-utils';
import SceneTitle from '../SceneTitle';
import JourneyPoint from '../JourneyPoint';
import DB from '../DB';
import { EventRegister } from 'react-native-event-listeners';
import AddExpense from './AddExpense';

const styles = require('../styles')('startJourney');
const strings = require('../strings')('startJourney');

/**
 * Point.
 */
class Point extends React.Component {
  constructor(props) {
    super(props, 'StartJourney');

    this.content = [];
  }

  add(...styles) {
    this.content.push(<View key={this.content.length} style={styles} />);
  }

  render() {
    this.content = [];

    if (this.props.first) {
      this.add(styles.pointContainerCircle, {
        marginTop: styles._pointContainerLine.height,
      });

      if (!this.props.last) {
        this.add(styles.pointContainerLine);
      }
    } else if (this.props.last) {
      this.add(styles.pointContainerLine);
      this.add(styles.pointContainerCircle);
    } else {
      this.add(styles.pointContainerLine);
      this.add(styles.pointContainerCircle);
      this.add(styles.pointContainerLine);
    }

    return (
      <View style={styles.pointContainer}>
        <View style={styles.pointContainerShape}>{this.content}</View>
        <Text style={styles.pointContainerTime}>{this.props.data.getTimestamp()}</Text>
        <Text style={styles.pointContainerAddress}>{this.props.data.getAddress()}</Text>
      </View>
    );
  }
}

/**
 * Separator.
 */
class Separator extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View>
        <View style={styles.separatorLine} />
      </View>
    );
  }
}

/**
 * StartJourney.
 */
@autobind
export default class StartJourney extends BaseComponent {
  static errors = {
    1: 'PERMISSION_DENIED',
    2: 'POSITION_UNAVAILABLE',
    3: strings.errors.timeout,
    'No available location provider.': strings.errors.noProvider,
    'TypeError: Network request failed': strings.errors.offline,
    actualRouteModeUsedDisabled: strings.errors.actualRouteModeUsedDisabled,
    reverseGeocodeZeroResults: strings.errors.reverseGeocodeZeroResults,
  };

  constructor(props) {
    super(props, 'StartJourney');

    this.state = {
      points: [],
      autoStartEnabled: false,
      journeyStarted: false,
    };
  }

  async calc() {
    let res = await AsyncStorage.getItem('autoStart');
    this.setState({ autoStartEnabled: res === '1' });
    res = await AsyncStorage.getItem('journeyStarted');
    this.setState({ journeyStarted: res === '1' });
  }

  async componentWillMount() {
    super.componentWillMount();
    this.calc();
    if (
      Preferences.currentJourney.rowid.getValue() &&
      Preferences.currentJourney.rowid.getValue() > 3
    ) {
      this.cancelRequested = true;
      this.props.nav.pop();
      AsyncStorage.setItem('journeyStarted', '0');
      EventRegister.emit("storageChanged");
    }
    if (Preferences.currentJourney.rowid.getValue()) {
      console.log('11');
      this.state.points = await DB.loadCurrentJourneyPoints();
      console.log(this.state.points);
      console.log('12');
      if (this.parent.isFinishRequested()) {
        this.getPosition();
      } else {
        this.forceUpdate();
      }
      console.log('13');
      if (this.props.route.inputParams) {
        this.onNotificationAction(this.props.route.inputParams);
      }
    } else if (await DB.startJourney()) {
      console.log('start Journey endsasdf');
      this.parent.resetFinishRequested();
      this.parent.setAllowJourneyStartedIcon(true);
      this.getPosition();
    }
    this.setupsListener = EventRegister.addEventListener('endJourney', () => {
      console.log('end journey entered');
      timer.setInterval(
        this,
        'calDistaance',
        () => {
          this.calc();
        },
        2000,
      );
      console.log(this.state.journeyStarted, this.state.autoStartEnabled);
      if (this.state.journeyStarted === true && this.state.autoStartEnabled === true) {
        this.setState({ journeyStarted: false });
        AsyncStorage.setItem('journeyStarted', '0');
        EventRegister.emit("storageChanged");
        timer.clearInterval(this); // clears all intervals for a context
        console.log('ended');
        this.handleEndEvent();
      }
    });
  }

  async componentWillUnmount() {
    if (
      this.cancelRequested ||
      (this.state.points[0] && this.state.points[0].getLatitude() === undefined)
    ) {
      this.parent.forbidCurrentRequest();
      this.parent.setAllowJourneyStartedIcon(false);
      this.parent.forceUpdate();
      await DB.cancelJourney();
      AsyncStorage.setItem("journeyStarted", "0");
      EventRegister.emit("storageChanged");
    }
    EventRegister.removeEventListener(this.setupsListener);

    super.componentWillUnmount();
  }

  handleEndEvent() {
    this.onPress(2);
  }

  getPosition(forbidCurrentRequest = true) {
    const now = new Date();

    this.state.points.push(
      new JourneyPoint({
        millis: now.getTime(),
        tzOffsetMillis: now.getTimezoneOffset() * 60 * 1000,
      }),
    );

    this.forceUpdate();

    forbidCurrentRequest && this.parent.forbidCurrentRequest();
    this.parent.getPosition();
  }

  onNotificationAction(data) {
    if (data.action.valueOf() != 'content') {
      const isFinish = data.action.valueOf() == 'finish';

      if (!this.isFinishDisabled() && (isFinish || this.state.points.length < 3)) {
        if (isFinish) {
          Vibration.vibrate(600, false);
          this.parent.requestFinish();
          this.getPosition();
        } else if (!DB.isActualRouteModeUsed()) {
          this.getPosition();
        } else {
          Alert.alert(strings.all.appName, strings.prompts.deleteBreadcrumbs, [
            {
              text: strings.all.OK,
              onPress: async () => {
                this.parent.forbidCurrentRequest();
                (await DB.deleteCurrentJourneyBreadcrumbs()) && this.getPosition(false);
              },
            },
          ]);
        }
      }
    }
  }

  async processPoint(point) {
    this.state.points[this.state.points.length - 1] = point;

    this.clearError();
  }

  clearError() {
    this.setState({ error: null });
  }

  processError(error) {
    for (const parsed of [
      StartJourney.errors[error],
      StartJourney.errors[error.code],
      error.message,
      JSON.stringify(error),
    ]) {
      if ((this.state.error = parsed)) {
        break;
      }
    }

    this.forceUpdate();
  }

  onPress(index) {
    switch (index) {
      case 0:
        Alert.alert(strings.all.appName, strings.prompts.cancelJourney, [
          {
            text: strings.all.OK,
            onPress: async () => {
              this.cancelRequested = true;
              this.props.nav.pop();
              
            },
          },
        ]);
        break;
      case 3:
        this.parent.showAddExpense();
        this.props.nav.pop();
        AsyncStorage.setItem('journeyStarted', '0');
        EventRegister.emit("storageChanged");
        break;
      case 1:
        if (!DB.isActualRouteModeUsed()) {
          this.getPosition();
        } else {
          Alert.alert(strings.all.appName, strings.prompts.deleteBreadcrumbs, [
            {
              text: strings.all.OK,
              onPress: async () => {
                this.parent.forbidCurrentRequest();
                (await DB.deleteCurrentJourneyBreadcrumbs()) && this.getPosition(false);
              },
            },
          ]);
        }
        break;
      case 2:
        Vibration.vibrate(600, false);

        Alert.alert(strings.all.appName, strings.prompts.finishJourney, [
          {
            text: strings.all.OK,
            onPress: () => {
              this.parent.requestFinish();
              this.getPosition();
              AsyncStorage.setItem('journeyStarted', '0');
              EventRegister.emit("storageChanged");
            },
          },
          {
            text: "Cancel",
            onPress: () => {
              AsyncStorage.setItem('journeyStarted', '1');
              EventRegister.emit("storageChanged");
            },
          },
        ]);

        break;
    }
  }

  isFinishDisabled() {
    return (
      this.parent.isFinishRequested() ||
      !this.state.points.length ||
      this.state.points[this.state.points.length - 1].getLatitude() == undefined
    );
  }

  render() {
    const finishDisabled = this.isFinishDisabled();

    return (
      <View style={{ flex: 1 }}>
        <SceneTitle title={strings.title} />
        {this.state.error ? <Text style={styles.error}>{this.state.error}</Text> : null}
        <View style={{ flex: 1, margin: 0 }}>
          <View style={{ margin: styles.all.marginPadding }}>
            {this.state.points.map((point, index, array) => {
              const pt = (
                <Point
                  key={index}
                  first={index == 0}
                  last={index == array.length - 1}
                  data={point}
                />
              );

              return index == 0 ? (
                pt
              ) : (
                <View key={index}>
                  <Separator />
                  {pt}
                </View>
              );
            })}
            <Spinner
              style={styles.$spinner.style}
              size={styles.$spinner.size}
              type={styles.$spinner.type}
              color={styles.$spinner.color}
            />
          </View>
          <View style={[styles.all.bottomView, { flexDirection: 'column' }]}>
            <TouchableOpacity
              disabled={
                !Preferences.currentJourney.rowid.getValue() // = We get to JourneySummary on finish anyway... = //
              }
              onPress={this.onPress.bind(null, 0)}
              style={styles.cancelJourneyContainer}
              activeOpacity={styles.all.activeOpacity}
            >
              <Image source={require('../../img/cancelJourney.png')} />
              <Text style={styles.cancelJourneyText}>{strings.cancelJourney}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              {[
                [strings.addWaypoint, this.state.points.length == 3],
                [strings.all.finish],
              ].map((value, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={styles.all.activeOpacity}
                  disabled={finishDisabled || value[1]}
                  onPress={
                    index === 1 ? this.onPress.bind(null, 2) : this.onPress.bind(null, 1)
                  }
                  style={[
                    styles.all.logoBlueButton.container,
                    {
                      flexDirection: 'row',
                      height: 40,
                      marginLeft: 0,
                      backgroundColor:
                        finishDisabled || value[1]
                          ? styles.all.textColorDisabled
                          : styles.all.logoBlueButton.container.backgroundColor,
                    },
                  ]}
                >
                  <Text
                    style={{
                      ...styles.all.logoBlueButton.text,
                      fontSize: 13,
                    }}
                  >
                    {value[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View
              style={{
                position: 'absolute',
                width: 3,
                backgroundColor: '#41C5F4',
                height: 30,
                left: '50%',
                bottom: 5,
              }}
            />
          </View>
        </View>
      </View>
    );
  }
}
