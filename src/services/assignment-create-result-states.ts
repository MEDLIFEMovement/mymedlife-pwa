import {
  canCreateChapterAssignment,
  type ChapterAssignmentInput,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getWriteReadinessSummary } from "@/services/write-readiness";
import type { Assignment } from "@/shared/types/domain";

export type AssignmentCreateResultCode =
  | "assignment_created"
  | "duplicate_assignment"
  | "evidence_requirement_too_short"
  | "instructions_too_short"
  | "invalid_points"
  | "kpi_required"
  | "missing_auth"
  | "permission_denied"
  | "reminders_disabled"
  | "server_error"
  | "title_too_short"
  | "write_disabled";

export type AssignmentCreateResultTone = "error" | "info" | "success" | "warning";

export type AssignmentCreateResultState = {
  code: AssignmentCreateResultCode;
  title: string;
  plainEnglishMessage: string;
  nextStep: string;
  tone: AssignmentCreateResultTone;
  success: boolean;
  retryAllowed: boolean;
  createsAssignment: boolean;
  createsOutboxItem: boolean;
  sendsReminder: false;
};

export type AssignmentCreateResultPreview = {
  operation: "action_assigned";
  currentResult: AssignmentCreateResultState;
  futureResultIfEnabled: AssignmentCreateResultState;
  serverResultShape: {
    success: boolean;
    errorCode?: AssignmentCreateResultCode;
    title: string;
    plainEnglishMessage: string;
  };
};

const assignmentCreateResultStates = [
  {
    code: "assignment_created",
    title: "Assignment created",
    plainEnglishMessage:
      "The student action is ready for the owner to complete, with proof instructions and due date attached.",
    nextStep:
      "Show the new assignment in the chapter action list and keep reminder automation disabled unless approved.",
    tone: "success",
    success: true,
    retryAllowed: false,
    createsAssignment: true,
    createsOutboxItem: true,
    sendsReminder: false,
  },
  {
    code: "write_disabled",
    title: "Assignment save is not turned on yet",
    plainEnglishMessage:
      "This leader assignment form is safe to preview, but the app is not allowed to save assignments from the browser yet.",
    nextStep:
      "Keep using the mock preview until Nick approves live auth and browser-facing writes.",
    tone: "info",
    success: false,
    retryAllowed: false,
    createsAssignment: false,
    createsOutboxItem: false,
    sendsReminder: false,
  },
  {
    code: "reminders_disabled",
    title: "Reminder automation is not turned on yet",
    plainEnglishMessage:
      "Creating an assignment may shape a future reminder outbox row, but no n8n, email, or SMS reminder should be sent.",
    nextStep: "Keep the outbox row disabled until external automation is explicitly approved.",
    tone: "info",
    success: false,
    retryAllowed: false,
    createsAssignment: false,
    createsOutboxItem: false,
    sendsReminder: false,
  },
  {
    code: "duplicate_assignment",
    title: "Assignment already exists",
    plainEnglishMessage:
      "A similar assignment already exists, so the app should not create a duplicate action for the same chapter.",
    nextStep: "Show the existing assignment and ask the leader to edit or choose a different action.",
    tone: "warning",
    success: false,
    retryAllowed: false,
    createsAssignment: false,
    createsOutboxItem: false,
    sendsReminder: false,
  },
  {
    code: "permission_denied",
    title: "This role cannot create assignments",
    plainEnglishMessage:
      "Assignment creation belongs to chapter leaders or Super Admin, not general members, coaches, Admin, or DS Admin.",
    nextStep: "Switch to a chapter leader or Super Admin role, or keep the page read-only.",
    tone: "error",
    success: false,
    retryAllowed: false,
    createsAssignment: false,
    createsOutboxItem: false,
    sendsReminder: false,
  },
  {
    code: "missing_auth",
    title: "Sign-in is required",
    plainEnglishMessage:
      "The app must know which leader is signed in before saving a new assignment.",
    nextStep: "After live auth is approved, send the leader through the sign-in flow.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsAssignment: false,
    createsOutboxItem: false,
    sendsReminder: false,
  },
  {
    code: "title_too_short",
    title: "Assignment title needs more detail",
    plainEnglishMessage:
      "The title needs to be clear enough for a student to understand what action they own.",
    nextStep: "Ask the leader for a short action title before saving.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsAssignment: false,
    createsOutboxItem: false,
    sendsReminder: false,
  },
  {
    code: "instructions_too_short",
    title: "Instructions need more detail",
    plainEnglishMessage:
      "The assignment needs enough instructions for the student to know what to do next.",
    nextStep: "Ask the leader to explain the action before saving.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsAssignment: false,
    createsOutboxItem: false,
    sendsReminder: false,
  },
  {
    code: "evidence_requirement_too_short",
    title: "Proof requirement needs more detail",
    plainEnglishMessage:
      "The assignment needs a clear proof or testimonial requirement before it can be saved.",
    nextStep: "Ask the leader to describe what proof the owner should collect.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsAssignment: false,
    createsOutboxItem: false,
    sendsReminder: false,
  },
  {
    code: "kpi_required",
    title: "KPI is required",
    plainEnglishMessage:
      "The assignment needs a KPI so the chapter and coach can understand what progress it supports.",
    nextStep: "Ask the leader to connect the action to a simple KPI before saving.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsAssignment: false,
    createsOutboxItem: false,
    sendsReminder: false,
  },
  {
    code: "invalid_points",
    title: "Points value is outside the allowed range",
    plainEnglishMessage:
      "The points value needs to stay between 0 and 1000 so the leaderboard remains sane.",
    nextStep: "Ask the leader to choose a points value in the allowed range.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsAssignment: false,
    createsOutboxItem: false,
    sendsReminder: false,
  },
  {
    code: "server_error",
    title: "Something went wrong",
    plainEnglishMessage:
      "The app could not safely save this assignment. No reminders or external automation should run.",
    nextStep: "Show a friendly retry message and log the error for the product team.",
    tone: "error",
    success: false,
    retryAllowed: true,
    createsAssignment: false,
    createsOutboxItem: false,
    sendsReminder: false,
  },
] as const satisfies readonly AssignmentCreateResultState[];

export function getAssignmentCreateResultStates(): readonly AssignmentCreateResultState[] {
  return assignmentCreateResultStates;
}

export function getAssignmentCreateResultState(
  code: AssignmentCreateResultCode,
): AssignmentCreateResultState {
  const state = assignmentCreateResultStates.find((item) => item.code === code);

  if (!state) {
    throw new Error(`Unknown assignment-create result code: ${code}`);
  }

  return state;
}

export function getFutureAssignmentCreateResultIfEnabled(
  actor: LocalActorContext | null,
  input: ChapterAssignmentInput,
  existingAssignments: readonly Assignment[] = [],
): AssignmentCreateResultState {
  if (!actor) {
    return getAssignmentCreateResultState("missing_auth");
  }

  if (!canCreateChapterAssignment(actor)) {
    return getAssignmentCreateResultState("permission_denied");
  }

  const normalizedTitle = input.title.trim();
  const duplicateAssignment = existingAssignments.some((assignment) => {
    return assignment.title.trim().toLowerCase() === normalizedTitle.toLowerCase();
  });

  if (normalizedTitle.length < 5) {
    return getAssignmentCreateResultState("title_too_short");
  }

  if (input.instructions.trim().length < 12) {
    return getAssignmentCreateResultState("instructions_too_short");
  }

  if (input.evidenceRequired.trim().length < 5) {
    return getAssignmentCreateResultState("evidence_requirement_too_short");
  }

  if (input.kpi.trim().length < 2) {
    return getAssignmentCreateResultState("kpi_required");
  }

  if (input.points < 0 || input.points > 1000) {
    return getAssignmentCreateResultState("invalid_points");
  }

  if (duplicateAssignment) {
    return getAssignmentCreateResultState("duplicate_assignment");
  }

  return getAssignmentCreateResultState("assignment_created");
}

export function getDisabledAssignmentCreateResultPreview(
  actor: LocalActorContext,
  input: ChapterAssignmentInput,
  existingAssignments: readonly Assignment[] = [],
): AssignmentCreateResultPreview {
  const currentResult = getAssignmentCreateResultState("write_disabled");

  return {
    operation: "action_assigned",
    currentResult,
    futureResultIfEnabled: getFutureAssignmentCreateResultIfEnabled(
      actor,
      input,
      existingAssignments,
    ),
    serverResultShape: {
      success: false,
      errorCode: currentResult.code,
      title: input.title,
      plainEnglishMessage: `${currentResult.plainEnglishMessage} ${getWriteReadinessSummary()}`,
    },
  };
}
