import { describe, expect, it } from "vitest";
import { getControlledPilotReadiness } from "@/services/controlled-pilot-readiness";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("controlled pilot readiness", () => {
  it("marks staff dry run ready but real student pilot not ready", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const readiness = getControlledPilotReadiness(actor);

    expect(readiness.canReadReadiness).toBe(true);
    expect(readiness.title).toBe("Admin controlled pilot readiness");
    expect(readiness.verdict).toBe("staff_dry_run_ready_not_student_pilot");
    expect(readiness.counts.browserWritesExpected).toBe(0);
    expect(readiness.counts.externalWritesExpected).toBe(0);
    expect(
      readiness.stages.find((stage) => stage.key === "staff_dry_run")?.status,
    ).toBe("ready_now");
    expect(
      readiness.stages.find((stage) => stage.key === "staff_dry_run")
        ?.requiredProof,
    ).toContain("Open `/admin/staff-dry-run`.");
    expect(
      readiness.stages.find((stage) => stage.key === "first_student_pilot")
        ?.requiredProof,
    ).toContain(
      "Open `/admin/pilot-scope` and confirm the selected scope is the smallest safe pilot.",
    );
    expect(
      readiness.stages.find((stage) => stage.key === "first_student_pilot")
        ?.status,
    ).toBe("blocked_before_pilot");
  });

  it("keeps pilot scope, event/NPS path, and coach support as decisions", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const readiness = getControlledPilotReadiness(actor);

    expect(
      readiness.gates.find((gate) => gate.key === "pilot_scope")?.status,
    ).toBe("needs_decision");
    expect(
      readiness.gates.find((gate) => gate.key === "event_nps_path")?.status,
    ).toBe("needs_decision");
    expect(
      readiness.gates.find((gate) => gate.key === "coach_support")?.status,
    ).toBe("needs_decision");
  });

  it("keeps staging, auth, writes, and proof storage blocked before pilot", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const readiness = getControlledPilotReadiness(actor);
    const blockedGateKeys = readiness.gates
      .filter((gate) => gate.status === "blocked_before_pilot")
      .map((gate) => gate.key);

    expect(blockedGateKeys).toEqual(
      expect.arrayContaining([
        "staging_environment",
        "auth_onboarding",
        "pilot_writes",
        "proof_consent_storage",
      ]),
    );
  });

  it("keeps DS Admin eligible without making external integrations live", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const readiness = getControlledPilotReadiness(actor);
    const externalIntegrations = readiness.gates.find(
      (gate) => gate.key === "external_integrations",
    );

    expect(readiness.canReadReadiness).toBe(true);
    expect(readiness.title).toBe("DS Admin controlled pilot safety readiness");
    expect(externalIntegrations?.status).toBe("blocked_before_scale");
    expect(externalIntegrations?.plainEnglish).toContain("should stay disabled");
  });

  it("marks recorded pilot chapter, event posture, and coach owner as ready-now gates", () => {
    const originalChapter = process.env.MYMEDLIFE_PILOT_CHAPTER;
    const originalEventNps = process.env.MYMEDLIFE_PILOT_EVENT_NPS_POSTURE;
    const originalCoach = process.env.MYMEDLIFE_PILOT_COACH_OWNER;

    process.env.MYMEDLIFE_PILOT_CHAPTER = "Boston College MEDLIFE";
    process.env.MYMEDLIFE_PILOT_EVENT_NPS_POSTURE = "manual-first";
    process.env.MYMEDLIFE_PILOT_COACH_OWNER = "Priya Coach";

    try {
      const readiness = getControlledPilotReadiness(
        getMockLocalActorContext("admin@mymedlife.test"),
      );

      expect(
        readiness.gates.find((gate) => gate.key === "pilot_scope")?.status,
      ).toBe("ready_now");
      expect(
        readiness.gates.find((gate) => gate.key === "event_nps_path")?.status,
      ).toBe("ready_now");
      expect(
        readiness.gates.find((gate) => gate.key === "coach_support")?.status,
      ).toBe("ready_now");
      expect(readiness.recommendedNextMove).toContain("/admin/phase-2");
      expect(
        readiness.stages.find((stage) => stage.key === "first_student_pilot")
          ?.requiredProof[0],
      ).toContain("Boston College MEDLIFE");
    } finally {
      restoreEnv("MYMEDLIFE_PILOT_CHAPTER", originalChapter);
      restoreEnv("MYMEDLIFE_PILOT_EVENT_NPS_POSTURE", originalEventNps);
      restoreEnv("MYMEDLIFE_PILOT_COACH_OWNER", originalCoach);
    }
  });

  it("hides pilot readiness from operating roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getControlledPilotReadiness(member).canReadReadiness).toBe(false);
    expect(getControlledPilotReadiness(committeeMember).canReadReadiness).toBe(false);
    expect(getControlledPilotReadiness(committeeChair).canReadReadiness).toBe(false);
    expect(getControlledPilotReadiness(leader).canReadReadiness).toBe(false);
    expect(getControlledPilotReadiness(coach).canReadReadiness).toBe(false);
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
