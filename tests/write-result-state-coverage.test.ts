import { describe, expect, it } from "vitest";
import { getWriteResultStateCoverageSummary } from "@/services/write-result-state-coverage";

describe("write result-state coverage", () => {
  it("summarizes covered and missing result-state families for first write candidates", () => {
    const summary = getWriteResultStateCoverageSummary();

    expect(summary).toEqual(
      expect.objectContaining({
        totalCandidateCount: 5,
        coveredCount: 4,
        missingCount: 1,
        allCandidatesCovered: false,
        browserWritesEnabled: false,
        externalWritesEnabled: false,
      }),
    );
  });

  it("keeps assignment creation marked missing until its result states are defined", () => {
    const summary = getWriteResultStateCoverageSummary();
    const assignmentCreate = summary.items.find(
      (item) => item.operation === "action_assigned",
    );

    expect(assignmentCreate).toEqual(
      expect.objectContaining({
        route: "/rush-month/actions",
        status: "missing",
        resultStateCount: 0,
        successStateCount: 0,
        blockedStateCount: 0,
        externalWritesStayDisabled: true,
      }),
    );
    expect(assignmentCreate?.nextAction).toContain("assignment-create");
  });

  it("marks the four reviewed result-state families as covered", () => {
    const summary = getWriteResultStateCoverageSummary();
    const coveredOperations = summary.items
      .filter((item) => item.status === "covered")
      .map((item) => item.operation);

    expect(coveredOperations).toEqual([
      "action_started",
      "evidence_submitted",
      "hq_sharing_decision",
      "coach_decision_logged",
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
});
