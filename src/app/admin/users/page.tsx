import { redirect } from "next/navigation";

import {
  AdminUsersManagementPanel,
  type AdminUsersSearchParams,
} from "@/components/admin-users-management-panel";
import { FigmaAdminShellFrame } from "@/components/figma-admin-panel";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getAdminManagementDirectory } from "@/services/admin-management-data";
import { getAdminUserCreationConfig } from "@/services/admin-user-creation";
import { getAdminUserLifecycleConfig } from "@/services/admin-user-lifecycle";
import { getAdminUserPasswordResetConfig } from "@/services/admin-user-password-reset";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessAdminWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("admin");
export const dynamic = "force-dynamic";

type AdminUsersPageProps = {
  searchParams?: Promise<AdminUsersSearchParams>;
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const actor = await getLocalActorContext();
  const resolvedSearchParams = (await searchParams) ?? {};

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/admin/users"));
  }

  if (!canAccessAdminWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const directory = await getAdminManagementDirectory();

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="admin_backend" />
      <FigmaAdminShellFrame
        activeView="users"
        title="User Access Management"
        subtitle="DS / Super Admin"
      >
        <AdminUsersManagementPanel
          actor={actor}
          chapters={directory.chapters}
          embeddedInFigmaShell
          source={directory.source}
          searchParams={resolvedSearchParams}
          users={directory.users}
          writeConfig={directory.writeConfig}
          creationConfig={getAdminUserCreationConfig()}
          lifecycleConfig={getAdminUserLifecycleConfig()}
          passwordResetConfig={getAdminUserPasswordResetConfig()}
        />
      </FigmaAdminShellFrame>
    </>
  );
}
