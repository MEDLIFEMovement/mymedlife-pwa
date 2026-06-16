import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { LeaderAssignmentVerificationPanel } from "@/components/leader-assignment-verification-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLeaderAssignmentPacket } from "@/services/leader-assignment-verification-packet";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminAssignmentWrite");
export const dynamic = "force-dynamic";

export default async function AssignmentWritePage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const packet = getLeaderAssignmentPacket(actor, data);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      {packet.canReadPacket ? (
        <LeaderAssignmentVerificationPanel packet={packet} />
      ) : (
        <RestrictedState
          title="Leader assignment activation is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. Leader assignment activation is for Admin, DS Admin, and Super Admin review contexts."
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      )}
    </AppShell>
  );
}
