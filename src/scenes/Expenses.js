import React from 'react';
import { View, Text, Image, Alert, TouchableOpacity } from 'react-native';
import { autobind } from 'core-decorators';

import { ListViewHelper } from '../react-native-common-utils';
import DB from '../DB';
import BaseComponent from '../BaseComponent';
import AddExpense from './AddExpense';

const styles = require('../styles')('expenses');
const strings = require('../strings')('expenses');

/**
 * Expense.
 */
class Expense extends React.Component {
  constructor(props) {
    super(props);

    this.content = [];
  }

  render() {
    const data = this.props.data;

    return !data.rowid ? null : (
      <TouchableOpacity
        style={styles.$expense.container}
        activeOpacity={styles.all.activeOpacity}
        onPress={this.props.callbacks.get('onView').bind(null, data.rowid)}
      >
        <Text style={[styles.$expense.type, styles.$expense.text]}>{data.type}</Text>
        <Text style={[styles.$expense.total, styles.$expense.text]}>
          {`${data.net + data.vat} ${data.currency}`}
        </Text>
        {[
          [styles.$expense.edit, 'onEdit', require('../../img/edit.png')],
          [styles.$expense.delete, 'onDelete', require('../../img/delete.png')],
        ].map((actionData, index) => (
          <TouchableOpacity
            key={index}
            style={actionData[0]}
            activeOpacity={styles.all.activeOpacity}
            onPress={this.props.callbacks.get(actionData[1]).bind(null, data.rowid)}
          >
            <Image source={actionData[2]} />
          </TouchableOpacity>
        ))}
      </TouchableOpacity>
    );
  }
}

/**
 * Expenses.
 */
@autobind
export default class Expenses extends BaseComponent {
  constructor(props) {
    super(props, 'Expenses');
    
    this.lv = new ListViewHelper(
      this.props.expenses && this.props.expenses.length ? this.props.expenses : [{}],
      Expense,
    );

    this.lv.setSeparatorStyle(styles.all.listSeparator);

    this.lv.setCallback('onView', this.onView.bind(null, true));
    this.lv.setCallback('onEdit', this.onView.bind(null, false));
    this.lv.setCallback('onDelete', this.onDelete);
  }

  onView(readOnly, rowid) {
    this.props.onSelect(rowid, readOnly);
    console.log('11');
    console.log(this.props);
    // this.props.nav.push({
    //   className: AddExpense,
    //   [BaseComponent.SET_CHILD]: this.setChild,
    //   inputParams: {
    //     rowid,
    //     readOnly,
    //   },
    // });
  }

  onDelete(rowid, prompt = true) {
    const del = (rowid) => {
      this.props.expenses.splice(
        this.props.expenses.findIndex((expense) => expense.rowid == rowid),
        1,
      );

      if (!this.props.expenses.length) {
        this.lv.setItems([{}]);
      }

      this.forceUpdate();
    };

    !prompt
      ? del(rowid)
      : Alert.alert(strings.all.appName, strings.delete, [
        {
          text: strings.all.OK,
          onPress: async () => ((await DB.deleteExpense(rowid)) ? del(rowid) : undefined),
        },
      ]);
  }

  onUpdate(expense) {
    if (expense.standalone != this.props.standalone) {
      this.onDelete(expense.rowid, false);
    } else {
      const e = this.props.expenses.find((e) => e.rowid == expense.rowid);

      Object.keys(e).forEach((key) => (e[key] = expense[key]));

      this.forceUpdate();
    }
  }

  render() {
    return <View style={styles.scene}>{this.lv.createListView()}</View>;
  }
}
