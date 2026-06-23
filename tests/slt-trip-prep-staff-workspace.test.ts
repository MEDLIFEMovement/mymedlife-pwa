import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getSltTripPrepStaffWorkspace } from "@/services/slt-trip-prep-staff-workspace";

describe("slt trip prep staff workspace", () => {
  it("shows coach and staff a risk-filtered traveler dashboard", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getSltTripPrepStaffWorkspace(actor, {
      riskFilter: "high",
      focusFilter: "payments",
      bulkAction: "payment-follow-up",
    });

    expect(workspace.canReadDashboard).toBe(true);
    expect(workspace.title).toBe("Traveler Readiness Dashboard");
    expect(workspace.travelers).toHaveLength(1);
    expect(workspace.travelers[0]?.displayName).toBe("Daniel Kim");
    expect(workspace.travelers[0]?.detailHref).toBe(
      "/slt-prep/checklist/second-installment?source=staff&traveler=daniel-kim",
    );
    expect(workspace.travelers[0]?.detailLabel).toBe("Trip deposit and installment");
    expect(workspace.bulkActionPreview).toContain("No Shopify or HubSpot write runs");
    expect(workspace.counts.readyTravelers).toBe(0);
    expect(workspace.counts.needsAttentionTravelers).toBe(1);
    expect(workspace.counts.browserWritesExpected).toBe(0);
    expect(workspace.counts.externalWritesExpected).toBe(0);
  });

  it("lets admin inspect a selected traveler with focus-specific highlights", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSltTripPrepStaffWorkspace(actor, {
      travelerId: "sofia-alvarez",
      focusFilter: "flights",
    });

    expect(workspace.selectedTraveler?.displayName).toBe("Sofia Alvarez");
    expect(workspace.selectedTravelerHighlights).toHaveLength(3);
    expect(new Set(workspace.selectedTravelerHighlights).size).toBe(3);
    expect(workspace.selectedTravelerHighlights[0]).toBe(
      "Staff needs the final return itinerary upload before the travel plan can lock.",
    );
    expect(workspace.selectedTravelerHighlights[1]).toBe(
      "Shopify mock shows one remaining installment before the pre-departure clearance window.",
    );
    expect(workspace.selectedTravelerHighlights[2]).toContain("traveler upload");
    expect(workspace.selectedTravelerHighlights.join(" ")).toContain("return itinerary");
    expect(workspace.selectedTravelerDrilldown).toEqual({
      href: "/slt-prep/checklist/flight-itinerary?source=staff&traveler=sofia-alvarez",
      label: "Return itinerary upload",
      helper: "Outbound flight is confirmed, but the return segment still needs final traveler upload.",
    });
  });

  it("keeps members out of the staff dashboard", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getSltTripPrepStaffWorkspace(actor);

    expect(workspace.canReadDashboard).toBe(false);
    expect(workspace.selectedTraveler).toBeNull();
    expect(workspace.title).toContain("hidden");
  });

  it("keeps DS Admin out of the traveler-readiness dashboard", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getSltTripPrepStaffWorkspace(actor);

    expect(workspace.canReadDashboard).toBe(false);
    expect(workspace.travelers).toEqual([]);
  });
});
