import { describe, expect, it } from "vitest";
import { proofLibraryItems } from "@/data/mock-campaigns";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getProofSharingReviewBoard } from "@/services/proof-sharing-review";

describe("proof sharing review", () => {
  it("gives admins an HQ proof-sharing review board with publishing disabled", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const board = getProofSharingReviewBoard(actor, proofLibraryItems);

    expect(board.canReadBoard).toBe(true);
    expect(board.canDecideSharing).toBe(true);
    expect(board.title).toBe("HQ proof-sharing review");
    expect(board.counts.total).toBe(proofLibraryItems.length);
    expect(board.counts.publishActionsEnabled).toBe(0);
    expect(board.counts.externalExportsEnabled).toBe(0);
    expect(board.rows.every((row) => row.canBePublishedNow === false)).toBe(true);
    expect(board.rows.every((row) => row.externalExportPosture === "disabled")).toBe(
      true,
    );
  });

  it("classifies bridge videos and alumni UGC as needing consent or context", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const board = getProofSharingReviewBoard(actor, proofLibraryItems);
    const consentRows = board.rows.filter(
      (row) => row.reviewState === "needs_consent_or_context",
    );

    expect(consentRows.map((row) => row.proofType)).toEqual(
      expect.arrayContaining(["bridge_video", "alumni_ugc"]),
    );
    expect(board.rows[0]?.reviewState).toBe("needs_consent_or_context");
  });

  it("counts internal learning and future public candidates", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const board = getProofSharingReviewBoard(actor, proofLibraryItems);

    expect(board.counts.internalLearning).toBe(1);
    expect(board.counts.futurePublicCandidates).toBe(1);
    expect(board.title).toBe("Full local proof-sharing review");
  });

  it("lets leaders and coaches read posture without deciding sharing", () => {
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const leaderBoard = getProofSharingReviewBoard(leader, proofLibraryItems);
    const coachBoard = getProofSharingReviewBoard(coach, proofLibraryItems);

    expect(leaderBoard.canReadBoard).toBe(true);
    expect(leaderBoard.canDecideSharing).toBe(false);
    expect(coachBoard.canReadBoard).toBe(true);
    expect(coachBoard.canDecideSharing).toBe(false);
  });

  it("hides HQ proof-sharing review from members and DS Admin", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const memberBoard = getProofSharingReviewBoard(member, proofLibraryItems);
    const dsAdminBoard = getProofSharingReviewBoard(dsAdmin, proofLibraryItems);

    expect(memberBoard.canReadBoard).toBe(false);
    expect(memberBoard.rows).toEqual([]);
    expect(dsAdminBoard.canReadBoard).toBe(false);
    expect(dsAdminBoard.rows).toEqual([]);
  });
});
