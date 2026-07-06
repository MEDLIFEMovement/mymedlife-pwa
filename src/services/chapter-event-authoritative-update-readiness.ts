import { isUuid } from "@/services/action-start-write";
import {
  getChapterEventUpdateSafetyContract,
  type ChapterEventUpdateField,
} from "@/services/chapter-event-update-safety-contract";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";

type EnvSource = Record<string, string | undefined>;

export type ChapterEventAuthoritativeUpdateValue =
  | string
  | number
  | null;

export type ChapterEventAuthoritativeUpdateInput = {
  chapterEventId: string;
  patch: Partial<
    Record<ChapterEventUpdateField, ChapterEventAuthoritativeUpdateValue>
  >;
  auditReason: string;
};

export type ChapterEventAuthoritativeUpdateCheckKey =
  | "local_writes_requested"
  | "chapter_event_update_write_approved"
  | "database_function_ready"
  | "rls_tests_ready"
  | "local_auth_session"
  | "chapter_event_uuid"
  | "implemented_field_subset_only"
  | "audit_reason_present"
  | "actor_allowed"
  | "server_boundary_implemented"
  | "browser_controls_disabled"
  | "external_writes_disabled";

export type ChapterEventAuthoritativeUpdateCheck = {
  key: ChapterEventAuthoritativeUpdateCheckKey;
  label: string;
  passed: boolean;
};

export type ChapterEventAuthoritativeUpdateConfig =
  | {
      enabled: true;
      isLocalOnly: true;
      isHostedStaging: false;
      externalWritesEnabled: false;
      browserControlsEnabled: false;
      reason: string;
    }
  | {
      enabled: false;
      isLocalOnly: boolean;
      isHostedStaging: boolean;
      externalWritesEnabled: false;
      browserControlsEnabled: false;
      reason: string;
    };

export type ChapterEventAuthoritativeUpdateResultCode =
  | "chapter_event_updated"
  | "write_disabled"
  | "missing_auth"
  | "chapter_event_not_found"
  | "field_subset_invalid"
  | "audit_reason_required"
  | "permission_denied"
  | "server_boundary_not_ready";

export type ChapterEventAuthoritativeUpdateReadiness = {
  title: "Chapter-event authoritative update server boundary readiness";
  operation: "chapter_event_authoritative_update";
  futureFunction: "app.update_chapter_event_authoritative_fields";
  futureServerAction: "updateChapterEventAuthoritativeFields";
  canSubmit: boolean;
  resultCodeIfSubmitted: ChapterEventAuthoritativeUpdateResultCode;
  reason: string;
  config: ChapterEventAuthoritativeUpdateConfig;
  checks: ChapterEventAuthoritativeUpdateCheck[];
  requiredEnvFlags: readonly string[];
  requiredDatabaseProof: readonly string[];
  futureTables: readonly string[];
  allowedFields: readonly ChapterEventUpdateField[];
};

const localRequiredEnvFlags = [
  "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true",
  "MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE=true",
] as const;

const requiredDatabaseProof = [
  "direct_owner_and_leader_updates_are_blocked_without_helper",
  "member_cannot_call_update_chapter_event_authoritative_fields",
  "coach_cannot_call_update_chapter_event_authoritative_fields",
  "leader_can_update_authoritative_subset_through_helper",
  "admin_can_update_cross_chapter_authoritative_subset_through_helper",
  "helper_records_internal_event_and_audit_log_only",
] as const;

const futureTables = [
  "chapter_events",
  "events",
  "audit_logs",
] as const;

function getImplementedFieldSubset() {
  const contract = getChapterEventUpdateSafetyContract();
  const authoritativePath = contract.paths.find(
    (path) => path.key === "authoritative_fields",
  );

  if (!authoritativePath) {
    throw new Error("Missing authoritative chapter-event update path.");
  }

  return {
    allowedFields: contract.implementedLocalAuthoritativeFields,
    futureFunction:
      authoritativePath.localFunction as "app.update_chapter_event_authoritative_fields",
    futureServerAction:
      authoritativePath.serverActionName as "updateChapterEventAuthoritativeFields",
  };
}

export function getChapterEventAuthoritativeUpdateWriteConfig(
  env: EnvSource = process.env,
): ChapterEventAuthoritativeUpdateConfig {
  const authConfig = getSupabaseAuthConfig(env);

  if (!authConfig.enabled) {
    return disabledConfig(
      authConfig.reason,
      authConfig.isLocalOnly,
      authConfig.isHostedStaging,
    );
  }

  if (authConfig.isHostedStaging) {
    return disabledConfig(
      "Hosted staging chapter-event authoritative updates remain disabled until a dedicated staging server gate and rollback drill are explicitly approved.",
      false,
      true,
    );
  }

  if (!authConfig.isLocalOnly) {
    return disabledConfig(
      "Hosted production chapter-event authoritative updates remain disabled until a future approved production gate exists.",
      false,
      false,
    );
  }

  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return disabledConfig(
      "Local Supabase writes are disabled. Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true only for localhost server-boundary testing.",
      true,
      false,
    );
  }

  if (env.MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE !== "true") {
    return disabledConfig(
      "Chapter-event authoritative updates remain disabled. Set MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE=true only after the server-only boundary, rollback, and audit readback are approved.",
      true,
      false,
    );
  }

  return {
    enabled: true,
    isLocalOnly: true,
    isHostedStaging: false,
    externalWritesEnabled: false,
    browserControlsEnabled: false,
    reason:
      "Local chapter-event authoritative updates are enabled only for the reviewed server-only localhost boundary. Browser controls, provider calls, points materialization, RSVP writes, attendance imports, outbox sends, and hosted writes remain disabled.",
  };
}

export function getChapterEventAuthoritativeUpdateReadiness(
  actor: LocalActorContext,
  input: ChapterEventAuthoritativeUpdateInput,
  env: EnvSource = process.env,
): ChapterEventAuthoritativeUpdateReadiness {
  const { allowedFields, futureFunction, futureServerAction } =
    getImplementedFieldSubset();
  const config = getChapterEventAuthoritativeUpdateWriteConfig(env);
  const patchKeys = Object.keys(input.patch ?? {}) as ChapterEventUpdateField[];
  const allowedFieldSet = new Set<ChapterEventUpdateField>(allowedFields);
  const implementedFieldSubsetOnly =
    patchKeys.length > 0 && patchKeys.every((key) => allowedFieldSet.has(key));
  const checks: ChapterEventAuthoritativeUpdateCheck[] = [
    {
      key: "local_writes_requested",
      label: "Local write switch is on",
      passed: env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES === "true",
    },
    {
      key: "chapter_event_update_write_approved",
      label: "Chapter-event authoritative update switch is on",
      passed:
        env.MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE === "true",
    },
    {
      key: "database_function_ready",
      label: "Authoritative chapter-event database function is implemented",
      passed: futureFunction === "app.update_chapter_event_authoritative_fields",
    },
    {
      key: "rls_tests_ready",
      label: "Authoritative chapter-event RLS tests are implemented",
      passed: true,
    },
    {
      key: "local_auth_session",
      label: "Signed-in local Supabase Auth session",
      passed:
        actor.identitySource === "local_auth_session" &&
        actor.authSessionStatus === "signed_in",
    },
    {
      key: "chapter_event_uuid",
      label: "Chapter event ID is a Supabase UUID",
      passed: isUuid(input.chapterEventId),
    },
    {
      key: "implemented_field_subset_only",
      label: "Patch stays inside the implemented authoritative subset",
      passed: implementedFieldSubsetOnly,
    },
    {
      key: "audit_reason_present",
      label: "Audit reason has enough context",
      passed: input.auditReason.trim().length >= 12,
    },
    {
      key: "actor_allowed",
      label: "Actor is allowed to use the authoritative path",
      passed: isActorAllowedForAuthoritativeUpdate(actor),
    },
    {
      key: "server_boundary_implemented",
      label: "Reviewed server-only wrapper is implemented",
      passed: true,
    },
    {
      key: "browser_controls_disabled",
      label: "Browser controls stay disabled",
      passed: !config.browserControlsEnabled,
    },
    {
      key: "external_writes_disabled",
      label: "External writes stay disabled",
      passed: !config.externalWritesEnabled,
    },
  ];

  const failedCheck = checks.find((check) => !check.passed);
  const canSubmit = config.enabled && !failedCheck;
  const resultCodeIfSubmitted = canSubmit
    ? "chapter_event_updated"
    : !config.enabled
      ? "write_disabled"
      : getBlockedResultCode(failedCheck?.key);

  return {
    title: "Chapter-event authoritative update server boundary readiness",
    operation: "chapter_event_authoritative_update",
    futureFunction,
    futureServerAction,
    canSubmit,
    resultCodeIfSubmitted,
    reason: !config.enabled
      ? config.reason
      : failedCheck
        ? `${failedCheck.label} is not ready. ${config.reason}`
      : config.reason,
    config,
    checks,
    requiredEnvFlags: localRequiredEnvFlags,
    requiredDatabaseProof,
    futureTables,
    allowedFields,
  };
}

function disabledConfig(
  reason: string,
  isLocalOnly: boolean,
  isHostedStaging: boolean,
): ChapterEventAuthoritativeUpdateConfig {
  return {
    enabled: false,
    isLocalOnly,
    isHostedStaging,
    externalWritesEnabled: false,
    browserControlsEnabled: false,
    reason,
  };
}

function isActorAllowedForAuthoritativeUpdate(
  actor: LocalActorContext,
): boolean {
  return (
    actor.audience === "chapter_leader" ||
    actor.audience === "admin" ||
    actor.audience === "ds_admin" ||
    actor.audience === "super_admin"
  );
}

function getBlockedResultCode(
  failedCheckKey: ChapterEventAuthoritativeUpdateCheckKey | undefined,
): ChapterEventAuthoritativeUpdateResultCode {
  switch (failedCheckKey) {
    case "local_auth_session":
      return "missing_auth";
    case "chapter_event_uuid":
      return "chapter_event_not_found";
    case "implemented_field_subset_only":
      return "field_subset_invalid";
    case "audit_reason_present":
      return "audit_reason_required";
    case "actor_allowed":
      return "permission_denied";
    case "server_boundary_implemented":
      return "server_boundary_not_ready";
    case "local_writes_requested":
    case "chapter_event_update_write_approved":
    case "database_function_ready":
    case "rls_tests_ready":
    case "browser_controls_disabled":
    case "external_writes_disabled":
    case undefined:
      return "write_disabled";
  }
}
