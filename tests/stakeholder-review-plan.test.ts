import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getStakeholderReviewPlan } from "@/services/stakeholder-review-plan";

describe("stakeholder review plan", () => {
  it("gives admin a no-code review path with zero writes and sends", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const plan = getStakeholderReviewPlan(actor);

    expect(plan.canReadPlan).toBe(true);
    expect(plan.counts.steps).toBe(45);
    expect(plan.counts.browserWritesExpected).toBe(0);
    expect(plan.counts.externalWritesExpected).toBe(0);
    expect(plan.steps.every((step) => step.safetyBoundary.length > 0)).toBe(true);
    expect(plan.phases).toHaveLength(6);
    expect(
      plan.phases.reduce((total, phase) => total + phase.stepCount, 0),
    ).toBe(plan.counts.steps);
  });

  it("covers member, leader, proof, coach, and admin review moments", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const plan = getStakeholderReviewPlan(actor);
    const routes = plan.steps.map((step) => step.route);

    expect(routes).toEqual([
      "/login",
      "/profile",
      "/onboarding",
      "/chapter",
      "/rush-month",
      "/rush-month/actions",
      "/rush-month/actions/member-push",
      "/rush-month/evidence",
      "/rush-month/leaderboard",
      "/rush-month/dashboard",
      "/rush-month/events",
      "/rush-month/events/event-rush-social-001",
      "/rush-month/dashboard",
      "/rush-month/actions",
      "/chapter/members",
      "/rush-month/loop",
      "/rush-month/events",
      "/rush-month/review",
      "/proof-library",
      "/proof-library/upload",
      "/coach",
      "/coach",
      "/admin",
      "/admin/master-data",
      "/admin/integration-outbox",
      "/admin/audit-log",
      "/admin/system-health",
      "/admin/database-security",
      "/admin/review-path",
      "/admin/nick-review",
      "/admin/release-readiness",
      "/admin/launch-gate",
      "/admin/design-qa",
      "/admin",
      "/admin/operations",
      "/admin/staff-dry-run",
      "/admin/pilot-scope",
      "/admin/first-write",
      "/admin/write-sequence",
      "/admin/proof-write",
      "/admin/hq-proof-write",
      "/admin/points-write",
      "/admin/slt-checklist-write",
      "/admin/assignment-write",
      "/admin/coach-write",
    ]);
    expect(plan.steps.slice(0, 12).map((step) => step.id)).toEqual([
      "local-sign-in",
      "profile-scope",
      "auth-onboarding",
      "member-chapter-home",
      "member-rush-month-overview",
      "member-assigned-actions",
      "member-action-detail",
      "member-evidence-submission",
      "member-leaderboard",
      "member-week",
      "member-events-list",
      "event-detail",
    ]);
    expect(
      plan.steps.findIndex((step) => step.id === "member-evidence-submission"),
    ).toBeLessThan(
      plan.steps.findIndex((step) => step.id === "member-leaderboard"),
    );
    expect(
      plan.steps.findIndex((step) => step.id === "leader-follow-up"),
    ).toBeGreaterThan(
      plan.steps.findIndex((step) => step.id === "event-detail"),
    );
    expect(plan.steps.slice(12, 18).map((step) => step.id)).toEqual([
      "leader-dashboard",
      "leader-follow-up",
      "member-role-coverage",
      "operating-loop",
      "event-readiness",
      "leader-proof-decisions",
    ]);
    expect(
      plan.steps.find((step) => step.id === "member-role-coverage")
        ?.expectedReview,
    ).toContain("Goal 160 membership approval packet");
    expect(
      plan.steps.find((step) => step.id === "member-role-coverage")
        ?.expectedReview,
    ).toContain("Goal 161 membership result states");
    expect(
      plan.steps.find((step) => step.id === "member-role-coverage")
        ?.safetyBoundary,
    ).toContain("No join approval");
    expect(plan.steps.slice(18, 20).map((step) => step.id)).toEqual([
      "proof-review",
      "proof-upload-readiness",
    ]);
    expect(plan.steps.slice(20, 22).map((step) => step.id)).toEqual([
      "coach-portfolio",
      "coach-readiness",
    ]);
    expect(plan.steps.slice(22, 27).map((step) => step.id)).toEqual([
      "admin-safety",
      "admin-master-data",
      "admin-integration-outbox",
      "admin-audit-log",
      "admin-system-health",
    ]);
    expect(plan.phases.map((phase) => phase.id)).toEqual([
      "member-walkthrough",
      "leader-walkthrough",
      "proof-readiness",
      "coach-walkthrough",
      "admin-walkthrough",
      "write-packets",
    ]);
    expect(plan.phases.map((phase) => phase.stepRange)).toEqual([
      "1-12",
      "13-18",
      "19-20",
      "21-22",
      "23-35",
      "36-45",
    ]);
    expect(
      plan.phases.find((phase) => phase.id === "admin-walkthrough")?.summary,
    ).toContain("control center");
    expect(
      plan.steps.find((step) => step.id === "local-sign-in")?.route,
    ).toBe("/login");
    expect(
      plan.steps.find((step) => step.id === "local-sign-in")?.expectedReview,
    ).toContain("fake local seed-user sign-in");
    expect(
      plan.steps.find((step) => step.id === "local-sign-in")?.safetyBoundary,
    ).toContain("No production auth");
    expect(
      plan.steps.find((step) => step.id === "member-leaderboard")?.expectedReview,
    ).toContain("points, rank, recognition");
    expect(
      plan.steps.find((step) => step.id === "profile-scope")?.expectedReview,
    ).toContain("chapter role");
    expect(
      plan.steps.find((step) => step.id === "profile-scope")?.safetyBoundary,
    ).toContain("No profile save");
    expect(
      plan.steps.find((step) => step.id === "auth-onboarding")?.expectedReview,
    ).toContain("future sign-in");
    expect(
      plan.steps.find((step) => step.id === "auth-onboarding")?.expectedReview,
    ).toContain("Goal 157 production auth preflight");
    expect(
      plan.steps.find((step) => step.id === "auth-onboarding")?.safetyBoundary,
    ).toContain("No live auth");
    expect(
      plan.steps.find((step) => step.id === "auth-onboarding")?.safetyBoundary,
    ).toContain("browser write");
    expect(
      plan.steps.find((step) => step.id === "member-chapter-home")?.route,
    ).toBe("/chapter");
    expect(
      plan.steps.find((step) => step.id === "member-chapter-home")?.expectedReview,
    ).toContain("visible progress");
    expect(
      plan.steps.find((step) => step.id === "member-chapter-home")?.expectedReview,
    ).toContain("proof library");
    expect(
      plan.steps.find((step) => step.id === "member-chapter-home")?.safetyBoundary,
    ).toContain("No membership write");
    expect(
      plan.steps.find((step) => step.id === "member-rush-month-overview")?.route,
    ).toBe("/rush-month");
    expect(
      plan.steps.find((step) => step.id === "member-rush-month-overview")
        ?.expectedReview,
    ).toContain("active Rush Month objective");
    expect(
      plan.steps.find((step) => step.id === "member-rush-month-overview")
        ?.safetyBoundary,
    ).toContain("No campaign phase advance");
    expect(
      plan.steps.find((step) => step.id === "member-leaderboard")?.safetyBoundary,
    ).toContain("No points ledger write");
    expect(
      plan.steps.find((step) => step.id === "member-assigned-actions")?.route,
    ).toBe("/rush-month/actions");
    expect(
      plan.steps.find((step) => step.id === "member-assigned-actions")
        ?.expectedReview,
    ).toContain("visible assigned-action list");
    expect(
      plan.steps.find((step) => step.id === "member-assigned-actions")
        ?.safetyBoundary,
    ).toContain("No assignment creation");
    expect(
      plan.steps.find((step) => step.id === "member-action-detail")?.route,
    ).toBe("/rush-month/actions/member-push");
    expect(
      plan.steps.find((step) => step.id === "member-action-detail")?.expectedReview,
    ).toContain("one assigned action");
    expect(
      plan.steps.find((step) => step.id === "member-action-detail")?.safetyBoundary,
    ).toContain("No action-start save");
    expect(
      plan.steps.find((step) => step.id === "event-detail")?.expectedReview,
    ).toContain("feedback/NPS prompt");
    expect(
      plan.steps.find((step) => step.id === "member-events-list")?.route,
    ).toBe("/rush-month/events");
    expect(
      plan.steps.find((step) => step.id === "member-events-list")?.expectedReview,
    ).toContain("attend-reflect-share bridge");
    expect(
      plan.steps.find((step) => step.id === "member-events-list")?.safetyBoundary,
    ).toContain("No Luma write");
    expect(
      plan.steps.find((step) => step.id === "event-detail")?.safetyBoundary,
    ).toContain("No Luma write");
    expect(
      plan.steps.find((step) => step.id === "leader-dashboard")?.route,
    ).toBe("/rush-month/dashboard");
    expect(
      plan.steps.find((step) => step.id === "leader-dashboard")?.expectedReview,
    ).toContain("chapter KPIs");
    expect(
      plan.steps.find((step) => step.id === "leader-dashboard")?.safetyBoundary,
    ).toContain("No assignment save");
    expect(
      plan.steps.find((step) => step.id === "leader-proof-decisions")
        ?.expectedReview,
    ).toContain("Goal 153 review rubric");
    expect(
      plan.steps.find((step) => step.id === "member-evidence-submission")
        ?.expectedReview,
    ).toContain("next proof item");
    expect(
      plan.steps.find((step) => step.id === "member-evidence-submission")
        ?.expectedReview,
    ).toContain("proof prep checklist");
    expect(
      plan.steps.find((step) => step.id === "member-evidence-submission")
        ?.expectedReview,
    ).toContain("Goal 158 proof submission packet");
    expect(
      plan.steps.find((step) => step.id === "member-evidence-submission")
        ?.safetyBoundary,
    ).toContain("No proof metadata save");
    expect(
      plan.steps.find((step) => step.id === "proof-upload-readiness")
        ?.expectedReview,
    ).toContain("Goal 159 storage packet");
    expect(
      plan.steps.find((step) => step.id === "proof-upload-readiness")
        ?.safetyBoundary,
    ).toContain("No file upload");
    expect(
      plan.steps.find((step) => step.id === "coach-portfolio")?.route,
    ).toBe("/coach");
    expect(
      plan.steps.find((step) => step.id === "coach-portfolio")?.expectedReview,
    ).toContain("assigned chapters");
    expect(
      plan.steps.find((step) => step.id === "coach-portfolio")?.expectedReview,
    ).toContain("advance / hold / intervene");
    expect(
      plan.steps.find((step) => step.id === "coach-portfolio")?.safetyBoundary,
    ).toContain("No coach reassignment");
    expect(
      plan.steps.find((step) => step.id === "coach-readiness")?.expectedReview,
    ).toContain("support notes");
    expect(
      plan.steps.find((step) => step.id === "coach-readiness")?.expectedReview,
    ).toContain("Goal 154 intervention checklist");
    expect(
      plan.steps.find((step) => step.id === "coach-readiness")?.safetyBoundary,
    ).toContain("coach note save");
    expect(
      plan.steps.find((step) => step.id === "coach-readiness")?.safetyBoundary,
    ).toContain("member nudge");
    expect(
      plan.steps.find((step) => step.id === "stakeholder-review-path")?.route,
    ).toBe("/admin/review-path");
    expect(
      plan.steps.find((step) => step.id === "stakeholder-review-path")
        ?.expectedReview,
    ).toContain("route-by-route stakeholder review sequence");
    expect(
      plan.steps.find((step) => step.id === "stakeholder-review-path")
        ?.safetyBoundary,
    ).toContain("No production auth");
    expect(
      plan.steps.find((step) => step.id === "nick-final-review")?.route,
    ).toBe("/admin/nick-review");
    expect(
      plan.steps.find((step) => step.id === "nick-final-review")?.expectedReview,
    ).toContain("final local MVP review packet");
    expect(
      plan.steps.find((step) => step.id === "nick-final-review")?.safetyBoundary,
    ).toContain("No live launch approval");
    expect(
      plan.steps.find((step) => step.id === "release-readiness")?.route,
    ).toBe("/admin/release-readiness");
    expect(
      plan.steps.find((step) => step.id === "release-readiness")?.expectedReview,
    ).toContain("local review yes");
    expect(
      plan.steps.find((step) => step.id === "release-readiness")?.safetyBoundary,
    ).toContain("No live launch approval");
    expect(
      plan.steps.find((step) => step.id === "production-launch-gate")?.route,
    ).toBe("/admin/launch-gate");
    expect(
      plan.steps.find((step) => step.id === "production-launch-gate")
        ?.expectedReview,
    ).toContain("eight production launch gates");
    expect(
      plan.steps.find((step) => step.id === "production-launch-gate")
        ?.safetyBoundary,
    ).toContain("No live launch approval");
    expect(
      plan.steps.find((step) => step.id === "admin-safety")?.expectedReview,
    ).toContain("users, named role coverage");
    expect(
      plan.steps.find((step) => step.id === "admin-safety")?.expectedReview,
    ).toContain("integration/outbox safety");
    expect(
      plan.steps.find((step) => step.id === "admin-safety")?.safetyBoundary,
    ).toContain("No user creation");
    expect(
      plan.steps.find((step) => step.id === "admin-audit-log")?.expectedReview,
    ).toContain("persisted audit readback posture");
    expect(
      plan.steps.find((step) => step.id === "admin-audit-log")?.expectedReview,
    ).toContain("Goal 156 write-audit preflight");
    expect(
      plan.steps.find((step) => step.id === "admin-audit-log")?.safetyBoundary,
    ).toContain("No audit row edit");
    expect(
      plan.steps.find((step) => step.id === "admin-audit-log")?.safetyBoundary,
    ).toContain("retention change");
    expect(
      plan.steps.find((step) => step.id === "admin-integration-outbox")
        ?.expectedReview,
    ).toContain("structured integration events");
    expect(
      plan.steps.find((step) => step.id === "admin-integration-outbox")
        ?.expectedReview,
    ).toContain("Goal 155 live-send preflight checklist");
    expect(
      plan.steps.find((step) => step.id === "admin-integration-outbox")
        ?.safetyBoundary,
    ).toContain("No queue mutation");
    expect(
      plan.steps.find((step) => step.id === "admin-integration-outbox")
        ?.safetyBoundary,
    ).toContain("external worker");
    expect(
      plan.steps.find((step) => step.id === "admin-master-data")?.expectedReview,
    ).toContain("fake users");
    expect(
      plan.steps.find((step) => step.id === "admin-master-data")?.safetyBoundary,
    ).toContain("No production user creation");
    expect(
      plan.steps.find((step) => step.id === "database-security")?.route,
    ).toBe("/admin/database-security");
    expect(
      plan.steps.find((step) => step.id === "database-security")?.expectedReview,
    ).toContain("Supabase Postgres/Auth/Storage");
    expect(
      plan.steps.find((step) => step.id === "database-security")?.safetyBoundary,
    ).toContain("No live launch approval");
    expect(
      plan.steps.find((step) => step.id === "admin-system-health")?.expectedReview,
    ).toContain("route registry");
    expect(
      plan.steps.find((step) => step.id === "admin-system-health")?.safetyBoundary,
    ).toContain("No launch approval");
    expect(plan.steps.find((step) => step.id === "design-qa")?.route).toBe(
      "/admin/design-qa",
    );
    expect(
      plan.steps.find((step) => step.id === "design-qa")?.expectedReview,
    ).toContain("Figma target");
    expect(
      plan.steps.find((step) => step.id === "design-qa")?.safetyBoundary,
    ).toContain("Design QA");
    expect(
      plan.steps.find((step) => step.id === "production-operations")?.route,
    ).toBe("/admin/operations");
    expect(
      plan.steps.find((step) => step.id === "production-operations")
        ?.expectedReview,
    ).toContain("incident triage");
    expect(
      plan.steps.find((step) => step.id === "production-operations")
        ?.safetyBoundary,
    ).toContain("must not approve live launch");
    expect(
      plan.steps.find((step) => step.id === "leader-proof-decisions")?.expectedReview,
    ).toContain("approve, request-changes, and reject");
    expect(
      plan.steps.find((step) => step.id === "leader-proof-decisions")?.expectedReview,
    ).toContain("disabled result states");
    expect(
      plan.steps.find((step) => step.id === "leader-proof-decisions")?.expectedReview,
    ).toContain("Goal 115 SQL/RLS packet");
    expect(
      plan.steps.find((step) => step.id === "leader-proof-decisions")?.safetyBoundary,
    ).toContain("points ledger");
  });

  it("keeps DS Admin eligible and operating roles hidden", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getStakeholderReviewPlan(dsAdmin).canReadPlan).toBe(true);
    expect(getStakeholderReviewPlan(member).canReadPlan).toBe(false);
    expect(getStakeholderReviewPlan(leader).canReadPlan).toBe(false);
    expect(getStakeholderReviewPlan(coach).canReadPlan).toBe(false);
    expect(getStakeholderReviewPlan(member).phases).toEqual([]);
  });
});
