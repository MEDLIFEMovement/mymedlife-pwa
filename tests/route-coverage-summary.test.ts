import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getRouteCoverageSummary } from "@/services/route-coverage-summary";

describe("route coverage summary", () => {
  it("shows admin route coverage with no unknown navigation or smoke routes", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const summary = getRouteCoverageSummary(actor);

    expect(summary.canReadSummary).toBe(true);
    expect(summary.counts.knownRoutes).toBeGreaterThan(10);
    expect(summary.counts.primaryNavigationHrefs).toBeGreaterThan(0);
    expect(summary.counts.mobileNavigationHrefs).toBeGreaterThan(0);
    expect(summary.counts.smokeRoutes).toBe(16);
    expect(summary.counts.unknownNavigationHrefs).toBe(0);
    expect(summary.counts.unknownSmokeRoutes).toBe(0);
    expect(summary.counts.browserWritesExpected).toBe(0);
    expect(summary.counts.externalWritesExpected).toBe(0);
  });

  it("keeps DS Admin and Super Admin eligible for route coverage review", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(getRouteCoverageSummary(dsAdmin).canReadSummary).toBe(true);
    expect(getRouteCoverageSummary(superAdmin).canReadSummary).toBe(true);
  });

  it("hides route coverage from chapter and coach operating roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getRouteCoverageSummary(member).canReadSummary).toBe(false);
    expect(getRouteCoverageSummary(committeeMember).canReadSummary).toBe(false);
    expect(getRouteCoverageSummary(committeeChair).canReadSummary).toBe(false);
    expect(getRouteCoverageSummary(leader).canReadSummary).toBe(false);
    expect(getRouteCoverageSummary(coach).canReadSummary).toBe(false);
  });
});
