import type {
  MvpProgressMap,
  MvpProgressRisk,
  MvpProgressStatus,
} from "@/services/mvp-progress-map";

type MvpProgressMapPanelProps = {
  progressMap: MvpProgressMap;
};

export function MvpProgressMapPanel({ progressMap }: MvpProgressMapPanelProps) {
  if (!progressMap.canReadProgressMap) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
            MVP progress map
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {progressMap.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
            {progressMap.plainEnglishSummary}
          </p>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-white/48">
            {progressMap.confidenceNote}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Local review" value={`${progressMap.localReviewPercent}%`} />
          <MiniStat label="Live MVP" value={`${progressMap.liveMvpPercent}%`} />
          <MiniStat label="Ready" value={`${progressMap.counts.localReviewReady}`} />
          <MiniStat label="Remaining" value={`${progressMap.counts.futureBuild}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {progressMap.subprojects.map((subproject) => (
          <article
            key={subproject.key}
            className="rounded-3xl border border-white/10 bg-[#bfdbfe]/40 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status={subproject.status} />
                  <RiskPill risk={subproject.risk} />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {subproject.label}
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                  {subproject.ownerLane}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {subproject.routeEvidence.map((route) => (
                  <span
                    key={`${subproject.key}-${route}`}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58"
                  >
                    {route}
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/66">
              {subproject.plainEnglish}
            </p>
            <p className="mt-3 text-xs leading-5 text-blue-100/70">
              Tech evidence: {subproject.technicalEvidence}
            </p>
            <p className="mt-3 text-sm leading-6 text-white/56">
              Remaining: {subproject.remainingWork}
            </p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-[#0b66cc]/70 p-3 text-xs leading-5 text-white/54">
              Next review step: {subproject.nextReviewStep}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-4">
        <p className="text-sm font-semibold text-white">Best next steps</p>
        <ul className="mt-3 grid gap-2">
          {progressMap.nextBestSteps.map((step) => (
            <li key={step} className="text-sm leading-6 text-white/64">
              {step}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: MvpProgressStatus }) {
  const className =
    status === "local_review_ready"
      ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
      : status === "partially_ready"
        ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
        : status === "needs_approval"
          ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
          : "border-blue-300/30 bg-blue-300/15 text-blue-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function RiskPill({ risk }: { risk: MvpProgressRisk }) {
  const className =
    risk === "low"
      ? "border-blue-300/20 bg-blue-300/10 text-blue-100"
      : risk === "medium"
        ? "border-blue-300/20 bg-blue-300/10 text-blue-100"
        : "border-blue-300/20 bg-blue-300/10 text-blue-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {risk} risk
    </span>
  );
}
