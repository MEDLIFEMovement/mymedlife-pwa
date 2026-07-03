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
      "Add active production coach assignments for launch chapters.",
    );
    expect(readiness.blockers).toContain(
      "Add active production launch campaigns for rollout chapters.",
    );
    expect(formatProductionLiveDataReadiness(readiness)).toContain(
      "Production live data count check: NOT READY",
    );
  });

  it("passes the count floor but keeps row-by-row verification explicit", () => {
    const readiness = getProductionLiveDataReadiness(
      createCounts({
        "auth.users": 90,
        "app.profiles": 90,
        "app.chapters.active": 30,
        "app.memberships.approved": 75,
        "app.staff_role_assignments.active": 4,
        "app.coach_chapter_assignments.active": 30,
        "app.campaigns.active": 30,
      }),
    );

    expect(readiness.ready).toBe(true);
    expect(readiness.nextSteps).toContain(
      "Run the rollout packet validator and signed-in role checks; this count check does not prove row-by-row ownership.",
    );
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
app.memberships.approved,75
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
    "app.assignments": 0,
    "app.points_events": 0,
    "app.audit_logs": 0,
    ...overrides,
  };
}
