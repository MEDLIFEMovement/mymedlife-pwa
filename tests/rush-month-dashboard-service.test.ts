import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getAssignmentStatusCounts,
  getRushMonthDashboardForActor,
  getVisibleLeaderboardForActor,
} from "@/services/rush-month-dashboard-service";

const data = getMockReadOnlyAppData("Testing dashboard.");

describe("rush month dashboard service", () => {
  it("gives members a simple next action, events, proof, and leaderboard", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, data);

    expect(dashboard.surfaceFamily).toBe("member");
    expect(dashboard.roleLabel).toBe("General Member");
    expect(dashboard.canReadChapterTruth).toBe(true);
    expect(dashboard.phaseSummary.label).toBe("Week 1: Invite and prove the first push");
    expect(dashboard.phaseSummary.status).toBe("Invite and prove the first push");
    expect(dashboard.whyItMatters).toContain("Why it matters:");
    expect(dashboard.actionGroups.map((group) => group.label)).toEqual([
      "Invite push",
      "Rush event",
      "Proof and points",
    ]);
    expect(dashboard.nextStep.href).toBe("/rush-month/actions/member-push");
    expect(dashboard.visibleAssignments).toHaveLength(3);
    expect(dashboard.eventPlans).toHaveLength(4);
    expect(dashboard.proofItems).toHaveLength(1);
    expect(dashboard.leaderboard).toHaveLength(5);
    expect(dashboard.metrics.map((metric) => metric.label)).toContain("Points earned");
  });

  it("keeps committee members on the member-owned Rush Month dashboard posture", () => {
    const actor = getMockLocalActorContext("committee.member@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, data);

    expect(dashboard.roleLabel).toBe("Action Committee Member");
    expect(dashboard.phaseSummary.status).toBe("Invite and prove the first push");
    expect(dashboard.nextStep.ctaLabel).toBe("Open my next action");
    expect(dashboard.actionGroups.map((group) => group.label)).toEqual([
      "Invite push",
      "Rush event",
      "Proof and points",
    ]);
  });

  it("gives President / VP approval and role-coverage focus", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, data);

    expect(dashboard.surfaceFamily).toBe("leader");
    expect(dashboard.roleLabel).toBe("President / VP");
    expect(dashboard.nextStep.href).toBe("/rush-month/review");
    expect(dashboard.nextStep.ctaLabel).toBe("Open approval queue");
    expect(dashboard.actionGroups.map((group) => group.href)).toEqual([
      "/rush-month/actions",
      "/rush-month/review",
      "/rush-month/events",
    ]);
    expect(dashboard.roleFocus?.roleLabel).toBe("President / VP");
    expect(dashboard.roleFocus?.primaryHref).toBe("/rush-month/review");
    expect(dashboard.roleFocus?.secondaryHref).toBe("/chapter/members");
    expect(dashboard.visibleAssignments.some((assignment) => assignment.lane === "Leader")).toBe(
      true,
    );
    expect(dashboard.alerts.join(" ")).toContain("role coverage");
  });

  it("gives E-Board owner follow-up and event execution focus", () => {
    const actor = getMockLocalActorContext("eboard.a@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, data);

    expect(dashboard.nextStep.href).toBe("/rush-month/actions");
    expect(dashboard.nextStep.ctaLabel).toBe("Open team actions");
    expect(dashboard.roleFocus?.roleLabel).toBe("E-Board Member");
    expect(dashboard.roleFocus?.primaryHref).toBe("/rush-month/actions");
    expect(dashboard.roleFocus?.secondaryHref).toBe("/rush-month/events");
    expect(dashboard.roleFocus?.safetyNote).toContain("Luma writes");
    expect(dashboard.alerts.join(" ")).toContain("execution follow-up");
  });

  it("gives coaches a coach readout next step and hides integration outbox rows", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, data);

    expect(dashboard.roleLabel).toBe("Coach");
    expect(dashboard.nextStep.href).toBe("/coach");
    expect(dashboard.metrics.map((metric) => metric.label)).toContain("Coach decision");
    expect(dashboard.integrationEvents).toEqual([]);
    expect(dashboard.outboxItems).toEqual([]);
  });

  it("keeps DS Admin out of chapter truth but shows outbox posture", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, data);

    expect(dashboard.surfaceFamily).toBe("ds_admin");
    expect(dashboard.roleLabel).toBe("DS Admin");
    expect(dashboard.canReadChapterTruth).toBe(false);
    expect(dashboard.visibleAssignments).toEqual([]);
    expect(dashboard.eventPlans).toEqual([]);
    expect(dashboard.proofItems).toEqual([]);
    expect(dashboard.leaderboard).toEqual([]);
    expect(dashboard.integrationEvents).toHaveLength(data.integrationEvents.length);
    expect(dashboard.outboxItems).toHaveLength(data.outboxItems.length);
  });

  it("gives admin proof posture without integration ownership", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, data);

    expect(dashboard.nextStep.href).toBe("/rush-month/review");
    expect(dashboard.integrationEvents).toEqual([]);
    expect(dashboard.alerts.join(" ")).toContain("proof");
  });

  it("gives super admin the full local dashboard including integration posture", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, data);

    expect(dashboard.canReadChapterTruth).toBe(true);
    expect(dashboard.visibleAssignments).toHaveLength(data.assignments.length);
    expect(dashboard.integrationEvents).toHaveLength(data.integrationEvents.length);
    expect(dashboard.outboxItems).toHaveLength(data.outboxItems.length);
  });

  it("sorts the leaderboard by points and blocks it for DS Admin", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const rows = getVisibleLeaderboardForActor(member);

    expect(rows[0]?.points).toBeGreaterThanOrEqual(rows[1]?.points ?? 0);
    expect(getVisibleLeaderboardForActor(dsAdmin)).toEqual([]);
  });

  it("counts assignment statuses for visible operating summaries", () => {
    expect(getAssignmentStatusCounts(data.assignments)).toEqual({
      approved: 1,
      submitted: 2,
      inProgress: 1,
      changesRequested: 1,
      notStarted: 2,
    });
  });
});
