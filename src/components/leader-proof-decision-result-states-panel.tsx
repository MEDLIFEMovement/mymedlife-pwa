import type {
  LeaderProofDecisionResultPreview,
  LeaderProofDecisionResultState,
  LeaderProofDecisionResultTone,
} from "@/services/leader-proof-decision-result-states";

type LeaderProofDecisionResultStatesPanelProps = {
  preview: LeaderProofDecisionResultPreview;
  states: readonly LeaderProofDecisionResultState[];
};

export function LeaderProofDecisionResultStatesPanel({
  preview,
  states,
}: LeaderProofDecisionResultStatesPanelProps) {
  return (
    <section className="app-surface-info rounded-[2rem] p-5">
      <p className="app-eyebrow app-eyebrow-blue">Chapter decision outcomes</p>
      <h2 className="app-title mt-2">
        Chapter proof outcomes stay defined before saving turns on.
      </h2>
      <p className="app-copy mt-2">
        These states keep chapter completion, points, KPI movement, member
        follow-up, and HQ sharing separated while this workflow is still under
        review.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ResultCard label="Current chapter outcome" state={preview.currentResult} />
        <ResultCard
          label="If saved"
          state={preview.futureResultIfEnabled}
        />
      </div>

      <div className="app-surface rounded-[1.2rem] p-3">
        <p className="text-sm font-semibold text-slate-950">Decision snapshot</p>
        <p className="mt-2 font-mono text-xs leading-5 text-[#2563eb]">
          success: {String(preview.serverResultShape.success)}, errorCode:{" "}
          {preview.serverResultShape.errorCode}, assignmentId:{" "}
          {preview.serverResultShape.assignmentId}, evidenceItemId:{" "}
          {preview.serverResultShape.evidenceItemId ?? "none"}
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {preview.serverResultShape.plainEnglishMessage}
        </p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {states.map((state) => (
          <ResultCard key={state.code} compact label={state.code} state={state} />
        ))}
      </div>
    </section>
  );
}

function ResultCard({
  compact = false,
  label,
  state,
}: {
  compact?: boolean;
  label: string;
  state: LeaderProofDecisionResultState;
}) {
  return (
    <div className={`app-surface rounded-[1.15rem] p-3 ${toneBorderClass(state.tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="app-eyebrow app-eyebrow-slate">{label}</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{state.title}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${toneBadgeClass(state.tone)}`}
        >
          {state.success ? "recorded" : "blocked"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600">{state.plainEnglishMessage}</p>
      {!compact ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">Next: {state.nextStep}</p>
      ) : null}
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Event: {state.structuredEvent ?? "none"}. Audit:{" "}
        {state.auditAction ?? "none"}.
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Evidence: {state.updatesEvidenceStatus ? "yes" : "no"}. Points:{" "}
        {state.createsPointsEvent ? "yes" : "no"}. KPI:{" "}
        {state.createsKpiEvent ? "yes" : "no"}. Outbox:{" "}
        {state.createsOutboxItem ? "yes" : "no"}. Publishes proof:{" "}
        {state.publishesProof ? "yes" : "no"}.
      </p>
    </div>
  );
}

function toneBorderClass(tone: LeaderProofDecisionResultTone): string {
  switch (tone) {
    case "success":
      return "border-blue-200";
    case "warning":
      return "border-blue-200";
    case "error":
      return "border-blue-200";
    case "info":
      return "border-[#bfdbfe]";
  }
}

function toneBadgeClass(tone: LeaderProofDecisionResultTone): string {
  switch (tone) {
    case "success":
      return "border border-blue-200 bg-blue-50 text-blue-700";
    case "warning":
      return "border border-blue-200 bg-blue-50 text-blue-700";
    case "error":
      return "border border-blue-200 bg-blue-50 text-blue-700";
    case "info":
      return "border border-[#bfdbfe] bg-[#eaf2ff] text-[#2563eb]";
  }
}
