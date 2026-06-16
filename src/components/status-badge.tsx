import { statusClassName, statusLabel, type DisplayStatus } from "@/lib/rush-month";

type StatusBadgeProps = {
  status: DisplayStatus;
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
