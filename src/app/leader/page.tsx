import { redirect } from "next/navigation";

import { ChapterLeaderCommandCenterPanel } from "@/components/chapter-leader-command-center-panel";
import { FigmaLeaderCommandCenter } from "@/components/figma-leader-command-center";
import {
  buildChapterLeaderCommandCenterHref,
  type ChapterLeaderCommandCenterSource,
} from "@/services/chapter-leader-command-center";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { WorkspacePreviewBanner } from "@/components/workspace-preview-banner";
import { getChapterLeaderCommandCenter } from "@/services/chapter-leader-command-center";
import { getLandingRouteForActor } from "@/services/landing-route";
import {
  buildLoginRedirectHrefForPath,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessLeaderWorkspace, getActorSurfaceFamily } from "@/services/role-visibility";
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
  const isPreviewLeaderWorkspace = isPreviewWorkspaceAccess(actor, "leader_command_center");
  const actorSurfaceFamily = getActorSurfaceFamily(actor);
  const shouldRenderFigmaLeaderPreview =
    isPreviewLeaderWorkspace ||
    actorSurfaceFamily === "staff" ||
    actorSurfaceFamily === "ds_admin" ||
    actorSurfaceFamily === "super_admin";

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHrefForPath("/leader", resolvedSearchParams));
  }

  if (!canAccessLeaderWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const requestedView = resolvedSearchParams?.view ?? "overview";
  const canonicalHref = getLeaderLaunchLaneCanonicalHref({
    view: resolvedSearchParams?.view,
    source: resolvedSearchParams?.source,
    member: resolvedSearchParams?.member,
    committee: resolvedSearchParams?.committee,
    eventCommittee: resolvedSearchParams?.eventCommittee,
    event: resolvedSearchParams?.event,
    leaderboardMetric: resolvedSearchParams?.leaderboardMetric,
    region: resolvedSearchParams?.region,
    benchmark: resolvedSearchParams?.benchmark,
    impactStory: resolvedSearchParams?.impactStory,
    pipeline: resolvedSearchParams?.pipeline,
    q: resolvedSearchParams?.q,
    bridgeFilter: resolvedSearchParams?.bridgeFilter,
    bridgeVideo: resolvedSearchParams?.bridgeVideo,
    feedPost: resolvedSearchParams?.feedPost,
    quickAction: resolvedSearchParams?.quickAction,
  });

  if (canonicalHref) {
    redirect(canonicalHref);
  }

  const requestedSource = (() => {
    switch (resolvedSearchParams?.source) {
      case "overview":
      case "member_home":
      case "bridge_videos":
      case "feed_analytics":
      case "impact":
      case "leaderboard":
        return resolvedSearchParams.source as ChapterLeaderCommandCenterSource;
      default:
        return null;
    }
  })();

  if (requestedView === "attendance") {
    redirect(
      buildChapterLeaderCommandCenterHref("events", {
        source: requestedSource,
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
        eventId: resolvedSearchParams?.event,
        leaderboardMetric: resolvedSearchParams?.leaderboardMetric as
          | "chapter_health"
          | "events_created"
          | "active_members"
          | "attendance"
          | "evidence"
          | "bridge_videos"
          | "funds_raised"
          | "slt_participants"
          | undefined,
        leaderboardRegion: resolvedSearchParams?.region as
          | "all"
          | "current_region"
          | "united_states"
          | "canada"
          | undefined,
        bestPracticeChapterId: resolvedSearchParams?.benchmark,
        quickAction:
          resolvedSearchParams?.quickAction === "assign_action"
            ? "assign_action"
            : undefined,
      }),
    );
  }

  const shouldUseServiceShell =
    SERVICE_BACKED_LEADER_VIEWS.has(requestedView) && !shouldRenderFigmaLeaderPreview;

  if (shouldUseServiceShell) {
    const data = await getReadOnlyAppData({ actorUserId: actor.user.id });
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

    if (!commandCenter.canReadCommandCenter) {
      return (
        <>
          <WorkspaceAccountMenu actor={actor} currentWorkspace="leader_command_center" />
          {shouldRenderFigmaLeaderPreview ? (
            <WorkspacePreviewBanner workspaceLabel="the Student Command Center" />
          ) : null}
          <FigmaLeaderCommandCenter initialScreen={initialScreen} />
        </>
      );
    }

    return (
      <>
        <WorkspaceAccountMenu actor={actor} currentWorkspace="leader_command_center" />
        {shouldRenderFigmaLeaderPreview ? (
          <WorkspacePreviewBanner workspaceLabel="the Student Command Center" />
        ) : null}
        <ChapterLeaderCommandCenterPanel commandCenter={commandCenter} />
      </>
    );
  }

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="leader_command_center" />
      {shouldRenderFigmaLeaderPreview ? (
        <WorkspacePreviewBanner workspaceLabel="the Student Command Center" />
      ) : null}
      <FigmaLeaderCommandCenter initialScreen={initialScreen} />
    </>
  );
}
