# Android app-boundary design

Chewy's Android service is an opt-in local prototype. Android starts the `AccessibilityService` only after the user enables **Chewy app boundaries** in system settings. The service listens to window changes and reads the foreground package name. It does not request window content. A selected app shows an accessibility overlay while all-day blocking, a Focus session, a recurring schedule, or a daily allowance rule is active. The user can go Home, open Chewy, or use a configurable temporary access window; that option can also be turned off.

The Block screen states what data the service uses before opening system settings. Selections and rules use Android SharedPreferences. Schedules support selected weekdays and overnight spans. The service excludes Chewy itself, system settings, System UI, and the launcher. Pause timestamps stay on the device. Separately, with Android Usage Access, Chewy queries foreground usage events for the daily allowance, Home, and Progress. Home's app time and selected-app time use the same midnight-to-now event window; the app-time figure covers launchable apps rather than every system activity. Selected-app measurements follow the recorded selection history, so changing the list does not rewrite earlier tracked days. Usage before tracking began cannot be reconstructed and appears as untracked in Progress. No history is sent to a server.

This should be tested across Android versions and OEMs. Accessibility events and overlays can behave differently, and a user can disable the service at any time. Before distribution on Google Play, review the current Accessibility API policy, declaration, prominent disclosure, and consent requirements. If Chewy's use case is not accepted, a less intrusive self-guided pause is the fallback.

Official references:

- [Android accessibility service setup](https://developer.android.com/guide/topics/ui/accessibility/service)
- [AccessibilityService API](https://developer.android.com/reference/android/accessibilityservice/AccessibilityService)
- [Google Play Accessibility API policy](https://support.google.com/googleplay/android-developer/answer/10964491)
