import Link from "next/link";
import type { ReactNode } from "react";

import { ChapterLeaderEventCommitteeFilterSelect } from "@/components/chapter-leader-event-committee-filter-select";
import { ChapterLeaderLeaderboardRegionFilterSelect } from "@/components/chapter-leader-leaderboard-region-filter-select";
import { ChapterLeaderPipelineFilterSelect } from "@/components/chapter-leader-pipeline-filter-select";
import {
  buildChapterLeaderAssignmentFlowHref,
  buildChapterLeaderCommitteeFlowHref,
  buildChapterLeaderEventFlowHref,
  buildChapterLeaderProofUploadHref,
  buildChapterLeaderCommandCenterHref,
  type ChapterLeaderCommandCenter,
  type ChapterLeaderCommandCenterCommitteeCard,
  type ChapterLeaderCommandCenterEventCard,
  type ChapterLeaderCommandCenterLeadershipRole,
  type ChapterLeaderCommandCenterMemberProfile,
  type ChapterLeaderCommandCenterPipelineRow,
  type ChapterLeaderCommandCenterQuickAction,
  type ChapterLeaderCommandCenterRiskAlert,
  type ChapterLeaderCommandCenterSuccessionCandidate,
  type ChapterLeaderCommandCenterView,
} from "@/services/chapter-leader-command-center";

type ChapterLeaderCommandCenterPanelProps = {
  commandCenter: ChapterLeaderCommandCenter;
};

export function ChapterLeaderCommandCenterPanel({
  commandCenter,
}: ChapterLeaderCommandCenterPanelProps) {
  if (!commandCenter.canReadCommandCenter) {
    return null;
  }

  const isOverview = commandCenter.selectedView === "overview";
  const heroActions = orderCommandCenterActions(commandCenter.quickActions, [
    "Create Event",
    "Assign Action",
  ]);
  const overviewQuickActions = orderCommandCenterActions(commandCenter.quickActions, [
    "Review Members",
    "Assign Action",
    "Promote Emerging Leader",
    "Create Event",
    "Share Bridge Video",
  ]);
  const dashboardHeading = getDashboardHeading(commandCenter.eventsOverview.monthLabel);
  const healthRankingLabel = getHealthRankingLabel(commandCenter);
  const showMemberHomeHandoff = commandCenter.selectedSource === "member_home";
  const memberHomeHandoffPreview = showMemberHomeHandoff
    ? commandCenter.sourceContext?.preview ?? null
    : null;
  const preservedChapterState = {
    source: commandCenter.selectedSource,
    memberId: commandCenter.navigationMemberId,
    bestPracticeChapterId:
      commandCenter.selectedSource === "leaderboard"
        ? commandCenter.selectedBestPracticeChapterId
        : null,
    leaderboardMetric: commandCenter.selectedLeaderboardMetric,
    leaderboardRegion: commandCenter.selectedLeaderboardRegion,
    pipelineFilter: commandCenter.selectedPipelineFilter,
    searchQuery: commandCenter.pipelineSearchQuery,
    feedPostId: commandCenter.selectedFeedPostId,
  } as const;

  return (
    <section className="grid gap-4 xl:grid-cols-[17.25rem_minmax(0,1fr)] xl:items-start">
      {showMemberHomeHandoff && commandCenter.sourceContext ? (
        <section className="rounded-[1.35rem] border border-[#bfdbfe] bg-[#f8fbff] p-4 xl:col-span-2">
          <p className="app-eyebrow app-eyebrow-blue">{commandCenter.sourceContext.eyebrow}</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            {commandCenter.sourceContext.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {commandCenter.sourceContext.summary}
          </p>
          {commandCenter.sourceContext.actions?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {commandCenter.sourceContext.actions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    action.label === "Student view"
                      ? "border border-[#f7d05e]/40 bg-[#fff8df] text-[#a16207] hover:border-[#f7d05e]/60 hover:bg-[#ffefb0]"
                      : "border border-[#bfdbfe] bg-white text-[#0b5fc4] hover:border-[#93c5fd] hover:bg-[#eef5ff]",
                  ].join(" ")}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {memberHomeHandoffPreview ? (
        <section className="rounded-[1.45rem] border border-[#dbeafe] bg-white p-3.5 shadow-[0_12px_30px_rgba(37,99,235,0.08)] xl:col-span-2">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
                {memberHomeHandoffPreview.heading}
              </p>
              <h3 className="mt-2 text-[1.7rem] font-semibold leading-tight text-slate-950">
                {memberHomeHandoffPreview.chapterLabel}
              </h3>
            </div>
            <p className="max-w-[42rem] text-sm leading-6 text-slate-600">
              Review the immediate leadership health before moving into the full command center.
            </p>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {memberHomeHandoffPreview.stats.map((stat) => (
              <HandoffPreviewStatCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {memberHomeHandoffPreview.sections.map((section) => (
              <HandoffPreviewSectionCard key={section.title} {...section} />
            ))}
          </div>
        </section>
      ) : null}

      <aside className="xl:sticky xl:top-24">
        <section className="rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(160deg,#0b234d_0%,#0a3171_50%,#08162d_100%)] p-4 shadow-[0_24px_80px_rgba(2,14,38,0.3)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#f7d05e] text-sm font-semibold text-[#08224c]">
              M
            </div>
            <div>
              <p className="text-base font-semibold text-white">myMEDLIFE</p>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/50">
                Leadership Center
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-[1.15rem] border border-[#f7d05e]/20 bg-[rgba(15,23,42,0.42)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f7d05e]">
                  Active Campaign
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {commandCenter.activeCampaignLabel}
                </p>
              </div>
              <span className="rounded-full border border-[#f7d05e]/35 bg-[#f7d05e]/12 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#f8df89]">
                Live
              </span>
            </div>
          </div>
          <div className="mt-4 border-t border-white/12 pt-4">
            <nav aria-label="Leadership command center views" className="grid gap-3">
              {commandCenter.navGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/42">
                    {group.label}
                  </p>
                  <div className="mt-2 grid gap-2">
                    {commandCenter.viewOptions
                      .filter((option) => group.viewKeys.includes(option.key))
                      .map((option) => (
                        <div key={option.key} className="relative">
                          <span
                            aria-hidden="true"
                            className={[
                              "pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 transition",
                              commandCenter.selectedView === option.key
                                ? "text-white"
                                : "text-white/58",
                            ].join(" ")}
                          >
                            <ChapterNavIcon view={option.key} />
                          </span>
                          <Link
                            href={option.href}
                            aria-current={
                              commandCenter.selectedView === option.key ? "page" : undefined
                            }
                            className={[
                              "block rounded-[1rem] px-3 py-2.5 pl-11 text-sm font-semibold transition",
                              commandCenter.selectedView === option.key
                                ? "bg-[#2563eb] text-white shadow-[0_10px_24px_rgba(37,99,235,0.32)]"
                                : "border border-white/10 bg-white/[0.05] text-white/74 hover:border-white/18 hover:bg-white/[0.1] hover:text-white",
                            ].join(" ")}
                          >
                            {option.label}
                          </Link>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          <div className="mt-4 border-t border-white/12 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb] text-sm font-semibold text-white">
                {getInitials(commandCenter.sidebarLeaderLabel)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {commandCenter.sidebarLeaderLabel}
                </p>
                <p className="truncate text-xs text-white/60">
                  {commandCenter.sidebarLeaderRoleLabel}
                </p>
              </div>
            </div>
          </div>
        </section>
      </aside>

      <div className="grid gap-4">
        {commandCenter.sourceContext && !showMemberHomeHandoff ? (
          <section className="rounded-[1.35rem] border border-[#bfdbfe] bg-[#f8fbff] p-4">
            <p className="app-eyebrow app-eyebrow-blue">{commandCenter.sourceContext.eyebrow}</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {commandCenter.sourceContext.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {commandCenter.sourceContext.summary}
            </p>
            {commandCenter.sourceContext.actions?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {commandCenter.sourceContext.actions.map((action) => (
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

        {isOverview ? (
          <div className="grid gap-4">
            <section className="rounded-[1.85rem] border border-[#5d8ff6]/22 bg-[linear-gradient(150deg,#061a3a_0%,#08254f_58%,#081327_100%)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
              <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/48">
                    Chapter Leadership Home
                  </p>
                  <div className="mt-3 min-w-0">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/48">
                      {dashboardHeading}
                    </p>
                    <h1 className="mt-2 text-[1.9rem] font-semibold leading-[1.05] text-white sm:text-[2.1rem]">
                      {commandCenter.chapterName}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-white/72">
                      {commandCenter.sidebarLeaderLabel}
                      {", "}
                      {commandCenter.sidebarLeaderRoleLabel}
                      {" · "}
                      {commandCenter.regionLabel}
                      {" Region"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {commandCenter.activeProgramLabels.map((label) => (
                        <ContextPill key={label} label={label} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <HeroProgressStat
                      label="E-Board roles"
                      value={commandCenter.successionOverview.eboardRolesFilledLabel}
                    />
                    <HeroProgressStat
                      label="Committees active"
                      value={commandCenter.successionOverview.activeCommitteesLabel}
                    />
                    <HeroStatusStat
                      label="Health Score"
                      value={healthRankingLabel}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {heroActions.map((action) => (
                      <QuickActionLink key={action.label} action={action} variant="hero" />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <SectionCard eyebrow="Chapter Metrics" title={getChapterMetricsHeading(commandCenter)}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {commandCenter.metrics.map((metric) => (
                  <ToplineMetricCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    note={metric.note}
                  />
                ))}
              </div>
            </SectionCard>

            <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionCard eyebrow="Risk Alerts" title="Risk Alerts">
                <div className="mb-4">
                  <span className="rounded-full border border-[#fef3c7] bg-[#fffbeb] px-3 py-1 text-xs font-semibold text-[#a16207]">
                    {commandCenter.riskAlerts.length} active
                  </span>
                </div>
                <div className="grid gap-3">
                  {commandCenter.riskAlerts.map((alert) => (
                    <RiskAlertCard key={alert.title} alert={alert} />
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="This Week's Priority"
                title="This Week's Priority"
              >
                {commandCenter.weeklyPriority ? (
                  <>
                    <p className="text-base font-semibold leading-7 text-slate-950">
                      {commandCenter.weeklyPriority.title}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={commandCenter.weeklyPriority.primaryHref}
                        className="rounded-full border border-[#f7d05e]/45 bg-[#fff8df] px-3 py-1.5 text-sm font-semibold text-[#a16207]"
                      >
                        {commandCenter.weeklyPriority.primaryLabel}
                      </Link>
                      <Link
                        href={commandCenter.weeklyPriority.secondaryHref}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                      >
                        {commandCenter.weeklyPriority.secondaryLabel}
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-sm leading-6 text-slate-600">
                    This leadership surface is only visible to chapter-leader personas.
                  </p>
                )}
              </SectionCard>
            </section>

            <SectionCard eyebrow="Quick Actions" title="Quick Actions">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {overviewQuickActions.map((action) => (
                  <QuickActionLink key={action.label} action={action} variant="overview" />
                ))}
              </div>
            </SectionCard>

            <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
              <SectionCard eyebrow="Weekly Points Trend" title="Weekly Points Trend">
                <ChapterPointsTrendChart points={commandCenter.chapterPointsTrend} />
              </SectionCard>

              <SectionCard eyebrow="Role coverage" title="Who visibly owns each leadership lane?">
                <div className="grid gap-3 sm:grid-cols-2">
                  {commandCenter.leadershipRoles.map((role) => (
                    <LeadershipRoleCard key={role.key} role={role} />
                  ))}
                </div>
              </SectionCard>
            </section>
          </div>
        ) : null}

        {renderView(commandCenter, preservedChapterState)}
      </div>
    </section>
  );
}

function renderView(
  commandCenter: ChapterLeaderCommandCenter,
  preservedChapterState: {
    source: ChapterLeaderCommandCenter["selectedSource"];
    memberId: string | null;
    bestPracticeChapterId: string | null;
    leaderboardMetric: ChapterLeaderCommandCenter["selectedLeaderboardMetric"];
    leaderboardRegion: ChapterLeaderCommandCenter["selectedLeaderboardRegion"];
    pipelineFilter: ChapterLeaderCommandCenter["selectedPipelineFilter"];
    searchQuery: string;
    feedPostId: string | null;
  },
) {
  const selectedMemberAddNoteAction = commandCenter.selectedMember?.leadershipActions.find(
    (action) => action.label === "Add Note",
  );

  switch (commandCenter.selectedView) {
    case "leaderboard":
      return (
        <section className="grid gap-4">
          <SectionCard
            eyebrow="Leaderboard"
            title="Leaderboard"
          >
            <div className="flex flex-col gap-3">
              <p className="text-sm leading-6 text-slate-600">
                Learn from top chapters. Find ideas to try. Rise together.
              </p>
              <div className="flex flex-wrap gap-2">
                {commandCenter.leaderboardFilters.map((filter) => (
                  <LeaderboardFilterPill key={filter.key} filter={filter} />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <ChapterLeaderLeaderboardRegionFilterSelect
                  options={commandCenter.leaderboardRegionOptions}
                  selectedKey={commandCenter.selectedLeaderboardRegion}
                />
              </div>
            </div>

            <div className="mt-4 rounded-[1.2rem] border border-[#bfdbfe] bg-[#f8fbff] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                Ideas to try
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {commandCenter.leaderboardIdeaNote}
              </p>
            </div>

            <div className="mt-4 grid gap-4">
              {commandCenter.leaderboardChapters.map((chapter) => (
                <ChapterBenchmarkCard key={chapter.id} chapter={chapter} />
              ))}
            </div>
          </SectionCard>
        </section>
      );
    case "members":
      return (
        <section className="grid gap-4">
          {commandCenter.activeQuickAction === "export_members" ? (
            <SectionCard
              eyebrow="Export Members"
              title="Start from the member pipeline, then open the roster export lane."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <p className="text-sm leading-6 text-slate-600">
                  Keep the pipeline filters, the active member context, and the chapter-owned
                  readiness view visible while you decide what roster slice actually needs to
                  travel. Once the export target is clear, open the broader membership workspace
                  without losing the command-center context.
                </p>
                <Link
                  href="/chapter/members"
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open roster export
                </Link>
              </div>
            </SectionCard>
          ) : null}
          {commandCenter.activeQuickAction === "add_member" ? (
            <SectionCard
              eyebrow="Add Member"
              title="Start from the member pipeline, then open the intake lane."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <p className="text-sm leading-6 text-slate-600">
                  Keep pipeline coverage, join-request pressure, and the active chapter context
                  visible while you confirm whether this is a roster add, a membership approval,
                  or a role-shaping follow-up. Once that is clear, open the broader membership
                  workspace without dropping the chapter-owned review state.
                </p>
                <Link
                  href="/chapter/members"
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open member intake
                </Link>
              </div>
            </SectionCard>
          ) : null}
          {commandCenter.activeQuickAction === "ask_members_to_respond" ? (
            <SectionCard
              eyebrow="Ask Members to Respond"
              title="Start from the re-engagement queue, then open a member review."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="grid gap-3">
                  <p className="text-sm leading-6 text-slate-600">
                    Keep the feed-analytics follow-up context visible while you decide who needs a
                    human nudge next. Once the right student is in focus, open a person-level
                    review without losing the chapter-owned re-engagement queue.
                  </p>
                  {commandCenter.selectedFeedPost ? (
                    <p className="text-sm font-semibold text-slate-950">
                      Post in focus: {commandCenter.selectedFeedPost.title}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {commandCenter.selectedFeedPost ? (
                    <Link
                      href={buildChapterLeaderCommandCenterHref("feed_analytics", {
                        source: "feed_analytics",
                        memberId: commandCenter.navigationMemberId,
                        pipelineFilter: commandCenter.selectedPipelineFilter,
                        searchQuery: commandCenter.pipelineSearchQuery,
                        feedPostId: commandCenter.selectedFeedPost.id,
                      })}
                      className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Back to selected post
                    </Link>
                  ) : null}
                  <Link
                    href={
                      commandCenter.selectedMember?.profileHref ??
                      buildChapterLeaderCommandCenterHref("member_profile", {
                        source: "feed_analytics",
                        memberId: commandCenter.selectedMemberId,
                        pipelineFilter: "follow_up",
                        searchQuery: commandCenter.pipelineSearchQuery,
                        feedPostId: commandCenter.selectedFeedPostId,
                      })
                    }
                    className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Open member review
                  </Link>
                </div>
              </div>
            </SectionCard>
          ) : null}
          {commandCenter.activeQuickAction === "assign_action" ? (
            <SectionCard
              eyebrow="Assign Action"
              title="Start from the member pipeline, then open the assignment lane."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <p className="text-sm leading-6 text-slate-600">
                  Keep the selected member and pipeline context visible while you confirm who
                  needs the next push. Once the right student is in focus, open the assignment
                  flow without losing the chapter-owned review state.
                </p>
                <Link
                  href={buildChapterLeaderAssignmentFlowHref({
                    source: commandCenter.selectedSource,
                    memberId: commandCenter.selectedMemberId,
                    pipelineFilter: commandCenter.selectedPipelineFilter,
                    searchQuery: commandCenter.pipelineSearchQuery,
                  })}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open assignment flow
                </Link>
              </div>
            </SectionCard>
          ) : null}
          {commandCenter.activeQuickAction === "review_members" ? (
            <SectionCard
              eyebrow="Review Members"
              title="Start from the member pipeline, then open the right member review."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <p className="text-sm leading-6 text-slate-600">
                  Keep join requests, pipeline coverage, and the active chapter context visible
                  while you confirm who needs a human follow-up next. Once the right student is in
                  focus, open a person-level review without dropping the chapter-owned member queue.
                </p>
                <Link
                  href={
                    commandCenter.selectedMember?.profileHref ??
                    buildChapterLeaderCommandCenterHref("member_profile", {
                      source: commandCenter.selectedSource,
                      memberId: commandCenter.selectedMemberId,
                      pipelineFilter: commandCenter.selectedPipelineFilter,
                      searchQuery: commandCenter.pipelineSearchQuery,
                    })
                  }
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open member review
                </Link>
              </div>
            </SectionCard>
          ) : null}
          <section className="grid gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Member Pipeline
                </p>
                <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight text-slate-950 sm:text-[1.9rem]">
                  Member Pipeline
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Identify future leaders through action, consistency, and character - not popularity.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={buildChapterLeaderCommandCenterHref("members", {
                    source: commandCenter.selectedSource,
                    memberId: commandCenter.navigationMemberId,
                    pipelineFilter: commandCenter.selectedPipelineFilter,
                    searchQuery: commandCenter.pipelineSearchQuery,
                    quickAction: "export_members",
                  })}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Export
                </Link>
                <Link
                  href={buildChapterLeaderCommandCenterHref("members", {
                    source: commandCenter.selectedSource,
                    memberId: commandCenter.navigationMemberId,
                    pipelineFilter: commandCenter.selectedPipelineFilter,
                    searchQuery: commandCenter.pipelineSearchQuery,
                    quickAction: "add_member",
                  })}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Add Member
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/90 p-3.5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 xl:min-w-[34rem] xl:flex-1 xl:flex-row xl:items-center">
                <form action="/chapter" method="get" className="min-w-0 xl:flex-[1.15]">
                  <input type="hidden" name="view" value="members" />
                  <label className="sr-only" htmlFor="member-pipeline-search">
                    Search members
                  </label>
                  <div className="rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                    <input
                      id="member-pipeline-search"
                      name="q"
                      type="search"
                      defaultValue={commandCenter.pipelineSearchQuery}
                      placeholder="Search members…"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  {commandCenter.selectedPipelineFilter !== "all" ? (
                    <input
                      type="hidden"
                      name="pipeline"
                      value={commandCenter.selectedPipelineFilter}
                    />
                  ) : null}
                  {commandCenter.selectedSource ? (
                    <input type="hidden" name="source" value={commandCenter.selectedSource} />
                  ) : null}
                </form>

                <ChapterLeaderPipelineFilterSelect
                  options={commandCenter.pipelineFilterOptions}
                  selectedKey={commandCenter.selectedPipelineFilter}
                />
              </div>

              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                {commandCenter.pipelineRows.length} of {commandCenter.pipelineTotalCount} members
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.3rem] border border-slate-200 bg-white">
              <ChapterMemberPipelineTable rows={commandCenter.pipelineRows} />
            </div>
          </section>
        </section>
      );
    case "member_profile":
      return (
        commandCenter.selectedMember ? (
          <section className="grid gap-4">
            <section className="grid gap-2 px-1">
              <p className="app-eyebrow">Member Profile</p>
              <Link
                href={commandCenter.selectedMember.backToPipelineHref}
                className="inline-flex w-fit text-sm font-semibold text-slate-600 hover:text-slate-950"
              >
                Back to Member Pipeline
              </Link>
            </section>

            {renderMemberProfileQuickActionState(commandCenter)}

            {commandCenter.selectedMember.reviewContext ? (
              <div className="rounded-[1.15rem] border border-[#bfdbfe] bg-[#f8fbff] px-4 py-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="grid gap-2">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                      {commandCenter.selectedMember.reviewContext.eyebrow}
                    </p>
                    <p className="text-base font-semibold text-slate-950">
                      {commandCenter.selectedMember.reviewContext.title}
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      {commandCenter.selectedMember.reviewContext.summary}
                    </p>
                  </div>
                  <Link
                    href={commandCenter.selectedMember.reviewContext.actionHref}
                    className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#eef5ff]"
                  >
                    {commandCenter.selectedMember.reviewContext.actionLabel}
                  </Link>
                </div>
              </div>
            ) : null}

            {commandCenter.selectedSource === "feed_analytics" && commandCenter.selectedFeedPost ? (
              <div className="rounded-[1.15rem] border border-[#bfdbfe] bg-[#f8fbff] px-4 py-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                      Post in focus
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-950">
                        {commandCenter.selectedFeedPost.title}
                      </p>
                      <span
                        className={getFeedPostBadgeClassName(
                          commandCenter.selectedFeedPost.badgeLabel,
                        )}
                      >
                        {commandCenter.selectedFeedPost.typeLabel}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {commandCenter.selectedFeedPost.summary}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Review {commandCenter.selectedMember.displayName}
                      {"'"}s next move against this content signal first so the follow-up stays
                      anchored to the actual post that surfaced them.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 xl:items-end">
                    <p className="text-sm text-slate-500">
                      {commandCenter.selectedFeedPost.authorLabel} ·{" "}
                      {commandCenter.selectedFeedPost.dateLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <SelectedPostMetric
                    label="Views"
                    value={commandCenter.selectedFeedPost.viewsLabel}
                  />
                  <SelectedPostMetric
                    label="Likes"
                    value={commandCenter.selectedFeedPost.likesLabel}
                  />
                  <SelectedPostMetric
                    label="Actions After"
                    value={commandCenter.selectedFeedPost.actionsAfterLabel}
                  />
                  <SelectedPostMetric
                    label="RSVPs"
                    value={commandCenter.selectedFeedPost.rsvpsLabel}
                  />
                </div>
              </div>
            ) : null}

            <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr] xl:items-start">
              <div className="grid gap-4">
                <MemberProfileSummaryCard member={commandCenter.selectedMember} />
                <MemberLeadershipActionsCard member={commandCenter.selectedMember} />
              </div>

              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricTile
                    label="Total Points"
                    value={`${commandCenter.selectedMember.points}`}
                    note={commandCenter.selectedMember.weeklyPointsDeltaLabel}
                  />
                  <MetricTile
                    label="Events Created"
                    value={commandCenter.selectedMember.eventsCreatedLabel.split(" ")[0] ?? commandCenter.selectedMember.eventsCreatedLabel}
                    note={commandCenter.selectedMember.eventsCreatedLabel}
                  />
                  <MetricTile
                    label="Actions Done"
                    value={`${commandCenter.selectedMember.completedActions}`}
                    note={`${commandCenter.selectedMember.openAssignments} open assignment${commandCenter.selectedMember.openAssignments === 1 ? "" : "s"} still need follow-through.`}
                  />
                  <MetricTile
                    label="Bridge Videos"
                    value={commandCenter.selectedMember.bridgeVideosLabel.split(" ")[0] ?? commandCenter.selectedMember.bridgeVideosLabel}
                    note={commandCenter.selectedMember.bridgeVideosLabel}
                  />
                </div>

                <SectionCard eyebrow="Momentum" title="Points History — Weekly">
                  <MemberPointsHistoryChart points={commandCenter.selectedMember.pointsHistory} />
                </SectionCard>

                <section className="grid gap-4 xl:grid-cols-2">
                  <SectionCard eyebrow="Values" title="Values Alignment">
                    <div className="grid gap-3">
                      {commandCenter.selectedMember.valuesAlignment.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[1.1rem] border border-slate-200 bg-white p-4"
                        >
                          <p className="text-sm font-semibold text-[#1d4ed8]">{item.label}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard eyebrow="Timeline" title="Activity Timeline">
                    <div className="grid gap-3">
                      {commandCenter.selectedMember.activityTimeline.map((item) => (
                        <TimelineItem
                          key={`${item.dateLabel}-${item.detail}`}
                          dateLabel={item.dateLabel}
                          detail={item.detail}
                        />
                      ))}
                    </div>
                  </SectionCard>
                </section>

                <SectionCard eyebrow="Notes" title="Coach & Leader Notes">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <p className="text-sm leading-6 text-slate-600">
                      Keep notes concrete, useful, and about growth, not popularity.
                    </p>
                    {selectedMemberAddNoteAction ? (
                      <Link
                        href={selectedMemberAddNoteAction.href}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff]"
                      >
                        Add Note
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-3">
                    {commandCenter.selectedMember.leaderNotes.map((note) => (
                      <div
                        key={`${note.dateLabel}-${note.authorLabel}`}
                        className="rounded-[1.15rem] border border-slate-200 bg-white p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {note.dateLabel} - {note.authorLabel}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{note.body}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </section>
          </section>
        ) : (
          <SectionCard eyebrow="Member profile" title="Select a member">
            <p className="text-sm leading-6 text-slate-600">
              Choose a member from the pipeline first so this profile can show leadership context, history, and next-step ownership.
            </p>
          </SectionCard>
        )
      );
    case "committees":
      return (
        <section className="grid gap-4">
          {commandCenter.activeQuickAction === "add_committee" ? (
            <SectionCard
              eyebrow="Add Committee"
              title="Open the committee lane with ownership and operating health in mind."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <p className="text-sm leading-6 text-slate-600">
                  Start from the chapter committees view so the new lane stays attached to chair
                  coverage, chapter health, and the visible operating system before you move into
                  the broader committee workspace.
                </p>
                <Link
                  href={buildChapterLeaderCommitteeFlowHref({
                    source: commandCenter.selectedSource,
                    memberId: commandCenter.navigationMemberId,
                    committeeId: commandCenter.selectedCommitteeId,
                    pipelineFilter: commandCenter.selectedPipelineFilter,
                    searchQuery: commandCenter.pipelineSearchQuery,
                  })}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open committee flow
                </Link>
              </div>
            </SectionCard>
          ) : null}
          <section className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Committees
                </p>
                <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight text-slate-950 sm:text-[1.9rem]">
                  Action Committees
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Monitor whether each committee is moving the chapter forward - not just existing.
                </p>
              </div>
              <Link
                href={buildChapterLeaderCommandCenterHref("committees", {
                  source: commandCenter.selectedSource,
                  memberId: commandCenter.navigationMemberId,
                  committeeId: commandCenter.selectedCommitteeId,
                  pipelineFilter: commandCenter.selectedPipelineFilter,
                  searchQuery: commandCenter.pipelineSearchQuery,
                  quickAction: "add_committee",
                })}
                className="inline-flex rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Add Committee
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <EventOpsStat
                label="Active Committees"
                value={commandCenter.committeesOverview.activeCommitteesLabel}
                note="Committees currently moving with visible activity."
              />
              <EventOpsStat
                label="Total Open Actions"
                value={commandCenter.committeesOverview.totalOpenActionsLabel}
                note="Across all committees"
              />
              <EventOpsStat
                label="Committees Without Chairs"
                value={commandCenter.committeesOverview.committeesWithoutChairsLabel}
                note="Needs visible ownership"
              />
            </div>

            {commandCenter.selectedCommittee ? (
              <div className="mt-4 rounded-[1.2rem] border border-[#bfdbfe] bg-[#eef5ff] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                      Committee in focus
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {commandCenter.selectedCommittee.name} committee
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {commandCenter.selectedCommittee.summary}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                    {commandCenter.selectedCommittee.operatingStatusLabel}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1rem] border border-white/80 bg-white/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Chair
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {commandCenter.selectedCommittee.ownerLabel}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {commandCenter.selectedCommittee.memberCountLabel}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-white/80 bg-white/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Next event
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {commandCenter.selectedCommittee.nextEventTitle}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {commandCenter.selectedCommittee.nextEventTiming}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-white/80 bg-white/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Operating posture
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {commandCenter.selectedCommittee.kpiLabel} healthy
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {commandCenter.selectedCommittee.lumaStatusLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1rem] border border-white/80 bg-white/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Activity visible now
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {commandCenter.selectedCommittee.actionsDoneLabel}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {commandCenter.selectedCommittee.eventsCountLabel} linked to this lane
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-white/80 bg-white/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Next committee move
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {getCommitteeNextMoveTitle(commandCenter.selectedCommittee)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {getCommitteeNextMoveSummary(commandCenter.selectedCommittee)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 rounded-[1rem] border border-white/80 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                      Broader committee workspace
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Keep the chair, next event, and next move visible here first. Once the
                      chapter context feels clear, continue into the broader committee workspace.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={buildChapterLeaderCommandCenterHref("committees", {
                        source: commandCenter.selectedSource,
                        memberId: commandCenter.navigationMemberId,
                        committeeId: commandCenter.selectedCommitteeId,
                        pipelineFilter: commandCenter.selectedPipelineFilter,
                        searchQuery: commandCenter.pipelineSearchQuery,
                        quickAction: "add_committee",
                      })}
                      className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8]"
                    >
                      Add another committee
                    </Link>
                    <Link
                      href={buildChapterLeaderCommitteeFlowHref({
                        source: commandCenter.selectedSource,
                        memberId: commandCenter.navigationMemberId,
                        committeeId: commandCenter.selectedCommitteeId,
                        pipelineFilter: commandCenter.selectedPipelineFilter,
                        searchQuery: commandCenter.pipelineSearchQuery,
                      })}
                      className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Open committee workspace
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3">
              {commandCenter.committees.map((committee) => (
                <CommitteeOperatingRow
                  key={committee.id}
                  committee={committee}
                  isSelected={committee.id === commandCenter.selectedCommitteeId}
                />
              ))}
            </div>
          </section>
        </section>
      );
    case "events":
      return (
        <section className="grid gap-4">
          {commandCenter.activeQuickAction === "create_event" ? (
            <SectionCard
              eyebrow="Create Event"
              title="Open the chapter event lane with ownership and follow-up in mind."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <p className="text-sm leading-6 text-slate-600">
                  Use the chapter events view first so the new event stays attached to the same
                  chapter health, proof posture, and follow-up expectations visible in the command
                  center before you move into the broader event flow.
                </p>
                <Link
                  href={buildChapterLeaderEventFlowHref({
                    source: commandCenter.selectedSource,
                    memberId: commandCenter.navigationMemberId,
                    pipelineFilter: commandCenter.selectedPipelineFilter,
                    searchQuery: commandCenter.pipelineSearchQuery,
                    eventCommitteeFilter: commandCenter.selectedEventCommitteeFilter,
                    quickAction: "create_event",
                  })}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open event flow
                </Link>
              </div>
            </SectionCard>
          ) : null}
          <section className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Events &amp; Attendance
                </p>
                <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight text-slate-950 sm:text-[1.9rem]">
                  Events &amp; Attendance
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Track event execution, proof submission, and follow-up across the chapter.
                </p>
              </div>
              <Link
                href={buildChapterLeaderCommandCenterHref("events", {
                  source: commandCenter.selectedSource,
                  memberId: commandCenter.navigationMemberId,
                  pipelineFilter: commandCenter.selectedPipelineFilter,
                  searchQuery: commandCenter.pipelineSearchQuery,
                  eventCommitteeFilter: commandCenter.selectedEventCommitteeFilter,
                  quickAction: "create_event",
                })}
                className="inline-flex rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Create Event
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-5">
              <EventOpsStat
                label="Events This Month"
                value={`${commandCenter.eventsOverview.totalEventsThisMonth}`}
                note={commandCenter.eventsOverview.monthLabel}
              />
              <EventOpsStat
                label="Avg Attendance Rate"
                value={commandCenter.eventsOverview.attendanceRateLabel}
                note={commandCenter.eventsOverview.attendanceDeltaLabel}
              />
              <EventOpsStat
                label="RSVP Conversion"
                value={commandCenter.eventsOverview.rsvpConversionLabel}
                note="Students turning intent into attendance."
              />
              <EventOpsStat
                label="Events with Proof"
                value={commandCenter.eventsOverview.eventsWithProofLabel}
                note="Visible post-event story capture."
              />
              <EventOpsStat
                label="Follow-ups Overdue"
                value={`${commandCenter.eventsOverview.followUpsOverdue}`}
                note="Events that still need human clean-up."
              />
            </div>

            <div className="overflow-hidden rounded-[1.3rem] border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div>
                  <p className="app-eyebrow app-eyebrow-slate">All events</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">
                    All Events — {commandCenter.eventsOverview.monthLabel}
                  </h2>
                </div>
                <ChapterLeaderEventCommitteeFilterSelect
                  options={commandCenter.eventCommitteeFilters}
                  selectedKey={commandCenter.selectedEventCommitteeFilter}
                />
              </div>
              <ChapterEventsTable
                rows={commandCenter.events}
                selectedEventId={commandCenter.selectedEventId}
              />
            </div>

            {commandCenter.selectedEvent ? (
              <SectionCard
                eyebrow="Event Detail"
                title="Keep the selected event in chapter context before you leave this surface."
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="grid gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {commandCenter.selectedEvent.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {commandCenter.selectedEvent.lane} · {commandCenter.selectedEvent.dateLabel} ·{" "}
                        {commandCenter.selectedEvent.creatorLabel}
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Expected student action
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {commandCenter.selectedEvent.expectedStudentAction}
                        </p>
                      </div>
                      <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Proof prompt
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {commandCenter.selectedEvent.proofPrompt}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={buildChapterLeaderEventFlowHref({
                      source: commandCenter.selectedSource,
                      memberId: commandCenter.navigationMemberId,
                      pipelineFilter: commandCenter.selectedPipelineFilter,
                      searchQuery: commandCenter.pipelineSearchQuery,
                      eventCommitteeFilter: commandCenter.selectedEventCommitteeFilter,
                      eventId: commandCenter.selectedEvent.id,
                    })}
                    className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Open broader event flow
                  </Link>
                </div>
              </SectionCard>
            ) : null}

            <SectionCard eyebrow="Attendance Signal" title="RSVP vs. Actual Attendance">
              <EventAttendanceComparisonChart rows={commandCenter.events} />
            </SectionCard>

            <SectionCard eyebrow="Social Recruiting Data" title="Social Recruiting Data">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full border border-[#fef3c7] bg-[#fffbeb] px-3 py-1 text-xs font-semibold text-[#a16207]">
                      Manual update
                    </span>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Recruiting momentum is being summarized from chapter recaps
                      for now, so use this as a directional signal while you plan
                      the next push.
                    </p>
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-slate-500">
                    {commandCenter.eventsOverview.socialRecruitingNote}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {commandCenter.socialRecruitingMetrics.map((metric) => (
                    <SocialRecruitingMetricTile key={metric.label} metric={metric} />
                  ))}
                </div>
              </div>
            </SectionCard>
          </section>
        </section>
      );
    case "impact":
      const visibleImpactHighlights = commandCenter.selectedImpactHighlight
        ? commandCenter.impactHighlights.filter(
            (highlight) => highlight.id !== commandCenter.selectedImpactHighlight?.id,
          )
        : commandCenter.impactHighlights;
      return (
        <section className="grid gap-4">
          {commandCenter.activeQuickAction === "share_impact_story" ? (
            <SectionCard
              eyebrow="Share Impact Story"
              title="Start from the impact dashboard, then choose how this story should travel."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="grid gap-2">
                  <p className="text-sm leading-6 text-slate-600">
                    Keep the impact context visible before this turns into a generic content task.
                    The story should still feel anchored to a real chapter outcome, not just a
                    reusable asset request.
                  </p>
                  {commandCenter.selectedImpactHighlight ? (
                    <p className="text-sm font-semibold text-slate-700">
                      Story in focus: {commandCenter.selectedImpactHighlight.value}{" "}
                      {commandCenter.selectedImpactHighlight.label}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={buildChapterLeaderCommandCenterHref("bridge_videos", {
                    source: "impact",
                    memberId: commandCenter.navigationMemberId,
                    impactStoryId: commandCenter.selectedImpactHighlightId,
                    pipelineFilter: commandCenter.selectedPipelineFilter,
                    searchQuery: commandCenter.pipelineSearchQuery,
                  })}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open story library
                </Link>
              </div>
            </SectionCard>
          ) : null}
          {commandCenter.activeQuickAction === "create_impact_bridge_video" ? (
            <SectionCard
              eyebrow="Share Bridge Video"
              title="Start from the impact dashboard, then open the bridge-video lane."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="grid gap-2">
                  <p className="text-sm leading-6 text-slate-600">
                    Keep the community outcome and chapter meaning visible first so the bridge
                    video starts from a real story, not a generic content prompt.
                  </p>
                  {commandCenter.selectedImpactHighlight ? (
                    <p className="text-sm font-semibold text-slate-700">
                      Starting from: {commandCenter.selectedImpactHighlight.eyebrow}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={buildChapterLeaderCommandCenterHref("bridge_videos", {
                    source: "impact",
                    memberId: commandCenter.navigationMemberId,
                    impactStoryId: commandCenter.selectedImpactHighlightId,
                    pipelineFilter: commandCenter.selectedPipelineFilter,
                    searchQuery: commandCenter.pipelineSearchQuery,
                  })}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open bridge-video lane
                </Link>
              </div>
            </SectionCard>
          ) : null}
          <section className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Impact Dashboard
                </p>
                <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight text-slate-950 sm:text-[1.9rem]">
                  Impact Dashboard
                </h1>
                <p className="mt-2 text-base font-medium text-slate-700">
                  This is why we do this. Real people. Real change.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Help leaders connect chapter activity to real community and MEDLIFE-wide outcomes, not just internal busyness.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildChapterLeaderCommandCenterHref("impact", {
                    ...preservedChapterState,
                    impactStoryId: commandCenter.selectedImpactHighlightId,
                    quickAction: "share_impact_story",
                  })}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Share Impact Story
                </Link>
                <Link
                  href={buildChapterLeaderCommandCenterHref("impact", {
                    ...preservedChapterState,
                    impactStoryId: commandCenter.selectedImpactHighlightId,
                    quickAction: "create_impact_bridge_video",
                  })}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Share Bridge Video
                </Link>
              </div>
            </div>

            {commandCenter.selectedImpactHighlight ? (
              <div className="rounded-[1.2rem] border border-[#bfdbfe] bg-[#eef5ff] p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                      Story in focus
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {commandCenter.selectedImpactHighlight.value}{" "}
                      {commandCenter.selectedImpactHighlight.label}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {commandCenter.selectedImpactHighlight.summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={commandCenter.selectedImpactHighlight.href}
                      className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8]"
                    >
                      {commandCenter.selectedImpactHighlight.actionLabel}
                    </Link>
                    <Link
                      href={buildChapterLeaderCommandCenterHref("bridge_videos", {
                        source: "impact",
                        memberId: commandCenter.navigationMemberId,
                        impactStoryId: commandCenter.selectedImpactHighlightId,
                        pipelineFilter: commandCenter.selectedPipelineFilter,
                        searchQuery: commandCenter.pipelineSearchQuery,
                        quickAction: "share_bridge_video",
                      })}
                      className="inline-flex rounded-full border border-[#93c5fd] bg-white px-4 py-2 text-sm font-semibold text-[#0b5fc4]"
                    >
                      Share Bridge Video
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-3">
              {visibleImpactHighlights.map((highlight) => (
                <ImpactHighlightCard key={highlight.id} highlight={highlight} />
              ))}
            </div>
          </section>

          <div
            className={`grid gap-4 ${commandCenter.campaignImpactOverview ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}
          >
            <ImpactDataPanel title="Local Community Impact">
              <ImpactStatList stats={commandCenter.localImpactStats} />
            </ImpactDataPanel>
            <ImpactDataPanel title="MEDLIFE Global Impact">
              <ImpactStatList stats={commandCenter.globalImpactStats} />
            </ImpactDataPanel>
            {commandCenter.campaignImpactOverview ? (
              <ImpactDataPanel title={commandCenter.campaignImpactOverview.title}>
                <CampaignImpactCard overview={commandCenter.campaignImpactOverview} />
              </ImpactDataPanel>
            ) : null}
          </div>
        </section>
      );
    case "bridge_videos":
      const visibleBridgeVideoEntries = commandCenter.selectedBridgeVideo
        ? commandCenter.bridgeVideoEntries.filter(
            (entry) => entry.id !== commandCenter.selectedBridgeVideo?.id,
          )
        : commandCenter.bridgeVideoEntries;
      const activeBridgeVideoFilter =
        commandCenter.bridgeVideoFilters.find(
          (filter) => filter.key === commandCenter.selectedBridgeVideoFilter,
        ) ?? commandCenter.bridgeVideoFilters[0];
      return (
        <section className="grid gap-4">
          {commandCenter.activeQuickAction === "share_to_feed" ? (
            <SectionCard
              eyebrow="Share to Feed"
              title="Start from the bridge-video library, then choose what should travel back into feed planning."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="grid gap-3">
                  <p className="text-sm leading-6 text-slate-600">
                    Keep feed performance context, category filters, and the current member lens
                    visible first so leaders choose a real bridge asset before moving back into the
                    broader feed workflow.
                  </p>
                  {commandCenter.selectedFeedPost ? (
                    <p className="text-sm font-semibold text-slate-950">
                      Post in focus: {commandCenter.selectedFeedPost.title}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {commandCenter.selectedFeedPost ? (
                    <Link
                      href={buildChapterLeaderCommandCenterHref("feed_analytics", {
                        source: "feed_analytics",
                        memberId: commandCenter.navigationMemberId,
                        bestPracticeChapterId: preservedChapterState.bestPracticeChapterId,
                        leaderboardMetric: preservedChapterState.leaderboardMetric,
                        leaderboardRegion: preservedChapterState.leaderboardRegion,
                        pipelineFilter: commandCenter.selectedPipelineFilter,
                        searchQuery: commandCenter.pipelineSearchQuery,
                        bridgeVideoFilter: commandCenter.selectedBridgeVideoFilter,
                        feedPostId: commandCenter.selectedFeedPost.id,
                      })}
                      className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Back to selected post
                    </Link>
                  ) : null}
                  <Link
                    href={
                      commandCenter.selectedBridgeVideo?.shareHref ??
                      buildChapterLeaderCommandCenterHref("feed_analytics", {
                        source: "bridge_videos",
                        memberId: commandCenter.navigationMemberId,
                        bestPracticeChapterId: preservedChapterState.bestPracticeChapterId,
                        leaderboardMetric: preservedChapterState.leaderboardMetric,
                        leaderboardRegion: preservedChapterState.leaderboardRegion,
                        impactStoryId: commandCenter.selectedImpactHighlightId,
                        pipelineFilter: commandCenter.selectedPipelineFilter,
                        searchQuery: commandCenter.pipelineSearchQuery,
                        bridgeVideoFilter: commandCenter.selectedBridgeVideoFilter,
                        feedPostId: commandCenter.selectedFeedPostId,
                      })
                    }
                    className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Share Bridge Video
                  </Link>
                </div>
              </div>
            </SectionCard>
          ) : null}
          {commandCenter.activeQuickAction === "share_bridge_video" ? (
            <SectionCard
              eyebrow="Share Bridge Video"
              title="Start from the bridge-video library, then open the sharing lane."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <p className="text-sm leading-6 text-slate-600">
                  Keep the selected story, member context, and category visible first so leaders
                  can choose a real chapter-owned bridge asset before moving into the wider feed
                  or handoff flow.
                </p>
                <Link
                  href={
                    commandCenter.selectedBridgeVideo?.shareHref ??
                    buildChapterLeaderCommandCenterHref("feed_analytics", {
                      source: "bridge_videos",
                      memberId: commandCenter.navigationMemberId,
                      bestPracticeChapterId: preservedChapterState.bestPracticeChapterId,
                      leaderboardMetric: preservedChapterState.leaderboardMetric,
                      leaderboardRegion: preservedChapterState.leaderboardRegion,
                      impactStoryId: commandCenter.selectedImpactHighlightId,
                      pipelineFilter: commandCenter.selectedPipelineFilter,
                      searchQuery: commandCenter.pipelineSearchQuery,
                      bridgeVideoFilter: commandCenter.selectedBridgeVideoFilter,
                      feedPostId: commandCenter.selectedFeedPostId,
                    })
                  }
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Share Bridge Video
                </Link>
              </div>
            </SectionCard>
          ) : null}
          {commandCenter.activeQuickAction === "submit_bridge_video" ? (
            <SectionCard
              eyebrow="Submit Bridge Video"
              title="Start from the bridge-video library, then open the proof lane."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <p className="text-sm leading-6 text-slate-600">
                  Keep the current story context, category filter, and member lens visible first
                  so the submission starts from a real chapter bridge story instead of a generic
                  upload task.
                </p>
                <Link
                  href={buildChapterLeaderProofUploadHref({
                    source: commandCenter.selectedSource,
                    memberId: commandCenter.navigationMemberId,
                    impactStoryId: commandCenter.selectedImpactHighlightId,
                    pipelineFilter: commandCenter.selectedPipelineFilter,
                    searchQuery: commandCenter.pipelineSearchQuery,
                    bridgeVideoFilter: commandCenter.selectedBridgeVideoFilter,
                    bridgeVideoId: commandCenter.selectedBridgeVideoId,
                    feedPostId: commandCenter.selectedFeedPostId,
                  })}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open proof lane
                </Link>
              </div>
            </SectionCard>
          ) : null}
          {commandCenter.activeQuickAction === "feature_bridge_video" &&
          commandCenter.selectedBridgeVideo ? (
            <SectionCard
              eyebrow="Feature Bridge Video"
              title="Start from the bridge-video library, then review what should stay featured."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-sm leading-6 text-slate-600">
                    Keep the selected story, category context, and current member lens visible
                    while you decide whether this example should stay highlighted for future
                    chapter leaders. Use this step to confirm the story still feels specific,
                    current, and worth reusing across the chapter.
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {commandCenter.selectedBridgeVideo.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {commandCenter.selectedBridgeVideo.categoryLabel} ·{" "}
                    {commandCenter.selectedBridgeVideo.authorLabel}
                  </p>
                </div>
                <Link
                  href={buildChapterLeaderCommandCenterHref("bridge_videos", {
                    source: commandCenter.selectedSource,
                    memberId: commandCenter.navigationMemberId,
                    pipelineFilter: commandCenter.selectedPipelineFilter,
                    searchQuery: commandCenter.pipelineSearchQuery,
                    bridgeVideoFilter: commandCenter.selectedBridgeVideoFilter,
                    bridgeVideoId: commandCenter.selectedBridgeVideoId,
                  })}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Feature selected video
                </Link>
              </div>
            </SectionCard>
          ) : null}
          <section className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Bridge Video Hub
                </p>
                <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight text-slate-950 sm:text-[1.9rem]">
                  Bridge Video Hub
                </h1>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  &quot;MEDLIFE leaders build a bridge for the next generation.&quot;
                </p>
              </div>
                <Link
                  href={buildChapterLeaderCommandCenterHref("bridge_videos", {
                    source: commandCenter.selectedSource,
                    memberId: commandCenter.navigationMemberId,
                    pipelineFilter: commandCenter.selectedPipelineFilter,
                    searchQuery: commandCenter.pipelineSearchQuery,
                    bridgeVideoFilter: commandCenter.selectedBridgeVideoFilter,
                    feedPostId: commandCenter.selectedFeedPostId,
                    quickAction: "submit_bridge_video",
                  })}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Submit Bridge Video
                </Link>
            </div>

            {commandCenter.selectedSource === "impact" && commandCenter.selectedImpactHighlight ? (
              <div className="rounded-[1.2rem] border border-[#bfdbfe] bg-[#eef5ff] p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                      Impact story in focus
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {commandCenter.selectedImpactHighlight.value}{" "}
                      {commandCenter.selectedImpactHighlight.label}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Keep this story visible while you choose which bridge video should carry it
                      forward, so the library stays anchored to a real chapter outcome instead of
                      becoming a generic content shelf.
                    </p>
                  </div>
                  <Link
                    href={buildChapterLeaderCommandCenterHref("impact", {
                      source: "impact",
                      memberId: commandCenter.navigationMemberId,
                      impactStoryId: commandCenter.selectedImpactHighlightId,
                      pipelineFilter: commandCenter.selectedPipelineFilter,
                      searchQuery: commandCenter.pipelineSearchQuery,
                    })}
                    className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8]"
                  >
                    Back to story
                  </Link>
                </div>
              </div>
            ) : null}

            {commandCenter.selectedSource === "feed_analytics" && commandCenter.selectedFeedPost ? (
              <div className="rounded-[1.2rem] border border-[#bfdbfe] bg-[#eef5ff] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                      Post in focus
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-950">
                        {commandCenter.selectedFeedPost.title}
                      </p>
                      <span
                        className={getFeedPostBadgeClassName(
                          commandCenter.selectedFeedPost.badgeLabel,
                        )}
                      >
                        {commandCenter.selectedFeedPost.typeLabel}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {commandCenter.selectedFeedPost.summary}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Keep this feed signal visible while reviewing bridge assets so the library
                      stays anchored to the real post that needs reinforcement, follow-up, or a
                      better story handoff.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 xl:items-end">
                    <p className="text-sm text-slate-500">
                      {commandCenter.selectedFeedPost.authorLabel} ·{" "}
                      {commandCenter.selectedFeedPost.dateLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <SelectedPostMetric
                    label="Views"
                    value={commandCenter.selectedFeedPost.viewsLabel}
                  />
                  <SelectedPostMetric
                    label="Likes"
                    value={commandCenter.selectedFeedPost.likesLabel}
                  />
                  <SelectedPostMetric
                    label="Actions After"
                    value={commandCenter.selectedFeedPost.actionsAfterLabel}
                  />
                  <SelectedPostMetric
                    label="RSVPs"
                    value={commandCenter.selectedFeedPost.rsvpsLabel}
                  />
                </div>
              </div>
            ) : null}

            {commandCenter.selectedBridgeVideo ? (
              <div className="rounded-[1.2rem] border border-[#bfdbfe] bg-[#eef5ff] p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                      Selected video
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {commandCenter.selectedBridgeVideo.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {commandCenter.selectedBridgeVideo.categoryLabel} ·{" "}
                      {commandCenter.selectedBridgeVideo.authorLabel} ·{" "}
                      {commandCenter.selectedBridgeVideo.chaptersUsingLabel}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 xl:items-end">
                    <Link
                      href={buildChapterLeaderCommandCenterHref("bridge_videos", {
                        source: commandCenter.selectedSource,
                        memberId: commandCenter.navigationMemberId,
                        impactStoryId: commandCenter.selectedImpactHighlightId,
                        pipelineFilter: commandCenter.selectedPipelineFilter,
                        searchQuery: commandCenter.pipelineSearchQuery,
                        bridgeVideoFilter: commandCenter.selectedBridgeVideoFilter,
                        feedPostId: commandCenter.selectedFeedPostId,
                      })}
                      className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8]"
                    >
                      Back to bridge library
                    </Link>
                    <Link
                      href={buildChapterLeaderCommandCenterHref("bridge_videos", {
                        source: commandCenter.selectedSource,
                        memberId: commandCenter.navigationMemberId,
                        impactStoryId: commandCenter.selectedImpactHighlightId,
                        pipelineFilter: commandCenter.selectedPipelineFilter,
                        searchQuery: commandCenter.pipelineSearchQuery,
                        bridgeVideoFilter: commandCenter.selectedBridgeVideoFilter,
                        feedPostId: commandCenter.selectedFeedPostId,
                        bridgeVideoId: commandCenter.selectedBridgeVideo.id,
                        quickAction: "feature_bridge_video",
                      })}
                      className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8]"
                    >
                      Feature selected video
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {commandCenter.bridgeVideoMetrics.map((metric) => (
              <BridgeVideoMetricTile key={metric.label} metric={metric} />
            ))}
          </div>

          <section className="app-surface rounded-[1.6rem] p-4">
            <div className="flex flex-wrap gap-2">
              {commandCenter.bridgeVideoFilters.map((filter) => (
                <BridgeVideoFilterPill key={filter.key} filter={filter} />
              ))}
            </div>

            {commandCenter.navigationMemberId && commandCenter.selectedMember ? (
              <div className="mt-4">
                <SelectedMemberContextBanner
                  eyebrow="Story owner context"
                  title={`Reviewing bridge content with ${commandCenter.selectedMember.displayName} in focus`}
                  summary={`Keep ${commandCenter.selectedMember.displayName} selected while reviewing examples, share flows, and handoff quality so this library still feels connected to a real chapter leader.`}
                  member={commandCenter.selectedMember}
                />
              </div>
            ) : null}

            <div className="mt-4 grid gap-3">
              {visibleBridgeVideoEntries.length > 0 ? (
                visibleBridgeVideoEntries.map((entry) => (
                  <BridgeVideoHubCard
                    key={entry.id}
                    entry={entry}
                    selected={entry.id === commandCenter.selectedBridgeVideoId}
                  />
                ))
              ) : (
                <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    No other bridge videos in this filter
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    {activeBridgeVideoFilter?.label ?? "This category"} only has the selected
                    video right now.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Keep this review state visible, then switch to another category or back to
                    All so adjacent bridge stories stay easy to compare.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-[1.2rem] border border-[#f7d05e]/35 bg-[#fff7da] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8a6700]">
                Bridge Culture Reminder
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {commandCenter.bridgeVideoCultureNote}
              </p>
            </div>
          </section>
        </section>
      );
    case "succession":
      return (
        <section className="grid gap-4">
          {commandCenter.activeQuickAction === "promote_emerging_leader" ? (
            <SectionCard
              eyebrow="Promote Emerging Leader"
              title="Start from succession planning, then open the candidate lane."
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <p className="text-sm leading-6 text-slate-600">
                  Keep succession review anchored to a real person, the visible leadership gaps,
                  and the current transition posture before you nominate or promote anyone into a
                  larger chapter role.
                </p>
                <Link
                  href={buildNominateCandidateHref(commandCenter)}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open candidate review
                </Link>
              </div>
            </SectionCard>
          ) : null}
          <div className="grid gap-4 app-surface rounded-[1.75rem] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="app-eyebrow app-eyebrow-slate">Succession Planning</p>
                <h2 className="mt-2 text-[1.38rem] font-semibold leading-tight text-slate-950 sm:text-[1.5rem]">
                  Leadership Succession
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Ensure the chapter can survive and grow beyond any single leader.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildNominateCandidateHref(commandCenter)}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Nominate Candidate
                </Link>
                <Link
                  href={buildTransitionPlanHref(commandCenter)}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Start Transition Plan
                </Link>
              </div>
            </div>

            {commandCenter.hasExplicitMemberSelection && commandCenter.selectedMember ? (
              <div className="rounded-[1.2rem] border border-[#bfdbfe] bg-[#eef5ff] p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                      Selected candidate
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      Reviewing {commandCenter.selectedMember.displayName} for succession
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Keep this person anchored while reviewing leadership gaps, candidate readiness,
                      and the next transition move so succession planning stays person-specific.
                    </p>
                  </div>
                  <Link
                    href={commandCenter.selectedMember.profileHref}
                    className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8]"
                  >
                    Open member profile
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <EventOpsStat
                label="E-Board Roles Filled"
                value={commandCenter.successionOverview.eboardRolesFilledLabel}
                note="Leadership bench health"
              />
              <EventOpsStat
                label="Active Committees"
                value={commandCenter.successionOverview.activeCommitteesLabel}
                note="Committees still visibly moving"
              />
              <EventOpsStat
                label="Candidates Identified"
                value={commandCenter.successionOverview.candidatesIdentifiedLabel}
                note="Chair pipeline"
              />
              <EventOpsStat
                label="Transition Readiness"
                value={commandCenter.successionOverview.transitionReadinessLabel}
                note={commandCenter.successionOverview.transitionReadinessNote}
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
            <SectionCard eyebrow="Leadership Gaps" title="Leadership Gaps">
              <div className="grid gap-3">
                {commandCenter.successionGaps.map((gap) => (
                  <SuccessionGapCard key={gap.title} gap={gap} />
                ))}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Candidate Pipeline" title="Candidate Pipeline">
              <div className="flex items-center justify-between gap-3">
                <div />
                <Link
                  href={buildChapterLeaderCommandCenterHref("members")}
                  className="inline-flex rounded-full border border-[#bfdbfe] bg-[#eef5ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#dbeafe]"
                >
                  Full table
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {commandCenter.successionCandidates.map((candidate) => (
                  <SuccessionPipelineRow key={candidate.id} candidate={candidate} />
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard eyebrow="Succession Timeline" title="Succession Timeline">
            <div className="grid gap-3">
              {commandCenter.successionTimeline.map((item) => (
                <SuccessionTimelineRow key={`${item.dateLabel}-${item.title}`} item={item} />
              ))}
            </div>
          </SectionCard>
        </section>
      );
    case "feed_analytics":
      return (
        <section className="grid gap-4">
          <div className="grid gap-4 app-surface rounded-[1.75rem] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="app-eyebrow app-eyebrow-slate">Feed Analytics</p>
                <h2 className="mt-2 text-[1.38rem] font-semibold leading-tight text-slate-950 sm:text-[1.5rem]">
                  Feed Analytics
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Understand what content drives real action — not just views.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildChapterLeaderCommandCenterHref("bridge_videos", {
                    ...preservedChapterState,
                    source: "feed_analytics",
                    quickAction: "share_to_feed",
                  })}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Share to Feed
                </Link>
                <Link
                  href={buildChapterLeaderCommandCenterHref("members", {
                    source: "feed_analytics",
                    memberId: preservedChapterState.memberId,
                    bestPracticeChapterId: preservedChapterState.bestPracticeChapterId,
                    leaderboardMetric: preservedChapterState.leaderboardMetric,
                    leaderboardRegion: preservedChapterState.leaderboardRegion,
                    pipelineFilter: "follow_up",
                    searchQuery: preservedChapterState.searchQuery,
                    feedPostId: commandCenter.selectedFeedPostId,
                    quickAction: "ask_members_to_respond",
                  })}
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Ask Members to Respond
                </Link>
              </div>
            </div>

            {commandCenter.selectedFeedPost ? (
              <div className="rounded-[1.2rem] border border-[#bfdbfe] bg-[#eef5ff] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                      Impact Analysis
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {commandCenter.selectedFeedPost.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {commandCenter.selectedFeedPost.summary}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <SelectedPostMetric
                        label="Views"
                        value={commandCenter.selectedFeedPost.viewsLabel}
                      />
                      <SelectedPostMetric
                        label="Likes"
                        value={commandCenter.selectedFeedPost.likesLabel}
                      />
                      <SelectedPostMetric
                        label="Actions After"
                        value={commandCenter.selectedFeedPost.actionsAfterLabel}
                      />
                      <SelectedPostMetric
                        label="RSVPs"
                        value={commandCenter.selectedFeedPost.rsvpsLabel}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 xl:items-end">
                    <span className={getFeedPostBadgeClassName(commandCenter.selectedFeedPost.badgeLabel)}>
                      {commandCenter.selectedFeedPost.typeLabel}
                    </span>
                    <p className="text-sm text-slate-500">
                      {commandCenter.selectedFeedPost.authorLabel} · {commandCenter.selectedFeedPost.dateLabel}
                    </p>
                    <Link
                      href={buildChapterLeaderCommandCenterHref("feed_analytics", {
                        source: commandCenter.selectedSource,
                        memberId: commandCenter.navigationMemberId,
                        bestPracticeChapterId:
                          commandCenter.selectedSource === "leaderboard"
                            ? commandCenter.selectedBestPracticeChapterId
                            : null,
                        leaderboardMetric: commandCenter.selectedLeaderboardMetric,
                        leaderboardRegion: commandCenter.selectedLeaderboardRegion,
                        pipelineFilter: commandCenter.selectedPipelineFilter,
                        searchQuery: commandCenter.pipelineSearchQuery,
                        bridgeVideoFilter: commandCenter.selectedBridgeVideoFilter,
                      })}
                      className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8]"
                    >
                      Back to recent posts
                    </Link>
                    <Link
                      href={commandCenter.selectedFeedPost.nextActionHref}
                      className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
                    >
                      {commandCenter.selectedFeedPost.nextActionLabel}
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            {commandCenter.feedAnalyticsBridgeContext ? (
              <div className="rounded-[1.2rem] border border-[#bfdbfe] bg-[#eef5ff] p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                      Bridge Video Context
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      Reviewing {commandCenter.feedAnalyticsBridgeContext.label}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {commandCenter.feedAnalyticsBridgeContext.detail}
                    </p>
                  </div>
                  <Link
                    href={commandCenter.feedAnalyticsBridgeContext.backHref}
                    className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8]"
                  >
                    Back to bridge library
                  </Link>
                </div>
              </div>
            ) : null}

            {commandCenter.selectedSource === "leaderboard" &&
            commandCenter.selectedBestPracticeChapter ? (
              <div className="rounded-[1.2rem] border border-[#bfdbfe] bg-[#f8fbff] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                      Benchmark chapter in focus
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-lg">
                        {commandCenter.selectedBestPracticeChapter.rankLabel}
                      </span>
                      <h3 className="text-lg font-semibold text-slate-950">
                        {commandCenter.selectedBestPracticeChapter.chapterName}
                      </h3>
                      {commandCenter.selectedBestPracticeChapter.badgeLabel ? (
                        <span className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                          {commandCenter.selectedBestPracticeChapter.badgeLabel}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {commandCenter.selectedBestPracticeChapter.countryLabel}
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {commandCenter.selectedBestPracticeChapter.healthLabel}
                      </span>
                    </div>
                    <p className="mt-3 text-sm italic text-slate-500">
                      {commandCenter.selectedBestPracticeChapter.quote}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Keep this benchmark visible while reviewing posts, re-engagement targets,
                      and next actions so the feed plan stays grounded in a real chapter example.
                    </p>
                  </div>
                  <Link
                    href={buildChapterLeaderCommandCenterHref("leaderboard", {
                      memberId: commandCenter.navigationMemberId,
                      pipelineFilter: commandCenter.selectedPipelineFilter,
                      searchQuery: commandCenter.pipelineSearchQuery,
                      leaderboardMetric: commandCenter.selectedLeaderboardMetric,
                      leaderboardRegion: commandCenter.selectedLeaderboardRegion,
                    })}
                    className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8]"
                  >
                    Back to leaderboard
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {commandCenter.selectedBestPracticeChapter.metrics.map((metric) => (
                    <div key={`${commandCenter.selectedBestPracticeChapter?.id}-${metric.label}`}>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {metric.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-5">
            {commandCenter.feedMetrics.map((metric) => (
              <EventOpsStat key={metric.label} label={metric.label} value={metric.value} note="" />
            ))}
          </div>

          <SectionCard
            eyebrow="Content Engagement"
            title="Content Engagement — Actions Driven"
          >
            <FeedEngagementChart rows={commandCenter.feedChartRows} />
          </SectionCard>

          <section className="overflow-hidden rounded-[1.3rem] border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <p className="app-eyebrow app-eyebrow-slate">Recent Posts</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">Recent Posts</h3>
            </div>
            <FeedPostsTable rows={commandCenter.feedPostRows} />
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard eyebrow="Most Engaged Members" title="Most Engaged Members">
              <div className="grid gap-3">
                {commandCenter.mostEngagedMembers.map((member) => (
                  <FeedMemberRow key={member.id} member={member} />
                ))}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Least Engaged" title="Re-engagement Targets">
              <div className="grid gap-3">
                {commandCenter.leastEngagedMembers.map((member) => (
                  <FeedMemberRow key={member.id} member={member} />
                ))}
              </div>
            </SectionCard>
          </div>
        </section>
      );
    case "overview":
    default:
      return null;
  }
}

function ChapterNavIcon({ view }: { view: ChapterLeaderCommandCenterView }) {
  const iconClassName = "h-[1rem] w-[1rem]";

  switch (view) {
    case "overview":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6.5 10v9h11v-9" />
        </svg>
      );
    case "leaderboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M8 20V10" />
          <path d="M12 20V6" />
          <path d="M16 20v-8" />
        </svg>
      );
    case "members":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M16 20a4 4 0 0 0-8 0" />
          <circle cx="12" cy="8" r="3.5" />
        </svg>
      );
    case "member_profile":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="11" cy="8" r="3.5" />
          <path d="M5 19a6 6 0 0 1 12 0" />
          <path d="m17.5 17.5 3 3" />
        </svg>
      );
    case "committees":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h10" />
        </svg>
      );
    case "events":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M8 4v4" />
          <path d="M16 4v4" />
          <path d="M4 10h16" />
        </svg>
      );
    case "impact":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M12 20s-6-3.8-6-9a3.5 3.5 0 0 1 6-2.5A3.5 3.5 0 0 1 18 11c0 5.2-6 9-6 9Z" />
        </svg>
      );
    case "bridge_videos":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="4" y="6" width="11" height="12" rx="2" />
          <path d="m15 10 5-3v10l-5-3" />
        </svg>
      );
    case "succession":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M7 17 17 7" />
          <path d="M11 7h6v6" />
          <path d="M7 7v10h10" />
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
  }
}

function QuickActionLink({
  action,
  variant,
}: {
  action: ChapterLeaderCommandCenterQuickAction;
  variant: "hero" | "overview" | "sidebar";
}) {
  return (
    <Link
      href={action.href}
      className={[
        "inline-flex items-center justify-center rounded-[1rem] px-4 py-3 text-center text-sm font-semibold transition",
        action.tone === "primary"
          ? "bg-[#2563eb] text-white hover:bg-[#2d6cf4]"
          : variant === "hero"
            ? "border border-white/18 bg-white/[0.12] text-white shadow-[0_10px_26px_rgba(2,14,38,0.16)] hover:border-white/28 hover:bg-white/[0.18]"
            : variant === "sidebar"
              ? "border border-white/10 bg-white/[0.05] text-white/82 hover:border-white/18 hover:bg-white/[0.1] hover:text-white"
            : "border border-slate-200 bg-white text-slate-700 hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950",
      ].join(" ")}
    >
      {action.label}
    </Link>
  );
}

function orderCommandCenterActions(
  actions: ChapterLeaderCommandCenterQuickAction[],
  orderedLabels: string[],
) {
  return orderedLabels
    .map((label) => actions.find((action) => action.label === label))
    .filter((action): action is ChapterLeaderCommandCenterQuickAction => Boolean(action));
}

function getChapterMetricsHeading(commandCenter: ChapterLeaderCommandCenter) {
  return `Chapter Metrics — ${expandMonthLabel(commandCenter.eventsOverview.monthLabel)}`;
}

function expandMonthLabel(monthLabel: string) {
  const monthMap: Record<string, string> = {
    Jan: "January",
    Feb: "February",
    Mar: "March",
    Apr: "April",
    May: "May",
    Jun: "June",
    Jul: "July",
    Aug: "August",
    Sep: "September",
    Oct: "October",
    Nov: "November",
    Dec: "December",
  };

  const [month, ...rest] = monthLabel.split(" ");

  if (!month || !monthMap[month]) {
    return monthLabel;
  }

  return [monthMap[month], ...rest].join(" ");
}

function ContextPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/28 bg-white/92 px-3 py-1 text-xs font-semibold text-slate-800">
      {label}
    </span>
  );
}

function HeroProgressStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const progress = getProgressValue(value);

  return (
    <div className="rounded-[1.25rem] border border-white/14 bg-white/[0.08] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/58">
          {label}
        </p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#2563eb]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

function HeroStatusStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/14 bg-white/[0.08] p-4 backdrop-blur-sm">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/58">
        {label}
      </p>
      <p className="mt-3 text-sm font-semibold leading-6 text-white/88">{value}</p>
    </div>
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
    <section className="app-surface rounded-[1.75rem] p-4">
      <p className="app-eyebrow app-eyebrow-slate">{eyebrow}</p>
      <h2 className="mt-2 text-[1.38rem] font-semibold leading-tight text-slate-950 sm:text-[1.5rem]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function HandoffPreviewStatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <section className="rounded-[1.1rem] border border-[#dbeafe] bg-[#f8fbff] px-3.5 py-3">
      <p className="app-eyebrow app-eyebrow-blue">{label}</p>
      <p className="mt-2 text-[1.85rem] font-semibold leading-none text-slate-950">{value}</p>
      <p className="mt-1.5 text-xs leading-5 text-slate-600">{note}</p>
    </section>
  );
}

function HandoffPreviewSectionCard({
  title,
  summary,
  href,
  hrefLabel,
}: {
  title: string;
  summary: string;
  href: string;
  hrefLabel: string;
}) {
  return (
    <section className="rounded-[1.1rem] border border-slate-200 bg-white px-3.5 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="flex h-full flex-col gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
          <p className="mt-1.5 text-xs leading-5 text-slate-600">{summary}</p>
        </div>
        <Link
          href={href}
          className="inline-flex w-fit rounded-full border border-[#bfdbfe] bg-[#eef5ff] px-3 py-1.5 text-xs font-semibold text-[#0b5fc4] transition hover:border-[#93c5fd] hover:bg-[#dbeafe]"
        >
          {hrefLabel}
        </Link>
      </div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="app-surface-soft rounded-[1.4rem] p-4">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
    </div>
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

function RiskAlertCard({ alert }: { alert: ChapterLeaderCommandCenterRiskAlert }) {
  const accentClassName =
    alert.severity === "high"
      ? "border-l-4 border-l-rose-400"
      : alert.severity === "medium"
        ? "border-l-4 border-l-amber-400"
        : "border-l-4 border-l-emerald-400";

  return (
    <div
      className={[
        "rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]",
        accentClassName,
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-semibold text-slate-950">{alert.title}</p>
        <TonePill tone={toTone(alert.severity)} label={alert.severity} />
      </div>
      <Link
        href={alert.href}
        className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700"
      >
        Open
      </Link>
    </div>
  );
}

function LeadershipRoleCard({
  role,
}: {
  role: ChapterLeaderCommandCenterLeadershipRole;
}) {
  return (
    <div className="app-surface rounded-[1.4rem] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-semibold text-slate-950">{role.label}</p>
        <TonePill tone={toTone(role.status)} label={role.status} />
      </div>
      <p className="mt-2 text-sm font-semibold text-[#2563eb]">{role.owner}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{role.note}</p>
    </div>
  );
}

function ChapterMemberPipelineTable({
  rows,
}: {
  rows: ChapterLeaderCommandCenterPipelineRow[];
}) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm leading-6 text-slate-600">
          No members matched the current pipeline filter or search.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[61rem] border-collapse">
        <thead className="bg-slate-50">
          <tr>
            {[
              "Member",
              "Points",
              "This wk",
              "Evts made",
              "Attended",
              "% Chapter",
              "Actions",
              "Evidence",
              "Bridge",
              "Fundraising",
              "Values",
              "Pipeline",
              "Next step",
            ].map((label) => (
              <th
                key={label}
                scope="col"
                className="border-b border-slate-200 px-2.5 py-3 text-left text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={[
                "bg-white transition hover:bg-slate-50",
                row.isSelected ? "ring-1 ring-inset ring-[#bfdbfe]" : "",
              ].join(" ")}
            >
              <td className="border-b border-slate-200 px-2.5 py-4 align-top">
                <Link
                  href={row.profileHref}
                  className="flex min-w-[9.75rem] items-start gap-2.5 rounded-[1rem] transition"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[0.64rem] font-semibold text-white">
                    {row.initials}
                  </div>
                  <div>
                    <p className="text-[0.98rem] font-semibold leading-5 text-[#2563eb]">
                      {row.displayName}
                    </p>
                    <p className="mt-1 text-[0.68rem] leading-5 text-slate-600">
                      {row.roleLabel} · {row.lastActiveLabel}
                    </p>
                  </div>
                </Link>
              </td>
              <td className="border-b border-slate-200 px-2.5 py-4 text-sm font-semibold text-slate-950 whitespace-nowrap">
                {formatTableNumber(row.points)}
              </td>
              <td
                className={[
                  "border-b border-slate-200 px-2.5 py-4 text-sm font-semibold whitespace-nowrap",
                  getWeeklyMovementClassName(row.weeklyMovementLabel),
                ].join(" ")}
              >
                {row.weeklyMovementLabel}
              </td>
              <td className="border-b border-slate-200 px-2.5 py-4 text-sm text-slate-700 whitespace-nowrap">
                {row.eventsMadeLabel}
              </td>
              <td className="border-b border-slate-200 px-2.5 py-4 text-sm text-slate-700 whitespace-nowrap">
                {row.attendanceLabel}
              </td>
              <td className="border-b border-slate-200 px-2.5 py-4 text-sm text-slate-700 whitespace-nowrap">
                {row.chapterShareLabel}
              </td>
              <td className="border-b border-slate-200 px-2.5 py-4 text-sm text-slate-700 whitespace-nowrap">
                {row.actionsLabel}
              </td>
              <td className="border-b border-slate-200 px-2.5 py-4 text-sm text-slate-700 whitespace-nowrap">
                {row.evidenceLabel}
              </td>
              <td className="border-b border-slate-200 px-2.5 py-4 text-sm text-slate-700 whitespace-nowrap">
                {row.bridgeLabel}
              </td>
              <td className="border-b border-slate-200 px-2.5 py-4 text-sm text-slate-700 whitespace-nowrap">
                {row.fundraisingLabel}
              </td>
              <td className="border-b border-slate-200 px-2.5 py-4 text-sm text-slate-700">
                <span className={getPipelineValuesBadgeClassName(row.valuesLabel)}>
                  {row.valuesLabel}
                </span>
              </td>
              <td className="border-b border-slate-200 px-2.5 py-4 text-sm font-semibold text-slate-700">
                <span className={getPipelineStageBadgeClassName(row.pipelineLabel)}>
                  {row.pipelineLabel}
                </span>
              </td>
              <td className="border-b border-slate-200 px-2.5 py-4 min-w-[8.75rem]">
                <Link
                  href={row.profileHref}
                  className="block text-[0.82rem] leading-5 text-slate-700 hover:text-slate-950"
                >
                  {row.nextStepLabel}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatTableNumber(value: number) {
  return value.toLocaleString("en-US");
}

function getPipelineValuesBadgeClassName(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("needs interview")) {
    return "inline-flex rounded-full border border-[#fdba74] bg-[#fff7ed] px-2.5 py-1 text-[0.68rem] font-semibold text-[#c2410c]";
  }
  if (normalized.includes("watch")) {
    return "inline-flex rounded-full border border-[#fde68a] bg-[#fefce8] px-2.5 py-1 text-[0.68rem] font-semibold text-[#a16207]";
  }

  return "inline-flex rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-1 text-[0.68rem] font-semibold text-[#15803d]";
}

function getPipelineStageBadgeClassName(label: string) {
  switch (label.toLowerCase()) {
    case "e-board":
      return "inline-flex rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 text-[0.68rem] font-semibold text-[#1d4ed8]";
    case "chair":
      return "inline-flex rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-2.5 py-1 text-[0.68rem] font-semibold text-[#6d28d9]";
    case "chair candidate":
      return "inline-flex rounded-full border border-[#bae6fd] bg-[#ecfeff] px-2.5 py-1 text-[0.68rem] font-semibold text-[#0f766e]";
    case "active contributor":
      return "inline-flex rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-1 text-[0.68rem] font-semibold text-[#15803d]";
    case "needs follow-up":
      return "inline-flex rounded-full border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1 text-[0.68rem] font-semibold text-[#b91c1c]";
    default:
      return "inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-700";
  }
}

function MemberProfileSummaryCard({
  member,
}: {
  member: ChapterLeaderCommandCenterMemberProfile;
}) {
  return (
    <section className="app-surface-info self-start rounded-[1.5rem] p-5">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2563eb] text-xl font-semibold text-white">
        {member.displayName
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")}
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-slate-950">{member.displayName}</h3>
      <div className="mt-1 text-sm text-slate-600">
        <p>{member.roleLabel}</p>
        <p>{member.committeeLane}</p>
      </div>
      <div className="mt-4 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        {member.badgeLabel}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ProfileStatRow label="Last active" value={member.lastActiveLabel} />
        <ProfileStatRow label="SLT interest" value={member.sltInterestLabel} />
        <ProfileStatRow label="Volunteer hrs" value={member.volunteerHoursLabel} />
        <ProfileStatRow label="Fundraising" value={member.fundraisingLabel} />
        <ProfileStatRow label="Engagement" value={member.engagementLabel} />
        <ProfileStatRow label="Values" value={member.recognition} />
        <ProfileStatRow label="Pipeline" value={member.pipelineLabel} />
      </div>
    </section>
  );
}

function MemberLeadershipActionsCard({
  member,
}: {
  member: ChapterLeaderCommandCenterMemberProfile;
}) {
  const visibleActions = member.leadershipActions.filter((action) => action.label !== "Add Note");
  return (
    <section className="app-surface rounded-[1.75rem] p-4">
      <div className="grid gap-3">
        <div>
          <p className="app-eyebrow app-eyebrow-slate">Leadership</p>
          <h2 className="mt-2 text-[1.38rem] font-semibold leading-tight text-slate-950 sm:text-[1.5rem]">
            Leadership Actions
          </h2>
        </div>
        <div className="grid gap-2">
          {visibleActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={[
                "rounded-[1rem] px-4 py-3 text-sm font-semibold transition",
                action.tone === "primary"
                  ? "bg-[#2563eb] text-white hover:bg-[#2d6cf4]"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-[#bfdbfe] hover:bg-[#eef5ff]",
              ].join(" ")}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function renderMemberProfileQuickActionState(
  commandCenter: ChapterLeaderCommandCenter,
) {
  const member = commandCenter.selectedMember;

  if (!member) {
    return null;
  }

  const baseProfileHref = buildChapterLeaderCommandCenterHref("member_profile", {
    source: commandCenter.selectedSource,
    memberId: member.id,
    pipelineFilter: commandCenter.selectedPipelineFilter,
    searchQuery: commandCenter.pipelineSearchQuery,
  });

  const successionHref = buildChapterLeaderCommandCenterHref("succession", {
    source: commandCenter.selectedSource,
    memberId: member.id,
    pipelineFilter: commandCenter.selectedPipelineFilter,
    searchQuery: commandCenter.pipelineSearchQuery,
  });

  switch (commandCenter.activeQuickAction) {
    case "promote_to_chair":
      return (
        <SectionCard
          eyebrow="Promote to Chair"
          title="Start from this member profile, then open chair-readiness review."
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <p className="text-sm leading-6 text-slate-600">
              Keep this member&apos;s points history, values context, and recent follow-through
              visible while you decide whether chair ownership is actually supported by behavior,
              not just enthusiasm. Once the decision is clear, open the succession lane with this
              same member still in focus.
            </p>
            <Link
              href={successionHref}
              className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
            >
              Open chair review
            </Link>
          </div>
        </SectionCard>
      );
    case "nominate_for_eboard":
      return (
        <SectionCard
          eyebrow="Nominate for E-Board"
          title="Start from this member profile, then open E-Board readiness review."
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <p className="text-sm leading-6 text-slate-600">
              Use this profile first to confirm values alignment, real chapter contribution, and
              succession timing before this nomination moves into the broader leadership lane.
            </p>
            <Link
              href={successionHref}
              className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
            >
              Open E-Board review
            </Link>
          </div>
        </SectionCard>
      );
    case "assign_leadership_action":
      const assignmentLaneHref = buildChapterLeaderAssignmentFlowHref({
        source: commandCenter.selectedSource,
        memberId: member.id,
        pipelineFilter: commandCenter.selectedPipelineFilter,
        searchQuery: commandCenter.pipelineSearchQuery,
      });
      return (
        <SectionCard
          eyebrow="Assign Leadership Action"
          title="Start from this member profile, then open the action-assignment lane."
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <p className="text-sm leading-6 text-slate-600">
              Keep the person-level context visible while you confirm what stretch action would
              actually test growth, consistency, or leadership readiness. Then hand off into the
              broader action flow with this decision anchored to a real student.
            </p>
            <Link
              href={assignmentLaneHref}
              className="inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
            >
              Open leadership action flow
            </Link>
          </div>
        </SectionCard>
      );
    case "schedule_values_interview":
      return (
        <SectionCard
          eyebrow="Schedule Values Interview"
          title="Keep this profile in focus while you prepare the interview."
        >
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-slate-600">
              The live scheduling lane is still out of scope here, but this review state keeps the
              member&apos;s behavior, notes, and recent activity visible so the interview plan is
              grounded in real chapter context instead of a generic checklist.
            </p>
            <p className="text-sm leading-6 text-slate-600">
              Use this moment to decide who should join the conversation, what values need a
              clearer example, and what follow-up should happen afterward.
            </p>
            <div>
              <Link
                href={baseProfileHref}
                className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Return to profile
              </Link>
            </div>
          </div>
        </SectionCard>
      );
    case "add_leader_note":
      return (
        <SectionCard
          eyebrow="Add Note"
          title="Keep this profile in focus while you decide what the next leader should inherit."
        >
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-slate-600">
              Use this note-review state to decide what context is concrete, useful, and fair
              before the next leader inherits the member record. The goal is to capture growth
              context, not vague impressions or popularity signals.
            </p>
            <p className="text-sm leading-6 text-slate-600">
              Focus on specific examples, what changed over time, and what support or stretch
              opportunity would help next.
            </p>
            <div>
              <Link
                href={baseProfileHref}
                className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Return to profile
              </Link>
            </div>
          </div>
        </SectionCard>
      );
    default:
      return null;
  }
}

function ProfileStatRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/60 pb-2 text-sm last:border-b-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function DetailCallout({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="app-surface rounded-[1.15rem] p-3">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function MemberPointsHistoryChart({
  points,
}: {
  points: ChapterLeaderCommandCenterMemberProfile["pointsHistory"];
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="grid gap-4">
      <div className="flex h-40 items-end gap-2 rounded-[1.25rem] border border-slate-200 bg-white px-4 pb-4 pt-6">
        {points.map((point) => (
          <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-24 items-end">
              <div
                className="w-full min-w-[0.9rem] rounded-full bg-[#2563eb]"
                style={{ height: `${Math.max(18, Math.round((point.value / maxValue) * 96))}px` }}
              />
            </div>
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {point.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-sm leading-6 text-slate-600">
        Use this trend to see whether the member is building steady momentum over time, not just showing one strong week.
      </p>
    </div>
  );
}

function ChapterPointsTrendChart({
  points,
}: {
  points: ChapterLeaderCommandCenter["chapterPointsTrend"];
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="grid gap-4">
      <div className="flex h-44 items-end gap-2 rounded-[1.25rem] border border-slate-200 bg-white px-4 pb-4 pt-6">
        {points.map((point) => (
          <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-28 items-end">
              <div
                className="w-full min-w-[0.95rem] rounded-full bg-[#2563eb]"
                style={{ height: `${Math.max(28, Math.round((point.value / maxValue) * 112))}px` }}
              />
            </div>
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {point.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-sm leading-6 text-slate-600">
        Use this trend to see whether the chapter is building real momentum across the month or slipping after one strong week.
      </p>
    </div>
  );
}

function TimelineItem({
  dateLabel,
  detail,
}: {
  dateLabel: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3 rounded-[1rem] border border-slate-200 bg-white p-4">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {dateLabel}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
      </div>
    </div>
  );
}

function EventOpsStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{note}</p>
    </div>
  );
}

function EventAttendanceComparisonChart({
  rows,
}: {
  rows: ChapterLeaderCommandCenterEventCard[];
}) {
  const comparableRows = rows.filter((row) => row.rsvpCount !== null || row.attendedCount !== null);
  const maxValue = comparableRows.reduce((highest, row) => {
    const rowPeak = Math.max(row.rsvpCount ?? 0, row.attendedCount ?? 0);
    return Math.max(highest, rowPeak);
  }, 0);

  if (comparableRows.length === 0 || maxValue === 0) {
    return (
      <p className="text-sm leading-6 text-slate-600">
        Attendance comparison will appear here once RSVP and check-in counts are available.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {comparableRows.map((row) => {
        const rsvpWidth = `${Math.max(((row.rsvpCount ?? 0) / maxValue) * 100, 12)}%`;
        const attendedWidth = `${Math.max(((row.attendedCount ?? 0) / maxValue) * 100, 12)}%`;

        return (
          <div key={row.id} className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{row.title}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {row.lane} · {row.dateLabel}
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {row.attendanceRateLabel}
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              <AttendanceBarRow
                label="RSVP"
                value={row.rsvpCount ?? 0}
                width={rsvpWidth}
                toneClassName="bg-[#93c5fd]"
              />
              <AttendanceBarRow
                label="Attended"
                value={row.attendedCount ?? 0}
                width={attendedWidth}
                toneClassName="bg-[#2563eb]"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AttendanceBarRow({
  label,
  value,
  width,
  toneClassName,
}: {
  label: string;
  value: number;
  width: string;
  toneClassName: string;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-950">{value}</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={["h-full rounded-full", toneClassName].join(" ")} style={{ width }} />
      </div>
    </div>
  );
}

function SocialRecruitingMetricTile({
  metric,
}: {
  metric: ChapterLeaderCommandCenter["socialRecruitingMetrics"][number];
}) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {metric.label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{metric.value}</p>
    </div>
  );
}

function getCommitteeNextMoveTitle(
  committee: ChapterLeaderCommandCenter["committees"][number],
) {
  if (committee.ownerLabel.toLowerCase().includes("open") || committee.ownerLabel === "No chair assigned") {
    return "Restore visible chair ownership";
  }

  if (committee.operatingStatusLabel === "Needs Attention") {
    return "Tighten the next follow-up cycle";
  }

  if (committee.operatingStatusLabel === "Inactive") {
    return "Reopen one concrete operating lane";
  }

  return "Keep the lane reusable for the next owner";
}

function getCommitteeNextMoveSummary(
  committee: ChapterLeaderCommandCenter["committees"][number],
) {
  if (committee.ownerLabel.toLowerCase().includes("open") || committee.ownerLabel === "No chair assigned") {
    return "Name a temporary chair, pick one event-sized responsibility, and make the restart visible before this lane goes broader.";
  }

  if (committee.operatingStatusLabel === "Needs Attention") {
    return "Use the next event and proof follow-up to show cleaner ownership, not just more activity.";
  }

  if (committee.operatingStatusLabel === "Inactive") {
    return "Choose one short-term committee commitment so the lane becomes visible again instead of staying theoretical.";
  }

  return "Capture what is working now so the lane can scale without depending on one strong person.";
}

function ChapterEventsTable({
  rows,
  selectedEventId,
}: {
  rows: ChapterLeaderCommandCenterEventCard[];
  selectedEventId: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Event</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Committee</th>
            <th className="px-4 py-3">RSVP</th>
            <th className="px-4 py-3">Attended</th>
            <th className="px-4 py-3">Rate</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Proof</th>
            <th className="px-4 py-3">Follow-up</th>
            <th className="px-4 py-3">Creator</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((event) => (
            <tr
              key={event.id}
              className={`border-t border-slate-200 ${
                event.id === selectedEventId ? "bg-[#fffdf5]" : ""
              }`}
            >
              <td className="px-4 py-3 font-semibold text-slate-950">
                <Link
                  href={event.href}
                  className={`hover:text-[#1d4ed8] ${
                    event.id === selectedEventId ? "text-[#1d4ed8]" : ""
                  }`}
                >
                  {event.title}
                </Link>
              </td>
              <td className="px-4 py-3">{event.dateLabel}</td>
              <td className="px-4 py-3">{event.lane}</td>
              <td className="px-4 py-3">{formatNumericCell(event.rsvpCount)}</td>
              <td className="px-4 py-3">{formatNumericCell(event.attendedCount)}</td>
              <td className="px-4 py-3">{event.attendanceRateLabel}</td>
              <td className="px-4 py-3">
                <TableTonePill tone={eventStatusTone(event.eventStatusLabel)} label={event.eventStatusLabel} />
              </td>
              <td className="px-4 py-3">
                <TableTonePill tone={proofTone(event.proofStatusLabel)} label={event.proofStatusLabel} />
              </td>
              <td className="px-4 py-3">
                <TableTonePill tone={followUpTone(event.followUpStatusLabel)} label={event.followUpStatusLabel} />
              </td>
              <td className="px-4 py-3">{event.creatorLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommitteeOperatingRow({
  committee,
  isSelected,
}: {
  committee: ChapterLeaderCommandCenterCommitteeCard;
  isSelected: boolean;
}) {
  const accentClassName = getCommitteeAccentClassName(committee.name);
  const kpiValue = getPercentValue(committee.kpiLabel);

  return (
    <Link
      href={committee.href}
      aria-current={isSelected ? "page" : undefined}
      className={[
        "rounded-[1.35rem] border bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:border-[#bfdbfe] hover:bg-[#f8fbff]",
        isSelected
          ? "border-[#60a5fa] bg-[#f8fbff] shadow-[0_14px_32px_rgba(37,99,235,0.12)]"
          : "border-slate-200",
        accentClassName,
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 xl:min-w-[16rem]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-semibold text-slate-950">{committee.name}</p>
            <span className="text-lg font-semibold text-slate-300" aria-hidden="true">
              &gt;
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {renderCommitteeOwnerBadges(committee.ownerLabel)}
          </div>
        </div>

        <div className="grid flex-1 gap-4 sm:grid-cols-3 xl:max-w-[22rem]">
          <CommitteeMetricCell
            label="members"
            value={committee.memberCountLabel.replace(" members", "")}
          />
          <CommitteeMetricCell
            label="actions done"
            value={committee.actionsDoneLabel.replace(" actions done", "")}
          />
          <CommitteeMetricCell
            label="events"
            value={committee.eventsCountLabel.replace(" events", "").replace(" event", "")}
          />
        </div>

        <div className="grid gap-3 xl:min-w-[16rem]">
          <div className="flex items-center gap-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              KPI {committee.kpiLabel}
            </p>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={["h-full rounded-full", getCommitteeKpiBarClassName(committee.operatingStatusLabel)].join(" ")}
                style={{ width: `${kpiValue}%` }}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              {isSelected ? (
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">
                  Selected
                </span>
              ) : null}
              <TableTonePill
                tone={committeeStatusTone(committee.operatingStatusLabel)}
                label={committee.operatingStatusLabel}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function renderCommitteeOwnerBadges(ownerLabel: string) {
  const owners = splitCommitteeOwners(ownerLabel);
  const isUnowned = isCommitteeOwnerUnassigned(ownerLabel);

  if (isUnowned) {
    return [
      <span
        key={ownerLabel}
        className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
      >
        <span aria-hidden="true">⚠</span>
        No chair assigned
      </span>,
    ];
  }

  return owners.map((owner) => (
    <span
      key={owner}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563eb] text-[0.58rem] font-semibold text-white">
        {getInitials(owner)}
      </span>
      {owner}
    </span>
  ));
}

function splitCommitteeOwners(ownerLabel: string) {
  return ownerLabel
    .split(/\s(?:\/|\+)\s/g)
    .map((owner) => owner.trim())
    .filter(Boolean);
}

function isCommitteeOwnerUnassigned(ownerLabel: string) {
  const normalized = ownerLabel.trim().toLowerCase();
  return normalized.includes("open") || normalized === "no chair assigned";
}

function CommitteeMetricCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 text-center">
      <p className="text-2xl font-semibold leading-none text-slate-950">{value}</p>
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function formatNumericCell(value: number | null) {
  return value === null ? "—" : `${value}`;
}

function eventStatusTone(status: string): "green" | "yellow" | "red" | "slate" {
  switch (status.toLowerCase()) {
    case "past":
      return "slate";
    case "today":
      return "yellow";
    case "upcoming":
      return "green";
    default:
      return "slate";
  }
}

function proofTone(status: string): "green" | "yellow" | "red" | "slate" {
  switch (status.toLowerCase()) {
    case "done":
      return "green";
    case "pending":
      return "yellow";
    case "missing":
      return "red";
    default:
      return "slate";
  }
}

function followUpTone(status: string): "green" | "yellow" | "red" | "slate" {
  switch (status.toLowerCase()) {
    case "done":
      return "green";
    case "pending":
      return "yellow";
    case "overdue":
      return "red";
    default:
      return "slate";
  }
}

function committeeStatusTone(status: string): "green" | "yellow" | "red" | "slate" {
  switch (status.toLowerCase()) {
    case "strong":
    case "active":
      return "green";
    case "needs attention":
    case "needs owner":
      return "yellow";
    case "inactive":
      return "red";
    default:
      return "slate";
  }
}

function TableTonePill({
  tone,
  label,
}: {
  tone: "green" | "yellow" | "red" | "slate";
  label: string;
}) {
  const className =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "yellow"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "red"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function SelectedMemberContextBanner({
  eyebrow,
  title,
  summary,
  member,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  member: ChapterLeaderCommandCenterMemberProfile;
}) {
  return (
    <div className="rounded-[1.2rem] border border-[#bfdbfe] bg-[#eef5ff] p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
              {member.roleLabel}
            </span>
            <span className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {member.committeeLane}
            </span>
            <span className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {member.pipelineLabel}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{summary}</p>
        </div>
        <Link
          href={member.profileHref}
          className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8]"
        >
          Open member profile
        </Link>
      </div>
    </div>
  );
}

function ImpactHighlightCard({
  highlight,
}: {
  highlight: ChapterLeaderCommandCenter["impactHighlights"][number];
}) {
  const toneClassName =
    highlight.tone === "blue"
      ? "bg-[linear-gradient(160deg,#2563eb_0%,#1d4ed8_100%)] text-white"
      : highlight.tone === "purple"
        ? "bg-[linear-gradient(160deg,#6d28d9_0%,#4338ca_100%)] text-white"
        : "bg-[linear-gradient(160deg,#f59e0b_0%,#ea580c_100%)] text-white";

  return (
    <div className={["rounded-[1.6rem] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.12)]", toneClassName].join(" ")}>
      {highlight.icon ? (
        <p className="text-2xl leading-none" aria-hidden="true">
          {highlight.icon}
        </p>
      ) : (
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/70">
          {highlight.eyebrow}
        </p>
      )}
      <div className="mt-4 flex items-end gap-3">
        <p className="text-5xl font-semibold leading-none">{highlight.value}</p>
        <p className="pb-1 text-lg font-semibold text-white/88">{highlight.label}</p>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/86">{highlight.summary}</p>
      <Link
        href={highlight.href}
        className="mt-4 inline-flex rounded-full border border-white/20 bg-white/14 px-4 py-2 text-sm font-semibold text-white"
      >
        {highlight.actionLabel}
      </Link>
    </div>
  );
}

function ImpactDataPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="app-surface rounded-[1.6rem] p-5">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ImpactStatList({
  stats,
}: {
  stats: ChapterLeaderCommandCenter["localImpactStats"];
}) {
  return (
    <div className="grid gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0"
        >
          <p className="text-sm text-slate-600">{stat.label}</p>
          <p className="text-sm font-semibold text-slate-950">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

function CampaignImpactCard({
  overview,
}: {
  overview: NonNullable<ChapterLeaderCommandCenter["campaignImpactOverview"]>;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-2xl font-semibold text-slate-950">{overview.raisedLabel}</p>
          <p className="text-sm text-slate-500">/ {overview.goalLabel}</p>
        </div>
        <p className="text-sm font-semibold text-slate-700">{overview.progressLabel}</p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-[70%] rounded-full bg-emerald-500" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailCallout label="Donors" value={overview.donorsLabel} />
        <DetailCallout label="Campaign Rank" value={overview.rankLabel} />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {overview.pillars.map((pillar, index) => (
          <div key={pillar.label} className="rounded-[1rem] border border-slate-200 bg-slate-50 p-3">
            <div
              className="h-12 rounded-[0.8rem] bg-[#2563eb]"
              style={{ opacity: 1 - index * 0.12 }}
            />
            <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {pillar.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedEngagementChart({
  rows,
}: {
  rows: ChapterLeaderCommandCenter["feedChartRows"];
}) {
  const maxValue = Math.max(
    ...rows.flatMap((row) => [row.likes, row.comments, row.actionsAfter]),
    1,
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
        <LegendPill label="Likes" colorClassName="bg-sky-200" />
        <LegendPill label="Comments" colorClassName="bg-blue-500" />
        <LegendPill label="Actions After" colorClassName="bg-amber-400" />
      </div>
      <div className="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-4">
        <div className="flex h-48 items-end gap-4">
          {rows.map((row) => (
            <div key={row.label} className="flex min-w-0 flex-1 items-end justify-center gap-1">
              <FeedChartBar value={row.likes} maxValue={maxValue} colorClassName="bg-sky-200" />
              <FeedChartBar value={row.comments} maxValue={maxValue} colorClassName="bg-blue-500" />
              <FeedChartBar value={row.actionsAfter} maxValue={maxValue} colorClassName="bg-amber-400" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4">
          {rows.map((row) => (
            <p
              key={row.label}
              className="truncate text-center text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400"
            >
              {row.label}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function LegendPill({
  label,
  colorClassName,
}: {
  label: string;
  colorClassName: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={["h-2.5 w-2.5 rounded-full", colorClassName].join(" ")} />
      {label}
    </span>
  );
}

function FeedChartBar({
  value,
  maxValue,
  colorClassName,
}: {
  value: number;
  maxValue: number;
  colorClassName: string;
}) {
  return (
    <div className="flex h-40 items-end">
      <div
        className={["w-4 rounded-full", colorClassName].join(" ")}
        style={{ height: `${Math.max(10, Math.round((value / maxValue) * 112))}px` }}
      />
    </div>
  );
}

function SelectedPostMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-white/70 bg-white/80 px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function FeedPostsTable({
  rows,
}: {
  rows: ChapterLeaderCommandCenter["feedPostRows"];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">
          <tr>
            {["Post", "Type", "Author", "Views", "Likes", "Comments", "Shares", "Actions After", "RSVPs", "Date"].map((label) => (
              <th key={label} className="px-4 py-3">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={[
                "border-t border-slate-200",
                row.isSelected ? "bg-[#eef5ff]" : "",
              ].join(" ")}
            >
              <td className="px-4 py-3 font-semibold text-slate-950">
                <Link href={row.href} className="transition hover:text-[#1d4ed8]">
                  {row.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className={getFeedPostBadgeClassName(row.badgeLabel)}>{row.typeLabel}</span>
              </td>
              <td className="px-4 py-3">{row.authorLabel}</td>
              <td className="px-4 py-3">{row.viewsLabel}</td>
              <td className="px-4 py-3">{row.likesLabel}</td>
              <td className="px-4 py-3">{row.commentsLabel}</td>
              <td className="px-4 py-3">{row.sharesLabel}</td>
              <td className="px-4 py-3 font-semibold text-emerald-700">{row.actionsAfterLabel}</td>
              <td className="px-4 py-3">{row.rsvpsLabel}</td>
              <td className="px-4 py-3">{row.dateLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getFeedPostBadgeClassName(label: string) {
  const baseClassName =
    "inline-flex rounded-full border px-3 py-1 text-xs font-semibold";

  if (label === "Bridge Video") {
    return `${baseClassName} border-[#bfdbfe] bg-[#eef5ff] text-[#1d4ed8]`;
  }

  if (label === "Best Practice") {
    return `${baseClassName} border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700`;
  }

  return `${baseClassName} border-slate-200 bg-slate-50 text-slate-600`;
}

function FeedMemberRow({
  member,
}: {
  member: ChapterLeaderCommandCenter["mostEngagedMembers"][number];
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-slate-200 bg-white p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-xs font-semibold text-white">
          {member.initials}
        </div>
        <p className="truncate text-sm font-semibold text-slate-950">{member.displayName}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-700">{member.scoreLabel}</span>
        {member.actionLabel ? (
          member.actionHref ? (
            <Link
              href={member.actionHref}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
            >
              {member.actionLabel}
            </Link>
          ) : (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {member.actionLabel}
            </span>
          )
        ) : null}
      </div>
    </div>
  );
}

function BridgeVideoFilterPill({
  filter,
}: {
  filter: ChapterLeaderCommandCenter["bridgeVideoFilters"][number];
}) {
  return (
    <Link
      href={filter.href}
      aria-current={filter.isActive ? "page" : undefined}
      className={[
        "rounded-full px-3 py-1.5 text-xs font-semibold",
        filter.isActive
          ? "bg-[#2563eb] text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950",
      ].join(" ")}
    >
      {filter.label}
    </Link>
  );
}

function BridgeVideoMetricTile({
  metric,
}: {
  metric: ChapterLeaderCommandCenter["bridgeVideoMetrics"][number];
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <p className="text-3xl font-semibold text-slate-950">{metric.value}</p>
      <p className="mt-2 text-sm font-medium text-slate-500">{metric.label}</p>
    </div>
  );
}

function BridgeVideoHubCard({
  entry,
  selected,
}: {
  entry: ChapterLeaderCommandCenter["bridgeVideoEntries"][number];
  selected: boolean;
}) {
  const isFeatured = entry.badgeLabel === "Featured";

  return (
    <div
      className={[
        "rounded-[1.35rem] border bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]",
        selected
          ? "border-[#2563eb] bg-[#f8fbff] shadow-[0_16px_40px_rgba(37,99,235,0.12)]"
          : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className={[
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-[1rem] text-xl font-semibold",
              isFeatured
                ? "bg-[linear-gradient(160deg,#2563eb_0%,#1d4ed8_100%)] text-white"
                : "bg-slate-50 text-slate-400",
            ].join(" ")}
          >
            &gt;
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-semibold text-slate-950">{entry.title}</p>
              {entry.badgeLabel ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {entry.badgeLabel}
                </span>
              ) : null}
              <span className="rounded-full border border-[#bfdbfe] bg-[#eef5ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                {entry.categoryLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {entry.authorLabel} · {entry.submittedDateLabel}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
              <span>Views {entry.viewsLabel}</span>
              <span>Likes {entry.likesLabel}</span>
              <span>Comments {entry.commentsLabel}</span>
              <span>Shares {entry.sharesLabel}</span>
              <span className="text-emerald-700">{entry.chaptersUsingLabel}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={entry.featureHref}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Feature
          </Link>
          <Link
            href={entry.shareHref}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Share
          </Link>
        </div>
      </div>
    </div>
  );
}

function SuccessionGapCard({
  gap,
}: {
  gap: ChapterLeaderCommandCenter["successionGaps"][number];
}) {
  return (
    <div
      className={[
        "rounded-[1.25rem] border p-4",
        gap.severity === "high"
          ? "border-rose-200 bg-rose-50"
          : gap.severity === "medium"
            ? "border-amber-200 bg-amber-50"
            : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-3">
        <TonePill tone={toTone(gap.severity)} label={gap.severity} />
        <p className="text-sm font-semibold text-slate-950">{gap.title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{gap.summary}</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{gap.actionLabel}</p>
    </div>
  );
}

function SuccessionPipelineRow({
  candidate,
}: {
  candidate: ChapterLeaderCommandCenterSuccessionCandidate;
}) {
  return (
    <Link
      href={candidate.href}
      className={[
        "flex items-center justify-between gap-3 rounded-[1.1rem] border bg-white p-3 transition hover:border-[#bfdbfe] hover:bg-[#f8fbff]",
        candidate.isSelected
          ? "border-[#2563eb] bg-[#f8fbff] shadow-[0_12px_30px_rgba(37,99,235,0.12)]"
          : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-xs font-semibold text-white">
          {getInitials(candidate.displayName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{candidate.displayName}</p>
          <p className="truncate text-xs text-slate-500">
            {candidate.committeeLabel} · {candidate.pointsLabel}
          </p>
          {candidate.isSelected ? (
            <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">
              Selected now
            </p>
          ) : null}
        </div>
      </div>
      <span
        className={[
          "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
          candidate.badgeLabel.toLowerCase().includes("candidate")
            ? "border border-cyan-200 bg-cyan-50 text-cyan-700"
            : "border border-indigo-200 bg-indigo-50 text-indigo-700",
        ].join(" ")}
      >
        {candidate.badgeLabel}
      </span>
    </Link>
  );
}

function SuccessionTimelineRow({
  item,
}: {
  item: ChapterLeaderCommandCenter["successionTimeline"][number];
}) {
  return (
    <div className="flex gap-4 rounded-[1.15rem] border border-slate-200 bg-white p-4">
      <div className="w-24 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {item.dateLabel}
        </p>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-950">{item.title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{item.summary}</p>
      </div>
    </div>
  );
}

function buildNominateCandidateHref(commandCenter: ChapterLeaderCommandCenter) {
  return (
    (commandCenter.hasExplicitMemberSelection
      ? commandCenter.selectedMember?.profileHref
      : null) ??
    commandCenter.successionCandidates[0]?.href ??
    "/chapter?view=succession"
  );
}

function buildTransitionPlanHref(commandCenter: ChapterLeaderCommandCenter) {
  if (commandCenter.hasExplicitMemberSelection && commandCenter.selectedMember) {
    return buildChapterLeaderCommandCenterHref("succession", {
      source: commandCenter.selectedSource,
      memberId: commandCenter.selectedMember.id,
      pipelineFilter: commandCenter.selectedPipelineFilter,
      searchQuery: commandCenter.pipelineSearchQuery,
    });
  }

  return commandCenter.successionCandidates[0]?.href ?? "/chapter?view=succession";
}

function LeaderboardFilterPill({
  filter,
}: {
  filter: ChapterLeaderCommandCenter["leaderboardFilters"][number];
}) {
  return (
    <Link
      href={filter.href}
      aria-current={filter.isActive ? "page" : undefined}
      className={[
        "rounded-full px-2.5 py-1 text-[0.72rem] font-semibold",
        filter.isActive
          ? "bg-[#2563eb] text-white"
          : "border border-slate-200 bg-white text-slate-600",
      ].join(" ")}
    >
      {filter.label}
    </Link>
  );
}

function ChapterBenchmarkCard({
  chapter,
}: {
  chapter: ChapterLeaderCommandCenter["leaderboardChapters"][number];
}) {
  const isCurrentChapter = chapter.badgeLabel === "Your Chapter";

  return (
    <div
      className={[
        "rounded-[1.45rem] border bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]",
        isCurrentChapter ? "border-[#93c5fd] ring-1 ring-[#bfdbfe]" : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg">{chapter.rankLabel}</span>
            <p className="text-lg font-semibold text-slate-950">{chapter.chapterName}</p>
            {chapter.badgeLabel ? (
              <span className="rounded-full border border-[#bfdbfe] bg-[#eef5ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                {chapter.badgeLabel}
              </span>
            ) : null}
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {chapter.countryLabel}
            </span>
          </div>
          <p className="mt-2 text-sm italic text-slate-500">{chapter.quote}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {chapter.healthLabel}
          </span>
          <Link
            href={chapter.bestPracticesHref}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Best practices
          </Link>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={["h-full rounded-full", isCurrentChapter ? "bg-[#2563eb]" : "bg-slate-400"].join(" ")}
          style={{
            width:
              chapter.healthLabel === "Health 96"
                ? "96%"
                : chapter.healthLabel === "Health 93"
                  ? "93%"
                  : chapter.healthLabel === "Health 87"
                    ? "87%"
                    : "84%",
          }}
        />
      </div>

      <div className="mt-4 grid grid-cols-6 gap-3">
        {chapter.metrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {metric.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TonePill({
  tone,
  label,
}: {
  tone: "green" | "yellow" | "red";
  label: string;
}) {
  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-semibold capitalize",
        tone === "green"
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
          : tone === "yellow"
            ? "border border-amber-200 bg-amber-50 text-amber-700"
            : "border border-rose-200 bg-rose-50 text-rose-700",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function getHealthLabel(tone: "green" | "yellow" | "red") {
  switch (tone) {
    case "green":
      return "Healthy";
    case "yellow":
      return "Watch closely";
    case "red":
    default:
      return "Needs support";
  }
}

function getInitials(value: string) {
  return value
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function getDashboardHeading(monthLabel: string) {
  return `Chapter Dashboard · ${monthLabel.replace("June", "Jun")}`;
}

function getProgressValue(value: string) {
  const match = value.match(/(\d+)\s*\/\s*(\d+)/);

  if (!match) {
    return 0;
  }

  const completed = Number(match[1]);
  const total = Number(match[2]);

  if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, completed / total));
}

function getHealthRankingLabel(commandCenter: ChapterLeaderCommandCenter) {
  if (commandCenter.sampleLabel) {
    return `3rd in ${commandCenter.regionLabel} · top 15% globally`;
  }

  return `${getHealthLabel(commandCenter.healthTone)} chapter posture`;
}

function toTone(value: "high" | "medium" | "low" | "covered" | "thin" | "missing") {
  if (value === "covered" || value === "low") {
    return "green";
  }

  if (value === "thin" || value === "medium") {
    return "yellow";
  }

  return "red";
}

function getWeeklyMovementClassName(value: string) {
  const numericValue = Number.parseInt(value, 10);

  if (numericValue >= 50) {
    return "text-emerald-700";
  }

  if (numericValue >= 30) {
    return "text-amber-600";
  }

  return "text-slate-700";
}

function getCommitteeAccentClassName(value: string) {
  if (value === "Recruitment") {
    return "border-l-4 border-l-sky-400";
  }

  if (value === "Fundraising") {
    return "border-l-4 border-l-amber-400";
  }

  if (value === "Events") {
    return "border-l-4 border-l-blue-500";
  }

  if (value === "SLT Promotion") {
    return "border-l-4 border-l-violet-500";
  }

  if (value === "Communications") {
    return "border-l-4 border-l-pink-500";
  }

  if (value === "Service / Local Volunteering") {
    return "border-l-4 border-l-emerald-500";
  }

  return "border-l-4 border-l-rose-400";
}

function getCommitteeKpiBarClassName(value: string) {
  if (value.toLowerCase() === "strong") {
    return "bg-[#2563eb]";
  }

  if (value.toLowerCase() === "inactive") {
    return "bg-rose-400";
  }

  return "bg-amber-400";
}

function getPercentValue(value: string) {
  const match = value.match(/\d+/);
  const numericValue = match ? Number.parseInt(match[0], 10) : 0;
  return Number.isFinite(numericValue) ? numericValue : 0;
}
