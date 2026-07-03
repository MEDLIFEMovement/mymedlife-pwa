"use server";

import { redirect } from "next/navigation";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import { getLocalActorContext } from "@/services/local-actor-context";
import type { PrivateProofUploadResultCode } from "@/services/private-proof-upload-result-states";
import {
  getPrivateProofUploadWriteConfig,
  mapPrivateProofUploadRemovalRpcSuccess,
  mapPrivateProofUploadRpcError,
  mapPrivateProofUploadRpcSuccess,
  parseFutureSharingConsent,
  validatePrivateProofUploadInput,
  type PrivateProofUploadPrepareRow,
  type PrivateProofUploadRecordRow,
  type PrivateProofUploadRemovalRow,
  type PrivateProofUploadServerResult,
} from "@/services/private-proof-upload-write";

export async function submitPrivateProofUploadAction(formData: FormData) {
  const result = await submitPrivateProofUploadForLocalSupabase(formData);

  redirect(`/proof-library/upload?proofUploadResult=${result.code}`);
}

export async function removePrivateProofUploadAction(formData: FormData) {
  const result = await removePrivateProofUploadForLocalSupabase(formData);

  redirect(`/proof-library/upload?proofUploadResult=${result.code}`);
}

export async function submitPrivateProofUploadForLocalSupabase(
  formData: FormData,
): Promise<PrivateProofUploadServerResult> {
  const evidenceItemId = String(formData.get("evidenceItemId") ?? "").trim();
  const file = getFormFile(formData.get("proofFile"));
  const consentToMedlifeReview = formData.get("consentToMedlifeReview") === "true";
  const consentToFutureSharing = parseFutureSharingConsent(
    formData.get("consentToFutureSharing"),
  );
  const config = getPrivateProofUploadWriteConfig();

  if (!config.enabled) {
    return failureResult(evidenceItemId, "write_disabled", config.reason);
  }

  if (consentToFutureSharing === null) {
    return failureResult(
      evidenceItemId,
      "server_error",
      "The future sharing consent choice was not recognized.",
    );
  }

  const validationCode = validatePrivateProofUploadInput({
    evidenceItemId,
    file,
    consentToMedlifeReview,
    config,
  });

  if (validationCode) {
    return failureResult(
      evidenceItemId,
      validationCode,
      validationCode === "evidence_not_found"
        ? "The selected proof record could not be recognized."
        : validationCode === "file_required"
          ? "Choose one private proof file before uploading."
          : validationCode === "file_type_blocked"
            ? "That private proof file type is not allowed in the current upload lane."
            : validationCode === "file_too_large"
              ? "That private proof file is larger than the current 500 MB limit."
              : validationCode === "review_consent_required"
                ? "Private MEDLIFE review consent is required before storing this raw proof file."
                : config.reason,
    );
  }

  if (!file) {
    return failureResult(
      evidenceItemId,
      "file_required",
      "Choose one private proof file before uploading.",
    );
  }

  const { client, config: authConfig } = await createLocalSupabaseServerClient();

  if (!client) {
    return failureResult(evidenceItemId, "write_disabled", authConfig.reason);
  }

  const authSession = await getAuthSessionState(client);

  if (authSession.status !== "signed_in") {
    return failureResult(
      evidenceItemId,
      "missing_auth",
      "Sign in with the matching local seed user before managing a private proof file.",
    );
  }

  const { data: preparedData, error: prepareError } = await client
    .schema("app")
    .rpc("prepare_proof_upload_intake", {
      evidence_uuid: evidenceItemId,
      original_file_name_input: file.name,
      mime_type_input: file.type,
      byte_size_input: file.size,
      consent_to_medlife_review_input: consentToMedlifeReview,
      consent_to_future_sharing_input: consentToFutureSharing,
    });

  if (prepareError) {
    return mapPrivateProofUploadRpcError(evidenceItemId, prepareError);
  }

  const preparedRow = Array.isArray(preparedData)
    ? (preparedData[0] as PrivateProofUploadPrepareRow | undefined)
    : undefined;

  if (!preparedRow) {
    return failureResult(
      evidenceItemId,
      "server_error",
      "The app could not prepare the local private upload path.",
    );
  }

  const { error: uploadError } = await client
    .storage
    .from(preparedRow.private_bucket)
    .upload(preparedRow.storage_path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    const message = uploadError.message.toLowerCase();

    if (message.includes("exists") || message.includes("duplicate")) {
      return failureResult(
        evidenceItemId,
        "duplicate_upload",
        "A private file already exists at this path, so the app blocked a duplicate upload.",
      );
    }

    return failureResult(
      evidenceItemId,
      "server_error",
      "The private file could not be stored safely in local Supabase Storage.",
    );
  }

  const { data: recordData, error: recordError } = await client
    .schema("app")
    .rpc("record_private_proof_upload", {
      evidence_uuid: evidenceItemId,
      storage_path_input: preparedRow.storage_path,
      original_file_name_input: file.name,
      mime_type_input: file.type,
      byte_size_input: file.size,
      consent_to_medlife_review_input: consentToMedlifeReview,
      consent_to_future_sharing_input: consentToFutureSharing,
    });

  if (recordError) {
    await client.storage.from(preparedRow.private_bucket).remove([preparedRow.storage_path]);
    return mapPrivateProofUploadRpcError(evidenceItemId, recordError);
  }

  const recordRow = Array.isArray(recordData)
    ? (recordData[0] as PrivateProofUploadRecordRow | undefined)
    : undefined;

  if (!recordRow) {
    await client.storage.from(preparedRow.private_bucket).remove([preparedRow.storage_path]);
    return failureResult(
      evidenceItemId,
      "server_error",
      "Local Supabase did not return the expected private upload record bundle.",
    );
  }

  return mapPrivateProofUploadRpcSuccess(evidenceItemId, recordRow);
}

export async function removePrivateProofUploadForLocalSupabase(
  formData: FormData,
): Promise<PrivateProofUploadServerResult> {
  const evidenceItemId = String(formData.get("evidenceItemId") ?? "").trim();
  const removalReason = String(formData.get("removalReason") ?? "").trim();
  const config = getPrivateProofUploadWriteConfig();

  if (!config.enabled) {
    return failureResult(evidenceItemId, "write_disabled", config.reason);
  }

  if (removalReason.length < 12) {
    return failureResult(
      evidenceItemId,
      "removal_reason_required",
      "Explain why the private file is being removed before submitting this cleanup step.",
    );
  }

  const { client, config: authConfig } = await createLocalSupabaseServerClient();

  if (!client) {
    return failureResult(evidenceItemId, "write_disabled", authConfig.reason);
  }

  const authSession = await getAuthSessionState(client);

  if (authSession.status !== "signed_in") {
    return failureResult(
      evidenceItemId,
      "missing_auth",
      "Sign in with the matching local seed user before removing a private proof file.",
    );
  }

  const actor = await getLocalActorContext();
  const { data: evidenceRow, error: evidenceError } = await client
    .schema("app")
    .from("evidence_items")
    .select("id, submitted_by_user_id, storage_path")
    .eq("id", evidenceItemId)
    .maybeSingle();

  if (evidenceError) {
    return failureResult(
      evidenceItemId,
      "server_error",
      "The app could not inspect the selected proof row before cleanup.",
    );
  }

  if (!evidenceRow) {
    return failureResult(
      evidenceItemId,
      "evidence_not_found",
      "The selected proof record was not found in local Supabase.",
    );
  }

  const canRemove =
    evidenceRow.submitted_by_user_id === authSession.user?.id ||
    actor.audience === "admin" ||
    actor.audience === "super_admin";

  if (!canRemove) {
    return failureResult(
      evidenceItemId,
      "permission_denied",
      "This local user cannot remove the selected private proof file.",
    );
  }

  if (!evidenceRow.storage_path) {
    return failureResult(
      evidenceItemId,
      "upload_not_present",
      "This proof row is already metadata-only.",
    );
  }

  const { error: removeError } = await client
    .storage
    .from(config.bucket)
    .remove([evidenceRow.storage_path]);

  if (removeError) {
    return failureResult(
      evidenceItemId,
      "server_error",
      "The app could not remove the private file from local Supabase Storage.",
    );
  }

  const { data: recordData, error: recordError } = await client
    .schema("app")
    .rpc("record_private_proof_upload_removal", {
      evidence_uuid: evidenceItemId,
      removal_reason_input: removalReason,
    });

  if (recordError) {
    return mapPrivateProofUploadRpcError(evidenceItemId, recordError);
  }

  const recordRow = Array.isArray(recordData)
    ? (recordData[0] as PrivateProofUploadRemovalRow | undefined)
    : undefined;

  if (!recordRow) {
    return failureResult(
      evidenceItemId,
      "server_error",
      "Local Supabase did not return the expected private upload removal bundle.",
    );
  }

  return mapPrivateProofUploadRemovalRpcSuccess(evidenceItemId, recordRow);
}

function getFormFile(value: FormDataEntryValue | null): File | null {
  if (!(value instanceof File)) {
    return null;
  }

  return value.size > 0 ? value : null;
}

function failureResult(
  evidenceItemId: string,
  code: Exclude<PrivateProofUploadResultCode, "proof_uploaded" | "upload_removed">,
  plainEnglishMessage: string,
): PrivateProofUploadServerResult {
  return {
    success: false,
    code,
    evidenceItemId,
    plainEnglishMessage,
  };
}
