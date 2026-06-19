import { isUuid } from "@/services/action-start-write";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";
import type { IntegrationDestination, KpiEventRow, PointsEventRow } from "@/shared/types/persistence";

export type PointsKpiMaterializationPacketStatus =
  | "hidden"
  | "blocked_until_local_supabase"
  | "blocked_until_leader_review"
  | "blocked_until_hq_review"
  | "blocked_until_materialized_rows"
  | "duplicate_materialization_detected"
  | "needs_manual_audit_check"
  | "evidence_observed";

export type PointsKpiMaterializationReadbackStatus =
  | "observed"
  | "missing"
  | "manual_check_needed"
  | "blocked";

export type PointsKpiMaterializationCheck = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type PointsKpiMaterializationReadbackItem = {
  key: string;
  label: string;
  status: PointsKpiMaterializationReadbackStatus;
  detail: string;
};

export type PointsKpiMaterializationRoleScope = {
  roleLabel: string;
  route: string;
  canInspectRawRows: boolean;
  detail: string;
};

export type PointsKpiMaterializationCandidate = {
  assignmentId: string;
  assignmentTitle: string;
  assignmentStatus: Assignment["status"];
  evidenceId: string | null;
  evidenceStatus: EvidenceItem["status"] | "missing";
  pointsConfigured: number;
  kpiConfigured: string;
  pointsRowCount: number;
  kpiRowCount: number;
  pointsTotal: number;
  kpiTotal: number;
  pointsMatchRules: boolean;
  kpiMatchRules: boolean;
  duplicateMaterializationDetected: boolean;
  reviewRoute: string;
  leaderboardRoute: string;
  usesSupabaseUuids: boolean;
  roleReadScopes: PointsKpiMaterializationRoleScope[];
};

export type PointsKpiMaterializationVerificationPacket = {
  status: PointsKpiMaterializationPacketStatus;
  canPromoteToStagingReview: boolean;
  title: string;
  plainEnglishDecision: string;
  envSettings: Array<{
    key: string;
    value: string;
    reason: string;
  }>;
  fakeOperatorChain: Array<{
    roleLabel: string;
    email: string;
    route: string;
  }>;
  operatorSequence: Array<{
    label: string;
    route: string;
    expectedProof: string;
  }>;
  safetyStops: string[];
};

export type PointsKpiMaterializationPacket = {
  canReadPacket: boolean;
  title: string;
  status: PointsKpiMaterializationPacketStatus;
  plainEnglishSummary: string;
  candidate: PointsKpiMaterializationCandidate | null;
  checks: PointsKpiMaterializationCheck[];
  readbackEvidence: PointsKpiMaterializationReadbackItem[];
  verificationPacket: PointsKpiMaterializationVerificationPacket;
  proofToCollect: string[];
  counts: {
    checks: number;
    passedChecks: number;
    observedReadbackItems: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
    duplicateRowsDetected: number;
  };
};

type CandidateState = {
  assignment: Assignment;
  evidenceItem: EvidenceItem | null;
  pointsRows: PointsEventRow[];
  kpiRows: KpiEventRow[];
};

export function getPointsKpiMaterializationPacket(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): PointsKpiMaterializationPacket {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadPacket: false,
      title: "Points and KPI packet hidden for this role",
      status: "hidden",
      plainEnglishSummary:
        "Points and KPI materialization review is an HQ safety surface, not a student, leader, or coach operating view.",
      candidate: null,
      checks: [],
      readbackEvidence: [],
      verificationPacket: buildHiddenVerificationPacket(),
      proofToCollect: [],
      counts: emptyCounts(),
    };
  }

  const candidateState = findCandidateState(data);
  const candidate = candidateState ? toCandidate(candidateState) : null;
  const readbackEvidence = buildReadbackEvidence(data, candidateState);
  const checks = buildChecks(data, candidateState, readbackEvidence);
  const status = getStatus(data, candidateState, readbackEvidence);
  const verificationPacket = buildVerificationPacket(status, candidate, readbackEvidence);

  return {
    canReadPacket: true,
    title: getTitle(actor),
    status,
    plainEnglishSummary:
      "This packet verifies that approved proof creates exactly one local points row and one KPI row from the product rules already defined on the assignment. It is read-only: reviewers confirm append-only posture, duplicate safety, audit linkage, role visibility, and zero external sends before treating recognition or metrics as production-ready.",
    candidate,
    checks,
    readbackEvidence,
    verificationPacket,
    proofToCollect: [
      "Screenshot of `/admin/points-write` showing the candidate assignment and row counts.",
      "Screenshot of `/rush-month/review` showing the approved leader decision that created the local points/KPI rows.",
      "Screenshot of `/rush-month/leaderboard` showing the recognition state after the local decision.",
      "Readback proof that one points row and one KPI row exist for the same approved assignment.",
      "Evidence that the row values match the assignment points and KPI rules rather than arbitrary browser input.",
      "Evidence that duplicate rows were blocked or not created for the same approval path.",
      "Evidence that the related outbox posture stayed disabled and no warehouse, Power BI, or external send ran.",
      "Evidence that correction guidance stays append-only and requires offset/correction rows instead of silent mutation.",
    ],
    counts: {
      checks: checks.length,
      passedChecks: checks.filter((check) => check.passed).length,
      observedReadbackItems: readbackEvidence.filter((item) => item.status === "observed")
        .length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
      duplicateRowsDetected:
        candidateState &&
        (candidateState.pointsRows.length > 1 || candidateState.kpiRows.length > 1)
          ? candidateState.pointsRows.length + candidateState.kpiRows.length - 2
          : 0,
    },
  };
}

function findCandidateState(data: ReadOnlyAppData): CandidateState | null {
  const approvedAssignments = data.assignments.filter((assignment) => {
    return assignment.status === "approved";
  });

  const candidates = approvedAssignments.map((assignment) => {
    const evidenceItem =
      data.evidenceItems.find((item) => item.assignmentId === assignment.id) ?? null;

    return {
      assignment,
      evidenceItem,
      pointsRows: data.pointsEventRows.filter((row) => row.assignment_id === assignment.id),
      kpiRows: data.kpiEventRows.filter((row) => row.assignment_id === assignment.id),
    };
  });

  return (
    candidates.find((item) => {
      return item.evidenceItem &&
        isUuid(item.assignment.id) &&
        isUuid(item.evidenceItem.id) &&
        item.pointsRows.length > 0 &&
        item.kpiRows.length > 0;
    }) ??
    candidates.find((item) => {
      return item.evidenceItem &&
        isUuid(item.assignment.id) &&
        isUuid(item.evidenceItem.id);
    }) ??
    candidates.find((item) => item.evidenceItem) ??
    candidates[0] ??
    null
  );
}

function toCandidate(candidateState: CandidateState): PointsKpiMaterializationCandidate {
  const { assignment, evidenceItem, pointsRows, kpiRows } = candidateState;

  return {
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    assignmentStatus: assignment.status,
    evidenceId: evidenceItem?.id ?? null,
    evidenceStatus: evidenceItem?.status ?? "missing",
    pointsConfigured: assignment.points,
    kpiConfigured: assignment.kpi,
    pointsRowCount: pointsRows.length,
    kpiRowCount: kpiRows.length,
    pointsTotal: pointsRows.reduce((total, row) => total + row.points_delta, 0),
    kpiTotal: kpiRows.reduce((total, row) => total + Number(row.metric_value), 0),
    pointsMatchRules: pointsRows.every((row) => row.points_delta === assignment.points),
    kpiMatchRules: kpiRows.every((row) => {
      return row.metric_key === assignment.kpi && Number(row.metric_value) === 1;
    }),
    duplicateMaterializationDetected: pointsRows.length > 1 || kpiRows.length > 1,
    reviewRoute: "/rush-month/review",
    leaderboardRoute: "/rush-month/leaderboard",
    usesSupabaseUuids:
      isUuid(assignment.id) && Boolean(evidenceItem && isUuid(evidenceItem.id)),
    roleReadScopes: [
      {
        roleLabel: "General Member",
        route: "/rush-month/leaderboard",
        canInspectRawRows: false,
        detail:
          "Members can see recognition, rank, and chapter impact only. Raw row IDs, audit details, and correction controls stay hidden.",
      },
      {
        roleLabel: "Chapter Leader / E-Board",
        route: "/rush-month/review",
        canInspectRawRows: false,
        detail:
          "Leaders can see action-level impact and approve proof, but they should not edit historical ledger rows directly.",
      },
      {
        roleLabel: "Coach / Staff Support",
        route: "/coach",
        canInspectRawRows: false,
        detail:
          "Coaches can read KPI posture and chapter health, not raw student recognition rows or audit export details.",
      },
      {
        roleLabel: "Admin / Super Admin",
        route: "/admin/points-write",
        canInspectRawRows: true,
        detail:
          "HQ reviewers can inspect row counts, source linkage, duplicate posture, and audit proof without enabling direct browser edits.",
      },
    ],
  };
}

function buildChecks(
  data: ReadOnlyAppData,
  candidateState: CandidateState | null,
  readbackEvidence: PointsKpiMaterializationReadbackItem[],
): PointsKpiMaterializationCheck[] {
  const candidate = candidateState ? toCandidate(candidateState) : null;
  const leaderReadbackObserved = hasObserved(readbackEvidence, "leader_decision");
  const hqReadbackObserved = hasObserved(readbackEvidence, "hq_sharing_posture");
  const pointsObserved = hasObserved(readbackEvidence, "points_row");
  const kpiObserved = hasObserved(readbackEvidence, "kpi_row");
  const disabledOutboxObserved = hasObserved(readbackEvidence, "disabled_outbox");
  const noExportDestinations = Boolean(
    !candidateState ||
      getMaterializationIntegrationDestinations(data, candidateState).every((destination) => {
        return destination !== "warehouse" && destination !== "power_bi";
      }),
  );

  return [
    {
      key: "local_supabase_reads",
      label: "Local Supabase read model is active",
      passed: data.source.mode === "supabase",
      detail:
        data.source.mode === "supabase"
          ? "This packet is reading local Supabase rows instead of mock fallback data."
          : "The app is still on mock fallback data, so no trusted row-level ledger readback exists yet.",
    },
    {
      key: "approved_assignment",
      label: "An approved assignment exists",
      passed: Boolean(candidateState),
      detail: candidateState
        ? `Candidate assignment: ${candidateState.assignment.title}.`
        : "No approved assignment is available for points/KPI materialization review.",
    },
    {
      key: "supabase_uuids",
      label: "Assignment and proof use Supabase UUIDs",
      passed: Boolean(candidate?.usesSupabaseUuids),
      detail:
        candidate?.usesSupabaseUuids
          ? "The candidate assignment and proof can be traced through local Supabase rows."
          : "Mock-safe IDs are still in play, so the packet cannot prove row-level linkage yet.",
    },
    {
      key: "leader_readback",
      label: "Leader proof review readback is visible",
      passed: leaderReadbackObserved,
      detail: leaderReadbackObserved
        ? "Approved proof status, source event, and disabled outbox posture are visible."
        : "Run the leader proof approval flow first so the source review event exists before checking ledger rows.",
    },
    {
      key: "hq_review",
      label: "HQ sharing posture is already proven",
      passed: hqReadbackObserved,
      detail: hqReadbackObserved
        ? "HQ sharing review evidence is visible for the same proof/testimonial."
        : "Run `/admin/hq-proof-write` before treating points and KPI rows as ready for staging review.",
    },
    {
      key: "points_row",
      label: "Exactly one points row exists for the approved assignment",
      passed: Boolean(candidate && candidate.pointsRowCount === 1 && pointsObserved),
      detail: candidate
        ? `${candidate.pointsRowCount} points row(s) found for this assignment.`
        : "No candidate assignment is available.",
    },
    {
      key: "kpi_row",
      label: "Exactly one KPI row exists for the approved assignment",
      passed: Boolean(candidate && candidate.kpiRowCount === 1 && kpiObserved),
      detail: candidate
        ? `${candidate.kpiRowCount} KPI row(s) found for this assignment.`
        : "No candidate assignment is available.",
    },
    {
      key: "rows_match_rules",
      label: "Row values match the assignment rules",
      passed: Boolean(candidate && candidate.pointsMatchRules && candidate.kpiMatchRules),
      detail: candidate
        ? `Expected ${candidate.pointsConfigured} point(s) and KPI "${candidate.kpiConfigured}" with value 1.`
        : "Assignment rules are not available yet.",
    },
    {
      key: "no_duplicates",
      label: "Duplicate materialization was not observed",
      passed: Boolean(candidate && !candidate.duplicateMaterializationDetected),
      detail: candidate?.duplicateMaterializationDetected
        ? "Multiple points or KPI rows were found for the same approval path."
        : "The packet currently sees a single points row and a single KPI row for the approved assignment.",
    },
    {
      key: "no_direct_browser_write",
      label: "No direct browser points/KPI write is exposed",
      passed: true,
      detail:
        "This repo still routes recognition through leader proof review and read-only review packets. There is no separate browser form for editing historical points or KPI rows.",
    },
    {
      key: "external_exports_disabled",
      label: "Warehouse and external sends stay disabled",
      passed: disabledOutboxObserved && noExportDestinations,
      detail:
        disabledOutboxObserved && noExportDestinations
          ? "Materialization stays local: no warehouse export, Power BI push, or external automation send is visible."
          : "A disabled outbox row or destination posture still needs review before this packet can be treated as staging-ready.",
    },
  ];
}

function buildReadbackEvidence(
  data: ReadOnlyAppData,
  candidateState: CandidateState | null,
): PointsKpiMaterializationReadbackItem[] {
  if (!candidateState) {
    return [
      {
        key: "candidate_assignment",
        label: "Candidate assignment",
        status: "blocked",
        detail:
          "No approved assignment exists, so points and KPI materialization cannot be reviewed yet.",
      },
    ];
  }

  const { assignment, evidenceItem, pointsRows, kpiRows } = candidateState;
  const leaderEvent = findLeaderApprovalEvent(data, assignment.id);
  const leaderIntegrationEvent = findLeaderApprovalIntegrationEvent(
    data,
    assignment.id,
    evidenceItem?.id ?? null,
    leaderEvent?.id ?? null,
  );
  const outbox = findLeaderApprovalOutbox(data, leaderIntegrationEvent?.id ?? null);
  const auditLog = findLeaderApprovalAuditLog(data, evidenceItem?.id ?? null);
  const hqReviewObserved = Boolean(evidenceItem && hasHqDecisionReadback(data, evidenceItem));

  return [
    {
      key: "leader_decision",
      label: "Leader approval source",
      status:
        assignment.status === "approved" && evidenceItem?.status === "approved" && leaderEvent
          ? "observed"
          : "missing",
      detail:
        assignment.status === "approved" && evidenceItem?.status === "approved" && leaderEvent
          ? "Approved assignment, approved proof, and the source leader-approval event are all visible."
          : "The source leader approval is not fully visible yet.",
    },
    {
      key: "hq_sharing_posture",
      label: "HQ sharing posture",
      status: hqReviewObserved ? "observed" : "missing",
      detail: hqReviewObserved
        ? "HQ sharing posture has already been proven for the same proof/testimonial."
        : "HQ sharing posture still needs readback before this packet should be promoted.",
    },
    {
      key: "points_row",
      label: "Points row",
      status:
        pointsRows.length === 1 && pointsRows[0]?.points_delta === assignment.points
          ? "observed"
          : pointsRows.length > 1
            ? "manual_check_needed"
            : "missing",
      detail:
        pointsRows.length === 1 && pointsRows[0]?.points_delta === assignment.points
          ? `One points row matches the assignment rule (${assignment.points} point(s)).`
          : pointsRows.length > 1
            ? "Multiple points rows exist for the same approved assignment."
            : "No matching points row is visible yet.",
    },
    {
      key: "kpi_row",
      label: "KPI row",
      status:
        kpiRows.length === 1 &&
        kpiRows[0]?.metric_key === assignment.kpi &&
        Number(kpiRows[0]?.metric_value) === 1
          ? "observed"
          : kpiRows.length > 1
            ? "manual_check_needed"
            : "missing",
      detail:
        kpiRows.length === 1 &&
        kpiRows[0]?.metric_key === assignment.kpi &&
        Number(kpiRows[0]?.metric_value) === 1
          ? `One KPI row matches the assignment rule (${assignment.kpi} = 1).`
          : kpiRows.length > 1
            ? "Multiple KPI rows exist for the same approved assignment."
            : "No matching KPI row is visible yet.",
    },
    {
      key: "disabled_outbox",
      label: "Disabled outbox posture",
      status: outbox ? "observed" : "missing",
      detail: outbox
        ? "A disabled outbox row is visible for the source leader approval."
        : "No disabled outbox row is visible for this materialization path yet.",
    },
    {
      key: "audit_log",
      label: "Audit linkage",
      status: auditLog
        ? "observed"
        : leaderEvent && leaderIntegrationEvent && outbox && pointsRows.length > 0 && kpiRows.length > 0
          ? "manual_check_needed"
          : "missing",
      detail: auditLog
        ? "Audit readback links the approved proof to the guarded materialization path."
        : "Audit proof is missing or still needs manual inspection.",
    },
  ];
}

function buildVerificationPacket(
  status: PointsKpiMaterializationPacketStatus,
  candidate: PointsKpiMaterializationCandidate | null,
  readbackEvidence: PointsKpiMaterializationReadbackItem[],
): PointsKpiMaterializationVerificationPacket {
  const evidenceObserved = readbackEvidence.every((item) => item.status === "observed");

  return {
    status,
    canPromoteToStagingReview: evidenceObserved,
    title: "Points and KPI materialization review packet",
    plainEnglishDecision: getPlainEnglishDecision(status, evidenceObserved),
    envSettings: [
      {
        key: "MYMEDLIFE_AUTH_MODE",
        value: "local_supabase",
        reason: "Use local fake seed users only while proving the source review path.",
      },
      {
        key: "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES",
        value: "true",
        reason: "Allow localhost-only write testing while the source leader approval is being proven.",
      },
      {
        key: "MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE",
        value: "true",
        reason: "The source leader approval path must be enabled before ledger rows can exist.",
      },
      {
        key: "MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE",
        value: "true",
        reason: "HQ sharing posture must be read back before this packet should be promoted.",
      },
      {
        key: "MYMEDLIFE_ALLOW_PUBLIC_PROOF_SHARING",
        value: "false",
        reason: "Public proof publishing remains off while recognition and KPI rows are reviewed.",
      },
    ],
    fakeOperatorChain: [
      {
        roleLabel: "Fake chapter leader",
        email: "leader.a@mymedlife.test",
        route: "/login",
      },
      {
        roleLabel: "Fake HQ admin",
        email: "admin@mymedlife.test",
        route: "/login",
      },
      {
        roleLabel: "Safety reviewer",
        email: "ds.admin@mymedlife.test",
        route: "/admin/points-write",
      },
    ],
    operatorSequence: [
      {
        label: "Confirm leader proof approval evidence",
        route: candidate?.reviewRoute ?? "/rush-month/review",
        expectedProof:
          "An approved assignment and approved proof exist before recognition rows are reviewed.",
      },
      {
        label: "Confirm HQ sharing posture",
        route: "/admin/hq-proof-write",
        expectedProof:
          "HQ sharing posture is already proven for the same proof/testimonial.",
      },
      {
        label: "Open the points and KPI packet",
        route: "/admin/points-write",
        expectedProof:
          "The packet shows one candidate assignment, one points row, one KPI row, and no duplicate materialization.",
      },
      {
        label: "Check the member recognition surface",
        route: candidate?.leaderboardRoute ?? "/rush-month/leaderboard",
        expectedProof:
          "Recognition updates are visible without exposing raw row IDs or audit details to members.",
      },
    ],
    safetyStops: [
      "Stop if the app is still on mock fallback data.",
      "Stop if the approved assignment or approved proof still uses mock-safe IDs instead of Supabase UUIDs.",
      "Stop if more than one points row or more than one KPI row exists for the same approval path.",
      "Stop if the row values do not match the assignment points or KPI rules.",
      "Stop if audit proof is missing and cannot be linked back to the approved proof item.",
      "Stop if any warehouse, Power BI, n8n, HubSpot, or public-sharing send appears active instead of disabled.",
    ],
  };
}

function getStatus(
  data: ReadOnlyAppData,
  candidateState: CandidateState | null,
  readbackEvidence: PointsKpiMaterializationReadbackItem[],
): PointsKpiMaterializationPacketStatus {
  if (data.source.mode !== "supabase") {
    return "blocked_until_local_supabase";
  }

  if (!candidateState || !hasObserved(readbackEvidence, "leader_decision")) {
    return "blocked_until_leader_review";
  }

  if (!hasObserved(readbackEvidence, "hq_sharing_posture")) {
    return "blocked_until_hq_review";
  }

  if (
    readbackEvidence.some((item) => {
      return (
        (item.key === "points_row" || item.key === "kpi_row") &&
        item.status === "manual_check_needed"
      );
    })
  ) {
    return "duplicate_materialization_detected";
  }

  if (!hasObserved(readbackEvidence, "points_row") || !hasObserved(readbackEvidence, "kpi_row")) {
    return "blocked_until_materialized_rows";
  }

  if (
    readbackEvidence.find((item) => item.key === "audit_log")?.status ===
    "manual_check_needed"
  ) {
    return "needs_manual_audit_check";
  }

  return readbackEvidence.every((item) => item.status === "observed")
    ? "evidence_observed"
    : "blocked_until_materialized_rows";
}

function findLeaderApprovalEvent(
  data: ReadOnlyAppData,
  assignmentId: string,
) {
  return data.eventRows.find((item) => {
    return item.event_type === "evidence_approved" && item.assignment_id === assignmentId;
  });
}

function findLeaderApprovalIntegrationEvent(
  data: ReadOnlyAppData,
  _assignmentId: string,
  evidenceId: string | null,
  sourceEventId: string | null,
) {
  return data.integrationEventRows.find((item) => {
    return item.event_type === "evidence_approved" &&
      ((sourceEventId !== null && item.source_event_id === sourceEventId) ||
        (item.external_object_type === "evidence_item" &&
          item.external_object_id === evidenceId));
  });
}

function findLeaderApprovalOutbox(
  data: ReadOnlyAppData,
  integrationEventId: string | null,
) {
  return data.automationOutboxRows.find((item) => {
    return item.event_type === "evidence_approved" &&
      item.status === "disabled" &&
      (integrationEventId ? item.integration_event_id === integrationEventId : true);
  });
}

function findLeaderApprovalAuditLog(
  data: ReadOnlyAppData,
  evidenceId: string | null,
) {
  return data.auditLogs.find((item) => {
    return item.action === "leader_proof_approved" &&
      item.target_table === "evidence_items" &&
      item.target_id === evidenceId;
  });
}

function hasHqDecisionReadback(data: ReadOnlyAppData, evidenceItem: EvidenceItem): boolean {
  const integrationEvent = data.integrationEventRows.find((item) => {
    return item.event_type === "hq_sharing_decision_logged" &&
      item.external_object_type === "evidence_item" &&
      item.external_object_id === evidenceItem.id;
  });
  const event = data.eventRows.find((item) => {
    return item.event_type === "hq_sharing_decision_logged" &&
      (integrationEvent?.source_event_id ? item.id === integrationEvent.source_event_id : true);
  });
  const outbox = data.automationOutboxRows.find((item) => {
    return item.event_type === "hq_sharing_decision_logged" &&
      item.status === "disabled" &&
      (integrationEvent ? item.integration_event_id === integrationEvent.id : true);
  });
  const auditLog = data.auditLogs.find((item) => {
    return item.action === "hq_sharing_decision_logged" &&
      item.target_table === "evidence_items" &&
      item.target_id === evidenceItem.id;
  });

  return Boolean(
    (evidenceItem.status === "approved" || evidenceItem.status === "changes_requested") &&
      event &&
      integrationEvent &&
      outbox &&
      auditLog,
  );
}

function getMaterializationIntegrationDestinations(
  data: ReadOnlyAppData,
  candidateState: CandidateState,
): IntegrationDestination[] {
  const leaderEvent = findLeaderApprovalEvent(
    data,
    candidateState.assignment.id,
  );

  return data.integrationEventRows
    .filter((item) => {
      return item.event_type === "evidence_approved" &&
        (leaderEvent?.id ? item.source_event_id === leaderEvent.id : true);
    })
    .map((item) => item.destination);
}

function hasObserved(
  readbackEvidence: PointsKpiMaterializationReadbackItem[],
  key: string,
): boolean {
  return readbackEvidence.find((item) => item.key === key)?.status === "observed";
}

function getPlainEnglishDecision(
  status: PointsKpiMaterializationPacketStatus,
  evidenceObserved: boolean,
): string {
  if (evidenceObserved) {
    return "Points and KPI materialization readback is visible, append-only review guidance is present, and no external export path is active. This packet is ready for staging review.";
  }

  switch (status) {
    case "blocked_until_local_supabase":
      return "Move the app onto local Supabase first so this packet can inspect trusted points and KPI rows.";
    case "blocked_until_leader_review":
      return "Prove the leader approval path first. No recognition row should be treated as trustworthy until the approved proof source is visible.";
    case "blocked_until_hq_review":
      return "Prove HQ sharing posture for the same proof/testimonial before promoting recognition or KPI readback.";
    case "blocked_until_materialized_rows":
      return "The packet can see the source decision, but one or both materialized rows are still missing or do not match the assignment rules.";
    case "duplicate_materialization_detected":
      return "Duplicate points or KPI rows were observed for the same approval path. Stop and treat this as an idempotency problem.";
    case "needs_manual_audit_check":
      return "Core row readback is visible, but audit proof still needs manual confirmation before this packet should be promoted.";
    case "hidden":
      return "This packet is intentionally hidden outside staff review roles.";
    case "evidence_observed":
      return "Points and KPI materialization readback is visible and ready for staging review.";
  }
}

function buildHiddenVerificationPacket(): PointsKpiMaterializationVerificationPacket {
  return {
    status: "hidden",
    canPromoteToStagingReview: false,
    title: "Points and KPI materialization review packet",
    plainEnglishDecision:
      "This staff safety packet stays hidden from operating roles.",
    envSettings: [],
    fakeOperatorChain: [],
    operatorSequence: [],
    safetyStops: [],
  };
}

function emptyCounts(): PointsKpiMaterializationPacket["counts"] {
  return {
    checks: 0,
    passedChecks: 0,
    observedReadbackItems: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    duplicateRowsDetected: 0,
  };
}

function getTitle(actor: LocalActorContext) {
  switch (actor.audience) {
    case "admin":
      return "Admin points and KPI packet";
    case "ds_admin":
      return "DS Admin points and KPI safety packet";
    case "super_admin":
      return "Full points and KPI packet";
    default:
      return "Points and KPI packet";
  }
}
