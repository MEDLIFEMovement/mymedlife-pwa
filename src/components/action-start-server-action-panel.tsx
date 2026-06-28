import { startAssignmentAction } from "@/app/rush-month/actions/[assignmentId]/actions";
import {
  getActionStartResultState,
  type ActionStartResultCode,
} from "@/services/action-start-result-states";
import {
  getActionStartReadbackState,
  type ActionStartWriteReadiness,
} from "@/services/action-start-write";
import type { Assignment } from "@/shared/types/domain";

type ActionStartServerActionPanelProps = {
  assignment: Assignment;
  readiness: ActionStartWriteReadiness;
  resultCode?: ActionStartResultCode;
};

export function ActionStartServerActionPanel({
  assignment,
  readiness,
  resultCode,
}: ActionStartServerActionPanelProps) {
  const resultState = resultCode ? getActionStartResultState(resultCode) : null;
  const readbackState = getActionStartReadbackState(assignment, resultCode);

  return (
    <section className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]">
        Local start action
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        {readiness.canSubmit
          ? "You can start this action in local Supabase."
          : "Start action is still safely gated."}
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/68">{readiness.reason}</p>

      {resultState ? (
        <div
          className={[
            "mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
            resultState.tone === "success"
              ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/10 text-[var(--mymedlife-badge-background)]"
              : resultState.tone === "warning"
                ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/10 text-[var(--mymedlife-badge-background)]"
                : resultState.tone === "error"
                  ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/10 text-[var(--mymedlife-badge-background)]"
                  : "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/10 text-[var(--mymedlife-badge-background)]",
          ].join(" ")}
          role="status"
        >
          <p className="font-semibold">{resultState.title}</p>
          <p className="mt-1">{resultState.plainEnglishMessage}</p>
        </div>
      ) : null}

      {readbackState ? (
        <div
          className={[
            "mt-3 rounded-2xl border px-4 py-3 text-sm leading-6",
            readbackState.tone === "success"
              ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/10 text-[var(--mymedlife-badge-background)]"
              : readbackState.tone === "warning"
                ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/10 text-[var(--mymedlife-badge-background)]"
                : "border-white/10 bg-[var(--mymedlife-border)]/42 text-white/68",
          ].join(" ")}
        >
          <p className="font-semibold">Local readback</p>
          <p className="mt-1">{readbackState.message}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-75">
            Current assignment status: {readbackState.assignmentStatus}
          </p>
        </div>
      ) : null}

      <form action={startAssignmentAction} className="mt-5">
        <input type="hidden" name="assignmentId" value={assignment.id} />
        <input
          type="hidden"
          name="returnTo"
          value={`/rush-month/actions/${assignment.id}`}
        />
        <button
          type="submit"
          disabled={!readiness.canSubmit}
          className="w-full rounded-full bg-[var(--mymedlife-focus-blue)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--mymedlife-action-blue-hover)] disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/38 sm:w-auto"
        >
          {readiness.canSubmit ? "Start this action" : "Start action locked"}
        </button>
      </form>

      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {readiness.checks.map((check) => (
          <div
            key={check.key}
            className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/42 px-3 py-2"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
              {check.passed ? "Ready" : "Blocked"}
            </p>
            <p className="mt-1 text-sm text-white/72">{check.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
