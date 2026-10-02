package com.shreyansh.chewy

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONArray

/** The only signal read is the foreground app package. No window content is requested. */
class ChewyBlockerService : AccessibilityService() {
  private val main = Handler(Looper.getMainLooper())
  private var shield: View? = null
  private var shieldedPackage: String? = null
  private var foregroundPackage: String? = null
  private var scheduledFocusUntil = 0L
  private var focusExpiryCheck: Runnable? = null
  private var heartbeat: Runnable? = null
  private val windows by lazy { getSystemService(WINDOW_SERVICE) as WindowManager }
  private val appTypeface by lazy { Typeface.createFromAsset(assets, "fonts/PlusJakartaSans.ttf") }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val packageName = event?.packageName?.toString() ?: return
    if (packageName == this.packageName && shield != null && event.className?.toString() != MainActivity::class.java.name) return
    foregroundPackage = packageName
    evaluate(packageName)
  }

  private fun evaluate(packageName: String) {
    heartbeat?.let { main.removeCallbacks(it) }
    heartbeat = null
    if (isProtectedPackage(this, packageName)) {
      removeShield()
      return
    }

    val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
    val selected = prefs.getStringSet(BLOCKED_PACKAGES, emptySet()).orEmpty()
    if (packageName in selected) {
      val check = Runnable { if (foregroundPackage == packageName) evaluate(packageName) }
      heartbeat = check
      main.postDelayed(check, 30_000L)
    }
    val now = System.currentTimeMillis()
    val focusUntil = prefs.getLong(FOCUS_BLOCK_UNTIL, 0L)
    val bypassUntil = prefs.getLong(BYPASS_UNTIL, 0L)
    val bypassed = packageName == prefs.getString(BYPASS_PACKAGE, null) && bypassUntil > now
    val allDay = prefs.getBoolean(ENABLED, false)
    val rules = ChewyRules.load(this)
    val scheduled = rules.activeSchedule()
    val allowanceReached = !allDay && focusUntil <= now && !scheduled &&
      rules.dailyAllowanceMinutes > 0 && ChewyUsage.permitted(this) &&
      ChewyUsage.selectedTime(this, ChewyUsage.dayStart(now), now) >= rules.dailyAllowanceMinutes * 60000L
    if ((allDay || focusUntil > now || scheduled || allowanceReached) && packageName in selected && !bypassed) {
      showShield(packageName)
      if (focusUntil > now && !allDay && scheduledFocusUntil != focusUntil) {
        focusExpiryCheck?.let { main.removeCallbacks(it) }
        val check = Runnable { if (foregroundPackage == packageName) evaluate(packageName) }
        focusExpiryCheck = check
        scheduledFocusUntil = focusUntil
        main.postDelayed(check, focusUntil - now + 50)
      }
    } else {
      removeShield()
    }
  }

  override fun onInterrupt() {
    heartbeat?.let { main.removeCallbacks(it) }
    removeShield()
  }

  override fun onDestroy() {
    heartbeat?.let { main.removeCallbacks(it) }
    focusExpiryCheck?.let { main.removeCallbacks(it) }
    removeShield()
    super.onDestroy()
  }

  private fun showShield(target: String) {
    main.post {
      if (shieldedPackage == target && shield != null) return@post
      removeShieldNow()

      val surface = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        setPadding(dp(24), dp(44), dp(24), dp(44))
        setBackgroundColor(Color.rgb(255, 251, 234))
      }
      val card = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER_HORIZONTAL
        setPadding(dp(20), dp(26), dp(20), dp(18))
        background = GradientDrawable().apply {
          setColor(Color.rgb(255, 254, 244))
          cornerRadius = dp(28).toFloat()
          setStroke(dp(2), Color.rgb(0, 91, 82))
        }
        elevation = dp(5).toFloat()
      }
      surface.addView(card, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
      card.addView(label("✦  A CHEWY MOMENT  ✦", 12, Color.rgb(0, 91, 82), true))
      card.addView(label("🧠", 62, Color.rgb(28, 44, 51), true).apply {
        background = GradientDrawable().apply {
          setColor(Color.rgb(206, 243, 218))
          cornerRadius = dp(42).toFloat()
          setStroke(dp(2), Color.rgb(0, 91, 82))
        }
        layoutParams = LinearLayout.LayoutParams(dp(132), dp(132)).apply { topMargin = dp(18) }
      })
      card.addView(label("A little pause", 29, Color.rgb(28, 44, 51), true).apply {
        setPadding(0, dp(18), 0, dp(10))
      })
      card.addView(label("Your app boundary is active. What would you like to do next?", 16, Color.rgb(86, 105, 110), false).apply {
        setPadding(0, 0, 0, dp(24))
      })
      card.addView(action("Go to Home") {
        performGlobalAction(GLOBAL_ACTION_HOME)
        removeShield()
      })
      card.addView(action("Open Chewy", true) {
        removeShield()
        packageManager.getLaunchIntentForPackage(packageName)?.let {
          it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          startActivity(it)
        }
      })
      val accessMinutes = ChewyRules.load(this).accessWindowMinutes
      if (accessMinutes > 0) card.addView(action("Use for $accessMinutes minutes", true) {
        val until = System.currentTimeMillis() + accessMinutes * 60_000L
        getSharedPreferences(PREFS, MODE_PRIVATE).edit()
          .putString(BYPASS_PACKAGE, target).putLong(BYPASS_UNTIL, until).apply()
        removeShieldNow()
        main.postDelayed({ if (foregroundPackage == target) evaluate(target) }, until - System.currentTimeMillis() + 50)
      })

      val params = WindowManager.LayoutParams(
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
        android.graphics.PixelFormat.TRANSLUCENT
      )
      try {
        windows.addView(surface, params)
        shield = surface
        shieldedPackage = target
        recordPause()
      } catch (_: Exception) {
        shield = null
        shieldedPackage = null
      }
    }
  }

  private fun removeShield() = main.post { removeShieldNow() }

  private fun recordPause() {
    try {
      val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
      val previous = JSONArray(prefs.getString(PAUSE_EVENTS, "[]"))
      val recent = JSONArray()
      for (index in maxOf(0, previous.length() - 499) until previous.length()) {
        recent.put(previous.optLong(index))
      }
      recent.put(System.currentTimeMillis())
      prefs.edit().putString(PAUSE_EVENTS, recent.toString()).apply()
    } catch (_: Exception) { }
  }

  private fun removeShieldNow() {
    shield?.let { view ->
      try { windows.removeView(view) } catch (_: Exception) { }
    }
    shield = null
    shieldedPackage = null
  }

  private fun label(text: String, size: Int, color: Int, bold: Boolean) = TextView(this).apply {
    this.text = text
    textSize = size.toFloat()
    setTextColor(color)
    gravity = Gravity.CENTER
    typeface = if (bold) Typeface.create(appTypeface, Typeface.BOLD) else appTypeface
  }

  private fun action(title: String, secondary: Boolean = false, onTap: () -> Unit) = Button(this).apply {
    text = title
    isAllCaps = false
    textSize = 17f
    typeface = Typeface.create(appTypeface, Typeface.BOLD)
    setTextColor(Color.rgb(0, 91, 82))
    background = GradientDrawable().apply {
      setColor(if (secondary) Color.rgb(255, 251, 234) else Color.rgb(255, 240, 170))
      cornerRadius = dp(20).toFloat()
      setStroke(dp(2), Color.rgb(0, 91, 82))
    }
    setOnClickListener { onTap() }
    layoutParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      dp(58)
    ).apply { bottomMargin = dp(12) }
  }

  private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

  companion object {
    const val PREFS = "chewy_blocker"
    const val ENABLED = "enabled"
    const val BLOCKED_PACKAGES = "blocked_packages"
    const val PAUSE_EVENTS = "pause_events"
    const val FOCUS_BLOCK_UNTIL = "focus_block_until"
    const val BYPASS_PACKAGE = "bypass_package"
    const val BYPASS_UNTIL = "bypass_until"

    fun isProtectedPackage(context: Context, candidate: String): Boolean {
      if (candidate == context.packageName) return true
      if (candidate in setOf(
          "com.android.settings", "com.android.systemui",
          "com.android.permissioncontroller", "com.google.android.permissioncontroller",
          "com.android.launcher3", "com.google.android.apps.nexuslauncher"
        )) return true
      val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
      return context.packageManager.resolveActivity(home, 0)?.activityInfo?.packageName == candidate
    }
  }
}
