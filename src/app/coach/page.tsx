import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BrowserWriteGateNotice } from "@/components/browser-write-gate-notice";
import { CoachDecisionServerActionPanel } from "@/components/coach-decision-server-action-panel";
import { CoachDecisionResultStatesPanel } from "@/components/coach-decision-result-states-panel";
import { CoachPortfolioReadinessPanel } from "@/components/coach-portfolio-readiness-panel";
import { CoachSupportNotesPanel } from "@/components/coach-support-notes-panel";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { RestrictedState } from "@/components/restricted-state";
import { StaffCommandCenterPanel } from "@/components/staff-command-center-panel";
import { WriteReadinessNotice } from "@/components/write-readiness-notice";
import { getCoachDecisionBrowserWriteGate } from "@/services/browser-write-activation";
import {
  type CoachDecisionResultCode,
  getCoachDecisionResultStates,
  getDisabledCoachDecisionResultPreview,
} from "@/services/coach-decision-result-states";
import { getCoachDecisionWriteReadiness } from "@/services/coach-decision-write";
import {
  getCoachPortfolioReadiness,
  type CoachPortfolioChapter,
} from "@/services/coach-portfolio-readiness";
import { getCoachSupportNotesWorkspace } from "@/services/coach-support-notes";
import {
  canLogCoachDecision,
  createCoachDecisionMock,
  type CoachDecisionInput,
} from "@/services/local-action-contracts";
import { getLandingRouteForActor } from "@/services/landing-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadIntegrationOutbox,
  getActorSurfaceFamily,
  getVisibleRiskFlagsForActor,
} from "@/services/role-visibility";
import {
  getStaffCommandCenter,
  type StaffCampaignOperationsOverview,
} from "@/services/staff-command-center";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { prepareDisabledCoachDecisionWrite } from "@/services/write-readiness";

export const metadata = getStaticRouteMetadata("coach");
export const dynamic = "force-dynamic";

type CoachPageProps = {
  searchParams?: Promise<CoachSearchParams>;
};

type CoachSearchParams = {
  bestPractice?: string;
  campaign?: string;
  chapter?: string;
  coach?: string;
  coachMode?: string;
  coachDecisionResult?: string;
  country?: string;
  decision?: string;
  portfolioCampaign?: string;
  proof?: string;
  proofQueue?: string;
  proofType?: string;
  feedAudience?: string;
  feedDraft?: string;
  feedPost?: string;
  hubspotChapter?: string;
  practiceCampaign?: string;
  practiceCountry?: string;
  feedRole?: string;
  q?: string;
  risk?: string;
  source?: string;
  view?: string;
};

type CoachSurfaceView =
  | "overview"
  | "chapter_detail"
  | "campaigns"
  | "support_notes"
  | "staff_fallback";

export default async function CoachPage({ searchParams }: CoachPageProps) {
  const emptySearchParams: CoachSearchParams = {};
  const [data, actor, search] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const coachSurfaceView = parseCoachSurfaceView(search);
  const commandCenterView =
    coachSurfaceView === "campaigns" || coachSurfaceView === "staff_fallback"
      ? search.view
      : "chapters";
  const activePhase = data.phases[0];
  const commandCenter = getStaffCommandCenter(actor, data, {
    routeBase: "/coach",
    bestPractice: search.bestPractice,
    campaign: search.campaign,
    chapterId: search.chapter,
    coach: search.coach,
    country: search.country,
    decision: search.decision,
    portfolioCampaign: search.portfolioCampaign,
    proof: search.proof,
    proofQueue: search.proofQueue,
    proofType: search.proofType,
    feedAudience: search.feedAudience,
    feedDraft: search.feedDraft,
    feedPost: search.feedPost,
    hubspotChapter: search.hubspotChapter,
    practiceCampaign: search.practiceCampaign,
    practiceCountry: search.practiceCountry,
    feedRole: search.feedRole,
    query: search.q,
    risk: search.risk,
    source: search.source,
    view: commandCenterView,
  });
  const visibleRisks = getVisibleRiskFlagsForActor(actor, data.riskFlags);
  const sampleCoachDecisionInput = {
    decision: data.kpiSummary.coachDecision,
    note:
      "Coach decision preview: whether this chapter should advance, hold, or receive intervention.",
    blockerSummary:
      data.kpiSummary.coachDecision === "intervene"
        ? "Follow-up owners and proof quality need coach attention."
        : undefined,
  } satisfies CoachDecisionInput;
  const canLogDecision = canLogCoachDecision(actor);
  const portfolio = getCoachPortfolioReadiness(actor, data, {
    campaign: search.campaign,
    campus: search.country,
    coachMode: search.coachMode,
    query: search.q,
    routeBase: "/coach",
    risk: search.risk,
    source: search.source,
  });
  const selectedCoachChapter = getSelectedCoachPortfolioChapter(portfolio.rows, search);
  const coachSupportNotes = getCoachSupportNotesWorkspace(actor, data, {
    chapterName: selectedCoachChapter?.chapterName ?? commandCenter.selectedChapter?.chapterName,
    decision: selectedCoachChapter?.decision ?? commandCenter.selectedChapter?.selectedDecision,
  });
  const coachDecisionPreview = createCoachDecisionMock(actor, sampleCoachDecisionInput);
  const coachDecisionResultPreview = getDisabledCoachDecisionResultPreview(
    actor,
    sampleCoachDecisionInput,
  );
  const disabledCoachDecisionWrite = prepareDisabledCoachDecisionWrite(
    actor,
    sampleCoachDecisionInput,
  );
  const coachDecisionGate = getCoachDecisionBrowserWriteGate(
    actor,
    sampleCoachDecisionInput,
    {
      chapterId: data.chapter.id,
      campaignId: data.campaign.id,
      phaseId: activePhase?.id ?? "mock-phase",
    },
  );
  const coachDecisionWriteReadiness = getCoachDecisionWriteReadiness(
    actor,
    sampleCoachDecisionInput,
    {
      chapterId: data.chapter.id,
      campaignId: data.campaign.id,
      phaseId: activePhase?.id ?? "mock-phase",
    },
  );
  const coachDecisionResultCode = parseCoachDecisionResultCode(
    search.coachDecisionResult,
  );
  const showCoachSupportNotes =
    commandCenter.canReadCommandCenter && coachSurfaceView === "support_notes";
  const showCoachCampaigns =
    commandCenter.canReadCommandCenter && coachSurfaceView === "campaigns";
  const showCoachChapterDetail =
    commandCenter.canReadCommandCenter &&
    (coachSurfaceView === "chapter_detail" ||
      (coachSurfaceView === "overview" && hasCoachPortfolioDrillIn(search)));
  const showCoachPortfolioHome =
    commandCenter.canReadCommandCenter &&
    coachSurfaceView === "overview" &&
    !showCoachChapterDetail;
  const showCoachStaffFallback =
    commandCenter.canReadCommandCenter && coachSurfaceView === "staff_fallback";
  const showCoachReviewArtifacts = false;
  const coachChapterDetailHref = commandCenter.selectedChapter
    ? buildCoachViewHref(
        {
          ...search,
          chapter: commandCenter.selectedChapter.chapterId,
        },
        "chapter_detail",
      )
    : selectedCoachChapter
      ? buildCoachViewHref(
          {
            ...search,
            chapter: selectedCoachChapter.chapterId,
          },
          "chapter_detail",
        )
    : rewriteCoachSurfaceHref(
        portfolio.rows[0]?.detailHref ?? "/coach?view=chapter_detail",
        "chapter_detail",
      );
  const coachSupportNotesHref = buildCoachViewHref(search, "support_notes", "support-notes");
  const coachViewTabs = [
    {
      key: "overview" as const,
      label: "Chapters",
      href: buildCoachChaptersHref(search),
    },
    {
      key: "chapter_detail" as const,
      label: "Chapter Detail",
      href: coachChapterDetailHref,
    },
    {
      key: "campaigns" as const,
      label: "Campaigns",
      href: portfolio.campaignsHref,
    },
    {
      key: "support_notes" as const,
      label: "Support Notes",
      href: coachSupportNotesHref,
    },
  ];
  const surfaceFamily = getActorSurfaceFamily(actor);
  const restrictedNextHref = getLandingRouteForActor(actor);
  const restrictedNextLabel =
    surfaceFamily === "ds_admin"
      ? "Open integration outbox"
      : surfaceFamily === "leader"
        ? "Open chapter home"
        : surfaceFamily === "member"
          ? "Open student home"
          : "Open your owned surface";
  const coachViewTabsSection = (
    <section className="app-surface rounded-[1.5rem] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Coach views
        </span>
        {coachViewTabs.map((item) => {
          const isCurrent =
            (item.key === "overview" && showCoachPortfolioHome) ||
            (item.key === "chapter_detail" && showCoachChapterDetail) ||
            (item.key === "campaigns" && showCoachCampaigns) ||
            (item.key === "support_notes" && showCoachSupportNotes);

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isCurrent ? "page" : undefined}
              className={[
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                isCurrent
                  ? "bg-[#0b4f9b] text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-[#bfdbfe] hover:bg-[#eef5ff]",
              ].join(" ")}
            >
              <CoachViewTabIcon view={item.key} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
  const coachPortfolioSourceContext =
    showCoachPortfolioHome && commandCenter.sourceContext
      ? {
          eyebrow: commandCenter.sourceContext.eyebrow,
          title: commandCenter.sourceContext.title,
          summary: commandCenter.sourceContext.summary,
          actions: commandCenter.sourceContext.actions ?? [],
        }
      : null;
  const coachChapterSourceContext = getCoachChapterDetailSourceContext(
    search,
    selectedCoachChapter,
  );

  return (
    <AppShell
      actor={actor}
      hideTopHeader={commandCenter.canReadCommandCenter}
      showDebugTools={!commandCenter.canReadCommandCenter}
    >
      {!commandCenter.canReadCommandCenter ? (
        <>
          <DataSourceNotice source={data.source} />
          <RestrictedState
            title="This coach command center is not visible to this role."
            message="Members and chapter leaders should stay in their student or chapter routes. DS Admin should keep using the admin safety lanes for outbox and integration review."
            nextHref={restrictedNextHref}
            nextLabel={restrictedNextLabel}
          />
        </>
      ) : (
        <>
          {!showCoachPortfolioHome ? coachViewTabsSection : null}

          {showCoachPortfolioHome ? (
            <>
              <CoachPortfolioReadinessPanel
                portfolio={portfolio}
                sourceContext={coachPortfolioSourceContext}
              />
              {coachViewTabsSection}
            </>
          ) : showCoachCampaigns ? (
            <CoachCampaignOperationsPanel
              overview={commandCenter.campaignOperations}
            />
          ) : showCoachChapterDetail ? (
            <CoachChapterDetailPanel
              rows={portfolio.rows}
              selectedChapter={selectedCoachChapter}
              overviewHref={buildCoachChaptersHref(search)}
              supportNotesHref={coachSupportNotesHref}
              riskReviewHref={portfolio.riskReviewHref}
              campaignsHref={buildCoachViewHref(
                {
                  ...search,
                  chapter: selectedCoachChapter?.chapterId ?? search.chapter,
                },
                "campaigns",
              )}
              sourceContext={getCoachChapterDetailSourceContext(search, selectedCoachChapter)}
            />
          ) : showCoachSupportNotes ? (
            <section className="app-surface rounded-[1.8rem] p-5">
              <p className="app-eyebrow app-eyebrow-blue">Coach note lane</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Prepare the next chapter check-in with private notes and route evidence.
              </h2>
              <p className="app-copy mt-3">
                This coach-owned state keeps the focus on follow-up posture, intervention
                readiness, and what should be named before any decision is promoted.
              </p>
              {selectedCoachChapter ? (
                <div className="mt-4 rounded-[1.35rem] border border-[#bfdbfe] bg-[#f8fbff] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="app-eyebrow app-eyebrow-blue">Notes focus</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        Reviewing {selectedCoachChapter.chapterName}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Keep the note lane attached to the same chapter, support posture,
                        and review context you just inspected so coach notes stay specific.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-xs font-semibold text-[#2563eb]">
                          {selectedCoachChapter.readinessScore}% health
                        </span>
                        <span className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-xs font-semibold text-[#2563eb]">
                          {selectedCoachChapter.openFollowUps} follow-ups open
                        </span>
                        <span className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-xs font-semibold text-[#2563eb]">
                          {selectedCoachChapter.proofPending} proof pending
                        </span>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:min-w-[15rem]">
                      <Link
                        href={coachChapterDetailHref}
                        className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-center text-sm font-semibold text-[#2563eb] transition hover:border-[#93c5fd] hover:bg-[#eff6ff]"
                      >
                        Return to chapter detail
                      </Link>
                      <Link
                        href={portfolio.riskReviewHref}
                        className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-center text-sm font-semibold text-[#2563eb] transition hover:border-[#93c5fd] hover:bg-[#eff6ff]"
                      >
                        Review risk reports
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
              {coachChapterSourceContext ? (
                <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="app-eyebrow app-eyebrow-slate">
                        {coachChapterSourceContext.eyebrow}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {coachChapterSourceContext.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {coachChapterSourceContext.summary}
                      </p>
                    </div>
                    <Link
                      href={coachChapterSourceContext.actionHref}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff]"
                    >
                      {coachChapterSourceContext.actionLabel}
                    </Link>
                  </div>
                </div>
              ) : null}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ReviewStat
                  label="Notes"
                  value={`${coachSupportNotes.counts.total}`}
                  note="Visible coach-readable notes in this support lane"
                />
                <ReviewStat
                  label="Private"
                  value={`${coachSupportNotes.counts.coachPrivate}`}
                  note="Signals that stay out of the student and chapter view"
                />
                <ReviewStat
                  label="Writes"
                  value={`${coachSupportNotes.browserWritesEnabled}`}
                  note="Coach note saves stay blocked until approval opens the lane"
                />
              </div>
            </section>
          ) : showCoachStaffFallback ? (
            <StaffCommandCenterPanel commandCenter={commandCenter} />
          ) : null}

          {showCoachSupportNotes ? (
            <div id="support-notes" className="grid gap-4">
              <CoachSupportNotesPanel workspace={coachSupportNotes} />
            </div>
          ) : null}

          {showCoachReviewArtifacts && coachDecisionPreview.success ? (
            <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
              <article className="app-surface-info rounded-[2rem] p-5">
                <p className="app-eyebrow app-eyebrow-blue">Coach decision path</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Log advance, hold, or intervene, but keep saving locked.
                </h2>
                <p className="app-copy mt-2">
                  This previews the future coach decision save. It would update
                  phase readiness, create the coach review, record event/audit
                  history, and leave any n8n escalation summary disabled.
                </p>
                <div className="app-surface mt-4 rounded-2xl p-3">
                  <p className="text-sm font-semibold text-slate-950">
                    Preview decision: {coachDecisionPreview.data.decision}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Readiness: {coachDecisionPreview.data.readinessStatus}. Coach
                    validation: {coachDecisionPreview.data.coachValidationStatus}.
                    Outbox: {coachDecisionPreview.data.automationOutbox.status}.
                  </p>
                </div>
              </article>

              <div className="grid gap-3">
                <WriteReadinessNotice
                  operationLabel="Coach decision write remains disabled"
                  wouldWriteTables={disabledCoachDecisionWrite.wouldWriteTables}
                />
                <EventOutboxLog
                  events={[coachDecisionPreview.data.integrationEvent]}
                  outboxItems={[coachDecisionPreview.data.automationOutbox]}
                />
              </div>
              <div className="lg:col-span-2">
                <CoachDecisionResultStatesPanel
                  preview={coachDecisionResultPreview}
                  states={getCoachDecisionResultStates()}
                />
              </div>
              <div className="lg:col-span-2">
                <CoachDecisionServerActionPanel
                  chapterId={data.chapter.id}
                  campaignId={data.campaign.id}
                  phase={activePhase}
                  readiness={coachDecisionWriteReadiness}
                  resultCode={coachDecisionResultCode}
                  defaultInput={sampleCoachDecisionInput}
                />
              </div>
            </section>
          ) : null}

          {showCoachReviewArtifacts && canLogDecision ? (
            <BrowserWriteGateNotice gate={coachDecisionGate} />
          ) : null}

          {showCoachReviewArtifacts && visibleRisks.length === 0 ? (
            <section className="app-surface rounded-[2rem] p-5">
              <p className="app-eyebrow app-eyebrow-slate">Risk readout</p>
              <h2 className="text-2xl font-semibold text-slate-950">No visible risk flags</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This role does not currently have risk rows to read in the selected
                local data source.
              </p>
            </section>
          ) : showCoachReviewArtifacts ? (
            <section className="app-surface rounded-[2rem] p-5">
              <p className="app-eyebrow app-eyebrow-slate">Risk readout</p>
              <h2 className="text-2xl font-semibold text-slate-950">Risk readout</h2>
              <div className="mt-4 grid gap-3">
                {visibleRisks.slice(0, 3).map((risk) => (
                  <article key={risk.id} className="app-surface-soft rounded-2xl p-4">
                    <p className="app-eyebrow app-eyebrow-warm">
                      {risk.severity} / {risk.visibility.replace("_", " ")}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">{risk.signal}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {risk.response_plan}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {showCoachReviewArtifacts && canReadIntegrationOutbox(actor) ? (
        <EventOutboxLog events={data.integrationEvents} outboxItems={data.outboxItems} />
      ) : null}
    </AppShell>
  );
}

function CoachViewTabIcon({
  view,
}: {
  view: Exclude<CoachSurfaceView, "staff_fallback">;
}) {
  const iconClassName = "h-[0.95rem] w-[0.95rem]";

  switch (view) {
    case "overview":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6.5 10v9h11v-9" />
        </svg>
      );
    case "chapter_detail":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 10h8" />
          <path d="M8 14h5" />
        </svg>
      );
    case "campaigns":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M5 7h14" />
          <path d="M5 12h10" />
          <path d="M5 17h12" />
        </svg>
      );
    case "support_notes":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M7 5h10a2 2 0 0 1 2 2v10H9l-4 3V7a2 2 0 0 1 2-2Z" />
          <path d="M9 10h6" />
          <path d="M9 14h4" />
        </svg>
      );
  }
}

function ReviewStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="app-surface-soft rounded-[1.35rem] p-4">
      <p className="app-eyebrow app-eyebrow-blue">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
    </article>
  );
}

function CoachChapterDetailPanel({
  overviewHref,
  rows,
  selectedChapter,
  supportNotesHref,
  riskReviewHref,
  campaignsHref,
  sourceContext,
}: {
  overviewHref: string;
  rows: readonly CoachPortfolioChapter[];
  selectedChapter: CoachPortfolioChapter | null;
  supportNotesHref: string;
  riskReviewHref: string;
  campaignsHref: string;
  sourceContext: {
    eyebrow: string;
    title: string;
    summary: string;
    actionLabel: string;
    actionHref: string;
  } | null;
}) {
  const chapterSwitchRows = selectedChapter
    ? rows.filter((row) => row.chapterId !== selectedChapter.chapterId)
    : rows;

  return (
    <section className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
          Coach chapter detail
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          {selectedChapter?.chapterName ?? "Assigned chapter detail"}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
          Use the filtered chapter list to inspect risk posture, recent signals, and
          the next support move one chapter at a time.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <MiniToken label="Assigned portfolio" />
          <MiniToken label="Rush Month" />
          <MiniToken
            label={
              selectedChapter
                ? `${selectedChapter.readinessScore}% health`
                : `${rows.length} visible chapter${rows.length === 1 ? "" : "s"}`
            }
          />
          <MiniToken
            label={
              selectedChapter
                ? `${selectedChapter.memberCount} members`
                : "Coach-owned review lane"
            }
          />
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-white/14 bg-white/[0.07] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                Coach actions
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                Keep support posture, notes, and campaign follow-up attached to the same chapter.
              </p>
            </div>
            <div className="grid gap-2 sm:min-w-[15rem]">
              <Link
                href={supportNotesHref}
                className="rounded-full bg-[#f7d05e] px-4 py-2 text-center text-sm font-semibold text-[#08224c] transition hover:bg-[#f9d96c]"
              >
                Write coach note
              </Link>
              <Link
                href={riskReviewHref}
                className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-center text-sm font-semibold text-white/88 transition hover:border-white/24 hover:bg-white/12 hover:text-white"
              >
                Review risk reports
              </Link>
              <Link
                href={campaignsHref}
                className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-center text-sm font-semibold text-white/88 transition hover:border-white/24 hover:bg-white/12 hover:text-white"
              >
                Open campaign support
              </Link>
            </div>
          </div>
        </div>
      </section>

      {selectedChapter ? (
        <section className="app-surface rounded-[1.8rem] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {selectedChapter.statusLabel}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {selectedChapter.campus}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {selectedChapter.campaignName}
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                Current support posture
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedChapter.chapterName} is the active coach review lane. {selectedChapter.nextStep}
              </p>
            </div>
            <Link
              href={overviewHref}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff]"
            >
              Return to chapter list
            </Link>
          </div>

          {sourceContext ? (
            <section className="mt-4 rounded-[1.35rem] border border-[#bfdbfe] bg-[#f8fbff] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="app-eyebrow app-eyebrow-blue">
                    {sourceContext.eyebrow}
                  </p>
                  <h4 className="mt-2 text-lg font-semibold text-slate-950">
                    {sourceContext.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {sourceContext.summary}
                  </p>
                </div>
                <Link
                  href={sourceContext.actionHref}
                  className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#2563eb] transition hover:border-[#93c5fd] hover:bg-[#eff6ff]"
                >
                  {sourceContext.actionLabel}
                </Link>
              </div>
            </section>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ReviewStat
              label="Health score"
              value={`${selectedChapter.readinessScore}%`}
              note={selectedChapter.decision}
            />
            <ReviewStat
              label="Last active"
              value={`${selectedChapter.openFollowUps} follow-ups open`}
              note={`${selectedChapter.memberCount} members in scope`}
            />
            <ReviewStat
              label="Coach"
              value={selectedChapter.coachName}
              note={selectedChapter.campus}
            />
            <ReviewStat
              label="Decision"
              value={readableCoachDecision(selectedChapter.decision)}
              note="Preview decision remains read-only"
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[0.94fr_1.06fr]">
            <section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Focus items
              </p>
              <div className="mt-3 grid gap-2">
                {getCoachChapterFocusItems(selectedChapter).map((item) => (
                  <p
                    key={item}
                    className="rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </section>
            <section className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Recent signals
              </p>
              <div className="mt-3 grid gap-3">
                {getCoachChapterSignals(selectedChapter).map((signal) => (
                  <article
                    key={`${selectedChapter.chapterId}-${signal.label}`}
                    className="rounded-[1rem] border border-slate-200 bg-white p-3"
                  >
                    <p className="text-sm font-semibold text-slate-950">{signal.label}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
                      {signal.status}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{signal.detail}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={supportNotesHref}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff]"
            >
              Return to support notes
            </Link>
            <Link
              href={campaignsHref}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff]"
            >
              Open campaign support
            </Link>
          </div>
        </section>
      ) : null}

      {selectedChapter ? (
        chapterSwitchRows.length > 0 ? (
          <section className="app-surface rounded-[1.8rem] p-5">
            <p className="app-eyebrow app-eyebrow-slate">Switch assigned chapter</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
              Keep coach review focused while opening another chapter
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Stay in the coach-owned chapter-detail route and switch directly into another assigned chapter when the support priority changes.
            </p>
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {chapterSwitchRows.map((row) => (
                <article
                  key={row.chapterId}
                  className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-semibold text-slate-950">{row.chapterName}</h4>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {row.statusLabel}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {row.campus}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{row.nextStep}</p>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <MiniStat label="Active" value={`${row.activeCount}`} />
                      <MiniStat label="Overdue" value={`${row.overdueCount}`} />
                      <MiniStat label="Follow-up" value={`${row.openFollowUps}`} />
                      <MiniStat label="Proof" value={`${row.proofPending}`} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#2563eb]">{row.nextStep}</p>
                      <Link
                        href={rewriteCoachSurfaceHref(row.detailHref, "chapter_detail")}
                        className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#2563eb] transition hover:border-[#93c5fd] hover:bg-[#eff6ff]"
                      >
                        Open chapter
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null
      ) : (
        <section className="app-surface rounded-[1.8rem] p-5">
          <p className="app-eyebrow app-eyebrow-slate">Assigned chapter list</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">
            Review risk and support posture by chapter
          </h3>
          <div className="mt-4 grid gap-3">
            {rows.map((row) => (
              <article
                key={row.chapterId}
                className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-semibold text-slate-950">{row.chapterName}</h4>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {row.statusLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{row.nextStep}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <MiniStat label="Active" value={`${row.activeCount}`} />
                      <MiniStat label="Overdue" value={`${row.overdueCount}`} />
                      <MiniStat label="Follow-up" value={`${row.openFollowUps}`} />
                      <MiniStat label="Proof" value={`${row.proofPending}`} />
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <p className="text-sm font-semibold text-[#2563eb]">{row.nextStep}</p>
                    <Link
                      href={rewriteCoachSurfaceHref(row.detailHref, "chapter_detail")}
                      className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#2563eb] transition hover:border-[#93c5fd] hover:bg-[#eff6ff]"
                    >
                      Open chapter
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function CoachCampaignOperationsPanel({
  overview,
}: {
  overview: StaffCampaignOperationsOverview;
}) {
  return (
    <section className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
          Campaign focus
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          {overview.selectedCampaignName}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
          Keep campaign interventions attached to coach-owned chapter support so the
          selected risk lane and return path stay narrower than the HQ command center.
        </p>
        {overview.sourceContext ? (
          <div className="mt-5 rounded-[1.35rem] border border-white/14 bg-white/[0.07] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                  {overview.sourceContext.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {overview.sourceContext.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/74">
                  {overview.sourceContext.summary}
                </p>
              </div>
              <Link
                href={overview.sourceContext.actionHref}
                className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white/88 transition hover:border-white/24 hover:bg-white/12 hover:text-white"
              >
                {overview.sourceContext.actionLabel}
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <section className="app-surface rounded-[1.8rem] p-5">
        <p className="app-eyebrow app-eyebrow-blue">Campaign Operations</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-950">
          {overview.selectedCampaignName} - Chapter Execution
        </h3>
        <div className="mt-4 grid gap-3 xl:grid-cols-5">
          {overview.riskCards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              aria-current={card.isActive ? "page" : undefined}
              className={[
                "block rounded-[1.2rem] border p-4 transition",
                card.isActive
                  ? "border-[#2563eb] bg-[#eef5ff]"
                  : "border-slate-200 bg-slate-50 hover:border-[#bfdbfe] hover:bg-white",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {card.title}
                </p>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-slate-600">
                  {card.isActive ? "Viewing lane" : "Open lane"}
                </span>
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{card.count}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {card.chapterLabels.length > 0 ? card.chapterLabels.join(", ") : "No chapters flagged."}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-5">
        <p className="app-eyebrow app-eyebrow-slate">Execution table</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-950">
          Review chapter execution without leaving the coach lane
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          What should the coach move first this week?
        </p>
        <div className="mt-4 grid gap-3">
          {overview.executionRows.map((row) => (
            <article
              key={row.chapterName}
              className={[
                "rounded-[1.4rem] border p-4",
                row.selected
                  ? "border-[#bfdbfe] bg-[#f8fbff]"
                  : "border-slate-200 bg-slate-50",
              ].join(" ")}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-semibold text-slate-950">{row.chapterName}</h4>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {readableCoachDecision(row.decision)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {row.country} · {row.coachName}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <MiniStat label="Leads" value={`${row.leadsCount}`} />
                    <MiniStat label="Follow-up" value={`${row.followUpsCompleted}/${row.followUpsTarget}`} />
                    <MiniStat label="Evidence" value={`${row.evidenceReviewedCount}`} />
                    <MiniStat label="KPI" value={row.kpiTargetStatus === "hit" ? "Hit" : "Missed"} />
                  </div>
                </div>
                {row.href ? (
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <Link
                      href={row.href}
                      className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#2563eb] transition hover:border-[#93c5fd] hover:bg-[#eff6ff]"
                    >
                      Return to chapter detail
                    </Link>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MiniToken({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/78">
      {label}
    </span>
  );
}

function parseCoachDecisionResultCode(
  value: string | undefined,
): CoachDecisionResultCode | undefined {
  const allowedCodes = new Set(
    getCoachDecisionResultStates().map((state) => state.code),
  );

  return value && allowedCodes.has(value as CoachDecisionResultCode)
    ? (value as CoachDecisionResultCode)
    : undefined;
}

function parseCoachSurfaceView(search: CoachSearchParams): CoachSurfaceView {
  if (search.view === "support_notes") {
    return "support_notes";
  }

  if (search.view === "campaigns") {
    return "campaigns";
  }

  if (search.view === "chapter_detail") {
    return "chapter_detail";
  }

  if (
    search.view &&
    search.view !== "chapters" &&
    search.view !== "overview"
  ) {
    return "staff_fallback";
  }

  return "overview";
}

function rewriteCoachSurfaceHref(
  href: string,
  view: Exclude<CoachSurfaceView, "staff_fallback">,
) {
  const url = new URL(href, "https://mymedlife.local");

  url.pathname = "/coach";

  if (view === "overview") {
    url.searchParams.delete("view");
  } else {
    url.searchParams.set("view", view);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function buildCoachViewHref(
  search: CoachSearchParams,
  view: Exclude<CoachSurfaceView, "staff_fallback" | "overview">,
  hash?: string,
) {
  const url = new URL("/coach", "https://mymedlife.local");

  if (search.bestPractice) {
    url.searchParams.set("bestPractice", search.bestPractice);
  }
  if (search.campaign) {
    url.searchParams.set("campaign", search.campaign);
  }
  if (search.chapter) {
    url.searchParams.set("chapter", search.chapter);
  }
  if (search.coach) {
    url.searchParams.set("coach", search.coach);
  }
  if (search.coachMode) {
    url.searchParams.set("coachMode", search.coachMode);
  }
  if (search.country) {
    url.searchParams.set("country", search.country);
  }
  if (search.decision) {
    url.searchParams.set("decision", search.decision);
  }
  if (search.portfolioCampaign) {
    url.searchParams.set("portfolioCampaign", search.portfolioCampaign);
  }
  if (search.proof) {
    url.searchParams.set("proof", search.proof);
  }
  if (search.proofQueue) {
    url.searchParams.set("proofQueue", search.proofQueue);
  }
  if (search.proofType) {
    url.searchParams.set("proofType", search.proofType);
  }
  if (search.feedAudience) {
    url.searchParams.set("feedAudience", search.feedAudience);
  }
  if (search.feedDraft) {
    url.searchParams.set("feedDraft", search.feedDraft);
  }
  if (search.feedPost) {
    url.searchParams.set("feedPost", search.feedPost);
  }
  if (search.hubspotChapter) {
    url.searchParams.set("hubspotChapter", search.hubspotChapter);
  }
  if (search.practiceCampaign) {
    url.searchParams.set("practiceCampaign", search.practiceCampaign);
  }
  if (search.practiceCountry) {
    url.searchParams.set("practiceCountry", search.practiceCountry);
  }
  if (search.feedRole) {
    url.searchParams.set("feedRole", search.feedRole);
  }
  if (search.q) {
    url.searchParams.set("q", search.q);
  }
  if (search.risk) {
    url.searchParams.set("risk", search.risk);
  }
  if (search.source) {
    url.searchParams.set("source", search.source);
  }

  url.searchParams.set("view", view);

  if (hash) {
    url.hash = hash;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function hasCoachPortfolioDrillIn(search: CoachSearchParams) {
  return Boolean(
    search.chapter ||
      search.risk ||
      search.q ||
      search.campaign ||
      search.country ||
      search.coach ||
      search.decision ||
      search.portfolioCampaign,
  );
}

function getSelectedCoachPortfolioChapter(
  rows: readonly CoachPortfolioChapter[],
  search: CoachSearchParams,
) {
  if (rows.length === 0) {
    return null;
  }

  if (search.chapter) {
    return rows.find((row) => row.chapterId === search.chapter) ?? rows[0];
  }

  if (search.risk === "high" || search.risk === "medium" || search.risk === "low") {
    return rows.find((row) => row.risk === search.risk) ?? rows[0];
  }

  if (search.view === "chapter_detail") {
    return rows[0];
  }

  return null;
}

function getCoachChapterDetailSourceContext(
  search: CoachSearchParams,
  selectedChapter: CoachPortfolioChapter | null,
) {
  if (!selectedChapter || !search.feedPost) {
    return null;
  }

  const actionHref = new URL("/coach", "https://mymedlife.local");
  actionHref.searchParams.set("view", "feed_analytics");
  actionHref.searchParams.set("campaign", search.campaign ?? "rush-month");
  if (search.feedDraft) {
    actionHref.searchParams.set("feedDraft", search.feedDraft);
  }
  actionHref.searchParams.set("feedPost", search.feedPost);
  if (search.feedRole) {
    actionHref.searchParams.set("feedRole", search.feedRole);
  }
  if (search.feedAudience) {
    actionHref.searchParams.set("feedAudience", search.feedAudience);
  }

  return {
    eyebrow: "Feed analytics source",
    title: "Opened from a feed-engagement review",
    summary: `${selectedChapter.chapterName} was opened while reviewing content performance. Keep the chapter support move attached to the same audience and post context that surfaced this chapter.`,
    actionLabel: "Return to feed analytics",
    actionHref: `${actionHref.pathname}${actionHref.search}`,
  };
}

function getCoachChapterFocusItems(selectedChapter: CoachPortfolioChapter) {
  return [
    selectedChapter.nextStep,
    `${selectedChapter.openFollowUps} follow-ups still need coach attention before the next push.`,
    `${selectedChapter.proofPending} proof item(s) remain in a review-safe queue.`,
  ];
}

function getCoachChapterSignals(selectedChapter: CoachPortfolioChapter) {
  return [
    {
      label: "Assignments in motion",
      status: `${selectedChapter.activeCount} active`,
      detail: `${selectedChapter.activeCount} active assignment(s) still need movement or review inside this chapter lane.`,
    },
    {
      label: "Follow-up posture",
      status: `${selectedChapter.openFollowUps} pending`,
      detail: `${selectedChapter.openFollowUps} visible follow-up item(s) are still open for coach oversight.`,
    },
    {
      label: "Proof queue",
      status: `${selectedChapter.proofPending} waiting`,
      detail: `${selectedChapter.proofPending} proof item(s) still need a cleaner chapter follow-through story before the coach can relax support posture.`,
    },
  ];
}

function readableCoachDecision(decision: CoachPortfolioChapter["decision"]) {
  switch (decision) {
    case "advance":
      return "Advance";
    case "hold":
      return "Hold";
    case "intervene":
      return "Intervene";
  }
}

function buildCoachChaptersHref(search: CoachSearchParams) {
  const url = new URL("/coach", "https://mymedlife.local");

  if (search.campaign) {
    url.searchParams.set("campaign", search.campaign);
  }
  if (search.coachMode) {
    url.searchParams.set("coachMode", search.coachMode);
  }
  if (search.country) {
    url.searchParams.set("country", search.country);
  }
  if (search.q) {
    url.searchParams.set("q", search.q);
  }
  if (search.risk) {
    url.searchParams.set("risk", search.risk);
  }
  if (search.source) {
    url.searchParams.set("source", search.source);
  }

  url.searchParams.set("view", "chapters");

  return `${url.pathname}${url.search}`;
}
