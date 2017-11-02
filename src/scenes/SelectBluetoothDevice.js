import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { autobind } from 'core-decorators';
import timer from 'react-native-timer';
import { Preferences, ListViewHelper } from '../react-native-common-utils';
import BT from '../Bluetooth';
import SceneTitle from '../SceneTitle';

const styles = require('../styles')('selectBluetoothDevice');
const strings = require('../strings')();

/**
 * Device.
 */
class Device extends React.Component {
  render() {
    return this.props.data.id ? (
      <TouchableOpacity
        style={styles.deviceContainer}
        activeOpacity={styles.all.activeOpacity}
        onPress={this.props.onPress.bind(null, this.props.data)}
      >
        <View
          style={[
            styles.all.listItemIndicator,
            {
              backgroundColor:
                this.props.data.id.valueOf() ==
                Preferences.journeyTrigger.bluetooth.device.getValue().valueOf()
                  ? styles.all.journeyTypeActiveColor
                  : undefined,
            },
          ]}
        />
        <Text style={styles.deviceName}>{this.props.data.name}</Text>
      </TouchableOpacity>
    ) : (
      <View />
    );
  }
}

/**
 * SelectBluetoothDevice.
 */
@autobind
export default class SelectBluetoothDevice extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      devices: [{}],
    };

    this.lv = new ListViewHelper(this.state.devices, Device);

    this.lv.setOnPress(this.onPress);
    this.lv.setStyle(styles.all.listView);
    this.lv.setSeparatorStyle(styles.all.listSeparator);


  }

  onPress(data) {
    Preferences.journeyTrigger.bluetooth.device.setValue(data.name);
    this.props.nav.pop();
  }

  loadList() {


    BT.list()
      .then(devices => {
        this.lv.setItems((this.state.devices = devices.sort((d1, d2) => {
            const name1 = d1.name.toLowerCase();
            const name2 = d2.name.toLowerCase();
            return name1 < name2 ? -1 : name1 > name2 ? 1 : 0;
          })));

        this.forceUpdate();
      })
      .catch(alert);
  }

  componentDidMount() {
    BT.isEnabled().then(flag => {
      if (flag === true) {
        console.log("true bluetooth");
      } else {
        console.log("false bluetooth");
      }
    });
    timer.setTimeout(
      this,
      'hideMsg',
      () => {
        this.loadList();
      },
      2000,
    );
    this.forceUpdate();
  }

  componentWillUnmount() {
    timer.clearInterval(this);
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <SceneTitle title={strings.all.selectBluetoothDevice} />
        {this.lv.createListView()}
      </View>
    );
  }
}
