import AsyncStorage from '@react-native-async-storage/async-storage';

const GOAL_KEY = 'chewy.dailyDistractingMinutesGoal';
export const DEFAULT_DAILY_GOAL = 60;
export const DAILY_GOAL_OPTIONS = [15, 30, 45, 60, 90, 120, 180] as const;

export async function loadDailyGoal(): Promise<number> {
  const saved = Number(await AsyncStorage.getItem(GOAL_KEY));
  return (DAILY_GOAL_OPTIONS as readonly number[]).includes(saved) ? saved : DEFAULT_DAILY_GOAL;
}

export async function saveDailyGoal(minutes: number): Promise<void> {
  if (!(DAILY_GOAL_OPTIONS as readonly number[]).includes(minutes)) throw new Error('Invalid daily goal');
  await AsyncStorage.setItem(GOAL_KEY, String(minutes));
}

/** A display score, not a medical measure. 100 at zero selected-app usage; 0 at twice the goal. */
export function goalScore(usedMs: number, goalMinutes: number): number {
  if (!Number.isFinite(usedMs) || goalMinutes <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(100 * (1 - usedMs / (goalMinutes * 120000)))));
}
