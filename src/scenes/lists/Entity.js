import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { autobind } from 'core-decorators';
import { AlterStyles } from '../../react-native-common-utils';
import BaseComponent from '../../BaseComponent';

const styles = require('../../styles')();
const styless = require('../../styles')('addJourney');
const strings = require('../../strings')();

export class EntityData {
  constructor(fieldName, placeholder, maxLength) {
    this.fieldName = fieldName;
    this.placeholder = placeholder;
    this.maxLength = maxLength;
  }
}

@autobind
export default class Entity extends BaseComponent {
  constructor(props, name, addUpdate, ...data) {
    super(props, name);

    this.addUpdate = addUpdate;

    this.state = {
      data,
      entity: props.route.inputParams
        ? { ...props.route.inputParams.entity }
        : data.reduce((p, c) => {
          p[c.fieldName] = '';
          return p;
        }, {}),
    };
  }

  async onPress(index) {
    if (!index) {
      this.props.nav.pop();
    } else {
      const entity = await this.addUpdate(this.state.entity);

      if (entity) {
        this.parent.onEntitiesChanged(entity);
        this.props.nav.pop();
      }
    }
  }

  render() {
    return (
      <View style={{ flex: 1, margin: 0 }}>
        <View style={{ margin: styles.marginPadding }}>
          {this.state.data.map((data, index) => (
            <TextInput
              onSubmitEditing={Keyboard.dismiss}
              key={index}
              style={[
                new AlterStyles(styles.journeyType.block).addProperty('marginTop', !index, 0).build(),
                styles.journeyType.blockInput,
                { flex: 0, marginTop: 5, textAlign: 'center' },
              ]}
              defaultValue={`${this.state.entity[data.fieldName]}`}
              maxLength={data.maxLength}
              placeholder={data.placeholder}
              placeholderTextColor={styles.textColorDisabled}
              underlineColorAndroid={'transparent'}
              onChangeText={(text) => {
                this.state.entity[data.fieldName] = text;
                this.forceUpdate();
              }}
            />
          ))}
        </View>
        <View style={styles.bottomView}>
          {[
            [strings.all.cancel],
            [
              strings.all.save,
              Object.keys(this.state.entity).reduce((p, c) => {
                return p || !this.state.entity[c];
              }, false),
            ],
          ].map((data, index) => (
            <TouchableOpacity
              key={index}
              disabled={data[1]}
              style={[
                      styless.all.logoBlueButton.container,
                      {
                        flexDirection: "row",
                        height: 40,
                        marginLeft: 0,
                        backgroundColor:
                          data[1] 
                            ? styless.all.textColorDisabled
                            : styless.all.logoBlueButton.container
                                .backgroundColor
                      }
                    ]}
              activeOpacity={styles.activeOpacity}
              onPress={this.onPress.bind(null, index)}
            >
              <Text style={styles.logoBlueButton.text}>{data[0]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ position: 'absolute', width: 3, backgroundColor: '#41C5F4', height: 30, left: '50%', bottom: 5, marginLeft: -1 }} />
      </View>
    );
  }
}
