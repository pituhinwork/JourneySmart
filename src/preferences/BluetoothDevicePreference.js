import { Preference } from '../react-native-common-utils';
import BT from '../Bluetooth';

export default class BluetoothDevicePreference extends Preference {
  async setValue(value) {
    if (await super.setValue(value)) {
      BT.setDeviceToTrack(value);

      return true;
    }
    return false;
  }
}
