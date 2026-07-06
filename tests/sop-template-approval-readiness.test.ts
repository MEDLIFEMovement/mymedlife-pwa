import { describe, expect, it } from "vitest";

import {
  formatSopTemplateApprovalReadinessReport,
  getSopTemplateApprovalReadinessReport,
} from "@/services/sop-template-approval-readiness";

describe("sop template approval readiness", () => {
  it("defines the expected approval posture for each draft/live state", () => {
    const report = getSopTemplateApprovalReadinessReport();

    expect(report.states.map((state) => state.state)).toEqual([
      "draft",
      "reviewed",
      "scheduled",
      "live",
      "archived",
    ]);
    expect(report.states.find((state) => state.state === "draft"))
      .toMatchObject({
        canAffectLiveBehavior: false,
        countsAsRolloutEvidence: false,
      });
    expect(report.states.find((state) => state.state === "live"))
      .toMatchObject({
        canAffectLiveBehavior: true,
        countsAsRolloutEvidence: false,
      });
  });

  it("formats the operator-facing safety rules in plain english", () => {
    const output = formatSopTemplateApprovalReadinessReport(
      getSopTemplateApprovalReadinessReport(),
    );

    expect(output).toContain(
      "SOP/template approval readiness: REVIEW-ONLY SAFETY SPEC",
    );
    expect(output).toContain("DRAFT Draft template or SOP");
    expect(output).toContain("LIVE Live production content");
    expect(output).toContain(
      "Draft/template/SOP/sample markers do not count as production rollout evidence.",
    );
    expect(output).toContain(
      "Confirm production rollout packet, signed-in route proof, and invite-gate evidence remain unchanged by this content.",
    );
  });
});
