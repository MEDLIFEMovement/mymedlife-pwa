"use server";

import { redirect } from "next/navigation";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import {
  getHqProofDecisionWriteConfig,
  mapHqDecisionToDatabaseDecision,
  mapHqProofDecisionRpcError,
  mapHqProofDecisionRpcSuccess,
  parseHqProofDecision,
  type HqProofDecisionRpcRow,
  type HqProofDecisionServerResult,
} from "@/services/hq-proof-decision-write";
import { isUuid } from "@/services/action-start-write";

export async function submitHqProofDecisionAction(formData: FormData) {
  const evidenceItemId = String(formData.get("evidenceItemId") ?? "").trim();
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  const result = await submitHqProofDecisionForLocalSupabase(formData);
  const search = new URLSearchParams({
    hqDecisionResult: result.code,
    evidenceItemId,
  });

  redirect(`${returnTo}?${search.toString()}`);
}

export async function submitHqProofDecisionForLocalSupabase(
  formData: FormData,
): Promise<HqProofDecisionServerResult> {
  const evidenceItemId = String(formData.get("evidenceItemId") ?? "").trim();
  const decision = parseHqProofDecision(formData.get("decision"));
  const note = String(formData.get("note") ?? "").trim();
  const config = getHqProofDecisionWriteConfig();

  if (!config.enabled) {
    return {
      success: false,
      code: "write_disabled",
      evidenceItemId,
      plainEnglishMessage: config.reason,
    };
  }

  if (!isUuid(evidenceItemId)) {
    return {
      success: false,
      code: "evidence_not_found",
      evidenceItemId,
      plainEnglishMessage:
        "The current proof item uses mock data, not a local Supabase UUID, so no HQ decision was saved.",
    };
  }

  if (!decision) {
    return {
      success: false,
      code: "server_error",
      evidenceItemId,
      plainEnglishMessage:
        "The HQ decision was not recognized. No public sharing or external automation ran.",
    };
  }

  if (note.length < 12) {
    return {
      success: false,
      code: "note_too_short",
      evidenceItemId,
      plainEnglishMessage:
        "Add a plain-English HQ decision note before saving.",
    };
  }

  const { client, config: authConfig } = await createLocalSupabaseServerClient();

  if (!client) {
    return {
      success: false,
      code: "write_disabled",
      evidenceItemId,
      plainEnglishMessage: authConfig.reason,
    };
  }

  const authSession = await getAuthSessionState(client);

  if (authSession.status !== "signed_in") {
    return {
      success: false,
      code: "missing_auth",
      evidenceItemId,
      plainEnglishMessage:
        "Sign in with a local Supabase HQ seed user before saving this decision.",
    };
  }

  const { data, error } = await client
    .schema("app")
    .rpc("record_hq_proof_sharing_decision", {
      evidence_uuid: evidenceItemId,
      decision_input: mapHqDecisionToDatabaseDecision(decision),
      review_note: note,
    });

  if (error) {
    return mapHqProofDecisionRpcError(evidenceItemId, error);
  }

  const firstRow = Array.isArray(data)
    ? (data[0] as HqProofDecisionRpcRow | undefined)
    : undefined;

  if (!firstRow) {
    return {
      success: false,
      code: "server_error",
      evidenceItemId,
      plainEnglishMessage:
        "Local Supabase did not return the expected HQ decision record. No public sharing or external automation ran.",
    };
  }

  return mapHqProofDecisionRpcSuccess(evidenceItemId, decision, firstRow);
}

function normalizeReturnTo(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/rush-month/review";
  }

  const trimmed = value.trim();

  if (
    trimmed !== "/rush-month/review" ||
    trimmed.startsWith("//") ||
    trimmed.includes("\n") ||
    trimmed.includes("\r")
  ) {
    return "/rush-month/review";
  }

  return trimmed;
}
