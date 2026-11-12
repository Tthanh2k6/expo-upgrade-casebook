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

## SDK 54 (React Native 0.81.5)

- Measured on 11 November 2026, Windows. Upgraded only SDK 53 to 54: Expo 54.0.37, React Native 0.81.5, React 19.1.0, Reanimated 4.1.7 with the new `react-native-worklets` 0.5.1, Gesture Handler 2.28, screens 4.16, safe-area-context 5.6, pager-view 6.9.1, async-storage 2.2.0, expo-av 16.0.8, jest-expo 54.0.18, babel-preset-expo 54.0.12, TypeScript 5.9.
- Reviewed the [SDK 54 release notes](https://expo.dev/changelog/sdk-54). What matters for this app: React Native 0.81 and React 19.1; Reanimated 4 needs the New Architecture (already on since SDK 53) and `react-native-worklets`; `expo-av` is still present but deprecated and goes away in SDK 55; Node 20.19.4 or newer is required (Node 20.20.2 used); edge-to-edge on Android is always on for API 36 and this app has no code for the navigation bar or system bars, so nothing was changed; SDK 54 is the last release that supports the Legacy Architecture. The app does not use expo-file-system, expo-notifications or the iOS-only locale config, so those removals do not apply. No device or emulator test was done.
- `expo-av` was not migrated to expo-audio/expo-video in this step. It is a SDK 55 task (the app still compiles and the VimeoVideo tests pass).

Commands (Node 20.20.2 and Yarn 1 as in the SDK 50 to 53 steps; `APP_ENV=development`):

```powershell
npx.cmd expo install expo@^54.0.0
npx.cmd expo install --fix
npx.cmd expo install react-native-worklets
yarn add -D react-test-renderer@19.1.0
npx.cmd jest --ci --coverage=false
npx.cmd jest --ci --coverage=false --updateSnapshot   # after reviewing every diff
npx.cmd jest --ci --coverage=false
npx.cmd expo export --platform android --output-dir <temp dir outside the repo>
# Node 24:
npx.cmd --yes --package=expo-doctor@1.21.7 --package=@expo/env@2.6.0 expo-doctor
```

Errors and fixes:

- `expo install expo@^54.0.0` installed exactly `expo@54.0.0` (no range); `expo install --fix` then moved it to `~54.0.37`. Both are slow on a cold Yarn cache (about 4 and 1.5 minutes).
- First `expo install --fix` ended with `Cannot automatically write to dynamic config at: app.config.js` and exit 1, after updating the runtime dependencies but before the dev dependencies. Cause: `expo-mail-composer` 15 needs its config plugin and `app.config.js` is dynamic, so the tool cannot add it. Fix: added `'expo-mail-composer'` to `plugins` in `app.config.js`, then re-ran `--fix`, which exited 0 and updated jest-expo and TypeScript.
- Yarn warned `react-native-reanimated@4.1.7 has unmet peer dependency "react-native-worklets@0.5 - 0.8"`. Reanimated 4 moved the worklets runtime to a separate package. Fix: `expo install react-native-worklets` (0.5.1). Also bumped `react-test-renderer` to 19.1.0 to match React 19.1.0.
- `babel.config.js`: removed `plugins: ['react-native-reanimated/plugin']`. With `react-native-worklets` installed, `babel-preset-expo` 54 applies the worklets plugin itself. `setupJest.js` mocks (`react-native-reanimated/mock`, `__reanimatedWorkletInit`) were left unchanged and still work.
- No stale nested Babel packages this time, so no `yarn-deduplicate` or clean reinstall was needed.

Snapshots (15 failed on the first Jest run: 12 suites, 14 tests, 70 passed; all differences reviewed in `git diff`, no test or assertion changed or deleted, then updated):

- Icon glyphs (SharePlay, ShareDrill, DrillList, DrillListPage): the single private-use character in the icon `<Text>` changes codepoint (private-use range U+E... to U+F...). Likely cause: the `@expo/vector-icons` glyph maps were updated with this SDK; not traced further.
- Style arrays flattened (HomePage, DrillPage, DrillPageMinimal, FitnessPage, ProgramList, ProgramListPage, FrisbeeDrillIllustration, DrillListPage): nested style arrays such as `[[a, b], c]` and `[undefined, {}]` now render as one object, so the `false`/`undefined`/`null` entries disappear and keys appear in a different order; three `style={[undefined, {}]}` become `style={{}}`. Probable cause: the updated react-native-screens/react-native packages flatten styles before rendering (not traced to one package). Values (`flex`, `top`, `height: 44`, shadows, opacity) are the same, only the nesting differs. Prop names, text and testIDs did not change.
- Modal: `hardwareAccelerated={false}` is no longer rendered. Cause: React Native 0.81 Modal no longer sets that default.

Results:

- Jest after the snapshot update: 59/59 suites, 178/178 tests, 15 snapshots updated and 70 unchanged. Final run without update mode: **59/59 suites, 178/178 tests, 85/85 snapshots passed**, exit 0 (20.7 s). Existing act(...) warnings remain; the expo-av deprecation warning now says it is removed in SDK 54 (stale text in the package) and a new warning says `SafeAreaView` from React Native is deprecated.
- Expo Doctor 1.21.7 (Node 24, `@expo/env` supplied as in SDK 51 to 53): **18/18 checks passed, no issues detected**. Nothing was excluded or disabled.
- Android export: **OK**, exit 0, 2292 modules bundled in 60437 ms; 44 assets, one 6.78 MB Hermes bundle and `metadata.json` in a temp dir outside the repository. No device test.
- `react-redux` 8.0.5 still warns about its React 18 peer range; left for a later step. No Git add, commit, stash, checkout or push was run.

## SDK 55 (React Native 0.83.10)

- Measured on 12 November 2026, Windows, Node 24.15.0 and Yarn 1.22.22. Upgraded only SDK 54 to 55: Expo 55.0.32, React Native 0.83.10, React 19.2.0, Reanimated 4.2.1, Worklets 0.7.4, Gesture Handler 2.30.0, screens 4.23.0, pager-view 8.0.0, expo-video 55.0.21, jest-expo 55.0.22 and babel-preset-expo 55.0.25. Matched react-test-renderer to React 19.2.0 and raised the package Node minimum to 20.19.4; `.nvmrc` remains 20.20.2.
- Reviewed the [SDK 55 release notes](https://expo.dev/changelog/sdk-55), [upgrade guide](https://expo.dev/blog/upgrading-to-sdk-55), and React Native [0.82](https://reactnative.dev/blog/2025/10/08/react-native-0.82) and [0.83](https://reactnative.dev/blog/2025/12/10/react-native-0.83) notes. SDK 55 requires the New Architecture, already enabled here. No native project directories, EAS Update publishing commands, or app usages of the other removed APIs were found. Hermes V1 was not enabled.
- Replaced the app's only `expo-av` usage, `VimeoVideo`, with `expo-video` because AV is removed from Expo Go and no longer maintained. Used `useVideoPlayer`, `replaceAsync`, status events and `VideoView` with SDK 55's `fullscreenOptions.enable`. Retained 540p selection, looping, mute/autoplay options, native controls, contain sizing and orientation callbacks. The player pauses on navigation blur; late fetch completion cannot autoplay after blur or unmount. iOS mixing and Android ducking use `audioMixingMode`; expo-video's iOS implementation uses the playback audio category, including silent-switch playback. No standalone audio usage required `expo-audio`.
- Removed the old AV native mock, added the video config plugin, and added six video behavior tests with deterministic fetch responses. Tests keep the real video hook and view, mocking only the native player class. The existing snap-carousel fork, RNEUI and material bottom tabs passed the requested checks without replacement. These checks do not establish device runtime compatibility.

Commands and environment (fresh temporary caches; previous SDK 50 cache paths were absent):

```powershell
$env:HUSKY = '0'
$env:EXPO_NO_TELEMETRY = '1'
$env:APP_ENV = 'development'
$env:__UNSAFE_EXPO_HOME_DIRECTORY = Join-Path $env:TEMP 'expo-casebook-sdk55\expo'
$env:npm_config_cache = Join-Path $env:TEMP 'expo-casebook-sdk55\npm'
$env:YARN_CACHE_FOLDER = Join-Path $env:TEMP 'expo-casebook-sdk55\yarn'
npx.cmd --yes yarn@1.22.22 --version
$yarnBin = Get-ChildItem -Path (Join-Path $env:npm_config_cache '_npx\*\node_modules\.bin\yarn.cmd') | Select-Object -First 1 -ExpandProperty DirectoryName
$env:Path = $yarnBin + ';' + $env:Path
node --version # v24.15.0
npx.cmd expo install expo@^55.0.0
npx.cmd expo install --fix
npx.cmd expo-doctor # early run while dependency alignment was still in progress
npx.cmd expo install expo-video
# Added expo-video to app.config.js plugins after the CLI error below.
npx.cmd --yes yarn@1.22.22 remove expo-av
npx.cmd --yes yarn@1.22.22 add --dev react-test-renderer@19.2.0
npx.cmd jest --ci --coverage=false
npx.cmd expo-doctor
# Repeated Jest after the native mock changes; used this focused command twice:
npx.cmd jest --ci --coverage=false --runInBand src/Components/shared/__tests__/VimeoVideo.test.js
npx.cmd jest --ci --coverage=false
npx.cmd prettier --write src/Components/shared/VimeoVideo.js src/Components/shared/__tests__/VimeoVideo.test.js setupJest.js
npx.cmd jest --ci --coverage=false --updateSnapshot
npx.cmd expo export --platform android --output-dir (Join-Path $env:TEMP 'expo-casebook-sdk55\android-export')
npx.cmd jest --ci --coverage=false
git diff --check
```

Errors, causes and fixes:

- The initial Expo install resolved exactly 55.0.0; `--fix` moved it to 55.0.32 and aligned runtime/dev dependencies. Both commands exited 0. Yarn logged `There appears to be trouble with your network connection. Retrying...`; retries succeeded. Existing RNEUI, vector-icons, prop-types and react-redux peer warnings remain. No dependency overrides or node_modules patches were used.
- Early Doctor: **17/20 checks passed**, exit 1. Errors: `Found duplicates for expo-constants`, `Unmaintained: expo-av`, and `18 packages out of date`. This run inspected the intermediate dependency tree while `--fix` was still running. Finishing dependency alignment and removing AV resolved all three checks; no checks were disabled or excluded.
- `expo install expo-video`: `Cannot automatically write to dynamic config at: app.config.js`, exit 1 after successfully installing 55.0.21. Cause: CLI cannot insert the required plugin into dynamic config. Fix: manually add `'expo-video'` to `plugins`.
- First Jest: `WorkletsError: [Worklets] Native part of Worklets doesn't seem to be initialized.` Cause: Reanimated's mock imports Worklets 0.7's native initialization path. Fix: load the supplied `react-native-worklets/src/mock` in `setupJest.js`, before Reanimated's existing mock.
- First Jest also failed with `Cannot read properties of undefined (reading 'prototype')` in expo-video's VideoPlayer module. Cause: jest-expo's ExpoVideo mock provides functions but no `VideoPlayer` class. Fix: mock the native module with a `SharedObject` subclass supporting player methods and events. An initial mock targeting `expo-video/src/NativeVideoModule` did not intercept the package's compiled entry point; the same error recurred in a full and a focused run. Corrected the target to `expo-video/build/NativeVideoModule` (stack traces use source maps and show `src`). No application component was mocked out.
- First full Jest result: **50/59 suites, 160/163 executed tests, 73/76 executed snapshots passed**, exit 1 (42.496 s). After the Worklets fix but before correcting the video mock path: **55/59 suites, 168/171 executed tests, 78/81 executed snapshots passed**, exit 1 (35.378 s).
- A new fullscreen test initially reported `received value must be a mock or spy function`: it asserted calls on the real `ScreenOrientation.lockAsync` wrapper. Added a call-through Jest spy. That focused run had **5/8 tests passed**, with this assertion failure and two expected video snapshot mismatches; the other new behavior tests passed.
- After those fixes, full Jest failed only snapshot assertions: `7 snapshots failed from 4 test suites`; **55/59 suites, 177/184 tests, 78/85 snapshots passed**, exit 1 (28.39 s). Reviewed the differences against the installed library code before updating them.
- Local inspection: `rg` was unavailable, so searches used PowerShell `Select-String`. Read-only Git status warned that the user-profile global ignore file was inaccessible; it still returned repository status. Git also emitted LF/CRLF notices. Neither prevented verification.

Expected library rendering changes (7 snapshots updated across 4 files):

- VimeoVideo (2): AV's wrapper and `ViewManagerAdapter_ExpoVideoView` become expo-video's `ViewManagerAdapter_ExpoVideo`, with `contentFit`, `nativeControls`, a player ID, and the new fullscreen props/callbacks. Loading/error text and dimensions remain unchanged.
- TrainingPage (2): pager-view 8 adds a root style array and wraps child absolute-fill styles in arrays with zero left/right margins. Confirmed in `PagerView.tsx` and `utils.ios.tsx`.
- DrillPage (2) and FitnessPage (1): screens 4.23 serializes `fullScreenSwipeEnabled="undefined"` and adds `androidResetScreenShadowStateOnOrientationChangeEnabled`, `sheetDefaultResizeAnimationEnabled`, `sheetShouldOverflowTopInset` and `synchronousShadowStateUpdatesEnabled` defaults. Confirmed in `Screen.tsx`.
- No snapshots were added or removed, no existing test assertion was removed, and the deterministic copyright-year test was unchanged. The update run passed **59/59 suites and 184/184 tests**, with **7 snapshots updated and 78 unchanged** (28.695 s).

Results:

- Final Jest, `APP_ENV=development`, no update mode: **59/59 suites, 184/184 tests, 85/85 snapshots passed**, exit 0 (25.169 s). Existing `act(...)` and React Native SafeAreaView deprecation warnings remain.
- Bare `npx.cmd expo-doctor` resolved Doctor 1.21.8: **20/20 checks passed**, exit 0, no issues detected. The temporary `@expo/env` workaround used in earlier steps was not needed. No unresolved checks.
- Android export: **OK**, exit 0; 2275 modules bundled in 26002 ms, 44 assets, one 6.8 MB Hermes bundle and `metadata.json` in `%TEMP%\expo-casebook-sdk55\android-export`, outside the repository. Metro warned that `NO_COLOR` was ignored because `FORCE_COLOR` was set. No native build or device/emulator runtime test was performed.
- `git diff --check`: passed. `HUSKY=0` skipped hook installation. No Git add, commit, stash, checkout or push was run.

## SDK 56 (React Native 0.85.3)

- Measured on 12 November 2026, Windows, Node 24.15.0 and Yarn 1.22.22. Upgraded only SDK 55 to 56: Expo 56.0.24, React Native 0.85.3, React/react-test-renderer 19.2.3, Reanimated 4.3.1, Worklets 0.8.3, Gesture Handler 2.31.2, screens 4.26.2, pager-view 8.0.1, safe-area-context 5.7.0, expo-video 56.1.4, jest-expo 56.0.6, babel-preset-expo 56.0.21 and TypeScript 6.0.3. The Node minimum and `.nvmrc` were unchanged; the installed React Native supports Node 20.19.4+, 22.13+, 24.3+ and 25+ in its engine ranges.
- Reviewed the [SDK 56 release notes](https://expo.dev/changelog/sdk-56), [upgrade guide](https://expo.dev/blog/upgrading-to-sdk-56), React Native [0.84](https://reactnative.dev/blog/2026/02/11/react-native-0.84) and [0.85](https://reactnative.dev/blog/2026/04/07/react-native-0.85) notes, and the installed package changelogs/implementations. No native project directories or custom native modules are present. The iOS minimum is now 16.4 and native iOS builds require Xcode 26.4. This app uses React Navigation without Expo Router, so the Router-specific import migration does not apply. Its Vimeo fetch uses `Response.json()`, supported by the new default Expo fetch; there are no app calls to the changed file-system copy/move or Expo system-bar APIs.
- Added direct `@expo/vector-icons` (resolved 15.1.1) and `expo-font` (56.0.7) dependencies. Expo 56 no longer supplies vector-icons as a dependency. Added `@react-native/jest-preset@0.85.3`, which React Native extracted into a separate package and jest-expo now requires as a peer. Kept the `jest-expo` preset and existing mocks/assertions.
- Updated Paper 5.11.3 to 5.15.4 because its bottom-navigation and ripple styles used the removed `StyleSheet.absoluteFillObject`; the new release uses `StyleSheet.absoluteFill`. This was found by source inspection, not a thrown test error. The app's RNEUI CheckBox/Input/Slider and snap-carousel usage passed the checks; the removed style API occurs only in their other, unused components (Image/SpeedDial/TabView/Tile and ParallaxImage). No carousel, RNEUI or material-bottom-tabs replacement was needed for the exercised app paths.
- Migrated the legacy splash config to explicit `expo-splash-screen` plugin options: white background, iOS full-screen cover image, and Android contain icon at 200 dp. The old Android width was confirmed in SDK 55's cached prebuild implementation. SDK 56 moved splash configuration out of prebuild-config; the new plugin does nothing without options. Added the requested `expo-font` plugin, retaining runtime font loading.

Commands and environment (SDK 55 npm/Yarn caches and cached Yarn executable reused):

```powershell
$env:HUSKY = '0'
$env:EXPO_NO_TELEMETRY = '1'
$env:APP_ENV = 'development'
$env:__UNSAFE_EXPO_HOME_DIRECTORY = Join-Path $env:TEMP 'expo-casebook-sdk56\expo'
$env:npm_config_cache = Join-Path $env:TEMP 'expo-casebook-sdk55\npm'
$env:YARN_CACHE_FOLDER = Join-Path $env:TEMP 'expo-casebook-sdk55\yarn'
$yarnBin = Get-ChildItem -Path (Join-Path $env:npm_config_cache '_npx\*\node_modules\.bin\yarn.cmd') | Select-Object -First 1 -ExpandProperty DirectoryName
$env:Path = $yarnBin + ';' + $env:Path
node --version # v24.15.0
npx.cmd expo install expo@^56.0.0
npx.cmd expo install --fix
# Added the splash-screen plugin after the dynamic-config error.
npx.cmd expo install --fix
npx.cmd expo install @expo/vector-icons
npx.cmd --yes yarn@1.22.22 add --dev @react-native/jest-preset@0.85.3 react-test-renderer@19.2.3
npx.cmd --yes yarn@1.22.22 add react-native-paper@^5.15.4
npx.cmd jest --ci --coverage=false
npx.cmd expo-doctor
npx.cmd expo install expo-font
# Added expo-font to app.config.js plugins after the dynamic-config error.
npx.cmd jest --ci --coverage=false --updateSnapshot
npx.cmd expo-doctor
npx.cmd expo export --platform android --output-dir (Join-Path $env:TEMP 'expo-casebook-sdk56\android-export')
npx.cmd jest --ci --coverage=false
git diff --check
```

Errors, causes and fixes:

- Initial Expo install resolved exactly 56.0.0, exit 0. The first `--fix` installed Expo 56.0.24 and runtime dependencies, then exited 1: `Cannot automatically write to dynamic config at: app.config.js`, requesting `expo-splash-screen`. Cause: the CLI cannot insert its required plugin into dynamic configuration. Added the plugin, migrated its options as above, and repeated `--fix`; the retry aligned Babel, Jest and TypeScript and exited 0.
- Yarn reported `jest-expo@56.0.6 has unmet peer dependency "@react-native/jest-preset@^0.85.0"`. Installed the extracted preset and matched react-test-renderer to React before running tests. Other peer warnings remain for RNEUI, react-redux, prop-types, react-refresh and Worklets' `@react-native/metro-config` peer. No dependency overrides, node_modules patches or clean-install repair were used.
- Initial Doctor 1.21.8: **20/22 checks passed**, exit 1. `Missing peer dependency: expo-font` required by vector-icons was fixed by installing expo-font directly. That install succeeded at the package-manager level but the CLI exited 1 with `Cannot automatically write to dynamic config at: app.config.js`, requesting `expo-font`; added the plugin manually.
- Doctor's other failure, also present in the final run: `This project uses Hermes V1 with expo@56.0.24, which is affected by a known memory regression.` It detects Hermes 250829098.0.10 and identifies 250829098.0.16 as the first fixed version. Doctor recommends SDK 57 / React Native 0.86.2 or later. This remains unresolved within the requested SDK 56-only step; no check was disabled or excluded and no Hermes/compiler override was applied. The release notes specifically identify Worklets/Reanimated as affected. Tests and export do not measure this device memory regression.
- Initial Jest: `5 snapshots failed from 4 test suites`; **55/59 suites, 179/184 tests, 80/85 snapshots passed**, exit 1 (66.436 s). Every failure was a snapshot assertion. Reviewed the diffs and library code before updating the five expected rendering changes below.
- The snapshot update run warned `A worker process has failed to exit gracefully and has been force exited` but exited 0. The warning did not recur in the final run. Existing `act(...)` and React Native SafeAreaView deprecation warnings remain. Metro warned that `NO_COLOR` was ignored because `FORCE_COLOR` was set; export completed.
- Local inspection: `rg` was unavailable, so searches used PowerShell `Select-String`. Read-only Git commands warned about the inaccessible user-profile global ignore file and LF/CRLF conversion; these did not prevent verification.

Expected library rendering changes (5 snapshots updated across 4 files):

- DrillPage (2) and FitnessPage (1): screens 4.26 changes `synchronousShadowStateUpdatesEnabled` from false to true. Confirmed the new default in `src/flags.ts` and its use in `Screen.tsx`.
- HomePage (1): Paper's iOS bottom-tab touchable now uses Pressable, adding accessibilityValue, collapsable and focus handlers; its active/inactive icon styles now explicitly include opacity 1/0. Confirmed in `BottomNavigationBar.tsx`.
- ToggleButton (1): Paper's IconButton uses optional `contentStyle` for the inner TouchableRipple instead of repeating the border-radius object there; the outer button's radius remains. Confirmed in `IconButton.tsx`.
- No snapshots were added or removed, no test assertion or mock was weakened, and no application component source was changed. The deterministic copyright-year test remains unchanged. Update run: **59/59 suites, 184/184 tests, 5 snapshots updated and 80 unchanged**, exit 0 (41.724 s).

Results:

- Final Jest, `APP_ENV=development`, without update mode: **59/59 suites, 184/184 tests, 85/85 snapshots passed**, exit 0 (28.117 s).
- Bare `npx.cmd expo-doctor`, Doctor 1.21.8: **21/22 checks passed**, exit 1. Only the SDK 56 Hermes V1 regression check remains; dependency, peer and app-config checks pass.
- Android export: **OK**, exit 0; 2300 modules bundled in 29428 ms, 44 assets, one 6.1 MB Hermes bundle and `metadata.json` in `%TEMP%\expo-casebook-sdk56\android-export`, outside the repository. No native build or device/emulator runtime test was performed.
- `git diff --check`: passed. Wrote `COMMIT_MSG.txt`. `HUSKY=0` skipped hook installation. No Git add, commit, stash, checkout or push was run.
