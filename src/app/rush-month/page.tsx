import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { MetricCard } from "@/components/metric-card";
import { getReadOnlyAppData } from "@/services/read-only-app-data";

export default async function RushMonthPage() {
  const data = await getReadOnlyAppData();

  return (
    <AppShell>
      <DataSourceNotice source={data.source} />

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
            See this week actions
          </Link>
          <Link
            href="/rush-month/review"
            className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
          >
            Open review queue
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Points"
          value={`${data.pointsSummary.earned}/${data.pointsSummary.available}`}
          note={`${data.pointsSummary.approvedActions} approved action so far`}
        />
        <MetricCard
          label="Proof pending"
          value={`${data.kpiSummary.proofPending}`}
          note="Submitted testimonials/proof to route"
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
          label="Risk flags"
          value={`${data.riskFlags.length}`}
          note="Leader-visible and coach-private records"
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

      <EventOutboxLog events={data.integrationEvents} outboxItems={data.outboxItems} />
    </AppShell>
  );
}
