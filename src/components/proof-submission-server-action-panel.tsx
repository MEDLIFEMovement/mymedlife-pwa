import { submitAssignmentProofAction } from "@/app/rush-month/actions/[assignmentId]/actions";
import {
  getProofSubmissionResultState,
  type ProofSubmissionResultCode,
} from "@/services/proof-submission-result-states";
import {
  getProofSubmissionReadbackState,
  type ProofSubmissionWriteReadiness,
} from "@/services/proof-submission-write";
import type { ProofSubmissionInput } from "@/services/local-action-contracts";
import type { Assignment } from "@/shared/types/domain";

type ProofSubmissionServerActionPanelProps = {
  assignment: Assignment;
  readiness: ProofSubmissionWriteReadiness;
  resultCode?: ProofSubmissionResultCode;
  defaultInput: ProofSubmissionInput;
};

export function ProofSubmissionServerActionPanel({
  assignment,
  readiness,
  resultCode,
  defaultInput,
}: ProofSubmissionServerActionPanelProps) {
  const resultState = resultCode ? getProofSubmissionResultState(resultCode) : null;
  const readbackState = getProofSubmissionReadbackState(assignment, resultCode);

  return (
    <section className="app-surface-info rounded-[2rem] p-5">
      <p className="app-eyebrow app-eyebrow-blue">
        Proof submission preview
      </p>
      <h2 className="app-title mt-2">
        {readiness.canSubmit
          ? "This proof is ready to send into internal review."
          : "Proof submission still stays gated."}
      </h2>
      <p className="app-copy mt-2">{readiness.reason}</p>

      {resultState ? (
        <div
          className={[
            "mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
            resultState.tone === "success"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : resultState.tone === "warning"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : resultState.tone === "error"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
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
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : readbackState.tone === "warning"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600",
          ].join(" ")}
        >
          <p className="font-semibold">Preview readback</p>
          <p className="mt-1">{readbackState.message}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-75">
            Current assignment status: {readbackState.assignmentStatus}
          </p>
        </div>
      ) : null}

      <form action={submitAssignmentProofAction} className="mt-5 space-y-4">
        <input type="hidden" name="assignmentId" value={assignment.id} />
        <input
          type="hidden"
          name="returnTo"
          value={`/rush-month/actions/${assignment.id}`}
        />
        <input type="hidden" name="evidenceType" value={defaultInput.evidenceType} />

        <label className="block text-sm font-semibold text-slate-950" htmlFor="proofSummary">
          Proof story summary
        </label>
        <textarea
          id="proofSummary"
          name="proofSummary"
          className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-[#eff6ff] disabled:text-slate-400"
          defaultValue={defaultInput.summary}
          disabled={!readiness.canSubmit}
        />

        <label className="block text-sm font-semibold text-slate-950" htmlFor="proofUrl">
          Optional supporting link
        </label>
        <input
          id="proofUrl"
          name="proofUrl"
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-[#eff6ff] disabled:text-slate-400"
          placeholder="Paste a Drive, Luma, or form link. No file upload happens here."
          disabled={!readiness.canSubmit}
        />

        <button
          type="submit"
          disabled={!readiness.canSubmit}
          className="w-full rounded-full bg-[#2563eb] px-5 py-3 text-sm font-semibold text-[#10223f] transition hover:bg-[#93c5fd] disabled:cursor-not-allowed disabled:bg-[#f8fbff] disabled:text-slate-400 sm:w-auto"
        >
          {readiness.canSubmit ? "Send proof to review" : "Proof submission unavailable"}
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
