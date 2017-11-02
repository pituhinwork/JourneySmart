import React from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  Dimensions,
} from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';
import Menu, { MenuTrigger, MenuOptions, MenuOption, renderers } from 'react-native-popup-menu';
import ImagePicker from 'react-native-image-crop-picker';
import moment from 'moment';
import { autobind } from 'core-decorators';
import { AlterStyles, DateTimePicker } from '../react-native-common-utils';
import ViewJourneys from './ViewJourneys';
import SceneTitle from '../SceneTitle';
import StaticUtils from '../StaticUtils';
import JourneyTypesMenu from '../JourneyTypesMenu';
import BaseComponent from '../BaseComponent';
import DB from '../DB';

const styles = require('../styles')('addExpense');
const strings = require('../strings')('addExpense');

/**
 * ActionMenu.
 */
class ActionMenu extends renderers.ContextMenu {
  computePositionAndSize(layouts) {
    const width = styles.$addImage.menuOptionImage.width * 2 + 10;
    const right = layouts.triggerLayout.x + layouts.triggerLayout.width / 2;

    return {
      width,
      left: right - width,
      right,
      top:
        layouts.triggerLayout.y +
        styles.all.marginPadding -
        styles.$addImage.menuOptionImage.height * 1.5,
    };
  }
}

/**
 * AddExpense.
 */
@autobind
export default class AddExpense extends BaseComponent {
  static IMAGE_PICK = ['pick', require('../../img/addExpensePickImage.png')];
  static IMAGE_TAKE = ['take', require('../../img/addExpenseTakePhoto.png')];
  static IMAGE_NONE = ['none', require('../../img/addExpenseNoImage.png')];

  constructor(props) {
    super(props, 'AddExpense');
    this.tempVals = {
      net: 0,
      vat: 0,
    }
    this.state = {
      standalone: 0,
      reason: '',
      datePicker: new DateTimePicker(this),
      currency: 'GBP',
      net: '',
      vat: '',
      journey: [],
      images: [],
    };
  }

  componentWillUnmount() {
    console.log("Add Expense will unmount");
  }

  async componentWillMount() {
    super.componentWillMount();

    this.expenseTypes = await DB.getExpenseTypes();

    if (!this.expenseTypes.length) {
      alert(strings.noExpenseTypes);

      setTimeout(this.props.nav.pop, 50);
    } else {
      this.journeyTypes = await DB.getJourneyTypes(true);

      this.menuOptions = {};

      [
        ['expenseTypes', StaticUtils.sortAlphabetically, 'type'],
        ['journeyTypes', StaticUtils.sortJourneyTypes, 'name'],
      ].forEach((data) => {
        const array = this[data[0]];

        if (array.length > 1) {
          data[1](array, data[2]);

          this.menuOptions[data[0]] = array.map((type, index) => (
            <MenuOption key={index} value={index}>
              <View style={styles.all.journeySummary.type}>
                <Text style={styles.all.journeySummary.typeText}>{type[data[2]]}</Text>
              </View>
            </MenuOption>
          ));
        }
      });

      await this.selectImage(false, this.props.route.inputParams.action);

      if (!this.props.route.inputParams.rowid) {
        this.state.journeyType = this.journeyTypes[0];
        this.state.expenseType = this.expenseTypes[0];
      } else {
        let tempState = await DB.loadExpense(this.props.route.inputParams.rowid);
        console.log("state", tempState);
        this.setState({net: `${tempState.net}`});
        this.setState({ vat: `${tempState.vat}` });
        this.tempVals.net = `${tempState.net}`;
        this.tempVals.vat = `${tempState.vat}`;
        this.setState({datePicker: new DateTimePicker(this, new Date(tempState.millis))});
        this.setState({journeyType: tempState.standalone
          ? this.journeyTypes.find((type) => type.rowid == tempState.linkedTo)
          : this.journeyTypes[0]})
        this.setState({expenseType: this.expenseTypes.find(
          (type) => type.rowid == tempState.expenseType,
        )});
        this.setState({reason: tempState.reason});
        this.setState({ rowid: tempState.rowid });
        this.setState({ journey: tempState.journey });
        this.setState({images: tempState.images});
      }

      this.forceUpdate();
    }
  }

  async selectImage(forceUpdate, action) {
    try {
      let method = null;

      switch (action) {
        case AddExpense.IMAGE_PICK[0]:
          method = ImagePicker.openPicker;
          break;

        case AddExpense.IMAGE_TAKE[0]:
          method = ImagePicker.openCamera;
          break;
      }

      if (method) {
        this.state.images.push(
          await method({
            mediaType: 'photo',
            includeBase64: true,
          }),
        );

        if (forceUpdate) {
          this.forceUpdate();
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async onPress(index) {
    if (index < 2) {
      this.setState({ standalone: index });
    } else {
      this.props.nav.pop();
      if (index === 3) {
        console.log("this.state.linkedTo");
        this.state.linkedTo = (this.state.standalone
          ? this.state.journeyType
          : this.state.journey).rowid;
        console.log("this.state.linkedTo", this.state.linkedTo);
        this.state.type = this.state.expenseType.type;
        this.state.expenseType = this.state.expenseType.rowid;
        this.state.millis = this.state.datePicker.dateTime.getTime();

        this.state.tzOffsetMillis = this.state.datePicker.dateTime.getTimezoneOffset() * 60 * 1000;

        this.state.net = +this.state.net;
        this.state.vat = +this.state.vat;
        DB.addUpdateExpense({
          rowid: this.state.rowid, 
          standalone: this.state.standalone, 
          linkedTo: this.state.linkedTo, 
          expenseType: this.state.expenseType, 
          reason: this.state.reason, 
          millis: this.state.millis, 
          tzOffsetMillis: this.state.tzOffsetMillis, 
          currency: this.state.currency, 
          net: this.state.net, 
          vat: this.state.vat}).then((rowids) => {
            if (rowids) {
              this.setState({ rowid: rowids });
              if (this.parent) {
                this.parent.onUpdate(this.state);
              }
              DB.safeAddExpenseImages({ images: this.state.images, rowid: rowids });
            }
          });
      }      
      
    }
  }

  async onDeleteImage(index) {
    const image = this.state.images[index];

    if (!image.rowid || (await DB.deleteExpenseImage(image))) {
      this.state.images.splice(index, 1);

      this.forceUpdate();
    }
  }

  addMenu(fieldName, arrayName, propertyName) {
    if (this.state[fieldName]) {
      const menuTrigger = (
        <View style={styles.all.journeySummary.routeModes}>
          <Text style={styles.all.journeySummary.typeText}>
            {this.state[fieldName][propertyName]}
          </Text>
          {this[arrayName].length > 1 && !this.props.route.inputParams.readOnly ? (
            <View style={styles.all.journeySummary.triangle} />
          ) : null}
        </View>
      );

      return this.props.route.inputParams.readOnly ? (
        menuTrigger
      ) : (
        <Menu
          renderer={JourneyTypesMenu}
          onSelect={(index) => this.setState({ [fieldName]: this[arrayName][index] })}
        >
          <MenuTrigger>{menuTrigger}</MenuTrigger>
          <MenuOptions>{this.menuOptions[arrayName]}</MenuOptions>
        </Menu>
      );
    }
  }

  addClickableText(data) {
    return (
      <TouchableOpacity
        style={[styles.all.journeySummary.$container, data.style]}
        onPress={data.onPress}
        disabled={this.props.route.inputParams.readOnly}
        activeOpacity={styles.all.activeOpacity}
      >
        <Text
          style={new AlterStyles(styles.all.journeySummary.typeText)
            .addProperty('color', !data.filled, styles.all.textColorDisabled)
            .build()}
        >
          {data.text}
        </Text>
      </TouchableOpacity>
    );
  }

  render() {
    const divider = Dimensions.get('window').width - 2 * styles.all.marginPadding;

    const finishEnabled =
      !this.props.route.inputParams.readOnly &&
      (this.state.standalone || !!this.state.journey) &&
      +this.state.net;
    return <View style={{ flex: 1 }}>
        <SceneTitle title={strings.title} />
        <View style={{ flex: 1, margin: 0 }}>
          <ScrollView style={styles.scrollView}>
            <View style={{ margin: styles.all.marginPadding }}>
              <View style={styles.all.journeySummary.$container}>
                {strings.standaloneModes.map((mode, index) => (
                  <TouchableOpacity
                    key={index}
                    disabled={
                      this.state.standalone == index ||
                      this.props.route.inputParams.readOnly
                    }
                    activeOpacity={styles.all.activeOpacity}
                    onPress={this.onPress.bind(null, index)}
                    style={new AlterStyles(
                      styles.all.journeySummary.routeMode
                    )
                      .addProperty(
                        "backgroundColor",
                        index == this.state.standalone,
                        styles.all.journeySummary._typeText.color
                      )
                      .build()}
                  >
                    <Text
                      style={new AlterStyles(
                        styles.all.journeySummary.typeText
                      )
                        .addProperty(
                          "color",
                          index == this.state.standalone,
                          "white"
                        )
                        .build()}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {this.state.standalone ? this.addMenu("journeyType", "journeyTypes", "name") : this.addClickableText(
                    {
                      filled: !!this.state.journey,
                      style: {
                        marginTop:
                          styles.all.journeySummaryBlockSeparatorSize
                      },
                      onPress: () =>
                        this.props.nav.push({
                          className: ViewJourneys,
                          [BaseComponent.SET_CHILD]: this.setChild,
                          inputParams: {
                            onPick: journey =>
                              this.setState({
                                journey: {
                                  rowid: journey.rowid,
                                  timestamp: journey.points[0].getTimestamp(
                                    "DD MMM YYYY"
                                  )
                                }
                              })
                          }
                        }),
                      text: this.state.journey.rowid !== undefined
                        ? this.state.journey.timestamp
                        : "select journey"
                    }
                  )}
              {this.addMenu("expenseType", "expenseTypes", "type")}
              <TextInput style={styles.all.journeySummary.reason} editable={!this.props.route.inputParams.readOnly} defaultValue={this.state.reason} onChangeText={reason => this.setState(
                    { reason }
                  )} placeholder={strings.reason} placeholderTextColor={styles.all.textColorDisabled} onSubmitEditing={Keyboard.dismiss} underlineColorAndroid={"transparent"} />
              <View style={[styles.all.journeySummary.routeModes, { backgroundColor: "transparent" }]}>
                {this.addClickableText({
                  filled: true,
                  style: { flex: 1 },
                  onPress: this.state.datePicker.pickDate,
                  text: moment(this.state.datePicker.dateTime).format(
                    "DD MMM YYYY"
                  )
                })}
                <ModalDropdown options={["GBP", "USD", "AUD"]} defaultValue="GBP" animated={true} onSelect={(index, value) => {
                    this.setState({ currency: value });
                  }} style={{ marginLeft: styles.all.journeySummaryBlockSeparatorSize, flex: 1 }} textStyle={{ ...styles.all.journeySummary.$container, fontSize: 20, paddingTop: 12, textAlign: "center" }} dropdownTextStyle={{ width: 300, fontSize: 20, textAlign: "center" }} alignSelf="center" />
              </View>
              <View style={[styles.all.journeySummary.routeModes, { backgroundColor: "transparent", marginTop: styles.$marginTop }]}>
                {["net", "vat"].map((key, index) => (
                  <TextInput
                    key={index}
                    onSubmitEditing={Keyboard.dismiss}
                    onEndEditing={() => {
                      this.setState({ [key]: this.tempVals[key] });
                    }}
                    editable={!this.props.route.inputParams.readOnly}
                    style={[
                      styles.all.journeySummary.reason,
                      {
                        flex: 1,
                        marginTop: undefined,
                        marginLeft: index
                          ? styles.all.journeySummaryBlockSeparatorSize
                          : undefined
                      }
                    ]}
                    defaultValue={`${parseFloat(this.state[key]).toFixed(
                      2
                    ) === "NaN" ||
                    parseFloat(this.state[key]).toFixed(2) === ""
                      ? ""
                      : parseFloat(this.state[key]).toFixed(2)}`}
                    onChangeText={text => (this.tempVals[key] = text)}
                    placeholder={strings[key]}
                    keyboardType="numeric"
                    placeholderTextColor={styles.all.textColorDisabled}
                    underlineColorAndroid={"transparent"}
                  />
                ))}
              </View>
              <View style={styles.total}>
                <Text style={styles.totalText}>{strings.total}</Text>
                <Text style={styles.totalSum}>
                  {StaticUtils.round(+this.state.net + +this.state.vat, 2).toFixed(2)}
                </Text>
                <Text style={styles.totalText}>{this.state.currency}</Text>
              </View>
              <Menu renderer={ActionMenu} onSelect={this.selectImage.bind(null, true)}>
                <MenuTrigger style={new AlterStyles(styles.all.logoBlueButton.container)
                    .addProperty("marginTop", true, styles.all.marginPadding)
                    .addProperty("backgroundColor", this.props.route.inputParams.readOnly, styles.all.textColorDisabled)
                    .build()}>
                  <View>
                    <Text style={styles.all.logoBlueButton.text}>
                      {strings.addImage}
                    </Text>
                  </View>
                </MenuTrigger>
                <MenuOptions style={styles.$addImage.menuOptions}>
                  {[AddExpense.IMAGE_PICK, AddExpense.IMAGE_TAKE].map(
                    (data, index) => (
                      <MenuOption key={index} value={data[0]}>
                        <Image
                          style={styles.$addImage.menuOptionImage}
                          source={data[1]}
                        />
                      </MenuOption>
                    )
                  )}
                </MenuOptions>
              </Menu>
              {this.state.images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image.path }}
                  style={[
                    styles.image,
                    {
                      height: image.height * divider / image.width,
                      width: divider
                    }
                  ]}
                >
                  {this.props.route.inputParams.readOnly ? null : (
                    <TouchableOpacity
                      activeOpacity={styles.all.activeOpacity}
                      onPress={this.onDeleteImage.bind(null, index)}
                    >
                      <Image
                        source={require("../../img/deleteExpenseImage.png")}
                      />
                    </TouchableOpacity>
                  )}
                </Image>
              ))}
            </View>
          </ScrollView>
          <View style={styles.all.bottomView}>
            {[[strings.all.cancel], [strings.all.finish, !finishEnabled]].map(
              (value, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={styles.all.activeOpacity}
                  disabled={value[1]}
                  onPress={this.onPress.bind(null, index + 2)}
                  style={[
                    styles.all.logoBlueButton.container,
                    {
                      flexDirection: "row",
                      height: 40,
                      marginLeft: 0,
                      backgroundColor: value[1]
                        ? styles.all.textColorDisabled
                        : styles.all.logoBlueButton.container
                            .backgroundColor
                    }
                  ]}
                >
                  <Text style={styles.all.logoBlueButton.text}>
                    {value[0]}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
          <View style={{ position: "absolute", width: 3, backgroundColor: "#41C5F4", height: 30, left: "50%", bottom: 5, marginLeft: -1 }} />
        </View>
      </View>;
  }
}
