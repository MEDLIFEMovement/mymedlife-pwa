import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { DataSourceNotice } from "@/components/data-source-notice";
import { ProofMetadataVerificationPanel } from "@/components/proof-metadata-verification-panel";
import { RestrictedState } from "@/components/restricted-state";
import {
  getHostedReviewerShellActor,
  getHostedReviewerSigninRequirement,
} from "@/services/hosted-reviewer-signin";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getProofMetadataPacket } from "@/services/proof-metadata-verification-packet";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminProofWrite");
export const dynamic = "force-dynamic";

export default async function ProofWritePage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const packet = getProofMetadataPacket(actor, data);
  const signinRequirement = getHostedReviewerSigninRequirement(
    actor,
    "/admin/proof-write",
    "Sign in to review the hosted proof loop.",
    "No signed-in hosted staging reviewer session is active for this route. Use a seeded Admin, DS Admin, or Super Admin review account, then come back here to inspect the hosted proof-metadata packet, leader review readback, audit rows, and disabled outbox posture honestly.",
  );
  const shellActor = signinRequirement
    ? getHostedReviewerShellActor(actor, "super.admin@mymedlife.test")
    : actor;

  return (
    <AdminAppShell actor={shellActor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="proof_write"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />
      {packet.canReadPacket ? (
        <ProofMetadataVerificationPanel packet={packet} />
      ) : signinRequirement ? (
        <RestrictedState
          eyebrow={signinRequirement.eyebrow}
          title={signinRequirement.title}
          message={signinRequirement.message}
          nextHref={signinRequirement.loginHref}
          nextLabel={signinRequirement.nextLabel}
        />
      ) : (
        <RestrictedState
          title="Proof metadata activation is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. Proof metadata activation is for HQ, DS Admin, and Super Admin review contexts."
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      )}
    </AdminAppShell>
  );
}
