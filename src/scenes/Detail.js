import React from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import moment from 'moment';
import { autobind } from 'core-decorators';

import { AlterStyles } from '../react-native-common-utils';
import StaticUtils from '../StaticUtils';
import JourneyPoint from '../JourneyPoint';
import Expenses from './Expenses';

require('moment-duration-format');

const styles = require('../styles')('journeyDetails');
const strings = require('../strings')('journeyDetails');

/**
 * Detail.
 */
export default class Detail extends React.Component {
  constructor(props) {
    super(props);

    this.content = [];
  }
  render() {
    return (
      <View style={styles.detail}>
        <Text style={styles.value}>{String(this.props.value)}</Text>
        <Text style={styles.name}>{this.props.name}</Text>
      </View>
    );
  }
}
