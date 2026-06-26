import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { CoachDecisionVerificationPanel } from "@/components/coach-decision-verification-panel";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getCoachDecisionPacket } from "@/services/coach-decision-verification-packet";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminCoachWrite");
export const dynamic = "force-dynamic";

export default async function AdminCoachWritePage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const packet = getCoachDecisionPacket(actor, data);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="coach_write"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />
      {packet.canReadPacket ? (
        <CoachDecisionVerificationPanel packet={packet} />
      ) : (
        <RestrictedState
          title="Coach decision activation is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. Coach decision activation is for Admin, DS Admin, and Super Admin review contexts."
          nextHref="/coach"
          nextLabel="Back to Coach"
        />
      )}
    </AdminAppShell>
  );
}
