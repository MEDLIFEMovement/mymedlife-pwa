import { describe, expect, it } from "vitest";
import { getWriteResultStateCoverageSummary } from "@/services/write-result-state-coverage";

describe("write result-state coverage", () => {
  it("summarizes complete result-state coverage for first write candidates", () => {
    const summary = getWriteResultStateCoverageSummary();

    expect(summary).toEqual(
      expect.objectContaining({
        totalCandidateCount: 7,
        coveredCount: 7,
        missingCount: 0,
        allCandidatesCovered: true,
        browserWritesEnabled: false,
        externalWritesEnabled: false,
      }),
    );
  });

  it("marks assignment creation covered now that result states are defined", () => {
    const summary = getWriteResultStateCoverageSummary();
    const assignmentCreate = summary.items.find(
      (item) => item.operation === "action_assigned",
    );

    expect(assignmentCreate).toEqual(
      expect.objectContaining({
        route: "/rush-month/actions",
        status: "covered",
        externalWritesStayDisabled: true,
      }),
    );
    expect(assignmentCreate?.resultStateCount).toBeGreaterThan(0);
    expect(assignmentCreate?.blockedStateCount).toBeGreaterThan(0);
    expect(assignmentCreate?.nextAction).toContain("Keep disabled");
  });

  it("marks all reviewed result-state families as covered", () => {
    const summary = getWriteResultStateCoverageSummary();
    const coveredOperations = summary.items
      .filter((item) => item.status === "covered")
      .map((item) => item.operation);

    expect(coveredOperations).toEqual([
      "action_started",
      "action_assigned",
      "evidence_submitted",
      "leader_proof_decision",
      "hq_sharing_decision",
      "coach_decision_logged",
      "membership_approved",
    ]);
    expect(
      summary.items
        .filter((item) => item.status === "covered")
        .every((item) => item.resultStateCount > 0 && item.blockedStateCount > 0),
    ).toBe(true);
  });

  it("does not treat result-state coverage as write approval", () => {
    const summary = getWriteResultStateCoverageSummary();

    expect(summary.browserWritesEnabled).toBe(false);
    expect(summary.externalWritesEnabled).toBe(false);
    expect(summary.items.every((item) => item.externalWritesStayDisabled)).toBe(true);
  });

  it("marks membership approval covered without enabling membership writes", () => {
    const summary = getWriteResultStateCoverageSummary();
    const membershipApproval = summary.items.find(
      (item) => item.operation === "membership_approved",
    );

    expect(membershipApproval).toEqual(
      expect.objectContaining({
        route: "/chapter/members",
        status: "covered",
        externalWritesStayDisabled: true,
      }),
    );
    expect(membershipApproval?.notes).toContain("welcome-disabled");
    expect(membershipApproval?.notes).toContain("CRM-disabled");
    expect(membershipApproval?.nextAction).toContain("Keep disabled");
  });
});
