import { getAdminControlCenterSummary } from "@/services/admin-control-center";
import {
  getCampaignShells,
  getProofLibraryItems,
} from "@/services/campaign-ops-service";
import { getCoachPortfolioReadiness } from "@/services/coach-portfolio-readiness";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadIntegrationOutbox } from "@/services/role-visibility";
import type { IntegrationEvent, OutboxItem } from "@/shared/types/domain";

export type StaffCommandCenterView =
  | "chapters"
  | "campaigns"
  | "proof_ugc"
  | "feed_studio"
  | "feed_analytics"
  | "hubspot"
  | "best_practices"
  | "admin";

export type StaffRiskFilter = "all" | "high" | "medium" | "low";

export type StaffCommandCenterMetric = {
  label: string;
  value: string;
  note: string;
};

export type StaffCommandCenterQuickAction = {
  label: string;
  href: string;
  helper: string;
  tone: "primary" | "secondary";
};

export type StaffCommandCenterViewOption = {
  key: StaffCommandCenterView;
  label: string;
  href: string;
};

export type StaffRiskFilterOption = {
  key: StaffRiskFilter;
  label: string;
  href: string;
};

export type StaffChapterPortfolioRow = {
  chapterId: string;
  chapterName: string;
  campus: string;
  coachName: string;
  leadName: string;
  campaignName: string;
  readinessScore: number;
  decision: "advance" | "hold" | "intervene";
  risk: "low" | "medium" | "high";
  proofPending: number;
  openFollowUps: number;
  nextStep: string;
  supportSummary: string;
  detailHref: string;
};

export type StaffChapterDrawerSignal = {
  label: string;
  status: string;
  detail: string;
};

export type StaffChapterDrawer = {
  chapterId: string;
  chapterName: string;
  campus: string;
  leadName: string;
  coachName: string;
  summary: string;
  recommendedDecision: string;
  focusItems: string[];
  quickLinks: {
    label: string;
    href: string;
  }[];
  recentSignals: StaffChapterDrawerSignal[];
};

export type StaffCampaignOperationCard = {
  slug: string;
  name: string;
  status: "active" | "planned" | "template";
  summary: string;
  primaryKpis: string[];
  actionCommitteeLanes: string[];
  recommendedStaffMove: string;
  integrationPosture: string;
  href: string;
};

export type StaffProofReviewItem = {
  id: string;
  sourceLabel: string;
  proofTypeLabel: string;
  sharingStatusLabel: string;
  consentStatusLabel: string;
  hesitationAddressed: string;
  summary: string;
  recommendedUse: string;
  reviewHref: string;
};

export type StaffFeedDraft = {
  id: string;
  title: string;
  formatLabel: string;
  curationReason: string;
  callToAction: string;
  publishStatusLabel: string;
  sourceHref: string;
};

export type StaffHubSpotSignal = {
  title: string;
  statusLabel: string;
  chapterLabel: string;
  detail: string;
  nextAction: string;
};

export type StaffBestPracticeCard = {
  id: string;
  title: string;
  summary: string;
  whyItWorks: string;
  nextMove: string;
  href: string;
};

export type StaffAdminSignal = {
  title: string;
  status: "ready_readonly" | "mock_only" | "blocked";
  metric: string;
  detail: string;
};

export type StaffAuditItem = {
  title: string;
  detail: string;
  posture: string;
};

export type StaffOutboxSummary = {
  total: number;
  disabled: number;
  mocked: number;
  hubspot: number;
  luma: number;
  n8n: number;
  warehouse: number;
};

export type StaffCommandCenter = {
  canReadCommandCenter: boolean;
  title: string;
  summary: string;
  sampleLabel: string | null;
  selectedView: StaffCommandCenterView;
  selectedChapterId: string | null;
  riskFilter: StaffRiskFilter;
  searchQuery: string;
  canReadDetailedOutbox: boolean;
  metrics: StaffCommandCenterMetric[];
  quickActions: StaffCommandCenterQuickAction[];
  viewOptions: StaffCommandCenterViewOption[];
  riskFilters: StaffRiskFilterOption[];
  chapterRows: StaffChapterPortfolioRow[];
  selectedChapter: StaffChapterDrawer | null;
  campaignCards: StaffCampaignOperationCard[];
  proofReviewItems: StaffProofReviewItem[];
  feedDrafts: StaffFeedDraft[];
  feedInsights: StaffCommandCenterMetric[];
  hubspotSignals: StaffHubSpotSignal[];
  bestPracticeCards: StaffBestPracticeCard[];
  adminSignals: StaffAdminSignal[];
  outboxSummary: StaffOutboxSummary;
  auditItems: StaffAuditItem[];
  leaderboardRows: {
    displayName: string;
    roleLabel: string;
    points: number;
    recognition: string;
  }[];
  safetyNote: string;
};

export type StaffCommandCenterOptions = {
  view?: string;
  risk?: string;
  query?: string;
  chapterId?: string;
};

const staffViewLabels: Record<StaffCommandCenterView, string> = {
  chapters: "Chapters",
  campaigns: "Campaigns",
  proof_ugc: "Proof / UGC",
  feed_studio: "Feed Studio",
  feed_analytics: "Feed Analytics",
  hubspot: "HubSpot",
  best_practices: "Best Practices",
  admin: "Admin",
};

const leadNameByChapter: Record<string, string> = {
  "Northview University MEDLIFE": "Priya President",
  "Lakeside University MEDLIFE": "Jordan Growth Lead",
  "Riverside State MEDLIFE": "Avery Recruitment Lead",
  "Mesa College MEDLIFE": "Taylor Transition Lead",
};

export function getStaffCommandCenter(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  options: StaffCommandCenterOptions = {},
): StaffCommandCenter {
  if (!canReadStaffCommandCenter(actor)) {
    return emptyStaffCommandCenter();
  }

  const riskFilter = parseRiskFilter(options.risk);
  const searchQuery = options.query?.trim() ?? "";
  const selectedView = parseStaffCommandCenterView(options.view);
  const chapterRows = getFilteredChapterRows(actor, data, riskFilter, searchQuery);
  const selectedChapterId = getSelectedChapterId(chapterRows, options.chapterId);
  const selectedChapter = getSelectedChapterDrawer(data, chapterRows, selectedChapterId);
  const proofReviewItems = getProofReviewItems();
  const campaignCards = getCampaignOperationCards();
  const recognitionSummary = getMemberRecognitionSummary(actor, data);
  const adminSummary = getAdminControlCenterSummary(data);
  const outboxSummary = summarizeOutbox(data.outboxItems);

  return {
    canReadCommandCenter: true,
    title:
      actor.audience === "coach"
        ? "Staff command center"
        : "Staff command center dashboard",
    summary:
      "Review chapter portfolio health, campaign operations, proof and consent gates, feed curation, HubSpot-ready follow-up posture, and admin health without turning on live writes.",
    sampleLabel:
      data.source.mode === "mock" ? "Staff command center sample" : null,
    selectedView,
    selectedChapterId,
    riskFilter,
    searchQuery,
    canReadDetailedOutbox: canReadIntegrationOutbox(actor),
    metrics: getMetrics(chapterRows, proofReviewItems, data, outboxSummary),
    quickActions: getQuickActions(selectedChapterId),
    viewOptions: getViewOptions(selectedView, riskFilter, searchQuery, selectedChapterId),
    riskFilters: getRiskFilterOptions(selectedView, riskFilter, searchQuery),
    chapterRows,
    selectedChapter,
    campaignCards,
    proofReviewItems,
    feedDrafts: getFeedDrafts(proofReviewItems),
    feedInsights: getFeedInsights(recognitionSummary, proofReviewItems, data),
    hubspotSignals: getHubSpotSignals(chapterRows, data.integrationEvents, data.outboxItems),
    bestPracticeCards: getBestPracticeCards(),
    adminSignals: getAdminSignals(adminSummary, outboxSummary),
    outboxSummary,
    auditItems: getAuditItems(data),
    leaderboardRows: recognitionSummary.leaderboard.map((row) => ({
      displayName: row.displayName,
      roleLabel: row.roleLabel,
      points: row.points,
      recognition: row.recognition,
    })),
    safetyNote:
      "This screen is intentionally mock-safe. HubSpot, Luma, n8n, warehouse, and any admin writes remain blocked or mocked until Nick approves live activation.",
  };
}

function canReadStaffCommandCenter(actor: LocalActorContext): boolean {
  return (
    actor.audience === "coach" ||
    actor.audience === "admin" ||
    actor.audience === "super_admin"
  );
}

function getFilteredChapterRows(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  riskFilter: StaffRiskFilter,
  searchQuery: string,
): StaffChapterPortfolioRow[] {
  const portfolio = getCoachPortfolioReadiness(actor, data);
  const normalizedQuery = searchQuery.toLowerCase();

  return portfolio.rows
    .map((row) => ({
      chapterId: row.chapterId,
      chapterName: row.chapterName,
      campus: row.campus,
      coachName: row.coachName,
      leadName: leadNameByChapter[row.chapterName] ?? "Leadership lane assigned",
      campaignName:
        row.chapterId === data.chapter.id ? data.campaign.name : "Chapter engagement",
      readinessScore: row.readinessScore,
      decision: row.decision,
      risk: row.risk,
      proofPending: row.proofPending,
      openFollowUps: row.openFollowUps,
      nextStep: row.nextStep,
      supportSummary: getSupportSummary(row),
      detailHref: getHref({
        view: "chapters",
        risk: riskFilter,
        query: searchQuery,
        chapterId: row.chapterId,
      }),
    }))
    .filter((row) => {
      if (riskFilter !== "all" && row.risk !== riskFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [row.chapterName, row.campus, row.coachName, row.leadName, row.nextStep]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
}

function getSupportSummary(row: {
  decision: "advance" | "hold" | "intervene";
  proofPending: number;
  openFollowUps: number;
}): string {
  if (row.decision === "intervene") {
    return `${row.openFollowUps} follow-ups are still open and proof is lagging.`;
  }

  if (row.decision === "hold") {
    return `${row.proofPending} proof items need review before the chapter moves forward.`;
  }

  return "Momentum is visible. Protect the story and keep the next action clear.";
}

function getSelectedChapterId(
  rows: StaffChapterPortfolioRow[],
  chapterId?: string,
): string | null {
  if (rows.length === 0) {
    return null;
  }

  if (chapterId && rows.some((row) => row.chapterId === chapterId)) {
    return chapterId;
  }

  return rows[0]?.chapterId ?? null;
}

function getSelectedChapterDrawer(
  data: ReadOnlyAppData,
  rows: StaffChapterPortfolioRow[],
  selectedChapterId: string | null,
): StaffChapterDrawer | null {
  const selectedRow = rows.find((row) => row.chapterId === selectedChapterId);

  if (!selectedRow) {
    return null;
  }

  const relevantSignals = data.integrationEvents
    .filter((event) => {
      if (selectedRow.chapterId === data.chapter.id) {
        return true;
      }

      return event.destination === "HubSpot" || event.destination === "n8n";
    })
    .slice(0, 3)
    .map((event) => ({
      label: event.title,
      status: event.status,
      detail: event.detail,
    }));

  return {
    chapterId: selectedRow.chapterId,
    chapterName: selectedRow.chapterName,
    campus: selectedRow.campus,
    leadName: selectedRow.leadName,
    coachName: selectedRow.coachName,
    summary:
      `${selectedRow.chapterName} is currently in ${selectedRow.campaignName} with ${selectedRow.proofPending} proof item(s) and ${selectedRow.openFollowUps} open follow-up(s).`,
    recommendedDecision: decisionToLabel(selectedRow.decision),
    focusItems: [
      selectedRow.nextStep,
      `${selectedRow.leadName} owns the next visible student push.`,
      `${selectedRow.coachName} should keep the chapter in a read-only, no-send support loop.`,
    ],
    quickLinks: [
      { label: "Open coach dashboard", href: "/coach" },
      { label: "Open proof library", href: "/proof-library" },
      { label: "Open campaign shell", href: "/campaigns/rush-month" },
    ],
    recentSignals: relevantSignals,
  };
}

function getCampaignOperationCards(): StaffCampaignOperationCard[] {
  return getCampaignShells().slice(0, 6).map((campaign) => ({
    slug: campaign.slug,
    name: campaign.name,
    status: campaign.status,
    summary: campaign.summary,
    primaryKpis: campaign.primaryKpis.slice(0, 3),
    actionCommitteeLanes: campaign.actionCommitteeLanes.slice(0, 3),
    recommendedStaffMove: getRecommendedStaffMove(campaign.status),
    integrationPosture: campaign.integrationPosture,
    href: `/campaigns/${campaign.slug}`,
  }));
}

function getRecommendedStaffMove(
  status: "active" | "planned" | "template",
): string {
  switch (status) {
    case "active":
      return "Protect momentum, follow proof quality, and keep the support loop tight.";
    case "planned":
      return "Clarify owners and next events before asking the chapter to do more.";
    case "template":
      return "Use this as a staff playbook, not as a blank page for custom process.";
  }
}

function getProofReviewItems(): StaffProofReviewItem[] {
  return getProofLibraryItems().slice(0, 5).map((item) => ({
    id: item.id,
    sourceLabel: item.sourceLabel,
    proofTypeLabel: proofTypeToLabel(item.proofType),
    sharingStatusLabel: sharingStatusToLabel(item.sharingStatus),
    consentStatusLabel: getConsentStatusLabel(item.proofType, item.sharingStatus),
    hesitationAddressed: item.hesitationAddressed,
    summary: item.summary,
    recommendedUse: item.recommendedUse,
    reviewHref: "/proof-library",
  }));
}

function getFeedDrafts(items: StaffProofReviewItem[]): StaffFeedDraft[] {
  return items.slice(0, 4).map((item, index) => ({
    id: `${item.id}-feed`,
    title: `${item.sourceLabel} post draft`,
    formatLabel: index % 2 === 0 ? "Reel / bridge video" : "Carousel / recap",
    curationReason: `${item.proofTypeLabel} that addresses ${item.hesitationAddressed.toLowerCase()}.`,
    callToAction:
      "Point students to the next action, event, or proof-friendly story rather than generic awareness copy.",
    publishStatusLabel:
      item.consentStatusLabel === "Consent confirmed"
        ? "Ready after HQ review"
        : "Hold until consent is clear",
    sourceHref: item.reviewHref,
  }));
}

function getFeedInsights(
  recognitionSummary: ReturnType<typeof getMemberRecognitionSummary>,
  proofReviewItems: StaffProofReviewItem[],
  data: ReadOnlyAppData,
): StaffCommandCenterMetric[] {
  const topRecognition = recognitionSummary.selectedMember;
  const consentReady = proofReviewItems.filter(
    (item) => item.consentStatusLabel === "Consent confirmed",
  ).length;

  return [
    {
      label: "Bridge story candidates",
      value: `${proofReviewItems.length}`,
      note: "Stories in the queue that can become future belief-building content.",
    },
    {
      label: "Consent ready",
      value: `${consentReady}`,
      note: "Proof items that look closest to safe reuse.",
    },
    {
      label: "Top student signal",
      value: topRecognition ? topRecognition.displayName : "None yet",
      note: topRecognition
        ? `${topRecognition.points} points and ${topRecognition.completedActions} completed actions.`
        : "Recognition is still mock-only.",
    },
    {
      label: "Events linked",
      value: `${data.kpiSummary.eventsLinked}`,
      note: "Mock Luma-linked events that can support follow-up and content.",
    },
  ];
}

function getHubSpotSignals(
  chapterRows: StaffChapterPortfolioRow[],
  integrationEvents: IntegrationEvent[],
  outboxItems: OutboxItem[],
): StaffHubSpotSignal[] {
  const hubspotEvents = integrationEvents.filter(
    (event) => event.destination === "HubSpot",
  );
  const hubspotOutbox = outboxItems.filter((item) => item.destination === "HubSpot");

  const baseSignals = hubspotEvents.map((event) => ({
    title: event.title,
    statusLabel: event.status,
    chapterLabel: "Northview University MEDLIFE",
    detail: event.detail,
    nextAction:
      "Keep CRM sends mocked and use this payload to verify fields, owner mapping, and timing.",
  }));

  const riskSignals = chapterRows
    .filter((row) => row.risk === "high" || row.decision === "hold")
    .slice(0, 2)
    .map((row) => ({
      title: `${row.chapterName} follow-up posture`,
      statusLabel: row.decision,
      chapterLabel: row.chapterName,
      detail:
        `${row.openFollowUps} open follow-up(s) and ${row.proofPending} proof item(s) suggest the chapter needs tighter staff support before any CRM handoff would matter.`,
      nextAction: row.nextStep,
    }));

  return [...baseSignals, ...riskSignals].concat(
    hubspotOutbox.map((item) => ({
      title: "HubSpot outbox packet",
      statusLabel: item.status,
      chapterLabel: "Shared HQ queue",
      detail: item.payloadSummary,
      nextAction:
        "Confirm the app-generated payload shape before anyone asks n8n or HubSpot to do real work.",
    })),
  );
}

function getBestPracticeCards(): StaffBestPracticeCard[] {
  return getCampaignShells()
    .filter((campaign) =>
      [
        "rush-month",
        "chapter-engagement",
        "leadership-transition",
        "start-a-chapter",
      ].includes(campaign.slug),
    )
    .map((campaign) => ({
      id: campaign.slug,
      title: campaign.name,
      summary: campaign.summary,
      whyItWorks: campaign.studentPromise,
      nextMove: campaign.coachFocus,
      href: `/campaigns/${campaign.slug}`,
    }));
}

function getAdminSignals(
  adminSummary: ReturnType<typeof getAdminControlCenterSummary>,
  outboxSummary: StaffOutboxSummary,
): StaffAdminSignal[] {
  return [
    {
      title: "Role coverage",
      status: "ready_readonly",
      metric: `${adminSummary.namedRoleCount}/${adminSummary.roleCoverage.length} named roles`,
      detail:
        "Local review personas exist for member, leader, coach, admin, DS admin, and super admin.",
    },
    {
      title: "System health",
      status: adminSummary.healthItems[0]?.status ?? "mock_only",
      metric: adminSummary.healthItems[0]?.label ?? "Read source",
      detail:
        adminSummary.healthItems[0]?.detail ??
        "System health remains read-only and environment-safe.",
    },
    {
      title: "Outbox posture",
      status: outboxSummary.disabled > 0 ? "blocked" : "mock_only",
      metric: `${outboxSummary.total} rows`,
      detail:
        "The app is generating integration-ready intent, but real sends remain disabled or mocked.",
    },
    {
      title: "Audit readiness",
      status: "mock_only",
      metric: "Preview only",
      detail:
        "Audit browsing exists as a launch-readiness surface even when table-backed writes are not yet approved.",
    },
  ];
}

function summarizeOutbox(items: OutboxItem[]): StaffOutboxSummary {
  return {
    total: items.length,
    disabled: items.filter((item) => item.status === "disabled").length,
    mocked: items.filter((item) => item.status === "mocked").length,
    hubspot: items.filter((item) => item.destination === "HubSpot").length,
    luma: items.filter((item) => item.destination === "Luma").length,
    n8n: items.filter((item) => item.destination === "n8n").length,
    warehouse: items.filter((item) => item.destination === "warehouse").length,
  };
}

function getAuditItems(data: ReadOnlyAppData): StaffAuditItem[] {
  if (data.auditLogs.length > 0) {
    return data.auditLogs.slice(0, 4).map((item) => ({
      title: `${item.action} -> ${item.target_table}`,
      detail:
        item.reason ??
        `Audit row for ${item.target_table} was recorded at ${item.created_at}.`,
      posture: "Recorded",
    }));
  }

  return [
    {
      title: "Assignment writes stay blocked",
      detail:
        "Leaders can preview assignment creation flows, but no chapter-assignment admin mutation is live yet.",
      posture: "Preview only",
    },
    {
      title: "Proof decisions stay review-only",
      detail:
        "HQ can inspect proof and consent posture, but sharing decisions do not publish anything externally.",
      posture: "Preview only",
    },
    {
      title: "Membership and role approvals are still guarded",
      detail:
        "This MVP shows readiness and review context without enabling staff role or chapter membership writes.",
      posture: "Preview only",
    },
  ];
}

function getMetrics(
  chapterRows: StaffChapterPortfolioRow[],
  proofReviewItems: StaffProofReviewItem[],
  data: ReadOnlyAppData,
  outboxSummary: StaffOutboxSummary,
): StaffCommandCenterMetric[] {
  return [
    {
      label: "Portfolio chapters",
      value: `${chapterRows.length}`,
      note: "Read-only chapter portfolio rows visible in the local staff surface.",
    },
    {
      label: "High-risk chapters",
      value: `${chapterRows.filter((row) => row.risk === "high").length}`,
      note: "Chapters that likely need intervention before the next support cycle.",
    },
    {
      label: "Proof queue",
      value: `${proofReviewItems.length}`,
      note: "UGC and proof items that need consent, clarity, or HQ review.",
    },
    {
      label: "HubSpot posture",
      value: `${outboxSummary.hubspot}`,
      note: `${data.integrationEvents.filter((event) => event.destination === "HubSpot").length} mocked CRM signal(s); no live send enabled.`,
    },
  ];
}

function getQuickActions(
  selectedChapterId: string | null,
): StaffCommandCenterQuickAction[] {
  return [
    {
      label: "Review risk chapters",
      href: getHref({ view: "chapters", risk: "high", chapterId: selectedChapterId }),
      helper: "Start with intervene lanes and open follow-up debt.",
      tone: "primary",
    },
    {
      label: "Open proof queue",
      href: getHref({ view: "proof_ugc", chapterId: selectedChapterId }),
      helper: "Check consent gates before anything becomes chapter proof.",
      tone: "secondary",
    },
    {
      label: "Check feed drafts",
      href: getHref({ view: "feed_studio", chapterId: selectedChapterId }),
      helper: "Curate content around real student action, not generic awareness.",
      tone: "secondary",
    },
    {
      label: "Open admin health",
      href: getHref({ view: "admin", chapterId: selectedChapterId }),
      helper: "Read launch posture, outbox safety, and audit readiness.",
      tone: "secondary",
    },
  ];
}

function getViewOptions(
  selectedView: StaffCommandCenterView,
  riskFilter: StaffRiskFilter,
  searchQuery: string,
  selectedChapterId: string | null,
): StaffCommandCenterViewOption[] {
  return (Object.keys(staffViewLabels) as StaffCommandCenterView[]).map((key) => ({
    key,
    label: staffViewLabels[key],
    href: getHref({
      view: key,
      risk: riskFilter,
      query: searchQuery,
      chapterId: selectedChapterId,
    }),
  }));
}

function getRiskFilterOptions(
  selectedView: StaffCommandCenterView,
  riskFilter: StaffRiskFilter,
  searchQuery: string,
): StaffRiskFilterOption[] {
  return [
    { key: "all" as const, label: "All risk" },
    { key: "high" as const, label: "High risk" },
    { key: "medium" as const, label: "Medium risk" },
    { key: "low" as const, label: "Low risk" },
  ].map((item) => ({
    ...item,
    href: getHref({
      view: selectedView,
      risk: item.key,
      query: searchQuery,
    }),
  }));
}

function getHref(options: {
  view: StaffCommandCenterView;
  risk?: StaffRiskFilter;
  query?: string;
  chapterId?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("view", options.view);

  if (options.risk && options.risk !== "all") {
    params.set("risk", options.risk);
  }

  if (options.query?.trim()) {
    params.set("q", options.query.trim());
  }

  if (options.chapterId) {
    params.set("chapter", options.chapterId);
  }

  const query = params.toString();
  return query ? `/staff?${query}` : "/staff";
}

function parseStaffCommandCenterView(view?: string): StaffCommandCenterView {
  if (!view) {
    return "chapters";
  }

  return (Object.keys(staffViewLabels) as StaffCommandCenterView[]).includes(
    view as StaffCommandCenterView,
  )
    ? (view as StaffCommandCenterView)
    : "chapters";
}

function parseRiskFilter(risk?: string): StaffRiskFilter {
  switch (risk) {
    case "high":
    case "medium":
    case "low":
      return risk;
    default:
      return "all";
  }
}

function decisionToLabel(decision: "advance" | "hold" | "intervene"): string {
  switch (decision) {
    case "advance":
      return "Advance";
    case "hold":
      return "Hold";
    case "intervene":
      return "Intervene";
  }
}

function proofTypeToLabel(
  proofType:
    | "bridge_video"
    | "testimonial_text"
    | "event_photo"
    | "alumni_ugc"
    | "chapter_recap",
): string {
  switch (proofType) {
    case "bridge_video":
      return "Bridge video";
    case "testimonial_text":
      return "Testimonial";
    case "event_photo":
      return "Event photo";
    case "alumni_ugc":
      return "Alumni UGC";
    case "chapter_recap":
      return "Chapter recap";
  }
}

function sharingStatusToLabel(
  status:
    | "needs_hq_review"
    | "approved_for_internal_learning"
    | "not_shared"
    | "future_public_candidate",
): string {
  switch (status) {
    case "needs_hq_review":
      return "Needs HQ review";
    case "approved_for_internal_learning":
      return "Internal learning";
    case "not_shared":
      return "Not shared";
    case "future_public_candidate":
      return "Public candidate";
  }
}

function getConsentStatusLabel(
  proofType:
    | "bridge_video"
    | "testimonial_text"
    | "event_photo"
    | "alumni_ugc"
    | "chapter_recap",
  sharingStatus:
    | "needs_hq_review"
    | "approved_for_internal_learning"
    | "not_shared"
    | "future_public_candidate",
): string {
  if (sharingStatus === "approved_for_internal_learning") {
    return "Internal only";
  }

  if (proofType === "bridge_video" || sharingStatus === "future_public_candidate") {
    return "Consent check needed";
  }

  if (proofType === "event_photo") {
    return "Consent confirmed";
  }

  return "Needs review";
}

function emptyStaffCommandCenter(): StaffCommandCenter {
  return {
    canReadCommandCenter: false,
    title: "Staff command center hidden for this role",
    summary:
      "This staff route is reserved for coach and HQ support personas. Members and chapter leaders should use their operating routes.",
    sampleLabel: null,
    selectedView: "chapters",
    selectedChapterId: null,
    riskFilter: "all",
    searchQuery: "",
    canReadDetailedOutbox: false,
    metrics: [],
    quickActions: [],
    viewOptions: [],
    riskFilters: [],
    chapterRows: [],
    selectedChapter: null,
    campaignCards: [],
    proofReviewItems: [],
    feedDrafts: [],
    feedInsights: [],
    hubspotSignals: [],
    bestPracticeCards: [],
    adminSignals: [],
    outboxSummary: {
      total: 0,
      disabled: 0,
      mocked: 0,
      hubspot: 0,
      luma: 0,
      n8n: 0,
      warehouse: 0,
    },
    auditItems: [],
    leaderboardRows: [],
    safetyNote: "No staff data is visible to this role.",
  };
}
