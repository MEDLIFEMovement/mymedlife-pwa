"use server";

import { redirect } from "next/navigation";
import {
  featureFlagEnvironments,
  type FeatureFlagEnvironment,
} from "@/modules/feature-flags";
import {
  publishThemeDraft,
  restoreDefaultTheme,
  rollbackTheme,
  saveThemeDraft,
  type ThemeTokenKey,
} from "@/modules/theme";
import { getLocalActorContext } from "@/services/local-actor-context";

export async function saveThemeDraftAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const environment = parseEnvironment(formData.get("environment"));
  const returnTo = normalizeReturnTo(formData.get("returnTo"), environment);

  try {
    saveThemeDraft({
      actor,
      environment,
      tokenKey: String(formData.get("tokenKey") ?? "") as ThemeTokenKey,
      hex: getSubmittedHex(formData),
      pantoneLabel: normalizeString(formData.get("pantoneLabel")),
      pantoneCode: normalizeString(formData.get("pantoneCode")),
      reason: String(formData.get("reason") ?? ""),
      overrideContrast: formData.get("overrideContrast") === "on",
    });
    redirectWithResult(returnTo, "success", "Theme draft saved and audited.");
  } catch (error) {
    redirectWithResult(returnTo, "error", errorMessage(error));
  }
}

export async function publishThemeAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const environment = parseEnvironment(formData.get("environment"));
  const returnTo = normalizeReturnTo(formData.get("returnTo"), environment);

  try {
    publishThemeDraft({
      actor,
      environment,
      reason: String(formData.get("reason") ?? ""),
      overrideContrast: formData.get("overrideContrast") === "on",
    });
    redirectWithResult(returnTo, "success", "Theme published and audited.");
  } catch (error) {
    redirectWithResult(returnTo, "error", errorMessage(error));
  }
}

export async function rollbackThemeAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const environment = parseEnvironment(formData.get("environment"));
  const returnTo = normalizeReturnTo(formData.get("returnTo"), environment);

  try {
    rollbackTheme({
      actor,
      environment,
      reason: String(formData.get("reason") ?? ""),
    });
    redirectWithResult(returnTo, "success", "Theme rolled back and audited.");
  } catch (error) {
    redirectWithResult(returnTo, "error", errorMessage(error));
  }
}

export async function restoreDefaultThemeAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const environment = parseEnvironment(formData.get("environment"));
  const returnTo = normalizeReturnTo(formData.get("returnTo"), environment);

  try {
    restoreDefaultTheme({
      actor,
      environment,
      reason: String(formData.get("reason") ?? ""),
    });
    redirectWithResult(returnTo, "success", "Default MEDLIFE theme restored and audited.");
  } catch (error) {
    redirectWithResult(returnTo, "error", errorMessage(error));
  }
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
