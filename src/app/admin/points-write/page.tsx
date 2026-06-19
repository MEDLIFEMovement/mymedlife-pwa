import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { PointsKpiMaterializationPanel } from "@/components/points-kpi-materialization-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getPointsKpiMaterializationPacket } from "@/services/points-kpi-materialization-packet";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminPointsWrite");
export const dynamic = "force-dynamic";

export default async function PointsWritePage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const packet = getPointsKpiMaterializationPacket(actor, data);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      {packet.canReadPacket ? (
        <PointsKpiMaterializationPanel packet={packet} />
      ) : (
        <RestrictedState
          title="Points and KPI review is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. Points and KPI materialization review is for Admin, DS Admin, and Super Admin safety contexts."
          nextHref="/rush-month/leaderboard"
          nextLabel="Back to leaderboard"
        />
      )}
    </AppShell>
  );
}
