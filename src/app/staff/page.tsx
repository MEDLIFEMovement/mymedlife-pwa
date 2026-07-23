import { redirect } from "next/navigation";

import { FigmaStaffCommandCenter } from "@/components/figma-staff-command-center";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { getLandingRouteForActor } from "@/services/landing-route";
import {
  buildLoginRedirectHrefForPath,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getLaunchLaneOrgLeaderboardRows,
  getLaunchLaneOrgPointsReadback,
  getLaunchLaneStaffChapterReadback,
  getLaunchLaneStaffEventReadback,
} from "@/services/launch-lane-points-readback";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canAccessAdminWorkspace, canAccessStaffWorkspace } from "@/services/role-visibility";
import { getStaffLaunchLaneCanonicalHref } from "@/services/staff-launch-lane";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("staff");
export const dynamic = "force-dynamic";

type StaffPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const actor = await getLocalActorContext();
  const resolvedSearchParams = await searchParams;

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHrefForPath("/staff", resolvedSearchParams));
  }

  if (!canReadStaffWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const requestedView = resolvedSearchParams?.view;
  const canOpenEmbeddedAdmin =
    requestedView === "admin" && canAccessAdminWorkspace(actor);
  const canonicalHref = canOpenEmbeddedAdmin
    ? null
    : getStaffLaunchLaneCanonicalHref({
        view: requestedView,
        chapter: resolvedSearchParams?.chapter,
        risk: resolvedSearchParams?.risk,
        source: resolvedSearchParams?.source,
        campaign: resolvedSearchParams?.campaign,
        event: resolvedSearchParams?.event,
      });

  if (canonicalHref) {
    redirect(canonicalHref);
  }

  const shouldLoadLiveEventReadback =
    requestedView === "events" || requestedView === "leaderboard";
  const liveEventReadback = shouldLoadLiveEventReadback
      ? await getReadOnlyAppData({ actorUserId: actor.user.id }).then((data) => ({
        selectedEventId: resolvedSearchParams?.event ?? null,
        selectedEvent: getLaunchLaneStaffEventReadback(
          data,
          resolvedSearchParams?.event,
          { testPreview: process.env.MYMEDLIFE_AUTH_MODE !== "production_supabase" },
        ),
        chapters: getLaunchLaneStaffChapterReadback(data),
        organization: getLaunchLaneOrgPointsReadback(data),
        leaderboard: getLaunchLaneOrgLeaderboardRows(data),
      }))
    : null;

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="staff_command_center" />
      <FigmaStaffCommandCenter
        canAccessAdminPanel={canAccessAdminWorkspace(actor)}
        initialView={resolvedSearchParams?.view}
        initialCampaign={resolvedSearchParams?.campaign}
        liveEventReadback={liveEventReadback}
        initialRouteParams={{
          view: resolvedSearchParams?.view,
          campaign: resolvedSearchParams?.campaign,
          chapter: resolvedSearchParams?.chapter,
          ugcCard: resolvedSearchParams?.ugcCard,
          adminView: resolvedSearchParams?.adminView,
          returnView: resolvedSearchParams?.returnView,
          chapterContext: resolvedSearchParams?.chapterContext,
          chapterSchool: resolvedSearchParams?.chapterSchool,
          chapterRegionName: resolvedSearchParams?.chapterRegionName,
          chapterCoachName: resolvedSearchParams?.chapterCoachName,
          chapterMembers: resolvedSearchParams?.chapterMembers,
          chapterEvents: resolvedSearchParams?.chapterEvents,
          chapterRsvps: resolvedSearchParams?.chapterRsvps,
          chapterAttendance: resolvedSearchParams?.chapterAttendance,
          chapterPoints: resolvedSearchParams?.chapterPoints,
          chapterPointsWeek: resolvedSearchParams?.chapterPointsWeek,
          proofStatus: resolvedSearchParams?.proofStatus,
          proofPlatform: resolvedSearchParams?.proofPlatform,
          chapterSearch: resolvedSearchParams?.chapterSearch,
          chapterRegion: resolvedSearchParams?.chapterRegion,
          chapterCoach: resolvedSearchParams?.chapterCoach,
          chapterType: resolvedSearchParams?.chapterType,
          chapterSort: resolvedSearchParams?.chapterSort,
        }}
      />
    </>
  );
}

function canReadStaffWorkspace(actor: Awaited<ReturnType<typeof getLocalActorContext>>) {
  return canAccessStaffWorkspace(actor);
}
