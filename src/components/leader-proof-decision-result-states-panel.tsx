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
    <section className="rounded-[2rem] border border-indigo-300/20 bg-indigo-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100/80">
        Leader proof decision result states
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        Chapter proof outcomes are defined while saves stay off.
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/66">
        Today the browser still returns the disabled state. If Nick later
        approves leader proof decision writes, these outcomes keep chapter
        completion, points, KPI movement, member nudges, and HQ sharing separated.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ResultCard label="Current browser result" state={preview.currentResult} />
        <ResultCard
          label="Future result for this mock decision"
          state={preview.futureResultIfEnabled}
        />
      </div>

      <div className="mt-4 rounded-2xl bg-black/20 p-3">
        <p className="text-sm font-semibold text-white">Disabled server result shape</p>
        <p className="mt-2 font-mono text-xs leading-5 text-indigo-100/80">
          success: {String(preview.serverResultShape.success)}, errorCode:{" "}
          {preview.serverResultShape.errorCode}, assignmentId:{" "}
          {preview.serverResultShape.assignmentId}, evidenceItemId:{" "}
          {preview.serverResultShape.evidenceItemId ?? "none"}
        </p>
        <p className="mt-2 text-xs leading-5 text-white/58">
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
    <div className={`rounded-2xl bg-black/20 p-3 ${toneBorderClass(state.tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
            {label}
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{state.title}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${toneBadgeClass(state.tone)}`}
        >
          {state.success ? "recorded" : "blocked"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-white/58">{state.plainEnglishMessage}</p>
      {!compact ? (
        <p className="mt-2 text-xs leading-5 text-white/48">Next: {state.nextStep}</p>
      ) : null}
      <p className="mt-2 text-xs leading-5 text-white/44">
        Event: {state.structuredEvent ?? "none"}. Audit:{" "}
        {state.auditAction ?? "none"}.
      </p>
      <p className="mt-1 text-xs leading-5 text-white/44">
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
      return "border border-emerald-300/20";
    case "warning":
      return "border border-amber-300/20";
    case "error":
      return "border border-rose-300/20";
    case "info":
      return "border border-indigo-300/20";
  }
}

function toneBadgeClass(tone: LeaderProofDecisionResultTone): string {
  switch (tone) {
    case "success":
      return "bg-emerald-300/20 text-emerald-100";
    case "warning":
      return "bg-amber-300/20 text-amber-100";
    case "error":
      return "bg-rose-300/20 text-rose-100";
    case "info":
      return "bg-indigo-300/20 text-indigo-100";
  }
}
