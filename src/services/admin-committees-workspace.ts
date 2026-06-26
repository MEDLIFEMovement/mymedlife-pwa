import { actionCommittees } from "@/data/mock-campaigns";
import { getCampaignShells } from "@/services/campaign-ops-service";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import type { CampaignWorkflowSnapshot } from "@/shared/types/campaigns";

export type AdminCommitteesWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  nextStep: {
    href: string;
    label: string;
    detail: string;
  };
  committees: readonly CommitteeRegistryRow[];
  campaigns: readonly CommitteeCampaignRow[];
  selectedSection: CommitteeRegistrySection;
  sectionOptions: readonly CommitteeSectionOption[];
  focusedSection: CommitteeFocusedSection;
  configState: CommitteeConfigState | null;
  guardrails: readonly string[];
  counts: {
    committees: number;
    activeCampaignLinks: number;
    templateLinks: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export type CommitteeRegistryRow = {
  id: string;
  name: string;
  lane: string;
  typicalOwnerRole: string;
  purpose: string;
  linkedCampaigns: readonly string[];
  sampleMonthlyActions: readonly string[];
  chapterRoute: string;
  campaignRoute: string;
  reviewStatus: "active_in_mock" | "catalog_ready";
};

export type CommitteeCampaignRow = {
  slug: string;
  name: string;
  status: string;
  summary: string;
  committeeLanes: readonly string[];
  campaignRoute: string;
  builderRoute: string;
  workflowSnapshot: CampaignWorkflowSnapshot | null;
};

export type CommitteeRegistrySection = "committees" | "campaigns";
export type CommitteeRegistryMode = "owner_mapping" | "template_link";

export type CommitteeSectionOption = {
  key: CommitteeRegistrySection;
  label: string;
  href: string;
  selected: boolean;
};

export type CommitteeFocusCard = {
  key: string;
  eyebrow: string;
  title: string;
  detail: string;
  footer: string;
  statusLabel: string;
  workflowSnapshot?: CampaignWorkflowSnapshot | null;
  href?: string;
  hrefLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  configureHref?: string;
  configureLabel?: string;
  pills?: readonly string[];
  focusHref: string;
};

export type CommitteeFocusedSection = {
  title: string;
  summary: string;
  selectedKey: string | null;
  selectedCard: CommitteeFocusCard | null;
  cards: readonly CommitteeFocusCard[];
};

export type CommitteeConfigState = {
  mode: CommitteeRegistryMode;
  title: string;
  summary: string;
  pills: readonly string[];
  rows: readonly {
    label: string;
    value: string;
    note: string;
  }[];
  guardrails: readonly string[];
  returnHref: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  proposalHref?: string;
  proposalLabel?: string;
};

export function getAdminCommitteesWorkspace(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  search?: {
    focus?: string;
    section?: string;
    mode?: string;
  },
): AdminCommitteesWorkspace {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily !== "staff" && surfaceFamily !== "super_admin") {
    return {
      canReadWorkspace: false,
      title: "Committee registry hidden for this role",
      summary:
        "Committee ownership is an HQ/backend planning lane, not a DS, coach, or student operating route.",
      nextStep: {
        href: "/admin",
        label: "Back to admin",
        detail: "Return to the admin control center.",
      },
      committees: [],
      campaigns: [],
      selectedSection: "committees",
      sectionOptions: [],
      focusedSection: emptyFocusedSection(),
      configState: null,
      guardrails: [],
      counts: emptyCounts(),
    };
  }

  const campaignCatalog = getCampaignShells();
  const committees = actionCommittees.map((committee) => {
    const linkedCampaigns = campaignCatalog
      .filter((shell) => shell.actionCommitteeLanes.includes(committee.lane))
      .map((shell) => shell.name);
    const firstCampaignSlug =
      campaignCatalog.find((shell) => shell.actionCommitteeLanes.includes(committee.lane))
        ?.slug ?? "rush-month";

    return {
      id: committee.id,
      name: committee.name,
      lane: committee.lane,
      typicalOwnerRole: committee.typicalOwnerRole,
      purpose: committee.purpose,
      linkedCampaigns,
      sampleMonthlyActions: committee.sampleMonthlyActions.slice(0, 3),
      chapterRoute: "/chapter?view=committees",
      campaignRoute: `/campaigns/${firstCampaignSlug}`,
      reviewStatus:
        committee.lane === "Recruitment" ||
        committee.lane === "Social" ||
        committee.lane === "Med Talk" ||
        committee.lane === "Local Volunteering"
          ? "active_in_mock"
          : "catalog_ready",
    } satisfies CommitteeRegistryRow;
  });
  const campaigns: readonly CommitteeCampaignRow[] = campaignCatalog.map((shell) => ({
    slug: shell.slug,
    name: shell.name,
    status: shell.status,
    summary: shell.summary,
    committeeLanes: shell.actionCommitteeLanes,
    campaignRoute: `/campaigns/${shell.slug}`,
    builderRoute: `/admin/sop-builder/${shell.slug}?tab=steps`,
    workflowSnapshot: shell.workflowSnapshot ?? null,
  }));

  const activeCampaignLinks = committees.filter((committee) => {
    return committee.reviewStatus === "active_in_mock";
  }).length;
  const templateLinks = committees.length - activeCampaignLinks;
  const selectedSection = normalizeSection(search?.section);
  const sectionOptions = buildSectionOptions(selectedSection);
  const focusedSection = buildFocusedSection(
    selectedSection,
    search?.focus,
    committees,
    campaigns,
  );
  const configState = buildConfigState(
    selectedSection,
    normalizeMode(search?.mode),
    focusedSection.selectedKey,
    committees,
    campaigns,
  );

  return {
    canReadWorkspace: true,
    title: "Committee registry and owner lanes",
    summary: `This backend lane turns action committees into named operating objects instead of vague labels. ${data.chapter.name} stays the current chapter context, but the registry is shaped for reusable campaign setup later.`,
    nextStep: {
      href: "/admin/sop-builder/rush-month?tab=steps",
      label: "Open SOP builder",
      detail:
        "Committee lanes should map into the same SOP builder that already owns campaign steps, owner rules, and workflow review.",
    },
    committees,
    campaigns,
    selectedSection,
    sectionOptions,
    focusedSection,
    configState,
    guardrails: [
      "Committee configuration is mock-safe only. This route can frame ownership and linkage decisions without persisting chapter or template mutations.",
      "Chapter leader operational work stays on `/chapter`; this registry is the backend reference lane.",
      "No live role reassignment, reminder send, or external committee sync is enabled from this route.",
    ],
    counts: {
      committees: committees.length,
      activeCampaignLinks,
      templateLinks,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function normalizeSection(section: string | undefined): CommitteeRegistrySection {
  switch (section) {
    case "campaigns":
      return "campaigns";
    default:
      return "committees";
  }
}

function buildSectionOptions(
  selectedSection: CommitteeRegistrySection,
): readonly CommitteeSectionOption[] {
  return [
    {
      key: "committees",
      label: "Committee lanes",
      href: "/admin/committees?section=committees",
      selected: selectedSection === "committees",
    },
    {
      key: "campaigns",
      label: "Campaign coverage",
      href: "/admin/committees?section=campaigns",
      selected: selectedSection === "campaigns",
    },
  ];
}

function buildFocusedSection(
  selectedSection: CommitteeRegistrySection,
  focus: string | undefined,
  committees: readonly CommitteeRegistryRow[],
  campaigns: readonly CommitteeCampaignRow[],
): CommitteeFocusedSection {
  const cards =
    selectedSection === "committees"
      ? committees.map((committee) => ({
          key: committee.id,
          eyebrow: "Committee lane",
          title: committee.name,
          detail: committee.purpose,
          footer: `Typical owner role: ${committee.typicalOwnerRole}`,
          statusLabel: committee.reviewStatus.replaceAll("_", " "),
          href: committee.chapterRoute,
          hrefLabel: "Open chapter committees",
          secondaryHref: committee.campaignRoute,
          secondaryLabel: "Open linked campaign",
          configureHref: buildModeHref(selectedSection, committee.id, "owner_mapping"),
          configureLabel: "Review owner mapping",
          pills: [...committee.linkedCampaigns, ...committee.sampleMonthlyActions],
          focusHref: buildFocusHref(selectedSection, committee.id),
        }))
      : campaigns.map((campaign) => ({
          key: campaign.slug,
          eyebrow: campaign.workflowSnapshot ? "Workflow-backed campaign" : "Campaign shell",
          title: campaign.name,
          detail: campaign.summary,
          footer: campaign.workflowSnapshot
            ? `Committee lanes: ${campaign.committeeLanes.join(", ")}. Current phase: ${campaign.workflowSnapshot.currentPhaseLabel}.`
            : `Committee lanes: ${campaign.committeeLanes.join(", ")}`,
          statusLabel: campaign.status,
          workflowSnapshot: campaign.workflowSnapshot,
          href: campaign.campaignRoute,
          hrefLabel: "Open campaign",
          secondaryHref: campaign.builderRoute,
          secondaryLabel: "Open SOP builder",
          configureHref: buildModeHref(selectedSection, campaign.slug, "template_link"),
          configureLabel: "Review template link",
          pills: campaign.workflowSnapshot
            ? [
                ...campaign.committeeLanes,
                campaign.workflowSnapshot.versionLabel,
                `source ${campaign.workflowSnapshot.sourceKind.replaceAll("_", " ")}`,
              ]
            : campaign.committeeLanes,
          focusHref: buildFocusHref(selectedSection, campaign.slug),
        }));

  const selectedCard = cards.find((card) => card.key === focus) ?? cards[0] ?? null;

  return {
    title: selectedSection === "committees" ? "Committee registry" : "Campaign lane coverage",
    summary:
      selectedSection === "committees"
        ? "Keep committee owner lanes explicit so backend planning stays grounded in named roles, linked campaigns, and recurring work."
        : "Keep campaign coverage explicit so each lane shows which committee lanes it depends on and whether the existing SOP builder already backs the workflow state.",
    selectedKey: selectedCard?.key ?? null,
    selectedCard,
    cards,
  };
}

function buildFocusHref(section: CommitteeRegistrySection, focus: string) {
  return `/admin/committees?section=${section}&focus=${encodeURIComponent(focus)}`;
}

function buildModeHref(
  section: CommitteeRegistrySection,
  focus: string,
  mode: CommitteeRegistryMode,
) {
  return `/admin/committees?section=${section}&focus=${encodeURIComponent(focus)}&mode=${mode}`;
}

function normalizeMode(mode: string | undefined): CommitteeRegistryMode | null {
  switch (mode) {
    case "owner_mapping":
    case "template_link":
      return mode;
    default:
      return null;
  }
}

function buildConfigState(
  selectedSection: CommitteeRegistrySection,
  mode: CommitteeRegistryMode | null,
  selectedKey: string | null,
  committees: readonly CommitteeRegistryRow[],
  campaigns: readonly CommitteeCampaignRow[],
): CommitteeConfigState | null {
  if (!mode || !selectedKey) {
    return null;
  }

  if (selectedSection === "committees" && mode === "owner_mapping") {
    const committee = committees.find((entry) => entry.id === selectedKey);

    if (!committee) {
      return null;
    }

    return {
      mode,
      title: "Mock-safe committee config",
      summary:
        "Review how this committee lane should stay attached to owner responsibility, chapter surfaces, and the linked campaign workflow before any editable admin mutation is approved.",
      pills: [committee.lane, committee.reviewStatus.replaceAll("_", " ")],
      rows: [
        {
          label: "Committee lane",
          value: committee.name,
          note: "Named backend registry object for this action committee.",
        },
        {
          label: "Typical owner role",
          value: committee.typicalOwnerRole,
          note: "Who should normally own this lane in chapter operations.",
        },
        {
          label: "Linked campaigns",
          value: committee.linkedCampaigns.join(", ") || "None yet",
          note: "Campaigns currently reading this lane as part of the operating model.",
        },
        {
          label: "Chapter route",
          value: committee.chapterRoute,
          note: "Where chapter leaders should operate this lane in the product.",
        },
        {
          label: "Campaign route",
          value: committee.campaignRoute,
          note: "Best current workflow surface for checking what this lane should produce.",
        },
      ],
      guardrails: [
        "No chapter role reassignment or committee membership write runs from this state.",
        "Use the SOP builder for step logic; this route only frames committee-to-workflow ownership.",
        "Reminder sends, calendar writes, and external syncs stay blocked.",
      ],
      returnHref: buildFocusHref(selectedSection, committee.id),
      primaryHref: committee.chapterRoute,
      primaryLabel: "Open chapter committees",
      secondaryHref: committee.campaignRoute,
      secondaryLabel: "Open linked campaign",
      proposalHref: `/admin/sop-builder/${committee.campaignRoute.replace("/campaigns/", "")}?tab=version&focus=proposal-committee-owner-${encodeURIComponent(committee.id)}`,
      proposalLabel: "Open proposal in builder",
    };
  }

  if (selectedSection === "campaigns" && mode === "template_link") {
    const campaign = campaigns.find((entry) => entry.slug === selectedKey);

    if (!campaign) {
      return null;
    }

    return {
      mode,
      title: "Mock-safe campaign link config",
      summary:
        "Review how committee lanes, campaign routes, and the workflow template should stay linked inside the same backend lane before any persisted campaign-configuration write exists.",
      pills: [campaign.status, ...campaign.committeeLanes.slice(0, 2)],
      rows: [
        {
          label: "Campaign",
          value: campaign.name,
          note: "Current visible campaign shell using workflow-backed context.",
        },
        {
          label: "Committee lanes",
          value: campaign.committeeLanes.join(", "),
          note: "Lanes the chapter should recognize when operating this campaign.",
        },
        {
          label: "Campaign route",
          value: campaign.campaignRoute,
          note: "Student or leader-facing route family attached to the campaign lane.",
        },
        {
          label: "Builder route",
          value: campaign.builderRoute,
          note: "Backend template surface that should remain the source of truth.",
        },
        {
          label: "Workflow source",
          value: campaign.workflowSnapshot
            ? `${campaign.workflowSnapshot.versionLabel} · ${campaign.workflowSnapshot.sourceKind.replaceAll("_", " ")}`
            : "No workflow snapshot yet",
          note: "Current structured template/runtime source visible from the campaign shell.",
        },
      ],
      guardrails: [
        "This state does not relink the live campaign shell to a different template.",
        "Template publication and version changes still belong in the SOP builder version lane.",
        "No chapter writes, outbox sends, or external configuration changes run from here.",
      ],
      returnHref: buildFocusHref(selectedSection, campaign.slug),
      primaryHref: campaign.builderRoute,
      primaryLabel: "Open SOP builder",
      secondaryHref: campaign.campaignRoute,
      secondaryLabel: "Open campaign",
      proposalHref: `/admin/sop-builder/${campaign.slug}?tab=version&focus=proposal-campaign-link-${encodeURIComponent(campaign.slug)}`,
      proposalLabel: "Open proposal in builder",
    };
  }

  return null;
}

function emptyFocusedSection(): CommitteeFocusedSection {
  return {
    title: "Committee registry",
    summary: "Committee focus is unavailable for this role.",
    selectedKey: null,
    selectedCard: null,
    cards: [],
  };
}

function emptyCounts(): AdminCommitteesWorkspace["counts"] {
  return {
    committees: 0,
    activeCampaignLinks: 0,
    templateLinks: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
