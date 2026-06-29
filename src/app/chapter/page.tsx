import { redirect } from "next/navigation";
import { LeaderAppShell } from "@/components/leader-app-shell";
import { PanelButton, SurfacePanel } from "@/components/visual-primitives";
import { ChapterLeaderCommandCenterPanel } from "@/components/chapter-leader-command-center-panel";
import { DataSourceNotice } from "@/components/data-source-notice";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { RoleNextActionPanel } from "@/components/role-next-action-panel";
import {
  getActorPrimaryRoleLabel,
  getActorSurfaceLabel,
} from "@/services/actor-role-display";
import { getChapterLeaderCommandCenter } from "@/services/chapter-leader-command-center";
import { getLandingRouteForActor } from "@/services/landing-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getLumaCalendarReadinessSnapshot } from "@/services/luma-calendar-readiness";
import { getLumaEventLoopPilotReadback } from "@/services/luma-event-loop-pilot";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStagingLumaEventLoopReadModel } from "@/services/staging-luma-event-loop";
import { getRoleNextActionBrief } from "@/services/role-next-actions";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import {
  canReadChapterData,
  getVisibleAssignmentsForActor,
} from "@/services/role-visibility";

export const metadata = getStaticRouteMetadata("chapter");
export const dynamic = "force-dynamic";

type ChapterPageProps = {
  searchParams?: Promise<{
    source?: string;
    view?: string;
    member?: string;
    committee?: string;
    eventCommittee?: string;
    event?: string;
    leaderboardMetric?: string;
    region?: string;
    benchmark?: string;
    impactStory?: string;
    pipeline?: string;
    q?: string;
    bridge?: string;
    bridgeFilter?: string;
    bridgeVideo?: string;
    feedPost?: string;
    quickAction?: string;
  }>;
};

export default async function ChapterPage({ searchParams }: ChapterPageProps) {
  const emptySearchParams: {
    source?: string;
    view?: string;
    member?: string;
    committee?: string;
    eventCommittee?: string;
    event?: string;
    leaderboardMetric?: string;
    region?: string;
    benchmark?: string;
    impactStory?: string;
    pipeline?: string;
    q?: string;
    bridge?: string;
    bridgeFilter?: string;
    bridgeVideo?: string;
    feedPost?: string;
    quickAction?: string;
  } = {};
  const [data, actor, search, lumaSnapshot] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
    getLumaCalendarReadinessSnapshot(),
  ]);
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const progress = getProgressCounts(visibleAssignments);
  const nextActionBrief = getRoleNextActionBrief(actor, data);
  const landingRoute = getLandingRouteForActor(actor);
  const leaderCommandCenter = getChapterLeaderCommandCenter(actor, data, {
    source: search.source,
    view: search.view,
    memberId: search.member,
    committeeId: search.committee,
    eventCommittee: search.eventCommittee,
    eventId: search.event,
    leaderboardMetric: search.leaderboardMetric,
    leaderboardRegion: search.region,
    bestPracticeChapterId: search.benchmark,
    impactStory: search.impactStory,
    pipeline: search.pipeline,
    search: search.q,
    bridgeFilter: search.bridgeFilter ?? search.bridge,
    bridgeVideoId: search.bridgeVideo,
    feedPostId: search.feedPost,
    quickAction: search.quickAction,
  });
  const lumaEventLoop = getLumaEventLoopPilotReadback("leader", lumaSnapshot);
  const lumaActivation = getStagingLumaEventLoopReadModel({
    mode: "staging",
    data,
  });

  if (!leaderCommandCenter.canReadCommandCenter && canReadChapterData(actor)) {
    redirect(landingRoute);
  }

  return (
    <LeaderAppShell
      actor={actor}
      showDebugTools={false}
    >
      {leaderCommandCenter.canReadCommandCenter ? (
        <ChapterLeaderCommandCenterPanel
          commandCenter={leaderCommandCenter}
          lumaEventLoop={lumaEventLoop}
          lumaActivation={lumaActivation}
        />
      ) : !canReadChapterData(actor) ? (
        <>
          <DataSourceNotice source={data.source} />
          <RestrictedState
            title="DS Admin does not own chapter truth."
            message="This local role can inspect integration and outbox posture, but it should not read member assignments, points, or chapter operating KPIs."
            nextHref="/admin"
            nextLabel="Open integration outbox"
          />
        </>
      ) : (
        <>
          <DataSourceNotice source={data.source} />
          <RoleNextActionPanel brief={nextActionBrief} />

          <SurfacePanel
            as="section"
            className="app-surface-info rounded-[2rem] p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
                  Leader command center
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">{data.chapter.name}</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {data.chapter.campus} in the {data.chapter.region} region. Coach:
                  {" "}
                  {data.chapter.coachName}. This leader snapshot keeps the current
                  campaign, member progress, and committee context visible for{" "}
                  {getActorSurfaceLabel(actor).toLowerCase()}.
                </p>
              </div>
              <div className="grid min-w-[18rem] gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[1.2rem] border border-[var(--mymedlife-border)] bg-white px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Chapter focus
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {data.campaign.name}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-[var(--mymedlife-border)] bg-white px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Leadership lane
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    Members, committees, events, and follow-up
                  </p>
                </div>
              </div>
            </div>
          </SurfacePanel>

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Current campaign" value={data.campaign.name} note={data.campaign.weekLabel} />
            <MetricCard
              label="Visible progress"
              value={`${progress.approved}/${progress.total}`}
              note={`${getActorPrimaryRoleLabel(actor)} assignment view`}
            />
            <MetricCard
              label="Visible points"
              value={`${visibleAssignments.reduce((total, assignment) => total + assignment.points, 0)}`}
              note="Points currently visible in this leader snapshot"
            />
          </section>

          <SurfacePanel tone="info">
            <h2 className="text-2xl font-semibold text-slate-950">Leader command center</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Rush Month is active. Members see their own next actions,
              leaders see team follow-up, coaches read readiness, and HQ staff
              keep support context connected to the chapter.
            </p>
            <PanelButton
              href="/rush-month"
              className="mt-4"
            >
              Open Rush Month
            </PanelButton>
          </SurfacePanel>

          <section className="grid gap-3 lg:grid-cols-3">
            {[
              {
                href: "/chapter/members",
                title: "Members and roles",
                copy: "Review roster health, join requests, and role coverage before leadership follow-up.",
              },
              {
                href: "/campaigns",
                title: "Campaigns",
                copy: "Review the operating shells that turn chapter SOPs into student action.",
              },
              {
                href: "/action-committees",
                title: "Action committees",
                copy: "See how committees organize events, assign owners, and collect feedback/proof.",
              },
              {
                href: "/proof-library",
                title: "Proof library",
                copy: "Preview how testimonials and bridge videos become belief-building assets after HQ review.",
              },
            ].map((item) => (
              <SurfacePanel
                as="article"
                key={item.href}
                tone="info"
                className="rounded-[1.75rem] transition hover:border-[var(--mymedlife-primary-button)]/35 hover:bg-[var(--background)] p-4"
              >
                <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
                <PanelButton
                  href={item.href}
                  variant="secondary"
                  className="mt-4"
                  ariaLabel={`Open ${item.title}`}
                >
                  Open
                </PanelButton>
              </SurfacePanel>
            ))}
          </section>
        </>
      )}
    </LeaderAppShell>
  );
}

function getProgressCounts(assignments: { status: string }[]) {
  const approved = assignments.filter((assignment) => assignment.status === "approved");
  const pendingReview = assignments.filter((assignment) => assignment.status === "submitted");
  const needsWork = assignments.filter(
    (assignment) =>
      assignment.status === "not_started" ||
      assignment.status === "in_progress" ||
      assignment.status === "changes_requested",
  );

  return {
    approved: approved.length,
    pendingReview: pendingReview.length,
    needsWork: needsWork.length,
    total: assignments.length,
  };
}
