import React from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import moment from 'moment';
import { autobind } from 'core-decorators';

import { AlterStyles } from '../react-native-common-utils';
import StaticUtils from '../StaticUtils';
import JourneyPoint from '../JourneyPoint';
import Expenses from './Expenses';
import Detail from './Detail';

require('moment-duration-format');

const styles = require('../styles')('journeyDetails');
const strings = require('../strings')('journeyDetails');

/**
 * Detail.
 */

/**
 * JourneyDetails.
 */
@autobind
export default class JourneyDetails extends React.Component {
  constructor(props) {
    super(props);

    let lineHeight = styles.all.journeyDetailsRowHeight;

    if (this.props.points) {
      switch (this.props.points.length) {
        case 2:
          break;

        case 3:
          lineHeight = lineHeight * 3 / 4;
          break;

        case 4:
          lineHeight /= 2;
          break;

        default:
          throw new Error(`JourneyDetails points.length: ${this.props.points.length}`);
      }
    }

    const circleTop = lineHeight - styles.all.startJourneyPointContainerCircleRadius / 2;

    this.state = {
      buttonIndex: 0,
      notes: this.props.notes,
      points: this.props.points
        ? this.props.points.map((value, index, array) => (
          <View key={index} style={styles.postcode}>
            <View style={styles.shape}>
              {index == 0 ? null : <View style={[styles.line, { height: lineHeight }]} />}
              <View style={[styles.circle, { top: circleTop }]} />
              {index == array.length - 1 ? null : (
                <View style={[styles.line, { height: lineHeight, top: lineHeight }]} />
              )}
            </View>
            <Detail name={value.getTimestamp()} value={value.getPostcode()} />
          </View>
        ))
        : undefined,
    };
  }

  onPress(buttonIndex) {
    this.setState({ buttonIndex });
  }

  onSelect(rowid, readOnly) {
    this.props.onSelect(rowid,readOnly);
  }

  render() {
    let container;

    switch (this.state.buttonIndex + (this.props.expensesOnly | 0)) {
      case 0: {
        if (this.props.error) {
          container = (
            <View
              style={[
                styles.container,
                {
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'white',
                },
              ]}
            >
              <Text style={styles.all.journeySummary.typeText}>{this.props.error}</Text>
            </View>
          );
        } else {
          const cost = StaticUtils.getJourneyCost(
            this.props.journeyType.rate,
            this.props.distance,
            this.props.journeyType.metric,
          );

          container = (
            <View style={styles.container}>
              <View style={styles.postcodes}>{this.state.points}</View>
              <View style={styles.details}>
                <Detail
                  name={this.props.journeyType.metric ? strings.km : strings.miles}
                  value={StaticUtils.round(
                    StaticUtils.metersToDistance(
                      this.props.distance,
                      this.props.journeyType.metric,
                    ),
                    2,
                  )}
                />
                <Detail
                  name={StaticUtils.metricToPerDistance(this.props.journeyType.metric)}
                  value={`${parseFloat(this.props.journeyType.rate).toFixed(2)} ${this.props.journeyType.currency}`}
                />

                <Detail
                  name={strings.travelTime}
                  value={moment
                    .duration(this.props.duration, 'seconds')
                    .format(JourneyPoint.TIME_FORMAT, { trim: false })}
                />

                <Detail
                  name={`${parseFloat(cost).toFixed(2)} ${this.props.journeyType.currency}`}
                  value={strings[this.props.routeMode]}
                />
              </View>
            </View>
          );
        }
        break;
      }

      case 1:
        container = <Expenses onSelect={this.onSelect.bind(this)} js={this.props.js} standalone={this.props.expensesOnly | 0} expenses={this.props.expensesOnly ? this.props.expenses : this.props.journeyType.expenses} />;
        break;

      case 2:
        container = this.props.readOnly ? (
          <View style={styles.containerRO}>
            <Text style={styles.notesRO}>{this.state.notes}</Text>
          </View>
        ) : (
          <TextInput
            onSubmitEditing={Keyboard.dismiss}
            multiline
            style={[styles.container, styles.notes, { backgroundColor: 'white' }]}
            placeholder={strings.notesPlaceholder}
            placeholderTextColor={styles.all.textColorDisabled}
            underlineColorAndroid={'transparent'}
            onChangeText={(text) => (this.state.notes = text)}
            defaultValue={this.state.notes}
          />
        );
        break;
      default:
        break;
    }

    const buttonImages = [require('../../img/journeyDetailsExpenses.png')];

    if (!this.props.expensesOnly) {
      buttonImages.unshift(require('../../img/journeyDetailsSummary.png'));
      buttonImages.push(require('../../img/journeyDetailsNotes.png'));
    }

    return (
      <View
        style={{
          marginTop: styles.all.journeySummaryBlockSeparatorSize,
        }}
      >
        {container}
        <View style={styles.buttons}>
          {buttonImages.map((value, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={styles.all.activeOpacity}
              disabled={index == this.state.buttonIndex}
              onPress={this.onPress.bind(null, index)}
              style={new AlterStyles(styles.buttonContainer)
                .addProperty('marginLeft', index, styles.all.journeySummaryBlockSeparatorSize)
                .addProperty('borderBottomLeftRadius', !index, this.props.borderRadius)
                .addProperty('borderBottomRightRadius', index == 2, this.props.borderRadius)
                .build()}
            >
              <View
                style={new AlterStyles(styles.currentButton)
                  .addProperty('backgroundColor', index != this.state.buttonIndex, 'transparent')
                  .build()}
              />
              <Image source={value} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }
}
