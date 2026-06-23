import Link from "next/link";

import type {
  CoachPortfolioDecision,
  CoachPortfolioReadiness,
} from "@/services/coach-portfolio-readiness";

type CoachPortfolioReadinessPanelProps = {
  sourceContext?: {
    eyebrow: string;
    title: string;
    summary: string;
    actions: Array<{
      label: string;
      href: string;
    }>;
  } | null;
  portfolio: CoachPortfolioReadiness;
};

export function CoachPortfolioReadinessPanel({
  portfolio,
  sourceContext = null,
}: CoachPortfolioReadinessPanelProps) {
  if (!portfolio.canReadPortfolio) {
    return null;
  }

  const studentViewAction =
    sourceContext?.actions.find((action) => action.label === "Student view") ?? null;
  const handoffActions =
    sourceContext?.actions.filter((action) => action.label !== "Student view") ?? [];

  return (
    <section className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(160deg,#0b2a5d_0%,#0a3b88_52%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.3)]">
        {studentViewAction ? (
          <div className="mb-4">
            <Link
              href={studentViewAction.href}
              className="inline-flex items-center rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-sm font-semibold text-white/82 transition hover:border-white/24 hover:bg-white/12 hover:text-white"
            >
              Student view
            </Link>
          </div>
        ) : null}
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
          MEDLIFE National
        </p>
        <h1 className="mt-2 text-[2.25rem] font-semibold leading-none text-white sm:text-[2.6rem]">
          {portfolio.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/78">
          {portfolio.dashboardOwnerLabel}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <HeroMetaPill label={`${portfolio.counts.totalChapters} chapters assigned`} />
          <HeroMetaPill label={`${portfolio.counts.intervene} intervene now`} />
          <HeroMetaPill label={`${portfolio.evidenceQueueLabel} evidence queue`} />
        </div>

        {sourceContext ? (
          <div className="mt-5 rounded-[1.35rem] border border-white/14 bg-white/[0.07] p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/58">
              {sourceContext.eyebrow}
            </p>
            <p className="mt-2 text-lg font-semibold text-white">{sourceContext.title}</p>
            <p className="mt-2 text-sm leading-6 text-white/74">{sourceContext.summary}</p>
            {handoffActions.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {handoffActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white/88 transition hover:border-white/24 hover:bg-white/12 hover:text-white"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <HeroStat label="Avg Health" value={portfolio.averageHealthLabel} />
          <HeroStat label="Total Overdue" value={portfolio.totalOverdueLabel} />
          <HeroStat label="Evidence Queue" value={portfolio.evidenceQueueLabel} />
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-white/14 bg-white/[0.07] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                Assigned portfolio
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                Keep urgent chapter support visible before deeper review routes.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <HeroInfoPill label={`${portfolio.counts.totalChapters} chapters assigned`} />
                <HeroInfoPill label={`${portfolio.counts.intervene} intervene now`} />
                <HeroInfoPill label={`${portfolio.counts.handoffsPending} handoffs pending`} />
              </div>
            </div>

            <div className="grid gap-2 sm:min-w-[15rem]">
              <Link
                href={portfolio.chapterHref}
                className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-center text-sm font-semibold text-white/88 transition hover:border-white/24 hover:bg-white/12 hover:text-white"
              >
                Open chapter
              </Link>
              <Link
                href={portfolio.notesHref}
                className="rounded-full bg-[#f7d05e] px-4 py-2 text-center text-sm font-semibold text-[#08224c] transition hover:bg-[#f9d96c]"
              >
                Write coach note
              </Link>
              <Link
                href={portfolio.riskReviewHref}
                className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-center text-sm font-semibold text-white/88 transition hover:border-white/24 hover:bg-white/12 hover:text-white"
              >
                Review risk reports
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4 sm:p-5">
        <p className="app-eyebrow app-eyebrow-blue">{portfolio.aiSummaryLabel}</p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{portfolio.aiSummaryBody}</p>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="app-eyebrow app-eyebrow-blue">Chapter Portfolio</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Portfolio Overview
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {portfolio.selectedScopeLabel}
            </p>
          </div>
          <Link
            href={portfolio.riskReviewHref}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff]"
          >
            Focus intervene now
          </Link>
        </div>

        <div className="mt-4 grid gap-4">
          {portfolio.filterGroups.map((group) => (
            <PortfolioFilterGroup key={group.key} group={group} />
          ))}
        </div>

        <div className="mt-5 grid gap-3">
          {portfolio.rows.map((row) => (
            <CoachChapterCard key={row.chapterId} row={row} />
          ))}
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4 sm:p-5">
        <p className="app-eyebrow app-eyebrow-blue">Coaching Priorities</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Coaching Priorities
        </h2>
        <div className="mt-4 grid gap-3">
          {portfolio.priorities.map((item) => (
            <p
              key={item}
              className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
            >
              {item}
            </p>
          ))}
        </div>
      </section>
    </section>
  );
}

function PortfolioFilterGroup({
  group,
}: {
  group: CoachPortfolioReadiness["filterGroups"][number];
}) {
  return (
    <section className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {group.label}
        </p>
        <Link
          href={group.resetHref}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff]"
        >
          All
        </Link>
        {group.options.map((option) => (
          <Link
            key={option.value}
            href={option.href}
            aria-current={option.isActive ? "page" : undefined}
            className={[
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              option.isActive
                ? "border-[#2563eb] bg-[#eef5ff] text-[#1d4ed8]"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#bfdbfe] hover:bg-[#eef5ff]",
            ].join(" ")}
          >
            {option.label} ({option.count})
          </Link>
        ))}
      </div>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/12 bg-white/[0.06] px-4 py-4">
      <p className="text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm font-medium text-white/70">{label}</p>
    </div>
  );
}

function HeroInfoPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/82">
      {label}
    </span>
  );
}

function HeroMetaPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/14 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/78">
      {label}
    </span>
  );
}

function CoachChapterCard({
  row,
}: {
  row: CoachPortfolioReadiness["rows"][number];
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-950">{row.chapterName}</h3>
                <StatusPill label={row.statusLabel} />
                <MetaPill label={row.campus} />
                <MetaPill label={row.campaignName} />
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {row.memberCount} members · {readableCoachMode(row.coachAssignmentMode)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[2rem] font-semibold leading-none text-slate-950">
                {row.readinessScore}%
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                health score
              </p>
            </div>
          </div>

          <div className="mt-4 h-2 rounded-full bg-[#dfe8f7]">
            <div
              className={getCoachProgressBarClassName(row.decision)}
              style={{ width: `${Math.max(8, Math.min(row.readinessScore, 100))}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <InlineStat label="Active" value={`${row.activeCount}`} />
          <InlineStat label="Overdue" value={`${row.overdueCount}`} />
          <InlineStat label="Evidence" value={`${row.proofPending}`} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <DecisionPill decision={row.decision} />
          <Link
            href={row.detailHref}
            className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#2563eb] transition hover:border-[#93c5fd] hover:bg-[#eff6ff]"
          >
            Open chapter
          </Link>
        </div>
      </div>
    </article>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
      {label}
    </span>
  );
}

function InlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-center">
      <p className="text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function StatusPill({ label }: { label: CoachPortfolioReadiness["rows"][number]["statusLabel"] }) {
  const className =
    label === "Healthy"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function DecisionPill({ decision }: { decision: CoachPortfolioDecision }) {
  const className =
    decision === "advance"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : decision === "hold"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <p className={`rounded-full border px-3 py-1 text-sm font-semibold ${className}`}>
      {readableDecision(decision)}
    </p>
  );
}

function readableCoachMode(mode: CoachPortfolioReadiness["rows"][number]["coachAssignmentMode"]) {
  switch (mode) {
    case "portfolio_coach":
      return "Portfolio coach";
    case "expansion_coach":
      return "Expansion coach";
    case "handoff_pending":
      return "Handoff pending";
  }
}

function readableDecision(decision: CoachPortfolioDecision) {
  switch (decision) {
    case "advance":
      return "Advance";
    case "hold":
      return "Hold";
    case "intervene":
      return "Intervene";
  }
}

function getCoachProgressBarClassName(decision: CoachPortfolioDecision) {
  switch (decision) {
    case "advance":
      return "h-full rounded-full bg-emerald-500";
    case "hold":
      return "h-full rounded-full bg-amber-400";
    case "intervene":
      return "h-full rounded-full bg-rose-500";
  }
}
