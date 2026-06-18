"use client";

import { useState } from "react";

type MemberActionDetailPreviewProps = {
  assignment: {
    title: string;
    evidenceRequired: string;
    points: number;
  };
};

type MemberActionPreviewState = {
  canSubmit: boolean;
  hasConfirmation: boolean;
};

export function createDefaultMemberActionPreviewDraft(
  assignment: MemberActionDetailPreviewProps["assignment"],
) {
  return `Invited students for "${assignment.title}" and saved proof that answers: ${assignment.evidenceRequired}`;
}

export function getMemberActionPreviewState(
  draft: string,
  isConfirmed: boolean,
  submittedDraft: string | null,
): MemberActionPreviewState {
  return {
    canSubmit: draft.trim().length >= 16 && isConfirmed,
    hasConfirmation: submittedDraft !== null,
  };
}

export function MemberActionDetailPreview({
  assignment,
}: MemberActionDetailPreviewProps) {
  const defaultDraft = createDefaultMemberActionPreviewDraft(assignment);
  const [draft, setDraft] = useState(defaultDraft);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [submittedDraft, setSubmittedDraft] = useState<string | null>(null);

  const previewState = getMemberActionPreviewState(draft, isConfirmed, submittedDraft);
  const { canSubmit } = previewState;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setSubmittedDraft(draft.trim());
  }

  return (
    <section className="rounded-[2rem] border border-[#f7d05e]/24 bg-[#f7d05e]/12 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f7d05e]">
        Submit preview
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        Share what happened
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/72">
        This local form previews the student proof flow without saving a record,
        changing points, or sending anything out of the app.
      </p>

      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        <div className="rounded-[1.25rem] border border-white/10 bg-[#081d46]/55 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            Evidence requirement
          </p>
          <p className="mt-2 text-sm leading-6 text-white">
            {assignment.evidenceRequired}
          </p>
        </div>

        <div>
          <label
            className="text-sm font-semibold text-white"
            htmlFor="member-proof-preview"
          >
            Evidence link or note
          </label>
          <textarea
            id="member-proof-preview"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="mt-2 min-h-32 w-full rounded-[1.25rem] border border-white/12 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-white/34 focus:border-[#5d8ff6]/40"
            placeholder="Paste a message screenshot link, RSVP link, or short proof note."
          />
        </div>

        <label className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/78">
          <input
            checked={isConfirmed}
            onChange={(event) => setIsConfirmed(event.target.checked)}
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-white/20 bg-black/20 text-[#f7d05e] focus:ring-[#f7d05e]"
          />
          <span>
            I confirm this proof is accurate, belongs to this action, and is okay
            to review locally before any real save or sharing path is approved.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              canSubmit
                ? "bg-[#f7d05e] text-[#08224c] hover:bg-[#f9dc7e]"
                : "cursor-not-allowed bg-white/12 text-white/40",
            ].join(" ")}
          >
            Preview submit
          </button>
          <p className="text-xs leading-5 text-white/54">
            Local confirmation only. This action is still worth{" "}
            <span className="font-semibold text-[#f7d05e]">{assignment.points} points</span>{" "}
            after review, but no points update happens here.
          </p>
        </div>
      </form>

      {previewState.hasConfirmation ? (
        <article
          aria-live="polite"
          className="mt-4 rounded-[1.4rem] border border-[#5d8ff6]/24 bg-[#0b2a5d]/72 p-4"
          role="status"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c9dcff]">
            Confirmation
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Local proof preview captured
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/74">
            No proof row, points change, reminder, or automation send happened.
            This confirmation is only here to show the student flow.
          </p>
          <div className="mt-3 rounded-[1.1rem] border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/82">
            {submittedDraft}
          </div>
          <button
            type="button"
            onClick={() => setSubmittedDraft(null)}
            className="mt-3 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#5d8ff6]/30 hover:bg-white/[0.1]"
          >
            Edit preview
          </button>
        </article>
      ) : null}
    </section>
  );
}
