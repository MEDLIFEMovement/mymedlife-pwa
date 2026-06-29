import { createSupabaseControlClient } from "@/lib/supabase-control-client";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import type { LocalActorContext } from "@/services/local-actor-context";
import { recordProductionControlApproval } from "@/services/production-control-approvals";
import {
  featureFlagEnvironments,
  featureFlagKeys,
  featureFlagRegistry,
  featureFlagStatuses,
} from "../constants";
import type {
  FeatureFlagAuditRecord,
  FeatureFlagAdminState,
  FeatureFlagChangeInput,
  FeatureFlagDefinition,
  FeatureFlagEnvironment,
  FeatureFlagKey,
  FeatureFlagResolvedState,
  FeatureFlagStatus,
  ModuleFeatureAvailability,
  ModuleFeatureFlagKey,
} from "../types";

type FeatureFlagOverrideStoreKey = `${FeatureFlagEnvironment}:${FeatureFlagKey}`;

type FeatureFlagStore = {
  overrides: Map<FeatureFlagOverrideStoreKey, FeatureFlagStatus>;
  auditRecords: FeatureFlagAuditRecord[];
};

type PersistedFeatureFlagOverrideRow = {
  environment: FeatureFlagEnvironment;
  flag_key: FeatureFlagKey;
  status: FeatureFlagStatus;
};

type PersistedFeatureFlagAuditRow = {
  id: string;
  actor_user_id: string;
  actor_email: string;
  actor_role: "ds_admin" | "super_admin";
  environment: FeatureFlagEnvironment;
  flag_key: FeatureFlagKey;
  old_status: FeatureFlagStatus | null;
  new_status: FeatureFlagStatus;
  reason: string;
  created_at: string;
};

type FeatureFlagRpcResult = {
  override_id: string;
  old_status: FeatureFlagStatus | null;
  new_status: FeatureFlagStatus;
  audit_log_id: string;
};

declare global {
  var __MYMEDLIFE_FEATURE_FLAG_STORE__: FeatureFlagStore | undefined;
}

function getStore(): FeatureFlagStore {
  if (!globalThis.__MYMEDLIFE_FEATURE_FLAG_STORE__) {
    globalThis.__MYMEDLIFE_FEATURE_FLAG_STORE__ = {
      overrides: new Map(),
      auditRecords: [],
    };
  }

  return globalThis.__MYMEDLIFE_FEATURE_FLAG_STORE__;
}

export class FeatureDisabledError extends Error {
  readonly flag: FeatureFlagKey;
  readonly environment: FeatureFlagEnvironment;
  readonly status: FeatureFlagStatus;

  constructor(state: FeatureFlagResolvedState) {
    super(`${state.label} is ${state.status} in ${state.environment}.`);
    this.name = "FeatureDisabledError";
    this.flag = state.key;
    this.environment = state.environment;
    this.status = state.status;
  }
}

export function getFeatureFlagDefinitions(): FeatureFlagDefinition[] {
  return [...featureFlagRegistry];
}

export function getFeatureFlagDefinition(
  key: FeatureFlagKey,
): FeatureFlagDefinition {
  const definition = featureFlagRegistry.find((flag) => flag.key === key);

  if (!definition) {
    throw new Error(`Unknown feature flag: ${key}`);
  }

  return definition;
}

export function getCurrentFeatureEnvironment(
  env: Record<string, string | undefined> = process.env,
): FeatureFlagEnvironment {
  const explicit = env.MYMEDLIFE_FEATURE_ENVIRONMENT;

  if (isFeatureFlagEnvironment(explicit)) {
    return explicit;
  }

  if (env.MYMEDLIFE_LUMA_ENVIRONMENT === "staging") {
    return "staging";
  }

  if (env.VERCEL_ENV === "preview") {
    return "preview";
  }

  if (env.VERCEL_ENV === "production") {
    return "production";
  }

  return "local";
}

export function getFeatureStatus(
  key: FeatureFlagKey,
  options: {
    environment?: FeatureFlagEnvironment;
    env?: Record<string, string | undefined>;
  } = {},
): FeatureFlagStatus {
  const definition = getFeatureFlagDefinition(key);
  const environment =
    options.environment ?? getCurrentFeatureEnvironment(options.env);
  const override = getStore().overrides.get(storeKey(environment, key));

  return override ?? definition.defaultStatusByEnvironment[environment];
}

export function getFeatureStatusFromOverrides(
  key: FeatureFlagKey,
  environment: FeatureFlagEnvironment,
  overrides: Map<FeatureFlagOverrideStoreKey, FeatureFlagStatus>,
): FeatureFlagStatus {
  const definition = getFeatureFlagDefinition(key);
  return overrides.get(storeKey(environment, key)) ??
    definition.defaultStatusByEnvironment[environment];
}

export function isFeatureEnabled(
  key: FeatureFlagKey,
  options: {
    environment?: FeatureFlagEnvironment;
    env?: Record<string, string | undefined>;
  } = {},
): boolean {
  const environment =
    options.environment ?? getCurrentFeatureEnvironment(options.env);
  const status = getFeatureStatus(key, { environment, env: options.env });
  return isStatusEnabled(status, environment);
}

export function getFeatureResolvedState(
  key: FeatureFlagKey,
  options: {
    environment?: FeatureFlagEnvironment;
    env?: Record<string, string | undefined>;
  } = {},
): FeatureFlagResolvedState {
  const definition = getFeatureFlagDefinition(key);
  const environment =
    options.environment ?? getCurrentFeatureEnvironment(options.env);
  const status = getFeatureStatus(key, { environment, env: options.env });
  const enabled = isStatusEnabled(status, environment);

  return {
    key,
    kind: definition.kind,
    label: definition.label,
    status,
    environment,
    enabled,
    reason: enabled
      ? `${definition.label} is available in ${environment}.`
      : `${definition.label} is ${status}; using fallback instead.`,
    gracefulFallback: definition.gracefulFallback,
    externalApiBoundary: definition.externalApiBoundary,
  };
}

export async function getFeatureResolvedStateDurable(
  key: FeatureFlagKey,
  options: {
    environment?: FeatureFlagEnvironment;
    env?: Record<string, string | undefined>;
  } = {},
): Promise<FeatureFlagResolvedState> {
  const environment =
    options.environment ?? getCurrentFeatureEnvironment(options.env);
  const { client } = await createSupabaseControlClient(options.env);

  if (!client) {
    return getFeatureResolvedState(key, { environment, env: options.env });
  }

  const rows = await client.selectRows<PersistedFeatureFlagOverrideRow>(
    "feature_flag_overrides",
    {
      select: "environment,flag_key,status",
      query: {
        environment: `eq.${environment}`,
        flag_key: `eq.${key}`,
      },
      limit: 1,
    },
  );
  const overrides = new Map<FeatureFlagOverrideStoreKey, FeatureFlagStatus>();
  const row = rows[0];

  if (
    row &&
    row.flag_key === key &&
    isFeatureFlagEnvironment(row.environment) &&
    isFeatureFlagStatus(row.status)
  ) {
    overrides.set(storeKey(row.environment, row.flag_key), row.status);
  }

  return getFeatureResolvedStateFromOverrides(key, environment, overrides);
}

export function getFeatureResolvedStateFromOverrides(
  key: FeatureFlagKey,
  environment: FeatureFlagEnvironment,
  overrides: Map<FeatureFlagOverrideStoreKey, FeatureFlagStatus>,
): FeatureFlagResolvedState {
  const definition = getFeatureFlagDefinition(key);
  const status = getFeatureStatusFromOverrides(key, environment, overrides);
  const enabled = isStatusEnabled(status, environment);

  return {
    key,
    kind: definition.kind,
    label: definition.label,
    status,
    environment,
    enabled,
    reason: enabled
      ? `${definition.label} is available in ${environment}.`
      : `${definition.label} is ${status}; using fallback instead.`,
    gracefulFallback: definition.gracefulFallback,
    externalApiBoundary: definition.externalApiBoundary,
  };
}

export function requireFeature(
  key: FeatureFlagKey,
  options: {
    environment?: FeatureFlagEnvironment;
    env?: Record<string, string | undefined>;
  } = {},
): FeatureFlagResolvedState {
  const state = getFeatureResolvedState(key, options);

  if (!state.enabled) {
    throw new FeatureDisabledError(state);
  }

  return state;
}

export function getModuleFeatureAvailability(
  key: ModuleFeatureFlagKey,
  options: {
    environment?: FeatureFlagEnvironment;
    env?: Record<string, string | undefined>;
  } = {},
): ModuleFeatureAvailability {
  const state = getFeatureResolvedState(key, options);

  if (state.kind !== "module") {
    throw new Error(`${key} is not a module feature flag.`);
  }

  return {
    key,
    label: state.label,
    status: state.status,
    environment: state.environment,
    enabled: state.enabled,
    summary: state.enabled ? state.reason : state.gracefulFallback,
    gracefulFallback: state.gracefulFallback,
    blockedControls: state.enabled
      ? []
      : [
          `${state.label} controls are disabled in ${state.environment}.`,
          state.gracefulFallback,
        ],
  };
}

export function canManageFeatureFlags(actor: LocalActorContext): boolean {
  const family = getActorSurfaceFamily(actor);
  return family === "ds_admin" || family === "super_admin";
}

export function listFeatureFlags(
  options: {
    environment?: FeatureFlagEnvironment;
    env?: Record<string, string | undefined>;
  } = {},
): FeatureFlagResolvedState[] {
  return featureFlagKeys.map((key) => getFeatureResolvedState(key, options));
}

export async function getFeatureFlagAdminState(
  options: {
    environment?: FeatureFlagEnvironment;
    env?: Record<string, string | undefined>;
  } = {},
): Promise<FeatureFlagAdminState> {
  const environment =
    options.environment ?? getCurrentFeatureEnvironment(options.env);
  const { client, persistence } = await createSupabaseControlClient(options.env);

  if (!client) {
    return {
      flags: listFeatureFlags({ environment, env: options.env }),
      auditRecords: listFeatureFlagAuditRecords().slice(0, 10),
      persistence,
    };
  }

  const [overrideRows, auditRows] = await Promise.all([
    client.selectRows<PersistedFeatureFlagOverrideRow>("feature_flag_overrides", {
      select: "environment,flag_key,status",
      query: { environment: `eq.${environment}` },
    }),
    client.selectRows<PersistedFeatureFlagAuditRow>("feature_flag_audit_records", {
      select:
        "id,actor_user_id,actor_email,actor_role,environment,flag_key,old_status,new_status,reason,created_at",
      query: { environment: `eq.${environment}` },
      order: { column: "created_at", ascending: false },
      limit: 10,
    }),
  ]);
  const overrides = new Map<FeatureFlagOverrideStoreKey, FeatureFlagStatus>();

  for (const row of overrideRows) {
    if (isFeatureFlagEnvironment(row.environment) && isFeatureFlagStatus(row.status)) {
      overrides.set(storeKey(row.environment, row.flag_key), row.status);
    }
  }

  return {
    flags: featureFlagKeys.map((key) =>
      getFeatureResolvedStateFromOverrides(key, environment, overrides),
    ),
    auditRecords: auditRows.map(toFeatureFlagAuditRecord),
    persistence,
  };
}

export function updateFeatureFlagStatus(
  input: FeatureFlagChangeInput,
): FeatureFlagAuditRecord {
  if (!canManageFeatureFlags(input.actor)) {
    throw new Error("Only DS Admin or Super Admin can manage feature flags.");
  }

  if (!isFeatureFlagEnvironment(input.environment)) {
    throw new Error("Unsupported feature flag environment.");
  }

  if (!isFeatureFlagStatus(input.nextStatus)) {
    throw new Error("Unsupported feature flag status.");
  }

  const reason = input.reason.trim();

  if (reason.length < 8) {
    throw new Error("Feature flag changes require a clear reason.");
  }

  const oldStatus = getFeatureStatus(input.key, {
    environment: input.environment,
  });
  getStore().overrides.set(
    storeKey(input.environment, input.key),
    input.nextStatus,
  );

  const record: FeatureFlagAuditRecord = {
    id: `feature-flag-audit-${Date.now()}-${getStore().auditRecords.length + 1}`,
    actorUserId: input.actor.user.id,
    actorEmail: input.actor.user.email,
    actorRole:
      getActorSurfaceFamily(input.actor) === "super_admin"
        ? "super_admin"
        : "ds_admin",
    environment: input.environment,
    key: input.key,
    oldStatus,
    newStatus: input.nextStatus,
    reason,
    createdAt: new Date().toISOString(),
  };
  getStore().auditRecords.unshift(record);

  return record;
}

export async function updateFeatureFlagStatusDurable(
  input: FeatureFlagChangeInput,
): Promise<FeatureFlagAuditRecord> {
  const { client } = await createSupabaseControlClient();
  const definition = getFeatureFlagDefinition(input.key);
  const requiresProductionApproval =
    input.environment === "production" &&
    definition.externalApiBoundary &&
    input.nextStatus !== "disabled" &&
    input.nextStatus !== "emergency_disabled";

  if (!client) {
    if (requiresProductionApproval) {
      throw new Error(
        "Production-sensitive provider flags require Supabase-backed control storage.",
      );
    }

    return updateFeatureFlagStatus(input);
  }

  if (requiresProductionApproval) {
    await recordProductionControlApproval({
      client,
      scope: "feature_flag",
      targetKey: input.key,
      approvalReference: input.approvalReference ?? "",
      reason: input.reason,
    });
  }

  const result = await client.rpc<FeatureFlagRpcResult[]>(
    "upsert_feature_flag_override",
    {
      flag_environment: input.environment,
      target_flag_key: input.key,
      flag_kind: definition.kind,
      next_status: input.nextStatus,
      reason: input.reason,
      approval_reference: input.approvalReference ?? null,
      step_up_session_uuid: input.stepUpSessionId ?? null,
    },
  );
  const row = result[0];

  if (!row) {
    throw new Error("Feature flag update did not return an audit result.");
  }

  return {
    id: row.audit_log_id,
    actorUserId: input.actor.user.id,
    actorEmail: input.actor.selectedEmail,
    actorRole:
      getActorSurfaceFamily(input.actor) === "super_admin"
        ? "super_admin"
        : "ds_admin",
    environment: input.environment,
    key: input.key,
    oldStatus:
      row.old_status ??
      getFeatureFlagDefinition(input.key).defaultStatusByEnvironment[input.environment],
    newStatus: row.new_status,
    reason: input.reason.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function listFeatureFlagAuditRecords(): FeatureFlagAuditRecord[] {
  return [...getStore().auditRecords];
}

export function resetFeatureFlagStoreForTests() {
  globalThis.__MYMEDLIFE_FEATURE_FLAG_STORE__ = {
    overrides: new Map(),
    auditRecords: [],
  };
}

export function getFeatureFlagFallbackMessage(
  key: FeatureFlagKey,
  options: {
    environment?: FeatureFlagEnvironment;
    env?: Record<string, string | undefined>;
  } = {},
): string {
  const state = getFeatureResolvedState(key, options);
  return state.enabled ? state.reason : state.gracefulFallback;
}

function isStatusEnabled(
  status: FeatureFlagStatus,
  environment: FeatureFlagEnvironment,
): boolean {
  switch (status) {
    case "enabled":
      return true;
    case "staging_only":
      return environment === "staging" || environment === "preview";
    case "mock_only":
    case "internal_only":
      return environment !== "production";
    case "scheduled":
    case "disabled":
    case "emergency_disabled":
      return false;
  }
}

function storeKey(
  environment: FeatureFlagEnvironment,
  key: FeatureFlagKey,
): FeatureFlagOverrideStoreKey {
  return `${environment}:${key}`;
}

function isFeatureFlagEnvironment(
  value: string | undefined,
): value is FeatureFlagEnvironment {
  return featureFlagEnvironments.includes(value as FeatureFlagEnvironment);
}

function isFeatureFlagStatus(
  value: string | undefined,
): value is FeatureFlagStatus {
  return featureFlagStatuses.includes(value as FeatureFlagStatus);
}

function toFeatureFlagAuditRecord(
  row: PersistedFeatureFlagAuditRow,
): FeatureFlagAuditRecord {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    environment: row.environment,
    key: row.flag_key,
    oldStatus:
      row.old_status ??
      getFeatureFlagDefinition(row.flag_key).defaultStatusByEnvironment[row.environment],
    newStatus: row.new_status,
    reason: row.reason,
    createdAt: row.created_at,
  };
}
