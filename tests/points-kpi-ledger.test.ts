import { describe, expect, it } from "vitest";
import {
  assignments,
  integrationEvents,
  kpiEventRows,
  pointsEventRows,
} from "@/data/mock-rush-month";
import { buildPointsKpiLedger } from "@/services/points-kpi-ledger";

describe("points and KPI ledger", () => {
  it("prefers seeded event rows when the read model has them", () => {
    const ledger = buildPointsKpiLedger({
      assignments,
      integrationEvents,
      pointsEventRows,
      kpiEventRows,
    });

    expect(ledger.pointsSummary).toEqual({
      earned: 10,
      available: 135,
      approvedActions: 1,
    });
    expect(ledger.kpiSummary).toEqual({
      invitePushes: 2,
      proofPending: 3,
      eventsLinked: 1,
      coachDecision: "intervene",
    });
    expect(ledger.posture).toEqual({
      points: "points_events",
      kpis: "kpi_events",
      leaderboard: "mock_safe",
    });
    expect(ledger.pointsEvents).toEqual([
      expect.objectContaining({
        assignmentId: "open-home",
        points: 10,
      }),
    ]);
    expect(ledger.kpiEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assignmentId: "member-push",
          metric: "students_invited",
          value: 2,
        }),
        expect.objectContaining({
          assignmentId: "welcome-table",
          metric: "leads_captured",
          value: 47,
        }),
        expect.objectContaining({
          assignmentId: "member-push",
          metric: "intro_gbm_rsvps",
          value: 23,
        }),
        expect.objectContaining({
          assignmentId: "share-rush-flyer",
          metric: "followups_completed",
          value: 18,
        }),
        expect.objectContaining({
          assignmentId: "proof-pack",
          metric: "new_members",
          value: 9,
        }),
      ]),
    );
  });

  it("falls back to assignment preview when ledger rows are absent", () => {
    const ledger = buildPointsKpiLedger({
      assignments,
      integrationEvents,
    });

    expect(ledger.pointsSummary).toEqual({
      earned: 10,
      available: 135,
      approvedActions: 1,
    });
    expect(ledger.kpiSummary).toEqual({
      invitePushes: 1,
      proofPending: 3,
      eventsLinked: 1,
      coachDecision: "intervene",
    });
    expect(ledger.posture).toEqual({
      points: "assignment_preview",
      kpis: "assignment_preview",
      leaderboard: "mock_safe",
    });
    expect(ledger.pointsEvents).toEqual([]);
    expect(ledger.kpiEvents).toEqual([]);
  });
});
