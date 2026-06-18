import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  calculateReadinessScore,
  getSltTripPrepChecklistDetailWorkspace,
  getSltTripPrepChecklistWorkspace,
  getSltTripPrepWorkspace,
} from "@/services/slt-trip-prep-workspace";

describe("slt trip prep workspace", () => {
  it("builds a member-facing traveler trip prep workspace", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getSltTripPrepWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.traveler?.displayName).toBe("Sofia Alvarez");
    expect(workspace.title).toBe("Trip prep");
    expect(workspace.countdownLabel).toContain("July 18, 2026");
    expect(workspace.counts.checklistTotal).toBe(7);
    expect(workspace.counts.browserWritesExpected).toBe(0);
    expect(workspace.counts.externalWritesExpected).toBe(0);
    expect(workspace.sectionLinks.map((link) => link.href)).toEqual(
      expect.arrayContaining([
        "/slt-prep/checklist",
        "/slt-prep/payments",
        "/slt-prep/meetings",
        "/slt-prep/profile",
      ]),
    );
  });

  it("filters checklist items for follow-up versus complete views", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const needsAttention = getSltTripPrepChecklistWorkspace(actor, "needs_attention");
    const complete = getSltTripPrepChecklistWorkspace(actor, "complete");

    expect(needsAttention.items.every((item) => item.status !== "complete")).toBe(true);
    expect(complete.items.every((item) => item.status === "complete")).toBe(true);
    expect(needsAttention.counts.needsAttention).toBeGreaterThan(0);
  });

  it("returns checklist detail with preview-safe related links", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getSltTripPrepChecklistDetailWorkspace(actor, "flight-itinerary");

    expect(workspace?.canReadDetail).toBe(true);
    expect(workspace?.item?.title).toBe("Return itinerary upload");
    expect(workspace?.relatedLinks.map((link) => link.href)).toEqual(
      expect.arrayContaining(["/slt-prep/checklist", "/slt-prep/payments"]),
    );
    expect(workspace?.counts.browserWritesExpected).toBe(0);
    expect(workspace?.counts.externalWritesExpected).toBe(0);
  });

  it("keeps DS Admin out of traveler readiness", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getSltTripPrepWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(false);
    expect(workspace.traveler).toBeNull();
    expect(workspace.title).toContain("DS Admin");
  });

  it("calculates readiness scores from checklist posture", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getSltTripPrepWorkspace(actor);
    const score = calculateReadinessScore(workspace.traveler?.checklist ?? []);

    expect(score).toBe(workspace.readiness.score);
    expect(score).toBeGreaterThan(60);
    expect(score).toBeLessThan(80);
  });
});
