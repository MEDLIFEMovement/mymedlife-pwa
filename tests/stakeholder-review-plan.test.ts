import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getStakeholderReviewPlan } from "@/services/stakeholder-review-plan";

describe("stakeholder review plan", () => {
  it("gives admin a no-code review path with zero writes and sends", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const plan = getStakeholderReviewPlan(actor);

    expect(plan.canReadPlan).toBe(true);
    expect(plan.counts.steps).toBe(10);
    expect(plan.counts.browserWritesExpected).toBe(0);
    expect(plan.counts.externalWritesExpected).toBe(0);
    expect(plan.steps.every((step) => step.safetyBoundary.length > 0)).toBe(true);
  });

  it("covers member, leader, proof, coach, and admin review moments", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const plan = getStakeholderReviewPlan(actor);
    const routes = plan.steps.map((step) => step.route);

    expect(routes).toEqual([
      "/rush-month/dashboard",
      "/rush-month/actions",
      "/chapter/members",
      "/rush-month/loop",
      "/rush-month/events",
      "/proof-library",
      "/proof-library/upload",
      "/coach",
      "/admin",
      "/admin",
    ]);
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
  });
});
