import AsyncStorage from '@react-native-async-storage/async-storage';
import {defaultTimerSettings, SESSIONS_KEY, timerOptions} from './focusSettings';

const RECORDS_KEY = 'chewy.completedFocusSessions';
const END_KEY = 'chewy.focusEndsAt';
const DURATION_KEY = 'chewy.focusDuration';
const ACTIVE_DURATION_KEY = 'chewy.activeFocusDuration';
const MODE_KEY = 'chewy.focusMode';
const PAUSED_KEY = 'chewy.focusPausedSeconds';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export type FocusRecord = {id: string; completedAt: number; minutes: number};

export function getFocusStreak(records: FocusRecord[], now = Date.now()): number {
  const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const completedDays = new Set(records.map(record => dayKey(new Date(record.completedAt))));
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  if (!completedDays.has(dayKey(day))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (completedDays.has(dayKey(day))) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

export async function getFocusRecords(): Promise<FocusRecord[]> {
  const stored = await AsyncStorage.getItem(RECORDS_KEY);
  if (!stored) return [];
  try {
    const value: unknown = JSON.parse(stored);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is FocusRecord =>
      typeof item?.id === 'string' &&
      Number.isFinite(item?.completedAt) &&
      Number.isFinite(item?.minutes) && item.minutes > 0,
    );
  } catch { return []; }
}

export async function recordCompletedFocusSession(endedAt: number, minutes: number): Promise<void> {
  if (!Number.isFinite(endedAt) || !Number.isFinite(minutes) || minutes <= 0) return;
  const records = await getFocusRecords();
  const id = String(endedAt);
  if (records.some(record => record.id === id)) return;
  const next = [...records, {id, completedAt: endedAt, minutes}].slice(-500);
  await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(next));
}

export async function clearFocusRecords(): Promise<void> {
  await AsyncStorage.removeItem(RECORDS_KEY);
}

export async function collectExpiredFocusSession(): Promise<TimerMode | null> {
  const [endValue, durationValue, activeDurationValue, mode, sessionsValue] = await Promise.all([
    AsyncStorage.getItem(END_KEY),
    AsyncStorage.getItem(DURATION_KEY),
    AsyncStorage.getItem(ACTIVE_DURATION_KEY),
    AsyncStorage.getItem(MODE_KEY),
    AsyncStorage.getItem(SESSIONS_KEY),
  ]);
  const end = Number(endValue);
  const minutes = Number(activeDurationValue || durationValue);
  if (!endValue || !Number.isFinite(end) || end > Date.now()) return null;
  let nextMode: TimerMode = 'focus';
  if (mode === 'focus' && Number.isFinite(minutes) && minutes > 0) {
    await recordCompletedFocusSession(end, minutes);
    const completed = (await getFocusRecords()).length;
    const selectedSessions = Number(sessionsValue);
    const sessions = (timerOptions.sessions as readonly number[]).includes(selectedSessions)
      ? selectedSessions : defaultTimerSettings.sessions;
    nextMode = completed % sessions === 0 ? 'longBreak' : 'shortBreak';
  }
  await Promise.all([END_KEY, ACTIVE_DURATION_KEY, PAUSED_KEY].map(key => AsyncStorage.removeItem(key)));
  await AsyncStorage.setItem(MODE_KEY, nextMode);
  return nextMode;
}
