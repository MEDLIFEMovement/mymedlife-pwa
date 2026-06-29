import { describe, expect, it } from "vitest";
import { rushMonthLeaderboard } from "@/data/mock-leaderboard";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing member recognition.");

describe("member recognition", () => {
  it("gives a member their rank, points, recognition, and chapter impact", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const recognition = getMemberRecognitionSummary(actor, data);

    expect(recognition.canReadRecognition).toBe(true);
    expect(recognition.title).toBe("Your recognition");
    expect(recognition.selectedMember?.displayName).toBe("Sofia Alvarez");
    expect(recognition.selectedMember?.rank).toBe(3);
    expect(recognition.selectedMember?.points).toBe(145);
    expect(recognition.impacts.map((impact) => impact.label)).toEqual([
      "Chapter points",
      "Invite pushes",
      "Events linked",
    ]);
    expect(recognition.topStats.map((stat) => stat.label)).toEqual([
      "Total Points",
      "This Week",
      "Chapter Rank",
    ]);
    expect(recognition.campaignPoints.map((item) => item.label)).toEqual([
      "Rush Month",
      "Spring Showcase (prev.)",
      "Community Health Fair",
    ]);
    expect(recognition.campaignPoints.map((item) => item.id)).toEqual([
      "rush-month",
      "spring-showcase",
      "community-health-fair",
    ]);
    expect(recognition.badges.map((badge) => badge.label)).toContain("Rush Starter");
    expect(recognition.recentApprovedActions.length).toBeGreaterThan(0);
    expect(recognition.recentApprovedActions.map((action) => action.title)).toEqual([
      "Welcome one new student at tabling",
    ]);
    expect(recognition.recentApprovedActions.map((action) => action.detail)).toEqual([
      "Tabling welcome completed · Due Nov 14",
    ]);
    expect(
      recognition.recentApprovedActions.every((action) => {
        return action.href.startsWith("/rush-month/actions/") && action.href.endsWith("?source=points");
      }),
    ).toBe(true);
    expect(
      recognition.recentApprovedActions.some((action) => {
        return (
          action.title.includes("align the leader team") ||
          action.title.includes("Assign Rush Month outreach owners")
        );
      }),
    ).toBe(false);
    expect(recognition.explainer.title).toBe("How points work");
    expect(recognition.explainer.ctaHref).toBe("/rush-month/actions/member-push?source=points");
    expect(recognition.impacts[0]?.note).toContain("points event rows");
    expect(recognition.impacts[1]?.note).toContain("KPI event rows");
    expect(recognition.pointsLedgerPosture).toBe("mock_read_only");
    expect(recognition.leaderboard.map((row) => row.displayName)).toEqual([
      "Aisha N.",
      "Marcus T.",
      "Sofia Alvarez",
      "James L.",
      "Nina Chair",
    ]);
  });

  it("sorts visible leaderboard rows by points and completed actions", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const recognition = getMemberRecognitionSummary(actor, data, [
      {
        id: "tie-a",
        displayName: "Tie A",
        roleLabel: "General Member",
        points: 10,
        completedActions: 1,
        recognition: "One action",
      },
      {
        id: "tie-b",
        displayName: "Tie B",
        roleLabel: "General Member",
        points: 10,
        completedActions: 3,
        recognition: "Three actions",
      },
    ]);

    expect(recognition.leaderboard[0]?.id).toBe("tie-b");
  });

  it("gives leaders a member recognition readout", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const recognition = getMemberRecognitionSummary(actor, data);

    expect(recognition.canReadRecognition).toBe(true);
    expect(recognition.title).toBe("Member recognition");
    expect(recognition.leaderboard).toHaveLength(rushMonthLeaderboard.length);
  });

  it("maps committee members to member recognition and committee chairs to leader recognition", () => {
    const committeeMember = getMemberRecognitionSummary(
      getMockLocalActorContext("committee.member@mymedlife.test"),
      data,
    );
    const committeeChair = getMemberRecognitionSummary(
      getMockLocalActorContext("committee.chair@mymedlife.test"),
      data,
    );

    expect(committeeMember.canReadRecognition).toBe(true);
    expect(committeeMember.title).toBe("Your recognition");
    expect(committeeChair.canReadRecognition).toBe(true);
    expect(committeeChair.title).toBe("Member recognition");
  });

  it("keeps DS Admin out of recognition and points truth", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const recognition = getMemberRecognitionSummary(actor, data);

    expect(recognition.canReadRecognition).toBe(false);
    expect(recognition.leaderboard).toEqual([]);
    expect(recognition.impacts).toEqual([]);
    expect(recognition.topStats).toEqual([]);
    expect(recognition.campaignPoints).toEqual([]);
    expect(recognition.summary).toContain("student points and recognition");
  });

  it("shows unknown instead of weak-performance-looking numbers when no ledger signal exists", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const recognition = getMemberRecognitionSummary(actor, {
      ...data,
      pointsSummary: {
        earned: 0,
        available: 0,
        approvedActions: 0,
      },
      kpiSummary: {
        invitePushes: 0,
        proofPending: 0,
        eventsLinked: 0,
        coachDecision: "hold",
      },
      integrationEvents: [],
      metricsPosture: {
        points: "unknown",
        kpis: "unknown",
        leaderboard: "unknown",
      },
    });

    expect(recognition.impacts).toEqual([
      expect.objectContaining({ label: "Chapter points", value: "Unknown" }),
      expect.objectContaining({ label: "Invite pushes", value: "Unknown" }),
      expect.objectContaining({ label: "Events linked", value: "Unknown" }),
    ]);
  });

  it("prefers Supabase-backed leaderboard rows when durable points events are visible", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const recognition = getMemberRecognitionSummary(actor, {
      ...data,
      source: {
        mode: "supabase",
        status: "supabase_ready",
        message: "Testing durable leaderboard rows.",
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
      pointsEvents: [
        {
          id: "points-live-1",
          assignmentId: "chapter-event-live",
          userId: "member-live",
          points: 20,
          reason: "Luma pilot attendance confirmed",
        },
        {
          id: "points-live-2",
          assignmentId: "member-push",
          userId: "member-seeded",
          points: 15,
          reason: "Invite push completed",
        },
      ],
      metricsPosture: {
        points: "points_events",
        kpis: data.metricsPosture.kpis,
        leaderboard: "mock_safe",
      },
      pointsSummary: {
        earned: 35,
        available: data.pointsSummary.available,
        approvedActions: 2,
      },
    });

    expect(recognition.pointsLedgerPosture).toBe("points_event_read_only");
    expect(recognition.leaderboard.map((row) => row.displayName)).toEqual([
      "Nellis",
      "Sofia Alvarez",
    ]);
    expect(recognition.leaderboard[0]).toMatchObject({
      points: 20,
      recognition: "Invite push starter",
    });
    expect(recognition.impacts[0]?.note).toContain("points event rows");
  });
});
