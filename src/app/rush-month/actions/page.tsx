import { AppShell } from "@/components/app-shell";
import { AssignmentCard } from "@/components/assignment-card";
import { DataSourceNotice } from "@/components/data-source-notice";
import { LocalActorNotice } from "@/components/local-actor-notice";
import { LocalRoleSwitcher } from "@/components/local-role-switcher";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getVisibleAssignmentsForActor } from "@/services/role-visibility";

export const dynamic = "force-dynamic";

export default async function ActionsPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <LocalActorNotice actor={actor} />
      <LocalRoleSwitcher actor={actor} />

      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          This week actions
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {actor.audienceLabel} visible assignments
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          This read-only view shows who owns what, what evidence is needed, and
          what this local role should act on next.
        </p>
      </section>

      {visibleAssignments.length > 0 ? (
        <section className="grid gap-3 lg:grid-cols-2">
          {visibleAssignments.map((assignment) => (
            <AssignmentCard key={`${actor.audience}-${assignment.id}`} assignment={assignment} />
          ))}
        </section>
      ) : (
        <RestrictedState
          title="No assignment rows are visible to this role."
          message="DS Admin can inspect integration/outbox posture only. Student assignment truth stays in the app and is not owned by systems administration."
          nextHref="/admin"
          nextLabel="Open admin integration view"
        />
      )}
    </AppShell>
  );
}
