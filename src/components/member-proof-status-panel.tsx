import Link from "next/link";
import type {
  MemberProofStatusRow,
  MemberProofStatusTone,
  MemberProofStatusWorkspace,
} from "@/services/member-proof-status";

type MemberProofStatusPanelProps = {
  buildActionHref?: (assignmentId: string) => string;
  workspace: MemberProofStatusWorkspace;
};

export function MemberProofStatusPanel({
  buildActionHref,
  workspace,
}: MemberProofStatusPanelProps) {
  if (!workspace.canReadWorkspace) {
    return null;
  }

  return (
    <section className="app-surface-info rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            Proof status
          </p>
          <h2 className="app-title mt-2">{workspace.title}</h2>
          <p className="app-copy mt-2 max-w-3xl">{workspace.summary}</p>
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
          <ProofStatusCard
            key={row.id}
            buildActionHref={buildActionHref}
            row={row}
          />
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

function ProofStatusCard({
  buildActionHref,
  row,
}: {
  buildActionHref?: (assignmentId: string) => string;
  row: MemberProofStatusRow;
}) {
  return (
    <article className={`app-surface rounded-[1.45rem] p-4 ${toneBorder(row.tone)}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tonePill(row.tone)}`}>
              {row.statusLabel}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              {row.ownerLabel}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{row.assignmentTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{row.plainEnglishStatus}</p>
        </div>
        {row.canOpenAction ? (
          <Link
            href={buildActionHref
              ? buildActionHref(row.assignmentId)
              : `/rush-month/actions/${row.assignmentId}`}
            className="w-fit rounded-full border border-[#5d8ff6]/28 bg-white px-3 py-1.5 text-xs font-semibold text-[#2563eb]"
          >
            Open action
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="app-surface-soft rounded-[1.1rem] p-3">
          <p className="app-eyebrow app-eyebrow-slate">
            Next step
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{row.nextStep}</p>
        </div>
        <div className="app-surface-soft rounded-[1.1rem] p-3">
          <p className="app-eyebrow app-eyebrow-slate">
            Proof type
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{row.proofTypeLabel}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            External exports: {row.externalPosture}
          </p>
        </div>
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface rounded-[1.05rem] px-3 py-2">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ProofStatusList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="app-surface rounded-[1.3rem] p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500"
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
      return "";
    case "info":
      return "border-[#bfdbfe]";
    case "ready":
      return "border-emerald-200";
    case "warning":
      return "border-amber-200";
  }
}

function tonePill(tone: MemberProofStatusTone): string {
  switch (tone) {
    case "blocked":
      return "border border-slate-200 bg-slate-50 text-slate-600";
    case "info":
      return "border border-[#bfdbfe] bg-[#eaf2ff] text-[#2563eb]";
    case "ready":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "warning":
      return "border border-amber-200 bg-amber-50 text-amber-700";
  }
}
