import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { DataSourceNotice } from "@/components/data-source-notice";
import { FirstWriteActivationDrillPanel } from "@/components/first-write-activation-drill-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getFirstWriteActivationDrill } from "@/services/first-write-activation-drill";
import {
  getHostedReviewerShellActor,
  getHostedReviewerSigninRequirement,
} from "@/services/hosted-reviewer-signin";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminFirstWrite");
export const dynamic = "force-dynamic";

export default async function FirstWritePage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const drill = getFirstWriteActivationDrill(actor, data);
  const signinRequirement = getHostedReviewerSigninRequirement(
    actor,
    "/admin/first-write",
    "Sign in to review the first hosted write.",
    "No signed-in hosted staging reviewer session is active for this route. Use a seeded Admin, DS Admin, or Super Admin review account, then come back here to inspect the hosted `action_started` packet, audit readback, and zero-send posture honestly.",
  );
  const shellActor = signinRequirement
    ? getHostedReviewerShellActor(actor, "super.admin@mymedlife.test")
    : actor;

  return (
    <AdminAppShell actor={shellActor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="first_write"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />
      {drill.canReadDrill ? (
        <FirstWriteActivationDrillPanel drill={drill} />
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
          title="First-write activation is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. First-write activation is for HQ, DS Admin, and Super Admin review contexts."
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      )}
    </AdminAppShell>
  );
}
