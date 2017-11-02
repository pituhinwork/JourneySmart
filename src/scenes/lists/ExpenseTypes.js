import React from "react";
import {
   View,
   Text,
   TouchableOpacity,
} from "react-native";
import { autobind } from "core-decorators";
import Entities from "./Entities";
import ExpenseType from "./ExpenseType";
import DB from "../../DB";


const styles = require("../../styles")("listEntities");


/**
 * TypeContainer.
 */
class TypeContainer extends React.Component {
   render() {
      return this.props.data.rowid ? <TouchableOpacity
         style={styles.typeContainer}
         activeOpacity={styles.all.activeOpacity}
         onPress={this.props.onPress.bind(null, this.props.data.rowid)}>
            <Text style={styles.typeContainerText}>
               {this.props.data.type}</Text>
      </TouchableOpacity> : <View />;
   }
}


/**
 * ExpenseTypes.
 */
@autobind
export default class ExpenseTypes extends Entities {
   constructor(props) {
      super(
         props,
         "ExpenseTypes",
         TypeContainer,
         ExpenseType,
         DB.getExpenseTypes,
         "type"
      );
   }
}
