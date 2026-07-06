export type StaffLaunchLaneCanonicalView =
  | "chapters"
  | "campaigns"
  | "events"
  | "leaderboard"
  | "proof_ugc"
  | "best_practices"
  | "sops"
  | "admin";

export type StaffLaunchLaneViewResolution = {
  requestedView: string | null;
  canonicalView: StaffLaunchLaneCanonicalView;
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
      return createResolution(normalizedView, "campaigns");
    case "events":
      return createResolution(normalizedView, "events");
    case "leaderboard":
    case "points":
      return createResolution(normalizedView, "leaderboard");
    case "proof_ugc":
    case "ugc":
      return createResolution(normalizedView, "proof_ugc");
    case "best_practices":
    case "best-practices":
      return createResolution(normalizedView, "best_practices");
    case "sops":
      return createResolution(normalizedView, "sops");
    case "admin":
      return createResolution(normalizedView, "admin");
    case "risks":
    case "chapter_detail":
    case "support_notes":
      return createResolution(normalizedView, "chapters", {
        eyebrow: "Support lane parked",
        title: "Detailed support review is parked inside the chapter list for this launch pass.",
        detail:
          "Keep the staff view simple: chapter health, next event, RSVP posture, attendance, and points. Deeper support notes stay out of the visible workspace until the event loop is fully live.",
      });
    case "feed_studio":
    case "feed_analytics":
      return createResolution(normalizedView, "proof_ugc", {
        eyebrow: "Story lane parked",
        title: "Extra feed workflow routes are parked inside the Proof / UGC lane for this launch pass.",
        detail:
          "Keep the visible staff shell honest: proof review stays available, while broader feed-studio workflow routes still collapse into the existing Proof / UGC surface.",
      });
    case "hubspot":
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
          "Use the visible staff tabs for now: chapters, campaigns, Proof / UGC, best practices, SOPs, and admin handoff.",
      });
  }
}

export function getStaffLaunchLaneCanonicalHref(
  searchParams: Record<string, string | undefined> = {},
): string | null {
  const resolution = resolveStaffLaunchLaneView(searchParams.view);
  const canonicalView = resolution.canonicalView;

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
  canonicalView: StaffLaunchLaneCanonicalView,
  parkedNotice: StaffLaunchLaneViewResolution["parkedNotice"] = null,
): StaffLaunchLaneViewResolution {
  return {
    requestedView,
    canonicalView,
    parkedNotice,
  };
}

function normalizeRequestedView(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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
