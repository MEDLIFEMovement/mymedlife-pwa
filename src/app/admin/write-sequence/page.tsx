import { AppShell } from "@/components/app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { WriteSequencePlannerPanel } from "@/components/write-sequence-planner-panel";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getWriteSequencePlanner } from "@/services/write-sequence-planner";

export const metadata = getStaticRouteMetadata("adminWriteSequence");
export const dynamic = "force-dynamic";

export default async function WriteSequencePage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const planner = getWriteSequencePlanner(actor, data);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav current="workflows" />
      {planner.canReadPlanner ? (
        <WriteSequencePlannerPanel planner={planner} />
      ) : (
        <RestrictedState
          title="Write sequence planning is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. Write sequence planning is for HQ, DS Admin, and Super Admin review contexts."
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      )}
    </AppShell>
  );
}
