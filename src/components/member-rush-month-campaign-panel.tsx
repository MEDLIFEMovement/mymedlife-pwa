import Link from "next/link";

import type { MemberActionRouteSource } from "@/services/member-action-route-href";
import type { MemberRushMonthCampaignOverview } from "@/services/member-rush-month-campaign-overview";
import { EventLoopStrip } from "@/components/event-loop-strip";
import { PanelButton, StatCard, SurfacePanel, VisualTabStrip } from "@/components/visual-primitives";

type MemberRushMonthCampaignPanelProps = {
  overview: MemberRushMonthCampaignOverview;
  selectedRoleId?: string;
  source?: MemberActionRouteSource | null;
};

export function MemberRushMonthCampaignPanel({
  overview,
  selectedRoleId,
  source,
}: MemberRushMonthCampaignPanelProps) {
  const selectedRole =
    overview.assignedActionsByRole.find((group) => group.id === selectedRoleId) ?? null;
  const sourceContext = getMemberCampaignSourceContext(source);
  const roleFocusHref = (roleId: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set("role", roleId);

    if (source) {
      searchParams.set("source", source);
    }

    return `/campaigns?${searchParams.toString()}#role-focus`;
  };

  return (
    <section className="grid gap-3">
      <section className="app-surface-info overflow-hidden rounded-[2rem] p-4">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
          {overview.chapterName}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <span className="rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-3 py-1 text-xs font-semibold text-[var(--mymedlife-info)]">
            {overview.statusLabel}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {overview.weekLabel}
          </span>
        </div>
        <h1 className="mt-3 text-[2rem] font-semibold leading-tight text-slate-950 sm:text-[2.35rem]">
          {overview.campaignName}
        </h1>
        <p className="mt-2.5 max-w-[19rem] text-sm leading-6 text-slate-600">
          {overview.summary}
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>{overview.chapterProgressLabel}</span>
            <span>{overview.chapterProgressPercent}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--mymedlife-badge-background)]">
            <div
              className="h-full rounded-full bg-[var(--mymedlife-primary-button)]"
              style={{ width: `${overview.chapterProgressPercent}%` }}
            />
          </div>
        </div>
        {sourceContext ? (
          <div className="mt-4 rounded-[1.3rem] border border-slate-200 bg-white p-3.5 shadow-[0_8px_24px_rgb(var(--mymedlife-shadow-rgb)/0.05)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {sourceContext.eyebrow}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {sourceContext.compactDetail}
                </p>
              </div>
              <Link
                href={sourceContext.href}
                className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
              >
                {sourceContext.backLabel}
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <section className="app-surface-info rounded-[1.6rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">Event loop</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">
          Luma, RSVP, attendance, and points stay visible together.
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Open the event, confirm who RSVP&apos;d, check attendance, and make the
          leaderboard impact easy to read without hunting across the route.
        </p>
        <EventLoopStrip
          items={[
            { label: "Luma", detail: "Source of truth for the event", tone: "blue" },
            { label: "RSVP", detail: "Intent shows up before the event", tone: "slate" },
            { label: "Attendance", detail: "Who actually showed", tone: "yellow" },
            { label: "Points", detail: "Leaderboard moves after review", tone: "gold" },
          ]}
        />
      </section>

      <SurfacePanel>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--mymedlife-action-blue)] text-base text-white">
            ⚑
          </div>
          <div className="min-w-0">
            <p className="app-eyebrow app-eyebrow-blue">{overview.currentPhaseLabel}</p>
            <h2 className="mt-1.5 text-[1.9rem] font-semibold leading-tight text-slate-950">
              {overview.currentPhaseTitle}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">{overview.currentPhaseDates}</p>
          </div>
        </div>
      </SurfacePanel>

      <SurfacePanel>
        <p className="app-eyebrow app-eyebrow-blue">Campaign KPIs</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {overview.kpis.map((kpi) => (
            <StatCard
              key={kpi.label}
              label={kpi.label}
              value={`${kpi.value} / ${kpi.goal}`}
              note={kpi.progressLabel}
            >
              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-[var(--background)]">
                <div
                  className="h-full rounded-full bg-[var(--mymedlife-action-blue)]"
                  style={{
                    width: `${Math.max(
                      8,
                      Math.min(100, Math.round((kpi.value / kpi.goal) * 100)),
                    )}%`,
                  }}
                />
              </div>
            </StatCard>
          ))}
        </div>
      </SurfacePanel>

      <section className="grid gap-3">
        <p className="app-eyebrow app-eyebrow-blue">Assigned Actions by Role</p>
        <VisualTabStrip
          label="Role focus"
          items={overview.assignedActionsByRole.map((group) => ({
            label: `${group.roleLabel} — ${group.progressLabel}`,
            href: roleFocusHref(group.id),
            active: selectedRole?.id === group.id,
          }))}
        />
      </section>

      <SurfacePanel>
        <p className="app-eyebrow app-eyebrow-blue">{overview.whatGoodLooksLike.title}</p>
        <div className="mt-3 grid gap-2.5">
          {overview.whatGoodLooksLike.items.map((item, index) => (
            <article
              key={item}
              className="rounded-[1.35rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] p-3.5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--mymedlife-border)] bg-white text-xs font-semibold text-[var(--mymedlife-primary-button)]">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-700">{item}</p>
              </div>
            </article>
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={overview.featuredEvent.href}
              className="text-xl font-semibold text-slate-950 transition hover:text-[var(--mymedlife-info)]"
            >
              {overview.featuredEvent.title}
            </Link>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--mymedlife-primary-button)]">
                {overview.featuredEvent.sourceLabel}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{overview.featuredEvent.timing}</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {overview.featuredEvent.momentumLabel}
            </p>
          </div>
        </div>
      </SurfacePanel>

      <details className="app-surface rounded-[1.8rem] p-4" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-950">
          <span>{overview.whyItMattersTitle}</span>
          <span aria-hidden="true" className="text-slate-400">›</span>
        </summary>
        <p className="mt-3 text-sm leading-7 text-slate-700">{overview.whyItMattersBody}</p>
      </details>

      <SurfacePanel tone="info">
        <p className="app-eyebrow app-eyebrow-blue">Campaign actions</p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          <PanelButton href={overview.primaryActions.viewActionsHref}>View my actions</PanelButton>
          <PanelButton href={overview.primaryActions.submitEvidenceHref} variant="secondary">
            Submit evidence
          </PanelButton>
        </div>
      </SurfacePanel>

      {selectedRole ? (
        <SurfacePanel tone="info" id="role-focus">
          <p className="app-eyebrow app-eyebrow-blue">Role focus</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {selectedRole.roleLabel}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            {selectedRole.detail}
          </p>
        </SurfacePanel>
      ) : null}
    </section>
  );
}

function getMemberCampaignSourceContext(source: MemberActionRouteSource | null | undefined) {
  switch (source) {
    case "profile":
      return {
        eyebrow: "From profile",
        compactDetail:
          "Profile handed you into the real campaign loop. Review Rush Month here, then hop back when you are done.",
        href: "/profile",
        backLabel: "Back to profile",
      };
    case "home":
      return {
        eyebrow: "From home",
        compactDetail:
          "Home surfaced this as the next campaign to understand. Keep that same weekly thread while you review it here.",
        href: "/",
        backLabel: "Back to home",
      };
    case "events":
      return {
        eyebrow: "From events",
        compactDetail:
          "Events handed you back to the bigger Rush Month loop without losing the original event thread.",
        href: "/rush-month/events",
        backLabel: "Back to events",
      };
    case "points":
      return {
        eyebrow: "From points",
        compactDetail:
          "Points opened the campaign that explains why the recognition matters. Review the loop, then head back to the scoreboard.",
        href: "/rush-month/leaderboard",
        backLabel: "Back to points",
      };
    default:
      return null;
  }
}
