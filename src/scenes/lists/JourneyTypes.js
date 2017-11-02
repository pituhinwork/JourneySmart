import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { autobind } from 'core-decorators';
import { AlterStyles } from '../../react-native-common-utils';

import Entities from './Entities';
import JourneyType from './JourneyType';
import StaticUtils from '../../StaticUtils';
import DB from '../../DB';

const styles = require('../../styles')('journeyTypes');

/**
 * TypeContainer.
 */
class TypeContainer extends React.Component {
  render() {
    const [textStyle, rateTextStyle, rateDistanceStyle] = new AlterStyles(
      styles.typeContainerText,
      styles.all.listEntities.typeContainerText,
      styles.typeContainerRateDistance,
    )
      .addProperty('color', !this.props.data.active, styles.all.textColorDisabled)
      .build();

    return this.props.data.name ? <TouchableOpacity style={styles.all.listEntities.typeContainer} activeOpacity={styles.all.activeOpacity} onPress={this.props.onPress.bind(null, this.props.data.rowid)}>
        <View style={[styles.all.listItemIndicator, { backgroundColor: this.props.data.active ? styles.all.journeyTypeActiveColor : styles.all.journeyTypeInactiveColor }]} />
        <Text style={textStyle}>{this.props.data.name}</Text>
        <Text style={textStyle}>
          {parseFloat(
            StaticUtils.safeJourneyTypeCode(this.props.data.code)
          ).toFixed(2) === "NaN"
            ? "0.00"
            : parseFloat(
                StaticUtils.safeJourneyTypeCode(this.props.data.code)
              ).toFixed(2) === "NaN"}
        </Text>
        <View style={styles.typeContainerRate}>
          <Text style={rateTextStyle}>
            {parseFloat(this.props.data.rate).toFixed(2) === "NaN" ? "0.00" : parseFloat(this.props.data.rate).toFixed(2)}&nbsp;
            {this.props.data.currency}
          </Text>
          <Text style={rateDistanceStyle}>
            {StaticUtils.metricToPerDistance(this.props.data.metric)}
          </Text>
        </View>
      </TouchableOpacity> : <View />;
  }
}

/**
 * JourneyTypes.
 */
@autobind
export default class JourneyTypes extends Entities {
  constructor(props) {
    super(
      props,
      'JourneyTypes',
      TypeContainer,
      JourneyType,
      DB.getJourneyTypes,
      StaticUtils.sortJourneyTypes,
    );
  }
}
