import type { LocalActorContext } from "@/services/local-actor-context";
import { canStartAssignmentAction } from "@/services/local-action-contracts";
import { canReadAssignment } from "@/services/role-visibility";
import { getWriteReadinessSummary } from "@/services/write-readiness";
import type { Assignment } from "@/shared/types/domain";

export type ActionStartResultCode =
  | "already_started"
  | "assignment_not_found"
  | "missing_auth"
  | "permission_denied"
  | "server_error"
  | "started"
  | "write_disabled";

export type ActionStartResultTone = "error" | "info" | "success" | "warning";

export type ActionStartResultState = {
  code: ActionStartResultCode;
  title: string;
  plainEnglishMessage: string;
  nextStep: string;
  tone: ActionStartResultTone;
  success: boolean;
  retryAllowed: boolean;
  createsEvent: boolean;
};

export type ActionStartResultPreview = {
  operation: "action_started";
  currentResult: ActionStartResultState;
  futureResultIfEnabled: ActionStartResultState;
  serverResultShape: {
    success: boolean;
    errorCode?: ActionStartResultCode;
    assignmentId: string;
    plainEnglishMessage: string;
  };
};

const actionStartResultStates = [
  {
    code: "started",
    title: "Action started",
    plainEnglishMessage:
      "You are now working on this action. Finish the work, then submit your proof or testimonial.",
    nextStep: "Show the proof instructions and keep the action visible in My Week.",
    tone: "success",
    success: true,
    retryAllowed: false,
    createsEvent: true,
  },
  {
    code: "write_disabled",
    title: "Save is not turned on yet",
    plainEnglishMessage:
      "This preview is safe to review, but the app is not allowed to save action-start changes from the browser yet.",
    nextStep:
      "Keep using the mock preview until Nick approves live auth and browser-facing writes.",
    tone: "info",
    success: false,
    retryAllowed: false,
    createsEvent: false,
  },
  {
    code: "already_started",
    title: "This action is already underway",
    plainEnglishMessage:
      "This action has already been started, so the app should not create a duplicate start event.",
    nextStep: "Move the student toward proof submission instead of saving another start.",
    tone: "warning",
    success: false,
    retryAllowed: false,
    createsEvent: false,
  },
  {
    code: "permission_denied",
    title: "This role cannot start this action",
    plainEnglishMessage:
      "The selected role can see this page only when policy allows it, and only approved roles may start the action.",
    nextStep: "Switch to the correct local role or ask a chapter leader or coach to review ownership.",
    tone: "error",
    success: false,
    retryAllowed: false,
    createsEvent: false,
  },
  {
    code: "missing_auth",
    title: "Sign-in is required",
    plainEnglishMessage:
      "The app must know who is signed in before it can save action progress.",
    nextStep: "After live auth is approved, send the student through the sign-in flow.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsEvent: false,
  },
  {
    code: "assignment_not_found",
    title: "Action was not found",
    plainEnglishMessage:
      "The action link does not match an active assignment in this chapter.",
    nextStep: "Send the student back to My Actions and avoid saving anything.",
    tone: "error",
    success: false,
    retryAllowed: false,
    createsEvent: false,
  },
  {
    code: "server_error",
    title: "Something went wrong",
    plainEnglishMessage:
      "The app could not safely save this action-start event. No external automation should run.",
    nextStep: "Show a friendly retry message and log the error for the product team.",
    tone: "error",
    success: false,
    retryAllowed: true,
    createsEvent: false,
  },
] as const satisfies readonly ActionStartResultState[];

export function getActionStartResultStates(): readonly ActionStartResultState[] {
  return actionStartResultStates;
}

export function getActionStartResultState(
  code: ActionStartResultCode,
): ActionStartResultState {
  const state = actionStartResultStates.find((item) => item.code === code);

  if (!state) {
    throw new Error(`Unknown action-start result code: ${code}`);
  }

  return state;
}

export function getFutureActionStartResultIfEnabled(
  actor: LocalActorContext | null,
  assignment: Assignment | null,
): ActionStartResultState {
  if (!actor) {
    return getActionStartResultState("missing_auth");
  }

  if (!assignment) {
    return getActionStartResultState("assignment_not_found");
  }

  const actorCanRead = canReadAssignment(actor, assignment);
  const actorCanWrite = canStartAssignmentAction(actor, assignment);

  if (!actorCanRead || !actorCanWrite) {
    return getActionStartResultState("permission_denied");
  }

  if (assignment.status !== "not_started") {
    return getActionStartResultState("already_started");
  }

  return getActionStartResultState("started");
}

export function getDisabledActionStartResultPreview(
  actor: LocalActorContext,
  assignment: Assignment,
): ActionStartResultPreview {
  const currentResult = getActionStartResultState("write_disabled");

  return {
    operation: "action_started",
    currentResult,
    futureResultIfEnabled: getFutureActionStartResultIfEnabled(actor, assignment),
    serverResultShape: {
      success: false,
      errorCode: currentResult.code,
      assignmentId: assignment.id,
      plainEnglishMessage: `${currentResult.plainEnglishMessage} ${getWriteReadinessSummary()}`,
    },
  };
}
