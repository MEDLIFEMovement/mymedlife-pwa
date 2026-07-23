import { describe, expect, it } from "vitest";

import { getAppOwnedProofLibraryItems } from "@/services/proof-library-readback";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import type { EvidenceItemRow } from "@/shared/types/persistence";

describe("app-owned proof-library readback", () => {
  it("maps persisted evidence into the HQ review model without fixture rows", () => {
    const data = getMockReadOnlyAppData("test");
    const assignment = data.assignments[0];
    const evidence = evidenceRow({
      assignment_id: assignment.id,
      activity_label: "Community Health Night",
      hesitation_addressed: "I was unsure how to help locally.",
      sharing_status: "approved_for_sharing",
      target_audiences: ["chapter leaders"],
    });

    const items = getAppOwnedProofLibraryItems({
      ...data,
      source: {
        mode: "supabase",
        status: "supabase_ready",
        message: "Persisted proof data loaded.",
      },
      assignments: [{ ...assignment, title: "Host Community Health Night" }],
      evidenceItemRows: [evidence],
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: "evidence-live-1",
        sourceLabel: "Community Health Night",
        proofType: "testimonial_text",
        hesitationAddressed: "I was unsure how to help locally.",
        sharingStatus: "future_public_candidate",
        recommendedUse: "Approved audience posture: chapter leaders.",
      }),
    ]);
    expect(items.map((item) => item.sourceLabel)).not.toContain(
      "Tabling at Bruin Walk",
    );
  });

  it("returns an honest empty list when no persisted evidence exists", () => {
    const data = getMockReadOnlyAppData("test");

    expect(
      getAppOwnedProofLibraryItems({
        ...data,
        source: {
          mode: "supabase",
          status: "supabase_ready",
          message: "Persisted proof data loaded.",
        },
        evidenceItemRows: [],
      }),
    ).toEqual([]);
  });

  it("maps every persisted evidence and sharing posture without inventing reuse", () => {
    const data = getMockReadOnlyAppData("test");
    const assignment = data.assignments[0];
    const cases = [
      ["bridge_video", "bridge_video"],
      ["event_photo", "event_photo"],
      ["testimonial_text", "testimonial_text"],
      ["text", "testimonial_text"],
      ["recap_note", "chapter_recap"],
      ["attendance_log", "chapter_recap"],
      ["feedback_form", "chapter_recap"],
      ["tracker_screenshot", "chapter_recap"],
      ["planning_doc", "chapter_recap"],
      ["link", "alumni_ugc"],
      ["external_link", "alumni_ugc"],
      ["mock_file", "alumni_ugc"],
    ] as const;
    const sharingStatuses = [
      "submitted",
      "in_hq_review",
      "approved_for_sharing",
      "not_shared",
      "archived",
    ] as const;

    const items = getAppOwnedProofLibraryItems({
      ...data,
      source: {
        mode: "supabase",
        status: "supabase_ready",
        message: "Persisted proof data loaded.",
      },
      campaignRows: [],
      assignments: [assignment],
      evidenceItemRows: cases.map(([evidenceType], index) =>
        evidenceRow({
          id: `evidence-${index}`,
          assignment_id: index === 0 ? assignment.id : null,
          evidence_type: evidenceType,
          activity_label: null,
          target_audiences: [],
          sharing_status:
            sharingStatuses[index % sharingStatuses.length],
        }),
      ),
    });

    expect(items.map((item) => item.proofType)).toEqual(
      cases.map(([, proofType]) => proofType),
    );
    expect(items[0]).toEqual(
      expect.objectContaining({
        campaignSlug: "current-campaign",
        sourceLabel: assignment.title,
        sharingStatus: "needs_hq_review",
        recommendedUse: "No broader reuse audience is approved.",
      }),
    );
    expect(items[1].sourceLabel).toBe("Event Photo");
    expect(items.map((item) => item.sharingStatus)).toEqual([
      "needs_hq_review",
      "needs_hq_review",
      "future_public_candidate",
      "not_shared",
      "not_shared",
      "needs_hq_review",
      "needs_hq_review",
      "future_public_candidate",
      "not_shared",
      "not_shared",
      "needs_hq_review",
      "needs_hq_review",
    ]);
  });
});

function evidenceRow(
  overrides: Partial<EvidenceItemRow> = {},
): EvidenceItemRow {
  return {
    id: "evidence-live-1",
    assignment_id: null,
    chapter_id: "chapter-1",
    chapter_event_id: null,
    submitted_by_user_id: "member-1",
    evidence_type: "testimonial_text",
    summary: "A persisted member reflection.",
    url: null,
    storage_path: null,
    target_audiences: [],
    proof_categories: [],
    messenger_type: null,
    lifecycle_stage: null,
    hesitation_addressed: null,
    status: "approved",
    sharing_status: "in_hq_review",
    nps_score: null,
    activity_label: null,
    submitted_at: "2026-07-23T12:00:00Z",
    created_at: "2026-07-23T12:00:00Z",
    updated_at: "2026-07-23T12:00:00Z",
    ...overrides,
  };
}
