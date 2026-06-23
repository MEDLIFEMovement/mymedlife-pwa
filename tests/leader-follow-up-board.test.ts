import { describe, expect, it } from "vitest";
import { getLeaderFollowUpBoard } from "@/services/leader-follow-up-board";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing leader follow-up board.");

describe("leader follow-up board", () => {
  it("gives chapter leaders a prioritized read-only follow-up queue", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const board = getLeaderFollowUpBoard(actor, data);

    expect(board.canReadBoard).toBe(true);
    expect(board.title).toBe("Leader follow-up board");
    expect(board.counts.total).toBe(6);
    expect(board.counts.needsFollowUp).toBe(5);
    expect(board.counts.readyToReview).toBe(2);
    expect(board.counts.remindersEnabled).toBe(0);
    expect(board.rows[0]?.status).toBe("submitted");
    expect(
      board.rows.some((row) => {
        return (
          row.status === "submitted" &&
          row.nextHref.startsWith("/rush-month/review?assignmentId=")
        );
      }),
    ).toBe(true);
    expect(
      board.rows.some((row) => {
        return (
          row.assignmentId === "share-rush-flyer" &&
          row.nextHref ===
            "/rush-month/actions?assignmentId=share-rush-flyer&source=leader_follow_up"
        );
      }),
    ).toBe(true);
    expect(board.rows.every((row) => row.reminderPosture === "disabled")).toBe(true);
  });

  it("keeps general members out of the leader follow-up board", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const board = getLeaderFollowUpBoard(actor, data);

    expect(board.canReadBoard).toBe(false);
    expect(board.rows).toEqual([]);
    expect(board.title).toContain("Members see their own actions");
  });

  it("treats committee members as part of the member-owned boundary", () => {
    const actor = getMockLocalActorContext("committee.member@mymedlife.test");
    const board = getLeaderFollowUpBoard(actor, data);

    expect(board.canReadBoard).toBe(false);
    expect(board.rows).toEqual([]);
    expect(board.title).toContain("Members see their own actions");
  });

  it("keeps DS Admin out of member follow-up truth", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const board = getLeaderFollowUpBoard(actor, data);

    expect(board.canReadBoard).toBe(false);
    expect(board.counts.total).toBe(0);
    expect(board.summary).toContain("assignment follow-up stays");
  });

  it("gives coaches a non-approved follow-up view for portfolio review", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const board = getLeaderFollowUpBoard(actor, data);

    expect(board.canReadBoard).toBe(true);
    expect(board.title).toBe("Coach-visible follow-up board");
    expect(board.rows.some((row) => row.assignmentId === "coach-summary")).toBe(true);
    expect(board.rows.every((row) => row.status !== "approved")).toBe(true);
  });

  it("treats committee chairs as part of the leader-owned follow-up surface", () => {
    const actor = getMockLocalActorContext("committee.chair@mymedlife.test");
    const board = getLeaderFollowUpBoard(actor, data);

    expect(board.canReadBoard).toBe(true);
    expect(board.title).toBe("Leader follow-up board");
    expect(board.counts.total).toBe(6);
  });

  it("gives admins proof/support posture without enabling reminders", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const board = getLeaderFollowUpBoard(actor, data);

    expect(board.canReadBoard).toBe(true);
    expect(board.title).toBe("HQ follow-up posture");
    expect(board.counts.remindersEnabled).toBe(0);
    expect(board.rows).toHaveLength(data.assignments.length);
  });

  it("gives super admin the full local board", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const board = getLeaderFollowUpBoard(actor, data);

    expect(board.canReadBoard).toBe(true);
    expect(board.title).toBe("Full local follow-up board");
    expect(board.rows).toHaveLength(data.assignments.length);
  });
});
