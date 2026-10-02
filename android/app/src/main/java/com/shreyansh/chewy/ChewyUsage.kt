package com.shreyansh.chewy

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.app.usage.UsageEvents
import android.content.Context
import android.os.Process
import java.util.Calendar
import org.json.JSONArray
import org.json.JSONObject

/** Records selection changes so earlier days retain the apps that were selected at the time. */
object ChewyUsage {
  const val HISTORY_KEY = "selection_history"
  data class Selection(val at: Long, val packages: Set<String>)
  data class Summary(val selectedByDay: LongArray, val packageTime: Map<String, Long>)

  fun permitted(context: Context): Boolean {
    val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    return ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName) == AppOpsManager.MODE_ALLOWED
  }

  private fun history(context: Context): MutableList<Selection> {
    val prefs = context.getSharedPreferences(ChewyBlockerService.PREFS, Context.MODE_PRIVATE)
    val raw = prefs.getString(HISTORY_KEY, "[]") ?: "[]"
    val entries = try {
      val array = JSONArray(raw)
      (0 until array.length()).map { index ->
        val item = array.getJSONObject(index)
        val names = item.getJSONArray("packages")
        Selection(item.getLong("at"), (0 until names.length()).map { names.getString(it) }.toSet())
      }.sortedBy { it.at }.toMutableList()
    } catch (_: Exception) { mutableListOf() }
    if (entries.isEmpty()) {
      val selected = prefs.getStringSet(ChewyBlockerService.BLOCKED_PACKAGES, emptySet()).orEmpty()
      if (selected.isNotEmpty()) {
        entries.add(Selection(System.currentTimeMillis(), selected.toSet()))
        save(context, entries)
      }
    }
    return entries
  }

  fun startedAt(context: Context): Long = history(context).firstOrNull()?.at ?: 0L

  fun recordSelection(context: Context, selected: Set<String>) {
    val entries = history(context)
    if (entries.lastOrNull()?.packages == selected || entries.isEmpty() && selected.isEmpty()) return
    entries.add(Selection(System.currentTimeMillis(), selected.toSet()))
    save(context, entries)
  }

  private fun save(context: Context, entries: List<Selection>) {
    val array = JSONArray()
    entries.forEach { entry -> array.put(JSONObject().apply {
      put("at", entry.at)
      put("packages", JSONArray(entry.packages.sorted()))
    }) }
    context.getSharedPreferences(ChewyBlockerService.PREFS, Context.MODE_PRIVATE)
      .edit().putString(HISTORY_KEY, array.toString()).apply()
  }

  fun dayStart(now: Long = System.currentTimeMillis()): Long = Calendar.getInstance().apply {
    timeInMillis = now
    set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0)
    set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
  }.timeInMillis

  fun selectedTime(context: Context, start: Long, end: Long): Long =
    usageSummary(context, listOf(start), end).selectedByDay.firstOrNull() ?: 0L

  /** One UsageEvents scan apportions foreground intervals across selection changes and day boundaries. */
  fun selectedTimeByDay(context: Context, dayStarts: List<Long>, end: Long): LongArray =
    usageSummary(context, dayStarts, end).selectedByDay

  fun usageSummary(context: Context, dayStarts: List<Long>, end: Long): Summary {
    val totals = LongArray(dayStarts.size)
    val packageTime = mutableMapOf<String, Long>()
    val result = Summary(totals, packageTime)
    if (dayStarts.isEmpty() || end <= dayStarts.first() || !permitted(context)) return result
    require(dayStarts.zipWithNext().all { (earlier, later) -> earlier < later })
    val entries = history(context)
    val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val events = manager.queryEvents(maxOf(0L, dayStarts.first() - 24 * 60 * 60 * 1000L), end) ?: return result
    var foreground: String? = null
    var foregroundSince = dayStarts.first()
    fun close(at: Long) {
      val name = foreground ?: return
      val visibleFrom = maxOf(dayStarts.first(), foregroundSince)
      val visibleTo = minOf(end, at)
      if (visibleTo > visibleFrom) {
        packageTime[name] = (packageTime[name] ?: 0L) + visibleTo - visibleFrom
      }
      for (index in entries.indices) {
        val entry = entries[index]
        if (name !in entry.packages) continue
        val from = maxOf(dayStarts.first(), foregroundSince, entry.at)
        val to = minOf(end, at, entries.getOrNull(index + 1)?.at ?: end)
        if (to <= from) continue
        for (day in dayStarts.indices) {
          val overlapStart = maxOf(from, dayStarts[day])
          val overlapEnd = minOf(to, dayStarts.getOrNull(day + 1) ?: end)
          if (overlapEnd > overlapStart) totals[day] += overlapEnd - overlapStart
        }
      }
    }
    val event = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val at = event.timeStamp
      when (event.eventType) {
        UsageEvents.Event.ACTIVITY_RESUMED -> {
          close(at)
          foreground = event.packageName
          foregroundSince = at
        }
        UsageEvents.Event.ACTIVITY_PAUSED -> if (foreground == event.packageName) {
          close(at)
          foreground = null
        }
        UsageEvents.Event.SCREEN_NON_INTERACTIVE, UsageEvents.Event.DEVICE_SHUTDOWN -> {
          close(at)
          foreground = null
        }
      }
    }
    close(end)
    return result
  }
}
