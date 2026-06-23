import type {
  ActionStartResultPreview,
  ActionStartResultState,
  ActionStartResultTone,
} from "@/services/action-start-result-states";

type ActionStartResultStatesPanelProps = {
  preview: ActionStartResultPreview;
  states: readonly ActionStartResultState[];
};

export function ActionStartResultStatesPanel({
  preview,
  states,
}: ActionStartResultStatesPanelProps) {
  return (
    <section className="app-surface-info rounded-[2rem] p-5">
      <p className="app-eyebrow app-eyebrow-blue">
        Action-start result states
      </p>
      <h2 className="app-title mt-2">
        Future save messages are defined before the save is enabled.
      </h2>
      <p className="app-copy mt-2">
        Today the browser still returns the disabled state. If Nick later
        approves action-start writes, the app should use these plain-English
        outcomes so students and staff know what happened.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ResultCard label="Current browser result" state={preview.currentResult} />
        <ResultCard
          label="Future result for this mock action"
          state={preview.futureResultIfEnabled}
        />
      </div>

      <div className="app-surface rounded-[1.2rem] p-3">
        <p className="text-sm font-semibold text-slate-950">Disabled server result shape</p>
        <p className="mt-2 font-mono text-xs leading-5 text-[#2563eb]">
          success: {String(preview.serverResultShape.success)}, errorCode:{" "}
          {preview.serverResultShape.errorCode}, assignmentId:{" "}
          {preview.serverResultShape.assignmentId}
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
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
  state: ActionStartResultState;
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
          {state.success ? "success" : "blocked"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600">{state.plainEnglishMessage}</p>
      {!compact ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">Next: {state.nextStep}</p>
      ) : null}
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Retry: {state.retryAllowed ? "yes" : "no"}. Creates event:{" "}
        {state.createsEvent ? "yes" : "no"}.
      </p>
    </div>
  );
}

function toneBorderClass(tone: ActionStartResultTone): string {
  switch (tone) {
    case "success":
      return "border-emerald-200";
    case "warning":
      return "border-amber-200";
    case "error":
      return "border-rose-200";
    case "info":
      return "border-[#bfdbfe]";
  }
}

function toneBadgeClass(tone: ActionStartResultTone): string {
  switch (tone) {
    case "success":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "warning":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "error":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    case "info":
      return "border border-[#bfdbfe] bg-[#eaf2ff] text-[#2563eb]";
  }
}
