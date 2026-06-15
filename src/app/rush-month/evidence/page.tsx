import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { evidenceItems } from "@/data/mock-rush-month";

export default function EvidencePage() {
  return (
    <AppShell>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Evidence
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Mock proof submissions</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          Members will eventually submit evidence here. Goal 2 only shows the
          proof shape and review state with mock data.
        </p>
      </section>

      <section className="grid gap-3">
        {evidenceItems.map((item) => (
          <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs text-emerald-100/70">{item.evidenceType}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{item.summary}</h2>
                <p className="mt-2 text-sm text-white/62">Submitted by {item.submittedBy}</p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
                {item.status}
              </span>
            </div>
            <Link
              href={`/rush-month/actions/${item.assignmentId}`}
              className="mt-4 inline-flex text-sm font-semibold text-emerald-100"
            >
              Open linked action
            </Link>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
