"use server";

import { redirect } from "next/navigation";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import { isUuid } from "@/services/action-start-write";
import {
  getCoachDecisionWriteConfig,
  mapCoachDecisionRpcError,
  mapCoachDecisionRpcSuccess,
  parseCoachDecision,
  type CoachDecisionRpcRow,
  type CoachDecisionServerResult,
} from "@/services/coach-decision-write";

export async function submitCoachDecisionAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  const result = await submitCoachDecisionForLocalSupabase(formData);
  const search = new URLSearchParams({
    coachDecisionResult: result.code,
  });

  redirect(`${returnTo}?${search.toString()}`);
}

export async function submitCoachDecisionForLocalSupabase(
  formData: FormData,
): Promise<CoachDecisionServerResult> {
  const config = getCoachDecisionWriteConfig();
  const chapterId = String(formData.get("chapterId") ?? "").trim();
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const phaseId = String(formData.get("phaseId") ?? "").trim();
  const decision = parseCoachDecision(formData.get("decision"));
  const note = String(formData.get("note") ?? "").trim();
  const blockerSummary = String(formData.get("blockerSummary") ?? "").trim();

  if (!config.enabled) {
    return {
      success: false,
      code: "write_disabled",
      plainEnglishMessage: config.reason,
    };
  }

  if (!isUuid(chapterId) || !isUuid(campaignId) || !isUuid(phaseId)) {
    return {
      success: false,
      code: "portfolio_not_assigned",
      plainEnglishMessage:
        "The current chapter, campaign, or phase uses mock data, not local Supabase UUIDs, so no coach decision was saved.",
    };
  }

  if (!decision) {
    return {
      success: false,
      code: "server_error",
      plainEnglishMessage:
        "The coach decision was not recognized. No escalation packet or external automation ran.",
    };
  }

  if (note.length < 12) {
    return {
      success: false,
      code: "note_too_short",
      plainEnglishMessage:
        "Add a plain-English coach decision note before saving.",
    };
  }

  if (decision === "intervene" && blockerSummary.length < 8) {
    return {
      success: false,
      code: "blocker_summary_required",
      plainEnglishMessage:
        "Add a blocker summary before saving an intervention decision.",
    };
  }

  const { client, config: authConfig } = await createLocalSupabaseServerClient();

  if (!client) {
    return {
      success: false,
      code: "write_disabled",
      plainEnglishMessage: authConfig.reason,
    };
  }

  const authSession = await getAuthSessionState(client);

  if (authSession.status !== "signed_in") {
    return {
      success: false,
      code: "missing_auth",
      plainEnglishMessage:
        "Sign in with a local Supabase coach, Admin, or Super Admin before saving this decision.",
    };
  }

  const { data, error } = await client
    .schema("app")
    .rpc("log_coach_decision", {
      chapter_uuid: chapterId,
      campaign_uuid: campaignId,
      phase_uuid: phaseId,
      decision_input: decision,
      decision_note: note,
      blocker_summary_input: blockerSummary || null,
    });

  if (error) {
    return mapCoachDecisionRpcError(error);
  }

  const firstRow = Array.isArray(data)
    ? (data[0] as CoachDecisionRpcRow | undefined)
    : undefined;

  if (!firstRow) {
    return {
      success: false,
      code: "server_error",
      plainEnglishMessage:
        "Local Supabase did not return the expected coach decision record. No escalation packet or external automation ran.",
    };
  }

  return mapCoachDecisionRpcSuccess(decision, firstRow);
}

function normalizeReturnTo(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/coach";
  }

  const trimmed = value.trim();

  if (
    trimmed !== "/coach" ||
    trimmed.startsWith("//") ||
    trimmed.includes("\n") ||
    trimmed.includes("\r")
  ) {
    return "/coach";
  }

  return trimmed;
}
