import { submitLeaderProofDecisionAction } from "@/app/rush-month/review/actions";
import {
  getLeaderProofDecisionResultState,
  type LeaderProofDecisionInput,
  type LeaderProofDecisionResultCode,
} from "@/services/leader-proof-decision-result-states";
import {
  getLeaderProofDecisionReadbackState,
  type LeaderProofDecisionWriteReadiness,
} from "@/services/leader-proof-decision-write";
import type { Assignment, EvidenceItem } from "@/shared/types/domain";

type LeaderProofDecisionServerActionPanelProps = {
  assignment: Assignment;
  evidenceItem: EvidenceItem;
  readiness: LeaderProofDecisionWriteReadiness;
  resultCode?: LeaderProofDecisionResultCode;
  defaultInput: LeaderProofDecisionInput;
};

export function LeaderProofDecisionServerActionPanel({
  assignment,
  evidenceItem,
  readiness,
  resultCode,
  defaultInput,
}: LeaderProofDecisionServerActionPanelProps) {
  const resultState = resultCode
    ? getLeaderProofDecisionResultState(resultCode)
    : null;
  const readbackState = getLeaderProofDecisionReadbackState(
    assignment,
    evidenceItem,
    resultCode,
  );

  return (
    <section className="app-surface-info rounded-[2rem] p-5">
      <p className="app-eyebrow app-eyebrow-blue">Chapter decision preview</p>
      <h2 className="app-title mt-2">
        {readiness.canSubmit
          ? "This chapter decision is ready to save in review."
          : "Chapter decisions stay gated for now."}
      </h2>
      <p className="app-copy mt-2">{readiness.reason}</p>

      {resultState ? (
        <div
          className={[
            "mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
            resultState.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : resultState.tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : resultState.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-[#bfdbfe] bg-[#eaf2ff] text-[#2563eb]",
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
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : readbackState.tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-white text-slate-600",
          ].join(" ")}
        >
          <p className="font-semibold">Decision readback</p>
          <p className="mt-1">{readbackState.message}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-75">
            Assignment: {readbackState.assignmentStatus} · Proof:{" "}
            {readbackState.evidenceStatus}
          </p>
        </div>
      ) : null}

      <form action={submitLeaderProofDecisionAction} className="mt-5 space-y-4">
        <input type="hidden" name="assignmentId" value={assignment.id} />
        <input type="hidden" name="evidenceItemId" value={evidenceItem.id} />
        <input type="hidden" name="returnTo" value="/rush-month/review" />

        <label className="block text-sm font-semibold text-slate-950" htmlFor="leaderDecision">
          Leader decision
        </label>
        <select
          id="leaderDecision"
          name="decision"
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-950 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          defaultValue={defaultInput.decision}
          disabled={!readiness.canSubmit}
        >
          <option value="approve">Approve for chapter completion</option>
          <option value="request_changes">Request changes</option>
          <option value="reject">Reject this proof</option>
        </select>

        <label className="block text-sm font-semibold text-slate-950" htmlFor="leaderNote">
          Decision note
        </label>
        <textarea
          id="leaderNote"
          name="note"
          className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          defaultValue={defaultInput.note}
          disabled={!readiness.canSubmit}
        />

        <button
          type="submit"
          disabled={!readiness.canSubmit}
          className="w-full rounded-full bg-[#f7d05e] px-5 py-3 text-sm font-semibold text-[#10223f] transition hover:bg-[#f2c63f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:w-auto"
        >
          {readiness.canSubmit
            ? "Save chapter decision"
            : "Chapter decision unavailable"}
        </button>
      </form>

      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {readiness.checks.map((check) => (
          <div
            key={check.key}
            className="app-surface rounded-[1.05rem] px-3 py-2"
          >
            <p className="app-eyebrow app-eyebrow-slate">
              {check.passed ? "Ready" : "Blocked"}
            </p>
            <p className="mt-1 text-sm text-slate-600">{check.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
