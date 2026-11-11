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

## SDK 52 (React Native 0.76.9)

- Measured on 11 November 2026, Windows. Upgraded only SDK 51 to 52: Expo 52.0.49, React Native 0.76.9, React 18.3.1, Reanimated 3.16.7, Gesture Handler 2.20.2, screens 4.4.0, pager-view 6.5.1, jest-expo 52.0.6 and Jest 29.7.0.
- Reviewed the [SDK 52 release/upgrade notes](https://expo.dev/changelog/2024-11-12-sdk-52), [React Native 0.76 release notes](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture), and installed library implementation changes. Removed the obsolete `privacy` app-config field. Added an Android splash override using the app icon with `contain` on white, because Android no longer supports full-screen splash images. The existing iOS splash config is retained.
- No Camera/SQLite legacy APIs, barcode scanner, or notifications APIs are used. There are no native project directories to migrate. React Navigation 6 and the existing architecture configuration remain. The pinned carousel fork, Elements, material bottom tabs, and AV passed the requested tests/export without a replacement; AV Video is deprecated in SDK 52 but still present. Reanimated stays on 3.x; no Worklets package was needed. These checks do not establish device runtime or New Architecture compatibility.

Commands and environment (Node 20.20.2 and Yarn 1 executables/caches reused from the prior steps):

```powershell
$env:HUSKY = '0'
$env:EXPO_NO_TELEMETRY = '1'
$env:APP_ENV = 'development'
$env:__UNSAFE_EXPO_HOME_DIRECTORY = Join-Path $env:TEMP 'expo-casebook-sdk52\expo'
$env:npm_config_cache = Join-Path $env:TEMP 'expo-casebook-sdk50\npm'
$env:YARN_CACHE_FOLDER = Join-Path $env:TEMP 'expo-casebook-sdk50\yarn'
$yarnBin = Get-ChildItem -Path (Join-Path $env:npm_config_cache '_npx\*\node_modules\.bin\yarn.cmd') | Select-Object -First 1 -ExpandProperty DirectoryName
$sdkNodeBin = Get-ChildItem -Path (Join-Path $env:npm_config_cache '_npx\*\node_modules\node\bin\node.exe') | Select-Object -First 1 -ExpandProperty DirectoryName
$env:Path = $sdkNodeBin + ';' + $yarnBin + ';' + $env:Path
npx.cmd expo install expo@^52.0.0
npx.cmd expo install --fix
npx.cmd jest --ci --coverage=false
npx.cmd expo export --platform android --output-dir (Join-Path $env:TEMP 'expo-casebook-sdk52\android-export')
```

- Both install commands exited 0. The first resolved Expo 52.0.0; `--fix` installed 52.0.49 and aligned the remaining dependencies. Yarn reported `There appears to be trouble with your network connection. Retrying...`; its retry succeeded. Dependency deprecation and peer warnings were also emitted. `HUSKY=0` skipped hook installation.
- Initial Jest: `TypeError: _lruCache is not a constructor`; **59/59 suites failed, 0 tests and 0 snapshots executed** (15.057 s). Inspection found a stale nested `@babel/core/node_modules/@babel/helper-compilation-targets` resolving root `lru-cache@10.4.3` despite declaring `^5.1.1`. `yarn why lru-cache` showed the valid version-5 installations elsewhere. `npx.cmd --yes yarn@1.22.22 install --force --frozen-lockfile` exited 0 but did not remove the stale package; the Babel probe and repeat Jest failed with the same error (59 suites, 0 tests).
- A clean-install deletion command was rejected before execution: `blocked by policy`. A non-destructive backup move to `%TEMP%\expo-casebook-sdk52\node_modules-before-clean-install` then encountered `The specified path, file name, or both are too long` and `Could not find a part of the path`; that cross-drive move was stopped. Moved the remaining dependency directory to the previously absent, ignored `.expo/node_modules` on the same drive, after checking both absolute paths, then ran `npx.cmd --yes yarn@1.22.22 install --frozen-lockfile` successfully (52.15 s). This cleared the Babel error without package overrides or patches. Partial temporary and ignored dependency backups were retained.
- Two export attempts were interrupted during dependency repair after reporting `Starting Metro Bundler`; neither produced a successful export result. The final export after clean installation completed.
- First Jest after clean installation: `Cannot find module 'react-native/Libraries/Animated/NativeAnimatedHelper'`. Cause: React Native moved this internal module. Fix: update the existing mock path in 12 tests to `react-native/src/private/animated/NativeAnimatedHelper`. No test assertions were removed.
- That run also reported `Exceeded timeout of 5000 ms for a test` in Input's error-rendering test and `You are trying to import a file after the Jest environment has been torn down`. It occurred while running the cold Jest suite and export concurrently; resource contention is a possible cause, not established. It did not recur in subsequent full runs. No timeout or assertion was changed. Combined result: **43/59 suites, 126/131 executed tests, 60/64 executed snapshots passed**, exit 1 (137.518 s).
- After mock-path changes, only snapshot assertions failed: `10 snapshots failed from 8 test suites`; **51/59 suites, 168/178 tests, 75/85 snapshots passed**, exit 1 (55.164 s). Reviewed all differences against the installed libraries: disabled TouchableOpacity now has `focusable={false}`; image mocks serialize `testUri` instead of numeric 1; pager-view renders `LEGACY_RNCViewPager` with `useLegacy={true}`; screens changes sheet defaults and adds an undefined zIndex; Gesture Handler serializes `enabled={false}`. Updated only these expected library rendering changes in eight snapshot files. The deterministic copyright-year test was unchanged.

Verification commands after repair:

```powershell
# Node 20.20.2, APP_ENV=development, same caches:
npx.cmd jest --ci --coverage=false
npx.cmd jest --ci --coverage=false --updateSnapshot
npx.cmd jest --ci --coverage=false
npx.cmd expo export --platform android --output-dir (Join-Path $env:TEMP 'expo-casebook-sdk52\android-export')

# Separate PowerShell using system Node 24.15.0, same APP_ENV/caches,
# with only the cached Yarn executable prepended to PATH:
npx.cmd expo-doctor
npx.cmd --yes --package=expo-doctor@1.21.7 --package=@expo/env@2.6.0 expo-doctor
git diff --check
```

- Bare Doctor failed before checks with `Cannot find module '@expo/env'`, the same Doctor 1.21.7 packaging issue recorded for SDK 51. Supplying its runtime dependency through the temporary npx package environment let checks run; nothing was added to the app for this workaround.
- Doctor 1.21.7: **17/18 checks passed**, exit 1. Remaining failure: `Validate packages against React Native Directory package metadata`. It reported unmaintained `@react-native-masked-view/masked-view`, `expo-av`, `react-native-collapsible`, `react-native-flash-message`, `react-native-snap-carousel`; no metadata for `@react-navigation/material-bottom-tabs`, `dotenv`, `firebase`, `react-native-elements`, `watchman`. No checks were excluded or disabled. This maintenance/metadata check remains unresolved in this SDK-only step.
- Snapshot update: **59/59 suites, 178/178 tests, 10 snapshots updated and 75 unchanged**, exit 0 (20.98 s).
- Final Jest without update mode: **59/59 suites, 178/178 tests, 85/85 snapshots passed**, exit 0 (18.314 s). Existing act/navigation warnings and library deprecation warnings remain.
- Android export: **OK**, exit 0, 2025 modules bundled in 51175 ms; 44 assets, one 6.37 MB Hermes bundle and metadata.json exported to `%TEMP%\expo-casebook-sdk52\android-export`, outside the repository. No native build or device runtime test was performed.
- Inspection/tooling notes: `rg` was unavailable (`The term 'rg' is not recognized`), so searches used PowerShell. One tool orchestration call had `SyntaxError: Invalid or unexpected token` before any command ran and was corrected. Read-only Git status warned that the global ignore file was inaccessible; Git also emitted Windows line-ending notices.
- No Git add, commit, stash, or checkout commands were run. Changes are limited to SDK dependencies/lockfile, app configuration, the 12 mock paths, eight snapshot files, this log, and COMMIT_MSG.txt. `git diff --check` passed before the documentation update.

## SDK 53 (React Native 0.79.6)

- Measured on 11 November 2026, Windows. Upgraded only SDK 52 to 53: Expo 53.0.27, React Native 0.79.6, React 19.0.0, Reanimated 3.17.5, Gesture Handler 2.24.0, screens 4.11.1, safe-area-context 5.4.0, pager-view 6.7.1, jest-expo 53.0.14, babel-preset-expo 13, TypeScript 5.8.3.
- Reviewed the [SDK 53 release notes](https://expo.dev/changelog/2025-04-30-sdk-53). The two changes that hit this app were React 19 (no `defaultProps` on function components, new element `$$typeof`) and the removal of `Localization.locale`.
- New Architecture: `app.config.js` had no `newArchEnabled`, so SDK 53 would turn it on implicitly. Added `newArchEnabled: true` explicitly so the choice is visible. Reason: SDK 54 makes it mandatory and later steps need it. Only the JS tests and the bundle were checked; no device build or runtime test was done on either architecture.

Commands (Node 20.20.2 and Yarn 1 as in the SDK 50 to 52 steps):

```powershell
npx.cmd expo install expo@^53.0.0
npx.cmd expo install --fix        # also: jest-expo@~53, babel-preset-expo, typescript@~5.8.3
yarn add -D @testing-library/react-native@^13.2.0 react-test-renderer@19.0.0
yarn add @rneui/themed@4.0.0-rc.8 @rneui/base@4.0.0-rc.7 ; yarn remove react-native-elements
APP_ENV=development npx.cmd jest --ci --coverage=false
npx.cmd expo-doctor
npx.cmd expo export --platform android --output-dir <temp dir outside the repo>
```

Errors and fixes:

- `Cannot find native module 'ExponentAV'` (VimeoVideo suite). Cause: jest-expo 53 no longer ships a mock for that expo-av module. Fix: add a small `jest.mock('expo-av/build/ExponentAV', ...)` in `setupJest.js`. expo-av stays (deprecated, removed in SDK 54; migrating to expo-video/expo-audio is left for the SDK 54 step).
- `Expected newLocale to be a string; got undefined` in `src/utils/i18n.js`. Cause: `Localization.locale` was removed. Fix: `Localization.getLocales()[0]?.languageTag ?? 'en'`.
- `Unable to find an element with text: Cancel` / `Yes` in ImporterPage. Cause: `@testing-library/react-native` 11 does not flush async updates under React 19. Fix: upgrade to 13.3.3 (with `react-test-renderer@19`).
- Slider rendered with `min`/`max` `undefined`, icons rendering empty. Cause: `react-native-elements` 3.4.3 (unmaintained) relies on `defaultProps`, which React 19 ignores. Fix: replaced it with `@rneui/themed` 4.0.0-rc.8 and `@rneui/base` 4.0.0-rc.7, same components (`CheckBox`, `Slider`, `Input`) in 5 files. rc.8/rc.7 are used instead of 5.0.0 because 5.0.0 depends on `@react-native-vector-icons/*` native packages that Expo does not alias, while rc.7 resolves `react-native-vector-icons` to `@expo/vector-icons`. rc.7 sets defaults by destructuring, so it works on React 19. Added `@rneui/.*` to Jest `transformIgnorePatterns`.
- `RangeError: Invalid string length` in TrainingPage snapshots. Cause: Jest 29's pretty-format does not recognise React 19 elements (`Symbol.for('react.transitional.element')`) and walks the whole `_owner` fiber when a FlatList header element is in props. Fix: `jest.reactElementSerializer.js` (registered in `snapshotSerializers`) prints them as before.
- Export: `child.splitExportDeclaration is not a function`, then `Cannot find module '@babel/helper-...'` from stale nested `@babel/traverse` copies after the in-place install. Same class of problem as in SDK 52. Fix: `yarn-deduplicate` on the Babel packages, then moved `node_modules` to the ignored `.expo/nm53` and ran a clean `yarn install`. Added `modulePathIgnorePatterns: ["<rootDir>/.expo/"]` so Jest does not crawl that backup (`Cannot parse ...\.expo\nm53\...\package.json as JSON`).
- expo-doctor: `typescript@5.3.3 - expected version: ~5.8.3`. Fixed with `expo install typescript@~5.8.3`.

Snapshots (29 + 2 updated across 19 files; all reviewed, no assertion or mock weakened, no test deleted):

- `@rneui` replacing react-native-elements: Checkbox, Input and Icon get new testIDs (`RNE__CheckBox__Title`, `RNE__ICON`, ...), accessibility props and focus handlers; checkbox `borderColor` `#ededed` to `#ffffff` and no `borderRadius`/`opacity` (border width is 0). Slider `accessibilityValue.now` 15 to 1: the new Slider clamps the value to its max (1), which the test did not set.
- React 19 no longer applies `defaultProps`: style arrays and `Icon` elements lose default props such as `allowFontScaling`/`size` (TrainingPage, HomePage, DrillPage, FitnessPage, ProgramList, FrisbeeDrillIllustration, DrillPageMinimal).
- pager-view 6.7: `LEGACY_RNCViewPager` with `useLegacy` becomes `RNCViewPager` (New Architecture component).
- Picker values serialised as numbers instead of strings (EssentialPage, TacticsPage); VimeoVideo `resizeMode="mock"` becomes `{}` (jest-expo mock change).

Results:

- Jest (`APP_ENV=development`, Node 20.20.2, no update mode): **59/59 suites, 178/178 tests, 85/85 snapshots passed**. Existing act(...) warnings and the expo-av deprecation warning remain.
- Expo Doctor 1.21.7 (Node 24, `@expo/env` supplied as in SDK 51/52): **17/18 passed**. The remaining failure is the React Native Directory check: unmaintained `@react-native-masked-view/masked-view`, `@rneui/base`, `@rneui/themed`, `expo-av`, `react-native-collapsible`, `react-native-flash-message`, `react-native-snap-carousel`; no metadata for `@react-navigation/material-bottom-tabs`, `dotenv`, `firebase`, `watchman`. Not excluded or disabled. `@rneui` is itself flagged unmaintained, so the replacement trades one flagged library for another to keep behaviour.
- Android export: **OK**, one 6.53 MB Hermes bundle plus assets and `metadata.json` in a temp dir outside the repository. No device test.
- `react-redux` 8.0.5 still warns about its React 18 peer range; tests and export pass, so it was left for a later step. No Git add, commit, stash, checkout or push was run.
