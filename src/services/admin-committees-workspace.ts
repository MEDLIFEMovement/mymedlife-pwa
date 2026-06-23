import { actionCommittees, campaignShells } from "@/data/mock-campaigns";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceFamily } from "@/services/role-visibility";

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
};

export type CommitteeRegistrySection = "committees" | "campaigns";

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
  href?: string;
  hrefLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
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

export function getAdminCommitteesWorkspace(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  search?: {
    focus?: string;
    section?: string;
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
      guardrails: [],
      counts: emptyCounts(),
    };
  }

  const committees = actionCommittees.map((committee) => {
    const linkedCampaigns = campaignShells
      .filter((shell) => shell.actionCommitteeLanes.includes(committee.lane))
      .map((shell) => shell.name);
    const firstCampaignSlug =
      campaignShells.find((shell) => shell.actionCommitteeLanes.includes(committee.lane))
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
  const campaigns: readonly CommitteeCampaignRow[] = campaignShells.map((shell) => ({
    slug: shell.slug,
    name: shell.name,
    status: shell.status,
    summary: shell.summary,
    committeeLanes: shell.actionCommitteeLanes,
    campaignRoute: `/campaigns/${shell.slug}`,
    builderRoute: `/admin/sop-builder/${shell.slug}?tab=steps`,
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

  return {
    canReadWorkspace: true,
    title: "Committee registry and owner lanes",
    summary: `This backend lane turns action committees into named operating objects instead of vague labels. ${data.chapter.name} stays the current chapter context, but the registry is shaped for reusable campaign setup later.`,
    nextStep: {
      href: "/admin/sop-library",
      label: "Open SOP library",
      detail:
        "Committee lanes should map cleanly into campaign steps, owner rules, and future builder logic.",
    },
    committees,
    campaigns,
    selectedSection,
    sectionOptions,
    focusedSection,
    guardrails: [
      "Committee editing is still read-only. This route names the structure before any admin mutation surface exists.",
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
          pills: [...committee.linkedCampaigns, ...committee.sampleMonthlyActions],
          focusHref: buildFocusHref(selectedSection, committee.id),
        }))
      : campaigns.map((campaign) => ({
          key: campaign.slug,
          eyebrow: "Campaign shell",
          title: campaign.name,
          detail: campaign.summary,
          footer: `Committee lanes: ${campaign.committeeLanes.join(", ")}`,
          statusLabel: campaign.status,
          href: campaign.campaignRoute,
          hrefLabel: "Open campaign",
          secondaryHref: campaign.builderRoute,
          secondaryLabel: "Open SOP builder",
          pills: campaign.committeeLanes,
          focusHref: buildFocusHref(selectedSection, campaign.slug),
        }));

  const selectedCard = cards.find((card) => card.key === focus) ?? cards[0] ?? null;

  return {
    title: selectedSection === "committees" ? "Committee registry" : "Campaign lane coverage",
    summary:
      selectedSection === "committees"
        ? "Keep committee owner lanes explicit so backend planning stays grounded in named roles, linked campaigns, and recurring work."
        : "Keep campaign coverage explicit so each shell shows which committee lanes it depends on before any admin editing opens.",
    selectedKey: selectedCard?.key ?? null,
    selectedCard,
    cards,
  };
}

function buildFocusHref(section: CommitteeRegistrySection, focus: string) {
  return `/admin/committees?section=${section}&focus=${encodeURIComponent(focus)}`;
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
