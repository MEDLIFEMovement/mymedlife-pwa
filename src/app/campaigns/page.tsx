import { AppShell } from "@/components/app-shell";
import { CampaignCard } from "@/components/campaign-card";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getCampaignReadinessSummary,
  getVisibleCampaignShellsForActor,
} from "@/services/campaign-ops-service";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const actor = await getLocalActorContext();
  const visibleCampaigns = getVisibleCampaignShellsForActor(actor);
  const summary = getCampaignReadinessSummary();

  return (
    <AppShell actor={actor}>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Campaign operating system
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Campaigns turn SOPs into student action.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
          This library is the reusable shell behind Rush Month. Each campaign
          should define what students do, what action committees organize, what
          proof is collected, what KPIs matter, and which external systems stay
          disabled until approved.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Active"
          value={`${summary.activeCampaigns}`}
          note="Ready for the current mock loop"
        />
        <MetricCard
          label="Planned"
          value={`${summary.plannedCampaigns}`}
          note="Next operating shells to build"
        />
        <MetricCard
          label="Templates"
          value={`${summary.templateCampaigns}`}
          note="Reusable campaign models"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Mock-linked events"
          value={`${summary.linkedMockEvents}`}
          note="Represented locally only"
        />
        <MetricCard
          label="HQ proof items"
          value={`${summary.hqProofItems}`}
          note="Need sharing review"
        />
        <MetricCard
          label="Disabled integrations"
          value={`${summary.disabledIntegrationEvents}`}
          note="No live sends"
        />
      </section>

      {visibleCampaigns.length > 0 ? (
        <section className="grid gap-3 lg:grid-cols-2">
          {visibleCampaigns.map((campaign) => (
            <CampaignCard key={campaign.slug} campaign={campaign} />
          ))}
        </section>
      ) : (
        <RestrictedState
          title="Campaign truth is hidden for DS Admin."
          message="DS Admin can inspect disabled integration posture on the admin page, but does not own campaign status, student actions, proof, points, or KPIs."
          nextHref="/admin"
          nextLabel="Open integration posture"
        />
      )}
    </AppShell>
  );
}
