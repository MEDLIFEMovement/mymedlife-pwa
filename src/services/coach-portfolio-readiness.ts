import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

export type CoachPortfolioDecision = "advance" | "hold" | "intervene";
export type CoachPortfolioRisk = "low" | "medium" | "high";
export type CoachAssignmentMode =
  | "expansion_coach"
  | "portfolio_coach"
  | "handoff_pending";

export type CoachPortfolioChapter = {
  chapterId: string;
  chapterName: string;
  campus: string;
  campaignSlug: string;
  campaignName: string;
  coachAssignmentMode: CoachAssignmentMode;
  coachName: string;
  memberCount: number;
  readinessScore: number;
  statusLabel: "Healthy" | "At risk";
  decision: CoachPortfolioDecision;
  risk: CoachPortfolioRisk;
  activeCount: number;
  overdueCount: number;
  proofPending: number;
  openFollowUps: number;
  nextStep: string;
  coachChangePosture: "read_only";
  detailHref: string;
};

export type CoachPortfolioFilterKey =
  | "risk"
  | "campus"
  | "campaign"
  | "coachMode";

export type CoachPortfolioFilterGroup = {
  key: CoachPortfolioFilterKey;
  label: string;
  resetHref: string;
  options: Array<{
    label: string;
    value: string;
    count: number;
    href: string;
    isActive: boolean;
  }>;
};

export type CoachPortfolioReadiness = {
  canReadPortfolio: boolean;
  title: string;
  summary: string;
  dashboardOwnerLabel: string;
  routeBase: "/coach" | "/staff";
  campaignsHref: string;
  chapterHref: string;
  notesHref: string;
  riskReviewHref: string;
  averageHealthLabel: string;
  totalOverdueLabel: string;
  evidenceQueueLabel: string;
  aiSummaryLabel: string;
  aiSummaryBody: string;
  priorities: string[];
  selectedScopeLabel: string;
  activeFilters: {
    risk: string | null;
    campus: string | null;
    campaign: string | null;
    coachMode: string | null;
    query: string | null;
  };
  filterGroups: CoachPortfolioFilterGroup[];
  rows: CoachPortfolioChapter[];
  counts: {
    totalChapters: number;
    advance: number;
    hold: number;
    intervene: number;
    handoffsPending: number;
    coachChangesEnabled: 0;
  };
};

export function getCoachPortfolioReadiness(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  options?: {
    routeBase?: "/coach" | "/staff";
    campaign?: string;
    coachMode?: string;
    campus?: string;
    query?: string;
    risk?: string;
    source?: string;
  },
): CoachPortfolioReadiness {
  const surfaceFamily = getActorSurfaceFamily(actor);
  const routeBase =
    options?.routeBase ?? (surfaceFamily === "coach" ? "/coach" : "/staff");

  if (!canReadCoachPortfolio(surfaceFamily)) {
    return {
      canReadPortfolio: false,
      title: "Coach portfolio hidden for this role",
      summary:
        "Coach portfolio assignments are visible to coaches and HQ staff, not general members, chapter leaders, or DS Admin.",
      dashboardOwnerLabel: "",
      routeBase,
      campaignsHref: "",
      chapterHref: "",
      notesHref: "",
      riskReviewHref: "",
      averageHealthLabel: "0",
      totalOverdueLabel: "0",
      evidenceQueueLabel: "0",
      aiSummaryLabel: "",
      aiSummaryBody: "",
      priorities: [],
      selectedScopeLabel: "",
      activeFilters: {
        risk: null,
        campus: null,
        campaign: null,
        coachMode: null,
        query: null,
      },
      filterGroups: [],
      rows: [],
      counts: emptyCounts(),
    };
  }

  const allRows = buildPortfolioRows(actor, data, routeBase);
  const activeFilters = {
    risk: parseRiskFilter(options?.risk),
    campus: options?.campus?.trim() || null,
    campaign: options?.campaign?.trim() || null,
    coachMode: parseCoachModeFilter(options?.coachMode),
    query: options?.query?.trim() || null,
  };
  const rows = filterPortfolioRows(allRows, activeFilters);
  const displayRows = rows.length > 0 ? rows : allRows;
  const baseFilters = {
    campaign: activeFilters.campaign,
    coachMode: activeFilters.coachMode,
    query: activeFilters.query,
    risk: activeFilters.risk,
    source: options?.source?.trim() || null,
    view: "chapters" as const,
    campus: activeFilters.campus,
  };
  const routeOwnedRows = displayRows.map((row) => ({
    ...row,
    detailHref: buildPortfolioHref(routeBase, {
      ...baseFilters,
      chapter: row.chapterId,
      view: "chapter_detail",
    }),
  }));
  const priorityChapter = routeOwnedRows.find((row) => row.risk === "high") ?? routeOwnedRows[0];
  const filterGroups = buildFilterGroups(routeBase, allRows, activeFilters, baseFilters);

  return {
    canReadPortfolio: true,
    title: getPortfolioTitle(surfaceFamily),
    summary:
      "This local readout previews how expansion and portfolio coaches can compare assigned chapters. Coach reassignment remains an admin-controlled future workflow.",
    dashboardOwnerLabel:
      data.source.mode === "mock"
        ? `Hi, Coach David Kim · ${allRows.length} chapters assigned`
        : `Hi, ${actor.user.displayName} · ${allRows.length} chapter${allRows.length === 1 ? "" : "s"} assigned`,
    averageHealthLabel: `${Math.round(displayRows.reduce((total, row) => total + row.readinessScore, 0) / Math.max(displayRows.length, 1))}`,
    totalOverdueLabel: `${displayRows.reduce((total, row) => total + row.overdueCount, 0)}`,
    evidenceQueueLabel: `${displayRows.reduce((total, row) => total + row.proofPending, 0)}`,
    aiSummaryLabel: "AI Weekly Summary · Nov 11",
    aiSummaryBody:
      data.source.mode === "mock"
        ? "3 of 4 chapters are in Week 1 of Rush Month. UCLA is the strongest performer (82% health). UCSD needs immediate intervention — 15 overdue actions and low member engagement. USC has solid leads but no Luma event linked. Recommend prioritizing UCSD coach note this week."
        : "Use the portfolio to identify the chapters that need follow-up first, then keep notes and decisions narrow until write approval expands scope.",
    priorities:
      data.source.mode === "mock"
        ? [
            "UCSD: 15 overdue actions — intervene immediately",
            "USC: Luma event not linked to Rush Month",
            "UCLA: Strong — consider advancing to Phase 2",
          ]
        : displayRows.slice(0, 3).map((row) => `${row.chapterName}: ${row.nextStep}`),
    selectedScopeLabel: describeSelectedScope(displayRows, allRows.length, activeFilters),
    activeFilters,
    filterGroups,
    routeBase,
    campaignsHref: `${routeBase}?view=campaigns`,
    chapterHref: priorityChapter
      ? buildPortfolioHref(routeBase, {
          ...baseFilters,
          chapter: priorityChapter.chapterId,
          view: "chapter_detail",
        })
      : `${routeBase}?view=chapter_detail`,
    notesHref: `${buildPortfolioHref(routeBase, {
      ...baseFilters,
      view: "support_notes",
    })}#support-notes`,
    riskReviewHref: buildPortfolioHref(routeBase, {
      ...baseFilters,
      risk: "high",
      view: "chapter_detail",
    }),
    rows: routeOwnedRows,
    counts: {
      totalChapters: routeOwnedRows.length,
      advance: routeOwnedRows.filter((row) => row.decision === "advance").length,
      hold: routeOwnedRows.filter((row) => row.decision === "hold").length,
      intervene: routeOwnedRows.filter((row) => row.decision === "intervene").length,
      handoffsPending: routeOwnedRows.filter(
        (row) => row.coachAssignmentMode === "handoff_pending",
      ).length,
      coachChangesEnabled: 0,
    },
  };
}

function canReadCoachPortfolio(surfaceFamily: ActorSurfaceFamily): boolean {
  return (
    surfaceFamily === "coach" ||
    surfaceFamily === "staff" ||
    surfaceFamily === "super_admin"
  );
}

function buildPortfolioRows(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  routeBase: "/staff" | "/coach",
): CoachPortfolioChapter[] {
  const surfaceFamily = getActorSurfaceFamily(actor);
  const currentChapter: CoachPortfolioChapter = {
    chapterId: data.chapter.id,
    chapterName: data.chapter.name,
    campus: data.chapter.campus,
    campaignSlug: inferCampaignSlug(data.campaign.name),
    campaignName: data.campaign.name,
    coachAssignmentMode: "expansion_coach",
    coachName: surfaceFamily === "coach" ? actor.user.displayName : data.chapter.coachName,
    memberCount: 34,
    readinessScore: scoreFromDecision(data.kpiSummary.coachDecision),
    statusLabel: decisionToStatusLabel(data.kpiSummary.coachDecision),
    decision: data.kpiSummary.coachDecision,
    risk: riskFromDecision(data.kpiSummary.coachDecision),
    activeCount: 28,
    overdueCount: data.assignments.filter((assignment) => assignment.status !== "approved")
      .length,
    proofPending: data.kpiSummary.proofPending,
    openFollowUps: data.assignments.filter((assignment) => assignment.status !== "approved")
      .length,
    nextStep: "Review the Rush Month loop before the next chapter check-in.",
    coachChangePosture: "read_only",
    detailHref: `${routeBase}?view=chapter_detail`,
  };

  if (data.source.mode === "mock") {
    return sortPortfolioRows([
      {
        chapterId: data.chapter.id,
        chapterName: data.chapter.name,
        campus: data.chapter.campus,
        campaignSlug: "rush-month",
        campaignName: "Rush Month",
        coachAssignmentMode: "portfolio_coach",
        coachName: "David Kim",
        memberCount: 34,
        readinessScore: 82,
        statusLabel: "Healthy",
        decision: "advance",
        risk: "low",
        activeCount: 28,
        overdueCount: 3,
        proofPending: 7,
        openFollowUps: 3,
        nextStep: "Strong performer - consider advancing to Phase 2.",
        coachChangePosture: "read_only",
        detailHref: `${routeBase}?view=chapter_detail&chapter=${data.chapter.id}`,
      },
      {
        chapterId: "chapter-usc",
        chapterName: "USC MEDLIFE",
        campus: "USC",
        campaignSlug: "rush-month",
        campaignName: "Rush Month",
        coachAssignmentMode: "portfolio_coach",
        coachName: "David Kim",
        memberCount: 29,
        readinessScore: 61,
        statusLabel: "At risk",
        decision: "hold",
        risk: "medium",
        activeCount: 17,
        overdueCount: 8,
        proofPending: 12,
        openFollowUps: 8,
        nextStep: "Link the Rush Month Luma event and tighten follow-up ownership.",
        coachChangePosture: "read_only",
        detailHref: `${routeBase}?view=chapter_detail&chapter=chapter-usc`,
      },
      {
        chapterId: "chapter-uci",
        chapterName: "UCI MEDLIFE",
        campus: "UCI",
        campaignSlug: "local-volunteering-push",
        campaignName: "Local Volunteering Push",
        coachAssignmentMode: "portfolio_coach",
        coachName: "David Kim",
        memberCount: 22,
        readinessScore: 74,
        statusLabel: "Healthy",
        decision: "advance",
        risk: "low",
        activeCount: 18,
        overdueCount: 4,
        proofPending: 5,
        openFollowUps: 4,
        nextStep: "Keep the current cadence and package the strongest proof for reuse.",
        coachChangePosture: "read_only",
        detailHref: `${routeBase}?view=chapter_detail&chapter=chapter-uci`,
      },
      {
        chapterId: "chapter-ucsd",
        chapterName: "UCSD MEDLIFE",
        campus: "UCSD",
        campaignSlug: "slt-promotion",
        campaignName: "SLT Promotion",
        coachAssignmentMode: "expansion_coach",
        coachName: "David Kim",
        memberCount: 31,
        readinessScore: 45,
        statusLabel: "At risk",
        decision: "intervene",
        risk: "high",
        activeCount: 12,
        overdueCount: 15,
        proofPending: 18,
        openFollowUps: 15,
        nextStep: "Intervene now before Week 1 slips further.",
        coachChangePosture: "read_only",
        detailHref: `${routeBase}?view=chapter_detail&chapter=chapter-ucsd`,
      },
    ]);
  }

  return sortPortfolioRows([
    currentChapter,
    {
      chapterId: "chapter-lakeside",
      chapterName: "Lakeside University MEDLIFE",
      campus: "Lakeside University",
      campaignSlug: "rush-month",
      campaignName: "Rush Month",
      coachAssignmentMode: "portfolio_coach",
      coachName: surfaceFamily === "coach" ? actor.user.displayName : "Cam Coach",
      memberCount: 26,
      readinessScore: 84,
      statusLabel: "Healthy",
      decision: "advance",
      risk: "low",
      activeCount: 20,
      overdueCount: 2,
      proofPending: 1,
      openFollowUps: 2,
      nextStep: "Share the strongest social-event proof with HQ for future reuse.",
      coachChangePosture: "read_only",
      detailHref: `${routeBase}?view=chapter_detail`,
    },
    {
      chapterId: "chapter-riverside",
      chapterName: "Riverside State MEDLIFE",
      campus: "Riverside State",
      campaignSlug: "local-volunteering-push",
      campaignName: "Local Volunteering Push",
      coachAssignmentMode: "portfolio_coach",
      coachName: surfaceFamily === "coach" ? actor.user.displayName : "Cam Coach",
      memberCount: 24,
      readinessScore: 42,
      statusLabel: "At risk",
      decision: "intervene",
      risk: "high",
      activeCount: 11,
      overdueCount: 7,
      proofPending: 4,
      openFollowUps: 7,
      nextStep: "Schedule support because owners are stuck and proof quality is low.",
      coachChangePosture: "read_only",
      detailHref: `${routeBase}?view=chapter_detail`,
    },
    {
      chapterId: "chapter-mesa",
      chapterName: "Mesa College MEDLIFE",
      campus: "Mesa College",
      campaignSlug: "slt-promotion",
      campaignName: "SLT Promotion",
      coachAssignmentMode: "handoff_pending",
      coachName: "Expansion coach to portfolio coach",
      memberCount: 19,
      readinessScore: 61,
      statusLabel: "At risk",
      decision: "hold",
      risk: "medium",
      activeCount: 13,
      overdueCount: 5,
      proofPending: 2,
      openFollowUps: 5,
      nextStep: "Confirm the phase handoff before changing coach ownership.",
      coachChangePosture: "read_only",
      detailHref: `${routeBase}?view=chapter_detail`,
    },
  ]);
}

function decisionToStatusLabel(
  decision: CoachPortfolioDecision,
): CoachPortfolioChapter["statusLabel"] {
  return decision === "advance" ? "Healthy" : "At risk";
}

function scoreFromDecision(decision: CoachPortfolioDecision): number {
  switch (decision) {
    case "advance":
      return 82;
    case "hold":
      return 64;
    case "intervene":
      return 38;
  }
}

function riskFromDecision(decision: CoachPortfolioDecision): CoachPortfolioRisk {
  switch (decision) {
    case "advance":
      return "low";
    case "hold":
      return "medium";
    case "intervene":
      return "high";
  }
}

function sortPortfolioRows(rows: CoachPortfolioChapter[]): CoachPortfolioChapter[] {
  const decisionPriority: Record<CoachPortfolioDecision, number> = {
    intervene: 0,
    hold: 1,
    advance: 2,
  };

  return [...rows].sort((left, right) => {
    const decisionSort = decisionPriority[left.decision] - decisionPriority[right.decision];

    if (decisionSort !== 0) {
      return decisionSort;
    }

    return left.readinessScore - right.readinessScore;
  });
}

function getPortfolioTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "coach":
      return "Coach Dashboard";
    case "staff":
      return "Coach Dashboard";
    case "super_admin":
      return "Coach Dashboard";
    case "member":
    case "leader":
    case "ds_admin":
      return "Coach portfolio hidden for this role";
  }
}

function filterPortfolioRows(
  rows: readonly CoachPortfolioChapter[],
  filters: CoachPortfolioReadiness["activeFilters"],
) {
  const normalizedQuery = filters.query?.toLowerCase() ?? null;

  return rows.filter((row) => {
    if (filters.risk && row.risk !== filters.risk) {
      return false;
    }

    if (filters.campus && row.campus !== filters.campus) {
      return false;
    }

    if (filters.campaign && row.campaignSlug !== filters.campaign) {
      return false;
    }

    if (filters.coachMode && row.coachAssignmentMode !== filters.coachMode) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      row.chapterName,
      row.campus,
      row.campaignName,
      row.coachName,
      row.nextStep,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function buildFilterGroups(
  routeBase: "/coach" | "/staff",
  rows: readonly CoachPortfolioChapter[],
  activeFilters: CoachPortfolioReadiness["activeFilters"],
  baseFilters: {
    campaign: string | null;
    coachMode: string | null;
    query: string | null;
    risk: string | null;
    source: string | null;
    view: "chapters";
    campus: string | null;
  },
): CoachPortfolioFilterGroup[] {
  return [
    {
      key: "risk",
      label: "Risk",
      resetHref: buildPortfolioHref(routeBase, { ...baseFilters, risk: null }),
      options: uniqueOptions(rows, (row) => row.risk).map((value) => ({
        label: readableRisk(value),
        value,
        count: rows.filter((row) => row.risk === value).length,
        href: buildPortfolioHref(routeBase, { ...baseFilters, risk: value }),
        isActive: activeFilters.risk === value,
      })),
    },
    {
      key: "campus",
      label: "Campus",
      resetHref: buildPortfolioHref(routeBase, { ...baseFilters, campus: null }),
      options: uniqueOptions(rows, (row) => row.campus).map((value) => ({
        label: value,
        value,
        count: rows.filter((row) => row.campus === value).length,
        href: buildPortfolioHref(routeBase, { ...baseFilters, campus: value }),
        isActive: activeFilters.campus === value,
      })),
    },
    {
      key: "campaign",
      label: "Campaign",
      resetHref: buildPortfolioHref(routeBase, { ...baseFilters, campaign: null }),
      options: uniqueOptions(rows, (row) => row.campaignSlug).map((value) => {
        const matchingRow = rows.find((row) => row.campaignSlug === value);

        return {
          label: matchingRow?.campaignName ?? value,
          value,
          count: rows.filter((row) => row.campaignSlug === value).length,
          href: buildPortfolioHref(routeBase, { ...baseFilters, campaign: value }),
          isActive: activeFilters.campaign === value,
        };
      }),
    },
    {
      key: "coachMode",
      label: "Ownership",
      resetHref: buildPortfolioHref(routeBase, { ...baseFilters, coachMode: null }),
      options: uniqueOptions(rows, (row) => row.coachAssignmentMode).map((value) => ({
        label: readableCoachMode(value),
        value,
        count: rows.filter((row) => row.coachAssignmentMode === value).length,
        href: buildPortfolioHref(routeBase, { ...baseFilters, coachMode: value }),
        isActive: activeFilters.coachMode === value,
      })),
    },
  ];
}

function buildPortfolioHref(
  routeBase: "/coach" | "/staff",
  filters: {
    campaign?: string | null;
    campus?: string | null;
    chapter?: string | null;
    coachMode?: string | null;
    query?: string | null;
    risk?: string | null;
    source?: string | null;
    view?: "chapters" | "chapter_detail" | "campaigns" | "support_notes";
  },
) {
  const url = new URL(routeBase, "https://mymedlife.local");

  if (filters.view && filters.view !== "chapters") {
    url.searchParams.set("view", filters.view);
  } else {
    url.searchParams.set("view", "chapters");
  }

  if (filters.campaign) {
    url.searchParams.set("campaign", filters.campaign);
  }
  if (filters.campus) {
    url.searchParams.set("country", filters.campus);
  }
  if (filters.chapter) {
    url.searchParams.set("chapter", filters.chapter);
  }
  if (filters.coachMode) {
    url.searchParams.set("coachMode", filters.coachMode);
  }
  if (filters.query) {
    url.searchParams.set("q", filters.query);
  }
  if (filters.risk) {
    url.searchParams.set("risk", filters.risk);
  }
  if (filters.source) {
    url.searchParams.set("source", filters.source);
  }

  return `${url.pathname}${url.search}`;
}

function describeSelectedScope(
  rows: readonly CoachPortfolioChapter[],
  totalRows: number,
  filters: CoachPortfolioReadiness["activeFilters"],
) {
  const activeFilterCount = [
    filters.risk,
    filters.campus,
    filters.campaign,
    filters.coachMode,
    filters.query,
  ].filter(Boolean).length;

  if (activeFilterCount === 0) {
    return `Showing all ${totalRows} assigned chapters`;
  }

  return `${rows.length} of ${totalRows} assigned chapters match the current filters`;
}

function parseRiskFilter(value: string | undefined): CoachPortfolioRisk | null {
  return value === "low" || value === "medium" || value === "high" ? value : null;
}

function parseCoachModeFilter(value: string | undefined): CoachAssignmentMode | null {
  return value === "portfolio_coach" ||
    value === "expansion_coach" ||
    value === "handoff_pending"
    ? value
    : null;
}

function readableCoachMode(value: CoachAssignmentMode) {
  switch (value) {
    case "portfolio_coach":
      return "Portfolio coach";
    case "expansion_coach":
      return "Expansion coach";
    case "handoff_pending":
      return "Handoff pending";
  }
}

function readableRisk(value: CoachPortfolioRisk) {
  switch (value) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
  }
}

function uniqueOptions<T extends string>(
  rows: readonly CoachPortfolioChapter[],
  selector: (row: CoachPortfolioChapter) => T,
) {
  return Array.from(new Set(rows.map(selector)));
}

function inferCampaignSlug(campaignName: string) {
  return campaignName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyCounts(): CoachPortfolioReadiness["counts"] {
  return {
    totalChapters: 0,
    advance: 0,
    hold: 0,
    intervene: 0,
    handoffsPending: 0,
    coachChangesEnabled: 0,
  };
}
