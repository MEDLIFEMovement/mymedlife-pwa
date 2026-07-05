export type LeaderCommandCenterScreen =
  | "home"
  | "leaderboard"
  | "members"
  | "profile"
  | "committees"
  | "events"
  | "impact"
  | "bridge"
  | "succession"
  | "feed"
  | "training"
  | "values"
  | "leaders"
  | "create-event"
  | "stories";

const viewAliases: Record<string, LeaderCommandCenterScreen> = {
  overview: "home",
  home: "home",
  dashboard: "home",
  chapter_home: "home",
  chapter_dashboard: "home",

  leaderboard: "leaderboard",
  chapter_leaderboard: "leaderboard",
  chapter_points: "leaderboard",

  members: "members",
  member_leaderboard: "members",
  member_pipeline: "members",

  profile: "profile",
  member_profile: "profile",

  committees: "committees",
  event_committees: "committees",

  attendance: "events",
  events: "events",
  event_performance: "events",

  create_event: "create-event",
  "create-event": "create-event",

  impact: "impact",
  impact_dashboard: "impact",

  bridge: "bridge",
  bridge_videos: "bridge",

  succession: "succession",
  succession_planning: "succession",

  feed: "feed",
  feed_analytics: "feed",

  training: "training",
  leadership_training: "training",

  values: "values",
  medlife_values: "values",

  leaders: "leaders",
  current_leaders: "leaders",

  stories: "stories",
  medlife_stories: "stories",
};

const screenViews: Record<LeaderCommandCenterScreen, string> = {
  home: "overview",
  leaderboard: "leaderboard",
  members: "members",
  profile: "member_profile",
  committees: "committees",
  events: "events",
  impact: "impact",
  bridge: "bridge_videos",
  succession: "succession",
  feed: "feed_analytics",
  training: "training",
  values: "values",
  leaders: "leaders",
  "create-event": "create_event",
  stories: "stories",
};

export function resolveLeaderCommandCenterScreen(
  view: string | null | undefined,
): LeaderCommandCenterScreen {
  if (!view) {
    return "home";
  }

  const normalizedView = view.trim().toLowerCase().replace(/[\s-]+/g, "_");

  return viewAliases[normalizedView] ?? "home";
}

export function getLeaderCommandCenterViewForScreen(
  screen: LeaderCommandCenterScreen,
): string {
  return screenViews[screen];
}

export function buildLeaderCommandCenterHrefForScreen(
  screen: LeaderCommandCenterScreen,
  options: {
    pathname?: string | null;
    search?: string;
  } = {},
): string {
  const pathname = options.pathname || "/leader";
  const params = new URLSearchParams(options.search ?? "");

  params.set("view", getLeaderCommandCenterViewForScreen(screen));

  const query = params.toString();

  return `${pathname}${query ? `?${query}` : ""}`;
}
