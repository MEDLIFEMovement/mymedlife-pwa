import { StudentAppShell } from "@/components/student-app-shell";
import { MemberRushMonthEventsPanel } from "@/components/member-rush-month-events-panel";
import { runLaunchLaneMemberRsvpAction } from "@/app/launch-lane/actions";
import { getLumaLivePilotGateDurable } from "@/services/luma-live-pilot";
import {
  getLaunchLaneResultNotice,
  getMemberLaunchLaneRsvpCard,
} from "@/services/luma-launch-lane-workspace";
import { getLumaPilotPersistenceReadiness } from "@/services/luma-live-pilot-persistence";
import { getLaunchLaneMemberEventsHref } from "@/services/events-points-launch-lane";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMemberLaunchLaneEventRows } from "@/services/member-launch-lane-events";
import { type MemberActionRouteSource } from "@/services/member-action-route-href";
import { getRushMonthEventsRouteRedirectHref } from "@/services/owned-route-redirect";
import { getRushMonthEventReadinessWorkspace } from "@/services/rush-month-event-readiness";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { redirect } from "next/navigation";

export type RushMonthEventsPageProps = {
  searchParams?: Promise<{
    returnTo?: string;
    source?: string;
    lumaResult?: string;
    lumaMessage?: string;
  }>;
};

type RushMonthEventsRenderProps = RushMonthEventsPageProps & {
  routeFamily?: "app" | "legacy";
};

export async function renderRushMonthEventsPage({
  searchParams,
  routeFamily = "legacy",
}: RushMonthEventsRenderProps) {
  const actor = await getLocalActorContext();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const memberEventSource = parseMemberEventSource(resolvedSearchParams?.source);

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref(getLaunchLaneMemberEventsHref()));
  }

  const redirectHref = getRushMonthEventsRouteRedirectHref(actor, {
    source: resolvedSearchParams?.source,
    routeFamily,
  });

  if (redirectHref) {
    redirect(redirectHref);
  }

  const [data, gate, readiness] = await Promise.all([
    getReadOnlyAppData(),
    getLumaLivePilotGateDurable(),
    getLumaPilotPersistenceReadiness(),
  ]);
  const workspace = getRushMonthEventReadinessWorkspace(actor);
  const liveRsvpCard = getMemberLaunchLaneRsvpCard(actor, data);
  const liveEventRows = getMemberLaunchLaneEventRows(actor, data);
  const memberEventRows =
    liveEventRows.length > 0 ? liveEventRows : workspace.rows;
  const liveRsvpEnabled = gate.rsvpWritesEnabled && readiness.ready;
  const resultNotice = getLaunchLaneResultNotice(resolvedSearchParams ?? {});

  return (
    <StudentAppShell
      actor={actor}
      hideTopHeader
      showMobileQuickItemHelpers={false}
      showDebugTools={false}
    >
      <MemberRushMonthEventsPanel
        rows={memberEventRows}
        chapterName={data.chapter.name}
        source={memberEventSource}
        liveRsvpCard={liveRsvpCard}
        liveRsvpEnabled={liveRsvpEnabled}
        resultNotice={resultNotice}
        rsvpAction={runLaunchLaneMemberRsvpAction}
      />
    </StudentAppShell>
  );
}

function parseMemberEventSource(value: string | undefined): MemberActionRouteSource | null {
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
