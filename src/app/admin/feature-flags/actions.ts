"use server";

import { redirect } from "next/navigation";
import {
  featureFlagEnvironments,
  featureFlagStatuses,
  updateFeatureFlagStatus,
  type FeatureFlagEnvironment,
  type FeatureFlagKey,
  type FeatureFlagStatus,
} from "@/modules/feature-flags";
import { getLocalActorContext } from "@/services/local-actor-context";

export async function updateFeatureFlagAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeReturnTo(formData.get("returnTo"));

  try {
    updateFeatureFlagStatus({
      actor,
      environment: parseEnvironment(formData.get("environment")),
      key: String(formData.get("flagKey") ?? "") as FeatureFlagKey,
      nextStatus: parseStatus(formData.get("nextStatus")),
      reason: String(formData.get("reason") ?? ""),
    });

    redirectWithResult(returnTo, "success", "Feature flag updated and audited.");
  } catch (error) {
    redirectWithResult(
      returnTo,
      "error",
      error instanceof Error ? error.message : "Feature flag update failed.",
    );
  }
}

function parseEnvironment(value: FormDataEntryValue | null): FeatureFlagEnvironment {
  const stringValue = String(value ?? "");

  if (!featureFlagEnvironments.includes(stringValue as FeatureFlagEnvironment)) {
    throw new Error("Choose a valid environment.");
  }

  return stringValue as FeatureFlagEnvironment;
}

function parseStatus(value: FormDataEntryValue | null): FeatureFlagStatus {
  const stringValue = String(value ?? "");

  if (!featureFlagStatuses.includes(stringValue as FeatureFlagStatus)) {
    throw new Error("Choose a valid feature status.");
  }

  return stringValue as FeatureFlagStatus;
}

function normalizeReturnTo(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "/admin/feature-flags";

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/admin/feature-flags";
  }

  return raw;
}

function redirectWithResult(
  returnTo: string,
  result: "success" | "error",
  message: string,
): never {
  const url = new URL(returnTo, "https://staging.mymedlife.org");
  url.searchParams.set("featureFlagResult", result);
  url.searchParams.set("featureFlagMessage", message.slice(0, 220));
  redirect(`${url.pathname}${url.search}`);
}
