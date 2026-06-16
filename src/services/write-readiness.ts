import type { LocalActorContext } from "@/services/local-actor-context";
import {
  createActionStartedMock,
  createChapterAssignmentMock,
  createHqSharingDecisionMock,
  createProofSubmissionMock,
  type ChapterAssignmentInput,
  type HqSharingDecisionInput,
  type ProofSubmissionInput,
} from "@/services/local-action-contracts";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type WriteOperation =
  | "action_assigned"
  | "action_started"
  | "evidence_submitted"
  | "hq_sharing_decision";

export type WriteReadinessConfig = {
  enabled: false;
  reason: string;
  approvalRequired: string;
};

export type DisabledWriteAttempt<TPreview> = {
  success: false;
  operation: WriteOperation;
  reason: string;
  wouldWriteTables: string[];
  preview: TPreview;
};

const approvalRequired =
  "Nick must approve local auth/session readiness and browser-facing write activation before the UI can save.";

export function getWriteReadinessConfig(
  env: EnvSource = process.env,
): WriteReadinessConfig {
  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true") {
    return {
      enabled: false,
      reason:
        "Local Supabase writes were requested, but browser-facing writes remain disabled until auth and write activation are approved.",
      approvalRequired,
    };
  }

  return {
    enabled: false,
    reason:
      "App writes are disabled. The app only documents and previews future write payloads.",
    approvalRequired,
  };
}

export function getWriteReadinessSummary(config = getWriteReadinessConfig()): string {
  return `${config.reason} ${config.approvalRequired}`;
}

export function prepareDisabledActionStartWrite(
  actor: LocalActorContext,
  assignment: Assignment,
): DisabledWriteAttempt<ReturnType<typeof createActionStartedMock>> {
  return {
    success: false,
    operation: "action_started",
    reason: getWriteReadinessSummary(),
    wouldWriteTables: ["assignments", "events", "integration_events", "audit_logs"],
    preview: createActionStartedMock(actor, assignment),
  };
}

export function prepareDisabledAssignmentCreateWrite(
  actor: LocalActorContext,
  input: ChapterAssignmentInput,
): DisabledWriteAttempt<ReturnType<typeof createChapterAssignmentMock>> {
  return {
    success: false,
    operation: "action_assigned",
    reason: getWriteReadinessSummary(),
    wouldWriteTables: [
      "assignments",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ],
    preview: createChapterAssignmentMock(actor, input),
  };
}

export function prepareDisabledProofSubmissionWrite(
  actor: LocalActorContext,
  assignment: Assignment,
  input: ProofSubmissionInput,
): DisabledWriteAttempt<ReturnType<typeof createProofSubmissionMock>> {
  return {
    success: false,
    operation: "evidence_submitted",
    reason: getWriteReadinessSummary(),
    wouldWriteTables: [
      "assignments",
      "evidence_items",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ],
    preview: createProofSubmissionMock(actor, assignment, input),
  };
}

export function prepareDisabledHqSharingDecisionWrite(
  actor: LocalActorContext,
  evidenceItem: EvidenceItem,
  input: HqSharingDecisionInput,
): DisabledWriteAttempt<ReturnType<typeof createHqSharingDecisionMock>> {
  return {
    success: false,
    operation: "hq_sharing_decision",
    reason: getWriteReadinessSummary(),
    wouldWriteTables: [
      "evidence_items",
      "approvals",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ],
    preview: createHqSharingDecisionMock(actor, evidenceItem, input),
  };
}
