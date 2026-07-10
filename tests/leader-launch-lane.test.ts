import { describe, expect, it } from "vitest";

import {
  getLeaderLaunchLaneCanonicalHref,
  resolveLeaderLaunchLaneView,
} from "@/services/leader-launch-lane";

describe("leader launch lane", () => {
  it("keeps the core and restored leader shell views active without a parked notice", () => {
    expect(resolveLeaderLaunchLaneView("overview")).toEqual({
      requestedView: "overview",
      coreView: "overview",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("members")).toEqual({
      requestedView: "members",
      coreView: "members",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("member_profile")).toEqual({
      requestedView: "member_profile",
      coreView: "member_profile",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("committees")).toEqual({
      requestedView: "committees",
      coreView: "committees",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("events")).toEqual({
      requestedView: "events",
      coreView: "events",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("leaderboard")).toEqual({
      requestedView: "leaderboard",
      coreView: "leaderboard",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("current_leaders")).toEqual({
      requestedView: "current_leaders",
      coreView: "leaders",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("succession")).toEqual({
      requestedView: "succession",
      coreView: "succession",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("medlife_values")).toEqual({
      requestedView: "medlife_values",
      coreView: "values",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("leadership_training")).toEqual({
      requestedView: "leadership_training",
      coreView: "training",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("impact")).toEqual({
      requestedView: "impact",
      coreView: "impact",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("bridge_videos")).toEqual({
      requestedView: "bridge_videos",
      coreView: "bridge_videos",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("feed_analytics")).toEqual({
      requestedView: "feed_analytics",
      coreView: "feed_analytics",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("create_event")).toEqual({
      requestedView: "create_event",
      coreView: "create_event",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("medlife_stories")).toEqual({
      requestedView: "medlife_stories",
      coreView: "stories",
      parkedNotice: null,
    });
  });

  it("canonicalizes leadership-family aliases while stripping stale quick-action noise", () => {
    expect(
      getLeaderLaunchLaneCanonicalHref({
        view: "current_leaders",
        source: "member_home",
        member: "member-ivy",
        pipeline: "follow_up",
        q: "Ivy",
        feedPost: "feed-post-slt-recap",
        quickAction: "add_leader_note",
        region: "canada",
      }),
    ).toBe(
      "/leader?source=member_home&member=member-ivy&pipeline=follow_up&q=Ivy&feedPost=feed-post-slt-recap&region=canada&view=leaders",
    );

    expect(
      getLeaderLaunchLaneCanonicalHref({
        view: "leadership_training",
        source: "member_home",
        member: "member-ivy",
        pipeline: "follow_up",
        q: "Ivy",
        feedPost: "feed-post-slt-recap",
        quickAction: "schedule_values_interview",
        leaderboardMetric: "attendance",
      }),
    ).toBe(
      "/leader?source=member_home&member=member-ivy&pipeline=follow_up&q=Ivy&feedPost=feed-post-slt-recap&leaderboardMetric=attendance&view=training",
    );
  });

  it("canonicalizes event aliases while preserving event review context only", () => {
    expect(
      getLeaderLaunchLaneCanonicalHref({
        view: "attendance",
        source: "member_home",
        member: "member-ivy",
        eventCommittee: "recruitment",
        event: "bc-event-quad-tabling",
        quickAction: "assign_action",
      }),
    ).toBe("/leader?event=bc-event-quad-tabling&eventCommittee=recruitment&view=events");
  });

  it("returns null when the leader route is already canonical", () => {
    expect(
      getLeaderLaunchLaneCanonicalHref({
        view: "leaders",
        member: "member-ivy",
      }),
    ).toBeNull();
  });
});
