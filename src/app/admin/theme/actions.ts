"use server";

import { redirect } from "next/navigation";
import {
  featureFlagEnvironments,
  type FeatureFlagEnvironment,
} from "@/modules/feature-flags";
import {
  canManageTheme,
  publishThemeDraftDurable,
  restoreDefaultThemeDurable,
  rollbackThemeDurable,
  saveThemeDraftDurable,
  type ThemeTokenKey,
} from "@/modules/theme";
import {
  getDsSecretStepUpState,
  needsFreshProductionStepUp,
} from "@/services/admin-integrations-step-up";
import { getLocalActorContext } from "@/services/local-actor-context";

export async function saveThemeDraftAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const environment = parseEnvironment(formData.get("environment"));
  const returnTo = normalizeReturnTo(formData.get("returnTo"), environment);
  let result: "success" | "error" = "success";
  let message = "Theme draft saved and audited.";

  try {
    assertCanManageTheme(actor);

    await saveThemeDraftDurable({
      actor,
      environment,
      tokenKey: String(formData.get("tokenKey") ?? "") as ThemeTokenKey,
      hex: getSubmittedHex(formData),
      pantoneLabel: normalizeString(formData.get("pantoneLabel")),
      pantoneCode: normalizeString(formData.get("pantoneCode")),
      reason: String(formData.get("reason") ?? ""),
      overrideContrast: formData.get("overrideContrast") === "on",
    });
  } catch (error) {
    result = "error";
    message = errorMessage(error);
  }

  redirectWithResult(returnTo, result, message);
}

export async function publishThemeAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const environment = parseEnvironment(formData.get("environment"));
  const returnTo = normalizeReturnTo(formData.get("returnTo"), environment);
  let result: "success" | "error" = "success";
  let message = "Theme published and audited.";

  try {
    assertCanManageTheme(actor);

    const approval = await getProductionThemeApproval(formData, actor, environment);

    await publishThemeDraftDurable({
      actor,
      environment,
      reason: String(formData.get("reason") ?? ""),
      overrideContrast: formData.get("overrideContrast") === "on",
      approvalReference: approval.approvalReference,
      stepUpSessionId: approval.stepUpSessionId,
    });
  } catch (error) {
    result = "error";
    message = errorMessage(error);
  }

  redirectWithResult(returnTo, result, message);
}

export async function rollbackThemeAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const environment = parseEnvironment(formData.get("environment"));
  const returnTo = normalizeReturnTo(formData.get("returnTo"), environment);
  let result: "success" | "error" = "success";
  let message = "Theme rolled back and audited.";

  try {
    assertCanManageTheme(actor);

    const approval = await getProductionThemeApproval(formData, actor, environment);

    await rollbackThemeDurable({
      actor,
      environment,
      reason: String(formData.get("reason") ?? ""),
      approvalReference: approval.approvalReference,
      stepUpSessionId: approval.stepUpSessionId,
    });
  } catch (error) {
    result = "error";
    message = errorMessage(error);
  }

  redirectWithResult(returnTo, result, message);
}

export async function restoreDefaultThemeAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const environment = parseEnvironment(formData.get("environment"));
  const returnTo = normalizeReturnTo(formData.get("returnTo"), environment);
  let result: "success" | "error" = "success";
  let message = "Default MEDLIFE theme restored and audited.";

  try {
    assertCanManageTheme(actor);

    const approval = await getProductionThemeApproval(formData, actor, environment);

    await restoreDefaultThemeDurable({
      actor,
      environment,
      reason: String(formData.get("reason") ?? ""),
      approvalReference: approval.approvalReference,
      stepUpSessionId: approval.stepUpSessionId,
    });
  } catch (error) {
    result = "error";
    message = errorMessage(error);
  }

  redirectWithResult(returnTo, result, message);
}

function parseEnvironment(value: FormDataEntryValue | null): FeatureFlagEnvironment {
  const stringValue = String(value ?? "");

  if (!featureFlagEnvironments.includes(stringValue as FeatureFlagEnvironment)) {
    throw new Error("Choose a valid environment.");
  }

  return stringValue as FeatureFlagEnvironment;
}

function normalizeReturnTo(
  value: FormDataEntryValue | null,
  environment: FeatureFlagEnvironment,
): string {
  const raw =
    typeof value === "string" ? value : `/admin/theme?env=${environment}`;

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return `/admin/theme?env=${environment}`;
  }

  return raw;
}

function normalizeString(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function getSubmittedHex(formData: FormData): string {
  const hex = normalizeString(formData.get("hex"));
  const pickerHex = normalizeString(formData.get("hexPicker"));

  return hex ?? pickerHex ?? "";
}

async function getProductionThemeApproval(
  formData: FormData,
  actor: Awaited<ReturnType<typeof getLocalActorContext>>,
  environment: FeatureFlagEnvironment,
): Promise<{
  approvalReference: string | null;
  stepUpSessionId: string | null;
}> {
  if (environment !== "production") {
    return {
      approvalReference: normalizeString(formData.get("approvalReference")),
      stepUpSessionId: null,
    };
  }

  const approvalReference = normalizeString(formData.get("approvalReference"));

  if (formData.get("confirmProduction") !== "on") {
    throw new Error("Production theme changes require explicit confirmation.");
  }

  if (!approvalReference) {
    throw new Error("Production theme changes require an approval reference.");
  }

  const stepUpState = await getDsSecretStepUpState(actor);

  if (needsFreshProductionStepUp(stepUpState)) {
    throw new Error("Production theme changes require a fresh DS/Admin step-up session.");
  }

  return {
    approvalReference,
    stepUpSessionId: stepUpState.sessionId,
  };
}

function redirectWithResult(
  returnTo: string,
  result: "success" | "error",
  message: string,
): never {
  const url = new URL(returnTo, "https://staging.mymedlife.org");
  url.searchParams.set("themeResult", result);
  url.searchParams.set("themeMessage", message.slice(0, 220));
  redirect(`${url.pathname}${url.search}`);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Theme update failed.";
}

function assertCanManageTheme(
  actor: Awaited<ReturnType<typeof getLocalActorContext>>,
) {
  if (!canManageTheme(actor)) {
    throw new Error(
      "Only DS Admin or Super Admin can manage theme tokens.",
    );
  }
}
