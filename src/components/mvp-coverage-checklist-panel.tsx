import type {
  MvpCoverageChecklist,
  MvpCoverageStatus,
} from "@/services/mvp-coverage-checklist";

type MvpCoverageChecklistPanelProps = {
  checklist: MvpCoverageChecklist;
};

export function MvpCoverageChecklistPanel({
  checklist,
}: MvpCoverageChecklistPanelProps) {
  if (!checklist.canReadChecklist) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
            MVP coverage
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {checklist.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {checklist.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
          <MiniStat label="Items" value={`${checklist.counts.total}`} />
          <MiniStat label="Mock" value={`${checklist.counts.coveredMock}`} />
          <MiniStat label="Read-only" value={`${checklist.counts.coveredReadonly}`} />
          <MiniStat label="Blocked" value={`${checklist.counts.blockedUntilApproval}`} />
          <MiniStat label="Future" value={`${checklist.counts.futureWork}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {checklist.items.map((item) => (
          <article key={item.key} className="rounded-2xl bg-[var(--mymedlife-border)]/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status={item.status} />
                  {item.routeEvidence.map((route) => (
                    <span
                      key={`${item.key}-${route}`}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58"
                    >
                      {route}
                    </span>
                  ))}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-white/66">
                  {item.plainEnglish}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/48">
                  Next: {item.nextStep}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/70 p-3 text-xs leading-5 text-white/54">
        This checklist is a review aid only. It does not approve live auth,
        browser writes, uploads, public proof sharing, or external integrations.
      </p>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: MvpCoverageStatus }) {
  const className =
    status === "covered_readonly"
      ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]"
      : status === "covered_mock"
        ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]"
        : status === "blocked_until_approval"
          ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]"
          : "border-white/10 bg-white/10 text-white/70";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
