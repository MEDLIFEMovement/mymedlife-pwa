import Link from "next/link";
import type {
  RushMonthEventReadinessRow,
  RushMonthEventReadinessWorkspace,
} from "@/services/rush-month-event-readiness";

type RushMonthEventReadinessPanelProps = {
  workspace: RushMonthEventReadinessWorkspace;
};

export function RushMonthEventReadinessPanel({
  workspace,
}: RushMonthEventReadinessPanelProps) {
  if (!workspace.canReadWorkspace) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
          Rush Month events
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">
          {workspace.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {workspace.summary}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 lg:hidden">
          <HeroStat label="Events" value={`${workspace.counts.totalEvents}`} />
          <HeroStat label="Proof" value={`${workspace.counts.proofPrompts}`} />
          <HeroStat label="NPS" value={`${workspace.counts.npsPrompts}`} />
        </div>
      </section>

      <div className="grid gap-4 rounded-[2rem] bg-[#eef3fb] p-4 shadow-[0_18px_50px_rgba(5,24,60,0.12)]">
        <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MiniStat label="Events" value={`${workspace.counts.totalEvents}`} />
          <MiniStat
            label="Mock Luma"
            value={`${workspace.counts.mockLinkedLumaEvents}`}
          />
          <MiniStat
            label="Luma locked"
            value={`${workspace.counts.disabledLumaSyncs}`}
          />
          <MiniStat label="NPS prompts" value={`${workspace.counts.npsPrompts}`} />
          <MiniStat
            label="Proof prompts"
            value={`${workspace.counts.proofPrompts}`}
          />
          <MiniStat
            label="External writes"
            value={`${workspace.counts.externalWritesExpected}`}
          />
        </section>

        <section className="grid gap-4">
          {workspace.rows.map((row) => (
            <EventReadinessCard key={row.id} row={row} />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Future structured events
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Ready for automation later, still disabled now.
            </h2>
            <div className="mt-4 grid gap-3">
              {workspace.futureStructuredEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-slate-200 bg-[#dbeafe] p-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{event.title}</p>
                      <p className="mt-1 font-mono text-xs text-[#1d4ed8]">
                        {event.eventType}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                      {event.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {event.detail}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-[#bfdbfe] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1d4ed8]">
              Disabled outbox
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Nothing leaves myMEDLIFE yet.
            </h2>
            <div className="mt-4 grid gap-3">
              {workspace.disabledOutboxItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#2563eb]/20 bg-white/70 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{item.destination}</p>
                    <span className="rounded-full border border-[#2563eb]/20 bg-[#dbeafe] px-2 py-1 text-xs font-semibold text-[#1d4ed8]">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {item.payloadSummary}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Safety notes
          </p>
          <div className="mt-4 grid gap-2">
            {workspace.safetyNotes.map((note) => (
              <p
                key={note}
                className="rounded-2xl border border-slate-200 bg-[#dbeafe] p-3 text-sm leading-6 text-slate-600"
              >
                {note}
              </p>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function EventReadinessCard({ row }: { row: RushMonthEventReadinessRow }) {
  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <RsvpStatusPill status={row.rsvpStatusTone} label={row.rsvpStatusLabel} />
            <LumaStatusPill status={row.lumaStatusTone} label={row.lumaStatusLabel} />
            <span className="rounded-full border border-slate-200 bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-slate-600">
              {row.timing}
            </span>
            <span className="rounded-full border border-slate-200 bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-slate-600">
              {row.eventTypeLabel}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">{row.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {row.committeeName} / Owner: {row.ownerRole}
          </p>
        </div>
        <Link
          href={`/rush-month/events/${row.id}`}
          className="w-fit rounded-full bg-[#dbeafe] px-4 py-2 text-sm font-semibold text-[#1e40af]"
        >
          Open event
        </Link>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <DetailBlock label="RSVP posture" value={row.rsvpDetail} />
        <DetailBlock label="Student action" value={row.expectedStudentAction} />
        <DetailBlock label="Feedback plan" value={row.feedbackPlan} />
        <DetailBlock label="NPS question" value={row.npsQuestion} />
        <DetailBlock label="Proof prompt" value={row.proofPrompt} />
      </div>
    </article>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#dbeafe] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}

function LumaStatusPill({
  label,
  status,
}: {
  label: string;
  status: RushMonthEventReadinessRow["lumaStatusTone"];
}) {
  const className =
    status === "mock_linked"
      ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
      : status === "future_sync_disabled"
        ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
        : "border-slate-200 bg-[#dbeafe] text-slate-600";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function RsvpStatusPill({
  label,
  status,
}: {
  label: string;
  status: RushMonthEventReadinessRow["rsvpStatusTone"];
}) {
  const className =
    status === "ready"
      ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
      : status === "mocked"
        ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
        : "border-blue-300/30 bg-blue-300/15 text-blue-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/12 bg-white/10 p-3 backdrop-blur-sm">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-white/56">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
