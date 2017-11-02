import React from 'react';
import { autobind } from 'core-decorators';

@autobind
export default class BaseComponent extends React.Component {
  static SET_CHILD = 'setChild';

  constructor(props, name) {
    super(props);

    this.name = name;
  }

  componentWillMount() {
    console.log(`${this.name} will mount.`);

    this.props.route && this.props.route.setChild && this.props.route.setChild(this);
  }

  componentWillUnmount() {
    console.log(`${this.name} will unmount.`);

    this.props.route && this.props.route.setChild && this.props.route.setChild(null);
  }

  setChild(child) {
    if (this.child !== null) {
      child ? (child.parent = this) : (this.child.parent = null);
    } else {
      child ? (child.parent = this) : null;
    }

    this.child = child;
  }
}
