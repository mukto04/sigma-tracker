export type TimeEntryMetric = {
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
};

export type ActivityMetric = {
  createdAt: Date;
  productivityScore: number;
  activeApps: string;
};

export type AppUsage = { name: string; duration: number };

const DEFAULT_ACTIVITY_INTERVAL_SECONDS = 10;
const MAX_ACTIVITY_INTERVAL_SECONDS = 15;

export function secondsInRange(entry: TimeEntryMetric, from: Date, to: Date, now = new Date()) {
  const start = Math.max(entry.startTime.getTime(), from.getTime());
  const naturalEnd = entry.endTime?.getTime() ?? now.getTime();
  const end = Math.min(naturalEnd, to.getTime());
  return Math.max(0, Math.floor((end - start) / 1000));
}

export function totalTrackedSeconds(entries: TimeEntryMetric[], from: Date, to: Date, now = new Date()) {
  return entries.reduce((total, entry) => total + secondsInRange(entry, from, to, now), 0);
}

export function activityIntervalSeconds(log: ActivityMetric, nextLog?: ActivityMetric) {
  if (!nextLog) return DEFAULT_ACTIVITY_INTERVAL_SECONDS;
  const gap = Math.floor((nextLog.createdAt.getTime() - log.createdAt.getTime()) / 1000);
  return Math.max(1, Math.min(MAX_ACTIVITY_INTERVAL_SECONDS, gap || DEFAULT_ACTIVITY_INTERVAL_SECONDS));
}

export function activityMetrics(logs: ActivityMetric[], trackedSeconds: number) {
  const chronological = [...logs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  let sampledSeconds = 0;
  let activeSeconds = 0;
  let weightedScore = 0;

  chronological.forEach((log, index) => {
    const seconds = activityIntervalSeconds(log, chronological[index + 1]);
    const score = Math.max(0, Math.min(100, Number(log.productivityScore) || 0));
    sampledSeconds += seconds;
    activeSeconds += seconds * (score / 100);
    weightedScore += seconds * score;
  });

  const cappedSampleSeconds = Math.min(trackedSeconds, sampledSeconds);
  const ratio = sampledSeconds > 0 ? cappedSampleSeconds / sampledSeconds : 0;
  const cappedActiveSeconds = Math.round(Math.min(trackedSeconds, activeSeconds * ratio));

  return {
    sampledSeconds: cappedSampleSeconds,
    activeSeconds: cappedActiveSeconds,
    idleSeconds: Math.max(0, trackedSeconds - cappedActiveSeconds),
    averageScore: sampledSeconds > 0 ? Math.round(weightedScore / sampledSeconds) : 0,
  };
}

export function parseAppUsage(value: string): AppUsage[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is AppUsage => typeof item?.name === 'string' && Number.isFinite(item?.duration))
      .map((item) => ({ name: item.name.trim(), duration: Math.max(0, Math.floor(item.duration)) }))
      .filter((item) => item.name.length > 0 && item.duration > 0);
  } catch {
    return [];
  }
}

// A native client reports app samples per sync interval. Scale malformed or
// overlapping samples so application usage never exceeds tracked time.
export function aggregateAppUsage(logs: ActivityMetric[]) {
  const usage: Record<string, number> = {};
  const chronological = [...logs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  chronological.forEach((log, index) => {
    const apps = parseAppUsage(log.activeApps);
    const reported = apps.reduce((sum, app) => sum + app.duration, 0);
    if (reported <= 0) return;
    const interval = activityIntervalSeconds(log, chronological[index + 1]);
    const scale = reported > interval ? interval / reported : 1;
    apps.forEach((app) => {
      usage[app.name] = (usage[app.name] || 0) + Math.round(app.duration * scale);
    });
  });

  return usage;
}
