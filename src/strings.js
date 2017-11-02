import LocalizedStrings from 'react-native-localization';

const strings = new LocalizedStrings({
  en: {
    appName: 'JourneySmart',
    OK: 'OK',
    cancel: 'CANCEL',
    save: 'SAVE',
    finish: 'FINISH',
    YES: 'YES',
    NO: 'NO',
    selectBluetoothDevice: 'select Bluetooth device\u2026',

    journeySmart: {
      drawerActions: ['home', 'timeline', 'lists', 'settings', 'exit'],
      signedInAs: 'Signed in as:',
      hiddenOptions: {
        exportDB: 'Export DB',
        importDB: 'Import DB',
      },
    },
    db: {
      defaultJourneyTypeName: 'Personal',
      duplicateJourneyType: 'Employer <{0}, {1}, {2}> already exists.',
      duplicateExpenseType: 'Expense type <{0}, {1}> already exists.',
      duplicatePlace: 'Place <{0}> already exists.',
    },
    main: {
      startJourney: 'start journey',
      addExpense: 'add expense',
      addJourney: 'add journey',
      locationPermissionMissing: "There's a problem requesting Location permission. Please enable it manually from your device settings.",
      setup: 'setup screen'
    },
    startJourney: {
      title: 'Journey in progress\u2026',
      errors: {
        noProvider:
          'Please ensure at least one location ' +
          'method is enabled such as GPS, WiFi or Mobile Data.',
        timeout: 'Location unavailable.',
        offline: 'Check your internet connection.',
        reverseGeocodeZeroResults: "There's no address for your coordinates.",
        actualRouteModeUsedDisabled:
          'Actual route mode ' + 'was chosen to be used, but later disabled.',
      },
      prompts: {
        cancelJourney: 'Are you sure you want to cancel the current journey?',
        deleteBreadcrumbs: 'This will delete all the breadcrumbs.',
        finishJourney: 'Are you sure you want to finish the current journey?',
      },
      determiningLocation: 'Determining location\u2026',
      positionAcquired: 'POSITION ACQUIRED',
      cancelJourney: 'cancel journey',
      addWaypoint: '+WAYPOINT',
      addExpense: '+EXPENSE'
    },
    journeySummary: {
      title: 'Journey summary\u2026',
      resolvePosition: 'Resolving position {0} of {1}\u2026',
      reason: 'journey reason',
      actual: 'actual',
      fastest: 'fastest',
      shortest: 'shortest',
      discard: 'DISCARD',
    },
    journeyDetails: {
      miles: 'miles',
      km: 'KM',
      travelTime: 'travel time',
      actual: 'actual route',
      fastest: 'fastest route',
      shortest: 'shortest route',
      notesPlaceholder: 'Notes about the journey.',
    },
    expenses: {
      delete: 'Delete this expense?',
    },
    addExpense: {
      title: 'Add expense',
      noExpenseTypes: 'Please first add at least one expense type.',
      standaloneModes: ['to journey', 'as expense'],
      journey: 'journey',
      employer: 'employer',
      reason: 'reason',
      net: 'NET amount',
      vat: 'VAT amount',
      total: 'TOTAL:',
      addImage: '+ ADD RECEIPT',
    },
    addJourney: {
      title: 'Add journey',
      startPostcode: 'Enter start postcode',
      waypointPostcode: 'Enter waypoint {0} postcode',
      endPostcode: 'Enter end postcode',
      invalidPostcode: "'{0}' seems to be an invalid postcode.",
    },
    viewJourneys: {
      title: 'JOURNEYS',
      journey: 'JOURNEY',
      expense: 'EXPENSE',
      noReason: '<no reason>',
      noCode: '<no code>',
      journeyMenuOptions: {
        edit: 'Edit',
        delete: 'Delete',
      },
      journeysMenuOptions: {
        filter: 'Filter',
        export: 'Export',
      },
      promptDelete: 'Delete this journey?',
      subject: 'Export',
      mi: 'mi',
      km: 'km',
      clickHere: 'Click here',
    },
    journeyFilter: {
      title: 'FILTER',
      periods: ['today', 'last 7 days', 'last month', 'custom'],
      allEmployers: 'All employers',
      reset: 'reset',
      apply: 'search',
    },
    lists: {
      title: 'LISTS',
      headerItems: ['EMPLOYERS', 'EXPENSE TYPES', 'PLACES'],
    },
    journeyTypes: {
      perMile: 'per mile',
      perKm: 'per km',
    },
    journeyType: {
      active: 'ACTIVE',
      inactive: 'INACTIVE',
      name: 'Rate name',
      code: 'Code',
      rate: 'Rate',
      units: 'Units',
      miles: 'MILES',
      km: 'KM',
      noCode: '<no code>',
    },
    expenseType: {
      type: 'Type',
      code: 'Code',
    },
    settings: {
      title: 'Settings\u2026',
      routeOptions: 'ROUTE OPTIONS',
      routesAvailable: 'Routes available',
      shortest: 'Shortest',
      fastest: 'Fastest',
      actual: 'Actual (tracked)',
      noRouteMode: "At least one route mode except 'Actual route' must be selected.",
      avoidRoutes: 'Avoid routes that include',
      tolls: 'Tolls',
      motorways: 'Motorways',
      ferries: 'Ferries',
      defaultDashboard: 'DEFAULT DASHBOARD',
      displayStatisticsFor: 'Display statistics for',
      periods: ['TODAY', 'THIS WEEK', 'THIS MONTH'],
      autostart: ['AUTOSTART ON BOOT', 'Automatically start app on boot'],
      commuting: ['COMMUTING', 'Do you claim for ' + 'your commute to/from home/office?'],
      journeyTriggers: 'JOURNEY TRIGGERS',
      bluetooth: 'Bluetooth',
      starts: 'Starts a journey',
      ends: 'Ends a journey',
      bluetoothTrigger: 'Turn on/off Bluetooth',
      bluetoothSelection: 'Select Bluetooth trigger device',
    },
  },
  ru: {
    cancel: 'отмена',
    save: 'сохранить',
  },
});

module.exports = (className) => {
  const result = className ? { ...strings[className] } : {};

  if (result.all) {
    throw new Error('all already defined.');
  }

  result.all = strings;

  return result;
};
