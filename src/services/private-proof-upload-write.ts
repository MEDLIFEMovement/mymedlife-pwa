import { isUuid } from "@/services/action-start-write";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  buildPrivateProofStoragePath,
  getProofStoragePlan,
  isAllowedProofMimeType,
  type ProofStorageBucket,
} from "@/services/proof-storage-readiness";
import type { PrivateProofUploadResultCode } from "@/services/private-proof-upload-result-states";
import type {
  ContentSharingStatus,
  EvidenceStatus,
  EvidenceType,
} from "@/shared/types/persistence";

type EnvSource = Record<string, string | undefined>;

export type PrivateProofUploadWriteConfig = {
  enabled: boolean;
  environment: "local" | "staging" | "production";
  isLocalOnly: boolean;
  uploadsEnabled: boolean;
  publicPublishingEnabled: false;
  externalWritesEnabled: false;
  reason: string;
  bucket: ProofStorageBucket;
};

export type PrivateProofUploadPrepareRow = {
  evidence_item_id: string;
  chapter_id: string;
  private_bucket: string;
  storage_path: string;
  normalized_file_name: string;
};

export type PrivateProofUploadRecordRow = {
  evidence_item_id: string;
  event_id: string;
  integration_event_id: string;
  outbox_id: string;
  audit_log_id: string;
  storage_path: string;
};

export type PrivateProofUploadRemovalRow = {
  evidence_item_id: string;
  event_id: string;
  integration_event_id: string;
  outbox_id: string;
  audit_log_id: string;
  removed_storage_path: string;
};

export type PrivateProofUploadServerResult =
  | {
      success: true;
      code: "proof_uploaded" | "upload_removed";
      evidenceItemId: string;
      storagePath?: string;
      eventId: string;
      integrationEventId: string;
      outboxId: string;
      auditLogId: string;
      plainEnglishMessage: string;
    }
  | {
      success: false;
      code: Exclude<PrivateProofUploadResultCode, "proof_uploaded" | "upload_removed">;
      evidenceItemId: string;
      plainEnglishMessage: string;
    };

export type PrivateProofUploadQueueRow = {
  evidenceItemId: string;
  assignmentId: string | null;
  assignmentTitle: string;
  chapterName: string;
  submittedBy: string;
  submittedByUserId: string;
  evidenceType: EvidenceType;
  summary: string;
  status: EvidenceStatus;
  sharingStatus: ContentSharingStatus;
  storagePath: string | null;
  canUpload: boolean;
  canRemove: boolean;
  helperText: string;
};

export type PrivateProofUploadWorkspace = {
  sourceMode: "mock" | "supabase";
  title: string;
  summary: string;
  config: PrivateProofUploadWriteConfig;
  rows: PrivateProofUploadQueueRow[];
  counts: {
    pendingUpload: number;
    uploaded: number;
    removable: number;
  };
  emptyStateTitle: string;
  emptyStateMessage: string;
  allowedMimeTypes: readonly string[];
  maxFileSizeMb: number;
  signedInAsSelectedActor: boolean;
};

export function getPrivateProofUploadWriteConfig(
  env: EnvSource = process.env,
): PrivateProofUploadWriteConfig {
  const bucket = getProofStoragePlan().privateSubmissionBucket;
  const environment = getPrivateProofUploadEnvironment(env);

  if (environment === "production") {
    if (env.MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE !== "true") {
      return disabledConfig(
        environment,
        bucket,
        "Private proof upload stays locked until the dedicated write flag is enabled.",
      );
    }

    if (env.MYMEDLIFE_ALLOW_PRODUCTION_PRIVATE_PROOF_UPLOAD_WRITE !== "true") {
      return disabledConfig(
        environment,
        bucket,
        "Production private proof upload requires the separate production approval flag.",
      );
    }

    return {
      enabled: true,
      environment,
      isLocalOnly: false,
      uploadsEnabled: true,
      publicPublishingEnabled: false,
      externalWritesEnabled: false,
      reason:
        "Production private proof upload is enabled for authenticated submitters. Raw media stays private; public publishing and external sends remain disabled.",
      bucket,
    };
  }

  if (environment === "staging") {
    return disabledConfig(
      environment,
      bucket,
      "Hosted staging private proof upload remains disabled until a dedicated staging approval is configured.",
    );
  }

  if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
    return disabledConfig(
      environment,
      bucket,
      "Local Supabase writes are disabled. Turn them on only for localhost write testing.",
    );
  }

  if (env.MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE !== "true") {
    return disabledConfig(
      environment,
      bucket,
      "Private proof upload stays locked until the dedicated local write flag is enabled.",
    );
  }

  return {
    enabled: true,
    environment,
    isLocalOnly: true,
    uploadsEnabled: true,
    publicPublishingEnabled: false,
    externalWritesEnabled: false,
    reason:
      "Local private proof upload is enabled for localhost Supabase only. Public proof sharing and external sends remain disabled.",
    bucket,
  };
}

function getPrivateProofUploadEnvironment(
  env: EnvSource,
): "local" | "staging" | "production" {
  if (env.MYMEDLIFE_AUTH_MODE === "production_supabase") {
    return "production";
  }

  if (env.MYMEDLIFE_AUTH_MODE === "staging_supabase") {
    return "staging";
  }

  return "local";
}

function disabledConfig(
  environment: "local" | "staging" | "production",
  bucket: ProofStorageBucket,
  reason: string,
): PrivateProofUploadWriteConfig {
  return {
    enabled: false,
    environment,
    isLocalOnly: environment === "local",
    uploadsEnabled: false,
    publicPublishingEnabled: false,
    externalWritesEnabled: false,
    reason,
    bucket,
  };
}

export function getPrivateProofUploadWorkspaceBase(
  actor: LocalActorContext,
  rows: PrivateProofUploadQueueRow[],
  sourceMode: "mock" | "supabase",
  env: EnvSource = process.env,
): PrivateProofUploadWorkspace {
  const config = getPrivateProofUploadWriteConfig(env);
  const plan = getProofStoragePlan();
  const signedInAsSelectedActor =
    actor.identitySource === "local_auth_session" &&
    actor.authSessionStatus === "signed_in";

  return {
    sourceMode,
    title: "Private proof upload queue",
    summary:
      "Attach raw videos, photos, or PDFs only to approved proof metadata records. This stays private to the submitter and HQ cleanup roles.",
    config,
    rows,
    counts: {
      pendingUpload: rows.filter((row) => row.storagePath === null).length,
      uploaded: rows.filter((row) => row.storagePath !== null).length,
      removable: rows.filter((row) => row.canRemove).length,
    },
    emptyStateTitle: getPrivateProofUploadEmptyTitle(actor, rows, sourceMode),
    emptyStateMessage: getPrivateProofUploadEmptyMessage(
      actor,
      rows,
      sourceMode,
      config,
      signedInAsSelectedActor,
    ),
    allowedMimeTypes: plan.allowedMimeTypes,
    maxFileSizeMb: plan.maxFileSizeMb,
    signedInAsSelectedActor,
  };
}

export function buildPrivateProofUploadRow(params: {
  actor: LocalActorContext;
  assignmentId: string | null;
  assignmentStatus: string | null;
  assignmentTitle: string;
  chapterName: string;
  evidenceItemId: string;
  submittedBy: string;
  submittedByUserId: string;
  evidenceType: EvidenceType;
  summary: string;
  status: EvidenceStatus;
  sharingStatus: ContentSharingStatus;
  storagePath: string | null;
}): PrivateProofUploadQueueRow {
  const signedInAsSelectedActor =
    params.actor.identitySource === "local_auth_session" &&
    params.actor.authSessionStatus === "signed_in";
  const isSubmitter = params.submittedByUserId === params.actor.user.id;
  const isHqCleanupRole =
    params.actor.audience === "admin" || params.actor.audience === "super_admin";
  const evidenceIsManageable =
    ["pending_review", "changes_requested"].includes(params.status) &&
    ["submitted", "in_hq_review"].includes(params.sharingStatus);
  const uploadEligible =
    params.assignmentId !== null &&
    ["submitted", "changes_requested", "approved"].includes(
      params.assignmentStatus ?? "",
    ) &&
    evidenceIsManageable;
  const canUpload =
    signedInAsSelectedActor &&
    isSubmitter &&
    uploadEligible &&
    params.storagePath === null;
  const canRemove =
    signedInAsSelectedActor &&
    params.assignmentId !== null &&
    evidenceIsManageable &&
    params.storagePath !== null &&
    (isSubmitter || isHqCleanupRole);

  return {
    evidenceItemId: params.evidenceItemId,
    assignmentId: params.assignmentId,
    assignmentTitle: params.assignmentTitle,
    chapterName: params.chapterName,
    submittedBy: params.submittedBy,
    submittedByUserId: params.submittedByUserId,
    evidenceType: params.evidenceType,
    summary: params.summary,
    status: params.status,
    sharingStatus: params.sharingStatus,
    storagePath: params.storagePath,
    canUpload,
    canRemove,
    helperText: getPrivateProofUploadHelperText({
      actor: params.actor,
      isSubmitter,
      hasStoragePath: params.storagePath !== null,
      signedInAsSelectedActor,
      uploadEligible,
    }),
  };
}

export function validatePrivateProofUploadInput(params: {
  evidenceItemId: string;
  file: File | null;
  consentToMedlifeReview: boolean;
  config?: PrivateProofUploadWriteConfig;
}): Exclude<
  PrivateProofUploadResultCode,
  | "duplicate_upload"
  | "missing_auth"
  | "permission_denied"
  | "proof_uploaded"
  | "server_error"
  | "upload_not_present"
  | "upload_removed"
> | null {
  const config = params.config ?? getPrivateProofUploadWriteConfig();

  return validatePrivateProofUploadMetadata({
    evidenceItemId: params.evidenceItemId,
    fileName: params.file?.name ?? "",
    mimeType: params.file?.type ?? "",
    byteSize: params.file?.size ?? 0,
    consentToMedlifeReview: params.consentToMedlifeReview,
    config,
  });
}

export function validatePrivateProofUploadMetadata(params: {
  evidenceItemId: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  consentToMedlifeReview: boolean;
  config?: PrivateProofUploadWriteConfig;
}): Exclude<
  PrivateProofUploadResultCode,
  | "duplicate_upload"
  | "missing_auth"
  | "permission_denied"
  | "proof_uploaded"
  | "server_error"
  | "upload_not_present"
  | "upload_removed"
> | null {
  const config = params.config ?? getPrivateProofUploadWriteConfig();

  if (!config.enabled) {
    return "write_disabled";
  }

  if (!isUuid(params.evidenceItemId)) {
    return "evidence_not_found";
  }

  if (!params.fileName.trim() || params.byteSize <= 0) {
    return "file_required";
  }

  if (!params.mimeType || !isAllowedProofMimeType(params.mimeType)) {
    return "file_type_blocked";
  }

  const maxBytes = getProofStoragePlan().maxFileSizeMb * 1024 * 1024;

  if (params.byteSize > maxBytes) {
    return "file_too_large";
  }

  if (!params.consentToMedlifeReview) {
    return "review_consent_required";
  }

  return null;
}

export function parseFutureSharingConsent(
  value: FormDataEntryValue | null,
): boolean | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "granted") {
    return true;
  }

  if (normalized === "declined") {
    return false;
  }

  return null;
}

export function getPreparedPrivateProofStoragePath(
  chapterId: string,
  evidenceItemId: string,
  originalFileName: string,
): string {
  return buildPrivateProofStoragePath(chapterId, evidenceItemId, originalFileName);
}

export function mapPrivateProofUploadRpcSuccess(
  evidenceItemId: string,
  row: PrivateProofUploadRecordRow,
): PrivateProofUploadServerResult {
  return {
    success: true,
    code: "proof_uploaded",
    evidenceItemId,
    storagePath: row.storage_path,
    eventId: row.event_id,
    integrationEventId: row.integration_event_id,
    outboxId: row.outbox_id,
    auditLogId: row.audit_log_id,
    plainEnglishMessage:
      "Private proof uploaded. The app recorded the storage path, internal event, disabled outbox row, and audit log without publishing the file.",
  };
}

export function mapPrivateProofUploadRemovalRpcSuccess(
  evidenceItemId: string,
  row: PrivateProofUploadRemovalRow,
): PrivateProofUploadServerResult {
  return {
    success: true,
    code: "upload_removed",
    evidenceItemId,
    storagePath: row.removed_storage_path,
    eventId: row.event_id,
    integrationEventId: row.integration_event_id,
    outboxId: row.outbox_id,
    auditLogId: row.audit_log_id,
    plainEnglishMessage:
      "Private proof upload removed. The proof row is back to metadata-only review and public sharing stayed off.",
  };
}

export function mapPrivateProofUploadRpcError(
  evidenceItemId: string,
  error: { code?: string; message?: string },
): PrivateProofUploadServerResult {
  const message = error.message?.toLowerCase() ?? "";

  if (error.code === "P0002" || message.includes("evidence item not found")) {
    return failureResult(
      evidenceItemId,
      "evidence_not_found",
      "The selected proof record was not found in local Supabase.",
    );
  }

  if (message.includes("authenticated user required")) {
    return failureResult(
      evidenceItemId,
      "missing_auth",
      "Sign in with the matching local seed user before managing a private proof file.",
    );
  }

  if (
    error.code === "22023" &&
    (message.includes("file type") ||
      message.includes("mime type") ||
      message.includes("allowed mime"))
  ) {
    return failureResult(
      evidenceItemId,
      "file_type_blocked",
      "That private proof file type is not allowed in the current upload lane.",
    );
  }

  if (
    error.code === "22023" &&
    (message.includes("file size") || message.includes("too large"))
  ) {
    return failureResult(
      evidenceItemId,
      "file_too_large",
      "That private proof file is larger than the current local upload limit.",
    );
  }

  if (error.code === "22023" && message.includes("review consent")) {
    return failureResult(
      evidenceItemId,
      "review_consent_required",
      "Private HQ review consent is required before storing this raw proof file.",
    );
  }

  if (error.code === "22023" && message.includes("already has private upload")) {
    return failureResult(
      evidenceItemId,
      "duplicate_upload",
      "This proof item already has a private file attached.",
    );
  }

  if (error.code === "22023" && message.includes("removal reason")) {
    return failureResult(
      evidenceItemId,
      "removal_reason_required",
      "Add a short removal reason before removing the private file.",
    );
  }

  if (error.code === "22023" && message.includes("has no private upload")) {
    return failureResult(
      evidenceItemId,
      "upload_not_present",
      "That proof item is already metadata-only.",
    );
  }

  if (error.code === "42501" || message.includes("cannot manage private proof")) {
    return failureResult(
      evidenceItemId,
      "permission_denied",
      "This signed-in local user cannot manage the selected private proof file.",
    );
  }

  return failureResult(
    evidenceItemId,
    "server_error",
    "The app could not safely finish the private proof upload step.",
  );
}

function getPrivateProofUploadEmptyTitle(
  actor: LocalActorContext,
  rows: PrivateProofUploadQueueRow[],
  sourceMode: "mock" | "supabase",
): string {
  if (rows.length > 0) {
    return "No upload rows matched the current filter.";
  }

  if (sourceMode === "mock") {
    return "Turn on local Supabase data to inspect upload-ready proof rows.";
  }

  switch (actor.audience) {
    case "coach":
      return "Coaches can review proof status, but not raw file uploads.";
    case "ds_admin":
      return "DS Admin stays outside student raw proof content.";
    default:
      return "No private proof rows are ready yet.";
  }
}

function getPrivateProofUploadEmptyMessage(
  actor: LocalActorContext,
  rows: PrivateProofUploadQueueRow[],
  sourceMode: "mock" | "supabase",
  config: PrivateProofUploadWriteConfig,
  signedInAsSelectedActor: boolean,
): string {
  if (rows.length > 0) {
    return "Refresh the route or change the local actor if you expected a different proof row here.";
  }

  if (sourceMode === "mock") {
    return "This route needs local Supabase reads to discover real proof metadata rows and their private upload status.";
  }

  if (actor.audience === "coach" || actor.audience === "ds_admin") {
    return "The private raw upload lane stays with the submitter and approved HQ cleanup roles only.";
  }

  if (!signedInAsSelectedActor) {
    return `${config.reason} Sign in as the same local seed user who owns the proof metadata row before attaching a file.`;
  }

  return "Start with the proof metadata step from a member action, then come back here to attach the raw file.";
}

function getPrivateProofUploadHelperText(params: {
  actor: LocalActorContext;
  isSubmitter: boolean;
  hasStoragePath: boolean;
  signedInAsSelectedActor: boolean;
  uploadEligible: boolean;
}): string {
  if (!params.signedInAsSelectedActor) {
    return "Sign in as the matching user before managing private proof files.";
  }

  if (params.hasStoragePath) {
    if (params.isSubmitter) {
      return "A private file is already attached. You can remove it if a corrected upload is needed.";
    }

    if (
      params.actor.audience === "admin" ||
      params.actor.audience === "super_admin"
    ) {
      return "HQ cleanup roles can remove the private file if policy or consent requires it.";
    }

    return "This private file is attached, but this role should not manage the raw upload.";
  }

  if (params.isSubmitter) {
    if (!params.uploadEligible) {
      return "Submit the related assignment before attaching its private proof file.";
    }

    return "This proof row is ready for one private upload. Public sharing stays off.";
  }

  return "Only the original submitter can attach the raw private file for this proof row.";
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
