import {
  getLeaderCommandCenterViewForScreen,
  resolveLeaderCommandCenterScreen,
} from "@/services/leader-command-center-routing";

export type LeaderLaunchLaneCoreView =
  | "overview"
  | "events"
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
    case "events":
      return createResolution(normalizedView, "events");
    case "members":
    case "attendance":
      return createResolution(normalizedView, "events");
    case "leaderboard":
      return createResolution(normalizedView, "leaderboard");
    case "member_profile":
      return createResolution(normalizedView, "events", {
        eyebrow: "Member review parked",
        title: "Member profile detail is parked inside the attendance lane for this launch pass.",
        detail:
          "Use the attendance lane to review who is active, who still needs follow-up, and who is ready for the next chapter push while the broader member-profile module stays off.",
      });
    case "committees":
      return createResolution(normalizedView, "events", {
        eyebrow: "Committee lane parked",
        title: "Committee management is folded into the leader events lane for this launch pass.",
        detail:
          "Keep chapter owners visible through the event loop: create the next event, watch RSVP posture, confirm attendance, and let that drive the work instead of opening a separate committee product lane.",
      });
    case "succession":
      return createResolution(normalizedView, "events", {
        eyebrow: "Succession lane parked",
        title: "Leadership pipeline review is parked inside the attendance lane for this launch pass.",
        detail:
          "Use the attendance lane to see who is active, consistent, and ready for more responsibility while the broader succession workspace stays off.",
      });
    case "impact":
    case "bridge_videos":
    case "feed_analytics":
      return createResolution(normalizedView, "leaderboard", {
        eyebrow: "Story lane parked",
        title: "Impact, story, and feed review are parked inside the points lane for this launch pass.",
        detail:
          "Stay focused on attendance-backed leaderboard movement first. Broader impact, bridge-video, and feed modules stay out of the visible leader workspace until the event loop is fully live.",
      });
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

  return withQuery("/leader", {
    ...searchParams,
    view: canonicalView,
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
