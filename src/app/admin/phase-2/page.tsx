import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { Phase2CloseoutReviewPanel } from "@/components/phase-2-closeout-review-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getPhase2CloseoutReview } from "@/services/phase-2-closeout-review";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminPhase2");
export const dynamic = "force-dynamic";

export default async function AdminPhase2Page() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const review = getPhase2CloseoutReview(actor, data);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="phase_2"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />
      {review.canReadReview ? (
        <Phase2CloseoutReviewPanel review={review} />
      ) : (
        <RestrictedState
          title="Phase 2 closeout review is hidden for this role."
          message="Students, chapter leaders, and coaches should stay on their operating routes. This review packet is for HQ, DS Admin, and Super Admin contexts."
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      )}
    </AdminAppShell>
  );
}
