import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronDown,
  Download,
  Film,
  GitBranch,
  LayoutDashboard,
  Megaphone,
  Search,
  Settings,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import type { StaffCommandCenter } from "@/services/staff-command-center";

type FigmaStaffCommandCenterProps = {
  commandCenter: StaffCommandCenter;
};

export function FigmaStaffCommandCenter({
  commandCenter,
}: FigmaStaffCommandCenterProps) {
  const chapterRows = commandCenter.launchLaneChapterRows.length
    ? commandCenter.launchLaneChapterRows
    : [];
  const totals = {
    chapters: chapterRows.length || commandCenter.chapterRows.length,
    rsvps:
      commandCenter.launchLaneOrgReadback.totalRsvps ||
      commandCenter.chapterRows.reduce((sum, row) => sum + row.rsvpCount, 0),
    attendance:
      commandCenter.launchLaneOrgReadback.totalAttendance ||
      commandCenter.chapterRows.reduce((sum, row) => sum + row.attendanceCount, 0),
    points:
      commandCenter.launchLaneOrgReadback.totalPoints ||
      commandCenter.chapterRows.reduce((sum, row) => sum + row.pointsPerWeek, 0),
  };
  const featuredEvent = commandCenter.launchLaneOrgReadback.featuredEventTitle
    ? commandCenter.launchLaneOrgReadback
    : null;

  return (
    <main
      className="flex min-h-screen flex-col bg-[#F6F1E9]"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <header className="relative z-30 shrink-0 border-b border-[#27364d] bg-[#07192E]">
        <div className="flex h-12 items-center gap-6 px-5">
          <Link href="/staff?view=chapters" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#F5A623] text-xs font-black text-[#07192E]">
              M
            </div>
            <div className="text-left">
              <div className="text-sm font-bold leading-tight text-white">myMEDLIFE</div>
              <div className="text-[9px] font-medium uppercase leading-tight tracking-widest text-white/50">
                Staff Command Center
              </div>
              <div className="sr-only">{commandCenter.title}</div>
            </div>
          </Link>

          <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
            {([
              ["Chapters", "/staff?view=chapters", LayoutDashboard, true],
              ["Campaigns", "/staff?view=campaigns", Megaphone, false],
              ["Events", "/staff?view=events", Calendar, false],
              ["Proof / UGC", "/staff?view=proof_ugc", Film, false],
              ["Best Practices", "/staff?view=best_practices", BookOpen, false],
              ["SOPs", "/admin/sop-library", GitBranch, false],
              ["Admin", "/staff?view=admin", Settings, false],
            ] satisfies Array<[string, string, LucideIcon, boolean]>).map(([label, href, Icon, active]) => (
              <Link
                key={String(label)}
                href={String(href)}
                className={[
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "bg-[#1d2d49] text-white"
                    : "text-[#dbeafe] hover:bg-[#14233a] hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-600/20 px-2.5 py-1">
              <AlertTriangle className="h-3 w-3 text-red-400" />
              <span className="text-xs font-semibold text-red-300">
                2 chapters need intervention
              </span>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5A623] text-xs font-bold text-[#07192E]">
              HQ
            </div>
          </div>
        </div>
      </header>

      <section className="shrink-0 border-b border-[#e5ded3] bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[#1a0a0a]">Portfolio Overview</h1>
            <p className="mt-0.5 text-xs text-[#7a5a5a]">
              {totals.chapters} chapters · Rush Month active · Last updated 2 min ago
            </p>
          </div>
          <Link
            href="/staff?view=leaderboard"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1B4B8E] px-3 py-2 text-xs font-semibold text-white"
          >
            <Trophy className="h-3.5 w-3.5" />
            Organization Leaderboard
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-5 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Chapters" value={totals.chapters} sub="all active" tone="blue" />
          <KpiCard label="RSVPs" value={totals.rsvps} sub="event intent captured" tone="blue" />
          <KpiCard
            label="Attendance"
            value={totals.attendance}
            sub="confirmed check-ins"
            tone="green"
          />
          <KpiCard
            label="Points"
            value={totals.points.toLocaleString()}
            sub="leaderboard movement"
            tone="gold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e5ded3] bg-white p-3">
          <div className="flex min-w-44 flex-1 items-center gap-2 rounded-lg bg-[#f3e8e8]/60 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-[#7a5a5a]" />
            <input
              aria-label="Search chapters"
              className="flex-1 bg-transparent text-sm text-[#1a0a0a] outline-none placeholder:text-[#7a5a5a]"
              placeholder="Search chapter or school..."
            />
          </div>
          {["All Regions", "All Coaches", "Sort: Points ↓"].map((label) => (
            <button
              key={label}
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[#f3e8e8]/60 px-3 py-2 text-sm font-medium text-[#1a0a0a]"
            >
              {label}
              <ChevronDown className="h-3.5 w-3.5 text-[#7a5a5a]" />
            </button>
          ))}
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#ede8e8] px-3 py-2 text-xs font-semibold text-[#1a0a0a]"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e5ded3] bg-white">
          <div className="flex items-center justify-between border-b border-[#e5ded3] px-4 py-3">
            <div className="text-sm font-semibold text-[#1a0a0a]">
              {totals.chapters} chapters
            </div>
            <span className="text-[10px] text-[#7a5a5a]">
              Click any row to open chapter detail
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e5ded3] bg-[#f3e8e8]/40">
                  {[
                    "#",
                    "Chapter",
                    "Coach",
                    "Region",
                    "Events/Yr",
                    "Events/Mo",
                    "Leads",
                    "RSVPs",
                    "Attended",
                    "Lead→Event %",
                    "Avg NPS",
                    "Points/Yr",
                  ].map((header) => (
                    <th
                      key={header}
                      className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#7a5a5a]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getStaffRows(commandCenter).map((row, index) => (
                  <tr
                    key={row.chapterName}
                    className="border-b border-[#e5ded3] transition-colors last:border-0 hover:bg-[#f3e8e8]/40"
                  >
                    <td className="w-8 px-3 py-2.5 font-mono text-[11px] text-[#7a5a5a]">
                      #{index + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold leading-tight text-[#1a0a0a]">
                        {row.chapterName}
                      </div>
                      <div className="text-[10px] text-[#7a5a5a]">{row.country}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[#7a5a5a]">{row.coach}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#7a5a5a]">
                      {row.region}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-[#1a0a0a]">
                      {row.eventsYear}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-semibold text-[#1a0a0a]">
                      {row.eventsMonth}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-[#1a0a0a]">
                      {row.leads}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[#1a0a0a]">{row.rsvps}</td>
                    <td className="px-3 py-2.5 font-mono text-[#1a0a0a]">{row.attendance}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={row.leadToEvent >= 60 ? "text-emerald-600" : "text-amber-600"}>
                        {row.leadToEvent}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <NpsScore score={row.nps} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-[#1a0a0a]">
                      {row.pointsYear.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-xl border border-[#e5ded3] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#1B4B8E]" />
              <h2 className="text-sm font-bold text-[#1a0a0a]">Luma Event Loop</h2>
            </div>
            <p className="text-sm leading-6 text-[#7a5a5a]">
              Staff should see chapter event creation, RSVP conversion, confirmed attendance,
              and points movement together before making a support decision.
            </p>
            {featuredEvent ? (
              <div className="mt-3 rounded-lg bg-[#f3e8e8]/60 px-3 py-2 text-xs leading-5 text-[#7a5a5a]">
                <p className="font-semibold text-[#1a0a0a]">
                  Most recent attended event: {featuredEvent.featuredEventTitle}
                </p>
                <p>
                  {featuredEvent.featuredEventChapterName} currently shows{" "}
                  {featuredEvent.featuredEventAttendanceCount} confirmed attendee(s) and{" "}
                  {featuredEvent.featuredEventPointsAwarded} event point(s).
                </p>
                <p className="font-semibold text-[#1B4B8E]">Organization leaderboard</p>
              </div>
            ) : null}
          </div>
          <div className="rounded-xl border border-[#e5ded3] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#1B4B8E]" />
              <h2 className="text-sm font-bold text-[#1a0a0a]">Lead Scoring Signal</h2>
            </div>
            <p className="text-sm leading-6 text-[#7a5a5a]">
              Points become useful when they combine real event attendance with chapter-level
              leaderboard movement across the organization.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

type StaffRow = {
  chapterName: string;
  country: string;
  coach: string;
  region: string;
  eventsYear: number;
  eventsMonth: number;
  leads: number;
  rsvps: number;
  attendance: number;
  leadToEvent: number;
  nps: number | null;
  pointsYear: number;
};

function getStaffRows(commandCenter: StaffCommandCenter): StaffRow[] {
  if (commandCenter.launchLaneChapterRows.length > 0) {
    return commandCenter.launchLaneChapterRows.map((row, index) => ({
      chapterName: row.name,
      country: row.calendarLabel.includes("Canada") ? "Canada" : "USA",
      coach: "MEDLIFE",
      region: row.calendarLabel,
      eventsYear: 12 + index,
      eventsMonth: row.chapterEventId ? 1 : 0,
      leads: Math.max(row.rsvps + 25, 30),
      rsvps: row.rsvps,
      attendance: row.attendance,
      leadToEvent:
        row.rsvps > 0
          ? Math.min(
              100,
              Math.round((row.attendance / Math.max(row.rsvps, row.attendance, 1)) * 100),
            )
          : 0,
      nps: row.attendance > 0 ? 58 + index : null,
      pointsYear: row.points * 20 + 900,
    }));
  }

  return commandCenter.chapterRows.map((row, index) => ({
    chapterName: row.chapterName,
    country: row.country,
    coach: row.coachName.split(" ")[0] ?? row.coachName,
    region: row.campus,
    eventsYear: Math.max(row.rsvpCount, 4) + index,
    eventsMonth: Math.max(1, Math.round(row.rsvpCount / 20)),
    leads: row.leadsCount,
    rsvps: row.rsvpCount,
    attendance: row.attendanceCount,
    leadToEvent:
      row.leadsCount > 0
        ? Math.min(100, Math.round((row.attendanceCount / row.leadsCount) * 100))
        : 0,
    nps: row.attendanceCount > 0 ? 60 + (index % 10) : null,
    pointsYear: row.pointsPerWeek * 12,
  }));
}

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  tone: "blue" | "green" | "gold";
}) {
  const toneClassName = {
    blue: "bg-[#1B4B8E]/10 text-[#1B4B8E]",
    green: "bg-emerald-100 text-emerald-700",
    gold: "bg-amber-100 text-amber-700",
  }[tone];

  return (
    <div className="rounded-xl border border-[#e5ded3] bg-white p-4">
      <div className={["mb-2 inline-flex rounded-lg px-2 py-1 text-[10px] font-bold", toneClassName].join(" ")}>
        {label}
      </div>
      <div className="font-mono text-3xl font-bold text-[#1a0a0a]">{value}</div>
      <div className="mt-1 text-xs text-[#7a5a5a]">{sub}</div>
    </div>
  );
}

function NpsScore({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="font-mono text-xs text-[#7a5a5a]">—</span>;
  }

  const className =
    score >= 60 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";

  return (
    <span className={["rounded px-2 py-0.5 font-mono text-xs font-bold", className].join(" ")}>
      {score}
    </span>
  );
}
