import Link from "next/link";
import { redirect } from "next/navigation";

import { CampaignCard } from "@/components/campaign-card";
import { CampaignStarterShellReadinessPanel } from "@/components/campaign-starter-shell-readiness-panel";
import { FigmaMemberCampaignsPage } from "@/components/figma-member-campaigns-page";
import { getAppOwnedCampaignReadback } from "@/services/campaign-readback";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getCampaignReadinessSummary, getVisibleCampaignShellsForActor } from "@/services/campaign-ops-service";
import { getCampaignStarterShellReadiness } from "@/services/campaign-starter-shell-readiness";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
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

  if (surfaceFamily === "ds_admin") {
    redirect(getLandingRouteForActor(actor));
  }

  const data = await getReadOnlyAppData(
    surfaceFamily === "member" || surfaceFamily === "leader"
      ? { actorUserId: actor.user.id }
      : {},
  );
  const readback =
    data.source.mode === "supabase"
      ? getAppOwnedCampaignReadback(data)
      : null;
  const campaigns = getVisibleCampaignShellsForActor(
    actor,
    readback?.campaigns,
  );
  const summary = readback?.summary ?? getCampaignReadinessSummary();
  const readiness = getCampaignStarterShellReadiness(
    actor,
    readback ? campaigns : undefined,
  );

  if (surfaceFamily === "member") {
    return (
      <FigmaMemberCampaignsPage
        campaigns={campaigns}
        summary={summary}
        readiness={readiness}
        readback={readback}
      />
    );
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
          {campaigns.length > 0 ? (
            campaigns.map((campaign) => (
              <CampaignCard key={campaign.slug} campaign={campaign} />
            ))
          ) : (
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 lg:col-span-2">
              <h2 className="text-lg font-semibold text-white">
                No app-owned campaigns are visible
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/64">
                {data.source.message} No TEST campaign shell has been
                substituted for this hosted account.
              </p>
            </section>
          )}
        </div>

        <div className="mt-8">
          <CampaignStarterShellReadinessPanel readiness={readiness} />
        </div>
      </div>
    </main>
  );
}
