import AsyncStorage from '@react-native-async-storage/async-storage';

export const FOCUS_DURATION_KEY = 'chewy.focusDuration';
export const SHORT_BREAK_KEY = 'chewy.breakDuration';
export const LONG_BREAK_KEY = 'chewy.longBreakDuration';
export const SESSIONS_KEY = 'chewy.sessionsBeforeLongBreak';

export const timerOptions = {
  focus: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
  shortBreak: [5, 10, 15, 20],
  longBreak: [15, 20, 25, 30, 35, 40, 45],
  sessions: [2, 3, 4, 5, 6],
} as const;

export type TimerSetting = keyof typeof timerOptions;
export type TimerSettings = Record<TimerSetting, number>;

export const timerKeys: Record<TimerSetting, string> = {
  focus: FOCUS_DURATION_KEY,
  shortBreak: SHORT_BREAK_KEY,
  longBreak: LONG_BREAK_KEY,
  sessions: SESSIONS_KEY,
};

export const defaultTimerSettings: TimerSettings = {
  focus: 25,
  shortBreak: 10,
  longBreak: 30,
  sessions: 4,
};

export async function loadTimerSettings(): Promise<TimerSettings> {
  const keys = Object.values(timerKeys);
  const values = await Promise.all(keys.map(key => AsyncStorage.getItem(key)));
  const saved = new Map(keys.map((key, index) => [key, values[index]]));
  const settings = {...defaultTimerSettings};
  (Object.keys(timerKeys) as TimerSetting[]).forEach(kind => {
    const value = Number(saved.get(timerKeys[kind]));
    if ((timerOptions[kind] as readonly number[]).includes(value)) settings[kind] = value;
  });
  return settings;
}
