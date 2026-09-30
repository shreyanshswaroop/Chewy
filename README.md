# Chewy React Native

Chewy's native-capable React Native project for Android and iOS. The Android app has a Kotlin module and Accessibility service for a local app-boundary prototype. The earlier SwiftUI app remains separately in `../Chewy`.

## What's here

- Swipeable three-panel welcome screen followed by Chewy's 24 onboarding pages, with saved completion.
- Home, Block, Focus, Stats, and Settings tabs. Home and Stats numbers are visibly marked preview data.
- An SVG Chewy character with several expressions and gentle motion that respects Reduce Motion.
- Plus Jakarta Sans typography on iOS and Android, including the native Android pause overlay. Its license is in `assets/fonts/PlusJakartaSans-OFL.txt`.
- Android Block tab that lists installed launchable apps, saves a selection, shows the service disclosure, and opens Android Accessibility settings.
- Kotlin `ChewyBlockerService` that checks the foreground app package and places a pause overlay over selected apps when enabled. Chewy, Settings, System UI, and the launcher are excluded.
- A locally saved focus timer. Linking the timer to blocking is future work.

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
5. Turn on **Blocking**. Open the selected app; Chewy should show its pause screen. Use **Go to Home** or **Open Chewy** to leave it.
6. To stop, turn off Blocking in Chewy or disable the service in Android Settings.

The service does not request window-content access, read taps or text, or send app activity to a server. It only compares the foreground app package with the locally selected list. This is a local prototype, not a claim of Google Play policy approval. See `docs/ANDROID_BLOCKING.md` for details.

## Development notes

The native blocker bridge is `android/app/src/main/java/com/shreyansh/chewy/ChewyBlockerModule.kt`; the service is `ChewyBlockerService.kt`; the React Native wrapper is `src/native/blocker.ts`. This boundary allows replacing the current React Native legacy-module interface with a TurboModule later without moving the blocking logic into JavaScript. The iOS project can later receive a Swift module, but React Native does not remove Apple's Family Controls entitlement requirements for iOS app blocking.

The current Home and Stats usage figures are samples. There is no UsageStatsManager permission, widget, streak persistence, billing, or focus-linked blocking yet.
