import { renderers } from "react-native-popup-menu";

const styles = require("./styles")();

export default class JourneyTypesMenu extends renderers.ContextMenu {
   computePositionAndSize(layouts) {
      return {
         width: undefined,
         left: layouts.triggerLayout.x,
         top: layouts.triggerLayout.y + layouts.triggerLayout.height +
            styles.journeySummaryBlockSeparatorSize,
         right: layouts.windowLayout.width - layouts.triggerLayout.x -
            layouts.triggerLayout.width
      };
   }
}
