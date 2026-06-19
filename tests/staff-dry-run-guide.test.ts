import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaffDryRunGuide } from "@/services/staff-dry-run-guide";

const mockData = getMockReadOnlyAppData("Testing staff dry-run guide.");

describe("staff dry-run guide", () => {
  it("gives admin an executable fake-user rehearsal guide with zero writes and sends", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const guide = getStaffDryRunGuide(actor, mockData);

    expect(guide.canReadGuide).toBe(true);
    expect(guide.title).toBe("Admin staff dry-run guide");
    expect(guide.verdict).toBe("ready_for_staff_dry_run");
    expect(guide.counts.steps).toBe(8);
    expect(guide.counts.passCriteria).toBeGreaterThan(20);
    expect(guide.counts.browserWritesExpected).toBe(0);
    expect(guide.counts.externalWritesExpected).toBe(0);
    expect(guide.writeRehearsal.counts.externalWritesExpected).toBe(0);
  });

  it("covers the member, leader, event, proof, coach, and DS safety rehearsal path", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const guide = getStaffDryRunGuide(actor, mockData);
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
    const guide = getStaffDryRunGuide(actor, mockData);

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

  it("mirrors the seven local write packets for staff rehearsal", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const guide = getStaffDryRunGuide(actor, mockData);

    expect(guide.writeRehearsal.title).toBe("Seven local write rehearsal");
    expect(guide.writeRehearsal.counts.steps).toBe(7);
    expect(guide.writeRehearsal.counts.localBrowserWriteCandidates).toBe(7);
    expect(guide.writeRehearsal.counts.externalWritesExpected).toBe(0);
    expect(guide.writeRehearsal.steps.map((step) => step.operation)).toEqual([
      "membership_approved",
      "action_assigned",
      "action_started",
      "evidence_submitted",
      "leader_proof_decision_logged",
      "hq_sharing_decision_logged",
      "coach_decision_logged",
    ]);
    expect(guide.writeRehearsal.steps.map((step) => step.packetRoute)).toEqual([
      "/chapter/members",
      "/admin/assignment-write",
      "/admin/first-write",
      "/admin/proof-write",
      "/rush-month/review",
      "/admin/hq-proof-write",
      "/admin/coach-write",
    ]);
    expect(guide.writeRehearsal.steps.map((step) => step.operatingRoute)).toEqual(
      expect.arrayContaining([
        "/rush-month/actions",
        "/rush-month/review",
        "/coach",
        "/chapter/members",
      ]),
    );
  });

  it("inherits role responsibility for every write rehearsal step", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const guide = getStaffDryRunGuide(actor, mockData);
    const assignment = guide.writeRehearsal.steps.find(
      (step) => step.operation === "action_assigned",
    );

    expect(
      guide.writeRehearsal.steps.every(
        (step) =>
          step.roleResponsibility.roleLabel.length > 0 &&
          step.roleResponsibility.reviewPrompt.length > 20 &&
          step.roleResponsibility.safetyBoundary.length > 20,
      ),
    ).toBe(true);
    expect(assignment?.roleResponsibility.responsibility).toBe(
      "Approve, hand off, and coordinate assignment work",
    );
    expect(assignment?.roleResponsibility.reviewPrompt).toContain(
      "E-Board owner handoff",
    );
  });

  it("keeps rehearsal steps as guidance rather than enabled writes", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const guide = getStaffDryRunGuide(actor, mockData);

    expect(
      guide.writeRehearsal.steps.every(
        (step) => step.externalWritesExpected === 0,
      ),
    ).toBe(true);
    expect(
      guide.writeRehearsal.steps.every((step) =>
        step.stopCondition.toLowerCase().includes("stop"),
      ),
    ).toBe(true);
    expect(
      guide.writeRehearsal.steps.find(
        (step) => step.operation === "evidence_submitted",
      )?.rehearsalAction,
    ).toContain("do not upload files");
  });

  it("keeps DS Admin eligible and operating roles hidden", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getStaffDryRunGuide(dsAdmin, mockData).canReadGuide).toBe(true);
    expect(getStaffDryRunGuide(dsAdmin, mockData).title).toBe(
      "DS Admin staff dry-run safety guide",
    );
    expect(getStaffDryRunGuide(member, mockData).canReadGuide).toBe(false);
    expect(getStaffDryRunGuide(leader, mockData).canReadGuide).toBe(false);
    expect(getStaffDryRunGuide(coach, mockData).canReadGuide).toBe(false);
    expect(getStaffDryRunGuide(member, mockData).writeRehearsal.steps).toEqual([]);
  });
});
