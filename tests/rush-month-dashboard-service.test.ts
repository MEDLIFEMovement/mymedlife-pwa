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
  it("gives members an event-first path with points visible in the same loop", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, data);

    expect(dashboard.surfaceFamily).toBe("member");
    expect(dashboard.roleLabel).toBe("General Member");
    expect(dashboard.canReadChapterTruth).toBe(true);
    expect(dashboard.phaseSummary.label).toBe("Week 1: Make MEDLIFE visible on campus");
    expect(dashboard.phaseSummary.status).toBe("Planning");
    expect(dashboard.phaseSummary.note).toContain(
      "Turn early campaign planning into visible campus energy",
    );
    expect(dashboard.whyItMatters).toContain(
      "Current phase objective:",
    );
    expect(dashboard.actionGroups.map((group) => group.label)).toEqual([
      "Next event",
      "Rush event",
      "Points and leaderboard",
    ]);
    expect(dashboard.nextStep.href).toBe("/app/events?source=home");
    expect(dashboard.nextStep.ctaLabel).toBe("Open events");
    expect(dashboard.nextStep.summary).toContain("attendance drive points");
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
    expect(dashboard.phaseSummary.status).toBe("Planning");
    expect(dashboard.nextStep.ctaLabel).toBe("Open events");
    expect(dashboard.actionGroups.map((group) => group.label)).toEqual([
      "Next event",
      "Rush event",
      "Points and leaderboard",
    ]);
  });

  it("gives President / VP approval and role-coverage focus", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, data);

    expect(dashboard.surfaceFamily).toBe("leader");
    expect(dashboard.roleLabel).toBe("President / VP");
    expect(dashboard.nextStep.href).toBe("/leader?view=attendance");
    expect(dashboard.nextStep.ctaLabel).toBe("Open attendance");
    expect(dashboard.actionGroups.map((group) => group.href)).toEqual([
      "/leader?view=events",
      "/leader?view=attendance",
      "/leader?view=leaderboard",
    ]);
    expect(dashboard.roleFocus?.roleLabel).toBe("President / VP");
    expect(dashboard.roleFocus?.primaryHref).toBe("/leader?view=attendance");
    expect(dashboard.roleFocus?.secondaryHref).toBe("/leader?view=leaderboard");
    expect(dashboard.visibleAssignments.some((assignment) => assignment.lane === "Leader")).toBe(
      true,
    );
    expect(dashboard.alerts.join(" ")).toContain("attendance and points");
  });

  it("gives E-Board owner follow-up and event execution focus", () => {
    const actor = getMockLocalActorContext("eboard.a@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, data);

    expect(dashboard.nextStep.href).toBe("/leader?view=events");
    expect(dashboard.nextStep.ctaLabel).toBe("Open event loop");
    expect(dashboard.roleFocus?.roleLabel).toBe("E-Board Member");
    expect(dashboard.roleFocus?.primaryHref).toBe("/leader?view=events");
    expect(dashboard.roleFocus?.secondaryHref).toBe("/leader?view=attendance");
    expect(dashboard.roleFocus?.safetyNote).toContain("approved live path");
    expect(dashboard.alerts.join(" ")).toContain("execution follow-up");
  });

  it("gives coaches a coach readout next step and hides integration outbox rows", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, data);

    expect(dashboard.roleLabel).toBe("Coach");
    expect(dashboard.phaseSummary.label).toBe("Week 1: Make MEDLIFE visible on campus");
    expect(dashboard.phaseSummary.status).toBe("Planning");
    expect(dashboard.nextStep.href).toBe("/staff?view=chapters");
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

    expect(dashboard.nextStep.href).toBe("/staff?view=chapters");
    expect(dashboard.integrationEvents).toEqual([]);
    expect(dashboard.alerts.join(" ")).toContain("event loop");
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
