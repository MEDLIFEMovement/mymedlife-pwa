import { AppShell } from "@/components/app-shell";
import { RestrictedState } from "@/components/restricted-state";
import { RushMonthEventReadinessPanel } from "@/components/rush-month-event-readiness-panel";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getRushMonthEventReadinessWorkspace } from "@/services/rush-month-event-readiness";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("rushMonthEvents");
export const dynamic = "force-dynamic";

export default async function RushMonthEventsPage() {
  const actor = await getLocalActorContext();
  const workspace = getRushMonthEventReadinessWorkspace(actor);

  return (
    <AppShell actor={actor}>
      {!workspace.canReadWorkspace ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref="/admin"
          nextLabel="Open integration outbox"
        />
      ) : (
        <RushMonthEventReadinessPanel workspace={workspace} />
      )}
    </AppShell>
  );
}
