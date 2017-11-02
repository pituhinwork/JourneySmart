import { NativeModules, DeviceEventEmitter } from 'react-native';

const Bluetooth = NativeModules.Bluetooth;

Bluetooth.addStateChangedListener = (handler) =>
  DeviceEventEmitter.addListener('bluetoothStateChanged', handler);

Bluetooth.addConnectionStateChangedListener = (handler) =>
  DeviceEventEmitter.addListener('bluetoothConnectionStateChanged', handler);

Bluetooth.addNotificationActionListener = (handler) =>
  DeviceEventEmitter.addListener('notificationAction', handler);

Bluetooth.removeStateChangedListener = (handler) =>
  DeviceEventEmitter.removeListener('bluetoothStateChanged', handler);

Bluetooth.removeConnectionStateChangedListener = (handler) =>
  DeviceEventEmitter.removeListener('bluetoothConnectionStateChanged', handler);

Bluetooth.removeNotificationActionListener = (handler) =>
  DeviceEventEmitter.removeListener('notificationAction', handler);

export default Bluetooth;
