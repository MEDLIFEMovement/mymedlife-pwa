import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getStaffDryRunGuide } from "@/services/staff-dry-run-guide";

describe("staff dry-run guide", () => {
  it("gives admin an executable fake-user rehearsal guide with zero writes and sends", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const guide = getStaffDryRunGuide(actor);

    expect(guide.canReadGuide).toBe(true);
    expect(guide.title).toBe("Admin staff dry-run guide");
    expect(guide.verdict).toBe("ready_for_staff_dry_run");
    expect(guide.counts.steps).toBe(8);
    expect(guide.counts.passCriteria).toBeGreaterThan(20);
    expect(guide.counts.browserWritesExpected).toBe(0);
    expect(guide.counts.externalWritesExpected).toBe(0);
  });

  it("covers the member, leader, event, proof, coach, and DS safety rehearsal path", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const guide = getStaffDryRunGuide(actor);
    const stepIds = guide.steps.map((step) => step.id);

    expect(stepIds).toEqual([
      "admin-preflight",
      "member-week",
      "leader-follow-up",
      "event-nps",
      "proof-intake",
      "hq-proof-review",
      "coach-readout",
      "ds-safety",
    ]);
    expect(guide.steps.map((step) => step.route)).toEqual(
      expect.arrayContaining([
        "/admin",
        "/rush-month/dashboard",
        "/rush-month/actions",
        "/rush-month/events",
        "/proof-library/upload",
        "/proof-library",
        "/coach",
      ]),
    );
  });

  it("names structured events and safety assertions for every rehearsal step", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const guide = getStaffDryRunGuide(actor);

    expect(
      guide.steps.every((step) => step.structuredEventsToNotice.length > 0),
    ).toBe(true);
    expect(guide.steps.every((step) => step.safetyAssertion.length > 0)).toBe(
      true,
    );
    expect(
      guide.steps.flatMap((step) => step.structuredEventsToNotice),
    ).toEqual(expect.arrayContaining(["action_started", "evidence_submitted"]));
  });

  it("keeps DS Admin eligible and operating roles hidden", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getStaffDryRunGuide(dsAdmin).canReadGuide).toBe(true);
    expect(getStaffDryRunGuide(dsAdmin).title).toBe(
      "DS Admin staff dry-run safety guide",
    );
    expect(getStaffDryRunGuide(member).canReadGuide).toBe(false);
    expect(getStaffDryRunGuide(leader).canReadGuide).toBe(false);
    expect(getStaffDryRunGuide(coach).canReadGuide).toBe(false);
  });
});
