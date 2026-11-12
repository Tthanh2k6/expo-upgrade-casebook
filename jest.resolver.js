// Comes from https://github.com/firebase/firebase-js-sdk/issues/6747#issuecomment-1343566346
// This is hell, this is javascript
const reanimatedResolver = require('react-native-reanimated/jest/resolver');

module.exports = (path, options) => {
  // Reanimated/Worklets need their web implementations in Jest.
  // Keep Firebase's Node condition and handle Jest 30's config-resolution calls.
  return reanimatedResolver(path, {
    ...options,
    conditions: ['node', ...(options.conditions ?? ['require', 'default'])],
  });
};
