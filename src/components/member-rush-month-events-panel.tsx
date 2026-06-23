import Link from "next/link";

import type { MemberActionRouteSource } from "@/services/member-action-route-href";
import type { RushMonthEventReadinessWorkspace } from "@/services/rush-month-event-readiness";

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
  const openRsvpCount = workspace.rows.filter((row) => row.memberRsvpState === "open").length;
  const registeredCount = workspace.rows.filter(
    (row) => row.memberRsvpState === "registered",
  ).length;
  const sourceContext = getMemberEventsSourceContext(source);

  return (
    <section className="grid gap-3">
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(180deg,#2455a4_0%,#2a5fb5_48%,#21457d_100%)] p-4 shadow-[0_24px_80px_rgba(2,14,38,0.28)]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
          UCLA MEDLIFE
        </p>
        <h1 className="mt-2 text-[2.1rem] font-semibold leading-none text-white sm:text-[2.45rem]">
          Events
        </h1>
        <p className="mt-2.5 max-w-[19rem] text-sm leading-6 text-white/80">
          Show up where your chapter is active, RSVP fast, and keep the Rush Month
          loop moving.
        </p>
        <div className="mt-4 grid max-w-[18rem] grid-cols-2 gap-2">
          <HeroEventSummaryPill label="This Week" value={`${thisWeekRows.length}`} />
          <HeroEventSummaryPill label="Coming Up" value={`${comingUpRows.length}`} />
          <HeroEventSummaryPill label="RSVP Open" value={`${openRsvpCount}`} />
          <HeroEventSummaryPill label="RSVP'd" value={`${registeredCount}`} />
        </div>
        {sourceContext ? (
          <div className="mt-4 rounded-[1.3rem] border border-white/12 bg-white/10 p-3.5 backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
                  {sourceContext.eyebrow}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  {sourceContext.compactDetail}
                </p>
              </div>
              <Link
                href={sourceContext.href}
                className="inline-flex w-fit rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/24 hover:bg-white/14"
              >
                {sourceContext.backLabel}
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      {thisWeekRows.length > 0 ? (
        <section className="app-surface rounded-[1.8rem] p-4">
          <p className="text-sm font-semibold tracking-[0.02em] text-slate-500">This Week</p>
          <div className="mt-3 grid gap-3">
            {thisWeekRows.map((row) => (
              <MemberEventCard key={row.id} row={row} source={source} />
            ))}
          </div>
        </section>
      ) : null}

      {comingUpRows.length > 0 ? (
        <section className="app-surface rounded-[1.8rem] p-4">
          <p className="text-sm font-semibold tracking-[0.02em] text-slate-500">Coming Up</p>
          <div className="mt-3 grid gap-3">
            {comingUpRows.map((row) => (
              <MemberEventCard key={row.id} row={row} source={source} />
            ))}
          </div>
        </section>
      ) : null}
    </section>
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
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {row.memberLumaLabel ? (
              <span className="rounded-full border border-[#f3e8ff] bg-[#faf5ff] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#9333ea]">
                {row.memberLumaLabel}
              </span>
            ) : null}
            <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#2563eb]">
              {row.memberCampaignLabel}
            </span>
            <span className="rounded-full border border-[#fef3c7] bg-[#fffbeb] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#a16207]">
              {row.memberPointsLabel}
            </span>
          </div>
          <Link
            href={detailHref}
            className="mt-2.5 inline-block text-lg font-semibold leading-6 text-slate-950 transition hover:text-[#1d4ed8]"
          >
            {row.title}
          </Link>
          <p className="mt-1.5 text-sm text-slate-600">{row.memberDateTimeLabel}</p>
          <p className="mt-1 text-sm text-slate-500">{row.memberLocationLabel}</p>
        </div>
        {isRegistered ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            {row.memberRsvpLabel}
          </span>
        ) : (
          <Link
            href={detailHref}
            className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#2563eb]"
          >
            {row.memberRsvpLabel}
          </Link>
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

function HeroEventSummaryPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-center text-xs font-semibold text-white/82">
      {label}: {value}
    </span>
  );
}
