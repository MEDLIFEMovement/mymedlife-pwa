import Link from "next/link";
import type {
  MemberProofStatusRow,
  MemberProofStatusTone,
  MemberProofStatusWorkspace,
} from "@/services/member-proof-status";

type MemberProofStatusPanelProps = {
  workspace: MemberProofStatusWorkspace;
};

export function MemberProofStatusPanel({
  workspace,
}: MemberProofStatusPanelProps) {
  if (!workspace.canReadWorkspace) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
            Proof status
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{workspace.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
            {workspace.summary}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <MiniStat label="Needed" value={`${workspace.counts.proofNeeded}`} />
          <MiniStat label="HQ review" value={`${workspace.counts.waitingHqReview}`} />
          <MiniStat label="Changes" value={`${workspace.counts.changesRequested}`} />
          <MiniStat label="Public" value={`${workspace.counts.publicPublishesEnabled}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {workspace.rows.map((row) => (
          <ProofStatusCard key={row.id} row={row} />
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ProofStatusList
          title="Future structured records"
          items={workspace.futureStructuredEvents}
        />
        <ProofStatusList
          title="Disabled outbox destinations"
          items={workspace.disabledOutboxDestinations}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
        <p className="text-sm font-semibold text-amber-100">
          Sharing is still HQ-controlled
        </p>
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-amber-50/72">
          {workspace.safetyNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProofStatusCard({ row }: { row: MemberProofStatusRow }) {
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
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">
            {row.assignmentTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/66">
            {row.plainEnglishStatus}
          </p>
        </div>
        {row.canOpenAction ? (
          <Link
            href={`/rush-month/actions/${row.assignmentId}`}
            className="w-fit rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Open action
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            Next step
          </p>
          <p className="mt-2 text-sm leading-6 text-white/66">{row.nextStep}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            Proof type
          </p>
          <p className="mt-2 text-sm leading-6 text-white/66">{row.proofTypeLabel}</p>
          <p className="mt-2 text-xs leading-5 text-white/44">
            External exports: {row.externalPosture}
          </p>
        </div>
      </div>
    </article>
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

function ProofStatusList({ items, title }: { items: string[]; title: string }) {
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

function toneBorder(tone: MemberProofStatusTone): string {
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

function tonePill(tone: MemberProofStatusTone): string {
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
