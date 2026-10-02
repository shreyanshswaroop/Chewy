import {formatRuleTime, parseRuleTime, weeklyComparison} from '../src/blockRules';

test('schedule time accepts only 24-hour HH:MM and formats midnight', () => {
  expect(parseRuleTime('23:59')).toBe(1439);
  expect(parseRuleTime('00:00')).toBe(0);
  expect(parseRuleTime('24:00')).toBeNull();
  expect(parseRuleTime('9:00')).toBeNull();
  expect(formatRuleTime(0)).toBe('00:00');
  expect(formatRuleTime(1439)).toBe('23:59');
});

test('week comparison excludes today and waits for fully tracked days', () => {
  const days = Array.from({length: 15}, (_, index) => ({
    selectedTimeMs: (index < 7 ? 60 : index < 14 ? 30 : 500) * 60000,
    completeTracking: index < 14,
  }));
  expect(weeklyComparison(days)).toEqual({previousMinutes: 420, latestMinutes: 210, changePercent: -50});
  days[3].completeTracking = false;
  expect(weeklyComparison(days)).toBeNull();
});

test('comparison handles a zero baseline without a false percentage', () => {
  const days = Array.from({length: 15}, (_, index) => ({
    selectedTimeMs: index < 7 ? 0 : 60000,
    completeTracking: index < 14,
  }));
  expect(weeklyComparison(days)).toEqual({previousMinutes: 0, latestMinutes: 7, changePercent: null});
});
