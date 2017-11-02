import moment from "moment";

const strings = require("./strings")("startJourney");

export default class JourneyPoint {
   static TIME_FORMAT = __DEV__ ? "HH:mm:ss" : "HH:mm";
   
   constructor(journeyPoint) {
      this.setRowId(journeyPoint.rowid);
      this.setJourneyRowId(journeyPoint.journeyRowid);
      this.millis = journeyPoint.millis;
      this.tzOffsetMillis = journeyPoint.tzOffsetMillis;
      this.latitude = journeyPoint.latitude;
      this.longitude = journeyPoint.longitude;
      this.setAddress(journeyPoint.address);
      this.setPostcode(journeyPoint.postcode);
   }
   
   getRowId() {
      return this.rowid;
   }
   
   setRowId(rowid) {
      this._assertUndefined("rowid");
      
      this.rowid = rowid;
   }
   
   getJourneyRowId() {
      return this.journeyRowid;
   }
   
   setJourneyRowId(journeyRowid) {
      this._assertUndefined("journeyRowid");
      
      this.journeyRowid = journeyRowid;
   }
   
   getMillis() {
      return this.millis;
   }
   
   getTzOffsetMillis() {
      return this.tzOffsetMillis;
   }
   
   getTimestamp(format = JourneyPoint.TIME_FORMAT) {
      return format ? moment(this.millis).format(format) : this.millis;
   }
   
   getLatitude() {
      return this.latitude;
   }
   
   getLongitude() {
      return this.longitude;
   }
   
   getAddress() {
      return this.address || (this.latitude == undefined ? strings.
         determiningLocation : strings.positionAcquired);
   }
   
   setAddress(address) {
      this._assertUndefined("address");
      
      this.address = address;
   }
   
   getPostcode() {
      return this.postcode;
   }
   
   setPostcode(postcode) {
      this._assertUndefined("postcode");
      
      this.postcode = postcode;
   }
   
   _assertUndefined(fieldName) {
      if (this[fieldName] != undefined) {
         throw new Error();
      }
   }
}
