import { Vibration, Platform, AsyncStorage } from "react-native";

import RNFS from 'react-native-fs';
import SQLite from 'react-native-sqlite-storage';
import base64 from 'base64-js';
import GoogleSignIn from "react-native-google-sign-in";
var Buffer = require("buffer/").Buffer;
import moment from 'moment';
import StaticUtils from './StaticUtils';
import JourneyPoint from './JourneyPoint';
import Bluetooth from './Bluetooth';
import { Preferences } from './react-native-common-utils';
import SqlBuilder from './simple-sql-query-builder';
import GDrive from './react-native-google-drive-api-wrapper';
import JourneySmart from './JourneySmart';

const strings = require('./strings')('db');

SQLite.DEBUG(false);
SQLite.enablePromise(true);

SqlBuilder.setDebug(false);

export default class DB {
  constructor() {
    throw new Error('Class \'DB\' mustn\'t be instantiated.');
  }

  static async init() {
    let valCurrency = await AsyncStorage.getItem('currencys');
      if (valCurrency === null || valCurrency === undefined) {
        this.currency = "GBP";
      }
      else {
        this.currency = valCurrency;
      }
      let valRate = await AsyncStorage.getItem('rate');
      if ( valRate === null || valRate === undefined) {
        this.rate = 0;
      }
      else {
        this.rate = parseFloat(valRate);
      }
      this.employeeName = await AsyncStorage.getItem('employeeName');
      if (this.employeeName === null || valRate === undefined) {
        this.employeeName = "Personal";
      }
      let value = await AsyncStorage.getItem('unit');
      if (value === '1')
      {
        this.unit = 1;
      }
      else {
        this.unit = 0;
      }
      console.log('DBInited');
//    try {
      if (DB.db) {
        return;
      }
      if (Platform.OS === 'android')
      {
        DB.db = await SQLite.openDatabase({ name:
          `${strings.all.appName}.sqlite` });
      }
      else 
      {
        DB.db = await SQLite.openDatabase({ name:
          `${strings.all.appName}.sqlite`, createFromLocation : 1 });
      }
      
      SqlBuilder.setSqlExecutor(DB.db.executeSql.bind(DB.db));

      await SqlBuilder.executeSql('PRAGMA foreign_keys = ON');

      await SqlBuilder.createTable('journeyTypes', tb => {
        tb.integer('rowid').primary();
        tb.integer('active').notNull();
        tb.text('name').notNull();
        tb.text('code').notNull();
        tb.column('rate', 'REAL').notNull();
        tb.text('currency').notNull();
        tb.integer('metric').notNull();
        tb.unique(ub => {
          ub.column('name').collate('NOCASE').order('ASC');
          ub.column('code').collate('NOCASE').order('ASC');
          ub.column('currency').collate('NOCASE').order('ASC');
          ub.column('metric').order('ASC');
        });
      });

      await SqlBuilder.createTable('journeys', tb => {
        tb.integer('rowid').primary();
        tb.integer('manual').notNull();
        tb.integer('type').foreign('journeyTypes', 'rowid');
        tb.text('reason');
        tb.integer('actual').notNull();
        tb.integer('fastest').notNull();
        tb.integer('shortest').notNull();
        tb.text('routeMode');
        tb.integer('distance');
        tb.integer('duration');
        tb.integer('tolls').notNull();
        tb.integer('motorways').notNull();
        tb.integer('ferries').notNull();
        tb.text('notes');
      });

      await SqlBuilder.createTable('points', tb => {
        tb.integer('journeyRowid')
          .foreign('journeys', 'rowid')
          .onDelete('CASCADE')
          .notNull();

        tb.integer('millis').notNull();
        tb.integer('tzOffsetMillis').notNull();
        tb.column('latitude', 'REAL').notNull();
        tb.column('longitude', 'REAL').notNull();
        tb.text('address');
        tb.text('postcode');
      });

      await SqlBuilder.createTable('expenseTypes', tb => {
        tb.integer('rowid').primary();
        tb.text('type').notNull();
        tb.text('code').notNull();
        tb.unique(ub => {
          ub.column('type').collate('NOCASE').order('ASC');
          ub.column('code').collate('NOCASE').order('ASC');
        });
      });

      await SqlBuilder.createTable('expenses', tb => {
        tb.integer('rowid').primary();
        tb.integer('standalone').notNull();
        tb.integer('linkedTo').notNull();
        tb.integer('expenseType').notNull().foreign('expenseTypes', 'rowid');
        tb.text('reason');
        tb.integer('millis').notNull();
        tb.integer('tzOffsetMillis').notNull();
        tb.text('currency').notNull();
        tb.column('net', 'REAL').notNull();
        tb.column('vat', 'REAL');
      });

      await SqlBuilder.createTable('expenseImages', tb => {
        tb.integer('expenseRowid')
          .foreign('expenses', 'rowid')
          .onDelete('CASCADE')
          .notNull();
        tb.text('path');
        tb.text('mime').notNull();
        tb.column('width', 'REAL').notNull();
        tb.column('height', 'REAL').notNull();
        tb.text('id');
      });

      await SqlBuilder.createTable('places', tb => {
        tb.text('name').notNull();
        tb.text('postcode').notNull();
        tb.unique(ub => {
          ub.column('name').collate('NOCASE').order('ASC');
        });
      });

      // = Default journey type = //
      if (!(await SqlBuilder.select(sb => sb.column('COUNT(*)',
        'count').from('journeyTypes')))[0].rows.item(0).count) {
        await DB.addUpdateJourneyType({
          active: 1,
          name: this.employeeName,
          code: '',
          rate: this.rate,
          currency: this.currency,
          metric: this.unit,
          rowid: 0,
        });
      }
      // = DB.actualUsed = //
      const where = `rowid = ${Preferences.currentJourney.rowid.getValue()}`;

      const [actual] = await SqlBuilder.select(sb => sb
        .column('actual')
        .from('journeys')
        .where(where));

      actual.rows.length ? DB.actualUsed = !!actual.rows.item(0).
        actual : console.log(`No journey with ${where}.`);
      try {
         console.log("Google Sign in started");
          
          if ( Platform.OS === 'android') {
            await GoogleSignIn.configure({
            scopes: [
              'https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/drive.appfolder',
            ],
            clientID: '310933112450-4ionnp4em4okmeltnteji7gi0shn9vir.apps.googleusercontent.com',
          });
            let error = null;
            try {
                JourneySmart.user = await GoogleSignIn.signInSilentlyPromise();
              } catch (e) {
                error = e;
              }
              if (error) {
                  JourneySmart.user = await GoogleSignIn.signInPromise();
              }
              console.log(JourneySmart.user);
              GDrive.setAccessToken(JourneySmart.user.accessToken);
          }
          else {
            await GoogleSignIn.configure({
            scopes: [
              'https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/drive.appfolder',
            ],
          });
            this.prevUser = GoogleSignIn.currentUser();
            console.log("1111111", this.prevUser);
            if (this.prevUser['_40'] === 0) {
              let error = null;
              try {
                JourneySmart.user = await GoogleSignIn.signInSilentlyPromise();
              } catch (e) {
                error = e;
              }
              console.log("2222222", error);
              if (error) {
                  JourneySmart.user = await GoogleSignIn.signInPromise();
              }
              this.forceUpdate();
              console.log("3333333", JourneySmart.user);
              GDrive.setAccessToken(JourneySmart.user.accessToken);
            }
            else {
              JourneySmart.user = this.prevUser;
            }
            console.log(JourneySmart.user);
         }
        } catch (error) {
          console.log('Google sign in error', error);
        } finally {
          //GDrive.init();
          console.log('this.reloadExpenseImages();');
          this.reloadExpenseImages();
        }
    // } catch (error) {
    //   DB._onError(error);
    // }
    
  }

  static async reloadExpenseImages(
    fromTo, journeyType, reason, loadStandaloneExpenses) {
    const journeys = [];
    const standaloneExpenses = [];
    let images =[];
    try {
      let [result] = await SqlBuilder.select(sb => sb
        .column('journeys.rowid', 'rowid')
        .column('manual')
        .column('type')
        .column('reason')
        .column('routeMode')
        .column('distance')
        .column('duration')
        .column('notes')
        .column('name')
        .column('code')
        .column('rate')
        .column('currency')
        .column('metric')
        .from('journeys', fb => fb
            .innerJoin('journeyTypes', 'journeys.type', 'journeyTypes.rowid'))
        .where(wb => {
            wb
              .column('journeys.rowid')
              .ne(Preferences.currentJourney.rowid.getValue());
            
            if (fromTo) {
              const sb = new SqlBuilder.SelectBuilder()
                  .column(new SqlBuilder.WhereBuilder()
                    .column('min(millis)')
                    .ge(fromTo[0])
                    .and()
                    .column('max(millis)')
                    .le(fromTo[1]).toString(true))
                  .from('points')
                  .where(wb => wb
                    .column('journeyRowid')
                    .e('journeys.rowid', false));
              
              wb
                  .and()
                  .push()
                  .grouping(sb)
                  .pop();
            }
            
            if (journeyType) {
              if (fromTo) {
                  wb.and();
              }
              
              wb
                  .column('journeyTypes.rowid')
                  .e(journeyType);
            }
            
            if (reason) {
              if (fromTo || journeyType) {
                  wb.and();
              }
              
              wb
                  .column('reason')
                  .e(reason);
            }
        })
        .orderBy('journeys.rowid'));
      for (let i = 0; i < result.rows.length; i += 1) {
        journeys.push(Object.assign({
            points: [],
            expenses: []
        }, result.rows.item(i)));
      }
      
      const journeyRowIds = journeys.map(journey => journey.rowid);
      
      if (journeyRowIds.length) {
        // = points = //        
        let journeyIndex = 0;        
        // = expenses = //
        [result] = await SqlBuilder.select(sb => DB
            ._fillExpenseSelectBuilder(sb)
            .where(wb => wb
              .column('standalone')
              .e(0)
              .and()
              .column('linkedTo')
              .in(journeyRowIds)));
        for (let ei = 0; ei < result.rows.length; ei += 1) {
            const expense = result.rows.item(ei);
            const [results] = await SqlBuilder.select(sb => sb
                .column('rowid')
                .column('path')
                .column('mime')
                .column('width')
                .column('height')
                .column('id')
                .from('expenseImages')
                .where(wb => wb.column('expenseRowid').e(expense.rowid)));
            for (let i = 0; i < results.rows.length; i += 1) {
                images.push(results.rows.item(i));
            }
        }
      }
      console.log('stand alone',images);
      // = Standalone expenses = //
      if (loadStandaloneExpenses) {
        [result] = await SqlBuilder.select(sb => DB
            ._fillExpenseSelectBuilder(sb, true)
            .column('journeyTypes.rowid', 'journeyTypeRowid')
            .column('journeyTypes.name', 'journeyTypeName')
            .column('journeyTypes.code', 'journeyTypeCode')
            .where(wb => {
              wb
                  .column('standalone')
                  .e(1);
              
              if (fromTo) {
                  wb
                    .and()
                    .column('millis')
                    .ge(fromTo[0])
                    .and()
                    .column('millis')
                    .le(fromTo[1]);
              }
              
              if (journeyType) {
                  wb
                    .and()
                    .column('journeyTypeRowid')
                    .e(journeyType);
              }
            })
            .orderBy('millis', 'DESC'));
        
        for (let ei = 0; ei < result.rows.length; ei += 1) {
            const expense = result.rows.item(ei);
            const [results] = await SqlBuilder.select(sb => sb
                .column('rowid')
                .column('path')
                .column('mime')
                .column('width')
                .column('height')
                .column('id')
                .from('expenseImages')
                .where(wb => wb.column('expenseRowid').e(expense.rowid)));
            for (let i = 0; i < results.rows.length; i += 1) {
                images.push(results.rows.item(i));
            }
        }
      }
      const dicID = await StaticUtils.getExpenseImageFolderId();
      if (dicID === '') {
        return;
      }
      const resultes = await GDrive.files.list({ q: `'${dicID}' in parents` });
      let imageList = (await resultes.json()).files;
      console.log('333',imageList);
      for (let es = 0; es < images.length; es += 1) {
        let tempImage = images[es];
        let flag = 0;
        for (let e2 = 0; e2 < imageList.length; e2 += 1) {
          if (tempImage.path.contains(imageList[e2].name)) {
            flag = 1;
            break;
          }
        }
        console.log("444", flag);
        if (flag === 0) {
          let imageData = await RNFS.readFile(
              tempImage.path,
              'base64');
          if (imageData.length < 10) {
            break;
          }
          await GDrive.permissions.create(dicID, {
              role: 'reader',
              type: 'anyone'
          });
          var base64Data = `data:${tempImage.mime};base64,` + imageData;
          var imageBuffer = this.decodeBase64Image(base64Data);
          // var bitmap = new Buffer(image.data, 'base64');
          result = await GDrive.files.createFileMultipart(
              Array.from(imageBuffer.data),
              tempImage.mime, {
                parents: [dicID],
                name: `${tempImage.rowid}.${tempImage.rowid}.${tempImage.mime.split('/')[1]}`
              });
          
        }
      }
    } catch (error) {
      DB._onError(error);
    }
  }

  static async uninit() {
    if (DB.db) {
      await DB.db.close();
      DB.db = null;
      SqlBuilder.setSqlExecutor(null);
      
    }
  }

  static async addUpdateJourneyType(type) {
    try {
      const [obj] = await (type.rowid ? SqlBuilder.update : SqlBuilder.insert)(
        'journeyTypes', b => b
          .columnValue('active', type.active)
          .columnValue('name', type.name)
          .columnValue('code', type.code)
          .columnValue('rate', +type.rate)
          .columnValue('currency', type.currency)
          .columnValue('metric', type.metric)
          .where(wb => wb.column('rowid').e(type.rowid)));

      return Object.assign({}, type, {
        insert: !type.rowid,
        rowid: type.rowid ? type.rowid : obj.insertId,
      });
    } catch (error) {
      error.message.indexOf('UNIQUE constraint failed') == -1 ? DB._onError(
        error) : alert(strings.all.formatString(strings.duplicateJourneyType,
            name, StaticUtils.safeJourneyTypeCode(code), StaticUtils.
              metricToPerDistance(metric)));
    }
  }

  static async addUpdateExpenseType(type) {
    try {
      const [obj] = await (type.rowid ? SqlBuilder.update : SqlBuilder.insert)(
        'expenseTypes', b => b
          .columnValue('type', type.type)
          .columnValue('code', type.code)
          .where(wb => wb.column('rowid').e(type.rowid)));

      return Object.assign({}, type, {
        insert: !type.rowid,
        rowid: type.rowid ? type.rowid : obj.insertId,
      });
    } catch (error) {
      error.message.indexOf('UNIQUE constraint failed') == -1 ? DB._onError(
        error) : alert(strings.all.formatString(strings.duplicateExpenseType,
            type.type, type.code));
    }
  }

  static async addUpdatePlace(place) {
    try {
      const [obj] = await (place.rowid ? SqlBuilder.update : SqlBuilder.insert)(
        'places', b => b
          .columnValue('name', place.name)
          .columnValue('postcode', place.postcode)
          .where(wb => wb.column('rowid').e(place.rowid)));

      return Object.assign({}, place, {
        insert: !place.rowid,
        rowid: place.rowid ? place.rowid : obj.insertId,
      });
    } catch (error) {
      error.message.indexOf('UNIQUE constraint failed') == -1 ? DB._onError(
        error) : alert(strings.all.formatString(strings.duplicatePlace, place.
            name));
    }
  }

  static async getJourneyTypes(activeOnly = false) {
    const types = [];

    try {
      const [result] = await SqlBuilder.select(sb => sb
        .column('rowid')
        .column('*')
        .from('journeyTypes')
        .where(wb => wb.column('active').e(1), activeOnly));

      for (let i = 0; i < result.rows.length; i += 1) {
        types.push(result.rows.item(i));
      }
    } catch (error) {
      DB._onError(error);
    }

    return types;
  }

  static async getExpenseTypes() {
    const types = [];

    try {
      const [result] = await SqlBuilder.select(sb => sb
        .column('rowid')
        .column('*')
        .from('expenseTypes'));

      for (let i = 0; i < result.rows.length; i += 1) {
        types.push(result.rows.item(i));
      }
    } catch (error) {
      DB._onError(error);
    }

    return types;
  }

  static async getPlaces() {
    const places = [];

    try {
      const [result] = await SqlBuilder.select(sb => sb
        .column('rowid')
        .column('*')
        .from('places'));

      for (let i = 0; i < result.rows.length; i += 1) {
        places.push(result.rows.item(i));
      }
    } catch (error) {
      DB._onError(error);
    }

    return places;
  }

  static async addManualJourney(date, postcodes) {
    try {
      const routeMode = { ...Preferences.routes.routeMode };

      routeMode.actual = {
        getValue: function() {
          return false;
        }
      };
      
      const journeyRowid = await DB._addJourney(routeMode, 1);
      const millis = date.getTime();
      
      for (let postcode of postcodes) {
        await SqlBuilder.insert('points', ib => ib
          .columnValue('journeyRowid', journeyRowid)
          .columnValue('millis', millis)
          .columnValue('tzOffsetMillis', date.getTimezoneOffset() * 60 * 1000)
          .columnValue('latitude', postcode[1][2].lat)
          .columnValue('longitude', postcode[1][2].lng)
          .columnValue('address', postcode[1][3])
          .columnValue('postcode', postcode[1][1]));
      }
      
      return journeyRowid;
    } catch (error) {
      DB._onError(error);
    }
  }

  static async startJourney() {
    try {
      DB.actualUsed = Preferences.routes.routeMode.actual.getValue();
      Preferences.currentJourney.rowid.setValue(await
        DB._addJourney(Preferences.routes.routeMode, 0));
      Bluetooth.showJourneyInProgressNotification();
      Vibration.vibrate(600, false);
      console.log(`Journey #${Preferences.currentJourney.rowid.getValue()} ` +
        `started (${DB.actualUsed ? '' : 'no '}breadcrumbs).`);

      return true;
    } catch (error) {
      DB._onError(error);
      return false;
    }
  }

  static isActualRouteModeUsed() {
    return DB.actualUsed;
  }

  static async addCurrentJourneyPoint(point) {
    try {
      const journeyRowId = Preferences.currentJourney.rowid.getValue();

      const [result] = await SqlBuilder.insert('points', ib => ib
        .columnValue('journeyRowid', journeyRowId)
        .columnValue('millis', point.getMillis())
        .columnValue('tzOffsetMillis', point.getTzOffsetMillis())
        .columnValue('latitude', point.getLatitude())
        .columnValue('longitude', point.getLongitude()));

      point.setRowId(result.insertId);
      point.setJourneyRowId(journeyRowId);

      if (!Preferences.currentJourney.firstPointRowid.getValue()) {
        Preferences.currentJourney.firstPointRowid.setValue(point.getRowId());
      }

      const pointNum = point.getRowId() - Preferences.
        currentJourney.firstPointRowid.getValue() + 1;

      console.log(`Point ${journeyRowId}.${pointNum} added.`);

      return true;
    } catch (error) {
      DB._onError(error);
      return false;
    }
  }

  static async updateJourneyPoint(journeyRowid, point) {
    try {
      console.log('getting ossdf');
      await SqlBuilder.update('points', ub => ub
        .columnValue('address', point.getAddress())
        .columnValue('postcode', point.getPostcode())
        .where(wb => wb
          .column('journeyRowid')
          .e(journeyRowid)
          .and()
          .column('rowid')
          .e(point.getRowId())));

      // = Will be wrong for finished journeys = // NB
      const pointNum = point.getRowId() - Preferences.
        currentJourney.firstPointRowid.getValue() + 1;

      console.log(`Point ${journeyRowid}.${pointNum} updated.`);

      return true;
    } catch (error) {
      DB._onError(error);
    }
  }

  static async loadCurrentJourneyPoints() {
    try {
      const points = [];
      
      const where = new SqlBuilder.Condition('journeyRowid');
      where.e(Preferences.currentJourney.rowid.getValue());

      const ptc = (await SqlBuilder.select(sb => sb
        .column('COUNT(*)', 'ptc')
        .from('points')
        .where(where)))[0].rows.item(0).ptc;

      if (ptc) {
        const [result] = await SqlBuilder.select(sb => sb
          .column('millis')
          .column('tzOffsetMillis')
          .column('latitude')
          .column('longitude')
          .column('address')
          .from('points')
          .where(where)
          .orderBy('millis')
          .limit(1, DB.isActualRouteModeUsed()));

        for (let i = 0; i < result.rows.length; i += 1) {
          points.push(new JourneyPoint(result.rows.item(i)));
        }
      }

      console.log(`Journey points loaded: ${points.length}/${ptc}.`);

      return points;
    } catch (error) {
      DB._onError(error);
      return [];
    }
  }

  static async deleteCurrentJourneyBreadcrumbs() {
    try {
      const rowsAffected = (await SqlBuilder.delete('points', wb => wb
        .column('journeyRowid')
        .e(Preferences.currentJourney.rowid.getValue())
        .and()
        .column('rowid')
        .g(Preferences.currentJourney.firstPointRowid.getValue())))[0].rowsAffected;

      await SqlBuilder.update('journeys', ub => ub
        .columnValue('actual', 0)
        .where(wb => wb
          .column('rowid')
          .e(Preferences.currentJourney.rowid.getValue())));

      DB.actualUsed = false;

      console.log(`${rowsAffected} breadcrumb(s) deleted.`);

      return true;
    } catch (error) {
      DB._onError(error);
    }
  }

  static async cancelJourney() {
    await DB._deleteJourney(Preferences.currentJourney.rowid.
        getValue()) && (DB._cancelledFinished(true), true);
  }

  static finishJourney() {
    DB._cancelledFinished(false);
  }

  static async loadFinishedJourney(rowid) {
    try {
      const journey = Object.assign({
        rowid,
        points: [],
      }, (await SqlBuilder.select(sb => sb
        .column('type')
        .column('reason')
        .column('actual')
        .column('fastest')
        .column('shortest')
        .column('routeMode')
        .column('distance')
        .column('duration')
        .column('tolls')
        .column('motorways')
        .column('ferries')
        .column('notes')
        .from('journeys')
        .where(wb => wb.column('rowid').e(rowid))))[0].rows.item(0));

      const [result] = await SqlBuilder.select(sb => sb
        .column('rowid')
        .column('journeyRowId')
        .column('millis')
        .column('tzOffsetMillis')
        .column('latitude')
        .column('longitude')
        .column('postcode')
        .from('points')
        .where(wb => wb.column('journeyRowid').e(rowid))
        .orderBy('millis'));

      for (let i = 0; i < result.rows.length; i += 1) {
        journey.points.push(new JourneyPoint(result.rows.item(i)));
      }

      return journey;
    } catch (error) {
      DB._onError(error);
    }
  }

  static async updateFinishedJourney(rowid, params) {
    try {
      await DB.db.executeSql(Object.keys(params).reduce(
        (previous, current, index) => {
            const value = params[current];
            const quotes = typeof value == 'string' ? '\'' : '';
            
            return value == undefined ? previous :
              `${previous}${index ? ',' : ''} ${current} = ` +
                  `${quotes}${value}${quotes}`;
        }, 'UPDATE journeys SET') + ` WHERE rowid = ${rowid}`);
      
      return true;
    } catch (error) {
      DB._onError(error);
    }
  }

  static async loadJourneysAndStandaloneExpenses(
    fromTo, journeyType, reason, loadStandaloneExpenses) {
    const journeys = [];
    const standaloneExpenses = [];

    try {
      let [result] = await SqlBuilder.select(sb => sb
        .column('journeys.rowid', 'rowid')
        .column('manual')
        .column('type')
        .column('reason')
        .column('routeMode')
        .column('distance')
        .column('duration')
        .column('notes')
        .column('name')
        .column('code')
        .column('rate')
        .column('currency')
        .column('metric')
        .from('journeys', fb => fb
            .innerJoin('journeyTypes', 'journeys.type', 'journeyTypes.rowid'))
        .where(wb => {
            wb
              .column('journeys.rowid')
              .ne(Preferences.currentJourney.rowid.getValue());
            
            if (fromTo) {
              const sb = new SqlBuilder.SelectBuilder()
                  .column(new SqlBuilder.WhereBuilder()
                    .column('min(millis)')
                    .ge(fromTo[0])
                    .and()
                    .column('max(millis)')
                    .le(fromTo[1]).toString(true))
                  .from('points')
                  .where(wb => wb
                    .column('journeyRowid')
                    .e('journeys.rowid', false));
              
              wb
                  .and()
                  .push()
                  .grouping(sb)
                  .pop();
            }
            
            if (journeyType) {
              if (fromTo) {
                  wb.and();
              }
              
              wb
                  .column('journeyTypes.rowid')
                  .e(journeyType);
            }
            
            if (reason) {
              if (fromTo || journeyType) {
                  wb.and();
              }
              
              wb
                  .column('reason')
                  .e(reason);
            }
        })
        .orderBy('journeys.rowid'));
      
      for (let i = 0; i < result.rows.length; i += 1) {
        journeys.push(Object.assign({
            points: [],
            expenses: []
        }, result.rows.item(i)));
      }
      
      const journeyRowIds = journeys.map(journey => journey.rowid);
      
      if (journeyRowIds.length) {
        // = points = //
        [result] = await SqlBuilder.select(sb => sb
            .column('rowid')
            .column('journeyRowid')
            .column('millis')
            .column('tzOffsetMillis')
            .column('postcode')
            .from('points')
            .where(wb => wb.column('journeyRowid').in(journeyRowIds))
            .orderBy('journeyRowid')
            .orderBy('millis'));
        
        let journeyIndex = 0;
        
        for (let i = 0; i < result.rows.length; i += 1) {
            const point = new JourneyPoint(result.rows.item(i));
            
            if (i && (journeys[journeyIndex].rowid !=
              point.getJourneyRowId()))
            {
              journeyIndex += 1;
            }
            
            if (journeys[journeyIndex].rowid != point.getJourneyRowId()) {
              throw new Error();
            }
            
            journeys[journeyIndex].points.push(point);
        }
        
        // = expenses = //
        [result] = await SqlBuilder.select(sb => DB
            ._fillExpenseSelectBuilder(sb)
            .where(wb => wb
              .column('standalone')
              .e(0)
              .and()
              .column('linkedTo')
              .in(journeyRowIds)));
        
        for (let ei = 0; ei < result.rows.length; ei += 1) {
            const expense = result.rows.item(ei);
            
            journeys.find(journey => journey.rowid ==
              expense.linkedTo).expenses.push(expense);
        }
      }
      
      // = Standalone expenses = //
      if (loadStandaloneExpenses) {
        [result] = await SqlBuilder.select(sb => DB
            ._fillExpenseSelectBuilder(sb, true)
            .column('journeyTypes.rowid', 'journeyTypeRowid')
            .column('journeyTypes.name', 'journeyTypeName')
            .column('journeyTypes.code', 'journeyTypeCode')
            .where(wb => {
              wb
                  .column('standalone')
                  .e(1);
              
              if (fromTo) {
                  wb
                    .and()
                    .column('millis')
                    .ge(fromTo[0])
                    .and()
                    .column('millis')
                    .le(fromTo[1]);
              }
              
              if (journeyType) {
                  wb
                    .and()
                    .column('journeyTypeRowid')
                    .e(journeyType);
              }
            })
            .orderBy('millis', 'DESC'));
        
        for (let ei = 0; ei < result.rows.length; ei += 1) {
            const expense = result.rows.item(ei);
            let date = new Date(expense.millis);
            date = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
            date = Number(date);
            
            const se = standaloneExpenses.find(e => (e[0][0] ==
              date) && (e[0][1] == expense.journeyTypeRowid));
            
            if (!se) {
              standaloneExpenses.push([[date, expense.
                  journeyTypeRowid], [expense]]);
            } else {
              se[1].push(expense);
            }
        }
      }
    } catch (error) {
      DB._onError(error);
    }
    
    return [journeys, standaloneExpenses];
  }
   
  static async deleteJourney(rowid) {
    try {
        return await DB._deleteJourney(rowid)
          && (console.log(`Journey #${rowid} deleted.`), true);
    } catch (error) {
        DB._onError(error);
    }
  }
    
  static async addUpdateExpense(expense) { 
    try {
        const insert = expense.rowid === undefined;
        let result = await (insert ? SqlBuilder.insert :
          SqlBuilder.update)('expenses', b => b
              .columnValue('standalone', expense.standalone)
              .columnValue('linkedTo', expense.linkedTo)
              .columnValue('expenseType', expense.expenseType)
              .columnValue('reason', expense.reason)
              .columnValue('millis', expense.millis)
              .columnValue('tzOffsetMillis', expense.tzOffsetMillis)
              .columnValue('currency', expense.currency)
              .columnValue('net', expense.net)
              .columnValue('vat', expense.vat)
              .where(wb => wb.column('rowid').e(expense.rowid)));
        if (insert) {
          expense.rowid = result[0].insertId;
        }
        return result[0].insertId;
    } catch (error) {
        DB._onError(error);
        return 0;
    }
  }
   
  static decodeBase64Image(dataString) 
  {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var response = {};

    if (matches.length !== 3) 
    {
      return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = Buffer.from(matches[2], 'base64');

    return response;
  }

  static async safeAddExpenseImages(expense) {
    // try {
      const imagesToUpload = [];
      const imageFolderId = await StaticUtils.getExpenseImageFolderId();
      for (let image of expense.images) {
        if (image.rowid === undefined) {
            image.rowid = (await SqlBuilder.insert('expenseImages', ib => ib
              .columnValue('expenseRowid', expense.rowid)
              .columnValue('mime', image.mime)
              .columnValue('width', image.width)
              .columnValue('height', image.height)))[0].insertId;
            
            let path = RNFS.DocumentDirectoryPath + '/expenses';
            await RNFS.mkdir(path);
            const extension = image.mime.split('/')[1];
            const fileName = `${expense.rowid}.${image.rowid}.${extension}`;
            
            path += `/${fileName}`;
            
            RNFS.writeFile(
              path,
              image.data,
              'base64');
            const scheme = 'file://';
            
            if (!path.startsWith(scheme)) {
              path = scheme + path;
            }
            SqlBuilder.update('expenseImages', ub => ub
              .columnValue('path', path)
              .where(wb => wb.column('rowid').e(image.rowid)));
            
            if (imageFolderId) {
              imagesToUpload.push(Object.assign({fileName}, image));
            }
        }
      }
      if (imagesToUpload.length > 0) {
        alert('Uploading Images to Google Drive...');
      }
        for (let image of imagesToUpload) {
          // console.log(image.data);
          // console.log(base64.fromByteArray(
          //       new Uint8Array(Array.from(base64.toByteArray(image.data)))));
          GDrive.permissions.create(imageFolderId, {
              role: 'reader',
              type: 'anyone'
          }).then((e,t) => {
            var base64Data = `data:${image.mime};base64,` + image.data;
            var imageBuffer = this.decodeBase64Image(base64Data);
            // var bitmap = new Buffer(image.data, 'base64');
            GDrive.files
              .createFileMultipart(Array.from(imageBuffer.data), image.mime, {
                parents: [imageFolderId],
                name: image.fileName
              })
              .then(result => {
                if (!result.ok) {
                  throw result;
                }
                result.json().then(json => {
                  SqlBuilder.update("expenseImages", ub =>
                    ub
                      .columnValue("id", json.id)
                      .where(wb => wb.column("rowid").e(image.rowid))
                  );

                  console.log("Setting an expense image permissions...");

                  GDrive.permissions.create(json.id, {
                    role: "reader",
                    type: "anyone"
                  });
                });
              });
          });
          
        }
    // } catch (error) {
    //   DB._onError(error);
    // }
  }
   
   static async deleteExpenseImage(image) {
      let result = false;
      
      try {
         await SqlBuilder.delete('expenseImages',
            db => db.column('rowid').e(image.rowid));
         
         result = true;
         
         await GDrive.files.delete(image.id);
      } catch (error) {
         DB._onError(error);
      }
      
      return result;
   }
   
   static async loadExpense(rowid) {
      try {
         let expense = (await SqlBuilder.select(sb => DB
            ._fillExpenseSelectBuilder(sb)
            .column('standalone')
            .column('expenseType')
            .where(wb => wb.column('expenses.rowid').e(rowid))))[0].rows.item(0);
         expense.images = [];
      
         const [result] = await SqlBuilder.select(sb => sb
            .column('rowid')
            .column('path')
            .column('mime')
            .column('width')
            .column('height')
            .column('id')
            .from('expenseImages')
            .where(wb => wb.column('expenseRowid').e(expense.rowid)));
         for (let i = 0; i < result.rows.length; i += 1) {
            expense.images.push(result.rows.item(i));
         }
         if (!expense.standalone) {
            expense.journey = {
               rowid: expense.linkedTo,
               timestamp: (await SqlBuilder.select(sb => sb
                  .column('millis', 'timestamp')
                  .from('points')
                  .where(wb => wb.column('journeyRowid').e(expense.linkedTo))
                  .orderBy('rowid')
                  .limit(1)
               ))[0].rows.item(0).timestamp
            };
            expense.journey.timestamp = moment.utc(expense.journey.timestamp).format('DD MMM YYYY');
         }
         return expense;
      } catch (error) {
         DB._onError(error);
      }
   }
   
   static async loadExpenseImagesPathId(rowid) {
      const data = [];
      
      try {
         const [result] = await SqlBuilder.select(sb => sb
            .column('path')
            .column('id')
            .from('expenseImages')
            .where(wb => wb.column('expenseRowid').e(rowid)));
         
         for (let i = 0; i < result.rows.length; i += 1) {
            data.push(result.rows.item(i));
         }
      } catch (error) {
         DB._onError(error);
      }
      
      return data;
   }
   
   static async deleteExpense(rowid) {
      return await DB._deleteExpenses([rowid]);
   }
   
   static _onError(error) {
//      console.log(`DB._onError: ${JSON.stringify(error)}`);
   }
   
   static async _deleteJourney(rowid) {
      try {
         await SqlBuilder.delete('journeys', wb => wb.column('rowid').e(rowid));
         
         Bluetooth.cancelNotification();
         
         const [result] = await SqlBuilder.select(sb => sb
            .column('rowid')
            .from('expenses')
            .where(wb => wb
               .column('standalone')
               .e(0)
               .and()
               .column('linkedTo')
               .e(rowid)));
         
         const expenseRowids = [];
         
         for (let i = 0; i < result.rows.length; i += 1) {
            expenseRowids.push(result.rows.item(i).rowid);
         }
         
         return !expenseRowids.length || await DB._deleteExpenses(expenseRowids);
      } catch (error) {
         DB._onError(error);
      }
   }
   
   static async _deleteExpenses(rowids) {
      let ok = false;
      
      try {
         const [result] = await SqlBuilder.select(sb => sb
            .column('id')
            .from('expenseImages')
            .where(wb => wb.column('expenseRowid').in(rowids)));
         
         const ids = [];
         
         for (let i = 0; i < result.rows.length; i++) {
            ids.push(result.rows.item(i).id);
         }
         
         await SqlBuilder.delete('expenses', wb => wb.column('rowid').in(rowids));
         
         ok = true;
         
         for (let id of ids) {
            await GDrive.files.delete(id);
         }
      } catch (error) {
         DB._onError(error);
      }
      
      return ok;
   }
   
   static _cancelledFinished(cancelled) {
      console.log(`Journey #${Preferences.currentJourney.rowid.getValue()} ` +
         `${cancelled ? 'cancelled' : 'finished'}.`);
      
      DB.actualUsed = undefined;
      
      Preferences.currentJourney.rowid.setValue(0);
      Preferences.currentJourney.firstPointRowid.setValue(0);
   }
   
   static async _addJourney(routeMode, manual) {
     console.log("a", routeMode, manual);
      const objects = [
         routeMode,
         Preferences.routes.avoid
      ];
      
      let sql = '';
      
      ['INSERT INTO journeys (manual,', `) VALUES (${manual},`].forEach(
         (sqlPart, sqlPartIndex) => {
            sql += sqlPart;
            
            objects.forEach((object, objectIndex) =>
               sql = Object.keys(object).reduce((previous, current, index) => {
                  return `${previous}${objectIndex || index ? ', ' : ''}` +
                     `${sqlPartIndex ? +object[current].getValue() : current}`;
               }, sql));
         });
      
      sql += ')';
      
      return (await DB.db.executeSql(sql))[0].insertId;
   }
   
   static _fillExpenseSelectBuilder(sb, standalone) {
      return sb
         .column('expenses.rowid', 'rowid')
         .column('linkedTo')
         .column('reason')
         .column('millis')
         .column('tzOffsetMillis')
         .column('expenses.currency', 'currency')
         .column('net')
         .column('vat')
         .column('type')
         .column('expenseTypes.code', 'code')
         .from('expenses', fb => {
            fb.innerJoin(
               'expenseTypes',
               'expenses.expenseType',
               'expenseTypes.rowid');
            
            if (standalone) {
               fb.innerJoin(
                  'journeyTypes',
                  'expenses.linkedTo',
                  'journeyTypes.rowid');
            }
         });
   }
}
