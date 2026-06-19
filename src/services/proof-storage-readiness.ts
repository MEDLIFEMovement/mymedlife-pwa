type EnvSource = Record<string, string | undefined>;

export type ProofStorageBucket = "proof-submissions-private" | "proof-library-public";

export type ProofStorageAccessRole =
  | "submitter"
  | "chapter_leader"
  | "coach"
  | "admin"
  | "super_admin"
  | "ds_admin";

export type ProofStorageReadinessConfig = {
  uploadsEnabled: false;
  publicPublishingEnabled: false;
  reason: string;
  approvalRequired: string;
};

export type ProofFileUploadInput = {
  evidenceItemId: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  consentToMedlifeReview: boolean;
  consentToFutureSharing: boolean;
};

export type DisabledProofFileUploadAttempt = {
  success: false;
  reason: string;
  wouldUseBucket: ProofStorageBucket;
  wouldWriteTables: string[];
  normalizedFileName: string;
  requiresConsentFollowUp: boolean;
};

export type ProofStoragePlan = {
  privateSubmissionBucket: ProofStorageBucket;
  publicLibraryBucket: ProofStorageBucket;
  allowedMimeTypes: readonly string[];
  maxFileSizeMb: number;
  rawUploadReaders: readonly ProofStorageAccessRole[];
  publicAssetReaders: readonly ProofStorageAccessRole[];
  requiredMetadata: readonly string[];
  blockedUntilApproved: readonly string[];
};

const approvalRequired =
  "Nick must approve a later storage goal before proof files, videos, public URLs, or browser uploads are enabled.";

const allowedMimeTypes = [
  "video/mp4",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

const requiredMetadata = [
  "evidenceItemId",
  "chapterId",
  "submittedByUserId",
  "originalFileName",
  "mimeType",
  "byteSize",
  "storagePath",
  "consentToMedlifeReview",
  "consentToFutureSharing",
  "createdAt",
] as const;

export function getProofStorageReadinessConfig(
  env: EnvSource = process.env,
): ProofStorageReadinessConfig {
  if (env.MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE === "true") {
    if (env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES !== "true") {
      return {
        uploadsEnabled: false,
        publicPublishingEnabled: false,
        reason:
          "Private proof upload was requested, but local Supabase writes are still disabled.",
        approvalRequired,
      };
    }

    return {
      uploadsEnabled: false,
      publicPublishingEnabled: false,
      reason:
        "Private proof upload is approved for a later local write lane, but this readiness packet stays review-first until the route-specific write gate is checked.",
      approvalRequired,
    };
  }

  if (env.MYMEDLIFE_ALLOW_PROOF_UPLOADS === "true") {
    return {
      uploadsEnabled: false,
      publicPublishingEnabled: false,
      reason:
        "Proof uploads were requested, but Goal 17 keeps upload and publishing paths disabled until the private upload lane is explicitly enabled.",
      approvalRequired,
    };
  }

  return {
    uploadsEnabled: false,
    publicPublishingEnabled: false,
    reason:
      "Proof storage is planned, but file uploads and public publishing are disabled.",
    approvalRequired,
  };
}

export function getProofStoragePlan(): ProofStoragePlan {
  return {
    privateSubmissionBucket: "proof-submissions-private",
    publicLibraryBucket: "proof-library-public",
    allowedMimeTypes,
    maxFileSizeMb: 500,
    rawUploadReaders: ["submitter", "admin", "super_admin"],
    publicAssetReaders: [
      "submitter",
      "chapter_leader",
      "coach",
      "admin",
      "super_admin",
    ],
    requiredMetadata,
    blockedUntilApproved: [
      "browser uploads",
      "Supabase Storage bucket creation",
      "public proof URLs",
      "automatic proof publishing",
      "external moderation or AI summaries",
      "warehouse or n8n export of raw files",
    ],
  };
}

export function isAllowedProofMimeType(mimeType: string): boolean {
  return allowedMimeTypes.includes(mimeType as (typeof allowedMimeTypes)[number]);
}

export function prepareDisabledProofFileUpload(
  input: ProofFileUploadInput,
): DisabledProofFileUploadAttempt {
  return {
    success: false,
    reason: getProofStorageReadinessConfig().reason,
    wouldUseBucket: "proof-submissions-private",
    wouldWriteTables: [
      "storage.objects",
      "evidence_items",
      "events",
      "integration_events",
      "automation_outbox",
      "audit_logs",
    ],
    normalizedFileName: normalizeProofFileName(input.fileName),
    requiresConsentFollowUp:
      !input.consentToMedlifeReview || !input.consentToFutureSharing,
  };
}

export function normalizeProofFileName(fileName: string): string {
  const trimmed = fileName.trim().toLowerCase();
  return trimmed.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export function buildPrivateProofStoragePath(
  chapterToken: string,
  evidenceToken: string,
  fileName: string,
): string {
  return [
    "chapters",
    chapterToken,
    "evidence",
    evidenceToken,
    normalizeProofFileName(fileName),
  ].join("/");
}
