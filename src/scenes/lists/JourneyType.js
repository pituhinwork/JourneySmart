import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native';

import { autobind } from 'core-decorators';
import { AlterStyles } from '../../react-native-common-utils';
import BaseComponent from '../../BaseComponent';
import DB from '../../DB';

const strings = require('../../strings')('journeyType');
const styles = require('../../styles')('journeyType');

@autobind
export default class JourneyType extends BaseComponent {
  constructor(props) {
    super(props, 'JourneyType');

    this.insert = !props.route.inputParams;

    if (this.insert) {
      this.type = {
        active: 1,
        currency: 'GBP',
        metric: 0,
      };
    } else {
      this.type = { ...props.route.inputParams.entity };
      console.log('this.type');
      console.log(this.type);
      this.type.rate = `${this.type.rate}`;
    }
  }

  async onPress(index) {
    switch (index) {
      case 0:
      case 1:
        this.type.active = !index | 0;
        this.forceUpdate();
        break;

      case 2:
      case 3:
        this.type.metric = index - 2;
        this.forceUpdate();
        break;

      case 4:
        this.props.nav.pop();
        break;

      case 5: {
        const ref = !this.type.name
          ? 'name'
          : !this.type.rate ? 'rate' : !this.type.code ? (this.type.code = '') : null;
        console.log(ref, this.refs[ref]);
        if (ref && this.refs[ref]) {
          this.refs[ref].focus();
        } else {
          const type = await DB.addUpdateJourneyType(this.type);
          console.log(type);
          if (type) {
            this.parent.onEntitiesChanged(type);
            this.props.nav.pop();
          }
        }

        break;
      }
      default:
        break;
    }
  }

  render() {
    const [textStyle1, textStyle2, inputStyle] = new AlterStyles(
      styles.blockText1,
      styles.blockText2,
      styles.blockInput,
    )
      .addProperty('color', !this.type.active, styles.all.textColorDisabled)
      .build();

    return (
      <View style={{ flex: 1, margin: 0 }}>
        <View style={{ margin: styles.all.marginPadding }}>
          {this.type.rowid === 1 ? null : (
            <View style={styles.activity}>
              {[
                [
                  strings.active,
                  this.type.active ? styles.active : styles.all.centerCenterFlex1,
                  !!this.type.active,
                ],
                [
                  strings.inactive,
                  this.type.active ? styles.all.centerCenterFlex1 : styles.inactive,
                  !this.type.active,
                ],
              ].map((value, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={styles.all.activeOpacity}
                  onPress={this.onPress.bind(null, index)}
                  style={value[1]}
                  disabled={value[2]}
                >
                  <Text style={styles.activityText}>{value[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.block}>
            <Text style={textStyle1}>{strings.name}</Text>
            <TextInput
              ref="name"
              onSubmitEditing={Keyboard.dismiss}
              style={inputStyle}
              placeholder={strings.name}
              placeholderTextColor={styles.all.textColorDisabled}
              editable={!!this.type.active}
              defaultValue={`${this.type.name}`}
              underlineColorAndroid={'transparent'}
              maxLength={15}
              onChangeText={text => (this.type.name = text)}
            />
          </View>

          <View style={styles.block}>
            <Text style={textStyle1}>{strings.code}</Text>
            <TextInput
              ref={(c) => {
                this.code = c;
              }}
              style={inputStyle}
              placeholder={'0'}
              onSubmitEditing={Keyboard.dismiss}
              placeholderTextColor={styles.all.textColorDisabled}
              editable={!!this.type.active}
              defaultValue={`${parseFloat(this.type.code).toFixed(2) === 'NaN' ? '0.00' : parseFloat(this.type.code).toFixed(2)}`}
              underlineColorAndroid={'transparent'}
              maxLength={6}
              keyboardType="numeric"
              onChangeText={(text) => {
                this.type.code = text;
              }}
            />
          </View>

          <View style={styles.block}>
            <Text style={textStyle2}>{strings.rate}</Text>
            <TextInput
              ref={(c) => {
                this.rate = c;
              }}
              style={inputStyle}
              placeholder={'0'}
              placeholderTextColor={styles.all.textColorDisabled}
              onSubmitEditing={Keyboard.dismiss}
              editable={!!this.type.active}
              defaultValue={`${this.type.rate !== undefined && `${parseFloat(this.type.rate).toFixed(2) === 'NaN' ? '0.00' : parseFloat(this.type.rate).toFixed(2)}`}`}
              underlineColorAndroid={'transparent'}
              keyboardType="numeric"
              onChangeText={(text) => {
                this.type.rate = text;
              }}
            />
            <Text style={inputStyle}>{this.type.currency}</Text>
          </View>

          <View style={styles.block}>
            <Text style={textStyle2}>{strings.units}</Text>
            <View style={styles.distanceUnit}>
              {[
                [
                  !this.type.active || this.type.metric
                    ? styles.all.centerCenterFlex1
                    : styles.active,
                  !this.type.active || !this.type.metric,
                  strings.miles,
                  new AlterStyles(styles.distanceUnitText)
                    .addProperty(
                      'color',
                      !this.type.active,
                      this.type.metric ? 'transparent' : styles.all.textColorDisabled,
                    )
                    .build(),
                ],
                [
                  !this.type.active || !this.type.metric
                    ? styles.all.centerCenterFlex1
                    : styles.active,
                  !this.type.active || !!this.type.metric,
                  strings.km,
                  new AlterStyles(styles.distanceUnitText)
                    .addProperty(
                      'color',
                      !this.type.active,
                      !this.type.metric ? 'transparent' : styles.all.textColorDisabled,
                    )
                    .build(),
                ],
              ].map((value, index) => (
                <TouchableOpacity
                  key={index}
                  style={value[0]}
                  disabled={value[1]}
                  activeOpacity={styles.all.activeOpacity}
                  onPress={this.onPress.bind(null, index + 2)}
                >
                  <Text style={value[3]}>{value[2]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.all.bottomView}>
          {[strings.all.cancel, strings.all.save].map((value, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.all.logoBlueButton.container,
                {
                  flexDirection: 'row',
                  height: 40,
                  marginLeft: 0,
                  backgroundColor: styles.all.logoBlueButton.container.backgroundColor,
                },
              ]}
              activeOpacity={styles.all.activeOpacity}
              onPress={this.onPress.bind(null, index + 4)}
            >
              <Text style={styles.all.logoBlueButton.text}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View
          style={{
            position: 'absolute',
            width: 3,
            backgroundColor: '#41C5F4',
            height: 30,
            left: '50%',
            bottom: 5,
            marginLeft: -1,
          }}
        />
      </View>
    );
  }
}
