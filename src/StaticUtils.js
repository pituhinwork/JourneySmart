import React from 'react';
import { Text } from 'react-native';
import { MenuOptions, MenuOption } from 'react-native-popup-menu';
import { StaticUtils as StaticUtilsBase } from './react-native-common-utils';
import GDrive from './react-native-google-drive-api-wrapper';

const strings = require('./strings')();

export default class StaticUtils extends StaticUtilsBase {
  static GOOGLE_API_KEY = 'AIzaSyA4NHxGpZq9UjHJtrDv5maCuduweCBDJrw';

  static safeJourneyTypeCode(code, substitute = true) {
    return code || !substitute ? code : strings.all.journeyType.noCode;
  }

  static metricToPerDistance(metric) {
    return metric ? strings.all.journeyTypes.perKm : strings.all.journeyTypes.perMile;
  }

  static metersToDistance(meters, metric) {
    return meters / (metric ? 1000 : 1609.34);
  }

  static getJourneyCost(rate, meters, metric) {
    return StaticUtils.round(rate * StaticUtils.metersToDistance(meters, metric), 2);
  }

  static latLngToAddress(point) {
    const url =
      'https://maps.googleapis.com/maps/api/geocode/json?' +
      `latlng=${point.getLatitude()},${point.getLongitude()}` +
      `&language=${strings.all.getLanguage()}` +
      '&result_type=postal_code' +
      `&key=${this.GOOGLE_API_KEY}`;
    return fetch(url);
  }

  static postcodeToLatLng(postcode) {
    const url =
      'https://maps.googleapis.com/maps/api/geocode/json?' +
      `components=postal_code:${postcode}|country:${StaticUtils.getLocaleId()}` +
      `&language=${strings.all.getLanguage()}` +
      `&key=${this.GOOGLE_API_KEY}`;

    return fetch(url);
  }

  static setAddress(point, response) {
    point.setAddress(response.results[0].formatted_address);

    let index = -1;

    while (!point.getPostcode() && ++index <= 1) {
      const element = response.results[index].address_components.find(
        (element) => element.types[0].valueOf() == 'postal_code',
      );

      if (element) {
        point.setPostcode(element.short_name);
      }
    }
  }

  static sortJourneyTypes(types) {
    types.sort((type1, type2) => {
      if (type1.name && type2.name) {
        // = Activity = //
        let result = type2.active - type1.active;

        if (!result) {
          // = name = //
          const name1 = type1.name.toLowerCase();
          const name2 = type2.name.toLowerCase();

          result = name1 < name2 ? -1 : name1 > name2 ? 1 : 0;

          // = code = //
          if (!result) {
            result = type1.code < type2.code ? -1 : 1;
          }
        }

        return result;
      }
    });
  }

  static sortAlphabetically(array, fieldName) {
    array.sort((e1, e2) => (e1[fieldName].toLowerCase() < e2[fieldName].toLowerCase() ? -1 : 1));
  }

  static async getExpenseImageFolderId() {
    if (!StaticUtils.imageFolderId && GDrive.isInitialized()) {
      try {
        const jsId = await GDrive.files.safeCreateFolder({
          name: 'JourneySmart',
          parents: ['root'],
        });

        StaticUtils.imageFolderId = await GDrive.files.safeCreateFolder({
          name: 'Expenses',
          parents: [jsId],
        });
      } catch (error) {
        console.log(error);
      }
    }

    return StaticUtils.imageFolderId;
  }

  static parseMenuOptions(menuOptions, textStyle) {
    return (
      <MenuOptions>
        {Object.keys(menuOptions).map((key, index) => (
          <MenuOption key={index} value={key}>
            <Text style={textStyle}>{menuOptions[key]}</Text>
          </MenuOption>
        ))}
      </MenuOptions>
    );
  }
}
