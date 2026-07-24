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
  const environmentLabel =
    readiness.environment === "production"
      ? "Production"
      : readiness.environment === "staging"
        ? "Staging"
        : "Local";

  return (
    <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
        {environmentLabel} proof/testimonial submission
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        {readiness.canSubmit
          ? "You can submit this proof for private HQ review."
          : "Proof submission is still safely gated."}
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
          <p className="font-semibold">App-owned readback</p>
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

        <label className="block text-sm font-semibold text-white" htmlFor="proofSummary">
          Testimonial or proof summary
        </label>
        <textarea
          id="proofSummary"
          name="proofSummary"
          className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-white/34 disabled:cursor-not-allowed disabled:text-white/38"
          defaultValue={defaultInput.summary}
          disabled={!readiness.canSubmit}
        />

        <label className="block text-sm font-semibold text-white" htmlFor="proofUrl">
          Optional proof link
        </label>
        <input
          id="proofUrl"
          name="proofUrl"
          className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-white/34 disabled:cursor-not-allowed disabled:text-white/38"
          placeholder="Paste a Drive, Luma, or form link. No file upload happens here."
          disabled={!readiness.canSubmit}
        />

        <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/18 p-4 text-sm leading-6 text-white/72">
          <input
            type="checkbox"
            name="accuracyConfirmed"
            value="yes"
            defaultChecked
            disabled={!readiness.canSubmit}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
          />
          <span>
            I confirmed this proof summary is accurate and safe for private MEDLIFE
            review. Public sharing still stays off.
          </span>
        </label>

        <button
          type="submit"
          disabled={!readiness.canSubmit}
          className="w-full rounded-full bg-sky-200 px-5 py-3 text-sm font-semibold text-[#06211d] transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/38 sm:w-auto"
        >
          {readiness.canSubmit ? "Submit proof" : "Proof submission locked"}
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
