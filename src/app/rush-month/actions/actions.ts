"use server";

import { redirect } from "next/navigation";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import {
  getAssignmentCreateWriteConfig,
  mapAssignmentCreateRpcError,
  mapAssignmentCreateRpcSuccess,
  mapChapterRoleToDatabaseRole,
  parseAssignmentOwnerRole,
  type AssignmentCreateRpcRow,
  type AssignmentCreateServerResult,
} from "@/services/assignment-create-write";
import { getAuthSessionState } from "@/services/auth-session";
import { isUuid } from "@/services/action-start-write";

export async function createLeaderAssignmentAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  const result = await createLeaderAssignmentForLocalSupabase(formData);
  const search = new URLSearchParams({
    assignmentCreateResult: result.code,
  });

  redirect(`${returnTo}?${search.toString()}`);
}

export async function createLeaderAssignmentForLocalSupabase(
  formData: FormData,
): Promise<AssignmentCreateServerResult> {
  const config = getAssignmentCreateWriteConfig();
  const chapterId = String(formData.get("chapterId") ?? "").trim();
  const campaignId = String(formData.get("campaignId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const evidenceRequired = String(formData.get("evidenceRequired") ?? "").trim();
  const kpi = String(formData.get("kpi") ?? "").trim();
  const ownerRole = parseAssignmentOwnerRole(formData.get("ownerRole"));
  const points = parsePoints(formData.get("points"));
  const databaseRole = ownerRole ? mapChapterRoleToDatabaseRole(ownerRole) : null;

  if (!config.enabled) {
    return {
      success: false,
      code: "write_disabled",
      assignmentId: null,
      plainEnglishMessage: config.reason,
    };
  }

  if (!isUuid(chapterId) || !isUuid(campaignId)) {
    return {
      success: false,
      code: "server_error",
      assignmentId: null,
      plainEnglishMessage:
        "The current chapter or campaign uses mock data, not local Supabase UUIDs, so no assignment was saved.",
    };
  }

  if (!databaseRole) {
    return {
      success: false,
      code: "permission_denied",
      assignmentId: null,
      plainEnglishMessage:
        "The selected owner role does not map to a safe chapter assignment role.",
    };
  }

  if (title.length < 5) {
    return {
      success: false,
      code: "title_too_short",
      assignmentId: null,
      plainEnglishMessage: "Add a clearer assignment title before saving.",
    };
  }

  if (instructions.length < 12) {
    return {
      success: false,
      code: "instructions_too_short",
      assignmentId: null,
      plainEnglishMessage:
        "Add enough instructions for the student to know what to do next.",
    };
  }

  if (evidenceRequired.length < 5) {
    return {
      success: false,
      code: "evidence_requirement_too_short",
      assignmentId: null,
      plainEnglishMessage:
        "Add a clearer proof or testimonial requirement before saving.",
    };
  }

  if (kpi.length < 2) {
    return {
      success: false,
      code: "kpi_required",
      assignmentId: null,
      plainEnglishMessage:
        "Connect this assignment to a simple KPI before saving.",
    };
  }

  if (points === null || points < 0 || points > 1000) {
    return {
      success: false,
      code: "invalid_points",
      assignmentId: null,
      plainEnglishMessage:
        "Choose a points value between 0 and 1000 before saving.",
    };
  }

  const { client, config: authConfig } = await createLocalSupabaseServerClient();

  if (!client) {
    return {
      success: false,
      code: "write_disabled",
      assignmentId: null,
      plainEnglishMessage: authConfig.reason,
    };
  }

  const authSession = await getAuthSessionState(client);

  if (authSession.status !== "signed_in") {
    return {
      success: false,
      code: "missing_auth",
      assignmentId: null,
      plainEnglishMessage:
        "Sign in with a local Supabase chapter leader or Super Admin before creating an assignment.",
    };
  }

  const { data, error } = await client
    .schema("app")
    .rpc("create_chapter_assignment", {
      chapter_uuid: chapterId,
      campaign_uuid: campaignId,
      assignment_title: title,
      assignment_instructions: instructions,
      evidence_required_input: evidenceRequired,
      kpi_key_input: kpi,
      points_input: points,
      assigned_to_user_uuid: null,
      assigned_to_role: databaseRole,
      phase_uuid: null,
      action_template_uuid: null,
      action_committee_uuid: null,
      chapter_event_uuid: null,
      due_at_input: null,
      priority_input: "normal",
      expected_output_input: null,
      support_role_labels_input: ownerRole ? [ownerRole] : [],
      late_next_step_input:
        "Leader should follow up before the next Rush Month check-in.",
    });

  if (error) {
    return mapAssignmentCreateRpcError(error);
  }

  const firstRow = Array.isArray(data)
    ? (data[0] as AssignmentCreateRpcRow | undefined)
    : undefined;

  if (!firstRow) {
    return {
      success: false,
      code: "server_error",
      assignmentId: null,
      plainEnglishMessage:
        "Local Supabase did not return the expected assignment record. No reminder or external automation ran.",
    };
  }

  return mapAssignmentCreateRpcSuccess(firstRow);
}

function parsePoints(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseInt(value.trim(), 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeReturnTo(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/rush-month/actions";
  }

  const trimmed = value.trim();

  if (
    trimmed !== "/rush-month/actions" ||
    trimmed.startsWith("//") ||
    trimmed.includes("\n") ||
    trimmed.includes("\r")
  ) {
    return "/rush-month/actions";
  }

  return trimmed;
}
