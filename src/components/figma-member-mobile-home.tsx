import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Heart,
  MapPin,
  Trophy,
  User,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { MvpMemberHome } from "@/services/mvp-event-tracking-workspace";

type FigmaMemberMobileHomeProps = {
  workspace: MvpMemberHome;
  showTravelerEntry: boolean;
};

export function FigmaMemberMobileHome({
  workspace,
  showTravelerEntry,
}: FigmaMemberMobileHomeProps) {
  const nextEvent = workspace.primaryEvent;
  const upcomingEvents = [
    {
      name: nextEvent?.title ?? "Intro GBM",
      date: nextEvent?.timing ?? "Thu Nov 15 · 6:00 PM",
      location: nextEvent?.location ?? "Ackerman 2100",
      href: nextEvent?.href ?? "/app/events",
      rsvp: nextEvent?.rsvpLabel ?? "RSVP",
    },
    {
      name: "Tabling at Bruin Walk",
      date: "Tue Nov 13 · 11:00 AM",
      location: "Bruin Walk Table 7",
      href: "/app/events",
      rsvp: "RSVP'd",
    },
  ];

  return (
    <main
      className="min-h-screen bg-[#f7f4ee] pb-24"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#f7f4ee] shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <section className="bg-[#1B4B8E] px-5 pb-8 pt-12 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                {workspace.chapterName}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold">
                {workspace.greeting} <span aria-hidden="true">👋</span>
              </h1>
              <p className="mt-1 text-sm text-blue-200">You are making a difference.</p>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="relative mt-1 rounded-xl bg-white/10 p-2.5"
            >
              <Bell size={20} className="text-white" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F5A623]" />
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-white/20 bg-white/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Zap size={13} className="text-yellow-300" />
              <p className="text-xs font-bold uppercase tracking-wide text-yellow-200">
                This Week&apos;s Priority
              </p>
            </div>
            <p className="text-[15px] font-bold leading-snug">
              Invite 3 friends to the Intro GBM
            </p>
            <p className="mt-1 text-xs text-blue-200">Rush Month · Due Nov 15 · 30 pts</p>
            <Link
              href={nextEvent?.href ?? "/rush-month/actions"}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-4 py-2 text-sm font-bold text-[#1a0a0a] transition active:scale-[0.97]"
            >
              Start next action <ArrowRight size={14} />
            </Link>
          </div>

          <Link
            href="/app/points"
            className="mt-3 flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 transition hover:bg-white/15 active:scale-[0.98]"
          >
            <div>
              <p className="text-xs font-semibold text-blue-200">My Points · Rush Month</p>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold">{workspace.pointsTotal}</span>
                <span className="text-sm font-medium text-blue-200">pts earned</span>
              </div>
              <p className="mt-0.5 text-xs text-blue-200">
                {workspace.pointsDetail} · {workspace.pointsRankLabel}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Trophy size={32} className="text-[#F5A623]" />
              <span className="text-[11px] font-semibold text-blue-100">Leaderboard →</span>
            </div>
          </Link>

          <Link
            href="/proof-library"
            className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-[#2D5016]/80 to-[#3D7A5A]/80 px-4 py-3.5 transition hover:brightness-110 active:scale-[0.98]"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-green-200">
                From the Field
              </p>
              <p className="mt-0.5 text-base font-extrabold text-white">MEDLIFE Stories</p>
              <p className="mt-0.5 max-w-[200px] text-xs leading-snug text-green-100">
                Field notes, student voices, and moments from the mission.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Heart size={26} className="fill-white/20 text-white/70" />
              <p className="text-[11px] font-semibold text-green-100">4 stories →</p>
            </div>
          </Link>
        </section>

        <section className="space-y-6 px-4 pt-5">
          <div>
            <SectionLabel>Upcoming Events</SectionLabel>
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.name}
                  href={event.href}
                  className="block rounded-2xl border border-[#e5ded3] bg-white transition active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4B8E]/10">
                      <CalendarDays size={18} className="text-[#1B4B8E]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#1a0a0a]">{event.name}</p>
                      <p className="text-xs text-[#7a5a5a]">{event.date}</p>
                      <p className="mt-0.5 flex items-center gap-0.5 text-xs text-[#7a5a5a]">
                        <MapPin size={9} className="shrink-0" />
                        {event.location}
                      </p>
                    </div>
                    {event.rsvp.includes("RSVP'd") ? (
                      <Pill label="RSVP'd" tone="green" />
                    ) : (
                      <span className="shrink-0 rounded-xl border border-[#1B4B8E]/50 px-3 py-1.5 text-xs font-bold text-[#1B4B8E]">
                        RSVP
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Active Campaign</SectionLabel>
            <Link
              href="/campaigns"
              className="block rounded-2xl border border-[#e5ded3] bg-white"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Pill label="Active" tone="green" />
                      <Pill label="Week 1 of 4" tone="blue" />
                    </div>
                    <h2 className="text-base font-bold text-[#1a0a0a]">Rush Month</h2>
                    <p className="mt-0.5 text-sm text-[#7a5a5a]">
                      Recruit new members, build your chapter.
                    </p>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-[#7a5a5a]">
                        <span>Your progress</span>
                        <span className="font-semibold">1 / 3 actions done</span>
                      </div>
                      <ProgressBar percent={33} />
                    </div>
                  </div>
                  <ArrowRight size={18} className="mt-1 shrink-0 text-[#7a5a5a]" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-b-2xl border-t border-[#e5ded3] bg-[#f3e8e8]/50 px-4 py-3">
                <span className="text-xs text-[#7a5a5a]">Chapter: 67% complete</span>
                <span className="text-xs font-semibold text-[#1B4B8E]">
                  22 / 34 members active
                </span>
              </div>
            </Link>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel className="mb-0">Take Action: My Tasks</SectionLabel>
              <Link href="/rush-month/actions" className="text-xs font-semibold text-[#1B4B8E]">
                See all
              </Link>
            </div>
            <div className="space-y-2">
              {[
                ["Invite 3 friends to the Intro GBM", "Nov 15", 30, "Not started"],
                ["Share Rush Week flyer on Instagram", "Nov 14", 20, "In progress"],
                ["Add 5 leads to the spreadsheet", "Nov 16", 25, "Submitted"],
              ].map(([title, due, points, status]) => (
                <Link
                  key={String(title)}
                  href="/rush-month/actions"
                  className="block rounded-2xl border border-[#e5ded3] bg-white"
                >
                  <div className="flex items-center gap-3 p-4">
                    {status === "Submitted" ? (
                      <Clock size={22} className="shrink-0 text-amber-500" />
                    ) : status === "In progress" ? (
                      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-[#1B4B8E]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#1B4B8E]" />
                      </span>
                    ) : (
                      <Circle size={22} className="shrink-0 text-[#d4b8b8]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-[#1a0a0a]">
                        {title}
                      </p>
                      <p className="mt-0.5 text-xs text-[#7a5a5a]">
                        Due {due} ·{" "}
                        <span className="font-semibold text-[#1B4B8E]">{points} pts</span>
                      </p>
                    </div>
                    <Pill
                      label={String(status)}
                      tone={
                        status === "Submitted"
                          ? "yellow"
                          : status === "In progress"
                          ? "blue"
                          : "gray"
                      }
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel className="mb-0">Chapter Leaderboard</SectionLabel>
              <Link href="/app/points" className="text-xs font-semibold text-[#1B4B8E]">
                Full board
              </Link>
            </div>
            <div className="rounded-2xl border border-[#e5ded3] bg-white p-4">
              {[
                ["🥇", "Aisha N.", 220, false],
                ["🥈", "Marcus T.", 185, false],
                ["🥉", "You (Sofia R.)", workspace.pointsTotal, true],
                ["4", "James L.", 130, false],
              ].map(([rank, name, points, isMe]) => (
                <div
                  key={String(name)}
                  className={[
                    "flex items-center gap-3 border-b border-[#e5ded3] py-3 last:border-0",
                    isMe ? "-mx-4 rounded-xl bg-[#1B4B8E]/5 px-4" : "",
                  ].join(" ")}
                >
                  <span className="w-6 text-center text-sm">{rank}</span>
                  <span
                    className={[
                      "flex-1 text-sm",
                      isMe ? "font-extrabold text-[#1B4B8E]" : "font-medium text-[#1a0a0a]",
                    ].join(" ")}
                  >
                    {name}
                  </span>
                  <span className="text-sm font-bold text-[#1a0a0a]">{points} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#f3e8e8] bg-[#f3e8e8]/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1B4B8E] text-xs font-extrabold text-white">
                DK
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-xs font-bold text-[#1a0a0a]">Coach David Kim</p>
                  <span className="text-xs text-[#7a5a5a]">· Nov 12</span>
                </div>
                <p className="text-sm leading-relaxed text-[#1a0a0a]">
                  &quot;Great energy this week, UCLA! Focus on Intro GBM follow-ups —
                  this is where we convert interest into members. Keep it up.&quot;
                </p>
              </div>
            </div>
          </div>

          {showTravelerEntry && workspace.travelerHref ? (
            <Link
              href={workspace.travelerHref}
              className="flex items-center justify-between rounded-2xl border border-[#e5ded3] bg-white p-4"
            >
              <div>
                <p className="text-sm font-bold text-[#1a0a0a]">SLT Prep</p>
                <p className="mt-0.5 text-xs text-[#7a5a5a]">
                  Open trip readiness, forms, flights, and deadlines.
                </p>
              </div>
              <User size={18} className="text-[#1B4B8E]" />
            </Link>
          ) : null}
        </section>

        <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 border-t border-[#e5ded3] bg-white">
          {([
            ["Home", "/app", CheckCircle2],
            ["Stories", "/proof-library", Heart],
            ["Events", "/app/events", CalendarDays],
            ["Points", "/app/points", Trophy],
            ["Profile", "/profile", User],
          ] satisfies Array<[string, string, LucideIcon]>).map(([label, href, Icon]) => (
            <Link
              key={String(label)}
              href={String(href)}
              className={[
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold",
                label === "Home" ? "text-[#1B4B8E]" : "text-[#7a5a5a]",
              ].join(" ")}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}

function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={[
        "mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#7a5a5a]",
        className,
      ].join(" ")}
    >
      {children}
    </p>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#ede8e8]">
      <div className="h-full rounded-full bg-[#1B4B8E]" style={{ width: `${percent}%` }} />
    </div>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "gray" | "blue" | "green" | "yellow";
}) {
  const toneClassName = {
    gray: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-800",
  }[tone];

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        toneClassName,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
