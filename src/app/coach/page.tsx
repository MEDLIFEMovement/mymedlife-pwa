import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { LocalActorNotice } from "@/components/local-actor-notice";
import { MetricCard } from "@/components/metric-card";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";

export default async function CoachPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const coachPrivateRisks = data.riskFlags.filter(
    (risk) => risk.visibility === "coach_private",
  ).length;

  return (
    <AppShell>
      <DataSourceNotice source={data.source} />
      <LocalActorNotice actor={actor} />

      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Coach dashboard shell
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{data.chapter.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          Coach view summarizes action momentum, testimonial/proof readiness,
          KPI movement, and the mock advance / hold / intervene state without
          owning student permissions.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Decision"
          value={data.kpiSummary.coachDecision}
          note="Mock coach state for this week"
        />
        <MetricCard
          label="Proof pending"
          value={`${data.kpiSummary.proofPending}`}
          note="Testimonials/proof awaiting routing"
        />
        <MetricCard
          label="Points"
          value={`${data.pointsSummary.earned}`}
          note="Approved action points"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Readiness"
          value={`${data.readinessReviews.length}`}
          note="Phase gate reviews in local read model"
        />
        <MetricCard
          label="Coach-private risks"
          value={`${coachPrivateRisks}`}
          note="Visible only through coach/staff permissions later"
        />
        <MetricCard
          label="Closeouts"
          value={`${data.closeouts.length}`}
          note="Campaign learning and handoff records"
        />
      </section>

      {data.riskFlags.length === 0 ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <h2 className="text-2xl font-semibold text-white">No risk flags yet</h2>
          <p className="mt-2 text-sm leading-6 text-white/66">
            The read-only path is ready, but this data source has no risk records for
            the selected campaign.
          </p>
        </section>
      ) : (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <h2 className="text-2xl font-semibold text-white">Risk readout</h2>
          <div className="mt-4 grid gap-3">
            {data.riskFlags.slice(0, 3).map((risk) => (
              <article key={risk.id} className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/70">
                  {risk.severity} / {risk.visibility.replace("_", " ")}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{risk.signal}</h3>
                <p className="mt-2 text-sm leading-6 text-white/64">
                  {risk.response_plan}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <EventOutboxLog events={data.integrationEvents} outboxItems={data.outboxItems} />
    </AppShell>
  );
}
