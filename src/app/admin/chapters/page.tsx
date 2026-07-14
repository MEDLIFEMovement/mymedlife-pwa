import { redirect } from "next/navigation";

import {
  AdminChaptersManagementPanel,
  type AdminChaptersSearchParams,
} from "@/components/admin-chapters-management-panel";
import { FigmaAdminShellFrame } from "@/components/figma-admin-panel";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { getAdminManagementDirectory } from "@/services/admin-management-data";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canAccessAdminWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import {
  submitAdminChapterAction,
  submitAdminChapterTestMarkerAction,
} from "@/app/admin/chapters/actions";

export const metadata = getStaticRouteMetadata("admin");
export const dynamic = "force-dynamic";

type AdminChaptersPageProps = {
  searchParams?: Promise<AdminChaptersSearchParams>;
};

export default async function AdminChaptersPage({
  searchParams,
}: AdminChaptersPageProps) {
  const actor = await getLocalActorContext();
  const resolvedSearchParams = (await searchParams) ?? {};
  const directory = await getAdminManagementDirectory();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/admin/chapters"));
  }

  if (!canAccessAdminWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="admin_backend" />
      <FigmaAdminShellFrame
        activeView="chapters"
        title="Chapter Management"
        subtitle="DS / Super Admin"
      >
        <AdminChaptersManagementPanel
          actor={actor}
          chapterAction={submitAdminChapterAction}
          embeddedInFigmaShell
          testAction={submitAdminChapterTestMarkerAction}
          chapters={directory.chapters}
          searchParams={resolvedSearchParams}
          users={directory.users}
          writeConfig={directory.writeConfig}
        />
      </FigmaAdminShellFrame>
    </>
  );
}
