import Link from "next/link";

import type { MemberActionRouteSource } from "@/services/member-action-route-href";
import type { MemberRushMonthCampaignOverview } from "@/services/member-rush-month-campaign-overview";

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
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(180deg,#2455a4_0%,#2a5fb5_48%,#21457d_100%)] p-4 shadow-[0_24px_80px_rgba(2,14,38,0.28)]">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
          {overview.chapterName}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {overview.statusLabel}
          </span>
          <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold text-white/78">
            {overview.weekLabel}
          </span>
        </div>
        <h1 className="mt-3 text-[2rem] font-semibold leading-tight text-white sm:text-[2.35rem]">
          {overview.campaignName}
        </h1>
        <p className="mt-2.5 max-w-[19rem] text-sm leading-6 text-white/80">
          {overview.summary}
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 text-sm text-white/78">
            <span>{overview.chapterProgressLabel}</span>
            <span>{overview.chapterProgressPercent}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/16">
            <div
              className="h-full rounded-full bg-[#f7d05e]"
              style={{ width: `${overview.chapterProgressPercent}%` }}
            />
          </div>
        </div>
        {sourceContext ? (
          <div className="mt-4 rounded-[1.3rem] border border-white/12 bg-white/10 p-3.5 backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
                  {sourceContext.eyebrow}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  {sourceContext.compactDetail}
                </p>
              </div>
              <Link
                href={sourceContext.href}
                className="inline-flex w-fit rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/24 hover:bg-white/14"
              >
                {sourceContext.backLabel}
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <section className="app-surface rounded-[1.8rem] p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2b5fb4] text-base text-white">
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
      </section>

      <section className="app-surface rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">Campaign KPIs</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {overview.kpis.map((kpi) => (
            <article key={kpi.label} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-3.5">
              {/*
                The mockup uses simple progress bars, so derive width from the KPI
                values instead of the presentational label string.
              */}
              <p className="text-sm font-semibold text-slate-950">{kpi.label}</p>
              <div className="mt-1.5 flex items-end gap-2">
                <p className="text-[2rem] font-semibold leading-none text-slate-950">
                  {kpi.value}
                </p>
                <p className="text-sm font-semibold text-slate-500">/ {kpi.goal}</p>
              </div>
              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#2b5fb4]"
                  style={{
                    width: `${Math.max(
                      8,
                      Math.min(100, Math.round((kpi.value / kpi.goal) * 100)),
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-sm text-slate-600">{kpi.progressLabel}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">Assigned Actions by Role</p>
        <div className="mt-3 grid gap-3">
          {overview.assignedActionsByRole.map((group) => (
            <Link
              key={group.roleLabel}
              href={roleFocusHref(group.id)}
              aria-current={selectedRole?.id === group.id ? "page" : undefined}
              className={[
                "rounded-[1.35rem] border p-3.5 transition",
                selectedRole?.id === group.id
                  ? "border-[#bfdbfe] bg-[#fbfdff]"
                  : "border-slate-200 bg-slate-50 hover:border-[#bfdbfe] hover:bg-[#fbfdff]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">{group.roleLabel}</p>
                <span className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-sm font-semibold text-[#2563eb]">
                  {group.progressLabel}
                </span>
              </div>
              <p className="mt-2.5 text-sm leading-6 text-slate-600">{group.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <details className="app-surface rounded-[1.8rem] p-4" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-950">
          <span>{overview.whyItMattersTitle}</span>
          <span aria-hidden="true" className="text-slate-400">›</span>
        </summary>
        <p className="mt-3 text-sm leading-7 text-slate-700">{overview.whyItMattersBody}</p>
      </details>

      <section className="app-surface-info rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">Campaign actions</p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          <Link
            href={overview.primaryActions.viewActionsHref}
            className="inline-flex rounded-full bg-[#f7d05e] px-4 py-2.5 text-sm font-semibold text-[#08224c]"
          >
            View my actions
          </Link>
          <Link
            href={overview.primaryActions.submitEvidenceHref}
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Submit evidence
          </Link>
        </div>
      </section>

      {selectedRole ? (
        <section
          id="role-focus"
          className="app-surface-info rounded-[1.8rem] p-4"
        >
          <p className="app-eyebrow app-eyebrow-blue">Role focus</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {selectedRole.roleLabel}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            {selectedRole.detail}
          </p>
        </section>
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
