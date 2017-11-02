import React from "react";
import {
   View,
   Text
} from "react-native";

const styles = require("./styles")("sceneTitle");

export default class extends React.Component {
   render() {
      return <View style={styles.container}>
         <Text style={styles.text}>{this.props.title}</Text>
      </View>;
   }
}
