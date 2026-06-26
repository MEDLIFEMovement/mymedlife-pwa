import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { DataSourceNotice } from "@/components/data-source-notice";
import { HqProofDecisionVerificationPanel } from "@/components/hq-proof-decision-verification-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getHqProofDecisionPacket } from "@/services/hq-proof-decision-verification-packet";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminHqProofWrite");
export const dynamic = "force-dynamic";

export default async function HqProofWritePage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const packet = getHqProofDecisionPacket(actor, data);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="hq_proof_write"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />
      {packet.canReadPacket ? (
        <HqProofDecisionVerificationPanel packet={packet} />
      ) : (
        <RestrictedState
          title="HQ proof decision activation is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. HQ proof decision activation is for Admin, DS Admin, and Super Admin review contexts."
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      )}
    </AdminAppShell>
  );
}
