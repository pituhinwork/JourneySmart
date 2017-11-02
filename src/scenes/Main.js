/**
 * @flow
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  PanResponder,
  Platform,
  ScrollView,
  AsyncStorage,
  Dimensions,
} from "react-native";
import Navigator from '../react-native-deprecated-custom-components/src/Navigator';
import Spinner from 'react-native-spinkit';
import Permissions from 'react-native-permissions';
import moment from 'moment';
import { EventRegister } from 'react-native-event-listeners';
import { autobind } from 'core-decorators';
// import {BackgroundTimer as timer} from "react-native-background-timer";
import timer from 'react-native-timer';
import { Preferences, ListViewHelper } from '../react-native-common-utils';
import StartJourney from './StartJourney';
import AddExpense from './AddExpense';
import AddJourney from './AddJourney';
import JourneySummary from './JourneySummary';
import DB from '../DB';
import BT from '../Bluetooth';
import BaseComponent from '../BaseComponent';
import StaticUtils from '../StaticUtils';
import { purchase, isPurchased } from '../Billing';
import JourneyPoint from '../JourneyPoint';
import Journey from './ViewJourneys';
import Expense from './ViewJourneys';

import SetupComponent from './Setup';

const strings = require('../strings')('main');
const styles = require('../styles')('main');

/**
 * StatisticsArea.
 */
class StatisticsArea extends React.Component {
  render() {
    return (
      <View style={styles.statisticsSubArea}>
        <Text style={styles.statisticsValue}>{String(this.props.value)}</Text>
        <Text style={styles.statisticsTitle}>{this.props.title}</Text>
      </View>
    );
  }
}

StatisticsArea.propTypes = {
  value: PropTypes.any.isRequired,
  title: PropTypes.string.isRequired,
};

/**
 CurrentRouteIndicator.
 */
class CurrentRouteIndicator extends React.Component {
  static propTypes = {
    count: PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = { current: 0 };
  }

  render() {
    const elements = [];

    for (let i = 0; i < this.props.count; i++) {
      elements.push(
        <View
          key={i}
          style={[
            styles.currentRouteIndicatorElement,
            {
              marginLeft: i ? styles._currentRouteIndicator.marginTop : 0,
              backgroundColor:
                this.state.current == i
                  ? styles.$currentRouteIndicatorElementColorCurrent
                  : styles.$currentRouteIndicatorElementColor,
            },
          ]}
        />,
      );
    }

    return <View style={styles.currentRouteIndicator}>{elements}</View>;
  }
}

/**
 * Main.
 */
@autobind
export default class Main extends BaseComponent {
  constructor(props) {
    super(props, 'Main');
    const _panResponder = {};
    const _gestureResponder = {};
    this.statRoutes = [];

    for (let i = 0; i < 3; i++) {
      this.statRoutes.push({ index: i });
    }
    this.lv = new ListViewHelper([[Journey, {}]]);
    this.requestId = 0;
    this.forbiddenRequests = new Set();
    this.todayHours = 0;
    this.todayMiles = 0;
    this.todayExpenses = 0;
    this.thisWeekHours = 0;
    this.thisWeekMiles = 0;
    this.thisWeekExpenses = 0;
    this.thisMonthHours = 0;
    this.thisMonthMiles = 0;
    this.thisMonthExpenses = 0;
    this.repeated = 1;
    this.initialState = {
      allowJourneyStartedIcon: true,
      datas: null,
      purchased: false,
      journeyCount: -1,
      className: null,
      action: null,
      dateChanged: 0,
      journeyStarted: false,
      autoStartEnabled: false,
      alertShow: 0,
      current: 0,
      autoPurchased: 0,
    };
    this.state = this.initialState;
  }

  componentWillMount() {
    super.componentWillMount();
    this.calc();

    this.getPurchasedState();
    BT.addNotificationActionListener(this.onNotificationAction);
    BT.addConnectionStateChangedListener(this.onConnectionStateChanged);
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
    });
    this._gestureResponder = PanResponder.create({
      onMoveShouldSetPanResponder: this._handleStartShouldSetPanResponderPage,
    })
    this.calcCalled = EventRegister.addEventListener('storageChanged', () => {
        this.calc();
      }
    );
    this.setupListener = EventRegister.addEventListener('startJourney', () => {
      console.log(this.state.journeyStarted,this.state.autoStartEnabled);
      if (this.state.journeyStarted === false && this.state.autoStartEnabled === true) {
        this.setState({ journeyStarted: true });
        AsyncStorage.setItem('journeyStarted', '1');
        EventRegister.emit("storageChanged");
        this.handleStartEvent();
        console.log('started');
        //    timer.clearInterval(this); // clears all intervals for a context
      }
    });
  }
  async calc() {
    let res = await AsyncStorage.getItem('autoStart');
    this.setState({ autoStartEnabled: res === '1' });
    res = await AsyncStorage.getItem('journeyStarted');
    this.setState({ journeyStarted: res === '1' });

  }

  handleStartEvent() {
    this.setState({ autoPurchased: 1 });
    this.showScene(StartJourney, null);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    EventRegister.removeEventListener(this.setupListener);
    EventRegister.removeEventListener(this.calcCalled);
    BT.removeNotificationActionListener(this.onNotificationAction);
    BT.removeConnectionStateChangedListener(this.onConnectionStateChanged);

    this.forbidCurrentRequest();
    timer.clearInterval(this);
  }

  componentDidMount() {
  //  if (Platform.OS !== 'android') {
      Permissions.request('bluetooth').then((response) => {});
      Permissions.request('location', 'always').then((response) => {console.log('locaion',response)});
  //  }

    timer.setInterval(
      this,
      'hideMsg',
      () => {
        this.loadJourneysAndStandaloneExpensesDelta();
        this.calc();
      },
      3000,
    );
    // this.setTimeout(() => {
    //   console.log('I do not leak!');
    // }, 1000);
    // const args = {
    //   className: Expense,
    //   [BaseComponent.SET_CHILD]: undefined
    // };
    // console.log('--------------');
    // console.log(this.props);
    // this.props.nav.push(args);
  }

  getPurchasedState() {
    isPurchased().then((purchased) => {
      if (Platform.OS === 'android') {
        this.setState({ purchased });
      } else {
        console.log(purchased.result);
        this.setState({ purchased: purchased.result });
      }
    });
  }

  async loadJourneysAndStandaloneExpenses(period, from, to, journeyType, reason) {
    this.getPurchasedState();

    this.filteringParams =
      period == undefined ? undefined : { period, from, to, journeyType, reason };

    const compareJourneys = (j1Condition, j2Condition, time) => {
      if (j1Condition || j2Condition) {
        throw j1Condition == j2Condition ? time : j1Condition ? -1 : 1;
      }
    };

    const fromTo =
      from &&
      [from, to].map(dateTime => dateTime.getTime() - dateTime.getTimezoneOffset() * 60 * 1000);

    const data = await DB.loadJourneysAndStandaloneExpenses(
      fromTo,
      journeyType && journeyType.rowid,
      reason,
      !this.props.route.inputParams || !this.props.route.inputParams.onPick,
    );
    this.setState({ journeyCount: data[0].length });
    this.setState({ datas: data[1] });

    const addExpense = this.state.className === AddExpense;
    if (!addExpense) {
      this.setState({ chooseImageType: false });
    }
    if (this.state.className === StartJourney || this.state.className === AddJourney) {
      if (data[0].length >= 3 && this.state.purchased === false) {
        if (this.state.autoPurchased !== 0 && this.state.alertShow !== 0) {
          AsyncStorage.setItem('journeyStarted', '0');
          EventRegister.emit("storageChanged");
          this.setState({ journeyStarted: false });
          this.setState({ autoPurchased: 0 });
          return;
        }
        this.setState({ autoPurchased: 0 });
        this.setState({ alertShow: 1 });
        this.setState({ journeyStarted: false });
        AsyncStorage.setItem('journeyStarted', '0');
        EventRegister.emit("storageChanged");
        alert(
          'Thanks for using JourneySmart, you have completed 3 trial journeys, great! To continue saving money with JourneySmart please subscribe.',
        );
        purchase();
        return;
      }
    }

    this.showScreen(this.state.className, this.state.action);
  }

  onNotificationAction(data) {
    const routes = this.props.nav.getCurrentRoutes();
    if (routes[routes.length - 1].className === StartJourney) {
      this.child.onNotificationAction(data);
    } else {
      this.showScene(StartJourney, data.action.valueOf() === 'content' ? null : data.action);
    }
  }

  onConnectionStateChanged(state) {
    if (state.connected != !!Preferences.currentJourney.rowid.getValue()) {
      this.onNotificationAction({
        action: state.connected ? 'content' : 'finish',
      });
    }
  }

  requestHandlingAllowed(requestId) {
    const error = !Preferences.currentJourney.rowid.getValue()
      ? `Request #${requestId}: no current journey.`
      : this.forbiddenRequests.has(requestId) ? `Request #${requestId} was forbidden.` : null;

    this.forbiddenRequests.delete(requestId);

    return error == null ? true : (console.log(error), false);
  }

  forbidCurrentRequest() {
    if (this.timeoutId != undefined) {
      clearTimeout(this.timeoutId);

      this.timeoutId = undefined;

      console.log(`Request #${this.requestId} unqueued.`);

      this.requestId--;
    } else if (this.requestSent) {
      this.forbiddenRequests.add(this.requestId);

      console.log('Forbidden request ids: ' + `${JSON.stringify([...this.forbiddenRequests])}`);
    } else {
      console.log('Nothing to forbid.');
    }
  }

  setAllowJourneyStartedIcon(allow) {
    this.state.allowJourneyStartedIcon = allow;
  }

  setTimeout() {
    this.requestId += 1;

    this.timeoutId = setTimeout(
      this.getPosition,
      Preferences.routes.geolocation.timeout.getValue(),
    );

    console.log(`Request #${this.requestId} queued.`);
  }

  async getPosition() {
    if (this.timeoutId !== undefined) {
      console.log(`Request #${this.requestId} delivered.`);
    }

    const status = await Permissions.request('location', 'always');

    if (status !== 'authorized') {
      alert(strings.locationPermissionMissing);
    } else {
      const requestId =
        this.timeoutId === undefined
          ? ++this.requestId
          : ((this.timeoutId = undefined), this.requestId);

      if (this.requestHandlingAllowed(requestId)) {
        navigator.geolocation.getCurrentPosition(
          this.processPosition.bind(null, requestId),
          this.processPositionError.bind(null, requestId),
          {
            timeout: Preferences.routes.geolocation.timeout.getValue(),
            maximumAge: Preferences.routes.geolocation.maximumAge.getValue(),
          },
        );

        this.requestSent = true;

        console.log(`Request #${requestId} sent.`);

        if (this.noLocationProvider) {
          setTimeout(() => this.requestSent && this.child && this.child.clearError(), 100);
        }
      }
    }
  }

  async processPosition(requestId, position) {
    this.requestSent = false;

    if (this.requestHandlingAllowed(requestId)) {
      console.log(`Request #${requestId} succeeded.`);

      if (DB.isActualRouteModeUsed() && !Preferences.routes.routeMode.actual.getValue()) {
        console.log('actualRouteModeUsedDisabled');

        this.child && this.child.processError('actualRouteModeUsedDisabled');
      } else {
        const point = new JourneyPoint({
          millis: position.timestamp,
          tzOffsetMillis: new Date().getTimezoneOffset() * 60 * 1000,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        console.log(`lat: ${point.getLatitude()}; ` + `lng: ${point.getLongitude()}`);

        this.child && this.child.clearError();

        const process =
          (await DB.addCurrentJourneyPoint(point)) &&
          (!DB.isActualRouteModeUsed() ||
            Preferences.currentJourney.firstPointRowid.getValue() == point.getRowId() ||
            this.finishRequested);

        if (process) {
          this.child && this.child.processPoint(point);

          try {
            this.parseAddress(point, await (await StaticUtils.latLngToAddress(point)).json());
          } catch (error) {
            console.log(error);

            this.child && this.child.processError(error);

            this.safeLaunchJourneySummary();
          }
        }
      }

      if (DB.isActualRouteModeUsed() && !this.finishRequested) {
        this.setTimeout();
      }
    }
  }

  processPositionError(requestId, error) {
    this.requestSent = false;

    if (this.requestHandlingAllowed(requestId)) {
      console.log(`Request #${requestId} failed: ${JSON.stringify(error)}.`);

      if (this.child) this.child.processError(error);

      this.noLocationProvider = error === 'No available location provider.';

      error.code === 3 ? this.getPosition() : this.setTimeout();
    }
  }

  async parseAddress(point, response) {
    const pointNum = point.getRowId() - Preferences.currentJourney.firstPointRowid.getValue() + 1;

    console.log(
      'Main. Parse address response status for point ' +
        `${Preferences.currentJourney.rowid.getValue()}.${pointNum}: ` +
        `${response.status}.`,
    );

    let error = true;

    switch (response.status) {
      case 'ZERO_RESULTS':
        if (this.child) this.child.processError('reverseGeocodeZeroResults');
        break;

      case 'OK': {
        error = false;

        StaticUtils.setAddress(point, response);

        const rowid = Preferences.currentJourney.rowid.getValue();

        if (await DB.updateJourneyPoint(rowid, point)) {
          this.child && this.child.forceUpdate();

          this.safeLaunchJourneySummary(rowid);
        }

        break;
      }
      default:
        break;
    }

    error && this.finishRequested && DB.finishJourney();
  }

  isFinishRequested() {
    return this.finishRequested;
  }

  resetFinishRequested() {
    this.finishRequested = false;
  }

  requestFinish() {
    this.finishRequested = true;
    !this.child && this.showScene(StartJourney);
  }

  _handleStartShouldSetPanResponder(e, gestureState) {
    // Should we become active when the user presses down on the circle?
    if (this.state.chooseImageType === true) {
      this.setState({ chooseImageType: false });
    }
    return false;
  }

  // _handleStartShouldSetPanResponderPage(e, gestureState) {
  //   // Should we become active when the user presses down on the circle?
  //   if (this.repeated === gestureState._accountsForMovesUpTo) {
  //     return;
  //   }
  //   this.repeated = gestureState._accountsForMovesUpTo;
  //   let current = this.state.current;
  //   if (gestureState.dx > 100) {
  //     current -= 1;
  //     if (current < 0) {
  //       current = 0;
  //     }
  //     this.setState({current: current});
  //     this.setState({dateChanged: this.state.dateChanged + 1});
  //   }
  //   else if (gestureState.dx < -100){
  //     current += 1;
  //     if (current > 2) {
  //       current = 2;
  //     }
  //       this.setState({ current: current });
  //       this.setState({ dateChanged: this.state.dateChanged + 1 });
  //   }

  // }

  showAddExpense() {
    timer.setTimeout(
      this,
      'addExpense',
      () => {
        this.setState({ chooseImageType: true });
        this.showScreen(AddExpense, AddExpense.IMAGE_PICK[0]);
        timer.clearTimeout();
      },
      2000,
    );
  }

  async showScreen(className, action = null) {
    const addExpense = className === AddExpense;
    if (addExpense && !this.state.chooseImageType) {
      this.setState({ chooseImageType: true });
    } else {
      if (addExpense) {
        this.setState({ chooseImageType: false });
        this.expenseTypes = await DB.getExpenseTypes();

        if (!this.expenseTypes.length) {
          alert('Please add at least one expense type');
          return;
        }
      }
      

      const args = {
        className,
        inputParams: action ? { action } : undefined,
        [BaseComponent.SET_CHILD]: className == StartJourney ? this.setChild : undefined,
      };

      this.props.nav.push(args);
    }
  }

  showScene(className, action = null) {
    if (className === StartJourney) {
      AsyncStorage.setItem('journeyStarted', '1');
      EventRegister.emit("storageChanged");
    }
    if (this.state.chooseImageType === true) {
      //      this.setState({ chooseImageType: false });
    }
    this.setState({ className, action });
    this.loadJourneysAndStandaloneExpenses();
  }

  safeLaunchJourneySummary(rowid = Preferences.currentJourney.rowid.getValue()) {
    if (this.finishRequested) {
      DB.finishJourney();
      if (this.child) {
        this.props.nav.replace({
          className: JourneySummary,
          inputParams: { rowid },
        });
      } else {
        this.props.nav.push({
          className: JourneySummary,
          inputParams: { rowid },
        });
      }
      this.loadJourneysAndStandaloneExpensesDelta();
    }
  }

  async loadJourneysAndStandaloneExpensesDelta(period, from, to, journeyType, reason) {
    this.filteringParams =
      period === undefined ? undefined : { period, from, to, journeyType, reason };

    const compareJourneys = (j1Condition, j2Condition, time) => {
      if (j1Condition || j2Condition) {
        throw j1Condition === j2Condition ? time : j1Condition ? -1 : 1;
      }
    };

    const fromTo =
      from &&
      [from, to].map(dateTime => dateTime.getTime() - dateTime.getTimezoneOffset() * 60 * 10000);

    const data = await DB.loadJourneysAndStandaloneExpenses(
      fromTo,
      journeyType && journeyType.rowid,
      reason,
      !this.props.route.inputParams || !this.props.route.inputParams.onPick,
    );
    if (data[0].length !== 0) {
      await data[0].sort((j1, j2) => {
        try {
          const time = j2.points[0].getTimestamp(null) - j1.points[0].getTimestamp(null);

          // = No route mode chosen = //
          compareJourneys(j1.routeMode == undefined, j2.routeMode == undefined, time);

          throw time;
        } catch (result) {
          return result;
        }
      });

      await data[1].forEach((expenseGroup) => {
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
    } else {
      return;
    }

    if (!data[0].length) {
      this.lv.items = [Journey, {}];
    } else {
      if (this.lv.items.length !== 0) {
        this.lv.items = [Journey, {}];
        this.lv.items.length = 0;
        this.todayHours = 0;
        this.todayMiles = 0;
        this.todayExpenses = 0;
        this.thisWeekHours = 0;
        this.thisWeekMiles = 0;
        this.thisWeekExpenses = 0;
        this.thisMonthHours = 0;
        this.thisMonthMiles = 0;
        this.thisMonthExpenses = 0;
      }

      data[0].forEach(element =>
        this.lv.items.push([Array.isArray(element) ? Expense : Journey, element]),
      );
    }

    const currentDate = new Date();

    const tempWeekDate = new Date();
    while (true) {
      if (tempWeekDate.toDateString().search('Mon') !== -1) {
        break;
      }
      tempWeekDate.setDate(tempWeekDate.getDate() - 1);
    }

    const tempMonthDate = new Date();
    tempMonthDate.setDate(1);

    tempWeekDate.setHours(0);
    tempWeekDate.setMinutes(0);
    tempWeekDate.setSeconds(0);

    tempMonthDate.setHours(0);
    tempMonthDate.setMinutes(0);
    tempMonthDate.setSeconds(0);

    currentDate.setHours(0);
    currentDate.setMinutes(0);
    currentDate.setSeconds(0);

    for (const element of this.lv.items) {
      if (Array.isArray(element[1])) {
      } else {
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
        const date = new Date(element[1].points[0].millis);

        let tempCost = 0;
        for (let ei = 0; ei < element[1].expenses.length; ei++) {
          const expense = element[1].expenses[ei];
          tempCost += expense.net + expense.vat;
        }

        if (date - currentDate > 0) {
          this.todayHours += element[1].duration;
          this.todayMiles += StaticUtils.metersToDistance(element[1].distance, element[1].metric);
          this.todayExpenses += tempCost;
        }

        if (date - tempWeekDate > 0) {
          this.thisWeekHours += element[1].duration;
          this.thisWeekMiles += StaticUtils.metersToDistance(
            element[1].distance,
            element[1].metric,
          );
          this.thisWeekExpenses += tempCost;
        }

        if (date - tempMonthDate > 0) {
          this.thisMonthHours += element[1].duration;
          this.thisMonthMiles += StaticUtils.metersToDistance(
            element[1].distance,
            element[1].metric,
          );
          this.thisMonthExpenses += tempCost;
        }
      }
    }
    this.setState({ dateChanged: this.state.dateChanged + 1 });
  }

  renderStatistics(route) {
    let hours, hours1, hours2;
    let miles, miles1, miles2;
    let expenses, expenses1, expenses2;
    const todayDuration = moment
      .duration(this.todayHours, 'seconds')
      .format(JourneyPoint.TIME_FORMAT, { trim: false });
    const thisWeekDuration = moment
      .duration(this.thisWeekHours, 'seconds')
      .format(JourneyPoint.TIME_FORMAT, { trim: false });
    const thisMonthDuration = moment
      .duration(this.thisMonthHours, 'seconds')
      .format(JourneyPoint.TIME_FORMAT, { trim: false });
//    switch (this.state.current) {
//      case 0:
        hours = todayDuration;
        miles = `${StaticUtils.round(this.todayMiles, 2)}`;
        expenses = `£${parseFloat(StaticUtils.round(this.todayExpenses, 2)).toFixed(2)}`;
 //       break;

 //     case 1:
        hours1 = thisWeekDuration;
        miles1 = `${StaticUtils.round(this.thisWeekMiles, 2)}`;
        expenses1 = `£${parseFloat(StaticUtils.round(this.thisWeekExpenses, 2)).toFixed(2)}`;
 //       break;

 //     default:
        // strings.all.settings.periods[route.index] = moment().format("MMMM");
        hours2 = thisMonthDuration;
        miles2 = `${StaticUtils.round(this.thisMonthMiles, 2)}`;
        expenses2 = `£${parseFloat(StaticUtils.round(this.thisMonthExpenses, 2)).toFixed(2)}`;
//        break;
//    }

    return (
      <View style={styles.statisticsButton}>
        <ScrollView
            horizontal
            scrollEnabled={true}
            onScroll={this.calcPage.bind(this)}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{flex:1}}
        >
          <View style={{width: Dimensions.get("window").width - 30}}>
            <Text style={styles.statisticsPeriod}>{strings.all.settings.periods[0]}</Text>
            <View style={styles.statisticsArea}>
              <StatisticsArea value={hours} title="hours travel" />
              <StatisticsArea value={miles} title="miles" />
              <StatisticsArea value={expenses} title="expenses" />
            </View>
          </View>
          <View style={{width: Dimensions.get("window").width - 30}}>
            <Text style={styles.statisticsPeriod}>{strings.all.settings.periods[1]}</Text>
            <View style={styles.statisticsArea}>
              <StatisticsArea value={hours1} title="hours travel" />
              <StatisticsArea value={miles1} title="miles" />
              <StatisticsArea value={expenses1} title="expenses" />
            </View>
          </View>
          <View style={{width: Dimensions.get("window").width - 30}}>
            <Text style={styles.statisticsPeriod}>{strings.all.settings.periods[2]}</Text>
            <View style={styles.statisticsArea}>
              <StatisticsArea value={hours2} title="hours travel" />
              <StatisticsArea value={miles2} title="miles" />
              <StatisticsArea value={expenses2} title="expenses" />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }
  calcPage(event) {
    let temp = event.nativeEvent.contentOffset.x / (Dimensions.get("window").width - 30);
    console.log(event.nativeEvent.contentOffset.x, Dimensions.get("window").width - 30);
    console.log(temp);
    this.setState({ current: temp });
    const cri = this.refs.cri;
    cri.setState({ current: temp });
  }
  // onWillFocus(route) {
  //   const cri = this.refs.cri;
  //   console.log('cri',cri);
  //   if (cri) {
  //     cri.setState({ current: route.index });
  //     this.setState({ dateChanged: this.state.dateChanged + 1 });
  //   }
  // }

  render() {
            let hours, hours1, hours2;
    let miles, miles1, miles2;
    let expenses, expenses1, expenses2;
    const todayDuration = moment
      .duration(this.todayHours, 'seconds')
      .format(JourneyPoint.TIME_FORMAT, { trim: false });
    const thisWeekDuration = moment
      .duration(this.thisWeekHours, 'seconds')
      .format(JourneyPoint.TIME_FORMAT, { trim: false });
    const thisMonthDuration = moment
      .duration(this.thisMonthHours, 'seconds')
      .format(JourneyPoint.TIME_FORMAT, { trim: false });
//    switch (this.state.current) {
//      case 0:
        hours = todayDuration;
        miles = `${StaticUtils.round(this.todayMiles, 2)}`;
        expenses = `£${parseFloat(StaticUtils.round(this.todayExpenses, 2)).toFixed(2)}`;
 //       break;

 //     case 1:
        hours1 = thisWeekDuration;
        miles1 = `${StaticUtils.round(this.thisWeekMiles, 2)}`;
        expenses1 = `£${parseFloat(StaticUtils.round(this.thisWeekExpenses, 2)).toFixed(2)}`;
 //       break;

 //     default:
        // strings.all.settings.periods[route.index] = moment().format("MMMM");
        hours2 = thisMonthDuration;
        miles2 = `${StaticUtils.round(this.thisMonthMiles, 2)}`;
        expenses2 = `£${parseFloat(StaticUtils.round(this.thisMonthExpenses, 2)).toFixed(2)}`;
//        break;
//    }
    return (
      <View
        style={{ flex: 1, margin: styles.all.marginPadding }}
        {...this._panResponder.panHandlers}
      >
        
        <View style={styles.statisticsButton}>
          <ScrollView
              horizontal
              scrollEnabled={true}
              onScroll={this.calcPage.bind(this)}
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{flex:1}}
          >
            <View style={{width: Dimensions.get("window").width - 30}}>
              <Text style={styles.statisticsPeriod}>{strings.all.settings.periods[0]}</Text>
              <View style={styles.statisticsArea}>
                <StatisticsArea value={hours} title="hours travel" />
                <StatisticsArea value={miles} title="miles" />
                <StatisticsArea value={expenses} title="expenses" />
              </View>
            </View>
            <View style={{width: Dimensions.get("window").width - 30}}>
              <Text style={styles.statisticsPeriod}>{strings.all.settings.periods[1]}</Text>
              <View style={styles.statisticsArea}>
                <StatisticsArea value={hours1} title="hours travel" />
                <StatisticsArea value={miles1} title="miles" />
                <StatisticsArea value={expenses1} title="expenses" />
              </View>
            </View>
            <View style={{width: Dimensions.get("window").width - 30}}>
              <Text style={styles.statisticsPeriod}>{strings.all.settings.periods[2]}</Text>
              <View style={styles.statisticsArea}>
                <StatisticsArea value={hours2} title="hours travel" />
                <StatisticsArea value={miles2} title="miles" />
                <StatisticsArea value={expenses2} title="expenses" />
              </View>
            </View>
          </ScrollView>
        </View>
        <CurrentRouteIndicator ref="cri" count={this.statRoutes.length} />

        {[
          [
            strings.startJourney,
            StartJourney,
            !!(
              this.state.allowJourneyStartedIcon &&
              Preferences.currentJourney &&
              Preferences.currentJourney.rowid.getValue()
            ),
          ],
          [strings.addExpense, AddExpense, require('../../img/addExpense.png')],
          [strings.addJourney, AddJourney, require('../../img/addJourney.png')],
        ].map(
          (value, index) =>
            (index == 1 && this.state.chooseImageType ? (
              <View key={index} style={[styles.button, { flexDirection: 'row' }]}>
                {[
                  AddExpense.IMAGE_PICK,
                  AddExpense.IMAGE_TAKE,
                  AddExpense.IMAGE_NONE,
                ].map((imageData, imageIndex) => (
                  <TouchableOpacity
                    key={imageIndex}
                    style={styles.all.centerCenterFlex1}
                    activeOpacity={styles.all.activeOpacity}
                    onPress={this.showScene.bind(null, value[1], imageData[0])}
                  >
                    <Image source={imageData[1]} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                key={index}
                onPress={this.showScene.bind(null, value[1], null)}
                style={styles.button}
                activeOpacity={styles.all.activeOpacity}
              >
                <Image
                  source={
                    value[2].constructor != Boolean
                      ? value[2]
                      : value[2]
                        ? require('../../img/journeyStarted.png')
                        : require('../../img/startJourney.png')
                  }
                />
                {value[2].constructor == Boolean && value[2] ? (
                  <Spinner
                    style={styles.all.startJourney.$spinner.style}
                    size={styles.all.startJourney.$spinner.size}
                    type={styles.all.startJourney.$spinner.type}
                    color={StaticUtils.spinkitColor(styles.all.customOrange)}
                  />
                ) : (
                  <Text style={styles.buttonText}>{value[0]}</Text>
                )}
              </TouchableOpacity>
            )),
        )}
      </View>
    );
  }
}
