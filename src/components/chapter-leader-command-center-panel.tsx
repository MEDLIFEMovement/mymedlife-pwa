import Link from "next/link";
import type { ReactNode } from "react";

import type {
  ChapterLeaderCommandCenter,
  ChapterLeaderCommandCenterBridgeStory,
  ChapterLeaderCommandCenterCommitteeCard,
  ChapterLeaderCommandCenterEventCard,
  ChapterLeaderCommandCenterLeadershipRole,
  ChapterLeaderCommandCenterMemberProfile,
  ChapterLeaderCommandCenterPipelineItem,
  ChapterLeaderCommandCenterRiskAlert,
  ChapterLeaderCommandCenterSuccessionCandidate,
} from "@/services/chapter-leader-command-center";

type ChapterLeaderCommandCenterPanelProps = {
  commandCenter: ChapterLeaderCommandCenter;
};

export function ChapterLeaderCommandCenterPanel({
  commandCenter,
}: ChapterLeaderCommandCenterPanelProps) {
  if (!commandCenter.canReadCommandCenter) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              Student leadership command center
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold text-white">
                {commandCenter.chapterName}
              </h1>
              {commandCenter.sampleLabel ? (
                <span className="rounded-full border border-[#f7d05e]/30 bg-[#f7d05e]/12 px-3 py-1 text-xs font-semibold text-[#f7d05e]">
                  {commandCenter.sampleLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              {commandCenter.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ContextPill label={commandCenter.campusLabel} />
              <ContextPill label={`${commandCenter.regionLabel} region`} />
              <ContextPill label={`Coach: ${commandCenter.coachLabel}`} />
            </div>
          </div>

          <article className="min-w-full rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/10 p-4 xl:min-w-72">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
              Chapter health
            </p>
            <div className="mt-3 flex items-end gap-3">
              <p className="text-5xl font-semibold text-white">
                {commandCenter.healthScore}
              </p>
              <TonePill
                tone={commandCenter.healthTone}
                label={getHealthLabel(commandCenter.healthTone)}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-white/66">
              {commandCenter.healthNote}
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {commandCenter.quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={[
              "rounded-[1.6rem] border px-4 py-4 transition",
              action.tone === "primary"
                ? "border-emerald-300/25 bg-emerald-300/12 hover:border-emerald-200/40 hover:bg-emerald-300/18"
                : "border-white/10 bg-white/[0.05] hover:border-white/20 hover:bg-white/[0.08]",
            ].join(" ")}
          >
            <p className="text-sm font-semibold text-white">{action.label}</p>
            <p className="mt-2 text-sm leading-6 text-white/62">{action.helper}</p>
          </Link>
        ))}
      </section>

      <nav
        aria-label="Leadership command center views"
        className="flex flex-wrap gap-2 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-2"
      >
        {commandCenter.viewOptions.map((option) => (
          <Link
            key={option.key}
            href={option.href}
            aria-current={commandCenter.selectedView === option.key ? "page" : undefined}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              commandCenter.selectedView === option.key
                ? "bg-[#f7d05e] text-[#06211d]"
                : "text-white/70 hover:bg-white/[0.08] hover:text-white",
            ].join(" ")}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <SectionCard eyebrow="Weekly priority" title={commandCenter.weeklyPriority?.title ?? "Leadership focus"}>
          {commandCenter.weeklyPriority ? (
            <>
              <p className="text-sm leading-6 text-white/68">
                {commandCenter.weeklyPriority.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={commandCenter.weeklyPriority.primaryHref}
                  className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
                >
                  {commandCenter.weeklyPriority.primaryLabel}
                </Link>
                <Link
                  href={commandCenter.weeklyPriority.secondaryHref}
                  className="rounded-full border border-white/14 bg-black/20 px-4 py-2 text-sm font-semibold text-white"
                >
                  {commandCenter.weeklyPriority.secondaryLabel}
                </Link>
              </div>
              <p className="mt-4 rounded-[1.25rem] border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/58">
                {commandCenter.safetyNote}
              </p>
            </>
          ) : (
            <p className="text-sm leading-6 text-white/68">
              This leadership surface is only visible to chapter-leader personas.
            </p>
          )}
        </SectionCard>

        <SectionCard eyebrow="Metric cards" title="What needs attention this week?">
          <div className="grid gap-3 sm:grid-cols-2">
            {commandCenter.metrics.map((metric) => (
              <MetricTile
                key={metric.label}
                label={metric.label}
                value={metric.value}
                note={metric.note}
              />
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard eyebrow="Risk alerts" title="What could slow the chapter down?">
          <div className="grid gap-3">
            {commandCenter.riskAlerts.map((alert) => (
              <RiskAlertCard key={alert.title} alert={alert} />
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="E-board roles" title="Who visibly owns each leadership lane?">
          <div className="grid gap-3 sm:grid-cols-2">
            {commandCenter.leadershipRoles.map((role) => (
              <LeadershipRoleCard key={role.key} role={role} />
            ))}
          </div>
        </SectionCard>
      </section>

      {renderView(commandCenter)}
    </section>
  );
}

function renderView(commandCenter: ChapterLeaderCommandCenter) {
  switch (commandCenter.selectedView) {
    case "members":
      return (
        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard eyebrow="Member pipeline" title="Who needs people follow-up first?">
            <div className="grid gap-3">
              {commandCenter.pipelineItems.map((item) => (
                <PipelineItemCard key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          </SectionCard>
          <SectionCard eyebrow="Member profile" title={commandCenter.selectedMember?.displayName ?? "Select a member"}>
            {commandCenter.selectedMember ? (
              <SelectedMemberCard member={commandCenter.selectedMember} />
            ) : null}
          </SectionCard>
        </section>
      );
    case "committees":
      return (
        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard eyebrow="Committees active" title="Which lanes are visibly moving?">
            <div className="grid gap-3">
              {commandCenter.committees.map((committee) => (
                <CommitteeCard key={committee.id} committee={committee} />
              ))}
            </div>
          </SectionCard>
          <SectionCard eyebrow="Events" title="How do events connect to chapter momentum?">
            <div className="grid gap-3">
              {commandCenter.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </SectionCard>
        </section>
      );
    case "impact":
      return (
        <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <SectionCard eyebrow="Impact" title="What do students feel and understand?">
            <div className="grid gap-3 sm:grid-cols-2">
              {commandCenter.impactCards.map((metric) => (
                <MetricTile
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  note={metric.note}
                />
              ))}
            </div>
          </SectionCard>
          <SectionCard eyebrow="Leaderboard" title="Who is setting the chapter tone?">
            <LeaderboardPreview rows={commandCenter.leaderboard} />
          </SectionCard>
          <div className="xl:col-span-2">
            <SectionCard eyebrow="Bridge videos" title="Which stories can help belief travel?">
              <div className="grid gap-3 xl:grid-cols-2">
                {commandCenter.bridgeStories.map((story) => (
                  <BridgeStoryCard key={story.id} story={story} />
                ))}
              </div>
            </SectionCard>
          </div>
        </section>
      );
    case "succession":
      return (
        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard eyebrow="Emerging leaders" title="Who could take on a bigger lane next?">
            <div className="grid gap-3">
              {commandCenter.successionCandidates.map((candidate) => (
                <SuccessionCandidateCard key={candidate.id} candidate={candidate} />
              ))}
            </div>
          </SectionCard>
          <SectionCard eyebrow="Selected profile" title={commandCenter.selectedMember?.displayName ?? "Select a future lead"}>
            {commandCenter.selectedMember ? (
              <SelectedMemberCard member={commandCenter.selectedMember} />
            ) : null}
          </SectionCard>
        </section>
      );
    case "feed":
      return (
        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionCard eyebrow="Feed analytics" title="What could become chapter proof or HQ-ready content?">
            <div className="grid gap-3 sm:grid-cols-2">
              {commandCenter.feedInsights.map((insight) => (
                <MetricTile
                  key={insight.label}
                  label={insight.label}
                  value={insight.value}
                  note={insight.note}
                />
              ))}
            </div>
          </SectionCard>
          <SectionCard eyebrow="Proof / UGC" title="Which stories are worth protecting and curating?">
            <div className="grid gap-3">
              {commandCenter.bridgeStories.map((story) => (
                <BridgeStoryCard key={story.id} story={story} />
              ))}
            </div>
          </SectionCard>
        </section>
      );
    case "overview":
    default:
      return (
        <section className="grid gap-4">
          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard eyebrow="Member pipeline" title="Who needs a human touch right now?">
              <div className="grid gap-3">
                {commandCenter.pipelineItems.map((item) => (
                  <PipelineItemCard key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </div>
            </SectionCard>
            <SectionCard eyebrow="Featured member" title={commandCenter.selectedMember?.displayName ?? "Select a member"}>
              {commandCenter.selectedMember ? (
                <SelectedMemberCard member={commandCenter.selectedMember} />
              ) : null}
            </SectionCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard eyebrow="Committees" title="Which lanes are visibly alive?">
              <div className="grid gap-3">
                {commandCenter.committees.map((committee) => (
                  <CommitteeCard key={committee.id} committee={committee} />
                ))}
              </div>
            </SectionCard>
            <SectionCard eyebrow="Events" title="What should leaders connect back to the week?">
              <div className="grid gap-3">
                {commandCenter.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </SectionCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard eyebrow="Impact" title="How is the chapter rewarding action?">
              <div className="grid gap-3 sm:grid-cols-2">
                {commandCenter.impactCards.map((metric) => (
                  <MetricTile
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    note={metric.note}
                  />
                ))}
              </div>
            </SectionCard>
            <SectionCard eyebrow="Leaderboard" title="Who is shaping the culture?">
              <LeaderboardPreview rows={commandCenter.leaderboard} />
            </SectionCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard eyebrow="Succession" title="Who could own more next month?">
              <div className="grid gap-3">
                {commandCenter.successionCandidates.map((candidate) => (
                  <SuccessionCandidateCard key={candidate.id} candidate={candidate} />
                ))}
              </div>
            </SectionCard>
            <SectionCard eyebrow="Bridge stories" title="Which stories can help belief travel?">
              <div className="grid gap-3">
                {commandCenter.bridgeStories.map((story) => (
                  <BridgeStoryCard key={story.id} story={story} />
                ))}
              </div>
            </SectionCard>
          </section>
        </section>
      );
  }
}

function ContextPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/70">
      {label}
    </span>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/58">{note}</p>
    </div>
  );
}

function RiskAlertCard({ alert }: { alert: ChapterLeaderCommandCenterRiskAlert }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-semibold text-white">{alert.title}</p>
        <TonePill tone={toTone(alert.severity)} label={alert.severity} />
      </div>
      <p className="mt-3 text-sm leading-6 text-white/62">{alert.summary}</p>
      <Link
        href={alert.href}
        className="mt-4 inline-flex rounded-full border border-white/14 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
      >
        {alert.hrefLabel}
      </Link>
    </div>
  );
}

function LeadershipRoleCard({
  role,
}: {
  role: ChapterLeaderCommandCenterLeadershipRole;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-semibold text-white">{role.label}</p>
        <TonePill tone={toTone(role.status)} label={role.status} />
      </div>
      <p className="mt-2 text-sm font-semibold text-emerald-100">{role.owner}</p>
      <p className="mt-2 text-sm leading-6 text-white/62">{role.note}</p>
    </div>
  );
}

function PipelineItemCard({
  item,
}: {
  item: ChapterLeaderCommandCenterPipelineItem;
}) {
  return (
    <Link
      href={item.href}
      className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/30 hover:bg-white/[0.07]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{item.displayName}</p>
          <p className="mt-1 text-sm text-white/54">
            {item.roleLabel} • {item.laneLabel}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/72">
          {item.statusLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/62">{item.summary}</p>
    </Link>
  );
}

function SelectedMemberCard({
  member,
}: {
  member: ChapterLeaderCommandCenterMemberProfile;
}) {
  return (
    <div className="grid gap-4">
      <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-white">{member.displayName}</p>
            <p className="mt-1 text-sm text-white/56">
              {member.roleLabel} • {member.committeeLane}
            </p>
          </div>
          <TonePill tone="green" label={member.readinessLabel} />
        </div>
        <p className="mt-3 text-sm leading-6 text-white/64">{member.nextStep}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricTile label="Points" value={`${member.points}`} note={member.recognition} />
        <MetricTile
          label="Completed actions"
          value={`${member.completedActions}`}
          note={`${member.openAssignments} open assignment${member.openAssignments === 1 ? "" : "s"} still visible.`}
        />
        <MetricTile label="Proof" value={member.proofStatus} note="Current proof posture in the leader read model." />
        <MetricTile label="Profile route" value="Open" note="Leaders can keep this member selected across tabs while they review the lane." />
      </div>

      <Link
        href={member.profileHref}
        className="inline-flex rounded-full border border-white/14 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white"
      >
        Keep this member selected
      </Link>
    </div>
  );
}

function CommitteeCard({
  committee,
}: {
  committee: ChapterLeaderCommandCenterCommitteeCard;
}) {
  return (
    <Link
      href={committee.href}
      className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/30 hover:bg-white/[0.07]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{committee.name}</p>
          <p className="mt-1 text-sm text-white/54">{committee.ownerLabel}</p>
        </div>
        <TonePill tone="yellow" label={committee.lumaStatusLabel} />
      </div>
      <p className="mt-3 text-sm leading-6 text-white/62">{committee.summary}</p>
      <p className="mt-3 text-sm font-semibold text-emerald-100">
        Next event: {committee.nextEventTitle}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/44">
        {committee.nextEventTiming}
      </p>
    </Link>
  );
}

function EventCard({
  event,
}: {
  event: ChapterLeaderCommandCenterEventCard;
}) {
  return (
    <Link
      href={event.href}
      className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/30 hover:bg-white/[0.07]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{event.title}</p>
          <p className="mt-1 text-sm text-white/54">
            {event.lane} • {event.ownerLabel}
          </p>
        </div>
        <TonePill tone="yellow" label={event.lumaStatusLabel} />
      </div>
      <p className="mt-3 text-sm leading-6 text-white/62">{event.expectedStudentAction}</p>
      <p className="mt-3 text-sm font-semibold text-emerald-100">{event.timing}</p>
      <p className="mt-1 text-sm leading-6 text-white/58">{event.proofPrompt}</p>
    </Link>
  );
}

function BridgeStoryCard({
  story,
}: {
  story: ChapterLeaderCommandCenterBridgeStory;
}) {
  return (
    <Link
      href={story.href}
      className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/30 hover:bg-white/[0.07]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{story.sourceLabel}</p>
          <p className="mt-1 text-sm text-white/54">
            {story.proofTypeLabel} • {story.sharingStatusLabel}
          </p>
        </div>
        <TonePill tone="yellow" label="Proof" />
      </div>
      <p className="mt-3 text-sm font-semibold text-emerald-100">
        Hesitation: {story.hesitationAddressed}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/62">{story.summary}</p>
    </Link>
  );
}

function SuccessionCandidateCard({
  candidate,
}: {
  candidate: ChapterLeaderCommandCenterSuccessionCandidate;
}) {
  return (
    <Link
      href={candidate.href}
      className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/30 hover:bg-white/[0.07]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{candidate.displayName}</p>
          <p className="mt-1 text-sm text-white/54">{candidate.currentRole}</p>
        </div>
        <TonePill tone="green" label={candidate.readinessLabel} />
      </div>
      <p className="mt-3 text-sm leading-6 text-white/62">{candidate.reason}</p>
    </Link>
  );
}

function LeaderboardPreview({
  rows,
}: {
  rows: ChapterLeaderCommandCenter["leaderboard"];
}) {
  return (
    <div className="grid gap-3">
      {rows.map((row, index) => (
        <div
          key={row.id}
          className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-white">
                #{index + 1} {row.displayName}
              </p>
              <p className="mt-1 text-sm text-white/54">{row.roleLabel}</p>
            </div>
            <p className="text-lg font-semibold text-emerald-100">{row.points} pts</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/62">
            {row.recognition} {row.completedActions} completed action
            {row.completedActions === 1 ? "" : "s"}.
          </p>
        </div>
      ))}
    </div>
  );
}

function TonePill({
  tone,
  label,
}: {
  tone: "green" | "yellow" | "red";
  label: string;
}) {
  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-semibold capitalize",
        tone === "green"
          ? "bg-emerald-300/14 text-emerald-100"
          : tone === "yellow"
            ? "bg-[#f7d05e]/14 text-[#f7d05e]"
            : "bg-rose-400/14 text-rose-200",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function getHealthLabel(tone: "green" | "yellow" | "red") {
  switch (tone) {
    case "green":
      return "Healthy";
    case "yellow":
      return "Watch closely";
    case "red":
    default:
      return "Needs support";
  }
}

function toTone(value: "high" | "medium" | "low" | "covered" | "thin" | "missing") {
  if (value === "covered" || value === "low") {
    return "green";
  }

  if (value === "thin" || value === "medium") {
    return "yellow";
  }

  return "red";
}
