import Link from "next/link";
import type { ReactNode } from "react";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getAdminMasterDataWorkspace } from "@/services/admin-master-data-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminMasterData");
export const dynamic = "force-dynamic";

export default async function AdminMasterDataPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const workspace = getAdminMasterDataWorkspace(actor, data);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav current="master_data" />

      {!workspace.canReadWorkspace ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.label}
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
                  Admin master data
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {workspace.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                  {workspace.summary}
                </p>
              </div>
              <Link
                href={workspace.nextStep.href}
                className="w-fit rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
              >
                {workspace.nextStep.label}
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <MiniStat label="Users" value={`${workspace.counts.users}`} />
            <MiniStat label="Roles" value={`${workspace.counts.roles}`} />
            <MiniStat label="Chapters" value={`${workspace.counts.chapters}`} />
            <MiniStat
              label="Templates"
              value={`${workspace.counts.campaignTemplates}`}
            />
            <MiniStat
              label="Mutations"
              value={`${workspace.counts.mutationControlsEnabled}`}
            />
            <MiniStat
              label="Sends"
              value={`${workspace.counts.externalWritesExpected}`}
            />
          </section>

          <InventorySection title="Fake users" count={workspace.users.length}>
            <div className="grid gap-3 lg:grid-cols-2">
              {workspace.users.map((user) => (
                <article
                  key={user.email}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {user.displayName}
                      </h2>
                      <p className="mt-1 break-words font-mono text-xs text-emerald-100/70">
                        {user.email}
                      </p>
                    </div>
                    <Pill>{user.status.replaceAll("_", " ")}</Pill>
                  </div>
                  <p className="mt-3 text-sm text-white/60">
                    {user.audience.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/48">
                    {[...user.chapterRoles, ...user.staffRoles].join(", ") || "No role"}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/48">
                    {user.detail}
                  </p>
                </article>
              ))}
            </div>
          </InventorySection>

          <InventorySection title="Named roles" count={workspace.roles.length}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {workspace.roles.map((role) => (
                <article
                  key={role.role}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-white">
                      {role.role}
                    </h2>
                    <Pill>{role.status.replaceAll("_", " ")}</Pill>
                  </div>
                  <p className="mt-2 text-sm text-white/60">
                    {role.audience.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 break-words font-mono text-xs text-emerald-100/70">
                    {role.localActorEmail ?? "missing local actor"}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/48">
                    {role.detail}
                  </p>
                </article>
              ))}
            </div>
          </InventorySection>

          <InventorySection title="Chapters" count={workspace.chapters.length}>
            <div className="grid gap-3 lg:grid-cols-2">
              {workspace.chapters.map((chapter) => (
                <article
                  key={chapter.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {chapter.name}
                      </h2>
                      <p className="mt-1 text-sm text-white/58">
                        {chapter.campus} / {chapter.region}
                      </p>
                    </div>
                    <Pill>{chapter.status.replaceAll("_", " ")}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    Coach: {chapter.coachName}. {chapter.detail}
                  </p>
                </article>
              ))}
            </div>
          </InventorySection>

          <InventorySection
            title="Campaign templates"
            count={workspace.campaignTemplates.length}
          >
            <div className="grid gap-3 lg:grid-cols-2">
              {workspace.campaignTemplates.map((template) => (
                <article
                  key={template.slug}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {template.name}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-white/44">
                        {template.slug}
                      </p>
                    </div>
                    <Pill>{template.status}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    KPIs: {template.primaryKpis.slice(0, 3).join(", ")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/52">
                    Lanes: {template.actionCommitteeLanes.join(", ")}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/46">
                    {template.integrationPosture}
                  </p>
                </article>
              ))}
            </div>
          </InventorySection>

          <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
              Blocked until approval
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {workspace.blockedWrites.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/64"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              {workspace.safetyNotes.map((note) => (
                <p
                  key={note}
                  className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/64"
                >
                  {note}
                </p>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function InventorySection({
  children,
  count,
  title,
}: {
  children: ReactNode;
  count: number;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/64">
          {count}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
      {children}
    </span>
  );
}
