import type { LocalActorContext } from "@/services/local-actor-context";
import { prepareDisabledActionStartWrite } from "@/services/write-readiness";
import type { Assignment } from "@/shared/types/domain";

export type ActionStartRequestField = {
  name: "assignmentId";
  source: "route_param";
  required: true;
  clientMayProvideActor: false;
};

export type ActionStartActivationContract = {
  operation: "action_started";
  route: "/rush-month/actions/[assignmentId]";
  serverActionName: "startAssignmentAction";
  localFunction: "app.start_assignment_action";
  browserControlEnabled: false;
  externalWritesEnabled: false;
  requestFields: readonly ActionStartRequestField[];
  serverIdentityRule: string;
  successResultShape: readonly string[];
  failureResultShape: readonly string[];
  approvalRequirements: readonly string[];
};

export type DisabledActionStartActivationAttempt = ReturnType<
  typeof prepareDisabledActionStartWrite
> & {
  browserControlEnabled: false;
  serverActionName: ActionStartActivationContract["serverActionName"];
  request: {
    assignmentId: string;
  };
};

export function getActionStartActivationContract(): ActionStartActivationContract {
  return {
    operation: "action_started",
    route: "/rush-month/actions/[assignmentId]",
    serverActionName: "startAssignmentAction",
    localFunction: "app.start_assignment_action",
    browserControlEnabled: false,
    externalWritesEnabled: false,
    requestFields: [
      {
        name: "assignmentId",
        source: "route_param",
        required: true,
        clientMayProvideActor: false,
      },
    ],
    serverIdentityRule:
      "The server action must derive actor identity from Supabase Auth/session context, never from client-provided role, audience, user ID, or email fields.",
    successResultShape: [
      "success: true",
      "assignmentId",
      "nextStatus",
      "eventId",
      "auditLogId",
    ],
    failureResultShape: ["success: false", "errorCode", "plainEnglishMessage"],
    approvalRequirements: [
      "Nick/team approves live auth/session readiness.",
      "The action detail page has reviewed success and error states.",
      "GitHub CI RLS tests pass for app.start_assignment_action.",
      "External writes remain disabled.",
      "Rollback behavior is documented.",
    ],
  };
}

export function prepareDisabledActionStartActivationAttempt(
  actor: LocalActorContext,
  assignment: Assignment,
): DisabledActionStartActivationAttempt {
  return {
    ...prepareDisabledActionStartWrite(actor, assignment),
    browserControlEnabled: false,
    serverActionName: "startAssignmentAction",
    request: {
      assignmentId: assignment.id,
    },
  };
}
