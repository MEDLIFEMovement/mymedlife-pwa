import Link from "next/link";

import {
  getLaunchLaneMemberPointsHref,
} from "@/services/events-points-launch-lane";
import type { MemberLaunchLaneEventRow } from "@/services/member-launch-lane-events";
import { buildMemberLaunchLaneEventDetailHref } from "@/services/member-launch-lane-events";
import type { LaunchLaneResultNotice, MemberLaunchLaneRsvpCard } from "@/services/luma-launch-lane-workspace";
import type { MemberActionRouteSource } from "@/services/member-action-route-href";
import { EventLoopStrip } from "@/components/event-loop-strip";
import { MemberLiveRsvpCard } from "@/components/member-live-rsvp-card";
import { PanelButton, SurfacePanel, StatusPill } from "@/components/visual-primitives";

type MemberRushMonthEventsPanelProps = {
  rows: Array<
    Pick<
      MemberLaunchLaneEventRow,
      | "id"
      | "title"
      | "memberDateTimeLabel"
      | "memberLocationLabel"
      | "memberCampaignLabel"
      | "memberPointsLabel"
      | "memberRsvpLabel"
      | "memberRsvpState"
      | "memberLumaLabel"
    >
  >;
  chapterName: string;
  source?: MemberActionRouteSource | null;
  liveRsvpCard?: MemberLaunchLaneRsvpCard | null;
  liveRsvpEnabled?: boolean;
  resultNotice?: LaunchLaneResultNotice;
  rsvpAction?: (formData: FormData) => void | Promise<void>;
};

export function MemberRushMonthEventsPanel({
  rows,
  chapterName,
  source,
  liveRsvpCard,
  liveRsvpEnabled = false,
  resultNotice,
  rsvpAction,
}: MemberRushMonthEventsPanelProps) {
  const normalizedSource = normalizeMemberEventsSource(source);
  const sourceContext = getMemberEventsSourceContext(normalizedSource);
  const rsvpReturnTo = normalizedSource ? `/app/events?source=${normalizedSource}` : "/app/events";

  return (
    <section className="grid gap-3">
      <section className="app-surface-info overflow-hidden rounded-[2rem] p-4">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
          {chapterName}
        </p>
        <h1 className="mt-2 text-[2.1rem] font-semibold leading-none text-slate-950 sm:text-[2.45rem]">
          Events
        </h1>
        <p className="mt-2.5 max-w-[19rem] text-sm leading-6 text-slate-600">
          Show up where your chapter is active, RSVP fast, and keep the chapter
          event loop moving.
        </p>
        {sourceContext ? (
          <div className="mt-4 rounded-[1.3rem] border border-slate-200 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
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
                className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
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
          chapter confirms attendance.
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
      </section>

      {liveRsvpCard ? (
        <MemberLiveRsvpCard
          card={liveRsvpCard}
          returnTo={rsvpReturnTo}
          leaderboardHref={getLaunchLaneMemberPointsHref(normalizedSource ?? "events")}
          enabled={liveRsvpEnabled}
          action={rsvpAction}
          resultNotice={resultNotice}
        />
      ) : null}

      {rows.length > 0 ? (
      <SurfacePanel>
        <p className="text-sm font-semibold tracking-[0.02em] text-slate-500">Coming Up</p>
        <div className="mt-3 grid gap-3">
          {rows.map((row) => (
            <MemberEventCard key={row.id} row={row} source={normalizedSource} />
          ))}
        </div>
      </SurfacePanel>
      ) : null}
    </section>
  );
}

function MemberEventCard({
  row,
  source,
}: {
  row: MemberRushMonthEventsPanelProps["rows"][number];
  source?: MemberActionRouteSource | null;
}) {
  const isRegistered = row.memberRsvpState === "registered";
  const detailSource = source ?? "events";
  const detailHref = buildMemberLaunchLaneEventDetailHref(row.id, detailSource);

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-[#dbeafe] p-3.5">
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
            <StatusPill tone="gold" className="text-[0.68rem] tracking-[0.12em] text-[#1d4ed8]">
              {row.memberPointsLabel}
            </StatusPill>
          </div>
          <Link
            href={detailHref}
            className="mt-2.5 inline-block text-lg font-semibold leading-6 text-slate-950 transition hover:text-[#1d4ed8]"
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
        href: "/app",
        backLabel: "Back to home",
      };
    case "points":
      return {
        eyebrow: "From points",
        compactDetail:
          "Recognition should still point you toward a real chapter moment. Use this route to find the event that can move the next action forward.",
        href: getLaunchLaneMemberPointsHref(),
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

function normalizeMemberEventsSource(
  source: MemberActionRouteSource | null | undefined,
) {
  if (source === "campaigns") {
    return null;
  }

  return source ?? null;
}
