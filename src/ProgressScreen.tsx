import React, {useCallback, useEffect, useState} from 'react';
import {AppState, ScrollView, StyleSheet, View} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import {Text} from './AppText';
import {ChewyCharacter} from './ChewyCharacter';
import {blocker} from './native/blocker';
import type {DailyUsage} from './native/blocker';
import {DEFAULT_DAILY_GOAL, loadDailyGoal} from './dailyGoal';
import {weeklyComparison} from './blockRules';
import {trackingState} from './usagePresentation';
import {collectExpiredFocusSession, getFocusRecords, getFocusStreak} from './progress';
import type {FocusRecord} from './progress';
import {cartoon, colors, themePalettes, type ThemeMode} from './theme';

function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function StreakArt() {
  return <View style={styles.art}>
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 330 160" pointerEvents="none">
      <Path d="M165 4 181 64 222 16 207 77 278 44 226 91 320 83 230 112 294 150 205 127 165 158 125 127 36 150 100 112 10 83 104 91 52 44 123 77 108 16 149 64Z" fill="#fff3c3" />
      <Circle cx="38" cy="41" r="7" fill={cartoon.peach} /><Circle cx="290" cy="28" r="8" fill={cartoon.mint} />
      <Path d="m285 95 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#f58f55" />
    </Svg>
    <ChewyCharacter size={165} expression="happy" />
  </View>;
}

function CompletedDayIcon() {
  return <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" pointerEvents="none">
    <Path d="M4.5 12.5 9.5 17 19.5 6.5" stroke="white" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

export function ProgressScreen({theme = 'day'}: {theme?: ThemeMode}) {
  const [records, setRecords] = useState<FocusRecord[]>([]);
  const [pauseEvents, setPauseEvents] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageDays, setUsageDays] = useState<DailyUsage[]>([]);
  const [usagePermission, setUsagePermission] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [trackingStartedAt, setTrackingStartedAt] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_DAILY_GOAL);

  const refresh = useCallback(async () => {
    try {
      await collectExpiredFocusSession();
      const [nextRecords, nextPauses] = await Promise.all([
        getFocusRecords(),
        blocker?.getPauseEvents ? blocker.getPauseEvents().catch(() => []) : Promise.resolve([]),
      ]);
      setRecords(nextRecords);
      setPauseEvents(nextPauses);
    } catch { setPauseEvents([]); }
    try {
      const [weekly, status, goal] = await Promise.all([
        blocker?.getWeeklySelectedUsage?.(), blocker?.getStatus?.(), loadDailyGoal(),
      ]);
      setUsageDays(weekly?.days ?? []);
      setUsagePermission(weekly?.permissionGranted ?? false);
      setTrackingStartedAt(weekly?.trackingStartedAt ?? 0);
      setSelectedCount(status?.blockedPackages.length ?? 0);
      setDailyGoal(goal);
    } catch { setUsageDays([]); setUsagePermission(false); setTrackingStartedAt(0); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 300000);
    const subscription = AppState.addEventListener('change', state => {if (state === 'active') refresh();});
    return () => {clearInterval(timer); subscription.remove();};
  }, [refresh]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() + 6) % 7);
  const week = Array.from({length: 7}, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return {key: dayKey(day.getTime()), label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index], isToday: day.getTime() === today.getTime()};
  });
  const completedDays = new Set(records.map(record => dayKey(record.completedAt)));
  const streak = getFocusStreak(records);
  const minutesByDay = week.map(day => records.filter(record => dayKey(record.completedAt) === day.key).reduce((sum, record) => sum + record.minutes, 0));
  const minutesThisWeek = minutesByDay.reduce((sum, minutes) => sum + minutes, 0);
  const sessionsThisWeek = records.filter(record => record.completedAt >= monday.getTime() && record.completedAt <= Date.now()).length;
  const pausesThisWeek = pauseEvents.filter(timestamp => timestamp >= monday.getTime() && timestamp <= Date.now()).length;
  const maxMinutes = Math.max(25, ...minutesByDay);
  const milestone = Math.min(streak, 7);
  const chartDays = usageDays.slice(-7);
  const measuredAt = Date.now();
  const maxSelectedMinutes = Math.max(dailyGoal, ...chartDays.map(day => day.selectedTimeMs / 60000));
  const comparison = weeklyComparison(usageDays);
  const baselineDays = usageDays.slice(-15, -1).filter(day => day.completeTracking).length;
  const hasTrackedApps = trackingStartedAt > 0 || selectedCount > 0;

  return <ScrollView style={[styles.screen, {backgroundColor: themePalettes[theme].progress}]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>YOUR PROGRESS</Text>
    <Text style={styles.heading}>Small wins add up</Text>

    <View style={styles.streakCard}>
      <StreakArt />
      <Text style={styles.streakNumber}>{streak}</Text>
      <Text style={styles.streakLabel}>{streak === 1 ? 'Day streak' : 'Days streak'}</Text>
      <Text style={styles.streakSubtext}>{streak > 0 ? 'Every focused day counts.' : 'Complete a focus session to begin.'}</Text>
      <View style={styles.weekRow}>{week.map(day => <View key={day.key} style={styles.weekDay}><View style={[styles.dayCircle, completedDays.has(day.key) && styles.dayComplete, day.isToday && styles.dayToday]}>{day.isToday ? <Text style={styles.fireDay}>🔥</Text> : completedDays.has(day.key) ? <CompletedDayIcon /> : <Text style={styles.dayLetter}>{day.label}</Text>}</View></View>)}</View>
      <View style={styles.encouragement}><Text style={styles.encouragementIcon}>✦</Text><View style={styles.encouragementCopy}><Text style={styles.encouragementTitle}>{streak > 0 ? 'Keep it going!' : 'Your first win is waiting'}</Text><Text style={styles.encouragementBody}>{streak > 0 ? 'A little focus today can keep your streak growing.' : 'Start a Focus timer and make space for one thing.'}</Text></View></View>
    </View>

    <Text style={styles.sectionTitle}>Challenges and rewards</Text>
    <View style={styles.milestoneCard}><View style={styles.milestoneHeader}><View><Text style={styles.milestoneTitle}>7 day milestone</Text><Text style={styles.milestoneSubtitle}>Complete one focus session each day</Text></View><Text style={styles.milestoneCount}>{milestone}/7</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, {width: `${milestone / 7 * 100}%`}]} /></View></View>

    <Text style={styles.sectionTitle}>Last 7 days</Text>
    <View style={styles.weeklyCard}>
      <View style={styles.weeklyHeading}><Text style={styles.weeklyTitle}>Selected app time</Text><Text style={styles.weeklyValue}>{usagePermission && hasTrackedApps && chartDays.length ? `${Math.round(chartDays[chartDays.length - 1].selectedTimeMs / 60000)} min today` : '—'}</Text></View>
      {usagePermission && hasTrackedApps && chartDays.length > 0 ? <>
        <Text style={styles.chartNote}>Daily goal: {dailyGoal} min · orange bars are above your goal</Text>
        <View style={styles.chart}>{chartDays.map((day, index) => {
          const nextStart = chartDays[index + 1]?.dayStart ?? measuredAt + 1;
          const state = trackingState(day.dayStart, nextStart, trackingStartedAt, measuredAt);
          return <View key={day.dayStart} style={styles.chartColumn}><View style={styles.chartTrack}>{state === 'untracked' ? <Text style={styles.untrackedMark}>—</Text> : <View style={[styles.chartBar, {height: `${Math.max(4, day.selectedTimeMs / 60000 / maxSelectedMinutes * 100)}%`}, day.selectedTimeMs <= dailyGoal * 60000 ? styles.underGoalBar : styles.overGoalBar]} />}</View><Text style={[styles.chartLabel, state === 'untracked' && styles.untrackedLabel]}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(day.dayStart).getDay()]}</Text></View>;
        })}</View>
        <Text style={styles.chartNote}>— means tracking had not started. The first tracked day and today may be partial; Android totals can lag.</Text>
      </> : <Text style={styles.chartNote}>{!blocker ? 'Selected app usage is available on Android.' : !usagePermission ? 'Allow Usage Access on Home to see this trend.' : 'Choose apps in Block to track this goal.'}</Text>}
    </View>
    {usagePermission && hasTrackedApps && <View style={styles.weeklyCard}><View style={styles.weeklyHeading}><Text style={styles.weeklyTitle}>Week over week</Text><Text style={styles.weeklyValue}>{comparison ? comparison.changePercent === null ? 'New baseline' : `${comparison.changePercent > 0 ? '+' : ''}${comparison.changePercent}%` : `${baselineDays}/14 days`}</Text></View><Text style={styles.chartNote}>{comparison ? `Last 7 complete days: ${comparison.latestMinutes} min · previous 7: ${comparison.previousMinutes} min` : 'Tracking two complete weeks before comparing your selected app time.'}</Text></View>}
    <Text style={styles.sectionTitle}>This week</Text>
    <View style={styles.weeklyCard}><View style={styles.weeklyHeading}><Text style={styles.weeklyTitle}>Focus time</Text><Text style={styles.weeklyValue}>{minutesThisWeek} min</Text></View><View style={styles.chart}>{week.map((day, index) => {
      const barStyle = {height: minutesByDay[index] ? `${Math.max(10, minutesByDay[index] / maxMinutes * 100)}%` as const : '4%' as const, backgroundColor: minutesByDay[index] ? colors.green : '#d8e9e1'};
      return <View key={day.key} style={styles.chartColumn}><View style={styles.chartTrack}><View style={[styles.chartBar, barStyle]} /></View><Text style={styles.chartLabel}>{day.label}</Text></View>;
    })}</View><Text style={styles.chartNote}>{minutesThisWeek ? 'Minutes from completed Focus sessions' : 'Your completed sessions will appear here.'}</Text></View>

    <View style={styles.metricRow}><View style={[styles.metricCard, styles.mintCard]}><Text style={styles.metricValue}>{sessionsThisWeek}</Text><Text style={styles.metricLabel}>Focus sessions</Text></View><View style={[styles.metricCard, styles.peachCard]}><Text style={styles.metricValue}>{pausesThisWeek}</Text><Text style={styles.metricLabel}>App pauses</Text></View></View>
    <Text style={styles.footer}>{loading ? 'Loading your progress…' : 'Your progress is saved on this device.'}</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.progressBackground}, content: {paddingHorizontal: 20, paddingTop: 22, paddingBottom: 36, gap: 14},
  eyebrow: {fontSize: 12, fontWeight: '800', letterSpacing: 2.2, color: colors.green}, heading: {fontSize: 30, lineHeight: 35, fontWeight: '800', color: colors.ink, marginBottom: 6},
  streakCard: {alignItems: 'center', paddingBottom: 6}, art: {width: '100%', height: 160, alignItems: 'center', justifyContent: 'flex-end'}, streakNumber: {fontSize: 70, lineHeight: 74, fontWeight: '900', color: colors.ink, marginTop: -3}, streakLabel: {fontSize: 19, fontWeight: '900', color: colors.ink}, streakSubtext: {fontSize: 12, color: '#896d52', marginTop: 4},
  weekRow: {width: '100%', flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 14, marginTop: 20}, weekDay: {alignItems: 'center'}, dayCircle: {width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: '#d98f4d', backgroundColor: '#ffd39f', alignItems: 'center', justifyContent: 'center'}, dayComplete: {backgroundColor: colors.green, borderColor: colors.green}, dayToday: {borderWidth: 2, borderColor: '#f28b32', backgroundColor: '#fff1d7'}, dayLetter: {fontSize: 14, fontWeight: '800', color: colors.ink}, fireDay: {fontSize: 20},
  encouragement: {width: '92%', minHeight: 78, borderRadius: 21, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, backgroundColor: cartoon.sunshine, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 14, marginTop: 20}, encouragementIcon: {fontSize: 31, color: colors.green}, encouragementCopy: {flex: 1}, encouragementTitle: {fontSize: 15, fontWeight: '900', color: colors.ink}, encouragementBody: {fontSize: 12, lineHeight: 17, color: colors.ink, marginTop: 3},
  sectionTitle: {fontSize: 19, fontWeight: '900', color: colors.ink, marginTop: 12}, milestoneCard: {borderRadius: 23, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, padding: 18, backgroundColor: colors.surface, gap: 18}, milestoneHeader: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10}, milestoneTitle: {fontSize: 15, fontWeight: '800', color: colors.ink}, milestoneSubtitle: {fontSize: 11, color: colors.muted, marginTop: 4}, milestoneCount: {fontSize: 15, fontWeight: '900', color: colors.green, backgroundColor: cartoon.sunshine, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden'}, progressTrack: {height: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.green, backgroundColor: '#f5e2c8', overflow: 'hidden'}, progressFill: {height: '100%', borderRadius: 6, backgroundColor: colors.green},
  weeklyCard: {borderRadius: 24, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, padding: 18, backgroundColor: colors.surface}, weeklyHeading: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, weeklyTitle: {fontSize: 15, fontWeight: '800', color: colors.ink}, weeklyValue: {fontSize: 16, fontWeight: '800', color: colors.green}, chart: {height: 110, flexDirection: 'row', gap: 8, marginTop: 18}, chartColumn: {flex: 1, alignItems: 'center'}, chartTrack: {height: 88, width: '100%', justifyContent: 'flex-end', alignItems: 'center'}, chartBar: {width: '70%', borderRadius: 7, minHeight: 3}, chartLabel: {fontSize: 11, fontWeight: '700', color: colors.muted, marginTop: 8}, chartNote: {fontSize: 11, color: colors.muted, marginTop: 10},
  underGoalBar: {backgroundColor: colors.green}, overGoalBar: {backgroundColor: '#f28b32'}, untrackedMark: {fontSize: 18, color: '#aab9b3'}, untrackedLabel: {color: '#aab9b3'},
  metricRow: {flexDirection: 'row', gap: 12}, metricCard: {flex: 1, minHeight: 112, borderRadius: 22, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.green, padding: 16, justifyContent: 'space-between'}, mintCard: {backgroundColor: cartoon.mint}, peachCard: {backgroundColor: cartoon.peach}, metricValue: {fontSize: 28, fontWeight: '900', color: colors.ink}, metricLabel: {fontSize: 12, fontWeight: '800', color: colors.ink}, footer: {fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 5},
});
