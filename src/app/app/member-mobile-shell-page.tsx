import { redirect } from "next/navigation";

import {
  FigmaMemberMobileHome,
  type MemberMobileIdentityContext,
  type MemberMobileLaunchScreen,
} from "@/components/figma-member-mobile-home";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { WorkspacePreviewBanner } from "@/components/workspace-preview-banner";
import { MemberOperationalDataUnavailable } from "@/components/member-operational-data-unavailable";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { buildMemberStoriesReadModel } from "@/services/member-stories-read-model";
import {
  createMemberStoryReactionClient,
  getMemberStoryReactionConfig,
  getMemberStoryReactionReadbacks,
} from "@/services/member-story-reactions";
import {
  buildMemberIdentityContext,
  ensureVisibleTestLabel,
} from "@/services/member-mobile-identity-context";
import { buildMemberMobileEventContext } from "@/services/member-mobile-event-context";
import {
  getLaunchLaneMemberPointsReadback,
  type LaunchLaneMemberPointsReadback,
} from "@/services/launch-lane-points-readback";
import { getMvpMemberHome } from "@/services/mvp-event-tracking-workspace";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canAccessMemberWorkspace, hasTravelerAccess } from "@/services/role-visibility";
import { getSltTripPrepWorkspace } from "@/services/slt-trip-prep-workspace";
import { isPreviewWorkspaceAccess } from "@/services/workspace-access";

export async function renderMemberMobileShellPage({
  initialScreen,
  redirectPath,
  initialStoriesFilter,
  initialStoryId,
  initialStoryReactionResult,
  initialEventsCampaign,
  pointsSource,
  pointsReturnEventId,
  pointsReturnCampaign,
  pointsStoryFilter,
  pointsStoryId,
  eventsSource,
  eventsProfileSource,
  eventsStoryFilter,
  repaintKey,
}: {
  initialScreen?: MemberMobileLaunchScreen;
  redirectPath: string;
  initialStoriesFilter?: string | null;
  initialStoryId?: string | null;
  initialStoryReactionResult?: string | null;
  initialEventsCampaign?: string | null;
  pointsSource?: "events" | "home" | "profile" | "points" | "stories";
  pointsReturnEventId?: string | null;
  pointsReturnCampaign?: string | null;
  pointsStoryFilter?: string | null;
  pointsStoryId?: string | null;
  eventsSource?: "events" | "home" | "profile" | "points" | "stories";
  eventsProfileSource?: "points" | null;
  eventsStoryFilter?: string | null;
  repaintKey?: string;
}) {
  const actor = await getLocalActorContext();
  const landingRoute = getLandingRouteForActor(actor);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(redirectPath));
  }

  if (!canAccessMemberWorkspace(actor)) {
    redirect(landingRoute);
  }

  const data = await getReadOnlyAppData({ actorUserId: actor.user.id });
  if (data.source.status === "chapter_access_missing") {
    return <MemberOperationalDataUnavailable actor={actor} message={data.source.message} />;
  }

  const sltPrepWorkspace = hasTravelerAccess(actor) ? getSltTripPrepWorkspace(actor) : null;
  const studentHome = getMvpMemberHome(actor, data);
  const recognition = getMemberRecognitionSummary(actor, data);
  const pointsReadback = pointsReturnEventId
    ? getLaunchLaneMemberPointsReadback(actor, data, pointsReturnEventId)
    : null;
  const memberContext = applyEventLoopPointsReadback(
    buildMemberIdentityContext(actor, studentHome, recognition, data.chapter.campus),
    pointsReadback,
  );
  const memberEventContext = data.source.mode === "supabase"
    ? buildMemberMobileEventContext(data)
    : null;
  const storyReactionConfig = getMemberStoryReactionConfig();
  const storyReactionClient = data.source.mode === "supabase"
    ? createMemberStoryReactionClient()
    : null;
  const storyReactionReadbacks = storyReactionClient
    ? await getMemberStoryReactionReadbacks(storyReactionClient, actor.user.id)
    : [];
  const memberStories = data.source.mode === "supabase"
    ? buildMemberStoriesReadModel({
        evidenceRows: data.storyEvidenceRows,
        chapters: data.chapterRows,
        chapterEvents: data.allChapterEventRows,
        profiles: data.profiles,
        accessibleEventIds: data.chapterEventRows.map((row) => row.id),
        reactionReadbacks: storyReactionReadbacks,
      })
    : undefined;
  const sltPrepEntry =
    sltPrepWorkspace?.canReadWorkspace && sltPrepWorkspace.traveler
      ? {
          href: "/app/slt-prep?source=home",
          tripLabel: ensureVisibleTestLabel(sltPrepWorkspace.traveler.tripLabel),
          cityLabel: ensureVisibleTestLabel(sltPrepWorkspace.traveler.cityLabel),
          countdownLabel: sltPrepWorkspace.countdownLabel,
          readinessLabel: sltPrepWorkspace.readiness.label,
          nextStepLabel: ensureVisibleTestLabel(sltPrepWorkspace.nextStep.label),
        }
      : null;

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="student_app" />
      {isPreviewWorkspaceAccess(actor, "student_app") ? (
        <WorkspacePreviewBanner workspaceLabel="the General Student App" />
      ) : null}
      <FigmaMemberMobileHome
        initialScreen={initialScreen}
        sltPrepEntry={sltPrepEntry}
        initialStoriesFilter={initialStoriesFilter}
        initialStoryId={initialStoryId}
        initialStoryReactionResult={initialStoryReactionResult}
        memberStoryReactionsEnabled={storyReactionConfig.enabled}
        initialEventsCampaign={initialEventsCampaign}
        pointsSource={pointsSource}
        pointsReturnEventId={pointsReturnEventId}
        pointsReturnCampaign={pointsReturnCampaign}
        pointsStoryFilter={pointsStoryFilter}
        pointsStoryId={pointsStoryId}
        pointsReadback={pointsReadback}
        eventsSource={eventsSource}
        eventsProfileSource={eventsProfileSource}
        eventsStoryFilter={eventsStoryFilter}
        memberContext={memberContext}
        memberEvents={memberEventContext?.events}
        memberCampaign={memberEventContext?.campaign}
        memberStories={memberStories}
        repaintKey={repaintKey}
      />
    </>
  );
}

function applyEventLoopPointsReadback(
  memberContext: MemberMobileIdentityContext,
  pointsReadback: LaunchLaneMemberPointsReadback | null,
): MemberMobileIdentityContext {
  if (!pointsReadback || pointsReadback.memberPointsAwarded <= 0) {
    return memberContext;
  }

  const leaderboardRows = memberContext.leaderboardRows.map((row) =>
    row.me ? { ...row, pts: pointsReadback.memberPointsAwarded } : row,
  );

  return {
    ...memberContext,
    pointsTotal: pointsReadback.memberPointsAwarded,
    pointsWeeklyLabel: `+${pointsReadback.memberPointsAwarded}`,
    completedActions: Math.max(memberContext.completedActions, 1),
    leaderboardRows: leaderboardRows.some((row) => row.me)
      ? leaderboardRows
      : [
          ...leaderboardRows,
          {
            rank: leaderboardRows.length + 1,
            name: memberContext.displayName,
            role: "General Member",
            pts: pointsReadback.memberPointsAwarded,
            me: true,
          },
        ],
  };
}
