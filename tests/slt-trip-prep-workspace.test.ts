import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  buildSltTripPrepRouteHref,
  calculateReadinessScore,
  getSltTripPrepMobileQuickNavItems,
  getSltTripPrepSubnavItems,
  getSltTripPrepChecklistDetailWorkspace,
  getSltTripPrepChecklistWorkspace,
  sltTripPrepMobileQuickNavItems,
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
        "/slt-prep/flights",
        "/slt-prep/meetings",
        "/slt-prep/profile",
      ]),
    );
    expect(workspace.notificationActions.map((action) => action.href)).toEqual([
      "/slt-prep/flights",
      "/slt-prep/meetings",
      "/slt-prep/payments",
      "/slt-prep/extensions",
    ]);
    expect(workspace.nextStep.href).toBe("/slt-prep/checklist/flight-itinerary?source=overview");
    expect(workspace.traveler?.alerts[0]?.href).toBe("/slt-prep/checklist/flight-itinerary");
    expect(workspace.traveler?.alerts[1]?.href).toBe("/slt-prep/checklist/second-installment");
    expect(workspace.traveler?.notifications[0]?.href).toBe("/slt-prep/checklist/flight-itinerary");
    expect(workspace.traveler?.notifications[1]?.href).toBe("/slt-prep/checklist/orientation-rsvp");
  });

  it("keeps selected-traveler overview alerts anchored to exact blocker details", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getSltTripPrepWorkspace(actor, "daniel-kim");

    expect(workspace.nextStep.href).toBe("/slt-prep/checklist/second-installment?source=overview");
    expect(workspace.traveler?.alerts.map((alert) => alert.href)).toEqual([
      "/slt-prep/checklist/second-installment",
      "/slt-prep/checklist/orientation-rsvp",
    ]);
    expect(workspace.traveler?.notifications[0]?.href).toBe(
      "/slt-prep/checklist/orientation-rsvp",
    );
  });

  it("keeps low-risk traveler alerts aligned with the actual remaining extension decision", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getSltTripPrepWorkspace(actor, "aria-patel");

    expect(workspace.traveler?.alerts[0]).toEqual(
      expect.objectContaining({
        label: "Only the optional extension decision is still open",
        href: "/slt-prep/checklist/extension-choice",
      }),
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

  it("tracks SLT checklist completion counts for traveler readiness", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getSltTripPrepChecklistWorkspace(actor, "all");

    expect(workspace.counts).toEqual({
      total: 7,
      complete: 2,
      needsAttention: 3,
      upcoming: 2,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    });
    expect(workspace.items.map((item) => item.id)).toEqual([
      "passport-proof",
      "medical-clearance",
      "trip-agreement",
      "second-installment",
      "flight-itinerary",
      "orientation-rsvp",
      "extension-choice",
    ]);
  });

  it("returns checklist detail with preview-safe related links", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getSltTripPrepChecklistDetailWorkspace(actor, "flight-itinerary");

    expect(workspace?.canReadDetail).toBe(true);
    expect(workspace?.item?.title).toBe("Return itinerary upload");
    expect(workspace?.relatedLinks.map((link) => link.href)).toEqual(
      [
        "/slt-prep/checklist",
        "/slt-prep/flights",
        "/slt-prep/timeline",
        "/slt-prep/profile",
        "/slt-prep/staff",
      ],
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

  it("exposes a trip-prep-specific mobile quick nav for traveler routes", () => {
    expect(sltTripPrepMobileQuickNavItems).toEqual([
      { href: "/slt-prep", label: "Home", helper: "Trip" },
      { href: "/slt-prep/checklist", label: "Trip Prep", helper: "Steps" },
      { href: "/slt-prep/timeline", label: "Events", helper: "Dates" },
      { href: "/slt-prep/profile", label: "Profile", helper: "Me" },
    ]);
  });

  it("can preserve the selected traveler across the SLT prep route family", () => {
    expect(buildSltTripPrepRouteHref("/slt-prep/profile#notification-actions", {
      travelerId: "sofia-alvarez",
    })).toBe("/slt-prep/profile?traveler=sofia-alvarez#notification-actions");
    expect(buildSltTripPrepRouteHref("/slt-prep/flights", {
      source: "notifications",
      travelerId: "sofia-alvarez",
    })).toBe("/slt-prep/flights?source=notifications&traveler=sofia-alvarez");
    expect(getSltTripPrepSubnavItems({ travelerId: "sofia-alvarez" })[0]?.href).toBe(
      "/slt-prep?traveler=sofia-alvarez",
    );
    expect(getSltTripPrepMobileQuickNavItems({ travelerId: "sofia-alvarez" })[3]?.href).toBe(
      "/slt-prep/profile?traveler=sofia-alvarez",
    );
    expect(
      getSltTripPrepSubnavItems({
        source: "staff",
        travelerId: "sofia-alvarez",
      })[7]?.href,
    ).toBe("/slt-prep/timeline?source=staff&traveler=sofia-alvarez");
    expect(
      getSltTripPrepMobileQuickNavItems({
        source: "notifications",
        travelerId: "sofia-alvarez",
      })[0]?.href,
    ).toBe("/slt-prep?source=notifications&traveler=sofia-alvarez");
  });
});
