import { describe, expect, it } from "vitest";
import { assignments, evidenceItems } from "@/data/mock-rush-month";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberProofStatusWorkspace } from "@/services/member-proof-status";

describe("member proof status", () => {
  it("shows members their active action as proof needed", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getMemberProofStatusWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("What is happening with my proof?");
    expect(workspace.rows.map((row) => row.assignmentId)).toEqual(["member-push"]);
    expect(workspace.rows[0]).toEqual(
      expect.objectContaining({
        status: "proof_needed",
        statusLabel: "Proof needed",
        externalPosture: "disabled",
      }),
    );
    expect(workspace.counts).toEqual(
      expect.objectContaining({
        proofNeeded: 1,
        waitingHqReview: 0,
        publicPublishesEnabled: 0,
        externalExportsEnabled: 0,
      }),
    );
  });

  it("summarizes leader-visible pending and changes-requested proof", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const workspace = getMemberProofStatusWorkspace(actor);

    expect(workspace.rows.map((row) => [row.assignmentId, row.status])).toEqual([
      ["open-home", "proof_needed"],
      ["assign-eboard", "waiting_hq_review"],
      ["member-push", "proof_needed"],
      ["proof-pack", "changes_requested"],
    ]);
    expect(workspace.counts).toEqual(
      expect.objectContaining({
        proofNeeded: 2,
        waitingHqReview: 1,
        changesRequested: 1,
      }),
    );
  });

  it("tells coaches to start not-started coach work before proof", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getMemberProofStatusWorkspace(actor);
    const coachRow = workspace.rows.find((row) => row.assignmentId === "coach-summary");

    expect(coachRow).toEqual(
      expect.objectContaining({
        status: "action_not_ready",
        statusLabel: "Start action first",
      }),
    );
  });

  it("maps approved evidence to internal learning, not public publishing", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const workspace = getMemberProofStatusWorkspace(actor, assignments, [
      ...evidenceItems,
      {
        id: "evidence-member-push-approved",
        assignmentId: "member-push",
        submittedBy: "Maya Member",
        evidenceType: "testimonial_text",
        summary: "A useful member testimonial.",
        status: "approved",
      },
    ]);
    const row = workspace.rows.find((item) => item.assignmentId === "member-push");

    expect(row).toEqual(
      expect.objectContaining({
        status: "approved_internal",
        statusLabel: "Approved for internal learning",
        externalPosture: "disabled",
      }),
    );
    expect(workspace.counts.approvedInternal).toBe(1);
    expect(workspace.counts.publicPublishesEnabled).toBe(0);
  });

  it("keeps DS Admin out of student proof status", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getMemberProofStatusWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(false);
    expect(workspace.rows).toEqual([]);
    expect(workspace.title).toBe("Proof status hidden for DS Admin");
  });

  it("names future structured records and disabled destinations", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getMemberProofStatusWorkspace(actor);

    expect(workspace.futureStructuredEvents).toEqual(
      expect.arrayContaining([
        "evidence_submitted",
        "proof_status_viewed",
        "hq_proof_review_requested",
        "automation_outbox_recorded",
        "audit_log_recorded",
      ]),
    );
    expect(
      workspace.disabledOutboxDestinations.every((destination) =>
        destination.includes("disabled"),
      ),
    ).toBe(true);
    expect(workspace.safetyNotes.join(" ")).toContain("does not publish proof");
  });
});
