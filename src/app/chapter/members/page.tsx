import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ChapterMembershipWorkspacePanel } from "@/components/chapter-membership-workspace-panel";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getChapterMemberRoleFocus } from "@/services/chapter-member-role-focus";
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
  const memberRoleFocus = getChapterMemberRoleFocus(actor, workspace);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      {workspace.canReadWorkspace ? (
        <>
          {memberRoleFocus.canReadFocus ? (
            <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
                {memberRoleFocus.roleLabel}
              </p>
              <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {memberRoleFocus.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
                    {memberRoleFocus.summary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={memberRoleFocus.primaryHref}
                    className="rounded-full bg-sky-200 px-4 py-2 text-sm font-semibold text-[#06211d]"
                  >
                    {memberRoleFocus.primaryLabel}
                  </Link>
                  <Link
                    href={memberRoleFocus.secondaryHref}
                    className="rounded-full border border-white/14 bg-black/20 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {memberRoleFocus.secondaryLabel}
                  </Link>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {memberRoleFocus.items.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/58">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-2xl border border-white/10 bg-black/18 p-3 text-sm leading-6 text-white/62">
                {memberRoleFocus.safetyNote}
              </p>
            </section>
          ) : null}
          <ChapterMembershipWorkspacePanel workspace={workspace} />
        </>
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
