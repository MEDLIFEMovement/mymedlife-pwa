import { actionCommittees } from "@/data/mock-campaigns";
import { getCampaignShells } from "@/services/campaign-ops-service";
import { getWorkflowInventorySnapshot } from "@/services/sop-rollout-inventory";
import type { SopRole } from "@/shared/types/sop-builder";

export type SopLocalDraftProposal = {
  id: string;
  campaignSlug: string;
  title: string;
  summary: string;
  sourceLabel: string;
  sourceRoute: string;
  builderVersionHref: string;
  builderRoleMatrixHref?: string;
  rationale: string;
  proposedChanges: readonly string[];
  affectedRoles: readonly SopRole[];
  affectedRoutes: readonly string[];
  guardrails: readonly string[];
  status: "draft_proposal";
};

export type SopLocalDraftProposalEditor = {
  proposalId: string;
  title: string;
  summary: string;
  draftFields: readonly {
    label: string;
    currentValue: string;
    draftValue: string;
    note: string;
  }[];
  guardrails: readonly string[];
};

export type SopLocalDraftSession = {
  id: string;
  campaignSlug: string;
  title: string;
  summary: string;
  groups: readonly SopLocalDraftSessionGroup[];
  proposalIds: readonly string[];
  sourceRoutes: readonly string[];
  affectedRoles: readonly SopRole[];
  affectedRoutes: readonly string[];
  proposedChanges: readonly string[];
  builderVersionHref: string;
  status: "draft_session";
  guardrails: readonly string[];
};

export type SopLocalDraftSessionEditor = {
  sessionId: string;
  title: string;
  summary: string;
  draftRows: readonly {
    label: string;
    value: string;
    note: string;
  }[];
  guardrails: readonly string[];
};

export type SopLocalDraftSessionGroup = {
  id: string;
  title: string;
  summary: string;
  proposalIds: readonly string[];
  proposalTitles: readonly string[];
  sourceLabels: readonly string[];
  sourceRoutes: readonly string[];
  affectedRoles: readonly SopRole[];
  affectedRoutes: readonly string[];
  proposedChanges: readonly string[];
};

export function getSopLocalDraftProposals(
  campaignSlug?: string,
): readonly SopLocalDraftProposal[] {
  const proposals = [
    ...buildCampaignLinkProposals(),
    ...buildCommitteeOwnerProposals(),
    ...buildWorkflowPermissionProposals(),
  ];

  return campaignSlug
    ? proposals.filter((proposal) => proposal.campaignSlug === campaignSlug)
    : proposals;
}

export function getSopLocalDraftProposal(
  proposalId: string,
): SopLocalDraftProposal | null {
  return (
    getSopLocalDraftProposals().find((proposal) => proposal.id === proposalId) ??
    null
  );
}

export function getSopLocalDraftSession(
  campaignSlug: string,
): SopLocalDraftSession | null {
  const proposals = getSopLocalDraftProposals(campaignSlug);

  if (proposals.length === 0) {
    return null;
  }

  const groups = buildDraftSessionGroups(proposals);

  return {
    id: `draft-session-${campaignSlug}`,
    campaignSlug,
    title: `${toSessionTitle(campaignSlug)} local draft session`,
    summary:
      "Campaign-scoped package of local proposal-backed changes kept inside the builder version lane before any persisted template mutation path exists.",
    groups,
    proposalIds: proposals.map((proposal) => proposal.id),
    sourceRoutes: proposals.map((proposal) => proposal.sourceRoute),
    affectedRoles: uniqueRoles(proposals.flatMap((proposal) => proposal.affectedRoles)),
    affectedRoutes: uniqueStrings(
      proposals.flatMap((proposal) => proposal.affectedRoutes),
    ),
    proposedChanges: proposals.flatMap((proposal) => proposal.proposedChanges),
    builderVersionHref: `/admin/sop-builder/${campaignSlug}?tab=version&focus=draft-session-${campaignSlug}`,
    status: "draft_session",
    guardrails: [
      "The draft session groups local proposals; it does not persist template mutations.",
      "Review the session in the builder version lane before any publish posture is considered.",
      "No live writes, sends, or external automation run from this session.",
    ],
  };
}

export function getSopLocalDraftSessionEditor(
  campaignSlug: string,
): SopLocalDraftSessionEditor | null {
  const session = getSopLocalDraftSession(campaignSlug);
  const proposals = getSopLocalDraftProposals(campaignSlug);

  if (!session || proposals.length === 0) {
    return null;
  }

  return {
    sessionId: session.id,
    title: `Edit draft session: ${session.title}`,
    summary:
      "Review the campaign-wide package of local proposal changes as one mock-safe draft session before any persisted builder mutation path exists.",
    draftRows: [
      {
        label: "Proposal count",
        value: `${session.proposalIds.length} proposal-backed changes`,
        note: "How many local config proposals are currently bundled into this session.",
      },
      {
        label: "Review lanes",
        value: session.groups.map((group) => group.title).join(" | "),
        note: "Grouped review lanes keep template linkage, committee ownership, and permission posture readable as one packet.",
      },
      {
        label: "Affected roles",
        value: session.affectedRoles.join(", "),
        note: "Canonical roles touched across committee, permission, and workflow-review inputs.",
      },
      {
        label: "Source routes",
        value: session.sourceRoutes.length.toString(),
        note: "Upstream backend review routes feeding this session package.",
      },
      {
        label: "Bundled change themes",
        value: proposals
          .map((proposal) => proposal.title)
          .slice(0, 3)
          .join(" | "),
        note: "Representative local changes that should move together through version review.",
      },
    ],
    guardrails: session.guardrails,
  };
}

export function getSopLocalDraftProposalEditor(
  proposalId: string,
): SopLocalDraftProposalEditor | null {
  const proposal = getSopLocalDraftProposal(proposalId);

  if (!proposal) {
    return null;
  }

  if (proposal.id.startsWith("proposal-campaign-link-")) {
    return {
      proposalId: proposal.id,
      title: `Edit draft proposal: ${proposal.title}`,
      summary:
        "Review the current campaign/template linkage posture field by field before any persisted campaign configuration path exists.",
      draftFields: [
        {
          label: "Workflow source route",
          currentValue: proposal.affectedRoutes[0] ?? "/campaigns",
          draftValue: proposal.builderVersionHref,
          note: "The campaign shell should remain anchored to the builder-backed workflow record.",
        },
        {
          label: "Committee lane coverage",
          currentValue: proposal.proposedChanges[1] ?? "Current lanes not summarized",
          draftValue: proposal.proposedChanges[1] ?? "Keep current lane coverage",
          note: "Committee lanes should stay explicit in the workflow shape.",
        },
        {
          label: "Version review lane",
          currentValue: `/admin/sop-builder/${proposal.campaignSlug}?tab=version`,
          draftValue: proposal.builderVersionHref,
          note: "Use the builder version tab as the source-of-truth review lane.",
        },
      ],
      guardrails: proposal.guardrails,
    };
  }

  if (proposal.id.startsWith("proposal-committee-owner-")) {
    return {
      proposalId: proposal.id,
      title: `Edit draft proposal: ${proposal.title}`,
      summary:
        "Review owner mapping fields before any chapter role or committee membership mutation path exists.",
      draftFields: [
        {
          label: "Default owner posture",
          currentValue: proposal.proposedChanges[0] ?? "Current owner posture not summarized",
          draftValue: proposal.proposedChanges[0] ?? "Keep current owner posture",
          note: "Owner mapping should stay visible without becoming a live role assignment.",
        },
        {
          label: "Linked campaign surface",
          currentValue: proposal.affectedRoutes[1] ?? "/campaigns",
          draftValue: proposal.builderRoleMatrixHref ?? proposal.builderVersionHref,
          note: "Move comparison work into the builder role matrix, not scattered notes.",
        },
        {
          label: "Chapter route handoff",
          currentValue: proposal.affectedRoutes[0] ?? "/chapter?view=committees",
          draftValue: proposal.sourceRoute,
          note: "Keep chapter operations and backend review visibly connected.",
        },
      ],
      guardrails: proposal.guardrails,
    };
  }

  return {
    proposalId: proposal.id,
    title: `Edit draft proposal: ${proposal.title}`,
    summary:
      "Review permission and authority posture field by field before any permissions-matrix change or live workflow approval path exists.",
    draftFields: [
      {
        label: "Allowed roles",
        currentValue: proposal.affectedRoles.join(", "),
        draftValue: proposal.affectedRoles.join(", "),
        note: "Role coverage is reviewed here, but final authority still belongs to the permissions matrix.",
      },
      {
        label: "Allowed scopes",
        currentValue: proposal.proposedChanges[1] ?? "Current scopes not summarized",
        draftValue: proposal.proposedChanges[1] ?? "Keep current scopes",
        note: "Scope boundaries should stay explicit and non-generic.",
      },
      {
        label: "Authority review lane",
        currentValue: proposal.sourceRoute,
        draftValue: proposal.builderVersionHref,
        note: "Permission posture should stay attached to the builder version story.",
      },
    ],
    guardrails: proposal.guardrails,
  };
}

function buildCampaignLinkProposals(): readonly SopLocalDraftProposal[] {
  return getCampaignShells().map((campaign) => ({
    id: `proposal-campaign-link-${campaign.slug}`,
    campaignSlug: campaign.slug,
    title: `${campaign.name} template linkage review`,
    summary:
      "Keep campaign shells, committee lanes, and the SOP builder attached to one named workflow source before any persisted campaign-template linkage write exists.",
    sourceLabel: "Committee registry campaign link review",
    sourceRoute: `/admin/committees?section=campaigns&focus=${encodeURIComponent(campaign.slug)}&mode=template_link`,
    builderVersionHref: `/admin/sop-builder/${campaign.slug}?tab=version&focus=proposal-campaign-link-${encodeURIComponent(campaign.slug)}`,
    builderRoleMatrixHref: `/admin/sop-builder/${campaign.slug}?tab=role-matrix`,
    rationale:
      "The campaign shell should keep reading from the same workflow source that the backend builder and committee registry describe.",
    proposedChanges: [
      `Keep ${campaign.name} attached to the ${campaign.slug} workflow template.`,
      `Preserve committee lanes: ${campaign.actionCommitteeLanes.join(", ")}.`,
      "Review builder/version posture before any campaign-instance mutation path opens.",
    ],
    affectedRoles: ["committee_chair", "president", "coach", "sales_admin", "ds_admin"],
    affectedRoutes: [
      `/campaigns/${campaign.slug}`,
      `/admin/committees?section=campaigns&focus=${encodeURIComponent(campaign.slug)}`,
      `/admin/sop-builder/${campaign.slug}?tab=version`,
    ],
    guardrails: [
      "No campaign shell is relinked from this proposal.",
      "No template publish, schedule, or rollback behavior runs from this proposal alone.",
      "External sends and chapter writes remain blocked.",
    ],
    status: "draft_proposal",
  }));
}

function buildCommitteeOwnerProposals(): readonly SopLocalDraftProposal[] {
  const shells = getCampaignShells();

  return actionCommittees.flatMap((committee) => {
    const firstCampaign = shells.find((shell) =>
      shell.actionCommitteeLanes.includes(committee.lane),
    );

    if (!firstCampaign) {
      return [];
    }

    return [
      {
        id: `proposal-committee-owner-${committee.id}`,
        campaignSlug: firstCampaign.slug,
        title: `${committee.name} owner mapping`,
        summary:
          "Keep committee ownership explicit inside the workflow-engine model so chapter execution, review routes, and future template changes stay grounded in named lanes.",
        sourceLabel: "Committee registry owner mapping review",
        sourceRoute: `/admin/committees?section=committees&focus=${encodeURIComponent(committee.id)}&mode=owner_mapping`,
        builderVersionHref: `/admin/sop-builder/${firstCampaign.slug}?tab=version&focus=proposal-committee-owner-${encodeURIComponent(committee.id)}`,
        builderRoleMatrixHref: `/admin/sop-builder/${firstCampaign.slug}?tab=role-matrix`,
        rationale:
          "The committee lane should map into chapter and backend workflow ownership without requiring a live role reassignment path.",
        proposedChanges: [
          `Keep ${committee.typicalOwnerRole} as the default owner posture for ${committee.name}.`,
          `Preserve linked campaign coverage through ${firstCampaign.name}.`,
          "Use the builder role matrix as the final place to compare route ownership and scope.",
        ],
        affectedRoles: ["committee_member", "committee_chair", "president", "coach"],
        affectedRoutes: [
          "/chapter?view=committees",
          `/campaigns/${firstCampaign.slug}`,
          `/admin/sop-builder/${firstCampaign.slug}?tab=role-matrix`,
        ],
        guardrails: [
          "No committee membership or chapter role change is persisted from this proposal.",
          "The proposal frames owner mapping only; it does not rewrite workflow steps.",
          "Notifications and external sync remain disabled.",
        ],
        status: "draft_proposal",
      },
    ];
  });
}

function buildWorkflowPermissionProposals(): readonly SopLocalDraftProposal[] {
  return getWorkflowInventorySnapshot().permissions
    .filter(
      (permission) =>
        permission.approvalRequired ||
        permission.authorityStatus !== "permissions_matrix_linked",
    )
    .map((permission) => ({
      id: `proposal-permission-${permission.key}`,
      campaignSlug: permission.workflowSlug,
      title: `${permission.workflowName} ${permission.operation.replaceAll("_", " ")} permission review`,
      summary:
        "Carry operation-level permission posture into the builder version lane so role/scope review and publish posture stay connected before the permissions matrix is attached locally.",
      sourceLabel: "Permissions registry workflow operation review",
      sourceRoute: `/admin/permissions?section=routes&focus=admin_backend&permission=${encodeURIComponent(permission.key)}`,
      builderVersionHref: `/admin/sop-builder/${permission.workflowSlug}?tab=version&focus=proposal-permission-${encodeURIComponent(permission.key)}`,
      builderRoleMatrixHref: `/admin/sop-builder/${permission.workflowSlug}?tab=role-matrix`,
      rationale:
        "Operation permissions should remain a visible part of template readiness and not disappear into a separate policy table.",
      proposedChanges: [
        `Keep allowed roles as ${permission.allowedRoles.join(", ")}.`,
        `Keep allowed scopes as ${permission.allowedScopes.join(", ")}.`,
        `Preserve authority status: ${permission.authorityStatus.replaceAll("_", " ")}.`,
      ],
      affectedRoles: permission.allowedRoles,
      affectedRoutes: [
        "/admin/permissions",
        `/admin/sop-builder/${permission.workflowSlug}?tab=role-matrix`,
        `/admin/sop-builder/${permission.workflowSlug}?tab=version`,
      ],
      guardrails: [
        "No permissions matrix, auth, RLS, or storage policy is changed from this proposal.",
        "Builder review does not grant the operation or publish it live.",
        "All risky/live behavior remains blocked until separately approved.",
      ],
      status: "draft_proposal",
    }));
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values)];
}

function uniqueRoles(values: readonly SopRole[]) {
  return [...new Set(values)];
}

function buildDraftSessionGroups(
  proposals: readonly SopLocalDraftProposal[],
): readonly SopLocalDraftSessionGroup[] {
  const groups = [
    {
      id: "campaign_template_linkage",
      title: "Campaign template linkage",
      summary:
        "Keep each campaign shell explicitly attached to the named workflow template the builder owns.",
      match: (proposal: SopLocalDraftProposal) =>
        proposal.id.startsWith("proposal-campaign-link-"),
    },
    {
      id: "committee_owner_mapping",
      title: "Committee owner mapping",
      summary:
        "Review committee lane ownership and chapter handoff posture without turning on live role reassignment.",
      match: (proposal: SopLocalDraftProposal) =>
        proposal.id.startsWith("proposal-committee-owner-"),
    },
    {
      id: "workflow_permission_posture",
      title: "Workflow permission posture",
      summary:
        "Keep role, scope, and approval posture tied to the same version review story before any risky policy changes exist.",
      match: (proposal: SopLocalDraftProposal) =>
        proposal.id.startsWith("proposal-permission-"),
    },
  ] satisfies readonly {
    id: string;
    title: string;
    summary: string;
    match: (proposal: SopLocalDraftProposal) => boolean;
  }[];

  const mappedGroups: Array<SopLocalDraftSessionGroup | null> = groups
    .map((group) => {
      const matchingProposals = proposals.filter(group.match);

      if (matchingProposals.length === 0) {
        return null;
      }

      return {
        id: group.id,
        title: group.title,
        summary: group.summary,
        proposalIds: matchingProposals.map((proposal) => proposal.id),
        proposalTitles: matchingProposals.map((proposal) => proposal.title),
        sourceLabels: uniqueStrings(
          matchingProposals.map((proposal) => proposal.sourceLabel),
        ),
        sourceRoutes: uniqueStrings(
          matchingProposals.map((proposal) => proposal.sourceRoute),
        ),
        affectedRoles: uniqueRoles(
          matchingProposals.flatMap((proposal) => proposal.affectedRoles),
        ),
        affectedRoutes: uniqueStrings(
          matchingProposals.flatMap((proposal) => proposal.affectedRoutes),
        ),
        proposedChanges: matchingProposals.flatMap(
          (proposal) => proposal.proposedChanges,
        ),
      };
    });

  return mappedGroups.filter(
    (group): group is SopLocalDraftSessionGroup => group !== null,
  );
}

function toSessionTitle(campaignSlug: string) {
  return campaignSlug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
