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
  validatePrivateProofUploadMetadata,
  type PrivateProofUploadPrepareRow,
  type PrivateProofUploadRecordRow,
  type PrivateProofUploadRemovalRow,
  type PrivateProofUploadServerResult,
} from "@/services/private-proof-upload-write";

export type PrivateProofUploadPrepareInput = {
  evidenceItemId: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  consentToMedlifeReview: boolean;
  consentToFutureSharing: boolean;
};

export type PrivateProofUploadPrepareResult =
  | {
      success: true;
      evidenceItemId: string;
      bucket: string;
      storagePath: string;
      uploadToken: string;
      input: PrivateProofUploadPrepareInput;
    }
  | {
      success: false;
      code: Exclude<PrivateProofUploadResultCode, "proof_uploaded" | "upload_removed">;
      plainEnglishMessage: string;
    };

export type PreparedPrivateProofUploadTicket = Omit<
  Extract<PrivateProofUploadPrepareResult, { success: true }>,
  "success" | "uploadToken"
>;

export type PrivateProofUploadCleanupResult = {
  success: boolean;
  plainEnglishMessage: string;
};

export async function removePrivateProofUploadAction(formData: FormData) {
  const result = await removePrivateProofUploadForSupabase(formData);

  redirect(`/proof-library/upload?proofUploadResult=${result.code}`);
}

export async function preparePrivateProofUploadForSupabase(
  input: PrivateProofUploadPrepareInput,
): Promise<PrivateProofUploadPrepareResult> {
  const config = getPrivateProofUploadWriteConfig();
  const validationCode = validatePrivateProofUploadMetadata({
    evidenceItemId: input.evidenceItemId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    consentToMedlifeReview: input.consentToMedlifeReview,
    config,
  });

  if (validationCode) {
    return {
      success: false,
      code: validationCode,
      plainEnglishMessage: getValidationMessage(validationCode, config.reason),
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
        "Sign in as the proof submitter before attaching a private file.",
    };
  }

  const { data: preparedData, error: prepareError } = await client
    .schema("app")
    .rpc("prepare_proof_upload_intake", {
      evidence_uuid: input.evidenceItemId,
      original_file_name_input: input.fileName,
      mime_type_input: input.mimeType,
      byte_size_input: input.byteSize,
      consent_to_medlife_review_input: input.consentToMedlifeReview,
      consent_to_future_sharing_input: input.consentToFutureSharing,
    });

  if (prepareError) {
    const result = mapPrivateProofUploadRpcError(input.evidenceItemId, prepareError);

    if (result.success) {
      return {
        success: false,
        code: "server_error",
        plainEnglishMessage: "The app could not prepare the private upload path.",
      };
    }

    return {
      success: false,
      code: result.code,
      plainEnglishMessage: result.plainEnglishMessage,
    };
  }

  const preparedRow = Array.isArray(preparedData)
    ? (preparedData[0] as PrivateProofUploadPrepareRow | undefined)
    : undefined;

  if (!preparedRow) {
    return {
      success: false,
      code: "server_error",
      plainEnglishMessage: "The app could not prepare the private upload path.",
    };
  }

  const { data: signedUpload, error: signedUploadError } = await client.storage
    .from(preparedRow.private_bucket)
    .createSignedUploadUrl(preparedRow.storage_path, { upsert: false });

  if (signedUploadError || !signedUpload?.token) {
    return {
      success: false,
      code: "server_error",
      plainEnglishMessage:
        "The app could not create a short-lived private upload ticket.",
    };
  }

  return {
    success: true,
    evidenceItemId: input.evidenceItemId,
    bucket: preparedRow.private_bucket,
    storagePath: preparedRow.storage_path,
    uploadToken: signedUpload.token,
    input,
  };
}

export async function recordPrivateProofUploadForSupabase(
  ticket: PreparedPrivateProofUploadTicket,
): Promise<PrivateProofUploadServerResult> {
  const config = getPrivateProofUploadWriteConfig();
  const validationCode = validatePrivateProofUploadMetadata({
    evidenceItemId: ticket.evidenceItemId,
    fileName: ticket.input.fileName,
    mimeType: ticket.input.mimeType,
    byteSize: ticket.input.byteSize,
    consentToMedlifeReview: ticket.input.consentToMedlifeReview,
    config,
  });

  if (validationCode || ticket.bucket !== config.bucket) {
    return failureResult(
      ticket.evidenceItemId,
      validationCode ?? "permission_denied",
      getValidationMessage(validationCode ?? "permission_denied", config.reason),
    );
  }

  const { client, config: authConfig } = await createLocalSupabaseServerClient();

  if (!client) {
    return failureResult(ticket.evidenceItemId, "write_disabled", authConfig.reason);
  }

  const authSession = await getAuthSessionState(client);

  if (authSession.status !== "signed_in") {
    return failureResult(
      ticket.evidenceItemId,
      "missing_auth",
      "Sign in as the proof submitter before completing a private upload.",
    );
  }

  const { data: recordData, error: recordError } = await client
    .schema("app")
    .rpc("record_private_proof_upload", {
      evidence_uuid: ticket.evidenceItemId,
      storage_path_input: ticket.storagePath,
      original_file_name_input: ticket.input.fileName,
      mime_type_input: ticket.input.mimeType,
      byte_size_input: ticket.input.byteSize,
      consent_to_medlife_review_input: ticket.input.consentToMedlifeReview,
      consent_to_future_sharing_input: ticket.input.consentToFutureSharing,
    });
  if (recordError) {
    await client.storage.from(config.bucket).remove([ticket.storagePath]);
    return mapPrivateProofUploadRpcError(ticket.evidenceItemId, recordError);
  }

  const recordRow = Array.isArray(recordData)
    ? (recordData[0] as PrivateProofUploadRecordRow | undefined)
    : undefined;

  if (!recordRow) {
    await client.storage.from(config.bucket).remove([ticket.storagePath]);
    return failureResult(
      ticket.evidenceItemId,
      "server_error",
      "Supabase did not return the expected private upload audit bundle.",
    );
  }

  return mapPrivateProofUploadRpcSuccess(ticket.evidenceItemId, recordRow);
}

export async function discardPreparedPrivateProofUploadForSupabase(
  ticket: PreparedPrivateProofUploadTicket,
): Promise<PrivateProofUploadCleanupResult> {
  const config = getPrivateProofUploadWriteConfig();
  const validationCode = validatePrivateProofUploadMetadata({
    evidenceItemId: ticket.evidenceItemId,
    fileName: ticket.input.fileName,
    mimeType: ticket.input.mimeType,
    byteSize: ticket.input.byteSize,
    consentToMedlifeReview: ticket.input.consentToMedlifeReview,
    config,
  });

  if (validationCode || ticket.bucket !== config.bucket) {
    return {
      success: false,
      plainEnglishMessage: getValidationMessage(
        validationCode ?? "permission_denied",
        config.reason,
      ),
    };
  }

  const { client, config: authConfig } = await createLocalSupabaseServerClient();

  if (!client) {
    return { success: false, plainEnglishMessage: authConfig.reason };
  }

  const authSession = await getAuthSessionState(client);

  if (authSession.status !== "signed_in") {
    return {
      success: false,
      plainEnglishMessage:
        "Sign in as the proof submitter before cleaning up an interrupted upload.",
    };
  }

  const { data: preparedData, error: prepareError } = await client
    .schema("app")
    .rpc("prepare_proof_upload_intake", {
      evidence_uuid: ticket.evidenceItemId,
      original_file_name_input: ticket.input.fileName,
      mime_type_input: ticket.input.mimeType,
      byte_size_input: ticket.input.byteSize,
      consent_to_medlife_review_input: ticket.input.consentToMedlifeReview,
      consent_to_future_sharing_input: ticket.input.consentToFutureSharing,
    });

  const preparedRow = Array.isArray(preparedData)
    ? (preparedData[0] as PrivateProofUploadPrepareRow | undefined)
    : undefined;

  if (prepareError || !preparedRow || preparedRow.storage_path !== ticket.storagePath) {
    return {
      success: false,
      plainEnglishMessage:
        "The app refused to clean up a private file whose canonical upload path could not be verified.",
    };
  }

  const { error: removeError } = await client.storage
    .from(config.bucket)
    .remove([ticket.storagePath]);

  return removeError
    ? {
        success: false,
        plainEnglishMessage:
          "The interrupted private upload still needs storage cleanup.",
      }
    : {
        success: true,
        plainEnglishMessage: "The interrupted private upload was removed.",
      };
}

export async function removePrivateProofUploadForSupabase(
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
      "Sign in as the submitter or an approved HQ cleanup role before removing a private proof file.",
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
      "The selected proof record was not found.",
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
      "This user cannot remove the selected private proof file.",
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
      "The app could not remove the private file from private Supabase Storage.",
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
      "Supabase did not return the expected private upload removal bundle.",
    );
  }

  return mapPrivateProofUploadRemovalRpcSuccess(evidenceItemId, recordRow);
}

function getValidationMessage(
  code: Exclude<PrivateProofUploadResultCode, "proof_uploaded" | "upload_removed">,
  writeDisabledReason: string,
): string {
  switch (code) {
    case "write_disabled":
      return writeDisabledReason;
    case "evidence_not_found":
      return "The selected proof record could not be recognized.";
    case "file_required":
      return "Choose one private proof file before uploading.";
    case "file_type_blocked":
      return "Use an approved image, video, or PDF file type.";
    case "file_too_large":
      return "The selected private proof file exceeds the 500 MB limit.";
    case "review_consent_required":
      return "Private MEDLIFE review consent is required before storing this file.";
    case "permission_denied":
      return "This signed-in user cannot manage the selected private proof file.";
    default:
      return "The app could not safely prepare the private proof upload.";
  }
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
