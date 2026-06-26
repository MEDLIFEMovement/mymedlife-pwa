import type { RouteCoverageSummary } from "@/services/route-coverage-summary";

type RouteCoverageSummaryPanelProps = {
  summary: RouteCoverageSummary;
};

export function RouteCoverageSummaryPanel({
  summary,
}: RouteCoverageSummaryPanelProps) {
  if (!summary.canReadSummary) {
    return null;
  }

  const hasUnknownRoutes =
    summary.counts.unknownNavigationHrefs > 0 ||
    summary.counts.unknownSmokeRoutes > 0;

  return (
    <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
            Route coverage
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{summary.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {summary.summary}
          </p>
        </div>
        <span
          className={
            hasUnknownRoutes
              ? "rounded-full border border-blue-300/30 bg-blue-300/15 px-3 py-1 text-xs font-semibold text-blue-100"
              : "rounded-full border border-blue-300/30 bg-blue-300/15 px-3 py-1 text-xs font-semibold text-blue-100"
          }
        >
          {hasUnknownRoutes ? "Needs route fix" : "No broken route references"}
        </span>
      </div>

      <div className="mt-5 grid gap-2 text-center sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Known" value={`${summary.counts.knownRoutes}`} />
        <MiniStat label="Primary" value={`${summary.counts.primaryNavigationHrefs}`} />
        <MiniStat label="Mobile" value={`${summary.counts.mobileNavigationHrefs}`} />
        <MiniStat label="Smoke" value={`${summary.counts.smokeRoutes}`} />
        <MiniStat label="Writes" value={`${summary.counts.browserWritesExpected}`} />
        <MiniStat label="Sends" value={`${summary.counts.externalWritesExpected}`} />
      </div>

      {hasUnknownRoutes ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <UnknownList label="Unknown nav links" items={summary.unknownNavigationHrefs} />
          <UnknownList label="Unknown smoke routes" items={summary.unknownSmokeRoutes} />
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-white/10 bg-[#0b66cc]/70 p-3 text-xs leading-5 text-white/54">
          Current role navigation, mobile shortcuts, and the manual smoke manifest
          all point at known local routes. This does not approve release or
          enable any writes.
        </p>
      )}
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

function UnknownList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-blue-300/20 bg-blue-300/10 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
        {label}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-white/70">
        {items.length > 0 ? (
          items.map((item) => <li key={item}>{item}</li>)
        ) : (
          <li>None</li>
        )}
      </ul>
    </div>
  );
}
