import {
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import { canManageFeatureFlags } from "@/modules/feature-flags";
import type { FeatureFlagEnvironment } from "@/modules/feature-flags";
import { contrastPairs, defaultMedlifeThemeTokens } from "../constants";
import type {
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
