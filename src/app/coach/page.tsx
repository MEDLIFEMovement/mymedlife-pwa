import { AppShell } from "@/components/app-shell";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { MetricCard } from "@/components/metric-card";
import {
  integrationEvents,
  kpiSummary,
  mockChapter,
  outboxItems,
  pointsSummary,
} from "@/data/mock-rush-month";

export default function CoachPage() {
  return (
    <AppShell>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Coach dashboard shell
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{mockChapter.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          Coach view summarizes proof readiness, KPI movement, and the mock
          advance / hold / intervene state without owning student permissions.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Decision"
          value={kpiSummary.coachDecision}
          note="Mock coach state for this week"
        />
        <MetricCard
          label="Proof pending"
          value={`${kpiSummary.proofPending}`}
          note="Items needing review"
        />
        <MetricCard
          label="Points"
          value={`${pointsSummary.earned}`}
          note="Approved action points"
        />
      </section>

      <EventOutboxLog events={integrationEvents} outboxItems={outboxItems} />
    </AppShell>
  );
}
