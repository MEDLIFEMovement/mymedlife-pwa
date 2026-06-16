import type { ActorAudience } from "@/services/local-actor-context";
import type { WriteOperation } from "@/services/write-readiness";

type FutureTable =
  | "assignments"
  | "evidence_items"
  | "approvals"
  | "events"
  | "integration_events"
  | "automation_outbox"
  | "audit_logs";

export type WritePlanOperation = {
  key: WriteOperation;
  label: string;
  plainEnglishOutcome: string;
  transactionBoundary: string;
  futureTables: readonly FutureTable[];
  allowedActors: readonly ActorAudience[];
  blockedActors: readonly ActorAudience[];
  requiredTests: readonly string[];
  stillDisabled: true;
};

export type WritePlanSummary = {
  operationCount: number;
  allOperationsStillDisabled: boolean;
  externalWritesAllowed: false;
  operationsTouchingOutbox: readonly WriteOperation[];
};

export const writePlanOperations = [
  {
    key: "action_started",
    label: "Action started",
    plainEnglishOutcome:
      "A permitted actor marks an assigned Rush Month action as in progress and records the internal event.",
    transactionBoundary:
      "Update one assignment status, record one internal event, record one integration event, and record one audit log entry together.",
    futureTables: ["assignments", "events", "integration_events", "audit_logs"],
    allowedActors: ["chapter_member", "chapter_leader", "coach", "super_admin"],
    blockedActors: ["admin", "ds_admin"],
    requiredTests: [
      "member_can_start_own_visible_assignment",
      "leader_can_start_chapter_scoped_assignment",
      "coach_can_start_portfolio_coach_assignment",
      "admin_cannot_start_student_truth_assignment",
      "ds_admin_cannot_start_assignment",
      "started_assignment_records_audit_log",
      "started_assignment_records_internal_event",
    ],
    stillDisabled: true,
  },
  {
    key: "evidence_submitted",
    label: "Proof submitted",
    plainEnglishOutcome:
      "A student or chapter leader submits a testimonial, bridge video, photo, link, or recap for HQ review.",
    transactionBoundary:
      "Update the assignment submission state, create the evidence item, record the internal event, record the integration event, create a disabled outbox row, and record an audit log entry together.",
    futureTables: [
      "assignments",
      "evidence_items",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ],
    allowedActors: ["chapter_member", "chapter_leader"],
    blockedActors: ["coach", "admin", "ds_admin", "super_admin"],
    requiredTests: [
      "member_can_submit_proof_for_own_visible_assignment",
      "leader_can_submit_proof_for_chapter_work",
      "coach_cannot_submit_proof",
      "admin_cannot_submit_proof_as_student_truth",
      "ds_admin_cannot_submit_proof",
      "proof_submission_creates_disabled_outbox_row",
    ],
    stillDisabled: true,
  },
  {
    key: "hq_sharing_decision",
    label: "HQ sharing decision",
    plainEnglishOutcome:
      "MEDLIFE HQ decides whether submitted proof should be shared more broadly with other chapters or universities.",
    transactionBoundary:
      "Update evidence sharing status, create the approval decision, record the internal event, record the integration event, create a disabled outbox row, and record an audit log entry together.",
    futureTables: [
      "evidence_items",
      "approvals",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ],
    allowedActors: ["admin", "super_admin"],
    blockedActors: ["chapter_member", "chapter_leader", "coach", "ds_admin"],
    requiredTests: [
      "admin_can_record_hq_sharing_decision",
      "super_admin_can_record_hq_sharing_decision",
      "chapter_leader_cannot_approve_proof_for_broad_sharing",
      "coach_cannot_record_hq_sharing_decision",
      "ds_admin_cannot_record_hq_sharing_decision",
      "hq_decision_creates_disabled_outbox_row",
    ],
    stillDisabled: true,
  },
] as const satisfies readonly WritePlanOperation[];

export function getWritePlanOperation(key: WriteOperation): WritePlanOperation {
  const operation = writePlanOperations.find((item) => item.key === key);

  if (!operation) {
    throw new Error(`Unknown write plan operation: ${key}`);
  }

  return operation;
}

export function isActorAllowedForPlannedWrite(
  audience: ActorAudience,
  operationKey: WriteOperation,
): boolean {
  return getWritePlanOperation(operationKey).allowedActors.includes(audience);
}

export function getWritePlanSummary(): WritePlanSummary {
  const outboxTable: FutureTable = "automation_outbox";

  return {
    operationCount: writePlanOperations.length,
    allOperationsStillDisabled: writePlanOperations.every((operation) => {
      return operation.stillDisabled;
    }),
    externalWritesAllowed: false,
    operationsTouchingOutbox: writePlanOperations
      .filter((operation) => {
        return (operation.futureTables as readonly FutureTable[]).includes(outboxTable);
      })
      .map((operation) => {
        return operation.key;
      }),
  };
}
