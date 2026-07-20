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
    expect(workspace.title).toBe("Coach traveler readiness dashboard");
    expect(workspace.travelers).toHaveLength(1);
    expect(workspace.travelers[0]?.displayName).toBe("Daniel Kim");
    expect(workspace.bulkActionPreview).toContain("No Shopify or HubSpot write runs");
    expect(workspace.counts.browserWritesExpected).toBe(0);
    expect(workspace.counts.externalWritesExpected).toBe(0);
  });

  it("does not keep a selected traveler outside the active risk filter", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getSltTripPrepStaffWorkspace(actor, {
      riskFilter: "high",
      travelerId: "sofia-alvarez",
    });

    expect(workspace.travelers).toHaveLength(1);
    expect(workspace.selectedTraveler?.id).toBe("daniel-kim");
    expect(workspace.selectedTraveler?.riskLevel).toBe("high");
  });

  it("lets admin inspect a selected traveler with focus-specific highlights", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSltTripPrepStaffWorkspace(actor, {
      travelerId: "sofia-alvarez",
      focusFilter: "flights",
    });

    expect(workspace.selectedTraveler?.displayName).toBe("Sofia Alvarez");
    expect(workspace.selectedTravelerHighlights.join(" ")).toContain("return itinerary");
  });

  it("keeps members out of the staff dashboard", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getSltTripPrepStaffWorkspace(actor);

    expect(workspace.canReadDashboard).toBe(false);
    expect(workspace.selectedTraveler).toBeNull();
    expect(workspace.title).toContain("hidden");
  });
});
