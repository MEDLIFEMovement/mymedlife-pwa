import type {
  CampaignStarterShellReadiness,
  CampaignStarterShellReadinessStatus,
} from "@/services/campaign-starter-shell-readiness";

type CampaignStarterShellReadinessPanelProps = {
  readiness: CampaignStarterShellReadiness;
};

export function CampaignStarterShellReadinessPanel({
  readiness,
}: CampaignStarterShellReadinessPanelProps) {
  if (!readiness.canReadReadiness) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
            Required campaign lanes
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{readiness.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {readiness.summary}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
          <MiniStat label="Present" value={`${readiness.presentCount}/${readiness.requiredCount}`} />
          <MiniStat label="Workflow-backed" value={`${readiness.workflowBackedCount}`} />
          <MiniStat label="Shell-only" value={`${readiness.shellOnlyCount}`} />
          <MiniStat label="Missing" value={`${readiness.missingCount}`} />
          <MiniStat label="Writes / Sends" value={`${readiness.browserWritesExpected}/${readiness.externalWritesExpected}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {readiness.items.map((item) => (
          <article
            key={item.slug}
            className="rounded-2xl border border-slate-200 bg-[var(--mymedlife-badge-background)] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status={item.status} />
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {item.templateStatus?.replaceAll("_", " ") ?? "missing"}
                  </span>
                  {item.workflowVersionLabel ? (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {item.workflowVersionLabel}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-950">{item.name}</h3>
                <p className="mt-1 break-words font-mono text-xs text-[var(--mymedlife-info)]">
                  {item.route}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {item.actionLaneCount} lanes
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {item.kpiCount} KPIs
                </span>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <ReadinessFlag label="Student promise" ready={item.hasStudentPromise} />
              <ReadinessFlag label="Operating rhythm" ready={item.hasOperatingRhythm} />
            </div>

            {item.currentPhaseLabel && item.currentPhaseObjective ? (
              <div className="mt-3 rounded-2xl border border-[var(--mymedlife-border)] bg-[var(--background)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-primary-button)]">
                  Current workflow state
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--mymedlife-border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--mymedlife-primary-button)]">
                    source {item.workflowSource.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {item.currentPhaseLabel}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.currentPhaseObjective}
                </p>
                {item.currentPhaseExitSignal ? (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Exit signal: {item.currentPhaseExitSignal}
                  </p>
                ) : null}
              </div>
            ) : null}

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Next build step: {item.nextBuildStep}
            </p>
            <p className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">
              External sends: {item.externalWritesExpected}. Browser writes:{" "}
              {item.browserWritesExpected}. Safe to send externally: no.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[var(--mymedlife-badge-background)] px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: CampaignStarterShellReadinessStatus }) {
  const className =
    status === "workflow_backed_draft"
      ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-info-surface)] text-[var(--mymedlife-primary-button)]"
      : status === "shell_ready"
        ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]"
        : "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function ReadinessFlag({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{ready ? "ready" : "missing"}</p>
    </div>
  );
}
