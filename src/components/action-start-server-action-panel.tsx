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
  returnToHref?: string;
};

export function ActionStartServerActionPanel({
  assignment,
  readiness,
  resultCode,
  returnToHref,
}: ActionStartServerActionPanelProps) {
  const resultState = resultCode ? getActionStartResultState(resultCode) : null;
  const readbackState = getActionStartReadbackState(assignment, resultCode);
  const confirmsStarted = readbackState?.confirmsStarted ?? false;
  const title = confirmsStarted
    ? "Action started and recorded."
    : readiness.canSubmit
      ? "Start this action now."
      : "Start action is still safely gated.";
  const detail = confirmsStarted
    ? "This assignment is already in progress. Finish the work, then move into proof and review."
    : readiness.reason;
  const buttonLabel = confirmsStarted
    ? "Action already started"
    : "Start this action";
  const buttonDisabled = confirmsStarted || !readiness.canSubmit;

  return (
    <section className="app-surface-info rounded-[1.8rem] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
        {readiness.environmentLabel}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>

      {resultState ? (
        <div
          className={[
            "mt-4 rounded-[1.3rem] border px-4 py-3 text-sm leading-6",
            resultState.tone === "success"
              ? "border-[var(--mymedlife-border)] bg-[var(--background)] text-slate-800"
              : resultState.tone === "warning"
                ? "border-[var(--mymedlife-warning)]/30 bg-[var(--mymedlife-warning)]/8 text-slate-800"
                : resultState.tone === "error"
                  ? "border-[var(--mymedlife-error)]/24 bg-[var(--mymedlife-error)]/8 text-slate-800"
                  : "border-[var(--mymedlife-border)] bg-white text-slate-800",
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
            "mt-3 rounded-[1.3rem] border px-4 py-3 text-sm leading-6",
            readbackState.tone === "success"
              ? "border-[var(--mymedlife-border)] bg-[var(--background)] text-slate-800"
              : readbackState.tone === "warning"
                ? "border-[var(--mymedlife-warning)]/30 bg-[var(--mymedlife-warning)]/8 text-slate-800"
                : "border-slate-200 bg-white text-slate-600",
          ].join(" ")}
        >
          <p className="font-semibold">Assignment readback</p>
          <p className="mt-1">{readbackState.message}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
            Current assignment status: {readbackState.assignmentStatus}
          </p>
        </div>
      ) : null}

      <form action={startAssignmentAction} className="mt-5">
        <input type="hidden" name="assignmentId" value={assignment.id} />
        <input
          type="hidden"
          name="returnTo"
          value={returnToHref ?? `/rush-month/actions/${assignment.id}`}
        />
        <button
          type="submit"
          disabled={buttonDisabled}
          className="w-full rounded-full bg-[var(--mymedlife-action-blue)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-action-blue-hover)] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:w-auto"
        >
          {buttonLabel}
        </button>
      </form>

      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {readiness.checks.map((check) => (
          <div
            key={check.key}
            className="rounded-[1.15rem] border border-slate-200 bg-white px-3 py-2"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {check.passed ? "Ready" : "Blocked"}
            </p>
            <p className="mt-1 text-sm text-slate-700">{check.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
