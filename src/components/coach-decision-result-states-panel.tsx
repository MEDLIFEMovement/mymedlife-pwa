import type {
  CoachDecisionResultPreview,
  CoachDecisionResultState,
  CoachDecisionResultTone,
} from "@/services/coach-decision-result-states";

type CoachDecisionResultStatesPanelProps = {
  preview: CoachDecisionResultPreview;
  states: readonly CoachDecisionResultState[];
};

export function CoachDecisionResultStatesPanel({
  preview,
  states,
}: CoachDecisionResultStatesPanelProps) {
  return (
    <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
        Coach decision result states
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        Coach decision messages are defined while escalation stays off.
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/66">
        Today the browser still returns the disabled state. If Nick later
        approves coach decision writes, these outcomes keep readiness decisions
        auditable while preventing real n8n escalation packets.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ResultCard label="Current browser result" state={preview.currentResult} />
        <ResultCard
          label="Future result for this mock decision"
          state={preview.futureResultIfEnabled}
        />
      </div>

      <div className="mt-4 rounded-2xl bg-[#bfdbfe]/40 p-3">
        <p className="text-sm font-semibold text-white">Disabled server result shape</p>
        <p className="mt-2 font-mono text-xs leading-5 text-blue-100/80">
          success: {String(preview.serverResultShape.success)}, errorCode:{" "}
          {preview.serverResultShape.errorCode}, decision:{" "}
          {preview.serverResultShape.decision}
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
  state: CoachDecisionResultState;
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
        Review row: {state.createsReadinessReview ? "yes" : "no"}. Outbox row:{" "}
        {state.createsOutboxItem ? "yes" : "no"}. Sends escalation:{" "}
        {state.sendsEscalationPacket ? "yes" : "no"}.
      </p>
    </div>
  );
}

function toneBorderClass(tone: CoachDecisionResultTone): string {
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

function toneBadgeClass(tone: CoachDecisionResultTone): string {
  switch (tone) {
    case "success":
      return "bg-blue-300/20 text-blue-100";
    case "warning":
      return "bg-blue-300/20 text-blue-100";
    case "error":
      return "bg-blue-300/20 text-blue-100";
    case "info":
      return "bg-blue-300/20 text-blue-100";
  }
}
