import type {
  LeaderEvidenceFollowUpBoard,
  LeaderEvidenceFollowUpRow,
  LeaderEvidenceFollowUpTone,
} from "@/services/leader-evidence-follow-up";

type LeaderEvidenceFollowUpBoardPanelProps = {
  board: LeaderEvidenceFollowUpBoard;
};

export function LeaderEvidenceFollowUpBoardPanel({
  board,
}: LeaderEvidenceFollowUpBoardPanelProps) {
  if (!board.canReadBoard) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
            Chapter follow-up
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{board.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
            {board.summary}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Follow-up" value={`${board.counts.memberFollowUp}`} />
          <MiniStat label="HQ review" value={`${board.counts.hqReview}`} />
          <MiniStat label="Not ready" value={`${board.counts.notReady}`} />
          <MiniStat label="Publishes" value={`${board.counts.externalExportsEnabled}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {board.rows.map((row) => (
          <FollowUpCard key={row.id} row={row} />
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <FollowUpList
          title="Future structured records"
          items={board.futureStructuredEvents}
        />
        <FollowUpList
          title="Disabled outbox destinations"
          items={board.disabledOutboxDestinations}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
        <p className="text-sm font-semibold text-amber-100">
          Leaders can follow up; HQ controls sharing
        </p>
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-amber-50/72">
          {board.safetyNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FollowUpCard({ row }: { row: LeaderEvidenceFollowUpRow }) {
  return (
    <article className={`rounded-2xl border bg-black/20 p-4 ${toneBorder(row.tone)}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tonePill(row.tone)}`}>
              {row.statusLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/58">
              {row.ownerLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/58">
              Due {row.dueLabel}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">
            {row.assignmentTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/66">
            {row.plainEnglishStatus}
          </p>
        </div>
        <span className="w-fit rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/62">
          External: {row.externalPosture}
        </span>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-3">
        <FollowUpFact title="Leader next step" body={row.leaderNextStep} />
        <FollowUpFact title="HQ boundary" body={row.hqBoundary} />
        <FollowUpFact title="Proof context" body={row.evidenceSummary} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/54">
        <span className="rounded-full border border-white/10 bg-[#071d1a]/70 px-3 py-1">
          Proof type: {row.proofTypeLabel}
        </span>
        <span className="rounded-full border border-white/10 bg-[#071d1a]/70 px-3 py-1">
          Leader nudge: {row.canLeaderNudge ? "future only" : "not available"}
        </span>
        <span className="rounded-full border border-white/10 bg-[#071d1a]/70 px-3 py-1">
          HQ decision: {row.canHqDecide ? "future only" : "restricted"}
        </span>
      </div>
    </article>
  );
}

function FollowUpFact({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/66">{body}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function FollowUpList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/64"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function toneBorder(tone: LeaderEvidenceFollowUpTone): string {
  switch (tone) {
    case "blocked":
      return "border-white/10";
    case "info":
      return "border-sky-300/20";
    case "ready":
      return "border-emerald-300/20";
    case "warning":
      return "border-amber-300/20";
  }
}

function tonePill(tone: LeaderEvidenceFollowUpTone): string {
  switch (tone) {
    case "blocked":
      return "border border-white/10 bg-white/10 text-white/70";
    case "info":
      return "border border-sky-300/30 bg-sky-300/15 text-sky-100";
    case "ready":
      return "border border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
    case "warning":
      return "border border-amber-300/30 bg-amber-300/15 text-amber-100";
  }
}
