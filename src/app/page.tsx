import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { MetricCard } from "@/components/metric-card";
import { RoleNextActionPanel } from "@/components/role-next-action-panel";
import { StatusBadge } from "@/components/status-badge";
import { roleContexts } from "@/data/mock-rush-month";
import { getProgressCounts } from "@/lib/rush-month";
import { getCampaignReadinessSummary } from "@/services/campaign-ops-service";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getRoleNextActionBrief } from "@/services/role-next-actions";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getStudentHomeWorkspace } from "@/services/student-home-workspace";

export const metadata = getStaticRouteMetadata("home");
export const dynamic = "force-dynamic";

export default async function Home() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);

  if (actor.audience === "chapter_member") {
    const workspace = getStudentHomeWorkspace(actor, data);

    return (
      <AppShell actor={actor} debugToolsPlacement="after-content">
        <DataSourceNotice source={data.source} />

        <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.38)]">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f7d05e]">
                {workspace.chapterName}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {workspace.greeting}
              </h1>
              <p className="mt-2 text-sm font-medium text-white/72">
                {workspace.chapterMeta}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/82">
                {workspace.heroSummary}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={workspace.startNextAction.href}
                  className="inline-flex rounded-full bg-[#f7d05e] px-4 py-2 text-sm font-semibold text-[#08224c]"
                >
                  {workspace.startNextAction.label}
                </Link>
                <Link
                  href={workspace.campaign.campaignsHref}
                  className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  Open campaigns
                </Link>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/58">
                {workspace.startNextAction.detail}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {workspace.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.5rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm"
                >
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/64">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-2 text-sm leading-5 text-white/70">{stat.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <HomePanel
            title={workspace.campaign.name}
            eyebrow={workspace.campaign.weekLabel}
            actionHref={workspace.campaign.href}
            actionLabel="Open Rush Month"
          >
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm font-semibold text-white">
                  <span>Campaign progress</span>
                  <span>{workspace.campaign.progressPercent}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#f7d05e]"
                    style={{ width: `${workspace.campaign.progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  {workspace.campaign.progressLabel}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-[#081d46]/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f7d05e]">
                  Why it matters
                </p>
                <p className="mt-2 text-sm leading-6 text-white/76">
                  {workspace.campaign.whyItMatters}
                </p>
              </div>
              <p className="text-xs leading-5 text-white/52">
                {workspace.campaign.visibleCampaignCount === 1
                  ? "1 campaign track is already shaped in the app, with Rush Month active now."
                  : `${workspace.campaign.visibleCampaignCount} campaign tracks are already shaped in the app, with Rush Month active now.`}
              </p>
            </div>
          </HomePanel>

          <HomePanel
            title="Assigned to you"
            eyebrow="Your next work"
            actionHref={workspace.startNextAction.href}
            actionLabel="Start next action"
          >
            <div className="grid gap-3">
              {workspace.assignedActions.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={assignment.href}
                  className="rounded-[1.25rem] border border-white/10 bg-[#081d46]/55 p-4 transition hover:border-[#f7d05e]/40 hover:bg-[#0d2b63]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {assignment.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/66">
                        Due {assignment.dueLabel} • {assignment.points} points
                      </p>
                    </div>
                    <StatusBadge status={assignment.status} />
                  </div>
                </Link>
              ))}
            </div>
          </HomePanel>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
          <HomePanel
            title="Events"
            eyebrow="Where to show up"
            actionHref="/rush-month/events"
            actionLabel="View events"
          >
            <div className="grid gap-3">
              {workspace.upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={event.href}
                  className="rounded-[1.25rem] border border-white/10 bg-[#081d46]/55 p-4 transition hover:border-[#f7d05e]/40 hover:bg-[#0d2b63]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">{event.title}</h3>
                      <p className="mt-1 text-sm text-white/62">{event.timing}</p>
                    </div>
                    <EventStatusPill label={event.statusLabel} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/72">
                    {event.expectedStudentAction}
                  </p>
                </Link>
              ))}
            </div>
          </HomePanel>

          <HomePanel
            title="Points and leaderboard"
            eyebrow="Recognition"
            actionHref={workspace.points.href}
            actionLabel="View points"
          >
            <div className="grid gap-4">
              <div className="rounded-[1.25rem] border border-[#f7d05e]/30 bg-[#f7d05e]/12 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f7d05e]">
                  Current standing
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {workspace.points.total} pts
                </p>
                <p className="mt-2 text-sm font-medium text-white/74">
                  {workspace.points.rankLabel}
                </p>
                <p className="mt-3 text-sm leading-6 text-white/76">
                  {workspace.points.recognition}
                </p>
              </div>
              <div className="grid gap-2">
                {workspace.points.leaderboardPreview.map((row, index) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between rounded-[1.1rem] border border-white/10 bg-[#081d46]/55 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {index + 1}. {row.displayName}
                      </p>
                      <p className="text-xs text-white/58">{row.roleLabel}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#f7d05e]">{row.points} pts</p>
                  </div>
                ))}
              </div>
            </div>
          </HomePanel>
        </section>

        <section className="rounded-[2rem] border border-[#f7d05e]/28 bg-[#f7d05e]/12 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f7d05e]">
            Leader message
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Keep one clear next step in front of the chapter.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80">
            {workspace.leaderMessage.body}
          </p>
          <p className="mt-4 text-sm font-medium text-white/70">
            {workspace.leaderMessage.authorName} • {workspace.leaderMessage.authorRole}
          </p>
          <p className="mt-4 text-xs leading-5 text-white/58">{workspace.safetyNote}</p>
        </section>
      </AppShell>
    );
  }

  const nextActionBrief = getRoleNextActionBrief(actor, data);
  const progress = getProgressCounts();
  const campaignSummary = getCampaignReadinessSummary();

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          {data.chapter.name}
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              myMEDLIFE turns chapter SOPs into student action.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
              {data.campaign.name} is the first operating loop, but the app is becoming a
              reusable campaign system for action committees, events, proof/testimonials,
              points, KPIs, and coach decisions.
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4">
            <p className="text-sm font-semibold text-emerald-100">Current role</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{actor.audienceLabel}</h2>
            <p className="mt-2 text-sm leading-6 text-white/68">{actor.accessSummary}</p>
            <Link
              href={nextActionBrief.primaryHref}
              className="mt-4 inline-flex rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
            >
              {nextActionBrief.primaryLabel}
            </Link>
          </div>
        </div>
      </section>

      <RoleNextActionPanel brief={nextActionBrief} />

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Approved"
          value={`${progress.approved}/${progress.total}`}
          note="Actions already accepted"
        />
        <MetricCard
          label="Pending review"
          value={`${progress.pendingReview}`}
          note="Evidence waiting on a leader or coach"
        />
        <MetricCard
          label="Needs work"
          value={`${progress.needsWork}`}
          note="Actions not yet ready to count"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Campaign shells"
          value={`${campaignSummary.activeCampaigns + campaignSummary.plannedCampaigns + campaignSummary.templateCampaigns}`}
          note="Rush plus future campaign models"
        />
        <MetricCard
          label="Action events"
          value={`${campaignSummary.linkedMockEvents}`}
          note="Mock-linked only, no Luma write"
        />
        <MetricCard
          label="Proof to review"
          value={`${campaignSummary.hqProofItems}`}
          note="HQ sharing posture"
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {[
          {
            href: "/campaigns",
            label: "Campaign Library",
            copy: "See the reusable campaign shells behind Rush Month, fundraising, volunteering, socials, Med Talks, and SLT recruitment.",
          },
          {
            href: "/action-committees",
            label: "Action Committees",
            copy: "Preview how committees organize events with owners, feedback, proof, and coach-readable outcomes.",
          },
          {
            href: "/proof-library",
            label: "Proof Library",
            copy: "Understand how bridge videos and testimonials become belief-building assets after HQ review.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-emerald-300/30 hover:bg-emerald-300/10"
          >
            <h2 className="text-lg font-semibold text-white">{item.label}</h2>
            <p className="mt-2 text-sm leading-6 text-white/64">{item.copy}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        {roleContexts.map((role) => (
          <Link
            key={role.key}
            href={role.startPath}
            className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-emerald-300/30 hover:bg-emerald-300/10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/44">
              {role.audience}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">{role.label}</h2>
            <p className="mt-2 text-sm leading-6 text-white/64">{role.description}</p>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}

function HomePanel({
  actionHref,
  actionLabel,
  children,
  eyebrow,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#0a1533]/75 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f7d05e]">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        </div>
        <Link
          href={actionHref}
          className="inline-flex rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
        >
          {actionLabel}
        </Link>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EventStatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-[#f7d05e]/28 bg-[#f7d05e]/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#f7d05e]">
      {label}
    </span>
  );
}
