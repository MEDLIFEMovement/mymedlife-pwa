import type {
  EnvironmentSafetyItem,
  EnvironmentSafetySummary,
} from "@/services/environment-safety-summary";

type EnvironmentSafetySummaryPanelProps = {
  summary: EnvironmentSafetySummary;
};

export function EnvironmentSafetySummaryPanel({
  summary,
}: EnvironmentSafetySummaryPanelProps) {
  if (!summary.canReadSummary) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
            Environment safety
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{summary.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {summary.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Secrets" value={`${summary.counts.secretsShown}`} />
          <MiniStat label="Writes" value={`${summary.counts.browserWritesEnabled}`} />
          <MiniStat label="Sends" value={`${summary.counts.externalWritesEnabled}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {summary.items.map((item) => (
          <EnvironmentItemCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}

function EnvironmentItemCard({ item }: { item: EnvironmentSafetyItem }) {
  const statusClass =
    item.status === "safe"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : item.status === "watch"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{item.label}</h3>
          <p className="mt-1 font-mono text-xs text-white/54">{item.value}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
          {item.status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/64">{item.explanation}</p>
    </article>
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
