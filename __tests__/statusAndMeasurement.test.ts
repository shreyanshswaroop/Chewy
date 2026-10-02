import {boundaryState} from '../src/blockStatus';
import {trackingState} from '../src/usagePresentation';
import {emptyStatus} from '../src/native/blocker';

jest.mock('react-native', () => ({NativeModules: {}, Platform: {OS: 'android'}}));

test('status reports concurrent rules and missing Usage Access', () => {
  const status = {...emptyStatus, accessibilityEnabled: true, blockedPackages: ['app'], focusBlocking: true, scheduleActive: true, dailyAllowanceMinutes: 30};
  expect(boundaryState(status)).toEqual({active: true, label: 'Focus · Schedule active', detail: 'Daily allowance needs Usage Access; other active rules still apply.'});
  expect(boundaryState({...status, focusBlocking: false, scheduleActive: false}).label).toBe('Usage Access needed');
  expect(boundaryState({...status, accessibilityEnabled: false}).label).toBe('Service off');
});

test('tracking display separates missing, partial, and complete days', () => {
  const day = 100000;
  const next = day + 86400000;
  expect(trackingState(day, next, next, next + 1)).toBe('untracked');
  expect(trackingState(day, next, day + 1000, next + 1)).toBe('partial');
  expect(trackingState(day, next, day, next + 1)).toBe('complete');
  expect(trackingState(day, next, day, day + 1000)).toBe('partial');
});
