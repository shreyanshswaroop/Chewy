package com.shreyansh.chewy

import android.content.Context
import java.util.Calendar
import org.json.JSONArray
import org.json.JSONObject

data class ChewySchedule(val id: String, val title: String, val days: Set<Int>, val start: Int, val end: Int) {
  fun activeAt(time: Calendar): Boolean {
    val minute = time.get(Calendar.HOUR_OF_DAY) * 60 + time.get(Calendar.MINUTE)
    val today = time.get(Calendar.DAY_OF_WEEK) - 1
    if (start < end) return today in days && minute >= start && minute < end
    val yesterday = (today + 6) % 7
    return (today in days && minute >= start) || (yesterday in days && minute < end)
  }
}

data class ChewyRules(
  val schedules: List<ChewySchedule> = emptyList(),
  val dailyAllowanceMinutes: Int = 0,
  val accessWindowMinutes: Int = 5,
) {
  fun activeSchedule(now: Calendar = Calendar.getInstance()) = schedules.any { it.activeAt(now) }

  fun json(): String = JSONObject().apply {
    put("dailyAllowanceMinutes", dailyAllowanceMinutes)
    put("accessWindowMinutes", accessWindowMinutes)
    put("schedules", JSONArray().apply { schedules.forEach { rule ->
      put(JSONObject().apply {
        put("id", rule.id); put("title", rule.title)
        put("days", JSONArray(rule.days.sorted()))
        put("start", rule.start); put("end", rule.end)
      })
    } })
  }.toString()

  companion object {
    const val KEY = "rule_config"
    private val allowances = setOf(0, 15, 30, 45, 60, 90, 120, 180)
    private val windows = setOf(0, 5, 10, 15, 30)

    fun load(context: Context): ChewyRules {
      val raw = context.getSharedPreferences(ChewyBlockerService.PREFS, Context.MODE_PRIVATE)
        .getString(KEY, null) ?: return ChewyRules()
      return try { parse(raw) } catch (_: Exception) { ChewyRules() }
    }

    fun parse(raw: String): ChewyRules {
      val data = JSONObject(raw)
      val allowance = data.optInt("dailyAllowanceMinutes", 0)
      val window = data.optInt("accessWindowMinutes", 5)
      require(allowance in allowances && window in windows)
      val items = data.optJSONArray("schedules") ?: JSONArray()
      require(items.length() <= 5)
      val schedules = (0 until items.length()).map { index ->
        val item = items.getJSONObject(index)
        val daysJson = item.getJSONArray("days")
        val days = (0 until daysJson.length()).map { daysJson.getInt(it) }.toSet()
        val start = item.getInt("start")
        val end = item.getInt("end")
        val id = item.getString("id")
        val title = item.getString("title").trim()
        require(id.isNotBlank() && title.isNotBlank() && title.length <= 40)
        require(days.isNotEmpty() && days.all { it in 0..6 })
        require(start in 0..1439 && end in 0..1439 && start != end)
        ChewySchedule(id, title, days, start, end)
      }
      require(schedules.map { it.id }.toSet().size == schedules.size)
      return ChewyRules(schedules, allowance, window)
    }
  }
}
