export type TrackingState = 'untracked' | 'partial' | 'complete';

export function trackingState(dayStart: number, dayEnd: number, trackingStartedAt: number, now: number): TrackingState {
  if (trackingStartedAt <= 0 || trackingStartedAt >= dayEnd) return 'untracked';
  if (trackingStartedAt > dayStart || dayEnd > now) return 'partial';
  return 'complete';
}
