import type {
  CoachPortfolioDecision,
  CoachPortfolioReadiness,
  CoachPortfolioRisk,
} from "@/services/coach-portfolio-readiness";

type CoachPortfolioReadinessPanelProps = {
  portfolio: CoachPortfolioReadiness;
};

export function CoachPortfolioReadinessPanel({
  portfolio,
}: CoachPortfolioReadinessPanelProps) {
  if (!portfolio.canReadPortfolio) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
            Portfolio view
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{portfolio.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {portfolio.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          <MiniStat label="Chapters" value={`${portfolio.counts.totalChapters}`} />
          <MiniStat label="Advance" value={`${portfolio.counts.advance}`} />
          <MiniStat label="Hold" value={`${portfolio.counts.hold}`} />
          <MiniStat label="Intervene" value={`${portfolio.counts.intervene}`} />
          <MiniStat label="Handoffs" value={`${portfolio.counts.handoffsPending}`} />
          <MiniStat label="Changes" value={`${portfolio.counts.coachChangesEnabled}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {portfolio.rows.map((row) => (
          <article key={row.chapterId} className="rounded-2xl bg-black/20 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <DecisionPill decision={row.decision} />
                  <RiskPill risk={row.risk} />
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                    {row.coachAssignmentMode.replaceAll("_", " ")}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {row.chapterName}
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/42">
                  {row.campus} / Coach: {row.coachName}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/66">{row.nextStep}</p>
              </div>
              <div className="grid min-w-52 grid-cols-3 gap-2 text-center">
                <MiniStat label="Score" value={`${row.readinessScore}`} />
                <MiniStat label="Proof" value={`${row.proofPending}`} />
                <MiniStat label="Follow-up" value={`${row.openFollowUps}`} />
              </div>
            </div>
            <p className="mt-3 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/54">
              Coach assignment change posture: {row.coachChangePosture}. Changes
              remain admin-controlled and disabled in this MVP shell.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function DecisionPill({ decision }: { decision: CoachPortfolioDecision }) {
  const className =
    decision === "advance"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : decision === "hold"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {decision}
    </span>
  );
}

function RiskPill({ risk }: { risk: CoachPortfolioRisk }) {
  const className =
    risk === "low"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : risk === "medium"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {risk} risk
    </span>
  );
}
