import type {
  CampaignCloseoutReadiness,
  CampaignCloseoutStatus,
  CampaignReadinessState,
} from "@/services/campaign-closeout-readiness";

type CampaignCloseoutReadinessPanelProps = {
  closeout: CampaignCloseoutReadiness;
};

export function CampaignCloseoutReadinessPanel({
  closeout,
}: CampaignCloseoutReadinessPanelProps) {
  if (!closeout.canReadCloseout) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
            Phase closeout
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{closeout.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {closeout.summary}
          </p>
          <div className="mt-3">
            <ReadinessPill state={closeout.readinessState} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          <MiniStat
            label="Approved"
            value={`${closeout.counts.approvedAssignments}/${closeout.counts.totalAssignments}`}
          />
          <MiniStat label="Proof" value={`${closeout.counts.proofPending}`} />
          <MiniStat label="Events" value={`${closeout.counts.eventPlans}`} />
          <MiniStat label="Writes" value={`${closeout.counts.closeoutWritesEnabled}`} />
          <MiniStat label="Exports" value={`${closeout.counts.externalExportsEnabled}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {closeout.rows.map((row) => (
          <article key={row.key} className="rounded-2xl bg-[#bfdbfe]/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status={row.status} />
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                    Owner: {row.owner}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">{row.label}</h3>
                <p className="mt-2 text-sm leading-6 text-white/66">
                  {row.actionNeeded}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-[#0b66cc]/70 p-3 text-xs leading-5 text-white/54">
        Closeout writes and external exports are disabled. This panel does not
        advance phases, send coach packets, update warehouse rows, or trigger n8n.
      </p>
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

function ReadinessPill({ state }: { state: CampaignReadinessState }) {
  const className =
    state === "advance_ready"
      ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
      : state === "hold_for_follow_up"
        ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
        : "border-blue-300/30 bg-blue-300/15 text-blue-100";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {state.replaceAll("_", " ")}
    </span>
  );
}

function StatusPill({ status }: { status: CampaignCloseoutStatus }) {
  const className =
    status === "ready"
      ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
      : status === "mocked"
        ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
        : status === "needs_work"
          ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
          : "border-blue-300/30 bg-blue-300/15 text-blue-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
