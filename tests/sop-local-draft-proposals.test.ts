import { describe, expect, it } from "vitest";
import {
  getSopLocalDraftProposal,
  getSopLocalDraftProposalEditor,
  getSopLocalDraftProposals,
  getSopLocalDraftSession,
  getSopLocalDraftSessionEditor,
} from "@/services/sop-local-draft-proposals";

describe("sop local draft proposals", () => {
  it("builds campaign-scoped draft proposals that can feed the SOP builder", () => {
    const rushMonthProposals = getSopLocalDraftProposals("rush-month");

    expect(rushMonthProposals.length).toBeGreaterThan(0);
    expect(rushMonthProposals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "proposal-campaign-link-rush-month",
          sourceLabel: "Committee registry campaign link review",
        }),
      ]),
    );
  });

  it("exposes workflow permission proposals for version-lane review", () => {
    const proposal = getSopLocalDraftProposal(
      "proposal-permission-planning-goal-setting-publish_approve",
    );

    expect(proposal).toEqual(
      expect.objectContaining({
        campaignSlug: "planning-goal-setting",
        builderVersionHref:
          "/admin/sop-builder/planning-goal-setting?tab=version&focus=proposal-permission-planning-goal-setting-publish_approve",
        builderRoleMatrixHref:
          "/admin/sop-builder/planning-goal-setting?tab=role-matrix",
      }),
    );
    expect(proposal?.guardrails).toContain(
      "No permissions matrix, auth, RLS, or storage policy is changed from this proposal.",
    );
  });

  it("builds a field-by-field draft editor for local proposals", () => {
    const editor = getSopLocalDraftProposalEditor(
      "proposal-permission-planning-goal-setting-publish_approve",
    );

    expect(editor).toEqual(
      expect.objectContaining({
        proposalId: "proposal-permission-planning-goal-setting-publish_approve",
      }),
    );
    expect(editor?.draftFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Allowed roles",
        }),
        expect.objectContaining({
          label: "Authority review lane",
        }),
      ]),
    );
  });

  it("builds a campaign-level local draft session package", () => {
    const session = getSopLocalDraftSession("planning-goal-setting");

    expect(session).toEqual(
      expect.objectContaining({
        id: "draft-session-planning-goal-setting",
        status: "draft_session",
      }),
    );
    expect(session?.proposalIds.length).toBeGreaterThan(0);
    expect(session?.affectedRoles).toContain("president");
    expect(session?.groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "campaign_template_linkage",
          title: "Campaign template linkage",
        }),
        expect.objectContaining({
          id: "workflow_permission_posture",
          title: "Workflow permission posture",
        }),
      ]),
    );
  });

  it("builds a draft session editor for bundled proposal review", () => {
    const editor = getSopLocalDraftSessionEditor("planning-goal-setting");

    expect(editor).toEqual(
      expect.objectContaining({
        sessionId: "draft-session-planning-goal-setting",
      }),
    );
    expect(editor?.draftRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Proposal count",
        }),
        expect.objectContaining({
          label: "Review lanes",
        }),
        expect.objectContaining({
          label: "Bundled change themes",
        }),
      ]),
    );
  });
});
