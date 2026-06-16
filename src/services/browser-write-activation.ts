import {
  getActionStartWriteConfig,
  getActionStartWriteReadiness,
} from "@/services/action-start-write";
import {
  getProofSubmissionWriteConfig,
  getProofSubmissionWriteReadiness,
} from "@/services/proof-submission-write";
import {
  getHqProofDecisionWriteConfig,
  getHqProofDecisionWriteReadiness,
} from "@/services/hq-proof-decision-write";
import {
  getCoachDecisionWriteConfig,
  getCoachDecisionWriteReadiness,
  type CoachDecisionContext,
} from "@/services/coach-decision-write";
import {
  getAssignmentCreateWriteConfig,
  getAssignmentCreateWriteReadiness,
  type AssignmentCreateContext,
} from "@/services/assignment-create-write";
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
  | "chapter_uuid"
  | "campaign_uuid"
  | "duplicate_assignment"
  | "evidence_not_final"
  | "evidence_uuid"
  | "owner_role_valid"
  | "reminders_disabled"
  | "local_database_function_exists"
  | "note_long_enough"
  | "proof_uploads_disabled"
  | "public_sharing_disabled"
  | "rls_tests_exist"
  | "summary_long_enough"
  | "blocker_summary_present"
  | "coach_portfolio_or_staff"
  | "escalation_packets_disabled"
  | "phase_uuid"
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
  context: AssignmentCreateContext = {
    chapterId: "mock-chapter",
    campaignId: "mock-campaign",
  },
  env: EnvSource = process.env,
): BrowserWriteActivationGate {
  const writePlan = getWritePlanOperation("action_assigned");
  const writeConfig = getAssignmentCreateWriteConfig(env);
  const assignmentCreateReadiness = getAssignmentCreateWriteReadiness(
    actor,
    input,
    context,
    env,
  );
  const actorCanCreateAssignment = canCreateChapterAssignment(actor);
  const actorAllowedByPlan = writePlan.allowedActors.includes(actor.audience);
  const localAuthApproved =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";

  return {
    operation: "action_assigned",
    route: "/rush-month/actions",
    label: "Create assignment browser write",
    localFunction: "app.create_chapter_assignment",
    functionSignature:
      "app.create_chapter_assignment(chapter_uuid, campaign_uuid, assignment_title, ...)",
    status: assignmentCreateReadiness.canSubmit
      ? "ready_for_local_write"
      : "blocked_until_approval",
    canRenderEnabledControl: assignmentCreateReadiness.canSubmit,
    envRequestedLocalWrites: env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true",
    nextApprovalNeeded: assignmentCreateReadiness.canSubmit
      ? "Local assignment creation write is ready for localhost-only testing."
      : approvalMessage,
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
        passed: !writeConfig.externalWritesEnabled,
        detail:
          "Assignment creation records internal events and a disabled outbox row; it does not send reminders or external writes.",
      },
      {
        key: "chapter_uuid",
        label: "Chapter ID is a Supabase UUID",
        passed: assignmentCreateReadiness.checks.find((check) => {
          return check.key === "chapter_uuid";
        })?.passed ?? false,
        detail:
          "The server action can only write against local Supabase UUID chapter data.",
      },
      {
        key: "campaign_uuid",
        label: "Campaign ID is a Supabase UUID",
        passed: assignmentCreateReadiness.checks.find((check) => {
          return check.key === "campaign_uuid";
        })?.passed ?? false,
        detail:
          "The server action can only write against local Supabase UUID campaign data.",
      },
      {
        key: "owner_role_valid",
        label: "Owner role maps to a chapter role",
        passed: assignmentCreateReadiness.checks.find((check) => {
          return check.key === "owner_role_valid";
        })?.passed ?? false,
        detail:
          "The selected owner role must map to a chapter-scoped assignment role.",
      },
      {
        key: "duplicate_assignment",
        label: "No duplicate assignment title exists",
        passed: assignmentCreateReadiness.checks.find((check) => {
          return check.key === "duplicate_assignment";
        })?.passed ?? false,
        detail:
          "The local UI should not create a duplicate assignment with the same title.",
      },
      {
        key: "reminders_disabled",
        label: "Reminder automation stays disabled",
        passed: assignmentCreateReadiness.checks.find((check) => {
          return check.key === "reminders_disabled";
        })?.passed ?? false,
        detail:
          "Creating the assignment may create a disabled outbox row, but no n8n/email/SMS reminder is sent.",
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
  const writeConfig = getHqProofDecisionWriteConfig(env);
  const hqDecisionReadiness = getHqProofDecisionWriteReadiness(
    actor,
    evidenceItem,
    input,
    env,
  );
  const actorCanMakeDecision = canMakeHqSharingDecision(actor);
  const actorAllowedByPlan = writePlan.allowedActors.includes(actor.audience);
  const evidenceUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    evidenceItem.id,
  );
  const evidenceNotFinal = evidenceItem.status !== "approved";
  const noteLongEnough = input.note.trim().length >= 12;
  const localAuthApproved =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";

  return {
    operation: "hq_sharing_decision",
    route: "/rush-month/review",
    label: "Record HQ proof-sharing decision browser write",
    localFunction: "app.record_hq_proof_sharing_decision",
    functionSignature:
      "app.record_hq_proof_sharing_decision(evidence_uuid, decision_input, review_note)",
    status: hqDecisionReadiness.canSubmit
      ? "ready_for_local_write"
      : "blocked_until_approval",
    canRenderEnabledControl: hqDecisionReadiness.canSubmit,
    envRequestedLocalWrites: env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true",
    nextApprovalNeeded: hqDecisionReadiness.canSubmit
      ? "Local HQ proof decision write is ready for localhost-only testing."
      : approvalMessage,
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
        key: "evidence_uuid",
        label: "Evidence item ID is a Supabase UUID",
        passed: evidenceUuid,
        detail: evidenceUuid
          ? "This proof item can be sent to the local database function."
          : "Mock proof IDs cannot be saved through the local Supabase function.",
      },
      {
        key: "evidence_not_final",
        label: "Proof does not already have a final decision",
        passed: evidenceNotFinal,
        detail: evidenceNotFinal
          ? "HQ can still record a local decision for this proof item."
          : "Already-approved proof needs a future override workflow, not a duplicate decision.",
      },
      {
        key: "note_long_enough",
        label: "Decision note has enough context",
        passed: noteLongEnough,
        detail: noteLongEnough
          ? "The HQ decision note is long enough for audit context."
          : "HQ decisions need a short plain-English note before saving.",
      },
      {
        key: "public_sharing_disabled",
        label: "Public proof sharing stays disabled",
        passed: true,
        detail:
          "This write records HQ intent only; it does not publish proof or expose files publicly.",
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
    preview: createHqSharingDecisionMock(actor, evidenceItem, input),
  };
}

export function getCoachDecisionBrowserWriteGate(
  actor: LocalActorContext,
  input: CoachDecisionInput,
  context: CoachDecisionContext = {
    chapterId: "mock-chapter",
    campaignId: "mock-campaign",
    phaseId: "mock-phase",
  },
  env: EnvSource = process.env,
): BrowserWriteActivationGate {
  const writePlan = getWritePlanOperation("coach_decision_logged");
  const writeConfig = getCoachDecisionWriteConfig(env);
  const coachDecisionReadiness = getCoachDecisionWriteReadiness(
    actor,
    input,
    context,
    env,
  );
  const actorCanLogDecision = canLogCoachDecision(actor);
  const actorAllowedByPlan = writePlan.allowedActors.includes(actor.audience);
  const localAuthApproved =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";
  const phaseUuid = coachDecisionReadiness.checks.find((check) => {
    return check.key === "phase_uuid";
  })?.passed ?? false;
  const coachPortfolioOrStaff = coachDecisionReadiness.checks.find((check) => {
    return check.key === "coach_portfolio_or_staff";
  })?.passed ?? false;
  const noteLongEnough = coachDecisionReadiness.checks.find((check) => {
    return check.key === "note_long_enough";
  })?.passed ?? false;
  const blockerSummaryPresent = coachDecisionReadiness.checks.find((check) => {
    return check.key === "blocker_summary_present";
  })?.passed ?? false;
  const escalationPacketsDisabled = coachDecisionReadiness.checks.find((check) => {
    return check.key === "escalation_packets_disabled";
  })?.passed ?? false;

  return {
    operation: "coach_decision_logged",
    route: "/coach",
    label: "Log coach decision browser write",
    localFunction: "app.log_coach_decision",
    functionSignature:
      "app.log_coach_decision(chapter_uuid, campaign_uuid, phase_uuid, decision_input, decision_note, ...)",
    status: coachDecisionReadiness.canSubmit
      ? "ready_for_local_write"
      : "blocked_until_approval",
    canRenderEnabledControl: coachDecisionReadiness.canSubmit,
    envRequestedLocalWrites: env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true",
    nextApprovalNeeded: coachDecisionReadiness.canSubmit
      ? "Local coach decision write is ready for localhost-only testing."
      : approvalMessage,
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
        passed: !writeConfig.externalWritesEnabled,
        detail:
          "Coach decisions record internal events and a disabled outbox row; they do not send escalation packets or automation.",
      },
      {
        key: "phase_uuid",
        label: "Phase ID is a Supabase UUID",
        passed: phaseUuid,
        detail:
          "The server action can only write against a local Supabase UUID phase.",
      },
      {
        key: "coach_portfolio_or_staff",
        label: "Coach has portfolio access or staff role",
        passed: coachPortfolioOrStaff,
        detail:
          "Coaches need portfolio access; Admin and Super Admin may use the staff path.",
      },
      {
        key: "note_long_enough",
        label: "Coach decision note has enough context",
        passed: noteLongEnough,
        detail:
          "Coach decisions need a short plain-English note for audit history.",
      },
      {
        key: "blocker_summary_present",
        label: "Intervention blocker summary is present",
        passed: blockerSummaryPresent,
        detail:
          "Only intervene decisions require a blocker summary before saving.",
      },
      {
        key: "escalation_packets_disabled",
        label: "Escalation packets stay disabled",
        passed: escalationPacketsDisabled,
        detail:
          "This path records a disabled outbox row only; it does not send n8n escalation packets.",
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
