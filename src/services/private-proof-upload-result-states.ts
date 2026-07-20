export type PrivateProofUploadResultCode =
  | "duplicate_upload"
  | "evidence_not_found"
  | "file_required"
  | "file_too_large"
  | "file_type_blocked"
  | "missing_auth"
  | "permission_denied"
  | "proof_uploaded"
  | "removal_reason_required"
  | "review_consent_required"
  | "server_error"
  | "upload_not_present"
  | "upload_removed"
  | "write_disabled";

export type PrivateProofUploadResultTone =
  | "error"
  | "info"
  | "success"
  | "warning";

export type PrivateProofUploadResultState = {
  code: PrivateProofUploadResultCode;
  title: string;
  plainEnglishMessage: string;
  nextStep: string;
  tone: PrivateProofUploadResultTone;
  success: boolean;
  retryAllowed: boolean;
  writesStorageObject: boolean;
  createsAuditLog: boolean;
};

const privateProofUploadResultStates = [
  {
    code: "proof_uploaded",
    title: "Private proof file attached",
    plainEnglishMessage:
      "The raw proof file is attached to its proof record for private MEDLIFE review only.",
    nextStep:
      "Keep the file private, keep public sharing off, and continue through the review path.",
    tone: "success",
    success: true,
    retryAllowed: false,
    writesStorageObject: true,
    createsAuditLog: true,
  },
  {
    code: "upload_removed",
    title: "Private proof file removed",
    plainEnglishMessage:
      "The private upload was removed and the proof record now points back to metadata only.",
    nextStep:
      "Upload a corrected file later if needed, or continue with metadata-only review.",
    tone: "success",
    success: true,
    retryAllowed: false,
    writesStorageObject: false,
    createsAuditLog: true,
  },
  {
    code: "write_disabled",
    title: "Private upload is still locked",
    plainEnglishMessage:
      "This route can explain the upload path, but private upload is not turned on in this environment.",
    nextStep:
      "Keep using the review path until the environment-specific upload flags and auth session are ready.",
    tone: "info",
    success: false,
    retryAllowed: false,
    writesStorageObject: false,
    createsAuditLog: false,
  },
  {
    code: "missing_auth",
    title: "Sign-in is required",
    plainEnglishMessage:
      "The app needs a signed-in Supabase user before it can attach or remove a private proof file.",
    nextStep: "Sign in as the same user who owns the proof item, then try again.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    writesStorageObject: false,
    createsAuditLog: false,
  },
  {
    code: "evidence_not_found",
    title: "Proof item was not found",
    plainEnglishMessage:
      "The selected proof record could not be found, so no private file was attached.",
    nextStep: "Create or refresh the proof metadata record first, then reopen this upload route.",
    tone: "error",
    success: false,
    retryAllowed: false,
    writesStorageObject: false,
    createsAuditLog: false,
  },
  {
    code: "permission_denied",
    title: "This user cannot manage that private file",
    plainEnglishMessage:
      "Private proof uploads belong to the original submitter or approved HQ cleanup roles only.",
    nextStep: "Switch to the correct user or ask HQ to handle the cleanup.",
    tone: "error",
    success: false,
    retryAllowed: false,
    writesStorageObject: false,
    createsAuditLog: false,
  },
  {
    code: "file_required",
    title: "Choose a file first",
    plainEnglishMessage:
      "A private upload needs a real file before the app can prepare the storage path.",
    nextStep: "Attach one allowed file, then submit again.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    writesStorageObject: false,
    createsAuditLog: false,
  },
  {
    code: "file_type_blocked",
    title: "That file type is not allowed",
    plainEnglishMessage:
      "This private upload lane only accepts the approved video, image, and PDF formats.",
    nextStep: "Use MP4, MOV, JPEG, PNG, WebP, or PDF for now.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    writesStorageObject: false,
    createsAuditLog: false,
  },
  {
    code: "file_too_large",
    title: "That file is too large",
    plainEnglishMessage:
      "The selected file is larger than the current private proof-upload size limit.",
    nextStep: "Compress the file or choose a smaller asset before retrying.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    writesStorageObject: false,
    createsAuditLog: false,
  },
  {
    code: "review_consent_required",
    title: "Review consent is required",
    plainEnglishMessage:
      "MEDLIFE cannot store a private raw proof file unless the submitter confirms private HQ review consent.",
    nextStep: "Check the private review consent box before uploading.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    writesStorageObject: false,
    createsAuditLog: false,
  },
  {
    code: "duplicate_upload",
    title: "A private file is already attached",
    plainEnglishMessage:
      "This proof item already has a private file attached, so the app blocked a duplicate upload.",
    nextStep: "Remove the existing file first if a corrected upload is needed.",
    tone: "warning",
    success: false,
    retryAllowed: false,
    writesStorageObject: false,
    createsAuditLog: false,
  },
  {
    code: "upload_not_present",
    title: "There is no private file to remove",
    plainEnglishMessage:
      "The proof record is already metadata-only, so there was no stored private file to remove.",
    nextStep: "Return to the upload queue or attach a new file instead.",
    tone: "info",
    success: false,
    retryAllowed: false,
    writesStorageObject: false,
    createsAuditLog: false,
  },
  {
    code: "removal_reason_required",
    title: "Add a short removal reason",
    plainEnglishMessage:
      "The audit trail needs a short explanation before a private file can be removed.",
    nextStep: "Explain why the file is being removed, then try again.",
    tone: "warning",
    success: false,
    retryAllowed: true,
    writesStorageObject: false,
    createsAuditLog: false,
  },
  {
    code: "server_error",
    title: "Something went wrong",
    plainEnglishMessage:
      "The app could not safely finish the private proof upload step. Public sharing and external sends stayed off.",
    nextStep: "Retry once, then inspect the audit path if the problem continues.",
    tone: "error",
    success: false,
    retryAllowed: true,
    writesStorageObject: false,
    createsAuditLog: false,
  },
] as const satisfies readonly PrivateProofUploadResultState[];

export function getPrivateProofUploadResultStates(): readonly PrivateProofUploadResultState[] {
  return privateProofUploadResultStates;
}

export function getPrivateProofUploadResultState(
  code: PrivateProofUploadResultCode,
): PrivateProofUploadResultState {
  const state = privateProofUploadResultStates.find((item) => item.code === code);

  if (!state) {
    throw new Error(`Unknown private proof upload result code: ${code}`);
  }

  return state;
}
