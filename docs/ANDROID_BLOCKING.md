# Android app-boundary design

Chewy's Android service is an opt-in local prototype. Android starts the `AccessibilityService` only after the user enables **Chewy app boundaries** in system settings. The service listens to window changes and reads the foreground package name. It does not request window content. When the user has enabled blocking and the package is in the saved selection, it shows an accessibility overlay with a way to go Home or open Chewy.

The Block screen states what data the service uses before opening system settings. The selection and enable switch use Android SharedPreferences. The service excludes Chewy itself, system settings, System UI, and the launcher. No device usage history is collected.

This should be tested across Android versions and OEMs. Accessibility events and overlays can behave differently, and a user can disable the service at any time. Before distribution on Google Play, review the current Accessibility API policy, declaration, prominent disclosure, and consent requirements. If Chewy's use case is not accepted, a less intrusive self-guided pause is the fallback.

Official references:

- [Android accessibility service setup](https://developer.android.com/guide/topics/ui/accessibility/service)
- [AccessibilityService API](https://developer.android.com/reference/android/accessibilityservice/AccessibilityService)
- [Google Play Accessibility API policy](https://support.google.com/googleplay/android-developer/answer/10964491)
