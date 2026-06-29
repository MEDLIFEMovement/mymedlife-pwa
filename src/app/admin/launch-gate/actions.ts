"use server";

import { redirect } from "next/navigation";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  isProductionLaunchPacketKey,
  requiresConcreteProductionLaunchPacketValue,
} from "@/services/production-launch-gate";
import { isResolvedReviewPacketValue } from "@/services/review-packet-value";
import { upsertReviewPacketRecord } from "@/services/review-packet-registry";
import { canReadAdminReviewSurface } from "@/services/role-visibility";

export async function recordProductionLaunchPacketAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  let result: "success" | "error" = "success";
  let message = "Production launch packet value saved and audited.";

  try {
    if (!canReadAdminReviewSurface(actor)) {
      throw new Error(
        "Only HQ/Admin, DS Admin, or Super Admin can update production packet values.",
      );
    }

    const recordKey = parseProductionRecordKey(formData.get("recordKey"));
    const value = normalizeRequiredString(formData.get("value"), "Enter a value.");
    const reason = normalizeRequiredString(
      formData.get("reason"),
      "Enter a clear reason for this packet update.",
    );

    if (reason.length < 8) {
      throw new Error(
        "Production packet update reasons must be at least 8 characters.",
      );
    }

    if (
      requiresConcreteProductionLaunchPacketValue(recordKey) &&
      !isResolvedReviewPacketValue(value)
    ) {
      throw new Error(
        "This production packet field must use a concrete value, not a placeholder.",
      );
    }

    await upsertReviewPacketRecord({
      category: "production_launch",
      recordKey,
      value,
      reason,
    });
  } catch (error) {
    result = "error";
    message =
      error instanceof Error ? error.message : "Production packet update failed.";
  }

  redirectWithResult(returnTo, result, message);
}

function parseProductionRecordKey(value: FormDataEntryValue | null) {
  const recordKey = String(value ?? "");

  if (!isProductionLaunchPacketKey(recordKey)) {
    throw new Error("Choose a valid production packet field.");
  }

  return recordKey;
}

function normalizeRequiredString(
  value: FormDataEntryValue | null,
  emptyMessage: string,
) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(emptyMessage);
  }

  return value.trim();
}

function normalizeReturnTo(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value : "/admin/launch-gate";

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/admin/launch-gate";
  }

  return raw;
}

function redirectWithResult(
  returnTo: string,
  result: "success" | "error",
  message: string,
): never {
  const url = new URL(returnTo, "https://staging.mymedlife.org");
  url.searchParams.set("launchPacketResult", result);
  url.searchParams.set("launchPacketMessage", message.slice(0, 220));
  redirect(`${url.pathname}${url.search}`);
}
