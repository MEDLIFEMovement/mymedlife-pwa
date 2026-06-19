import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getNickMvpReviewPacket } from "@/services/nick-mvp-review";

describe("Nick MVP review packet", () => {
  it("gives admin the final local review handoff without enabling launch actions", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getNickMvpReviewPacket(actor);

    expect(packet.canReadPacket).toBe(true);
    expect(packet.title).toBe("Nick final local MVP review packet");
    expect(packet.localReviewReady).toBe(true);
    expect(packet.liveLaunchReady).toBe(false);
    expect(packet.browserWritesExpected).toBe(0);
    expect(packet.externalWritesExpected).toBe(0);
    expect(packet.studentInvitationsExpected).toBe(0);
    expect(packet.counts.reviewItems).toBe(9);
    expect(packet.counts.blockedBeforeLaunch).toBe(5);
    expect(packet.reviewItems.map((item) => item.route)).toEqual([
      "/admin/review-path",
      "/rush-month",
      "/rush-month/dashboard",
      "/coach",
      "/admin/database-security",
      "/admin/launch-gate",
      "/admin/pilot-scope",
      "/admin/design-qa",
      "/admin/operations",
    ]);
    expect(
      packet.reviewItems.find((item) => item.key === "launch_gate")?.plainEnglish,
    ).toContain("Goal 150 evidence checklist");
    expect(
      packet.reviewItems.find((item) => item.key === "pilot_scope")?.passSignal,
    ).toContain("which external systems stay disabled");
  });

  it("keeps final decisions plain and conservative for DS review", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const packet = getNickMvpReviewPacket(actor);

    expect(packet.title).toBe("DS Admin Nick review packet");
    expect(packet.summary).toContain("live auth");
    expect(packet.summary).toContain("student invitations remain blocked");
    expect(
      packet.reviewItems.find((item) => item.key === "data_security"),
    ).toEqual(
      expect.objectContaining({
        reviewerActorEmail: "ds.admin@mymedlife.test",
        status: "blocked_before_live_launch",
        launchBoundary: expect.stringContaining("vendor switching"),
      }),
    );
    expect(packet.finalDecisionPrompts.join(" ")).toContain("do not approve");
    expect(packet.finalDecisionPrompts.join(" ")).toContain("pilot scope route");
  });

  it("hides the packet from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getNickMvpReviewPacket(member).canReadPacket).toBe(false);
    expect(getNickMvpReviewPacket(leader).reviewItems).toEqual([]);
    expect(getNickMvpReviewPacket(coach).counts.reviewItems).toBe(0);
  });
});
