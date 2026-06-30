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
      <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
        {studentViewAction ? (
          <div className="mb-4">
            <Link
              href={studentViewAction.href}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
            >
              Student view
            </Link>
          </div>
        ) : null}
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
          MEDLIFE National
        </p>
        <h1 className="mt-2 text-[2.25rem] font-semibold leading-none text-slate-950 sm:text-[2.6rem]">
          {portfolio.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {portfolio.dashboardOwnerLabel}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <HeroMetaPill label={`${portfolio.counts.totalChapters} chapters assigned`} />
          <HeroMetaPill label={`${portfolio.counts.intervene} intervene now`} />
          <HeroMetaPill label={`${portfolio.evidenceQueueLabel} evidence queue`} />
        </div>

        {sourceContext ? (
          <div className="mt-5 rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgb(var(--mymedlife-shadow-rgb)/0.05)]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {sourceContext.eyebrow}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{sourceContext.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{sourceContext.summary}</p>
            {handoffActions.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {handoffActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
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

        <div className="mt-5 flex flex-col gap-4 rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgb(var(--mymedlife-shadow-rgb)/0.05)]">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Assigned portfolio
            </p>
            <HeroInfoPill label={`${portfolio.counts.totalChapters} chapters assigned`} />
            <HeroInfoPill label={`${portfolio.counts.intervene} intervene now`} />
            <HeroInfoPill label={`${portfolio.counts.handoffsPending} handoffs pending`} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={portfolio.chapterHref}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
            >
              Open chapter
            </Link>
            <Link
              href={portfolio.notesHref}
              className="rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
            >
              Write coach note
            </Link>
            <Link
              href={portfolio.riskReviewHref}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
            >
              Review risk reports
            </Link>
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
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)]"
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
              className="rounded-[1.1rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] px-4 py-3 text-sm font-medium text-slate-700"
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
    <section className="rounded-[1.2rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {group.label}
        </p>
        <Link
          href={group.resetHref}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)]"
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
                ? "border-[var(--mymedlife-primary-button)] bg-[var(--mymedlife-surface-hover)] text-[var(--mymedlife-info)]"
                : "border-slate-200 bg-white text-slate-600 hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)]",
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
    <article className="rounded-[1.5rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] p-4">
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

          <div className="mt-4 h-2 rounded-full bg-[var(--mymedlife-panel-tint)]">
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
            className="rounded-full border border-[var(--mymedlife-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--mymedlife-primary-button)] transition hover:border-[var(--mymedlife-focus-blue)] hover:bg-[var(--background)]"
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
      ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
      : "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function DecisionPill({ decision }: { decision: CoachPortfolioDecision }) {
  const className =
    decision === "advance"
      ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
      : decision === "hold"
        ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
        : "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]";

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
      return "h-full rounded-full bg-[var(--mymedlife-primary-button)]";
    case "hold":
      return "h-full rounded-full bg-[var(--mymedlife-focus-blue)]";
    case "intervene":
      return "h-full rounded-full bg-[var(--mymedlife-primary-button)]";
  }
}
