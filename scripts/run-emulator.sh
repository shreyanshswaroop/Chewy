#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/android-env.sh"
exec "$ANDROID_HOME/emulator/emulator" -avd "${1:-Pixel_10_Pro}"
