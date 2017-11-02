import EStyleSheet from 'react-native-extended-stylesheet';
import { Platform } from 'react-native';
import StaticUtils from './StaticUtils';

const marginPadding = 15;
const textColor = 0x55606eff;
const backgroundColor = 0xe9e9e9ff;
const logoBlue = 0x0099cbff;
const customOrange = 0xf39c12ff;
const listSeparatorHeight = 5;
const elevation = 2;

const statusBarHeight = Platform.OS === 'ios' ? 20 : 0;

const header = {
  height: 50 + statusBarHeight,
  textColor: 'white',
  textFontSize: 20,
};

const headerAbsolute = {
  left: 0,
  top: statusBarHeight,
  position: 'absolute',
  justifyContent: 'center',
  height: header.height - statusBarHeight,
};

const textSmall = {
  color: textColor,
  fontSize: 14,
};

const textSmallMedium = {
  color: textColor,
  fontSize: 15,
};

const textMedium = {
  color: textColor,
  fontSize: 20,
};

const textLarge = {
  color: textColor,
  fontSize: 23,
};

const centerCenter = {
  justifyContent: 'center',
  alignItems: 'center',
};

const centerCenterFlex1 = {
  ...centerCenter,
  flex: 1,
};

const listItemContainer = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'white',
  borderRadius: 5,
};

const startJourneyPointContainerText = {
  ...textSmallMedium,
};

const startJourneyPointContainerHeight = header.height * 1.2;
const startJourneyPointContainerShapeMargin = marginPadding * 0.75;
const startJourneyPointContainerCircleRadius = 8;
const startJourneyPointContainerLineWidthDivider = 2;

const startJourneyPointContainerLineWidth =
  startJourneyPointContainerCircleRadius / startJourneyPointContainerLineWidthDivider;

const startJourneyPointContainerLineMargin =
  startJourneyPointContainerCircleRadius * (1 - 1 / startJourneyPointContainerLineWidthDivider) / 2;

const listEntities = {
  typeContainer: {
    ...listItemContainer,
    height: header.height * 1.2,
  },
  typeContainerText: {
    ...textSmallMedium,
    textAlign: 'center',
  },
};

const journeyTypeBlockText = {
  ...textSmallMedium,
  marginLeft: 0.5 * marginPadding,
  borderRadius: 5,
};

const journeySummaryContainer = {
  ...centerCenter,
  flexDirection: 'row',
  height: header.height * 1.05,
  backgroundColor: 'white',
  borderRadius: 5,
};

const journeyDetailsRowHeight = journeySummaryContainer.height * 1.1;
const journeyDetailsButtonsHeight = journeyDetailsRowHeight * 0.6;

const triangle = {
  width: 0,
  height: 0,
  borderLeftWidth: 8,
  borderTopWidth: 13,
  borderRightWidth: 8,
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
  
};

const viewJourneysCaptionHeight = journeyDetailsButtonsHeight;

const logoBlueButton = {
  container: {
    ...centerCenterFlex1,
    height: header.height,
    backgroundColor: logoBlue,
  },
  text: {
    ...textMedium,
    color: header.textColor,
  },
};

const globalStyles = {
  marginPadding,
  startJourneyPointContainerCircleRadius,
  journeyDetailsRowHeight,
  customOrange,
  journeyTypeActiveColor: 0xa9d18eff,
  journeyTypeInactiveColor: 0xf8caacff,
  textColorDisabled: 0xd0ceceff,
  activeOpacity: 0.5,
  journeySummaryBlockSeparatorSize: 2,

  bottomView: {
    flexDirection: 'row',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  listItemIndicator: {
    alignSelf: 'stretch',
    width: marginPadding * 0.75,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  menuOption: {
    ...textMedium,
  },
  centerCenterFlex1,
};

const styles = {
  ...globalStyles,
  sceneTitle: EStyleSheet.create({
    container: {
      ...centerCenter,
      height: header.height * 0.6,
      backgroundColor: logoBlue,
    },
    text: {
      color: header.textColor,
      fontSize: header.textFontSize,
    },
  }),
  logoBlueButton,
  listView: {
    margin: marginPadding,
    borderRadius: 5,
  },
  listSeparator: {
    height: listSeparatorHeight,
  },
  journeySmart: EStyleSheet.create({
    $drawer: {
      width: 0.8,
      type: 'overlay',
      panOpenMask: 0.1,
      panCloseMask: 0.4,
      darkeningColor: 0x00000080,
    },
    $headerIconsPadding: 0.5 * marginPadding,
    drawerPhoto: {
      flex: 1,
      width: '100% * $drawer.width',
      justifyContent: 'flex-end',
    },
    $signInInfo: {
      container: {
        alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: marginPadding * 0.5,
        borderRadius: 5,
      },
      text: {
        ...textSmallMedium,
        color: 'white',
        marginLeft: marginPadding * 0.5,
      },
      image: {
        marginHorizontal: marginPadding * 0.5,
      },
    },
    drawerActions: {
      flex: 3,
      backgroundColor: 'white',
    },
    drawerAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    drawerActionText: {
      ...textSmallMedium,
    },
    header: {
      height: header.height,
      backgroundColor: textColor,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: statusBarHeight,
    },
    headerDrawerButton: {
      ...headerAbsolute,
      left: '$headerIconsPadding',
    },
    headerImageAndText: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerText: {
      color: header.textColor,
      marginLeft: 10,
      fontSize: header.textFontSize,
      fontWeight: 'bold',
    },
    headerMenu: {
      top: statusBarHeight,
      position: 'absolute',
      justifyContent: 'center',
      height: header.height - statusBarHeight,
      right: 0,
    },
    navigator: {
      justifyContent: 'space-around',
      backgroundColor,
    },
  }),
  main: EStyleSheet.create({
    $currentRouteIndicatorElementColor: 0xceced0ff,
    $currentRouteIndicatorElementColorCurrent: 0x707076ff,
    statisticsButton: {
      flex: 1,
      backgroundColor: 'white',
      borderRadius: 5,
    },
    statisticsArea: {
      flex: 1,
      flexDirection: 'row',
      borderRadius: 5,
    },
    statisticsSubArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-around',
      borderRadius: 5,
    },
    statisticsPeriod: {
      ...textLarge,
      alignSelf: 'center',
      fontWeight: 'bold',
    },
    statisticsValue: {
      ...textMedium,
      fontWeight: 'bold',
      marginTop: 5,
    },
    statisticsTitle: {
      ...textSmall,
      marginBottom: 5,
    },
    currentRouteIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 0.5 * marginPadding,
    },
    currentRouteIndicatorElement: {
      $size: 10,
      width: '$size',
      height: '$size',
      borderRadius: '0.3 * $size',
    },
    button: {
      ...globalStyles.centerCenterFlex1,
      backgroundColor: 'white',
      marginTop: marginPadding,
      elevation,
      borderRadius: 5,
    },
    buttonText: {
      ...textLarge,
    },
  }),
  startJourney: EStyleSheet.create({
    error: {
      ...textSmallMedium,
      color: 'white',
      padding: marginPadding * 0.5,
      backgroundColor: 'red',
    },
    pointContainer: {
      ...listItemContainer,
      height: startJourneyPointContainerHeight,
    },
    pointContainerShape: {
      height: startJourneyPointContainerHeight,
      marginLeft: startJourneyPointContainerShapeMargin,
    },
    pointContainerCircle: {
      width: startJourneyPointContainerCircleRadius,
      height: startJourneyPointContainerCircleRadius,
      borderRadius: startJourneyPointContainerCircleRadius * 0.5,
      backgroundColor: logoBlue,
    },
    pointContainerLine: {
      width: startJourneyPointContainerLineWidth,
      height: (startJourneyPointContainerHeight - startJourneyPointContainerCircleRadius) * 0.5,
      marginLeft: startJourneyPointContainerLineMargin,
      backgroundColor: logoBlue,
    },
    pointContainerTime: {
      ...startJourneyPointContainerText,
      marginHorizontal: startJourneyPointContainerShapeMargin,
    },
    pointContainerAddress: {
      ...startJourneyPointContainerText,
      flex: 1,
    },
    separatorLine: {
      width: startJourneyPointContainerLineWidth,
      height: listSeparatorHeight,
      marginLeft: startJourneyPointContainerShapeMargin + startJourneyPointContainerLineMargin,
      backgroundColor: logoBlue,
    },
    $spinner: {
      size: 50,
      type: 'ThreeBounce',
      color: StaticUtils.spinkitColor(logoBlue),
      style: {
        alignSelf: 'center',
      },
    },
    cancelJourneyContainer: {
      flexDirection: 'row',
      alignSelf: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    cancelJourneyText: {
      ...textMedium,
      marginLeft: 5,
    },
  }),
  journeySummary: EStyleSheet.create({
    $container: journeySummaryContainer,
    type: {
      ...globalStyles.centerCenterFlex1,
      height: '$container.height * 0.6',
    },
    typeText: {
      ...globalStyles.menuOption,
      textAlign: 'center',
    },
    triangle: {
      ...triangle,
      marginLeft: marginPadding,
      borderTopColor: textColor,
    },
    reason: {
      ...journeySummaryContainer,
      ...textMedium,
      marginTop: globalStyles.journeySummaryBlockSeparatorSize,
      textAlign: 'center',
    },
    routeModes: {
      ...journeySummaryContainer,
      marginTop: globalStyles.journeySummaryBlockSeparatorSize,
    },
    routeMode: {
      ...globalStyles.centerCenterFlex1,
      height: journeySummaryContainer.height,
    },
    routeModeText: {
      ...textSmallMedium,
    },
  }),
  journeyDetails: EStyleSheet.create({
    container: {
      height: journeyDetailsRowHeight * 4,
      flexDirection: 'row',
    },
    containerRO: {
      height: journeyDetailsRowHeight * 4,
      justifyContent: 'center',
      backgroundColor: 'white',
    },
    postcodes: {
      flex: 1,
      backgroundColor: 'white',
    },
    postcode: {
      flex: 1,
      flexDirection: 'row',
    },
    shape: {
      flex: 1,
    },
    circle: {
      position: 'absolute',
      right: 0,
      width: startJourneyPointContainerCircleRadius,
      height: startJourneyPointContainerCircleRadius,
      borderRadius: startJourneyPointContainerCircleRadius * 0.5,
      backgroundColor: logoBlue,
    },
    line: {
      position: 'absolute',
      width: startJourneyPointContainerLineWidth,
      right: (startJourneyPointContainerCircleRadius - startJourneyPointContainerLineWidth) / 2,
      backgroundColor: logoBlue,
    },
    details: {
      flex: 1,
      backgroundColor: 'white',
      marginLeft: globalStyles.journeySummaryBlockSeparatorSize,
    },
    detail: {
      ...globalStyles.centerCenterFlex1,
      flex: 5,
    },
    name: textSmallMedium,
    value: {
      ...textLarge,
      fontWeight: 'bold',
    },
    notes: textMedium,
    notesRO: {
      ...textMedium,
      marginLeft: marginPadding * 0.5,
    },
    buttons: {
      flexDirection: 'row',
      height: journeyDetailsButtonsHeight,
      marginTop: globalStyles.journeySummaryBlockSeparatorSize,
    },
    buttonContainer: {
      ...globalStyles.centerCenterFlex1,
      backgroundColor: 'white',
    },
    currentButton: {
      width: 40,
      height: globalStyles.journeySummaryBlockSeparatorSize,
      backgroundColor: logoBlue,
    },
    buttonText: {
      ...textSmallMedium,
      color: logoBlue,
    },
  }),
  expenses: EStyleSheet.create({
    scene: {
      height: journeyDetailsRowHeight * 4,
      backgroundColor: 'white',
    },
    $expense: {
      container: {
        ...listItemContainer,
        height: header.height * 0.8,
        marginHorizontal: listSeparatorHeight,
        borderRadius: 5,
      },
      type: {
        ...textMedium,
        flex: 5,
      },
      total: {
        ...textMedium,
        flex: 3,
        textAlign: 'right',
      },
      edit: {
        marginHorizontal: marginPadding * 0.5,
      },
      delete: {
        flex: 1,
      },
    },
  }),
  addExpense: EStyleSheet.create({
    $marginTop: globalStyles.journeySummaryBlockSeparatorSize * 10,
    $marginRight: globalStyles.journeySummaryBlockSeparatorSize * 5,
    scrollView: {
      flex: 1,
      marginBottom: logoBlueButton.container.height + marginPadding,
    },
    total: {
      alignSelf: 'flex-end',
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginTop: '$marginTop',
    },
    totalText: {
      ...textSmallMedium,
      marginRight: '$marginRight',
    },
    totalSum: {
      ...textMedium,
      marginRight: '$marginRight * 0.5',
    },
    $addImage: {
      menuOptions: {
        flexDirection: 'row',
        justifyContent: 'center',
      },
      menuOptionImage: {
        width: 35,
        height: 35,
        alignSelf: 'center',
      },
    },
    image: {
      resizeMode: 'contain',
      marginTop: marginPadding,
      alignItems: 'flex-end',
    },
  }),
  addJourney: {
    date: {
      ...listItemContainer,
      justifyContent: 'center',
      height: startJourneyPointContainerHeight,
    },
    dateText: startJourneyPointContainerText,
    postcodes: {
      marginTop: listSeparatorHeight,
    },
    postcode: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    pointContainerShape: {
      height: startJourneyPointContainerHeight,
      paddingLeft: startJourneyPointContainerShapeMargin,
      backgroundColor: 'white',
      borderTopLeftRadius: 5,
      borderBottomLeftRadius: 5,
    },
    postcodeText: {
      ...startJourneyPointContainerText,
      flex: 1,
      height: startJourneyPointContainerHeight,
      textAlign: 'center',
      backgroundColor: listItemContainer.backgroundColor,
      borderTopRightRadius: 5,
      borderBottomRightRadius: 5,
    },
    deleteWaypoint: {
      marginLeft: marginPadding,
    },
  },
  viewJourneys: EStyleSheet.create({
    $borderRadius: 3,
    $noRouteModeCaptionColor: 'red',
    container: {
      flex: 1,
      marginBottom: 0,
      marginHorizontal: marginPadding,
      elevation,
      borderRadius: 5,
      backgroundColor,
    },
    caption: {
      height: viewJourneysCaptionHeight,
      backgroundColor: 0x4baf4eff,
      justifyContent: 'center',
      paddingLeft: marginPadding,
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
    },
    captionText: {
      ...textSmallMedium,
      color: 'white',
      fontWeight: 'bold',
    },
    triangle: {
      ...triangle,
      position: 'absolute',
      top: (viewJourneysCaptionHeight - triangle.borderTopWidth) / 2,
      right: marginPadding,
      borderTopColor: 'white',
      borderBottomColor: 'black',
    },
    title: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      height: journeyDetailsRowHeight,
    },
    date: {
      ...centerCenter,
      flex: 2,
    },
    type: {
      ...centerCenter,
      flex: 4,
    },
    sum: {
      ...centerCenter,
      flex: 2,
    },
    smallText: textSmallMedium,
    largeText: {
      ...textLarge,
      fontWeight: 'bold',
    },
  }),
  journeyFilter: EStyleSheet.create({
    scene: {
      marginHorizontal: marginPadding,
      marginTop: marginPadding,
    },
    periods: {
      ...journeySummaryContainer,
      backgroundColor: 'transparent',
    },
    buttons: {
      flexDirection: 'row',
      marginTop: marginPadding,
    },
  }),
  journeyTypes: EStyleSheet.create({
    typeContainerText: {
      ...listEntities.typeContainerText,
      flex: 1,
    },
    typeContainerRate: {
      flex: 1,
      alignSelf: 'stretch',
      justifyContent: 'center',
    },
    typeContainerRateDistance: {
      ...textSmall,
      textAlign: 'center',
    },
  }),
  journeyType: EStyleSheet.create({
    $activityHeight: 0.8 * header.height,
    $blockHeight: '1.5 * $activityHeight',
    activity: {
      flexDirection: 'row',
      height: '$activityHeight',
    },
    active: {
      ...globalStyles.centerCenterFlex1,
      backgroundColor: globalStyles.journeyTypeActiveColor,
    },
    inactive: {
      ...globalStyles.centerCenterFlex1,
      backgroundColor: globalStyles.journeyTypeInactiveColor,
    },
    activityText: {
      ...textLarge,
      fontWeight: 'bold',
    },
    block: {
      height: '$blockHeight',
      backgroundColor: 'white',
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: marginPadding,
      borderRadius: 5,
    },
    blockText1: {
      ...journeyTypeBlockText,
      flex: 5,
    },
    blockText2: {
      ...journeyTypeBlockText,
      flex: 10,
    },
    blockInput: {
      ...textMedium,
      flex: 5,
    },
    distanceUnit: {
      flex: 11,
      flexDirection: 'row',
      height: '$blockHeight',
    },
    distanceUnitText: {
      ...textMedium,
    },
  }),
  lists: EStyleSheet.create({
    header: {
      flexDirection: 'row',
      backgroundColor: logoBlue,
    },
    headerItem: {
      flex: 1,
      justifyContent: 'center',
    },
    headerItemText: {
      fontSize: textSmall.fontSize,
      color: 'white',
      marginVertical: 7,
      alignSelf: 'center',
    },
    headerItemUnderline: {
      height: 6,
    },
  }),
  listEntities: EStyleSheet.create({
    typeContainer: {
      ...listEntities.typeContainer,
      justifyContent: 'center',
    },
    typeContainerText: listEntities.typeContainerText,
    add: {
      $size: 50,
      position: 'absolute',
      right: marginPadding,
      bottom: marginPadding,
      width: '$size',
      height: '$size',
      borderRadius: '$size * 0.5',
      backgroundColor: logoBlue,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
    },
  }),
  settings: EStyleSheet.create({
    $sectionTitle: {
      container: {
        justifyContent: 'center',
        backgroundColor: 'gray',
        paddingLeft: marginPadding * 0.5,
        paddingVertical: marginPadding * 0.5,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
      },
      text: {
        ...textSmall,
        color: 'white',
      },
    },
    $subsectionTitle: {
      container: {
        justifyContent: 'center',
        backgroundColor: 'darkgray',
        paddingLeft: marginPadding * 0.5,
        paddingVertical: marginPadding * 0.5,
      },
      text: {
        ...textSmallMedium,
        color: 'white',
      },
    },
    $switchEntry: {
      container: {
        height: 40,
        paddingRight: marginPadding * 0.75,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
      },
      image: {
        marginHorizontal: marginPadding * 0.75,
      },
      text: {
        ...textSmallMedium,
        flex: 5,
      },
      $switch: {
        height: 15,
        buttonRadius: 9,
        activeButtonColor: logoBlue,
        inactiveButtonColor: 0xb1b7b7ff,
        activeBackgroundColor: textColor,
        inactiveBackgroundColor: 'lightgray',
      },
    },
  }),
  selectBluetoothDevice: EStyleSheet.create({
    deviceContainer: {
      ...listItemContainer,
      height: header.height * 1,
      borderRadius: 5,
    },
    deviceName: {
      ...textSmallMedium,
      textAlign: 'center',
      flex: 1,
    },
  }),
};

// const stls = require('react-native-common-utils/js/styles');

// stls.create();
// stls.build();

module.exports = (className) => {
  let result;
  // console.log(className);
  // console.log(JSON.stringify(styles));
  if (!className) {
    result = styles;
  } else {
    result = { ...styles[className] };

    if (result.all) {
      throw new Error('all already defined.');
    }

    result.all = styles;
  }

  EStyleSheet.build();

  return result;
};
