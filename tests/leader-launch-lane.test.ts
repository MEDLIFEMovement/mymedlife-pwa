import { describe, expect, it } from "vitest";

import {
  getLeaderLaunchLaneCanonicalHref,
  resolveLeaderLaunchLaneView,
} from "@/services/leader-launch-lane";

describe("leader launch lane", () => {
  it("keeps the core leader views unchanged", () => {
    expect(resolveLeaderLaunchLaneView("overview")).toMatchObject({
      coreView: "overview",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("events")).toMatchObject({
      coreView: "events",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("leaderboard")).toMatchObject({
      coreView: "leaderboard",
      parkedNotice: null,
    });
  });

  it("canonicalizes leader aliases without dropping selected-member or handoff context", () => {
    expect(
      getLeaderLaunchLaneCanonicalHref({
        view: "current_leaders",
        member: "member-ivy",
        source: "member_home",
        pipeline: "follow_up",
        q: "Ivy",
      }),
    ).toBe(
      "/leader?view=leaders&member=member-ivy&source=member_home&pipeline=follow_up&q=Ivy",
    );

    expect(
      getLeaderLaunchLaneCanonicalHref({
        view: "leadership-training",
        member: "member-maya",
        source: "feed_analytics",
        feedPost: "feed-post-slt-recap",
      }),
    ).toBe(
      "/leader?view=training&member=member-maya&source=feed_analytics&feedPost=feed-post-slt-recap",
    );

    expect(
      getLeaderLaunchLaneCanonicalHref({
        view: "event_performance",
        member: "member-zara",
        eventCommittee: "events",
        event: "bc-event-moving-mountains-kickoff",
      }),
    ).toBe(
      "/leader?view=events&member=member-zara&eventCommittee=events&event=bc-event-moving-mountains-kickoff",
    );
  });

  it("leaves already-canonical leader review routes alone", () => {
    expect(
      getLeaderLaunchLaneCanonicalHref({
        view: "member_profile",
        member: "member-ivy",
        pipeline: "follow_up",
        q: "Ivy",
      }),
    ).toBeNull();

    expect(
      getLeaderLaunchLaneCanonicalHref({
        view: "values",
        member: "member-maya",
        source: "feed_analytics",
      }),
    ).toBeNull();
  });
});
