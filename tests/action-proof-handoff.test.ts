import { describe, expect, it } from "vitest";
import { assignments } from "@/data/mock-rush-month";
import { getActionProofHandoffWorkspace } from "@/services/action-proof-handoff";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("action proof handoff", () => {
  it("gives members a clear proof/testimonial next step for in-progress work", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getActionProofHandoffWorkspace(
      actor,
      requireAssignment("share-rush-flyer"),
    );

    expect(workspace.canReadHandoff).toBe(true);
    expect(workspace.canSubmitProof).toBe(true);
    expect(workspace.phase).toBe("prepare_story");
    expect(workspace.title).toContain("useful testimonial");
    expect(workspace.nextBestAction).toEqual({
      href: "/rush-month/actions/share-rush-flyer?step=submit#submit-evidence",
      label: "Open submit evidence",
    });
    expect(workspace.checklist).toEqual(
      expect.arrayContaining([
        "What happened, in plain English?",
        "Which student hesitation or concern does this proof answer?",
      ]),
    );
  });

  it("tells visible actors to start not-started work before proof", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getActionProofHandoffWorkspace(
      actor,
      requireAssignment("coach-summary"),
    );

    expect(workspace.canReadHandoff).toBe(true);
    expect(workspace.canSubmitProof).toBe(false);
    expect(workspace.phase).toBe("start_first");
    expect(workspace.title).toContain("Start the action");
    expect(workspace.nextBestAction).toEqual({
      href: "/rush-month/actions/coach-summary",
      label: "Start action first",
    });
    expect(workspace.roleNote).toContain("Coaches can read");
  });

  it("routes submitted proof posture to the HQ review lane", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const workspace = getActionProofHandoffWorkspace(
      actor,
      requireAssignment("assign-eboard"),
    );

    expect(workspace.phase).toBe("hq_review");
    expect(workspace.summary).toContain("MEDLIFE HQ");
    expect(workspace.nextBestAction.href).toBe("/rush-month/review");
  });

  it("helps action committee chairs revise proof context", () => {
    const actor = getMockLocalActorContext("committee.chair@mymedlife.test");
    const workspace = getActionProofHandoffWorkspace(
      actor,
      requireAssignment("proof-pack"),
    );

    expect(workspace.phase).toBe("revise_context");
    expect(workspace.canSubmitProof).toBe(true);
    expect(workspace.roleNote).toContain("Action Committee Chair");
    expect(workspace.storyPrompt).toContain("hesitation");
  });

  it("keeps DS Admin out of assignment proof truth", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getActionProofHandoffWorkspace(
      actor,
      requireAssignment("member-push"),
    );

    expect(workspace.canReadHandoff).toBe(false);
    expect(workspace.canSubmitProof).toBe(false);
    expect(workspace.futureStructuredEvents).toEqual([]);
    expect(workspace.disabledOutboxDestinations).toEqual([]);
  });

  it("names future event records while keeping external destinations disabled", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getActionProofHandoffWorkspace(
      actor,
      requireAssignment("member-push"),
    );

    expect(workspace.futureStructuredEvents).toEqual(
      expect.arrayContaining([
        "proof_handoff_opened",
        "evidence_submitted",
        "proof_consent_recorded",
        "automation_outbox_recorded",
        "audit_log_recorded",
      ]),
    );
    expect(
      workspace.disabledOutboxDestinations.every((destination) =>
        destination.includes("disabled"),
      ),
    ).toBe(true);
    expect(workspace.safetyNotes.join(" ")).toContain("does not save proof");
  });
});

function requireAssignment(assignmentId: string) {
  const assignment = assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    throw new Error(`Missing mock assignment ${assignmentId}`);
  }

  return assignment;
}
