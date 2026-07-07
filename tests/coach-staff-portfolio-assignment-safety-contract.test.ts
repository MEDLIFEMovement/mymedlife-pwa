import { describe, expect, it } from "vitest";

import {
  formatCoachStaffPortfolioAssignmentSafetyContract,
  getCoachStaffPortfolioAssignmentSafetyContract,
} from "@/services/coach-staff-portfolio-assignment-safety-contract";

describe("coach / staff portfolio assignment safety contract", () => {
  it("keeps portfolio and support surfaces read-only while acknowledging narrow local write packets", () => {
    const contract = getCoachStaffPortfolioAssignmentSafetyContract();

    expect(contract.currentLocalWritePaths.map((path) => path.route)).toEqual([
      "/admin/coach-write",
      "/admin/users",
      "/admin/chapters",
    ]);
    expect(
      contract.lanes.find((lane) => lane.key === "coach_portfolio_preview"),
    ).toMatchObject({
      route: "/coach",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "staff_chapter_portfolio"),
    ).toMatchObject({
      route: "/staff",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "coach_decision_local_write"),
    ).toMatchObject({
      route: "/admin/coach-write",
      status: "implemented_local_only",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "admin_user_portfolio_assignment"),
    ).toMatchObject({
      route: "/admin/users",
      status: "implemented_local_only",
    });
  });

  it("makes the hosted-disable gap for admin access explicit", () => {
    const contract = getCoachStaffPortfolioAssignmentSafetyContract();

    expect(contract.validation.ready).toBe(false);
    expect(
      contract.validation.checks.find(
        (check) => check.key === "hosted_staging_blocks_admin_access_flag",
      ),
    ).toMatchObject({
      passed: false,
    });
    expect(
      contract.validation.checks.find(
        (check) => check.key === "hosted_production_blocks_admin_access_flag",
      ),
    ).toMatchObject({
      passed: false,
    });
    expect(
      contract.validation.checks.find(
        (check) => check.key === "hosted_staging_blocks_coach_decision_flag",
      ),
    ).toMatchObject({
      passed: true,
    });
  });

  it("pins forbidden fake-live behavior for risk, recommendations, provider sends, and rollout evidence", () => {
    const contract = getCoachStaffPortfolioAssignmentSafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "risk_and_recommendation_persistence")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No risk score save from visible staff cards.",
        "No recommendation acceptance save.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "provider_outbox_and_notifications")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No reminder email or SMS.",
        "No HubSpot task or note sync.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_rollout_evidence")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Test/Figma/sandbox/mock coach row counts as production rollout evidence.",
        "No localhost admin write screenshot counts as owner CSV apply proof.",
      ]),
    );
  });

  it("formats the contract in plain English for operators", () => {
    const output = formatCoachStaffPortfolioAssignmentSafetyContract();

    expect(output).toContain(
      "Coach / staff portfolio assignment-scope safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("/admin/coach-write");
    expect(output).toContain("/admin/users");
    expect(output).toContain("/admin/chapters");
    expect(output).toContain("hosted-blocked now: yes");
    expect(output).toContain("Coach support notes and intervention checklist");
    expect(output).toContain("Risk scoring and best-practice recommendation persistence");
    expect(output).toContain(
      "hosted_staging_blocks_admin_access_flag: Hosted staging should refuse the admin-access write flag before any live coach assignment or ownership change exists.",
    );
    expect(output).toContain(
      "Test/Figma/sandbox/mock coach rows, localhost packets, and preview readouts do not count as production rollout evidence or owner-packet proof.",
    );
  });
});
