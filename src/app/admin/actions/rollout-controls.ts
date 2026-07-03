"use server";

import { redirect } from "next/navigation";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import {
  clearDsSecretStepUpSession,
  getDsSecretStepUpState,
  needsFreshProductionStepUp,
  verifyDsSecretStepUpWithPassword,
} from "@/services/admin-integrations-step-up";
import {
  getFeatureFlagDefinition,
  getThemeSettingDefinition,
} from "@/services/admin-rollout-controls-registry";
import {
  mapFeatureFlagRpcError,
  mapFeatureFlagRpcSuccess,
  mapThemeSettingRpcError,
  mapThemeSettingRpcSuccess,
  normalizeRolloutReturnTo,
  parseRolloutEnvironment,
  type FeatureFlagServerResult,
  type ThemeSettingServerResult,
} from "@/services/admin-rollout-controls-write";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";

export async function verifyRolloutControlStepUpAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeRolloutReturnTo(
    formData.get("returnTo"),
    "/admin/feature-flags",
  );
  const password = String(formData.get("password") ?? "");
  const result = await verifyDsSecretStepUpWithPassword({
    actor,
    password,
  });
  const search = new URLSearchParams({
    result: result.ok ? "success" : "error",
    message: result.message,
    item: "production-step-up",
  });

  redirect(`${returnTo}?${search.toString()}`);
}

export async function clearRolloutControlStepUpAction(formData: FormData) {
  const returnTo = normalizeRolloutReturnTo(
    formData.get("returnTo"),
    "/admin/feature-flags",
  );
  await clearDsSecretStepUpSession();
  redirect(returnTo);
}

export async function updateFeatureFlagAction(formData: FormData) {
  const result = await updateFeatureFlag(formData);
  redirectWithResult(
    normalizeRolloutReturnTo(formData.get("returnTo"), "/admin/feature-flags"),
    result,
  );
}

export async function updateThemeSettingAction(formData: FormData) {
  const result = await updateThemeSetting(formData);
  redirectWithResult(
    normalizeRolloutReturnTo(formData.get("returnTo"), "/admin/theme"),
    result,
  );
}

export async function updateFeatureFlag(
  formData: FormData,
): Promise<FeatureFlagServerResult> {
  const actor = await getLocalActorContext();
  const flagKey = String(formData.get("flagKey") ?? "").trim();
  const definition = getFeatureFlagDefinition(flagKey);
  const environment = parseRolloutEnvironment(formData.get("environment")) ?? "local";
  const enabled = String(formData.get("enabled") ?? "false") === "true";
  const reason = String(formData.get("reason") ?? "").trim();
  const confirmation = String(formData.get("productionConfirmation") ?? "").trim();

  if (!definition) {
    return {
      success: false,
      code: "flag_not_found",
      item: flagKey || "feature-flag",
      environment,
      plainEnglishMessage: "That feature flag is not part of the rollout catalog.",
    };
  }

  if (!canReadAdminIntegrationsSecurity(actor)) {
    return {
      success: false,
      code: "role_blocked",
      item: definition.key,
      environment,
      plainEnglishMessage:
        "Only DS Admin and Super Admin can change rollout controls.",
    };
  }

  if (reason.length < 8) {
    return {
      success: false,
      code: "reason_required",
      item: definition.key,
      environment,
      plainEnglishMessage:
        "Add a short reason so the audit log explains this change.",
    };
  }

  if (environment === "production") {
    const stepUpState = await getDsSecretStepUpState(actor);

    if (!stepUpState.isVerified) {
      return {
        success: false,
        code: "step_up_required",
        item: definition.key,
        environment,
        plainEnglishMessage:
          "Refresh DS/Admin step-up before changing production rollout flags.",
      };
    }

    if (needsFreshProductionStepUp(stepUpState)) {
      return {
        success: false,
        code: "step_up_expired",
        item: definition.key,
        environment,
        plainEnglishMessage:
          "Production rollout changes need a fresh step-up confirmation.",
      };
    }

    if (
      definition.approvalPolicy !== "standard" &&
      confirmation !== "PRODUCTION"
    ) {
      return {
        success: false,
        code: "production_confirmation_required",
        item: definition.key,
        environment,
        plainEnglishMessage:
          "Type PRODUCTION to confirm a production rollout change.",
      };
    }

    if (enabled && definition.approvalPolicy === "production_blocked") {
      return {
        success: false,
        code: "production_flag_blocked",
        item: definition.key,
        environment,
        plainEnglishMessage:
          "This production integration flag stays blocked until a separate explicit approval widens scope.",
      };
    }
  }

  const { client, config } = await createLocalSupabaseServerClient();

  if (!client) {
    return {
      success: false,
      code: "write_disabled",
      item: definition.key,
      environment,
      plainEnglishMessage: config.reason,
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
      success: false,
      code: "missing_auth",
      item: definition.key,
      environment,
      plainEnglishMessage:
        "Sign in with a DS Admin or Super Admin Supabase session before changing rollout flags.",
    };
  }

  const { data, error } = await client
    .schema("app")
    .rpc("set_feature_flag", {
      flag_key_input: definition.key,
      environment_input: environment,
      enabled_input: enabled,
      label_input: definition.label,
      description_input: definition.description,
      reason_input: reason,
      approval_policy_input: definition.approvalPolicy,
      controls_external_write_input: definition.controlsExternalWrite,
      confirmation_input: confirmation.length > 0 ? confirmation : null,
    });

  if (error) {
    return mapFeatureFlagRpcError({
      message: error.message,
    });
  }

  const firstRow = Array.isArray(data) ? data[0] : null;

  if (!firstRow) {
    return {
      success: false,
      code: "server_error",
      item: definition.key,
      environment,
      plainEnglishMessage:
        "Supabase did not return the expected feature-flag row.",
    };
  }

  return mapFeatureFlagRpcSuccess(firstRow);
}

export async function updateThemeSetting(
  formData: FormData,
): Promise<ThemeSettingServerResult> {
  const actor = await getLocalActorContext();
  const settingKey = String(formData.get("settingKey") ?? "").trim();
  const definition = getThemeSettingDefinition(settingKey);
  const environment = parseRolloutEnvironment(formData.get("environment")) ?? "local";
  const value = String(formData.get("value") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const confirmation = String(formData.get("productionConfirmation") ?? "").trim();

  if (!definition) {
    return {
      success: false,
      code: "setting_not_found",
      item: settingKey || "theme-setting",
      environment,
      plainEnglishMessage: "That theme setting is not part of the current theme catalog.",
    };
  }

  if (!canReadAdminIntegrationsSecurity(actor)) {
    return {
      success: false,
      code: "role_blocked",
      item: definition.key,
      environment,
      plainEnglishMessage:
        "Only DS Admin and Super Admin can change persisted theme settings.",
    };
  }

  if (!value) {
    return {
      success: false,
      code: "value_required",
      item: definition.key,
      environment,
      plainEnglishMessage: "Enter a value before saving this theme setting.",
    };
  }

  if (reason.length < 8) {
    return {
      success: false,
      code: "reason_required",
      item: definition.key,
      environment,
      plainEnglishMessage:
        "Add a short reason so the audit log explains this theme change.",
    };
  }

  if (environment === "production") {
    const stepUpState = await getDsSecretStepUpState(actor);

    if (!stepUpState.isVerified) {
      return {
        success: false,
        code: "step_up_required",
        item: definition.key,
        environment,
        plainEnglishMessage:
          "Refresh DS/Admin step-up before changing production theme settings.",
      };
    }

    if (needsFreshProductionStepUp(stepUpState)) {
      return {
        success: false,
        code: "step_up_expired",
        item: definition.key,
        environment,
        plainEnglishMessage:
          "Production theme changes need a fresh step-up confirmation.",
      };
    }

    if (confirmation !== "PRODUCTION") {
      return {
        success: false,
        code: "production_confirmation_required",
        item: definition.key,
        environment,
        plainEnglishMessage:
          "Type PRODUCTION to confirm a production theme change.",
      };
    }
  }

  const { client, config } = await createLocalSupabaseServerClient();

  if (!client) {
    return {
      success: false,
      code: "write_disabled",
      item: definition.key,
      environment,
      plainEnglishMessage: config.reason,
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
      success: false,
      code: "missing_auth",
      item: definition.key,
      environment,
      plainEnglishMessage:
        "Sign in with a DS Admin or Super Admin Supabase session before changing theme settings.",
    };
  }

  const { data, error } = await client
    .schema("app")
    .rpc("set_theme_setting", {
      setting_key_input: definition.key,
      environment_input: environment,
      label_input: definition.label,
      value_input: value,
      value_type_input: definition.inputType,
      group_name_input: definition.group,
      reason_input: reason,
      confirmation_input: confirmation.length > 0 ? confirmation : null,
    });

  if (error) {
    return mapThemeSettingRpcError({
      message: error.message,
    });
  }

  const firstRow = Array.isArray(data) ? data[0] : null;

  if (!firstRow) {
    return {
      success: false,
      code: "server_error",
      item: definition.key,
      environment,
      plainEnglishMessage:
        "Supabase did not return the expected theme-setting row.",
    };
  }

  return mapThemeSettingRpcSuccess(firstRow);
}

function redirectWithResult(
  returnTo: string,
  result: FeatureFlagServerResult | ThemeSettingServerResult,
) {
  const search = new URLSearchParams({
    result: result.success ? "success" : "error",
    message: result.plainEnglishMessage,
    item: result.item,
    environment: result.environment,
  });

  redirect(`${returnTo}?${search.toString()}`);
}
