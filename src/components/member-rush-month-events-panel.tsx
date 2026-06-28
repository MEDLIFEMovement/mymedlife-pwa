import Link from "next/link";

import type { MemberActionRouteSource } from "@/services/member-action-route-href";
import type { RushMonthEventReadinessWorkspace } from "@/services/rush-month-event-readiness";
import { getStagingLumaEventLoopReadModel } from "@/services/staging-luma-event-loop";
import { EventLoopStrip } from "@/components/event-loop-strip";
import { PanelButton, SurfacePanel, StatusPill } from "@/components/visual-primitives";

type MemberRushMonthEventsPanelProps = {
  workspace: RushMonthEventReadinessWorkspace;
  source?: MemberActionRouteSource | null;
};

export function MemberRushMonthEventsPanel({
  workspace,
  source,
}: MemberRushMonthEventsPanelProps) {
  const thisWeekRows = workspace.rows.filter((row) => row.memberSection === "this_week");
  const comingUpRows = workspace.rows.filter((row) => row.memberSection === "coming_up");
  const visibleRows = [...thisWeekRows, ...comingUpRows];
  const sourceContext = getMemberEventsSourceContext(source);
  const activation = getStagingLumaEventLoopReadModel("staging");

  return (
    <section className="grid gap-3">
      <section className="app-surface-info overflow-hidden rounded-[2rem] p-4">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
          UCLA MEDLIFE
        </p>
        <h1 className="mt-2 text-[2.1rem] font-semibold leading-none text-slate-950 sm:text-[2.45rem]">
          Events
        </h1>
        <p className="mt-2.5 max-w-[19rem] text-sm leading-6 text-slate-600">
          Show up where your chapter is active, RSVP fast, and keep the Rush Month
          loop moving.
        </p>
        {sourceContext ? (
          <div className="mt-4 rounded-[1.3rem] border border-slate-200 bg-white p-3.5 shadow-[0_8px_24px_rgb(var(--mymedlife-shadow-rgb)/0.05)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {sourceContext.eyebrow}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {sourceContext.compactDetail}
                </p>
              </div>
              <Link
                href={sourceContext.href}
                className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
              >
                {sourceContext.backLabel}
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <section className="app-surface-info rounded-[1.6rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">Event loop</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">
          RSVP, attendance, and points all move together.
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Luma holds the event, RSVP shows intent, attendance confirms who
          actually showed, and points move the chapter leaderboard after the
          event is reviewed.
        </p>
        <EventLoopStrip
          className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
          items={[
            { label: "Luma", detail: "Event source of truth", tone: "blue" },
            { label: "RSVP", detail: "Intent before the event", tone: "blue" },
            { label: "Attendance", detail: "Checked in on event day", tone: "gold" },
            { label: "Points", detail: "Moves chapter rank", tone: "yellow" },
          ]}
        />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <EventLoopStatus
            label="Luma + QR"
            value={activation.providerStatusLabel}
            detail={activation.summary.qrReady ? "QR ready for staging review" : "QR disabled"}
          />
          <EventLoopStatus
            label="RSVP + attendance"
            value={`${activation.summary.rsvpCount} RSVP / ${activation.summary.attendanceCount} attended`}
            detail={`${activation.summary.pointsAwarded} points awarded once`}
          />
        </div>
      </section>

      {visibleRows.length > 0 ? (
      <SurfacePanel>
        <p className="text-sm font-semibold tracking-[0.02em] text-slate-500">Coming Up</p>
        <div className="mt-3 grid gap-3">
          {visibleRows.map((row) => (
            <MemberEventCard key={row.id} row={row} source={source} />
          ))}
        </div>
      </SurfacePanel>
      ) : null}
    </section>
  );
}

function EventLoopStatus({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.1rem] border border-[var(--mymedlife-border)] bg-white px-3.5 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function MemberEventCard({
  row,
  source,
}: {
  row: RushMonthEventReadinessWorkspace["rows"][number];
  source?: MemberActionRouteSource | null;
}) {
  const isRegistered = row.memberRsvpState === "registered";
  const detailSource = source ?? "events";
  const detailHref = `/rush-month/events/${row.id}?source=${detailSource}`;

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {row.memberLumaLabel ? (
              <StatusPill tone="blue" className="text-[0.68rem] tracking-[0.12em]">
                {row.memberLumaLabel}
              </StatusPill>
            ) : null}
            <StatusPill tone="blue" className="text-[0.68rem] tracking-[0.12em]">
              {row.memberCampaignLabel}
            </StatusPill>
            <StatusPill tone="gold" className="text-[0.68rem] tracking-[0.12em] text-[var(--mymedlife-info)]">
              {row.memberPointsLabel}
            </StatusPill>
          </div>
          <Link
            href={detailHref}
            className="mt-2.5 inline-block text-lg font-semibold leading-6 text-slate-950 transition hover:text-[var(--mymedlife-info)]"
          >
            {row.title}
          </Link>
          <p className="mt-1.5 text-sm text-slate-600">{row.memberDateTimeLabel}</p>
          <p className="mt-1 text-sm text-slate-500">{row.memberLocationLabel}</p>
          <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            RSVP &rarr; attendance &rarr; points &rarr; leaderboard
          </p>
        </div>
        {isRegistered ? (
          <StatusPill tone="blue" className="text-sm">
            {row.memberRsvpLabel}
          </StatusPill>
        ) : (
          <PanelButton href={detailHref} variant="secondary">
            {row.memberRsvpLabel}
          </PanelButton>
        )}
      </div>
    </article>
  );
}

function getMemberEventsSourceContext(source: MemberActionRouteSource | null | undefined) {
  switch (source) {
    case "home":
      return {
        eyebrow: "From home",
        compactDetail:
          "Home surfaced this events list as the next place to show up. Keep that chapter moment tied to the weekly loop you came from.",
        href: "/",
        backLabel: "Back to home",
      };
    case "campaigns":
      return {
        eyebrow: "From campaigns",
        compactDetail:
          "Campaign context explains why these events matter. Choose the right chapter moment without losing the larger Rush Month loop.",
        href: "/campaigns",
        backLabel: "Back to campaigns",
      };
    case "points":
      return {
        eyebrow: "From points",
        compactDetail:
          "Recognition should still point you toward a real chapter moment. Use this route to find the event that can move the next action forward.",
        href: "/rush-month/leaderboard",
        backLabel: "Back to points",
      };
    case "profile":
      return {
        eyebrow: "From profile",
        compactDetail:
          "Profile should stay lightweight while still sending you into real chapter activity. Pick the event that best matches the next action you need to take.",
        href: "/profile",
        backLabel: "Back to profile",
      };
    default:
      return null;
  }
}
