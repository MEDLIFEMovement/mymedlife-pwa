import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  type EventDetailCheckStatus,
  getRushMonthEventDetailWorkspace,
} from "@/services/rush-month-event-detail";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthEventDetail");
export const dynamic = "force-dynamic";

type RushMonthEventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function RushMonthEventDetailPage({
  params,
}: RushMonthEventDetailPageProps) {
  const { eventId } = await params;
  const actor = await getLocalActorContext();
  const workspace = getRushMonthEventDetailWorkspace(actor, eventId);

  if (!workspace) {
    notFound();
  }

  if (!workspace.canReadWorkspace || !workspace.event) {
    return (
      <AppShell actor={actor}>
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.label}
        />
      </AppShell>
    );
  }

  const event = workspace.event;

  return (
    <AppShell actor={actor}>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              {workspace.title}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{event.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              {workspace.summary}
            </p>
          </div>
          <Link
            href="/rush-month/events"
            className="w-fit rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to events
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
              What should I do next?
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {workspace.nextStep.detail}
            </h2>
          </div>
          <Link
            href={workspace.nextStep.href}
            className="w-fit rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
          >
            {workspace.nextStep.label}
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Timing" value={event.timing} />
        <MiniStat label="RSVP" value={event.rsvpStatusLabel} />
        <MiniStat label="Owner" value={event.ownerRole} />
        <MiniStat label="Event type" value={event.eventTypeLabel} />
        <MiniStat label="External writes" value={`${workspace.counts.externalWritesExpected}`} />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <div className="flex flex-wrap gap-2">
          <CheckStatusPill status={event.rsvpStatusTone}>
            {event.rsvpStatusLabel}
          </CheckStatusPill>
          <LumaStatusPill status={event.lumaStatusTone} label={event.lumaStatusLabel} />
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/62">
            {event.committeeName}
          </span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/62">
            {event.supportLane} lane
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <DetailBlock label="RSVP posture" value={event.rsvpDetail} />
          <DetailBlock label="Student action" value={event.expectedStudentAction} />
          <DetailBlock label="Feedback plan" value={event.feedbackPlan} />
          <DetailBlock label="NPS question" value={event.npsQuestion} />
          <DetailBlock label="Proof prompt" value={event.proofPrompt} />
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
          Readiness checks
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {workspace.readinessChecks.map((check) => (
            <article key={check.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-white">{check.label}</p>
                <CheckStatusPill status={check.status} />
              </div>
              <p className="mt-2 text-sm leading-6 text-white/62">{check.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <EventOutboxLog
        events={workspace.futureStructuredEvents}
        outboxItems={workspace.disabledOutboxItems}
      />

      <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
          Safety boundary
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
        <p className="mt-4 text-xs leading-5 text-white/48">
          Browser writes expected: {workspace.counts.browserWritesExpected}. External
          writes expected: {workspace.counts.externalWritesExpected}.
        </p>
      </section>
    </AppShell>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function CheckStatusPill({
  status,
  children,
}: {
  status: EventDetailCheckStatus;
  children?: string;
}) {
  const className =
    status === "ready"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "mocked"
        ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
        : "border-amber-300/30 bg-amber-300/15 text-amber-100";

  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${className}`}>
      {children ?? status}
    </span>
  );
}

function LumaStatusPill({
  label,
  status,
}: {
  label: string;
  status: "mock_linked" | "not_linked" | "future_sync_disabled";
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
