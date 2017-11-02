import React from 'react';
import { autobind } from 'core-decorators';
import { styles } from '../../../react-native-common-utils/js/styles';
import { AlterStyles, StaticUtils } from '../../../react-native-common-utils';
import ToggleButton from './ToggleButton';

@autobind
export default class SimpleToggleButton extends React.Component {
  render() {
    const stylesData = [[styles.toggleButtons.$button.container.inactive, 'container.inactive']];

    if (this.props.index == this.props.parent.state.currentIndex) {
      stylesData.push([styles.toggleButtons.$button.container.active, 'container.active']);
    }

    return (
      <ToggleButton
        {...this.props}
        style={StaticUtils.objectToArray(
          AlterStyles.combine(this.props.styles, stylesData).container,
        )}
      />
    );
  }
}
