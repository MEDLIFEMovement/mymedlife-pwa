import { describe, expect, it } from "vitest";
import { getCampaignCloseoutReadiness } from "@/services/campaign-closeout-readiness";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData, type ReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing campaign closeout readiness.");

describe("campaign closeout readiness", () => {
  it("gives leaders a closeout readiness board with disabled writes and exports", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const closeout = getCampaignCloseoutReadiness(actor, data);

    expect(closeout.canReadCloseout).toBe(true);
    expect(closeout.title).toBe("Leader closeout readiness");
    expect(closeout.counts.totalAssignments).toBe(data.assignments.length);
    expect(closeout.counts.closeoutWritesEnabled).toBe(0);
    expect(closeout.counts.externalExportsEnabled).toBe(0);
    expect(closeout.rows.map((row) => row.key)).toEqual([
      "assignments",
      "proof",
      "events",
      "coach",
    ]);
  });

  it("hides closeout details from members", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const closeout = getCampaignCloseoutReadiness(actor, data);

    expect(closeout.canReadCloseout).toBe(false);
    expect(closeout.rows).toEqual([]);
    expect(closeout.summary).toContain("Members see simple progress");
  });

  it("maps committee members to hidden closeout and committee chairs to leader closeout", () => {
    const committeeMember = getCampaignCloseoutReadiness(
      getMockLocalActorContext("committee.member@mymedlife.test"),
      data,
    );
    const committeeChair = getCampaignCloseoutReadiness(
      getMockLocalActorContext("committee.chair@mymedlife.test"),
      data,
    );

    expect(committeeMember.canReadCloseout).toBe(false);
    expect(committeeChair.canReadCloseout).toBe(true);
    expect(committeeChair.title).toBe("Leader closeout readiness");
  });

  it("hides closeout details from DS Admin", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const closeout = getCampaignCloseoutReadiness(actor, data);

    expect(closeout.canReadCloseout).toBe(false);
    expect(closeout.counts.totalAssignments).toBe(0);
  });

  it("marks the phase advance-ready when assignments and proof are clear", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const readyData: ReadOnlyAppData = {
      ...data,
      assignments: data.assignments.map((assignment) => ({
        ...assignment,
        status: "approved",
      })),
      kpiSummary: {
        ...data.kpiSummary,
        proofPending: 0,
        coachDecision: "advance",
      },
    };
    const closeout = getCampaignCloseoutReadiness(actor, readyData);

    expect(closeout.canReadCloseout).toBe(true);
    expect(closeout.readinessState).toBe("advance_ready");
    expect(closeout.rows.find((row) => row.key === "assignments")?.status).toBe(
      "ready",
    );
    expect(closeout.rows.find((row) => row.key === "proof")?.status).toBe("ready");
    expect(closeout.rows.find((row) => row.key === "coach")?.status).toBe("ready");
  });

  it("marks intervention needed when the coach decision is intervene", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const interveneData: ReadOnlyAppData = {
      ...data,
      kpiSummary: {
        ...data.kpiSummary,
        coachDecision: "intervene",
      },
    };
    const closeout = getCampaignCloseoutReadiness(actor, interveneData);

    expect(closeout.readinessState).toBe("intervention_needed");
    expect(closeout.rows.find((row) => row.key === "coach")?.status).toBe("blocked");
  });
});
