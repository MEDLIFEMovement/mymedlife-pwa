import Link from "next/link";
import type { ReactNode } from "react";

import { StaffPortfolioToolbar } from "@/components/staff-portfolio-toolbar";
import type {
  StaffAdminAuditRow,
  StaffAdminIntegrationStatus,
  StaffAdminOutboxRow,
  StaffBestPracticeCard,
  StaffCampaignExecutionRow,
  StaffCampaignOperationsOverview,
  StaffCampaignRiskCard,
  StaffChapterDrawer,
  StaffChapterPortfolioRow,
  StaffCommandCenter,
  StaffCommandCenterView,
  StaffFeedAnalyticsPost,
  StaffPortfolioSummaryCard,
  StaffProofReviewItem,
  StaffProofReviewPanel,
} from "@/services/staff-command-center";

type StaffCommandCenterPanelProps = {
  commandCenter: StaffCommandCenter;
};

export function StaffCommandCenterPanel({
  commandCenter,
}: StaffCommandCenterPanelProps) {
  if (!commandCenter.canReadCommandCenter) {
    return null;
  }

  const isAdminView = commandCenter.selectedView === "admin";
  const isBestPracticesView = commandCenter.selectedView === "best_practices";
  const isCampaignsView = commandCenter.selectedView === "campaigns";
  const isFeedStudioView = commandCenter.selectedView === "feed_studio";
  const isFeedAnalyticsView = commandCenter.selectedView === "feed_analytics";
  const isHubSpotView = commandCenter.selectedView === "hubspot";
  const isProofReviewView = commandCenter.selectedView === "proof_ugc";
  const isCoachSurface = commandCenter.routeBase === "/coach";
  const isCoachSharedCommandView =
    isCoachSurface &&
    (isBestPracticesView ||
      isFeedStudioView ||
      isFeedAnalyticsView ||
      isHubSpotView ||
      isProofReviewView);
  const isStaffChapterOverview =
    !isAdminView && !isCoachSurface && commandCenter.selectedView === "chapters";
  const useDenseStaffSurface =
    !isAdminView && !isCoachSurface && commandCenter.selectedView !== "chapters";
  const highRiskCount = commandCenter.chapterRows.filter((row) => row.risk === "high").length;
  const interventionCount = commandCenter.chapterRows.filter(
    (row) => row.decision === "intervene",
  ).length;
  const overviewInterventionCount = Number.parseInt(
    commandCenter.portfolioSummaryCards.find((card) => card.label === "Intervene Now")?.value ?? "",
    10,
  );
  const visibleInterventionCount = Number.isNaN(overviewInterventionCount)
    ? interventionCount
    : overviewInterventionCount;
  const followUpCount = commandCenter.chapterRows.reduce(
    (total, row) => total + row.openFollowUps,
    0,
  );
  const selectedViewLabel =
    commandCenter.viewOptions.find((option) => option.key === commandCenter.selectedView)
      ?.label ?? "Chapters";
  const selectedViewSurfaceTitle = getSelectedViewSurfaceTitle(commandCenter.selectedView);
  const selectedChapterLabel =
    commandCenter.selectedChapter?.chapterName ??
    selectedViewSurfaceTitle;
  const selectedBestPracticeCard = isBestPracticesView
    ? commandCenter.bestPracticeCards.find(
        (card) => card.id === commandCenter.selectedBestPracticeId,
      ) ?? null
    : null;
  const selectedBestPracticeCampaignLabel =
    commandCenter.bestPracticeCampaignFilters.find(
      (filter) => filter.key === commandCenter.bestPracticeCampaignFilter,
    )?.label ?? "All Campaigns";
  const selectedBestPracticeCountryLabel =
    commandCenter.bestPracticeCountryFilters.find(
      (filter) => filter.key === commandCenter.bestPracticeCountryFilter,
    )?.label ?? "All Countries";
  const bestPracticeTopScore = commandCenter.bestPracticeCards.reduce(
    (highest, card) => Math.max(highest, card.engagementScore),
    0,
  );
  const selectedProofQueueLabel =
    commandCenter.proofQueueFilters.find(
      (filter) => filter.key === commandCenter.proofQueueFilter,
    )?.label ?? "All";
  const selectedProofTypeLabel =
    commandCenter.proofTypeFilters.find(
      (filter) => filter.key === commandCenter.proofTypeFilter,
    )?.label ?? "All Types";
  const pendingProofCount = commandCenter.proofReviewItems.filter(
    (item) => item.reviewStatus === "pending",
  ).length;
  const consentBlockedProofCount = commandCenter.proofReviewItems.filter((item) =>
    item.consentStatusLabel === "No Consent" || item.consentStatusLabel === "Consent Pending",
  ).length;
  const selectedCampaignRiskCount = isCampaignsView
    ? commandCenter.campaignOperations.riskCards.find(
        (card) => card.key === commandCenter.campaignOperations.selectedRiskGroup,
      )?.count ?? commandCenter.campaignOperations.executionRows.length
    : 0;
  const selectedFeedAudienceLabel =
    commandCenter.feedStudio.audienceOptions.find(
      (option) => option.key === commandCenter.feedStudio.audienceMode,
    )?.label ?? "Campaign Chapters";
  const selectedFeedPreviewRoleLabel =
    commandCenter.feedStudio.previewRoleOptions.find(
      (option) => option.key === commandCenter.feedStudio.previewRole,
    )?.label ?? "Member";
  const highActionFeedPosts = commandCenter.feedAnalytics.posts.filter(
    (post) => post.actions >= 40,
  ).length;
  const selectedSurfaceLabel = isAdminView
    ? "Integration health, outbox review, and audit visibility"
    : isBestPracticesView
    ? selectedBestPracticeCard?.title ?? "Reusable operating patterns with chapter-share actions"
    : isCampaignsView
    ? commandCenter.campaignOperations.selectedCampaignName
    : isFeedStudioView
    ? commandCenter.feedStudio.selectedDraft?.title ?? "Compose and target content to student feeds"
    : isFeedAnalyticsView
    ? commandCenter.feedAnalytics.selectedPost?.title ?? "Content engagement tied to action"
    : isHubSpotView
    ? commandCenter.hubspotWorkspace.selectedChapterLabel
    : isProofReviewView
    ? commandCenter.selectedProofReview?.title ?? "Queue and moderation states for consent and reuse review"
    : selectedChapterLabel;
  const selectedCampaignName = commandCenter.campaignOperations.selectedCampaignName;
  const portfolioOverviewSummary = `${commandCenter.chapterRows.length} chapter${
    commandCenter.chapterRows.length === 1 ? "" : "s"
  } · ${selectedCampaignName} active · Last updated 2 min ago`;
  const prioritySummary = isAdminView
    ? commandCenter.adminWorkspace.subtitle
    : (
    commandCenter.selectedChapter?.summary ??
    (commandCenter.selectedView === "chapters"
      ? "Use the portfolio table, summary KPI band, and chapter drawer to decide where support should move next."
      : "Use the portfolio table, proof queue, and CRM posture together before escalating support.")
  );
  const priorityTitle = isAdminView
    ? `${highRiskCount} chapter${highRiskCount === 1 ? "" : "s"} need intervention`
    : isStaffChapterOverview
    ? `${visibleInterventionCount} chapter${visibleInterventionCount === 1 ? "" : "s"} need intervention`
    : (
    commandCenter.selectedChapter?.recommendedDecision ??
    "Keep the support move narrow and evidence-backed."
  );
  const surfaceEyebrow = isAdminView
    ? "myMEDLIFE Staff Command Center"
    : isCoachSurface
    ? "Coach portfolio"
    : isBestPracticesView
    ? "Best practice library"
    : isCampaignsView
    ? "Campaign operations"
    : isFeedStudioView
    ? "Feed curation studio"
    : isFeedAnalyticsView
    ? "Feed analytics"
    : isHubSpotView
    ? "HubSpot chapter intelligence"
    : isProofReviewView
    ? "Proof review queue"
    : "Portfolio posture";
  const surfaceOverviewLabel = isAdminView
    ? "System health"
    : isCoachSurface
    ? "Coach Command Center"
    : "Staff Command Center";
  const navigationTitle = "Views";
  const toolTitle = isCoachSurface ? "Coach tools" : "Quick tools";
  const priorityEyebrow = isCoachSurface ? "Coach priority" : "Staff priority";
  const filterEyebrow = isCoachSurface
    ? "Assigned chapter filters"
    : isStaffChapterOverview
    ? "Portfolio overview"
    : "Portfolio filters";
  const filterTitle = isCoachSurface
    ? "Assigned chapter table"
    : isStaffChapterOverview
    ? "Portfolio Overview"
    : "Chapter portfolio table";
  const filterCopy = isCoachSurface
    ? "Filter assigned chapters by risk or search by campus, lead, coach, or next step."
    : isStaffChapterOverview
    ? portfolioOverviewSummary
    : "Filter the portfolio by chapter risk or search by campus, coach, or next step.";
  const snapshotEyebrow = isCoachSurface ? "Coach snapshot" : "Portfolio snapshot";
  const snapshotSectionTitle = isCoachSurface
    ? "Which support signals are moving across assigned chapters?"
    : "Which support signals are moving across the portfolio?";
  const sidebarPills = isAdminView
    ? [
      selectedViewLabel,
      `${visibleInterventionCount} chapter${visibleInterventionCount === 1 ? "" : "s"} need intervention`,
      commandCenter.adminWorkspace.timestampLabel,
    ]
    : isBestPracticesView
    ? [
      selectedViewLabel,
      selectedBestPracticeCampaignLabel,
      selectedBestPracticeCountryLabel,
    ]
    : isCampaignsView
    ? [
      selectedViewLabel,
      commandCenter.campaignOperations.selectedCampaignName,
      commandCenter.campaignOperations.selectedRiskGroupLabel,
    ]
    : isFeedStudioView
    ? [
      selectedViewLabel,
      selectedFeedPreviewRoleLabel,
      selectedFeedAudienceLabel,
    ]
    : isFeedAnalyticsView
    ? [
      selectedViewLabel,
      commandCenter.feedAnalytics.selectedPost ? "Impact Analysis" : "Overview-first table",
      `${commandCenter.feedAnalytics.posts.length} posts`,
    ]
    : isHubSpotView
    ? [
      selectedViewLabel,
      commandCenter.hubspotWorkspace.selectedChapterLabel,
      commandCenter.hubspotWorkspace.warningLabel ? "Watch CRM posture" : "CRM matched",
    ]
    : isProofReviewView
    ? [
      selectedViewLabel,
      selectedProofQueueLabel,
      selectedProofTypeLabel,
    ]
    : [
      selectedViewLabel,
      selectedSurfaceLabel,
      `${commandCenter.chapterRows.length} visible chapter${commandCenter.chapterRows.length === 1 ? "" : "s"}`,
    ];
  const sidebarStats = isAdminView
    ? [
      {
        label: "Integrations",
        value: `${commandCenter.adminWorkspace.integrationStatuses.length}`,
        note: "Visible sync and system health checks",
      },
      {
        label: "Failed jobs",
        value: `${commandCenter.adminWorkspace.failedCount}`,
        note: "Automation outbox rows needing review",
        tone: commandCenter.adminWorkspace.failedCount > 0 ? "danger" : "default",
      },
      {
        label: "Audit rows",
        value: `${commandCenter.adminWorkspace.auditRows.length}`,
        note: "Most recent review-safe audit records",
      },
    ]
    : isBestPracticesView
    ? [
      {
        label: "Visible plays",
        value: `${commandCenter.bestPracticeCards.length}`,
        note: "Practices matching the current campaign and country filters",
      },
      {
        label: "Top score",
        value: `${bestPracticeTopScore}`,
        note: "Highest engagement score in the visible library",
      },
      {
        label: "Share actions",
        value: `${commandCenter.bestPracticeCards.length * 2}`,
        note: "Feed and coach handoff actions visible across the current cards",
      },
    ]
    : isCampaignsView
    ? [
      {
        label: "Visible execution rows",
        value: `${commandCenter.campaignOperations.executionRows.length}`,
        note: "Chapter rows visible in the current campaign operations table",
      },
      {
        label: "Risk lane",
        value: `${selectedCampaignRiskCount}`,
        note: `${commandCenter.campaignOperations.selectedRiskGroupLabel} rows in the current campaign state`,
      },
      {
        label: "Bulk actions",
        value: `${commandCenter.campaignOperations.bulkActions.length}`,
        note: "Reminder, coach review, best-practice, and intervention shortcuts",
      },
    ]
    : isFeedStudioView
    ? [
      {
        label: "Visible drafts",
        value: `${commandCenter.feedDrafts.length}`,
        note: "Draft posts available in the current content library",
      },
      {
        label: "Audience reach",
        value: commandCenter.feedStudio.estimatedReachLabel,
        note: "Projected student reach for the selected targeting mode",
      },
      {
        label: "Target chapters",
        value: commandCenter.feedStudio.targetChapterCountLabel,
        note: "Chapter count included in the current audience scope",
      },
    ]
    : isFeedAnalyticsView
    ? [
      {
        label: "Visible posts",
        value: `${commandCenter.feedAnalytics.posts.length}`,
        note: "Posts visible in the overview-first performance table",
      },
      {
        label: "Action-driving posts",
        value: `${highActionFeedPosts}`,
        note: "Posts currently driving 40 or more downstream actions",
      },
      {
        label: "Impact panel",
        value: commandCenter.feedAnalytics.selectedPost ? "Open" : "Ready",
        note: commandCenter.feedAnalytics.selectedPost
          ? "A selected post is showing impact analysis in the side panel"
          : "Select a post to open the impact-analysis panel",
      },
    ]
    : isHubSpotView
    ? [
      {
        label: "Chapter options",
        value: `${commandCenter.hubspotWorkspace.chapterOptions.length}`,
        note: "Visible chapters available in the HubSpot intelligence selector",
      },
      {
        label: "CRM metrics",
        value: `${commandCenter.hubspotWorkspace.crmProfileMetrics.length}`,
        note: "Profile metrics visible for the selected HubSpot chapter",
      },
      {
        label: "Funnel steps",
        value: `${commandCenter.hubspotWorkspace.funnelSteps.length}`,
        note: "Lifecycle checkpoints in the conversion funnel",
      },
    ]
    : isProofReviewView
    ? [
      {
        label: "Visible items",
        value: `${commandCenter.proofReviewItems.length}`,
        note: "Proof items visible in the current review queue",
      },
      {
        label: "Pending review",
        value: `${pendingProofCount}`,
        note: "Items still waiting on HQ reuse or moderation review",
      },
      {
        label: "Consent blockers",
        value: `${consentBlockedProofCount}`,
        note: "Visible items that still need consent resolution before reuse",
      },
    ]
    : [
      {
        label: "Visible chapters",
        value: `${commandCenter.chapterRows.length}`,
        note: "Current portfolio rows after filters",
      },
      {
        label: "High risk",
        value: `${highRiskCount}`,
        note: "Need support before the next loop slips",
        tone: "danger",
      },
      {
        label: "Proof queue",
        value: `${commandCenter.proofReviewItems.length}`,
        note: "UGC and consent items waiting on review",
      },
    ];
  const heroPrimaryValue = isAdminView
    ? `${commandCenter.adminWorkspace.failedCount}`
    : `${commandCenter.chapterRows.length}`;
  const heroPrimaryLabel = isAdminView ? "Failed jobs" : "Live rows";
  const heroContextLabels = isAdminView
    ? [
      `${highRiskCount} chapter${highRiskCount === 1 ? "" : "s"} need intervention`,
      `${commandCenter.adminWorkspace.integrationStatuses.length} integrations visible`,
      `${commandCenter.adminWorkspace.auditRows.length} audit row${commandCenter.adminWorkspace.auditRows.length === 1 ? "" : "s"}`,
    ]
    : [
      selectedViewLabel,
      `${interventionCount} intervention lane${interventionCount === 1 ? "" : "s"}`,
      `${followUpCount} open follow-up`,
    ];
  const heroMiniStats = isAdminView
    ? [
      {
        label: "Integrations",
        value: `${commandCenter.adminWorkspace.integrationStatuses.length}`,
        note: "HubSpot, Luma, warehouse, Power BI, n8n, and AI status rows.",
      },
      {
        label: "Audit rows",
        value: `${commandCenter.adminWorkspace.auditRows.length}`,
        note: "Most recent actions visible in the current review window.",
      },
    ]
    : [
      {
        label: "Proof queue",
        value: `${commandCenter.proofReviewItems.length}`,
        note: "Items still waiting on consent or curation review.",
      },
      {
        label: "Follow-up load",
        value: `${followUpCount}`,
        note: "Visible obligations across the current portfolio view.",
      },
    ];
  const railQuickActions = commandCenter.quickActions.slice(0, 4);
  const heroSummary = isStaffChapterOverview
    ? "Scan chapter health, open the drawer, and move support where risk is rising."
    : prioritySummary;
  const showOverviewHero =
    !isAdminView &&
    !isStaffChapterOverview &&
    !useDenseStaffSurface &&
    !isCoachSharedCommandView;
  const topStripPills = isBestPracticesView
    ? [
      selectedViewLabel,
      `${commandCenter.bestPracticeCards.length} share-ready`,
      selectedBestPracticeCampaignLabel,
      selectedBestPracticeCountryLabel,
    ]
    : isCampaignsView
    ? [
      selectedViewLabel,
      commandCenter.campaignOperations.selectedCampaignName,
      commandCenter.campaignOperations.selectedRiskGroupLabel,
    ]
    : isFeedStudioView
    ? [
      selectedViewLabel,
      selectedFeedPreviewRoleLabel,
      selectedFeedAudienceLabel,
    ]
    : isFeedAnalyticsView
    ? [
      selectedViewLabel,
      commandCenter.feedAnalytics.selectedPost ? "Impact Analysis" : "Overview-first table",
      `${commandCenter.feedAnalytics.posts.length} posts`,
    ]
    : isHubSpotView
    ? [
      selectedViewLabel,
      commandCenter.hubspotWorkspace.selectedChapterLabel,
      commandCenter.hubspotWorkspace.warningLabel ? "Watch CRM posture" : "CRM matched",
    ]
    : isProofReviewView
    ? [
      selectedViewLabel,
      selectedProofQueueLabel,
      selectedProofTypeLabel,
    ]
    : [
      selectedViewLabel,
      `${visibleInterventionCount} need intervention`,
      `${selectedCampaignName} active`,
    ];
  const heroShellClassName = isStaffChapterOverview
    ? "rounded-[1.65rem] border border-[#5d8ff6]/20 bg-[linear-gradient(150deg,#061a3a_0%,#08254f_58%,#081327_100%)] p-4 shadow-[0_14px_42px_rgba(0,0,0,0.16)]"
    : "rounded-[1.85rem] border border-[#5d8ff6]/22 bg-[linear-gradient(150deg,#061a3a_0%,#08254f_58%,#081327_100%)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]";
  const heroPrimarySizeClassName = isStaffChapterOverview ? "h-20 w-20" : "h-24 w-24";
  const heroTitleClassName = isStaffChapterOverview
    ? "text-[1.7rem] font-semibold leading-tight text-white"
    : "text-[2rem] font-semibold leading-tight text-white";
  const useCompactStaffToolbar = !isCoachSurface;
  const useMinimalStaffChapterStrip = isStaffChapterOverview;
  const sourceContext = commandCenter.sourceContext;
  const showMemberHomeAdminHandoffFirst =
    isAdminView && sourceContext?.eyebrow === "Member app handoff";
  const showTopViewStrip = !isCoachSurface && !showMemberHomeAdminHandoffFirst;
  const showSidebarQuickActions = isCoachSurface && !useCompactStaffToolbar;
  const outerShellClassName = useCompactStaffToolbar
    ? "grid gap-4"
    : "grid gap-4 xl:grid-cols-[18.5rem_minmax(0,1fr)] xl:items-start";
  const topShellClassName = useCompactStaffToolbar
    ? useMinimalStaffChapterStrip
      ? "rounded-[1.2rem] border border-[#5d8ff6]/24 bg-[linear-gradient(160deg,#0b2a5d_0%,#0a3b88_52%,#081a3a_100%)] px-4 py-2.5 shadow-[0_14px_36px_rgba(2,14,38,0.14)]"
      : "rounded-[1.3rem] border border-[#5d8ff6]/30 bg-[linear-gradient(160deg,#0b2a5d_0%,#0a3b88_52%,#081a3a_100%)] px-4 py-3 shadow-[0_20px_60px_rgba(2,14,38,0.16)]"
    : "app-surface rounded-[1.4rem] p-4";
  const topShellEyebrowClassName = useCompactStaffToolbar
    ? useMinimalStaffChapterStrip
      ? "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/62"
      : "text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/56"
    : "app-eyebrow app-eyebrow-slate";
  const topShellTitleClassName = useCompactStaffToolbar
    ? useMinimalStaffChapterStrip
      ? "text-sm font-semibold leading-tight text-white/88"
      : "text-[1.42rem] font-semibold leading-tight text-white"
    : "mt-2 text-[1.1rem] font-semibold leading-tight text-slate-950";
  const topShellTimestampClassName = useCompactStaffToolbar
    ? "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/48"
    : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400";
  const topShellNavClassName = useCompactStaffToolbar
    ? "flex snap-x gap-2 overflow-x-auto pb-1 xl:flex-1"
    : "flex snap-x gap-2 overflow-x-auto pb-1";
  const topStripAlertLabel =
    visibleInterventionCount > 0
      ? `${visibleInterventionCount} chapter${visibleInterventionCount === 1 ? "" : "s"} need intervention`
      : "Portfolio healthy";
  const topStripAlertClassName =
    visibleInterventionCount > 0
      ? "border border-[#fda4af]/30 bg-[#7f1d1d]/55 text-[#ffe4e6]"
      : "border border-emerald-300/30 bg-emerald-900/40 text-emerald-100";
  const topViewStrip = (
    <section className={topShellClassName}>
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7d05e] text-sm font-semibold text-[#08224c]">
              M
            </div>
            <div className="min-w-0">
              {useMinimalStaffChapterStrip ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className={topShellEyebrowClassName}>myMEDLIFE</p>
                  <span className={topShellTitleClassName}>Staff Command Center</span>
                </div>
              ) : (
                <>
                  <p className={topShellEyebrowClassName}>myMEDLIFE</p>
                  <p className={topShellTitleClassName}>{commandCenter.title}</p>
                </>
              )}
            </div>
          </div>
          {!useMinimalStaffChapterStrip ? (
            <p className={topShellTimestampClassName}>
              {commandCenter.campaignOperations.timestampLabel}
            </p>
          ) : null}
        </div>

        {!useMinimalStaffChapterStrip ? (
          <div className="flex flex-wrap gap-1.5">
            {topStripPills.map((label, index) => (
              <Pill
                key={label}
                tone={
                  index === 1 && !isBestPracticesView && !isCampaignsView
                    ? "warning"
                    : "neutral"
                }
                label={label}
              />
            ))}
            {sourceContext && !isAdminView ? (
              <Pill tone="warning" label={sourceContext.eyebrow} />
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <nav
            aria-label="Staff command center views"
            className={topShellNavClassName}
          >
          {commandCenter.viewOptions.map((option) => (
            <div key={option.key} className="relative shrink-0 snap-start">
              <span
                aria-hidden="true"
                className={[
                  "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition",
                  commandCenter.selectedView === option.key
                    ? useCompactStaffToolbar
                      ? "text-[#08224c]"
                      : "text-white"
                    : useCompactStaffToolbar
                      ? "text-white/62"
                      : "text-slate-500",
                ].join(" ")}
              >
                <StaffViewIcon view={option.key} />
              </span>
              <Link
                href={option.href}
                aria-current={commandCenter.selectedView === option.key ? "page" : undefined}
                className={[
                  "block rounded-[0.95rem] px-3.5 py-2 pl-10 text-sm font-semibold transition",
                  useCompactStaffToolbar
                    ? commandCenter.selectedView === option.key
                      ? "bg-white text-[#08224c] shadow-[0_16px_32px_rgba(2,14,38,0.16)]"
                      : "border border-white/12 bg-white/10 text-white/82 hover:border-white/24 hover:bg-white/16 hover:text-white"
                    : commandCenter.selectedView === option.key
                      ? "bg-[#0b5fc4] text-white shadow-[0_16px_32px_rgba(37,99,235,0.18)]"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950",
                ].join(" ")}
              >
                {option.label}
              </Link>
            </div>
          ))}
        </nav>
          {!isAdminView ? (
            <div className="flex items-center gap-2">
              <span
                className={[
                  "shrink-0 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold",
                  topStripAlertClassName,
                ].join(" ")}
              >
                {topStripAlertLabel}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/10 text-xs font-semibold text-white/88">
                HQ
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );

  return (
    <section className={outerShellClassName}>
      {!useCompactStaffToolbar ? (
        <aside className="grid gap-4 xl:sticky xl:top-24">
        <section className="rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(160deg,#0b2a5d_0%,#0a3b88_52%,#081a3a_100%)] p-4 shadow-[0_24px_80px_rgba(2,14,38,0.3)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
            {surfaceEyebrow}
          </p>
          <h1 className="mt-3 text-[1.55rem] font-semibold leading-[1.04] text-white">
            {commandCenter.title}
          </h1>
          {commandCenter.sampleLabel ? (
            <span className="mt-3 inline-flex rounded-full border border-[#f7d05e]/30 bg-[#f7d05e]/12 px-3 py-1 text-xs font-semibold text-[#f7d05e]">
              {commandCenter.sampleLabel}
            </span>
          ) : null}
          <p className="mt-3 text-sm leading-6 text-white/72">
            {selectedSurfaceLabel}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {sidebarPills.map((label) => (
              <Pill key={label} tone="neutral" label={label} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {sidebarStats.map((stat) => (
              <CompactRailStat
                key={stat.label}
                label={stat.label}
                value={stat.value}
                tone={stat.tone === "danger" ? "danger" : undefined}
              />
            ))}
          </div>
        </section>

        {!showTopViewStrip ? (
          <SidebarCard eyebrow="Navigation" title={navigationTitle}>
            <nav aria-label="Coach command center views" className="grid gap-2">
              {commandCenter.viewOptions.map((option) => (
                <div key={option.key} className="relative">
                  <span
                    aria-hidden="true"
                    className={[
                      "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition",
                      commandCenter.selectedView === option.key
                        ? "text-[#08224c]"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    <StaffViewIcon view={option.key} />
                  </span>
                  <Link
                    href={option.href}
                    aria-current={
                      commandCenter.selectedView === option.key ? "page" : undefined
                    }
                    className={[
                      "block rounded-[1.15rem] px-4 py-3 pl-11 text-sm font-semibold transition",
                      commandCenter.selectedView === option.key
                        ? "bg-[#f7d05e] text-[#08224c]"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950",
                    ].join(" ")}
                  >
                    {option.label}
                  </Link>
                </div>
              ))}
            </nav>
          </SidebarCard>
        ) : null}

        {showSidebarQuickActions ? (
          <SidebarCard eyebrow="Quick actions" title={toolTitle}>
            <div className="grid gap-2">
              {railQuickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={[
                    "rounded-[1.1rem] border px-4 py-3 transition",
                    action.tone === "primary"
                      ? "border-[#f7d05e]/40 bg-[#fff7da] hover:border-[#f7d05e]/60 hover:bg-[#fff2bf]"
                      : "border-slate-200 bg-white hover:border-[#bfdbfe] hover:bg-[#eef5ff]",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "text-sm font-semibold",
                      action.tone === "primary" ? "text-[#8a6700]" : "text-slate-950",
                    ].join(" ")}
                  >
                    {action.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{action.helper}</p>
                </Link>
              ))}
            </div>
          </SidebarCard>
        ) : null}
      </aside>
      ) : null}

      <div className="grid gap-4">
        {showTopViewStrip ? topViewStrip : null}

        {sourceContext && !isAdminView ? (
          <section className="rounded-[1.35rem] border border-[#bfdbfe] bg-[#f8fbff] p-4">
            <p className="app-eyebrow app-eyebrow-blue">{sourceContext.eyebrow}</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {sourceContext.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {sourceContext.summary}
            </p>
            {sourceContext.actions?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {sourceContext.actions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#0b5fc4] transition hover:border-[#93c5fd] hover:bg-[#eef5ff]"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {showOverviewHero ? (
          <section className={heroShellClassName}>
            <div className="grid gap-4 xl:grid-cols-[0.98fr_1.02fr] xl:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/48">
                  {surfaceOverviewLabel}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div
                    className={[
                      "flex items-center justify-center rounded-full border border-[#f7d05e]/30 bg-[#f7d05e]/10",
                      heroPrimarySizeClassName,
                    ].join(" ")}
                  >
                    <div className="text-center">
                      <p className="text-[2rem] font-semibold leading-none text-white">
                        {heroPrimaryValue}
                      </p>
                      <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/52">
                        {heroPrimaryLabel}
                      </p>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className={heroTitleClassName}>
                      {selectedSurfaceLabel}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {heroSummary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {heroContextLabels.map((label) => (
                        <HeroContextPill key={label} label={label} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {heroMiniStats.map((stat) => (
                    <HeroMiniStat
                      key={stat.label}
                      label={stat.label}
                      value={stat.value}
                      note={stat.note}
                    />
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {commandCenter.quickActions.slice(0, 4).map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={[
                        "rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition",
                        action.tone === "primary"
                          ? "bg-[#2563eb] text-white hover:bg-[#2d6cf4]"
                          : "border border-white/30 bg-white/95 text-slate-800 hover:bg-white",
                      ].join(" ")}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div className="grid gap-4">
          {showOverviewHero ? (
            <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {commandCenter.metrics.map((metric) => (
                <ToplineMetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  note={metric.note}
                />
              ))}
            </section>
          ) : null}

          {!isAdminView &&
          !isStaffChapterOverview &&
          !useDenseStaffSurface &&
          !isCoachSharedCommandView ? (
            <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
              <SectionCard eyebrow={priorityEyebrow} title={priorityTitle}>
                <p className="text-sm leading-6 text-slate-600">{prioritySummary}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <PrioritySnapshotStat
                    label="High-risk chapters"
                    value={`${highRiskCount}`}
                    note="Need staff support before the next loop slips."
                  />
                  <PrioritySnapshotStat
                    label="Open follow-up"
                    value={`${followUpCount}`}
                    note="Visible follow-up obligations in the current portfolio."
                  />
                  <PrioritySnapshotStat
                    label="Proof queue"
                    value={`${commandCenter.proofReviewItems.length}`}
                    note="UGC and consent items still waiting on staff review."
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {commandCenter.quickActions.slice(0, 3).map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={[
                        "rounded-full px-4 py-2 text-sm font-semibold transition",
                        action.tone === "primary"
                          ? "bg-[#f7d05e] text-[#08224c]"
                          : "border border-slate-200 bg-white text-slate-700",
                      ].join(" ")}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InlineCallout
                    eyebrow={isCoachSurface ? "Current coach posture" : "Current support posture"}
                    tone="blue"
                    body={prioritySummary}
                  />
                  <InlineCallout
                    eyebrow="Safety boundary"
                    tone="amber"
                    body={commandCenter.safetyNote}
                  />
                </div>
              </SectionCard>

              <SectionCard eyebrow={snapshotEyebrow} title={snapshotSectionTitle}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {commandCenter.metrics.map((metric) => (
                    <CompactMetricTile
                      key={metric.label}
                      label={metric.label}
                      value={metric.value}
                      note={metric.note}
                    />
                  ))}
                </div>
              </SectionCard>
            </section>
          ) : null}

        {commandCenter.selectedView === "chapters" ? (
          <section className="app-surface rounded-[1.75rem] p-3">
            <div className="flex flex-col gap-2.5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="app-eyebrow app-eyebrow-slate">{filterEyebrow}</p>
                <h2 className="mt-1 text-[1.85rem] font-semibold leading-tight text-slate-950">
                  {filterTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {filterCopy}
                </p>
              </div>
              {isStaffChapterOverview ? (
                <p className="text-sm leading-6 text-slate-600 xl:pt-1">
                  {commandCenter.campaignOperations.timestampLabel}
                </p>
              ) : null}
            </div>

            <div className="mt-2.5 grid gap-2.5 xl:grid-cols-6">
              {commandCenter.portfolioSummaryCards.map((card) => (
                <PortfolioSummaryTile key={card.label} card={card} />
              ))}
            </div>

            <StaffPortfolioToolbar
              routeBase={commandCenter.routeBase}
              searchQuery={commandCenter.searchQuery}
              riskFilter={commandCenter.riskFilter}
              countryFilter={commandCenter.countryFilter}
              portfolioCampaignFilter={commandCenter.portfolioCampaignFilter}
              coachFilter={commandCenter.coachFilter}
              riskFilters={commandCenter.riskFilters}
              countryFilters={commandCenter.countryFilters}
              portfolioCampaignFilters={commandCenter.portfolioCampaignFilters}
              coachFilters={commandCenter.coachFilters}
              reviewAtRiskHref={
                commandCenter.riskFilters.find((filter) => filter.key === "medium")?.href ??
                `${commandCenter.routeBase}?view=chapters&risk=medium`
              }
              chapterRows={commandCenter.chapterRows}
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {commandCenter.chapterRows.length} chapter{commandCenter.chapterRows.length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={commandCenter.portfolioCampaignViewHref}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
                >
                  Open Campaign View
                </Link>
                <Link
                  href={commandCenter.portfolioBestPracticesViewHref}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
                >
                  Send Coach Packet
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {renderView(commandCenter, {
          adminPostHeroStrip: showMemberHomeAdminHandoffFirst ? topViewStrip : null,
        })}
        </div>
      </div>
    </section>
  );
}

function renderView(
  commandCenter: StaffCommandCenter,
  options: {
    adminPostHeroStrip?: ReactNode;
  } = {},
) {
  const isCoachSurface = commandCenter.routeBase === "/coach";
  const chapterSectionEyebrow = isCoachSurface ? "Assigned chapters" : "Chapter portfolio";
  const chapterSectionTitle = isCoachSurface
    ? "Which chapters need a coach decision or follow-up?"
    : "What needs a decision or support move?";
  const drawerEyebrow = isCoachSurface ? "Coach chapter drawer" : "Chapter drawer";

  switch (commandCenter.selectedView) {
    case "campaigns":
      return <CampaignOperationsView overview={commandCenter.campaignOperations} />;
    case "proof_ugc":
      {
        const pendingProofCount = commandCenter.proofReviewItems.filter(
          (item) => item.reviewStatus === "pending",
        ).length;
        const selectedProofReview = commandCenter.selectedProofReview;
        const proofQueueSummary =
          commandCenter.proofQueueFilter === "all" || commandCenter.proofQueueFilter === "pending"
            ? `${pendingProofCount} item${pendingProofCount === 1 ? "" : "s"} pending review`
            : `${commandCenter.proofReviewItems.length} item${commandCenter.proofReviewItems.length === 1 ? "" : "s"} visible in the current moderation view.`;

      return (
        <section className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr] xl:items-start">
          <SectionCard eyebrow="Proof queue" title="Proof / UGC Review Queue">
            {selectedProofReview ? (
              <div className="rounded-[1.1rem] border border-[#bfdbfe] bg-[#f8fbff] px-4 py-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="app-eyebrow app-eyebrow-blue">Selected review state</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {selectedProofReview.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedProofReview.subtitle}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={consentTone(selectedProofReview.consentLabel)} label={selectedProofReview.consentLabel} />
                    <Pill tone="warning" label="Review selected" />
                  </div>
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm leading-6 text-slate-600">
                {proofQueueSummary}
              </p>
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {commandCenter.campaignOperations.timestampLabel}
                </p>
                <FilterMenu
                  label={commandCenter.proofTypeFilters.find(
                    (filter) => filter.key === commandCenter.proofTypeFilter,
                  )?.label ?? "All Types"}
                  options={commandCenter.proofTypeFilters}
                  selectedKey={commandCenter.proofTypeFilter}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {commandCenter.proofQueueFilters.map((filter) => (
                <Link
                  key={filter.key}
                  href={filter.href}
                  aria-current={
                    commandCenter.proofQueueFilter === filter.key ? "page" : undefined
                  }
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    commandCenter.proofQueueFilter === filter.key
                      ? "bg-[#0b5fc4] text-white shadow-[0_16px_32px_rgba(37,99,235,0.2)]"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-[#bfdbfe] hover:bg-white hover:text-slate-950",
                  ].join(" ")}
                >
                  {filter.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {commandCenter.proofReviewItems.map((item) => (
                <ProofReviewQueueCard
                  key={item.id}
                  item={item}
                  selected={commandCenter.selectedProofId === item.id}
                />
              ))}
            </div>
            {commandCenter.proofReviewItems.length === 0 ? (
              <div className="app-surface-soft mt-4 rounded-[1.2rem] p-4">
                <p className="text-sm leading-6 text-slate-600">
                  No proof items match the current review state and content type filters.
                </p>
              </div>
            ) : null}
          </SectionCard>
          <ProofReviewPanelCard panel={commandCenter.selectedProofReview} />
        </section>
      );
      }
    case "feed_studio":
      return (
        <section className="grid gap-4">
          <SectionCard eyebrow="Feed Studio" title="Feed Curation Studio">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm leading-6 text-slate-600">
                Compose and target content to student feeds
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {commandCenter.campaignOperations.timestampLabel}
              </p>
            </div>
          </SectionCard>

          <div className="grid gap-4 xl:grid-cols-[0.6fr_1.1fr_0.55fr] xl:items-start">
            <SectionCard eyebrow="Content library" title="Feed source library">
              <div className="grid gap-3">
                {commandCenter.feedDrafts.map((draft) => (
                  <FeedLibraryCard
                    key={draft.id}
                    draft={draft}
                    selected={commandCenter.feedStudio.selectedDraftId === draft.id}
                  />
                ))}
              </div>
            </SectionCard>
            <SectionCard eyebrow="Post composer" title="Compose and target content to student feeds">
              <FeedStudioComposer commandCenter={commandCenter} />
            </SectionCard>
            <SectionCard eyebrow="Audience targeting" title="Audience targeting">
              <FeedStudioAudiencePanel commandCenter={commandCenter} />
            </SectionCard>
          </div>
        </section>
      );
    case "feed_analytics":
      return (
        <section className="grid gap-4">
          <SectionCard eyebrow="Feed Analytics" title="Feed Analytics">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-sm leading-6 text-slate-600">
                Connecting feed engagement to chapter outcomes
              </p>
              <p className="text-sm leading-6 text-slate-600">
                {commandCenter.feedAnalytics.timestampLabel}
              </p>
            </div>
            {commandCenter.feedAnalytics.sourceContext ? (
              <div className="mt-4 rounded-[1.2rem] border border-[#bfdbfe] bg-[#f8fbff] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="app-eyebrow app-eyebrow-blue">
                      {commandCenter.feedAnalytics.sourceContext.eyebrow}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {commandCenter.feedAnalytics.sourceContext.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {commandCenter.feedAnalytics.sourceContext.summary}
                    </p>
                  </div>
                  <Link
                    href={commandCenter.feedAnalytics.sourceContext.actionHref}
                    className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#eef5ff]"
                  >
                    {commandCenter.feedAnalytics.sourceContext.actionLabel}
                  </Link>
                </div>
              </div>
            ) : null}
            {commandCenter.feedAnalytics.selectedPost ? (
              <div className="mt-4">
                <FeedAnalyticsImpactPanel post={commandCenter.feedAnalytics.selectedPost} />
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-6">
              {commandCenter.feedAnalytics.summaryCards.map((card, index) => (
                <FeedAnalyticsSummaryCard
                  key={card.label}
                  card={card}
                  accentIndex={index}
                />
              ))}
            </div>
            <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-950">Post Performance</p>
              </div>
              <FeedAnalyticsTable commandCenter={commandCenter} />
            </div>
          </SectionCard>
        </section>
      );
    case "hubspot":
      return (
        <section className="grid gap-4 xl:grid-cols-[0.44fr_1.56fr] xl:items-start">
          <SectionCard eyebrow="Chapter" title="Chapter">
            <div className="grid gap-2">
              {commandCenter.hubspotWorkspace.chapterOptions.map((option) => {
                const selected =
                  commandCenter.hubspotWorkspace.selectedChapterId === option.id;

                return (
                  <Link
                    key={option.id}
                    href={option.href}
                    aria-current={selected ? "page" : undefined}
                    className={[
                      "rounded-[1rem] border px-3 py-3 transition",
                      selected
                        ? "border-[#2563eb] bg-[#1d4f91] text-white shadow-[0_18px_40px_rgba(37,99,235,0.18)]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#bfdbfe] hover:bg-[#f8fbff]",
                    ].join(" ")}
                  >
                    <p className="text-sm font-semibold">{option.chapterLabel}</p>
                    <p className={["mt-1 text-xs", selected ? "text-white/78" : "text-slate-500"].join(" ")}>
                      {option.countryLabel}
                    </p>
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          <div className="grid gap-4">
            <div className="app-surface rounded-[1.75rem] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="app-eyebrow app-eyebrow-slate">HubSpot + Chapter Intelligence</p>
                  <h2 className="mt-2 text-[1.38rem] font-semibold leading-tight text-slate-950 sm:text-[1.5rem]">
                    HubSpot + Chapter Intelligence
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    HubSpot CRM data matched to myMEDLIFE activity
                  </p>
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  {commandCenter.hubspotWorkspace.timestampLabel}
                </p>
              </div>
            </div>

            {commandCenter.hubspotWorkspace.sourceContext ? (
              <SectionCard
                eyebrow={commandCenter.hubspotWorkspace.sourceContext.eyebrow}
                title={commandCenter.hubspotWorkspace.sourceContext.title}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <p className="text-sm leading-6 text-slate-600">
                    {commandCenter.hubspotWorkspace.sourceContext.summary}
                  </p>
                  <Link
                    href={commandCenter.hubspotWorkspace.sourceContext.actionHref}
                    className="inline-flex rounded-full border border-[#bfdbfe] bg-[#eef5ff] px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-white"
                  >
                    {commandCenter.hubspotWorkspace.sourceContext.actionLabel}
                  </Link>
                </div>
              </SectionCard>
            ) : null}

            {commandCenter.hubspotWorkspace.warningLabel ? (
              <div className="rounded-[1rem] border border-[#f7d05e]/45 bg-[#fff8df] px-4 py-3">
                <p className="text-sm font-semibold text-[#8a6700]">
                  {commandCenter.hubspotWorkspace.warningLabel}
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
              <SectionCard eyebrow="HubSpot CRM profile" title="HubSpot CRM Profile">
                <div className="grid gap-4 sm:grid-cols-2">
                  {commandCenter.hubspotWorkspace.crmProfileMetrics.map((metric) => (
                    <SupportDetail key={metric.label} label={metric.label} value={metric.value} />
                  ))}
                </div>
              </SectionCard>

              <SectionCard eyebrow="Matched myMEDLIFE activity" title="HubSpot CRM data matched to myMEDLIFE activity">
                <div className="grid gap-4">
                  {commandCenter.hubspotWorkspace.matchedActivityMetrics.map((metric) => (
                    <HubSpotActivityBar key={metric.label} metric={metric} />
                  ))}
                </div>
              </SectionCard>
            </div>

            <SectionCard
              eyebrow="Conversion funnel"
              title={`Conversion Funnel — ${commandCenter.hubspotWorkspace.selectedChapterLabel}`}
            >
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {commandCenter.hubspotWorkspace.funnelSteps.map((step) => (
                  <div key={step.label} className="px-2 py-4 text-center">
                    <p className="text-2xl font-semibold text-slate-950">{step.value}</p>
                    <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </section>
      );
    case "best_practices":
      const selectedPracticeCampaignLabel =
        commandCenter.bestPracticeCampaignFilters.find(
          (filter) => filter.key === commandCenter.bestPracticeCampaignFilter,
        )?.label ?? "All Campaigns";
      const selectedPracticeCountryLabel =
        commandCenter.bestPracticeCountryFilters.find(
          (filter) => filter.key === commandCenter.bestPracticeCountryFilter,
        )?.label ?? "All Countries";
      const selectedBestPractice =
        commandCenter.bestPracticeCards.find(
          (card) => card.id === commandCenter.selectedBestPracticeId,
        ) ?? null;

      return (
        <section className="grid gap-4">
          <SectionCard eyebrow="Best Practices Library" title="Best Practices Library">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm leading-6 text-slate-600">
                {commandCenter.bestPracticeCards.length} verified best practice{commandCenter.bestPracticeCards.length === 1 ? "" : "s"} ready to share
              </p>
              <p className="text-sm leading-6 text-slate-600">
                {commandCenter.hubspotWorkspace.timestampLabel}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <FilterMenu
                  label={selectedPracticeCampaignLabel}
                  options={commandCenter.bestPracticeCampaignFilters}
                  selectedKey={commandCenter.bestPracticeCampaignFilter}
                />
                <FilterMenu
                  label={selectedPracticeCountryLabel}
                  options={commandCenter.bestPracticeCountryFilters}
                  selectedKey={commandCenter.bestPracticeCountryFilter}
                />
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {commandCenter.bestPracticeCards.length} best practice{commandCenter.bestPracticeCards.length === 1 ? "" : "s"}
              </p>
            </div>
          </SectionCard>

          {selectedBestPractice ? (
            <SectionCard eyebrow="Selected practice" title={selectedBestPractice.title}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-sm leading-6 text-slate-600">
                    {selectedBestPractice.chapterLabel} is the currently selected practice in this
                    review path. Keep this card anchored while you move into Feed Studio or coach
                    handoff so the share context stays specific.
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {selectedBestPractice.kpiResult}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={selectedBestPractice.shareHref}
                    className="rounded-full bg-[#1d4f91] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Share to Feed
                  </Link>
                  <Link
                    href={selectedBestPractice.coachHref}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Send to Coaches
                  </Link>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <section className="grid gap-4 xl:grid-cols-2">
            {commandCenter.bestPracticeCards.map((card) => (
              <BestPracticeCard
                key={card.id}
                card={card}
                selected={commandCenter.selectedBestPracticeId === card.id}
              />
            ))}
          </section>
        </section>
      );
    case "admin":
      const adminSummaryCards = [
        {
          label: "Integrations",
          value: `${commandCenter.adminWorkspace.integrationStatuses.length}`,
          note: "Visible sync and system health checks",
        },
        {
          label: "Failed jobs",
          value: `${commandCenter.adminWorkspace.failedCount}`,
          note: "Automation outbox rows needing review",
        },
        {
          label: "Audit rows",
          value: `${commandCenter.adminWorkspace.auditRows.length}`,
          note: "Most recent review-safe audit records",
        },
      ];
      const adminStudentViewAction =
        commandCenter.sourceContext?.actions?.find((action) => action.label === "Student view") ??
        null;
      const adminHandoffActions =
        commandCenter.sourceContext?.actions?.filter(
          (action) => action.label !== "Student view",
        ) ?? [];
      const activeIntegrationCount = commandCenter.adminWorkspace.integrationStatuses.filter(
        (status) => status.status !== "mock",
      ).length;

      return (
        <section className="grid gap-4">
          <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(160deg,#0b2a5d_0%,#0a3b88_52%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.3)]">
            <div className="flex flex-col gap-4">
              {adminStudentViewAction ? (
                <div>
                  <Link
                    href={adminStudentViewAction.href}
                    className="inline-flex items-center rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-sm font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/12 hover:text-white"
                  >
                    Student view
                  </Link>
                </div>
              ) : null}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
                    Platform Admin
                  </p>
                  <h2 className="mt-2 text-[2.25rem] font-semibold leading-none text-white sm:text-[2.6rem]">
                    Admin Console
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/78">
                    System health: {activeIntegrationCount} of{" "}
                    {commandCenter.adminWorkspace.integrationStatuses.length} integrations active
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">
                  {commandCenter.adminWorkspace.timestampLabel}
                </span>
              </div>

              {commandCenter.sourceContext ? (
                <div className="rounded-[1.35rem] border border-white/14 bg-white/[0.07] p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                    {commandCenter.sourceContext.eyebrow}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {commandCenter.sourceContext.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/74">
                    {commandCenter.sourceContext.summary}
                  </p>
                  {adminHandoffActions.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {adminHandoffActions.map((action) => (
                        <Link
                          key={action.label}
                          href={action.href}
                          className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white/88 transition hover:border-white/24 hover:bg-white/12 hover:text-white"
                        >
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                {adminSummaryCards.map((stat) => (
                  <ToplineMetricCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    note={stat.note}
                  />
                ))}
              </div>
            </div>
          </section>

          {options.adminPostHeroStrip ?? null}

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {commandCenter.adminWorkspace.backendLanes.map((lane) => (
              <Link
                key={lane.href}
                href={lane.href}
                className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:border-[#bfdbfe] hover:bg-[#f8fbff]"
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {lane.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  {lane.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {lane.summary}
                </p>
              </Link>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
            <div id="integration-status">
            <SectionCard eyebrow="Integration status" title="Integration Status">
              <div className="grid gap-3">
                {commandCenter.adminWorkspace.integrationStatuses.map((status) => (
                  <AdminIntegrationStatusRow key={status.title} status={status} />
                ))}
              </div>
            </SectionCard>
            </div>

            <SectionCard eyebrow="Automation outbox" title="Automation Outbox">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Pill
                  tone={
                    commandCenter.adminWorkspace.failedCount > 0 ? "danger" : "good"
                  }
                  label={`${commandCenter.adminWorkspace.failedCount} failed`}
                />
                <Link
                  href={commandCenter.adminWorkspace.retryFailedHref}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff]"
                >
                  Retry Failed
                </Link>
              </div>

              <div className="mt-4 overflow-x-auto">
                <AdminDataTable
                  columns={["Event", "Source", "Destination", "Status", "Retries", "Error", "Created", "Processed"]}
                  rows={commandCenter.adminWorkspace.outboxRows.map((row) => (
                    <AdminOutboxRowView key={`${row.eventLabel}-${row.createdLabel}`} row={row} />
                  ))}
                />
              </div>
            </SectionCard>
          </section>

          <SectionCard eyebrow="Audit log" title="Audit Log">
            <div className="overflow-x-auto">
              <AdminDataTable
                columns={["Actor", "Role", "Action", "Object", "Chapter", "Timestamp"]}
                rows={commandCenter.adminWorkspace.auditRows.map((row) => (
                  <AdminAuditRowView key={`${row.actorLabel}-${row.timestampLabel}`} row={row} />
                ))}
              />
            </div>
          </SectionCard>
        </section>
      );
    case "chapters":
    default:
      return (
        <section className="relative grid gap-4">
          <SectionCard eyebrow={chapterSectionEyebrow} title={chapterSectionTitle}>
            <ChapterPortfolioTable
              rows={commandCenter.chapterRows}
              selectedChapterId={commandCenter.selectedChapterId}
            />
          </SectionCard>

          {commandCenter.selectedChapter ? (
            <>
              <Link
                href={commandCenter.selectedChapter.closeHref}
                aria-label="Close chapter detail drawer"
                className="fixed inset-0 z-40 bg-slate-950/24 backdrop-blur-[1px]"
              />
              <aside
                aria-label={drawerEyebrow}
                className="fixed inset-y-0 right-0 z-50 w-full max-w-[34rem] overflow-y-auto border-l border-slate-200 bg-[#f5f7fb]/96 p-4 shadow-[-24px_0_80px_rgba(15,23,42,0.18)] backdrop-blur-xl"
              >
                <div className="mb-3 flex justify-end">
                  <Link
                    href={commandCenter.selectedChapter.closeHref}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
                  >
                    Close
                  </Link>
                </div>
                <ChapterDrawer
                  drawer={commandCenter.selectedChapter}
                  compact={!isCoachSurface}
                />
              </aside>
            </>
          ) : null}
        </section>
      );
  }
}

function ChapterPortfolioTable({
  rows,
  selectedChapterId,
}: {
  rows: StaffChapterPortfolioRow[];
  selectedChapterId: string | null;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm leading-6 text-slate-600">
        No chapters matched the current search or risk filter.
      </p>
    );
  }

  return (
    <div className="app-surface overflow-hidden rounded-[1.25rem]">
      <div className="overflow-x-auto">
        <table className="min-w-[92rem] text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Chapter</th>
              <th className="px-4 py-3">Coach</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Leads</th>
              <th className="px-4 py-3">RSVPs</th>
              <th className="px-4 py-3">Attendance</th>
              <th className="px-4 py-3">Assignments</th>
              <th className="px-4 py-3">Evidence ⏳</th>
              <th className="px-4 py-3">Pts/Wk</th>
              <th className="px-4 py-3">HubSpot</th>
              <th className="px-4 py-3">Last Active</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Decision</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.chapterId}
                className={[
                  "border-t border-slate-200 transition hover:bg-slate-50/80",
                  selectedChapterId === row.chapterId
                    ? "bg-[#eff6ff] shadow-[inset_4px_0_0_0_#2563eb]"
                    : "",
                ].join(" ")}
              >
                <td className="px-4 py-3 align-top">
                  <Link
                    href={row.detailHref}
                    className="font-semibold text-slate-950 hover:text-[#1d4ed8]"
                  >
                    {row.chapterName}
                  </Link>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {row.country}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="min-w-[4.5rem]">
                    <p
                      aria-label={row.coachName}
                      className="text-sm font-semibold text-slate-950"
                    >
                      {coachTableLabel(row.coachName)}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  {row.campaignName}
                </td>
                <td className="px-4 py-3 align-top">
                  <Pill tone={row.statusTone} label={row.statusLabel} />
                </td>
                <td className="px-4 py-3">{row.leadsCount}</td>
                <td className="px-4 py-3">{row.rsvpCount}</td>
                <td className="px-4 py-3">{row.attendanceCount}</td>
                <td className="px-4 py-3">{row.assignmentsCount}</td>
                <td className="px-4 py-3 font-semibold text-[#b45309]">{row.proofPending}</td>
                <td className="px-4 py-3">{row.pointsPerWeek.toLocaleString()}</td>
                <td className="px-4 py-3 font-semibold text-[#b45309]">{row.hubspotStageLabel}</td>
                <td className="px-4 py-3">{row.lastActiveLabel}</td>
                <td className="px-4 py-3">
                  <Pill tone={riskTone(row.risk)} label={riskLabel(row.risk)} />
                </td>
                <td className="px-4 py-3">
                  <Pill tone={decisionTone(row.decision)} label={decisionLabel(row.decision)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CampaignOperationsView({
  overview,
}: {
  overview: StaffCampaignOperationsOverview;
}) {
  return (
    <section className="grid gap-4">
      <SectionCard eyebrow="Campaign operations" title="Campaign Operations">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-slate-600">
            {overview.activeCampaignCountLabel}
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {overview.timestampLabel}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {overview.tabs.map((tab) => (
            <Link
              key={tab.slug}
              href={tab.href}
              aria-current={tab.slug === overview.selectedCampaignSlug ? "page" : undefined}
              className={[
                "rounded-[1rem] px-4 py-2 text-sm font-semibold transition",
                tab.slug === overview.selectedCampaignSlug
                  ? "bg-[#2563eb] text-white shadow-[0_14px_30px_rgba(37,99,235,0.16)]"
                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-[#bfdbfe] hover:bg-white hover:text-slate-950",
              ].join(" ")}
            >
              {tab.name}
            </Link>
          ))}
        </div>
        {overview.sourceContext ? (
          <div className="mt-4 rounded-[1.2rem] border border-[#bfdbfe] bg-[#f8fbff] px-4 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="app-eyebrow app-eyebrow-blue">
                  {overview.sourceContext.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  {overview.sourceContext.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {overview.sourceContext.summary}
                </p>
              </div>
              <Link
                href={overview.sourceContext.actionHref}
                className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#2563eb] transition hover:border-[#93c5fd] hover:bg-[#eff6ff]"
              >
                {overview.sourceContext.actionLabel}
              </Link>
            </div>
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 xl:grid-cols-5">
          {overview.riskCards.map((card) => (
            <CampaignRiskSummaryCard key={card.title} card={card} />
          ))}
        </div>
        <div className="mt-4 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Bulk Actions:
            </span>
            {overview.bulkActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow={overview.selectedCampaignName}
        title={`${overview.selectedCampaignName} - Chapter Execution`}
      >
        {overview.selectedRiskGroup !== "all" ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.1rem] border border-[#bfdbfe] bg-[#f8fbff] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Filtered by {overview.selectedRiskGroupLabel}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Keep the execution table focused on the exact risk lane selected above.
              </p>
            </div>
            <Link
              href={overview.clearRiskGroupHref}
              className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#2563eb] transition hover:border-[#93c5fd] hover:bg-[#eef5ff]"
            >
              Clear filter
            </Link>
          </div>
        ) : null}
        <p className="text-sm leading-6 text-slate-600">
          {overview.executionRows.length} chapters
        </p>
        <CampaignExecutionTable rows={overview.executionRows} />
      </SectionCard>
    </section>
  );
}

function CampaignRiskSummaryCard({ card }: { card: StaffCampaignRiskCard }) {
  return (
    <Link
      href={card.href}
      aria-current={card.isActive ? "page" : undefined}
      className={[
        "block rounded-[1.2rem] border p-4 shadow-[0_10px_24px_rgba(247,208,94,0.12)] transition",
        card.isActive
          ? "border-[#2563eb] bg-[#eef5ff]"
          : "border-[#f7d05e]/28 bg-[linear-gradient(180deg,#fffef9_0%,#fff8e0_100%)] hover:border-[#f7d05e]/45",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-amber-700">
          {card.title}
        </p>
        <span
          className={[
            "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold",
            card.isActive
              ? "border border-[#93c5fd] bg-white text-[#2563eb]"
              : "border border-[#f7d05e]/30 bg-white/70 text-amber-700",
          ].join(" ")}
        >
          {card.isActive ? "Viewing lane" : "Open lane"}
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{card.count}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {card.chapterLabels.length > 0 ? card.chapterLabels.join(", ") : "No chapters flagged."}
      </p>
      <p className="mt-3 text-sm font-semibold text-slate-950">
        {card.isActive
          ? "Execution table is narrowed to this risk lane."
          : "Filter the execution table to this lane."}
      </p>
    </Link>
  );
}

function CampaignExecutionTable({
  rows,
}: {
  rows: StaffCampaignExecutionRow[];
}) {
  return (
    <div className="app-surface overflow-hidden rounded-[1.25rem]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Chapter</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Coach</th>
              <th className="px-4 py-3">Planning</th>
              <th className="px-4 py-3">Event created</th>
              <th className="px-4 py-3">Leads</th>
              <th className="px-4 py-3">Follow-ups</th>
              <th className="px-4 py-3">Evidence reviewed</th>
              <th className="px-4 py-3">KPI target</th>
              <th className="px-4 py-3">Decision</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.chapterName}
                className={[
                  "border-t border-slate-200",
                  row.selected ? "bg-[#f8fbff]" : "",
                ].join(" ")}
              >
                <td className="px-4 py-3 font-semibold text-slate-950">
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="text-[#0b4f9b] underline-offset-4 hover:underline"
                    >
                      {row.chapterName}
                    </Link>
                  ) : (
                    row.chapterName
                  )}
                </td>
                <td className="px-4 py-3">{row.country}</td>
                <td className="px-4 py-3">{row.coachName}</td>
                <td className="px-4 py-3">
                  <MilestoneState
                    status={row.planningStatus === "complete" ? "complete" : "missing"}
                    label={row.planningStatus === "complete" ? "✓" : "✗"}
                  />
                </td>
                <td className="px-4 py-3">
                  <MilestoneState
                    status={row.eventCreatedStatus}
                    label={`${row.eventCreatedStatus === "complete" ? "✓" : "✗"} ${row.eventCreatedLabel}`}
                  />
                </td>
                <td className="px-4 py-3">{row.leadsCount}</td>
                <td className="px-4 py-3">
                  {row.followUpsCompleted}/{row.followUpsTarget}
                </td>
                <td className="px-4 py-3">{row.evidenceReviewedCount}</td>
                <td className="px-4 py-3">
                  <Pill
                    tone={row.kpiTargetStatus === "hit" ? "good" : "danger"}
                    label={row.kpiTargetStatus === "hit" ? "Hit" : "Missed"}
                  />
                </td>
                <td className="px-4 py-3">
                  <Pill
                    tone={decisionTone(row.decision)}
                    label={decisionLabel(row.decision)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MilestoneState({
  status,
  label,
}: {
  status: "complete" | "missing";
  label: string;
}) {
  return (
    <span
      className={[
        "inline-flex min-w-[3.6rem] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "complete"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-600",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function ChapterDrawer({
  drawer,
  compact = false,
}: {
  drawer: StaffChapterDrawer;
  compact?: boolean;
}) {
  return (
    <div className="grid gap-4">
      <div className="rounded-[1.45rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center gap-2">
          <p className="app-eyebrow app-eyebrow-blue">Chapter detail</p>
          <Pill tone={riskTone(drawer.risk)} label={riskLabel(drawer.risk)} />
        </div>
        <h3 className="mt-2 text-[1.55rem] font-semibold text-slate-950">
          {drawer.chapterName}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {drawer.country} • {drawer.memberCount} members • {drawer.lastActiveLabel}
        </p>
      </div>

      <div className="rounded-[1.4rem] border border-slate-200 bg-[#f8fbff] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="app-eyebrow app-eyebrow-slate">Current campaign</p>
            <h4 className="mt-2 text-lg font-semibold text-slate-950">{drawer.campaignName}</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone={statusTone(drawer.statusLabel)} label={drawer.statusLabel} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Health score
            </p>
            <p className="mt-2 text-4xl font-semibold text-rose-500">{drawer.healthScore}</p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-rose-400"
            style={{ width: `${Math.max(8, Math.min(100, drawer.healthScore))}%` }}
          />
        </div>
      </div>

      {drawer.sourceContext ? (
        <div className="rounded-[1.2rem] border border-[#bfdbfe] bg-[#f8fbff] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="app-eyebrow app-eyebrow-blue">{drawer.sourceContext.eyebrow}</p>
              <h4 className="mt-2 text-lg font-semibold text-slate-950">
                {drawer.sourceContext.title}
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {drawer.sourceContext.summary}
              </p>
            </div>
            <Link
              href={drawer.sourceContext.actionHref}
              className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#eef5ff]"
            >
              {drawer.sourceContext.actionLabel}
            </Link>
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div className="app-surface rounded-[1.4rem] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="app-eyebrow app-eyebrow-slate">Decision workspace</p>
            <h4 className="mt-2 text-lg font-semibold text-slate-950">
              {getDrawerDecisionTitle(drawer)}
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Recommended move: {drawer.recommendedDecision}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Selected for review: {decisionLabel(drawer.selectedDecision)}
              </span>
            </div>
          </div>
          <Pill
            tone={drawer.selectedDecision === "advance"
              ? "good"
              : drawer.selectedDecision === "hold"
                ? "warning"
                : "danger"}
            label={decisionLabel(drawer.selectedDecision)}
          />
        </div>

        <div
          className={[
            "mt-4 rounded-[1.05rem] border px-4 py-3",
            drawer.selectedDecision === "advance"
              ? "border-emerald-200 bg-emerald-50"
              : drawer.selectedDecision === "hold"
                ? "border-amber-200 bg-amber-50"
                : "border-rose-200 bg-rose-50",
          ].join(" ")}
        >
          <p
            className={[
              "text-sm font-semibold",
              drawer.selectedDecision === "advance"
                ? "text-emerald-800"
                : drawer.selectedDecision === "hold"
                  ? "text-amber-800"
                  : "text-rose-800",
            ].join(" ")}
          >
            {getDrawerDecisionTitle(drawer)}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {getDrawerDecisionSummary(drawer)}
          </p>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="app-eyebrow app-eyebrow-slate">Focus now</p>
            <ul className="mt-3 grid gap-3">
              {drawer.focusItems.map((item) => (
                <li
                  key={item}
                  className="rounded-[1rem] border border-white bg-white px-3 py-3 text-sm leading-6 text-slate-700"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="app-eyebrow app-eyebrow-slate">Recent signals</p>
            <div className="mt-3 grid gap-3">
              {drawer.recentSignals.map((signal) => (
                <div
                  key={`${signal.label}-${signal.status}`}
                  className="rounded-[1rem] border border-white bg-white px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">{signal.label}</p>
                    <span className="rounded-full border border-slate-200 px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {signal.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{signal.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {drawer.decisionOptions.map((option) => (
            <Link
              key={option.key}
              href={option.href}
              aria-current={drawer.selectedDecision === option.key ? "page" : undefined}
              className={[
                "rounded-full px-4 py-2.5 text-center text-sm font-semibold transition",
                drawer.selectedDecision === option.key
                  ? option.key === "advance"
                    ? "bg-emerald-100 text-emerald-800"
                    : option.key === "hold"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950",
              ].join(" ")}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>
      ) : null}

      <div className="app-surface rounded-[1.4rem] p-4">
        <p className="app-eyebrow app-eyebrow-slate">Campaign KPIs</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {drawer.campaignKpis.map((metric) => (
            <DetailStat key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
      </div>

      <div className="app-surface rounded-[1.4rem] p-4">
        <p className="app-eyebrow app-eyebrow-slate">Quick links</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {drawer.quickLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <DrawerPanel panel={drawer.hubspotPanel} />
      {!compact ? (
        <>
          <DrawerPanel panel={drawer.lumaPanel} />
          <DrawerPanel panel={drawer.activityPanel} />

          <div className="app-surface rounded-[1.4rem] p-4">
            <p className="app-eyebrow app-eyebrow-slate">Coach note</p>
            <textarea
              aria-label={`Coach note for ${drawer.chapterName}`}
              className="mt-3 min-h-24 w-full rounded-[1.05rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder={drawer.coachNotePlaceholder}
              readOnly
            />
          </div>
        </>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-[#f5f7fb]/96 px-4 pb-1 pt-3 backdrop-blur-xl">
        <div className="grid gap-3 sm:grid-cols-2">
          {drawer.footerActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={[
                "rounded-[1rem] px-4 py-3 text-center text-sm font-semibold transition",
                action.tone === "primary"
                  ? "bg-[#2563eb] text-white hover:bg-[#2d6cf4]"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950",
              ].join(" ")}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function DrawerPanel({
  panel,
}: {
  panel: StaffChapterDrawer["hubspotPanel"];
}) {
  return (
    <div className="app-surface rounded-[1.4rem] p-4">
      <div className="flex items-center gap-2">
        <span
          className={[
            "h-2.5 w-2.5 rounded-full",
            panel.accent === "amber"
              ? "bg-amber-400"
              : panel.accent === "violet"
                ? "bg-violet-400"
                : "bg-sky-400",
          ].join(" ")}
        />
        <p className="app-eyebrow app-eyebrow-slate">{panel.title}</p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {panel.metrics.map((metric) => (
          <SupportDetail key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
      <div className="mt-3 rounded-[1.05rem] border border-slate-200 bg-slate-50 px-3 py-3">
        <p className="text-sm leading-6 text-slate-600">{panel.summary}</p>
      </div>
    </div>
  );
}

function getDrawerDecisionTitle(drawer: StaffChapterDrawer) {
  switch (drawer.selectedDecision) {
    case "advance":
      return "Advance posture selected";
    case "hold":
      return "Hold posture selected";
    case "intervene":
      return "Intervention posture selected";
  }
}

function getDrawerDecisionSummary(drawer: StaffChapterDrawer) {
  switch (drawer.selectedDecision) {
    case "advance":
      return `${drawer.chapterName} has enough visible momentum to keep moving with light-touch support. Use the footer to push the chapter into the next campaign step or send a coach-ready brief without turning on live writes.`;
    case "hold":
      return `${drawer.chapterName} should stay in review until follow-up ownership and proof posture are tighter. Clear the blockers before treating this chapter as ready to advance.`;
    case "intervene":
      return `${drawer.chapterName} needs a narrower recovery move now. Use the footer to open the intervention lane or inspect the pending proof backlog before the next chapter push slips further.`;
  }
}

function DetailStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="app-surface rounded-[1.1rem] p-3">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ProofReviewQueueCard({
  item,
  selected,
}: {
  item: StaffProofReviewItem;
  selected: boolean;
}) {
  return (
    <Link
      href={item.reviewHref}
      className={[
        "block rounded-[1.35rem] border p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition",
        selected
          ? "border-[#2563eb] bg-[#f8fbff] shadow-[0_18px_40px_rgba(37,99,235,0.12)]"
          : "border-slate-200 bg-white hover:border-[#bfdbfe] hover:bg-[#fbfdff]",
      ].join(" ")}
    >
      <div className="rounded-[1.1rem] bg-[linear-gradient(180deg,#eff5ff_0%,#eef2f9_100%)] px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
              {item.proofTypeLabel}
            </span>
            <span className="rounded-full bg-[#22c55e] px-2 py-1 text-[0.68rem] font-semibold text-white">
              Q:{item.qualityScore}
            </span>
          </div>
          <span className="rounded-full bg-slate-700/90 px-2 py-1 text-[0.68rem] font-semibold text-white">
            {item.durationLabel}
          </span>
        </div>
        <div className="mt-10 flex items-center justify-center text-slate-400">
          <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold">
            Review preview
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-950">{item.chapterLabel}</p>
          <p className="text-xs text-slate-500">
            {item.contributorLabel} · {item.timeLabel}
          </p>
        </div>
        <Pill tone={consentTone(item.consentStatusLabel)} label={item.visibilityLabel} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-500">
          Engagement:{" "}
          <span className={engagementTone(item.engagementLabel)}>{item.engagementLabel}</span>
        </span>
        {item.engagementStatsLabel ? (
          <span className="text-slate-500">{item.engagementStatsLabel}</span>
        ) : null}
      </div>
    </Link>
  );
}

function ProofReviewPanelCard({ panel }: { panel: StaffProofReviewPanel | null }) {
  return (
    <SectionCard eyebrow="Review actions" title={panel ? panel.title : "Select a content card to review"}>
      {panel ? (
        <>
          <p className="text-sm leading-6 text-slate-600">{panel.subtitle}</p>
          <div className="app-surface-soft mt-4 rounded-[1.05rem] p-4">
            <p className="app-eyebrow app-eyebrow-slate">Consent & visibility</p>
            <Pill tone={consentTone(panel.consentLabel)} label={panel.consentLabel} />
            <p className="mt-3 text-sm leading-6 text-slate-600">{panel.consentSummary}</p>
          </div>
          <div className="app-surface-soft mt-4 rounded-[1.05rem] p-4">
            <p className="app-eyebrow app-eyebrow-slate">Recommended use</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{panel.recommendedUse}</p>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Approve for
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Each lane shows what the current consent posture actually permits before anything is curated or shared.
            </p>
            <div className="mt-3 grid gap-2">
              {panel.approvalOptions.map((option) =>
                option.enabled ? (
                  <Link
                    key={option.key}
                    href={option.href}
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff]"
                  >
                    <p className="text-sm font-semibold text-slate-800">✓ {option.label}</p>
                    <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      {option.statusLabel}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{option.reason}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{option.helper}</p>
                  </Link>
                ) : (
                  <div
                    key={option.key}
                    className="rounded-[1rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-400">{option.label}</p>
                    <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-rose-500">
                      {option.statusLabel}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{option.reason}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {option.helper}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <Link
              href={panel.requestChangesHref}
              className="rounded-[1rem] border border-[#f7d05e]/45 bg-[#fff8df] px-4 py-3 text-center text-sm font-semibold text-[#8a6700]"
            >
              Request Changes
            </Link>
            <Link
              href={panel.rejectHref}
              className="rounded-[1rem] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-center text-sm font-semibold text-[#b91c1c]"
            >
              Reject
            </Link>
            <Link
              href={panel.bestPracticeHref}
              className="rounded-[1rem] bg-[#f59e0b] px-4 py-3 text-center text-sm font-semibold text-white"
            >
              ☆ Mark as Best Practice
            </Link>
          </div>
          <label className="mt-4 block">
            <span className="sr-only">Coach note</span>
            <textarea
              readOnly
              value={panel.notePlaceholder}
              className="min-h-[6rem] w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
            />
          </label>
        </>
      ) : (
        <p className="text-sm leading-6 text-slate-600">
          Select a content card to review whether it is ready to reuse, where it should be shared, and what context still needs a human decision.
        </p>
      )}
    </SectionCard>
  );
}

function FilterMenu({
  label,
  options,
  selectedKey,
}: {
  label: string;
  options: Array<{ key: string; label: string; href: string }>;
  selectedKey: string;
}) {
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff]">
        {label}
        <span className="text-xs text-slate-400">▾</span>
      </summary>
      <div className="absolute right-0 z-10 mt-2 grid min-w-[11rem] gap-1 rounded-[1rem] border border-slate-200 bg-white p-2 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
        {options.map((option) => (
          <Link
            key={option.key}
            href={option.href}
            aria-current={selectedKey === option.key ? "page" : undefined}
            className={[
              "rounded-[0.8rem] px-3 py-2 text-sm transition",
              selectedKey === option.key
                ? "bg-[#eef5ff] font-semibold text-slate-950"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
            ].join(" ")}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

function FeedLibraryCard({
  draft,
  selected,
}: {
  draft: StaffCommandCenter["feedDrafts"][number];
  selected: boolean;
}) {
  return (
    <Link
      href={draft.sourceHref}
      className={[
        "block rounded-[1.2rem] border p-3 transition",
        selected
          ? "border-[#2563eb] bg-[#f8fbff] shadow-[0_12px_30px_rgba(37,99,235,0.12)]"
          : "border-slate-200 bg-white hover:border-[#bfdbfe] hover:bg-[#fbfdff]",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-slate-200 bg-slate-50 text-slate-400">
          <span className="text-xs font-semibold">◫</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-950">{draft.title}</p>
          <p className="mt-1 text-xs text-slate-500">{draft.chapterLabel}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Pill tone={draft.visibilityLabel.includes("Public") ? "good" : "neutral"} label={draft.visibilityLabel} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeedStudioComposer({ commandCenter }: { commandCenter: StaffCommandCenter }) {
  const workspace = commandCenter.feedStudio;
  const draft = workspace.selectedDraft;

  return (
    <div className="grid gap-4">
      {workspace.sourceContext ? (
        <div className="rounded-[1.2rem] border border-[#bfdbfe] bg-[#f8fbff] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="app-eyebrow app-eyebrow-blue">{workspace.sourceContext.eyebrow}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">
                {workspace.sourceContext.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {workspace.sourceContext.summary}
              </p>
            </div>
            <Link
              href={workspace.sourceContext.actionHref}
              className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#eef5ff]"
            >
              {workspace.sourceContext.actionLabel}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3">
        <ReadOnlyField label="Post title" value={draft?.title ?? "Select a draft from the content library"} />
        <ReadOnlyTextArea
          label="Caption / context"
          value={draft?.captionPreview ?? "Caption / context for students..."}
        />
        <ReadOnlyField label="Call to action" value={draft?.callToAction ?? "Point students to the next action"} />
        <div className="grid gap-3 md:grid-cols-2">
          <ReadOnlyField label="Campaign tag" value={workspace.campaignTagLabel} />
          <ReadOnlyField label="Engagement goal" value={workspace.engagementGoalLabel} />
        </div>
      </div>

      <div className="app-surface-soft rounded-[1.2rem] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="app-eyebrow app-eyebrow-slate">Feed preview</p>
          <div className="flex gap-2">
            {workspace.previewRoleOptions.map((option) => (
              <Link
                key={option.key}
                href={option.href}
                aria-current={workspace.previewRole === option.key ? "page" : undefined}
                className={[
                  "rounded-full px-3 py-2 text-xs font-semibold transition",
                  workspace.previewRole === option.key
                    ? "bg-[#2563eb] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950",
                ].join(" ")}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <div className="w-full max-w-[16rem] rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
            <div className="rounded-[1rem] bg-[#0b3a88] px-3 py-2 text-xs font-semibold text-white">
              myMEDLIFE Feed
            </div>
            <div className="mt-3 rounded-[1rem] bg-slate-50 px-3 py-4 text-center text-slate-400">
              Preview
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-950">
              {draft?.title ?? "Post title here"}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {draft?.captionPreview ?? "Caption appears here for students."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="neutral" label={workspace.previewRole === "member" ? "Member feed" : "Leader feed"} />
              {draft ? <Pill tone="neutral" label={draft.visibilityLabel} /> : null}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={draft?.sourceHref ?? `${commandCenter.routeBase}?view=feed_studio`}
            className="flex-1 rounded-[1rem] bg-[#0b5fc4] px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Share with {workspace.targetChapterCountLabel}
          </Link>
          <Link
            href={draft?.sourceHref ?? `${commandCenter.routeBase}?view=feed_studio`}
            className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Schedule
          </Link>
          <Link
            href={draft?.sourceHref ?? `${commandCenter.routeBase}?view=feed_studio`}
            className="rounded-[1rem] border border-[#f7d05e]/45 bg-[#fff8df] px-4 py-3 text-sm font-semibold text-[#8a6700]"
          >
            Best Practice
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeedStudioAudiencePanel({ commandCenter }: { commandCenter: StaffCommandCenter }) {
  const workspace = commandCenter.feedStudio;

  return (
    <div className="grid gap-4">
      <div>
        <p className="app-eyebrow app-eyebrow-slate">Reach</p>
        <div className="mt-3 grid gap-2">
          {workspace.audienceOptions.map((option) => (
            <Link
              key={option.key}
              href={option.href}
              aria-current={workspace.audienceMode === option.key ? "page" : undefined}
              className="flex items-center gap-2 rounded-[0.95rem] px-1 py-1.5 text-sm transition hover:bg-slate-50"
            >
              <span
                className={[
                  "flex h-4 w-4 items-center justify-center rounded-full border text-[0.65rem]",
                  workspace.audienceMode === option.key
                    ? "border-[#2563eb] bg-[#2563eb] text-white"
                    : "border-slate-300 bg-white text-white",
                ].join(" ")}
              >
                ●
              </span>
              <span
                className={[
                  "font-medium",
                  workspace.audienceMode === option.key ? "text-slate-950" : "text-slate-600",
                ].join(" ")}
              >
                {option.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <ReadOnlyField label="Select campaign" value={workspace.campaignTagLabel} />
      <ChecklistPanel title="Role filter" items={workspace.audienceRoleLabels} activeCount={workspace.audienceRoleLabels.length} />
      <ChecklistPanel title="Chapter status" items={workspace.audienceChapterStatusLabels} activeCount={1} />
      <div className="app-surface-soft rounded-[1rem] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Estimated reach
        </p>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-slate-950">
            {workspace.targetChapterCountLabel}
          </p>
          <p className="text-sm text-slate-600">{workspace.estimatedReachLabel}</p>
        </div>
      </div>
    </div>
  );
}

function FeedAnalyticsSummaryCard({
  card,
  accentIndex,
}: {
  card: StaffCommandCenter["feedAnalytics"]["summaryCards"][number];
  accentIndex: number;
}) {
  const accentClasses = [
    "border-t-[#2563eb]",
    "border-t-[#f7d05e]",
    "border-t-[#60a5fa]",
    "border-t-[#34d399]",
    "border-t-[#5eead4]",
    "border-t-[#2dd4bf]",
  ];

  return (
    <div
      className={[
        "rounded-[1.15rem] border border-slate-200 border-t-[3px] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]",
        accentClasses[accentIndex] ?? accentClasses[0],
      ].join(" ")}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {card.label}
      </p>
      <p className="mt-2 text-[2rem] font-semibold leading-none text-slate-950">{card.value}</p>
    </div>
  );
}

function FeedAnalyticsTable({ commandCenter }: { commandCenter: StaffCommandCenter }) {
  if (commandCenter.feedAnalytics.posts.length === 0) {
    return (
      <p className="px-4 py-6 text-sm leading-6 text-slate-600">
        No feed analytics posts are visible in this preview.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[82rem] text-left text-sm text-slate-700">
        <thead className="bg-white text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Post</th>
            <th className="px-4 py-3">Audience</th>
            <th className="px-4 py-3">Chapters</th>
            <th className="px-4 py-3">Views</th>
            <th className="px-4 py-3">Likes</th>
            <th className="px-4 py-3">Comments</th>
            <th className="px-4 py-3">Shares</th>
            <th className="px-4 py-3">Saves</th>
            <th className="px-4 py-3">CTA Clicks</th>
            <th className="px-4 py-3">Actions</th>
            <th className="px-4 py-3">Evidence</th>
            <th className="px-4 py-3">RSVPs</th>
            <th className="px-4 py-3">Published</th>
          </tr>
        </thead>
        <tbody>
          {commandCenter.feedAnalytics.posts.map((post) => {
            const selected = commandCenter.feedAnalytics.selectedPostId === post.id;

            return (
              <tr
                key={post.id}
                className={[
                  "border-t border-slate-200 transition hover:bg-slate-50/80",
                  selected ? "bg-[#f8fbff] shadow-[inset_4px_0_0_0_#2563eb]" : "",
                ].join(" ")}
              >
                <td className="px-4 py-3 align-top">
                  <Link href={post.selectHref} className="block">
                    <p className="font-semibold text-slate-950 hover:text-[#1d4ed8]">
                      {post.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{post.typeLabel}</p>
                  </Link>
                </td>
                <td className="px-4 py-3 align-top text-slate-600">{post.audienceLabel}</td>
                <td className="px-4 py-3 font-semibold text-slate-950">{post.chapterCount}</td>
                <td className="px-4 py-3 font-semibold text-slate-950">{formatWhole(post.views)}</td>
                <td className="px-4 py-3">{formatWhole(post.likes)}</td>
                <td className="px-4 py-3">{formatWhole(post.comments)}</td>
                <td className="px-4 py-3">{formatWhole(post.shares)}</td>
                <td className="px-4 py-3">{formatWhole(post.saves)}</td>
                <td className="px-4 py-3">{formatWhole(post.ctaClicks)}</td>
                <td className="px-4 py-3 font-semibold text-[#0f766e]">{formatWhole(post.actions)}</td>
                <td className="px-4 py-3 font-semibold text-[#0f766e]">{formatWhole(post.evidence)}</td>
                <td className="px-4 py-3 font-semibold text-[#0f766e]">{formatWhole(post.rsvps)}</td>
                <td className="px-4 py-3 text-slate-500">{post.publishedLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FeedAnalyticsImpactPanel({ post }: { post: StaffFeedAnalyticsPost | null }) {
  return (
    <SectionCard
      eyebrow="Impact Analysis"
      title={post ? post.title : "Select a post to inspect impact"}
    >
      {post ? (
        <>
          <div className="grid gap-3">
            {post.impactMetrics.map((metric) => (
              <div
                key={metric.question}
                className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">{metric.question}</p>
                  <span className="text-sm font-semibold text-[#0f766e]">{metric.value}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{metric.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white px-4 py-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Engagement Rate
            </p>
            <p className="mt-2 text-[2.4rem] font-semibold leading-none text-[#08224c]">
              {post.engagementRateLabel}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">likes + comments / views</p>
          </div>

          <div className="mt-4 grid gap-4">
            <FeedAnalyticsBreakdown
              title="Top Engagement"
              rows={post.topEngagement}
            />
            <FeedAnalyticsBreakdown
              title="Low / No Engagement"
              rows={post.lowEngagement}
            />
          </div>
        </>
      ) : (
        <p className="text-sm leading-6 text-slate-600">
          Select a post row to review which chapters engaged, what actions followed, and where reach stayed flat.
        </p>
      )}
    </SectionCard>
  );
}

function FeedAnalyticsBreakdown({
  title,
  rows,
}: {
  title: string;
  rows: StaffFeedAnalyticsPost["topEngagement"];
}) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <div className="mt-3 grid gap-2">
        {rows.map((row) => (
          <div
            key={`${title}-${row.chapterLabel}`}
            className="flex items-center justify-between gap-3 rounded-[0.9rem] border border-transparent px-2 py-2 hover:border-slate-200"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">{row.chapterLabel}</p>
              {row.href && row.actionLabel ? (
                <Link
                  href={row.href}
                  className="mt-1 inline-flex text-xs font-semibold text-[#1d4ed8] transition hover:text-[#1e40af]"
                >
                  {row.actionLabel}
                </Link>
              ) : null}
            </div>
            <span
              className={[
                "shrink-0 text-sm font-semibold",
                row.tone === "danger"
                  ? "text-rose-600"
                  : row.tone === "good"
                    ? "text-[#0f766e]"
                    : "text-slate-600",
              ].join(" ")}
            >
              {row.viewsLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HubSpotActivityBar({
  metric,
}: {
  metric: StaffCommandCenter["hubspotWorkspace"]["matchedActivityMetrics"][number];
}) {
  const progress = metric.total > 0 ? Math.min((metric.current / metric.total) * 100, 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">{metric.label}</p>
        <p className="text-sm font-semibold text-slate-950">
          {metric.current} / {metric.total}
        </p>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#1d4f91]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {value}
      </div>
    </label>
  );
}

function ReadOnlyTextArea({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <div className="min-h-[6rem] rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
        {value}
      </div>
    </label>
  );
}

function ChecklistPanel({
  title,
  items,
  activeCount,
}: {
  title: string;
  items: string[];
  activeCount: number;
}) {
  return (
    <div>
      <p className="app-eyebrow app-eyebrow-slate">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item, index) => {
          const checked = index < activeCount;
          return (
            <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
              <span
                className={[
                  "flex h-4 w-4 items-center justify-center rounded border text-[0.65rem]",
                  checked
                    ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                    : "border-slate-200 bg-white text-white",
                ].join(" ")}
              >
                ✓
              </span>
              <span>{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BestPracticeCard({
  card,
  selected,
}: {
  card: StaffBestPracticeCard;
  selected: boolean;
}) {
  return (
    <SectionCard
      eyebrow={selected ? `${card.categoryLabel} · Selected` : card.categoryLabel}
      title={card.title}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {card.chapterLabel} · {card.countryLabel} · {card.campaignLabel}
          </p>
          {selected ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1d4f91]">
              Selected for sharing
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Eng. Score
          </p>
          <p className="mt-1 text-3xl font-semibold text-[#1d4f91]">{card.engagementScore}</p>
        </div>
      </div>
      <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white px-4 py-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Why it worked
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{card.whyItWorked}</p>
      </div>
      <div className="mt-4 rounded-[1rem] border border-emerald-100 bg-emerald-50 px-4 py-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">
          KPI Result
        </p>
        <p className="mt-2 text-sm font-semibold text-emerald-700">{card.kpiResult}</p>
      </div>
      <div className="mt-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Recommended For
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {card.recommendedForLabels.map((label) => (
            <span
              key={label}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Link
          href={card.shareHref}
          className="rounded-[1rem] bg-[#1d4f91] px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Share to Feed
        </Link>
        <Link
          href={card.coachHref}
          className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
        >
          Send to Coaches
        </Link>
        <Link
          href={card.href}
          className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700"
        >
          Open
        </Link>
      </div>
    </SectionCard>
  );
}

function AdminIntegrationStatusRow({
  status,
}: {
  status: StaffAdminIntegrationStatus;
}) {
  return (
    <article className="border-b border-slate-200 px-1 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{status.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {status.lastSyncLabel}
          </p>
        </div>
        <Pill tone={integrationStatusTone(status.status)} label={status.status} />
      </div>
      {status.note ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{status.note}</p>
      ) : null}
    </article>
  );
}

function AdminDataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[];
}) {
  return (
    <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
      <thead className="bg-slate-50">
        <tr>
          {columns.map((column) => (
            <th
              key={column}
              className="border-b border-slate-200 px-3 py-3 text-left text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500"
              scope="col"
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

function AdminOutboxRowView({
  row,
}: {
  row: StaffAdminOutboxRow;
}) {
  return (
    <tr className="odd:bg-white even:bg-slate-50/55">
      <AdminTableCell>{row.eventLabel}</AdminTableCell>
      <AdminTableCell>{row.sourceLabel}</AdminTableCell>
      <AdminTableCell>{row.destinationLabel}</AdminTableCell>
      <AdminTableCell>
        <Pill tone={outboxStatusTone(row.status)} label={row.status} />
      </AdminTableCell>
      <AdminTableCell>{row.retries}</AdminTableCell>
      <AdminTableCell>{row.errorLabel}</AdminTableCell>
      <AdminTableCell>{row.createdLabel}</AdminTableCell>
      <AdminTableCell>{row.processedLabel}</AdminTableCell>
    </tr>
  );
}

function AdminAuditRowView({
  row,
}: {
  row: StaffAdminAuditRow;
}) {
  return (
    <tr className="odd:bg-white even:bg-slate-50/55">
      <AdminTableCell>{row.actorLabel}</AdminTableCell>
      <AdminTableCell>
        <Pill tone={auditRoleTone(row.roleLabel)} label={row.roleLabel} />
      </AdminTableCell>
      <AdminTableCell>{row.actionLabel}</AdminTableCell>
      <AdminTableCell>{row.objectLabel}</AdminTableCell>
      <AdminTableCell>{row.chapterLabel}</AdminTableCell>
      <AdminTableCell>{row.timestampLabel}</AdminTableCell>
    </tr>
  );
}

function AdminTableCell({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-slate-100 px-3 py-3 text-sm text-slate-700 last:border-b-0">
      {children}
    </td>
  );
}

function SupportDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="app-surface rounded-[1.05rem] p-3">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}

function HeroContextPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/28 bg-white/92 px-3 py-1 text-xs font-semibold text-slate-800">
      {label}
    </span>
  );
}

function SidebarCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="app-surface rounded-[1.75rem] p-4">
      <p className="app-eyebrow app-eyebrow-slate">{eyebrow}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{title}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="app-surface rounded-[1.75rem] p-5">
      <p className="app-eyebrow app-eyebrow-slate">{eyebrow}</p>
      <h2 className="mt-2 text-[1.38rem] font-semibold leading-tight text-slate-950 sm:text-[1.5rem]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ToplineMetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <section className="app-surface rounded-[1.5rem] bg-white/94 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.06)]">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-3 text-[2rem] font-semibold leading-none text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
    </section>
  );
}

function PortfolioSummaryTile({
  card,
}: {
  card: StaffPortfolioSummaryCard;
}) {
  return (
    <div
      className={[
        "rounded-[1.2rem] border bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]",
        card.tone === "blue"
          ? "border-[#bfdbfe]"
          : card.tone === "yellow"
            ? "border-[#f7d05e]/45"
            : "border-rose-200",
      ].join(" ")}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {card.label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{card.value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{card.note}</p>
    </div>
  );
}

function HeroMiniStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="app-surface rounded-[1.25rem] bg-white/96 p-4 shadow-[0_12px_28px_rgba(4,18,40,0.16)]">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{note}</p>
    </div>
  );
}

function InlineCallout({
  eyebrow,
  body,
  tone,
}: {
  eyebrow: string;
  body: string;
  tone: "blue" | "amber";
}) {
  return (
    <div
      className={[
        "rounded-[1.2rem] border p-3",
        tone === "blue"
          ? "border-[#bfdbfe] bg-[#eef5ff]"
          : "border-[#f7d05e]/45 bg-[#fff8df]",
      ].join(" ")}
    >
      <p
        className={[
          "app-eyebrow",
          tone === "blue" ? "app-eyebrow-blue" : "app-eyebrow-warm",
        ].join(" ")}
      >
        {eyebrow}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
    </div>
  );
}

function CompactMetricTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="app-surface rounded-[1.3rem] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-3 text-[2.6rem] font-semibold leading-none text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{note}</p>
    </div>
  );
}

function PrioritySnapshotStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="app-surface-soft rounded-[1.25rem] p-4">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{note}</p>
    </div>
  );
}

function CompactRailStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warning" | "danger" | "neutral";
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.08] px-3 py-2 backdrop-blur-sm">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/58">
        {label}
      </p>
      <p className="text-sm font-semibold text-white">{value}</p>
      {tone ? <Pill tone={tone} label={tone === "danger" ? "Watch" : "Live"} /> : null}
    </div>
  );
}

function Pill({
  tone,
  label,
}: {
  tone: "good" | "warning" | "danger" | "neutral";
  label: string;
}) {
  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-semibold capitalize",
        tone === "good"
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
          : tone === "warning"
            ? "border border-amber-200 bg-amber-50 text-amber-700"
            : tone === "danger"
              ? "border border-rose-200 bg-rose-50 text-rose-700"
              : "border border-slate-200 bg-white text-slate-600",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function formatWhole(value: number) {
  return value.toLocaleString();
}

function consentTone(status: string) {
  if (status === "Public") {
    return "good";
  }

  if (status === "Selected chapters only" || status === "Chapter only") {
    return "neutral";
  }

  return "warning";
}

function engagementTone(status: StaffProofReviewItem["engagementLabel"]) {
  switch (status) {
    case "high potential":
      return "text-[#15803d]";
    case "medium potential":
      return "text-[#b45309]";
    case "low potential":
      return "text-[#b91c1c]";
  }
}

function integrationStatusTone(status: StaffAdminIntegrationStatus["status"]) {
  switch (status) {
    case "live":
      return "good";
    case "degraded":
      return "warning";
    case "mock":
      return "neutral";
  }
}

function outboxStatusTone(status: StaffAdminOutboxRow["status"]) {
  switch (status) {
    case "success":
      return "good";
    case "failed":
      return "danger";
    case "pending":
      return "warning";
  }
}

function getSelectedViewSurfaceTitle(view: StaffCommandCenter["selectedView"]) {
  switch (view) {
    case "chapters":
      return "Portfolio Overview";
    case "campaigns":
      return "Campaign Operations";
    case "proof_ugc":
      return "Proof / UGC Review Queue";
    case "feed_studio":
      return "Feed Curation Studio";
    case "feed_analytics":
      return "Feed Analytics";
    case "hubspot":
      return "HubSpot + Chapter Intelligence";
    case "best_practices":
      return "Best Practices Library";
    case "admin":
      return "System Health";
    default:
      return "Portfolio Overview";
  }
}

function StaffViewIcon({ view }: { view: StaffCommandCenterView }) {
  const iconClassName = "h-[1rem] w-[1rem]";

  switch (view) {
    case "chapters":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="4" y="5" width="7" height="6" rx="1.6" />
          <rect x="13" y="5" width="7" height="6" rx="1.6" />
          <rect x="4" y="13" width="7" height="6" rx="1.6" />
          <rect x="13" y="13" width="7" height="6" rx="1.6" />
        </svg>
      );
    case "campaigns":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M6 5v14" />
          <path d="m6 6 9 2.2-2.2 3.1L18 14l-12-1.4" />
        </svg>
      );
    case "proof_ugc":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="4" y="6" width="11" height="12" rx="2" />
          <path d="m15 10 5-3v10l-5-3" />
        </svg>
      );
    case "feed_studio":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M5 18h4l9-9-4-4-9 9v4Z" />
          <path d="m12.5 6.5 4 4" />
        </svg>
      );
    case "feed_analytics":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M5 19V9" />
          <path d="M10 19V5" />
          <path d="M15 19v-7" />
          <path d="M20 19v-4" />
        </svg>
      );
    case "hubspot":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="8" cy="8" r="2.5" />
          <circle cx="16.5" cy="6.5" r="2" />
          <circle cx="16.5" cy="16.5" r="2" />
          <path d="M10.3 9.2 14.5 7.4" />
          <path d="M10.1 10.6 14.7 14.7" />
          <path d="M6.8 10.4 6 15.5" />
        </svg>
      );
    case "best_practices":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M6 5.5h10a2 2 0 0 1 2 2V19l-4-2-4 2-4-2V7.5a2 2 0 0 1 2-2Z" />
          <path d="M9 9h6" />
          <path d="M9 12h6" />
        </svg>
      );
    case "admin":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M12 4.5 18 7v4.6c0 3.5-2.4 6.7-6 7.9-3.6-1.2-6-4.4-6-7.9V7l6-2.5Z" />
          <path d="M12 9v5" />
          <path d="M12 17h.01" />
        </svg>
      );
  }
}

function auditRoleTone(roleLabel: StaffAdminAuditRow["roleLabel"]) {
  switch (roleLabel) {
    case "Coach":
      return "good";
    case "Admin":
      return "warning";
    case "System":
      return "neutral";
    default:
      return "neutral";
  }
}

function decisionTone(decision: StaffChapterPortfolioRow["decision"]) {
  switch (decision) {
    case "advance":
      return "good";
    case "hold":
      return "warning";
    case "intervene":
      return "danger";
  }
}

function decisionLabel(decision: StaffChapterPortfolioRow["decision"]) {
  switch (decision) {
    case "advance":
      return "Advance";
    case "hold":
      return "Hold";
    case "intervene":
      return "Intervene";
  }
}

function riskTone(risk: StaffChapterPortfolioRow["risk"]) {
  switch (risk) {
    case "low":
      return "good";
    case "medium":
      return "warning";
    case "high":
      return "danger";
  }
}

function riskLabel(risk: StaffChapterPortfolioRow["risk"]) {
  switch (risk) {
    case "low":
      return "Healthy";
    case "medium":
      return "At Risk";
    case "high":
      return "Intervene";
  }
}

function coachTableLabel(coachName: string) {
  switch (coachName) {
    case "Maria":
      return "M.S.";
    case "James":
      return "J.O.";
    case "Aisha":
      return "A.K.";
    case "Carlos":
      return "C.Q.";
    case "Fernanda":
      return "F.L.";
    case "Lucia":
      return "L.H.";
    case "Samuel":
      return "S.M.";
    default:
      return coachName;
  }
}

function statusTone(status: StaffChapterDrawer["statusLabel"]) {
  switch (status) {
    case "On Track":
    case "Complete":
      return "good";
    case "Behind":
    case "Paused":
      return "warning";
    case "Not Started":
      return "danger";
  }
}
