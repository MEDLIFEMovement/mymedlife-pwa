import { EventLoopStrip } from "@/components/event-loop-strip";
import {
  getLaunchLaneMemberEventsHref,
  getLaunchLaneMemberPointsHref,
} from "@/services/events-points-launch-lane";
import type { MvpMemberHome } from "@/services/mvp-event-tracking-workspace";
import type { ProfileWorkspace } from "@/services/profile-workspace";
import type { MemberRecognitionSummary } from "@/services/member-recognition";
import { PanelButton, SurfacePanel, StatCard } from "@/components/visual-primitives";

type MemberProfilePanelProps = {
  chapterName: string;
  displayName: string;
  workspace: ProfileWorkspace;
  studentHome: MvpMemberHome;
  recognition: MemberRecognitionSummary;
};

export function MemberProfilePanel({
  chapterName,
  displayName,
  workspace,
  studentHome,
  recognition,
}: MemberProfilePanelProps) {
  const firstName = displayName.split(" ")[0] ?? displayName;
  const visibleBadges = recognition.badges.slice(0, 4);
  const featuredHomeEvent = studentHome.primaryEvent;
  const launchLaneEventsHref = getLaunchLaneMemberEventsHref("profile");
  const launchLanePointsHref = getLaunchLaneMemberPointsHref("profile");
  const nextStepTitle = featuredHomeEvent?.title ?? "Open the next chapter event";

  return (
    <section className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] shadow-[0_24px_80px_rgba(2,14,38,0.12)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                {chapterName}
              </p>
              <h1 className="mt-2 text-[2.25rem] font-semibold leading-none text-slate-950 sm:text-[2.6rem]">
                Hi, {firstName}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Keep your identity, role, and next step close at hand.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {workspace.profileLabel}
            </span>
          </div>

          <SurfacePanel tone="info" className="mt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                  Profile snapshot
                </p>
                <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-950">
                  {displayName}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {workspace.profileLabel} · {chapterName}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#bfdbfe] bg-white text-xl font-semibold text-[#2563eb]">
              {firstName.slice(0, 1)}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Keep this surface centered on identity, role, and the next step. Recognition
              and points stay visible lower on the route instead of turning profile into a
              second dashboard, so profile can hand you back to the event-and-points loop
              when you are ready to move again.
            </p>
            <div className="mt-4 rounded-[1.2rem] border border-[#bfdbfe] bg-white/90 p-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                Read-only profile
              </p>
              <ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-600">
                {workspace.safetyNotes.slice(0, 2).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          </SurfacePanel>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <ProfileHeroCard
              label="Next event"
              title={featuredHomeEvent?.title ?? "Open events"}
              detail={featuredHomeEvent?.timing ?? "See the next chapter moment"}
            />
            <ProfileHeroCard
              label="Points"
              title={`${studentHome.pointsTotal} pts`}
              detail={studentHome.pointsDetail}
            />
            <ProfileHeroCard
              label="Leaderboard"
              title={studentHome.pointsRankLabel}
              detail="Open the chapter board from profile"
            />
          </div>

          <SurfacePanel tone="info" className="mt-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                  Event loop
                </p>
                <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-950">
                  RSVP, attendance, and points should stay in view here too.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Profile works best when it can hand you back to the next event, the next
                  point move, and the next chapter moment without making you hunt for them.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-[26rem]">
                <ProfilePulseCard label="Next event" value={featuredHomeEvent?.title ?? "Open events"} />
                <ProfilePulseCard label="RSVP" value={featuredHomeEvent?.rsvpLabel ?? "Open"} />
                <ProfilePulseCard
                  label="Attendance"
                  value={studentHome.attendanceStatusLabel}
                />
                <ProfilePulseCard
                  label="Points"
                  value={`${studentHome.pointsTotal} pts`}
                />
              </div>
            </div>
          </SurfacePanel>
        </div>
      </section>

      <SurfacePanel tone="info">
        <p className="app-eyebrow app-eyebrow-blue">Event loop</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Keep events and points one tap away from profile.
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Profile should help you jump back into the chapter moment: open an
          event, check attendance, and see how the chapter leaderboard changes
          when work is approved.
        </p>
        <EventLoopStrip
          className="mt-4"
          items={[
            {
              label: "Next event",
              detail: featuredHomeEvent?.title ?? "Open events",
              tone: "blue",
            },
            {
              label: "RSVP",
              detail: featuredHomeEvent?.rsvpLabel ?? "Open",
              tone: "blue",
            },
            {
              label: "Attendance",
              detail: studentHome.attendanceStatusLabel,
              tone: "gold",
            },
            {
              label: "Points",
              detail: `${studentHome.pointsTotal} pts`,
              tone: "yellow",
            },
          ]}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <PanelButton href={launchLaneEventsHref} variant="secondary">
            Open events
          </PanelButton>
          <PanelButton href={launchLanePointsHref}>Open leaderboard</PanelButton>
        </div>
      </SurfacePanel>

      <SurfacePanel tone="info">
        <p className="app-eyebrow app-eyebrow-blue">Next chapter moment</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          {nextStepTitle}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Keep profile lightweight. From here, the next useful move is to open an
          event, RSVP or check attendance, and then watch the chapter points move.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <PanelButton href={launchLaneEventsHref}>
            Open events
          </PanelButton>
          <PanelButton
            href={launchLanePointsHref}
            variant="secondary"
            className="bg-white text-slate-700"
          >
            Open points
          </PanelButton>
        </div>
      </SurfacePanel>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <SurfacePanel>
          <p className="app-eyebrow app-eyebrow-blue">About you</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Keep identity easy to trust.
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.identityRows.map((row) => (
              <ProfileRowCard key={row.label} row={row} />
            ))}
          </div>
        </SurfacePanel>

        <SurfacePanel>
          <p className="app-eyebrow app-eyebrow-blue">Chapter access</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Where you fit in right now.
          </h2>
          <div className="mt-4 grid gap-3">
            {workspace.scopeRows.map((row) => (
              <ProfileRowCard key={row.label} row={row} />
            ))}
          </div>
        </SurfacePanel>
      </section>

      <SurfacePanel>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="app-eyebrow app-eyebrow-blue">Recognition</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Recognition</h2>
          </div>
          <PanelButton
            href={launchLanePointsHref}
            variant="secondary"
            className="px-3 py-2 text-xs"
          >
            Open points and recognition
          </PanelButton>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleBadges.map((badge) => (
            <span key={badge.label} className={getBadgeClassName(badge.tone)}>
              {badge.label}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{studentHome.recognition}</p>
      </SurfacePanel>
    </section>
  );
}

function ProfileRowCard({
  row,
}: {
  row: ProfileWorkspace["identityRows"][number];
}) {
  return (
    <SurfacePanel className="p-3.5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {row.label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-950">{row.value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{row.detail}</p>
    </SurfacePanel>
  );
}

function ProfileHeroCard({
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
      className="rounded-[1.35rem] border-white/12 bg-white/10 backdrop-blur-sm px-3.5 py-3 text-white"
    />
  );
}

function ProfilePulseCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[1.2rem] border border-white/12 bg-white/12 px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </article>
  );
}

function getBadgeClassName(tone: MemberRecognitionSummary["badges"][number]["tone"]) {
  switch (tone) {
    case "gold":
      return "rounded-full border border-[#2563eb]/40 bg-[#dbeafe] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8]";
    case "blue":
      return "rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-[#2563eb]";
    case "green":
      return "rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700";
    case "slate":
      return "rounded-full border border-slate-200 bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-slate-700";
  }
}
