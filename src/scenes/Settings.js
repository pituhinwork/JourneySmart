import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  AsyncStorage
} from "react-native";

import { autobind } from 'core-decorators';
import GoogleSignIn from "react-native-google-sign-in";
import { EventRegister } from "react-native-event-listeners";
import { Switch as Swatch } from 'react-native-base-switch';
import { Preferences } from '../react-native-common-utils';
import {
  MaterialSwitch as Switch,
  ToggleButtons,
  TextToggleButton,
} from '../react-native-common-ui-components';
import SceneTitle from '../SceneTitle';
import TabButtons from '../TabButtons';
import BT from '../Bluetooth'
import selectBluetoothDevice from './SelectBluetoothDevice';
import BaseComponent from '../BaseComponent';
import GDrive from '../react-native-google-drive-api-wrapper';
import JourneySmart from '../JourneySmart';

const styles = require('../styles')('settings');
const strings = require('../strings')('settings');

/**
 * FastestShortestChanged.
 */
class FastestShortestChanged {
  constructor(settings) {
    this.settings = settings;

    this.prefs = [Preferences.routes.routeMode.fastest, Preferences.routes.routeMode.shortest];
  }

  onValueChanged(preference) {
    str = strings.noRouteMode;

    for (p of this.prefs) {
      if (p.getValue()) {
        str = null;
        break;
      }
    }

    if (str) {
      alert(str);
      this.settings.refs[preference.toString()].activate();
    }
  }
}

/**
 * Settings.
 */

export default class Settings extends React.Component {
  constructor(props) {
    super(props);
    
    this.prevUser = null;
    this.routesAvailable = [
      [
        require("../../img/routeModeShortest.png"),
        strings.shortest,
        Preferences.routes.routeMode.shortest
      ],
      [
        require("../../img/routeModeFastest.png"),
        strings.fastest,
        Preferences.routes.routeMode.fastest
      ],
      [
        require("../../img/routeModeActual.png"),
        strings.actual,
        Preferences.routes.routeMode.actual
      ]
    ];

    this.avoidRoutes = [
      [
        require("../../img/tolls.png"),
        strings.tolls,
        Preferences.routes.avoid.tolls
      ],
      [
        require("../../img/motorways.png"),
        strings.motorways,
        Preferences.routes.avoid.motorways
      ],
      [
        require("../../img/ferries.png"),
        strings.ferries,
        Preferences.routes.avoid.ferries
      ]
    ];

    this.periods = [
      [require("../../img/today.png"), strings.periods[0]],
      [require("../../img/thisWeek.png"), strings.periods[1]],
      [require("../../img/thisMonth.png"), strings.periods[2]]
    ];

    this.autostart = [[undefined, strings.autostart[1], Preferences.autostart]];
    this.commuting = [[undefined, strings.commuting[1], undefined]];

    this.startsStops = [
      [
        require("../../img/starts.png"),
        strings.starts,
        Preferences.journeyTrigger.bluetooth.start
      ],
      [
        require("../../img/stops.png"),
        strings.ends,
        Preferences.journeyTrigger.bluetooth.stop
      ]
    ];
    this.bluetoothTrig = [
      [
        require("../../img/starts.png"),
        strings.bluetoothTrigger,
        Preferences.journeyTrigger.bluetooth.used
      ]
    ];
    this.initialState = { autoStartEnabled: true };
    this.state = this.initialState;
    this.autoStartEnabled = true;
  }

  componentWillMount() {
    this.calc();
      
  }

  async calc() {
    let res = await AsyncStorage.getItem('autoStart');
    if (res === '1') {
      this.setState({ autoStartEnabled: true });
      this.autoStartEnabled = true;
    }
    else {
      this.setState({ autoStartEnabled: false });
      this.autoStartEnabled = false;
    }
    this.forceUpdate();
  }
    
  componentDidMount() {
    const fsc = new FastestShortestChanged(this);
    Preferences.routes.routeMode.fastest.addValueChangeListener(fsc);
    Preferences.routes.routeMode.shortest.addValueChangeListener(fsc);    
    
  }

  componentWillUnmount() {
    Preferences.routes.routeMode.fastest.clearValueChangeListeners();
    Preferences.routes.routeMode.shortest.clearValueChangeListeners();
    EventRegister.emit("storageChanged");
  }


  addListSection() {
    const bluetoothDisabled = !(
      Preferences.journeyTrigger.bluetooth.used.getValue() &&
      Preferences.journeyTrigger.bluetooth.used.bluetoothIsEnabled
    );
    return (
      <View>
        <TouchableOpacity
          activeOpacity={styles.all.activeOpacity}
          style={[
            styles.$switchEntry.container,
            {
              marginBottom: styles.$sectionContentMarginBottom,
              borderBottomLeftRadius: 5,
              borderBottomRightRadius: 5,
              backgroundColor: 'white',shadowOffset: {
                width: 0, height: 4 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'
            }
          ]}
          onPress={() => this.onView()}
        >
          <Text style={[styles.$switchEntry.text, {color: '#55606eff', marginLeft: 15, flex: 1}]}>
            Select Bluetooth Trigger Device
          </Text>
          <Text style={{color: '#55606eff', marginLeft: 15, fontSize: 15, alignContent: 'flex-end' }}>
            {Preferences.journeyTrigger.bluetooth.device.getValue()}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  onView() {
    this.props.nav.push({
      className: selectBluetoothDevice,
      [BaseComponent.SET_CHILD]: undefined,
      inputParams: {
      }
    });
  }

  addGoogleAccount() {
    return <View>
        <TouchableOpacity activeOpacity={styles.all.activeOpacity} style={[styles.all.logoBlueButton.container, { marginBottom: styles.$sectionContentMarginBottom, borderRadius: 5,shadowOffset: {
                width: 0, height: 4 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000' }]} onPress={() => this.onSelectGoogle()}>
          <Text style={styles.all.logoBlueButton.text}>
            Select google drive account
          </Text>
        </TouchableOpacity>
      </View>;
  }

  onSelectAuto(flag) {
    console.log('onSelectAuto');
    if (flag === false) {
      AsyncStorage.setItem("autoStart", "0");
      EventRegister.emit("storageChanged");
      this.setState({ autoStartEnabled: false });
      this.autoStartEnabled = false;
      console.log("0");
    } else {
      AsyncStorage.setItem("autoStart", "1");
      this.setState({ autoStartEnabled: true });
      this.autoStartEnabled = true;
      console.log("1");
    }
    
    this.forceUpdate();
  }

  async onSelectGoogle() {
     try {
         console.log("Google Sign in started");
          
          if ( Platform.OS === 'android') {
            await GoogleSignIn.configure({
            scopes: [
              'https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/drive.appfolder',
            ],
            clientID: '310933112450-4ionnp4em4okmeltnteji7gi0shn9vir.apps.googleusercontent.com',
          });
            GoogleSignIn.signOut();
            let error = null;
            try {
                JourneySmart.user = await GoogleSignIn.signInSilentlyPromise();
              } catch (e) {
                error = e;
              }
              console.log("Google Sign in signInSilentlyPromise");
              if (error) {
                  JourneySmart.user = await GoogleSignIn.signInPromise();
              }
              console.log("Google Sign in signInPromise");
              this.forceUpdate();
              console.log(JourneySmart.user);
              GDrive.setAccessToken(JourneySmart.user.accessToken);
          }
          else {
            await GoogleSignIn.configure({
            scopes: [
              'https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/drive.appfolder',
            ],
          });
          console.log('started');
            this.prevUser = GoogleSignIn.currentUser();
            if (this.prevUser['_40'] !== 0) {
              await GoogleSignIn.signOut();
              
            }
            let error = null;
            try {
              JourneySmart.user = await GoogleSignIn.signInSilentlyPromise();
            } catch (e) {
              error = e;
            }
            if (error) {
                JourneySmart.user = await GoogleSignIn.signInPromise();
            }
            this.forceUpdate();

            GDrive.setAccessToken(JourneySmart.user.accessToken);
            console.log(JourneySmart.user);
         }
        } catch (error) {
          console.log('Google sign in error', error);
        } finally {
          GDrive.init();
        }
  }

  addTitle(style, caption, addTopMargin) {
    return (
      <View
        style={[
          style.container,
          {
            marginTop: addTopMargin ? styles.all.marginPadding : 0
            ,shadowOffset: {
                width: 0, height: 4 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'
          }
        ]}
      >
        <Text style={style.text}>{caption}</Text>
      </View>
    );
  }

  addSwitchSection(caption, data ,flag) {
    const sw = styles.$switchEntry.$switch;
    let temp = data.length - 1;
    
    if (flag) {
      if (flag !== 1) {
        temp = -10;
      }
    }
    else {
      temp = -10;
    }
    return (
      <View>
        {caption ? this.addTitle(styles.$subsectionTitle, caption) : null}
        {data.map((entry, index) => (
          temp === index ? <View key={index} style={[styles.$switchEntry.container, {borderBottomLeftRadius: 5,
              borderBottomRightRadius: 5,shadowOffset: {
                width: 0, height: 4 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}]}>
            <Image style={styles.$switchEntry.image} source={entry[0]} />
            <Text
              style={[
                styles.$switchEntry.text,
                {
                  marginLeft: entry[0] ? 0 : styles.all.marginPadding
                }
              ]}
            >
              {entry[1]}
            </Text>
            {entry[2] ? (
              <Switch
                ref={entry[2].toString()}
                active={entry[2].getValue()}
                switchHeight={sw.height}
                buttonRadius={sw.buttonRadius}
                enableSlide={false}
                activeButtonColor={sw.activeButtonColor}
                activeButtonPressedColor={sw.activeButtonColor}
                inactiveButtonColor={sw.inactiveButtonColor}
                inactiveButtonPressedColor={sw.inactiveButtonColor}
                activeBackgroundColor={sw.activeBackgroundColor}
                inactiveBackgroundColor={sw.inactiveBackgroundColor}
                onChangeState={entry[2].setValue.bind(entry[2])}
              />
            ) : null}
          </View> : <View key={index} style={[styles.$switchEntry.container,{shadowOffset: {
                width: 0, height: 4 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}]}>
            <Image style={styles.$switchEntry.image} source={entry[0]} />
            <Text
              style={[
                styles.$switchEntry.text,
                {
                  marginLeft: entry[0] ? 0 : styles.all.marginPadding
                }
              ]}
            >
              {entry[1]}
            </Text>
            {entry[2] ? (
              <Switch
                ref={entry[2].toString()}
                active={entry[2].getValue()}
                switchHeight={sw.height}
                buttonRadius={sw.buttonRadius}
                enableSlide={false}
                activeButtonColor={sw.activeButtonColor}
                activeButtonPressedColor={sw.activeButtonColor}
                inactiveButtonColor={sw.inactiveButtonColor}
                inactiveButtonPressedColor={sw.inactiveButtonColor}
                activeBackgroundColor={sw.activeBackgroundColor}
                inactiveBackgroundColor={sw.inactiveBackgroundColor}
                onChangeState={entry[2].setValue.bind(entry[2])}
              />
            ) : null}
          </View>
          
        ))}
      </View>
    );
  }

  render() {
    const sw = styles.$switchEntry.$switch;
    console.log(this.state.autoStartEnabled);
    return <View style={{ flex: 1 }}>
        <SceneTitle title={strings.title} />
        <ScrollView style={{ flex: 1, margin: styles.all.marginPadding }} showsVerticalScrollIndicator={false}>
          {this.addTitle(styles.$sectionTitle, strings.routeOptions)}
          {this.addSwitchSection(strings.routesAvailable, this.routesAvailable)}
          {this.addSwitchSection(strings.avoidRoutes, this.avoidRoutes,1)}

          {/* {this.addTitle(styles.$sectionTitle, strings.defaultDashboard, true)}
          {this.addTitle(styles.$subsectionTitle, strings.displayStatisticsFor)}
          <TabButtons
            separatorWidth={5}
            initialIndex={Preferences.dashboard.index.getValue()}
            onPress={Preferences.dashboard.index.setValue}
            buttons={this.periods}
          /> */}

          {/* {this.addTitle(styles.$sectionTitle, strings.autostart[0], true)}
          {this.addSwitchSection(undefined, this.autostart, 1)} */}

          {/* {this.addTitle(styles.$sectionTitle, strings.commuting[0], true)}
          {this.addSwitchSection(undefined, this.commuting)} */}
          {/* <ToggleButtons initialIndex={Preferences.claimHomeOffice.getValue()} styles={{ container: { backgroundColor: "white" } }} onPress={Preferences.claimHomeOffice.setValue}>
            {[strings.all.YES, strings.all.NO].map((value, index) => (
              <TextToggleButton key={index} value={value} />
            ))}
          </ToggleButtons> */}
          <View >
            <View style={[styles.$sectionTitle.container, { marginTop: styles.all.marginPadding }]}>
              <Text style={styles.$sectionTitle.text}>Auto Record</Text>
            </View>
            <View key={0} style={[styles.$switchEntry.container, {borderBottomLeftRadius: 5,
              borderBottomRightRadius: 5,shadowOffset: {
                width: 0, height: 4 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}]}>
              <Text
                style={[
                  styles.$switchEntry.text,
                  { marginLeft: styles.all.marginPadding }
                ]}
              >
                Automatically start recording of journeys
              </Text>
              <Swatch 
                active={this.state.autoStartEnabled} 
                onActivate={() => this.onSelectAuto(true)} 
                onDeactivate={() => this.onSelectAuto(false)} 
                switchWidth={40}
                switchHeight={15}
                activeButtonColor="#0099cb" 
                inactiveButtonColor="#b1b7b7" 
                activeBackgroundColor="#55606e" 
                buttonRadius={9}
                inactiveBackgroundColor="#d3d3d3"  
              />
            </View>
          </View>
          {this.addTitle(styles.$sectionTitle, strings.journeyTriggers, true)}
          <View
            style={[
              styles.$subsectionTitle.container,
              {
                marginTop: 0,
                paddingRight: 10,
                flexDirection: 'row',
                shadowOffset: {
                width: 0, height: 4 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'
              }
            ]}
          >
            <Text style={[styles.$subsectionTitle.text,{flex: 1}]}>Bluetooth</Text>
            <Switch
                ref={Preferences.journeyTrigger.bluetooth.used.toString()}
                active={Preferences.journeyTrigger.bluetooth.used.getValue()}
                switchHeight={sw.height}
                buttonRadius={sw.buttonRadius}
                enableSlide={false}
                activeButtonColor={sw.activeButtonColor}
                activeButtonPressedColor={sw.activeButtonColor}
                inactiveButtonColor={sw.inactiveButtonColor}
                inactiveButtonPressedColor={sw.inactiveButtonColor}
                activeBackgroundColor={sw.activeBackgroundColor}
                inactiveBackgroundColor={sw.inactiveBackgroundColor}
                onChangeState={Preferences.journeyTrigger.bluetooth.used.setValue.bind(Preferences.journeyTrigger.bluetooth.used)}
              />
          </View>
          {/* {this.addSwitchSection(strings.bluetooth, this.bluetoothTrig, 2)} */}
          {this.addSwitchSection(null, this.startsStops)}
          {this.addListSection()}
          <View style={{ height: 10 }} />
          {this.addGoogleAccount()}
          <View style={{ height: 10 }} />
        </ScrollView>
      </View>;
  }
}
