import {
  getEnvironmentSafetySummary,
  type EnvironmentSafetyInput,
} from "@/services/environment-safety-summary";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { getAppRouteRegistry } from "@/services/app-route-registry";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

export type AdminSystemHealthStatus =
  | "local_ready"
  | "mock_safe"
  | "needs_review"
  | "blocked_before_live";

export type AdminSystemHealthCheck = {
  key: string;
  label: string;
  ownerLane: string;
  status: AdminSystemHealthStatus;
  signal: string;
  nextStep: string;
  routeEvidence: string[];
};

export type AdminSystemHealthReview = {
  canReadReview: boolean;
  title: string;
  launchReady: false;
  summary: string;
  sourceLabel: string;
  browserWritesEnabled: number;
  externalWritesEnabled: 0;
  secretsShown: 0;
  counts: {
    total: number;
    localReady: number;
    mockSafe: number;
    needsReview: number;
    blockedBeforeLive: number;
  };
  checks: AdminSystemHealthCheck[];
  finalPrompt: string;
};

export function getAdminSystemHealthReview(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  env?: EnvironmentSafetyInput,
): AdminSystemHealthReview {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadReview: false,
      title: "System health review hidden for this role",
      launchReady: false,
      summary:
        "System health is an admin launch-readiness surface, not a chapter operating view.",
      sourceLabel: data.source.mode,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      secretsShown: 0,
      counts: emptyCounts(),
      checks: [],
      finalPrompt: "",
    };
  }

  const environmentSafety = getEnvironmentSafetySummary(actor, env);
  const checks = getSystemHealthChecks(data, environmentSafety.counts, env);

  return {
    canReadReview: true,
    title: getTitle(surfaceFamily),
    launchReady: false,
    summary:
      "Shows what is locally healthy, what is safely mocked, and what remains blocked before a live myMEDLIFE pilot.",
    sourceLabel: data.source.mode,
    browserWritesEnabled: environmentSafety.counts.browserWritesEnabled,
    externalWritesEnabled: environmentSafety.counts.externalWritesEnabled,
    secretsShown: environmentSafety.counts.secretsShown,
    counts: countChecks(checks),
    checks,
    finalPrompt:
      "Do not approve live launch until blocked production health checks have owners, the production operations runbook is approved, smoke evidence is current, and rollback or incident response plans are named.",
  };
}

function getSystemHealthChecks(
  data: ReadOnlyAppData,
  environmentCounts: {
    blocked: number;
    watch: number;
  },
  env?: EnvironmentSafetyInput,
): AdminSystemHealthCheck[] {
  const routeCount = getAppRouteRegistry().length;
  const disabledOutboxCount = data.outboxItems.filter((item) => {
    return item.status === "disabled";
  }).length;
  const productionCallback = readPacketValue(
    env,
    "MYMEDLIFE_PRODUCTION_AUTH_CALLBACK_URL",
  );
  const stagingCallback = readPacketValue(
    env,
    "MYMEDLIFE_STAGING_AUTH_CALLBACK_URL",
  );
  const backupOwner = readPacketValue(env, "MYMEDLIFE_PRODUCTION_BACKUP_OWNER");
  const restorePath = readPacketValue(env, "MYMEDLIFE_PRODUCTION_RESTORE_PATH");
  const supportOwner = readPacketValue(env, "MYMEDLIFE_PILOT_SUPPORT_OWNER");
  const supportChannel = readPacketValue(
    env,
    "MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL",
  );
  const rollbackOwner = readPacketValue(env, "MYMEDLIFE_PILOT_ROLLBACK_OWNER");
  const productionAuthRecorded = Boolean(productionCallback && stagingCallback);
  const operationsRecorded = Boolean(
    backupOwner || restorePath || supportOwner || supportChannel || rollbackOwner,
  );

  return [
    {
      key: "route_registry",
      label: "App route registry",
      ownerLane: "Product and QA",
      status: "local_ready",
      signal: `${routeCount} known local routes are registered for review and smoke coverage.`,
      nextStep:
        "Keep route smoke checks current when adding production-only or admin-only routes.",
      routeEvidence: ["/admin", "/rush-month", "/campaigns"],
    },
    {
      key: "data_source",
      label: "Read-only data source",
      ownerLane: "App and Data",
      status: data.source.mode === "supabase" ? "local_ready" : "mock_safe",
      signal: data.source.message,
      nextStep:
        data.source.mode === "supabase"
          ? "Confirm release-branch RLS/security tests before using production data."
          : "Use local Supabase read mode before treating database readback as launch evidence.",
      routeEvidence: ["/admin", "/rush-month/dashboard"],
    },
    {
      key: "environment_flags",
      label: "Environment flags",
      ownerLane: "Platform and Security",
      status:
        environmentCounts.blocked > 0
          ? "blocked_before_live"
          : environmentCounts.watch > 0
            ? "needs_review"
            : "local_ready",
      signal:
        environmentCounts.blocked > 0
          ? `${environmentCounts.blocked} unsafe flag combination(s) need correction.`
          : environmentCounts.watch > 0
            ? `${environmentCounts.watch} local write/read flag(s) are in watch mode.`
            : "No unsafe local flags are active.",
      nextStep:
        "Review environment safety before every local write drill and before production setup.",
      routeEvidence: ["/admin"],
    },
    {
      key: "audit_readback",
      label: "Audit readback",
      ownerLane: "Security and Admin",
      status: data.auditLogs.length > 0 ? "local_ready" : "mock_safe",
      signal:
        data.auditLogs.length > 0
          ? `${data.auditLogs.length} visible audit row(s) are available for admin readback.`
          : "Mock fallback has audit intent, but no persisted audit rows are visible yet.",
      nextStep:
        "Require actor, target, before/after, reason, and timestamp readback for every promoted write.",
      routeEvidence: ["/admin", "/admin/first-write"],
    },
    {
      key: "outbox_safety",
      label: "Outbox safety",
      ownerLane: "Data Solutions",
      status: "local_ready",
      signal: `${disabledOutboxCount} disabled outbox row(s) are visible; external sends remain off.`,
      nextStep:
        "Approve retry, idempotency, dead-letter, and manual recovery rules before any real external send.",
      routeEvidence: ["/admin", "/rush-month/loop"],
    },
    {
      key: "production_auth",
      label: "Production auth",
      ownerLane: "Security and Student Access",
      status: productionAuthRecorded ? "needs_review" : "blocked_before_live",
      signal: productionAuthRecorded
        ? `Recorded callback plan exists for ${productionCallback} and ${stagingCallback}, but production auth and real users are still not enabled.`
        : "Production auth and real users are not enabled.",
      nextStep:
        productionAuthRecorded
          ? "Use the recorded callback plan to finish role-routing proof, onboarding approval, and membership approval review."
          : "Approve Supabase Auth project setup, callbacks, onboarding, and membership approval flow.",
      routeEvidence: ["/login", "/chapter/members"],
    },
    {
      key: "proof_storage",
      label: "Proof upload storage",
      ownerLane: "Proof Library and HQ Review",
      status: "blocked_before_live",
      signal: "Uploads and public proof publishing remain disabled.",
      nextStep:
        "Approve storage buckets, file limits, consent, moderation, and deletion policy.",
      routeEvidence: ["/proof-library/upload", "/rush-month/evidence"],
    },
    {
      key: "external_integrations",
      label: "External integrations",
      ownerLane: "Data Solutions",
      status: "blocked_before_live",
      signal:
        "HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes are disabled.",
      nextStep:
        "Approve each integration contract only after app truth and audit readback are stable.",
      routeEvidence: ["/admin"],
    },
    {
      key: "monitoring_backup",
      label: "Monitoring, backup, and incident ownership",
      ownerLane: "Platform and Security",
      status: operationsRecorded ? "needs_review" : "blocked_before_live",
      signal: operationsRecorded
        ? `Recorded production-ops packet values now exist for backup owner ${backupOwner ?? "pending"}, restore path ${restorePath ?? "pending"}, support owner ${supportOwner ?? "pending"}, support channel ${supportChannel ?? "pending"}, and rollback owner ${rollbackOwner ?? "pending"}, but release-build proof and final operations approval are still missing.`
        : "A local production operations runbook exists, but production monitoring, backup checks, and incident ownership are not connected yet.",
      nextStep:
        operationsRecorded
          ? "Review the recorded production-ops packet on the launch gate, then finish alerting, backup proof, and rollback signoff before pilot launch."
          : "Review the operations runbook, assign owners, define alerts, prove backups, and document rollback before pilot launch.",
      routeEvidence: ["/admin", "/admin/pilot-scope"],
    },
  ];
}

function readPacketValue(
  env: EnvironmentSafetyInput | undefined,
  key: string,
) {
  const value = env?.[key]?.trim();
  return value ? value : null;
}

function countChecks(
  checks: AdminSystemHealthCheck[],
): AdminSystemHealthReview["counts"] {
  return {
    total: checks.length,
    localReady: checks.filter((item) => item.status === "local_ready").length,
    mockSafe: checks.filter((item) => item.status === "mock_safe").length,
    needsReview: checks.filter((item) => item.status === "needs_review").length,
    blockedBeforeLive: checks.filter(
      (item) => item.status === "blocked_before_live",
    ).length,
  };
}

function emptyCounts(): AdminSystemHealthReview["counts"] {
  return {
    total: 0,
    localReady: 0,
    mockSafe: 0,
    needsReview: 0,
    blockedBeforeLive: 0,
  };
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "staff":
      return "Admin system health review";
    case "ds_admin":
      return "DS Admin system health and integration review";
    case "super_admin":
      return "Full system health review";
    case "member":
    case "leader":
    case "coach":
      return "System health review hidden for this role";
  }
}
