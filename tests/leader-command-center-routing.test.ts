import { describe, expect, it } from "vitest";

import {
  buildLeaderCommandCenterHrefForScreen,
  getLeaderCommandCenterViewForScreen,
  resolveLeaderCommandCenterScreen,
} from "@/services/leader-command-center-routing";

describe("leader command center routing", () => {
  it("maps existing leader view query names to copied Figma screens", () => {
    expect(resolveLeaderCommandCenterScreen("overview")).toBe("home");
    expect(resolveLeaderCommandCenterScreen("leaderboard")).toBe("leaderboard");
    expect(resolveLeaderCommandCenterScreen("attendance")).toBe("events");
    expect(resolveLeaderCommandCenterScreen("events")).toBe("events");
    expect(resolveLeaderCommandCenterScreen("member_profile")).toBe("profile");
    expect(resolveLeaderCommandCenterScreen("bridge_videos")).toBe("bridge");
    expect(resolveLeaderCommandCenterScreen("feed_analytics")).toBe("feed");
    expect(resolveLeaderCommandCenterScreen("create-event")).toBe("create-event");
  });

  it("keeps sidebar clicks shareable by writing the canonical view query", () => {
    expect(getLeaderCommandCenterViewForScreen("home")).toBe("overview");
    expect(getLeaderCommandCenterViewForScreen("leaderboard")).toBe("leaderboard");
    expect(getLeaderCommandCenterViewForScreen("members")).toBe("members");
    expect(getLeaderCommandCenterViewForScreen("profile")).toBe("member_profile");
    expect(getLeaderCommandCenterViewForScreen("bridge")).toBe("bridge_videos");
    expect(getLeaderCommandCenterViewForScreen("feed")).toBe("feed_analytics");
    expect(getLeaderCommandCenterViewForScreen("create-event")).toBe("create_event");
  });

  it("keeps only leaderboard continuity state when switching into the leaderboard view", () => {
    expect(
      buildLeaderCommandCenterHrefForScreen("leaderboard", {
        pathname: "/leader",
        search:
          "source=feed_analytics&view=events&leaderboardMetric=attendance&region=canada&member=member-ivy&quickAction=promote_to_chair",
      }),
    ).toBe("/leader?leaderboardMetric=attendance&region=canada&view=leaderboard");
  });

  it("preserves member-review continuity without carrying quick-action noise into member profile", () => {
    expect(
      buildLeaderCommandCenterHrefForScreen("profile", {
        pathname: "/leader",
        search:
          "source=feed_analytics&view=succession&member=member-maya&pipeline=follow_up&q=Sofia&feedPost=feed-post-slt-recap&quickAction=promote_to_chair&leaderboardMetric=attendance&region=canada",
      }),
    ).toBe(
      "/leader?source=feed_analytics&member=member-maya&pipeline=follow_up&q=Sofia&feedPost=feed-post-slt-recap&leaderboardMetric=attendance&region=canada&view=member_profile",
    );
  });

  it("keeps event-ops continuity focused on committee and selected event state", () => {
    expect(
      buildLeaderCommandCenterHrefForScreen("events", {
        pathname: "/leader",
        search:
          "source=feed_analytics&view=member_profile&member=member-ivy&eventCommittee=recruitment&event=bc-event-quad-tabling&quickAction=assign_action",
      }),
    ).toBe("/leader?event=bc-event-quad-tabling&eventCommittee=recruitment&view=events");
  });

  it("preserves leadership-review context across current leaders succession values and training", () => {
    const continuitySearch =
      "source=member_home&view=member_profile&member=member-ivy&pipeline=follow_up&q=Ivy&feedPost=feed-post-slt-recap&quickAction=add_leader_note&leaderboardMetric=attendance&region=canada";

    expect(
      buildLeaderCommandCenterHrefForScreen("leaders", {
        pathname: "/leader",
        search: continuitySearch,
      }),
    ).toBe(
      "/leader?source=member_home&member=member-ivy&pipeline=follow_up&q=Ivy&feedPost=feed-post-slt-recap&leaderboardMetric=attendance&region=canada&view=leaders",
    );

    expect(
      buildLeaderCommandCenterHrefForScreen("succession", {
        pathname: "/leader",
        search: continuitySearch,
      }),
    ).toBe(
      "/leader?source=member_home&member=member-ivy&pipeline=follow_up&q=Ivy&feedPost=feed-post-slt-recap&leaderboardMetric=attendance&region=canada&view=succession",
    );

    expect(
      buildLeaderCommandCenterHrefForScreen("values", {
        pathname: "/leader",
        search: continuitySearch,
      }),
    ).toBe(
      "/leader?source=member_home&member=member-ivy&pipeline=follow_up&q=Ivy&feedPost=feed-post-slt-recap&leaderboardMetric=attendance&region=canada&view=values",
    );

    expect(
      buildLeaderCommandCenterHrefForScreen("training", {
        pathname: "/leader",
        search: continuitySearch,
      }),
    ).toBe(
      "/leader?source=member_home&member=member-ivy&pipeline=follow_up&q=Ivy&feedPost=feed-post-slt-recap&leaderboardMetric=attendance&region=canada&view=training",
    );
  });

  it("preserves selected-member continuity across leadership review screens without carrying quick-action noise", () => {
    expect(
      buildLeaderCommandCenterHrefForScreen("leaders", {
        pathname: "/leader",
        search:
          "source=member_profile&view=succession&member=member-ivy&pipeline=follow_up&q=Ivy&feedPost=feed-post-slt-recap&quickAction=promote_to_chair",
      }),
    ).toBe(
      "/leader?source=member_profile&member=member-ivy&pipeline=follow_up&q=Ivy&feedPost=feed-post-slt-recap&view=leaders",
    );

    expect(
      buildLeaderCommandCenterHrefForScreen("values", {
        pathname: "/leader",
        search:
          "source=leaders&view=member_profile&member=member-ivy&pipeline=follow_up&q=Ivy&quickAction=schedule_values_interview&benchmark=chapter-ucla",
      }),
    ).toBe(
      "/leader?source=leaders&member=member-ivy&pipeline=follow_up&q=Ivy&benchmark=chapter-ucla&view=values",
    );
  });

  it("keeps chapter-home return links shareable from leadership review screens", () => {
    expect(
      buildLeaderCommandCenterHrefForScreen("home", {
        pathname: "/leader",
        search:
          "source=training&view=training&member=member-ivy&pipeline=follow_up&q=Ivy&quickAction=assign_action&leaderboardMetric=attendance&region=canada",
      }),
    ).toBe(
      "/leader?source=training&member=member-ivy&pipeline=follow_up&q=Ivy&leaderboardMetric=attendance&region=canada&view=overview",
    );
  });
});
