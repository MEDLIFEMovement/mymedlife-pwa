import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import type { ProofLibraryItem } from "@/shared/types/campaigns";
import type {
  ContentSharingStatus,
  EvidenceItemRow,
  EvidenceType,
} from "@/shared/types/persistence";

export function getAppOwnedProofLibraryItems(
  data: ReadOnlyAppData,
): ProofLibraryItem[] {
  const assignmentTitles = new Map(
    data.assignments.map((assignment) => [assignment.id, assignment.title]),
  );
  const campaignSlug =
    data.campaignRows.find((campaign) => campaign.id === data.campaign.id)?.slug ??
    "current-campaign";

  return data.evidenceItemRows.map((row) =>
    toProofLibraryItem(row, {
      assignmentTitle:
        row.assignment_id === null
          ? null
          : assignmentTitles.get(row.assignment_id) ?? null,
      campaignSlug,
    }),
  );
}

function toProofLibraryItem(
  row: EvidenceItemRow,
  context: {
    assignmentTitle: string | null;
    campaignSlug: string;
  },
): ProofLibraryItem {
  return {
    id: row.id,
    campaignSlug: context.campaignSlug,
    sourceLabel:
      row.activity_label ??
      context.assignmentTitle ??
      getEvidenceTypeLabel(row.evidence_type),
    proofType: toProofType(row.evidence_type),
    hesitationAddressed:
      row.hesitation_addressed ?? "No hesitation context recorded.",
    summary: row.summary,
    sharingStatus: toSharingStatus(row.sharing_status),
    recommendedUse:
      row.target_audiences.length > 0
        ? `Approved audience posture: ${row.target_audiences.join(", ")}.`
        : "No broader reuse audience is approved.",
  };
}

function toProofType(
  evidenceType: EvidenceType,
): ProofLibraryItem["proofType"] {
  switch (evidenceType) {
    case "bridge_video":
      return "bridge_video";
    case "event_photo":
      return "event_photo";
    case "testimonial_text":
    case "text":
      return "testimonial_text";
    case "recap_note":
    case "attendance_log":
    case "feedback_form":
    case "tracker_screenshot":
    case "planning_doc":
      return "chapter_recap";
    case "link":
    case "external_link":
    case "mock_file":
      return "alumni_ugc";
  }
}

function toSharingStatus(
  sharingStatus: ContentSharingStatus,
): ProofLibraryItem["sharingStatus"] {
  switch (sharingStatus) {
    case "submitted":
    case "in_hq_review":
      return "needs_hq_review";
    case "approved_for_sharing":
      return "future_public_candidate";
    case "not_shared":
    case "archived":
      return "not_shared";
  }
}

function getEvidenceTypeLabel(evidenceType: EvidenceType) {
  return evidenceType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
