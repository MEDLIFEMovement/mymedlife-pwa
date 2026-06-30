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
    expect(dashboard.phaseSummary.label).toBe("Week 1: Make MEDLIFE visible on campus");
    expect(dashboard.phaseSummary.status).toBe("Planning");
    expect(dashboard.phaseSummary.note).toContain(
      "Turn early campaign planning into visible campus energy",
    );
    expect(dashboard.whyItMatters).toContain(
      "Current phase objective:",
    );
    expect(dashboard.actionGroups.map((group) => group.label)).toEqual([
      "Invite push",
      "Rush event",
      "Proof and points",
    ]);
    expect(dashboard.nextStep.href).toBe("/rush-month/actions/member-push");
    expect(dashboard.nextStep.summary).toContain("prepare proof for:");
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
    expect(dashboard.phaseSummary.label).toBe("Week 1: Make MEDLIFE visible on campus");
    expect(dashboard.phaseSummary.status).toBe("Planning");
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

  it("surfaces durable Supabase-backed leaderboard rows when real points rows exist", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const dashboard = getRushMonthDashboardForActor(actor, {
      ...data,
      source: {
        mode: "supabase",
        status: "supabase_ready",
        message: "Testing durable leaderboard visibility.",
      },
      profiles: [
        {
          id: "member-live",
          display_name: "Nellis",
          email: "nellis@medlifemovement.org",
          status: "active",
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-01T00:00:00Z",
        },
        {
          id: "member-seeded",
          display_name: "Sofia Alvarez",
          email: "member.a@mymedlife.test",
          status: "active",
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-01T00:00:00Z",
        },
      ],
      memberships: [
        {
          id: "membership-1",
          user_id: "member-live",
          chapter_id: data.chapter.id,
          role_key: "general_member",
          status: "approved",
          requested_at: "2026-06-01T00:00:00Z",
          approved_at: "2026-06-01T00:00:00Z",
          approved_by: null,
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-01T00:00:00Z",
        },
        {
          id: "membership-2",
          user_id: "member-seeded",
          chapter_id: data.chapter.id,
          role_key: "general_member",
          status: "approved",
          requested_at: "2026-06-01T00:00:00Z",
          approved_at: "2026-06-01T00:00:00Z",
          approved_by: null,
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-01T00:00:00Z",
        },
      ],
      pointsEventRows: [
        {
          id: "points-live-1",
          chapter_id: data.chapter.id,
          campaign_id: data.campaign.id,
          assignment_id: null,
          chapter_event_id: "chapter-event-live",
          evidence_item_id: null,
          approval_id: null,
          awarded_to_user_id: "member-live",
          points_delta: 20,
          reason: "Luma pilot attendance confirmed",
          created_by: "ds.admin@mymedlife.test",
          created_at: "2026-06-29T02:27:19.000Z",
        },
        {
          id: "points-live-2",
          chapter_id: data.chapter.id,
          campaign_id: data.campaign.id,
          assignment_id: "member-push",
          chapter_event_id: null,
          evidence_item_id: null,
          approval_id: null,
          awarded_to_user_id: "member-seeded",
          points_delta: 15,
          reason: "Invite push completed",
          created_by: "leader.a@mymedlife.test",
          created_at: "2026-06-20T14:03:21.000Z",
        },
      ],
      pointsSummary: {
        earned: 35,
        available: data.pointsSummary.available,
        approvedActions: 2,
      },
      metricsPosture: {
        points: "points_events",
        kpis: data.metricsPosture.kpis,
        leaderboard: "mock_safe",
      },
    });

    expect(dashboard.leaderboard.map((row) => row.displayName)).toEqual([
      "Nellis",
      "Sofia Alvarez",
    ]);
    expect(dashboard.leaderboard[0]).toMatchObject({
      points: 20,
      roleLabel: "General Member",
    });
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
