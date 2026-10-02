import type {BlockerStatus} from './native/blocker';

export type BoundaryState = {active: boolean; label: string; detail: string};

export function boundaryState(status: BlockerStatus, androidAvailable = true): BoundaryState {
  if (!androidAvailable) return {active: false, label: 'Android only', detail: 'App boundaries are available on Android.'};
  if (!status.accessibilityEnabled) return {active: false, label: 'Service off', detail: 'Enable the Android service to pause apps.'};
  if (status.blockedPackages.length === 0) return {active: false, label: 'Choose apps', detail: 'Choose apps in Block to apply your rules.'};

  const active = [
    status.blockingEnabled && 'All day',
    status.focusBlocking && 'Focus',
    status.scheduleActive && 'Schedule',
    status.allowanceReached && 'Daily allowance',
  ].filter((name): name is string => Boolean(name));
  const needsUsageAccess = status.dailyAllowanceMinutes > 0 && !status.usageAccessGranted;
  if (active.length) return {
    active: true,
    label: `${active.join(' · ')} active`,
    detail: needsUsageAccess ? 'Daily allowance needs Usage Access; other active rules still apply.' : 'Selected apps are paused by active rules.',
  };
  if (needsUsageAccess) return {active: false, label: 'Usage Access needed', detail: 'Allow Usage Access to enforce the daily allowance.'};
  return {active: false, label: 'No rule active now', detail: 'Your selected apps will pause when a rule starts.'};
}
