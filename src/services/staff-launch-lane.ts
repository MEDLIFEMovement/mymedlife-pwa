export type StaffLaunchLaneCoreView = "chapters" | "events" | "points";

export type StaffLaunchLaneViewResolution = {
  requestedView: string | null;
  coreView: StaffLaunchLaneCoreView;
  parkedNotice: {
    eyebrow: string;
    title: string;
    detail: string;
  } | null;
};

export function resolveStaffLaunchLaneView(
  requestedView?: string | null,
): StaffLaunchLaneViewResolution {
  const normalizedView = normalizeRequestedView(requestedView);

  switch (normalizedView) {
    case null:
    case "chapters":
      return createResolution(normalizedView, "chapters");
    case "campaigns":
    case "events":
      return createResolution(normalizedView, "events");
    case "leaderboard":
    case "points":
      return createResolution(normalizedView, "points");
    case "risks":
    case "chapter_detail":
    case "support_notes":
      return createResolution(normalizedView, "chapters", {
        eyebrow: "Support lane parked",
        title: "Detailed support review is parked inside the chapter list for this launch pass.",
        detail:
          "Keep the staff view simple: chapter health, next event, RSVP posture, attendance, and points. Deeper support notes stay out of the visible workspace until the event loop is fully live.",
      });
    case "proof_ugc":
    case "feed_studio":
    case "feed_analytics":
    case "best_practices":
      return createResolution(normalizedView, "points", {
        eyebrow: "Story lane parked",
        title: "Proof, story, and content review are parked inside the points lane for this launch pass.",
        detail:
          "Stay focused on attendance-backed leaderboard movement first. Broader proof, feed, and best-practice modules stay off in the visible staff workspace.",
      });
    case "hubspot":
    case "admin":
      return createResolution(normalizedView, "chapters", {
        eyebrow: "External systems parked",
        title: "CRM and broader admin review are parked outside the staff launch lane.",
        detail:
          "Use the chapter list to understand event health and point movement. HubSpot and broader staff-admin tooling stay out of the visible workspace while the chapter event loop is the main product.",
      });
    default:
      return createResolution(normalizedView, "chapters", {
        eyebrow: "Launch lane",
        title: "This staff route is parked inside the launch lane.",
        detail:
          "Use the core staff tabs for now: chapters, events, and leaderboard.",
      });
  }
}

export function getStaffLaunchLaneCanonicalHref(
  searchParams: Record<string, string | undefined> = {},
): string | null {
  const resolution = resolveStaffLaunchLaneView(searchParams.view);
  const canonicalView = getStaffLaunchLaneCanonicalView(resolution.coreView);

  if (resolution.requestedView === null || resolution.requestedView === canonicalView) {
    return null;
  }

  return withQuery("/staff", {
    ...searchParams,
    view: canonicalView,
  });
}

function createResolution(
  requestedView: string | null,
  coreView: StaffLaunchLaneCoreView,
  parkedNotice: StaffLaunchLaneViewResolution["parkedNotice"] = null,
): StaffLaunchLaneViewResolution {
  return {
    requestedView,
    coreView,
    parkedNotice,
  };
}

function normalizeRequestedView(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getStaffLaunchLaneCanonicalView(coreView: StaffLaunchLaneCoreView) {
  switch (coreView) {
    case "chapters":
      return "chapters";
    case "events":
      return "events";
    case "points":
      return "leaderboard";
  }
}

function withQuery(baseHref: string, query: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();

  if (!queryString) {
    return baseHref;
  }

  return `${baseHref}?${queryString}`;
}
