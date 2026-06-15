import { statusClassName, statusLabel } from "@/lib/rush-month";
import type { AssignmentStatus } from "@/shared/types/domain";

type StatusBadgeProps = {
  status: AssignmentStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}
