export type RolloutEnvironment = "local" | "staging" | "production";

export type FeatureFlagKey =
  | "staging_review_auth"
  | "action_started_write"
  | "proof_metadata_write"
  | "leader_review_write"
  | "membership_approval_write"
  | "luma_event_create"
  | "luma_event_update"
  | "luma_rsvp_writeback"
  | "luma_attendance_import"
  | "hubspot_write"
  | "n8n_send"
  | "warehouse_export"
  | "ai_actions";

export type FeatureFlagCategory =
  | "review"
  | "writes"
  | "events"
  | "integrations";

export type FeatureFlagApprovalPolicy =
  | "standard"
  | "production_confirmation"
  | "production_blocked";

export type ThemeSettingKey =
  | "background"
  | "foreground"
  | "panel"
  | "panel_strong"
  | "line"
  | "accent"
  | "accent_strong";

export type ThemeSettingInputType = "color" | "text";

export type FeatureFlagDefinition = {
  key: FeatureFlagKey;
  label: string;
  description: string;
  category: FeatureFlagCategory;
  controlsExternalWrite: boolean;
  approvalPolicy: FeatureFlagApprovalPolicy;
  defaultEnabledByEnvironment: Record<RolloutEnvironment, boolean>;
};

export type ThemeSettingDefinition = {
  key: ThemeSettingKey;
  label: string;
  description: string;
  inputType: ThemeSettingInputType;
  group: "core";
  defaultValueByEnvironment: Record<RolloutEnvironment, string>;
};

export type FeatureFlagMutationResultCode =
  | "success"
  | "missing_auth"
  | "role_blocked"
  | "step_up_required"
  | "step_up_expired"
  | "flag_not_found"
  | "reason_required"
  | "production_confirmation_required"
  | "production_flag_blocked"
  | "write_disabled"
  | "server_error";

export type ThemeSettingMutationResultCode =
  | "success"
  | "missing_auth"
  | "role_blocked"
  | "step_up_required"
  | "step_up_expired"
  | "setting_not_found"
  | "value_required"
  | "reason_required"
  | "production_confirmation_required"
  | "write_disabled"
  | "server_error";

export type FeatureFlagRpcRow = {
  flag_id: string;
  audit_log_id: string;
  flag_key: FeatureFlagKey;
  environment: RolloutEnvironment;
  enabled: boolean;
  approval_policy: FeatureFlagApprovalPolicy;
  updated_at: string;
};

export type ThemeSettingRpcRow = {
  setting_id: string;
  audit_log_id: string;
  setting_key: ThemeSettingKey;
  environment: RolloutEnvironment;
  value: string;
  updated_at: string;
};
