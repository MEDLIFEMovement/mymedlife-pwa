import Link from "next/link";

import {
  chapterTypeFilterOptions,
  getChapterTypeLabel,
  isChapterType,
  type ChapterTypeFilter,
} from "@/services/chapter-type";
import type {
  LaunchLaneOrgLeaderboardRow,
  LaunchLaneOrgPointsReadback,
  LaunchLaneStaffChapterReadback,
  LaunchLaneStaffEventReadback,
} from "@/services/launch-lane-points-readback";
import type { DataSourceMeta } from "@/services/read-only-app-data";

type CampaignStatus = "on-track" | "behind" | "not-started" | "complete" | "paused";

type StaffLaunchChapter = {
  id: string;
  name: string;
  coach: string;
  rsvps: number;
  attendance: number;
  pointsWeek: number;
  lumaEvents: number;
  eventsThisYear: number;
  eventsThisMonth: number;
  leadAttendancePct: number;
  avgNpsScore: number | null;
  totalPointsYear: number;
  chapterType: "established" | "new" | "growing";
  medlifeRegion: string;
  campaignStatus: CampaignStatus;
};

type StaffLaunchEventsPanelsProps = {
  chapters: StaffLaunchChapter[];
};

type StaffLiveLaunchEventsPanelsProps = {
  chapters: LaunchLaneStaffChapterReadback[];
  organization: LaunchLaneOrgPointsReadback;
  source: DataSourceMeta;
  selectedEventId: string | null;
  selectedEvent: LaunchLaneStaffEventReadback | null;
};

type StaffLiveLaunchLeaderboardProps = {
  rows: LaunchLaneOrgLeaderboardRow[];
  organization: LaunchLaneOrgPointsReadback;
  source: DataSourceMeta;
};

type StaffLiveChapterPortfolioProps = {
  chapters: LaunchLaneStaffChapterReadback[];
  organization: LaunchLaneOrgPointsReadback;
  source: DataSourceMeta;
  initialSearch?: string;
  initialChapterType?: string;
  selectedChapterId?: string | null;
};

export function StaffLiveChapterPortfolio({
  chapters,
  organization,
  source,
  initialSearch = "",
  initialChapterType = "all",
  selectedChapterId = null,
}: StaffLiveChapterPortfolioProps) {
  const normalizedSearch = initialSearch.trim().toLowerCase();
  const chapterType: ChapterTypeFilter = isChapterType(initialChapterType)
    ? initialChapterType
    : "all";
  const filteredChapters = chapters.filter((chapter) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      chapter.name.toLowerCase().includes(normalizedSearch) ||
      chapter.nextEvent.toLowerCase().includes(normalizedSearch);
    const matchesType = chapterType === "all" || chapter.chapterType === chapterType;

    return matchesSearch && matchesType;
  });
  const selectedChapter = selectedChapterId
    ? chapters.find((chapter) => chapter.id === selectedChapterId) ?? null
    : null;
  const visibleEvents = chapters.filter((chapter) => chapter.chapterEventId);
  const reviewCount = chapters.filter((chapter) => chapter.risk !== "Healthy").length;
  const isOperationalReadback = source.mode === "supabase" && source.status === "supabase_ready";
  const visibleLabel = (value: string) =>
    source.mode === "mock" && !/^test\b/iu.test(value) ? `TEST ${value}` : value;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaffMetricCard label="Chapters" value={chapters.length.toString()} note="App-owned chapter rows" tone="blue" />
        <StaffMetricCard label="Upcoming events" value={visibleEvents.length.toString()} note="Chapter event records" tone="green" />
        <StaffMetricCard label="Needs review" value={reviewCount.toString()} note="Derived from event-loop posture" tone="yellow" />
        <StaffMetricCard label="Org points" value={organization.totalPoints.toLocaleString()} note="Attendance-backed ledger" tone="purple" />
      </div>

      <section
        className={`rounded-lg border px-4 py-3 ${
          isOperationalReadback
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
        aria-label="Staff portfolio data source"
      >
        <p className="text-xs font-bold uppercase tracking-widest">
          {isOperationalReadback ? "Supabase operational truth" : "TEST / unavailable readback"}
        </p>
        <p className="mt-1 text-sm">{source.message}</p>
      </section>

      {selectedChapterId ? (
        selectedChapter ? (
          <section className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-4" aria-label="Selected staff chapter detail">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Chapter Detail</p>
                <h2 className="mt-1 text-lg font-bold text-foreground">{visibleLabel(selectedChapter.name)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getChapterTypeLabel(selectedChapter.chapterType)} · {selectedChapter.calendarLabel}
                </p>
              </div>
              <Link
                href={buildStaffChapterPortfolioHref(null, initialSearch, chapterType)}
                className="text-sm font-bold text-primary hover:underline"
              >
                Close chapter detail
              </Link>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-xs font-bold uppercase text-muted-foreground">RSVPs</p><p className="mt-1 font-mono text-lg font-black">{selectedChapter.rsvps}</p></div>
              <div><p className="text-xs font-bold uppercase text-muted-foreground">Attendance</p><p className="mt-1 font-mono text-lg font-black">{selectedChapter.attendance}</p></div>
              <div><p className="text-xs font-bold uppercase text-muted-foreground">Points</p><p className="mt-1 font-mono text-lg font-black">{selectedChapter.points.toLocaleString()}</p></div>
              <div><p className="text-xs font-bold uppercase text-muted-foreground">Risk</p><p className="mt-1 font-bold">{selectedChapter.risk}</p></div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-blue-200 pt-4">
              <button
                type="button"
                disabled
                className="rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-bold text-slate-500"
              >
                Preview NPS Survey
              </button>
              {selectedChapter.detailHref ? (
                <Link href={selectedChapter.detailHref} className="text-sm font-bold text-primary hover:underline">
                  Open current event
                </Link>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-blue-950">
              Survey sending and chapter support notes remain blocked until an audited staff workflow is available.
            </p>
          </section>
        ) : (
          <section className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4" aria-label="Selected staff chapter unavailable">
            <p className="font-bold text-amber-950">Selected chapter is not available in the app-owned staff readback.</p>
            <Link
              href={buildStaffChapterPortfolioHref(null, initialSearch, chapterType)}
              className="mt-2 inline-block text-sm font-bold text-amber-900 hover:underline"
            >
              Back to chapter portfolio
            </Link>
          </section>
        )
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Live chapter portfolio</p>
            <h2 className="text-lg font-bold text-foreground">Event-loop health by chapter</h2>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
            Read-only
          </span>
        </div>

        <form method="get" action="/staff" className="grid gap-3 border-b border-border bg-muted/20 px-5 py-4 md:grid-cols-[minmax(0,1fr)_16rem_auto_auto] md:items-end">
          <input type="hidden" name="view" value="chapters" />
          <label className="grid gap-1 text-sm font-bold text-foreground">
            Search chapters
            <input
              type="search"
              name="chapterSearch"
              defaultValue={initialSearch}
              placeholder="Chapter or event"
              className="h-10 rounded-md border border-input bg-white px-3 font-normal"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold text-foreground">
            Chapter type
            <select
              name="chapterType"
              defaultValue={chapterType}
              className="h-10 rounded-md border border-input bg-white px-3 font-normal"
            >
              {chapterTypeFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground">
            Apply filters
          </button>
          <Link href="/staff?view=chapters" className="flex h-10 items-center justify-center text-sm font-bold text-primary hover:underline">
            Clear
          </Link>
        </form>

        <div className="border-b border-border px-5 py-3 text-sm text-muted-foreground">
          Showing <strong className="text-foreground">{filteredChapters.length}</strong> of{" "}
          <strong className="text-foreground">{chapters.length}</strong> chapters
        </div>

        {chapters.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-bold text-foreground">No app-owned chapter rows are available.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The portfolio is intentionally empty instead of substituting preview chapters.
            </p>
          </div>
        ) : filteredChapters.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-bold text-foreground">No chapters match these filters.</p>
            <p className="mt-1 text-sm text-muted-foreground">Clear the filters to return to the full app-owned portfolio.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {["Chapter", "Type", "Calendar", "Next event", "RSVPs", "Attended", "Points", "Risk", "Detail"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-bold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredChapters.map((chapter) => (
                  <tr key={chapter.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-bold text-foreground">{visibleLabel(chapter.name)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{getChapterTypeLabel(chapter.chapterType)}</td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{chapter.calendarLabel}</div>
                      <div className="text-xs text-muted-foreground">{chapter.calendarStatusLabel}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{visibleLabel(chapter.nextEvent)}</td>
                    <td className="px-4 py-3 font-mono">{chapter.rsvps}</td>
                    <td className="px-4 py-3 font-mono">{chapter.attendance}</td>
                    <td className="px-4 py-3 font-mono font-bold">{chapter.points.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {chapter.risk}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Link
                          href={buildStaffChapterPortfolioHref(chapter.id, initialSearch, chapterType)}
                          className="font-bold text-primary hover:underline"
                        >
                          Review {visibleLabel(chapter.name)}
                        </Link>
                        {chapter.detailHref ? (
                          <Link href={chapter.detailHref} className="text-xs font-bold text-primary hover:underline">
                            Open event
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">No event</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function buildStaffChapterPortfolioHref(
  chapterId: string | null,
  search: string,
  chapterType: ChapterTypeFilter,
) {
  const params = new URLSearchParams({ view: "chapters" });

  if (search.trim()) {
    params.set("chapterSearch", search.trim());
  }
  if (chapterType !== "all") {
    params.set("chapterType", chapterType);
  }
  if (chapterId) {
    params.set("chapter", chapterId);
  }

  return `/staff?${params.toString()}`;
}

export function StaffLiveLaunchEventsOperations({
  chapters,
  organization,
  source,
  selectedEventId,
  selectedEvent,
}: StaffLiveLaunchEventsPanelsProps) {
  const visibleEvents = chapters.filter((chapter) => chapter.chapterEventId);
  const isOperationalReadback = source.mode === "supabase" && source.status === "supabase_ready";
  const visibleLabel = (value: string) =>
    source.mode === "mock" && !/^test\b/iu.test(value) ? `TEST ${value}` : value;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <StaffMetricCard label="Visible events" value={visibleEvents.length.toString()} note="Supabase chapter events" tone="blue" />
        <StaffMetricCard label="RSVPs" value={organization.totalRsvps.toLocaleString()} note="Active RSVP records" tone="yellow" />
        <StaffMetricCard label="Attendance" value={organization.totalAttendance.toLocaleString()} note="Confirmed check-ins" tone="green" />
        <StaffMetricCard label="Points awarded" value={organization.totalPoints.toLocaleString()} note="Attendance-backed points" tone="purple" />
      </div>

      {selectedEventId ? (
        selectedEvent ? (
          <section className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4" aria-label="Selected staff event detail">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Selected event</p>
                <h2 className="mt-1 text-lg font-bold text-foreground">{visibleLabel(selectedEvent.title)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{visibleLabel(selectedEvent.chapterName)} · {selectedEvent.timing} · {selectedEvent.location}</p>
              </div>
              <Link href="/staff?view=events" className="text-sm font-bold text-primary hover:underline">Back to all events</Link>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-xs font-bold uppercase text-muted-foreground">RSVPs</p><p className="mt-1 font-mono text-lg font-black">{selectedEvent.rsvps}</p></div>
              <div><p className="text-xs font-bold uppercase text-muted-foreground">Attendance</p><p className="mt-1 font-mono text-lg font-black">{selectedEvent.attendance}</p></div>
              <div><p className="text-xs font-bold uppercase text-muted-foreground">Points</p><p className="mt-1 font-mono text-lg font-black">{selectedEvent.points.toLocaleString()}</p></div>
              <div><p className="text-xs font-bold uppercase text-muted-foreground">Risk</p><p className="mt-1 font-bold">{selectedEvent.risk}</p></div>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4" aria-label="Selected staff event unavailable">
            <p className="font-bold text-amber-900">Selected event is not available in the staff readback.</p>
            <Link href="/staff?view=events" className="mt-2 inline-block text-sm font-bold text-amber-800 hover:underline">Back to all events</Link>
          </section>
        )
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Live event-loop readback</p>
            <h2 className="text-lg font-bold text-foreground">RSVP, attendance, and points by chapter</h2>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
            isOperationalReadback
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-amber-100 bg-amber-50 text-amber-700"
          }`}>
            {isOperationalReadback ? "Supabase operational truth" : "TEST / unavailable readback"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {['Chapter', 'Calendar', 'Next event', 'RSVPs', 'Attended', 'Points', 'Risk', 'Detail'].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-bold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chapters.map((chapter) => (
                <tr
                  key={chapter.id}
                  aria-current={chapter.chapterEventId === selectedEventId ? "true" : undefined}
                  className={`border-t border-border hover:bg-muted/30 ${chapter.chapterEventId === selectedEventId ? "bg-blue-50" : ""}`}
                >
                  <td className="px-4 py-3 font-bold text-foreground">{visibleLabel(chapter.name)}</td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{chapter.calendarLabel}</div>
                    <div className="text-xs text-muted-foreground">{chapter.calendarStatusLabel}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{visibleLabel(chapter.nextEvent)}</td>
                  <td className="px-4 py-3 font-mono">{chapter.rsvps}</td>
                  <td className="px-4 py-3 font-mono">{chapter.attendance}</td>
                  <td className="px-4 py-3 font-mono font-bold">{chapter.points.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {chapter.risk}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {chapter.detailHref ? (
                      <Link href={chapter.detailHref} className="font-bold text-primary hover:underline">
                        Open event
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">No event</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function StaffLiveLaunchOrganizationLeaderboard({
  rows,
  organization,
  source,
}: StaffLiveLaunchLeaderboardProps) {
  const isOperationalReadback = source.mode === "supabase" && source.status === "supabase_ready";
  const visibleLabel = (value: string) =>
    source.mode === "mock" && !/^test\b/iu.test(value) ? `TEST ${value}` : value;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <StaffMetricCard label="Org points" value={organization.totalPoints.toLocaleString()} note="All durable points rows" tone="purple" />
        <StaffMetricCard label="Top chapter" value={organization.topChapterName ?? "Pending"} note={organization.topChapterName ? `${organization.topChapterPoints.toLocaleString()} points` : "No points yet"} tone="yellow" />
        <StaffMetricCard label="Chapters scoring" value={organization.chaptersWithPoints.toString()} note="At least one points row" tone="green" />
        <StaffMetricCard label="Attendance" value={organization.totalAttendance.toLocaleString()} note="Confirmed check-ins" tone="blue" />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Live organization leaderboard</p>
            <h2 className="text-lg font-bold text-foreground">Chapter ranking by attendance-backed points</h2>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
            isOperationalReadback
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-amber-100 bg-amber-50 text-amber-700"
          }`}>
            {isOperationalReadback ? "Supabase operational truth" : "TEST / unavailable readback"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {['Rank', 'Chapter', 'Points', 'Events', 'Status'].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-bold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.chapterName} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-black text-primary">#{index + 1}</td>
                  <td className="px-4 py-3 font-bold text-foreground">{visibleLabel(row.chapterName)}</td>
                  <td className="px-4 py-3 font-mono font-bold">{row.points.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">{row.eventCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.statusLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function StaffLaunchEventsOperations({
  chapters,
}: StaffLaunchEventsPanelsProps) {
  const totalEvents = chapters.reduce((sum, chapter) => sum + chapter.eventsThisMonth, 0);
  const totalRsvps = chapters.reduce((sum, chapter) => sum + chapter.rsvps, 0);
  const totalAttendance = chapters.reduce((sum, chapter) => sum + chapter.attendance, 0);
  const attendanceRate = totalRsvps > 0 ? Math.round((totalAttendance / totalRsvps) * 100) : 0;
  const rows = [...chapters]
    .sort((a, b) => b.eventsThisMonth - a.eventsThisMonth || b.attendance - a.attendance)
    .slice(0, 12);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <StaffMetricCard label="Events this month" value={totalEvents.toString()} note="Visible chapter calendars" tone="blue" />
        <StaffMetricCard label="RSVPs" value={totalRsvps.toLocaleString()} note="Luma-backed intent" tone="yellow" />
        <StaffMetricCard label="Attendance" value={totalAttendance.toLocaleString()} note={`${attendanceRate}% RSVP to check-in`} tone="green" />
        <StaffMetricCard label="Points ready" value={chapters.reduce((sum, chapter) => sum + chapter.pointsWeek, 0).toLocaleString()} note="Attendance-backed leaderboard signal" tone="purple" />
      </div>

      <section className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Luma event operations</p>
            <h2 className="text-lg font-bold text-foreground">RSVP, attendance, and point readiness by chapter</h2>
          </div>
          <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 text-xs font-bold">
            Read-only sync posture
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Chapter", "Coach", "Events", "RSVPs", "Attended", "Lead to Event", "Points/Wk", "Luma"].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-bold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((chapter) => (
                <tr key={chapter.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-bold text-foreground">{chapter.name}</div>
                    <div className="text-xs text-muted-foreground">{chapterTypeLabel(chapter.chapterType)} · {chapter.medlifeRegion}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{chapter.coach}</td>
                  <td className="px-4 py-3 font-mono">{chapter.eventsThisMonth}</td>
                  <td className="px-4 py-3 font-mono">{chapter.rsvps}</td>
                  <td className="px-4 py-3 font-mono">{chapter.attendance}</td>
                  <td className="px-4 py-3 font-mono">{chapter.leadAttendancePct}%</td>
                  <td className="px-4 py-3 font-mono">{chapter.pointsWeek.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${chapter.lumaEvents > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {chapter.lumaEvents > 0 ? `${chapter.lumaEvents} linked` : "Needs link"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function StaffLaunchOrganizationLeaderboard({
  chapters,
}: StaffLaunchEventsPanelsProps) {
  const rows = [...chapters]
    .sort((a, b) => b.totalPointsYear - a.totalPointsYear)
    .slice(0, 15);
  const topChapter = rows[0];
  const chaptersWithNps = chapters.filter((chapter) => chapter.avgNpsScore != null);
  const avgNps =
    chaptersWithNps.length > 0
      ? Math.round(
          chaptersWithNps.reduce((sum, chapter) => sum + (chapter.avgNpsScore ?? 0), 0) /
            chaptersWithNps.length,
        ).toString()
      : "Pending";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <StaffMetricCard label="Org points" value={chapters.reduce((sum, chapter) => sum + chapter.totalPointsYear, 0).toLocaleString()} note="All visible chapter points" tone="purple" />
        <StaffMetricCard label="Top chapter" value={topChapter?.name ?? "Pending"} note={topChapter ? `${topChapter.totalPointsYear.toLocaleString()} points` : "No scoring yet"} tone="yellow" />
        <StaffMetricCard label="Chapters scoring" value={chapters.filter((chapter) => chapter.totalPointsYear > 0).length.toString()} note="At least one point row" tone="green" />
        <StaffMetricCard label="Avg NPS" value={avgNps} note="Event experience signal" tone="blue" />
      </div>

      <section className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Organization leaderboard</p>
          <h2 className="text-lg font-bold text-foreground">Chapter ranking by attendance-backed points</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Rank", "Chapter", "Region", "Points", "Events/Yr", "Attendance", "NPS", "Status"].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-bold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((chapter, index) => (
                <tr key={chapter.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-black text-primary">#{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-foreground">{chapter.name}</div>
                    <div className="text-xs text-muted-foreground">{chapterTypeLabel(chapter.chapterType)}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{chapter.medlifeRegion}</td>
                  <td className="px-4 py-3 font-mono font-bold">{chapter.totalPointsYear.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">{chapter.eventsThisYear}</td>
                  <td className="px-4 py-3 font-mono">{chapter.leadAttendancePct}%</td>
                  <td className="px-4 py-3 font-mono">{chapter.avgNpsScore ?? "-"}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={chapter.campaignStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StaffMetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "blue" | "green" | "yellow" | "purple";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    yellow: "bg-amber-50 text-amber-700 border-amber-100",
    purple: "bg-violet-50 text-violet-700 border-violet-100",
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-widest opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-black leading-tight">{value}</p>
      <p className="mt-1 text-xs font-semibold opacity-80">{note}</p>
    </div>
  );
}

function StatusPill({ status }: { status: CampaignStatus }) {
  const label = {
    "on-track": "On track",
    behind: "Behind",
    "not-started": "Not started",
    complete: "Complete",
    paused: "Paused",
  }[status];
  const style = {
    "on-track": "bg-emerald-50 text-emerald-700",
    behind: "bg-amber-50 text-amber-700",
    "not-started": "bg-slate-100 text-slate-600",
    complete: "bg-blue-50 text-blue-700",
    paused: "bg-red-50 text-red-700",
  }[status];

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${style}`}>
      {label}
    </span>
  );
}

function chapterTypeLabel(type: StaffLaunchChapter["chapterType"]) {
  switch (type) {
    case "established":
      return "College / University Chapter";
    case "growing":
      return "Growing Chapter";
    case "new":
      return "New Chapter";
  }
}
