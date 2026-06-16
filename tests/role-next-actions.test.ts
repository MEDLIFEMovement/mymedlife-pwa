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
    expect(brief.signals.map((signal) => signal.label)).toContain("Points earned");
    expect(brief.safetyNote).toContain("read-only");
  });

  it("points a leader to follow-up when proof needs a decision", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const brief = getRoleNextActionBrief(actor, data);

    expect(brief.ownerLabel).toBe("Chapter Leader / E-Board");
    expect(brief.primaryHref).toBe("/rush-month/review");
    expect(brief.primaryLabel).toBe("Open follow-up queue");
    expect(brief.signals.find((signal) => signal.label === "Needs follow-up")?.value).toBe(
      "2",
    );
  });

  it("points a leader to assignment creation when no proof is waiting", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const calmData: ReadOnlyAppData = {
      ...data,
      assignments: data.assignments.map((assignment) => ({
        ...assignment,
        status: assignment.status === "approved" ? "approved" : "in_progress",
      })),
    };
    const brief = getRoleNextActionBrief(actor, calmData);

    expect(brief.primaryHref).toBe("/rush-month/actions");
    expect(brief.primaryLabel).toBe("Open team actions");
    expect(brief.title).toContain("Assign the next concrete");
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
