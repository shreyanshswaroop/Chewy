#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/android-env.sh"
cd "$(dirname "$0")/.."
./android/gradlew -p android :app:assembleRelease
"$ANDROID_HOME/platform-tools/adb" install -r android/app/build/outputs/apk/release/app-release.apk
"$ANDROID_HOME/platform-tools/adb" shell am start -n com.shreyansh.chewy/.MainActivity
