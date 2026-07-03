import { redirect } from "next/navigation";
import { StudentAppShell } from "@/components/student-app-shell";
import { MemberPointsRecognitionPanel } from "@/components/member-points-recognition-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLaunchLaneMemberPointsHref } from "@/services/events-points-launch-lane";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getLaunchLaneMemberPointsReadback } from "@/services/launch-lane-points-readback";
import { type MemberActionRouteSource } from "@/services/member-action-route-href";
import { getMemberLeaderboardWorkspace } from "@/services/member-leaderboard-workspace";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { getRushMonthLeaderboardRouteRedirectHref } from "@/services/owned-route-redirect";
import { getReadOnlyAppData } from "@/services/read-only-app-data";

export type RushMonthLeaderboardPageProps = {
  searchParams?: Promise<{
    campaign?: string;
    source?: string;
  }>;
};

type RushMonthLeaderboardRenderProps = RushMonthLeaderboardPageProps & {
  routeFamily?: "app" | "legacy";
};

export async function renderRushMonthLeaderboardPage({
  searchParams,
  routeFamily = "legacy",
}: RushMonthLeaderboardRenderProps) {
  const actor = await getLocalActorContext();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(getLaunchLaneMemberPointsHref()));
  }

  const redirectHref = getRushMonthLeaderboardRouteRedirectHref(actor, {
    source: resolvedSearchParams?.source,
    routeFamily,
  });

  if (redirectHref) {
    redirect(redirectHref);
  }

  const data = await getReadOnlyAppData();
  const memberPointsSource = parseMemberPointsSource(resolvedSearchParams?.source);
  const recognition = getMemberRecognitionSummary(actor, data);
  const workspace = getMemberLeaderboardWorkspace(actor, recognition);
  const liveReadback = getLaunchLaneMemberPointsReadback(actor, data);

  return (
    <StudentAppShell
      actor={actor}
      hideTopHeader
      showMobileQuickItemHelpers={false}
      showDebugTools={false}
    >
      {!workspace.canReadLeaderboard ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.ctaLabel}
        />
      ) : (
        <MemberPointsRecognitionPanel
          recognition={recognition}
          chapterName={data.chapter.name}
          source={memberPointsSource}
          liveReadback={liveReadback}
        />
      )}
    </StudentAppShell>
  );
}

function parseMemberPointsSource(value: string | undefined): MemberActionRouteSource | null {
  switch (value) {
    case "home":
    case "events":
    case "points":
    case "profile":
      return value;
    case "campaigns":
      return null;
    default:
      return null;
  }
}
