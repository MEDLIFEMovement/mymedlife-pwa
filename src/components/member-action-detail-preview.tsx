"use client";

import { useState } from "react";

type MemberActionDetailPreviewProps = {
  assignment: {
    title: string;
    evidenceRequired: string;
    points: number;
  };
  actionDetailHref?: string;
  editHref?: string;
  queueHref?: string;
  mode?: "submit" | "submitted";
  sectionId?: string;
  submittedHref?: string;
};

type MemberEvidenceType = "screenshot" | "link" | "text";

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
  actionDetailHref = "#",
  editHref = "#submit-evidence",
  queueHref = "/rush-month/evidence",
  mode = "submit",
  sectionId = "submit-evidence",
  submittedHref = "#submit-evidence",
}: MemberActionDetailPreviewProps) {
  const defaultDraft = createDefaultMemberActionPreviewDraft(assignment);
  const [evidenceType, setEvidenceType] = useState<MemberEvidenceType>("screenshot");
  const [draft, setDraft] = useState(defaultDraft);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const previewState = getMemberActionPreviewState(draft, isConfirmed, null);
  const { canSubmit } = previewState;

  return (
    <section id={sectionId} className="grid gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(180deg,#2455a4_0%,#2a5fb5_48%,#21457d_100%)] p-4 shadow-[0_24px_80px_rgba(2,14,38,0.28)]">
        {mode === "submitted" ? (
          <>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
              Confirmation
            </p>
            <h2 className="mt-2 text-[1.95rem] font-semibold leading-tight text-white sm:text-[2.2rem]">
              Submitted for Review
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/82">
              Your evidence is queued for chapter review. Keep the proof tied to
              this exact assignment while approval, points, and broader sharing
              stay mock-safe.
            </p>
          </>
        ) : (
          <>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
              Submit
            </p>
            <h2 className="mt-2 text-[1.95rem] font-semibold leading-tight text-white sm:text-[2.2rem]">
              Submit Evidence
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/82">
              Share one clear screenshot, link, or short note. Keep it specific
              enough that a leader can review it quickly.
            </p>
          </>
        )}

        <div className="mt-4 rounded-[1.45rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f7d05e]">
            {mode === "submitted" ? "Submitted for" : "Submitting for"}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">{assignment.title}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold text-white/82">
              {mode === "submitted" ? "Pending leader review" : "Proof handoff"}
            </span>
            <span className="rounded-full border border-[#f7d05e]/28 bg-[#f7d05e]/12 px-3 py-1 text-xs font-semibold text-[#fde68a]">
              {assignment.points} pts if approved
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/78">
            {assignment.evidenceRequired}
          </p>
        </div>
      </section>

      {mode === "submitted" ? (
        <section className="app-surface rounded-[2rem] p-4">
          <article
            aria-live="polite"
            className="rounded-[1.4rem] border border-[#bfdbfe] bg-[#eff6ff] p-4"
            role="status"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              Confirmation
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">
              Submitted for review
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The assignment now reads like a pending-review state on this same
              route. Review stays with chapter leaders first, and points move
              only after approval.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={editHref}
                className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#5d8ff6]/30 hover:bg-slate-50"
              >
                Edit evidence
              </a>
              <a
                href={queueHref}
                className="inline-flex rounded-full bg-[#2b5fb4] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2455a4]"
              >
                See your proof queue
              </a>
              <a
                href={actionDetailHref}
                className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#5d8ff6]/30 hover:bg-slate-50"
              >
                Back to action details
              </a>
            </div>
          </article>
        </section>
      ) : (
        <section className="app-surface rounded-[2rem] p-4">
        <form className="grid gap-3.5" method="get" action={submittedHref}>
        <div>
          <label className="text-sm font-semibold text-slate-950" htmlFor="member-proof-type">
            Evidence type
          </label>
          <div
            aria-label="Evidence type"
            className="mt-2 grid grid-cols-3 gap-2 rounded-[1.25rem] border border-slate-200 bg-white p-1"
            id="member-proof-type"
            role="tablist"
          >
            {[
              { value: "screenshot", label: "Screenshot" },
              { value: "link", label: "Link" },
              { value: "text", label: "Text" },
            ].map((option) => {
              const isActive = evidenceType === option.value;

              return (
                <button
                  key={option.value}
                  aria-selected={isActive}
                  className={[
                    "rounded-full px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-[#2b5fb4] text-white"
                      : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                  onClick={() => setEvidenceType(option.value as MemberEvidenceType)}
                  role="tab"
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {evidenceType === "screenshot" ? (
          <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-[#f8fbff] px-4 py-4 text-center">
            <p className="text-sm font-semibold text-slate-950">Tap to upload screenshot</p>
            <p className="mt-2 text-sm text-slate-500">JPG, PNG up to 10MB</p>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Add one short note below so the screenshot still tells a clear
              proof story.
            </p>
            <button
              className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              type="button"
            >
              Upload screenshot
            </button>
          </div>
        ) : null}

        <div>
          <label
            className="text-sm font-semibold text-slate-950"
            htmlFor="member-proof-preview"
          >
            {evidenceType === "link" ? "Paste proof link" : "What should the reviewer know?"}
          </label>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {evidenceType === "link"
              ? "One clean link is enough if it clearly proves the action."
              : "Write a short note that explains the action clearly enough for a leader to review."}
          </p>
          <div className="mt-2 rounded-[1.15rem] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-700">
            <span className="font-semibold text-slate-950">Evidence requirement:</span>{" "}
            {assignment.evidenceRequired}
          </div>
          {evidenceType === "link" ? (
            <input
              id="member-proof-preview"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#5d8ff6]/40"
              placeholder="Paste the RSVP confirmation or proof link."
              type="url"
            />
          ) : (
            <textarea
              id="member-proof-preview"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-[1.25rem] border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#5d8ff6]/40"
              placeholder={
                evidenceType === "screenshot"
                  ? "Example: Screenshot shows two friends RSVP'd after I texted them the GBM link."
                  : "Write a short proof note."
              }
            />
          )}
        </div>

        <label className="flex items-start gap-3 rounded-[1.35rem] border border-amber-200 bg-[#fff8df] p-4 text-sm leading-6 text-slate-700">
          <input
            checked={isConfirmed}
            onChange={(event) => setIsConfirmed(event.target.checked)}
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 bg-white text-[#f7d05e] focus:ring-[#f7d05e]"
          />
          <span>
            I confirm this evidence is accurate and okay to share with chapter
            leaders and coaches.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              canSubmit
                ? "bg-[#2b5fb4] text-white hover:bg-[#2455a4]"
                : "cursor-not-allowed bg-slate-200 text-slate-400",
            ].join(" ")}
          >
            Submit for review
          </button>
          <p className="text-xs leading-5 text-slate-500">
            This action is still worth{" "}
            <span className="font-semibold text-[#a16207]">{assignment.points} points</span>{" "}
            after review. Points move once the proof is approved.
          </p>
        </div>
        </form>
        </section>
      )}
    </section>
  );
}
