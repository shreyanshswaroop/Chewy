import {goalScore} from '../src/dailyGoal';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(), setItem: jest.fn()},
}));

test('energy reflects selected-app time against the daily goal', () => {
  const goal = 60;
  expect(goalScore(0, goal)).toBe(100);
  expect(goalScore(30 * 60000, goal)).toBe(75);
  expect(goalScore(60 * 60000, goal)).toBe(50);
  expect(goalScore(120 * 60000, goal)).toBe(0);
  expect(goalScore(300 * 60000, goal)).toBe(0);
});
