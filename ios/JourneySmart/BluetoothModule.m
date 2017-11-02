//
//  BluetoothModule.m
//  JourneySmart
//
//  Created by User on 13/09/2017.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import "BluetoothModule.h"
#import <React/RCTLog.h>

#define EVENT_STATE_CHANGED             @"bluetoothStateChanged"
#define EVENT_CONNECTION_STATE_CHANGED  @"bluetoothConnectionStateChanged"
#define EVENT_NOTIFICATION_ACTION       @"notificationAction"

@implementation BluetoothModule 
@synthesize peripherals;
RCT_EXPORT_MODULE(Bluetooth);

// After receiving event from bluetooth module, send event EVENT_STATE_CHANGED

- (NSArray<NSString *> *)supportedEvents
{
  return @[EVENT_STATE_CHANGED, EVENT_CONNECTION_STATE_CHANGED, EVENT_NOTIFICATION_ACTION];
}

RCT_EXPORT_METHOD(setLaunchApp:(BOOL)launchApp)
{
//  _launchApp = launchApp;
//  _centralManager = [[CBCentralManager alloc ]initWithDelegate:self queue:nil];
//
//  _serviceUUID = @"19B10010-E8F2-537E-4F6C-D104768A1214";
//  _data = [[NSMutableData alloc] init];
//  peripherals = [NSMutableSet set];
//  [self centralManagerDidUpdateState:self.centralManager];
}

RCT_REMAP_METHOD(isEnabled,
                 isEnabledWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(@NO);
//  if (_centralManager.state != CBCentralManagerStatePoweredOn) {
//    resolve(@NO);
//  }
//  else {
//    _centralManager.delegate = self;
//    [_centralManager scanForPeripheralsWithServices:@[] options:@{ CBCentralManagerScanOptionAllowDuplicatesKey : @YES }];
//    resolve(@YES);
//  }
  // Get default bluetooth adapter and return true if enabled
}

- (void)centralManager:(CBCentralManager *)central didDiscoverPeripheral:(CBPeripheral *)peripheral
     advertisementData:(NSDictionary *)advertisementData
                  RSSI:(NSNumber *)RSSI
{
//    [peripherals addObject:peripheral];
//
//    if (_discoveredPeripheral != peripheral || _discoveredPeripheral == nil) {
//      // Save a local copy of the peripheral, so CoreBluetooth doesn't get rid of it
//      _discoveredPeripheral = peripheral;
//
//      // And connect
//      NSLog(@"Connecting to peripheral %@", peripheral);
//      peripheral.delegate = self;
//      [_centralManager connectPeripheral:peripheral options:nil];
//    }
}

RCT_REMAP_METHOD(list,
                 listEnabledWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
//  if (_centralManager == nil || _centralManager.state != CBCentralManagerStatePoweredOn)
//  {
//    reject(@"EUNSPECIFIED", @"Bluetooth is unavailable or turned off.",nil);
//  }
//  else
//  {
//      NSMutableArray *result = [NSMutableArray array];
//      if (peripherals.count == 0) {
//        for (CBPeripheral *peripheral in peripherals) {
//
//            NSMutableDictionary *productDictionary = [NSDictionary mutableCopy];
//            productDictionary[@"name"] = peripheral.name;
//            productDictionary[@"id"] = peripheral.identifier;
//            [result addObject:  productDictionary];
//        }
//        resolve(result);
//      }
//      else{
//        reject(@"EUNSPECIFIED", @"Can not find bluetooth devices.",nil);
//      }
//  }
  reject(@"EUNSPECIFIED", @"Can not find bluetooth devices.",nil);
}

RCT_EXPORT_METHOD(setDeviceToTrack:(NSString *)deviceToTrack)
{
  // Save current tracking device to user defaults
//  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
//  [userDefaults setObject:deviceToTrack forKey:@"preferences_device_to_track"];
//  [userDefaults synchronize];
}

RCT_EXPORT_METHOD(cancelNotification)
{
  // Cancel a previously shown notification
//  if (_connectedPeripheral != nil){
//    [_centralManager cancelPeripheralConnection:_connectedPeripheral];
//  }
}

RCT_EXPORT_METHOD(showJourneyInProgressNotification)
{
  
  
  // Show 'Journey is in progress' notification, Add waypoint / Finish
}

RCT_EXPORT_METHOD(showJourneySummaryNotification)
{
  // Show 'Journey finished' notification
}

- (void)centralManagerDidUpdateState:(CBCentralManager *)central {
  // You should test all scenarios
//  if (central.state != CBCentralManagerStatePoweredOn) {
//    [self sendEventWithName:@"bluetoothConnectionStateChanged" body:@{@"connected": @NO}];
//    return;
//  }
//
//  if (central.state == CBCentralManagerStatePoweredOn) {
//    // Scan for devices
//    [_centralManager scanForPeripheralsWithServices:@[[CBUUID UUIDWithString:_serviceUUID]] options:@{ CBCentralManagerScanOptionAllowDuplicatesKey : @YES }];
//
//    [self sendEventWithName:@"bluetoothConnectionStateChanged" body:@{@"connected": @YES}];
//  }
}

- (void)centralManager:(CBCentralManager *)central didFailToConnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {
//  NSLog(@"Failed to connect");
//  [self cleanup];
}

- (void)cleanup {
  
  // See if we are subscribed to a characteristic on the peripheral
//  if (_discoveredPeripheral.services != nil) {
//    for (CBService *service in _discoveredPeripheral.services) {
//      if (service.characteristics != nil) {
//        for (CBCharacteristic *characteristic in service.characteristics) {
//          if ([characteristic.UUID isEqual:[CBUUID UUIDWithString:_serviceUUID]]) {
//            if (characteristic.isNotifying) {
//              [_discoveredPeripheral setNotifyValue:NO forCharacteristic:characteristic];
//              return;
//            }
//          }
//        }
//      }
//    }
//  }
//
//  [_centralManager cancelPeripheralConnection:_discoveredPeripheral];
}

- (void)centralManager:(CBCentralManager *)central didConnectPeripheral:(CBPeripheral *)peripheral {
//  NSLog(@"Connected");
//
//  [_centralManager stopScan];
//  NSLog(@"Scanning stopped");
//
//  [_data setLength:0];
//
//  peripheral.delegate = self;
//
//  [peripheral discoverServices:@[[CBUUID UUIDWithString:_serviceUUID]]];
}

- (void)peripheral:(CBPeripheral *)peripheral didDiscoverServices:(NSError *)error {
//  if (error) {
//    [self cleanup];
//    return;
//  }
//
//  for (CBService *service in peripheral.services) {
//    [peripheral discoverCharacteristics:@[[CBUUID UUIDWithString:_serviceUUID]] forService:service];
//  }
//  // Discover other characteristics
}
- (void)centralManager:(CBCentralManager *)central didDisconnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {
//  _discoveredPeripheral = nil;
//
//  [_centralManager scanForPeripheralsWithServices:@[[CBUUID UUIDWithString:_serviceUUID]] options:@{ CBCentralManagerScanOptionAllowDuplicatesKey : @YES }];
}
- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {
//  if (error) {
//    NSLog(@"Error");
//    return;
//  }
//
//  NSString *stringFromData = [[NSString alloc] initWithData:characteristic.value encoding:NSUTF8StringEncoding];
//
//  // Have we got everything we need?
//  if ([stringFromData isEqualToString:@"EOM"]) {
//
//    [peripheral setNotifyValue:NO forCharacteristic:characteristic];
//
//    [_centralManager cancelPeripheralConnection:peripheral];
//  }
//
//  [_data appendData:characteristic.value];
}
- (void)peripheral:(CBPeripheral *)peripheral didUpdateNotificationStateForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error {
//
//  if (![characteristic.UUID isEqual:[CBUUID UUIDWithString:_serviceUUID]]) {
//    return;
//  }
//
//  if (characteristic.isNotifying) {
//    [self sendEventWithName:@"notificationAction" body:@{@"action": @"content"}];
//    NSLog(@"Notification began on %@", characteristic);
//  } else {
//    // Notification has stopped
//    [_centralManager cancelPeripheralConnection:peripheral];
//  }
}

@end
