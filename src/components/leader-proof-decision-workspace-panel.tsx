import type {
  LeaderProofDecisionRow,
  LeaderProofDecisionStatus,
  LeaderProofDecisionWorkspace,
} from "@/services/leader-proof-decision-workspace";

type LeaderProofDecisionWorkspacePanelProps = {
  workspace: LeaderProofDecisionWorkspace;
};

export function LeaderProofDecisionWorkspacePanel({
  workspace,
}: LeaderProofDecisionWorkspacePanelProps) {
  if (!workspace.canReadWorkspace) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
            Chapter decisions
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{workspace.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {workspace.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          <MiniStat label="Rows" value={`${workspace.counts.total}`} />
          <MiniStat label="Approve" value={`${workspace.counts.readyForApproval}`} />
          <MiniStat label="Changes" value={`${workspace.counts.needsChanges}`} />
          <MiniStat label="Not ready" value={`${workspace.counts.notReady}`} />
          <MiniStat label="Writes" value={`${workspace.counts.browserWritesEnabled}`} />
          <MiniStat label="Sends" value={`${workspace.counts.externalWritesEnabled}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {workspace.rows.map((row) => (
          <ProofDecisionCard key={row.key} row={row} />
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-[#0b66cc]/70 p-3 text-xs leading-5 text-white/58">
        {workspace.finalPrompt}
      </p>
    </section>
  );
}

function ProofDecisionCard({ row }: { row: LeaderProofDecisionRow }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill status={row.status} />
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
              {row.ownerLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
              Due {row.dueLabel}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">{row.assignmentTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-white/66">
            {row.evidenceSummary}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MiniToken label="Writes" value={`${row.browserWritesExpected}`} />
          <MiniToken label="Sends" value={`${row.externalWritesExpected}`} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <DecisionFact title="Leader next step" body={row.leaderNextStep} />
        <DecisionFact title="Review prompt" body={row.storyContextPrompt} />
        <DecisionFact
          title="Recommended posture"
          body={row.recommendedDecisionRationale}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b66cc]/70 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
              Review rubric
            </p>
            <p className="mt-2 text-sm leading-6 text-white/66">
              {row.pointsKpiImpact} {row.hqSharingBoundary}
            </p>
          </div>
          <MiniToken label="Future" value={`${row.futureStructuredEvent} / ${row.auditAction}`} />
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {row.reviewRubric.map((item) => (
            <div key={`${row.key}-${item.label}`} className="rounded-2xl bg-[#bfdbfe]/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/44">
                {item.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/72">{item.question}</p>
              <p className="mt-2 text-xs leading-5 text-white/48">{item.passSignal}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white/[0.05] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
          Held decision controls
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {row.decisionOptions.map((option) => (
            <button
              key={`${row.key}-${option.value}`}
              type="button"
              disabled
              title={option.disabledReason}
              className="rounded-full border border-white/10 bg-[#bfdbfe]/40 px-3 py-1.5 text-xs font-semibold text-white/52 disabled:cursor-not-allowed"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <MiniToken label="Recommended" value={row.recommendedDecision.replaceAll("_", " ")} />
        <MiniToken label="Proof" value={row.proofTypeLabel} />
      </div>
    </article>
  );
}

function DecisionFact({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b66cc]/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/66">{body}</p>
    </div>
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

function MiniToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/58">
      {label} {value}
    </span>
  );
}

function StatusPill({ status }: { status: LeaderProofDecisionStatus }) {
  const className =
    status === "ready_for_approval"
      ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
      : status === "needs_changes"
        ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
        : status === "already_approved"
          ? "border-blue-300/30 bg-blue-300/15 text-blue-100"
          : "border-white/10 bg-white/10 text-white/70";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
