import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { DataSourceNotice } from "@/components/data-source-notice";
import { FirstWriteActivationDrillPanel } from "@/components/first-write-activation-drill-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getFirstWriteActivationDrill } from "@/services/first-write-activation-drill";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getResolvedFeatureFlagEnv } from "@/services/runtime-feature-flags";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminFirstWrite");
export const dynamic = "force-dynamic";

export default async function FirstWritePage() {
  const [data, actor, resolvedEnv] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
    getResolvedFeatureFlagEnv(["staging_review_auth", "action_started_write"]),
  ]);
  const drill = getFirstWriteActivationDrill(actor, data, resolvedEnv);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="first_write"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />
      {drill.canReadDrill ? (
        <FirstWriteActivationDrillPanel drill={drill} />
      ) : (
        <RestrictedState
          title="First-write activation is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. First-write activation is for HQ, DS Admin, and Super Admin review contexts."
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      )}
    </AdminAppShell>
  );
}
