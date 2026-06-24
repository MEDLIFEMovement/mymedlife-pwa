import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getPhase2CloseoutReview } from "@/services/phase-2-closeout-review";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("phase 2 closeout review", () => {
  it("gives admin one review-first route for the remaining Phase 2 packet decisions", () => {
    const review = getPhase2CloseoutReview(
      getMockLocalActorContext("admin@mymedlife.test"),
      getMockReadOnlyAppData("Testing Phase 2 closeout review."),
    );

    expect(review.canReadReview).toBe(true);
    expect(review.title).toBe("Admin Phase 2 closeout review");
    expect(review.packetPath).toBe(
      "docs/review/2026-06-24-phase-2-live-mvp-pilot-closeout-packet.md",
    );
    expect(review.counts.lanes).toBe(7);
    expect(review.counts.reviewNow).toBeGreaterThan(0);
    expect(review.counts.awaitingHumanConfirmation).toBeGreaterThan(0);
    expect(review.counts.blockedBeforePilot).toBeGreaterThan(0);
    expect(review.counts.browserWritesExpected).toBe(0);
    expect(review.counts.externalWritesExpected).toBe(0);
    expect(review.approvalReplyHint).toContain("Human approval is still required");
    expect(review.approvalReplyBlock.join("\n")).toContain(
      "Pilot chapter: UCLA MEDLIFE",
    );

    const laneHrefs = review.lanes.map((lane) => lane.href);
    expect(laneHrefs).toEqual(
      expect.arrayContaining([
        "/admin/release-readiness",
        "/admin/staff-dry-run",
        "/admin/design-qa",
        "/onboarding",
        "/admin/pilot-scope",
        "/admin/first-write",
        "/admin",
      ]),
    );

    expect(
      review.lanes.find((lane) => lane.key === "pilot_scope")?.evidence.join(" "),
    ).toContain("UCLA MEDLIFE");
    expect(
      review.lanes.find((lane) => lane.key === "pilot_scope")?.evidence.join(" "),
    ).toContain("owner slots");
    expect(
      review.lanes.find((lane) => lane.key === "first_hosted_write")?.summary,
    ).toContain("action_started");
    expect(review.reviewerAction).toContain("approved as written");
  });

  it("shrinks the remaining human-decision list when pilot owners are already recorded", () => {
    const originalRollback = process.env.MYMEDLIFE_PILOT_ROLLBACK_OWNER;
    const originalSupport = process.env.MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL;
    const originalCoach = process.env.MYMEDLIFE_PILOT_COACH_OWNER;
    const originalDs = process.env.MYMEDLIFE_PILOT_DS_OWNER;
    const originalHq = process.env.MYMEDLIFE_PILOT_HQ_ADMIN_OWNER;
    const originalChapterLeader = process.env.MYMEDLIFE_PILOT_CHAPTER_LEADER_OWNER;

    process.env.MYMEDLIFE_PILOT_ROLLBACK_OWNER = "Kiomi Matsukawa";
    process.env.MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL = "#mymedlife-pilot-watch";
    process.env.MYMEDLIFE_PILOT_COACH_OWNER = "Priya Coach";
    process.env.MYMEDLIFE_PILOT_DS_OWNER = "Renato DS";
    process.env.MYMEDLIFE_PILOT_HQ_ADMIN_OWNER = "Maya HQ";
    process.env.MYMEDLIFE_PILOT_CHAPTER_LEADER_OWNER = "Jordan Chapter";

    try {
      const review = getPhase2CloseoutReview(
        getMockLocalActorContext("admin@mymedlife.test"),
        getMockReadOnlyAppData("Testing recorded Phase 2 approvals."),
      );

      expect(review.recordedAnswers).toEqual(
        expect.arrayContaining([
          "Rollback owner: Kiomi Matsukawa",
          "Support and pause channel: #mymedlife-pilot-watch",
        ]),
      );
      expect(review.requiredHumanDecisions.join(" ")).not.toContain(
        "support/pause channel",
      );
      expect(
        review.lanes.find((lane) => lane.key === "controlled_pilot_gate")?.evidence.join(" "),
      ).toContain("approval answers are already recorded");
    } finally {
      restoreEnv("MYMEDLIFE_PILOT_ROLLBACK_OWNER", originalRollback);
      restoreEnv("MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL", originalSupport);
      restoreEnv("MYMEDLIFE_PILOT_COACH_OWNER", originalCoach);
      restoreEnv("MYMEDLIFE_PILOT_DS_OWNER", originalDs);
      restoreEnv("MYMEDLIFE_PILOT_HQ_ADMIN_OWNER", originalHq);
      restoreEnv(
        "MYMEDLIFE_PILOT_CHAPTER_LEADER_OWNER",
        originalChapterLeader,
      );
    }
  });

  it("keeps member actors out of the Phase 2 closeout packet", () => {
    const review = getPhase2CloseoutReview(
      getMockLocalActorContext("member.a@mymedlife.test"),
      getMockReadOnlyAppData("Testing hidden Phase 2 closeout review."),
    );

    expect(review.canReadReview).toBe(false);
    expect(review.lanes).toEqual([]);
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
