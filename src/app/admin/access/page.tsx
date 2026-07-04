import { redirect } from "next/navigation";

import { AdminAccessManagementPanel } from "@/components/admin-access-management-panel";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessAdminWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("admin");
export const dynamic = "force-dynamic";

export default async function AdminAccessPage() {
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/admin/access"));
  }

  if (!canAccessAdminWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="admin_backend" />
      <AdminAccessManagementPanel actor={actor} />
    </>
  );
}
