import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { assignments, evidenceItems } from "@/data/mock-rush-month";

export default function ReviewPage() {
  const reviewAssignments = assignments.filter(
    (assignment) =>
      assignment.status === "submitted" || assignment.status === "changes_requested",
  );

  return (
    <AppShell>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Leader / coach review
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Proof review queue</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          This mock queue shows how submitted evidence will be reviewed before
          points and KPI events count.
        </p>
      </section>

      <section className="grid gap-3">
        {reviewAssignments.map((assignment) => {
          const evidence = evidenceItems.find((item) => item.assignmentId === assignment.id);

          return (
            <article key={assignment.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">{assignment.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/64">
                    Evidence: {evidence?.summary ?? assignment.evidenceRequired}
                  </p>
                  <p className="mt-2 text-sm text-white/54">Owner: {assignment.ownerRole}</p>
                </div>
                <StatusBadge status={assignment.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Approve", "Request changes", "Reject"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
