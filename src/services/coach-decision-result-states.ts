import {
  canLogCoachDecision,
  type CoachDecisionInput,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getWriteReadinessSummary } from "@/services/write-readiness";

export type CoachDecisionResultCode =
  | "advance_recorded"
  | "blocker_summary_required"
  | "escalation_disabled"
  | "hold_recorded"
  | "intervention_recorded"
  | "missing_auth"
  | "note_too_short"
  | "permission_denied"
  | "portfolio_not_assigned"
  | "server_error"
  | "write_disabled";

export type CoachDecisionResultTone = "error" | "info" | "success" | "warning";

export type CoachDecisionResultState = {
  code: CoachDecisionResultCode;
  title: string;
  plainEnglishMessage: string;
  nextStep: string;
  tone: CoachDecisionResultTone;
  success: boolean;
  retryAllowed: boolean;
  createsReadinessReview: boolean;
  createsOutboxItem: boolean;
  sendsEscalationPacket: false;
};

export type CoachDecisionResultPreview = {
  operation: "coach_decision_logged";
  currentResult: CoachDecisionResultState;
  futureResultIfEnabled: CoachDecisionResultState;
  serverResultShape: {
    success: boolean;
    errorCode?: CoachDecisionResultCode;
    decision: CoachDecisionInput["decision"];
    plainEnglishMessage: string;
  };
};

const coachDecisionResultStates = [
  {
    code: "advance_recorded",
    title: "Coach decision recorded: advance",
    plainEnglishMessage:
      "The chapter is ready to advance. The app may record the decision and keep the coaching history auditable.",
    nextStep: "Show the next phase path and keep external automation disabled unless approved.",
    tone: "success",
    success: true,
    retryAllowed: false,
    createsReadinessReview: true,
    createsOutboxItem: true,
    sendsEscalationPacket: false,
  },
  {
    code: "hold_recorded",
    title: "Coach decision recorded: hold",
    plainEnglishMessage:
      "The chapter needs more time or follow-up before advancing, but it is not yet an intervention case.",
    nextStep:
      "Record the hold reason, keep the action plan visible, and avoid sending external escalation packets.",
    tone: "warning",
    success: true,
    retryAllowed: false,
    createsReadinessReview: true,
    createsOutboxItem: true,
    sendsEscalationPacket: false,
  },
  {
    code: "intervention_recorded",
    title: "Coach decision recorded: intervene",
    plainEnglishMessage:
      "The chapter needs active support. The app may record the intervention decision and shape a disabled escalation packet.",
    nextStep:
      "Show the blocker summary and keep any n8n escalation packet disabled until automation is approved.",
    tone: "warning",
    success: true,
    retryAllowed: false,
    createsReadinessReview: true,
    createsOutboxItem: true,
    sendsEscalationPacket: false,
  },
  {
    code: "write_disabled",
    title: "Coach decision save is not turned on yet",
    plainEnglishMessage:
      "This coach dashboard is safe to preview, but the app is not allowed to save coach decisions from the browser yet.",
    nextStep:
      "Keep using the mock preview until Nick approves live auth and browser-facing writes.",
    tone: "info",
    success: false,
    retryAllowed: false,
    createsReadinessReview: false,
    createsOutboxItem: false,
    sendsEscalationPacket: false,
  },
  {
    code: "escalation_disabled",
    title: "Escalation packets are not turned on yet",
    plainEnglishMessage:
      "Coach intervention data may shape a future n8n packet, but no packet should be sent from the app yet.",
    nextStep: "Keep the outbox row disabled until external automation is explicitly approved.",
    tone: "info",
    success: false,
    retryAllowed: false,
    createsReadinessReview: false,
    createsOutboxItem: false,
    sendsEscalationPacket: false,
  },
  {
    code: "permission_denied",
    title: "This role cannot log coach decisions",
    plainEnglishMessage:
      "Coach decisions belong to coaches, HQ Admin, or Super Admin, not students, chapter leaders, or DS Admin.",
    nextStep: "Switch to a coach or HQ decision-making role, or keep this page read-only.",
    tone: "error",
    success: false,
    retryAllowed: false,
    createsReadinessReview: false,
    createsOutboxItem: false,
    sendsEscalationPacket: false,
  },
  {
    code: "portfolio_not_assigned",
    title: "Coach portfolio is not assigned",
    plainEnglishMessage:
      "A coach should only log decisions for chapters currently assigned to their portfolio.",
    nextStep: "Assign the coach to the chapter portfolio before enabling the save.",
    tone: "error",
    success: false,
    retryAllowed: false,
    createsReadinessReview: false,
    createsOutboxItem: false,
    sendsEscalationPacket: false,
  },
  {
    code: "missing_auth",
    title: "Sign-in is required",
    plainEnglishMessage:
      "The app must know which coach or HQ staff member is signed in before saving a decision.",
    nextStep: "After live auth is approved, send the staff member through the sign-in flow.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsReadinessReview: false,
    createsOutboxItem: false,
    sendsEscalationPacket: false,
  },
  {
    code: "note_too_short",
    title: "Decision note needs more context",
    plainEnglishMessage:
      "Coach decisions need a short explanation so future staff understand why the chapter advanced, held, or needed intervention.",
    nextStep: "Ask for a plain-English note before saving the decision.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsReadinessReview: false,
    createsOutboxItem: false,
    sendsEscalationPacket: false,
  },
  {
    code: "blocker_summary_required",
    title: "Intervention needs a blocker summary",
    plainEnglishMessage:
      "Intervene decisions need a concise blocker summary so a support packet can be reviewed later.",
    nextStep: "Ask the coach to describe the blocker before saving the intervention decision.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    createsReadinessReview: false,
    createsOutboxItem: false,
    sendsEscalationPacket: false,
  },
  {
    code: "server_error",
    title: "Something went wrong",
    plainEnglishMessage:
      "The app could not safely save this coach decision. No escalation packet or external automation should run.",
    nextStep: "Show a friendly retry message and log the error for the product team.",
    tone: "error",
    success: false,
    retryAllowed: true,
    createsReadinessReview: false,
    createsOutboxItem: false,
    sendsEscalationPacket: false,
  },
] as const satisfies readonly CoachDecisionResultState[];

export function getCoachDecisionResultStates(): readonly CoachDecisionResultState[] {
  return coachDecisionResultStates;
}

export function getCoachDecisionResultState(
  code: CoachDecisionResultCode,
): CoachDecisionResultState {
  const state = coachDecisionResultStates.find((item) => item.code === code);

  if (!state) {
    throw new Error(`Unknown coach decision result code: ${code}`);
  }

  return state;
}

export function getFutureCoachDecisionResultIfEnabled(
  actor: LocalActorContext | null,
  input: CoachDecisionInput,
): CoachDecisionResultState {
  if (!actor) {
    return getCoachDecisionResultState("missing_auth");
  }

  if (!canLogCoachDecision(actor)) {
    return getCoachDecisionResultState("permission_denied");
  }

  if (
    getActorSurfaceFamily(actor) === "coach" &&
    actor.coachPortfolioChapterNames.length === 0
  ) {
    return getCoachDecisionResultState("portfolio_not_assigned");
  }

  if (input.note.trim().length < 12) {
    return getCoachDecisionResultState("note_too_short");
  }

  const blockerSummary = input.blockerSummary?.trim() ?? "";

  if (input.decision === "intervene" && blockerSummary.length < 8) {
    return getCoachDecisionResultState("blocker_summary_required");
  }

  if (input.decision === "advance") {
    return getCoachDecisionResultState("advance_recorded");
  }

  if (input.decision === "intervene") {
    return getCoachDecisionResultState("intervention_recorded");
  }

  return getCoachDecisionResultState("hold_recorded");
}

export function getDisabledCoachDecisionResultPreview(
  actor: LocalActorContext,
  input: CoachDecisionInput,
): CoachDecisionResultPreview {
  const currentResult = getCoachDecisionResultState("write_disabled");

  return {
    operation: "coach_decision_logged",
    currentResult,
    futureResultIfEnabled: getFutureCoachDecisionResultIfEnabled(actor, input),
    serverResultShape: {
      success: false,
      errorCode: currentResult.code,
      decision: input.decision,
      plainEnglishMessage: `${currentResult.plainEnglishMessage} ${getWriteReadinessSummary()}`,
    },
  };
}
