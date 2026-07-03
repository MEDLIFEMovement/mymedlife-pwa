import type {
  FeatureFlagMutationResultCode,
  FeatureFlagRpcRow,
  RolloutEnvironment,
  ThemeSettingMutationResultCode,
  ThemeSettingRpcRow,
} from "@/shared/types/admin-rollout-controls";

export type FeatureFlagServerResult =
  | {
      success: true;
      code: "success";
      item: string;
      environment: RolloutEnvironment;
      plainEnglishMessage: string;
      auditLogId: string;
    }
  | {
      success: false;
      code: Exclude<FeatureFlagMutationResultCode, "success">;
      item: string;
      environment: RolloutEnvironment;
      plainEnglishMessage: string;
    };

export type ThemeSettingServerResult =
  | {
      success: true;
      code: "success";
      item: string;
      environment: RolloutEnvironment;
      plainEnglishMessage: string;
      auditLogId: string;
    }
  | {
      success: false;
      code: Exclude<ThemeSettingMutationResultCode, "success">;
      item: string;
      environment: RolloutEnvironment;
      plainEnglishMessage: string;
    };

export function normalizeRolloutReturnTo(
  value: FormDataEntryValue | null,
  fallback = "/admin/feature-flags",
): string {
  const normalized = String(value ?? "").trim();

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallback;
  }

  return normalized;
}

export function parseRolloutEnvironment(
  value: FormDataEntryValue | null,
): RolloutEnvironment | null {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (
    normalized === "local" ||
    normalized === "staging" ||
    normalized === "production"
  ) {
    return normalized;
  }

  return null;
}

export function mapFeatureFlagRpcSuccess(row: FeatureFlagRpcRow): FeatureFlagServerResult {
  return {
    success: true,
    code: "success",
    item: row.flag_key,
    environment: row.environment,
    auditLogId: row.audit_log_id,
    plainEnglishMessage:
      "Feature flag saved in Supabase and recorded in the audit log. No external send was triggered here.",
  };
}

export function mapFeatureFlagRpcError(input: {
  message: string;
}): FeatureFlagServerResult {
  const message = input.message.toLowerCase();
  const environment = inferEnvironmentFromMessage(message);
  const item = inferItemFromMessage(message);

  if (message.includes("actor cannot manage rollout controls")) {
    return blockedFeatureFlag(item, environment, "role_blocked", input.message);
  }

  if (message.includes("approval reason is required")) {
    return blockedFeatureFlag(item, environment, "reason_required", input.message);
  }

  if (message.includes("type production to confirm")) {
    return blockedFeatureFlag(
      item,
      environment,
      "production_confirmation_required",
      input.message,
    );
  }

  if (message.includes("production enablement remains blocked")) {
    return blockedFeatureFlag(
      item,
      environment,
      "production_flag_blocked",
      input.message,
    );
  }

  return blockedFeatureFlag(item, environment, "server_error", input.message);
}

export function mapThemeSettingRpcSuccess(row: ThemeSettingRpcRow): ThemeSettingServerResult {
  return {
    success: true,
    code: "success",
    item: row.setting_key,
    environment: row.environment,
    auditLogId: row.audit_log_id,
    plainEnglishMessage:
      "Theme setting saved in Supabase and recorded in the audit log.",
  };
}

export function mapThemeSettingRpcError(input: {
  message: string;
}): ThemeSettingServerResult {
  const message = input.message.toLowerCase();
  const environment = inferEnvironmentFromMessage(message);
  const item = inferItemFromMessage(message);

  if (message.includes("actor cannot manage rollout controls")) {
    return blockedTheme(item, environment, "role_blocked", input.message);
  }

  if (message.includes("theme value is required")) {
    return blockedTheme(item, environment, "value_required", input.message);
  }

  if (message.includes("approval reason is required")) {
    return blockedTheme(item, environment, "reason_required", input.message);
  }

  if (message.includes("type production to confirm")) {
    return blockedTheme(
      item,
      environment,
      "production_confirmation_required",
      input.message,
    );
  }

  return blockedTheme(item, environment, "server_error", input.message);
}

function blockedFeatureFlag(
  item: string,
  environment: RolloutEnvironment,
  code: Exclude<FeatureFlagMutationResultCode, "success">,
  plainEnglishMessage: string,
): FeatureFlagServerResult {
  return {
    success: false,
    code,
    item,
    environment,
    plainEnglishMessage,
  };
}

function blockedTheme(
  item: string,
  environment: RolloutEnvironment,
  code: Exclude<ThemeSettingMutationResultCode, "success">,
  plainEnglishMessage: string,
): ThemeSettingServerResult {
  return {
    success: false,
    code,
    item,
    environment,
    plainEnglishMessage,
  };
}

function inferEnvironmentFromMessage(message: string): RolloutEnvironment {
  if (message.includes("production")) {
    return "production";
  }

  if (message.includes("staging")) {
    return "staging";
  }

  return "local";
}

function inferItemFromMessage(message: string): string {
  if (message.includes("flag")) {
    return "feature-flag";
  }

  if (message.includes("theme")) {
    return "theme-setting";
  }

  return "rollout-control";
}
