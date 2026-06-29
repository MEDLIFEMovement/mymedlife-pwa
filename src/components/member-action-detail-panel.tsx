import Link from "next/link";

import type { MemberActionDetailWorkspace } from "@/services/member-action-detail-workspace";

type MemberActionDetailSourceContext = {
  eyebrow: string;
  detail: string;
  href: string;
  backLabel: string;
};

type MemberActionDetailPanelProps = {
  workspace: MemberActionDetailWorkspace;
  actionHref?: string;
  actionLabel?: string;
  sourceContext?: MemberActionDetailSourceContext | null;
};

export function MemberActionDetailPanel({
  workspace,
  actionHref,
  actionLabel,
  sourceContext = null,
}: MemberActionDetailPanelProps) {
  return (
    <section className="grid gap-3">
      <section className="app-surface-info overflow-hidden rounded-[2rem] p-4">
        <p
          aria-level={2}
          className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]"
          role="heading"
        >
          Action Detail
        </p>
        <h1 className="mt-3 text-[2rem] font-semibold leading-tight text-slate-950 sm:text-[2.35rem]">
          {workspace.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {workspace.campaignLabel}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {workspace.statusLabel}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">{workspace.dueLabel}</p>
        <p className="mt-2 text-sm text-slate-600">{workspace.assignedByLabel}</p>
        <p className="mt-3 text-sm font-semibold text-[var(--mymedlife-primary-button)]">
          {workspace.pointsApprovalLabel}
        </p>
        <p className="mt-2 text-sm text-slate-600">{workspace.appliesToLabel}</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <ActionDetailMetaTile
            label="Due"
            value={workspace.dueLabel}
            note="This is the current local deadline"
          />
          <ActionDetailMetaTile
            label="Owner"
            value={workspace.assignedByLabel.replace("Assigned by ", "")}
            note="Who set the work in motion"
          />
          <ActionDetailMetaTile
            label="Points"
            value={workspace.pointsApprovalLabel}
            note="Recognition after the proof is approved"
          />
          <ActionDetailMetaTile
            label="Scope"
            value="Rush Month"
            note={workspace.appliesToLabel}
          />
        </div>

        <div className="mt-4 rounded-[1.3rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgb(var(--mymedlife-shadow-rgb)/0.05)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Action loop
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Start the action, capture proof, and submit it when the chapter
                story is ready to be reviewed.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionLoopPill label="Start" tone="active" />
              <ActionLoopPill label="Proof" tone="idle" />
              <ActionLoopPill label="Submit" tone="idle" />
            </div>
          </div>
        </div>

        {sourceContext ? (
          <div className="mt-4 rounded-[1.3rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgb(var(--mymedlife-shadow-rgb)/0.05)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {sourceContext.eyebrow}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {sourceContext.detail}
                </p>
              </div>
              <Link
                href={sourceContext.href}
                className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
              >
                {sourceContext.backLabel}
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <section className="app-surface rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">{workspace.whyItMattersTitle}</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <p className="text-sm leading-7 text-slate-700">{workspace.whyItMattersBody}</p>
          <div className="rounded-[1.25rem] border border-[var(--mymedlife-border)] bg-[var(--background)] px-4 py-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-info)]">
              Evidence preview
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {workspace.previewAssignment.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {workspace.previewAssignment.evidenceRequired}
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--mymedlife-info)]">
              {workspace.previewAssignment.points} points if approved
            </p>
          </div>
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">{workspace.stepsTitle}</p>
        <div className="mt-3 grid gap-2.5">
          {workspace.steps.map((step, index) => (
            <article
              key={`${index + 1}-${step}`}
              className="rounded-[1.35rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] p-3.5 shadow-[0_8px_24px_rgb(var(--mymedlife-shadow-rgb)/0.04)]"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--mymedlife-border)] bg-white text-sm font-semibold text-[var(--mymedlife-primary-button)]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{step}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">{workspace.evidenceTitle}</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-2.5">
            {workspace.evidenceItems.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.35rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] p-3.5 shadow-[0_8px_24px_rgb(var(--mymedlife-shadow-rgb)/0.04)]"
              >
                <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
          <div className="rounded-[1.35rem] border border-[var(--mymedlife-border)] bg-[var(--background)] p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-info)]">
              Submission path
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the member submit route so the proof story stays legible before it
              moves into leader review.
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-950">{workspace.helperLabel}</p>
            <Link
              href={actionHref ?? workspace.submitEvidenceHref}
              className="mt-4 inline-flex rounded-full bg-[var(--mymedlife-action-blue)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-action-blue-hover)]"
            >
              {actionLabel ?? workspace.submitEvidenceLabel}
            </Link>
          </div>
        </div>
      </section>
    </section>
  );
}

function ActionDetailMetaTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-[1.15rem] border border-slate-200 bg-white px-3.5 py-3 shadow-[0_8px_24px_rgb(var(--mymedlife-shadow-rgb)/0.05)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{note}</p>
    </article>
  );
}

function ActionLoopPill({
  label,
  tone,
}: {
  label: string;
  tone: "active" | "idle";
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1.5 text-xs font-semibold",
        tone === "active"
          ? "border border-[var(--mymedlife-primary-button)]/40 bg-[var(--mymedlife-badge-background)] text-[var(--mymedlife-info)]"
          : "border border-slate-200 bg-white text-slate-600",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
