import { describe, expect, it } from "vitest";
import { getChapterMemberRoleFocus } from "@/services/chapter-member-role-focus";
import { getChapterMembershipWorkspace } from "@/services/chapter-membership-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing chapter member role focus.");

function getFocusFor(email: string) {
  const actor = getMockLocalActorContext(email);
  const workspace = getChapterMembershipWorkspace(actor, data);

  return getChapterMemberRoleFocus(actor, workspace);
}

describe("chapter member role focus", () => {
  it("frames President / VP member management around role coverage and locked approvals", () => {
    const focus = getFocusFor("leader.a@mymedlife.test");

    expect(focus.canReadFocus).toBe(true);
    expect(focus.roleLabel).toBe("President / VP");
    expect(focus.primaryHref).toBe("/chapter/members");
    expect(focus.secondaryHref).toBe("/rush-month/review");
    expect(focus.title).toContain("chapter coverage");
    expect(focus.safetyNote).toContain("roster approvals");
    expect(focus.items.map((item) => item.label)).toEqual([
      "Join requests",
      "Thin roles",
      "Open approvals",
    ]);
  });

  it("frames E-Board member management around committee execution and owner follow-up", () => {
    const focus = getFocusFor("eboard.a@mymedlife.test");

    expect(focus.canReadFocus).toBe(true);
    expect(focus.roleLabel).toBe("E-Board Member");
    expect(focus.primaryHref).toBe("/rush-month/actions");
    expect(focus.secondaryHref).toBe("/action-committees");
    expect(focus.title).toContain("roster gaps");
    expect(focus.safetyNote).toContain("E-Board can coordinate");
    expect(focus.items.map((item) => item.label)).toEqual([
      "Open actions",
      "Proof follow-ups",
      "Committee members",
    ]);
  });

  it("keeps Action Committee Chair in generic chapter-leader roster guidance", () => {
    const focus = getFocusFor("committee.chair@mymedlife.test");

    expect(focus.canReadFocus).toBe(true);
    expect(focus.roleLabel).toBe("Chapter Leader");
    expect(focus.primaryHref).toBe("/chapter/members");
    expect(focus.secondaryHref).toBe("/rush-month/actions");
    expect(focus.safetyNote).toContain("read-only");
  });

  it("hides member role focus from non-leader personas", () => {
    const member = getFocusFor("member.a@mymedlife.test");
    const coach = getFocusFor("coach@mymedlife.test");

    expect(member.canReadFocus).toBe(false);
    expect(member.items).toEqual([]);
    expect(coach.canReadFocus).toBe(false);
    expect(coach.roleLabel).toBe("Coach");
  });
});
