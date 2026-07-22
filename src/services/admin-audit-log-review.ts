import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { AuditLogRow, JsonValue } from "@/shared/types/persistence";

export type AdminAuditLogPosture =
  | "persisted_readback_visible"
  | "persisted_readback_empty"
  | "mock_intent_only"
  | "row_details_hidden";

export type AdminAuditPreflightStatus = "ready" | "watch" | "blocked";

export type AdminAuditPreflightItem = {
  key: string;
  label: string;
  status: AdminAuditPreflightStatus;
  question: string;
  requiredEvidence: string;
  currentPosture: string;
  routeEvidence: string[];
  browserWritesExpected: 0;
  externalWritesExpected: 0;
};

export type AdminAuditPreflightChecklist = {
  title: string;
  summary: string;
  items: AdminAuditPreflightItem[];
  blockedControls: string[];
  counts: {
    total: number;
    ready: number;
    watch: number;
    blocked: number;
    browserWritesEnabled: 0;
    externalWritesEnabled: 0;
    secretsShown: 0;
  };
};

export type AdminAuditLogReviewRow = {
  id: string;
  action: string;
  actorUserId: string;
  chapterId: string;
  target: string;
  beforeSummary: string;
  afterSummary: string;
  reason: string;
  createdAt: string;
};

export type AdminAuditLogReview = {
  canReadReview: boolean;
  canReadRows: boolean;
  title: string;
  posture: AdminAuditLogPosture;
  summary: string;
  sourceLabel: string;
  rows: AdminAuditLogReviewRow[];
  auditPreflight: AdminAuditPreflightChecklist;
  counts: {
    visibleRows: number;
    hiddenRows: number;
    browserWritesEnabled: 0;
    externalWritesEnabled: 0;
    secretsShown: 0;
  };
  nextStep: string;
};

export function getAdminAuditLogReview(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): AdminAuditLogReview {
  const auditLogs = data.source.mode === "supabase"
    ? data.allAuditLogs
    : data.auditLogs;

  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadReview: false,
      canReadRows: false,
      title: "Audit log review hidden for this role",
      posture: "row_details_hidden",
      summary:
        "Audit-log review is an admin launch-readiness surface, not a chapter operating view.",
      sourceLabel: data.source.mode,
      rows: [],
      auditPreflight: emptyAuditPreflightChecklist(),
      counts: emptyCounts(auditLogs.length),
      nextStep: "",
    };
  }

  if (actor.audience === "ds_admin") {
    return {
      canReadReview: true,
      canReadRows: false,
      title: "DS Admin audit posture",
      posture: "row_details_hidden",
      summary:
        "DS Admin can confirm audit-readback posture from this read-only review surface, but row-level chapter/member audit details stay with Admin and Super Admin.",
      sourceLabel: data.source.mode,
      rows: [],
      auditPreflight: buildAuditPreflightChecklist({
        canReadRows: false,
        hiddenRows: auditLogs.length,
        rows: [],
      }),
      counts: emptyCounts(auditLogs.length),
      nextStep:
        "Use integration and outbox rows for DS safety review; ask Admin or Super Admin to confirm row-level audit evidence before live writes.",
    };
  }

  const rows = auditLogs.map(toReviewRow);
  const hasRows = rows.length > 0;
  const hasPersistedSource = data.source.mode === "supabase";

  return {
    canReadReview: true,
    canReadRows: true,
    title:
      actor.audience === "super_admin"
        ? "Super Admin audit readback"
        : "Admin audit readback",
    posture: hasRows
      ? "persisted_readback_visible"
      : hasPersistedSource
        ? "persisted_readback_empty"
        : "mock_intent_only",
    summary: hasRows
      ? "Persisted audit rows are visible in this read-only admin review surface."
      : hasPersistedSource
        ? "The authenticated Supabase read completed, but no audit rows are currently visible to this role."
        : "Mock fallback can show audit intent in this read-only review surface, but no persisted audit rows are visible yet.",
    sourceLabel: data.source.mode,
    rows,
    auditPreflight: buildAuditPreflightChecklist({
      canReadRows: true,
      hiddenRows: 0,
      rows,
    }),
    counts: {
      visibleRows: rows.length,
      hiddenRows: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    },
    nextStep: hasRows
      ? "Before production launch, confirm each approved write path creates an audit row with actor, target, before/after value, reason, and readback evidence; this surface remains read-only."
      : hasPersistedSource
        ? "Verify audit RLS and the approved write path before treating audit coverage as complete; this surface remains read-only."
        : "Run localhost Supabase write/readback drills before treating audit coverage as production-ready; this surface remains read-only.",
  };
}

function buildAuditPreflightChecklist({
  canReadRows,
  hiddenRows,
  rows,
}: {
  canReadRows: boolean;
  hiddenRows: number;
  rows: AdminAuditLogReviewRow[];
}): AdminAuditPreflightChecklist {
  const hasVisibleRows = rows.length > 0;
  const hasAnyRows = hasVisibleRows || hiddenRows > 0;
  const rowsWithActor = rows.filter((row) => row.actorUserId !== "system").length;
  const rowsWithReason = rows.filter(
    (row) => row.reason !== "No reason recorded.",
  ).length;
  const rowsWithBeforeAfter = rows.filter((row) => {
    return row.beforeSummary !== "none" || row.afterSummary !== "none";
  }).length;

  const items: AdminAuditPreflightItem[] = [
    {
      key: "actor_identity",
      label: "Prove actor identity",
      status: hasVisibleRows
        ? rowsWithActor === rows.length
          ? "ready"
          : "watch"
        : "watch",
      question: "Can reviewers see who triggered each future write?",
      requiredEvidence:
        "Every production write path needs actor_user_id or a deliberate system actor, plus local auth evidence before launch.",
      currentPosture: canReadRows
        ? `${rowsWithActor} of ${rows.length} visible row(s) have a non-system actor.`
        : `${hiddenRows} row(s) hidden from this role; Admin or Super Admin must confirm actor details.`,
      routeEvidence: ["/admin/audit-log", "/admin/write-sequence"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "target_readback",
      label: "Confirm target readback",
      status: hasAnyRows ? "ready" : "watch",
      question: "Can reviewers connect the audit row back to the changed table and record?",
      requiredEvidence:
        "Audit rows must include target table and target id for assignment, proof, decision, outbox, and admin mutation paths.",
      currentPosture: hasVisibleRows
        ? `${rows.length} visible row(s) include target table posture.`
        : hiddenRows > 0
          ? `${hiddenRows} hidden row(s) exist; details require Admin or Super Admin.`
          : "No persisted audit row readback is visible yet.",
      routeEvidence: ["/admin/audit-log", "/admin/first-write"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "before_after",
      label: "Check before and after",
      status: hasVisibleRows
        ? rowsWithBeforeAfter === rows.length
          ? "ready"
          : "watch"
        : "watch",
      question: "Can reviewers see what changed without exposing secrets?",
      requiredEvidence:
        "Each write path needs before/after summaries or a documented reason before production writes are approved.",
      currentPosture: canReadRows
        ? `${rowsWithBeforeAfter} of ${rows.length} visible row(s) include before or after summaries.`
        : "Before/after values stay hidden from this role by design.",
      routeEvidence: ["/admin/audit-log", "/admin/release-readiness"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "reason_note",
      label: "Require reason note",
      status: hasVisibleRows
        ? rowsWithReason === rows.length
          ? "ready"
          : "watch"
        : "watch",
      question: "Does every future write explain why it happened?",
      requiredEvidence:
        "Leader, coach, HQ, and admin write paths need a plain-English reason before save controls are promoted.",
      currentPosture: canReadRows
        ? `${rowsWithReason} of ${rows.length} visible row(s) include a reason.`
        : "Reason details stay hidden from this role by design.",
      routeEvidence: ["/admin/audit-log", "/admin/review-path"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "visibility_boundary",
      label: "Keep visibility boundary",
      status: canReadRows || hiddenRows > 0 ? "ready" : "watch",
      question: "Are DS Admin and operating roles kept away from row-level chapter/member audit truth?",
      requiredEvidence:
        "DS Admin should see posture and counts while Admin/Super Admin confirm row-level details.",
      currentPosture: canReadRows
        ? "This role can inspect row-level audit details."
        : `${hiddenRows} row(s) hidden from this role.`,
      routeEvidence: ["/admin/audit-log", "/admin/integration-outbox"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "retention_export_lock",
      label: "Lock retention and export",
      status: "ready",
      question: "Are audit exports, deletion, retention changes, and secret display unavailable from the browser?",
      requiredEvidence:
        "Launch approval needs retention/export policy, but the local app must keep audit edits, deletes, exports, and secrets disabled.",
      currentPosture:
        "0 browser writes, 0 external sends, and 0 secrets shown from this read-only route.",
      routeEvidence: ["/admin/audit-log", "/admin/system-health"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  ];

  return {
    title: "Write-audit preflight checklist",
    summary:
      "Use this before approving any production write path to confirm actor, target, before/after, reason, visibility, and retention posture.",
    items,
    blockedControls: [
      "edit audit rows in browser",
      "delete audit rows in browser",
      "export audit rows from preview",
      "change retention from preview",
      "show secrets in preview",
      "approve production writes from preview",
    ],
    counts: {
      total: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      watch: items.filter((item) => item.status === "watch").length,
      blocked: items.filter((item) => item.status === "blocked").length,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    },
  };
}

function toReviewRow(row: AuditLogRow): AdminAuditLogReviewRow {
  return {
    id: row.id,
    action: row.action,
    actorUserId: row.actor_user_id ?? "system",
    chapterId: row.chapter_id ?? "none",
    target: row.target_id ? `${row.target_table}:${row.target_id}` : row.target_table,
    beforeSummary: summarizeJson(row.before_value),
    afterSummary: summarizeJson(row.after_value),
    reason: row.reason ?? "No reason recorded.",
    createdAt: row.created_at,
  };
}

function summarizeJson(value: JsonValue): string {
  if (value === null) {
    return "none";
  }

  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);

    if (keys.length === 0) {
      return "empty object";
    }

    return keys.slice(0, 4).join(", ");
  }

  return String(value);
}

function emptyCounts(hiddenRows: number): AdminAuditLogReview["counts"] {
  return {
    visibleRows: 0,
    hiddenRows,
    browserWritesEnabled: 0,
    externalWritesEnabled: 0,
    secretsShown: 0,
  };
}

function emptyAuditPreflightChecklist(): AdminAuditPreflightChecklist {
  return {
    title: "Write-audit preflight checklist hidden for this role",
    summary:
      "Use Admin, DS Admin, or Super Admin to inspect audit readiness before approving write paths.",
    items: [],
    blockedControls: [],
    counts: {
      total: 0,
      ready: 0,
      watch: 0,
      blocked: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
    },
  };
}
