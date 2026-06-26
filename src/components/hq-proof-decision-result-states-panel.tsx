import type {
  HqProofDecisionResultPreview,
  HqProofDecisionResultState,
  HqProofDecisionResultTone,
} from "@/services/hq-proof-decision-result-states";

type HqProofDecisionResultStatesPanelProps = {
  preview: HqProofDecisionResultPreview;
  states: readonly HqProofDecisionResultState[];
};

export function HqProofDecisionResultStatesPanel({
  preview,
  states,
}: HqProofDecisionResultStatesPanelProps) {
  return (
    <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em]  text-blue-100/80">
        Sharing decision outcomes
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        HQ sharing outcomes stay defined before publishing opens.
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/66">
        These states keep the chapter review trail separate from broader
        sharing or automation while publishing stays off.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ResultCard label="Current sharing outcome" state={preview.currentResult} />
        <ResultCard
          label="If saved"
          state={preview.futureResultIfEnabled}
        />
      </div>

      <div className="mt-4 rounded-2xl bg-[#bfdbfe]/40 p-3">
        <p className="text-sm font-semibold text-white">Decision snapshot</p>
        <p className="mt-2 font-mono text-xs leading-5  text-blue-100/80">
          success: {String(preview.serverResultShape.success)}, errorCode:{" "}
          {preview.serverResultShape.errorCode}, evidenceItemId:{" "}
          {preview.serverResultShape.evidenceItemId}
        </p>
        <p className="mt-2 text-xs leading-5 text-white/58">
          {preview.serverResultShape.plainEnglishMessage}
        </p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {states.map((state) => (
          <ResultCard key={state.code} label={state.code} state={state} compact />
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
  state: HqProofDecisionResultState;
}) {
  return (
    <div className={`rounded-2xl bg-[#bfdbfe]/40 p-3 ${toneBorderClass(state.tone)}`}>
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
        Approval row: {state.createsApproval ? "yes" : "no"}. Outbox row:{" "}
        {state.createsOutboxItem ? "yes" : "no"}. Publishes proof:{" "}
        {state.publishesProof ? "yes" : "no"}.
      </p>
    </div>
  );
}

function toneBorderClass(tone: HqProofDecisionResultTone): string {
  switch (tone) {
    case "success":
      return "border border-blue-300/20";
    case "warning":
      return "border border-blue-300/20";
    case "error":
      return "border border-blue-300/20";
    case "info":
      return "border border-blue-300/20";
  }
}

function toneBadgeClass(tone: HqProofDecisionResultTone): string {
  switch (tone) {
    case "success":
      return "bg-blue-300/20 text-blue-100";
    case "warning":
      return "bg-blue-300/20 text-blue-100";
    case "error":
      return "bg-blue-300/20 text-blue-100";
    case "info":
      return "bg-blue-300/20  text-blue-100";
  }
}
