import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData, type ReadOnlyAppData } from "@/services/read-only-app-data";
import { getRoleNextActionBrief } from "@/services/role-next-actions";

const data = getMockReadOnlyAppData("Testing role next actions.");

describe("role next actions", () => {
  it("points a member into the event-and-points loop", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("General Member");
    expect(brief.primaryHref).toBe("/app/events?source=home");
    expect(brief.primaryLabel).toBe("Open events");
    expect(brief.secondaryHref).toBe("/app/points?source=points");
    expect(brief.secondaryLabel).toBe("See my points");
    expect(brief.signals.map((signal) => signal.label)).toContain("Points earned");
    expect(brief.signals.find((signal) => signal.label === "Loop focus")?.value).toBe(
      "RSVP -> Attend",
    );
    expect(brief.safetyNote).toContain("read-only");
  });

  it("maps committee members to member next actions and committee chairs to leader guidance", () => {
    const committeeMember = getRoleNextActionBrief(
      getMockLocalActorContext("committee.member@mymedlife.test"),
      data,
    );
    const committeeChair = getRoleNextActionBrief(
      getMockLocalActorContext("committee.chair@mymedlife.test"),
      data,
    );

    expect(committeeMember.ownerLabel).toBe("General Member");
    expect(committeeMember.primaryHref).toBe("/app/events?source=home");
    expect(committeeChair.ownerLabel).toBe("Chapter Leader / E-Board");
    expect(committeeChair.primaryHref).toBe("/leader?view=events");
  });

  it("keeps President / VP inside attendance and points when follow-through is needed", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("President / VP");
    expect(brief.primaryHref).toBe("/leader?view=attendance");
    expect(brief.primaryLabel).toBe("Check attendance");
    expect(brief.secondaryHref).toBe("/leader?view=leaderboard");
    expect(
      brief.signals.find((signal) => signal.label === "Needs follow-through")?.value,
    ).toBe(
      "3",
    );
  });

  it("points President / VP to role coverage when no proof is waiting", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const calmData: ReadOnlyAppData = {
      ...data,
      assignments: data.assignments.map((assignment) => ({
        ...assignment,
        status: assignment.status === "approved" ? "approved" : "in_progress",
      })),
    };
    const brief = getRoleNextActionBrief(actor, calmData);

    expect(brief.primaryHref).toBe("/leader?view=events");
    expect(brief.primaryLabel).toBe("Open leader events");
    expect(brief.title).toContain("Check event readiness");
  });

  it("points E-Board to leader events and attendance", () => {
    const actor = getMockLocalActorContext("eboard.a@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("E-Board Member");
    expect(brief.primaryHref).toBe("/leader?view=events");
    expect(brief.primaryLabel).toBe("Open leader events");
    expect(brief.secondaryHref).toBe("/leader?view=attendance");
    expect(brief.safetyNote).toContain("Event, attendance, and points posture");
  });

  it("points a coach to the staff portfolio and org points", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("Coach");
    expect(brief.primaryHref).toBe("/staff?view=chapters");
    expect(brief.secondaryHref).toBe("/staff?view=leaderboard");
    expect(brief.title).toContain(data.kpiSummary.coachDecision);
    expect(brief.signals.find((signal) => signal.label === "Decision state")?.value).toBe(
      data.kpiSummary.coachDecision,
    );
  });

  it("keeps staff in the chapter event and points lane", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("Staff");
    expect(brief.primaryHref).toBe("/staff?view=chapters");
    expect(brief.secondaryHref).toBe("/admin");
    expect(brief.safetyNote).toContain("events and points");
  });

  it("keeps DS Admin on integration posture only", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("DS Admin");
    expect(brief.primaryHref).toBe("/admin");
    expect(brief.title).toContain("disabled outbox");
    expect(brief.signals.find((signal) => signal.label === "Student truth")?.value).toBe(
      "hidden",
    );
  });

  it("points super admin to oversight without treating visibility as approval", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("Super Admin");
    expect(brief.primaryHref).toBe("/admin");
    expect(brief.secondaryHref).toBe("/rush-month/loop");
    expect(brief.safetyNote).toContain("not approval");
  });
});
