import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { RestrictedState } from "@/components/restricted-state";
import { StaffCommandCenterPanel } from "@/components/staff-command-center-panel";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getStaffCommandCenter } from "@/services/staff-command-center";

export const metadata = getStaticRouteMetadata("staff");
export const dynamic = "force-dynamic";

type StaffPageProps = {
  searchParams?: Promise<{
    chapter?: string;
    q?: string;
    risk?: string;
    view?: string;
  }>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const emptySearchParams: {
    chapter?: string;
    q?: string;
    risk?: string;
    view?: string;
  } = {};
  const [data, actor, search] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const commandCenter = getStaffCommandCenter(actor, data, {
    chapterId: search.chapter,
    query: search.q,
    risk: search.risk,
    view: search.view,
  });

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {commandCenter.canReadCommandCenter ? (
        <>
          <StaffCommandCenterPanel commandCenter={commandCenter} />

          {commandCenter.selectedView === "admin" &&
          commandCenter.canReadDetailedOutbox ? (
            <EventOutboxLog
              events={data.integrationEvents}
              outboxItems={data.outboxItems}
            />
          ) : null}
        </>
      ) : (
        <RestrictedState
          title="This staff command center is not visible to this role."
          message="Members and chapter leaders should use their student or chapter operating routes. DS Admin should keep using the admin safety lanes for integration and outbox review."
          nextHref={actor.audience === "ds_admin" ? "/admin" : "/rush-month"}
          nextLabel={actor.audience === "ds_admin" ? "Open admin safety review" : "Back to Rush Month"}
        />
      )}
    </AppShell>
  );
}
