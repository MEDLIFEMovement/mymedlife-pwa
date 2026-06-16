import Link from "next/link";
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
  getVisibleAssignmentsForActor,
  getVisibleRiskFlagsForActor,
} from "@/services/role-visibility";

export const dynamic = "force-dynamic";

export default async function RushMonthPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const visibleRisks = getVisibleRiskFlagsForActor(actor, data.riskFlags);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <LocalActorNotice actor={actor} />
      <LocalRoleSwitcher actor={actor} />

      {!canReadChapterData(actor) ? (
        <RestrictedState
          title="DS Admin can inspect automation posture, not campaign truth."
          message="Rush Month progress, assignments, points, and KPIs stay owned by the app and chapter roles. DS Admin can use the admin page to inspect disabled/mock outbox rows."
          nextHref="/admin"
          nextLabel="Open integration outbox"
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              Active campaign
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white">{data.campaign.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              {data.campaign.objective}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/rush-month/actions"
                className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
              >
                See visible actions
              </Link>
              <Link
                href="/rush-month/review"
                className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
              >
                Open role-aware follow-up
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Visible actions"
              value={`${visibleAssignments.length}`}
              note={`${actor.audienceLabel} read scope`}
            />
            <MetricCard
              label="Proof pending"
              value={`${visibleAssignments.filter((item) => item.status === "submitted" || item.status === "changes_requested").length}`}
              note="Visible testimonials/proof to route"
            />
            <MetricCard
              label="Coach read"
              value={data.kpiSummary.coachDecision}
              note="Mock decision state only"
            />
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Campaign lanes"
              value={`${data.campaignRoleAssignments.length}`}
              note="Read-only officer/action lanes"
            />
            <MetricCard
              label="Readiness reviews"
              value={`${data.readinessReviews.length}`}
              note="Local Supabase-ready gate records"
            />
            <MetricCard
              label="Visible risk flags"
              value={`${visibleRisks.length}`}
              note="Filtered by role boundary"
            />
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-2xl font-semibold text-white">This week operating path</h2>
            <ol className="mt-4 grid gap-3">
              {[
                "Leader opens Rush Month and assigns the first outreach owners.",
                "Members run the invite push and submit action updates or testimonial/proof notes.",
                "Leaders track completion while HQ decides what testimonial/proof should be shared later.",
                "Points and KPI summaries update from approved action events.",
                "Coach reads advance / hold / intervene before the next push.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 rounded-2xl bg-black/20 p-3 text-sm text-white/72">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 font-semibold text-emerald-100">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      {canReadIntegrationOutbox(actor) ? (
        <EventOutboxLog events={data.integrationEvents} outboxItems={data.outboxItems} />
      ) : (
        <RestrictedState
          eyebrow="Automation visibility"
          title="Integration outbox hidden for this role."
          message="Only DS Admin and Super Admin can inspect disabled/mock outbox records in this local proof. Real external writes remain off for every role."
        />
      )}
    </AppShell>
  );
}
