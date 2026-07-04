import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Award,
  Bell,
  Calendar,
  CheckCircle,
  Flame,
  Globe,
  Heart,
  Home,
  Layers,
  Plus,
  Shield,
  Star,
  Target,
  Trophy,
  Upload,
  Users,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { ChapterLeaderCommandCenter } from "@/services/chapter-leader-command-center";
import type { LaunchLaneLeaderEventReadback } from "@/services/launch-lane-points-readback";

const BLUE = "#1A56E8";
const YELLOW = "#F5A623";

type LeaderRouteView = ChapterLeaderCommandCenter["selectedView"];

const leaderScreenTitles: Record<LeaderRouteView, string> = {
  overview: "Chapter Leadership Home",
  leaderboard: "Chapter Leaderboard",
  members: "Member Pipeline",
  member_profile: "Member Profile",
  committees: "Event Committees",
  events: "Event Performance",
  impact: "Impact Dashboard",
  bridge_videos: "Bridge Video Hub",
  succession: "Succession Planning",
  feed: "Feed Analytics",
  feed_analytics: "Feed Analytics",
};

type FigmaLeaderCommandCenterProps = {
  calendarLabel: string;
  commandCenter: ChapterLeaderCommandCenter;
  eventReadback: LaunchLaneLeaderEventReadback[];
};

export function FigmaLeaderCommandCenter({
  calendarLabel,
  commandCenter,
  eventReadback,
}: FigmaLeaderCommandCenterProps) {
  const featuredEvent = eventReadback[0] ?? null;
  const selectedView = commandCenter.selectedView;
  const navGroups = [
    {
      label: "Chapter",
      items: [
        { key: "overview", label: "Home", href: "/leader?view=overview", icon: Home },
        { key: "leaderboard", label: "Leaderboard", href: "/leader?view=leaderboard", icon: Trophy },
        { key: "members", label: "Members", href: "/leader?view=members", icon: Users },
      ],
    },
    {
      label: "Operations",
      items: [
        { key: "committees", label: "Committees", href: "/leader?view=committees", icon: Layers },
        { key: "events", label: "Events", href: "/leader?view=events", icon: Calendar },
        { key: "impact", label: "Impact", href: "/leader?view=impact", icon: Heart },
      ],
    },
    {
      label: "Leadership",
      items: [
        { key: "bridge_videos", label: "Bridge Videos", href: "/leader?view=bridge_videos", icon: Video },
        { key: "succession", label: "Succession", href: "/leader?view=succession", icon: Award },
        { key: "feed_analytics", label: "Feed Analytics", href: "/leader?view=feed_analytics", icon: Activity },
      ],
    },
  ];

  const metrics = [
    { label: "Active Members", value: "84", sub: "+6 from last month", icon: Users, accent: BLUE },
    { label: "Events Created", value: "12", sub: "This month", icon: Calendar, accent: "#7C3AED" },
    { label: "Attendance Rate", value: "67%", sub: "-4% vs last month", icon: Activity, accent: YELLOW },
    { label: "Actions Completed", value: "156", sub: "+24 this week", icon: CheckCircle, accent: "#16A34A" },
    { label: "Evidence Submitted", value: "89", sub: "of 156 actions", icon: Upload, accent: "#0891B2" },
    { label: "Bridge Videos", value: "9", sub: "Submitted this month", icon: Video, accent: "#DB2777" },
    { label: "Points This Week", value: "1,480", sub: "+11% vs last week", icon: Star, accent: YELLOW },
    { label: "Funds Raised", value: "$8,400", sub: "70% of $12k goal", icon: Target, accent: "#16A34A" },
    { label: "SLT Participants", value: "18", sub: "Signed up this cycle", icon: Globe, accent: "#7C3AED" },
    { label: "Volunteer Hours", value: "284", sub: "Local impact", icon: Heart, accent: "#DC2626" },
    { label: "Clinic Patients", value: "420", sub: "Global MEDLIFE impact", icon: Shield, accent: "#059669" },
    { label: "Meals Served", value: "1,840", sub: "Community partners", icon: Award, accent: "#D97706" },
  ];

  return (
    <div
      className="flex h-screen overflow-hidden bg-slate-100"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col overflow-y-auto bg-[#07192E]">
        <div className="shrink-0 border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `linear-gradient(135deg, ${BLUE}, #3B82F6)` }}
            >
              <span className="text-sm font-black text-white">M</span>
            </div>
            <div>
              <div className="text-sm font-black leading-none text-white">myMEDLIFE</div>
              <div className="mt-0.5 text-[10px] text-blue-300/60">Leadership Center</div>
            </div>
          </div>
        </div>

        <div className="mx-3 mt-3 shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            Active Campaign
          </div>
          <div className="text-xs font-semibold text-amber-200">Moving Mountains 🏔</div>
        </div>

        <nav className="flex-1 space-y-4 px-2 py-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="mb-1 px-3 text-[9px] font-bold uppercase tracking-widest text-blue-300/40">
                {group.label}
              </div>
              {group.items.map(({ key, label, href, icon: Icon }) => {
                const active = selectedView === key || (selectedView === "member_profile" && key === "members");

                return (
                <Link
                  key={label}
                  href={href}
                  className={[
                    "mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all",
                    active
                      ? "bg-[#1A56E8] text-white shadow-md shadow-blue-900/50"
                      : "text-white/50 hover:bg-white/6 hover:text-white",
                  ].join(" ")}
                >
                  <Icon size={14} />
                  <span className="text-[11px] font-semibold">{label}</span>
                </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={commandCenter.sidebarLeaderLabel} color={BLUE} size={28} />
            <div className="min-w-0">
              <div className="truncate text-[11px] font-bold text-white">
                {commandCenter.sidebarLeaderLabel}
              </div>
              <div className="text-[10px] text-blue-300/50">
                {commandCenter.sidebarLeaderRoleLabel}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-100/95 px-6 py-2.5 backdrop-blur-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {leaderScreenTitles[selectedView]}
          </span>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-transparent transition-colors hover:border-slate-200 hover:bg-white"
          >
            <Bell size={14} className="text-slate-500" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
        </div>

        <div className="w-full max-w-[1400px] flex-1 p-6">
          {selectedView === "overview" ? (
          <section className="space-y-5">
            <div className="flex items-start justify-between gap-6 rounded-2xl bg-[#07192E] p-6">
              <div className="flex items-start gap-6">
                <RadialGauge score={commandCenter.healthScore} size={120} />
                <div className="pt-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-blue-300">
                      Chapter Dashboard · Jun 2025
                    </span>
                  </div>
                  <h1 className="mb-1 text-2xl font-black text-white">
                    {commandCenter.chapterName}
                  </h1>
                  <p className="mb-3 text-sm text-blue-200">
                    {commandCenter.sidebarLeaderLabel}, {commandCenter.sidebarLeaderRoleLabel} ·{" "}
                    {commandCenter.regionLabel} Region
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <CampaignPill icon={<Flame size={10} />} label="Rush Month" tone="blue" />
                    <CampaignPill icon={<Target size={10} />} label="Moving Mountains" tone="amber" />
                    <CampaignPill icon={<Globe size={10} />} label="SLT Promotion" tone="purple" />
                  </div>
                </div>
              </div>

              <div className="min-w-52 shrink-0 space-y-4">
                <FillBars label="E-Board roles" value="6 / 7" filled={6} total={7} color={BLUE} />
                <FillBars label="Committees active" value="5 / 7" filled={5} total={7} color="#16A34A" />
                <div className="pt-1">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Health Score
                  </div>
                  <div className="text-xs text-blue-200">3rd in New England · top 15% globally</div>
                </div>
                <div className="flex gap-2 pt-1">
                  <FigmaButton href="/leader?view=events&quickAction=create_event" tone="primary">
                    <Plus size={11} />
                    Create Event
                  </FigmaButton>
                  <FigmaButton href="/leader?view=events&quickAction=assign_action" tone="light">
                    <Zap size={11} />
                    Assign Action
                  </FigmaButton>
                </div>
              </div>
            </div>

            <div>
              <SectionHeading>Chapter Metrics — June 2025</SectionHeading>
              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <SectionHeading>Risk Alerts</SectionHeading>
                  <SmallPill label="4 active" />
                </div>
                <div className="space-y-2">
                  {[
                    "Member Engagement committee has no chair — inactive for 3 weeks",
                    "Fundraising committee has low activity — only 9 actions completed this month",
                    "No bridge videos submitted this month from 3 of 7 committees",
                    "Follow-up overdue after 'Tabling: Quad Recruitment' (Jun 15)",
                  ].map((message, index) => (
                    <div
                      key={message}
                      className={[
                        "flex items-start gap-3 rounded-lg border px-3 py-2.5",
                        index === 0
                          ? "border-red-100 bg-red-50"
                          : "border-amber-100 bg-amber-50",
                      ].join(" ")}
                    >
                      <AlertTriangle
                        size={13}
                        className={[
                          "mt-0.5 shrink-0",
                          index === 0 ? "text-red-500" : "text-amber-500",
                        ].join(" ")}
                      />
                      <span className="text-xs text-slate-700">{message}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <SectionHeading>This Week&apos;s Priority</SectionHeading>
                <p className="mb-4 mt-2 text-xs leading-relaxed text-slate-600">
                  Activate Member Engagement committee, collect bridge videos from all chairs,
                  and push the SLT sign-up campaign.
                </p>
                {featuredEvent ? (
                  <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
                          Event readback
                        </p>
                        <p className="mt-1 text-sm font-bold leading-snug text-slate-900">
                          {featuredEvent.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{calendarLabel}</p>
                      </div>
                      <SmallPill label={featuredEvent.statusLabel} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <MiniStat label="RSVPs" value={featuredEvent.rsvpCount} />
                      <MiniStat label="Attended" value={featuredEvent.attendanceCount} />
                      <MiniStat label="Points" value={featuredEvent.pointsAwarded} />
                    </div>
                  </div>
                ) : null}
                <SectionHeading>Quick Actions</SectionHeading>
                <div className="mt-2 space-y-1.5">
                  {([
                    ["Review Members", Users, "/leader?view=members"],
                    ["Assign Action", Zap, "/leader?view=events&quickAction=assign_action"],
                    ["Promote Emerging Leader", Star, "/leader?view=succession"],
                    ["Create Event", Calendar, "/leader?view=events&quickAction=create_event"],
                    ["Share Bridge Video", Video, "/leader?view=bridge_videos"],
                  ] satisfies Array<[string, LucideIcon, string]>).map(([label, Icon, href], index) => (
                    <FigmaButton
                      key={String(label)}
                      href={String(href)}
                      tone={index === 0 ? "primaryWide" : "secondaryWide"}
                    >
                      <Icon size={11} />
                      {label}
                    </FigmaButton>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <SectionHeading>Weekly Points Trend</SectionHeading>
                <span className="font-mono text-[11px] text-slate-400">Apr – Jun 2025</span>
              </div>
              <div className="flex h-[170px] items-end gap-3 rounded-lg bg-gradient-to-b from-blue-50/70 to-white p-4">
                {[42, 50, 46, 55, 62, 59, 71, 76, 91, 100].map((height, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <div
                      className="w-full rounded-t-md bg-[#1A56E8]"
                      style={{ height: `${height}%`, opacity: 0.32 + index / 18 }}
                    />
                    <span className="text-[9px] text-slate-400">
                      {index < 4 ? `Apr ${index + 1}` : index < 8 ? `May ${index - 3}` : `Jun ${index - 7}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          ) : (
            <LeaderRouteContent
              calendarLabel={calendarLabel}
              commandCenter={commandCenter}
              eventReadback={eventReadback}
              selectedView={selectedView}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function LeaderRouteContent({
  calendarLabel,
  commandCenter,
  eventReadback,
  selectedView,
}: {
  calendarLabel: string;
  commandCenter: ChapterLeaderCommandCenter;
  eventReadback: LaunchLaneLeaderEventReadback[];
  selectedView: LeaderRouteView;
}) {
  switch (selectedView) {
    case "leaderboard":
      return <LeaderLeaderboardContent commandCenter={commandCenter} />;
    case "members":
      return <LeaderMembersContent commandCenter={commandCenter} />;
    case "member_profile":
      return <LeaderMemberProfileContent commandCenter={commandCenter} />;
    case "committees":
      return <LeaderCommitteesContent commandCenter={commandCenter} />;
    case "events":
      return (
        <LeaderEventsContent
          calendarLabel={calendarLabel}
          commandCenter={commandCenter}
          eventReadback={eventReadback}
        />
      );
    case "impact":
      return <LeaderImpactContent commandCenter={commandCenter} />;
    case "bridge_videos":
      return <LeaderBridgeVideosContent commandCenter={commandCenter} />;
    case "succession":
      return <LeaderSuccessionContent commandCenter={commandCenter} />;
    case "feed":
    case "feed_analytics":
      return <LeaderFeedAnalyticsContent commandCenter={commandCenter} />;
    case "overview":
    default:
      return null;
  }
}

function LeaderLeaderboardContent({
  commandCenter,
}: {
  commandCenter: ChapterLeaderCommandCenter;
}) {
  return (
    <div className="space-y-5">
      <LeaderHero title="Chapter Leaderboard" subtitle={commandCenter.leaderboardIdeaNote} icon={Trophy} />
      <div className="grid gap-3 md:grid-cols-4">
        {commandCenter.leaderboardFilters.slice(0, 4).map((filter) => (
          <LeaderMetricCard
            key={filter.key}
            label={filter.label}
            value={filter.isActive ? "Selected" : "View"}
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {commandCenter.leaderboardChapters.map((chapter) => (
          <article key={chapter.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-xs font-black text-blue-600">{chapter.rankLabel}</div>
                <h2 className="mt-1 text-sm font-black text-slate-900">{chapter.chapterName}</h2>
                <p className="text-xs text-slate-500">{chapter.countryLabel}</p>
              </div>
              <SmallPill label={chapter.healthLabel} />
            </div>
            <p className="mb-3 text-xs leading-5 text-slate-600">{chapter.quote}</p>
            <div className="grid grid-cols-2 gap-2">
              {chapter.metrics.map((metric) => (
                <MiniStat key={metric.label} label={metric.label} value={Number.parseInt(metric.value, 10) || 0} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function LeaderMembersContent({ commandCenter }: { commandCenter: ChapterLeaderCommandCenter }) {
  return (
    <div className="space-y-5">
      <LeaderHero
        title="Member Pipeline"
        subtitle={`${commandCenter.pipelineRows.length} of ${commandCenter.pipelineTotalCount} members visible · leadership growth and points`}
        icon={Users}
      />
      <div className="grid gap-3 md:grid-cols-4">
        {commandCenter.pipelineSnapshots.map((snapshot) => (
          <LeaderMetricCard
            key={snapshot.label}
            label={snapshot.label}
            note={snapshot.note}
            value={snapshot.value}
          />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <SectionHeading>Member Pipeline</SectionHeading>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Member", "Role", "Committee", "Points", "Events", "Evidence", "Next Step"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {commandCenter.pipelineRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
                  <td className="px-3 py-2.5">
                    <Link href={row.profileHref} className="font-bold text-slate-900 hover:text-blue-600">
                      {row.displayName}
                    </Link>
                    <div className="text-[10px] text-slate-400">{row.lastActiveLabel}</div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{row.roleLabel}</td>
                  <td className="px-3 py-2.5 text-slate-600">{row.committeeLane}</td>
                  <td className="px-3 py-2.5 font-mono font-black text-blue-600">
                    {row.points.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{row.eventsMadeLabel}</td>
                  <td className="px-3 py-2.5 text-slate-600">{row.evidenceLabel}</td>
                  <td className="min-w-52 px-3 py-2.5 text-slate-600">{row.nextStepLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LeaderMemberProfileContent({
  commandCenter,
}: {
  commandCenter: ChapterLeaderCommandCenter;
}) {
  const member = commandCenter.selectedMember;

  if (!member) {
    return <LeaderMissingContent title="Member Profile" />;
  }

  return (
    <div className="space-y-5">
      <LeaderHero title="Member Profile" subtitle={member.nextStep} icon={Users} />
      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <Avatar name={member.displayName} color={BLUE} size={56} />
          <h1 className="mt-4 text-lg font-black text-slate-900">{member.displayName}</h1>
          <p className="text-sm text-slate-500">{member.roleLabel}</p>
          <p className="mt-1 text-xs text-slate-500">{member.committeeLane}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <LeaderMetricCard
            label="Points"
            value={member.points.toLocaleString()}
            note={member.weeklyPointsDeltaLabel}
          />
          <LeaderMetricCard label="Events created" value={member.eventsCreatedLabel} />
          <LeaderMetricCard
            label="Actions"
            value={String(member.completedActions)}
            note={`${member.openAssignments} open`}
          />
          <LeaderMetricCard label="Bridge videos" value={member.bridgeVideosLabel} />
          <LeaderMetricCard label="Readiness" value={member.readinessLabel} />
          <LeaderMetricCard label="Last active" value={member.lastActiveLabel} />
        </div>
      </div>
    </div>
  );
}

function LeaderCommitteesContent({
  commandCenter,
}: {
  commandCenter: ChapterLeaderCommandCenter;
}) {
  return (
    <div className="space-y-5">
      <LeaderHero
        title="Event Committees"
        subtitle={`${commandCenter.committeesOverview.activeCommitteesLabel} active · ${commandCenter.committeesOverview.totalOpenActionsLabel} open actions`}
        icon={Layers}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {commandCenter.committees.map((committee) => (
          <article key={committee.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">{committee.name}</h2>
                <p className="text-xs text-slate-500">{committee.ownerLabel}</p>
              </div>
              <SmallPill label={committee.operatingStatusLabel} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniTextStat label="Members" value={committee.memberCountLabel} />
              <MiniTextStat label="Actions" value={committee.actionsDoneLabel} />
              <MiniTextStat label="Events" value={committee.eventsCountLabel} />
              <MiniTextStat label="KPI" value={committee.kpiLabel} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">{committee.summary}</p>
            <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
              {committee.nextEventTitle} · {committee.nextEventTiming} · {committee.lumaStatusLabel}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function LeaderEventsContent({
  calendarLabel,
  commandCenter,
  eventReadback,
}: {
  calendarLabel: string;
  commandCenter: ChapterLeaderCommandCenter;
  eventReadback: LaunchLaneLeaderEventReadback[];
}) {
  return (
    <div className="space-y-5">
      <LeaderHero
        title="Event Performance"
        subtitle={`${calendarLabel} · Luma event creation, RSVP, attendance, and points`}
        icon={Calendar}
      />
      <div className="grid gap-3 md:grid-cols-5">
        <LeaderMetricCard
          label="Events"
          value={String(commandCenter.eventsOverview.totalEventsThisMonth)}
          note={commandCenter.eventsOverview.monthLabel}
        />
        <LeaderMetricCard
          label="Attendance"
          value={commandCenter.eventsOverview.attendanceRateLabel}
          note={commandCenter.eventsOverview.attendanceDeltaLabel}
        />
        <LeaderMetricCard
          label="RSVP conversion"
          value={commandCenter.eventsOverview.rsvpConversionLabel}
        />
        <LeaderMetricCard label="Proof" value={commandCenter.eventsOverview.eventsWithProofLabel} />
        <LeaderMetricCard
          label="Follow-up overdue"
          value={String(commandCenter.eventsOverview.followUpsOverdue)}
        />
      </div>
      {eventReadback.length > 0 ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <SectionHeading>Luma readback</SectionHeading>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {eventReadback.slice(0, 3).map((event) => (
              <div key={event.id} className="rounded-lg bg-white p-3">
                <h2 className="text-sm font-bold text-slate-900">{event.title}</h2>
                <p className="mt-1 text-xs text-slate-500">{event.statusLabel}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniStat label="RSVPs" value={event.rsvpCount} />
                  <MiniStat label="Attended" value={event.attendanceCount} />
                  <MiniStat label="Points" value={event.pointsAwarded} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {commandCenter.events.map((event) => (
          <article key={event.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">{event.title}</h2>
                <p className="text-xs text-slate-500">{event.lane} · {event.timing}</p>
              </div>
              <SmallPill label={event.lumaStatusLabel} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MiniTextStat label="RSVPs" value={event.rsvpCount?.toString() ?? "0"} />
              <MiniTextStat label="Attended" value={event.attendedCount?.toString() ?? "0"} />
              <MiniTextStat label="Rate" value={event.attendanceRateLabel} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">{event.expectedStudentAction}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{event.proofPrompt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function LeaderImpactContent({ commandCenter }: { commandCenter: ChapterLeaderCommandCenter }) {
  return (
    <div className="space-y-5">
      <LeaderHero title="Impact Dashboard" subtitle="Local impact, global MEDLIFE outcomes, and campaign progress" icon={Heart} />
      <div className="grid gap-3 md:grid-cols-4">
        {commandCenter.impactCards.map((card) => (
          <LeaderMetricCard key={card.label} label={card.label} value={card.value} note={card.note} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {commandCenter.impactHighlights.map((highlight) => (
          <article key={highlight.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              {highlight.eyebrow}
            </div>
            <div className="mt-2 font-mono text-2xl font-black text-slate-900">{highlight.value}</div>
            <h2 className="mt-1 text-sm font-bold text-slate-900">{highlight.label}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-600">{highlight.summary}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function LeaderBridgeVideosContent({
  commandCenter,
}: {
  commandCenter: ChapterLeaderCommandCenter;
}) {
  return (
    <div className="space-y-5">
      <LeaderHero title="Bridge Video Hub" subtitle={commandCenter.bridgeVideoCultureNote} icon={Video} />
      <div className="grid gap-3 md:grid-cols-4">
        {commandCenter.bridgeVideoMetrics.map((metric) => (
          <LeaderMetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {commandCenter.bridgeVideoEntries.map((entry) => (
          <article key={entry.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-8 flex h-28 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Video size={24} />
            </div>
            <h2 className="text-sm font-black text-slate-900">{entry.title}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {entry.authorLabel} · {entry.categoryLabel} · {entry.submittedDateLabel}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <MiniTextStat label="Views" value={entry.viewsLabel} />
              <MiniTextStat label="Likes" value={entry.likesLabel} />
              <MiniTextStat label="Using" value={entry.chaptersUsingLabel} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function LeaderSuccessionContent({
  commandCenter,
}: {
  commandCenter: ChapterLeaderCommandCenter;
}) {
  return (
    <div className="space-y-5">
      <LeaderHero
        title="Succession Planning"
        subtitle={commandCenter.successionOverview.transitionReadinessNote}
        icon={Award}
      />
      <div className="grid gap-3 md:grid-cols-4">
        <LeaderMetricCard label="E-board roles" value={commandCenter.successionOverview.eboardRolesFilledLabel} />
        <LeaderMetricCard label="Committees" value={commandCenter.successionOverview.activeCommitteesLabel} />
        <LeaderMetricCard label="Candidates" value={commandCenter.successionOverview.candidatesIdentifiedLabel} />
        <LeaderMetricCard label="Readiness" value={commandCenter.successionOverview.transitionReadinessLabel} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {commandCenter.successionCandidates.map((candidate) => (
          <article key={candidate.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">{candidate.displayName}</h2>
                <p className="text-xs text-slate-500">
                  {candidate.currentRole} · {candidate.committeeLabel}
                </p>
              </div>
              <SmallPill label={candidate.badgeLabel} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniTextStat label="Points" value={candidate.pointsLabel} />
              <MiniTextStat label="Readiness" value={candidate.readinessLabel} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">{candidate.reason}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function LeaderFeedAnalyticsContent({
  commandCenter,
}: {
  commandCenter: ChapterLeaderCommandCenter;
}) {
  return (
    <div className="space-y-5">
      <LeaderHero title="Feed Analytics" subtitle="Chapter feed engagement, event RSVPs, and action follow-through" icon={Activity} />
      <div className="grid gap-3 md:grid-cols-4">
        {commandCenter.feedMetrics.map((metric) => (
          <LeaderMetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <SectionHeading>Feed posts</SectionHeading>
        </div>
        <div className="divide-y divide-slate-100">
          {commandCenter.feedPostRows.map((post) => (
            <article key={post.id} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto]">
              <div>
                <h2 className="text-sm font-black text-slate-900">{post.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {post.typeLabel} · {post.authorLabel} · {post.dateLabel}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-600">{post.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 md:w-56">
                <MiniTextStat label="Views" value={post.viewsLabel} />
                <MiniTextStat label="Likes" value={post.likesLabel} />
                <MiniTextStat label="Actions" value={post.actionsAfterLabel} />
                <MiniTextStat label="RSVPs" value={post.rsvpsLabel} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderHero({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-start justify-between gap-6 rounded-2xl bg-[#07192E] p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Icon size={20} />
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-blue-300">
            Student Leadership Command Center
          </div>
          <h1 className="text-2xl font-black text-white">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-200">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function LeaderMetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-2 font-mono text-2xl font-black text-slate-900">{value}</div>
      {note ? <div className="mt-1 text-xs text-slate-500">{note}</div> : null}
    </div>
  );
}

function MiniTextStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <div className="font-mono text-sm font-black text-slate-900">{value}</div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>
    </div>
  );
}

function LeaderMissingContent({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h1 className="text-base font-black text-slate-900">{title}</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        Figma page missing - implementation blocked. This leader route will not be parked into a
        different command-center screen.
      </p>
    </div>
  );
}

function Avatar({ name, color, size }: { name: string; color: string; size: number }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function RadialGauge({ score, size }: { score: number; size: number }) {
  const radius = size / 2 - 11;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - score / 100);

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.13)"
        strokeWidth={10}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={YELLOW}
        strokeDasharray={circumference}
        strokeDashoffset={progress}
        strokeLinecap="round"
        strokeWidth={10}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 - 3}
        dominantBaseline="middle"
        fill="white"
        fontSize={size * 0.24}
        fontWeight="800"
        textAnchor="middle"
      >
        {score}
      </text>
      <text
        x={size / 2}
        y={size / 2 + size * 0.18}
        fill="#bfdbfe"
        fontSize={size * 0.11}
        textAnchor="middle"
      >
        / 100
      </text>
    </svg>
  );
}

function CampaignPill({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "blue" | "amber" | "purple";
}) {
  const toneClassName = {
    blue: "border-blue-500/30 bg-blue-500/20 text-blue-200",
    amber: "border-amber-500/30 bg-amber-500/20 text-amber-200",
    purple: "border-purple-500/30 bg-purple-500/20 text-purple-200",
  }[tone];

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        toneClassName,
      ].join(" ")}
    >
      {icon}
      {label}
    </span>
  );
}

function FillBars({
  label,
  value,
  filled,
  total,
  color,
}: {
  label: string;
  value: string;
  filled: number;
  total: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="font-medium text-slate-400">{label}</span>
        <span className="font-bold text-white">{value}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, index) => (
          <div
            key={index}
            className="h-2 flex-1 rounded-full"
            style={{ background: index < filled ? color : "rgba(255,255,255,0.12)" }}
          />
        ))}
      </div>
    </div>
  );
}

function FigmaButton({
  href,
  tone,
  children,
}: {
  href: string;
  tone: "primary" | "light" | "primaryWide" | "secondaryWide";
  children: React.ReactNode;
}) {
  const toneClassName = {
    primary: "bg-[#1A56E8] text-white hover:bg-blue-700",
    light: "border border-white/20 bg-white/10 text-white hover:bg-white/20",
    primaryWide: "w-full justify-start bg-[#1A56E8] text-white hover:bg-blue-700",
    secondaryWide:
      "w-full justify-start border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  }[tone];

  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all",
        toneClassName,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold text-slate-800">{children}</h2>;
}

function MetricCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
      <div className="absolute left-0 right-0 top-0 h-0.5 rounded-t-xl" style={{ background: accent }} />
      <Icon size={15} className="text-slate-400" />
      <div className="font-mono text-2xl font-black leading-none text-slate-900">{value}</div>
      <div className="truncate text-[11px] text-slate-400">{sub}</div>
      <div className="text-[11px] font-medium leading-tight text-slate-500">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white px-2 py-1.5">
      <div className="font-mono text-sm font-black leading-none text-slate-900">{value}</div>
      <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
    </div>
  );
}

function SmallPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
      {label}
    </span>
  );
}
