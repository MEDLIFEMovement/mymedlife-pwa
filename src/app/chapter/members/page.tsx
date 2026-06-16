import { AppShell } from "@/components/app-shell";
import { ChapterMembershipWorkspacePanel } from "@/components/chapter-membership-workspace-panel";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getChapterMembershipWorkspace } from "@/services/chapter-membership-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("chapterMembers");
export const dynamic = "force-dynamic";

export default async function ChapterMembersPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const workspace = getChapterMembershipWorkspace(actor, data);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {workspace.canReadWorkspace ? (
        <ChapterMembershipWorkspacePanel workspace={workspace} />
      ) : (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={actor.audience === "ds_admin" ? "/admin" : "/rush-month/dashboard"}
          nextLabel={
            actor.audience === "ds_admin"
              ? "Open integration safety"
              : "Open your student dashboard"
          }
        />
      )}
    </AppShell>
  );
}
