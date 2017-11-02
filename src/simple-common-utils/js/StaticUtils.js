export default class StaticUtils {
   static round(value, decimals) {
      // https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
      // MarkG's answer.
      
      return decimals === undefined ? value : Number(Math.
         round(value + "e" + decimals) + "e-" + decimals);
   }
   
   static encodedUtf8ToByteArray(encoded) {
      const ar = [];
      
      for (let i = 0; i < encoded.length; i++) {
         ar.push(encoded.charCodeAt(i));
      }
      
      return ar;
   }
   
   static ensureBounds(value, min, max) {
      if (max < min) {
         throw new Error("'min' must not exceed 'max'");
      }
      
      return Math.max(Math.min(value, max), min);
   }
   
   static pushAndReturnElement(array, element) {
      array.push(element);
      
      return element;
   }
   
   static quoteIfString(value) {
         try {
               if (value.constructor === undefined) {
                 return `"${value}"`;
               }
               return value.constructor == String ? `"${value}"` : value;
         } catch (error) {
               console.log(error);
         }
      
   }
   
   static safeQuoteIfString(value, quoteIfString) {
      return quoteIfString ? StaticUtils.quoteIfString(value) : value;
   }
   
   static objectToArray(object) {
      return Object.keys(object).reduce((p, c) => {
         p.push(object[c]);
         
         return p;
      }, []);
   }
   
   static escapeRegExp(string) {
      // https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   }
   
   static replaceAll(string, find, replace) {
      // https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
      
      return string.replace(new RegExp(StaticUtils.escapeRegExp(find), 'g'), replace);
   }
}
