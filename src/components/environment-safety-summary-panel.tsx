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
    <section className="app-surface-info rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            Environment safety
          </p>
          <h2 className="app-title mt-2">{summary.title}</h2>
          <p className="app-copy mt-2 max-w-3xl">{summary.summary}</p>
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
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : item.status === "watch"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <article className="app-surface rounded-[1.3rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{item.label}</h3>
          <p className="mt-1 font-mono text-xs text-slate-500">{item.value}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
          {item.status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.explanation}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface rounded-[1.05rem] px-3 py-2">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
