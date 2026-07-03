import { statusClassName, statusLabel, type DisplayStatus } from "@/lib/rush-month";

type StatusBadgeProps = {
  status: DisplayStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-7 items-center whitespace-nowrap rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${statusClassName(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}
