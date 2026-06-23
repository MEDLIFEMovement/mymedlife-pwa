import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
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
import { getReadOnlyAppData } from "@/services/read-only-app-data";
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
  const [data, actor, search] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
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

  if (!leaderCommandCenter.canReadCommandCenter && canReadChapterData(actor)) {
    redirect(landingRoute);
  }

  return (
    <AppShell
      actor={actor}
      hideTopHeader={leaderCommandCenter.canReadCommandCenter}
      showDebugTools={false}
    >
      {leaderCommandCenter.canReadCommandCenter ? (
        <ChapterLeaderCommandCenterPanel commandCenter={leaderCommandCenter} />
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

          <section className="rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.3)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
              Chapter snapshot
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{data.chapter.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
              {data.chapter.campus} in the {data.chapter.region} region. Coach:
              {" "}
              {data.chapter.coachName}. This chapter snapshot keeps the current
              campaign, member progress, and committee context visible for{" "}
              {getActorSurfaceLabel(actor).toLowerCase()}.
            </p>
          </section>

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
              note="Points currently visible in this chapter snapshot"
            />
          </section>

          <section className="app-surface-info rounded-[2rem] p-5">
            <h2 className="text-2xl font-semibold text-slate-950">Start here</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Rush Month is active. Members see their own next actions,
              leaders see team follow-up, coaches read readiness, and HQ staff
              keep support context connected to the chapter.
            </p>
            <Link
              href="/rush-month"
              className="mt-4 inline-flex rounded-full bg-[#f7d05e] px-4 py-2 text-sm font-semibold text-[#08224c]"
            >
              Open Rush Month
            </Link>
          </section>

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
              <Link
                key={item.href}
                href={item.href}
                className="app-surface rounded-3xl p-4 transition hover:border-[#f7d05e]/35 hover:bg-[#fffdf6]"
              >
                <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
              </Link>
            ))}
          </section>
        </>
      )}
    </AppShell>
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
