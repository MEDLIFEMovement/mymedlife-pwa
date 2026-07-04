import { FigmaMemberCampaignsPage } from "@/components/figma-member-campaigns-page";
import { RestrictedState } from "@/components/restricted-state";
import { getCampaignStarterShellReadiness } from "@/services/campaign-starter-shell-readiness";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getCampaignReadinessSummary,
  getVisibleCampaignShellsForActor,
} from "@/services/campaign-ops-service";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("campaigns");
export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const actor = await getLocalActorContext();
  const visibleCampaigns = getVisibleCampaignShellsForActor(actor);
  const summary = getCampaignReadinessSummary();
  const starterShellReadiness = getCampaignStarterShellReadiness(actor);

  return (
    <>
      {visibleCampaigns.length > 0 ? (
        <FigmaMemberCampaignsPage
          campaigns={visibleCampaigns}
          readiness={starterShellReadiness}
          summary={summary}
        />
      ) : (
        <main className="min-h-screen bg-[#f7f4ee] px-4 py-12">
          <div className="mx-auto max-w-[430px]">
            <RestrictedState
              title="Campaign truth is hidden for DS Admin."
              message="DS Admin can inspect disabled integration posture on the admin page, but does not own campaign status, student actions, proof, points, or KPIs."
              nextHref="/admin"
              nextLabel="Open integration posture"
            />
          </div>
        </main>
      )}
    </>
  );
}
