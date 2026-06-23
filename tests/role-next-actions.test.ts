import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData, type ReadOnlyAppData } from "@/services/read-only-app-data";
import { getRoleNextActionBrief } from "@/services/role-next-actions";

const data = getMockReadOnlyAppData("Testing role next actions.");

describe("role next actions", () => {
  it("points a member to their visible in-progress action", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("General Member");
    expect(brief.primaryHref).toBe("/rush-month/actions/member-push");
    expect(brief.primaryLabel).toBe("Open my action");
    expect(brief.secondaryHref).toBe("/rush-month/leaderboard");
    expect(brief.secondaryLabel).toBe("See my points");
    expect(brief.signals.map((signal) => signal.label)).toContain("Points earned");
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
    expect(committeeMember.primaryHref).toBe("/rush-month/actions/member-push");
    expect(committeeChair.ownerLabel).toBe("Chapter Leader / E-Board");
    expect(committeeChair.primaryHref).toBe("/rush-month/review");
  });

  it("points President / VP to approval when proof needs a decision", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("President / VP");
    expect(brief.primaryHref).toBe("/rush-month/review");
    expect(brief.primaryLabel).toBe("Open approval queue");
    expect(brief.secondaryHref).toBe("/rush-month/dashboard");
    expect(brief.signals.find((signal) => signal.label === "Needs decision")?.value).toBe(
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

    expect(brief.primaryHref).toBe("/chapter/members");
    expect(brief.primaryLabel).toBe("Check role coverage");
    expect(brief.title).toContain("Check role coverage");
  });

  it("points E-Board to owner follow-up and events", () => {
    const actor = getMockLocalActorContext("eboard.a@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("E-Board Member");
    expect(brief.primaryHref).toBe("/rush-month/actions");
    expect(brief.primaryLabel).toBe("Open owner follow-up");
    expect(brief.secondaryHref).toBe("/rush-month/events");
    expect(brief.safetyNote).toContain("Luma writes");
  });

  it("points a coach to the coach readout and decision posture", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("Coach");
    expect(brief.primaryHref).toBe("/coach");
    expect(brief.title).toContain(data.kpiSummary.coachDecision);
    expect(brief.signals.find((signal) => signal.label === "Decision state")?.value).toBe(
      data.kpiSummary.coachDecision,
    );
  });

  it("points admin to HQ proof posture without enabling publishing", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("Admin");
    expect(brief.primaryHref).toBe("/rush-month/review");
    expect(brief.secondaryHref).toBe("/admin");
    expect(brief.safetyNote).toContain("public proof sharing");
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
