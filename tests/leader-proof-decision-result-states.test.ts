import { describe, expect, it } from "vitest";
import { assignments, evidenceItems } from "@/data/mock-rush-month";
import {
  getDisabledLeaderProofDecisionResultPreview,
  getFutureLeaderProofDecisionResultIfEnabled,
  getLeaderProofDecisionResultState,
  getLeaderProofDecisionResultStates,
} from "@/services/leader-proof-decision-result-states";
import { getMockLocalActorContext } from "@/services/local-actor-context";

const approvalInput = {
  decision: "approve",
  note: "Proof has enough context to count for the chapter action.",
} as const;

describe("leader proof decision result states", () => {
  it("defines plain-English outcomes for chapter proof decisions", () => {
    const states = getLeaderProofDecisionResultStates();

    expect(states.map((state) => state.code)).toEqual([
      "proof_approved",
      "changes_requested",
      "proof_rejected",
      "write_disabled",
      "points_disabled",
      "already_approved",
      "permission_denied",
      "missing_auth",
      "evidence_not_found",
      "proof_not_submitted",
      "note_too_short",
      "server_error",
    ]);
    expect(states.every((state) => state.plainEnglishMessage.length > 30)).toBe(true);
    expect(states.every((state) => state.publishesProof === false)).toBe(true);
  });

  it("keeps the current browser leader decision result disabled", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const assignment = requireAssignment("assign-eboard");
    const evidenceItem = requireEvidenceItem("evidence-assign-eboard");
    const preview = getDisabledLeaderProofDecisionResultPreview(
      actor,
      assignment,
      evidenceItem,
      approvalInput,
    );

    expect(preview.operation).toBe("leader_proof_decision");
    expect(preview.currentResult.code).toBe("write_disabled");
    expect(preview.currentResult.createsPointsEvent).toBe(false);
    expect(preview.currentResult.createsKpiEvent).toBe(false);
    expect(preview.currentResult.createsOutboxItem).toBe(false);
    expect(preview.serverResultShape).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "write_disabled",
        assignmentId: "assign-eboard",
        evidenceItemId: "evidence-assign-eboard",
      }),
    );
  });

  it("previews leader approval with points and KPI events but no publishing", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const assignment = requireAssignment("assign-eboard");
    const evidenceItem = requireEvidenceItem("evidence-assign-eboard");

    expect(
      getFutureLeaderProofDecisionResultIfEnabled(
        actor,
        assignment,
        evidenceItem,
        approvalInput,
      ),
    ).toEqual(
      expect.objectContaining({
        code: "proof_approved",
        structuredEvent: "evidence_approved",
        auditAction: "leader_proof_approved",
        createsApproval: true,
        createsPointsEvent: true,
        createsKpiEvent: true,
        createsOutboxItem: true,
        publishesProof: false,
        success: true,
      }),
    );
  });

  it("maps request-changes and reject decisions to explicit outcomes", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const assignment = requireAssignment("assign-eboard");
    const evidenceItem = requireEvidenceItem("evidence-assign-eboard");

    expect(
      getFutureLeaderProofDecisionResultIfEnabled(actor, assignment, evidenceItem, {
        decision: "request_changes",
        note: "Needs clearer owner context before it can count.",
      }),
    ).toEqual(
      expect.objectContaining({
        code: "changes_requested",
        structuredEvent: "evidence_changes_requested",
        createsPointsEvent: false,
      }),
    );
    expect(
      getFutureLeaderProofDecisionResultIfEnabled(actor, assignment, evidenceItem, {
        decision: "reject",
        note: "This proof does not match the assigned action.",
      }),
    ).toEqual(
      expect.objectContaining({
        code: "proof_rejected",
        structuredEvent: "evidence_rejected",
        createsKpiEvent: false,
      }),
    );
  });

  it("allows Super Admin support but blocks member, coach, Admin, and DS Admin", () => {
    const assignment = requireAssignment("assign-eboard");
    const evidenceItem = requireEvidenceItem("evidence-assign-eboard");

    expect(
      getFutureLeaderProofDecisionResultIfEnabled(
        getMockLocalActorContext("super.admin@mymedlife.test"),
        assignment,
        evidenceItem,
        approvalInput,
      ),
    ).toEqual(expect.objectContaining({ code: "proof_approved" }));

    for (const email of [
      "member.a@mymedlife.test",
      "coach@mymedlife.test",
      "admin@mymedlife.test",
      "ds.admin@mymedlife.test",
    ]) {
      expect(
        getFutureLeaderProofDecisionResultIfEnabled(
          getMockLocalActorContext(email),
          assignment,
          evidenceItem,
          approvalInput,
        ),
      ).toEqual(
        expect.objectContaining({
          code: "permission_denied",
          createsApproval: false,
        }),
      );
    }
  });

  it("blocks missing proof, duplicate approval, and thin notes", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");

    expect(
      getFutureLeaderProofDecisionResultIfEnabled(
        actor,
        requireAssignment("member-push"),
        null,
        approvalInput,
      ),
    ).toEqual(expect.objectContaining({ code: "proof_not_submitted" }));
    expect(
      getFutureLeaderProofDecisionResultIfEnabled(
        actor,
        requireAssignment("open-home"),
        {
          ...requireEvidenceItem("evidence-assign-eboard"),
          status: "approved",
        },
        approvalInput,
      ),
    ).toEqual(expect.objectContaining({ code: "already_approved" }));
    expect(
      getFutureLeaderProofDecisionResultIfEnabled(
        actor,
        requireAssignment("assign-eboard"),
        requireEvidenceItem("evidence-assign-eboard"),
        {
          decision: "approve",
          note: "Short",
        },
      ),
    ).toEqual(expect.objectContaining({ code: "note_too_short", retryAllowed: true }));
  });

  it("documents the points-disabled non-write state", () => {
    expect(getLeaderProofDecisionResultState("points_disabled")).toEqual(
      expect.objectContaining({
        title: "Points and KPI writes are not turned on yet",
        createsPointsEvent: false,
        createsKpiEvent: false,
      }),
    );
  });
});

function requireAssignment(assignmentId: string) {
  const assignment = assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    throw new Error(`Missing mock assignment ${assignmentId}`);
  }

  return assignment;
}

function requireEvidenceItem(evidenceItemId: string) {
  const evidenceItem = evidenceItems.find((item) => item.id === evidenceItemId);

  if (!evidenceItem) {
    throw new Error(`Missing mock evidence item ${evidenceItemId}`);
  }

  return evidenceItem;
}
