import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import {
  type MemberActionRouteSource,
  buildMemberActionRouteHref,
} from "@/services/member-action-route-href";
import type { Assignment } from "@/shared/types/domain";

type AssignmentCardProps = {
  assignment: Assignment;
  actionHref?: string;
  source?: MemberActionRouteSource;
};

export function AssignmentCard({
  assignment,
  actionHref,
  source,
}: AssignmentCardProps) {
  return (
    <article className="app-surface rounded-[1.8rem] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
              {assignment.lane} lane
            </span>
            <span className="rounded-full border border-[#f7d05e]/30 bg-[#fff8df] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#a16207]">
              {assignment.points} points
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{assignment.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{assignment.instructions}</p>
        </div>
        <StatusBadge status={assignment.status} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div className="app-surface-soft rounded-[1.15rem] p-3">
          <dt className="app-eyebrow app-eyebrow-slate">Due date</dt>
          <dd className="mt-2 text-sm font-semibold text-slate-950">{assignment.dueLabel}</dd>
        </div>
        <div className="app-surface-soft rounded-[1.15rem] p-3">
          <dt className="app-eyebrow app-eyebrow-slate">Assigned lane</dt>
          <dd className="mt-2 text-sm font-semibold text-slate-950">{assignment.ownerRole}</dd>
        </div>
        <div className="app-surface-soft rounded-[1.15rem] p-3 sm:col-span-2">
          <dt className="app-eyebrow app-eyebrow-slate">Evidence needed</dt>
          <dd className="mt-2 text-sm leading-6 text-slate-700">{assignment.evidenceRequired}</dd>
        </div>
      </dl>

      <Link
        href={actionHref ?? buildMemberActionRouteHref(assignment.id, { source })}
        className="mt-4 inline-flex rounded-full bg-[#f7d05e] px-4 py-2 text-sm font-semibold text-[#08224c]"
      >
        Open action
      </Link>
    </article>
  );
}
