import { describe, expect, it } from "vitest";
import {
  getNextWriteActivationCandidate,
  getWriteActivationApprovalPlan,
  writeActivationCandidates,
  writeActivationRequirements,
} from "@/services/write-activation-approval-plan";

describe("write activation approval plan", () => {
  it("keeps browser and external writes disabled until approval", () => {
    expect(getWriteActivationApprovalPlan()).toEqual(
      expect.objectContaining({
        browserWritesEnabled: false,
        externalWritesEnabled: false,
        canActivateWithoutNickApproval: false,
        recommendedFirstOperation: "action_started",
      }),
    );
  });

  it("recommends the lowest-risk first write activation order", () => {
    expect(writeActivationCandidates.map((candidate) => candidate.operation)).toEqual([
      "action_started",
      "evidence_submitted",
      "leader_proof_decision",
      "hq_sharing_decision",
      "action_assigned",
      "coach_decision_logged",
      "membership_approved",
    ]);
    expect(writeActivationCandidates[0]).toEqual(
      expect.objectContaining({
        riskLevel: "low",
        route: "/rush-month/actions/[assignmentId]",
      }),
    );
    expect(writeActivationCandidates.slice(2).map((candidate) => candidate.riskLevel)).toEqual([
      "high",
      "high",
      "medium",
      "high",
      "high",
    ]);
  });

  it("requires every activation approval item to remain incomplete", () => {
    expect(writeActivationRequirements).toHaveLength(7);
    expect(
      writeActivationRequirements.every((requirement) => {
        return requirement.complete === false;
      }),
    ).toBe(true);
    expect(writeActivationRequirements.map((requirement) => requirement.key)).toEqual([
      "live_auth_session_verified",
      "server_action_identity_bound",
      "rls_ci_green",
      "rollback_path_defined",
      "success_error_states_reviewed",
      "external_writes_disabled",
      "audit_event_reviewed",
    ]);
  });

  it("returns the next unactivated write candidate", () => {
    expect(getNextWriteActivationCandidate([])?.operation).toBe("action_started");
    expect(getNextWriteActivationCandidate(["action_started"])?.operation).toBe(
      "evidence_submitted",
    );
    expect(
      getNextWriteActivationCandidate([
        "action_started",
        "evidence_submitted",
        "leader_proof_decision",
        "hq_sharing_decision",
        "action_assigned",
        "coach_decision_logged",
        "membership_approved",
      ]),
    ).toBeNull();
  });
});
