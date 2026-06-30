import type { LocalActorContext } from "@/services/local-actor-context";
import type { ProductionControlApprovalRecord } from "@/services/production-control-approvals";

export type FeatureFlagEnvironment =
  | "local"
  | "preview"
  | "staging"
  | "production";

export type FeatureFlagStatus =
  | "enabled"
  | "disabled"
  | "staging_only"
  | "mock_only"
  | "internal_only"
  | "scheduled"
  | "emergency_disabled";

export type ModuleFeatureFlagKey =
  | "events_luma_points"
  | "ugc_feed_proof"
  | "task_assignment"
  | "sop_workflows_next_action"
  | "staff_analytics_reporting"
  | "integrations_outbox"
  | "mcp_read_only_analytics"
  | "ds_admin_controls"
  | "theme_design_system";

export type ProviderFeatureFlagKey =
  | "integration_luma"
  | "integration_hubspot"
  | "integration_shopify"
  | "integration_givelively"
  | "integration_bigquery"
  | "integration_powerbi"
  | "integration_n8n"
  | "integration_openai";

export type FeatureFlagKey = ModuleFeatureFlagKey | ProviderFeatureFlagKey;

export type FeatureFlagKind = "module" | "provider";

export type FeatureFlagDefinition = {
  key: FeatureFlagKey;
  kind: FeatureFlagKind;
  label: string;
  description: string;
  owner: "DS" | "Product" | "HQ" | "Engineering";
  defaultStatusByEnvironment: Record<FeatureFlagEnvironment, FeatureFlagStatus>;
  dependencies: FeatureFlagKey[];
  gracefulFallback: string;
  externalApiBoundary: boolean;
};

export type FeatureFlagResolvedState = {
  key: FeatureFlagKey;
  kind: FeatureFlagKind;
  label: string;
  status: FeatureFlagStatus;
  environment: FeatureFlagEnvironment;
  enabled: boolean;
  reason: string;
  gracefulFallback: string;
  externalApiBoundary: boolean;
};

export type ModuleFeatureAvailability = {
  key: ModuleFeatureFlagKey;
  label: string;
  status: FeatureFlagStatus;
  environment: FeatureFlagEnvironment;
  enabled: boolean;
  summary: string;
  gracefulFallback: string;
  blockedControls: string[];
};

export type FeatureFlagAuditRecord = {
  id: string;
  actorUserId: string;
  actorEmail: string;
  actorRole: "ds_admin" | "super_admin";
  environment: FeatureFlagEnvironment;
  key: FeatureFlagKey;
  oldStatus: FeatureFlagStatus;
  newStatus: FeatureFlagStatus;
  reason: string;
  createdAt: string;
};

export type FeatureFlagChangeInput = {
  actor: LocalActorContext;
  environment: FeatureFlagEnvironment;
  key: FeatureFlagKey;
  nextStatus: FeatureFlagStatus;
  reason: string;
  approvalReference?: string | null;
  stepUpSessionId?: string | null;
};

export type FeatureFlagControlPersistence = {
  mode: "memory" | "supabase";
  status: "fallback" | "ready";
  requested?: boolean;
  availability?: "disabled" | "unavailable" | "missing_session" | "ready";
  reason: string;
};

export type FeatureFlagAdminState = {
  flags: FeatureFlagResolvedState[];
  auditRecords: FeatureFlagAuditRecord[];
  productionApprovalRecords: ProductionControlApprovalRecord[];
  controlReadback: {
    overrideRowCount: number;
    auditRowCount: number;
    stepUpSessionCount: number;
    productionApprovalCount: number;
  };
  persistence: FeatureFlagControlPersistence;
};
