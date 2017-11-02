import React from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  TouchableWithoutFeedback,
  Alert,
  Platform,
  AsyncStorage,
} from 'react-native';
import Menu, { MenuTrigger } from 'react-native-popup-menu';

import utf8 from 'utf8';
import wtf8 from 'wtf-8';
import moment from 'moment';
import base64 from 'base64-js';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { autobind } from 'core-decorators';
import JourneySummary from './JourneySummary';
import { ListViewHelper, AlterStyles, ShareData } from '../react-native-common-utils';
import JourneyDetails from './JourneyDetails';
import AddExpense from './AddExpense';
import JourneyFilter from './JourneyFilter';
import DB from '../DB';
import SceneTitle from '../SceneTitle';
import JourneyPoint from '../JourneyPoint';
import BaseComponent from '../BaseComponent';
import StaticUtils from '../StaticUtils';

require('moment-duration-format');

const styles = require('../styles')('viewJourneys');
const strings = require('../strings')('viewJourneys');
const ENCODING = 'base64';
const PDF_MIME_TYPE = 'text/html';
/**
 * Detail.
 */
class Detail extends React.Component {
  render() {
    return (
      <View style={this.props.style}>
        <Text style={styles.largeText}>{String(this.props.valueLarge)}</Text>
        <Text style={styles.smallText}>
          {this.props.valueSmall || strings[this.props.isExpense ? 'noCode' : 'noReason']}
        </Text>
      </View>
    );
  }
}

// console.log(JSON.stringify(styles));
const MIN_HEIGHT = styles._caption.height + styles._title.height;

const MAX_HEIGHT =
  MIN_HEIGHT +
  styles.all.journeyDetails._container.height +
  styles.all.journeyDetails._buttons.height +
  styles.all.journeySummaryBlockSeparatorSize * 2;

/**
 * Journey.
 */
@autobind
export class Journey extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: true,
      height: new Animated.Value(MIN_HEIGHT),
    };
  }

  onSelect(rowid, key) {
    switch (key) {
      case 'edit':
        this.props.callbacks.get('onEdit')(rowid);
        break;

      case 'delete':
        Alert.alert(strings.all.appName, strings.promptDelete, [
          {
            text: strings.all.OK,
            onPress: () => {
              this.props.callbacks.get('onDelete')(rowid);
            },
          },
        ]);

        break;
    }
  }

  onSelectRow(rowid, readOnly) {
    console.log("success", rowid);
    this.props.callbacks.get('onSelect')(rowid,readOnly);
    
  }

  render() {
    console.log("this.props.nav", this.props.nav);
    return this.props.data.rowid ? (
      <TouchableWithoutFeedback
        onPress={() =>
          Animated.timing(this.state.height, {
            toValue: this.state.collapsed ? MAX_HEIGHT : MIN_HEIGHT,
          }).start(() => (this.state.collapsed ^= true))}
        onLongPress={this.props.callbacks.get('onPick').bind(null, this.props.data)}
      >
        <Animated.View style={[styles.container, { height: this.state.height }]}>
          <View
            style={new AlterStyles(styles.caption)
              .addProperty(
                'backgroundColor',
                !this.props.data.routeMode,
                styles.$noRouteModeCaptionColor,
              )
              .build()}
          >
            <Text style={styles.captionText}>{strings.journey}</Text>
            <Animated.View
              style={[
                styles.triangle,
                {
                  transform: [
                    {
                      rotate: this.state.height.interpolate({
                        inputRange: [MIN_HEIGHT, MAX_HEIGHT],
                        outputRange: ['0deg', '-180deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
          <View style={styles.title}>
            <Detail
              style={styles.date}
              valueLarge={this.props.data.points[0].getTimestamp('DD')}
              valueSmall={this.props.data.points[0].getTimestamp("MMM 'YY")}
            />
            <Detail
              style={styles.type}
              valueLarge={this.props.data.name}
              valueSmall={this.props.data.reason}
            />
            <Detail
              style={styles.sum}
              valueLarge={parseFloat(StaticUtils.getJourneyCost(
                this.props.data.rate,
                this.props.data.distance,
                this.props.data.metric,
              )).toFixed(2)}
              valueSmall={this.props.data.currency}
            />
            <Menu onSelect={this.onSelect.bind(null, this.props.data.rowid)}>
              <MenuTrigger>
                <Image source={require('../../img/viewJourneysMenu.png')} />
              </MenuTrigger>
              {StaticUtils.parseMenuOptions(strings.journeyMenuOptions, styles.all.menuOption)}
            </Menu>
          </View>
          <JourneyDetails
            readOnly
            nav={this.refs.nav}
            borderRadius={styles.$borderRadius}
            js={this.props.params.js}
            routeMode={this.props.data.routeMode}
            onSelect={this.onSelectRow.bind(this)}
            points={
              this.props.data.routeMode == 'actual' ? (
                [
                  this.props.data.points[0],
                  this.props.data.points[this.props.data.points.length - 1],
                ]
              ) : (
                this.props.data.points
              )
            }
            distance={this.props.data.distance}
            journeyType={this.props.data}
            duration={this.props.data.duration}
            notes={this.props.data.notes}
          />
        </Animated.View>
      </TouchableWithoutFeedback>
    ) : null;
  }
}

/**
 * Expense.
 */
@autobind
class Expense extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: true,
      height: new Animated.Value(MIN_HEIGHT),
    };
  }

  render() {
    const formatter = !this.props.data.length ? null : moment(this.props.data[0].millis);
    
    return formatter ? (
      <TouchableWithoutFeedback
        onPress={() =>
          Animated.timing(this.state.height, {
            toValue: this.state.collapsed ? MAX_HEIGHT : MIN_HEIGHT,
          }).start(() => (this.state.collapsed ^= true))}
      >
        <Animated.View style={[styles.container, { height: this.state.height }]}>
          <View style={styles.caption}>
            <Text style={styles.captionText}>{strings.expense}</Text>
            <Animated.View
              style={[
                styles.triangle,
                {
                  transform: [
                    {
                      rotate: this.state.height.interpolate({
                        inputRange: [MIN_HEIGHT, MAX_HEIGHT],
                        outputRange: ['0deg', '-180deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
          <View style={styles.title}>
            <Detail
              style={styles.date}
              valueLarge={formatter.format('DD')}
              valueSmall={formatter.format("MMM 'YY")}
            />
            <Detail
              style={styles.type}
              isExpense
              valueLarge={this.props.data[0].journeyTypeName}
              valueSmall={this.props.data[0].journeyTypeCode}
            />
            <Detail
              style={styles.type}
              valueLarge={parseFloat(this.props.data.reduce((p, c) => {
                return p + c.net + c.vat;
              }, 0)).toFixed(2)}
              valueSmall={this.props.data.currency}
            />
          </View>
          <JourneyDetails
            expensesOnly
            nav={this.props.nav}
            borderRadius={styles.$borderRadius}
            js={this.props.params.js}
            expenses={this.props.data}
          />
        </Animated.View>
      </TouchableWithoutFeedback>
    ) : null;
  }
}

/**
 * ViewJourneys.
 */
@autobind
export default class ViewJourneys extends BaseComponent {
  static emptyListItem = [Journey, {}];

  constructor(props) {
    super(props, 'ViewJourneys');

    this.props.route.headerMenuData = {
      options: strings.journeysMenuOptions,
      onSelect: this.onSelect,
    };

    this.state = {};

    this.lv = new ListViewHelper([ViewJourneys.emptyListItem]);
    this.lv.setCallback('onEdit', this.onEdit);
    this.lv.setCallback('onDelete', this.onDelete);
    this.lv.setCallback('onPick', this.onPick);
    this.lv.setCallback('onSelect',this.onSelectRow);
    this.lv.setStyle({ marginTop: styles.all.marginPadding });
    this.lv.setRowParams({ js: this.props.js });
  }
  
  componentDidMount() {
    this.loadJourneysAndStandaloneExpenses();
  }

  async loadJourneysAndStandaloneExpenses(period, from, to, journeyType, reason) {
    this.filteringParams =
      period === undefined ? undefined : { period, from, to, journeyType, reason };

    const compareJourneys = (j1Condition, j2Condition, time) => {
      if (j1Condition || j2Condition) {
        throw j1Condition == j2Condition ? time : j1Condition ? -1 : 1;
      }
    };

    const fromTo =
      from &&
      [from, to].map((dateTime) => dateTime.getTime() - dateTime.getTimezoneOffset() * 60 * 1000);

    const data = await DB.loadJourneysAndStandaloneExpenses(
      fromTo,
      journeyType && journeyType.rowid,
      reason,
      !this.props.route.inputParams || !this.props.route.inputParams.onPick,
    );

    data[0].sort((j1, j2) => {
      try {
        const time = j2.points[0].getTimestamp(null) - j1.points[0].getTimestamp(null);

        // = No route mode chosen = //
        compareJourneys(j1.routeMode == undefined, j2.routeMode == undefined, time);

        throw time;
      } catch (result) {
        return result;
      }
    });

    data[1].forEach((expenseGroup) => {
      const index = data[0].findIndex((element) => {
        let result = false;

        if (!Array.isArray(element) && !element.manual) {
          let date = new Date(element.points[0].millis);
          date = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
          date = Number(date);

          result = date < expenseGroup[0][0];
        }

        return result;
      });

      index == -1 ? data[0].push(expenseGroup[1]) : data[0].splice(index, 0, expenseGroup[1]);
    });

    if (!data[0].length) {
      this.lv.items = [ViewJourneys.emptyListItem];
    } else {
      this.lv.items.length = 0;

      data[0].forEach((element) => {
        console.log('data[0]',Array.isArray(element));
        this.lv.items.push([Array.isArray(element) ? Expense : Journey, element])}
      );

      // console.log(this.lv.items[0][1]);
      // console.log(this.lv.items[1][1]);
    }

    this.setState({ showFilters: false });
  }

  onEdit(rowid) {
    this.props.nav.push({
      className: JourneySummary,
      [BaseComponent.SET_CHILD]: this.setChild,
      inputParams: { rowid },
    });
  }

  onSelectRow(rowid,readOnly) {
    console.log('sadfsafdas',rowid,readOnly);
    this.props.nav.push({
      className: AddExpense,
      [BaseComponent.SET_CHILD]: undefined,
      inputParams: {
        rowid,
        readOnly: false,
        action: undefined,
      }
    });
  }

  async onDelete(rowid) {
    if (await DB.deleteJourney(rowid)) {
      this.lv.items.splice(
        this.lv.items.findIndex((item) => item[0] == Journey && item[1].rowid == rowid),
        1,
      );

      if (!this.lv.items.length) {
        this.lv.items = [ViewJourneys.emptyListItem];
      }

      this.forceUpdate();
    }
  }

  onPick(journey) {
    if (this.props.route.inputParams && this.props.route.inputParams.onPick) {
      this.props.nav.pop();
      this.props.route.inputParams.onPick(journey);

      
    }
  }

  onJourneyUpdated(data) {
    this.lv.items[
      this.lv.items.findIndex((item) => item[0] == Journey && item[1].rowid == data.rowid)
    ] = data;

    this.forceUpdate();
  }

  onSelect(key) {
    switch (key) {
      case 'export':
        this.export();
        break;

      case 'filter':
        this.setState({ showFilters: true });
        break;
    }
  }

  async export() {
    const html = {};
    const elements = [];
    const journeysCsv = [];
    const expensesCsv = [];
    const attachments = [];
    const attachmentsIos = [];
    const noReason = strings.noReason.replace('<', '&lt;');
    const noCode = strings.noCode.replace('<', '&lt;');
    let totalDuration = 0;
    let totalDistance = 0;
    let totalDistanceCost = 0;
    let totalExpenseNet = 0;
    let totalExpenseVat = 0;
    let currencys = '';

    try {
      if (Platform.OS === 'android') {
        html.template = await RNFS.readFileAssets('TimelineExport/template.html');
        html.journey = await RNFS.readFileAssets('TimelineExport/journey.html');
        html.expense = await RNFS.readFileAssets('TimelineExport/expense.html');
        html.totals = await RNFS.readFileAssets('TimelineExport/totals.html');
        html.standaloneExpense = await RNFS.readFileAssets('TimelineExport/standaloneExpense.html');
      } else {
        const flag = await RNFS.exists(`${RNFS.MainBundlePath}/template.html`);
        console.log(flag);
        if (flag === true) {
          console.log('read');
          console.log(`${RNFS.MainBundlePath}/template.html`);
          html.template = await RNFS.readFile(
            `${RNFS.MainBundlePath}/template.html`,
            'utf8',
          );
          html.journey = await RNFS.readFile(
            `${RNFS.MainBundlePath}/journey.html`,
            'utf8',
          );
          html.expense = await RNFS.readFile(
            `${RNFS.MainBundlePath}/expense.html`,
            'utf8',
          );
          html.standaloneExpense = await RNFS.readFile(
            `${RNFS.MainBundlePath}/standaloneExpense.html`,
            'utf8',
          );
          html.totals = await RNFS.readFile(
            `${RNFS.MainBundlePath}/totals.html`,
            'utf8',
          );
        } else {
          console.log('write');
          console.log(`${RNFS.MainBundlePath}/template.html`);
        }
      }
    } catch (error) {
      alert(error);

      return;
      
    }

    const formatExpenses = async (expenseArray) => {
      const expenses = [];

      for (let ei = 0; ei < expenseArray.length; ei++) {
        const expense = expenseArray[ei];
        const links = await DB.loadExpenseImagesPathId(expense.rowid);

        for (let li = 0; li < links.length; li++) {
          const link = links[li];
          let text;

          if (link.id) {
            const href = `https://drive.google.com/file/d/${link.id}/view`;
            text = `<a href="${href}">${strings.clickHere}</a>`;
          } else {
            const href = link.path.substring(link.path.lastIndexOf('/') + 1);

            text = `${href} attached`;

            attachments.push({
              fileName: href,
              uri: link.path,
            });
            // attachmentsIos.push({
            //    url: link.path,
            //  });
          }

          links[li] = text;
        }
        totalExpenseNet += expense.net;
        totalExpenseVat += expense.vat;
        currencys = expense.currency;
        expenses.push(
          html.expense
            .replace('$index$', ei + 1)
            .replace('$type$', expense.type)
            .replace('$code$', expense.code || '')
            .replace('$reason$', expense.reason || '')
            .replace('$date$', moment(expense.millis).format('DD-MM-YYYY'))
            .replace('$net$', parseFloat(StaticUtils.round(expense.net, 2)).toFixed(2))
            .replace('$vat$', parseFloat(StaticUtils.round(expense.vat, 2)).toFixed(2))
            .replace('$total$', parseFloat(StaticUtils.round(expense.net + expense.vat, 2)).toFixed(2))
            .replace('$links$', links.join(' ')),
        );
      }

      return expenses;
    };

    const addExpensesCsv = async (expenses) => {
      for (const expense of expenses) {
        const csv = [];
        const links = await DB.loadExpenseImagesPathId(expense.rowid);

        csv.push('Expense');
        csv.push(expense.linkedTo);
        csv.push(expense.rowid);
        csv.push(expense.journeyTypeName);
        csv.push(expense.journeyTypeCode);
        csv.push(expenses.reason);
        csv.push(expense.type);
        csv.push(expense.millis);
        csv.push(parseFloat(StaticUtils.round(expense.net, 2)).toFixed(2));
        csv.push(parseFloat(StaticUtils.round(expense.vat, 2)).toFixed(2));
        csv.push(parseFloat(StaticUtils.round(expense.net + expense.vat, 2)).toFixed(2));
        csv.push(expense.currency);

        for (const link of links) {
          csv.push(link.id || link.path.substring(link.path.lastIndexOf('/') + 1));
        }

        expensesCsv.push(csv.join(','));
      }
    };

    for (const element of this.lv.items) {
      console.log('-------------------------');
      console.log(element[1]);
      if (Array.isArray(element[1])) {
        const duration = moment
          .duration(element[1].duration, 'seconds')
          .format(JourneyPoint.TIME_FORMAT, { trim: false });

        const distance = [
          StaticUtils.round(
            StaticUtils.metersToDistance(element[1].distance, element[1].metric),
            2,
          ),
          strings[element[1].metric ? 'km' : 'mi'],
        ];

        const rate = StaticUtils.round(element[1].rate, 2);

        const cost = StaticUtils.getJourneyCost(
          element[1].rate,
          element[1].distance,
          element[1].metric,
        );
        totalDistance += StaticUtils.metersToDistance(element[1].distance, element[1].metric);
        totalDistanceCost += cost;
        totalDuration += element[1].duration;

        elements.push(
          html.standaloneExpense
            .replace('$date$', moment(element[1][0].millis).format('dddd MMMM DD, YYYY'))
            .replace('$journeyTypeName$', element[1][0].journeyTypeName)
            .replace('$totalCost$', `${parseFloat(cost).toFixed(2)} GBP`)
            .replace('$journeyTypeCode$', element[1][0].journeyTypeCode || noCode)
            .replace('$expenses$', (await formatExpenses(element[1])).join('\n')),
        );

        await addExpensesCsv(element[1]);
      } else {
        const isActual = element[1].routeMode.valueOf() == 'actual';

        const duration = moment
          .duration(element[1].duration, 'seconds')
          .format(JourneyPoint.TIME_FORMAT, { trim: false });

        const distance = [
          StaticUtils.round(
            StaticUtils.metersToDistance(element[1].distance, element[1].metric),
            2,
          ),
          strings[element[1].metric ? 'km' : 'mi'],
        ];

        const rate = StaticUtils.round(element[1].rate, 2);

        const cost = StaticUtils.getJourneyCost(
          element[1].rate,
          element[1].distance,
          element[1].metric,
        );
        totalDistance += StaticUtils.metersToDistance(element[1].distance, element[1].metric);
        totalDistanceCost += cost;
        totalDuration += element[1].duration;
        let tempCost = 0;
        for (let ei = 0; ei < element[1].expenses.length; ei++) {
          const expense = element[1].expenses[ei];
          tempCost += expense.net + expense.vat;
        }
        totalDistanceCost += tempCost;
        elements.push(
          html.journey
            .replace('$date$', moment(element[1].points[0].millis).format('dddd MMMM DD, YYYY'))
            .replace('$journeyTypeName$', element[1].name)
            .replace('$journeyReason$', element[1].reason || noReason)
            .replace('$journeyTypeCode$', element[1].code || noCode)
            .replace('$postcode1$', element[1].points[0].postcode)
            .replace(
              '$postcode2$',
              isActual || element[1].points.length < 3 ? '' : element[1].points[1].postcode,
            )
            .replace(
              '$postcode3$',
              isActual || element[1].points.length < 4 ? '' : element[1].points[2].postcode,
            )
            .replace('$postcode4$', element[1].points[element[1].points.length - 1].postcode)
            .replace('$duration$', duration)
            .replace('$distance$', `${distance[0]}${distance[1]}`)
            .replace('$journeyTypeRate$', `${parseFloat(rate).toFixed(2)} GBP/${distance[1]}`)
            .replace('$cost$', `${parseFloat(cost).toFixed(2)} GBP`)
            .replace('$routeMode$', element[1].routeMode)
            .replace('$greenBarStyle$', element[1].expenses.length ? '' : 'style="display: none"')
            .replace('$totalCost$', parseFloat(StaticUtils.round(tempCost, 2)).toFixed(2))
            .replace('$expenses$', (await formatExpenses(element[1].expenses)).join('\n')),
        );

        const csv = [];

        csv.push('Journey');
        csv.push(element[1].rowid);
        csv.push(element[1].name);
        csv.push(element[1].code);
        csv.push(element[1].reason);
        csv.push(element[1].points[0].postcode);

        csv.push(isActual || element[1].points.length < 3 ? '' : element[1].points[1].postcode);

        csv.push(isActual || element[1].points.length < 4 ? '' : element[1].points[2].postcode);

        csv.push(element[1].points[element[1].points.length - 1].postcode);
        csv.push(element[1].points[0].millis);
        csv.push(duration);
        csv.push(element[1].currency);
        csv.push(parseFloat(element[1].rate).toFixed(2));
        csv.push(element[1].distance);
        csv.push(element[1].metric);
        csv.push(parseFloat(StaticUtils.round(element[1].rate * element[1].distance, 2)).toFixed(2));
        csv.push(element[1].type);
        csv.push(element[1].notes);

        journeysCsv.push(csv.join(','));

        await addExpensesCsv(element[1].expenses);
      }
    }
    const durations = moment
      .duration(totalDuration, 'seconds')
      .format(JourneyPoint.TIME_FORMAT, { trim: false });
    elements.reverse();
    let valCurrency = await AsyncStorage.getItem('currencys');
      if (valCurrency === null || valCurrency === undefined) {
        valCurrency = "GBP";
      }
    elements.push(
      html.totals
        .replace('$distance1$', `${StaticUtils.round(totalDistance, 2)}`)
        .replace('$distance2$', `${parseFloat(StaticUtils.round(totalDistanceCost, 2)).toFixed(2)} ${valCurrency}`)
        .replace('$duration$', durations)
        .replace('$expense1$', `${parseFloat(StaticUtils.round(totalExpenseNet, 2)).toFixed(2)} ${valCurrency}`)
        .replace('$expense2$', `${parseFloat(StaticUtils.round(totalExpenseVat, 2)).toFixed(2)} ${valCurrency}`)
        .replace('$expense3$', `${parseFloat(StaticUtils.round(totalExpenseNet + totalExpenseVat, 2)).toFixed(2)} ${valCurrency}`),
    );
    elements.reverse();
    
    attachments.unshift({
      fileName: strings.subject,
      fileExtension: 'html',
      base64: base64.fromByteArray(
        new Uint8Array(
          StaticUtils.encodedUtf8ToByteArray(
            wtf8.encode(
              html.template
                .replace('$elements$', elements.join('\n'))
                .replace('$journeysCsv$', journeysCsv.join('<br>'))
                .replace('$expensesCsv$', expensesCsv.join('<br>')),
            ),
          ),
        ),
      ),
    });
    attachmentsIos.unshift({
      url: `data:${PDF_MIME_TYPE};${ENCODING},${base64.fromByteArray(
        new Uint8Array(
          StaticUtils.encodedUtf8ToByteArray(
            wtf8.encode(
              html.template
                .replace("$elements$", elements.join("\n"))
                .replace("$journeysCsv$", journeysCsv.join("<br>"))
                .replace("$expensesCsv$", expensesCsv.join("<br>"))
            )
          )
        )
      )}`
    });
    // attachmentsIos.unshift({
    //   url: `data:${PDF_MIME_TYPE};${ENCODING},${base64.fromByteArray(
    //     new Uint8Array(
    //       StaticUtils.encodedUtf8ToByteArray(
    //         wtf8.encode(
    //           html.template
    //             .replace('$elements$', elements.join('\n'))
    //             .replace('$journeysCsv$', journeysCsv.join('<br>'))
    //             .replace('$expensesCsv$', expensesCsv.join('<br>')),
    //         ),
    //       ),
    //     ),
    //   )}`,
    // });
    if (Platform.OS === 'android') {
      ShareData.send({
        mime: "text/html",
        subject: strings.subject,
        attachments
      }).catch(alert);
    }
    else {
            // ShareData.send({
            //   mime: "text/html",
            //   subject: strings.subject,
            //   attachments
            // }).catch(alert);
      Share.open({
        type: 'text/html',
        subject: strings.subject,
        message: 'Totals',
        attachmentsIos,
      });
    }
  }

  render() {

    return (
      <View style={{ flex: 1 }}>
        <SceneTitle title={strings.title} />
        {this.state.showFilters ? (
          <JourneyFilter parent={this} inputParams={this.filteringParams} />
        ) : null}
        {this.lv.createListView()}
      </View>
    );
  }
}
