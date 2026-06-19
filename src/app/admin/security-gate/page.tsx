import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { Phase2SecurityReleaseGatePanel } from "@/components/phase-2-security-release-gate-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getPhase2SecurityReleaseGatePacket } from "@/services/phase-2-security-release-gate";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminSecurityGate");
export const dynamic = "force-dynamic";

export default async function AdminSecurityGatePage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {!canReadFoundation(actor.audience) ? (
        <RestrictedState
          title="Security release gate is hidden for this role."
          message="This foundation route is only for admin, DS Admin, and Super Admin review."
          nextHref="/admin/phase-2"
          nextLabel="Back to Phase 2"
        />
      ) : (
        <Phase2SecurityReleaseGatePanel
          packet={getPhase2SecurityReleaseGatePacket()}
        />
      )}
    </AppShell>
  );
}

function canReadFoundation(audience: string) {
  return audience === "admin" || audience === "ds_admin" || audience === "super_admin";
}
