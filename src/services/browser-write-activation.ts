import {
  getActionStartWriteConfig,
  getActionStartWriteReadiness,
} from "@/services/action-start-write";
import {
  getProofSubmissionWriteConfig,
  getProofSubmissionWriteReadiness,
} from "@/services/proof-submission-write";
import {
  canCreateChapterAssignment,
  canLogCoachDecision,
  canMakeHqSharingDecision,
  canSubmitProofForAssignment,
  createActionStartedMock,
  createChapterAssignmentMock,
  createCoachDecisionMock,
  createHqSharingDecisionMock,
  createProofSubmissionMock,
  type ChapterAssignmentInput,
  type CoachDecisionInput,
  type HqSharingDecisionInput,
  type LocalContractResult,
  type LocalActionStarted,
  type LocalAssignmentCreated,
  type LocalCoachDecision,
  type LocalHqSharingDecision,
  type LocalProofSubmission,
  type ProofSubmissionInput,
} from "@/services/local-action-contracts";
import type { LocalActorContext } from "@/services/local-actor-context";
import { canReadAssignment } from "@/services/role-visibility";
import { getWritePlanOperation } from "@/services/write-plan-matrix";
import { getWriteReadinessConfig } from "@/services/write-readiness";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type ActivationCheckKey =
  | "actor_can_read_assignment"
  | "actor_can_create_assignment"
  | "actor_can_log_coach_decision"
  | "actor_can_submit_proof"
  | "actor_can_make_hq_sharing_decision"
  | "actor_allowed_by_write_plan"
  | "assignment_ready_for_proof"
  | "local_database_function_exists"
  | "proof_uploads_disabled"
  | "rls_tests_exist"
  | "summary_long_enough"
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
  operation:
    | "action_started"
    | "action_assigned"
    | "coach_decision_logged"
    | "evidence_submitted"
    | "hq_sharing_decision";
  route:
    | "/coach"
    | "/rush-month/actions/[assignmentId]"
    | "/rush-month/actions"
    | "/rush-month/review";
  label: string;
  localFunction:
    | "app.start_assignment_action"
    | "app.create_chapter_assignment"
    | "app.log_coach_decision"
    | "app.submit_assignment_proof_metadata"
    | "app.record_hq_proof_sharing_decision";
  functionSignature: string;
  status: "blocked_until_approval" | "ready_for_local_write";
  canRenderEnabledControl: boolean;
  envRequestedLocalWrites: boolean;
  nextApprovalNeeded: string;
  checks: ActivationCheck[];
  preview: LocalContractResult<
    | LocalActionStarted
    | LocalAssignmentCreated
    | LocalCoachDecision
    | LocalProofSubmission
    | LocalHqSharingDecision
  >;
};

const approvalMessage =
  "Nick must explicitly approve browser-facing local writes after live auth/readiness review.";

export function getActionStartBrowserWriteGate(
  actor: LocalActorContext,
  assignment: Assignment,
  env: EnvSource = process.env,
): BrowserWriteActivationGate {
  const writePlan = getWritePlanOperation("action_started");
  const writeConfig = getActionStartWriteConfig(env);
  const actionStartReadiness = getActionStartWriteReadiness(actor, assignment, env);
  const actorCanReadAssignment = canReadAssignment(actor, assignment);
  const actorAllowedByPlan = writePlan.allowedActors.includes(actor.audience);
  const localAuthApproved =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";

  return {
    operation: "action_started",
    route: "/rush-month/actions/[assignmentId]",
    label: "Start assignment browser write",
    localFunction: "app.start_assignment_action",
    functionSignature: "app.start_assignment_action(assignment_uuid)",
    status: actionStartReadiness.canSubmit
      ? "ready_for_local_write"
      : "blocked_until_approval",
    canRenderEnabledControl: actionStartReadiness.canSubmit,
    envRequestedLocalWrites: env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true",
    nextApprovalNeeded: actionStartReadiness.canSubmit
      ? "Local action-start write is ready for localhost-only testing."
      : approvalMessage,
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
        passed: localAuthApproved,
        detail: localAuthApproved
          ? "A signed-in local Supabase Auth session is driving actor context."
          : "A signed-in local Supabase Auth session is required before this write can run.",
      },
      {
        key: "browser_write_approved",
        label: "Browser write approval granted",
        passed: writeConfig.enabled,
        detail: writeConfig.reason,
      },
    ],
    preview: createActionStartedMock(actor, assignment),
  };
}

export function getAssignmentCreateBrowserWriteGate(
  actor: LocalActorContext,
  input: ChapterAssignmentInput,
  env: EnvSource = process.env,
): BrowserWriteActivationGate {
  const writePlan = getWritePlanOperation("action_assigned");
  const writeReadiness = getWriteReadinessConfig(env);
  const actorCanCreateAssignment = canCreateChapterAssignment(actor);
  const actorAllowedByPlan = writePlan.allowedActors.includes(actor.audience);

  return {
    operation: "action_assigned",
    route: "/rush-month/actions",
    label: "Create assignment browser write",
    localFunction: "app.create_chapter_assignment",
    functionSignature:
      "app.create_chapter_assignment(chapter_uuid, campaign_uuid, assignment_title, ...)",
    status: "blocked_until_approval",
    canRenderEnabledControl: false,
    envRequestedLocalWrites: env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true",
    nextApprovalNeeded: approvalMessage,
    checks: [
      {
        key: "actor_can_create_assignment",
        label: "Current local actor can create chapter assignments",
        passed: actorCanCreateAssignment,
        detail: actorCanCreateAssignment
          ? `${actor.audienceLabel} can shape leader assignment writes in the local contract.`
          : `${actor.audienceLabel} cannot create student/chapter assignment truth.`,
      },
      {
        key: "actor_allowed_by_write_plan",
        label: "Actor is allowed by the planned write matrix",
        passed: actorAllowedByPlan,
        detail: actorAllowedByPlan
          ? `${actor.audienceLabel} is allowed for assignment creation in the write plan.`
          : `${actor.audienceLabel} is blocked from assignment creation in the write plan.`,
      },
      {
        key: "local_database_function_exists",
        label: "Local database function exists",
        passed: true,
        detail: "Goal 18 implemented app.create_chapter_assignment(...).",
      },
      {
        key: "rls_tests_exist",
        label: "RLS/security tests exist",
        passed: true,
        detail:
          "supabase/tests/database/rls_goal_18.test.sql proves direct inserts are blocked and assignment creation is function-gated.",
      },
      {
        key: "external_writes_disabled",
        label: "External writes stay disabled",
        passed: true,
        detail:
          "Assignment creation records internal events and a disabled outbox row; it does not send reminders or external writes.",
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
    preview: createChapterAssignmentMock(actor, input),
  };
}

export function getProofSubmissionBrowserWriteGate(
  actor: LocalActorContext,
  assignment: Assignment,
  input: ProofSubmissionInput,
  env: EnvSource = process.env,
): BrowserWriteActivationGate {
  const writePlan = getWritePlanOperation("evidence_submitted");
  const writeConfig = getProofSubmissionWriteConfig(env);
  const proofSubmissionReadiness = getProofSubmissionWriteReadiness(
    actor,
    assignment,
    input,
    env,
  );
  const actorCanSubmitProof = canSubmitProofForAssignment(actor, assignment);
  const actorAllowedByPlan = writePlan.allowedActors.includes(actor.audience);
  const assignmentReadyForProof =
    assignment.status === "in_progress" ||
    assignment.status === "changes_requested";
  const summaryLongEnough = input.summary.trim().length >= 12;
  const uploadsDisabled = env.MYMEDLIFE_ALLOW_PROOF_UPLOADS !== "true";
  const localAuthApproved =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";

  return {
    operation: "evidence_submitted",
    route: "/rush-month/actions/[assignmentId]",
    label: "Submit proof browser write",
    localFunction: "app.submit_assignment_proof_metadata",
    functionSignature:
      "app.submit_assignment_proof_metadata(assignment_uuid, evidence_kind, proof_summary, ...)",
    status: proofSubmissionReadiness.canSubmit
      ? "ready_for_local_write"
      : "blocked_until_approval",
    canRenderEnabledControl: proofSubmissionReadiness.canSubmit,
    envRequestedLocalWrites: env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true",
    nextApprovalNeeded: proofSubmissionReadiness.canSubmit
      ? "Local proof/testimonial metadata write is ready for localhost-only testing."
      : approvalMessage,
    checks: [
      {
        key: "actor_can_submit_proof",
        label: "Current local actor can submit proof for this assignment",
        passed: actorCanSubmitProof,
        detail: actorCanSubmitProof
          ? `${actor.audienceLabel} can shape proof/testimonial submissions for this assignment.`
          : `${actor.audienceLabel} cannot submit proof/testimonials for this assignment.`,
      },
      {
        key: "actor_allowed_by_write_plan",
        label: "Actor is allowed by the planned write matrix",
        passed: actorAllowedByPlan,
        detail: actorAllowedByPlan
          ? `${actor.audienceLabel} is allowed for proof submission in the write plan.`
          : `${actor.audienceLabel} is blocked from proof submission in the write plan.`,
      },
      {
        key: "local_database_function_exists",
        label: "Local database function exists",
        passed: true,
        detail: "Goal 15 implemented app.submit_assignment_proof_metadata(...).",
      },
      {
        key: "rls_tests_exist",
        label: "RLS/security tests exist",
        passed: true,
        detail:
          "supabase/tests/database/rls_goal_15.test.sql proves direct evidence inserts are blocked and proof submission is function-gated.",
      },
      {
        key: "assignment_ready_for_proof",
        label: "Assignment is ready for proof",
        passed: assignmentReadyForProof,
        detail: assignmentReadyForProof
          ? "The assignment is in progress or changes requested."
          : "Proof should wait until the assignment has been started.",
      },
      {
        key: "summary_long_enough",
        label: "Proof summary has enough context",
        passed: summaryLongEnough,
        detail: summaryLongEnough
          ? "The proof summary has enough context for HQ review."
          : "The proof summary must describe what happened before saving.",
      },
      {
        key: "proof_uploads_disabled",
        label: "Proof uploads stay disabled",
        passed: uploadsDisabled,
        detail: uploadsDisabled
          ? "This path saves metadata only and does not upload files."
          : "Proof upload/storage is not approved for this MVP slice.",
      },
      {
        key: "external_writes_disabled",
        label: "External writes stay disabled",
        passed: true,
        detail:
          "Proof submission records internal events and a disabled outbox row; it does not upload files, publish proof, or send automation.",
      },
      {
        key: "live_auth_approved",
        label: "Live auth/browser session approved",
        passed: localAuthApproved,
        detail: localAuthApproved
          ? "A signed-in local Supabase Auth session is driving actor context."
          : "A signed-in local Supabase Auth session is required before this write can run.",
      },
      {
        key: "browser_write_approved",
        label: "Browser write approval granted",
        passed: writeConfig.enabled,
        detail: writeConfig.reason,
      },
    ],
    preview: createProofSubmissionMock(actor, assignment, input),
  };
}

export function getHqSharingDecisionBrowserWriteGate(
  actor: LocalActorContext,
  evidenceItem: EvidenceItem,
  input: HqSharingDecisionInput,
  env: EnvSource = process.env,
): BrowserWriteActivationGate {
  const writePlan = getWritePlanOperation("hq_sharing_decision");
  const writeReadiness = getWriteReadinessConfig(env);
  const actorCanMakeDecision = canMakeHqSharingDecision(actor);
  const actorAllowedByPlan = writePlan.allowedActors.includes(actor.audience);

  return {
    operation: "hq_sharing_decision",
    route: "/rush-month/review",
    label: "Record HQ proof-sharing decision browser write",
    localFunction: "app.record_hq_proof_sharing_decision",
    functionSignature:
      "app.record_hq_proof_sharing_decision(evidence_uuid, decision_input, review_note)",
    status: "blocked_until_approval",
    canRenderEnabledControl: false,
    envRequestedLocalWrites: env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true",
    nextApprovalNeeded: approvalMessage,
    checks: [
      {
        key: "actor_can_make_hq_sharing_decision",
        label: "Current local actor can make HQ sharing decisions",
        passed: actorCanMakeDecision,
        detail: actorCanMakeDecision
          ? `${actor.audienceLabel} can shape HQ proof-sharing decisions in the local contract.`
          : `${actor.audienceLabel} cannot decide whether proof is shared broadly.`,
      },
      {
        key: "actor_allowed_by_write_plan",
        label: "Actor is allowed by the planned write matrix",
        passed: actorAllowedByPlan,
        detail: actorAllowedByPlan
          ? `${actor.audienceLabel} is allowed for HQ sharing decisions in the write plan.`
          : `${actor.audienceLabel} is blocked from HQ sharing decisions in the write plan.`,
      },
      {
        key: "local_database_function_exists",
        label: "Local database function exists",
        passed: true,
        detail: "Goal 16 implemented app.record_hq_proof_sharing_decision(...).",
      },
      {
        key: "rls_tests_exist",
        label: "RLS/security tests exist",
        passed: true,
        detail:
          "supabase/tests/database/rls_goal_16.test.sql proves direct approval inserts are blocked and HQ sharing decisions are function-gated.",
      },
      {
        key: "external_writes_disabled",
        label: "External writes stay disabled",
        passed: true,
        detail:
          "HQ decisions record internal events and a disabled outbox row; they do not publish proof or send warehouse/automation writes.",
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
    preview: createHqSharingDecisionMock(actor, evidenceItem, input),
  };
}

export function getCoachDecisionBrowserWriteGate(
  actor: LocalActorContext,
  input: CoachDecisionInput,
  env: EnvSource = process.env,
): BrowserWriteActivationGate {
  const writePlan = getWritePlanOperation("coach_decision_logged");
  const writeReadiness = getWriteReadinessConfig(env);
  const actorCanLogDecision = canLogCoachDecision(actor);
  const actorAllowedByPlan = writePlan.allowedActors.includes(actor.audience);

  return {
    operation: "coach_decision_logged",
    route: "/coach",
    label: "Log coach decision browser write",
    localFunction: "app.log_coach_decision",
    functionSignature:
      "app.log_coach_decision(chapter_uuid, campaign_uuid, phase_uuid, decision_input, decision_note, ...)",
    status: "blocked_until_approval",
    canRenderEnabledControl: false,
    envRequestedLocalWrites: env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true",
    nextApprovalNeeded: approvalMessage,
    checks: [
      {
        key: "actor_can_log_coach_decision",
        label: "Current local actor can log coach decisions",
        passed: actorCanLogDecision,
        detail: actorCanLogDecision
          ? `${actor.audienceLabel} can shape coach decision writes in the local contract.`
          : `${actor.audienceLabel} cannot log advance, hold, or intervene decisions.`,
      },
      {
        key: "actor_allowed_by_write_plan",
        label: "Actor is allowed by the planned write matrix",
        passed: actorAllowedByPlan,
        detail: actorAllowedByPlan
          ? `${actor.audienceLabel} is allowed for coach decisions in the write plan.`
          : `${actor.audienceLabel} is blocked from coach decisions in the write plan.`,
      },
      {
        key: "local_database_function_exists",
        label: "Local database function exists",
        passed: true,
        detail: "Goal 27 implemented app.log_coach_decision(...).",
      },
      {
        key: "rls_tests_exist",
        label: "RLS/security tests exist",
        passed: true,
        detail:
          "supabase/tests/database/rls_goal_27.test.sql proves coach decisions are function-gated and audited.",
      },
      {
        key: "external_writes_disabled",
        label: "External writes stay disabled",
        passed: true,
        detail:
          "Coach decisions record internal events and a disabled outbox row; they do not send escalation packets or automation.",
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
    preview: createCoachDecisionMock(actor, input),
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
