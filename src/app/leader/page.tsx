import { redirect } from "next/navigation";

import { ChapterLeaderCommandCenterPanel } from "@/components/chapter-leader-command-center-panel";
import { FigmaLeaderCommandCenter } from "@/components/figma-leader-command-center";
import { buildChapterLeaderCommandCenterHref } from "@/services/chapter-leader-command-center";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { WorkspacePreviewBanner } from "@/components/workspace-preview-banner";
import { getChapterLeaderCommandCenter } from "@/services/chapter-leader-command-center";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessLeaderWorkspace } from "@/services/role-visibility";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { isPreviewWorkspaceAccess } from "@/services/workspace-access";
import { getLeaderLaunchLaneCanonicalHref } from "@/services/leader-launch-lane";
import { resolveLeaderCommandCenterScreen } from "@/services/leader-command-center-routing";

export const metadata = getStaticRouteMetadata("leader");
export const dynamic = "force-dynamic";

type LeaderPageProps = {
  searchParams?: Promise<{
    view?: string;
    source?: string;
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
    bridgeFilter?: string;
    bridgeVideo?: string;
    feedPost?: string;
    quickAction?: string;
  }>;
};

const SERVICE_BACKED_LEADER_VIEWS = new Set([
  "overview",
  "leaderboard",
  "leaders",
  "members",
  "member_profile",
  "committees",
  "events",
  "impact",
  "bridge_videos",
  "succession",
  "values",
  "training",
  "feed_analytics",
]);

export default async function LeaderPage({ searchParams }: LeaderPageProps) {
  const actor = await getLocalActorContext();
  const resolvedSearchParams = await searchParams;
  const initialScreen = resolveLeaderCommandCenterScreen(resolvedSearchParams?.view);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/leader?view=overview"));
  }

  if (!canAccessLeaderWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const canonicalHref = getLeaderLaunchLaneCanonicalHref({
    view: resolvedSearchParams?.view,
  });

  if (canonicalHref) {
    redirect(canonicalHref);
  }

  const requestedView = resolvedSearchParams?.view ?? "overview";

  if (requestedView === "create_event") {
    redirect(
      buildChapterLeaderCommandCenterHref("events", {
        source: resolvedSearchParams?.source,
        memberId: resolvedSearchParams?.member,
        eventCommitteeFilter: resolvedSearchParams?.eventCommittee as
          | "all"
          | "events"
          | "slt_promotion"
          | "recruitment"
          | "fundraising"
          | "service"
          | "comms"
          | undefined,
        pipelineFilter: resolvedSearchParams?.pipeline as
          | "all"
          | "e_board"
          | "chair"
          | "chair_candidate"
          | "active_contributor"
          | "general_member"
          | "follow_up"
          | undefined,
        searchQuery: resolvedSearchParams?.q,
        quickAction: "create_event",
      }),
    );
  }

  const shouldUseServiceShell = SERVICE_BACKED_LEADER_VIEWS.has(requestedView);

  if (shouldUseServiceShell) {
    const data = await getReadOnlyAppData();
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      source: resolvedSearchParams?.source,
      view: requestedView,
      memberId: resolvedSearchParams?.member,
      committeeId: resolvedSearchParams?.committee,
      eventCommittee: resolvedSearchParams?.eventCommittee,
      eventId: resolvedSearchParams?.event,
      leaderboardMetric: resolvedSearchParams?.leaderboardMetric,
      leaderboardRegion: resolvedSearchParams?.region,
      bestPracticeChapterId: resolvedSearchParams?.benchmark,
      impactStory: resolvedSearchParams?.impactStory,
      pipeline: resolvedSearchParams?.pipeline,
      search: resolvedSearchParams?.q,
      bridgeFilter: resolvedSearchParams?.bridgeFilter,
      bridgeVideoId: resolvedSearchParams?.bridgeVideo,
      feedPostId: resolvedSearchParams?.feedPost,
      quickAction: resolvedSearchParams?.quickAction,
    });

    return (
      <>
        <WorkspaceAccountMenu actor={actor} currentWorkspace="leader_command_center" />
        {isPreviewWorkspaceAccess(actor, "leader_command_center") ? (
          <WorkspacePreviewBanner workspaceLabel="the Student Command Center" />
        ) : null}
        <ChapterLeaderCommandCenterPanel commandCenter={commandCenter} />
      </>
    );
  }

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="leader_command_center" />
      {isPreviewWorkspaceAccess(actor, "leader_command_center") ? (
        <WorkspacePreviewBanner workspaceLabel="the Student Command Center" />
      ) : null}
      <FigmaLeaderCommandCenter initialScreen={initialScreen} />
    </>
  );
}
