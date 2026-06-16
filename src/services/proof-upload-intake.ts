import type { LocalActorContext } from "@/services/local-actor-context";
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
  if (actor.audience === "ds_admin") {
    return hiddenWorkspace(
      "Proof upload intake hidden for DS Admin",
      "DS Admin can inspect disabled storage and outbox posture, but should not read or own student proof content.",
      input,
    );
  }

  const plan = getProofStoragePlan();
  const config = getProofStorageReadinessConfig();
  const checks = getProofUploadIntakeChecks(input);

  return {
    canReadWorkspace: true,
    title: getTitle(actor),
    summary:
      "This workspace previews the proof and bridge-video upload experience without uploading files. Students and leaders can see what consent, context, and file requirements will be needed before HQ can review or reuse proof.",
    uploadsEnabled: config.uploadsEnabled,
    publicPublishingEnabled: config.publicPublishingEnabled,
    externalExportsEnabled: false,
    maxFileSizeMb: plan.maxFileSizeMb,
    allowedMimeTypes: plan.allowedMimeTypes,
    checks,
    disabledAttempt: prepareDisabledProofFileUpload(input),
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
          "Supabase Storage buckets, file validation, upload RLS, and malware/moderation posture are not approved yet.",
      },
      {
        label: "Publish proof",
        reason:
          "Public proof sharing requires HQ approval, consent review, and a separate publishing workflow.",
      },
      {
        label: "Export raw proof",
        reason:
          "Raw bridge videos/testimonials must not be exported to n8n, warehouse, Power BI, HubSpot, Luma, SMS, email, or AI until explicitly approved.",
      },
    ],
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
      "n8n reminder packet disabled",
      "warehouse export disabled",
      "AI summary disabled",
      "public proof publishing disabled",
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
    futureStructuredEvents: [],
    futureOutboxDestinations: [],
  };
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "Prepare your proof upload";
    case "chapter_leader":
      return "Leader proof upload readiness";
    case "coach":
      return "Coach proof intake readout";
    case "admin":
      return "HQ proof upload readiness";
    case "super_admin":
      return "Full proof upload readiness";
    case "ds_admin":
      return "Proof upload intake hidden for DS Admin";
  }
}
