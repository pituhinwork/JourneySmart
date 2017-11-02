import React from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import moment from 'moment';
import { autobind } from 'core-decorators';

import { ListViewHelper as ListViewHelperBase, DateTimePicker } from '../react-native-common-utils';
import JourneySummary from './JourneySummary';
import SceneTitle from '../SceneTitle';
import StaticUtils from '../StaticUtils';
import DB from '../DB';

const styles = require('../styles')('addJourney');
const strings = require('../strings')('addJourney');

/**
 * ListViewHelper.
 */
@autobind
class ListViewHelper extends ListViewHelperBase {
  renderRowSeparator(sectionID, rowID, adjacentRowHighlighted) {
    return (
      <View
        key={this.generateRowSeparatorKey(sectionID, rowID, adjacentRowHighlighted)}
        style={styles.all.startJourney.separatorLine}
      />
    );
  }
}

/**
 * PostcodeContainer.
 */
class PostcodeContainer extends React.Component {
  constructor(props) {
    super(props);

    this.content = [];
  }

  add(...styles) {
    this.content.push(<View key={this.content.length} style={styles} />);
  }

  render() {
    this.content = [];

    if (this.props.rowID == 0) {
      this.add(styles.all.startJourney.pointContainerCircle, {
        marginTop: styles.all.startJourney._pointContainerLine.height,
      });

      if (this.props.rowID < this.props.itemCount - 1) {
        this.add(styles.all.startJourney.pointContainerLine);
      }
    } else if (this.props.rowID == this.props.itemCount - 1) {
      this.add(styles.all.startJourney.pointContainerLine);
      this.add(styles.all.startJourney.pointContainerCircle);
    } else {
      this.add(styles.all.startJourney.pointContainerLine);
      this.add(styles.all.startJourney.pointContainerCircle);
      this.add(styles.all.startJourney.pointContainerLine);
    }

    return (
      <View style={styles.postcode}>
        <View style={styles.pointContainerShape}>{this.content}</View>
        <TextInput
          maxLength={8}
          onSubmitEditing={Keyboard.dismiss}
          style={styles.postcodeText}
          defaultValue={this.props.data[1]}
          placeholder={this.props.data[0]}
          placeholderTextColor={styles.all.textColorDisabled}
          underlineColorAndroid={'transparent'}
          autoCapitalize={'characters'}
          onChangeText={this.props.callbacks.get('onPostcodeChanged').bind(null, this.props.data)}
        />
        {this.props.rowID == 0 || this.props.rowID == this.props.itemCount - 1 ? null : (
          <TouchableOpacity
            activeOpacity={styles.all.activeOpacity}
            onPress={this.props.callbacks.get('deleteWaypoint').bind(null, this.props.rowID)}
          >
            <Image style={styles.deleteWaypoint} source={require('../../img/deleteWaypoint.png')} />
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

/**
 * AddJourney.
 */
@autobind
export default class AddJourney extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      datePicker: new DateTimePicker(this),
      postcodes: [
        [PostcodeContainer, [strings.startPostcode]],
        [PostcodeContainer, [strings.endPostcode]],
      ],
    };

    this.lv = new ListViewHelper(this.state.postcodes);

    this.lv.setStyle(styles.postcodes);
    this.lv.setCallback('onPostcodeChanged', this.onPostcodeChanged);
    this.lv.setCallback('deleteWaypoint', this.deleteWaypoint);
  }

  onPostcodeChanged(postcodeData, text) {
    postcodeData.length == 1
      ? postcodeData.push(text)
      : text ? (postcodeData[1] = text) : postcodeData.pop();

    this.forceUpdate();
  }

  deleteWaypoint(rowID) {
    this.state.postcodes.splice(rowID, 1);

    if (this.state.postcodes.length > 2) {
      for (let i = 1; i <= this.state.postcodes.length - 2; i++) {
        this.state.postcodes[i][1][0] = strings.all.formatString(strings.waypointPostcode, i);
      }
    }

    this.forceUpdate();
  }

  onPress(index) {
    switch (index) {
      case 0: 
      console.log('adding Postcode');
        this.state.postcodes.splice(this.state.postcodes.length - 1, 0, [
          PostcodeContainer,
          [strings.all.formatString(strings.waypointPostcode, this.state.postcodes.length - 1)],
        ]);

        this.forceUpdate();
        break;
      case 1:
        this.processPostcode();
        break;
    }
  }

  async processPostcode() {
    console.log('process Postcode');
    const postcodeData = this.state.postcodes.find((postcodeData) => postcodeData[1].length == 2);

    if (!postcodeData) {
      console.log('process Postcode:   0');
      this.props.nav.replace({
        className: JourneySummary,
        inputParams: {
          rowid: await DB.addManualJourney(this.state.datePicker.dateTime, this.state.postcodes),
        },
      });
    } else {
      console.log('process Postcode:     1');
      console.log(postcodeData);
      const result = await (await StaticUtils.postcodeToLatLng(postcodeData[1][1])).json();
      if (result === undefined) {
        alert('Enter correct postcodes');
        return;
      }
      switch (result.status) {
        case 'ZERO_RESULTS':
          alert(strings.all.formatString(strings.invalidPostcode, postcodeData[1][1]));

          break;

        case 'OK':
          postcodeData[1].push(result.results[0].geometry.location);
          postcodeData[1].push(result.results[0].formatted_address);
          this.processPostcode();
          break;

        default:
          alert(result.status);
          break;
      }
    }
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <SceneTitle title={strings.title} />
        <View style={{ flex: 1, margin: 0 }}>
          <View style={{ margin: styles.all.marginPadding }}>
            <TouchableOpacity
              style={styles.date}
              activeOpacity={styles.all.activeOpacity}
              onPress={this.state.datePicker.pickDate}
            >
              <Text style={styles.dateText}>
                {moment(this.state.datePicker.dateTime).format('DD MMM YYYY')}
              </Text>
            </TouchableOpacity>
            {this.lv.createListView()}
          </View>
          <View style={styles.all.bottomView}>
            {[
              [strings.all.startJourney.addWaypoint, this.state.postcodes.length == 4],
              [
                strings.all.finish,
                this.state.postcodes.reduce((p, c) => {
                  return p || c[1].length != 2;
                }, false),
              ],
            ].map((value, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={styles.all.activeOpacity}
                disabled={value[1]}
                onPress={this.onPress.bind(null, index)}
                style={[
                      styles.all.logoBlueButton.container,
                      {
                        flexDirection: "row",
                        height: 40,
                        marginLeft: 0,
                        backgroundColor:
                          value[1] 
                            ? styles.all.textColorDisabled
                            : styles.all.logoBlueButton.container
                                .backgroundColor
                      }
                    ]}
              >
                <Text style={styles.all.logoBlueButton.text}>{value[0]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ position: 'absolute', width: 3, backgroundColor: '#41C5F4', height: 30, left: '50%', bottom: 5, marginLeft: -1 }} />
        </View>
      </View>
    );
  }
}
