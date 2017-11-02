//
//  BluetoothModule.h
//  JourneySmart
//
//  Created by User on 13/09/2017.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <CoreBluetooth/CoreBluetooth.h>

@interface BluetoothModule : RCTEventEmitter <RCTBridgeModule, CBCentralManagerDelegate, CBPeripheralDelegate>

@property (nonatomic, assign) BOOL launchApp;
@property (strong, nonatomic) CBCentralManager *centralManager;
@property (strong, nonatomic) NSString *serviceUUID;
@property (strong, nonatomic) CBPeripheral *discoveredPeripheral;
@property (strong, nonatomic) CBPeripheral *connectedPeripheral;
@property (strong, nonatomic) NSMutableSet *peripherals;
@property (strong, nonatomic) CBService *targetService;
@property (strong, nonatomic) NSMutableData *data;

@end
