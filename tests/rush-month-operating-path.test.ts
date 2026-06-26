import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData, type ReadOnlyAppData } from "@/services/read-only-app-data";
import { getRushMonthOperatingPathView } from "@/services/rush-month-operating-path";

const data = getMockReadOnlyAppData("Testing Rush Month operating path.");

describe("rush month operating path", () => {
  it("shows the full week and member focus inside the shared operating path", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const view = getRushMonthOperatingPathView(actor, data);

    expect(view.eyebrow).toBe("Current checkpoint: Make MEDLIFE visible on campus");
    expect(view.focusStepId).toBe("member-push");
    expect(view.steps).toHaveLength(5);
    expect(view.steps.find((step) => step.id === "open-home")?.stepState).toBe("complete");
    expect(view.steps.find((step) => step.id === "assign-eboard")?.stepState).toBe(
      "current",
    );
    expect(view.steps.find((step) => step.id === "member-push")?.summary).toContain(
      "The loop becomes real when a member can move work from not started to in progress.",
    );
    expect(view.summary).toContain("Current phase objective:");
    expect(view.summary).toContain("Exit signal:");
    expect(view.steps.find((step) => step.id === "member-push")?.isFocus).toBe(true);
    expect(view.boundaryNote).toContain("Members");
  });

  it("maps committee members to the student focus and committee chairs to leader focus", () => {
    const committeeMember = getRushMonthOperatingPathView(
      getMockLocalActorContext("committee.member@mymedlife.test"),
      data,
    );
    const committeeChair = getRushMonthOperatingPathView(
      getMockLocalActorContext("committee.chair@mymedlife.test"),
      data,
    );

    expect(committeeMember.focusStepId).toBe("member-push");
    expect(committeeChair.focusStepId).toBe("assign-eboard");
    expect(committeeChair.title).toContain("Keep the outreach owners moving");
  });

  it("moves President / VP focus to proof follow-up when chapter review is waiting", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const view = getRushMonthOperatingPathView(actor, data);

    expect(view.focusStepId).toBe("proof-pack");
    expect(view.title).toContain("Lead the week");
  });

  it("moves President / VP focus back to owner coverage when proof is not waiting", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const calmData: ReadOnlyAppData = {
      ...data,
      assignments: data.assignments.map((assignment) => ({
        ...assignment,
        status:
          assignment.id === "assign-eboard"
            ? "in_progress"
            : assignment.status === "submitted" || assignment.status === "changes_requested"
              ? "approved"
              : assignment.status,
      })),
    };
    const view = getRushMonthOperatingPathView(actor, calmData);

    expect(view.focusStepId).toBe("assign-eboard");
  });

  it("keeps coach attention on the final decision lane", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const view = getRushMonthOperatingPathView(actor, data);

    expect(view.focusStepId).toBe("coach-summary");
    expect(view.summary).toContain("coach decision");
  });

  it("hides the operating path for DS Admin while keeping the week label", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const view = getRushMonthOperatingPathView(actor, data);

    expect(view.eyebrow).toBe("Current checkpoint: Make MEDLIFE visible on campus");
    expect(view.focusStepId).toBeNull();
    expect(view.steps).toEqual([]);
    expect(view.boundaryNote).toContain("DS Admin");
  });
});
