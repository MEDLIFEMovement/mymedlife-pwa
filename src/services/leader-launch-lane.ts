import {
  buildLeaderCommandCenterHrefForScreen,
  getLeaderCommandCenterViewForScreen,
  resolveLeaderCommandCenterScreen,
} from "@/services/leader-command-center-routing";

export type LeaderLaunchLaneCoreView =
  | "overview"
  | "members"
  | "member_profile"
  | "committees"
  | "events"
  | "impact"
  | "bridge_videos"
  | "feed_analytics"
  | "leaders"
  | "succession"
  | "values"
  | "training"
  | "create_event"
  | "stories"
  | "leaderboard";

export type LeaderLaunchLaneViewResolution = {
  requestedView: string | null;
  coreView: LeaderLaunchLaneCoreView;
  parkedNotice: {
    eyebrow: string;
    title: string;
    detail: string;
  } | null;
};

export function resolveLeaderLaunchLaneView(
  requestedView?: string | null,
): LeaderLaunchLaneViewResolution {
  const normalizedView = normalizeRequestedView(requestedView);

  switch (normalizedView) {
    case null:
    case "overview":
      return createResolution(normalizedView, "overview");
    case "members":
      return createResolution(normalizedView, "members");
    case "events":
    case "attendance":
      return createResolution(normalizedView, "events");
    case "member_profile":
      return createResolution(normalizedView, "member_profile");
    case "committees":
    case "event_committees":
      return createResolution(normalizedView, "committees");
    case "leaderboard":
      return createResolution(normalizedView, "leaderboard");
    case "succession":
      return createResolution(normalizedView, "succession");
    case "leaders":
    case "current_leaders":
      return createResolution(normalizedView, "leaders");
    case "values":
    case "medlife_values":
      return createResolution(normalizedView, "values");
    case "training":
    case "leadership_training":
      return createResolution(normalizedView, "training");
    case "impact":
      return createResolution(normalizedView, "impact");
    case "bridge_videos":
      return createResolution(normalizedView, "bridge_videos");
    case "feed_analytics":
      return createResolution(normalizedView, "feed_analytics");
    case "create_event":
    case "create-event":
      return createResolution(normalizedView, "create_event");
    case "stories":
    case "medlife_stories":
      return createResolution(normalizedView, "stories");
    default:
      return createResolution(normalizedView, "overview", {
        eyebrow: "Launch lane",
        title: "This leader route is parked inside the launch lane.",
        detail:
        "Use the core leader tabs for now: overview, events, and leaderboard.",
      });
  }
}

export function getLeaderLaunchLaneCanonicalHref(
  searchParams: Record<string, string | undefined> = {},
): string | null {
  const requestedView = normalizeRequestedView(searchParams.view);

  if (requestedView === null) {
    return null;
  }

  const normalizedView = requestedView.toLowerCase().replace(/[\s-]+/g, "_");
  const resolvedScreen = resolveLeaderCommandCenterScreen(normalizedView);
  const canonicalView = getLeaderCommandCenterViewForScreen(resolvedScreen);

  if (normalizedView === canonicalView) {
    return null;
  }

  return buildLeaderCommandCenterHrefForScreen(resolvedScreen, {
    pathname: "/leader",
    search: buildCanonicalSearch(searchParams),
  });
}

function createResolution(
  requestedView: string | null,
  coreView: LeaderLaunchLaneCoreView,
  parkedNotice: LeaderLaunchLaneViewResolution["parkedNotice"] = null,
): LeaderLaunchLaneViewResolution {
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

function buildCanonicalSearch(searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      params.set(key, value);
    }
  }

  return params.toString();
}
