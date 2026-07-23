import { redirect } from "next/navigation";

import { AdminIntegrationsReviewPanel } from "@/components/admin-integrations-review-panel";
import { AdminOperationalOverviewPanel } from "@/components/admin-operational-overview-panel";
import { FigmaAdminPanel, FigmaAdminShellFrame } from "@/components/figma-admin-panel";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { getAdminIntegrationOutboxWorkspace } from "@/services/admin-integration-outbox-workspace";
import { getAdminLumaIntegrationStatus } from "@/services/admin-luma-integration-status";
import { getAdminManagementDirectory } from "@/services/admin-management-data";
import { getAdminMasterDataWorkspace } from "@/services/admin-master-data-workspace";
import { getLandingRouteForActor } from "@/services/landing-route";
import {
  buildLoginRedirectHrefForPath,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canAccessAdminWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("admin");
export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedView = Array.isArray(resolvedSearchParams.view)
    ? resolvedSearchParams.view[0]
    : resolvedSearchParams.view;

  if (requestedView === "users") {
    redirect("/admin/users");
  }

  if (requestedView === "chapters") {
    redirect("/admin/chapters");
  }

  if (requestedView === "luma") {
    redirect("/admin/integrations/luma");
  }

  if (requestedView === "audit") {
    redirect("/admin/audit-log");
  }

  if (requestedView === "health") {
    redirect("/admin/system-health");
  }

  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHrefForPath("/admin", resolvedSearchParams));
  }

  if (!canAccessAdminWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  if (!requestedView || requestedView === "overview") {
    const [data, directory] = await Promise.all([
      getReadOnlyAppData(),
      getAdminManagementDirectory(),
    ]);
    const workspace = getAdminMasterDataWorkspace(actor, data, { directory });

    return (
      <>
        <WorkspaceAccountMenu actor={actor} currentWorkspace="admin_backend" />
        <FigmaAdminShellFrame
          activeView="overview"
          title="Overview"
          subtitle="App-owned operational readback"
        >
          <AdminOperationalOverviewPanel data={data} workspace={workspace} />
        </FigmaAdminShellFrame>
      </>
    );
  }

  if (requestedView === "integrations") {
    const data = await getReadOnlyAppData();
    const lumaStatus = getAdminLumaIntegrationStatus(actor, data);
    const outboxWorkspace = getAdminIntegrationOutboxWorkspace(actor, data);

    return (
      <>
        <WorkspaceAccountMenu actor={actor} currentWorkspace="admin_backend" />
        <FigmaAdminShellFrame
          activeView="integrations"
          title="Integrations"
          subtitle="Route-backed provider readback"
        >
          <AdminIntegrationsReviewPanel
            lumaStatus={lumaStatus}
            outboxWorkspace={outboxWorkspace}
            source={data.source}
          />
        </FigmaAdminShellFrame>
      </>
    );
  }

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="admin_backend" />
      <FigmaAdminPanel />
    </>
  );
}
