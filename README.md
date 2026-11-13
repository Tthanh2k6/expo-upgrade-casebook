# Expo Upgrade Casebook (SDK 49 → 58)

[![Run test suite](https://github.com/Tthanh2k6/expo-upgrade-casebook/actions/workflows/tests.yml/badge.svg)](https://github.com/Tthanh2k6/expo-upgrade-casebook/actions/workflows/tests.yml)

Step-by-step migration of a real production-structured Expo app ([disc-in/UltimateApp](https://github.com/disc-in/UltimateApp), MIT) from **Expo SDK 49 (React Native 0.72.6)** to **Expo SDK 58 (React Native 0.88.1)** with React 19, New Architecture, `expo-video`, React Navigation 7, and Jest 30.

Every SDK step is isolated into its own commit (see `git log`) and verified locally on Windows 11 with Jest, `expo-doctor`, and `expo export --platform android` (Hermes bundle). All commands, exact error messages, root causes, and fixes are recorded in [`UPGRADE_LOG.md`](./UPGRADE_LOG.md).

## Before / After Summary

| Metric | SDK 49 Baseline (`sdk49-baseline`) | SDK 58 Final (`main`) |
| --- | --- | --- |
| Expo SDK / React Native | 49.x / 0.72.6 | 58.0.24 / 0.88.1 |
| React / Architecture | 18.2 / Legacy | 19.3.0 / New Architecture (`newArchEnabled: true`) |
| Reanimated / Gesture Handler | Legacy | 4.7.1 + `react-native-worklets` 0.13.0 / 3.3.0 |
| Navigation / Video / UI | Nav 6 / `expo-av` / `react-native-elements` | Nav 7 + Paper 5.15.4 / `expo-video` 58.0.14 / `@rneui/*` |
| Node engine (`.nvmrc`) | Node 18 / Node 24 | `^22.13.0 \|\| ^24.3.0 \|\| >=26.0.0` (`24.15.0`) |
| Jest (`npx jest --ci --coverage=false`) | 59 suites, 177/178 tests, 84/85 snapshots (year drift) | **60/60 suites, 187/187 tests, 85/85 snapshots passed** |
| `expo-doctor` checks | 14/16 passed (target API 33, patch drift) | 20/20 on 12/11 (19/20 on 13/11 after `expo@~58.0.25` release) |
| Android Hermes Export | Not run at baseline (SDK 50 first measured: 6.14 MB) | OK: 2,479 modules bundled in 16.5 s, 55 assets, 6.4 MB bundle |

## SDK-by-SDK Migration Log

| Step | Commit | React Native | Jest Pass | Doctor | Android Bundle | Key Breakages Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| Pre-upgrade | `7e89be6` | 0.72.6 | 178/178 | 14/16 | — | Pin `Date.prototype.getFullYear` to 2024 in `AboutPage.test.js` |
| **SDK 50** | `2564a35` | 0.73.6 | 178/178 | 16/16 | 6.14 MB (124.7 s) | Extend `expo/metro-config`, drop `ios-` Ionicons prefixes, Node 20 for Windows `node:sea` colon bug |
| **SDK 51** | `3434309` | 0.74.5 | 178/178 | 17/17 | 6.23 MB | Add `react-native-gesture-handler/jestSetup.js`, ignore `.expo/` dir |
| **SDK 52** | `58d5b6d` | 0.76.9 | 178/178 | 17/18 | 6.37 MB | Fix nested `lru-cache@10` Babel mismatch, Android splash `contain` icon override, `NativeAnimatedHelper` path |
| **SDK 53** | `739780d` | 0.79.6 | 178/178 | 17/18 | 6.53 MB | React 19 `defaultProps` removal (swap `react-native-elements` for `@rneui`), RNTL 13, `Localization.getLocales()`, custom `jest.reactElementSerializer.js` |
| **SDK 54** | `7cb3c72` | 0.81.5 | 178/178 | 18/18 | 6.78 MB | Add `react-native-worklets`, drop Babel reanimated plugin, add `expo-mail-composer` plugin to `app.config.js` |
| **SDK 55** | `db26d22` | 0.83.10 | 184/184 | 20/20 | 6.80 MB (26.0 s) | Migrate `VimeoVideo` from `expo-av` to `expo-video` (`useVideoPlayer`, `VideoView`), add 6 video behavior tests, Worklets Jest mock |
| **SDK 56** | `f6d99cf` | 0.85.3 | 184/184 | 21/22 | 6.10 MB (29.4 s) | Add direct `@expo/vector-icons`, `expo-font`, `@react-native/jest-preset`; bump Paper to 5.15.4 (`StyleSheet.absoluteFill`); migrate `expo-splash-screen` plugin options |
| **SDK 57** | `7b2e471` | 0.86.3 | 184/184 | 21/21 | 6.00 MB (27.4 s) | Align `@react-native/jest-preset@0.86.3`, verify Hermes regression resolved (`250829098.0.17`) |
| **SDK 58** | `e674fb6` | 0.88.1 | 187/187 | 20/20 | 6.40 MB (16.5 s) | Replace `InteractionManager` with `requestIdleCallback` (+3 tests), upgrade React Navigation 6 → 7 + Paper bottom navigator, fix Jest 30 Rust resolver (`undefined` conditions) & removed `toBeCalledWith` aliases |

## Running Locally

Requires Node `24.x` (see `.nvmrc`) and Yarn 1:

```bash
yarn install --frozen-lockfile
APP_ENV=development npx jest --ci --coverage=false
APP_ENV=development npx expo export --platform android --output-dir /tmp/android-export
npx expo-doctor
```

## Verification Scope & Limitations

- Verified with Jest (`60/60` suites, `187/187` tests, `85/85` snapshots), `expo-doctor`, and `expo export --platform android` (production-mode Metro + Hermes bytecode export).
- Native Gradle/Xcode builds and on-device/emulator runtime testing were **not** performed in this repository; `app.config.js` retains the upstream project identifiers (`UltimateApp`) without private signing credentials.

## Credits & License

Forked from [disc-in/UltimateApp](https://github.com/disc-in/UltimateApp) under the [MIT License](./LICENSE). Related companion tool: [`rn-upgrade-check`](https://github.com/Tthanh2k6/rn-upgrade-check).
