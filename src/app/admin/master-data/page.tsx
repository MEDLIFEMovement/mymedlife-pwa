import Link from "next/link";
import type { ReactNode } from "react";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getAdminMasterDataWorkspace } from "@/services/admin-master-data-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
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
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="master_data"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />

      {!workspace.canReadWorkspace ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.label}
        />
      ) : (
        <>
          <section className="app-surface-info rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
                  Admin master data
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {workspace.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {workspace.summary}
                </p>
              </div>
              <Link
                href={workspace.nextStep.href}
                className="w-fit rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
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
                <article key={user.email} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">
                        {user.displayName}
                      </h2>
                      <p className="mt-1 break-words font-mono text-xs text-slate-500">
                        {user.email}
                      </p>
                    </div>
                    <Pill>{user.status.replaceAll("_", " ")}</Pill>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {user.audience.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {[...user.chapterRoles, ...user.staffRoles].join(", ") || "No role"}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {user.detail}
                  </p>
                </article>
              ))}
            </div>
          </InventorySection>

          <InventorySection title="Named roles" count={workspace.roles.length}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {workspace.roles.map((role) => (
                <article key={role.role} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-950">
                      {role.role}
                    </h2>
                    <Pill>{role.status.replaceAll("_", " ")}</Pill>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {role.audience.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 break-words font-mono text-xs text-slate-500">
                    {role.localActorEmail ?? "missing local actor"}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {role.detail}
                  </p>
                </article>
              ))}
            </div>
          </InventorySection>

          <InventorySection title="Chapters" count={workspace.chapters.length}>
            <div className="grid gap-3 lg:grid-cols-2">
              {workspace.chapters.map((chapter) => (
                <article key={chapter.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">
                        {chapter.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {chapter.campus} / {chapter.region}
                      </p>
                    </div>
                    <Pill>{chapter.status.replaceAll("_", " ")}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
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
                <article key={template.slug} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">
                        {template.name}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {template.slug}
                      </p>
                    </div>
                    <Pill>{template.status}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    KPIs: {template.primaryKpis.slice(0, 3).join(", ")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Lanes: {template.actionCommitteeLanes.join(", ")}
                  </p>
                  {template.workflowSnapshot ? (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
                        Current workflow state
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          {template.workflowSnapshot.versionLabel}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          source {template.workflowSnapshot.sourceKind.replaceAll("_", " ")}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {template.workflowSnapshot.currentPhaseLabel}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {template.workflowSnapshot.currentPhaseObjective}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Exit signal: {template.workflowSnapshot.currentPhaseExitSignal}
                      </p>
                    </div>
                  ) : null}
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {template.integrationPosture}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {template.detail}
                  </p>
                </article>
              ))}
            </div>
          </InventorySection>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
              SOP tooling
            </p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Open SOP builder</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Campaign templates and committee lanes are the natural entry point
                  into the workflow builder, so this inventory can hand reviewers to
                  the typed backend workspace directly.
                </p>
              </div>
              <Link
                href="/admin/sop-builder/rush-month?tab=steps"
                className="w-fit rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                Open SOP builder
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
              Blocked until approval
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {workspace.blockedWrites.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              {workspace.safetyNotes.map((note) => (
                <p
                  key={note}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600"
                >
                  {note}
                </p>
              ))}
            </div>
          </section>
        </>
      )}
    </AdminAppShell>
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
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {count}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}
