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

type SummaryCardProps = {
  label: string;
  value: string;
  detail: string;
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
      <section className="overflow-hidden rounded-[2rem] border border-[var(--mymedlife-border)] bg-[linear-gradient(180deg,var(--mymedlife-nav-text)_0%,var(--background)_52%,var(--mymedlife-surface-hover)_100%)] p-4 shadow-[0_18px_52px_rgb(var(--mymedlife-shadow-rgb)/0.07)]">
        <div className="grid gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
              {mode === "submitted" ? "Confirmation" : "Submit"}
            </p>
            <h2 className="mt-2 text-[1.95rem] font-semibold leading-tight text-slate-950 sm:text-[2.2rem]">
              {mode === "submitted" ? "Submitted for Review" : "Submit Evidence"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {mode === "submitted"
                ? "Your evidence is queued for chapter review. Keep the proof tied to this exact assignment while approval, points, and broader sharing stay mock-safe."
                : "Share one clear screenshot, link, or short note. Keep it specific enough that a leader can review it quickly."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              detail={mode === "submitted" ? "Waiting on chapter review" : "Ready when your proof is specific"}
              label="Review state"
              value={mode === "submitted" ? "Pending" : "Draft"}
            />
            <SummaryCard
              detail="Points move after approval"
              label="Reward"
              value={`${assignment.points} pts`}
            />
            <SummaryCard
              detail={assignment.evidenceRequired}
              label="Evidence"
              value="Accepted proof"
            />
          </div>

          <div className="rounded-[1.45rem] border border-[var(--mymedlife-border)] bg-white p-4 shadow-[0_8px_24px_rgb(var(--mymedlife-shadow-rgb)/0.05)]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
              {mode === "submitted" ? "Submitted for" : "Submitting for"}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">{assignment.title}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-[var(--background)] px-3 py-1 text-xs font-semibold text-slate-600">
                {mode === "submitted" ? "Pending leader review" : "Proof handoff"}
              </span>
              <span className="rounded-full border border-[var(--mymedlife-primary-button)]/28 bg-[var(--mymedlife-primary-button)]/12 px-3 py-1 text-xs font-semibold text-[var(--mymedlife-primary-button)]">
                {assignment.points} pts if approved
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {assignment.evidenceRequired}
            </p>
          </div>
        </div>
      </section>

      {mode === "submitted" ? (
        <section className="app-surface rounded-[2rem] p-4">
          <article
            aria-live="polite"
            className="grid gap-4 rounded-[1.4rem] border border-[var(--mymedlife-border)] bg-[var(--background)] p-4"
            role="status"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
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
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <SummaryCard
                detail="Chapter leaders see this in their review queue"
                label="Next stop"
                value="Leader review"
              />
              <SummaryCard
                detail="Use this when you need to refine the proof"
                label="Edit path"
                value="Edit evidence"
              />
              <SummaryCard
                detail="Return to the assignment detail if you want to double-check the task"
                label="Route"
                value="Back to action"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={editHref}
                className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)]/30 hover:bg-[var(--mymedlife-badge-background)]"
              >
                Edit evidence
              </a>
              <a
                href={queueHref}
                className="inline-flex rounded-full bg-[var(--mymedlife-action-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-action-blue-hover)]"
              >
                See your proof queue
              </a>
              <a
                href={actionDetailHref}
                className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)]/30 hover:bg-[var(--mymedlife-badge-background)]"
              >
                Back to action details
              </a>
            </div>
          </article>
        </section>
      ) : (
        <section className="app-surface rounded-[2rem] p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
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
                            ? "bg-[var(--mymedlife-action-blue)] text-white"
                            : "bg-transparent text-slate-500 hover:bg-[var(--mymedlife-badge-background)] hover:text-slate-900",
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
                <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-[var(--background)] px-4 py-4 text-center">
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
                <div className="mt-2 rounded-[1.15rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] px-3 py-2.5 text-sm leading-6 text-slate-700">
                  <span className="font-semibold text-slate-950">Evidence requirement:</span>{" "}
                  {assignment.evidenceRequired}
                </div>
                {evidenceType === "link" ? (
                  <input
                    id="member-proof-preview"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--accent)]/40"
                    placeholder="Paste the RSVP confirmation or proof link."
                    type="url"
                  />
                ) : (
                  <textarea
                    id="member-proof-preview"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="mt-2 min-h-24 w-full rounded-[1.25rem] border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--accent)]/40"
                    placeholder={
                      evidenceType === "screenshot"
                        ? "Example: Screenshot shows two friends RSVP'd after I texted them the GBM link."
                        : "Write a short proof note."
                    }
                  />
                )}
              </div>

              <label className="flex items-start gap-3 rounded-[1.35rem] border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] p-4 text-sm leading-6 text-slate-700">
                <input
                  checked={isConfirmed}
                  onChange={(event) => setIsConfirmed(event.target.checked)}
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 bg-white text-[var(--mymedlife-primary-button)] focus:ring-[var(--mymedlife-primary-button)]"
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
                      ? "bg-[var(--mymedlife-action-blue)] text-white hover:bg-[var(--mymedlife-action-blue-hover)]"
                      : "cursor-not-allowed bg-[var(--background)] text-slate-400",
                  ].join(" ")}
                >
                  Submit for review
                </button>
                <p className="text-xs leading-5 text-slate-500">
                  This action is still worth{" "}
                  <span className="font-semibold text-[var(--mymedlife-info)]">{assignment.points} points</span>{" "}
                  after review. Points move once the proof is approved.
                </p>
              </div>
            </form>

            <aside className="grid gap-3 self-start rounded-[1.5rem] border border-slate-200 bg-[var(--background)] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-action-blue-hover)]">
                Review preview
              </p>
              <h3 className="text-lg font-semibold text-slate-950">What the leader sees</h3>
              <p className="text-sm leading-6 text-slate-600">
                Keep the evidence tied to this assignment so the review queue stays easy
                to scan and the points story stays obvious.
              </p>
              <div className="grid gap-2.5">
                <SummaryCard
                  detail="The assignment name stays attached to the proof"
                  label="Assignment"
                  value={assignment.title}
                />
                <SummaryCard
                  detail="Proof is routed to chapter review first"
                  label="Queue"
                  value="Leader review"
                />
                <SummaryCard
                  detail="Only approved proof advances the leaderboard"
                  label="Outcome"
                  value={`${assignment.points} pts`}
                />
              </div>
            </aside>
          </div>
        </section>
      )}
    </section>
  );
}

function SummaryCard({ label, value, detail }: SummaryCardProps) {
  return (
    <article className="rounded-[1.35rem] border border-white/12 bg-white/10 p-3.5 text-white shadow-[0_14px_40px_rgb(var(--mymedlife-deep-rgb)/0.12)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/65">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-5 text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/72">{detail}</p>
    </article>
  );
}
