import type { WriteResultStateCoverageSummary } from "@/services/write-result-state-coverage";

type WriteResultStateCoveragePanelProps = {
  summary: WriteResultStateCoverageSummary;
};

export function WriteResultStateCoveragePanel({
  summary,
}: WriteResultStateCoveragePanelProps) {
  return (
    <section className="rounded-[2rem] border border-fuchsia-300/20 bg-fuchsia-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-100/80">
        Result-state coverage
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        All first-write candidates now have result-state coverage.
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/66">
        Each future write path now has reviewed plain-English result states.
        This improves activation readiness, but it still does not approve or
        enable any browser write.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Candidates" value={`${summary.totalCandidateCount}`} />
        <Metric label="Covered" value={`${summary.coveredCount}`} />
        <Metric label="Missing" value={`${summary.missingCount}`} />
      </div>

      <div className="mt-4 rounded-2xl bg-black/20 p-3">
        <p className="text-sm font-semibold text-white">Activation posture</p>
        <p className="mt-2 text-xs leading-5 text-white/58">
          Browser writes enabled: {summary.browserWritesEnabled ? "yes" : "no"}.
          External writes enabled: {summary.externalWritesEnabled ? "yes" : "no"}.
          All candidates covered: {summary.allCandidatesCovered ? "yes" : "no"}.
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        {summary.items.map((item) => (
          <article
            key={item.operation}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                  {item.operation}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{item.route}</h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}
              >
                {item.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/64">{item.notes}</p>
            <p className="mt-2 text-xs leading-5 text-white/50">
              States: {item.resultStateCount}. Success states: {item.successStateCount}.
              Blocked states: {item.blockedStateCount}. External writes stay
              disabled: {item.externalWritesStayDisabled ? "yes" : "no"}.
            </p>
            <p className="mt-2 text-xs leading-5 text-white/48">
              Next: {item.nextAction}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function statusClass(status: "covered" | "missing"): string {
  if (status === "covered") {
    return "bg-emerald-300/20 text-emerald-100";
  }

  return "bg-amber-300/20 text-amber-100";
}
