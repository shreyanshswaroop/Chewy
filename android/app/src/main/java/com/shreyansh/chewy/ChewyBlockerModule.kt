package com.shreyansh.chewy

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.os.Process
import android.provider.Settings
import android.text.TextUtils
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import java.io.ByteArrayOutputStream
import java.util.Calendar
import org.json.JSONArray

class ChewyBlockerModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  override fun getName() = "ChewyBlocker"

  @ReactMethod
  fun getLaunchableApps(promise: Promise) {
    try {
      val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val packageManager = context.packageManager
      val apps = packageManager.queryIntentActivities(launcher, 0)
        .distinctBy { it.activityInfo.packageName }
        .filter { !ChewyBlockerService.isProtectedPackage(context, it.activityInfo.packageName) }
        .sortedBy { it.loadLabel(packageManager).toString().lowercase() }

      val result = Arguments.createArray()
      apps.forEach { info ->
        val item = Arguments.createMap()
        item.putString("packageName", info.activityInfo.packageName)
        item.putString("label", info.loadLabel(packageManager).toString())
        item.putString("icon", try { iconDataUri(info.loadIcon(packageManager)) } catch (_: Exception) { null })
        result.pushMap(item)
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("APP_LIST_FAILED", error)
    }
  }

  private fun iconDataUri(drawable: Drawable): String {
    val size = 96
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    drawable.setBounds(0, 0, size, size)
    drawable.draw(Canvas(bitmap))
    val bytes = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes)
    bitmap.recycle()
    return "data:image/png;base64," + Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP)
  }

  @ReactMethod
  fun getStatus(promise: Promise) {
    val prefs = context.getSharedPreferences(ChewyBlockerService.PREFS, 0)
    val result = Arguments.createMap()
    val serviceEnabled = isAccessibilityEnabled()
    val blockingEnabled = prefs.getBoolean(ChewyBlockerService.ENABLED, false)
    if (!serviceEnabled && blockingEnabled) {
      prefs.edit().putBoolean(ChewyBlockerService.ENABLED, false).apply()
    }
    result.putBoolean("accessibilityEnabled", serviceEnabled)
    result.putBoolean("blockingEnabled", serviceEnabled && blockingEnabled)
    val packages = Arguments.createArray()
    prefs.getStringSet(ChewyBlockerService.BLOCKED_PACKAGES, emptySet())
      ?.sorted()?.forEach { packages.pushString(it) }
    result.putArray("blockedPackages", packages)
    promise.resolve(result)
  }

  @ReactMethod
  fun getTodayUsage(promise: Promise) {
    try {
      val result = Arguments.createMap()
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val permitted = appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName
      ) == AppOpsManager.MODE_ALLOWED
      result.putBoolean("permissionGranted", permitted)
      result.putDouble("totalTimeMs", 0.0)
      val topApps = Arguments.createArray()
      if (!permitted) {
        result.putArray("topApps", topApps)
        promise.resolve(result)
        return
      }

      val packageManager = context.packageManager
      val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val launchable = packageManager.queryIntentActivities(launcher, 0)
        .associateBy { it.activityInfo.packageName }
      val start = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }.timeInMillis
      val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val usage = manager.queryAndAggregateUsageStats(start, System.currentTimeMillis())
        .mapNotNull { (packageName, stats) ->
          val app = launchable[packageName] ?: return@mapNotNull null
          if (ChewyBlockerService.isProtectedPackage(context, packageName) || stats.totalTimeInForeground <= 0L) {
            return@mapNotNull null
          }
          app to stats.totalTimeInForeground
        }
        .sortedByDescending { it.second }
      result.putDouble("totalTimeMs", usage.sumOf { it.second }.toDouble())
      usage.take(3).forEach { (app, timeMs) ->
        val item = Arguments.createMap()
        item.putString("packageName", app.activityInfo.packageName)
        item.putString("label", app.loadLabel(packageManager).toString())
        item.putString("icon", try { iconDataUri(app.loadIcon(packageManager)) } catch (_: Exception) { null })
        item.putDouble("timeMs", timeMs.toDouble())
        topApps.pushMap(item)
      }
      result.putArray("topApps", topApps)
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("USAGE_STATS_FAILED", error)
    }
  }

  @ReactMethod
  fun openUsageAccessSettings(promise: Promise) {
    try {
      context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("OPEN_USAGE_SETTINGS_FAILED", error)
    }
  }

  @ReactMethod
  fun getPauseEvents(promise: Promise) {
    try {
      val stored = context.getSharedPreferences(ChewyBlockerService.PREFS, 0)
        .getString(ChewyBlockerService.PAUSE_EVENTS, "[]")
      val events = JSONArray(stored)
      val result = Arguments.createArray()
      for (index in 0 until events.length()) result.pushDouble(events.optLong(index).toDouble())
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("PAUSE_HISTORY_FAILED", error)
    }
  }

  @ReactMethod
  fun clearPauseEvents(promise: Promise) {
    context.getSharedPreferences(ChewyBlockerService.PREFS, 0)
      .edit().remove(ChewyBlockerService.PAUSE_EVENTS).apply()
    promise.resolve(null)
  }

  @ReactMethod
  fun saveBlockedPackages(packages: ReadableArray, promise: Promise) {
    try {
      val selected = mutableSetOf<String>()
      for (index in 0 until packages.size()) {
        val packageName = packages.getString(index) ?: continue
        if (!ChewyBlockerService.isProtectedPackage(context, packageName)) {
          selected.add(packageName)
        }
      }
      context.getSharedPreferences(ChewyBlockerService.PREFS, 0)
        .edit().putStringSet(ChewyBlockerService.BLOCKED_PACKAGES, selected).apply()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("SAVE_BLOCKED_APPS_FAILED", error)
    }
  }

  @ReactMethod
  fun setBlockingEnabled(enabled: Boolean, promise: Promise) {
    context.getSharedPreferences(ChewyBlockerService.PREFS, 0)
      .edit().putBoolean(ChewyBlockerService.ENABLED, enabled).apply()
    promise.resolve(null)
  }

  @ReactMethod
  fun openAccessibilitySettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("OPEN_SETTINGS_FAILED", error)
    }
  }

  private fun isAccessibilityEnabled(): Boolean {
    val enabled = try {
      Settings.Secure.getInt(context.contentResolver, Settings.Secure.ACCESSIBILITY_ENABLED) == 1
    } catch (_: Settings.SettingNotFoundException) {
      false
    }
    if (!enabled) return false
    val expected = "${context.packageName}/${ChewyBlockerService::class.java.name}"
    val services = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    ) ?: return false
    return services.split(':').any { TextUtils.equals(it, expected) }
  }
}
