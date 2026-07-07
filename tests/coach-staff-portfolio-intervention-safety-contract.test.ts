import { describe, expect, it } from "vitest";

import {
  formatCoachStaffPortfolioInterventionSafetyContract,
  getCoachStaffPortfolioInterventionSafetyContract,
} from "@/services/coach-staff-portfolio-intervention-safety-contract";

describe("coach / staff portfolio intervention-boundary safety contract", () => {
  it("keeps portfolio and intervention surfaces review-only while acknowledging the localhost-only packet", () => {
    const contract = getCoachStaffPortfolioInterventionSafetyContract();

    expect(contract.validation.ready).toBe(true);
    expect(contract.currentLocalWritePaths.map((path) => path.route)).toEqual([
      "/admin/coach-write",
    ]);
    expect(
      contract.lanes.find((lane) => lane.key === "coach_portfolio_read_model"),
    ).toMatchObject({
      route: "/coach",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "staff_support_review_context"),
    ).toMatchObject({
      route: "/staff",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "localhost_only_coach_decision_packet"),
    ).toMatchObject({
      route: "/admin/coach-write",
      status: "implemented_local_only",
    });
  });

  it("pins intervention state, alerts, provider/read-model drift, and rollout evidence as blocked", () => {
    const contract = getCoachStaffPortfolioInterventionSafetyContract();

    expect(
      contract.lanes.find(
        (lane) => lane.key === "intervention_status_notes_and_recommendations",
      )?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No intervention status change save from preview state.",
        "No recommendation acceptance save.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "follow_up_tasks_alerts_and_exports")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No follow-up task creation from support review context.",
        "No outbox send, retry, replay, or export mutation.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "provider_sync_and_analytics_truth")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No HubSpot, Luma, Hootsuite, n8n, or warehouse row becomes operational truth for chapter support.",
        "No fake user, invite, membership, points, or proof creation from provider/read-model rows.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_proof_and_rollout_evidence")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No localhost packet screenshot or preview readback counts as rollout evidence.",
        "No downstream analytics or provider export counts as final invite-gate truth.",
      ]),
    );
  });

  it("formats the contract in plain English for operators", () => {
    const output = formatCoachStaffPortfolioInterventionSafetyContract();

    expect(output).toContain(
      "Coach / staff portfolio intervention-boundary safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("/admin/coach-write");
    expect(output).toContain("hosted-blocked now: yes");
    expect(output).toContain("Coach support notes and intervention-checklist boundary");
    expect(output).toContain("Provider sync and analytics/read-model truth boundary");
    expect(output).toContain(
      "Staff and coach roles can inspect support context only unless a separate approved write lane exists.",
    );
    expect(output).toContain(
      "A separate approved lane for alert delivery, outbox retries/replays, provider sync, and export execution.",
    );
  });
});
