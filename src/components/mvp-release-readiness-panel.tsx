import type {
  MvpReleaseReadinessSummary,
  ReleaseReadinessStatus,
} from "@/services/mvp-release-readiness";

type MvpReleaseReadinessPanelProps = {
  summary: MvpReleaseReadinessSummary;
};

export function MvpReleaseReadinessPanel({
  summary,
}: MvpReleaseReadinessPanelProps) {
  if (!summary.canReadSummary) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-rose-300/20 bg-rose-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-100/80">
            Release readiness
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{summary.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {summary.plainEnglishVerdict}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Local review" value={summary.localReviewReady ? "yes" : "no"} />
          <MiniStat label="Live launch" value={summary.liveLaunchReady ? "yes" : "no"} />
          <MiniStat label="Writes" value={`${summary.browserWritesEnabled}`} />
          <MiniStat label="Sends" value={`${summary.externalWritesEnabled}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <ReadinessList title="Ready for local review" items={summary.achievements} />
        <ReadinessList title="Blocked before live launch" items={summary.blockers} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white">Approvals needed next</p>
        <ul className="mt-3 grid gap-2">
          {summary.nextApprovals.map((approval) => (
            <li key={approval} className="text-sm leading-6 text-white/64">
              {approval}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ReadinessList({
  items,
  title,
}: {
  items: MvpReleaseReadinessSummary["achievements"];
  title: string;
}) {
  return (
    <article className="rounded-2xl bg-black/20 p-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-3 grid gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl bg-white/[0.05] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={item.status} />
              <p className="text-sm font-semibold text-white">{item.label}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {item.plainEnglish}
            </p>
          </div>
        ))}
      </div>
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

function StatusPill({ status }: { status: ReleaseReadinessStatus }) {
  const className =
    status === "ready_for_local_review"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
