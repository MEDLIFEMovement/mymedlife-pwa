import { describe, expect, it } from "vitest";
import { assignments, kpiSummary } from "@/data/mock-rush-month";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getWriteActivationReadinessSummary } from "@/services/write-activation-readiness";

describe("write activation readiness", () => {
  it("collects every first-write gate without enabling controls", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const summary = getWriteActivationReadinessSummary(actor, {
      assignments,
      coachDecision: kpiSummary.coachDecision,
    });

    expect(summary.operationCount).toBe(7);
    expect(summary.enabledControlCount).toBe(0);
    expect(summary.allControlsDisabled).toBe(true);
    expect(summary.items.map((item) => item.operation)).toEqual([
      "action_started",
      "action_assigned",
      "evidence_submitted",
      "hq_sharing_decision",
      "leader_proof_decision",
      "coach_decision_logged",
      "membership_approved",
    ]);
    expect(summary.items.every((item) => item.blockingLabels.length > 0)).toBe(true);
  });

  it("shows DS Admin can review posture without owning app write truth", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const summary = getWriteActivationReadinessSummary(actor, {
      assignments,
      coachDecision: kpiSummary.coachDecision,
    });

    expect(summary.items.every((item) => item.allowedByRole === false)).toBe(true);
    expect(summary.items.every((item) => item.enabledControl === false)).toBe(true);
    expect(
      summary.items.flatMap((item) => item.blockingLabels),
    ).toContain("Actor is allowed by the planned write matrix");
  });

  it("shows Admin owns HQ/coach posture but not student truth writes", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const summary = getWriteActivationReadinessSummary(actor, {
      assignments,
      coachDecision: kpiSummary.coachDecision,
    });
    const roleAllowedOperations = summary.items
      .filter((item) => item.allowedByRole)
      .map((item) => item.operation);

    expect(roleAllowedOperations).toEqual([
      "hq_sharing_decision",
      "coach_decision_logged",
      "membership_approved",
    ]);
    expect(summary.enabledControlCount).toBe(0);
  });

  it("does not enable controls when the local write env var is requested", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const summary = getWriteActivationReadinessSummary(
      actor,
      {
        assignments,
        coachDecision: kpiSummary.coachDecision,
      },
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      },
    );

    expect(summary.enabledControlCount).toBe(0);
    expect(summary.allControlsDisabled).toBe(true);
    expect(
      summary.items.flatMap((item) => item.blockingLabels),
    ).toContain("Browser write approval granted");
  });
});
