"use server";

import { redirect } from "next/navigation";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  isPhase2PilotPacketKey,
} from "@/services/phase-2-pilot-registry";
import { upsertReviewPacketRecord } from "@/services/review-packet-registry";
import { canReadAdminReviewSurface } from "@/services/role-visibility";

export async function recordPilotScopePacketAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  let result: "success" | "error" = "success";
  let message = "Pilot packet value saved and audited.";

  try {
    if (!canReadAdminReviewSurface(actor)) {
      throw new Error(
        "Only HQ/Admin, DS Admin, or Super Admin can update pilot packet values.",
      );
    }

    const recordKey = parsePilotRecordKey(formData.get("recordKey"));
    const value = normalizeRequiredString(formData.get("value"), "Enter a value.");
    const reason = normalizeRequiredString(
      formData.get("reason"),
      "Enter a clear reason for this packet update.",
    );

    if (reason.length < 8) {
      throw new Error("Pilot packet update reasons must be at least 8 characters.");
    }

    await upsertReviewPacketRecord({
      category: "pilot_scope",
      recordKey,
      value,
      reason,
    });
  } catch (error) {
    result = "error";
    message =
      error instanceof Error ? error.message : "Pilot packet update failed.";
  }

  redirectWithResult(returnTo, result, message);
}

function parsePilotRecordKey(value: FormDataEntryValue | null) {
  const recordKey = String(value ?? "");

  if (!isPhase2PilotPacketKey(recordKey)) {
    throw new Error("Choose a valid pilot packet field.");
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
  const raw = typeof value === "string" ? value : "/admin/pilot-scope";

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/admin/pilot-scope";
  }

  return raw;
}

function redirectWithResult(
  returnTo: string,
  result: "success" | "error",
  message: string,
): never {
  const url = new URL(returnTo, "https://staging.mymedlife.org");
  url.searchParams.set("pilotPacketResult", result);
  url.searchParams.set("pilotPacketMessage", message.slice(0, 220));
  redirect(`${url.pathname}${url.search}`);
}
