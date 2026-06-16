import {
  createActionStartedMock,
  type LocalContractResult,
  type LocalActionStarted,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { canReadAssignment } from "@/services/role-visibility";
import { getWritePlanOperation } from "@/services/write-plan-matrix";
import { getWriteReadinessConfig } from "@/services/write-readiness";
import type { Assignment } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type ActivationCheckKey =
  | "actor_can_read_assignment"
  | "actor_allowed_by_write_plan"
  | "local_database_function_exists"
  | "rls_tests_exist"
  | "external_writes_disabled"
  | "live_auth_approved"
  | "browser_write_approved";

export type ActivationCheck = {
  key: ActivationCheckKey;
  label: string;
  passed: boolean;
  detail: string;
};

export type BrowserWriteActivationGate = {
  operation: "action_started";
  route: "/rush-month/actions/[assignmentId]";
  label: string;
  localFunction: "app.start_assignment_action";
  status: "blocked_until_approval";
  canRenderEnabledControl: false;
  envRequestedLocalWrites: boolean;
  nextApprovalNeeded: string;
  checks: ActivationCheck[];
  preview: LocalContractResult<LocalActionStarted>;
};

const approvalMessage =
  "Nick must explicitly approve browser-facing local writes after live auth/readiness review.";

export function getActionStartBrowserWriteGate(
  actor: LocalActorContext,
  assignment: Assignment,
  env: EnvSource = process.env,
): BrowserWriteActivationGate {
  const writePlan = getWritePlanOperation("action_started");
  const writeReadiness = getWriteReadinessConfig(env);
  const actorCanReadAssignment = canReadAssignment(actor, assignment);
  const actorAllowedByPlan = writePlan.allowedActors.includes(actor.audience);

  return {
    operation: "action_started",
    route: "/rush-month/actions/[assignmentId]",
    label: "Start assignment browser write",
    localFunction: "app.start_assignment_action",
    status: "blocked_until_approval",
    canRenderEnabledControl: false,
    envRequestedLocalWrites: env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true",
    nextApprovalNeeded: approvalMessage,
    checks: [
      {
        key: "actor_can_read_assignment",
        label: "Current local actor can read this assignment",
        passed: actorCanReadAssignment,
        detail: actorCanReadAssignment
          ? "The role-aware read filter exposes this assignment."
          : "The role-aware read filter hides this assignment.",
      },
      {
        key: "actor_allowed_by_write_plan",
        label: "Actor is allowed by the planned write matrix",
        passed: actorAllowedByPlan,
        detail: actorAllowedByPlan
          ? `${actor.audienceLabel} is allowed for action start in the write plan.`
          : `${actor.audienceLabel} is blocked from action start in the write plan.`,
      },
      {
        key: "local_database_function_exists",
        label: "Local database function exists",
        passed: true,
        detail: "Goal 14 implemented app.start_assignment_action(assignment_uuid uuid).",
      },
      {
        key: "rls_tests_exist",
        label: "RLS/security tests exist",
        passed: true,
        detail:
          "supabase/tests/database/rls_goal_14.test.sql proves direct updates are blocked and function writes are audited.",
      },
      {
        key: "external_writes_disabled",
        label: "External writes stay disabled",
        passed: true,
        detail:
          "Action start records internal/integration events only; it does not create outbox rows or send external writes.",
      },
      {
        key: "live_auth_approved",
        label: "Live auth/browser session approved",
        passed: false,
        detail: "Live auth is still disabled, so browser identity cannot be trusted for real writes.",
      },
      {
        key: "browser_write_approved",
        label: "Browser write approval granted",
        passed: false,
        detail: writeReadiness.reason,
      },
    ],
    preview: createActionStartedMock(actor, assignment),
  };
}

export function getPassedActivationChecks(gate: BrowserWriteActivationGate) {
  return gate.checks.filter((check) => {
    return check.passed;
  });
}

export function getBlockingActivationChecks(gate: BrowserWriteActivationGate) {
  return gate.checks.filter((check) => {
    return !check.passed;
  });
}
