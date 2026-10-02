import {NativeModules, Platform} from 'react-native';

export type LaunchableApp = {packageName: string; label: string; icon?: string | null};
export type BlockerStatus = {
  accessibilityEnabled: boolean;
  blockingEnabled: boolean;
  focusBlocking: boolean;
  scheduleActive: boolean;
  allowanceReached: boolean;
  dailyAllowanceMinutes: number;
  usageAccessGranted: boolean;
  blockedPackages: string[];
};
export type AppUsage = {packageName: string; label: string; icon?: string | null; timeMs: number};
export type TodayUsage = {permissionGranted: boolean; totalTimeMs: number; selectedTimeMs: number; topApps: AppUsage[]};
export type DailyUsage = {dayStart: number; selectedTimeMs: number; completeTracking: boolean};

type BlockerModule = {
  getLaunchableApps(): Promise<LaunchableApp[]>;
  getStatus(): Promise<BlockerStatus>;
  getTodayUsage(): Promise<TodayUsage>;
  getWeeklySelectedUsage(): Promise<{permissionGranted: boolean; trackingStartedAt: number; days: DailyUsage[]}>;
  getRules(): Promise<string>;
  saveRules(json: string): Promise<void>;
  setFocusBlockUntil(timestamp: number): Promise<void>;
  openUsageAccessSettings(): Promise<void>;
  getPauseEvents(): Promise<number[]>;
  clearPauseEvents(): Promise<void>;
  saveBlockedPackages(packages: string[]): Promise<void>;
  setBlockingEnabled(enabled: boolean): Promise<void>;
  openAccessibilitySettings(): Promise<void>;
};

export const blocker: BlockerModule | null =
  Platform.OS === 'android' ? NativeModules.ChewyBlocker : null;

export const emptyStatus: BlockerStatus = {
  accessibilityEnabled: false,
  blockingEnabled: false,
  focusBlocking: false,
  scheduleActive: false,
  allowanceReached: false,
  dailyAllowanceMinutes: 0,
  usageAccessGranted: false,
  blockedPackages: [],
};
