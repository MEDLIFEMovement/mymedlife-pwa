import { AppShell } from "@/components/app-shell";
import { AssignmentCard } from "@/components/assignment-card";
import { roleContexts } from "@/data/mock-rush-month";
import { getAssignmentsForRole } from "@/lib/rush-month";
import type { RoleKey } from "@/shared/types/domain";

const roleOrder: RoleKey[] = ["member", "leader", "coach", "admin"];

export default function ActionsPage() {
  return (
    <AppShell>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          This week actions
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Assignments are grouped by mock role context.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          This view shows who owns what, what evidence is needed, and what status
          the chapter should act on next.
        </p>
      </section>

      {roleOrder.map((roleKey) => {
        const role = roleContexts.find((item) => item.key === roleKey);
        const roleAssignments = getAssignmentsForRole(roleKey);

        return (
          <section key={roleKey} className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/44">
                {role?.audience}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">{role?.label}</h2>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {roleAssignments.map((assignment) => (
                <AssignmentCard key={`${roleKey}-${assignment.id}`} assignment={assignment} />
              ))}
            </div>
          </section>
        );
      })}
    </AppShell>
  );
}
