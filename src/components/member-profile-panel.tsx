import { EventLoopStrip } from "@/components/event-loop-strip";
import type { ProfileWorkspace } from "@/services/profile-workspace";
import type { MemberRecognitionSummary } from "@/services/member-recognition";
import type { StudentHomeWorkspace } from "@/services/student-home-workspace";
import { PanelButton, SurfacePanel, StatCard } from "@/components/visual-primitives";

type MemberProfilePanelProps = {
  chapterName: string;
  displayName: string;
  workspace: ProfileWorkspace;
  studentHome: StudentHomeWorkspace;
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
  const featuredHomeAction = studentHome.assignedActions[0];
  const featuredHomeEvent = studentHome.upcomingEvents[0] ?? null;
  const nextStepTitle = featuredHomeAction?.title ?? workspace.nextStep.detail;
  const nextStepHref = workspace.nextStep.href;

  return (
    <section className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-[var(--mymedlife-border)] bg-[var(--background)] shadow-[0_24px_80px_rgb(var(--mymedlife-deep-rgb)/0.12)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
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
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
                  Profile snapshot
                </p>
                <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-950">
                  {displayName}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {workspace.profileLabel} · {chapterName}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--mymedlife-border)] bg-white text-xl font-semibold text-[var(--mymedlife-primary-button)]">
              {firstName.slice(0, 1)}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Keep this surface centered on identity, role, and the next step. Recognition
              and points stay visible lower on the route instead of turning profile into a
              second dashboard, so profile can hand you back to the event-and-points loop
              when you are ready to move again.
            </p>
          </SurfacePanel>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <ProfileHeroCard
              label="Next event"
              title={featuredHomeEvent?.title ?? "Open events"}
              detail={featuredHomeEvent?.timing ?? "See the next chapter moment"}
            />
            <ProfileHeroCard
              label="Points"
              title={`${studentHome.points.total} pts`}
              detail={studentHome.points.rankDetail}
            />
            <ProfileHeroCard
              label="Leaderboard"
              title={studentHome.points.rankLabel}
              detail="Open the chapter board from profile"
            />
          </div>

          <SurfacePanel tone="info" className="mt-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
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
                  value={studentHome.points.weeklyMomentumLabel}
                />
                <ProfilePulseCard
                  label="Points"
                  value={`${studentHome.points.total} pts`}
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
              detail: studentHome.points.weeklyMomentumLabel,
              tone: "gold",
            },
            {
              label: "Points",
              detail: `${studentHome.points.total} pts`,
              tone: "yellow",
            },
          ]}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <PanelButton href="/rush-month/events?source=profile" variant="secondary">
            Open events
          </PanelButton>
          <PanelButton href="/rush-month/leaderboard?source=profile">Open leaderboard</PanelButton>
        </div>
      </SurfacePanel>

      <SurfacePanel tone="info">
        <p className="app-eyebrow app-eyebrow-blue">Next step</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Finish: {nextStepTitle}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Pick up the next step that matters most without losing your place in the
          member experience.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <PanelButton href={nextStepHref}>
            {workspace.nextStep.label}
          </PanelButton>
          <PanelButton
            href={`${studentHome.campaign.campaignsHref}?source=profile`}
            variant="secondary"
            className="bg-white text-slate-700"
          >
            Open campaign
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
            href="/rush-month/leaderboard?source=profile"
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
        <p className="mt-4 text-sm leading-6 text-slate-600">{studentHome.points.recognition}</p>
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
      note={<p>{detail}</p>}
      className="rounded-[1.35rem] border-white/12 bg-white/10 backdrop-blur-sm px-3.5 py-3 text-white"
    />
  );
}

function ProfilePulseCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[1.2rem] border border-white/12 bg-white/12 px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </article>
  );
}

function getBadgeClassName(tone: MemberRecognitionSummary["badges"][number]["tone"]) {
  switch (tone) {
    case "gold":
      return "rounded-full border border-[var(--mymedlife-primary-button)]/40 bg-[var(--mymedlife-badge-background)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-info)]";
    case "blue":
      return "rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-primary-button)]";
    case "green":
      return "rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-info)]";
    case "slate":
      return "rounded-full border border-slate-200 bg-[var(--background)] px-3 py-1.5 text-sm font-semibold text-slate-700";
  }
}
