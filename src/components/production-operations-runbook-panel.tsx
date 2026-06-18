import type {
  ProductionOperationsRunbook,
  ProductionOperationsRunbookItem,
  ProductionOperationsRunbookStatus,
} from "@/services/production-operations-runbook";

type ProductionOperationsRunbookPanelProps = {
  runbook: ProductionOperationsRunbook;
};

export function ProductionOperationsRunbookPanel({
  runbook,
}: ProductionOperationsRunbookPanelProps) {
  if (!runbook.canReadRunbook) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-teal-300/20 bg-teal-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100/80">
            Production operations runbook
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{runbook.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {runbook.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          <MiniStat label="Runbooks" value={`${runbook.counts.total}`} />
          <MiniStat label="Ready" value={`${runbook.counts.localRunbookReady}`} />
          <MiniStat label="Blocked" value={`${runbook.counts.blockedBeforeLive}`} />
          <MiniStat label="Writes" value={`${runbook.browserWritesExpected}`} />
          <MiniStat label="Sends" value={`${runbook.externalWritesExpected}`} />
          <MiniStat label="Secrets" value={`${runbook.secretsShown}`} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MiniToken label="Launch" value={runbook.launchReady ? "yes" : "no"} />
        <MiniToken label="Writes" value={`${runbook.browserWritesExpected}`} />
        <MiniToken label="Sends" value={`${runbook.externalWritesExpected}`} />
        <MiniToken label="Secrets" value={`${runbook.secretsShown}`} />
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {runbook.items.map((item) => (
          <RunbookItemCard key={item.key} item={item} />
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/58">
        {runbook.finalPrompt}
      </p>
    </section>
  );
}

function RunbookItemCard({ item }: { item: ProductionOperationsRunbookItem }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill status={item.status} />
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
              {item.ownerLane}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">{item.label}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <MiniToken label="Writes" value={`${item.browserWritesExpected}`} />
          <MiniToken label="Sends" value={`${item.externalWritesExpected}`} />
          <MiniToken label="Secrets" value={`${item.secretsShown}`} />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/66">{item.localRunbook}</p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-white/[0.05] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            First response
          </p>
          <ul className="mt-2 grid gap-2">
            {item.firstResponseSteps.map((step) => (
              <li key={step} className="text-sm leading-6 text-white/62">
                {step}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white/[0.05] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            Missing live evidence
          </p>
          <ul className="mt-2 grid gap-2">
            {item.missingLiveEvidence.map((evidence) => (
              <li key={evidence} className="text-sm leading-6 text-white/62">
                {evidence}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.reviewRoutes.map((route) => (
          <span
            key={`${item.key}-${route}`}
            className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/58"
          >
            {route}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-teal-100/70">
        Approval: {item.approvalRequired}
      </p>
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

function MiniToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/58">
      {label} {value}
    </span>
  );
}

function StatusPill({ status }: { status: ProductionOperationsRunbookStatus }) {
  const className =
    status === "local_runbook_ready"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
