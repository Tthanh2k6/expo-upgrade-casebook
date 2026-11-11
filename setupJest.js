global.__reanimatedWorkletInit = jest.fn();
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('expo-constants', () => {
  const Constants = jest.requireActual('expo-constants');
  const appConfig = jest.requireActual('./app.config.js');
  return {
    ...Constants,
    expoConfig: {
      ...Constants.expoConfig,
      extra: { ...Constants.expoConfig?.extra, ...appConfig.default.expo.extra },
    },
  };
});

// Font issue with expo 48: https://github.com/expo/expo/issues/21434
jest.mock('expo-font');
jest.mock('expo-asset');

// jest-expo 55 mocks ExpoVideo functions but not its native SharedObject classes.
// Keep the real useVideoPlayer hook and VideoView; replace only the native player.
jest.mock('expo-video/build/NativeVideoModule', () => {
  const { SharedObject } = require('expo-modules-core');
  class VideoPlayer extends SharedObject {
    __expo_shared_object_id__ = 1;
    play = jest.fn();
    pause = jest.fn();
    replace() {}
    async replaceAsync() {}
  }
  return { __esModule: true, default: { VideoPlayer } };
});
