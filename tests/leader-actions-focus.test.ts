import { describe, expect, it } from "vitest";
import { getLeaderActionsFocus } from "@/services/leader-actions-focus";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getVisibleAssignmentsForActor } from "@/services/role-visibility";

const data = getMockReadOnlyAppData("Testing leader actions focus.");

function getFocusFor(email: string) {
  const actor = getMockLocalActorContext(email);
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);

  return getLeaderActionsFocus(actor, data, visibleAssignments);
}

describe("leader actions focus", () => {
  it("frames President / VP assignment creation as an approval checkpoint", () => {
    const focus = getFocusFor("leader.a@mymedlife.test");

    expect(focus.canReadFocus).toBe(true);
    expect(focus.roleLabel).toBe("President / VP");
    expect(focus.primaryHref).toBe("/leader?view=attendance");
    expect(focus.secondaryHref).toBe("/leader?view=leaderboard");
    expect(focus.assignmentCreateTitle).toContain("approval checkpoint");
    expect(focus.safetyNote).toContain("event-and-points loop");
    expect(focus.items.map((item) => item.label)).toEqual([
      "Needs decision",
      "Active owners",
      "Write posture",
    ]);
  });

  it("frames E-Board assignment creation as owner and event execution planning", () => {
    const focus = getFocusFor("eboard.a@mymedlife.test");

    expect(focus.canReadFocus).toBe(true);
    expect(focus.roleLabel).toBe("E-Board Member");
    expect(focus.primaryHref).toBe("/leader?view=events");
    expect(focus.secondaryHref).toBe("/leader?view=attendance");
    expect(focus.assignmentCreateTitle).toContain("execution planning");
    expect(focus.safetyNote).toContain("event-and-points lane");
    expect(focus.items.map((item) => item.label)).toEqual([
      "Owners to move",
      "Proof follow-up",
      "Events linked",
    ]);
  });

  it("keeps generic chapter leaders readable without pretending they are President / VP or E-Board", () => {
    const focus = getFocusFor("committee.chair@mymedlife.test");

    expect(focus.canReadFocus).toBe(true);
    expect(focus.roleLabel).toBe("Chapter Leader");
    expect(focus.primaryHref).toBe("/leader?view=events");
    expect(focus.secondaryHref).toBe("/leader?view=leaderboard");
    expect(focus.assignmentCreateTitle).toBe("Assignment creation stays gated");
    expect(focus.safetyNote).toContain("external automation remain disabled");
  });

  it("hides the leader action focus from non-leader personas", () => {
    const focus = getFocusFor("member.a@mymedlife.test");

    expect(focus.canReadFocus).toBe(false);
    expect(focus.items).toEqual([]);
    expect(focus.safetyNote).toContain("No assignment save");
  });
});
