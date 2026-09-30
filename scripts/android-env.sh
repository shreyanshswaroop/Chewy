#!/usr/bin/env bash
# Source this file before Android CLI commands on this Mac.
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
if [ -d '/Applications/Android Studio.app/Contents/jbr/Contents/Home' ]; then
  export JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home'
fi
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
