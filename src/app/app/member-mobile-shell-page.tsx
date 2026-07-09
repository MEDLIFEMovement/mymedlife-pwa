import { redirect } from "next/navigation";

import {
  FigmaMemberMobileHome,
  type MemberMobileLaunchScreen,
} from "@/components/figma-member-mobile-home";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { WorkspacePreviewBanner } from "@/components/workspace-preview-banner";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessMemberWorkspace, hasTravelerAccess } from "@/services/role-visibility";
import { getSltTripPrepWorkspace } from "@/services/slt-trip-prep-workspace";
import { isPreviewWorkspaceAccess } from "@/services/workspace-access";

export async function renderMemberMobileShellPage({
  initialScreen,
  redirectPath,
  initialStoriesFilter,
  initialStoryId,
  initialEventsCampaign,
  pointsSource,
  pointsReturnEventId,
  eventsSource,
}: {
  initialScreen?: MemberMobileLaunchScreen;
  redirectPath: string;
  initialStoriesFilter?: string | null;
  initialStoryId?: string | null;
  initialEventsCampaign?: string | null;
  pointsSource?: "events" | "home" | "profile" | "points";
  pointsReturnEventId?: string | null;
  eventsSource?: "events" | "home" | "profile" | "points";
}) {
  const actor = await getLocalActorContext();
  const landingRoute = getLandingRouteForActor(actor);
  const sltPrepWorkspace = hasTravelerAccess(actor) ? getSltTripPrepWorkspace(actor) : null;
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

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(redirectPath));
  }

  if (!canAccessMemberWorkspace(actor)) {
    redirect(landingRoute);
  }

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
        initialEventsCampaign={initialEventsCampaign}
        pointsSource={pointsSource}
        pointsReturnEventId={pointsReturnEventId}
        eventsSource={eventsSource}
      />
    </>
  );
}

function ensureVisibleTestLabel(value: string) {
  return /\bTEST\b/.test(value) ? value : `TEST ${value}`;
}
