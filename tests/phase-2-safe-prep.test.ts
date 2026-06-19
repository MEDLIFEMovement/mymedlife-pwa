import { describe, expect, it } from "vitest";
import {
  getBlockedPhase2LiveActions,
  getPhase2SafePrepPacket,
  getPhase2WritePromotionSequence,
} from "@/services/phase-2-safe-prep";

describe("phase 2 safe prep packet", () => {
  it("allows safe prep while blocking live implementation", () => {
    const packet = getPhase2SafePrepPacket();

    expect(packet.status.canStartSafePrepNow).toBe(true);
    expect(packet.status.canStartLiveImplementation).toBe(false);
    expect(packet.counts.liveActionsAllowedNow).toBe(0);
    expect(packet.counts.externalWritesExpected).toBe(0);
    expect(packet.counts.secretsShown).toBe(0);
    expect(packet.status.blockedUntil).toEqual(
      expect.arrayContaining([
        "PR #94 review is complete",
        "Kiomi/DS confirms the stack and environment path",
      ]),
    );
    expect(
      packet.blockedLiveActions.every((action) => action.allowedNow === false),
    ).toBe(true);
  });

  it("tracks the Linear issue breakdown for Phase 2", () => {
    const packet = getPhase2SafePrepPacket();

    expect(packet.counts.linearIssues).toBe(16);
    expect(packet.counts.prepReady).toBe(1);
    expect(packet.counts.blockedPendingDsReview).toBe(5);
    expect(packet.counts.liveImplementationNotAuthorized).toBe(10);
    expect(packet.counts.inReview).toBe(1);
    expect(packet.counts.backlog).toBe(15);
    expect(packet.linearIssues.map((issue) => issue.id)).toEqual([
      "MED-471",
      "MED-472",
      "MED-473",
      "MED-474",
      "MED-475",
      "MED-476",
      "MED-477",
      "MED-478",
      "MED-479",
      "MED-480",
      "MED-481",
      "MED-482",
      "MED-483",
      "MED-484",
      "MED-485",
      "MED-486",
    ]);
    expect(packet.linearIssues.filter((issue) => issue.status === "In Review")).toEqual(
      [expect.objectContaining({ id: "MED-471" })],
    );
    expect(packet.linearIssues.filter((issue) => issue.status === "Backlog")).toHaveLength(
      15,
    );
    expect(
      packet.linearIssues.every((issue) => issue.liveWorkAllowed === false),
    ).toBe(true);
  });

  it("groups the Phase 2 issues into prep, blocked, and live-not-authorized lanes", () => {
    const packet = getPhase2SafePrepPacket();

    expect(packet.statusGroups.map((group) => group.key)).toEqual([
      "prep_ready",
      "blocked_pending_ds_review",
      "live_implementation_not_authorized",
    ]);
    expect(packet.statusGroups[0]).toEqual(
      expect.objectContaining({
        label: "Prep ready",
        issueIds: ["MED-471"],
      }),
    );
    expect(packet.statusGroups[1].issueIds).toEqual([
      "MED-472",
      "MED-473",
      "MED-474",
      "MED-475",
      "MED-486",
    ]);
    expect(packet.statusGroups[2].issueIds).toEqual([
      "MED-476",
      "MED-477",
      "MED-478",
      "MED-479",
      "MED-480",
      "MED-481",
      "MED-482",
      "MED-483",
      "MED-484",
      "MED-485",
    ]);
    expect(packet.statusGroups.every((group) => group.note.length > 20)).toBe(true);
  });

  it("locks the write promotion sequence to the approved one-at-a-time order", () => {
    const sequence = getPhase2WritePromotionSequence();

    expect(sequence).toHaveLength(10);
    expect(sequence.map((write) => write.key)).toEqual([
      "membership_approval",
      "leader_assignment_creation",
      "student_action_start",
      "proof_metadata_submission",
      "private_proof_upload",
      "leader_proof_review_decision",
      "hq_proof_sharing_decision",
      "points_kpi_ledger_materialization",
      "slt_checklist_completion",
      "staff_chapter_decision_coach_note",
    ]);
    expect(sequence.map((write) => write.issueId)).toEqual([
      "MED-476",
      "MED-477",
      "MED-478",
      "MED-479",
      "MED-480",
      "MED-481",
      "MED-482",
      "MED-483",
      "MED-484",
      "MED-485",
    ]);
    expect(
      sequence.every(
        (write, index) =>
          write.order === index + 1 &&
          write.liveEnabledNow === false &&
          write.externalWritesExpected === 0,
      ),
    ).toBe(true);
  });

  it("requires the same evidence gate for every future write", () => {
    const expectedGate = [
      "staging proof",
      "permission tests",
      "RLS/security coverage",
      "audit readback",
      "duplicate/error handling",
      "rollback step",
      "Linear/GitHub evidence",
    ];

    expect(
      getPhase2WritePromotionSequence().every(
        (write) =>
          JSON.stringify(write.gateChecklist) === JSON.stringify(expectedGate),
      ),
    ).toBe(true);
  });

  it("documents environment, auth, RLS, and owner boundaries without secrets", () => {
    const packet = getPhase2SafePrepPacket();

    expect(packet.environmentChecklist.map((item) => item.environment)).toEqual([
      "local",
      "staging",
      "production",
      "all",
    ]);
    expect(
      packet.environmentChecklist.every(
        (item) => item.secretExposureAllowed === false,
      ),
    ).toBe(true);
    expect(packet.authOnboardingPlan.map((step) => step.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(
      packet.rlsSecurityTestPlan.every((test) => test.mustPassBeforeWrite),
    ).toBe(true);
    expect(packet.ownerResponsibilities["Kiomi / DS"]).toEqual(
      expect.arrayContaining([
        "Own Supabase and Vercel production keys",
        "Approve RLS, storage, backup, monitoring, and security posture",
      ]),
    );
    expect(packet.reviewLinks.map((link) => link.href)).toEqual(
      expect.arrayContaining([
        "/admin/environment-setup",
        "/admin/auth-onboarding",
        "/admin/security-gate",
        "/admin/audit-log",
        "/admin/system-health",
        "/admin/launch-gate",
        "/admin/database-security",
        "/admin/operations",
      ]),
    );
    expect(packet.nextApprovalSteps.map((step) => step.key)).toEqual([
      "review_pr94",
      "confirm_stack",
      "confirm_connector_mode",
      "approve_foundation_lane",
      "start_write_sequence",
    ]);
    expect(
      packet.mockOnlyBoundaries.every((boundary) => boundary.length > 20),
    ).toBe(true);
    expect(packet.reviewerChecklist.map((step) => step.key)).toEqual([
      "review_phase1_pr",
      "walk_phase1_routes",
      "review_phase2_packet",
      "confirm_connector_boundary",
      "confirm_stack_and_owners",
      "hold_live_boundary",
    ]);
    expect(packet.reviewerChecklist[0]?.reviewTarget).toContain("PR #94");
    expect(packet.reviewerChecklist[2]?.reviewTarget).toContain("/admin/phase-2");
    expect(packet.reviewerChecklist.every((step) => step.successSignal.length > 30)).toBe(
      true,
    );
  });

  it("keeps live platform actions explicitly blocked", () => {
    const blocked = getBlockedPhase2LiveActions();

    expect(blocked.map((action) => action.key)).toEqual([
      "real_supabase_vercel_setup",
      "staging_production_credentials",
      "live_auth",
      "live_browser_writes",
      "proof_uploads",
      "live_db_migrations",
      "connector_writes",
      "production_deploys",
      "external_integrations",
      "external_automation",
    ]);
    expect(blocked.every((action) => action.allowedNow === false)).toBe(true);
  });

  it("references current Supabase and Vercel platform docs for DS review", () => {
    const packet = getPhase2SafePrepPacket();
    const referenceLabels = packet.officialReferences.map((reference) => reference.label);

    expect(referenceLabels).toEqual(
      expect.arrayContaining([
        "Supabase row level security",
        "Supabase Storage access control",
        "Vercel environments",
        "Vercel environment variables",
      ]),
    );
    expect(
      packet.officialReferences.every((reference) =>
        reference.url.startsWith("https://"),
      ),
    ).toBe(true);
  });
});
