import type { LocalActorContext } from "@/services/local-actor-context";
import {
  createActionStartedMock,
  createHqSharingDecisionMock,
  createProofSubmissionMock,
  type HqSharingDecisionInput,
  type ProofSubmissionInput,
} from "@/services/local-action-contracts";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";

type EnvSource = Record<string, string | undefined>;

export type WriteOperation =
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
  "Nick must approve a later goal for local Supabase writes, RLS write tests, and live auth readiness.";

export function getWriteReadinessConfig(
  env: EnvSource = process.env,
): WriteReadinessConfig {
  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true") {
    return {
      enabled: false,
      reason:
        "Local Supabase writes were requested, but Goal 12 keeps every app write disabled.",
      approvalRequired,
    };
  }

  return {
    enabled: false,
    reason:
      "App writes are disabled. Goal 12 only documents and previews future write payloads.",
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
    wouldWriteTables: ["assignments", "integration_events", "audit_logs"],
    preview: createActionStartedMock(actor, assignment),
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
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ],
    preview: createHqSharingDecisionMock(actor, evidenceItem, input),
  };
}
