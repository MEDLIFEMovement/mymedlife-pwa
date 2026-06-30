import {
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import { canManageFeatureFlags } from "@/modules/feature-flags";
import type { FeatureFlagEnvironment } from "@/modules/feature-flags";
import {
  createSupabaseControlClient,
  isSupabaseControlLayerRequested,
} from "@/lib/supabase-control-client";
import {
  listRecentProductionControlApprovals,
  recordProductionControlApproval,
} from "@/services/production-control-approvals";
import { contrastPairs, defaultMedlifeThemeTokens } from "../constants";
import type {
  ThemeAdminState,
  ThemeAuditAction,
  ThemeAuditRecord,
  ThemeChangeInput,
  ThemeContrastResult,
  ThemeSnapshot,
  ThemeTokenKey,
  ThemeTokenValue,
} from "../types";

type ThemeStore = {
  drafts: Map<FeatureFlagEnvironment, ThemeSnapshot>;
  published: Map<FeatureFlagEnvironment, ThemeSnapshot>;
  history: ThemeSnapshot[];
  auditRecords: ThemeAuditRecord[];
};

type PersistedThemeSnapshotRow = {
  id: string;
  environment: FeatureFlagEnvironment;
  status: "draft" | "active" | "archived" | "scheduled";
  tokens: Record<ThemeTokenKey, ThemeTokenValue>;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  rollback_of_id: string | null;
};

type PersistedThemeAuditRow = {
  id: string;
  actor_user_id: string;
  actor_email: string;
  actor_role: "ds_admin" | "super_admin";
  environment: FeatureFlagEnvironment;
  action: ThemeAuditAction;
  theme_id: string;
  reason: string;
  contrast_override: boolean;
  created_at: string;
};

type PersistedIdRow = {
  id: string;
};

type ThemeRpcResult = {
  theme_id: string;
  audit_log_id: string;
};

declare global {
  var __MYMEDLIFE_THEME_STORE__: ThemeStore | undefined;
}

function getStore(): ThemeStore {
  if (!globalThis.__MYMEDLIFE_THEME_STORE__) {
    globalThis.__MYMEDLIFE_THEME_STORE__ = {
      drafts: new Map(),
      published: new Map(),
      history: [],
      auditRecords: [],
    };
  }

  return globalThis.__MYMEDLIFE_THEME_STORE__;
}

export function canManageTheme(actor: Parameters<typeof canManageFeatureFlags>[0]) {
  return canManageFeatureFlags(actor);
}

export function getThemeSnapshot(
  environment: FeatureFlagEnvironment,
  mode: "draft" | "published" = "draft",
): ThemeSnapshot {
  const store = getStore();
  const existing =
    mode === "published"
      ? store.published.get(environment)
      : store.drafts.get(environment) ?? store.published.get(environment);

  return existing ?? createDefaultTheme(environment);
}

export async function getThemeAdminState(input: {
  environment: FeatureFlagEnvironment;
  env?: Record<string, string | undefined>;
}): Promise<ThemeAdminState> {
  const { client, persistence } = await createSupabaseControlClient(input.env);

  if (!client) {
    return {
      snapshot: getThemeSnapshot(input.environment, "draft"),
      auditRecords: listThemeAuditRecords().slice(0, 10),
      productionApprovalRecords: [],
      controlReadback: {
        snapshotRowCount: 0,
        auditRowCount: 0,
        stepUpSessionCount: 0,
        productionApprovalCount: 0,
      },
      persistence,
    };
  }

  const [
    snapshotRows,
    snapshotCountRows,
    auditRows,
    auditCountRows,
    stepUpSessionRows,
    productionApprovalRecords,
  ] = await Promise.all([
    client.selectRows<PersistedThemeSnapshotRow>("theme_snapshots", {
      select:
        "id,environment,status,tokens,created_at,updated_at,published_at,rollback_of_id",
      query: { environment: `eq.${input.environment}` },
      order: { column: "updated_at", ascending: false },
      limit: 1,
    }),
    client.selectRows<PersistedIdRow>("theme_snapshots", {
      select: "id",
      query: { environment: `eq.${input.environment}` },
    }),
    client.selectRows<PersistedThemeAuditRow>("theme_audit_records", {
      select:
        "id,actor_user_id,actor_email,actor_role,environment,action,theme_id,reason,contrast_override,created_at",
      query: { environment: `eq.${input.environment}` },
      order: { column: "created_at", ascending: false },
      limit: 10,
    }),
    client.selectRows<PersistedIdRow>("theme_audit_records", {
      select: "id",
      query: { environment: `eq.${input.environment}` },
    }),
    client.selectRows<PersistedIdRow>("admin_step_up_sessions", {
      select: "id",
    }),
    listRecentProductionControlApprovals({
      scopes: ["theme_publish", "rollback"],
      limit: 10,
      env: input.env,
    }),
  ]);

  return {
    snapshot: snapshotRows[0]
      ? toThemeSnapshot(snapshotRows[0])
      : createDefaultTheme(input.environment),
    auditRecords: auditRows.map(toThemeAuditRecord),
    productionApprovalRecords,
    controlReadback: {
      snapshotRowCount: snapshotCountRows.length,
      auditRowCount: auditCountRows.length,
      stepUpSessionCount: stepUpSessionRows.length,
      productionApprovalCount: productionApprovalRecords.length,
    },
    persistence,
  };
}

export function saveThemeDraft(input: ThemeChangeInput): ThemeSnapshot {
  assertCanManageTheme(input.actor);
  const reason = requireReason(input.reason);
  const current = getThemeSnapshot(input.environment, "draft");
  const currentToken = current.tokens[input.tokenKey];

  if (!currentToken) {
    throw new Error("Choose a valid theme token.");
  }

  const nextToken = updateToken(currentToken, input);
  const next: ThemeSnapshot = {
    ...current,
    id: current.status === "default" ? createThemeId("draft") : current.id,
    status: "draft",
    tokens: {
      ...current.tokens,
      [input.tokenKey]: nextToken,
    },
    updatedAt: new Date().toISOString(),
  };
  const contrast = getThemeContrastResults(next);
  const blocked = contrast.some((item) => item.severity === "block");
  const actorRole = getActorSurfaceFamily(input.actor);

  if (blocked && !(actorRole === "super_admin" && input.overrideContrast)) {
    throw new Error("Theme contrast is unreadable. Super Admin can override with a reason.");
  }

  getStore().drafts.set(input.environment, next);
  recordThemeAudit({
    actor: input.actor,
    action: input.overrideContrast ? "theme_contrast_override" : "theme_draft_saved",
    environment: input.environment,
    themeId: next.id,
    reason,
    contrastOverride: Boolean(input.overrideContrast),
  });

  return next;
}

export async function saveThemeDraftDurable(
  input: ThemeChangeInput,
): Promise<ThemeSnapshot> {
  const { client } = await createSupabaseControlClient();

  if (!client) {
    if (isSupabaseControlLayerRequested()) {
      throw new Error(
        "Supabase-backed theme control is required, but no active Supabase control session is available.",
      );
    }

    return saveThemeDraft(input);
  }

  assertCanManageTheme(input.actor);
  const current = (await getThemeAdminState({ environment: input.environment })).snapshot;
  const currentToken = current.tokens[input.tokenKey];

  if (!currentToken) {
    throw new Error("Choose a valid theme token.");
  }

  const next: ThemeSnapshot = {
    ...current,
    id: current.status === "default" ? createThemeId("draft") : current.id,
    status: "draft",
    tokens: {
      ...current.tokens,
      [input.tokenKey]: updateToken(currentToken, input),
    },
    updatedAt: new Date().toISOString(),
  };
  await saveThemeSnapshotToSupabase(client, {
    environment: input.environment,
    status: "draft",
    tokens: next.tokens,
    reason: input.reason,
    contrastOverride: Boolean(input.overrideContrast),
    approvalReference: input.approvalReference ?? null,
    stepUpSessionId: input.stepUpSessionId ?? null,
    rollbackOfId: null,
  });

  return next;
}

export function publishThemeDraft(input: {
  actor: ThemeChangeInput["actor"];
  environment: FeatureFlagEnvironment;
  reason: string;
  overrideContrast?: boolean;
}): ThemeSnapshot {
  assertCanManageTheme(input.actor);
  const reason = requireReason(input.reason);
  const draft = getThemeSnapshot(input.environment, "draft");
  const contrast = getThemeContrastResults(draft);
  const blocked = contrast.some((item) => item.severity === "block");
  const actorRole = getActorSurfaceFamily(input.actor);

  if (blocked && !(actorRole === "super_admin" && input.overrideContrast)) {
    throw new Error("Theme cannot publish because contrast checks are blocked.");
  }

  const published: ThemeSnapshot = {
    ...draft,
    id: createThemeId("published"),
    status: "published",
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    rollbackOfId: null,
  };
  const store = getStore();
  store.published.set(input.environment, published);
  store.drafts.set(input.environment, published);
  store.history.unshift(published);
  recordThemeAudit({
    actor: input.actor,
    action: input.overrideContrast ? "theme_contrast_override" : "theme_published",
    environment: input.environment,
    themeId: published.id,
    reason,
    contrastOverride: Boolean(input.overrideContrast),
  });

  return published;
}

export async function publishThemeDraftDurable(input: {
  actor: ThemeChangeInput["actor"];
  environment: FeatureFlagEnvironment;
  reason: string;
  overrideContrast?: boolean;
  approvalReference?: string | null;
  stepUpSessionId?: string | null;
}): Promise<ThemeSnapshot> {
  const { client } = await createSupabaseControlClient();

  if (!client) {
    if (isSupabaseControlLayerRequested()) {
      throw new Error(
        "Supabase-backed theme control is required, but no active Supabase control session is available.",
      );
    }

    if (input.environment === "production") {
      throw new Error(
        "Production theme changes require Supabase-backed control storage.",
      );
    }

    return publishThemeDraft(input);
  }

  assertCanManageTheme(input.actor);
  const draft = (await getThemeAdminState({ environment: input.environment })).snapshot;
  const contrast = getThemeContrastResults(draft);
  const blocked = contrast.some((item) => item.severity === "block");
  const actorRole = getActorSurfaceFamily(input.actor);

  if (blocked && !(actorRole === "super_admin" && input.overrideContrast)) {
    throw new Error("Theme cannot publish because contrast checks are blocked.");
  }

  if (input.environment === "production") {
    await recordProductionControlApproval({
      client,
      scope: "theme_publish",
      targetKey: `theme:${input.environment}`,
      approvalReference: input.approvalReference ?? "",
      reason: input.reason,
    });
  }

  const result = await saveThemeSnapshotToSupabase(client, {
    environment: input.environment,
    status: "active",
    tokens: draft.tokens,
    reason: input.reason,
    contrastOverride: Boolean(input.overrideContrast),
    approvalReference: input.approvalReference ?? null,
    stepUpSessionId: input.stepUpSessionId ?? null,
    rollbackOfId: null,
  });

  return {
    ...draft,
    id: result.theme_id,
    status: "published",
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    rollbackOfId: null,
  };
}

export function rollbackTheme(input: {
  actor: ThemeChangeInput["actor"];
  environment: FeatureFlagEnvironment;
  reason: string;
}): ThemeSnapshot {
  assertCanManageTheme(input.actor);
  const reason = requireReason(input.reason);
  const current = getThemeSnapshot(input.environment, "published");
  const previous =
    getStore().history.find(
      (item) => item.environment === input.environment && item.id !== current.id,
    ) ?? createDefaultTheme(input.environment);
  const rolledBack: ThemeSnapshot = {
    ...previous,
    id: createThemeId("rollback"),
    status: "rolled_back",
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    rollbackOfId: current.id,
  };

  getStore().published.set(input.environment, rolledBack);
  getStore().drafts.set(input.environment, rolledBack);
  getStore().history.unshift(rolledBack);
  recordThemeAudit({
    actor: input.actor,
    action: "theme_rolled_back",
    environment: input.environment,
    themeId: rolledBack.id,
    reason,
    contrastOverride: false,
  });

  return rolledBack;
}

export async function rollbackThemeDurable(input: {
  actor: ThemeChangeInput["actor"];
  environment: FeatureFlagEnvironment;
  reason: string;
  approvalReference?: string | null;
  stepUpSessionId?: string | null;
}): Promise<ThemeSnapshot> {
  const { client } = await createSupabaseControlClient();

  if (!client) {
    if (isSupabaseControlLayerRequested()) {
      throw new Error(
        "Supabase-backed theme control is required, but no active Supabase control session is available.",
      );
    }

    if (input.environment === "production") {
      throw new Error(
        "Production theme changes require Supabase-backed control storage.",
      );
    }

    return rollbackTheme(input);
  }

  assertCanManageTheme(input.actor);
  const current = (await getThemeAdminState({ environment: input.environment })).snapshot;
  const previousRows = await client.selectRows<PersistedThemeSnapshotRow>("theme_snapshots", {
    select:
      "id,environment,status,tokens,created_at,updated_at,published_at,rollback_of_id",
    query: {
      environment: `eq.${input.environment}`,
      status: "eq.archived",
    },
    order: { column: "updated_at", ascending: false },
    limit: 1,
  });
  const previous = previousRows[0]
    ? toThemeSnapshot(previousRows[0])
    : createDefaultTheme(input.environment);

  if (input.environment === "production") {
    await recordProductionControlApproval({
      client,
      scope: "rollback",
      targetKey: `theme:${input.environment}`,
      approvalReference: input.approvalReference ?? "",
      reason: input.reason,
    });
  }

  const result = await saveThemeSnapshotToSupabase(client, {
    environment: input.environment,
    status: "active",
    tokens: previous.tokens,
    reason: input.reason,
    contrastOverride: false,
    approvalReference: input.approvalReference ?? null,
    stepUpSessionId: input.stepUpSessionId ?? null,
    rollbackOfId: current.id,
  });

  return {
    ...previous,
    id: result.theme_id,
    status: "rolled_back",
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    rollbackOfId: current.id,
  };
}

export function restoreDefaultTheme(input: {
  actor: ThemeChangeInput["actor"];
  environment: FeatureFlagEnvironment;
  reason: string;
}): ThemeSnapshot {
  assertCanManageTheme(input.actor);
  const reason = requireReason(input.reason);
  const restored = {
    ...createDefaultTheme(input.environment),
    id: createThemeId("default"),
    status: "published" as const,
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };

  getStore().published.set(input.environment, restored);
  getStore().drafts.set(input.environment, restored);
  getStore().history.unshift(restored);
  recordThemeAudit({
    actor: input.actor,
    action: "theme_default_restored",
    environment: input.environment,
    themeId: restored.id,
    reason,
    contrastOverride: false,
  });

  return restored;
}

export async function restoreDefaultThemeDurable(input: {
  actor: ThemeChangeInput["actor"];
  environment: FeatureFlagEnvironment;
  reason: string;
  approvalReference?: string | null;
  stepUpSessionId?: string | null;
}): Promise<ThemeSnapshot> {
  const { client } = await createSupabaseControlClient();

  if (!client) {
    if (isSupabaseControlLayerRequested()) {
      throw new Error(
        "Supabase-backed theme control is required, but no active Supabase control session is available.",
      );
    }

    if (input.environment === "production") {
      throw new Error(
        "Production theme changes require Supabase-backed control storage.",
      );
    }

    return restoreDefaultTheme(input);
  }

  assertCanManageTheme(input.actor);
  const restored = createDefaultTheme(input.environment);

  if (input.environment === "production") {
    await recordProductionControlApproval({
      client,
      scope: "rollback",
      targetKey: `theme:${input.environment}:default`,
      approvalReference: input.approvalReference ?? "",
      reason: input.reason,
    });
  }

  const result = await saveThemeSnapshotToSupabase(client, {
    environment: input.environment,
    status: "active",
    tokens: restored.tokens,
    reason: input.reason,
    contrastOverride: false,
    approvalReference: input.approvalReference ?? null,
    stepUpSessionId: input.stepUpSessionId ?? null,
    rollbackOfId: null,
  });

  return {
    ...restored,
    id: result.theme_id,
    status: "published",
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };
}

export function getThemeContrastResults(
  snapshot: ThemeSnapshot,
): ThemeContrastResult[] {
  return contrastPairs.map(([foreground, background, label]) => {
    const ratio = getContrastRatio(
      snapshot.tokens[foreground].hex,
      snapshot.tokens[background].hex,
    );
    const passesAA = ratio >= 4.5;

    return {
      pair: label,
      foreground,
      background,
      ratio,
      passesAA,
      severity: passesAA ? "pass" : ratio >= 3 ? "warn" : "block",
    };
  });
}

export function getThemeCssVariables(snapshot: ThemeSnapshot): string {
  const declarations = Object.values(snapshot.tokens)
    .map((token) => `${token.cssVariable}: ${token.hex};`)
    .join("\n");

  return `:root {\n${declarations}\n}`;
}

export function getPublishedThemeCssVariables(
  environment: FeatureFlagEnvironment = "preview",
): string {
  return getThemeCssVariables(getThemeSnapshot(environment, "published"));
}

export async function getPublishedThemeCssVariablesDurable(
  environment: FeatureFlagEnvironment = "preview",
  env: Record<string, string | undefined> = process.env,
): Promise<string> {
  const { client } = await createSupabaseControlClient(env);

  if (!client) {
    return getPublishedThemeCssVariables(environment);
  }

  try {
    const rows = await client.selectRows<PersistedThemeSnapshotRow>("theme_snapshots", {
      select:
        "id,environment,status,tokens,created_at,updated_at,published_at,rollback_of_id",
      query: {
        environment: `eq.${environment}`,
        status: "eq.active",
      },
      order: { column: "updated_at", ascending: false },
      limit: 1,
    });
    const row = rows[0];

    if (!row) {
      return getPublishedThemeCssVariables(environment);
    }

    return getThemeCssVariables(toThemeSnapshot(row));
  } catch {
    return getPublishedThemeCssVariables(environment);
  }
}

export function listThemeAuditRecords(): ThemeAuditRecord[] {
  return [...getStore().auditRecords];
}

export function resetThemeStoreForTests() {
  globalThis.__MYMEDLIFE_THEME_STORE__ = undefined;
}

function createDefaultTheme(environment: FeatureFlagEnvironment): ThemeSnapshot {
  const now = new Date().toISOString();

  return {
    id: `theme-default-${environment}`,
    environment,
    status: "default",
    tokens: cloneTokens(defaultMedlifeThemeTokens),
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    rollbackOfId: null,
  };
}

function cloneTokens(
  tokens: Record<ThemeTokenKey, ThemeTokenValue>,
): Record<ThemeTokenKey, ThemeTokenValue> {
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [key, { ...value }]),
  ) as Record<ThemeTokenKey, ThemeTokenValue>;
}

function updateToken(
  token: ThemeTokenValue,
  input: ThemeChangeInput,
): ThemeTokenValue {
  const hex = normalizeHex(input.hex);

  return {
    ...token,
    hex,
    pantoneLabel: normalizeOptional(input.pantoneLabel),
    pantoneCode: normalizeOptional(input.pantoneCode),
  };
}

function assertCanManageTheme(actor: ThemeChangeInput["actor"]) {
  if (!canManageTheme(actor)) {
    throw new Error("Only DS Admin or Super Admin can manage theme tokens.");
  }
}

function requireReason(reason: string): string {
  const normalized = reason.trim();

  if (normalized.length < 8) {
    throw new Error("Theme changes require a clear reason.");
  }

  return normalized;
}

function recordThemeAudit(input: {
  actor: ThemeChangeInput["actor"];
  action: ThemeAuditAction;
  environment: FeatureFlagEnvironment;
  themeId: string;
  reason: string;
  contrastOverride: boolean;
}) {
  const actorRole =
    getActorSurfaceFamily(input.actor) === "super_admin" ? "super_admin" : "ds_admin";
  getStore().auditRecords.unshift({
    id: `theme-audit-${Date.now()}-${getStore().auditRecords.length + 1}`,
    actorUserId: input.actor.user.id,
    actorEmail: input.actor.user.email,
    actorRole,
    environment: input.environment,
    action: input.action,
    themeId: input.themeId,
    reason: input.reason,
    createdAt: new Date().toISOString(),
    contrastOverride: input.contrastOverride,
  });
}

function normalizeHex(value: string): string {
  const normalized = value.trim();

  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error("Use a six-digit hex value like #2563eb.");
  }

  return normalized.toLowerCase();
}

function normalizeOptional(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function getContrastRatio(leftHex: string, rightHex: string): number {
  const left = getRelativeLuminance(leftHex);
  const right = getRelativeLuminance(rightHex);
  const lighter = Math.max(left, right);
  const darker = Math.min(left, right);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function getRelativeLuminance(hex: string): number {
  const rgb = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * (rgb[0] ?? 0) + 0.7152 * (rgb[1] ?? 0) + 0.0722 * (rgb[2] ?? 0);
}

function createThemeId(prefix: string): string {
  const store = getStore();
  return `${prefix}-${Date.now()}-${store.history.length + store.auditRecords.length + 1}`;
}

async function saveThemeSnapshotToSupabase(
  client: Awaited<ReturnType<typeof createSupabaseControlClient>>["client"],
  input: {
    environment: FeatureFlagEnvironment;
    status: "draft" | "active";
    tokens: Record<ThemeTokenKey, ThemeTokenValue>;
    reason: string;
    contrastOverride: boolean;
    approvalReference: string | null;
    stepUpSessionId: string | null;
    rollbackOfId: string | null;
  },
): Promise<ThemeRpcResult> {
  if (!client) {
    throw new Error("Supabase control client is not available.");
  }

  const result = await client.rpc<ThemeRpcResult[]>("save_theme_control_snapshot", {
    theme_environment: input.environment,
    theme_status: input.status,
    tokens: input.tokens,
    reason: input.reason,
    contrast_override: input.contrastOverride,
    approval_reference: input.approvalReference,
    step_up_session_uuid: input.stepUpSessionId,
    rollback_of_uuid: input.rollbackOfId,
  });
  const row = result[0];

  if (!row) {
    throw new Error("Theme update did not return an audit result.");
  }

  return row;
}

function toThemeSnapshot(row: PersistedThemeSnapshotRow): ThemeSnapshot {
  return {
    id: row.id,
    environment: row.environment,
    status: toThemeDraftStatus(row.status),
    tokens: row.tokens,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    rollbackOfId: row.rollback_of_id,
  };
}

function toThemeDraftStatus(
  status: PersistedThemeSnapshotRow["status"],
): ThemeSnapshot["status"] {
  switch (status) {
    case "active":
      return "published";
    case "archived":
      return "rolled_back";
    case "scheduled":
    case "draft":
      return "draft";
  }
}

function toThemeAuditRecord(row: PersistedThemeAuditRow): ThemeAuditRecord {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    environment: row.environment,
    action: row.action,
    themeId: row.theme_id,
    reason: row.reason,
    createdAt: row.created_at,
    contrastOverride: row.contrast_override,
  };
}
