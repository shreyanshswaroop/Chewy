export type ScheduleRule = {id: string; title: string; days: number[]; start: number; end: number};
export type BlockRules = {schedules: ScheduleRule[]; dailyAllowanceMinutes: number; accessWindowMinutes: number};

export const DEFAULT_BLOCK_RULES: BlockRules = {schedules: [], dailyAllowanceMinutes: 0, accessWindowMinutes: 5};
export const ALLOWANCE_OPTIONS = [0, 15, 30, 45, 60, 90, 120, 180] as const;
export const ACCESS_OPTIONS = [0, 5, 10, 15, 30] as const;
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatRuleTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function parseRuleTime(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function formatRuleDays(days: number[]): string {
  const sorted = [...days].sort();
  if (sorted.length === 7) return 'Every day';
  if (sorted.join(',') === '1,2,3,4,5') return 'Weekdays';
  if (sorted.join(',') === '0,6') return 'Weekends';
  return sorted.map(day => WEEKDAY_LABELS[day]).join(', ');
}

export function weeklyComparison(days: {selectedTimeMs: number; completeTracking: boolean}[]): {previousMinutes: number; latestMinutes: number; changePercent: number | null} | null {
  const complete = days.slice(-15, -1);
  if (complete.length !== 14 || complete.some(day => !day.completeTracking)) return null;
  const previousMinutes = Math.round(complete.slice(0, 7).reduce((total, day) => total + day.selectedTimeMs, 0) / 60000);
  const latestMinutes = Math.round(complete.slice(7).reduce((total, day) => total + day.selectedTimeMs, 0) / 60000);
  const changePercent = previousMinutes === 0 ? null : Math.round((latestMinutes - previousMinutes) / previousMinutes * 100);
  return {previousMinutes, latestMinutes, changePercent};
}
