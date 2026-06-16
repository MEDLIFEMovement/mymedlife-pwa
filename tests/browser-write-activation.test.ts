import { describe, expect, it } from "vitest";
import { assignments } from "@/data/mock-rush-month";
import {
  getAssignmentCreateBrowserWriteGate,
  getActionStartBrowserWriteGate,
  getBlockingActivationChecks,
  getPassedActivationChecks,
} from "@/services/browser-write-activation";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("browser write activation gate", () => {
  it("keeps assignment-create browser control disabled for an allowed chapter leader", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const gate = getAssignmentCreateBrowserWriteGate(actor, {
      title: "Assign tabling event owner",
      instructions: "Ask one student to own and promote the next Rush Month event.",
      ownerRole: "General Member",
      dueLabel: "Friday",
      evidenceRequired: "Owner name and proof plan.",
      points: 10,
      kpi: "Owner assigned",
    });

    expect(gate.operation).toBe("action_assigned");
    expect(gate.localFunction).toBe("app.create_chapter_assignment");
    expect(gate.functionSignature).toContain("app.create_chapter_assignment");
    expect(gate.canRenderEnabledControl).toBe(false);
    expect(gate.status).toBe("blocked_until_approval");
    expect(gate.preview.success).toBe(true);
    expect(getPassedActivationChecks(gate).map((check) => check.key)).toEqual([
      "actor_can_create_assignment",
      "actor_allowed_by_write_plan",
      "local_database_function_exists",
      "rls_tests_exist",
      "external_writes_disabled",
    ]);
    expect(getBlockingActivationChecks(gate).map((check) => check.key)).toEqual([
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("keeps action-start browser control disabled for an allowed member", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = requireAssignment("member-push");
    const gate = getActionStartBrowserWriteGate(actor, assignment);

    expect(gate.operation).toBe("action_started");
    expect(gate.localFunction).toBe("app.start_assignment_action");
    expect(gate.canRenderEnabledControl).toBe(false);
    expect(gate.status).toBe("blocked_until_approval");
    expect(gate.preview.success).toBe(true);
    expect(getPassedActivationChecks(gate).map((check) => check.key)).toEqual([
      "actor_can_read_assignment",
      "actor_allowed_by_write_plan",
      "local_database_function_exists",
      "rls_tests_exist",
      "external_writes_disabled",
    ]);
    expect(getBlockingActivationChecks(gate).map((check) => check.key)).toEqual([
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("does not enable browser writes when the local write env var is requested", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const assignment = requireAssignment("assign-eboard");
    const gate = getActionStartBrowserWriteGate(actor, assignment, {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    });

    expect(gate.envRequestedLocalWrites).toBe(true);
    expect(gate.canRenderEnabledControl).toBe(false);
    expect(
      getBlockingActivationChecks(gate).find((check) => {
        return check.key === "browser_write_approved";
      })?.detail,
    ).toContain("browser-facing writes remain disabled");
  });

  it("blocks Admin from the assignment-create write plan", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const gate = getAssignmentCreateBrowserWriteGate(actor, {
      title: "Assign event owner",
      instructions: "Ask one student to own the next Rush Month event.",
      ownerRole: "General Member",
      dueLabel: "Friday",
      evidenceRequired: "Owner name and event plan.",
      points: 10,
      kpi: "Owner assigned",
    });

    expect(gate.preview.success).toBe(false);
    expect(
      getBlockingActivationChecks(gate).map((check) => {
        return check.key;
      }),
    ).toEqual([
      "actor_can_create_assignment",
      "actor_allowed_by_write_plan",
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("blocks DS Admin from the action-start write plan", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const assignment = requireAssignment("member-push");
    const gate = getActionStartBrowserWriteGate(actor, assignment);

    expect(gate.preview.success).toBe(false);
    expect(
      getBlockingActivationChecks(gate).map((check) => {
        return check.key;
      }),
    ).toEqual([
      "actor_can_read_assignment",
      "actor_allowed_by_write_plan",
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });
});

function requireAssignment(assignmentId: string) {
  const assignment = assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    throw new Error(`Missing mock assignment ${assignmentId}`);
  }

  return assignment;
}
