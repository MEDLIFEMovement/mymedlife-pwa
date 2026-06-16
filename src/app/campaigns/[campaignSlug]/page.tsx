import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getCampaignIntegrationPosture,
  getCampaignShellBySlug,
  getEventPlansForCampaign,
  getProofLibraryItemsForCampaign,
  getVisibleCampaignShellsForActor,
} from "@/services/campaign-ops-service";

export const dynamic = "force-dynamic";

type CampaignDetailPageProps = {
  params: Promise<{
    campaignSlug: string;
  }>;
};

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { campaignSlug } = await params;
  const [actor, campaign] = await Promise.all([
    getLocalActorContext(),
    Promise.resolve(getCampaignShellBySlug(campaignSlug)),
  ]);

  if (!campaign) {
    notFound();
  }

  const visibleCampaigns = getVisibleCampaignShellsForActor(actor);
  const canReadCampaign = visibleCampaigns.some((item) => item.slug === campaign.slug);
  const eventPlans = getEventPlansForCampaign(campaign.slug);
  const proofItems = getProofLibraryItemsForCampaign(campaign.slug);
  const integrationPosture = getCampaignIntegrationPosture(campaign.slug);

  return (
    <AppShell actor={actor}>
      {!canReadCampaign ? (
        <RestrictedState
          title="This campaign shell is hidden for the selected local role."
          message="Members see the active campaign only. DS Admin sees integration posture through the admin page, not campaign truth."
          nextHref="/campaigns"
          nextLabel="Back to campaigns"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              {campaign.status} campaign shell
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{campaign.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              {campaign.summary}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {campaign.slug === "rush-month" ? (
                <Link
                  href="/rush-month"
                  className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
                >
                  Open active Rush Month loop
                </Link>
              ) : null}
              <Link
                href="/action-committees"
                className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
              >
                See action committees
              </Link>
              <Link
                href="/proof-library"
                className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
              >
                See proof library
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Action lanes"
              value={`${campaign.actionCommitteeLanes.length}`}
              note={campaign.actionCommitteeLanes.join(", ")}
            />
            <MetricCard
              label="Event plans"
              value={`${eventPlans.length}`}
              note="Mock/local only"
            />
            <MetricCard
              label="Proof items"
              value={`${proofItems.length}`}
              note="HQ sharing posture"
            />
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-2xl font-semibold text-white">Why students care</h2>
              <p className="mt-3 text-sm leading-6 text-white/68">
                {campaign.studentPromise}
              </p>
              <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-white/42">
                Operating rhythm
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/68">
                {campaign.operatingRhythm}
              </p>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-2xl font-semibold text-white">Proof and coaching</h2>
              <p className="mt-3 text-sm leading-6 text-white/68">{campaign.proofUse}</p>
              <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-white/42">
                Coach focus
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/68">{campaign.coachFocus}</p>
            </article>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-2xl font-semibold text-white">Primary KPIs</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {campaign.primaryKpis.map((kpi) => (
                <span
                  key={kpi}
                  className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-100"
                >
                  {kpi.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-2xl font-semibold text-white">Chapter event examples</h2>
            <div className="mt-4 grid gap-3">
              {eventPlans.map((eventPlan) => (
                <article key={eventPlan.id} className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/70">
                    {eventPlan.eventType.replaceAll("_", " ")} / {eventPlan.lumaStatus.replaceAll("_", " ")}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{eventPlan.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/64">
                    {eventPlan.expectedStudentAction}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/54">
                    Proof prompt: {eventPlan.proofPrompt}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
              Integration safety
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              External sends are disabled for this campaign.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/66">
              {campaign.integrationPosture} Safe to send externally:
              {" "}
              {integrationPosture.safeToSendExternally ? "yes" : "no"}.
            </p>
            <div className="mt-4 grid gap-3">
              {integrationPosture.events.slice(0, 4).map((event) => (
                <article key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{event.title}</p>
                      <p className="mt-1 font-mono text-xs text-cyan-100/70">
                        {event.eventType} / {event.destination}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/64">
                      {event.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/64">{event.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
