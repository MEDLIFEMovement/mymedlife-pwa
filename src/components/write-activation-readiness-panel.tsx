import type { WriteActivationReadinessSummary } from "@/services/write-activation-readiness";

type WriteActivationReadinessPanelProps = {
  summary: WriteActivationReadinessSummary;
};

export function WriteActivationReadinessPanel({
  summary,
}: WriteActivationReadinessPanelProps) {
  return (
    <section className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
        Write activation readiness
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        First write paths are visible, but still locked.
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/66">
        This review panel collects every browser-write gate in one place. It
        shows what is technically prepared and what remains blocked before any
        local browser save control can be enabled.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[var(--mymedlife-border)]/40 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/44">
            Operations
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {summary.operationCount}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--mymedlife-border)]/40 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/44">
            Enabled controls
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {summary.enabledControlCount}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--mymedlife-border)]/40 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/44">
            Blockers
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {summary.approvalBlockerCount}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {summary.items.map((item) => (
          <article key={item.operation} className="rounded-2xl bg-[var(--mymedlife-border)]/40 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-1 font-mono text-xs text-[var(--mymedlife-badge-background)]/70">
                  {item.localFunction}
                </p>
              </div>
              <span className="rounded-full border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 px-2 py-1 text-xs font-semibold text-[var(--mymedlife-badge-background)]">
                locked
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/58">
              Route: {item.route}. Role allowed here? {item.allowedByRole ? "yes" : "no"}.
              Ready checks: {item.readyCheckCount}. Blockers: {item.blockerCount}.
            </p>
            <p className="mt-2 text-xs leading-5 text-white/44">
              Still blocked by: {item.blockingLabels.join(", ")}.
            </p>
          </article>
        ))}
      </div>

      <p className="mt-4 text-sm leading-6 text-white/62">
        Overall: enabled controls are {summary.allControlsDisabled ? "still disabled" : "not safe"}.
        Live auth, browser write approval, and external automation remain off.
      </p>
    </section>
  );
}
