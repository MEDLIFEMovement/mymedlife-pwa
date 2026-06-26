import Link from "next/link";
import { redirect } from "next/navigation";

import { EventLoopStrip } from "@/components/event-loop-strip";
import { StudentAppShell } from "@/components/student-app-shell";
import { PanelButton, SurfacePanel, StatCard } from "@/components/visual-primitives";
import { StatusBadge } from "@/components/status-badge";
import { getLandingRouteForActor } from "@/services/landing-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { isMemberSurfaceFamily } from "@/services/role-visibility";
import {
  type StudentHomeActionCard,
  type StudentHomeEventCard,
  getStudentHomeWorkspace,
} from "@/services/student-home-workspace";
import type { LeaderboardRow } from "@/shared/types/rush-month-dashboard";

export const metadata = getStaticRouteMetadata("home");
export const dynamic = "force-dynamic";

export default async function Home() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const landingRoute = getLandingRouteForActor(actor);

  if (!isMemberSurfaceFamily(actor) || (landingRoute !== "/" && landingRoute !== "/app")) {
    redirect(landingRoute);
  }

  const workspace = getStudentHomeWorkspace(actor, data);
  const featuredAction = workspace.assignedActions[0];
  const secondaryActions = workspace.assignedActions.slice(1, 3);
  const featuredEvent = workspace.upcomingEvents[0];
  const secondaryEvent = workspace.upcomingEvents[1];
  const leaderboardRows = workspace.points.leaderboardPreview.slice(0, 4);
  const homePointsHref = `${workspace.points.href}?source=home`;

  return (
    <StudentAppShell
      actor={actor}
      hideTopHeader
      showDebugTools={false}
    >
      <section className="app-surface-info overflow-hidden rounded-[2rem] p-0">
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                {workspace.chapterName}
              </p>
              <h1 className="mt-2 text-[2rem] font-semibold leading-none text-slate-950 sm:text-[2.6rem]">
                {workspace.greeting}
              </h1>
              <p className="mt-2 text-sm text-slate-600">You are making a difference.</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {workspace.heroSummary}
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                {workspace.chapterMeta}
              </p>
              {workspace.travelerPrep ? (
                <div className="mt-4 inline-flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
                      Traveler access
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {workspace.travelerPrep.title}
                    </p>
                  </div>
                  <PanelButton href={workspace.travelerPrep.href} variant="secondary" className="px-3 py-2 text-xs">
                    {workspace.travelerPrep.ctaLabel}
                  </PanelButton>
                </div>
              ) : null}
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M15.6 17H8.4c-1.2 0-2-.9-1.8-2l.6-2.7a5 5 0 0 0 .1-1V9.8a4.7 4.7 0 1 1 9.4 0v1.5a5 5 0 0 0 .1 1l.6 2.7c.2 1.1-.6 2-1.8 2Z" />
                <path d="M10 19a2 2 0 0 0 4 0" />
              </svg>
            </span>
          </div>

          <article className="mt-4 rounded-[1.5rem] border border-[#bfdbfe] bg-[#fbfdff] p-3.5 sm:p-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              This Week&apos;s Priority
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-950">
              {featuredAction?.title ?? workspace.startNextAction.label}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {featuredAction
                ? `Rush Month · Due ${featuredAction.dueLabel} · ${featuredAction.points} pts`
                : workspace.startNextAction.detail}
            </p>
            <PanelButton
              href={featuredAction?.href ?? workspace.startNextAction.href}
              className="mt-4"
            >
              Start next action
            </PanelButton>
          </article>
        </div>
      </section>

      <SurfacePanel tone="info">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="app-eyebrow app-eyebrow-blue">Event loop</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Luma, RSVP, attendance, and points are the story to watch.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Open the event, RSVP, confirm attendance, and keep the points and
              leaderboard movement tied to the chapter moment that actually
              happened.
            </p>
          </div>
          <EventLoopStrip
            className="mt-4 grid gap-2 sm:grid-cols-2 lg:w-[24rem]"
            items={[
              {
                label: "Luma",
                detail: "Source of truth",
                tone: "blue",
              },
              {
                label: "RSVP",
                detail: "Student action",
                tone: "blue",
              },
              {
                label: "Attendance",
                detail: "Confirms who showed",
                tone: "gold",
              },
              {
                label: "Points",
                detail: "Leaderboard impact",
                tone: "yellow",
              },
            ]}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <PanelButton href="/rush-month/events?source=home" variant="secondary">
            Open events
          </PanelButton>
          <PanelButton href={homePointsHref}>Open points</PanelButton>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {workspace.stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              note={stat.note}
            />
          ))}
        </div>
      </SurfacePanel>

      {workspace.travelerPrep ? (
        <SurfacePanel tone="info">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="app-eyebrow app-eyebrow-blue">Traveler access</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {workspace.travelerPrep.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {workspace.travelerPrep.summary}
              </p>
            </div>
            <PanelButton href={workspace.travelerPrep.href} variant="secondary">
              {workspace.travelerPrep.ctaLabel}
            </PanelButton>
          </div>
        </SurfacePanel>
      ) : null}

      <SurfacePanel>
        <div
          aria-label={`Open ${workspace.campaign.name} campaign`}
          className="block rounded-[1.4rem] transition hover:bg-[#f8fbff]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="app-eyebrow app-eyebrow-blue">Active Campaign</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Active
                </span>
                <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
                  {workspace.campaign.stageLabel}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                {workspace.campaign.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {workspace.campaign.summary}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Your progress</span>
              <span>{workspace.campaign.progressCountLabel}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#f8fbff]">
              <div
                className="h-full rounded-full bg-[#2b5fb4]"
                style={{ width: `${workspace.campaign.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatCard
              label="Chapter completion"
              value={`${workspace.campaign.progressPercent}%`}
              note="of campaign milestones"
            />
            <StatCard
              label="Members active"
              value={`${workspace.campaign.activeMemberCount}/${workspace.campaign.totalMemberCount}`}
              note="currently participating"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <PanelButton href={workspace.campaign.href} variant="secondary">
              Open Rush Month campaign
            </PanelButton>
          </div>
        </div>
      </SurfacePanel>

      <SurfacePanel>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="app-eyebrow app-eyebrow-blue">My Actions</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">My Actions</h2>
          </div>
          <PanelButton
            href="/rush-month/actions?source=home"
            className="px-3 py-2 text-xs"
            variant="secondary"
          >
            See all
          </PanelButton>
        </div>

        <div className="mt-3 grid gap-3">
          {featuredAction ? <ActionRow action={featuredAction} featured /> : null}
          {secondaryActions.map((action) => (
            <ActionRow key={action.id} action={action} />
          ))}
          </div>
      </SurfacePanel>

      <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <SurfacePanel>
          <p className="app-eyebrow app-eyebrow-blue">My Points · Rush Month</p>
          <div className="mt-3">
            <div>
              <p className="text-4xl font-semibold leading-none text-slate-950">
                {workspace.points.total}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-600">pts earned</p>
              <p className="mt-2 text-sm text-slate-500">
                {workspace.points.weeklyMomentumLabel} · {workspace.points.rankDetail}
              </p>
            </div>
          </div>
          <PanelButton href={homePointsHref} className="mt-4 px-3 py-2 text-xs" variant="secondary">
            Leaderboard →
          </PanelButton>
        </SurfacePanel>

        <SurfacePanel>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="app-eyebrow app-eyebrow-blue">Upcoming Events</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Upcoming Events</h2>
            </div>
            <PanelButton
              href="/rush-month/events?source=home"
              variant="secondary"
              className="px-3 py-2 text-xs"
            >
              View all
            </PanelButton>
          </div>
        <div className="mt-4 grid gap-3">
            {featuredEvent ? <EventRow event={featuredEvent} /> : null}
            {secondaryEvent ? <EventRow event={secondaryEvent} /> : null}
          </div>
        </SurfacePanel>
      </section>

      <SurfacePanel>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="app-eyebrow app-eyebrow-blue">Chapter Leaderboard</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Chapter Leaderboard</h2>
          </div>
          <PanelButton href={homePointsHref} variant="secondary" className="px-3 py-2 text-xs">
            Full board
          </PanelButton>
        </div>
        <div className="mt-4 grid gap-2">
          {leaderboardRows.map((row, index) => (
            <LeaderboardRowCard
              key={row.id}
              index={index}
              row={row}
              currentName={actor.user.displayName}
            />
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel tone="info">
        <p className="app-eyebrow app-eyebrow-blue">Coach message</p>
        <p className="mt-3 text-sm font-semibold text-slate-900">
          {workspace.coachMessage.authorName} · {workspace.coachMessage.dateLabel}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{workspace.coachMessage.body}</p>
      </SurfacePanel>

    </StudentAppShell>
  );
}

function ActionRow({
  action,
  featured = false,
}: {
  action: StudentHomeActionCard;
  featured?: boolean;
}) {
  const isSelected = action.status === "in_progress" || action.status === "submitted";

  return (
    <Link
      href={action.href}
      className={[
        "rounded-[1.35rem] border p-4 transition",
        featured
          ? "border-[#bfdbfe] bg-[#f8fbff] shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
          : "border-slate-200 bg-white hover:border-[#bfdbfe] hover:bg-[#f8fbff]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className={[
              "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
              isSelected
                ? "border-[#2b5fb4] bg-white text-[#2b5fb4]"
                : "border-slate-300 bg-[#dbeafe] text-transparent",
            ].join(" ")}
          >
            <span
              className={[
                "h-2.5 w-2.5 rounded-full transition",
                isSelected ? "bg-[#2b5fb4]" : "bg-transparent",
              ].join(" ")}
            />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-6 text-slate-950">{action.title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              Due {action.dueLabel} · {action.points} pts
            </p>
          </div>
        </div>
        <StatusBadge status={action.status} />
      </div>
    </Link>
  );
}

function EventRow({ event }: { event: StudentHomeEventCard }) {
  const isRegistered = event.rsvpState === "registered";

  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-4 transition hover:border-[#bfdbfe] hover:bg-[#f8fbff]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#2563eb]">
              Luma
            </span>
            <span className="rounded-full border border-[#dbeafe] bg-[#dbeafe] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#1d4ed8]">
              RSVP
            </span>
          </div>
          <Link
            href={event.href}
            className="mt-2 block text-base font-semibold text-slate-950 transition hover:text-[#1d4ed8]"
          >
            {event.title}
          </Link>
          <p className="mt-1 text-sm text-slate-500">{event.timing}</p>
          <p className="mt-1 text-sm text-slate-500">{event.locationLabel}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            RSVP &rarr; attendance &rarr; points
          </p>
        </div>
        {isRegistered ? (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            {event.rsvpLabel}
          </span>
        ) : (
          <Link
            href={event.href}
            className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#2563eb]"
          >
            {event.rsvpLabel}
          </Link>
        )}
      </div>
    </article>
  );
}

function LeaderboardRowCard({
  index,
  row,
  currentName,
}: {
  index: number;
  row: LeaderboardRow;
  currentName: string;
}) {
  const isCurrentUser = row.displayName.toLowerCase() === currentName.toLowerCase();
  const rankLabel = index === 0 ? "1" : `${index + 1}`;

  return (
    <div
      className={[
        "flex items-center justify-between rounded-[1.2rem] border px-4 py-3",
        isCurrentUser
          ? "border-[#2563eb]/35 bg-[#dbeafe]"
          : "border-slate-200 bg-[#dbeafe]",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700">
          {rankLabel}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {isCurrentUser ? `You (${row.displayName})` : row.displayName}
          </p>
        </div>
      </div>
      <p className="text-sm font-semibold text-[#1d4ed8]">{row.points} pts</p>
    </div>
  );
}
