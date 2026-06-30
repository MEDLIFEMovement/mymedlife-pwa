import type {
  AssignmentCreateResultPreview,
  AssignmentCreateResultState,
  AssignmentCreateResultTone,
} from "@/services/assignment-create-result-states";

type AssignmentCreateResultStatesPanelProps = {
  preview: AssignmentCreateResultPreview;
  states: readonly AssignmentCreateResultState[];
};

export function AssignmentCreateResultStatesPanel({
  preview,
  states,
}: AssignmentCreateResultStatesPanelProps) {
  return (
    <section className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
        Assignment creation result states
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        Leader assignment messages are defined while reminders stay off.
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/66">
        Today the browser still returns the disabled state. If Nick later
        approves assignment creation writes, these outcomes keep leader-created
        action truth clear while preventing automatic reminders.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ResultCard label="Current browser result" state={preview.currentResult} />
        <ResultCard
          label="Future result for this mock assignment"
          state={preview.futureResultIfEnabled}
        />
      </div>

      <div className="mt-4 rounded-2xl bg-[var(--mymedlife-border)]/40 p-3">
        <p className="text-sm font-semibold text-white">Disabled server result shape</p>
        <p className="mt-2 font-mono text-xs leading-5 text-[var(--mymedlife-badge-background)]/80">
          success: {String(preview.serverResultShape.success)}, errorCode:{" "}
          {preview.serverResultShape.errorCode}, title: {preview.serverResultShape.title}
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
  state: AssignmentCreateResultState;
}) {
  return (
    <div className={`rounded-2xl bg-[var(--mymedlife-border)]/40 p-3 ${toneBorderClass(state.tone)}`}>
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
          {state.success ? "created" : "blocked"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-white/58">{state.plainEnglishMessage}</p>
      {!compact ? (
        <p className="mt-2 text-xs leading-5 text-white/48">Next: {state.nextStep}</p>
      ) : null}
      <p className="mt-2 text-xs leading-5 text-white/44">
        Assignment row: {state.createsAssignment ? "yes" : "no"}. Outbox row:{" "}
        {state.createsOutboxItem ? "yes" : "no"}. Sends reminder:{" "}
        {state.sendsReminder ? "yes" : "no"}.
      </p>
    </div>
  );
}

function toneBorderClass(tone: AssignmentCreateResultTone): string {
  switch (tone) {
    case "success":
      return "border border-[var(--mymedlife-focus-blue)]/20";
    case "warning":
      return "border border-[var(--mymedlife-focus-blue)]/20";
    case "error":
      return "border border-[var(--mymedlife-focus-blue)]/20";
    case "info":
      return "border border-[var(--mymedlife-focus-blue)]/20";
  }
}

function toneBadgeClass(tone: AssignmentCreateResultTone): string {
  switch (tone) {
    case "success":
      return "bg-[var(--mymedlife-focus-blue)]/20 text-[var(--mymedlife-badge-background)]";
    case "warning":
      return "bg-[var(--mymedlife-focus-blue)]/20 text-[var(--mymedlife-badge-background)]";
    case "error":
      return "bg-[var(--mymedlife-focus-blue)]/20 text-[var(--mymedlife-badge-background)]";
    case "info":
      return "bg-[var(--mymedlife-focus-blue)]/20 text-[var(--mymedlife-badge-background)]";
  }
}
