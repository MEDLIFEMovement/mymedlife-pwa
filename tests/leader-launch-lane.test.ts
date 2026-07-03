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
    expect(resolveLeaderLaunchLaneView("members")).toMatchObject({
      coreView: "events",
      parkedNotice: null,
    });
    expect(resolveLeaderLaunchLaneView("leaderboard")).toMatchObject({
      coreView: "leaderboard",
      parkedNotice: null,
    });
  });

  it("parks committee detail into the leader events lane", () => {
    expect(resolveLeaderLaunchLaneView("committees")).toMatchObject({
      coreView: "events",
      parkedNotice: {
        eyebrow: "Committee lane parked",
      },
    });
  });

  it("parks story and proof-adjacent views into the leader points lane", () => {
    expect(resolveLeaderLaunchLaneView("impact")).toMatchObject({
      coreView: "leaderboard",
    });
    expect(resolveLeaderLaunchLaneView("bridge_videos")).toMatchObject({
      coreView: "leaderboard",
    });
    expect(resolveLeaderLaunchLaneView("feed_analytics")).toMatchObject({
      coreView: "leaderboard",
    });
  });

  it("parks member-profile and succession views into the attendance lane", () => {
    expect(resolveLeaderLaunchLaneView("member_profile")).toMatchObject({
      coreView: "events",
    });
    expect(resolveLeaderLaunchLaneView("succession")).toMatchObject({
      coreView: "events",
    });
  });

  it("canonicalizes parked and alias views back to the core leader tabs", () => {
    expect(getLeaderLaunchLaneCanonicalHref({ view: "members" })).toBe(
      "/leader?view=events",
    );
    expect(getLeaderLaunchLaneCanonicalHref({ view: "committees" })).toBe(
      "/leader?view=events",
    );
    expect(
      getLeaderLaunchLaneCanonicalHref({
        view: "bridge_videos",
        event: "chapter-event-ucla",
      }),
    ).toBe("/leader?view=leaderboard&event=chapter-event-ucla");
    expect(getLeaderLaunchLaneCanonicalHref({ view: "events" })).toBeNull();
  });
});
