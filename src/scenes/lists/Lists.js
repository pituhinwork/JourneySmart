import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Navigator from '../../react-native-deprecated-custom-components/src/Navigator';
import { autobind } from 'core-decorators';
import { AlterStyles } from '../../react-native-common-utils';
import SceneTitle from '../../SceneTitle';
import JourneyTypes from './JourneyTypes';
import ExpenseTypes from './ExpenseTypes';

const styles = require('../../styles')('lists');
const strings = require('../../strings')('lists');

@autobind
export default class Lists extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabs: [JourneyTypes, ExpenseTypes].map((className, index) => ({
        className,
        index,
        title: strings.headerItems[index],
      })),
      selectedTab: 0,
    };
  }

  renderScene(tab) {
    return React.createElement(tab.className, {
      nav: this.props.nav,
    });
  }

  onWillFocus(tab) {
    this.setState({ selectedTab: tab.index });
  }

  onPress(index) {
    this.refs.nav.jumpTo(this.state.tabs[index]);

    this.setState({ selectedTab: index });
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <SceneTitle title={strings.title} />
        <View style={styles.header}>
          {this.state.tabs.map(tab => (
            <TouchableOpacity
              key={tab.index}
              style={styles.headerItem}
              disabled={tab.index == this.state.selectedTab}
              activeOpacity={styles.all.activeOpacity}
              onPress={this.onPress.bind(null, tab.index)}
            >
              <Text style={styles.headerItemText}>{tab.title}</Text>
              <View
                style={new AlterStyles(styles.headerItemUnderline)
                  .addProperty('backgroundColor', tab.index == this.state.selectedTab, 'white')
                  .build()}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Navigator
          ref="nav"
          initialRoute={this.state.tabs[this.state.selectedTab]}
          initialRouteStack={this.state.tabs}
          configureScene={() => Navigator.SceneConfigs.HorizontalSwipeJump}
          renderScene={this.renderScene}
          onWillFocus={this.onWillFocus}
        />
      </View>
    );
  }
}
