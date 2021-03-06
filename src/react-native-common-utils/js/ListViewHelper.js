import React from "react";
import {
   View,
   ListView,
   Text,
} from "react-native";
import { autobind } from "core-decorators";
import { styles } from "./styles";

@autobind
export default class ListViewHelper {
   constructor(items, itemType, ref) {
      this.setItems(items);
      this.setItemType(itemType);
      this.setSeparatorStyle(styles.listView.separatorStyle);
      this.nav = undefined;
      this.ref = ref;
      
      this.dataSource = new ListView.DataSource({
         rowHasChanged() {
            return false;
         }
      });
      
      this.callbacks = new Map();
   }
   
   setItems(items) {
      this.items = items;
   }
   
   setItemType(itemType) {
      this.itemType = itemType;
   }
   
   setCallback(name, callback) {
      this.callbacks.set(name, callback);
   }
   
   deleteCallback(name) {
      this.callbacks.delete(name);
   }
   
   setOnPress(onPress) {
      this.setCallback("onPress", onPress);
   }
   
   setOnLongPress(onLongPress) {
      this.setCallback("onLongPress", onLongPress);
   }
   
   setStyle(style) {
      this.style = style;
   }
   
   setPageSize(pageSize) {
      this.pageSize = pageSize;
   }
   
   setSeparatorStyle(separatorStyle) {
      this.separatorStyle = separatorStyle;
   }
   
   setRowParams(params) {
      this.rowParams = params;
   }

   
   renderRow(data, sectionID, rowID, highlightRow) {
      return React.createElement(
         Array.isArray(data) ? data[0] : this.itemType, {
            data: Array.isArray(data) ? data[1] : data,
            sectionID,
            rowID,
            highlightRow,
            itemCount: this.items.length,
            callbacks: this.callbacks,
            onSelect: this.callbacks.get("onSelect"),
            onPress: this.callbacks.get("onPress"),
            onLongPress: this.callbacks.get("onLongPress"),
            params: this.rowParams ? {...this.rowParams} : undefined
      });
   }
   
   renderSeparator(sectionID, rowID, adjacentRowHighlighted) {
      return (rowID == this.items.length - 1 ? this.renderLastRowSeparator :
         this.renderRowSeparator)(sectionID, rowID, adjacentRowHighlighted);
   }
   
   renderLastRowSeparator(sectionID, rowID, adjacentRowHighlighted) {
      return null;
   }
   
   generateRowSeparatorKey(sectionID, rowID, adjacentRowHighlighted) {
      return `${sectionID.toString()}_${rowID.toString()}`;
   }
   
   renderRowSeparator(sectionID, rowID, adjacentRowHighlighted) {
      return <View
         key={this.generateRowSeparatorKey(
            sectionID, rowID, adjacentRowHighlighted)}
         style={this.separatorStyle} />;
   }
   
   setEmptyItemsRenderer(emptyItemsRenderer) {
      this.emptyItemsRenderer = emptyItemsRenderer;
   }
   
   createListView(nav) {
      if (nav) {
            this.nav = nav;
      }
      return !this.items.length ? this.emptyItemsRenderer ?
         this.emptyItemsRenderer() : <Text style={{ fontSize: 20}}>No Results</Text> : <ListView
            ref={this.ref}
            pageSize={this.pageSize}
            style={this.style}
            dataSource={this.dataSource.cloneWithRows(this.items)}
            renderRow={this.renderRow}
            renderSeparator={this.renderSeparator} />;
   }
};
