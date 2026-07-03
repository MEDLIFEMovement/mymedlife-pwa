export function isEventsPointsLaunchLaneEnabled() {
  return true;
}

export function shouldShowTravelerPrepEntry() {
  return !isEventsPointsLaunchLaneEnabled();
}

export function getTravelerPrimaryLandingHref() {
  return shouldShowTravelerPrepEntry() ? "/app/slt-prep" : "/app";
}

const eventsPointsVisibleRouteHrefs = new Set([
  "/",
  "/login",
  "/app",
  "/app/events",
  "/app/events/",
  "/app/points",
  "/leader",
  "/staff",
  "/admin",
  "/admin/launch-gate",
  "/admin/audit-log",
  "/admin/integration-outbox",
  "/admin/pilot-scope",
  "/offline",
  "/profile",
]);

const eventsPointsSmokePaths = new Set([
  "/",
  "/login",
  "/app",
  "/app/events",
  "/app/events/chapter-event-ucla-kickoff",
  "/app/points",
  "/leader",
  "/staff",
  "/admin",
  "/admin/launch-gate",
  "/admin/audit-log",
  "/admin/integration-outbox",
  "/admin/pilot-scope",
  "/offline",
  "/profile",
]);

export function isEventsPointsLaunchLaneVisibleRouteHref(href: string) {
  return eventsPointsVisibleRouteHrefs.has(normalizePath(href));
}

export function isEventsPointsLaunchLaneSmokePath(path: string) {
  return eventsPointsSmokePaths.has(normalizePath(path));
}

function normalizePath(value: string) {
  const queryIndex = value.indexOf("?");
  const hashIndex = value.indexOf("#");
  const cutoff =
    queryIndex === -1
      ? hashIndex
      : hashIndex === -1
        ? queryIndex
        : Math.min(queryIndex, hashIndex);

  return cutoff === -1 ? value : value.slice(0, cutoff);
}
