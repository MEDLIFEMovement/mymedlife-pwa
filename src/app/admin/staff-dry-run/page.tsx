import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { StaffDryRunGuidePanel } from "@/components/staff-dry-run-guide-panel";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaffDryRunGuide } from "@/services/staff-dry-run-guide";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminStaffDryRun");
export const dynamic = "force-dynamic";

export default async function StaffDryRunPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const guide = getStaffDryRunGuide(actor, data);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      {guide.canReadGuide ? (
        <StaffDryRunGuidePanel guide={guide} />
      ) : (
        <RestrictedState
          title="Staff dry run is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. The dry-run guide is for HQ staff and safety review contexts."
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      )}
    </AppShell>
  );
}
