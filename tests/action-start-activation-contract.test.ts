import { describe, expect, it } from "vitest";
import { assignments } from "@/data/mock-rush-month";
import {
  getActionStartActivationContract,
  prepareDisabledActionStartActivationAttempt,
} from "@/services/action-start-activation-contract";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("action-start activation contract", () => {
  it("defines the first browser write without enabling it", () => {
    expect(getActionStartActivationContract()).toEqual(
      expect.objectContaining({
        operation: "action_started",
        route: "/rush-month/actions/[assignmentId]",
        serverActionName: "startAssignmentAction",
        localFunction: "app.start_assignment_action",
        browserControlEnabled: false,
        externalWritesEnabled: false,
      }),
    );
  });

  it("only allows assignmentId from the route as client request input", () => {
    const contract = getActionStartActivationContract();

    expect(contract.requestFields).toEqual([
      {
        name: "assignmentId",
        source: "route_param",
        required: true,
        clientMayProvideActor: false,
      },
    ]);
    expect(contract.serverIdentityRule).toContain("Supabase Auth/session");
    expect(contract.serverIdentityRule).toContain("never from client-provided role");
  });

  it("returns a disabled attempt for the visible action-start route", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = requireAssignment("member-push");
    const attempt = prepareDisabledActionStartActivationAttempt(actor, assignment);

    expect(attempt.success).toBe(false);
    expect(attempt.browserControlEnabled).toBe(false);
    expect(attempt.serverActionName).toBe("startAssignmentAction");
    expect(attempt.operation).toBe("action_started");
    expect(attempt.request).toEqual({
      assignmentId: "member-push",
    });
    expect(attempt.wouldWriteTables).toEqual([
      "assignments",
      "events",
      "integration_events",
      "audit_logs",
    ]);
    expect(attempt.preview.success).toBe(true);
  });

  it("documents approvals before any save button can appear", () => {
    const contract = getActionStartActivationContract();

    expect(contract.approvalRequirements).toEqual(
      expect.arrayContaining([
        "Nick/team approves live auth/session readiness.",
        "External writes remain disabled.",
        "Rollback behavior is documented.",
      ]),
    );
  });
});

function requireAssignment(assignmentId: string) {
  const assignment = assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    throw new Error(`Missing mock assignment ${assignmentId}`);
  }

  return assignment;
}
