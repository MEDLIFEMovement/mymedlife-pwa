import { createLeaderAssignmentAction } from "@/app/rush-month/actions/actions";
import {
  getAssignmentCreateResultState,
  type AssignmentCreateResultCode,
} from "@/services/assignment-create-result-states";
import {
  getAssignmentCreateReadbackState,
  type AssignmentCreateWriteReadiness,
} from "@/services/assignment-create-write";
import type { ChapterAssignmentInput } from "@/services/local-action-contracts";
import type { Assignment } from "@/shared/types/domain";

type LeaderAssignmentServerActionPanelProps = {
  chapterId: string;
  campaignId: string;
  input: ChapterAssignmentInput;
  existingAssignments: readonly Assignment[];
  readiness: AssignmentCreateWriteReadiness;
  returnTo?: string;
  resultCode?: AssignmentCreateResultCode;
};

export function LeaderAssignmentServerActionPanel({
  chapterId,
  campaignId,
  input,
  existingAssignments,
  readiness,
  returnTo = "/rush-month/actions",
  resultCode,
}: LeaderAssignmentServerActionPanelProps) {
  const resultState = resultCode ? getAssignmentCreateResultState(resultCode) : null;
  const readbackState = getAssignmentCreateReadbackState(
    existingAssignments,
    resultCode,
    input.title,
  );

  return (
    <section className="rounded-[2rem] border border-blue-300/20 bg-blue-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
        Local leader assignment creation
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        {readiness.canSubmit
          ? "Leaders can create this assignment locally."
          : "Assignment creation is still safely gated."}
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
        </div>
      ) : null}

      <form action={createLeaderAssignmentAction} className="mt-5 space-y-4">
        <input type="hidden" name="chapterId" value={chapterId} />
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="returnTo" value={returnTo} />

        <label className="block text-sm font-semibold text-white" htmlFor="title">
          Assignment title
        </label>
        <input
          id="title"
          name="title"
          className="w-full rounded-2xl border border-white/10 bg-[#bfdbfe]/52 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
          defaultValue={input.title}
          disabled={!readiness.canSubmit}
        />

        <label className="block text-sm font-semibold text-white" htmlFor="instructions">
          Student instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#bfdbfe]/52 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
          defaultValue={input.instructions}
          disabled={!readiness.canSubmit}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-white" htmlFor="ownerRole">
              Owner role
            </label>
            <select
              id="ownerRole"
              name="ownerRole"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#bfdbfe]/52 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
              defaultValue={input.ownerRole}
              disabled={!readiness.canSubmit}
            >
              <option value="General Member">General Member</option>
              <option value="Action Committee Member">Action Committee Member</option>
              <option value="Action Committee Chair">Action Committee Chair</option>
              <option value="E-Board Member">E-Board Member</option>
              <option value="Chapter President / Vice President">
                Chapter President / Vice President
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white" htmlFor="points">
              Points
            </label>
            <input
              id="points"
              name="points"
              type="number"
              min={0}
              max={1000}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#bfdbfe]/52 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
              defaultValue={input.points}
              disabled={!readiness.canSubmit}
            />
          </div>
        </div>

        <label
          className="block text-sm font-semibold text-white"
          htmlFor="evidenceRequired"
        >
          Proof/testimonial requirement
        </label>
        <textarea
          id="evidenceRequired"
          name="evidenceRequired"
          className="min-h-24 w-full rounded-2xl border border-white/10 bg-[#bfdbfe]/52 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
          defaultValue={input.evidenceRequired}
          disabled={!readiness.canSubmit}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-white" htmlFor="kpi">
              KPI
            </label>
            <input
              id="kpi"
              name="kpi"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#bfdbfe]/52 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
              defaultValue={input.kpi}
              disabled={!readiness.canSubmit}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white" htmlFor="dueLabel">
              Due label
            </label>
            <input
              id="dueLabel"
              name="dueLabel"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#bfdbfe]/52 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
              defaultValue={input.dueLabel}
              disabled={!readiness.canSubmit}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!readiness.canSubmit}
          className="w-full rounded-full bg-blue-200 px-5 py-3 text-sm font-semibold text-[#08224c] transition hover:bg-[#1e4fd8]lue-100 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/38 sm:w-auto"
        >
          {readiness.canSubmit ? "Create assignment locally" : "Assignment save locked"}
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
