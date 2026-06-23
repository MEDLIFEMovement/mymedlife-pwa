import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { getLandingRouteForActor } from "@/services/landing-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { buildLocalPreviewHref } from "@/services/local-preview-route";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { homeSurfaceJumps } from "@/services/home-role-jumps";
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

  if (!isMemberSurfaceFamily(actor) || landingRoute !== "/") {
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
    <AppShell
      actor={actor}
      debugToolsPlacement="after-content"
      hideTopHeader
      showMobileQuickItemHelpers={false}
      showDebugTools={false}
    >
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(180deg,#2455a4_0%,#2a5fb5_48%,#21457d_100%)] shadow-[0_24px_80px_rgba(2,14,38,0.28)]">
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
                {workspace.chapterName}
              </p>
              <h1 className="mt-2 text-[2rem] font-semibold leading-none text-white sm:text-[2.6rem]">
                {workspace.greeting}
              </h1>
              <p className="mt-2 text-sm text-white/78">You are making a difference.</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-white/56">
                {workspace.chapterMeta}
              </p>
            </div>
          </div>

          <article className="mt-4 rounded-[1.5rem] border border-white/12 bg-white/10 p-3.5 backdrop-blur-sm sm:p-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#f7d05e]">
              This Week&apos;s Priority
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-white">
              {featuredAction?.title ?? workspace.startNextAction.label}
            </h2>
            <p className="mt-2 text-sm text-white/74">
              {featuredAction
                ? `Rush Month · Due ${featuredAction.dueLabel} · ${featuredAction.points} pts`
                : workspace.startNextAction.detail}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <HeroMetaPill label={workspace.campaign.weekLabel} />
              <HeroMetaPill label={workspace.points.rankDetail} />
            </div>
            <Link
              href={featuredAction?.href ?? workspace.startNextAction.href}
              className="mt-4 inline-flex rounded-full bg-[#f7d05e] px-4 py-2.5 text-sm font-semibold text-[#08224c]"
            >
              Start next action
            </Link>
          </article>
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4 sm:p-5">
        <Link
          href={workspace.campaign.href}
          aria-label={`Open ${workspace.campaign.name} campaign`}
          className="block rounded-[1.4rem] transition hover:bg-[#f8fbff]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="app-eyebrow app-eyebrow-blue">Active campaign</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active
                </span>
                <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
                  {workspace.campaign.weekLabel}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                {workspace.campaign.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Recruit new members, build your chapter.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Your progress</span>
              <span>{workspace.campaign.progressCountLabel}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#2b5fb4]"
                style={{ width: `${workspace.campaign.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-950">
                Chapter: {workspace.campaign.progressPercent}% complete
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-right">
              <p className="text-sm font-semibold text-slate-950">
                {workspace.campaign.activeMemberCount} / {workspace.campaign.totalMemberCount} members active
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <span className="inline-flex rounded-full border border-[#dbeafe] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563eb]">
              Open Rush Month campaign
            </span>
          </div>
        </Link>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="app-eyebrow app-eyebrow-blue">My Actions</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">My Actions</h2>
          </div>
          <Link
            href="/rush-month/actions?source=home"
          className="text-sm font-semibold text-[#2563eb]"
        >
          See all
        </Link>
      </div>

        <div className="mt-3 grid gap-3">
          {featuredAction ? <ActionRow action={featuredAction} featured /> : null}
          {secondaryActions.map((action) => (
            <ActionRow key={action.id} action={action} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <article className="app-surface rounded-[1.8rem] p-4 sm:p-5">
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
          <Link
            href={homePointsHref}
            className="mt-4 inline-flex text-sm font-semibold text-[#2563eb]"
          >
            Leaderboard →
          </Link>
        </article>

        <article className="app-surface rounded-[1.8rem] p-4 sm:p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="app-eyebrow app-eyebrow-blue">Upcoming Events</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Upcoming Events</h2>
            </div>
            <Link
              href="/rush-month/events?source=home"
              className="text-sm font-semibold text-[#2563eb]"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {featuredEvent ? <EventRow event={featuredEvent} /> : null}
            {secondaryEvent ? <EventRow event={secondaryEvent} /> : null}
          </div>
        </article>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="app-eyebrow app-eyebrow-blue">Chapter Leaderboard</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Chapter Leaderboard</h2>
          </div>
          <Link
            href={homePointsHref}
            className="text-sm font-semibold text-[#2563eb]"
          >
            Full board
          </Link>
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
      </section>

      <section className="app-surface-warm rounded-[1.8rem] p-4 sm:p-5">
        <p className="app-eyebrow app-eyebrow-warm">Coach message</p>
        <p className="mt-3 text-sm font-semibold text-slate-900">
          {workspace.coachMessage.authorName} · {workspace.coachMessage.dateLabel}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{workspace.coachMessage.body}</p>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4 sm:p-5">
        <p className="app-eyebrow app-eyebrow-blue">Switch view</p>
        <div className="mt-4 rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-3">
          <div className="flex flex-wrap gap-2">
          {homeSurfaceJumps.map((option) => (
            <HomeSurfaceJumpCard
              key={option.label}
              actorIdentitySource={actor.identitySource}
              currentEmail={actor.selectedEmail}
              option={option}
            />
          ))}
        </div>
        </div>
      </section>
    </AppShell>
  );
}

function HeroMetaPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
      {label}
    </span>
  );
}

function ActionRow({
  action,
  featured = false,
}: {
  action: StudentHomeActionCard;
  featured?: boolean;
}) {
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
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-6 text-slate-950">{action.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Due {action.dueLabel} · {action.points} pts
          </p>
        </div>
        <StatusBadge status={action.status} />
      </div>
    </Link>
  );
}

function HomeSurfaceJumpCard({
  actorIdentitySource,
  currentEmail,
  option,
}: {
  actorIdentitySource: string;
  currentEmail: string;
  option: (typeof homeSurfaceJumps)[number];
}) {
  const isCurrent = currentEmail.toLowerCase() === option.selectedEmail.toLowerCase();
  const isAuthControlled = actorIdentitySource === "local_auth_session";

  return (
    isAuthControlled ? (
      <p className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-2 text-center text-xs font-semibold text-white/72">
        <HomeSurfaceJumpIcon label={option.label} />
        {option.label}
      </p>
    ) : (
      <Link
        href={isCurrent ? option.returnTo : buildLocalPreviewHref(option.selectedEmail, option.returnTo)}
        aria-current={isCurrent ? "page" : undefined}
        className={[
          "inline-flex items-center gap-2 rounded-full px-3 py-2.5 text-xs font-semibold transition",
          isCurrent
            ? "bg-[#f7d05e] text-[#08224c]"
            : "border border-white/14 bg-white text-slate-700 hover:border-[#dbe8ff] hover:bg-[#eef5ff] hover:text-slate-950",
        ].join(" ")}
      >
        <HomeSurfaceJumpIcon label={option.label} />
        {option.label}
      </Link>
    )
  );
}

function HomeSurfaceJumpIcon({ label }: { label: string }) {
  const iconClassName = "h-[0.9rem] w-[0.9rem]";

  switch (label) {
    case "Leader Hub":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6.5 10v9h11v-9" />
        </svg>
      );
    case "Coach View":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <circle cx="8" cy="9" r="2.5" />
          <circle cx="16" cy="8" r="2.5" />
          <path d="M4.5 18a4 4 0 0 1 7 0" />
          <path d="M13.5 17a4 4 0 0 1 6 0" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="5" y="4.5" width="14" height="15" rx="2" />
          <path d="M9 9h6" />
          <path d="M9 13h6" />
        </svg>
      );
  }
}

function EventRow({ event }: { event: StudentHomeEventCard }) {
  const isRegistered = event.rsvpState === "registered";

  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-4 transition hover:border-[#bfdbfe] hover:bg-[#f8fbff]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={event.href}
            className="text-base font-semibold text-slate-950 transition hover:text-[#1d4ed8]"
          >
            {event.title}
          </Link>
          <p className="mt-1 text-sm text-slate-500">{event.timing}</p>
          <p className="mt-1 text-sm text-slate-500">{event.locationLabel}</p>
        </div>
        {isRegistered ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
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
          ? "border-[#f7d05e]/35 bg-[#fff8df]"
          : "border-slate-200 bg-slate-50",
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
      <p className="text-sm font-semibold text-[#a16207]">{row.points} pts</p>
    </div>
  );
}
