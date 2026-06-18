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
      <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
          Rush Month events
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {workspace.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
          {workspace.summary}
        </p>
      </section>

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
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            Future structured events
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Ready for automation later, still disabled now.
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.futureStructuredEvents.map((event) => (
              <div key={event.id} className="rounded-2xl bg-black/20 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{event.title}</p>
                    <p className="mt-1 font-mono text-xs text-emerald-100/70">
                      {event.eventType}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-xs font-semibold text-white/62">
                    {event.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  {event.detail}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
            Disabled outbox
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Nothing leaves myMEDLIFE yet.
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.disabledOutboxItems.map((item) => (
              <div key={item.id} className="rounded-2xl bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{item.destination}</p>
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-xs font-semibold text-amber-100">
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  {item.payloadSummary}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
          Safety notes
        </p>
        <div className="mt-4 grid gap-2">
          {workspace.safetyNotes.map((note) => (
            <p
              key={note}
              className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/64"
            >
              {note}
            </p>
          ))}
        </div>
      </section>
    </section>
  );
}

function EventReadinessCard({ row }: { row: RushMonthEventReadinessRow }) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <RsvpStatusPill status={row.rsvpStatusTone} label={row.rsvpStatusLabel} />
            <LumaStatusPill status={row.lumaStatusTone} label={row.lumaStatusLabel} />
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/62">
              {row.timing}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/62">
              {row.eventTypeLabel}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">{row.title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            {row.committeeName} / Owner: {row.ownerRole}
          </p>
        </div>
        <Link
          href={`/rush-month/events/${row.id}`}
          className="w-fit rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
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
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/66">{value}</p>
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
      ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
      : status === "future_sync_disabled"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : "border-white/10 bg-black/20 text-white/62";

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
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "mocked"
        ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
        : "border-amber-300/30 bg-amber-300/15 text-amber-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
