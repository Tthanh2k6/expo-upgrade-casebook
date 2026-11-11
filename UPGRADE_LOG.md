# Upgrade log: Expo SDK 49 → 58

Fork of [disc-in/UltimateApp](https://github.com/disc-in/UltimateApp) (MIT), a real Expo app for ultimate frisbee coaching. The original code is tagged `sdk49-baseline`. Each SDK step below is one or more commits; every error message quoted here was seen in a real run.

Package manager: yarn 1 (`npx --yes yarn@1.22.22`). Checks per step: `npx jest --ci`, `npx expo-doctor`, `npx expo export --platform android`.

## Baseline (SDK 49, React Native 0.72.6) — measured 11/11/2026 on Windows 11, Node 24

- `yarn install --frozen-lockfile`: OK (112 s).
- Jest: 177 of 178 tests pass, 84 of 85 snapshots. The one failure is not caused by the SDK: `AboutPage` renders the copyright range with the current year (`2020 - 2026` vs snapshot `2020 - 2024`).
- expo-doctor: 14/16 checks pass. Failing:
  - SDK 49 targets Android API level 33 or lower; Google Play has required API 34+ since 31 Aug 2024.
  - `expo-updates@0.18.17` (expected ~0.18.19) and `react-native@0.72.6` (expected 0.72.10) do not match SDK 49.

## Pre-upgrade: make the year-dependent test deterministic

- `AboutPage.test.js` now mocks `Date.prototype.getFullYear` to 2024 (mocks restored after each test). No snapshot changed.
- Jest after the fix: 59/59 suites, 178/178 tests, 85/85 snapshots. Existing console warnings: state updates not wrapped in `act(...)`, non-serializable values in navigation state.

## SDK 50 (React Native 0.73.6)

- Measured on 11 November 2026, Windows. Installed Expo 50.0.21, React Native 0.73.6, React 18.2.0, Reanimated 3.6.3 and jest-expo 50.0.4. Only the SDK 49 to 50 step was performed.
- Reviewed the [SDK 50 release and upgrade notes](https://expo.dev/changelog/2024-01-18-sdk-50) and installed package changelogs. Aligned native dependencies with `expo install --fix`, updated `babel-preset-expo` to `~10.0.2`, and raised the package's Node minimum to 18.
- Changed Metro to extend `expo/metro-config`, retaining `cjs` and `mjs` extensions. SDK 50 moves the `react-native-vector-icons` alias from Babel to Expo's Metro resolver.
- Replaced Ionicons names `ios-disc`, `ios-fitness`, and `ios-share-outline` with `disc`, `fitness`, and `share-outline` in four source files. SDK 50's icon library removes the platform prefixes.
- The project already uses EAS Update and has no native project directories. Its only `expo-updates` usage reads `channel`; it does not call the update methods restricted in development by SDK 50. The existing carousel, Elements, bottom tabs, and AV libraries did not require replacement for these checks.

Commands and environment:

```powershell
$env:HUSKY = '0'
$env:EXPO_NO_TELEMETRY = '1'
$env:APP_ENV = 'development'
$env:__UNSAFE_EXPO_HOME_DIRECTORY = Join-Path $env:TEMP 'expo-casebook-sdk50\expo'
$env:npm_config_cache = Join-Path $env:TEMP 'expo-casebook-sdk50\npm'
$env:YARN_CACHE_FOLDER = Join-Path $env:TEMP 'expo-casebook-sdk50\yarn'
npx.cmd --yes yarn@1.22.22 --version
$yarnBin = Get-ChildItem -Path (Join-Path $env:npm_config_cache '_npx\*\node_modules\.bin\yarn.cmd') | Select-Object -First 1 -ExpandProperty DirectoryName
$env:Path = $yarnBin + ';' + $env:Path
npx.cmd expo install expo@^50.0.0
npx.cmd expo install --fix
npx.cmd jest --ci --coverage=false
npx.cmd expo-doctor
npx.cmd expo export --platform android --output-dir (Join-Path $env:TEMP 'expo-casebook-sdk50\android-export')
```

- The first install resolved `expo@50.0.0`; `--fix` then installed Expo 50.0.21 and SDK 50 dependencies. `HUSKY=0` skipped hook installation; no Git staging, commit, stash, or checkout commands were run.
- Initial tooling error: `EPERM: operation not permitted, open` under the user-profile `.expo/native-modules-cache/tmp` directory. A subsequent npx attempt also failed with `npm error code EPERM` under the default npm cache. Cause: those cache locations are outside the writable sandbox. Fix: redirect Expo, npm, and Yarn caches to the temporary locations above.
- An attempted nested wrapper, `npx.cmd --yes --package=yarn@1.22.22 -c 'npx.cmd expo install expo@^50.0.0'`, failed with `npm error code EUSAGE`. Fix: expose the cached Yarn 1 executable on PATH and invoke Expo directly, as above. Yarn also logged `There appears to be trouble with your network connection. Retrying...`; its retry succeeded.
- Initial Jest result: 47/59 suites, 159/178 tests, 64/85 snapshots passed; all failures were snapshot assertions (`expect(received).toMatchSnapshot()`, `21 snapshots failed from 12 test suites`). Inspected the differences and updated only expected library rendering changes: React Native's list `scrollEventThrottle` from 50 to 0.0001 and hidden Modal mock returning null; new icon glyph codes; picker 2.6.1 serializing native iOS values as strings; screens 3.29.0 adding `onGestureCancel`; AV 13.10.6 moving `pointerEvents` into style. No test assertions or mocks were weakened, and the deterministic copyright-year test was unchanged.
- Initial Android export failed on Node 24.15.0: `ENOENT: no such file or directory, mkdir` ending in `.expo\metro\externals\node:sea`. Cause: SDK 50's CLI generates a directory per Node builtin, including the colon-containing `node:sea` entry exposed by Node 24; that path is invalid on Windows. Fix: run SDK 50 tooling with Node 20.20.2, recorded in `.nvmrc`. No `node_modules` files were patched.

Retry and final verification commands (same environment):

```powershell
npx.cmd --yes node@20 --version
# This resolved to v20.20.2 in this run.
$sdkNodeBin = Get-ChildItem -Path (Join-Path $env:npm_config_cache '_npx\*\node_modules\node\bin\node.exe') | Select-Object -First 1 -ExpandProperty DirectoryName
$env:Path = $sdkNodeBin + ';' + $env:Path
npx.cmd expo export --platform android --output-dir (Join-Path $env:TEMP 'expo-casebook-sdk50\android-export')
npx.cmd jest --ci --coverage=false --updateSnapshot
npx.cmd jest --ci --coverage=false
git diff --check
```

- Snapshot update: 21 snapshots updated across 12 files; 64 unchanged; 59/59 suites and 178/178 tests passed. That run also warned `A worker process has failed to exit gracefully and has been force exited`; it exited 0. Existing `act(...)` and navigation serialization warnings remain.
- Final Jest without update mode, Node 20.20.2 and `APP_ENV=development`: **59/59 suites, 178/178 tests, 85/85 snapshots passed**, exit 0 (18.335 s).
- Expo Doctor 1.21.6, run on Node 24.15.0: **16/16 checks passed**, exit 0; no unresolved Doctor checks.
- Android export on Node 20.20.2: **OK**, exit 0; 44 assets, one 6.14 MB Hermes bundle, and `metadata.json` exported to `%TEMP%\expo-casebook-sdk50\android-export`, outside the repository. Metro reported 124677 ms. No native device build or device runtime test was performed.
- `git diff --check`: passed. Git emitted Windows line-ending notices for updated snapshots.
