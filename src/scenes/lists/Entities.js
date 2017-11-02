import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { autobind } from 'core-decorators';
import { ListViewHelper } from '../../react-native-common-utils';
import BaseComponent from '../../BaseComponent';
import StaticUtils from '../../StaticUtils';

const styles = require('../../styles')('listEntities');

@autobind
export default class Entities extends BaseComponent {
  constructor(props, name, listItemType, entityType, loadEntities, sortEntities) {
    super(props, name);

    this.state = {
      entities: [{}],
    };

    this.lv = new ListViewHelper(this.state.entities, listItemType);

    this.lv.setOnPress(this.editEntity);
    this.lv.setStyle(styles.all.listView);
    this.lv.setPageSize(100);
    this.lv.setSeparatorStyle(styles.all.listSeparator);

    this.entityRoute = {
      className: entityType,
      [BaseComponent.SET_CHILD]: this.setChild,
    };

    this.loadEntities = loadEntities;

    this.sortEntities =
      sortEntities.constructor == Function
        ? sortEntities
        : () => StaticUtils.sortAlphabetically(this.state.entities, sortEntities);
  }

  async componentDidMount() {
    const entities = await this.loadEntities();

    if (entities.length) {
      this.state.entities = entities;

      this.sortEntities(this.state.entities);

      this.lv.setItems(this.state.entities);

      this.forceUpdate();
    }
  }

  addEntity() {
    this.props.nav.push(this.entityRoute);
  }

  editEntity(rowid) {
    this.props.nav.push(
      Object.assign(
        { ...this.entityRoute },
        {
          inputParams: { entity: this.state.entities.find((entity) => entity.rowid == rowid) },
        },
      ),
    );
  }

  onEntitiesChanged(entity) {
    const insert = entity.insert;
    delete entity.insert;

    if (!this.state.entities[0].rowid) {
      this.state.entities.pop();
    }

    insert
      ? this.state.entities.push(entity)
      : (this.state.entities[this.state.entities.findIndex((e) => e.rowid == entity.rowid)] = entity);

    this.sortEntities(this.state.entities);
    this.forceUpdate();
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        {this.lv.createListView()}
        <TouchableOpacity
          style={styles.add}
          onPress={this.addEntity}
          activeOpacity={styles.all.activeOpacity}
        >
          <Image source={require('../../../img/plus.png')} />
        </TouchableOpacity>
      </View>
    );
  }
}
