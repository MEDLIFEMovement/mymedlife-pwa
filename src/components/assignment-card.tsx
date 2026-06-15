import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import type { Assignment } from "@/shared/types/domain";

type AssignmentCardProps = {
  assignment: Assignment;
};

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/70">
            {assignment.lane} lane
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{assignment.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/66">{assignment.instructions}</p>
        </div>
        <StatusBadge status={assignment.status} />
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <dt className="text-white/44">Owner</dt>
          <dd className="mt-1 text-white">{assignment.ownerRole}</dd>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <dt className="text-white/44">Evidence needed</dt>
          <dd className="mt-1 text-white">{assignment.evidenceRequired}</dd>
        </div>
      </dl>

      <Link
        href={`/rush-month/actions/${assignment.id}`}
        className="mt-4 inline-flex rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
      >
        Open action
      </Link>
    </article>
  );
}
