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
    <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
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
              ? "border-blue-300/30 bg-blue-300/10 text-blue-100"
              : resultState.tone === "warning"
                ? "border-blue-300/30 bg-blue-300/10 text-blue-100"
                : resultState.tone === "error"
                  ? "border-blue-300/30 bg-blue-300/10 text-blue-100"
                  : "border-blue-300/30 bg-blue-300/10 text-blue-100",
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
              ? "border-blue-300/30 bg-blue-300/10 text-blue-100"
              : readbackState.tone === "warning"
                ? "border-blue-300/30 bg-blue-300/10 text-blue-100"
                : "border-white/10 bg-[#bfdbfe]/42 text-white/68",
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
          className="w-full rounded-full bg-blue-300 px-5 py-3 text-sm font-semibold text-[#08224c] transition hover:bg-[#1e4fd8]lue-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/38 sm:w-auto"
        >
          {readiness.canSubmit ? "Start this action" : "Start action locked"}
        </button>
      </form>

      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {readiness.checks.map((check) => (
          <div
            key={check.key}
            className="rounded-2xl border border-white/10 bg-[#bfdbfe]/42 px-3 py-2"
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
