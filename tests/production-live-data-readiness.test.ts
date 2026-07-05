import { describe, expect, it } from "vitest";
import {
  formatProductionLiveDataReadiness,
  getProductionLiveDataReadiness,
  parseProductionLiveDataCountCsv,
  type ProductionLiveDataCounts,
} from "@/services/production-live-data-readiness";

describe("production live data readiness", () => {
  it("blocks production rollout when live launch tables are empty", () => {
    const readiness = getProductionLiveDataReadiness(createCounts({}));

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toContain(
      "Create production Supabase Auth users before inviting chapters.",
    );
    expect(readiness.blockers).toContain(
      "Add at least 30 active production chapters. Current active chapters: 0.",
    );
    expect(readiness.blockers).toContain(
      "Add approved production memberships for launch users.",
    );
    expect(readiness.blockers).toContain(
      "Add active production coach assignments for launch chapters.",
    );
    expect(readiness.blockers).toContain(
      "Add active production launch campaigns for rollout chapters.",
    );
    expect(readiness.blockers).toContain(
      "Add at least 5 production chapter events before the five-chapter pilot proof. Current chapter events: 0.",
    );
    expect(readiness.blockers).toContain(
      "Add at least 5 production Luma event links before the five-chapter pilot proof. Current Luma event links: 0.",
    );
    expect(formatProductionLiveDataReadiness(readiness)).toContain(
      "Production live data count check: NOT READY",
    );
  });

  it("passes the count floor but keeps row-by-row verification explicit", () => {
    const readiness = getProductionLiveDataReadiness(
      createCounts({
        "auth.users": 503,
        "app.profiles": 503,
        "app.chapters.active": 30,
        "app.memberships.approved": 500,
        "app.staff_role_assignments.active": 4,
        "app.coach_chapter_assignments.active": 30,
        "app.campaigns.active": 30,
        "app.chapter_events": 5,
        "app.luma_event_links": 5,
      }),
    );

    expect(readiness.ready).toBe(true);
    expect(readiness.nextSteps).toContain(
      "Run the rollout packet validator and signed-in role checks; this count check does not prove row-by-row ownership.",
    );
  });

  it("blocks production rollout until the live approved membership count reaches the 500-student invite floor", () => {
    const readiness = getProductionLiveDataReadiness(
      createCounts({
        "auth.users": 503,
        "app.profiles": 503,
        "app.chapters.active": 30,
        "app.memberships.approved": 75,
        "app.staff_role_assignments.active": 4,
        "app.coach_chapter_assignments.active": 30,
        "app.campaigns.active": 30,
        "app.chapter_events": 5,
        "app.luma_event_links": 5,
      }),
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.minimumApprovedMembershipCount).toBe(500);
    expect(readiness.blockers).toContain(
      "Add at least 500 approved production memberships before inviting students. Current approved memberships: 75.",
    );
    expect(formatProductionLiveDataReadiness(readiness)).toContain(
      "Minimum approved memberships: 500",
    );
  });

  it("blocks production rollout until five pilot events and Luma links exist", () => {
    const readiness = getProductionLiveDataReadiness(
      createCounts({
        "auth.users": 503,
        "app.profiles": 503,
        "app.chapters.active": 30,
        "app.memberships.approved": 500,
        "app.staff_role_assignments.active": 4,
        "app.coach_chapter_assignments.active": 30,
        "app.campaigns.active": 30,
        "app.chapter_events": 4,
        "app.luma_event_links": 3,
      }),
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.minimumPilotEventCount).toBe(5);
    expect(readiness.blockers).toContain(
      "Add at least 5 production chapter events before the five-chapter pilot proof. Current chapter events: 4.",
    );
    expect(readiness.blockers).toContain(
      "Add at least 5 production Luma event links before the five-chapter pilot proof. Current Luma event links: 3.",
    );
    expect(formatProductionLiveDataReadiness(readiness)).toContain(
      "Minimum pilot event links: 5",
    );
  });

  it("supports smaller explicit event floors for rehearsals", () => {
    const readiness = getProductionLiveDataReadiness(
      createCounts({
        "auth.users": 20,
        "app.profiles": 20,
        "app.chapters.active": 3,
        "app.memberships.approved": 20,
        "app.staff_role_assignments.active": 2,
        "app.coach_chapter_assignments.active": 3,
        "app.campaigns.active": 3,
        "app.chapter_events": 1,
        "app.luma_event_links": 1,
      }),
      {
        minimumChapterCount: 3,
        minimumApprovedMembershipCount: 20,
        minimumPilotEventCount: 1,
      },
    );

    expect(readiness.ready).toBe(true);
    expect(readiness.minimumPilotEventCount).toBe(1);
  });

  it("parses Supabase CSV output while ignoring CLI status lines", () => {
    const counts = parseProductionLiveDataCountCsv(`
Initialising login role...
relation,rows
app.assignments,0
app.audit_logs,0
app.campaigns.active,30
app.chapters.active,30
app.coach_chapter_assignments.active,30
app.chapter_events,5
app.memberships.approved,75
app.luma_event_links,5
app.points_events,4
app.profiles,90
app.staff_role_assignments.active,4
auth.users,90
A new version of Supabase CLI is available.
`);

    expect(counts["auth.users"]).toBe(90);
    expect(counts["app.chapters.active"]).toBe(30);
    expect(counts["app.points_events"]).toBe(4);
  });
});

function createCounts(
  overrides: Partial<ProductionLiveDataCounts>,
): ProductionLiveDataCounts {
  return {
    "auth.users": 0,
    "app.profiles": 0,
    "app.chapters.active": 0,
    "app.memberships.approved": 0,
    "app.staff_role_assignments.active": 0,
    "app.coach_chapter_assignments.active": 0,
    "app.campaigns.active": 0,
    "app.chapter_events": 0,
    "app.luma_event_links": 0,
    "app.assignments": 0,
    "app.points_events": 0,
    "app.audit_logs": 0,
    ...overrides,
  };
}
