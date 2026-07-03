import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState, getDisabledAuthSessionState } from "@/services/auth-session";
import {
  getDsSecretStepUpState,
  needsFreshProductionStepUp,
} from "@/services/admin-integrations-step-up";
import {
  getFeatureFlagDefinition,
  getFeatureFlagDefinitions,
  getRolloutEnvironments,
  getThemeSettingDefinition,
  getThemeSettingDefinitions,
} from "@/services/admin-rollout-controls-registry";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  canReadAdminIntegrationsSecurity,
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import type {
  FeatureFlagApprovalPolicy,
  FeatureFlagDefinition,
  RolloutEnvironment,
  ThemeSettingDefinition,
} from "@/shared/types/admin-rollout-controls";
import type {
  AuditLogRow,
  FeatureFlagRow,
  ThemeSettingRow,
} from "@/shared/types/persistence";

type ResultSearch = {
  result?: string;
  message?: string;
  item?: string;
  environment?: string;
};

type RolloutAuditRowView = {
  id: string;
  action: string;
  reason: string | null;
  createdAt: string;
  targetId: string | null;
};

type RolloutFeatureFlagEnvironmentView = {
  environment: RolloutEnvironment;
  enabled: boolean;
  source: "persisted" | "default";
  approvalPolicy: FeatureFlagApprovalPolicy;
  updatedAt: string | null;
  updatedBy: string | null;
  canAttemptEnable: boolean;
  warning: string | null;
};

type RolloutThemeEnvironmentView = {
  environment: RolloutEnvironment;
  value: string;
  source: "persisted" | "default";
  updatedAt: string | null;
  updatedBy: string | null;
};

export type AdminFeatureFlagCard = {
  definition: FeatureFlagDefinition;
  environments: RolloutFeatureFlagEnvironmentView[];
};

export type AdminThemeSettingCard = {
  definition: ThemeSettingDefinition;
  environments: RolloutThemeEnvironmentView[];
};

export type RolloutControlWorkspaceGuard =
  | {
      state: "restricted";
      title: string;
      message: string;
    }
  | {
      state: "sign_in_required";
      title: string;
      message: string;
    }
  | {
      state: "ready";
      title: string;
      message: string;
      stepUpFreshForProduction: boolean;
      stepUpMessage: string;
      stepUpStatus: "verified" | "needs_refresh";
    };

export type AdminFeatureFlagsWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  persistenceWarning: string | null;
  nextStep: {
    href: string;
    label: string;
  };
  guard: RolloutControlWorkspaceGuard;
  cards: AdminFeatureFlagCard[];
  recentAuditRows: RolloutAuditRowView[];
  resultBanner:
    | {
        tone: "success" | "warning" | "error";
        title: string;
        message: string;
      }
    | null;
};

export type AdminThemeWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  persistenceWarning: string | null;
  nextStep: {
    href: string;
    label: string;
  };
  guard: RolloutControlWorkspaceGuard;
  cards: AdminThemeSettingCard[];
  recentAuditRows: RolloutAuditRowView[];
  resultBanner:
    | {
        tone: "success" | "warning" | "error";
        title: string;
        message: string;
      }
    | null;
};

export async function getAdminFeatureFlagsWorkspace(
  actor: LocalActorContext,
  search?: ResultSearch,
): Promise<AdminFeatureFlagsWorkspace> {
  const access = await getRolloutControlAccess(actor);

  if (access.guard.state !== "ready") {
    return {
      canReadWorkspace: false,
      title: "Feature flags",
      summary:
        "Use this lane to control review, write, event, and integration flags without widening production scope by accident.",
      persistenceWarning: null,
      nextStep: {
        href: "/admin/theme",
        label: "Open theme settings",
      },
      guard: access.guard,
      cards: [],
      recentAuditRows: [],
      resultBanner: getResultBanner(search, "Feature flags"),
    };
  }

  const persistence = await readFeatureFlagPersistence(access.client);

  return {
    canReadWorkspace: true,
    title: "Feature flags",
    summary:
      "Persisted rollout controls keep narrow pilot switches explicit, audited, and hard to widen by accident.",
    persistenceWarning: persistence.warning,
    nextStep: {
      href: "/admin/theme",
      label: "Open theme settings",
    },
    guard: access.guard,
    cards: getFeatureFlagDefinitions().map((definition) => ({
      definition,
      environments: buildFeatureFlagEnvironmentViews(definition, persistence.rows),
    })),
    recentAuditRows: persistence.auditRows.map(mapAuditRow),
    resultBanner: getResultBanner(search, "Feature flags"),
  };
}

export async function getAdminThemeWorkspace(
  actor: LocalActorContext,
  search?: ResultSearch,
): Promise<AdminThemeWorkspace> {
  const access = await getRolloutControlAccess(actor);

  if (access.guard.state !== "ready") {
    return {
      canReadWorkspace: false,
      title: "Theme settings",
      summary:
        "Persisted theme tokens keep the white-blue shell explicit across local, staging, and production review.",
      persistenceWarning: null,
      nextStep: {
        href: "/admin/feature-flags",
        label: "Open feature flags",
      },
      guard: access.guard,
      cards: [],
      recentAuditRows: [],
      resultBanner: getResultBanner(search, "Theme settings"),
    };
  }

  const persistence = await readThemeSettingPersistence(access.client);

  return {
    canReadWorkspace: true,
    title: "Theme settings",
    summary:
      "Theme tokens now live in Supabase-backed controls so design changes can be reviewed, reasoned about, and audited.",
    persistenceWarning: persistence.warning,
    nextStep: {
      href: "/admin/feature-flags",
      label: "Open feature flags",
    },
    guard: access.guard,
    cards: getThemeSettingDefinitions().map((definition) => ({
      definition,
      environments: buildThemeEnvironmentViews(definition, persistence.rows),
    })),
    recentAuditRows: persistence.auditRows.map(mapAuditRow),
    resultBanner: getResultBanner(search, "Theme settings"),
  };
}

export function getFeatureFlagPolicyNote(
  policy: FeatureFlagApprovalPolicy,
): string {
  switch (policy) {
    case "standard":
      return "Local and staging posture only. Production still needs DS/Admin review.";
    case "production_confirmation":
      return "Production changes need reason, PRODUCTION confirmation, and a fresh DS/Admin step-up.";
    case "production_blocked":
      return "Production enablement stays blocked here until a separate explicit approval widens scope.";
  }
}

export function getFeatureFlagDefinitionOrThrow(flagKey: string) {
  const definition = getFeatureFlagDefinition(flagKey);

  if (!definition) {
    throw new Error("Unknown feature flag");
  }

  return definition;
}

export function getThemeSettingDefinitionOrThrow(settingKey: string) {
  const definition = getThemeSettingDefinition(settingKey);

  if (!definition) {
    throw new Error("Unknown theme setting");
  }

  return definition;
}

async function getRolloutControlAccess(actor: LocalActorContext) {
  if (!canReadAdminIntegrationsSecurity(actor)) {
    return {
      guard: {
        state: "restricted" as const,
        title: "Rollout controls are restricted",
        message:
          "Only DS Admin and Super Admin can open feature flags and theme settings.",
      },
      client: null,
    };
  }

  const { client, config } = await createLocalSupabaseServerClient();

  if (!client) {
    const authState = getDisabledAuthSessionState(config);

    return {
      guard: {
        state: "sign_in_required" as const,
        title: "A signed-in DS/Admin session is required",
        message: authState.message,
      },
      client: null,
    };
  }

  const authState = await getAuthSessionState(client, {
    isLocalOnly: config.isLocalOnly,
    sessionLabel: config.isLocalOnly
      ? "local Supabase Auth"
      : "hosted staging Supabase Auth",
  });

  if (authState.status !== "signed_in") {
    return {
      guard: {
        state: "sign_in_required" as const,
        title: "A signed-in DS/Admin session is required",
        message: authState.message,
      },
      client: null,
    };
  }

  const stepUpState = await getDsSecretStepUpState(actor);
  const stepUpFreshForProduction =
    stepUpState.isVerified && !needsFreshProductionStepUp(stepUpState);

  return {
    guard: {
      state: "ready" as const,
      title: getActorSurfaceFamily(actor) === "super_admin"
        ? "Super Admin rollout controls"
        : "DS Admin rollout controls",
      message:
        "Viewing is open. Production changes still need a fresh step-up and explicit confirmation.",
      stepUpFreshForProduction,
      stepUpMessage: stepUpFreshForProduction
        ? "Production controls are unlocked for this session."
        : "Refresh step-up before any production change.",
      stepUpStatus: stepUpFreshForProduction
        ? ("verified" as const)
        : ("needs_refresh" as const),
    },
    client,
  };
}

async function readFeatureFlagRows(
  client: NonNullable<Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"]>,
): Promise<FeatureFlagRow[]> {
  const result = await client
    .schema("app")
    .from("feature_flags")
    .select("*")
    .order("environment", { ascending: true })
    .order("flag_key", { ascending: true });

  if (result.error) {
    throw new Error(`Feature flag read failed: ${result.error.message}`);
  }

  return (result.data ?? []) as FeatureFlagRow[];
}

async function readFeatureFlagPersistence(
  client: NonNullable<Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"]>,
): Promise<{
  rows: FeatureFlagRow[];
  auditRows: AuditLogRow[];
  warning: string | null;
}> {
  try {
    const [rows, auditRows] = await Promise.all([
      readFeatureFlagRows(client),
      readAuditRows(client, "feature_flags"),
    ]);

    return {
      rows,
      auditRows,
      warning: null,
    };
  } catch (error) {
    if (!isMissingRolloutControlSchemaError(error)) {
      throw error;
    }

    return {
      rows: [],
      auditRows: [],
      warning:
        "Supabase rollout-control tables are not readable in this environment yet. Apply the rollout-controls migration before treating feature-flag persistence as available here.",
    };
  }
}

async function readThemeSettingRows(
  client: NonNullable<Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"]>,
): Promise<ThemeSettingRow[]> {
  const result = await client
    .schema("app")
    .from("theme_settings")
    .select("*")
    .order("environment", { ascending: true })
    .order("setting_key", { ascending: true });

  if (result.error) {
    throw new Error(`Theme setting read failed: ${result.error.message}`);
  }

  return (result.data ?? []) as ThemeSettingRow[];
}

async function readThemeSettingPersistence(
  client: NonNullable<Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"]>,
): Promise<{
  rows: ThemeSettingRow[];
  auditRows: AuditLogRow[];
  warning: string | null;
}> {
  try {
    const [rows, auditRows] = await Promise.all([
      readThemeSettingRows(client),
      readAuditRows(client, "theme_settings"),
    ]);

    return {
      rows,
      auditRows,
      warning: null,
    };
  } catch (error) {
    if (!isMissingRolloutControlSchemaError(error)) {
      throw error;
    }

    return {
      rows: [],
      auditRows: [],
      warning:
        "Supabase rollout-control tables are not readable in this environment yet. Apply the rollout-controls migration before treating persisted theme settings as available here.",
    };
  }
}

async function readAuditRows(
  client: NonNullable<Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"]>,
  targetTable: "feature_flags" | "theme_settings",
): Promise<AuditLogRow[]> {
  const result = await client
    .schema("app")
    .from("audit_logs")
    .select("*")
    .eq("target_table", targetTable)
    .order("created_at", { ascending: false })
    .limit(8);

  if (result.error) {
    throw new Error(`Rollout audit read failed: ${result.error.message}`);
  }

  return (result.data ?? []) as AuditLogRow[];
}

function buildFeatureFlagEnvironmentViews(
  definition: FeatureFlagDefinition,
  rows: readonly FeatureFlagRow[],
): RolloutFeatureFlagEnvironmentView[] {
  return getRolloutEnvironments().map((environment) => {
    const row = rows.find((candidate) => {
      return candidate.flag_key === definition.key &&
        candidate.environment === environment;
    });
    const approvalPolicy = row?.approval_policy ?? definition.approvalPolicy;
    const enabled = row?.enabled ?? definition.defaultEnabledByEnvironment[environment];
    const canAttemptEnable = !(
      environment === "production" &&
      approvalPolicy === "production_blocked"
    );

    return {
      environment,
      enabled,
      source: row ? "persisted" : "default",
      approvalPolicy,
      updatedAt: row?.updated_at ?? null,
      updatedBy: row?.updated_by ?? null,
      canAttemptEnable,
      warning:
        environment === "production" && approvalPolicy === "production_blocked"
          ? "Production enablement remains blocked by default."
          : null,
    };
  });
}

function buildThemeEnvironmentViews(
  definition: ThemeSettingDefinition,
  rows: readonly ThemeSettingRow[],
): RolloutThemeEnvironmentView[] {
  return getRolloutEnvironments().map((environment) => {
    const row = rows.find((candidate) => {
      return candidate.setting_key === definition.key &&
        candidate.environment === environment;
    });

    return {
      environment,
      value: row?.value ?? definition.defaultValueByEnvironment[environment],
      source: row ? "persisted" : "default",
      updatedAt: row?.updated_at ?? null,
      updatedBy: row?.updated_by ?? null,
    };
  });
}

function mapAuditRow(row: AuditLogRow): RolloutAuditRowView {
  return {
    id: row.id,
    action: row.action,
    reason: row.reason,
    createdAt: row.created_at,
    targetId: row.target_id,
  };
}

function isMissingRolloutControlSchemaError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    (message.includes("feature_flags") || message.includes("theme_settings")) &&
    (message.includes("does not exist") || message.includes("schema cache"))
  );
}

function getResultBanner(search: ResultSearch | undefined, label: string) {
  if (!search?.result || !search.message) {
    return null;
  }

  const itemLabel = search.item ? `${label}: ${search.item}` : label;

  if (search.result === "success") {
    return {
      tone: "success" as const,
      title: `${itemLabel} updated`,
      message: search.message,
    };
  }

  if (search.result === "warning") {
    return {
      tone: "warning" as const,
      title: `${itemLabel} needs review`,
      message: search.message,
    };
  }

  return {
    tone: "error" as const,
    title: `${itemLabel} blocked`,
    message: search.message,
  };
}
