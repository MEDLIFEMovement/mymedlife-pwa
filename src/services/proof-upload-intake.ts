import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import {
  getProofStoragePlan,
  getProofStorageReadinessConfig,
  isAllowedProofMimeType,
  prepareDisabledProofFileUpload,
  type ProofFileUploadInput,
} from "@/services/proof-storage-readiness";

export type ProofUploadPurpose =
  | "bridge_video"
  | "testimonial_text"
  | "event_photo"
  | "attendance_or_feedback";

export type ProofUploadIntakeInput = ProofFileUploadInput & {
  purpose: ProofUploadPurpose;
  hesitationAddressed: string;
  contextSummary: string;
};

export type ProofUploadIntakeCheckKey =
  | "uploads_disabled"
  | "mime_type_allowed"
  | "file_size_allowed"
  | "review_consent_present"
  | "future_sharing_consent_decided"
  | "hesitation_addressed"
  | "context_summary_present"
  | "external_exports_disabled";

export type ProofUploadIntakeCheck = {
  key: ProofUploadIntakeCheckKey;
  label: string;
  passed: boolean;
  helpText: string;
};

export type ProofUploadStoragePacket = {
  title: string;
  targetRoute: "/proof-library/upload";
  futureFunction: "app.prepare_proof_upload_intake";
  privateBucket: string;
  publicBucket: string;
  storagePathPreview: string;
  normalizedFileName: string;
  currentResultCode: "upload_disabled";
  currentResultTitle: string;
  futureResultCode: "proof_upload_intake_recorded";
  futureResultTitle: string;
  readinessReason: string;
  requiredMetadata: readonly string[];
  rawUploadReaders: readonly string[];
  publicAssetReaders: readonly string[];
  readinessChecks: Array<{
    key: string;
    label: string;
    passed: boolean;
  }>;
  futureRecords: Array<{
    label: string;
    value: string;
  }>;
  moderationQueue: string[];
  blockedControls: string[];
};

export type ProofUploadIntakeWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  uploadsEnabled: false;
  publicPublishingEnabled: false;
  externalExportsEnabled: false;
  maxFileSizeMb: number;
  allowedMimeTypes: readonly string[];
  checks: ProofUploadIntakeCheck[];
  disabledAttempt: ReturnType<typeof prepareDisabledProofFileUpload>;
  consentChecklist: string[];
  blockedControls: Array<{
    label: string;
    reason: string;
  }>;
  storagePacket: ProofUploadStoragePacket | null;
  futureStructuredEvents: string[];
  futureOutboxDestinations: string[];
};

const defaultInput: ProofUploadIntakeInput = {
  evidenceItemId: "local-proof-upload-preview",
  fileName: "Rush Social Bridge Video.MOV",
  mimeType: "video/quicktime",
  byteSize: 42_000_000,
  consentToMedlifeReview: true,
  consentToFutureSharing: false,
  purpose: "bridge_video",
  hesitationAddressed: "I am worried I will not know anyone at MEDLIFE events.",
  contextSummary:
    "A first-year student explains how a social event helped them meet friends while taking action.",
};

export function getProofUploadIntakeWorkspace(
  actor: LocalActorContext,
  input: ProofUploadIntakeInput = defaultInput,
): ProofUploadIntakeWorkspace {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "ds_admin") {
    return hiddenWorkspace(
      "Proof upload intake hidden for DS Admin",
      "DS Admin can inspect disabled storage and outbox posture, but should not read or own student proof content.",
      input,
    );
  }

  const plan = getProofStoragePlan();
  const config = getProofStorageReadinessConfig();
  const checks = getProofUploadIntakeChecks(input);
  const disabledAttempt = prepareDisabledProofFileUpload(input);

  return {
    canReadWorkspace: true,
    title: getTitle(surfaceFamily),
    summary:
      "This workspace previews how proof and bridge videos will be prepared before uploads open. Students and leaders can see the consent, context, and file requirements that support later review and reuse.",
    uploadsEnabled: config.uploadsEnabled,
    publicPublishingEnabled: config.publicPublishingEnabled,
    externalExportsEnabled: false,
    maxFileSizeMb: plan.maxFileSizeMb,
    allowedMimeTypes: plan.allowedMimeTypes,
    checks,
    disabledAttempt,
    consentChecklist: [
      "Student agrees MEDLIFE HQ may review the proof privately.",
      "Student chooses whether the proof can be considered for future sharing.",
      "Proof names the hesitation or concern it helps answer.",
      "Proof includes enough context for another chapter or student to understand why it matters.",
      "HQ still makes the final sharing decision before anything is reused broadly.",
    ],
    blockedControls: [
      {
        label: "Upload file",
        reason:
          "Storage buckets, file validation, upload safety rules, and moderation posture are not open yet.",
      },
      {
        label: "Publish proof",
        reason:
          "Broader proof sharing still needs HQ approval, consent review, and a dedicated publishing flow.",
      },
      {
        label: "Export raw proof",
        reason:
          "Raw bridge videos and testimonials stay inside the app until broader handoffs are explicitly approved.",
      },
    ],
    storagePacket: buildProofUploadStoragePacket(input, checks, disabledAttempt),
    futureStructuredEvents: [
      "proof_upload_requested",
      "proof_upload_validated",
      "evidence_submitted",
      "proof_consent_recorded",
      "hq_proof_review_requested",
      "automation_outbox_recorded",
      "audit_log_recorded",
    ],
    futureOutboxDestinations: [
      "n8n reminder handoff paused",
      "warehouse export paused",
      "AI summary paused",
      "public proof publishing paused",
    ],
  };
}

export function getProofUploadIntakeChecks(
  input: ProofUploadIntakeInput,
): ProofUploadIntakeCheck[] {
  const plan = getProofStoragePlan();
  const maxBytes = plan.maxFileSizeMb * 1024 * 1024;

  return [
    {
      key: "uploads_disabled",
      label: "Uploads remain disabled",
      passed: !getProofStorageReadinessConfig().uploadsEnabled,
      helpText: "This route is a readiness preview, not a storage write path.",
    },
    {
      key: "mime_type_allowed",
      label: "File type is allowed for future upload",
      passed: isAllowedProofMimeType(input.mimeType),
      helpText: "Bridge videos, photos, PDFs, and web images are the first supported file types.",
    },
    {
      key: "file_size_allowed",
      label: "File size is within the future limit",
      passed: input.byteSize > 0 && input.byteSize <= maxBytes,
      helpText: `Future upload limit is ${plan.maxFileSizeMb} MB per file.`,
    },
    {
      key: "review_consent_present",
      label: "Private MEDLIFE review consent is present",
      passed: input.consentToMedlifeReview,
      helpText: "HQ cannot review proof without consent for MEDLIFE review.",
    },
    {
      key: "future_sharing_consent_decided",
      label: "Future sharing consent is explicitly decided",
      passed: typeof input.consentToFutureSharing === "boolean",
      helpText: "Students may decline future sharing; the decision still needs to be recorded.",
    },
    {
      key: "hesitation_addressed",
      label: "Proof addresses a specific hesitation",
      passed: input.hesitationAddressed.trim().length >= 12,
      helpText: "Proof should help another student or chapter overcome a concern.",
    },
    {
      key: "context_summary_present",
      label: "Context summary is useful",
      passed: input.contextSummary.trim().length >= 20,
      helpText: "HQ needs enough context to understand where and how the proof should be used.",
    },
    {
      key: "external_exports_disabled",
      label: "External exports stay disabled",
      passed: true,
      helpText: "No raw proof file is sent to n8n, warehouse, Power BI, HubSpot, Luma, email, SMS, or AI.",
    },
  ];
}

function hiddenWorkspace(
  title: string,
  summary: string,
  input: ProofUploadIntakeInput,
): ProofUploadIntakeWorkspace {
  const plan = getProofStoragePlan();
  const config = getProofStorageReadinessConfig();

  return {
    canReadWorkspace: false,
    title,
    summary,
    uploadsEnabled: config.uploadsEnabled,
    publicPublishingEnabled: config.publicPublishingEnabled,
    externalExportsEnabled: false,
    maxFileSizeMb: plan.maxFileSizeMb,
    allowedMimeTypes: plan.allowedMimeTypes,
    checks: [],
    disabledAttempt: prepareDisabledProofFileUpload(input),
    consentChecklist: [],
    blockedControls: [],
    storagePacket: null,
    futureStructuredEvents: [],
    futureOutboxDestinations: [],
  };
}

function buildProofUploadStoragePacket(
  input: ProofUploadIntakeInput,
  checks: ProofUploadIntakeCheck[],
  disabledAttempt: ReturnType<typeof prepareDisabledProofFileUpload>,
): ProofUploadStoragePacket {
  const plan = getProofStoragePlan();
  const config = getProofStorageReadinessConfig();

  return {
    title: "Proof upload path preview",
    targetRoute: "/proof-library/upload",
    futureFunction: "app.prepare_proof_upload_intake",
    privateBucket: plan.privateSubmissionBucket,
    publicBucket: plan.publicLibraryBucket,
    storagePathPreview: buildStoragePathPreview(input, disabledAttempt.normalizedFileName),
    normalizedFileName: disabledAttempt.normalizedFileName,
    currentResultCode: "upload_disabled",
    currentResultTitle: "Upload disabled",
    futureResultCode: "proof_upload_intake_recorded",
    futureResultTitle: "Proof upload intake recorded",
    readinessReason:
      "This preview maps the future storage path, metadata, and review checkpoints before uploads are allowed to save files.",
    requiredMetadata: plan.requiredMetadata,
    rawUploadReaders: plan.rawUploadReaders,
    publicAssetReaders: plan.publicAssetReaders,
    readinessChecks: [
      ...checks.map((check) => ({
        key: check.key,
        label: check.label,
        passed: check.passed,
      })),
      {
        key: "private_bucket_previewed",
        label: "Private bucket path is previewed",
        passed: disabledAttempt.wouldUseBucket === plan.privateSubmissionBucket,
      },
      {
        key: "public_default_locked",
        label: "Public proof URL stays locked",
        passed: !config.publicPublishingEnabled,
      },
      {
        key: "raw_readers_restricted",
        label: "Raw proof readers are restricted",
        passed:
          plan.rawUploadReaders.includes("admin") &&
          plan.rawUploadReaders.includes("super_admin") &&
          !plan.rawUploadReaders.includes("ds_admin"),
      },
    ],
    futureRecords: [
      {
        label: "Storage object",
        value: `${plan.privateSubmissionBucket}/${buildStoragePathPreview(
          input,
          disabledAttempt.normalizedFileName,
        )}`,
      },
      {
        label: "Evidence item",
        value: `storage_path -> ${disabledAttempt.normalizedFileName}`,
      },
      {
        label: "Structured event",
        value: "proof_upload_requested",
      },
      {
        label: "Held handoffs",
        value: "n8n, warehouse, AI summary, and public publish stay paused",
      },
      {
        label: "Audit action",
        value: "proof_upload_intake_prepared",
      },
    ],
    moderationQueue: [
      "HQ confirms private review consent before opening the file.",
      "HQ checks the context summary and hesitation addressed.",
      "HQ confirms whether future sharing consent is declined, pending, or granted.",
      "HQ decides whether the proof stays private, needs changes, or can move to a later sharing review.",
    ],
    blockedControls: [
      "Create signed upload URL",
      "Write storage object",
      "Persist storage_path",
      "Publish public proof URL",
      "Export raw proof to automation",
    ],
  };
}

function buildStoragePathPreview(
  input: ProofUploadIntakeInput,
  normalizedFileName: string,
): string {
  return [
    "chapters/chapter-a",
    "campaigns/rush-month",
    "evidence",
    input.evidenceItemId,
    normalizedFileName,
  ].join("/");
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "member":
      return "Prepare your proof upload";
    case "leader":
      return "Leader proof prep";
    case "coach":
      return "Coach proof prep view";
    case "staff":
      return "Proof intake desk";
    case "super_admin":
      return "Proof intake operations";
    case "ds_admin":
      return "Proof upload intake hidden for DS Admin";
  }
}
