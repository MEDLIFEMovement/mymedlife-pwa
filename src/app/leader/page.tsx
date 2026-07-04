import { redirect } from "next/navigation";

import { FigmaLeaderCommandCenter } from "@/components/figma-leader-command-center";
import { getChapterLeaderCommandCenter } from "@/services/chapter-leader-command-center";
import { getLandingRouteForActor } from "@/services/landing-route";
import { getLaunchLaneLeaderEventReadback } from "@/services/launch-lane-points-readback";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canAccessLeaderWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("leader");
export const dynamic = "force-dynamic";

type LeaderPageProps = {
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

export default async function LeaderPage({ searchParams }: LeaderPageProps) {
  const emptySearchParams: Awaited<NonNullable<LeaderPageProps["searchParams"]>> = {};
  const [actor, search, data] = await Promise.all([
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
    getReadOnlyAppData(),
  ]);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/leader?view=overview"));
  }

  if (!canAccessLeaderWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const commandCenter = getChapterLeaderCommandCenter(actor, data, {
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
    bridgeFilter: search.bridge ?? search.bridgeFilter,
    bridgeVideoId: search.bridgeVideo,
    feedPostId: search.feedPost,
    quickAction: search.quickAction,
  });

  const calendarLabel =
    data.chapterLumaCalendarRows.find(
      (row) => row.chapter_id === data.chapter.id && row.environment === "staging",
    )?.calendar_label ?? "Chapter calendar pending";

  return (
    <FigmaLeaderCommandCenter
      calendarLabel={calendarLabel}
      commandCenter={commandCenter}
      eventReadback={getLaunchLaneLeaderEventReadback(data)}
    />
  );
}
