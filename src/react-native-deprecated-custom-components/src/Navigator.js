/* eslint-disable no-underscore-dangle */

import React, { Component, PropTypes } from 'react';
import reactMixin from 'react-mixin';
import {
  Dimensions,
  PanResponder,
  NativeModules,
  StyleSheet,
  TVEventHandler,
  View,
  ViewPropTypes,
} from 'react-native';

var buildStyleInterpolator = require('./buildStyleInterpolator');
var AnimationsDebugModule = NativeModules.AnimationsDebugModule;
var InteractionMixin = require('./InteractionMixin');
var NavigationContext = require('./NavigationContext');
var NavigatorBreadcrumbNavigationBar = require('./NavigatorBreadcrumbNavigationBar');
var NavigatorNavigationBar = require('./NavigatorNavigationBar');
var NavigatorSceneConfigs = require('./NavigatorSceneConfigs');

var Subscribable = require('./Subscribable');
var TimerMixin = require('react-timer-mixin');

var clamp = require('./clamp');
var invariant = require('fbjs/lib/invariant');
var rebound = require('rebound');

var flattenStyle = require('./flattenStyle');

//var PropTypes = require('prop-types');

// TODO: this is not ideal because there is no guarantee that the navigator
// is full screen, however we don't have a good way to measure the actual
// size of the navigator right now, so this is the next best thing.
var SCREEN_WIDTH = Dimensions.get('window').width;
var SCREEN_HEIGHT = Dimensions.get('window').height;
var SCENE_DISABLED_NATIVE_PROPS = {
  pointerEvents: 'none',
  style: {
    top: SCREEN_HEIGHT,
    bottom: -SCREEN_HEIGHT,
    opacity: 0,
  },
};

var __uid = 0;
function getuid() {
  return __uid++;
}

function getRouteID(route) {
  if (route === null || typeof route !== 'object') {
    return String(route);
  }

  var key = '__navigatorRouteID';

  if (!route.hasOwnProperty(key)) {
    Object.defineProperty(route, key, {
      enumerable: false,
      configurable: false,
      writable: false,
      value: getuid(),
    });
  }
  return route[key];
}


const BASE_SCENE_STYLE = {
  position: 'absolute',
  overflow: 'hidden',
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
};

const DEFAULT_SCENE_STYLE = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
  transform: [
    {translateX: 0},
    {translateY: 0},
    {scaleX: 1},
    {scaleY: 1},
    {rotate: '0deg'},
    {skewX: '0deg'},
    {skewY: '0deg'},
  ],
};

// styles moved to the top of the file so getDefaultProps can refer to it
var styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  defaultSceneStyle: DEFAULT_SCENE_STYLE,
  baseScene: BASE_SCENE_STYLE,
  disabledScene: {
    top: SCREEN_HEIGHT,
    bottom: -SCREEN_HEIGHT,
  },
  transitioner: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  }
});

var GESTURE_ACTIONS = [
  'pop',
  'jumpBack',
  'jumpForward',
];

export default class Navigator extends Component {
  static BreadcrumbNavigationBar = NavigatorBreadcrumbNavigationBar;
  static NavigationBar = NavigatorNavigationBar;
  static SceneConfigs = NavigatorSceneConfigs;

  static defaultProps = {
    configureScene: () => NavigatorSceneConfigs.PushFromRight,
    sceneStyle: DEFAULT_SCENE_STYLE,
  };

  propTypes: {
    /**
     * Optional function where you can configure scene animations and
     * gestures. Will be invoked with `route` and `routeStack` parameters,
     * where `route` corresponds to the current scene being rendered by the
     * `Navigator` and `routeStack` is the set of currently mounted routes
     * that the navigator could transition to.
     *
     * The function should return a scene configuration object.
     *
     * ```
     * (route, routeStack) => Navigator.SceneConfigs.FloatFromRight
     * ```
     *
     * Available scene configuration options are:
     *
     *  - Navigator.SceneConfigs.PushFromRight (default)
     *  - Navigator.SceneConfigs.FloatFromRight
     *  - Navigator.SceneConfigs.FloatFromLeft
     *  - Navigator.SceneConfigs.FloatFromBottom
     *  - Navigator.SceneConfigs.FloatFromBottomAndroid
     *  - Navigator.SceneConfigs.FadeAndroid
     *  - Navigator.SceneConfigs.SwipeFromLeft
     *  - Navigator.SceneConfigs.HorizontalSwipeJump
     *  - Navigator.SceneConfigs.HorizontalSwipeJumpFromRight
     *  - Navigator.SceneConfigs.HorizontalSwipeJumpFromLeft
     *  - Navigator.SceneConfigs.VerticalUpSwipeJump
     *  - Navigator.SceneConfigs.VerticalDownSwipeJump
     *
     */
    configureScene: PropTypes.func,

    /**
     * Required function which renders the scene for a given route. Will be
     * invoked with the `route` and the `navigator` object.
     *
     * ```
     * (route, navigator) =>
     *   <MySceneComponent title={route.title} navigator={navigator} />
     * ```
     */
    renderScene: PropTypes.func.isRequired,

    /**
     * The initial route for navigation. A route is an object that the navigator
     * will use to identify each scene it renders.
     *
     * If both `initialRoute` and `initialRouteStack` props are passed to
     * `Navigator`, then `initialRoute` must be in a route in
     * `initialRouteStack`. If `initialRouteStack` is passed as a prop but
     * `initialRoute` is not, then `initialRoute` will default internally to
     * the last item in `initialRouteStack`.
     */
    initialRoute: PropTypes.object,

    /**
     * Pass this in to provide a set of routes to initially mount. This prop
     * is required if `initialRoute` is not provided to the navigator. If this
     * prop is not passed in, it will default internally to an array
     * containing only `initialRoute`.
     */
    initialRouteStack: PropTypes.array,

    /**
     * Pass in a function to get notified with the target route when
     * the navigator component is mounted and before each navigator transition.
     */
    onWillFocus: PropTypes.func,

    /**
     * Will be called with the new route of each scene after the transition is
     * complete or after the initial mounting.
     */
    onDidFocus: PropTypes.func,

    /**
     * Use this to provide an optional component representing a navigation bar
     * that is persisted across scene transitions. This component will receive
     * two props: `navigator` and `navState` representing the navigator
     * component and its state. The component is re-rendered when the route
     * changes.
     */
    navigationBar: PropTypes.node,

    /**
     * Optionally pass in the navigator object from a parent `Navigator`.
     */
    navigator: PropTypes.object,

    /**
     * Styles to apply to the container of each scene.
     */
    sceneStyle: ViewPropTypes.style,
  }

  constructor(props) {
    super(props);
    this.state = this.getInitialState();
  }

  getInitialState() {
    this._navigationBarNavigator = this.props.navigationBarNavigator || this;

    this._renderedSceneMap = new Map();

    this._sceneRefs = [];
    const routeStack = this.props.initialRouteStack || [this.props.initialRoute];

    invariant(
      routeStack.length >= 1,
      'Navigator requires props.initialRoute or props.initialRouteStack.',
    );

    let initialRouteIndex = routeStack.length - 1;
    if (this.props.initialRoute) {
      initialRouteIndex = routeStack.indexOf(this.props.initialRoute);
      invariant(
        initialRouteIndex !== -1,
        'initialRoute is not in initialRouteStack.',
      );
    }

    return {
      sceneConfigStack: routeStack.map(
        (route) => this.props.configureScene(route, routeStack),
      ),
      routeStack,
      presentedIndex: initialRouteIndex,
      transitionFromIndex: null,
      activeGesture: null,
      pendingGestureProgress: null,
      transitionQueue: [],
    };
  }

  componentWillMount() {
    // TODO(t7489503): Don't need this once ES6 Class landed.
    this.__defineGetter__('navigationContext', this._getNavigationContext);

    this._subRouteFocus = [];
    this.parentNavigator = this.props.navigator;
    this._handlers = {};
    this.springSystem = new rebound.SpringSystem();
    this.spring = this.springSystem.createSpring();
    this.spring.setRestSpeedThreshold(0.05);
    this.spring.setCurrentValue(0).setAtRest();
    this.spring.addListener({
      onSpringEndStateChange: () => {
        if (!this._interactionHandle) {
          this._interactionHandle = this.createInteractionHandle();
        }
      },
      onSpringUpdate: () => {
        this._handleSpringUpdate();
      },
      onSpringAtRest: () => {
        this._completeTransition();
      },
    });
    this.panGesture = PanResponder.create({
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder.bind(this),
      onPanResponderRelease: this._handlePanResponderRelease.bind(this),
      onPanResponderMove: this._handlePanResponderMove.bind(this),
      onPanResponderTerminate: this._handlePanResponderTerminate.bind(this),
    });
    this._interactionHandle = null;
    this._emitWillFocus(this.state.routeStack[this.state.presentedIndex]);
  }

  componentDidMount() {
    this._isMounted = true;
    this._handleSpringUpdate();
    this._emitDidFocus(this.state.routeStack[this.state.presentedIndex]);
    this._enableTVEventHandler();
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this._navigationContext) {
      this._navigationContext.dispose();
      this._navigationContext = null;
    }

    this.spring.destroy();

    if (this._interactionHandle) {
      this.clearInteractionHandle(this._interactionHandle);
    }

    this._disableTVEventHandler();
  }


  /**
   * Returns the current list of routes.
   */
  getCurrentRoutes() {
    // Clone before returning to avoid caller mutating the stack
    return this.state.routeStack.slice();
  }

  _transitionTo(destIndex, velocity, jumpSpringTo, cb) {
    if (this.state.presentedIndex === destIndex) {
      cb && cb();
      return;
    }

    if (this.state.transitionFromIndex !== null) {
      // Navigation is still transitioning, put the `destIndex` into queue.
      this.state.transitionQueue.push({
        destIndex,
        velocity,
        cb,
      });
      return;
    }

    this.state.transitionFromIndex = this.state.presentedIndex;
    this.state.presentedIndex = destIndex;
    this.state.transitionCb = cb;
    this._onAnimationStart();
    if (AnimationsDebugModule) {
      AnimationsDebugModule.startRecordingFps();
    }
    
    const sceneConfig = this.state.sceneConfigStack[this.state.transitionFromIndex] ||
      this.state.sceneConfigStack[this.state.presentedIndex];
    invariant(
      sceneConfig,
      'Cannot configure scene at index ' + this.state.transitionFromIndex
    );
    if (jumpSpringTo != null) {
      this.spring.setCurrentValue(jumpSpringTo);
    }
    this.spring.setOvershootClampingEnabled(true);
    this.spring.getSpringConfig().friction = sceneConfig.springFriction;
    this.spring.getSpringConfig().tension = sceneConfig.springTension;
    this.spring.setVelocity(velocity || sceneConfig.defaultTransitionVelocity);
    this.spring.setEndValue(1);
  }

  /**
   * This happens for each frame of either a gesture or a transition. If both are
   * happening, we only set values for the transition and the gesture will catch up later
   */
  _handleSpringUpdate() {
    if (!this._isMounted) {
      return;
    }
    // Prioritize handling transition in progress over a gesture:
    if (this.state.transitionFromIndex != null) {
      this._transitionBetween(
        this.state.transitionFromIndex,
        this.state.presentedIndex,
        this.spring.getCurrentValue()
      );
    } else if (this.state.activeGesture != null) {
      var presentedToIndex = this.state.presentedIndex + this._deltaForGestureAction(this.state.activeGesture);
      this._transitionBetween(
        this.state.presentedIndex,
        presentedToIndex,
        this.spring.getCurrentValue()
      );
    }
  }

  /**
   * This happens at the end of a transition started by transitionTo, and when the spring catches up to a pending gesture
   */
  _completeTransition() {
    if (!this._isMounted) {
      return;
    }

    if (this.spring.getCurrentValue() !== 1 && this.spring.getCurrentValue() !== 0) {
      // The spring has finished catching up to a gesture in progress. Remove the pending progress
      // and we will be in a normal activeGesture state
      if (this.state.pendingGestureProgress) {
        this.state.pendingGestureProgress = null;
      }
      return;
    }
    this._onAnimationEnd();
    var presentedIndex = this.state.presentedIndex;
    var didFocusRoute = this._subRouteFocus[presentedIndex] || this.state.routeStack[presentedIndex];

    if (AnimationsDebugModule) {
      AnimationsDebugModule.stopRecordingFps(Date.now());
    }
    this.state.transitionFromIndex = null;
    this.spring.setCurrentValue(0).setAtRest();
    this._hideScenes();
    if (this.state.transitionCb) {
      this.state.transitionCb();
      this.state.transitionCb = null;
    }

    this._emitDidFocus(didFocusRoute);

    if (this._interactionHandle) {
      this.clearInteractionHandle(this._interactionHandle);
      this._interactionHandle = null;
    }
    if (this.state.pendingGestureProgress) {
      // A transition completed, but there is already another gesture happening.
      // Enable the scene and set the spring to catch up with the new gesture
      var gestureToIndex = this.state.presentedIndex + this._deltaForGestureAction(this.state.activeGesture);
      this._enableScene(gestureToIndex);
      this.spring.setEndValue(this.state.pendingGestureProgress);
      return;
    }
    if (this.state.transitionQueue.length) {
      var queuedTransition = this.state.transitionQueue.shift();
      this._enableScene(queuedTransition.destIndex);
      this._emitWillFocus(this.state.routeStack[queuedTransition.destIndex]);
      this._transitionTo(
        queuedTransition.destIndex,
        queuedTransition.velocity,
        null,
        queuedTransition.cb
      );
    }
  }

  _emitDidFocus(route) {
    this.navigationContext.emit('didfocus', {route: route});

    if (this.props.onDidFocus) {
      this.props.onDidFocus(route);
    }
  }

  _emitWillFocus(route) {
    console.log('willfocus');
    this.navigationContext.emit('willfocus', {route: route});

    var navBar = this._navBar;
    if (navBar && navBar.handleWillFocus) {
      navBar.handleWillFocus(route);
    }
    if (this.props.onWillFocus) {
      this.props.onWillFocus(route);
    }
  }

  /**
   * Hides all scenes that we are not currently on, gesturing to, or transitioning from
   */
  _hideScenes() {
    var gesturingToIndex = null;
    if (this.state.activeGesture) {
      gesturingToIndex = this.state.presentedIndex + this._deltaForGestureAction(this.state.activeGesture);
    }
    for (var i = 0; i < this.state.routeStack.length; i++) {
      if (i === this.state.presentedIndex ||
          i === this.state.transitionFromIndex ||
          i === gesturingToIndex) {
        continue;
      }
      this._disableScene(i);
    }
  }

  /**
   * Push a scene off the screen, so that opacity:0 scenes will not block touches sent to the presented scenes
   */
  _disableScene(sceneIndex) {
    this._sceneRefs[sceneIndex] &&
      this._sceneRefs[sceneIndex].setNativeProps(SCENE_DISABLED_NATIVE_PROPS);
  }

  /**
   * Put the scene back into the state as defined by props.sceneStyle, so transitions can happen normally
   */
  _enableScene(sceneIndex) {
    // First, determine what the defined styles are for scenes in this navigator
    var sceneStyle = flattenStyle([BASE_SCENE_STYLE, this.props.sceneStyle]);
    // Then restore the pointer events and top value for this scene
    var enabledSceneNativeProps = {
      pointerEvents: 'auto',
      style: {
        top: sceneStyle.top,
        bottom: sceneStyle.bottom,
      },
    };
    if (sceneIndex !== this.state.transitionFromIndex &&
        sceneIndex !== this.state.presentedIndex) {
      // If we are not in a transition from this index, make sure opacity is 0
      // to prevent the enabled scene from flashing over the presented scene
      enabledSceneNativeProps.style.opacity = 0;
    }
    this._sceneRefs[sceneIndex] &&
      this._sceneRefs[sceneIndex].setNativeProps(enabledSceneNativeProps);
  }

  _clearTransformations(sceneIndex) {
    const defaultStyle = flattenStyle([DEFAULT_SCENE_STYLE]);
    this._sceneRefs[sceneIndex].setNativeProps({ style: defaultStyle });
  }

  _onAnimationStart() {
    var fromIndex = this.state.presentedIndex;
    var toIndex = this.state.presentedIndex;
    if (this.state.transitionFromIndex != null) {
      fromIndex = this.state.transitionFromIndex;
    } else if (this.state.activeGesture) {
      toIndex = this.state.presentedIndex + this._deltaForGestureAction(this.state.activeGesture);
    }
    this._setRenderSceneToHardwareTextureAndroid(fromIndex, true);
    this._setRenderSceneToHardwareTextureAndroid(toIndex, true);
    var navBar = this._navBar;
    if (navBar && navBar.onAnimationStart) {
      navBar.onAnimationStart(fromIndex, toIndex);
    }
  }

  _onAnimationEnd() {
    var max = this.state.routeStack.length - 1;
    for (var index = 0; index <= max; index++) {
      this._setRenderSceneToHardwareTextureAndroid(index, false);
    }

    var navBar = this._navBar;
    if (navBar && navBar.onAnimationEnd) {
      navBar.onAnimationEnd();
    }
  }

  _setRenderSceneToHardwareTextureAndroid(sceneIndex, shouldRenderToHardwareTexture) {
    var viewAtIndex = this._sceneRefs[sceneIndex];
    if (viewAtIndex === null || viewAtIndex === undefined) {
      return;
    }
    viewAtIndex.setNativeProps({renderToHardwareTextureAndroid: shouldRenderToHardwareTexture});
  }

  _handleTouchStart() {
    this._eligibleGestures = GESTURE_ACTIONS;
  }

  _handleMoveShouldSetPanResponder(e, gestureState) {
    var sceneConfig = this.state.sceneConfigStack[this.state.presentedIndex];
    if (!sceneConfig) {
      return false;
    }
    this._expectingGestureGrant =
      this._matchGestureAction(this._eligibleGestures, sceneConfig.gestures, gestureState);
    return !!this._expectingGestureGrant;
  }

  _doesGestureOverswipe(gestureName) {
    var wouldOverswipeBack = this.state.presentedIndex <= 0 &&
      (gestureName === 'pop' || gestureName === 'jumpBack');
    var wouldOverswipeForward = this.state.presentedIndex >= this.state.routeStack.length - 1 &&
      gestureName === 'jumpForward';
    return wouldOverswipeForward || wouldOverswipeBack;
  }

  _deltaForGestureAction(gestureAction) {
    switch (gestureAction) {
      case 'pop':
      case 'jumpBack':
        return -1;
      case 'jumpForward':
        return 1;
      default:
        invariant(false, 'Unsupported gesture action ' + gestureAction);
        return;
    }
  }

  _handlePanResponderRelease(e, gestureState) {
    var sceneConfig = this.state.sceneConfigStack[this.state.presentedIndex];
    var releaseGestureAction = this.state.activeGesture;
    if (!releaseGestureAction) {
      // The gesture may have been detached while responder, so there is no action here
      return;
    }
    var releaseGesture = sceneConfig.gestures[releaseGestureAction];
    var destIndex = this.state.presentedIndex + this._deltaForGestureAction(this.state.activeGesture);
    if (this.spring.getCurrentValue() === 0) {
      // The spring is at zero, so the gesture is already complete
      this.spring.setCurrentValue(0).setAtRest();
      this._completeTransition();
      return;
    }
    var isTravelVertical = releaseGesture.direction === 'top-to-bottom' || releaseGesture.direction === 'bottom-to-top';
    var isTravelInverted = releaseGesture.direction === 'right-to-left' || releaseGesture.direction === 'bottom-to-top';
    var velocity, gestureDistance;
    if (isTravelVertical) {
      velocity = isTravelInverted ? -gestureState.vy : gestureState.vy;
      gestureDistance = isTravelInverted ? -gestureState.dy : gestureState.dy;
    } else {
      velocity = isTravelInverted ? -gestureState.vx : gestureState.vx;
      gestureDistance = isTravelInverted ? -gestureState.dx : gestureState.dx;
    }
    var transitionVelocity = clamp(-10, velocity, 10);
    if (Math.abs(velocity) < releaseGesture.notMoving) {
      // The gesture velocity is so slow, is "not moving"
      var hasGesturedEnoughToComplete = gestureDistance > releaseGesture.fullDistance * releaseGesture.stillCompletionRatio;
      transitionVelocity = hasGesturedEnoughToComplete ? releaseGesture.snapVelocity : -releaseGesture.snapVelocity;
    }
    if (transitionVelocity < 0 || this._doesGestureOverswipe(releaseGestureAction)) {
      // This gesture is to an overswiped region or does not have enough velocity to complete
      // If we are currently mid-transition, then this gesture was a pending gesture. Because this gesture takes no action, we can stop here
      if (this.state.transitionFromIndex == null) {
        // There is no current transition, so we need to transition back to the presented index
        var transitionBackToPresentedIndex = this.state.presentedIndex;
        // slight hack: change the presented index for a moment in order to transitionTo correctly
        this.state.presentedIndex = destIndex;
        this._transitionTo(
          transitionBackToPresentedIndex,
          -transitionVelocity,
          1 - this.spring.getCurrentValue()
        );
      }
    } else {
      // The gesture has enough velocity to complete, so we transition to the gesture's destination
      this._emitWillFocus(this.state.routeStack[destIndex]);
      this._transitionTo(
        destIndex,
        transitionVelocity,
        null,
        () => {
          if (releaseGestureAction === 'pop') {
            this._cleanScenesPastIndex(destIndex);
          }
        }
      );
    }
    this._detachGesture();
  }

  _handlePanResponderTerminate(e, gestureState) {
    if (this.state.activeGesture == null) {
      return;
    }
    var destIndex = this.state.presentedIndex + this._deltaForGestureAction(this.state.activeGesture);
    this._detachGesture();
    var transitionBackToPresentedIndex = this.state.presentedIndex;
    // slight hack: change the presented index for a moment in order to transitionTo correctly
    this.state.presentedIndex = destIndex;
    this._transitionTo(
      transitionBackToPresentedIndex,
      null,
      1 - this.spring.getCurrentValue()
    );
  }

  _attachGesture(gestureId) {
    this.state.activeGesture = gestureId;
    var gesturingToIndex = this.state.presentedIndex + this._deltaForGestureAction(this.state.activeGesture);
    this._enableScene(gesturingToIndex);
  }

  _detachGesture() {
    this.state.activeGesture = null;
    this.state.pendingGestureProgress = null;
    this._hideScenes();
  }

  _handlePanResponderMove(e, gestureState) {
    if (this._isMoveGestureAttached !== undefined) {
      invariant(
        this._expectingGestureGrant,
        'Responder granted unexpectedly.'
      );
      this._attachGesture(this._expectingGestureGrant);
      this._onAnimationStart();
      this._expectingGestureGrant = undefined;
    }

    var sceneConfig = this.state.sceneConfigStack[this.state.presentedIndex];
    if (this.state.activeGesture) {
      var gesture = sceneConfig.gestures[this.state.activeGesture];
      return this._moveAttachedGesture(gesture, gestureState);
    }
    var matchedGesture = this._matchGestureAction(GESTURE_ACTIONS, sceneConfig.gestures, gestureState);
    if (matchedGesture) {
      this._attachGesture(matchedGesture);
    }
  }

  _moveAttachedGesture(gesture, gestureState) {
    var isTravelVertical = gesture.direction === 'top-to-bottom' || gesture.direction === 'bottom-to-top';
    var isTravelInverted = gesture.direction === 'right-to-left' || gesture.direction === 'bottom-to-top';
    var distance = isTravelVertical ? gestureState.dy : gestureState.dx;
    distance = isTravelInverted ? -distance : distance;
    var gestureDetectMovement = gesture.gestureDetectMovement;
    var nextProgress = (distance - gestureDetectMovement) /
      (gesture.fullDistance - gestureDetectMovement);
    if (nextProgress < 0 && gesture.isDetachable) {
      var gesturingToIndex = this.state.presentedIndex + this._deltaForGestureAction(this.state.activeGesture);
      this._transitionBetween(this.state.presentedIndex, gesturingToIndex, 0);
      this._detachGesture();
      if (this.state.pendingGestureProgress != null) {
        this.spring.setCurrentValue(0);
      }
      return;
    }
    if (gesture.overswipe && this._doesGestureOverswipe(this.state.activeGesture)) {
      var frictionConstant = gesture.overswipe.frictionConstant;
      var frictionByDistance = gesture.overswipe.frictionByDistance;
      var frictionRatio = 1 / ((frictionConstant) + (Math.abs(nextProgress) * frictionByDistance));
      nextProgress *= frictionRatio;
    }
    nextProgress = clamp(0, nextProgress, 1);
    if (this.state.transitionFromIndex != null) {
      this.state.pendingGestureProgress = nextProgress;
    } else if (this.state.pendingGestureProgress) {
      this.spring.setEndValue(nextProgress);
    } else {
      this.spring.setCurrentValue(nextProgress);
    }
  }

  _matchGestureAction(eligibleGestures, gestures, gestureState) {
    if (!gestures || !eligibleGestures || !eligibleGestures.some) {
      return null;
    }
    var matchedGesture = null;
    eligibleGestures.some((gestureName, gestureIndex) => {
      var gesture = gestures[gestureName];
      if (!gesture) {
        return;
      }
      if (gesture.overswipe == null && this._doesGestureOverswipe(gestureName)) {
        // cannot swipe past first or last scene without overswiping
        return false;
      }
      var isTravelVertical = gesture.direction === 'top-to-bottom' || gesture.direction === 'bottom-to-top';
      var isTravelInverted = gesture.direction === 'right-to-left' || gesture.direction === 'bottom-to-top';
      var startedLoc = isTravelVertical ? gestureState.y0 : gestureState.x0;
      var currentLoc = isTravelVertical ? gestureState.moveY : gestureState.moveX;
      var travelDist = isTravelVertical ? gestureState.dy : gestureState.dx;
      var oppositeAxisTravelDist =
        isTravelVertical ? gestureState.dx : gestureState.dy;
      var edgeHitWidth = gesture.edgeHitWidth;
      if (isTravelInverted) {
        startedLoc = -startedLoc;
        currentLoc = -currentLoc;
        travelDist = -travelDist;
        oppositeAxisTravelDist = -oppositeAxisTravelDist;
        edgeHitWidth = isTravelVertical ?
          -(SCREEN_HEIGHT - edgeHitWidth) :
          -(SCREEN_WIDTH - edgeHitWidth);
      }
      if (startedLoc === 0) {
        startedLoc = currentLoc;
      }
      var moveStartedInRegion = gesture.edgeHitWidth == null ||
        startedLoc < edgeHitWidth;
      if (!moveStartedInRegion) {
        return false;
      }
      var moveTravelledFarEnough = travelDist >= gesture.gestureDetectMovement;
      if (!moveTravelledFarEnough) {
        return false;
      }
      var directionIsCorrect = Math.abs(travelDist) > Math.abs(oppositeAxisTravelDist) * gesture.directionRatio;
      if (directionIsCorrect) {
        matchedGesture = gestureName;
        return true;
      } else {
        this._eligibleGestures = this._eligibleGestures.slice().splice(gestureIndex, 1);
      }
    });
    return matchedGesture || null;
  }

  _transitionSceneStyle(fromIndex, toIndex, progress, index) {
    var viewAtIndex = this._sceneRefs[index];
    if (viewAtIndex === null || viewAtIndex === undefined) {
      return;
    }
    // Use toIndex animation when we move forwards. Use fromIndex when we move back
    var sceneConfigIndex = fromIndex < toIndex ? toIndex : fromIndex;
    var sceneConfig = this.state.sceneConfigStack[sceneConfigIndex];
    // this happens for overswiping when there is no scene at toIndex
    if (!sceneConfig) {
      sceneConfig = this.state.sceneConfigStack[sceneConfigIndex - 1];
    }
    var styleToUse = {};
    var useFn = index < fromIndex || index < toIndex ?
      sceneConfig.animationInterpolators.out :
      sceneConfig.animationInterpolators.into;
    var directionAdjustedProgress = fromIndex < toIndex ? progress : 1 - progress;
    var didChange = useFn(styleToUse, directionAdjustedProgress);
    if (didChange) {
      viewAtIndex.setNativeProps({style: styleToUse});
    }
  }

  _transitionBetween(fromIndex, toIndex, progress) {
    this._transitionSceneStyle(fromIndex, toIndex, progress, fromIndex);
    this._transitionSceneStyle(fromIndex, toIndex, progress, toIndex);
    var navBar = this._navBar;
    if (navBar && navBar.updateProgress && toIndex >= 0 && fromIndex >= 0) {
      navBar.updateProgress(progress, fromIndex, toIndex);
    }
  }

  _handleResponderTerminationRequest() {
    return false;
  }

  _getDestIndexWithinBounds(n) {
    var currentIndex = this.state.presentedIndex;
    var destIndex = currentIndex + n;
    invariant(
      destIndex >= 0,
      'Cannot jump before the first route.'
    );
    var maxIndex = this.state.routeStack.length - 1;
    invariant(
      maxIndex >= destIndex,
      'Cannot jump past the last route.'
    );
    return destIndex;
  }

  _jumpN(n) {
    var destIndex = this._getDestIndexWithinBounds(n);
    this._enableScene(destIndex);
    this._emitWillFocus(this.state.routeStack[destIndex]);
    this._transitionTo(destIndex);
  }

  /**
   * Transition to an existing scene without unmounting.
   * @param {object} route Route to transition to. The specified route must
   * be in the currently mounted set of routes defined in `routeStack`.
   */
  jumpTo(route) {
    var destIndex = this.state.routeStack.indexOf(route);
    invariant(
      destIndex !== -1,
      'Cannot jump to route that is not in the route stack'
    );
    this._jumpN(destIndex - this.state.presentedIndex);
  }

  /**
   * Jump forward to the next scene in the route stack.
   */
  jumpForward() {
    this._jumpN(1);
  }

  /**
   * Jump backward without unmounting the current scene.
   */
  jumpBack() {
    this._jumpN(-1);
  }

  /**
   * Navigate forward to a new scene, squashing any scenes that you could
   * jump forward to.
   * @param {object} route Route to push into the navigator stack.
   */
  push(route) {
    invariant(!!route, 'Must supply route to push');
    var activeLength = this.state.presentedIndex + 1;
    var activeStack = this.state.routeStack.slice(0, activeLength);
    var activeAnimationConfigStack = this.state.sceneConfigStack.slice(0, activeLength);
    var nextStack = activeStack.concat([route]);
    var destIndex = nextStack.length - 1;
    var nextSceneConfig = this.props.configureScene(route, nextStack);
    var nextAnimationConfigStack = activeAnimationConfigStack.concat([nextSceneConfig]);
    this._emitWillFocus(nextStack[destIndex]);
    this.setState({
      routeStack: nextStack,
      sceneConfigStack: nextAnimationConfigStack,
    }, () => {
      this._enableScene(destIndex);
      this._transitionTo(destIndex, nextSceneConfig.defaultTransitionVelocity);
    });
  }

  /**
   * Go back N scenes at once. When N=1, behavior matches `pop()`.
   * When N is invalid(negative or bigger than current routes count), do nothing.
   * @param {number} n The number of scenes to pop. Should be an integer.
   */
  popN(n) {
    invariant(typeof n === 'number', 'Must supply a number to popN');
    n = parseInt(n, 10);
    if (n <= 0 || this.state.presentedIndex - n < 0) {
      return;
    }
    var popIndex = this.state.presentedIndex - n;
    var presentedRoute = this.state.routeStack[this.state.presentedIndex];
    var popSceneConfig = this.props.configureScene(presentedRoute); // using the scene config of the currently presented view
    this._enableScene(popIndex);
    // This is needed because scene at the pop index may be transformed
    // with a configuration different from the configuration on the presented
    // route.
    this._clearTransformations(popIndex);
    this._emitWillFocus(this.state.routeStack[popIndex]);
    this._transitionTo(
      popIndex,
      popSceneConfig.defaultTransitionVelocity,
      null, // no spring jumping
      () => {
        this._cleanScenesPastIndex(popIndex);
      }
    );
  }

  /**
   * Transition back and unmount the current scene.
   */
  pop() {
    if (this.state.transitionQueue.length) {
      // This is the workaround to prevent user from firing multiple `pop()`
      // calls that may pop the routes beyond the limit.
      // Because `this.state.presentedIndex` does not update until the
      // transition starts, we can't reliably use `this.state.presentedIndex`
      // to know whether we can safely keep popping the routes or not at this
      //  moment.
      return;
    }

    this.popN(1);
  }

  /**
   * Replace a scene as specified by an index.
   * @param {object} route Route representing the new scene to render.
   * @param {number} index The route in the stack that should be replaced.
   *   If negative, it counts from the back of the stack.
   * @param {Function} cb Callback function when the scene has been replaced.
   */
  replaceAtIndex(route, index, cb) {
    invariant(!!route, 'Must supply route to replace');
    if (index < 0) {
      index += this.state.routeStack.length;
    }

    if (this.state.routeStack.length <= index) {
      return;
    }

    var nextRouteStack = this.state.routeStack.slice();
    var nextAnimationModeStack = this.state.sceneConfigStack.slice();
    nextRouteStack[index] = route;
    nextAnimationModeStack[index] = this.props.configureScene(route, nextRouteStack);

    if (index === this.state.presentedIndex) {
      this._emitWillFocus(route);
    }
    this.setState({
      routeStack: nextRouteStack,
      sceneConfigStack: nextAnimationModeStack,
    }, () => {
      if (index === this.state.presentedIndex) {
        this._emitDidFocus(route);
      }
      cb && cb();
    });
  }

  /**
   * Replace the current scene with a new route.
   * @param {object} route Route that replaces the current scene.
   */
  replace(route) {
    this.replaceAtIndex(route, this.state.presentedIndex);
  }

  /**
   * Replace the previous scene.
   * @param {object} route Route that replaces the previous scene.
   */
  replacePrevious(route) {
    this.replaceAtIndex(route, this.state.presentedIndex - 1);
  }

  /**
   * Pop to the first scene in the stack, unmounting every other scene.
   */
  popToTop() {
    this.popToRoute(this.state.routeStack[0]);
  }

  /**
   * Pop to a particular scene, as specified by its route.
   * All scenes after it will be unmounted.
   * @param {object} route Route to pop to.
   */
  popToRoute(route) {
    var indexOfRoute = this.state.routeStack.indexOf(route);
    invariant(
      indexOfRoute !== -1,
      'Calling popToRoute for a route that doesn\'t exist!'
    );
    var numToPop = this.state.presentedIndex - indexOfRoute;
    this.popN(numToPop);
  }

  /**
   * Replace the previous scene and pop to it.
   * @param {object} route Route that replaces the previous scene.
   */
  replacePreviousAndPop(route) {
    if (this.state.routeStack.length < 2) {
      return;
    }
    this.replacePrevious(route);
    this.pop();
  }

  /**
   * Navigate to a new scene and reset route stack.
   * @param {object} route Route to navigate to.
   */
  resetTo(route) {
    invariant(!!route, 'Must supply route to push');
    this.replaceAtIndex(route, 0, () => {
      // Do not use popToRoute here, because race conditions could prevent the
      // route from existing at this time. Instead, just go to index 0
      this.popN(this.state.presentedIndex);
    });
  }

  /**
   * Reset every scene with an array of routes.
   *
   * @param {RouteStack} nextRouteStack Next route stack to reinitialize.
   * All existing route stacks are destroyed and potentially recreated. There
   * is no accompanying animation and this method immediately replaces and
   * re-renders the navigation bar and the stack items.
   */
  immediatelyResetRouteStack(nextRouteStack) {
    var destIndex = nextRouteStack.length - 1;
    this._emitWillFocus(nextRouteStack[destIndex]);
    this.setState({
      routeStack: nextRouteStack,
      sceneConfigStack: nextRouteStack.map(
        route => this.props.configureScene(route, nextRouteStack)
      ),
      presentedIndex: destIndex,
      activeGesture: null,
      transitionFromIndex: null,
      transitionQueue: [],
    }, () => {
      this._handleSpringUpdate();
      var navBar = this._navBar;
      if (navBar && navBar.immediatelyRefresh) {
        navBar.immediatelyRefresh();
      }
      this._emitDidFocus(this.state.routeStack[this.state.presentedIndex]);
    });
  }

  _cleanScenesPastIndex(index) {
    var newStackLength = index + 1;
    // Remove any unneeded rendered routes.
    if (newStackLength < this.state.routeStack.length) {
      this.setState({
        sceneConfigStack: this.state.sceneConfigStack.slice(0, newStackLength),
        routeStack: this.state.routeStack.slice(0, newStackLength),
      });
    }
  }

  _renderScene(route, i) {
    var disabledSceneStyle = null;
    var disabledScenePointerEvents = 'auto';
    if (i !== this.state.presentedIndex) {
      disabledSceneStyle = styles.disabledScene;
      disabledScenePointerEvents = 'none';
    }
    return (
      <View
        collapsable={false}
        key={'scene_' + getRouteID(route)}
        ref={(scene) => {
          this._sceneRefs[i] = scene;
        }}
        onStartShouldSetResponderCapture={() => {
          return (this.state.transitionFromIndex != null);
        }}
        pointerEvents={disabledScenePointerEvents}
        style={[styles.baseScene, this.props.sceneStyle, disabledSceneStyle]}>
        {this.props.renderScene(
          route,
          this
        )}
      </View>
    );
  }

  _renderNavigationBar() {
    const { navigationBar } = this.props;
    if (!navigationBar) {
      return null;
    }
    return React.cloneElement(navigationBar, {
      ref: (navBar) => {
        this._navBar = navBar;
        if (navigationBar && typeof navigationBar.ref === 'function') {
          navigationBar.ref(navBar);
        }
      },
      navigator: this._navigationBarNavigator,
      navState: this.state,
    });
  }

  _tvEventHandler: TVEventHandler

  _enableTVEventHandler() {
    if (!TVEventHandler) {
      return;
    }
    this._tvEventHandler = new TVEventHandler();
    this._tvEventHandler.enable(this, function(cmp, evt) {
      if (evt && evt.eventType === 'menu') {
        cmp.pop();
      }
    });
  }

  _disableTVEventHandler() {
    if (this._tvEventHandler) {
      this._tvEventHandler.disable();
      delete this._tvEventHandler;
    }
  }

  render() {
    var newRenderedSceneMap = new Map();
    var scenes = this.state.routeStack.map((route, index) => {
      var renderedScene;
      if (this._renderedSceneMap.has(route) &&
          index !== this.state.presentedIndex) {
        renderedScene = this._renderedSceneMap.get(route);
      } else {
        renderedScene = this._renderScene(route, index);
      }
      newRenderedSceneMap.set(route, renderedScene);
      return renderedScene;
    });
    this._renderedSceneMap = newRenderedSceneMap;
    return (
      <View style={[styles.container, this.props.style]}>
        <View
          style={styles.transitioner}
          {...this.panGesture.panHandlers}
          onTouchStart={this._handleTouchStart}
          onResponderTerminationRequest={
            this._handleResponderTerminationRequest
          }>
          {scenes}
        </View>
        {this._renderNavigationBar()}
      </View>
    );
  }

  _getNavigationContext() {
    if (!this._navigationContext) {
      this._navigationContext = new NavigationContext();
    }
    return this._navigationContext;
  }
}

reactMixin(Navigator.prototype, TimerMixin);
reactMixin(Navigator.prototype, InteractionMixin);
reactMixin(Navigator.prototype, Subscribable.Mixin);
