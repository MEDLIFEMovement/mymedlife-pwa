import { describe, expect, it } from "vitest";
import {
  assignments,
  integrationEvents,
  kpiEventRows,
  pointsEventRows,
} from "@/data/mock-rush-month";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  buildEventPointsLedger,
  getEventRsvpPosture,
  getPilotCrossRoleEventProof,
  getPilotEventLoopReadModel,
} from "@/services/event-loop";
import { getEventPlansForCampaign } from "@/services/campaign-ops-service";

describe("event loop facade", () => {
  it("gives one readable entrypoint for the points and KPI ledger", () => {
    const ledger = buildEventPointsLedger({
      assignments,
      integrationEvents,
      pointsEventRows,
      kpiEventRows,
    });

    expect(ledger.pointsSummary.earned).toBe(10);
    expect(ledger.kpiSummary.eventsLinked).toBe(1);
    expect(ledger.posture.leaderboard).toBe("mock_safe");
  });

  it("gives one readable entrypoint for member RSVP posture", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const eventPlan = getEventPlansForCampaign("rush-month").find(
      (item) => item.id === "event-rush-social-001",
    );

    expect(eventPlan).toBeDefined();

    const posture = getEventRsvpPosture(actor, eventPlan!);

    expect(posture.label).toBe("You're on the list");
    expect(posture.tone).toBe("mocked");
  });

  it("keeps the live pilot readback and cross-role proof under one module", () => {
    const readModel = getPilotEventLoopReadModel("staging");
    const proofCards = getPilotCrossRoleEventProof("staging");

    expect(readModel.summary.pointsAwarded).toBe(20);
    expect(readModel.summary.externalWritesEnabled).toBe(false);
    expect(proofCards).toHaveLength(4);
    expect(proofCards.map((card) => card.id)).toEqual([
      "member",
      "leader",
      "staff",
      "admin",
    ]);
  });
});
