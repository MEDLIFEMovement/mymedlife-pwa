import { describe, expect, it } from "vitest";

import {
  getStaffLaunchLaneCanonicalHref,
  resolveStaffLaunchLaneView,
} from "@/services/staff-launch-lane";

describe("staff launch lane", () => {
  it("keeps the core staff views unchanged", () => {
    expect(resolveStaffLaunchLaneView("chapters")).toMatchObject({
      canonicalView: "chapters",
      parkedNotice: null,
    });
    expect(resolveStaffLaunchLaneView("campaigns")).toMatchObject({
      canonicalView: "campaigns",
      parkedNotice: null,
    });
    expect(resolveStaffLaunchLaneView("leaderboard")).toMatchObject({
      canonicalView: "leaderboard",
      parkedNotice: null,
    });
    expect(resolveStaffLaunchLaneView("proof_ugc")).toMatchObject({
      canonicalView: "proof_ugc",
      parkedNotice: null,
    });
    expect(resolveStaffLaunchLaneView("best_practices")).toMatchObject({
      canonicalView: "best_practices",
      parkedNotice: null,
    });
    expect(resolveStaffLaunchLaneView("sops")).toMatchObject({
      canonicalView: "sops",
      parkedNotice: null,
    });
    expect(resolveStaffLaunchLaneView("admin")).toMatchObject({
      canonicalView: "admin",
      parkedNotice: null,
    });
  });

  it("parks support detail inside the chapter list", () => {
    expect(resolveStaffLaunchLaneView("chapter_detail")).toMatchObject({
      canonicalView: "chapters",
      parkedNotice: {
        eyebrow: "Support lane parked",
      },
    });
    expect(resolveStaffLaunchLaneView("support_notes")).toMatchObject({
      canonicalView: "chapters",
    });
  });

  it("parks extra feed workflow aliases inside the Proof / UGC view", () => {
    expect(resolveStaffLaunchLaneView("feed_studio")).toMatchObject({
      canonicalView: "proof_ugc",
      parkedNotice: {
        eyebrow: "Story lane parked",
      },
    });
    expect(resolveStaffLaunchLaneView("feed_analytics")).toMatchObject({
      canonicalView: "proof_ugc",
    });
  });

  it("parks external systems back inside the chapter list", () => {
    expect(resolveStaffLaunchLaneView("hubspot")).toMatchObject({
      canonicalView: "chapters",
      parkedNotice: {
        eyebrow: "External systems parked",
      },
    });
  });

  it("keeps source-backed staff tabs stable while canonicalizing only aliases", () => {
    expect(getStaffLaunchLaneCanonicalHref({ view: "campaigns" })).toBeNull();
    expect(getStaffLaunchLaneCanonicalHref({ view: "proof_ugc" })).toBeNull();
    expect(getStaffLaunchLaneCanonicalHref({ view: "best_practices" })).toBeNull();
    expect(getStaffLaunchLaneCanonicalHref({ view: "sops" })).toBeNull();
    expect(getStaffLaunchLaneCanonicalHref({ view: "admin" })).toBeNull();
    expect(getStaffLaunchLaneCanonicalHref({ view: "points" })).toBe(
      "/staff?view=leaderboard",
    );
    expect(
      getStaffLaunchLaneCanonicalHref({
        view: "feed_studio",
        event: "chapter-event-ucla",
      }),
    ).toBe("/staff?view=proof_ugc&event=chapter-event-ucla");
    expect(getStaffLaunchLaneCanonicalHref({ view: "chapters" })).toBeNull();
  });
});
