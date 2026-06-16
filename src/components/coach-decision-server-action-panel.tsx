import { submitCoachDecisionAction } from "@/app/coach/actions";
import {
  getCoachDecisionResultState,
  type CoachDecisionResultCode,
} from "@/services/coach-decision-result-states";
import {
  getCoachDecisionReadbackState,
  type CoachDecisionWriteReadiness,
} from "@/services/coach-decision-write";
import type { CoachDecisionInput } from "@/services/local-action-contracts";
import type { PhaseRow } from "@/shared/types/persistence";

type CoachDecisionServerActionPanelProps = {
  chapterId: string;
  campaignId: string;
  phase: PhaseRow | undefined;
  readiness: CoachDecisionWriteReadiness;
  resultCode?: CoachDecisionResultCode;
  defaultInput: CoachDecisionInput;
};

export function CoachDecisionServerActionPanel({
  chapterId,
  campaignId,
  phase,
  readiness,
  resultCode,
  defaultInput,
}: CoachDecisionServerActionPanelProps) {
  const resultState = resultCode ? getCoachDecisionResultState(resultCode) : null;
  const readbackState = getCoachDecisionReadbackState(phase, resultCode);

  return (
    <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
        Local coach decision
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        {readiness.canSubmit
          ? "Coach can record this local decision."
          : "Coach decision saves are still safely gated."}
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
                  : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
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
          <p className="font-semibold">Local readback</p>
          <p className="mt-1">{readbackState.message}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-75">
            Readiness: {readbackState.readinessStatus ?? "unknown"}. Coach
            validation: {readbackState.coachValidationStatus ?? "unknown"}.
          </p>
        </div>
      ) : null}

      <form action={submitCoachDecisionAction} className="mt-5 space-y-4">
        <input type="hidden" name="chapterId" value={chapterId} />
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="phaseId" value={phase?.id ?? ""} />
        <input type="hidden" name="returnTo" value="/coach" />

        <label className="block text-sm font-semibold text-white" htmlFor="decision">
          Coach decision
        </label>
        <select
          id="decision"
          name="decision"
          className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
          defaultValue={defaultInput.decision}
          disabled={!readiness.canSubmit}
        >
          <option value="advance">Advance</option>
          <option value="hold">Hold</option>
          <option value="intervene">Intervene</option>
        </select>

        <label className="block text-sm font-semibold text-white" htmlFor="note">
          Decision note
        </label>
        <textarea
          id="note"
          name="note"
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
          defaultValue={defaultInput.note}
          disabled={!readiness.canSubmit}
        />

        <label
          className="block text-sm font-semibold text-white"
          htmlFor="blockerSummary"
        >
          Blocker summary for intervention
        </label>
        <textarea
          id="blockerSummary"
          name="blockerSummary"
          className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-white/34 disabled:cursor-not-allowed disabled:text-white/38"
          placeholder="Required only if the decision is intervene."
          defaultValue={defaultInput.blockerSummary ?? ""}
          disabled={!readiness.canSubmit}
        />

        <button
          type="submit"
          disabled={!readiness.canSubmit}
          className="w-full rounded-full bg-cyan-200 px-5 py-3 text-sm font-semibold text-[#06211d] transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/38 sm:w-auto"
        >
          {readiness.canSubmit ? "Save coach decision locally" : "Coach decision locked"}
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
