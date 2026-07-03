import { describe, expect, it } from "vitest";

import {
  getStaffLaunchLaneCanonicalHref,
  resolveStaffLaunchLaneView,
} from "@/services/staff-launch-lane";

describe("staff launch lane", () => {
  it("keeps the core staff views unchanged", () => {
    expect(resolveStaffLaunchLaneView("chapters")).toMatchObject({
      coreView: "chapters",
      parkedNotice: null,
    });
    expect(resolveStaffLaunchLaneView("campaigns")).toMatchObject({
      coreView: "events",
      parkedNotice: null,
    });
    expect(resolveStaffLaunchLaneView("leaderboard")).toMatchObject({
      coreView: "points",
      parkedNotice: null,
    });
  });

  it("parks support detail inside the chapter list", () => {
    expect(resolveStaffLaunchLaneView("chapter_detail")).toMatchObject({
      coreView: "chapters",
      parkedNotice: {
        eyebrow: "Support lane parked",
      },
    });
    expect(resolveStaffLaunchLaneView("support_notes")).toMatchObject({
      coreView: "chapters",
    });
  });

  it("parks proof and content lanes inside the points view", () => {
    expect(resolveStaffLaunchLaneView("proof_ugc")).toMatchObject({
      coreView: "points",
      parkedNotice: {
        eyebrow: "Story lane parked",
      },
    });
    expect(resolveStaffLaunchLaneView("feed_studio")).toMatchObject({
      coreView: "points",
    });
    expect(resolveStaffLaunchLaneView("feed_analytics")).toMatchObject({
      coreView: "points",
    });
    expect(resolveStaffLaunchLaneView("best_practices")).toMatchObject({
      coreView: "points",
    });
  });

  it("parks external systems back inside the chapter list", () => {
    expect(resolveStaffLaunchLaneView("hubspot")).toMatchObject({
      coreView: "chapters",
      parkedNotice: {
        eyebrow: "External systems parked",
      },
    });
    expect(resolveStaffLaunchLaneView("admin")).toMatchObject({
      coreView: "chapters",
    });
  });

  it("canonicalizes parked and alias views back to the core staff tabs", () => {
    expect(getStaffLaunchLaneCanonicalHref({ view: "campaigns" })).toBe(
      "/staff?view=events",
    );
    expect(getStaffLaunchLaneCanonicalHref({ view: "points" })).toBe(
      "/staff?view=leaderboard",
    );
    expect(
      getStaffLaunchLaneCanonicalHref({
        view: "proof_ugc",
        event: "chapter-event-ucla",
      }),
    ).toBe("/staff?view=leaderboard&event=chapter-event-ucla");
    expect(getStaffLaunchLaneCanonicalHref({ view: "chapters" })).toBeNull();
  });
});
