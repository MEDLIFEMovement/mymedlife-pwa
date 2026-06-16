import Link from "next/link";
import type {
  EventProofBridgeRow,
  EventProofBridgeWorkspace,
} from "@/services/rush-month-event-proof-bridge";

type RushMonthEventProofBridgePanelProps = {
  workspace: EventProofBridgeWorkspace;
};

export function RushMonthEventProofBridgePanel({
  workspace,
}: RushMonthEventProofBridgePanelProps) {
  if (!workspace.canReadWorkspace) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
            Event to proof bridge
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{workspace.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {workspace.summary}
          </p>
        </div>
        <Link
          href={workspace.primaryCta.href}
          className="w-fit rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
        >
          {workspace.primaryCta.label}
        </Link>
      </div>

      <div className="mt-4 grid gap-3">
        {workspace.rows.map((row) => (
          <EventProofBridgeCard key={row.eventId} row={row} />
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <BridgeList
          title="Future structured records"
          items={workspace.futureStructuredEvents}
        />
        <BridgeList
          title="Disabled outbox destinations"
          items={workspace.disabledOutboxDestinations}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
        <p className="text-sm font-semibold text-amber-100">Still mock-safe</p>
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-amber-50/72">
          {workspace.safetyNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function EventProofBridgeCard({ row }: { row: EventProofBridgeRow }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/70">
            {row.timing} / {row.committeeName}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{row.title}</h3>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/64">
          {row.lumaStatusLabel}
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {row.steps.map((step) => (
          <div key={step.futureEventType} className="rounded-2xl bg-white/[0.05] p-3">
            <p className="text-sm font-semibold text-white">{step.label}</p>
            <p className="mt-2 text-xs leading-5 text-white/58">{step.detail}</p>
            <p className="mt-2 font-mono text-xs text-emerald-100/64">
              {step.futureEventType}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function BridgeList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/64"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
