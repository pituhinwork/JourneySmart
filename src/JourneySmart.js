/**
 * @flow
 */

import React from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  BackHandler,
  Alert,
  TouchableWithoutFeedback,
  AsyncStorage,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import wtf8 from 'wtf-8';
import RNFS from "react-native-fs";
import timer from "react-native-background-timer";
//import timer from "react-native-timer";
import Navigator from './react-native-deprecated-custom-components/src/Navigator';
import Drawer from 'react-native-drawer';
import Menu, { MenuContext, MenuTrigger } from 'react-native-popup-menu';
import GoogleSignIn from 'react-native-google-sign-in';
import base64 from "base64-js";
var Buffer = require("buffer/").Buffer;
import { autobind } from 'core-decorators';
import { EventRegister } from "react-native-event-listeners";
import GDrive from './react-native-google-drive-api-wrapper';
import { purchase } from './Billing';
import {
  Preferences,
  SwitchPreference,
  NumberPreference,
  ShareData,
  GetPath,
} from './react-native-common-utils';
import geolib from 'geolib';
import DB from './DB';
import BT from './Bluetooth';
import BaseComponent from './BaseComponent';
import StaticUtils from './StaticUtils';
import BluetoothDevicePreference from './preferences/BluetoothDevicePreference';
import Main from './scenes/Main';
import ViewJourneys from './scenes/ViewJourneys';
import Lists from './scenes/lists/Lists';
import Settings from './scenes/Settings';
import Help from './scenes/Help';
import SetupComponent from './scenes/Setup';

const strings = require('./strings')('journeySmart');
const styles = require('./styles')('journeySmart');

// switch (strings.all.getLanguage()) {
//   case 'ru':
//     require('moment/locale/ru');
//     break;

//   default:
//     console.log(`strings.all.getLanguage(): ${strings.all.getLanguage()}`);
//     break;
// }

/**
 * DrawerButton.
 */
class DrawerButton extends React.Component {
  render() {
    return (
      <TouchableOpacity
        style={styles.headerDrawerButton}
        onPress={this.props.action}
        activeOpacity={1}
      >
        <Image source={this.props.imgSource} />
      </TouchableOpacity>
    );
  }
}

DrawerButton.propTypes = {
  imgSource: PropTypes.number.isRequired,
  action: PropTypes.func.isRequired,
};

/**
 * DrawerActions.
 */
class DrawerActions extends React.Component {
  constructor(props) {
    super(props);

    const data = [
      [Main, require('../img/home.png')],
      [ViewJourneys, require('../img/viewJourneys.png')],
      [Lists, require('../img/types.png')],
      [Settings, require('../img/settings.png')],
      [null, require('../img/exit.png')],
    ];

    this.actions = strings.drawerActions.map((action, index) => (
      <TouchableOpacity
        key={index}
        style={styles.drawerAction}
        onPress={this.props.action.bind(null, data[index][0])}
      >
        <Image source={data[index][1]} style={{ marginHorizontal: styles.all.marginPadding }} />
        <Text style={styles.drawerActionText}>{action}</Text>
      </TouchableOpacity>
    ));
  }

  render() {
    return <View style={styles.drawerActions}>
        <View style={styles.drawerActions}>{this.actions}</View>
        <View style={{ flex: 1 }} />
      </View>;
  }
}

DrawerActions.propTypes = {
  action: PropTypes.func.isRequired,
};

/**
 * JourneySmart.
 */
@autobind
export default class JourneySmart extends BaseComponent {
  constructor(props) {
    super(props, 'JourneySmart');

    this.state = {
      setuped: false,
      imageClose: false,
      downloaded: false,
      distanceCalc: 0,
    };
    JourneySmart.user = null;
    JourneySmart.prevPosition = null;
    JourneySmart.journeyState = 0;
    this.user = null;
    this.prevPosition = null;
    this.journeyState = 0;
    this.calDistanceID = null;
  }

  async componentDidMount() {
    JourneySmart.user = null;

    BT.setLaunchApp(false);

    BackHandler.addEventListener('hardwareBackPress', this.onBack);

    Preferences.safeAddPreference(NumberPreference, 'dashboard.index', 0);
    Preferences.safeAddPreference(SwitchPreference, 'autostart', false);
    Preferences.safeAddPreference(NumberPreference, 'claimHomeOffice', 1);

    Preferences.safeAddPreference(SwitchPreference, 'routes.routeMode.actual', false);

    Preferences.safeAddPreference(SwitchPreference, 'routes.routeMode.fastest', true);

    Preferences.safeAddPreference(SwitchPreference, 'routes.routeMode.shortest', true);

    Preferences.safeAddPreference(SwitchPreference, 'routes.avoid.tolls', false);

    Preferences.safeAddPreference(SwitchPreference, 'routes.avoid.motorways', false);

    Preferences.safeAddPreference(SwitchPreference, 'routes.avoid.ferries', false);

    Preferences.safeAddPreference(NumberPreference, 'routes.geolocation.timeout', 15000);

    Preferences.safeAddPreference(NumberPreference, 'routes.geolocation.maximumAge', 10000);

    Preferences.safeAddPreference(SwitchPreference, 'journeyTrigger.bluetooth.used', true);

    Preferences.safeAddPreference(SwitchPreference, 'journeyTrigger.bluetooth.start', true);

    Preferences.safeAddPreference(SwitchPreference, 'journeyTrigger.bluetooth.stop', true);

    Preferences.safeAddPreference(
      BluetoothDevicePreference,
      'journeyTrigger.bluetooth.device',
      '',
      TouchableOpacity,
    );

    Preferences.safeAddPreference(SwitchPreference, 'defaultDashboard.today', true);

    Preferences.safeAddPreference(SwitchPreference, 'defaultDashboard.thisWeek', true);

    Preferences.safeAddPreference(SwitchPreference, 'defaultDashboard.thisMonth', true);

    Preferences.safeAddPreference(NumberPreference, 'currentJourney.rowid');

    Preferences.safeAddPreference(NumberPreference, 'currentJourney.firstPointRowid');

    const length = await Preferences.load();

    Preferences.journeyTrigger.bluetooth.used.bluetoothIsEnabled = await BT.isEnabled();

    BT.addStateChangedListener(this.onStateChanged);

    if (Preferences.currentJourney.rowid.getValue()) {
      BT.showJourneyInProgressNotification();
    }
   
    console.log(`${length + 1} preferences loaded.`);
    navigator.geolocation.getCurrentPosition(
      function(position) {
        JourneySmart.prevPosition = position.coords;
      },
      function() {
        //alert("Position could not be determined.");
      },
      {
        enableHighAccuracy: true
      }
    );
    AsyncStorage.setItem("journeyStarted", "0");
  }

  async handleEvent() {
    if (this.state.setuped === true ) {
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
            let error = null;
            try {
                JourneySmart.user = await GoogleSignIn.signInSilentlyPromise();
              } catch (e) {
                error = e;
              }
              if (error) {
                  JourneySmart.user = await GoogleSignIn.signInPromise();
              }
              GDrive.setAccessToken(JourneySmart.user.accessToken);
          }
          else {
            await GoogleSignIn.configure({
            scopes: [
              'https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/drive.appfolder',
            ],
          });
            this.prevUser = GoogleSignIn.currentUser();
            console.log("1111111", this.prevUser);
            if (this.prevUser['_40'] === 0) {
              let error = null;
              try {
                JourneySmart.user = await GoogleSignIn.signInSilentlyPromise();
              } catch (e) {
                error = e;
              }
              console.log("2222222", error);
              if (error) {
                  JourneySmart.user = await GoogleSignIn.signInPromise();
              }
              this.forceUpdate();
              console.log("3333333", JourneySmart.user);
              GDrive.setAccessToken(JourneySmart.user.accessToken);
            }
            else {
              JourneySmart.user = this.prevUser;
            }
            console.log(JourneySmart.user);
         }
        } catch (error) {

        } finally {
          GDrive.init();
          this.setState({downloaded: true});
        }
    }
    this.setState({
       setuped: true
     });
  
    AsyncStorage.setItem('setuped', '1');
    
      const fileName = `${strings.all.appName}.sqlite`;
      console.log('11111',fileName);
      let path;
      if (Platform.OS === 'android') {
        path = await GetPath.get({
          pathType: 'DB',
          fileName,
        });
      }
      else {
        path = `${RNFS.MainBundlePath}/JourneySmart.sqlite`;
      }
      console.log("33333", path);
      const scheme = "file://";

      if (!path.startsWith(scheme) && Platform.OS === 'android') {
        path = scheme + path;
      }
      const resultes = await GDrive.files.list({ q: `name contains 'JourneySmart.sqlite'` });
      if (resultes.length < 1) {
        await DB.init();
        
      }
      else {
        let tempResult = (await resultes.json()).files;
        if (tempResult.length < 1) {
          await DB.init();
        }
        else {
            console.log("handle event", tempResult);
          const id = tempResult[0].id;
          if (await RNFS.exists(path)) {
            let dbData = await RNFS.readFile(
                path,
                'base64');
            if (dbData.length > 0) {
              if (id) {
                await GDrive.files.delete(id);
              }
            }
            // var base64Data = `data:application/x-sqlite3;base64,` + dbData;
            // var imageBuffer = this.decodeBase64Image(base64Data);
            // console.log(imageBuffer);
            const dicID = await StaticUtils.getExpenseImageFolderId();
            result = await GDrive.files.createFileMultipart(
                  dbData,
                  'application/x-sqlite3', {
                    parents: [dicID],
                    name: `${fileName}`
                  });
          }
          
        await DB.init();
      }
    }
    let expenseTypes = await DB.getExpenseTypes();

    if (!expenseTypes.length) {
      await DB.addUpdateExpenseType({type: 'Personal', code: '000000'});
    }
    
    this.calDistanceID = timer.setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          function(position) {
            EventRegister.emit("storageChanged");
            if (
              JourneySmart.prevPosition === null ||
              JourneySmart.prevPosition === undefined
            ) {
              JourneySmart.prevPosition = position.coords;
            } else if (
              geolib.getDistance(
                position.coords,
                JourneySmart.prevPosition
              ) >= 100
            ) {
              JourneySmart.prevPosition = position.coords;
              EventRegister.emit("startJourney");
            } else if (
              geolib.getDistance(
                position.coords,
                JourneySmart.prevPosition
              ) < 50
            ) {
              JourneySmart.prevPosition = position.coords;
              EventRegister.emit("endJourney");
            }
          },
          function() {
            //alert("Position could not be determined.");
          },
          {
            enableHighAccuracy: true
          }
        );
      }, 30000);
  }

  componentWillMount(){
    this.setupListener = EventRegister.addEventListener("toMain", () => {
     this.handleEvent();
    });

    AsyncStorage.getItem('setuped').then(res => {
      this.setState({setuped: (res === '1'?true:false)});
      if (res === '1') {
        this.handleEvent();
      }}).catch(err => {});
    }

  componentWillUnmount() {
    super.componentWillUnmount();

    ShareData.deleteTempFiles();

    BackHandler.removeEventListener('hardwareBackPress', this.onBack);

    BT.setLaunchApp(true);

    BT.removeStateChangedListener(this.onStateChanged);

    DB.uninit();
    timer.clearInterval(this.calDistanceID);
    EventRegister.removeEventListener( this.setupListener );
  }

  onStateChanged(state) {
    Preferences.journeyTrigger.bluetooth.used.bluetoothIsEnabled = state.enabled;
  }

  safeExitApp() {
    const promptFinish = Preferences.currentJourney.rowid.getValue() && DB.isActualRouteModeUsed();

    if (promptFinish) {
      Alert.alert(strings.all.appName, strings.all.startJourney.prompts.finishJourney, [
        {
          text: strings.all.OK,
          onPress: () => {
            this.child.requestFinish();
          },
        },
      ]);
    }

    return promptFinish;
  }

  onBack() {
    const drawer = this.refs.drawer;
    
    return drawer._open
      ? (drawer.close(), true)
      : this.refs.nav.getCurrentRoutes().length > 1
        ? (this.refs.nav.pop(), true)
        : this.safeExitApp();
  }

  async onDrawerAction(drawerAction) {
    this.refs.drawer.close();

    if (drawerAction == null) {
      if (!this.safeExitApp()) {
        BackHandler.exitApp();
      }
    } else {
      const routes = this.refs.nav.getCurrentRoutes();

      if (drawerAction == Main) {
        if (routes.length > 1) {
          this.refs.nav.resetTo(routes[0]);
        }
      } else {
        const route = { className: drawerAction };

        switch (routes.length) {
          case 1:
            this.refs.nav.push(route);
            break;

          case 2:
            if (routes[1].className != route.className) {
              this.refs.nav.replace(route);
            }
            break;

          default: {
            const index = routes.findIndex((element) => element.className == route.className);

            index != -1
              ? this.refs.nav.popToRoute(routes[index])
              : this.refs.nav.immediatelyResetRouteStack([routes[0], route]);

            break;
          }
        }
      }
    }
  }

  renderDrawer() {
    console.log('---render Drawer----');
    console.log(JourneySmart.user);
    return (
      <View style={{ flex: 1 }}>
        
        <Image
          resizeMode="stretch"
          source={require('../img/drawerPhoto.jpeg')}
          style={styles.drawerPhoto}
        >
          <DrawerButton imgSource={require('../img/drawerClose.png')} action={this.toggleDrawer} />
          {JourneySmart.user === null || JourneySmart.user === undefined ? null : (
            <View style={{ flexDirection: 'column', flex: 1 }}>
              <View style={{ flex: 2 }}>
                {
                  (JourneySmart.user.photoUrlTiny === null && JourneySmart.user.photoUrl320 === null) ?  <Image source={require('../img/profileSample.png')} 
                  style={{ alignSelf: "center", width: 80, height:80, marginTop: 20, borderRadius: 40,shadowOffset: {
                width: 0, height: 0 }, shadowRadius: 40, shadowOpacity: 0.5,shadowColor: '#000'}}/> 
                  : <Image source={{uri:`${Platform.OS === 'android' ? JourneySmart.user.photoUrlTiny : JourneySmart.user.photoUrl320}`}} 
                  style={{ alignSelf: "center", width: 80, height:80, marginTop: 20, borderRadius: 40,shadowOffset: {
                width: 0, height: 0 }, shadowRadius: 40, shadowOpacity: 0.5,shadowColor: '#000'}}/>
                }
                
              </View> 
              <View style={{ flex: 1 }}>
                <Text style={[styles.$signInInfo.text, { backgroundColor: "#00000000" }]}>{strings.signedInAs}</Text>
                <View style={styles.$signInInfo.container}>
                  <Text style={[styles.$signInInfo.text, {backgroundColor: '#00000000'}]}>{JourneySmart.user.email}</Text>
                  <Image style={styles.$signInInfo.image} source={require('../img/google.png')} />
                </View>
              </View>
            </View>
          ) }
        </Image>
        <DrawerActions action={this.onDrawerAction} />
      </View>
    );
  }

  toggleDrawer() {
    const drawer = this.refs.drawer;

    if (drawer._open) {
      drawer.close();
      return;
    }
    if (this.refs.nav.getCurrentRoutes().length > 1) {
      if (this.refs.nav.getCurrentRoutes().length === 2 && this.refs.nav.getCurrentRoutes()[1].className === ViewJourneys) {
        drawer.open();
      }
      else if (this.refs.nav.getCurrentRoutes().length === 2 && this.refs.nav.getCurrentRoutes()[1].className === Lists) {
        drawer.open();
      } 
      else if (this.refs.nav.getCurrentRoutes().length === 2 && this.refs.nav.getCurrentRoutes()[1].className === Settings) {
        drawer.open();
      } 
      else if (this.refs.nav.getCurrentRoutes().length === 2 && this.refs.nav.getCurrentRoutes()[1].className === Help) {
        drawer.open();
      }else {
        this.refs.nav.pop();
      }
    }
    else {
      drawer.open();
    }
    if (this.refs.nav.getCurrentRoutes().length > 3) {
      this.setState({ imageClose: true }); 
    }
    if ( this.refs.nav.getCurrentRoutes().length < 3 ) {
        this.setState({ imageClose: false });
    }
    if (this.refs.nav.getCurrentRoutes().length === 3) {
      if ( this.refs.nav.getCurrentRoutes()[1].className === ViewJourneys 
        || this.refs.nav.getCurrentRoutes()[1].className === Lists
        || this.refs.nav.getCurrentRoutes()[1].className === Settings
        || this.refs.nav.getCurrentRoutes()[1].className === Help){
        this.setState({ imageClose: false });
      }
      else {
        this.setState({ imageClose: true });
      }
    }
//    (drawer._open ? drawer.close : drawer.open)();
  }

  decodeBase64Image(dataString) 
  {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var response = {};
    if (matches.length !== 3) 
    {
      return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = Buffer.from(matches[2], 'base64');

    return response;
  }

  async onHiddenMenuItem(item) {
//    try {
      const fileName = `${strings.all.appName}.sqlite`;
      let path;
      if (Platform.OS === 'android') {
        path = await GetPath.get({
          pathType: 'DB',
          fileName,
        });
      }
      else {
        path = `${RNFS.MainBundlePath}/JourneySmart.sqlite`;
      }
      switch (item) {
        case 'exportDB':
          const scheme = "file://";

          if (!path.startsWith(scheme) && Platform.OS === 'android') {
            path = scheme + path;
          }
          console.log(path);
          const resultes = await GDrive.files.list({ q: `name contains 'JourneySmart.sqlite'` });
          if ((await resultes.json()).files.length !== 0) {
            const id =  ((await resultes.json()).files)[0].id;
            if (id) {
              await GDrive.files.delete(id);
            }
          }
          

          let dbData = await RNFS.readFile(
              path,
              'base64');
          // var base64Data = `data:application/x-sqlite3;base64,` + dbData;
          // var imageBuffer = this.decodeBase64Image(base64Data);
          // console.log(imageBuffer);
          const dicID = await StaticUtils.getExpenseImageFolderId();
          result = await GDrive.files.createFileMultipart(
                dbData,
                'application/x-sqlite3', {
                  parents: [dicID],
                  name: `${fileName}`
                });
          console.log(result);
          // await ShareData.send({
          //   subject: `${strings.all.appName} DB`,
          //   attachments: [
          //     {
          //       fileName,
          //       path,
          //     },
          //   ],
          // });

          break;

        case 'importDB':
          await DB.uninit();
          
          try {
            const resultes = await GDrive.files.list({ q: `name contains 'JourneySmart.sqlite'` });
 //           const id = await GDrive.files.getId(fileName, ['root'],'application/x-sqlite3');
            if (resultes.length === 0) {
              return;
            }
            const id =  ((await resultes.json()).files)[0].id;
            console.log(id);
            if (!id) {
              const result = await GDrive.files.list({ q: `name contains 'JourneySmart.sqlite'` });
              if (!result.ok) {
                throw result;
              }
              throw `Nothing to import. GDrive root contents:\n\n${(await result.json()).files
                .map((file) => file.name)
                .reduce((previous, current) => {
                  if (previous) {
                    previous += '\n';
                  }
                  console.log("ddd");
                  return previous + current;
                }, '')}`;
            }
            const scheme = "file://";

            if (!path.startsWith(scheme) && Platform.OS === 'android') {
              path = scheme + path;
            }
            //await RNFS.unlink(path);
            // await RNFS.writeFile(
            //   path,
            //   'AA',
            //   'base64');
//            let data = (await GDrive.files.get(id));
            await (await GDrive.files.download(id, {
              toFile: path,encoding: 'base64'
            })).promise;
            let dbData = await RNFS.readFile(
              path,
              'base64');
            // await RNFS.writeFile(
            //   path,
            //   image.data,
            //   'base64');
            var Base64={
              _keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}
            };
            await RNFS.writeFile(
              path,
              Base64.decode(dbData),
              'base64');
          } finally {
            await DB.init();
          }
          break;
      }
    // } catch (error) {
    //   alert(error.constructor == String ? error : JSON.stringify(error));
    // }
  }

  changeSceneNav(route) {
    if (route.className) {
      if ( route.className === ViewJourneys 
        || route.className === Lists
        || route.className === Settings
        || route.className === Main
        || route.className === Help){
        this.setState({ imageClose: false });
      }
      else {
        this.setState({ imageClose: true });
      }
    }
  }

  renderScene(route) {
    return React.createElement(route.className, {
      nav: this.refs.nav,
      route,
    });
  }

  onWillFocus(route) {
    this.changeSceneNav(route);
  }

  onDidFocus(route) {
    
    this.setState({ headerMenuData: route.headerMenuData });
  }

  render() {
    return (
      <Drawer
        ref="drawer"
        content={this.renderDrawer()}
        type={styles.$drawer.type}
        openDrawerOffset={1 - styles.$drawer.width}
        panOpenMask={styles.$drawer.panOpenMask}
        panCloseMask={styles.$drawer.panCloseMask}
        styles={{
          mainOverlay: {
            opacity: 0,
            backgroundColor: styles.$drawer.darkeningColor,
          },
        }}
        tweenHandler={(ratio) => ({ mainOverlay: { opacity: ratio } })}
      >
        <MenuContext style={{ flex: 1 }}>
          {
            this.state.setuped === false?
            null:
          <View style={styles.header}>
            <DrawerButton
              imgSource={ this.state.imageClose === false ? require('../img/drawerOpen.png') : require('../img/drawerClose.png') }
              action={this.toggleDrawer}
              style={{ marginTop: 20 }}
            />

            {this.state.headerMenuData ? (
              <Menu onSelect={this.state.headerMenuData.onSelect} style={styles.headerMenu}>
                <MenuTrigger>
                  <Image source={require('../img/menu.png')} />
                </MenuTrigger>
                {StaticUtils.parseMenuOptions(
                  this.state.headerMenuData.options,
                  styles.all.menuOption,
                )}
              </Menu>
            ) : null}

            <Menu ref={'hiddenMenu'} onSelect={this.onHiddenMenuItem}>
              <MenuTrigger />
              {StaticUtils.parseMenuOptions(strings.hiddenOptions, styles.all.menuOption)}
            </Menu>

            <View style={styles.headerImageAndText}>
              <TouchableWithoutFeedback onLongPress={() => this.refs.hiddenMenu.open()}>
                <Image source={require('../img/js.png')} />
              </TouchableWithoutFeedback>
              <Text style={styles.headerText}>{strings.all.appName}</Text>
            </View>
          </View>
          }
          {
            this.state.setuped === false?
            <SetupComponent/>
            :
            <Navigator
              ref="nav"
              style={styles.navigator}
              initialRoute={{
                className: Main,
                [BaseComponent.SET_CHILD]: this.setChild,
              }}
              configureScene={() => Navigator.SceneConfigs.FadeAndroid}
              renderScene={this.renderScene}
              onDidFocus={this.onDidFocus}
              onWillFocus={this.onWillFocus}
            />
          }

          
        </MenuContext>
      </Drawer>
    );
  }
}
