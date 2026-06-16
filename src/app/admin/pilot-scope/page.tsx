import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { PilotScopePlannerPanel } from "@/components/pilot-scope-planner-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getPilotScopePlanner } from "@/services/pilot-scope-planner";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminPilotScope");
export const dynamic = "force-dynamic";

export default async function PilotScopePage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const planner = getPilotScopePlanner(actor);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      {planner.canReadPlanner ? (
        <PilotScopePlannerPanel planner={planner} />
      ) : (
        <RestrictedState
          title="Pilot scope planning is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. Pilot scope planning is for HQ, DS Admin, and Super Admin review contexts."
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      )}
    </AppShell>
  );
}
