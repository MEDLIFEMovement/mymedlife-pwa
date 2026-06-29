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
  returnToHref?: string;
};

export function ProofSubmissionServerActionPanel({
  assignment,
  readiness,
  resultCode,
  defaultInput,
  returnToHref,
}: ProofSubmissionServerActionPanelProps) {
  const resultState = resultCode ? getProofSubmissionResultState(resultCode) : null;
  const readbackState = getProofSubmissionReadbackState(assignment, resultCode);
  const confirmsSubmitted = readbackState?.confirmsSubmitted ?? false;
  const title = confirmsSubmitted
    ? "Proof submitted and recorded."
    : readiness.canSubmit
      ? "Submit this proof now."
      : "Proof submission is still safely gated.";
  const detail = confirmsSubmitted
    ? "This assignment is waiting for chapter leader review. Uploads, public sharing, and external sends still stay off."
    : readiness.reason;
  const buttonLabel = confirmsSubmitted
    ? "Proof already submitted"
    : "Submit for leader review";
  const buttonDisabled = confirmsSubmitted || !readiness.canSubmit;

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
          <p className="font-semibold">Proof readback</p>
          <p className="mt-1">{readbackState.message}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
            Current assignment status: {readbackState.assignmentStatus}
          </p>
        </div>
      ) : null}

      <form action={submitAssignmentProofAction} className="mt-5 space-y-4">
        <input type="hidden" name="assignmentId" value={assignment.id} />
        <input
          type="hidden"
          name="returnTo"
          value={returnToHref ?? `/rush-month/actions/${assignment.id}`}
        />
        <input type="hidden" name="evidenceType" value={defaultInput.evidenceType} />

        <label className="block text-sm font-semibold text-slate-950" htmlFor="proofSummary">
          Proof story summary
        </label>
        <textarea
          id="proofSummary"
          name="proofSummary"
          className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-[var(--background)] disabled:text-slate-400"
          defaultValue={defaultInput.summary}
          disabled={buttonDisabled}
        />

        <label className="block text-sm font-semibold text-slate-950" htmlFor="proofUrl">
          Optional supporting link
        </label>
        <input
          id="proofUrl"
          name="proofUrl"
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-[var(--background)] disabled:text-slate-400"
          placeholder="Paste a Drive, Luma, or form link. No file upload happens here."
          disabled={buttonDisabled}
        />

        <label className="flex items-start gap-3 rounded-[1.15rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="confirmAccuracy"
            value="true"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--mymedlife-action-blue)] focus:ring-[var(--mymedlife-action-blue)]"
            disabled={buttonDisabled}
            required={!buttonDisabled}
          />
          <span>
            I confirm this proof is accurate, consent-safe, and tied to this assignment.
          </span>
        </label>

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
