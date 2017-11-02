import React from "react";
import {
   View,
   Text,
   Image,
   TouchableOpacity
} from "react-native";
import { autobind } from "core-decorators";

const styles = require("./styles")();

@autobind
export default class TabButtons extends React.Component {
   constructor(props) {
      super(props);
      
      this.state = {
         current: this.props.initialIndex | 0
      };
   }
   
   onPress(current) {
      this.setState({current});
      
      if (this.props.onPress) {
         this.props.onPress(current);
      }
   }
   
   render() {
      return <View style={{flexDirection: "row", backgroundColor: "white"}}>
         {this.props.buttons.map((data, index) => {
            const isCurrent = this.state.current == index;
            
            return <TouchableOpacity
               key={index}
               style={{flex: 1}}
               disabled={isCurrent}
               onPress={this.onPress.bind(null, index)}
               activeOpacity={styles.activeOpacity}>
               <View>
                  <Image style={{alignSelf: "center"}} source={data[0]} />
                  <View style={{
                     height: this.props.separatorWidth,
                     backgroundColor: isCurrent ? styles.logoBlueButton.
                        container.backgroundColor : "transparent"}} />
                  <Text style={{alignSelf: "center"}}>{data[1]}</Text>
               </View>
            </TouchableOpacity>;
         })}
      </View>;
   }
}
