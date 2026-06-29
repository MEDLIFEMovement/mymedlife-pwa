import type { FeatureFlagEnvironment } from "@/modules/feature-flags";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ProductionControlApprovalRecord } from "@/services/production-control-approvals";

export type ThemeTokenKey =
  | "background"
  | "pageBackground"
  | "cardBlock"
  | "primaryButton"
  | "secondaryButton"
  | "accent"
  | "font"
  | "mutedFont"
  | "border"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "navBackground"
  | "navText"
  | "badgeBackground"
  | "badgeText"
  | "progressTrack"
  | "progressFill";

export type ThemeTokenValue = {
  key: ThemeTokenKey;
  label: string;
  hex: string;
  cssVariable: string;
  pantoneLabel: string | null;
  pantoneCode: string | null;
};

export type ThemeDraftStatus = "default" | "draft" | "published" | "rolled_back";

export type ThemeSnapshot = {
  id: string;
  environment: FeatureFlagEnvironment;
  status: ThemeDraftStatus;
  tokens: Record<ThemeTokenKey, ThemeTokenValue>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  rollbackOfId: string | null;
};

export type ThemeContrastResult = {
  pair: string;
  foreground: ThemeTokenKey;
  background: ThemeTokenKey;
  ratio: number;
  passesAA: boolean;
  severity: "pass" | "warn" | "block";
};

export type ThemeAuditAction =
  | "theme_draft_saved"
  | "theme_published"
  | "theme_rolled_back"
  | "theme_default_restored"
  | "theme_contrast_override";

export type ThemeAuditRecord = {
  id: string;
  actorUserId: string;
  actorEmail: string;
  actorRole: "ds_admin" | "super_admin";
  environment: FeatureFlagEnvironment;
  action: ThemeAuditAction;
  themeId: string;
  reason: string;
  createdAt: string;
  contrastOverride: boolean;
};

export type ThemeChangeInput = {
  actor: LocalActorContext;
  environment: FeatureFlagEnvironment;
  tokenKey: ThemeTokenKey;
  hex: string;
  pantoneLabel?: string | null;
  pantoneCode?: string | null;
  reason: string;
  overrideContrast?: boolean;
  approvalReference?: string | null;
  stepUpSessionId?: string | null;
};

export type ThemeControlPersistence = {
  mode: "memory" | "supabase";
  status: "fallback" | "ready";
  requested?: boolean;
  availability?: "disabled" | "unavailable" | "missing_session" | "ready";
  reason: string;
};

export type ThemeAdminState = {
  snapshot: ThemeSnapshot;
  auditRecords: ThemeAuditRecord[];
  productionApprovalRecords: ProductionControlApprovalRecord[];
  persistence: ThemeControlPersistence;
};
