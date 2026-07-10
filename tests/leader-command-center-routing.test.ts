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

  it("preserves unrelated query state while replacing the active view", () => {
    expect(
      buildLeaderCommandCenterHrefForScreen("leaderboard", {
        pathname: "/leader",
        search: "source=staff&view=events",
      }),
    ).toBe("/leader?view=leaderboard");

    expect(
      buildLeaderCommandCenterHrefForScreen("events", {
        pathname: "/leader",
        search: "eventCommittee=events",
      }),
    ).toBe("/leader?eventCommittee=events&view=events");
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
