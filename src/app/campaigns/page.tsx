import Link from "next/link";
import { redirect } from "next/navigation";

import { CampaignCard } from "@/components/campaign-card";
import { CampaignStarterShellReadinessPanel } from "@/components/campaign-starter-shell-readiness-panel";
import { FigmaMemberCampaignsPage } from "@/components/figma-member-campaigns-page";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getCampaignReadinessSummary, getVisibleCampaignShellsForActor } from "@/services/campaign-ops-service";
import { getCampaignStarterShellReadiness } from "@/services/campaign-starter-shell-readiness";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getCampaignsRouteRedirectHref } from "@/services/owned-route-redirect";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("campaigns");
export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/campaigns"));
  }

  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "member") {
    return (
      <FigmaMemberCampaignsPage
        campaigns={getVisibleCampaignShellsForActor(actor)}
        summary={getCampaignReadinessSummary()}
        readiness={getCampaignStarterShellReadiness(actor)}
      />
    );
  }

  if (surfaceFamily === "ds_admin") {
    redirect(getLandingRouteForActor(actor));
  }

  const campaigns = getVisibleCampaignShellsForActor(actor);
  const readiness = getCampaignStarterShellReadiness(actor);

  if (campaigns.length === 0) {
    redirect(getCampaignsRouteRedirectHref(actor) ?? getLandingRouteForActor(actor));
  }

  return (
    <main
      className="min-h-screen bg-[#08131f] px-4 py-8 text-white sm:px-6"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href={getLandingRouteForActor(actor)}
          className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/72"
        >
          Back to workspace
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
            Campaign review
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Campaign operating shells
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64">
            These campaign shells stay visible for review, planning, and route-backed handoffs.
            Live publishing, syncs, proof ingestion, invites, and points writes remain blocked.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.slug} campaign={campaign} />
          ))}
        </div>

        <div className="mt-8">
          <CampaignStarterShellReadinessPanel readiness={readiness} />
        </div>
      </div>
    </main>
  );
}
