import { describe, expect, it } from "vitest";
import { getLeaderEvidenceFollowUpBoard } from "@/services/leader-evidence-follow-up";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getLeaderReviewFocus } from "@/services/leader-review-focus";

function getFocusFor(email: string) {
  const actor = getMockLocalActorContext(email);
  const board = getLeaderEvidenceFollowUpBoard(actor);

  return getLeaderReviewFocus(actor, board);
}

describe("leader review focus", () => {
  it("frames President / VP proof review as accountability without HQ authority", () => {
    const focus = getFocusFor("leader.a@mymedlife.test");

    expect(focus.canReadFocus).toBe(true);
    expect(focus.roleLabel).toBe("President / VP");
    expect(focus.primaryHref).toBe("/rush-month/review");
    expect(focus.secondaryHref).toBe("/chapter/members");
    expect(focus.title).toContain("without taking over HQ sharing");
    expect(focus.safetyNote).toContain("HQ-only");
    expect(focus.items.map((item) => item.label)).toEqual([
      "HQ-ready",
      "Needs context",
      "Decision authority",
    ]);
  });

  it("frames E-Board proof review as owner and event follow-up", () => {
    const focus = getFocusFor("eboard.a@mymedlife.test");

    expect(focus.canReadFocus).toBe(true);
    expect(focus.roleLabel).toBe("E-Board Member");
    expect(focus.primaryHref).toBe("/rush-month/actions");
    expect(focus.secondaryHref).toBe("/rush-month/events");
    expect(focus.title).toContain("owner follow-up");
    expect(focus.safetyNote).toContain("HQ-only");
    expect(focus.items.map((item) => item.label)).toEqual([
      "Owners to nudge",
      "Ready for HQ",
      "External sends",
    ]);
  });

  it("keeps Action Committee Chair in generic chapter-leader review guidance", () => {
    const focus = getFocusFor("committee.chair@mymedlife.test");

    expect(focus.canReadFocus).toBe(true);
    expect(focus.roleLabel).toBe("Chapter Leader");
    expect(focus.primaryHref).toBe("/rush-month/review");
    expect(focus.secondaryHref).toBe("/rush-month/actions");
    expect(focus.safetyNote).toContain("HQ sharing decisions");
  });

  it("hides leader review focus from members and HQ operators", () => {
    const member = getFocusFor("member.a@mymedlife.test");
    const admin = getFocusFor("admin@mymedlife.test");

    expect(member.canReadFocus).toBe(false);
    expect(member.items).toEqual([]);
    expect(admin.canReadFocus).toBe(false);
    expect(admin.roleLabel).toBe("Staff");
  });
});
