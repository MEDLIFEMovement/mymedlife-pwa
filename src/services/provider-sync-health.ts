export type ProviderSyncHealthStatus =
  | "disabled"
  | "never_run"
  | "running"
  | "healthy"
  | "stale"
  | "degraded"
  | "failed";

export type ProviderSyncHealth = {
  status: ProviderSyncHealthStatus;
  label: string;
  detail: string;
  expectedCadenceMinutes: number;
  staleAfterMinutes: number;
  lastObservedAt: string | null;
};

type SyncRun = {
  status: string;
  startedAt: string;
  completedAt: string | null;
  heartbeatAt: string;
};

type ProviderSyncHealthInput = {
  enabled: boolean;
  lastRun: SyncRun | null;
  openFailures: number;
  now?: Date;
  expectedCadenceMinutes?: number;
  staleAfterMinutes?: number;
};

export function getProviderSyncHealth({
  enabled,
  lastRun,
  openFailures,
  now = new Date(),
  expectedCadenceMinutes = 60,
  staleAfterMinutes = 120,
}: ProviderSyncHealthInput): ProviderSyncHealth {
  const cadence = positiveMinutes(expectedCadenceMinutes, 60);
  const staleAfter = Math.max(positiveMinutes(staleAfterMinutes, 120), cadence);
  const base = {
    expectedCadenceMinutes: cadence,
    staleAfterMinutes: staleAfter,
  };

  if (!enabled) {
    return {
      ...base,
      status: "disabled",
      label: "Disabled",
      detail: "Scheduled provider reads are disabled by configuration.",
      lastObservedAt: lastRun ? getObservedAt(lastRun) : null,
    };
  }

  if (!lastRun) {
    return {
      ...base,
      status: "never_run",
      label: "Never run",
      detail: `No provider sync run is recorded. Expected cadence is every ${cadence} minutes.`,
      lastObservedAt: null,
    };
  }

  const observedAt = getObservedAt(lastRun);
  const ageMinutes = minutesSince(observedAt, now);
  if (ageMinutes === null) {
    return {
      ...base,
      status: "degraded",
      label: "Timestamp unavailable",
      detail: "The latest run has no valid completion or heartbeat timestamp.",
      lastObservedAt: observedAt,
    };
  }

  const normalizedStatus = lastRun.status.toLowerCase();
  if (["failed", "error"].includes(normalizedStatus)) {
    return {
      ...base,
      status: "failed",
      label: "Failed",
      detail: `The latest run failed ${formatAge(ageMinutes)}.`,
      lastObservedAt: observedAt,
    };
  }

  if (normalizedStatus === "running") {
    const stale = ageMinutes > staleAfter;
    return {
      ...base,
      status: stale ? "stale" : "running",
      label: stale ? "Run heartbeat stale" : "Running",
      detail: stale
        ? `The active run has not reported a heartbeat for ${formatDuration(ageMinutes)}.`
        : `The active run reported a heartbeat ${formatAge(ageMinutes)}.`,
      lastObservedAt: observedAt,
    };
  }

  if (["partial", "degraded"].includes(normalizedStatus) || openFailures > 0) {
    return {
      ...base,
      status: "degraded",
      label: "Needs attention",
      detail: openFailures > 0
        ? `${openFailures} unresolved sync failure${openFailures === 1 ? "" : "s"} require review.`
        : "The latest provider sync completed only partially.",
      lastObservedAt: observedAt,
    };
  }

  if (ageMinutes > staleAfter) {
    return {
      ...base,
      status: "stale",
      label: "Stale",
      detail: `The latest successful readback is ${formatDuration(ageMinutes)} old; expected cadence is every ${cadence} minutes.`,
      lastObservedAt: observedAt,
    };
  }

  return {
    ...base,
    status: "healthy",
    label: "Current",
    detail: `The latest successful readback completed ${formatAge(ageMinutes)}.`,
    lastObservedAt: observedAt,
  };
}

function getObservedAt(run: SyncRun) {
  return run.completedAt || run.heartbeatAt || run.startedAt || null;
}

function minutesSince(value: string | null, now: Date) {
  if (!value) return null;
  const observed = new Date(value).getTime();
  if (!Number.isFinite(observed)) return null;
  return Math.max(0, Math.floor((now.getTime() - observed) / 60_000));
}

function positiveMinutes(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function formatAge(minutes: number) {
  return minutes < 1 ? "less than a minute ago" : `${formatDuration(minutes)} ago`;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0
    ? `${hours} hour${hours === 1 ? "" : "s"}`
    : `${hours}h ${remainder}m`;
}
