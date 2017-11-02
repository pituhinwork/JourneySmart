import { NativeModules } from "react-native";
import { StaticUtils as StaticUtilsBase } from "simple-common-utils";
import DeviceInfo from "react-native-device-info";

export default class StaticUtils extends StaticUtilsBase {
   static spinkitColor(rgba) {
      return "#" + `${Array(7).join(0)}${(rgba >>> 8).toString(16)}`.slice(-6);
   }
   
   static getLocaleId() {
       let locale = DeviceInfo.getDeviceLocale();
      return locale.split("-")[1];
   }
}
