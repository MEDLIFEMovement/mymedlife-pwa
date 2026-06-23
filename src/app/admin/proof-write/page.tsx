import { AppShell } from "@/components/app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { DataSourceNotice } from "@/components/data-source-notice";
import { ProofMetadataVerificationPanel } from "@/components/proof-metadata-verification-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getProofMetadataPacket } from "@/services/proof-metadata-verification-packet";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminProofWrite");
export const dynamic = "force-dynamic";

export default async function ProofWritePage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const packet = getProofMetadataPacket(actor, data);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav current="workflows" />
      {packet.canReadPacket ? (
        <ProofMetadataVerificationPanel packet={packet} />
      ) : (
        <RestrictedState
          title="Proof metadata activation is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. Proof metadata activation is for HQ, DS Admin, and Super Admin review contexts."
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      )}
    </AppShell>
  );
}
