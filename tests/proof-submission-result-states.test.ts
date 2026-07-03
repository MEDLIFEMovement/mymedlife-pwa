import { describe, expect, it } from "vitest";
import { assignments } from "@/data/mock-rush-month";
import type { ProofSubmissionInput } from "@/services/local-action-contracts";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getDisabledProofSubmissionResultPreview,
  getFutureProofSubmissionResultIfEnabled,
  getProofSubmissionResultState,
  getProofSubmissionResultStates,
} from "@/services/proof-submission-result-states";

const validProofInput = {
  evidenceType: "bridge_video",
  summary: "A student testimonial explaining why this action mattered.",
} as const satisfies ProofSubmissionInput;

describe("proof submission result states", () => {
  it("defines plain-English states for the future proof-save path", () => {
    const states = getProofSubmissionResultStates();

    expect(states.map((state) => state.code)).toEqual([
      "proof_submitted",
      "write_disabled",
      "upload_disabled",
      "action_not_ready",
      "accuracy_required",
      "already_submitted",
      "permission_denied",
      "missing_auth",
      "assignment_not_found",
      "summary_too_short",
      "server_error",
    ]);
    expect(states.every((state) => state.plainEnglishMessage.length > 30)).toBe(true);
    expect(states.every((state) => !state.plainEnglishMessage.includes("undefined"))).toBe(
      true,
    );
  });

  it("keeps the current browser proof result disabled", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = requireAssignment("member-push");
    const preview = getDisabledProofSubmissionResultPreview(
      actor,
      assignment,
      validProofInput,
    );

    expect(preview.operation).toBe("evidence_submitted");
    expect(preview.currentResult.code).toBe("write_disabled");
    expect(preview.currentResult.createsEvidenceItem).toBe(false);
    expect(preview.currentResult.createsOutboxItem).toBe(false);
    expect(preview.serverResultShape).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "write_disabled",
        assignmentId: "member-push",
      }),
    );
  });

  it("previews success for a started member action with enough proof context", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = requireAssignment("share-rush-flyer");

    expect(getFutureProofSubmissionResultIfEnabled(actor, assignment, validProofInput)).toEqual(
      expect.objectContaining({
        code: "proof_submitted",
        createsEvidenceItem: true,
        createsOutboxItem: true,
        success: true,
      }),
    );
  });

  it("blocks proof before an action has started", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = requireAssignment("member-push");

    expect(getFutureProofSubmissionResultIfEnabled(actor, assignment, validProofInput)).toEqual(
      expect.objectContaining({
        code: "action_not_ready",
        retryAllowed: true,
      }),
    );
  });

  it("blocks duplicate proof for submitted or approved actions", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const submittedAssignment = requireAssignment("assign-eboard");
    const approvedAssignment = requireAssignment("open-home");

    expect(
      getFutureProofSubmissionResultIfEnabled(actor, submittedAssignment, validProofInput),
    ).toEqual(
      expect.objectContaining({
        code: "already_submitted",
        createsEvidenceItem: false,
      }),
    );
    expect(
      getFutureProofSubmissionResultIfEnabled(actor, approvedAssignment, validProofInput),
    ).toEqual(
      expect.objectContaining({
        code: "already_submitted",
        createsEvidenceItem: false,
      }),
    );
  });

  it("blocks DS Admin from submitting student proof truth", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const assignment = requireAssignment("member-push");

    expect(getFutureProofSubmissionResultIfEnabled(actor, assignment, validProofInput)).toEqual(
      expect.objectContaining({
        code: "permission_denied",
        retryAllowed: false,
      }),
    );
  });

  it("requires proof context before any future save", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = requireAssignment("member-push");

    expect(
      getFutureProofSubmissionResultIfEnabled(actor, assignment, {
        ...validProofInput,
        summary: "Too short",
      }),
    ).toEqual(
      expect.objectContaining({
        code: "summary_too_short",
        retryAllowed: true,
      }),
    );
  });

  it("keeps upload-disabled as a documented non-write state", () => {
    expect(getProofSubmissionResultState("upload_disabled")).toEqual(
      expect.objectContaining({
        title: "File uploads are not turned on yet",
        createsEvidenceItem: false,
        createsOutboxItem: false,
      }),
    );
  });

  it("requires an accuracy confirmation before save", () => {
    expect(getProofSubmissionResultState("accuracy_required")).toEqual(
      expect.objectContaining({
        title: "Confirm the proof is accurate first",
        retryAllowed: true,
        createsEvidenceItem: false,
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
