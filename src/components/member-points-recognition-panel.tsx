import type { MemberActionRouteSource } from "@/services/member-action-route-href";
import {
  getLaunchLaneMemberEventsHref,
  getLaunchLaneMemberPointsHref,
} from "@/services/events-points-launch-lane";
import type { MemberRecognitionSummary } from "@/services/member-recognition";
import type { LaunchLaneMemberPointsReadback } from "@/services/launch-lane-points-readback";
import { EventLoopStrip } from "@/components/event-loop-strip";
import {
  PanelButton,
  SurfacePanel,
  StatCard,
  StatusPill,
} from "@/components/visual-primitives";

type MemberPointsRecognitionPanelProps = {
  recognition: MemberRecognitionSummary;
  chapterName: string;
  source?: MemberActionRouteSource | null;
  liveReadback?: LaunchLaneMemberPointsReadback | null;
};

export function MemberPointsRecognitionPanel({
  recognition,
  chapterName,
  source,
  liveReadback,
}: MemberPointsRecognitionPanelProps) {
  if (!recognition.canReadRecognition) {
    return null;
  }
  const sourceContext = getMemberPointsSourceContext(source);
  const launchLaneEventsHref = getLaunchLaneMemberEventsHref("points");
  const launchLanePointsHref = getLaunchLaneMemberPointsHref("points");

  return (
    <div className="grid gap-3">
      <SurfacePanel tone="info" className="overflow-hidden rounded-[2rem] p-4">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
          {chapterName}
        </p>
        <h1 className="mt-2 text-[2.1rem] font-semibold leading-tight text-slate-950 sm:text-[2.5rem]">
          Points &amp; Recognition
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Points come from meaningful action.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <PointsHeroCard label="Events" title="Show up first" detail="RSVP and attendance drive the loop" />
          <PointsHeroCard
            label="Leaderboard"
            title={recognition.selectedMember ? `#${recognition.selectedMember.rank}` : "Chapter board"}
            detail="Your rank moves with approved work"
          />
          <PointsHeroCard
            label="Next earn"
            title={recognition.recentApprovedActions[0]?.pointsLabel ?? "+10 pts"}
            detail="Open events from the points route"
          />
        </div>
        {sourceContext ? (
          <div className="mt-4 rounded-[1.3rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {sourceContext.eyebrow}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {sourceContext.compactDetail}
                </p>
              </div>
              <PanelButton
                href={sourceContext.href}
                variant="secondary"
                className="w-fit"
              >
                {sourceContext.backLabel}
              </PanelButton>
            </div>
          </div>
        ) : null}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {recognition.topStats.map((stat) => (
          <SurfacePanel
            as="article"
            key={stat.label}
            className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-2.5 text-3xl font-semibold leading-none text-slate-950">
              {stat.value}
            </p>
            <p className="mt-1.5 text-xs leading-5 text-slate-600">{stat.note}</p>
            </SurfacePanel>
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel tone="info">
        <p className="app-eyebrow app-eyebrow-blue">Event loop</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Events create attendance, attendance creates points.
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Use the event route to RSVP, show up, and let the chapter leaderboard
          reflect the real work that happened.
        </p>
          <EventLoopStrip
            className="mt-4"
            items={[
              { label: "Events", detail: "Explore Luma-backed moments", tone: "blue" },
              { label: "RSVP", detail: "Confirm attendance intent", tone: "blue" },
              { label: "Attendance", detail: "Record who showed up", tone: "gold" },
              { label: "Points", detail: "Leaderboard refresh after attendance", tone: "yellow" },
            ]}
          />
        <div className="mt-4 flex flex-wrap gap-2">
          <PanelButton href={launchLaneEventsHref} variant="secondary">
            Open events
          </PanelButton>
          <PanelButton href={launchLanePointsHref}>Open leaderboard</PanelButton>
        </div>
      </SurfacePanel>

      {liveReadback ? (
        <SurfacePanel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="app-eyebrow app-eyebrow-blue">Live pilot readback</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {liveReadback.eventTitle}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{liveReadback.timing}</p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">
                {liveReadback.memberStatusDetail}
              </p>
            </div>
            <StatusPill
              tone={liveReadback.memberPointsAwarded > 0 ? "blue" : liveReadback.attendanceCount > 0 ? "gold" : "white"}
            >
              {liveReadback.memberStatusLabel}
            </StatusPill>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="RSVPs"
              value={`${liveReadback.rsvpCount}`}
              note="Signed-in member intent plus chapter guest count."
            />
            <StatCard
              label="Attendance"
              value={`${liveReadback.attendanceCount}`}
              note="Confirmed attendance from the event loop."
            />
            <StatCard
              label="Event points"
              value={`${liveReadback.eventPointsAwarded}`}
              note="Points already reflected for this specific event."
            />
            <StatCard
              label="Your event points"
              value={`${liveReadback.memberPointsAwarded}`}
              note={`Chapter total: ${liveReadback.chapterTotalPoints} pts`}
            />
          </div>

          <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-[#fbfdff] p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Next step in this event loop
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {liveReadback.nextStepLabel}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {liveReadback.nextStepDetail}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <PanelButton href={liveReadback.eventDetailHref} variant="secondary">
                Open event detail
              </PanelButton>
              <PanelButton href={liveReadback.leaderboardHref}>
                Open leaderboard
              </PanelButton>
            </div>
          </div>
        </SurfacePanel>
      ) : null}

      <SurfacePanel>
        <p className="app-eyebrow app-eyebrow-blue">Badges Earned</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {recognition.badges.map((badge) => (
            <SurfacePanel
              as="article"
              key={badge.label}
              className={getBadgeCardClassName(badge.tone)}
            >
              <div className="flex items-start gap-3">
                <div className={getBadgeIconClassName(badge.tone)}>
                  <span aria-hidden="true">☆</span>
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-950">{badge.label}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {getBadgeDetail(badge.label)}
                  </p>
                </div>
              </div>
            </SurfacePanel>
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="app-eyebrow app-eyebrow-blue">
              Chapter Leaderboard
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          {recognition.leaderboard.map((row, index) => (
            <SurfacePanel
              as="article"
              key={row.id}
              className="rounded-[1.35rem] border border-slate-200 bg-[#dbeafe] p-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {index + 1}. {row.displayName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{row.roleLabel}</p>
                </div>
                <StatusPill tone="gold">{row.points} pts</StatusPill>
              </div>
            </SurfacePanel>
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel>
        <p className="app-eyebrow app-eyebrow-blue">Recent points activity</p>
        <div className="mt-3 grid gap-2.5">
          {recognition.recentApprovedActions.map((action) => (
            <SurfacePanel
              as="article"
              key={`${action.title}-${action.pointsLabel}`}
              className="rounded-[1.35rem] border border-slate-200 bg-[#dbeafe] p-3.5 transition hover:border-[#bfdbfe] hover:bg-[#fbfdff]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">{action.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{action.detail}</p>
                </div>
                <StatusPill tone="blue">
                  {action.pointsLabel}
                </StatusPill>
              </div>
              <PanelButton href={launchLaneEventsHref} className="mt-3 w-full rounded-[1.2rem]">
                Open event loop
              </PanelButton>
            </SurfacePanel>
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel tone="info">
        <p className="app-eyebrow app-eyebrow-blue">{recognition.explainer.title}</p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{recognition.explainer.body}</p>
        <PanelButton
          href={launchLaneEventsHref}
          className="mt-4 border border-[#bfdbfe] bg-white text-[#2563eb]"
        >
          Open events →
        </PanelButton>
      </SurfacePanel>
    </div>
  );
}

function getMemberPointsSourceContext(source: MemberActionRouteSource | null | undefined) {
  switch (source) {
    case "home":
      return {
        eyebrow: "From home",
        compactDetail:
          "Home handed you into recognition as part of the weekly loop. Review progress here and still jump back without losing the member-home context.",
        href: "/app",
        backLabel: "Back to home",
      };
    case "events":
      return {
        eyebrow: "From events",
        compactDetail:
          "Events can turn into recognition when the follow-up is real. Review points here, then return to the event loop if you still need that context.",
        href: getLaunchLaneMemberEventsHref("events"),
        backLabel: "Back to events",
      };
    case "profile":
      return {
        eyebrow: "From profile",
        compactDetail:
          "Profile should stay distinct while still connecting to meaningful recognition. Review your standing here and return when you need the broader member summary.",
        href: "/profile",
        backLabel: "Back to profile",
      };
    default:
      return null;
  }
}

function PointsHeroCard({
  label,
  title,
  detail,
}: {
  label: string;
  title: string;
  detail: string;
}) {
  return (
    <StatCard
      label={label}
      value={title}
      tone="highlight"
      note={detail}
      className="rounded-[1.35rem] bg-white/12 border-white/12 backdrop-blur-sm px-3.5 py-3"
    />
  );
}

function getBadgeCardClassName(tone: MemberRecognitionSummary["badges"][number]["tone"]) {
  switch (tone) {
    case "gold":
      return "rounded-[1.35rem] border border-[#2563eb]/30 bg-[#eff6ff] p-4";
    case "blue":
      return "rounded-[1.35rem] border border-[#bfdbfe] bg-[#fbfdff] p-4";
    case "slate":
      return "rounded-[1.35rem] border border-slate-200 bg-[#dbeafe]/70 p-4 opacity-80";
    default:
      return "rounded-[1.35rem] border border-[#bfdbfe] bg-[#fbfdff] p-4";
  }
}

function getBadgeIconClassName(tone: MemberRecognitionSummary["badges"][number]["tone"]) {
  switch (tone) {
    case "gold":
      return "flex h-10 w-10 items-center justify-center rounded-full border border-[#2563eb]/40 bg-[#dbeafe] text-[#1d4ed8]";
    case "blue":
      return "flex h-10 w-10 items-center justify-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]";
    case "slate":
      return "flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-[#eff6ff] text-slate-500";
    default:
      return "flex h-10 w-10 items-center justify-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]";
  }
}

function getBadgeDetail(label: string) {
  switch (label) {
    case "Event Starter":
      return "Attend your first chapter event";
    case "Connector":
      return "Invite 10+ members to a chapter event";
    case "Evidence Pro":
      return "3 approvals in a single week";
    case "Chapter MVP":
      return "Top 3 on leaderboard for 2 weeks";
    default:
      return "Chapter recognition badge";
  }
}
