"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Activity,
  Award,
  BarChart3,
  Bookmark,
  BookOpen,
  Calendar,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Film,
  GitBranch,
  Globe,
  Info,
  Link2,
  LayoutDashboard,
  Megaphone,
  RotateCcw,
  Search,
  Send,
  Settings,
  Shield,
  Star,
  Trophy,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { StaffCommandCenter } from "@/services/staff-command-center";

type FigmaStaffCommandCenterProps = {
  commandCenter: StaffCommandCenter;
  requestedChapterId?: string | null;
};

type FigmaStaffNavKey =
  | "chapters"
  | "campaigns"
  | "proof_ugc"
  | "best_practices"
  | "sops"
  | "admin";

type FigmaStaffNavItem = {
  key: FigmaStaffNavKey;
  label: string;
  icon: LucideIcon;
  href: string;
};

type CampaignStatus = "on-track" | "behind" | "not-started" | "complete" | "paused";

type FigmaChapter = {
  id: string;
  name: string;
  school: string;
  country: string;
  medlifeRegion: string;
  coach: string;
  leaders: string[];
  activeMembers: number;
  campaign: string;
  campaignStatus: CampaignStatus;
  leads: number;
  rsvps: number;
  attendance: number;
  newMembers: number;
  eventsThisYear: number;
  eventsThisMonth: number;
  leadAttendancePct: number;
  avgNpsScore: number | null;
  totalPointsYear: number;
  pointsWeek: number;
  chapterType: "established" | "new" | "growing";
};

type StaffDashboardTotals = {
  chapters: number;
  rsvps: number;
  attendance: number;
  points: number;
};

type StaffFeaturedEvent = StaffCommandCenter["launchLaneOrgReadback"] | null;

const figmaStaffNavItems: FigmaStaffNavItem[] = [
  {
    key: "chapters",
    label: "Chapters",
    icon: LayoutDashboard,
    href: "/staff?view=chapters",
  },
  {
    key: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
    href: "/staff?view=campaigns",
  },
  {
    key: "proof_ugc",
    label: "Proof / UGC",
    icon: Film,
    href: "/staff?view=proof_ugc",
  },
  {
    key: "best_practices",
    label: "Best Practices",
    icon: BookOpen,
    href: "/staff?view=best_practices",
  },
  {
    key: "sops",
    label: "Campaign SOPs",
    icon: GitBranch,
    href: "/staff?view=sops",
  },
  {
    key: "admin",
    label: "Admin",
    icon: Settings,
    href: "/staff?view=admin",
  },
];

const staffScreenCopy: Record<
  StaffCommandCenter["selectedView"],
  { title: string; summary: string }
> = {
  chapters: {
    title: "Portfolio Overview",
    summary: "Rush Month active · Last updated 2 min ago",
  },
  events: {
    title: "Events",
    summary: "Luma events · RSVP conversion · attendance and points",
  },
  leaderboard: {
    title: "Organization Leaderboard",
    summary: "chapter standings · attendance points · lead scoring signal",
  },
  campaigns: {
    title: "Campaign Operations",
    summary: "Rush Month · chapter events · intervention queue",
  },
  proof_ugc: {
    title: "Proof / UGC Review Queue",
    summary: "story links · consent gates · review-only publishing posture",
  },
  feed_studio: {
    title: "Feed Studio",
    summary: "Figma page missing · implementation blocked",
  },
  feed_analytics: {
    title: "Feed Analytics",
    summary: "Figma page missing · implementation blocked",
  },
  hubspot: {
    title: "HubSpot Intelligence",
    summary: "Figma page missing · implementation blocked",
  },
  best_practices: {
    title: "Best Practices Library",
    summary: "verified playbooks · chapter recommendations · safe sharing disabled",
  },
  sops: {
    title: "Campaign SOP Builder",
    summary: "workflow configuration · read-only staging preview",
  },
  admin: {
    title: "System Health",
    summary: "integration posture · automation outbox · audit log",
  },
};

const staffCampaignNames = [
  "Rush Month",
  "SLT Promotion",
  "Moving Mountains",
  "Chapter Events",
  "Leadership Transition",
  "Chapter Organization and Planning",
  "Social Media",
];

const proofUgcItems = [
  {
    id: "ugc-ucla-rush-reel",
    title: "Rush Month kickoff reel",
    platform: "Instagram",
    chapter: "UCLA MEDLIFE",
    campaign: "Rush Month",
    visibility: "pending",
    consent: "Consent pending",
    summary: "Student-led recap showing event turnout and attendee testimonials.",
  },
  {
    id: "ugc-bc-tabling",
    title: "Tabling best-practice clip",
    platform: "TikTok",
    chapter: "Boston College MEDLIFE",
    campaign: "Chapter Events",
    visibility: "chapter",
    consent: "Consent cleared",
    summary: "Short clip showing QR check-in and points leaderboard callout.",
  },
  {
    id: "ugc-yale-info-night",
    title: "Info Night photo set",
    platform: "Google Drive",
    chapter: "Yale MEDLIFE",
    campaign: "Rush Month",
    visibility: "rejected",
    consent: "Needs replacement release",
    summary: "Private photos cannot be reused until consent is corrected.",
  },
] as const;

const bestPracticeCards = [
  {
    id: "bp-qr-checkin",
    type: "Event Ops",
    title: "QR check-in at the entrance",
    chapter: "UCLA MEDLIFE",
    country: "USA",
    campaign: "Rush Month",
    engagementScore: 94,
    why: "Leaders reminded students to RSVP before the event and scan at the door, which made attendance and points clean.",
    kpiResult: "+38% RSVP-to-attendance conversion",
    recommended: ["Boston College", "Yale", "McGill"],
  },
  {
    id: "bp-leaderboard-moment",
    type: "Points",
    title: "Show rank movement during announcements",
    chapter: "Boston College MEDLIFE",
    country: "USA",
    campaign: "Chapter Events",
    engagementScore: 88,
    why: "The leaderboard became a quick reason to complete follow-up tasks before leaving the event.",
    kpiResult: "+420 points in one event week",
    recommended: ["UCLA", "PUCP Lima", "Toronto"],
  },
  {
    id: "bp-luma-copy",
    type: "Luma",
    title: "Use one clear Luma event title pattern",
    chapter: "McGill MEDLIFE",
    country: "Canada",
    campaign: "Social Media",
    engagementScore: 81,
    why: "Consistent naming helped staff reconcile imported events and chapter-level standings.",
    kpiResult: "0 duplicate event imports",
    recommended: ["All pilot chapters"],
  },
] as const;

export function FigmaStaffCommandCenter({
  commandCenter,
  requestedChapterId = null,
}: FigmaStaffCommandCenterProps) {
  const chapters = useMemo(() => getFigmaChapters(commandCenter), [commandCenter]);
  const totals = getDashboardTotals(commandCenter, chapters);
  const featuredEvent = commandCenter.launchLaneOrgReadback.featuredEventTitle
    ? commandCenter.launchLaneOrgReadback
    : null;
  const selectedView = commandCenter.selectedView;
  const screenCopy = staffScreenCopy[selectedView];

  return (
    <main
      className="flex min-h-screen flex-col bg-background"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <header className="relative z-30 shrink-0 border-b border-sidebar-border bg-sidebar">
        <div className="flex h-12 items-center gap-6 px-5">
          <Link
            href="/staff?view=chapters"
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded bg-accent text-xs font-black text-sidebar">
              M
            </div>
            <div className="text-left">
              <div className="text-sm font-bold leading-tight text-white">myMEDLIFE</div>
              <div className="text-[9px] font-medium uppercase leading-tight tracking-widest text-sidebar-foreground/50">
                Staff Command Center
              </div>
              <div className="sr-only">{commandCenter.title}</div>
            </div>
          </Link>

          <nav
            aria-label="Staff workspace menu"
            className="flex flex-1 items-center gap-0.5 overflow-x-auto"
          >
            {figmaStaffNavItems.map(({ key, label, href, icon: Icon }) => {
              const active = selectedView === key;
              const className = [
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <Link
                  key={key}
                  href={href}
                  className={className}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-600/20 px-2.5 py-1 sm:flex">
              <AlertTriangle className="h-3 w-3 text-red-400" />
              <span className="text-xs font-semibold text-red-300">
                2 chapters need intervention
              </span>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-sidebar">
              HQ
            </div>
          </div>
        </div>
      </header>

      <section className="flex shrink-0 items-center justify-between border-b border-border bg-white px-6 py-3">
        <div>
          <h1 className="text-base font-bold text-foreground">{screenCopy.title}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {selectedView === "chapters" ? `${chapters.length} chapters · ` : ""}
            {screenCopy.summary}
          </p>
        </div>
        <div className="text-xs font-mono text-muted-foreground">Jul 4, 2026 · staging</div>
      </section>

      <section className="flex flex-1 flex-col overflow-auto">
        <div className="mx-auto w-full max-w-[1600px] px-6 py-5">
          {selectedView === "chapters" ? (
            <PortfolioOverviewContent
              chapters={chapters}
              featuredEvent={featuredEvent}
              initialSelectedChapterId={commandCenter.selectedChapterId ?? requestedChapterId}
            />
          ) : null}
          {selectedView === "events" ? (
            <StaffEventsContent commandCenter={commandCenter} totals={totals} />
          ) : null}
          {selectedView === "leaderboard" ? (
            <StaffLeaderboardContent commandCenter={commandCenter} totals={totals} />
          ) : null}
          {selectedView === "campaigns" ? <StaffCampaignsContent chapters={chapters} /> : null}
          {selectedView === "proof_ugc" ? <StaffProofUgcContent /> : null}
          {selectedView === "best_practices" ? <StaffBestPracticesContent /> : null}
          {selectedView === "sops" ? <StaffSopsContent /> : null}
          {selectedView === "admin" ? (
            <StaffAdminFigmaContent commandCenter={commandCenter} />
          ) : null}
          {selectedView === "feed_studio" ||
          selectedView === "feed_analytics" ||
          selectedView === "hubspot" ? (
            <FigmaMissingRouteContent view={selectedView} />
          ) : null}
        </div>
      </section>
    </main>
  );
}

function PortfolioOverviewContent({
  chapters,
  featuredEvent,
  initialSelectedChapterId,
}: {
  chapters: FigmaChapter[];
  featuredEvent: StaffFeaturedEvent;
  initialSelectedChapterId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [coachFilter, setCoachFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "nps" | "events" | "leads" | "leadPct" | "points">(
    "name",
  );
  const [selectedChapter, setSelectedChapter] = useState<FigmaChapter | null>(
    () => chapters.find((chapter) => chapter.id === initialSelectedChapterId) ?? null,
  );
  const [showSurvey, setShowSurvey] = useState(false);

  const regions = useMemo(
    () => ["all", ...Array.from(new Set(chapters.map((chapter) => chapter.medlifeRegion))).sort()],
    [chapters],
  );
  const coaches = useMemo(
    () => ["all", ...Array.from(new Set(chapters.map((chapter) => chapter.coach))).sort()],
    [chapters],
  );
  const filtered = useMemo(() => {
    let list = chapters.filter((chapter) => {
      const searchText = `${chapter.name} ${chapter.school}`.toLowerCase();

      if (search && !searchText.includes(search.toLowerCase())) {
        return false;
      }

      if (regionFilter !== "all" && chapter.medlifeRegion !== regionFilter) {
        return false;
      }

      if (coachFilter !== "all" && chapter.coach !== coachFilter) {
        return false;
      }

      return true;
    });

    if (sortBy === "nps") {
      list = [...list].sort((a, b) => (b.avgNpsScore ?? -999) - (a.avgNpsScore ?? -999));
    }
    if (sortBy === "events") {
      list = [...list].sort((a, b) => b.eventsThisYear - a.eventsThisYear);
    }
    if (sortBy === "leads") {
      list = [...list].sort((a, b) => b.leads - a.leads);
    }
    if (sortBy === "leadPct") {
      list = [...list].sort((a, b) => b.leadAttendancePct - a.leadAttendancePct);
    }
    if (sortBy === "points") {
      list = [...list].sort((a, b) => b.totalPointsYear - a.totalPointsYear);
    }

    return list;
  }, [chapters, coachFilter, regionFilter, search, sortBy]);

  const avgEventsPerMonth = (
    chapters.reduce((sum, chapter) => sum + chapter.eventsThisMonth, 0) /
    Math.max(chapters.length, 1)
  ).toFixed(1);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <KPICard label="Chapters" value={chapters.length} sub="all active" color="blue" />
        <KPICard
          label="Avg Events / Month"
          value={avgEventsPerMonth}
          sub="per chapter average"
          color="blue"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3">
        <div className="flex min-w-44 flex-1 items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            aria-label="Search chapter or school"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search chapter or school…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {search ? (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          ) : null}
        </div>
        <div className="relative">
          <select
            aria-label="Filter by region"
            value={regionFilter}
            onChange={(event) => setRegionFilter(event.target.value)}
            className="cursor-pointer appearance-none rounded-lg bg-muted/60 px-3 py-2 pr-7 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Regions</option>
            {regions
              .filter((region) => region !== "all")
              .map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="relative">
          <select
            aria-label="Filter by coach"
            value={coachFilter}
            onChange={(event) => setCoachFilter(event.target.value)}
            className="cursor-pointer appearance-none rounded-lg bg-muted/60 px-3 py-2 pr-7 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Coaches</option>
            {coaches
              .filter((coach) => coach !== "all")
              .map((coach) => (
                <option key={coach} value={coach}>
                  {coach}
                </option>
              ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="relative">
          <select
            aria-label="Sort chapters"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            className="cursor-pointer appearance-none rounded-lg bg-muted/60 px-3 py-2 pr-7 text-sm font-medium text-foreground outline-none"
          >
            <option value="name">Sort: Name</option>
            <option value="nps">Sort: NPS ↓</option>
            <option value="events">Sort: Events ↓</option>
            <option value="leads">Sort: Leads ↓</option>
            <option value="leadPct">Sort: Lead % ↓</option>
            <option value="points">Sort: Points ↓</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
        <button
          type="button"
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-foreground">
            {filtered.length} chapters
            {filtered.length !== chapters.length ? (
              <span className="ml-1 font-normal text-muted-foreground">filtered</span>
            ) : null}
          </div>
          <span className="text-[10px] text-muted-foreground">Click any row to open chapter detail</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
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
                    className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((chapter, index) => {
                const pctColor =
                  chapter.leadAttendancePct >= 65
                    ? "text-emerald-600"
                    : chapter.leadAttendancePct >= 45
                      ? "text-amber-600"
                      : "text-red-500";

                return (
                  <tr
                    key={chapter.id}
                    onClick={() => setSelectedChapter(chapter)}
                    className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-secondary/40"
                  >
                    <td className="w-8 px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                      #{index + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                        {chapter.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{chapter.country}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                      {chapter.coach.split(" ")[0]}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-muted-foreground">
                      {chapter.medlifeRegion}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-foreground">
                      {chapter.eventsThisYear}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={[
                          "font-mono font-semibold",
                          chapter.eventsThisMonth === 0
                            ? "text-muted-foreground"
                            : "text-foreground",
                        ].join(" ")}
                      >
                        {chapter.eventsThisMonth}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-foreground">
                      {chapter.leads}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-foreground">{chapter.rsvps}</td>
                    <td className="px-3 py-2.5 font-mono text-foreground">{chapter.attendance}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={["font-mono font-bold", pctColor].join(" ")}>
                        {chapter.leadAttendancePct}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <NpsScore score={chapter.avgNpsScore} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">
                      {(chapter.totalPointsYear / 1000).toFixed(1)}k
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {featuredEvent ? (
        <div className="rounded-xl border border-border bg-white px-4 py-3 text-xs leading-5 text-muted-foreground">
          <span className="font-semibold text-foreground">
            Most recent attended event: {featuredEvent.featuredEventTitle}.
          </span>{" "}
          {featuredEvent.featuredEventChapterName} shows{" "}
          {featuredEvent.featuredEventAttendanceCount} confirmed attendee(s) and{" "}
          {featuredEvent.featuredEventPointsAwarded} event point(s).
        </div>
      ) : null}

      {selectedChapter ? (
        <ChapterDetailDrawer
          chapter={selectedChapter}
          onClose={() => setSelectedChapter(null)}
          onShowSurvey={() => setShowSurvey(true)}
        />
      ) : null}
      {showSurvey ? <NPSSurveyPreview onClose={() => setShowSurvey(false)} /> : null}
    </div>
  );
}

function ChapterDetailDrawer({
  chapter,
  onClose,
  onShowSurvey,
}: {
  chapter: FigmaChapter;
  onClose: () => void;
  onShowSurvey: () => void;
}) {
  const [note, setNote] = useState("");
  const recentEvents = [
    {
      name: "Rush Month Info Night",
      date: "Jun 14",
      attendees: chapter.attendance,
      nps: chapter.avgNpsScore,
    },
    {
      name: "Tabling — Main Quad",
      date: "Jun 7",
      attendees: Math.round(chapter.attendance * 0.6),
      nps: chapter.avgNpsScore ? chapter.avgNpsScore - 6 : null,
    },
    {
      name: "MEDLIFE Info Session",
      date: "May 28",
      attendees: Math.round(chapter.attendance * 0.8),
      nps: chapter.avgNpsScore ? chapter.avgNpsScore + 4 : null,
    },
  ].slice(0, Math.min(chapter.eventsThisYear, 3));

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[580px] flex-col border-l border-border bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between border-b border-border bg-white px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Chapter Detail
              </span>
              <CampaignBadge status={chapter.campaignStatus} />
            </div>
            <h2 className="text-base font-bold text-foreground">{chapter.name}</h2>
            <div className="text-xs text-muted-foreground">{chapter.school}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {chapter.country}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {chapter.activeMembers} members
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {chapter.eventsThisYear} events this year
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-muted"
            aria-label="Close chapter detail"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                label: "Events / Year",
                value: chapter.eventsThisYear,
                accent: "bg-primary/10 text-primary",
              },
              {
                label: "Events / Month",
                value: chapter.eventsThisMonth,
                accent: "bg-primary/10 text-primary",
              },
              {
                label: "Total Leads",
                value: chapter.leads,
                accent: "bg-foreground/8 text-foreground",
              },
              {
                label: "Points / Year",
                value: `${(chapter.totalPointsYear / 1000).toFixed(1)}k`,
                accent: "bg-amber-100 text-amber-700",
              },
            ].map((metric) => (
              <div key={metric.label} className={`rounded-xl p-3 text-center ${metric.accent}`}>
                <div className="text-xl font-mono font-bold leading-none">{metric.value}</div>
                <div className="mt-1 text-[10px] font-medium leading-tight opacity-70">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
              <span className="text-xs font-semibold text-foreground">Lead → Event Funnel</span>
              <span
                className={[
                  "text-sm font-mono font-bold",
                  chapter.leadAttendancePct >= 60
                    ? "text-emerald-600"
                    : chapter.leadAttendancePct >= 40
                      ? "text-amber-600"
                      : "text-red-500",
                ].join(" ")}
              >
                {chapter.leadAttendancePct}% of leads attended
              </span>
            </div>
            <div className="flex items-end gap-3 px-4 py-3">
              {[
                { label: "Leads", n: chapter.leads, pct: 100, color: "bg-primary/70" },
                {
                  label: "RSVPs",
                  n: chapter.rsvps,
                  pct: Math.round((chapter.rsvps / Math.max(chapter.leads, 1)) * 100),
                  color: "bg-primary/40",
                },
                {
                  label: "Attended",
                  n: chapter.attendance,
                  pct: Math.round((chapter.attendance / Math.max(chapter.leads, 1)) * 100),
                  color: "bg-emerald-500",
                },
                {
                  label: "New Mbrs",
                  n: chapter.newMembers,
                  pct: Math.round((chapter.newMembers / Math.max(chapter.leads, 1)) * 100),
                  color: "bg-amber-400",
                },
              ].map((step) => (
                <div key={step.label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-mono font-bold text-foreground">{step.n}</span>
                  <div
                    className={`w-full rounded-t ${step.color}`}
                    style={{ height: Math.max(step.pct * 0.5, 4) }}
                  />
                  <span className="text-center text-[9px] leading-tight text-muted-foreground">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
              <span className="text-xs font-semibold text-foreground">Post-Event NPS</span>
              <button
                type="button"
                onClick={onShowSurvey}
                className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
              >
                <Eye className="h-3 w-3" />
                Preview Survey
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="mb-3 flex items-center gap-5">
                <div className="text-center">
                  <div className="mb-1 text-[10px] text-muted-foreground">Avg NPS</div>
                  <NpsScore score={chapter.avgNpsScore} />
                </div>
                <div className="text-center">
                  <div className="mb-1 text-[10px] text-muted-foreground">Surveys Sent</div>
                  <div className="text-sm font-mono font-bold text-foreground">
                    {chapter.eventsThisYear}
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-[10px] text-muted-foreground">Response Rate</div>
                  <div className="text-sm font-mono font-bold text-foreground">
                    {chapter.eventsThisYear > 0
                      ? `${Math.min(94, 58 + chapter.eventsThisYear)}%`
                      : "—"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onShowSurvey}
                  className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  <Send className="h-3 w-3" />
                  Send NPS Survey
                </button>
              </div>
              {recentEvents.length > 0 ? (
                <div className="space-y-1.5">
                  {recentEvents.map((event) => (
                    <div
                      key={`${event.name}-${event.date}`}
                      className="flex items-center gap-3 border-t border-border py-1.5 first:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-foreground">
                          {event.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {event.date} · {event.attendees} attendees
                        </div>
                      </div>
                      <NpsScore score={event.nps} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-1 text-center text-xs italic text-muted-foreground">
                  No events yet — NPS will appear after the first event.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary p-3.5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Active Campaigns
              </div>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="text-xs font-semibold leading-tight text-foreground">
                  {chapter.campaign}
                </div>
                <CampaignBadge status={chapter.campaignStatus} />
              </div>
              {chapter.chapterType === "established" ? (
                <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                  <div className="text-xs font-medium leading-tight text-muted-foreground">
                    Chapter Engagement
                  </div>
                  <CampaignBadge status="on-track" />
                </div>
              ) : null}
              {chapter.eventsThisYear >= 18 ? (
                <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                  <div className="text-xs font-medium leading-tight text-muted-foreground">
                    Grow the Movement
                  </div>
                  <CampaignBadge status="on-track" />
                </div>
              ) : null}
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3.5">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                Points / Year
              </div>
              <div className="text-2xl font-mono font-bold text-amber-600">
                {chapter.totalPointsYear.toLocaleString()}
              </div>
              <div className="mt-0.5 text-[10px] text-amber-500">
                +{chapter.pointsWeek.toLocaleString()} this week
              </div>
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl border border-border p-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Coach
              </div>
              <div className="mt-0.5 text-sm font-semibold text-foreground">{chapter.coach}</div>
            </div>
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Leaders
              </div>
              <div className="flex flex-wrap gap-1.5">
                {chapter.leaders.map((leader) => (
                  <span
                    key={leader}
                    className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    {leader}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Coach Note
            </div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={`Notes for ${chapter.name}…`}
              className="w-full resize-none rounded-lg border border-border bg-muted/50 p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              rows={3}
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-border p-4">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" />
            Send Content
          </button>
          <button
            type="button"
            onClick={onShowSurvey}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-secondary py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Star className="h-3.5 w-3.5" />
            Send NPS Survey
          </button>
        </div>
      </aside>
    </div>
  );
}

function NPSSurveyPreview({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative" onClick={(event) => event.stopPropagation()}>
        <div className="w-[300px] overflow-hidden rounded-3xl border-[3px] border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-2 bg-primary px-4 py-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-[9px] font-black text-sidebar">
              M
            </div>
            <span className="text-xs font-bold text-white">myMEDLIFE</span>
          </div>
          {!submitted ? (
            <div className="space-y-4 p-5">
              <div>
                <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick Event Feedback
                </div>
                <p className="text-center text-sm font-semibold leading-snug text-foreground">
                  How likely are you to recommend MEDLIFE to a friend?
                </p>
              </div>
              <div>
                <div className="mb-1.5 grid grid-cols-11 gap-0.5">
                  {Array.from({ length: 11 }, (_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelected(index)}
                      className={[
                        "rounded py-1.5 text-xs font-bold transition-all",
                        selected === index
                          ? index >= 9
                            ? "bg-emerald-500 text-white"
                            : index >= 7
                              ? "bg-sky-500 text-white"
                              : "bg-red-400 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/70",
                      ].join(" ")}
                    >
                      {index}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>
              <textarea
                placeholder="What stood out? (optional)"
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                disabled={selected === null}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-30"
              >
                Submit
              </button>
              <p className="text-center text-[10px] text-muted-foreground">
                Takes &lt;30 sec · Sent automatically after every event
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-8 text-center">
              <div className="text-3xl">Thank you</div>
              <div className="text-sm font-bold text-foreground">Feedback recorded</div>
              <div className="text-xs leading-relaxed text-muted-foreground">
                Your feedback helps MEDLIFE improve every event.
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 text-center">
          <span className="rounded-full bg-black/30 px-3 py-1 text-xs text-white/80">
            Students receive this after every event
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-lg hover:bg-muted"
          aria-label="Close survey preview"
        >
          <X className="h-3.5 w-3.5 text-foreground" />
        </button>
      </div>
    </div>
  );
}

function StaffMetricGrid({ totals }: { totals: StaffDashboardTotals }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KPICard label="Chapters" value={totals.chapters} sub="all active" color="blue" />
      <KPICard label="RSVPs" value={totals.rsvps} sub="event intent captured" color="blue" />
      <KPICard label="Attendance" value={totals.attendance} sub="confirmed check-ins" color="green" />
      <KPICard
        label="Points"
        value={totals.points.toLocaleString()}
        sub="leaderboard movement"
        color="yellow"
      />
    </div>
  );
}

type StaffEventOperationRow = {
  chapterName: string;
  calendarLabel: string;
  nextEvent: string;
  rsvps: number;
  attendance: number;
  points: number;
  risk: string;
};

function StaffEventsContent({
  commandCenter,
  totals,
}: {
  commandCenter: StaffCommandCenter;
  totals: StaffDashboardTotals;
}) {
  const rows = getEventOperationRows(commandCenter);

  return (
    <div className="flex flex-col gap-5">
      <StaffMetricGrid totals={totals} />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <StaffInfoCard
          icon={Calendar}
          title="Luma Event Operations"
          body="This is the staff view of the live pilot loop: Luma event visibility, RSVP intent, attendance confirmation, and the point award that follows."
        />
        <StaffInfoCard
          icon={AlertTriangle}
          title="Integration Safety Gate"
          body={`${commandCenter.safetyNote} UGC, arbitrary embeds, outbound reminders, and production syncs remain blocked until approved.`}
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-foreground">Chapter event posture</div>
          <span className="text-[10px] text-muted-foreground">Luma → RSVP → attendance → points</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Chapter", "Luma Calendar", "Next Event", "RSVPs", "Attended", "Points", "Risk"].map(
                  (header) => (
                    <th
                      key={header}
                      className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.chapterName}
                  className="border-b border-border transition-colors last:border-0 hover:bg-secondary/40"
                >
                  <td className="px-3 py-2.5 font-semibold text-foreground">{row.chapterName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.calendarLabel}</td>
                  <td className="min-w-48 px-3 py-2.5 text-foreground">{row.nextEvent}</td>
                  <td className="px-3 py-2.5 font-mono text-foreground">{row.rsvps}</td>
                  <td className="px-3 py-2.5 font-mono text-foreground">{row.attendance}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-primary">
                    {row.points.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                      {row.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StaffLeaderboardContent({
  commandCenter,
  totals,
}: {
  commandCenter: StaffCommandCenter;
  totals: StaffDashboardTotals;
}) {
  const rows = getOrgLeaderboardRows(commandCenter);

  return (
    <div className="flex flex-col gap-5">
      <StaffMetricGrid totals={totals} />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <StaffInfoCard
          icon={Trophy}
          title="Organization Leaderboard"
          body="Staff can compare chapters by event attendance points and use movement in the standings as an early lead-scoring signal."
        />
        <StaffInfoCard
          icon={BarChart3}
          title="Lead Scoring Signal"
          body="The top launch metric stays simple: chapters that create events, convert RSVPs into attendance, and earn points are warmer leads for coach follow-up."
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-foreground">Chapter standings</div>
          <span className="text-[10px] text-muted-foreground">Organization-wide points</span>
        </div>
        <div className="divide-y divide-border">
          {rows.map((row, index) => (
            <div
              key={row.chapterName}
              className="grid grid-cols-[3rem_1fr_auto_auto] items-center gap-3 px-4 py-3 text-xs"
            >
              <div className="font-mono text-lg font-bold text-primary">#{index + 1}</div>
              <div>
                <div className="font-semibold text-foreground">{row.chapterName}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {row.eventCount} event(s) · {row.statusLabel}
                </div>
              </div>
              <div className="hidden text-right text-[10px] uppercase tracking-wide text-muted-foreground sm:block">
                Points
              </div>
              <div className="font-mono text-lg font-bold text-foreground">
                {row.points.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StaffCampaignsContent({ chapters }: { chapters: FigmaChapter[] }) {
  const [activeCampaign, setActiveCampaign] = useState("Rush Month");
  const [regionFilter, setRegionFilter] = useState("all");
  const [coachFilter, setCoachFilter] = useState("all");

  const campaignChapters =
    activeCampaign === "Rush Month" ||
    activeCampaign === "Social Media" ||
    activeCampaign === "Chapter Events"
      ? chapters
      : chapters.filter((chapter) => chapter.campaign === activeCampaign);
  const atRiskChapters = campaignChapters.filter(
    (chapter) => chapter.eventsThisMonth === 0 || chapter.attendance < 10,
  );
  const regions = [
    "all",
    ...Array.from(new Set(campaignChapters.map((chapter) => chapter.medlifeRegion))).sort(),
  ];
  const coaches = [
    "all",
    ...Array.from(new Set(campaignChapters.map((chapter) => chapter.coach))).sort(),
  ];
  const filtered = campaignChapters.filter((chapter) => {
    if (regionFilter !== "all" && chapter.medlifeRegion !== regionFilter) {
      return false;
    }

    if (coachFilter !== "all" && chapter.coach !== coachFilter) {
      return false;
    }

    return true;
  });
  const suggestions = [
    "Schedule a tabling or info event within the next 7 days",
    "Contact chapter leaders directly by their approved staff channel",
    "Review the chapter event planning checklist in myMEDLIFE",
    "Book a 15-minute coach check-in call to unblock the chapter",
    "Share a verified best-practice post from a high-performing chapter",
    "Check if an SOP step is blocking event creation or approval",
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {staffCampaignNames.map((campaign) => (
          <button
            key={campaign}
            type="button"
            onClick={() => {
              setActiveCampaign(campaign);
              setRegionFilter("all");
              setCoachFilter("all");
            }}
            className={[
              "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              activeCampaign === campaign
                ? "bg-primary text-white shadow-sm"
                : "border border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground",
            ].join(" ")}
          >
            {campaign}
          </button>
        ))}
      </div>

      {atRiskChapters.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-amber-800">
                {atRiskChapters.length} chapter{atRiskChapters.length === 1 ? "" : "s"} at risk
              </div>
              <div className="mt-0.5 text-xs text-amber-700">
                No events in the last month or attendance below 10.
              </div>
              <div className="mt-1 truncate text-xs text-amber-700">
                {atRiskChapters.map((chapter) => chapter.name).join(", ")}
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-amber-600">
              <Info className="h-3 w-3" />
              Review suggestions
            </span>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Suggested Actions for At-Risk Chapters</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((suggestion, index) => (
              <div key={suggestion} className="rounded-lg bg-muted/50 p-3 text-xs text-foreground">
                <span className="mr-2 font-mono font-bold text-primary">0{index + 1}</span>
                {suggestion}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Campaign Filters</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledSelect
              label="Region"
              value={regionFilter}
              onChange={setRegionFilter}
              options={regions}
              allLabel="All Regions"
            />
            <LabeledSelect
              label="Coach"
              value={coachFilter}
              onChange={setCoachFilter}
              options={coaches}
              allLabel="All Coaches"
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            This screen is read-only in staging. Event creation and outbound campaign nudges remain
            behind the approved Luma/write gates.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-foreground">{activeCampaign} chapters</div>
          <span className="text-[10px] text-muted-foreground">
            {filtered.length} visible · Luma, RSVP, attendance, points
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Chapter", "Coach", "Events/Mo", "RSVPs", "Attended", "Points/Yr", "Status"].map(
                  (header) => (
                    <th
                      key={header}
                      className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((chapter) => (
                <tr key={chapter.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-foreground">{chapter.name}</div>
                    <div className="text-[10px] text-muted-foreground">{chapter.medlifeRegion}</div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{chapter.coach}</td>
                  <td className="px-3 py-2.5 font-mono text-foreground">
                    {chapter.eventsThisMonth}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-foreground">{chapter.rsvps}</td>
                  <td className="px-3 py-2.5 font-mono text-foreground">{chapter.attendance}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-primary">
                    {chapter.totalPointsYear.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <CampaignBadge status={chapter.campaignStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StaffProofUgcContent() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const filtered = proofUgcItems.filter((item) => {
    if (statusFilter !== "all" && item.visibility !== statusFilter) {
      return false;
    }

    if (platformFilter !== "all" && item.platform !== platformFilter) {
      return false;
    }

    return true;
  });
  const platforms = ["all", ...Array.from(new Set(proofUgcItems.map((item) => item.platform)))];
  const pendingCount = proofUgcItems.filter((item) => item.visibility === "pending").length;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Submit a story link</span>
            <span className="text-xs text-muted-foreground">
              paste from LinkedIn, Instagram, Facebook, Loom, YouTube, TikTok
            </span>
          </div>
          <div className="flex gap-2">
            <input
              aria-label="Story link review input"
              disabled
              placeholder="https://www.instagram.com/p/..."
              className="flex-1 rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm text-muted-foreground outline-none"
            />
            <button
              type="button"
              disabled
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white opacity-45"
            >
              <Send className="h-3.5 w-3.5" />
              Review only
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Link fetching, uploads, embeds, and publishing are disabled until consent and security
            gates are approved.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SegmentedFilter
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { key: "all", label: `All (${proofUgcItems.length})` },
              { key: "pending", label: `Pending (${pendingCount})` },
              { key: "chapter", label: "Approved" },
              { key: "rejected", label: "Rejected" },
            ]}
          />
          <LabeledSelect
            label="Platform"
            value={platformFilter}
            onChange={setPlatformFilter}
            options={platforms}
            allLabel="All Platforms"
          />
        </div>

        <div className="grid gap-3">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-xl border border-border bg-white p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-primary" />
                    <h2 className="font-semibold text-foreground">{item.title}</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.chapter} · {item.campaign} · {item.platform}
                  </p>
                </div>
                <ProofStatusPill status={item.visibility} />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{item.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded bg-secondary px-2 py-1 text-[10px] font-semibold text-primary">
                  {item.consent}
                </span>
                <span className="rounded bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                  No external publish
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Queue Summary
          </div>
          {[
            { label: "Pending review", value: pendingCount, color: "text-amber-600" },
            {
              label: "Approved",
              value: proofUgcItems.filter((item) => item.visibility === "chapter").length,
              color: "text-emerald-600",
            },
            {
              label: "Rejected",
              value: proofUgcItems.filter((item) => item.visibility === "rejected").length,
              color: "text-red-500",
            },
            {
              label: "Consent pending",
              value: proofUgcItems.filter((item) => item.consent.includes("pending")).length,
              color: "text-amber-600",
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className={`font-mono text-sm font-bold ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>
        <StaffInfoCard
          icon={Shield}
          title="Consent & Visibility"
          body="Every proof item stays private until consent, moderation, and destination rules are explicitly approved."
        />
      </aside>
    </div>
  );
}

function StaffBestPracticesContent() {
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const regions = ["all", "USA", "Canada", "Peru", "International"];
  const campaigns = ["all", ...Array.from(new Set(bestPracticeCards.map((card) => card.campaign)))];
  const filtered = bestPracticeCards.filter((card) => {
    if (campaignFilter !== "all" && card.campaign !== campaignFilter) {
      return false;
    }

    if (regionFilter !== "all" && card.country !== regionFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white p-3">
        <LabeledSelect
          label="Campaign"
          value={campaignFilter}
          onChange={setCampaignFilter}
          options={campaigns}
          allLabel="All Campaigns"
        />
        <LabeledSelect
          label="Region"
          value={regionFilter}
          onChange={setRegionFilter}
          options={regions}
          allLabel="All Regions"
        />
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} best practices
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((card) => (
          <article
            key={card.id}
            className="overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between border-b border-border p-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Award className="h-4 w-4 shrink-0 text-accent" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                    {card.type}
                  </span>
                </div>
                <h2 className="font-bold leading-tight text-foreground">{card.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.chapter} · {card.country} · {card.campaign}
                </p>
              </div>
              <div className="ml-3 shrink-0 text-right">
                <div className="text-xs text-muted-foreground">Eng. Score</div>
                <div className="font-mono text-2xl font-bold text-primary">
                  {card.engagementScore}
                </div>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Why it worked
                </div>
                <p className="text-xs leading-relaxed text-foreground">{card.why}</p>
              </div>
              <div className="rounded border border-emerald-100 bg-emerald-50 px-3 py-2">
                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                  KPI Result
                </div>
                <div className="text-xs font-bold text-emerald-800">{card.kpiResult}</div>
              </div>
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommended for
                </div>
                <div className="flex flex-wrap gap-1">
                  {card.recommended.map((chapter) => (
                    <span
                      key={chapter}
                      className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-primary"
                    >
                      {chapter}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button
                type="button"
                disabled
                className="flex flex-1 items-center justify-center gap-1 rounded bg-primary py-1.5 text-xs font-semibold text-white opacity-45"
              >
                <Send className="h-3 w-3" />
                Share to Feed
              </button>
              <button
                type="button"
                disabled
                className="flex flex-1 items-center justify-center gap-1 rounded bg-muted py-1.5 text-xs font-semibold text-foreground opacity-70"
              >
                <Bookmark className="h-3 w-3" />
                Save
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function StaffSopsContent() {
  const [activeTab, setActiveTab] = useState("steps");
  const tabs = ["steps", "role-matrix", "completion", "points-kpi", "comms", "preview", "version"];

  return (
    <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
      <aside className="space-y-3">
        {["Rush Month", "SLT Promotion", "Chapter Events"].map((campaign, index) => (
          <div
            key={campaign}
            className={[
              "rounded-xl border bg-white p-4",
              index === 0 ? "border-primary/30 ring-2 ring-primary/10" : "border-border",
            ].join(" ")}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">{campaign}</h2>
              <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                draft
              </span>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Structured SOP template with phases, role actions, evidence, points, and KPI rules.
            </p>
          </div>
        ))}
      </aside>

      <section className="rounded-xl border border-border bg-white">
        <div className="border-b border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Campaign SOP Builder</h2>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              publishing disabled
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === tab
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {formatSopTabLabel(tab)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-3">
          {getSopTabRows(activeTab).map((row) => (
            <div key={row.title} className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{row.title}</h3>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{row.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StaffAdminFigmaContent({ commandCenter }: { commandCenter: StaffCommandCenter }) {
  const integrations = [
    { name: "HubSpot CRM", status: "off", lastSync: "not enabled" },
    { name: "Luma Events", status: "read-only", lastSync: "staging readback" },
    { name: "Data Hub / Warehouse", status: "off", lastSync: "not enabled" },
    { name: "Power BI Reports", status: "off", lastSync: "not enabled" },
    { name: "n8n Automation", status: "off", lastSync: "not enabled" },
    { name: "AI Summary Engine", status: "mock", lastSync: "local only" },
  ];
  const outbox = [
    {
      event: "luma.calendar.read",
      source: "Luma",
      destination: "myMEDLIFE",
      status: "read-only",
      retries: 0,
      error: "none",
    },
    {
      event: "rsvp.confirmed",
      source: "myMEDLIFE",
      destination: "Luma",
      status: "blocked",
      retries: 0,
      error: "write gate required",
    },
    {
      event: "points.materialized",
      source: "myMEDLIFE",
      destination: "warehouse",
      status: "blocked",
      retries: 0,
      error: "export disabled",
    },
  ];
  const auditRows = [
    { actor: "system", role: "System", action: "Rendered staff admin screen", object: "System Health" },
    { actor: "reviewer", role: "Staff", action: "Inspected Luma posture", object: "Event loop" },
    { actor: "system", role: "System", action: "Blocked external send", object: "Automation Outbox" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <span className="font-semibold">Staging safety posture:</span> {commandCenter.safetyNote} No
        production sends, provider writes, or automation runs are enabled from this screen.
      </div>

      <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Integration Status</span>
          </div>
          <div className="px-4 py-2">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between border-b border-border py-2 last:border-0"
              >
                <div>
                  <div className="text-xs font-semibold text-foreground">{integration.name}</div>
                  <div className="text-[10px] text-muted-foreground">{integration.lastSync}</div>
                </div>
                <SafeStatusPill status={integration.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Automation Outbox</span>
            </div>
            <div className="flex gap-2">
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                0 sends
              </span>
              <button
                type="button"
                disabled
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground opacity-60"
              >
                <RotateCcw className="h-3 w-3" />
                Retry disabled
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Event", "Source", "Destination", "Status", "Retries", "Error"].map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outbox.map((row) => (
                  <tr key={row.event} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-mono font-medium text-foreground">{row.event}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.source}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.destination}</td>
                    <td className="px-3 py-2">
                      <SafeStatusPill status={row.status} />
                    </td>
                    <td className="px-3 py-2 text-center font-mono">{row.retries}</td>
                    <td className="px-3 py-2 text-[10px] text-muted-foreground">{row.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Audit Log</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Actor", "Role", "Action", "Object", "Timestamp"].map((header) => (
                <th
                  key={header}
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {auditRows.map((row, index) => (
              <tr key={`${row.action}-${index}`} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 font-mono text-[11px] text-foreground">{row.actor}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.role}</td>
                <td className="px-3 py-2.5 text-foreground">{row.action}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.object}</td>
                <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground">
                  Jul 4 2026
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FigmaMissingRouteContent({ view }: { view: StaffCommandCenter["selectedView"] }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="text-base font-bold text-foreground">{staffScreenCopy[view].title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Figma page missing - implementation blocked. This route is intentionally not parked into
        another staff screen so reviewers can see the gap directly.
      </p>
    </div>
  );
}

function StaffInfoCard({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}

function CampaignBadge({ status }: { status: CampaignStatus }) {
  const className: Record<CampaignStatus, string> = {
    "on-track": "bg-sky-50 text-sky-700 border border-sky-200",
    behind: "bg-orange-50 text-orange-700 border border-orange-200",
    "not-started": "bg-gray-100 text-gray-500 border border-gray-200",
    complete: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    paused: "bg-purple-50 text-purple-600 border border-purple-200",
  };
  const label: Record<CampaignStatus, string> = {
    "on-track": "On Track",
    behind: "Behind",
    "not-started": "Not Started",
    complete: "Complete",
    paused: "Paused",
  };

  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${className[status]}`}>
      {label[status]}
    </span>
  );
}

function KPICard({
  label,
  value,
  sub,
  color = "blue",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "yellow" | "green" | "red" | "gray";
}) {
  const accent = {
    blue: "border-t-2 border-t-blue-600",
    yellow: "border-t-2 border-t-amber-400",
    green: "border-t-2 border-t-emerald-500",
    red: "border-t-2 border-t-red-500",
    gray: "border-t-2 border-t-gray-300",
  };

  return (
    <div className={`rounded-lg bg-white p-4 shadow-sm ${accent[color]}`}>
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-bold font-mono text-foreground">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function NpsScore({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="font-mono text-xs italic text-muted-foreground">No data</span>;
  }

  const className =
    score >= 60
      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
      : score >= 30
        ? "border-sky-200 bg-sky-50 text-sky-600"
        : score >= 0
          ? "border-amber-200 bg-amber-50 text-amber-600"
          : "border-red-200 bg-red-50 text-red-600";

  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-xs font-mono font-bold ${className}`}
    >
      {score > 0 ? "+" : ""}
      {score}
    </span>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full cursor-pointer appearance-none rounded-lg bg-muted/60 px-3 py-2 pr-7 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? allLabel : option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      </span>
    </label>
  );
}

function SegmentedFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { key: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
      <span className="sr-only">{label}</span>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            value === option.key
              ? "bg-primary text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ProofStatusPill({ status }: { status: (typeof proofUgcItems)[number]["visibility"] }) {
  const className = {
    pending: "bg-amber-100 text-amber-700",
    chapter: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  }[status];

  const label = {
    pending: "Pending",
    chapter: "Approved",
    rejected: "Rejected",
  }[status];

  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${className}`}>
      {label}
    </span>
  );
}

function SafeStatusPill({ status }: { status: string }) {
  const className =
    status === "read-only"
      ? "bg-sky-100 text-sky-700"
      : status === "mock"
        ? "bg-violet-100 text-violet-700"
        : status === "blocked" || status === "off"
          ? "bg-slate-100 text-slate-700"
          : "bg-amber-100 text-amber-700";

  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${className}`}>
      {status}
    </span>
  );
}

function formatSopTabLabel(tab: string) {
  const labels: Record<string, string> = {
    steps: "Steps",
    "role-matrix": "Role Matrix",
    completion: "Completion",
    "points-kpi": "Points / KPI",
    comms: "Comms",
    preview: "Preview",
    version: "Version",
  };

  return labels[tab] ?? tab;
}

function getSopTabRows(tab: string) {
  const rows: Record<string, { title: string; body: string }[]> = {
    steps: [
      {
        title: "Create Luma event",
        body: "Chapter leaders draft the event, confirm the Luma calendar, and keep writes disabled until approved.",
      },
      {
        title: "Drive RSVP conversion",
        body: "Members discover the event, RSVP, and see the point impact before attendance is confirmed.",
      },
      {
        title: "Confirm attendance",
        body: "Leaders verify who attended before points move into the chapter and organization leaderboard.",
      },
    ],
    "role-matrix": [
      {
        title: "Student member",
        body: "Can discover events, RSVP, view status, and see points impact.",
      },
      {
        title: "Chapter leader",
        body: "Can inspect RSVPs, confirm attendance, and review proof after approval gates open.",
      },
      {
        title: "Staff coach",
        body: "Can monitor at-risk chapters and coach the event/points loop.",
      },
    ],
    completion: [
      {
        title: "Attendance-backed completion",
        body: "Completion requires Luma event identity, RSVP posture, attendance confirmation, and audit readback.",
      },
      {
        title: "Blocked external sends",
        body: "No HubSpot, SMS, email, n8n, warehouse, or AI action can fire from this draft template.",
      },
    ],
    "points-kpi": [
      {
        title: "Event attendance points",
        body: "Points are awarded only after attendance is confirmed and the audit row exists.",
      },
      {
        title: "Lead scoring",
        body: "Chapter and organization standings are visible as the early lead-scoring signal.",
      },
    ],
    comms: [
      {
        title: "Reminder triggers",
        body: "Reminder copy is defined here but disabled until explicit send approval.",
      },
      {
        title: "Coach escalation",
        body: "Escalation rules remain review-only while the pilot focuses on event data quality.",
      },
    ],
    preview: [
      {
        title: "Member preview",
        body: "Shows how the workflow appears in the student mobile app without allowing submissions.",
      },
      {
        title: "Leader preview",
        body: "Shows the chapter command-center view of RSVPs, attendance, and points.",
      },
    ],
    version: [
      {
        title: "Draft",
        body: "Current Rush Month workflow version is a draft and cannot publish from staging.",
      },
      {
        title: "Review",
        body: "Human approval is required before any workflow becomes a live production configuration.",
      },
    ],
  };

  return rows[tab] ?? rows.steps;
}

function getDashboardTotals(
  commandCenter: StaffCommandCenter,
  chapters: FigmaChapter[],
): StaffDashboardTotals {
  return {
    chapters: chapters.length,
    rsvps:
      commandCenter.launchLaneOrgReadback.totalRsvps ||
      chapters.reduce((sum, chapter) => sum + chapter.rsvps, 0),
    attendance:
      commandCenter.launchLaneOrgReadback.totalAttendance ||
      chapters.reduce((sum, chapter) => sum + chapter.attendance, 0),
    points:
      commandCenter.launchLaneOrgReadback.totalPoints ||
      chapters.reduce((sum, chapter) => sum + chapter.pointsWeek, 0),
  };
}

function getFigmaChapters(commandCenter: StaffCommandCenter): FigmaChapter[] {
  if (commandCenter.launchLaneChapterRows.length > 0) {
    return commandCenter.launchLaneChapterRows.map((row, index) => {
      const leads = Math.max(row.rsvps + 25, 30);
      const leadAttendancePct = Math.round((row.attendance / Math.max(leads, 1)) * 100);

      return {
        id: row.id,
        name: row.name,
        school: row.name,
        country: guessCountry(row.calendarLabel),
        medlifeRegion: row.calendarLabel,
        coach: "MEDLIFE Coach",
        leaders: [`${row.name} Leader`],
        activeMembers: Math.max(row.rsvps + 8, 18),
        campaign: "Rush Month",
        campaignStatus: row.risk === "Healthy" ? "on-track" : "behind",
        leads,
        rsvps: row.rsvps,
        attendance: row.attendance,
        newMembers: Math.max(0, Math.round(row.attendance * 0.25)),
        eventsThisYear: 12 + index,
        eventsThisMonth: row.chapterEventId ? 1 : 0,
        leadAttendancePct,
        avgNpsScore: row.attendance > 0 ? 58 + index : null,
        totalPointsYear: row.points * 20 + 900,
        pointsWeek: row.points,
        chapterType: index < 2 ? "established" : "growing",
      };
    });
  }

  return commandCenter.chapterRows.map((row, index) => {
    const eventsThisMonth = Math.max(1, Math.round(row.rsvpCount / 20));

    return {
      id: row.chapterId,
      name: row.chapterName,
      school: row.campus,
      country: row.country,
      medlifeRegion: row.campus,
      coach: row.coachName,
      leaders: [row.leadName],
      activeMembers: Math.max(row.attendanceCount + row.proofPending + 12, 18),
      campaign: row.campaignName,
      campaignStatus: getCampaignStatus(row.statusLabel),
      leads: row.leadsCount,
      rsvps: row.rsvpCount,
      attendance: row.attendanceCount,
      newMembers: Math.max(0, Math.round(row.attendanceCount * 0.22)),
      eventsThisYear: Math.max(row.rsvpCount, 4) + index,
      eventsThisMonth,
      leadAttendancePct:
        row.leadsCount > 0
          ? Math.min(100, Math.round((row.attendanceCount / row.leadsCount) * 100))
          : 0,
      avgNpsScore: row.attendanceCount > 0 ? 60 + (index % 10) : null,
      totalPointsYear: row.pointsPerWeek * 12,
      pointsWeek: row.pointsPerWeek,
      chapterType: row.readinessScore >= 75 ? "established" : "growing",
    };
  });
}

function getCampaignStatus(status: string): CampaignStatus {
  if (status === "On Track") return "on-track";
  if (status === "Behind") return "behind";
  if (status === "Not Started") return "not-started";
  if (status === "Paused") return "paused";
  if (status === "Complete") return "complete";
  return "behind";
}

function guessCountry(label: string): string {
  if (label.includes("Canada")) return "Canada";
  if (label.includes("Peru")) return "Peru";
  if (label.includes("Brazil")) return "Brazil";
  return "USA";
}

function getEventOperationRows(commandCenter: StaffCommandCenter): StaffEventOperationRow[] {
  if (commandCenter.launchLaneChapterRows.length > 0) {
    return commandCenter.launchLaneChapterRows.map((row) => ({
      chapterName: row.name,
      calendarLabel: row.calendarLabel,
      nextEvent: row.nextEvent,
      rsvps: row.rsvps,
      attendance: row.attendance,
      points: row.points,
      risk: row.risk,
    }));
  }

  return getFigmaChapters(commandCenter).map((row) => ({
    chapterName: row.name,
    calendarLabel: row.medlifeRegion,
    nextEvent: row.eventsThisMonth > 0 ? "Next chapter event queued" : "No upcoming event",
    rsvps: row.rsvps,
    attendance: row.attendance,
    points: row.totalPointsYear,
    risk: row.attendance > 0 ? "Healthy" : "Needs event proof",
  }));
}

function getOrgLeaderboardRows(commandCenter: StaffCommandCenter) {
  if (commandCenter.launchLaneOrgLeaderboardRows.length > 0) {
    return commandCenter.launchLaneOrgLeaderboardRows;
  }

  return getFigmaChapters(commandCenter)
    .map((row) => ({
      chapterName: row.name,
      points: row.totalPointsYear,
      eventCount: row.eventsThisMonth,
      statusLabel: row.attendance > 0 ? "Healthy" : "Needs event proof",
    }))
    .sort((a, b) => b.points - a.points);
}
