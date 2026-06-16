import { describe, expect, it } from "vitest";
import { getLeaderEvidenceFollowUpBoard } from "@/services/leader-evidence-follow-up";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("leader evidence follow-up", () => {
  it("separates leader follow-up from HQ sharing review for chapter leaders", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const board = getLeaderEvidenceFollowUpBoard(actor);

    expect(board.canReadBoard).toBe(true);
    expect(board.canHqDecide).toBe(false);
    expect(board.title).toBe("Leader evidence follow-up");
    expect(board.rows.map((row) => [row.assignmentId, row.lane])).toEqual([
      ["open-home", "closed_internal"],
      ["assign-eboard", "hq_review"],
      ["member-push", "member_follow_up"],
      ["proof-pack", "member_follow_up"],
    ]);
    expect(board.counts).toEqual(
      expect.objectContaining({
        total: 4,
        memberFollowUp: 2,
        hqReview: 1,
        closedInternal: 1,
        leaderActionsEnabled: 0,
        hqSharingWritesEnabled: 0,
        externalExportsEnabled: 0,
      }),
    );
  });

  it("flags member proof gaps as leader-nudge-only future work", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const board = getLeaderEvidenceFollowUpBoard(actor);
    const memberPush = board.rows.find((row) => row.assignmentId === "member-push");

    expect(memberPush).toEqual(
      expect.objectContaining({
        lane: "member_follow_up",
        statusLabel: "Proof needed",
        canLeaderNudge: true,
        canHqDecide: false,
        externalPosture: "disabled",
      }),
    );
    expect(memberPush?.leaderNextStep).toContain("Nudge the owner");
    expect(memberPush?.hqBoundary).toContain("HQ still decides");
  });

  it("lets coaches inspect evidence follow-up as a chapter-health signal", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const board = getLeaderEvidenceFollowUpBoard(actor);
    const coachSummary = board.rows.find((row) => row.assignmentId === "coach-summary");

    expect(board.canReadBoard).toBe(true);
    expect(board.title).toBe("Evidence follow-up as a coaching signal");
    expect(coachSummary).toEqual(
      expect.objectContaining({
        lane: "not_ready",
        statusLabel: "Action not ready",
        canLeaderNudge: false,
        canHqDecide: false,
      }),
    );
  });

  it("lets HQ admin inspect the board without enabling external sharing writes", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const board = getLeaderEvidenceFollowUpBoard(actor);
    const hqReviewRow = board.rows.find((row) => row.assignmentId === "assign-eboard");

    expect(board.canReadBoard).toBe(true);
    expect(board.canHqDecide).toBe(true);
    expect(hqReviewRow).toEqual(
      expect.objectContaining({
        lane: "hq_review",
        canHqDecide: true,
        externalPosture: "disabled",
      }),
    );
    expect(board.counts.hqSharingWritesEnabled).toBe(0);
    expect(board.counts.externalExportsEnabled).toBe(0);
  });

  it("hides leader follow-up from members and DS Admin", () => {
    const member = getLeaderEvidenceFollowUpBoard(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    const dsAdmin = getLeaderEvidenceFollowUpBoard(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
    );

    expect(member.canReadBoard).toBe(false);
    expect(member.rows).toEqual([]);
    expect(member.summary).toContain("Members see their own proof status");
    expect(dsAdmin.canReadBoard).toBe(false);
    expect(dsAdmin.rows).toEqual([]);
    expect(dsAdmin.summary).toContain("should not read student proof follow-up");
  });

  it("names future structured events and keeps outbox destinations disabled", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const board = getLeaderEvidenceFollowUpBoard(actor);

    expect(board.futureStructuredEvents).toEqual(
      expect.arrayContaining([
        "leader_evidence_follow_up_viewed",
        "evidence_submitted",
        "hq_proof_review_requested",
        "automation_outbox_recorded",
        "audit_log_recorded",
      ]),
    );
    expect(
      board.disabledOutboxDestinations.every((destination) =>
        destination.includes("disabled"),
      ),
    ).toBe(true);
    expect(board.safetyNotes.join(" ")).toContain("does not send nudges");
  });
});
