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
  returnTo?: "/rush-month/review" | "/admin/hq-proof-write";
};

export function HqProofDecisionServerActionPanel({
  evidenceItem,
  readiness,
  resultCode,
  defaultInput,
  returnTo = "/rush-month/review",
}: HqProofDecisionServerActionPanelProps) {
  const resultState = resultCode ? getHqProofDecisionResultState(resultCode) : null;
  const readbackState = getHqProofDecisionReadbackState(evidenceItem, resultCode);
  const decisionId = `decision-${evidenceItem.id}`;
  const noteId = `note-${evidenceItem.id}`;

  return (
    <section className="rounded-[2rem] border border-teal-300/20 bg-teal-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100">
        HQ proof decision
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        {readiness.canSubmit
          ? "HQ can record this local proof decision."
          : "HQ proof decisions are still safely gated."}
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
          <p className="font-semibold">Local readback</p>
          <p className="mt-1">{readbackState.message}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-75">
            Current proof status: {readbackState.evidenceStatus}
          </p>
        </div>
      ) : null}

      <div className="mt-3 rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-sm leading-6 text-white/68">
        <p className="font-semibold text-white">Privacy boundary</p>
        <p className="mt-1">{getPrivateUploadBoundaryMessage(evidenceItem)}</p>
      </div>

      <form action={submitHqProofDecisionAction} className="mt-5 space-y-4">
        <input type="hidden" name="evidenceItemId" value={evidenceItem.id} />
        <input type="hidden" name="returnTo" value={returnTo} />

        <label className="block text-sm font-semibold text-white" htmlFor={decisionId}>
          HQ decision
        </label>
        <select
          id={decisionId}
          name="decision"
          className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
          defaultValue={defaultInput.decision}
          disabled={!readiness.canSubmit}
        >
          <option value="approved">Approve for member story feed</option>
          <option value="changes_requested">Request better context</option>
          <option value="rejected">Do not share broadly</option>
        </select>

        <label className="block text-sm font-semibold text-white" htmlFor={noteId}>
          Decision note
        </label>
        <textarea
          id={noteId}
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
          {readiness.canSubmit ? "Save HQ decision" : "HQ decision locked"}
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

function getPrivateUploadBoundaryMessage(evidenceItem: EvidenceItem): string {
  if (evidenceItem.storagePath) {
    return "A private upload is attached to this proof. HQ is deciding future sharing posture only; the raw file stays private and this route must not create a public URL.";
  }

  if (supportsPrivateUpload(evidenceItem.evidenceType)) {
    return "No private raw file is attached yet. HQ can still request better context or keep the proof internal, but this route must not assume the proof is public-ready.";
  }

  return "This proof can be reviewed from its text or link context alone. Keep student identity and reuse posture separate from any future publishing decision.";
}

function supportsPrivateUpload(evidenceType: EvidenceItem["evidenceType"]): boolean {
  switch (evidenceType) {
    case "bridge_video":
    case "event_photo":
    case "attendance_log":
    case "feedback_form":
    case "tracker_screenshot":
    case "planning_doc":
    case "mock_file":
      return true;
    case "text":
    case "link":
    case "testimonial_text":
    case "recap_note":
    case "external_link":
      return false;
  }
}
