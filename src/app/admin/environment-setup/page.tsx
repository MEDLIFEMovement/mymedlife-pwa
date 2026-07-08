import { AppShell } from "@/components/app-shell";
import { AdminReviewRouteBanner } from "@/components/admin-review-route-banner";
import { DataSourceNotice } from "@/components/data-source-notice";
import { Phase2EnvironmentSetupPanel } from "@/components/phase-2-environment-setup-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getPhase2EnvironmentSetupPacket } from "@/services/phase-2-environment-setup";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminEnvironmentSetup");
export const dynamic = "force-dynamic";

export default async function AdminEnvironmentSetupPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {!canReadFoundation(actor.audience) ? (
        <RestrictedState
          title="Environment setup review is hidden for this role."
          message="This foundation route is only for admin, DS Admin, and Super Admin review."
          nextHref="/admin/phase-2"
          nextLabel="Back to Phase 2"
        />
      ) : (
        <>
          <AdminReviewRouteBanner
            activeLabel="Settings"
            summary="Keep DS Admin shell continuity visible while environment setup stays a source-backed, review-only handoff instead of a hidden foundation page."
          />
          <Phase2EnvironmentSetupPanel packet={getPhase2EnvironmentSetupPacket()} />
        </>
      )}
    </AppShell>
  );
}

function canReadFoundation(audience: string) {
  return audience === "admin" || audience === "ds_admin" || audience === "super_admin";
}
