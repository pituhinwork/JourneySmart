import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, TextInput, AsyncStorage, Platform } from "react-native";
//import PageControl from "react-native-page-control";
import RNFS from "react-native-fs";
import ModalDropdown from 'react-native-modal-dropdown';
import { Pages } from 'react-native-pages';
import DB from "../DB";

import timer from 'react-native-timer';
import GoogleSignIn from 'react-native-google-sign-in';
import JourneySmart from '../JourneySmart';
import Main from './Main';
import { EventRegister } from "react-native-event-listeners";
import {
  GetPath
} from "../react-native-common-utils";
import GDrive from "../react-native-google-drive-api-wrapper";
const strings = require('../strings')('journeySmart');
export default class SetupComponent extends React.Component {
  constructor(props) {
    super(props);
    this.initialState = {
      currentPage: 0,
      mile: '0',
      currency: '',
      unit: 'miles',
      splash: 0,
      text: 'Personal',
      signedIn: 0,
      dataEnabled: false,
      dataTime: '',
    };
    this.state = this.initialState;
  }
  componentDidMount() {
    timer.setTimeout(
      this,
      'hideMsg',
      () => {
        this.finishSplash();
      },
      2000,
    );
  }

  finishSplash() {
    this.setState({ splash: 1 });
  }
 
  componentWillUnmount() {
    timer.clearTimeout(this);
  }

  async dataBackUp()  {
    await DB.uninit();
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
            if (this.prevUser['_40'] === 0) {
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
            }
            else {
              JourneySmart.user = this.prevUser;
            }
         }
         
        } catch (error) {
          console.log('Google sign in error', error);
        } finally {
          GDrive.init();
          const resultes = await GDrive.files.list({ q: `name contains 'JourneySmart.sqlite'` });
    //           const id = await GDrive.files.getId(fileName, ['root'],'application/x-sqlite3');
          let tempData = (await resultes.json()).files;
          console.log("66666666", tempData);
          this.setState({ signedIn: true });
          if (tempData.length === 0) {
            
            return;
          }
          this.setState({dataEnabled: true, dataBackUp: tempData[0].name.split('.')[0]});
        }
  }
  
  render() {
    return (
      <View style={{ flexDirection: 'column', flex: 1 }}>
        <View style={{ flex: 10, backgroundColor: "#0099cbff" }}>
          <View style={{ height: "60%", justifyContent: "center" }}>
            <Image
              source={require("../../img/jslarge.png")}
              style={{ alignSelf: "center", width: 144, height:144 }}
            />
          </View>
          <View style={{ height: "40%", justifyContent: "center" }}>
            <Text style={{ color: "#e9e9e9ff", fontSize:20, paddingLeft: 10, fontWeight: 'bold' }}>Welcome to</Text>
            <Text
              style={{ color: "#e9e9e9ff", fontSize: 45, textAlign: "center", fontWeight: 'bold', paddingTop: 10 }}
            >
              JourneySmart
            </Text>
          </View>
        </View>
        <View style={{ flex: 11, backgroundColor: this.state.splash === 1 ? "#227299" : "#0099cbff" }}>
          <ScrollView
            ref={(snapScroll) => {this.scroll = snapScroll;}}
            horizontal
            scrollEnabled={false}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{height: '80%', flex:1}}
          >
            <View style={{ width: Dimensions.get("window").width, padding: 10}}>
              { this.state.splash === 1 ? <View><Text style={{ color: "#e9e9e9ff", fontSize:15, fontWeight: 'bold'}}>Please sign in to the Google account you wish to back up your app data to:</Text>
              { this.state.signedIn === 0 ? <TouchableOpacity style={{alignItems:'center',marginTop:30, backgroundColor: '#ffffff',width: '70%', alignSelf: 'center', flexDirection: 'row',padding:10, borderRadius: 2, shadowOffset: {
                width: 0, height: 0 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}} onPress={() => {this.onSelectGoogle()}}>
                <Image source={require('../../img/googleDrive.png')} style={{width: 40, height: 40}}/>
                <Text style={{flex: 1,fontSize: 15, color: "#55606E", fontWeight: 'bold', paddingRight: 30, textAlign: 'center', justifyContent: 'center' }}>Google Drive</Text>
              </TouchableOpacity>
              : <TouchableOpacity style={{alignItems:'center',marginTop:30, backgroundColor: '#4CAF50',width: '70%', alignSelf: 'center', flexDirection: 'row',padding:10, borderRadius: 2, shadowOffset: {
                width: 0, height: 0 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}} onPress={() => {this.onSelectGoogle()}}>
                <Image source={require('../../img/googleDrive.png')} style={{width: 40, height: 40}}/>
                <Text style={{flex: 1,fontSize: 10, color: "#fff", fontWeight: 'bold', paddingRight: 5,paddingLeft: 5, textAlign: 'center', justifyContent: 'center' }}>{`successfully signed in as\n ${JourneySmart.user.email}`}</Text>
              </TouchableOpacity> }
              
              </View>
              : <View/> }
              
            </View>

            <View style={{ width: Dimensions.get("window").width, padding: 10}}>
              <Text style={{ color: "#e9e9e9ff", fontSize:15, fontWeight: 'bold'}}>We found a previous backup of your JourneySmart data, would you like to restore it?</Text>
              <View style={{backgroundColor: "#ffffff", width: '93.5%', height: 50, padding: 1,flexDirection:'row', alignSelf: 'center', marginTop: 30, borderRadius: 2, shadowOffset: {
                width: 0, height: 0 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}}>
                <Image source={require('../../img/checkimg.png')} style={{width:40, height: 40, margin: 5}}/>
                <Text style={{color: "#444444", fontSize:14, alignSelf: 'center'}}>
                { this.state.dataEnabled === true ? `Data backup ${this.state.dataBackUp}` : 'No Backup Data is available'}
                </Text>
                { this.state.dataEnabled === true ? 
                <TouchableOpacity style={{ flex: 1,backgroundColor: '#4CAF50', alignSelf: 'flex-end', height: 48, alignItems: 'center',justifyContent: 'center'}} onPress={() => {this.dataBackUp()}}>
                 <Text style={{ color: "#e9e9e9ff", fontSize:15, alignSelf: 'center', padding: 5}}>RESTORE</Text>
                </TouchableOpacity> :
                null}
              </View>
              <View style={{marginTop: 30, justifyContent: 'center'}}>
                <TouchableOpacity style={{backgroundColor: '#ffffff',alignSelf: 'center', width: '30%', height: 40, alignItems: 'center',justifyContent: 'center', borderRadius: 2, shadowOffset: {
                width: 0, height: 0 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}} onPress={() => {this.scroll.scrollTo({x:Dimensions.get("window").width * (this.state.currentPage + 1),y:0, animated: true}); 
              this.setState({currentPage: this.state.currentPage + 1});}}>
                 <Text style={{ color: "#BFBFBF", alignSelf: 'center'}}>No Thanks</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ width: Dimensions.get("window").width, padding: 10}}>
              <Text style={{ color: "#e9e9e9ff", fontSize:15, fontWeight: 'bold'}}>Who do you work for?</Text>
              <View style={{alignItems:'center',marginTop:20, backgroundColor: '#ffffff',width: '85%', alignSelf: 'center', flexDirection: 'row',padding:5, borderRadius: 2, shadowOffset: {
                width: 0, height: 0 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}} >
                <Image source={require('../../img/manphone.png')} style={{width: 30, height: 30}}/>
                <TextInput 
                  onChangeText={(text) => this.setState({text})}
                  value={this.state.text} 
                  underlineColorAndroid='transparent'
                  placeholder="Employee name" 
                  style={{flex: 1,fontSize: 15, color: "#55606E", fontWeight: 'bold', paddingRight: 20, textAlign: 'center', justifyContent: 'center' }}></TextInput>
              </View>
              <Text style={{ color: "#e9e9e9ff", fontSize:15, fontWeight: 'bold',marginTop:20,}}>How much do you claim per mile or kilometre?</Text>
              <TouchableOpacity style={{alignItems:'center',marginTop:20, width: '85%', alignSelf: 'center', flexDirection: 'row',padding:5 }} onPress={() => {}}>
                <TextInput
                  style={{height: 40, backgroundColor: '#ffffff', color: '#55606E', width: '25%', paddingLeft:5, paddingRight: 5, textAlign: 'center', borderRadius: 2, shadowOffset: {
                width: 0, height: 0 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}}
                  underlineColorAndroid='transparent'
                  onChangeText={(mile) => this.setState({mile})}
                  value={this.state.mile}
                  keyboardType="numeric" 
                />
                <ModalDropdown 
                options={["GBP", "USD", "AUD"]} 
                defaultValue="GBP" 
                animated={true} 
                onSelect={(index, value) => {
                  this.setState({currency: value})
                }} 
                style={{ marginLeft: '4%', width: '20%', height: 40, backgroundColor: '#ffffff', alignSelf: 'center', justifyContent: 'center', borderRadius: 2, shadowOffset: {
                width: 0, height: 0 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}} 
                textStyle={{ fontSize: 16, textAlign: "center", color: '#55606E', alignSelf: 'center' }} 
                dropdownTextStyle={{ width: 50, fontSize: 16, textAlign: "center" }} 
                dropdownStyle={{height: 120}}
                alignSelf="center" />
                <TouchableOpacity style={this.state.unit === 'miles'?{alignItems:'center',backgroundColor: '#55606E',width: '24%', height: 40, marginLeft: '4%', justifyContent: 'center', borderRadius: 2, shadowOffset: {
                width: 0, height: 0 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}:{alignItems:'center',backgroundColor: '#ffffff',width: '24%', height: 40, marginLeft: '4%', justifyContent: 'center', borderRadius: 2, shadowOffset: {
                width: 0, height: 0 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}} onPress={() => {
                  this.setState({ unit: 'miles' });
                  }}>
                  <Text style={this.state.unit==='miles'?{fontSize: 15, color: "#ffffff", textAlign: 'center', alignSelf: 'center', justifyContent: 'center', fontWeight: 'bold'}:{fontSize: 15, color: "#55606E", textAlign: 'center', alignSelf: 'center', justifyContent: 'center', fontWeight: 'bold'}}>MILES</Text>
                </TouchableOpacity>
                <TouchableOpacity style={this.state.unit === 'km'?{alignItems:'center',backgroundColor: '#55606E',width: '24%', height: 40, justifyContent: 'center', borderRadius: 2, shadowOffset: {
                width: 0, height: 0 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}:{alignItems:'center',backgroundColor: '#ffffff',width: '24%', height: 40, justifyContent: 'center', borderRadius: 2, shadowOffset: {
                width: 0, height: 0 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}} onPress={() => {
                  this.setState({ unit: 'km' });
                  }}>
                  <Text style={this.state.unit==='km'?{fontSize: 15, color: "#ffffff", textAlign: 'center', alignSelf: 'center', justifyContent: 'center', fontWeight: 'bold'}:{fontSize: 15, color: "#55606E", textAlign: 'center', alignSelf: 'center', justifyContent: 'center', fontWeight: 'bold'}}>KM</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              
            </View>

          </ScrollView>
          <View style={{flexDirection: 'row', justifyContent:'flex-end', height:'20%'}}>
             { this.state.splash === 1 ? 
            <Pages
              style={{ position: "absolute", left: 0, right: 0, bottom: '60%' }}
              numberOfPages={3}
              currentPage={this.state.currentPage}
              hidesForSinglePage
              pageIndicatorTintColor="#ffffff"
              indicatorSize={{ width: 8, height: 8 }}
              currentIndicatorStyle={{width:15, height:15, borderRadius: 7}}
              currentPageIndicatorTintColor="white"
            />
            : null}
            { this.state.splash === 1 ? 
            <TouchableOpacity  onPress={() => {

              if (this.state.currentPage === 2) {
                AsyncStorage.setItem('employeeName', this.state.text);
                AsyncStorage.setItem('rate', this.state.mile);
                AsyncStorage.setItem('currencys', this.state.currency);
                if (this.state.unit === 'km') {
                  AsyncStorage.setItem('unit', '1');
                }
                else {
                  AsyncStorage.setItem('unit', '0');
                }
                EventRegister.emit('toMain');

                return;
              }
              
              this.scroll.scrollTo({x:Dimensions.get("window").width * (this.state.currentPage + 1),y:0, animated: true}); 
              this.setState({currentPage: this.state.currentPage + 1});
              }}
              style={{backgroundColor: "#0099cbff", width: 120, height: 50, padding: 10, justifyContent: 'center', marginRight: 10, borderRadius: 2, shadowOffset: {
                width: 0, height: 0 }, elevation: 2, shadowRadius: 4, shadowOpacity: 0.5,shadowColor: '#000'}}
              >
              <Text style={{color: "#e9e9e9ff", fontSize: 20, fontWeight: 'bold', textAlign: 'center'}}>{this.state.currentPage===2?'Finish':'Next'}>></Text>
            </TouchableOpacity>
              : <View/> }
          </View>
          
        </View>
      </View>
    );
  }
}
