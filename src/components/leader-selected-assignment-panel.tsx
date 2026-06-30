import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import type { LeaderAssignmentRouteSource } from "@/services/leader-assignment-route-href";
import { buildLeaderAssignmentRouteHref } from "@/services/leader-assignment-route-href";
import type { Assignment } from "@/shared/types/domain";

type LeaderSelectedAssignmentPanelProps = {
  assignment: Assignment;
  source?: LeaderAssignmentRouteSource;
};

export function LeaderSelectedAssignmentPanel({
  assignment,
  source,
}: LeaderSelectedAssignmentPanelProps) {
  return (
    <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-[var(--background)] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">Selected assignment</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {assignment.title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Keep review inside the broader role-owned actions lane. This shows
            the owner context, due date, status, and proof requirement without
            dropping this view into the member-owned task surface.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={assignment.status} />
          <span className="rounded-full border border-[var(--mymedlife-primary-button)]/30 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-info)]">
            {assignment.points} points
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SelectedAssignmentStat label="Owner lane" value={assignment.ownerRole} />
        <SelectedAssignmentStat label="Due" value={assignment.dueLabel} />
        <SelectedAssignmentStat label="KPI" value={assignment.kpi} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
          <p className="app-eyebrow app-eyebrow-slate">What needs to happen</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {assignment.instructions}
          </p>
        </article>
        <article className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
          <p className="app-eyebrow app-eyebrow-slate">Proof requirement</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {assignment.evidenceRequired}
          </p>
        </article>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={buildLeaderAssignmentRouteHref(assignment.id, { source })}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
        >
          Keep this assignment in view
        </Link>
        <Link
          href="/rush-month/actions"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:bg-[var(--mymedlife-surface-hover)] hover:text-slate-950"
        >
          Back to all actions
        </Link>
        {(assignment.status === "submitted" || assignment.status === "changes_requested") ? (
          <Link
            href={`/rush-month/review?assignmentId=${assignment.id}`}
            className="rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
          >
            Open proof review
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function SelectedAssignmentStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[1.15rem] border border-slate-200 bg-white p-3">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </article>
  );
}
