import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { LocalActorNotice } from "@/components/local-actor-notice";
import { LocalRoleSwitcher } from "@/components/local-role-switcher";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadChapterData,
  canReadIntegrationOutbox,
  getVisibleRiskFlagsForActor,
} from "@/services/role-visibility";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const visibleRisks = getVisibleRiskFlagsForActor(actor, data.riskFlags);
  const coachPrivateRisks = visibleRisks.filter(
    (risk) => risk.visibility === "coach_private",
  ).length;

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <LocalActorNotice actor={actor} />
      <LocalRoleSwitcher actor={actor} />

      {!canReadChapterData(actor) ? (
        <RestrictedState
          title="DS Admin does not read coach risk or chapter KPIs."
          message="Coach portfolio data belongs to the chapter/coaching operating model. DS Admin can inspect integration and outbox posture only."
          nextHref="/admin"
          nextLabel="Open integration outbox"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              Coach dashboard shell
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{data.chapter.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
              This local readout shows the coach-facing readiness, risk, proof,
              KPI movement, and advance / hold / intervene posture visible to
              {actor.audienceLabel.toLowerCase()}.
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
              label="Visible coach-private risks"
              value={`${coachPrivateRisks}`}
              note="Filtered by local role boundary"
            />
            <MetricCard
              label="Closeouts"
              value={`${data.closeouts.length}`}
              note="Campaign learning and handoff records"
            />
          </section>

          {visibleRisks.length === 0 ? (
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-2xl font-semibold text-white">No visible risk flags</h2>
              <p className="mt-2 text-sm leading-6 text-white/66">
                This role does not currently have risk rows to read in the selected
                local data source.
              </p>
            </section>
          ) : (
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-2xl font-semibold text-white">Risk readout</h2>
              <div className="mt-4 grid gap-3">
                {visibleRisks.slice(0, 3).map((risk) => (
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
        </>
      )}

      {canReadIntegrationOutbox(actor) ? (
        <EventOutboxLog events={data.integrationEvents} outboxItems={data.outboxItems} />
      ) : null}
    </AppShell>
  );
}
