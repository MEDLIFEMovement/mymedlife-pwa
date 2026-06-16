import Link from "next/link";
import type { ActionProofHandoffWorkspace } from "@/services/action-proof-handoff";

type ActionProofHandoffPanelProps = {
  workspace: ActionProofHandoffWorkspace;
};

export function ActionProofHandoffPanel({
  workspace,
}: ActionProofHandoffPanelProps) {
  if (!workspace.canReadHandoff) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
            Proof handoff
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{workspace.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
            {workspace.summary}
          </p>
        </div>
        <Link
          href={workspace.nextBestAction.href}
          className="w-fit rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-[#061621]"
        >
          {workspace.nextBestAction.label}
        </Link>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
            What to prepare
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {workspace.storyPrompt}
          </p>
          <p className="mt-3 text-sm leading-6 text-white/62">
            {workspace.roleNote}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
            Good proof checklist
          </p>
          <ul className="mt-3 grid gap-2">
            {workspace.checklist.map((item) => (
              <li key={item} className="text-sm leading-6 text-white/66">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ProofHandoffList
          title="Future structured records"
          items={workspace.futureStructuredEvents}
        />
        <ProofHandoffList
          title="Disabled outbox destinations"
          items={workspace.disabledOutboxDestinations}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
        <p className="text-sm font-semibold text-amber-100">
          Still preview-only
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

function ProofHandoffList({ items, title }: { items: string[]; title: string }) {
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
