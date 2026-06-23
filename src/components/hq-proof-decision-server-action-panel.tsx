import { submitHqProofDecisionAction } from "@/app/rush-month/review/actions";
import {
  getHqProofDecisionResultState,
  type HqProofDecisionResultCode,
} from "@/services/hq-proof-decision-result-states";
import {
  getHqProofDecisionReadbackState,
  type HqProofDecisionWriteReadiness,
} from "@/services/hq-proof-decision-write";
import type { HqSharingDecisionInput } from "@/services/local-action-contracts";
import type { EvidenceItem } from "@/shared/types/domain";

type HqProofDecisionServerActionPanelProps = {
  evidenceItem: EvidenceItem;
  readiness: HqProofDecisionWriteReadiness;
  resultCode?: HqProofDecisionResultCode;
  defaultInput: HqSharingDecisionInput;
};

export function HqProofDecisionServerActionPanel({
  evidenceItem,
  readiness,
  resultCode,
  defaultInput,
}: HqProofDecisionServerActionPanelProps) {
  const resultState = resultCode ? getHqProofDecisionResultState(resultCode) : null;
  const readbackState = getHqProofDecisionReadbackState(evidenceItem, resultCode);

  return (
    <section className="rounded-[2rem] border border-teal-300/20 bg-teal-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100">
        Sharing decision preview
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        {readiness.canSubmit
          ? "This sharing decision is ready to save in review."
          : "Sharing decisions stay gated for now."}
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
                  : "border-teal-300/30 bg-teal-300/10 text-teal-100",
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
          <p className="font-semibold">Decision readback</p>
          <p className="mt-1">{readbackState.message}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-75">
            Current proof status: {readbackState.evidenceStatus}
          </p>
        </div>
      ) : null}

      <form action={submitHqProofDecisionAction} className="mt-5 space-y-4">
        <input type="hidden" name="evidenceItemId" value={evidenceItem.id} />
        <input type="hidden" name="returnTo" value="/rush-month/review" />

        <label className="block text-sm font-semibold text-white" htmlFor="decision">
          Sharing decision
        </label>
        <select
          id="decision"
          name="decision"
          className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
          defaultValue={defaultInput.decision}
          disabled={!readiness.canSubmit}
        >
          <option value="approved">Approve for later sharing</option>
          <option value="changes_requested">Request better context</option>
          <option value="rejected">Keep private</option>
        </select>

        <label className="block text-sm font-semibold text-white" htmlFor="note">
          Decision note
        </label>
        <textarea
          id="note"
          name="note"
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-white/34 disabled:cursor-not-allowed disabled:text-white/38"
          defaultValue={defaultInput.note}
          disabled={!readiness.canSubmit}
        />

        <button
          type="submit"
          disabled={!readiness.canSubmit}
          className="w-full rounded-full bg-teal-200 px-5 py-3 text-sm font-semibold text-[#06211d] transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/38 sm:w-auto"
        >
          {readiness.canSubmit ? "Save sharing decision" : "Sharing decision unavailable"}
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
