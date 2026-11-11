# Upgrade log: Expo SDK 49 → 58

Fork of [disc-in/UltimateApp](https://github.com/disc-in/UltimateApp) (MIT), a real Expo app for ultimate frisbee coaching. The original code is tagged `sdk49-baseline`. Each SDK step below is one or more commits; every error message quoted here was seen in a real run.

Package manager: yarn 1 (`npx --yes yarn@1.22.22`). Checks per step: `npx jest --ci`, `npx expo-doctor`, `npx expo export --platform android`.

## Baseline (SDK 49, React Native 0.72.6) — measured 11/11/2026 on Windows 11, Node 24

- `yarn install --frozen-lockfile`: OK (112 s).
- Jest: 177 of 178 tests pass, 84 of 85 snapshots. The one failure is not caused by the SDK: `AboutPage` renders the copyright range with the current year (`2020 - 2026` vs snapshot `2020 - 2024`).
- expo-doctor: 14/16 checks pass. Failing:
  - SDK 49 targets Android API level 33 or lower; Google Play has required API 34+ since 31 Aug 2024.
  - `expo-updates@0.18.17` (expected ~0.18.19) and `react-native@0.72.6` (expected 0.72.10) do not match SDK 49.
