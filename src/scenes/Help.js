import React from 'react';
import SceneTitle from '../SceneTitle';

export default class Help extends React.Component {
  constructor(props) {
    super(props);

    this.content = [];
  }
  render() {
    return <SceneTitle title={'Help'} />;
  }
}
