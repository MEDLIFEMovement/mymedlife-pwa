"use server";

import { redirect } from "next/navigation";
import {
  featureFlagEnvironments,
  featureFlagStatuses,
  getFeatureFlagDefinition,
  type FeatureFlagEnvironment,
  type FeatureFlagKey,
  type FeatureFlagStatus,
  updateFeatureFlagStatusDurable,
} from "@/modules/feature-flags";
import {
  getDsSecretStepUpState,
  needsFreshProductionStepUp,
} from "@/services/admin-integrations-step-up";
import { getLocalActorContext } from "@/services/local-actor-context";

export async function updateFeatureFlagAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeReturnTo(formData.get("returnTo"));

  try {
    const environment = parseEnvironment(formData.get("environment"));
    const key = String(formData.get("flagKey") ?? "") as FeatureFlagKey;
    const definition = getFeatureFlagDefinition(key);
    const approvalReference = normalizeString(formData.get("approvalReference"));
    let stepUpSessionId: string | null = null;
    const productionSensitive =
      environment === "production" &&
      definition.externalApiBoundary &&
      parseStatus(formData.get("nextStatus")) !== "disabled" &&
      parseStatus(formData.get("nextStatus")) !== "emergency_disabled";

    if (productionSensitive) {
      if (formData.get("confirmProduction") !== "on") {
        throw new Error("Production-sensitive provider flags require explicit confirmation.");
      }

      if (!approvalReference) {
        throw new Error("Production-sensitive provider flags require an approval reference.");
      }

      const stepUpState = await getDsSecretStepUpState(actor);

      if (needsFreshProductionStepUp(stepUpState)) {
        throw new Error("Production-sensitive provider flags require a fresh DS/Admin step-up session.");
      }

      stepUpSessionId = stepUpState.sessionId;
    }

    await updateFeatureFlagStatusDurable({
      actor,
      environment,
      key,
      nextStatus: parseStatus(formData.get("nextStatus")),
      reason: String(formData.get("reason") ?? ""),
      approvalReference,
      stepUpSessionId,
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

function normalizeString(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
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
