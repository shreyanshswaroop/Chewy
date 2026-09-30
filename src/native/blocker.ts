import {NativeModules, Platform} from 'react-native';

export type LaunchableApp = {packageName: string; label: string; icon?: string | null};
export type BlockerStatus = {
  accessibilityEnabled: boolean;
  blockingEnabled: boolean;
  blockedPackages: string[];
};
export type AppUsage = {packageName: string; label: string; icon?: string | null; timeMs: number};
export type TodayUsage = {permissionGranted: boolean; totalTimeMs: number; topApps: AppUsage[]};

type BlockerModule = {
  getLaunchableApps(): Promise<LaunchableApp[]>;
  getStatus(): Promise<BlockerStatus>;
  getTodayUsage(): Promise<TodayUsage>;
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
  blockedPackages: [],
};
