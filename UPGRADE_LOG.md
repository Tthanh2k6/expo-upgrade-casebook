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

## SDK 51 (React Native 0.74.5)

- Measured on 11 November 2026, Windows. Installed Expo 51.0.39, React Native 0.74.5, React 18.2.0, Reanimated 3.10.1, Gesture Handler 2.16.2, jest-expo 51.0.4, and babel-preset-expo 11.0.15. Only the SDK 50 to 51 step was performed.
- Reviewed the [SDK 51 release and upgrade notes](https://expo.dev/changelog/2024-05-07-sdk-51), [React Native 0.74 release notes](https://reactnative.dev/blog/2024/04/22/release-0.74), and installed Expo package changelogs. The app does not use the changed Camera/SQLite imports, removed Constants properties or Updates event APIs, fingerprintExperimental policy, app-config hooks, or React Native PropTypes. There are no `row-reverse` styles or native project directories. No application source changes were required by those changes.
- The pinned snap-carousel fork already imports `ViewPropTypes` from `deprecated-react-native-prop-types`. The existing carousel, Elements, material bottom tabs, and AV libraries did not require replacement for this step. Reanimated remains on SDK 51's 3.x version.

Commands and environment (npm/Yarn caches and Node/Yarn executables reused from the SDK 50 step):

```powershell
$env:HUSKY = '0'
$env:EXPO_NO_TELEMETRY = '1'
$env:APP_ENV = 'development'
$env:__UNSAFE_EXPO_HOME_DIRECTORY = Join-Path $env:TEMP 'expo-casebook-sdk51\expo'
$env:npm_config_cache = Join-Path $env:TEMP 'expo-casebook-sdk50\npm'
$env:YARN_CACHE_FOLDER = Join-Path $env:TEMP 'expo-casebook-sdk50\yarn'
$yarnBin = Get-ChildItem -Path (Join-Path $env:npm_config_cache '_npx\*\node_modules\.bin\yarn.cmd') | Select-Object -First 1 -ExpandProperty DirectoryName
$sdkNodeBin = Get-ChildItem -Path (Join-Path $env:npm_config_cache '_npx\*\node_modules\node\bin\node.exe') | Select-Object -First 1 -ExpandProperty DirectoryName
$env:Path = $sdkNodeBin + ';' + $yarnBin + ';' + $env:Path
node --version # v20.20.2, matching .nvmrc
npx.cmd expo install expo@^51.0.0
npx.cmd expo install --fix
npx.cmd jest --ci --coverage=false
npx.cmd expo-doctor
npx.cmd expo export --platform android --output-dir (Join-Path $env:TEMP 'expo-casebook-sdk51\android-export')
```

- The first install resolved Expo 51.0.0; `--fix` installed 51.0.39 and aligned 22 other dependencies, including Babel, jest-expo, and TypeScript. Both commands exited 0. Yarn logged `There appears to be trouble with your network connection. Retrying...`; retries succeeded. Yarn also emitted dependency deprecation and unmet-peer warnings. `HUSKY=0` skipped hook installation.
- Initial Jest failure: `_RNGestureHandlerModule.default.install is not a function`. Result: **52/59 suites, 155/178 tests, 82/82 executed snapshots passed**, exit 1 (180.213 s). Cause: Gesture Handler 2.16 calls its native `install()` method when initializing Fabric, but the existing test setup did not load Gesture Handler's native-module mocks. Fix: add `react-native-gesture-handler/jestSetup.js` to Jest `setupFiles`, using the library's [documented setup](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/testing/). The supplied mock includes `install`; no application component was mocked out and no test assertion was changed.
- Initial Doctor failure: `Cannot find module '@expo/env'`, before any checks ran. npx resolved Doctor 1.21.7. Its published package references `@expo/env` at runtime but lists it only in `devDependencies`; it also declares Node 22.13+/24.3+/26+/27+ support, excluding the Node 20 used for SDK tooling. Fix for verification: run Doctor under the system Node 24.15.0, and supply its declared `@expo/env@2.6.0` through a temporary npx package environment. No dependency was added to the app for this workaround.
- Doctor 1.21.6 was also run on Node 24.15.0 as a fallback. It initially passed **16/17** checks and reported `The .expo directory is not ignored by Git`. Cause: `.gitignore` ignored `.expo/*` contents, but not the directory itself. Fix: change the pattern to `.expo/`. The retry passed **17/17**, exit 0.

Verification commands after the fixes:

```powershell
# Node 20.20.2, same environment as above:
npx.cmd jest --ci --coverage=false

# Separate PowerShell invocations using the system Node 24.15.0;
# same APP_ENV/cache settings, with only $yarnBin prepended to PATH:
npx.cmd --yes expo-doctor@1.21.6
# Repeated after correcting .gitignore.
npx.cmd --yes --package=expo-doctor@1.21.7 --package=@expo/env@2.6.0 expo-doctor
```

- Doctor 1.21.7 with the temporary dependency workaround: **17/17 checks passed**, exit 0. Bare `npx.cmd expo-doctor` failed as described above; no Doctor check was disabled or excluded.
- Android export on Node 20.20.2: **OK**, exit 0; Metro bundled 1968 modules in 76207 ms. Exported 44 assets, one 6.23 MB Hermes bundle, and `metadata.json` to `%TEMP%\expo-casebook-sdk51\android-export`, outside the repository. No native build or device runtime test was performed.
- Final Jest with `APP_ENV=development`, Node 20.20.2, and no update mode: **59/59 suites, 178/178 tests, 85/85 snapshots passed**, exit 0 (80.336 s). **No snapshots changed.** Existing `act(...)` and navigation serialization warnings remain.
- Local inspection limitations: `rg` was not installed, so source searches used PowerShell `Select-String`; `Get-CimInstance` process/memory inspection returned `Access denied` and was not used further. Neither prevented the upgrade checks.
- No Git staging, commit, stash, or checkout commands were run. Changes are limited to SDK-aligned dependencies and lockfile, Jest's Gesture Handler setup, the `.expo/` ignore pattern, this log, and `COMMIT_MSG.txt`.
- `git diff --check`: passed. Git emitted an LF/CRLF notice for this log; read-only status also warned that the user-profile global ignore file was inaccessible. `COMMIT_MSG.txt` has a 61-character first line and four bullet lines.
