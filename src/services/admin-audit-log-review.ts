import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import type { AuditLogRow, JsonValue } from "@/shared/types/persistence";

export type AdminAuditLogPosture =
  | "persisted_readback_visible"
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
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
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
      counts: emptyCounts(data.auditLogs.length),
      nextStep: "",
    };
  }

  if (surfaceFamily === "ds_admin") {
    return {
      canReadReview: true,
      canReadRows: false,
      title: "DS Admin audit posture",
      posture: "row_details_hidden",
      summary:
        "DS Admin can confirm audit-readback posture, but row-level chapter/member audit details stay with Admin and Super Admin.",
      sourceLabel: data.source.mode,
      rows: [],
      auditPreflight: buildAuditPreflightChecklist({
        canReadRows: false,
        hiddenRows: data.auditLogs.length,
        hiddenRolloutControlRows: countRolloutControlAuditRows(data.auditLogs),
        rows: [],
      }),
      counts: emptyCounts(data.auditLogs.length),
      nextStep:
        "Use integration and outbox rows for DS safety review; ask Admin or Super Admin to confirm row-level audit evidence before live writes.",
    };
  }

  const rows = data.auditLogs.map(toReviewRow);
  const hasRows = rows.length > 0;

  return {
    canReadReview: true,
    canReadRows: true,
    title:
      surfaceFamily === "super_admin"
        ? "Super Admin audit readback"
        : "Admin audit readback",
    posture: hasRows ? "persisted_readback_visible" : "mock_intent_only",
    summary: hasRows
      ? "Persisted audit rows are visible in the read-only admin review surface."
      : "Mock fallback can show audit intent in local contracts, but no persisted audit rows are visible yet.",
    sourceLabel: data.source.mode,
    rows,
    auditPreflight: buildAuditPreflightChecklist({
      canReadRows: true,
      hiddenRows: 0,
      hiddenRolloutControlRows: 0,
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
      ? "Before production launch, confirm each approved write path creates an audit row with actor, target, before/after value, reason, and readback evidence."
      : "Run localhost Supabase write/readback drills before treating audit coverage as production-ready.",
  };
}

function buildAuditPreflightChecklist({
  canReadRows,
  hiddenRows,
  hiddenRolloutControlRows,
  rows,
}: {
  canReadRows: boolean;
  hiddenRows: number;
  hiddenRolloutControlRows: number;
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
  const visibleFeatureFlagRows = rows.filter((row) => row.action === "feature_flag_updated")
    .length;
  const visibleThemeSettingRows = rows.filter((row) => row.action === "theme_setting_updated")
    .length;

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
      key: "rollout_control_audit",
      label: "Prove rollout-control audit rows",
      status: canReadRows
        ? visibleFeatureFlagRows > 0 && visibleThemeSettingRows > 0
          ? "ready"
          : "watch"
        : "watch",
      question: "Can reviewers confirm that feature-flag and theme changes are producing real audit rows?",
      requiredEvidence:
        "Before the control layer is treated as production-ready, audit readback should show at least one `feature_flag_updated` row and one `theme_setting_updated` row.",
      currentPosture: canReadRows
        ? `${visibleFeatureFlagRows} visible feature-flag row(s) and ${visibleThemeSettingRows} visible theme-setting row(s) are present.`
        : hiddenRolloutControlRows > 0
          ? `${hiddenRolloutControlRows} rollout-control audit row(s) exist, but Admin or Super Admin must confirm row-level details.`
          : "No rollout-control audit rows are confirmed for this role yet.",
      routeEvidence: ["/admin/feature-flags", "/admin/theme", "/admin/audit-log"],
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
      currentPosture: "0 browser writes, 0 external sends, and 0 secrets shown.",
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
      "edit audit rows",
      "delete audit rows",
      "export audit rows",
      "change retention",
      "show secrets",
      "approve production writes",
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

function countRolloutControlAuditRows(rows: readonly AuditLogRow[]): number {
  return rows.filter((row) => {
    return row.action === "feature_flag_updated" ||
      row.action === "theme_setting_updated";
  }).length;
}
