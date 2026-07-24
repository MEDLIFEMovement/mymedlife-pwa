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
  const environmentLabel = getEnvironmentLabel(readiness.environment);

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
        {environmentLabel} start action
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        {readiness.canSubmit
          ? "You can start this action."
          : "Start action is still safely gated."}
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/68">{readiness.reason}</p>

      {resultState ? (
        <div
          className={[
            "mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
            resultState.tone === "success"
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
              : resultState.tone === "warning"
                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                : resultState.tone === "error"
                  ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
                  : "border-sky-300/30 bg-sky-300/10 text-sky-100",
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
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
              : readbackState.tone === "warning"
                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                : "border-white/10 bg-black/18 text-white/68",
          ].join(" ")}
        >
          <p className="font-semibold">{environmentLabel} readback</p>
          <p className="mt-1">{readbackState.message}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-75">
            Current assignment status: {readbackState.assignmentStatus}
          </p>
        </div>
      ) : null}

      <form action={startAssignmentAction} className="mt-5">
        <input type="hidden" name="assignmentId" value={assignment.id} />
        <input type="hidden" name="expectedStatus" value={assignment.status} />
        <input
          type="hidden"
          name="returnTo"
          value={`/rush-month/actions/${assignment.id}`}
        />
        <button
          type="submit"
          disabled={!readiness.canSubmit}
          className="w-full rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#06211d] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/38 sm:w-auto"
        >
          {readiness.canSubmit ? "Start this action" : "Start action locked"}
        </button>
      </form>

      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {readiness.checks.map((check) => (
          <div
            key={check.key}
            className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2"
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

function getEnvironmentLabel(
  environment: ActionStartWriteReadiness["environment"],
) {
  if (environment === "production") return "Production";
  if (environment === "staging") return "Staging";
  return "Local";
}
