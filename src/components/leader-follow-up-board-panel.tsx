import Link from "next/link";
import type { LeaderFollowUpBoard } from "@/services/leader-follow-up-board";
import { StatusBadge } from "@/components/status-badge";

type LeaderFollowUpBoardPanelProps = {
  board: LeaderFollowUpBoard;
};

export function LeaderFollowUpBoardPanel({ board }: LeaderFollowUpBoardPanelProps) {
  if (!board.canReadBoard) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/70">
            Read-only queue
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{board.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {board.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Rows" value={`${board.counts.total}`} />
          <MiniStat label="Needs help" value={`${board.counts.needsFollowUp}`} />
          <MiniStat label="Reminders" value={`${board.counts.remindersEnabled}`} />
        </div>
      </div>

      {board.rows.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-[#bfdbfe]/40 p-3 text-sm leading-6 text-white/64">
          {board.emptyMessage}
        </p>
      ) : (
        <div className="mt-5 grid gap-3">
          {board.rows.map((row) => (
            <article key={row.assignmentId} className="rounded-2xl bg-[#bfdbfe]/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={row.status} />
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
                      {row.urgency.replaceAll("_", " ")}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">{row.title}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/42">
                    {row.ownerRole} / Due {row.dueLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/66">
                    {row.actionNeeded}
                  </p>
                </div>
                <Link
                  href={row.nextHref}
                  className="shrink-0 rounded-full border border-blue-300/20 bg-blue-300/10 px-4 py-2 text-sm font-semibold text-blue-100"
                >
                  Open next step
                </Link>
              </div>
              <p className="mt-3 rounded-2xl border border-white/10 bg-[#0b66cc]/70 p-3 text-xs leading-5 text-white/54">
                Reminder send posture: {row.reminderPosture}. No email, SMS, n8n,
                HubSpot, or Luma automation is triggered.
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#bfdbfe]/40 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
