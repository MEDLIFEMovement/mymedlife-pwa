import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { getAssignmentById } from "@/lib/rush-month";

type ActionDetailPageProps = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export default async function ActionDetailPage({ params }: ActionDetailPageProps) {
  const { assignmentId } = await params;
  const assignment = getAssignmentById(assignmentId);

  if (!assignment) {
    notFound();
  }

  return (
    <AppShell>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              Member action detail
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{assignment.title}</h1>
          </div>
          <StatusBadge status={assignment.status} />
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68">
          {assignment.instructions}
        </p>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <h2 className="text-2xl font-semibold text-white">What evidence is needed?</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl bg-black/20 p-3">
              <dt className="text-white/44">Owner</dt>
              <dd className="mt-1 text-white">{assignment.ownerRole}</dd>
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <dt className="text-white/44">Due</dt>
              <dd className="mt-1 text-white">{assignment.dueLabel}</dd>
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <dt className="text-white/44">Proof requirement</dt>
              <dd className="mt-1 text-white">{assignment.evidenceRequired}</dd>
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <dt className="text-white/44">KPI</dt>
              <dd className="mt-1 text-white">{assignment.kpi}</dd>
            </div>
          </dl>
        </div>

        <form className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
          <h2 className="text-2xl font-semibold text-white">Submit proof</h2>
          <p className="mt-2 text-sm leading-6 text-white/68">
            Mock-only UI. This does not upload files or write to a database yet.
          </p>
          <label className="mt-4 block text-sm font-semibold text-white" htmlFor="proof-link">
            Evidence link or note
          </label>
          <textarea
            id="proof-link"
            className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-white/34"
            placeholder="Paste a message screenshot link, event RSVP link, or short proof note."
          />
          <button
            type="button"
            className="mt-4 rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
          >
            Save mock proof
          </button>
        </form>
      </section>

      <Link href="/rush-month/actions" className="text-sm font-semibold text-emerald-100">
        Back to all actions
      </Link>
    </AppShell>
  );
}
