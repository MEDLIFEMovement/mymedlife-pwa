import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { SltChecklistCompletionPanel } from "@/components/slt-checklist-completion-panel";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getSltChecklistCompletionPacket } from "@/services/slt-checklist-completion-packet";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminSltChecklistWrite");
export const dynamic = "force-dynamic";

type AdminSltChecklistWritePageProps = {
  searchParams?: Promise<{
    travelerId?: string;
    itemId?: string;
  }>;
};

export default async function AdminSltChecklistWritePage({
  searchParams,
}: AdminSltChecklistWritePageProps) {
  const emptySearchParams: { travelerId?: string; itemId?: string } = {};
  const [data, actor, search] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const packet = getSltChecklistCompletionPacket(actor, {
    travelerId: search.travelerId,
    itemId: search.itemId,
  });

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      {packet.canReadPacket ? (
        <SltChecklistCompletionPanel packet={packet} />
      ) : (
        <RestrictedState
          title="SLT checklist completion review is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. SLT checklist completion review is for Admin, DS Admin, and Super Admin safety contexts."
          nextHref="/slt-prep/checklist"
          nextLabel="Back to SLT checklist"
        />
      )}
    </AppShell>
  );
}
