# Chewy React Native

Chewy's native-capable React Native project for Android and iOS. The Android app has a Kotlin module and Accessibility service for a local app-boundary prototype. The earlier SwiftUI app remains separately in `../Chewy`.

## What's here

- Three illustrated onboarding screens introduce Chewy, Focus, and app pauses. A short cartoon transition then opens Home. Day, Evening, Forest, and Night themes can be chosen in Settings.
- Home, Block, Focus, Progress, and Settings tabs. Android Home shows locally queried app usage after Usage Access is granted; Progress shows focus sessions, pause counts, and a seven-day selected-app usage trend.
- An SVG Chewy character with several expressions and gentle motion that respects Reduce Motion.
- Plus Jakarta Sans typography on iOS and Android, including the native Android pause overlay. Its license is in `assets/fonts/PlusJakartaSans-OFL.txt`.
- Android Block tab that lists installed launchable apps, saves a selection, shows the service disclosure, and opens Android Accessibility settings.
- Kotlin `ChewyBlockerService` that checks the foreground app package and places a pause overlay over selected apps during all-day blocking, a linked Focus session, a recurring schedule, or after a daily allowance. The temporary access window can be set to off, 5, 10, 15, or 30 minutes. Chewy, Settings, System UI, and the launcher are excluded.
- A locally saved focus timer that temporarily shields selected Android apps when the service is enabled. A configurable daily goal drives Chewy energy from selected-app usage.

## Run on this Mac

The React Native Community CLI project was created with React Native 0.87.1. Android Studio is installed with a Pixel 10 Pro emulator. Its bundled JDK is used by the scripts.

In terminal 1:

```bash
cd /Users/shreyansh/Documents/Codex/2026-09-28/referenced-chatgpt-conversation-this-is-an/outputs/ChewyReactNative
./scripts/run-emulator.sh
```

In terminal 2:

```bash
cd /Users/shreyansh/Documents/Codex/2026-09-28/referenced-chatgpt-conversation-this-is-an/outputs/ChewyReactNative
npm start
```

In terminal 3:

```bash
cd /Users/shreyansh/Documents/Codex/2026-09-28/referenced-chatgpt-conversation-this-is-an/outputs/ChewyReactNative
./scripts/run-android.sh
```

If using Android Studio, open the `android` folder, select the Pixel 10 Pro emulator, and run the `app` configuration. `npm install` restores JavaScript dependencies after cloning. React Native recommends Watchman for live development; install it with `brew install watchman` if Metro cannot watch the project files.

For a self-contained emulator preview that does not need Metro, run `./scripts/preview-android.sh`. This uses the template's debug signing key for local testing only; it is not a production distribution build.

## Try the blocker

1. Finish onboarding and open **Block**.
2. Select an app from the installed app list.
3. Read the in-app disclosure and tap **Open Accessibility settings**.
4. In Android Settings, enable **Chewy app boundaries**, then return to Chewy.
5. Turn on **All day** or add a schedule in **Your rules**. Open the selected app during an active rule; Chewy should show its pause screen. You can also choose a daily allowance, which requires separate Android Usage Access.
6. Use **Go to Home**, **Open Chewy**, or the configured temporary access window. To stop all rules, disable the service in Android Settings; the **All day** switch controls that rule alone.

The service does not request window-content access, read taps or text, or send app activity to a server. It only compares the foreground app package with the locally selected list. This is a local prototype, not a claim of Google Play policy approval. See `docs/ANDROID_BLOCKING.md` for details.

## Development notes

The native blocker bridge is `android/app/src/main/java/com/shreyansh/chewy/ChewyBlockerModule.kt`; the service is `ChewyBlockerService.kt`; the React Native wrapper is `src/native/blocker.ts`. This boundary allows replacing the current React Native legacy-module interface with a TurboModule later without moving the blocking logic into JavaScript. The iOS project can later receive a Swift module, but React Native does not remove Apple's Family Controls entitlement requirements for iOS app blocking.

Android usage figures require separate Usage Access and can lag. Home app time and selected-app time now use the same foreground-event window from local midnight to the present; Home app time sums launchable apps, so it may differ from systemwide screen time. Selected-app time and Chewy energy follow selection changes from the time tracking begins; earlier days are not reconstructed. Progress shows seven daily bars, marks pretracking days with dashes, and compares the latest seven complete days with the prior seven after two full weeks of tracking. The score reaches 50 at the chosen daily goal and 0 at twice that goal; it is a visual cue, not a medical measure. Focus streaks are saved locally. There is no widget, billing, or iOS Screen Time integration yet.
