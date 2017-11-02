import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import Menu, { MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import moment from 'moment';
import { autobind } from 'core-decorators';

import { AlterStyles, DateTimePicker } from '../react-native-common-utils';
import JourneyTypesMenu from '../JourneyTypesMenu';
import StaticUtils from '../StaticUtils';
import DB from '../DB';

const styles = require('../styles')('journeyFilter');
const strings = require('../strings')('journeyFilter');

@autobind
export default class JourneyFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    console.log('Journey filter', this.props.inputParams);

    if (this.props.inputParams) {
      this.state.period = this.props.inputParams.period;

      this.state.from = new DateTimePicker(this, this.props.inputParams.from);

      this.state.to = new DateTimePicker(this, this.props.inputParams.to);

      this.state.journeyType = this.props.inputParams.journeyType;
      this.state.reason = this.props.inputParams.reason;
    } else {
      this.state.period = 0;
      this.state.from = new DateTimePicker(this);
      this.state.to = new DateTimePicker(this);
      this.state.reason = '';
    }

    this.state.from.dateTime.setHours(0, 0, 0, 0);
  }

  async componentWillMount() {
    this.state.journeyTypes = await DB.getJourneyTypes(true);

    if (this.state.journeyTypes.length > 1) {
      StaticUtils.sortJourneyTypes(this.state.journeyTypes);

      this.state.journeyTypes.unshift({
        name: strings.allEmployers,
      });

      this.state.menuOptions = this.state.journeyTypes.map((type, index) => (
        <MenuOption key={index} value={index}>
          <View style={styles.all.journeySummary.type}>
            <Text style={styles.all.journeySummary.typeText}>{type.name}</Text>
          </View>
        </MenuOption>
      ));
    }

    if (!this.state.journeyType) {
      this.state.journeyType = this.state.journeyTypes[0];
    }

    this.props.parent.forceUpdate();
  }

  onPress(index) {
    switch (index) {
      case 0:
      case 1:
      case 2:
        {
          this.state.to.dateTime = new Date();

          if (index == 2) {
            this.state.to.dateTime.setDate(1);
            this.state.to.dateTime.setHours(0, 0, 0, 0);
            this.state.to.dateTime.setMilliseconds(-1);
          }

          this.state.from.dateTime = new Date(this.state.to.dateTime.getTime());

          this.state.from.dateTime.setHours(0, 0, 0, 0);

          const date =
            index == 1 ? this.state.from.dateTime.getDate() - 7 : index == 2 ? 1 : undefined;

          if (date != undefined) {
            this.state.from.dateTime.setDate(date);
          }
        }
        break;
      case 3:
        this.state.to.dateTime.setHours(23, 59, 59, 999);
        this.setState({ period: index });
        break;

      case 4:
        this.props.parent.loadJourneysAndStandaloneExpenses();
        break;

      case 5:
        this.props.parent.loadJourneysAndStandaloneExpenses(
          this.state.period,
          this.state.from.dateTime,
          this.state.to.dateTime,
          this.state.journeyType,
          this.state.reason,
        );
        break;
      default:
        break;
    }
  }

  setJourneyType(index) {
    this.setState({ journeyType: this.state.journeyTypes[index] });
  }

  render() {
    return (
      <View style={styles.scene}>
        <View style={[styles.periods, { height: 25 }]}>
          {strings.periods.map((period, index) => (
            <TouchableOpacity
              key={index}
              disabled={this.state.period == index}
              activeOpacity={styles.all.activeOpacity}
              onPress={this.onPress.bind(null, index)}
              style={new AlterStyles(styles.all.journeySummary.routeMode)
                .addProperty(
                  'backgroundColor',
                  true,
                  index == this.state.period ? styles.all.journeySummary._typeText.color : 'white',
                )
                .addProperty('marginLeft', index, styles.all.journeySummaryBlockSeparatorSize)
                .build()}
            >
              <Text
                style={new AlterStyles(styles.all.journeySummary.typeText)
                  .addProperty('fontSize', true, 15)
                  .addProperty('color', index == this.state.period, 'white')
                  .build()}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {this.state.period ? (
          <View
            style={[
              styles.periods,
              {
                marginTop: styles.all.journeySummaryBlockSeparatorSize,
              },
            ]}
          >
            {['from', 'to'].map((period, index) => (
              <TouchableOpacity
                key={index}
                disabled={this.state.period != 3}
                activeOpacity={styles.all.activeOpacity}
                onPress={this.state[period].pickDate}
                style={new AlterStyles(styles.all.journeySummary.routeMode)
                  .addProperty('backgroundColor', true, 'white')
                  .addProperty('marginLeft', index, styles.all.journeySummaryBlockSeparatorSize)
                  .build()}
              >
                <Text
                  style={new AlterStyles(styles.all.journeySummary.typeText)
                    .addProperty('color', this.state.period != 3, styles.all.textColorDisabled)
                    .build()}
                >
                  {moment(this.state[period].dateTime).format('DD MMM YYYY')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        {this.state.journeyTypes ? (
          <Menu onSelect={this.setJourneyType} renderer={JourneyTypesMenu}>
            <MenuTrigger>
              <View style={styles.all.journeySummary.routeModes}>
                <Text style={styles.all.journeySummary.typeText}>
                  {this.state.journeyType.name}
                </Text>
                {this.state.journeyTypes.length > 1 ? (
                  <View style={styles.all.journeySummary.triangle} />
                ) : null}
              </View>
            </MenuTrigger>
            <MenuOptions>{this.state.menuOptions}</MenuOptions>
          </Menu>
        ) : null}
        <TextInput
          onSubmitEditing={Keyboard.dismiss}
          style={styles.all.journeySummary.reason}
          defaultValue={this.state.reason}
          onChangeText={(reason) => this.setState({ reason })}
          placeholder={strings.all.addExpense.reason}
          placeholderTextColor={styles.all.textColorDisabled}
          underlineColorAndroid={'transparent'}
        />
        <View style={styles.buttons}>
          <TouchableOpacity
            activeOpacity={styles.all.activeOpacity}
            onPress={this.onPress.bind(null, strings.periods.length)}
            style={styles.all.logoBlueButton.container}
          >
            <Text style={styles.all.logoBlueButton.text}>{strings.reset}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={styles.all.activeOpacity}
            onPress={this.onPress.bind(null, strings.periods.length + 1)}
            style={[
              styles.all.logoBlueButton.container,
              {
                marginLeft: styles.all.marginPadding,
              },
            ]}
          >
            <Text style={styles.all.logoBlueButton.text}>{strings.apply}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
