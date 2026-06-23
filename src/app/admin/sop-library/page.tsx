import Link from "next/link";
import type { ReactNode } from "react";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getSopLibraryWorkspace } from "@/services/sop-library-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminSopLibrary");
export const dynamic = "force-dynamic";

type AdminSopLibraryPageProps = {
  searchParams?: Promise<{
    focus?: string;
    query?: string;
    status?: string;
  }>;
};

export default async function AdminSopLibraryPage({
  searchParams,
}: AdminSopLibraryPageProps) {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const workspace = getSopLibraryWorkspace(actor, resolvedSearchParams);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav current="sop_library" />

      {!workspace.canReadWorkspace ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.label}
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#2e1f12] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
                  Campaign SOP Library
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {workspace.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
                  {workspace.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <InfoPill>{workspace.counts.totalSops} total SOPs</InfoPill>
                  <InfoPill>{workspace.counts.totalRules} modeled rules</InfoPill>
                  <InfoPill>0 browser writes</InfoPill>
                  <InfoPill>0 external writes</InfoPill>
                </div>
              </div>
              <Link
                href={workspace.nextStep.href}
                className="w-fit rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-[#26180d]"
              >
                {workspace.nextStep.label}
              </Link>
            </div>
          </section>

          {workspace.selectedEntry ? (
            <section className="rounded-[2rem] border border-amber-200/18 bg-amber-200/10 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                    Current library focus
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {workspace.selectedEntry.name}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/72">
                    {workspace.selectedEntry.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <InfoPill>{workspace.selectedEntry.status}</InfoPill>
                    <InfoPill>{workspace.selectedEntry.versionLabel}</InfoPill>
                    <InfoPill>{workspace.selectedEntry.lastEditedBy}</InfoPill>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <FocusStat
                    label="Steps"
                    value={`${workspace.selectedEntry.stepsCount}`}
                    note="Route-backed workflow stages"
                  />
                  <FocusStat
                    label="Role rules"
                    value={`${workspace.selectedEntry.roleRulesCount}`}
                    note="Canonical role actions in scope"
                  />
                  <FocusStat
                    label="Boundaries"
                    value={`${workspace.selectedEntry.integrationBoundariesCount}`}
                    note="Integration and delivery hold lines"
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="Total SOPs" value={`${workspace.counts.totalSops}`} />
            <MiniStat label="Live" value={`${workspace.counts.live}`} />
            <MiniStat
              label="In Draft / Scheduled"
              value={`${workspace.counts.inDraftOrScheduled}`}
            />
            <MiniStat label="Archived" value={`${workspace.counts.archived}`} />
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/54">
                  Library controls
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Search and filter campaign definitions
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
                  Keep library state on this route so filters, selected campaign
                  detail, and builder entry points stay visible together.
                </p>
              </div>
              {workspace.filters.hasActiveFilters ? (
                <Link
                  href={workspace.filters.clearHref}
                  className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                >
                  Clear filters
                </Link>
              ) : null}
            </div>

            <form
              action="/admin/sop-library"
              className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"
            >
              {workspace.filters.status !== "all" ? (
                <input type="hidden" name="status" value={workspace.filters.status} />
              ) : null}
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                  Search campaigns
                </span>
                <input
                  type="text"
                  name="query"
                  defaultValue={workspace.filters.query}
                  placeholder="Search campaigns..."
                  className="rounded-[1rem] border border-white/12 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/36"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex rounded-full bg-amber-200 px-4 py-2.5 text-sm font-semibold text-[#26180d]"
                >
                  Apply search
                </button>
              </div>
            </form>

            <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                Status filters
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {workspace.filters.statusOptions.map((option) => (
                  <Link
                    key={option.key}
                    href={option.href}
                    className={
                      option.isActive
                        ? "rounded-full bg-amber-200 px-3 py-1.5 text-sm font-semibold text-[#26180d]"
                        : "rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white"
                    }
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                Active result set
              </p>
              <p className="mt-2 text-sm leading-6 text-white/72">
                {workspace.filters.activeSummary}
              </p>
              {workspace.filters.query ? (
                <p className="mt-2 text-sm leading-6 text-amber-100/72">
                  Search query: {workspace.filters.query}
                </p>
              ) : null}
            </div>
          </section>

          {workspace.selectedEntry ? (
            <section className="rounded-[2rem] border border-amber-200/18 bg-amber-200/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                Selected in library
              </p>
              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-100/72">
                    {workspace.selectedEntry.slug}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {workspace.selectedEntry.name}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/72">
                    {workspace.selectedEntry.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <InfoPill>{workspace.selectedEntry.status}</InfoPill>
                    <InfoPill>{workspace.selectedEntry.versionLabel}</InfoPill>
                    <InfoPill>{workspace.selectedEntry.lastEditedBy}</InfoPill>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={workspace.selectedEntry.builderHref}
                    className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    Open builder
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#071d1a]/90">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-2xl font-semibold text-white">Campaign definitions</h2>
            </div>
            {workspace.entries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-black/20">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                      <th className="px-5 py-3">Campaign</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Version</th>
                      <th className="px-5 py-3">Steps</th>
                      <th className="px-5 py-3">Last Edited By</th>
                      <th className="px-5 py-3">Last Published</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workspace.entries.map((entry) => {
                      const isSelected = workspace.selectedEntry?.key === entry.key;

                      return (
                        <tr
                          key={entry.slug}
                          className={isSelected ? "bg-amber-200/10" : "bg-transparent"}
                        >
                          <td className="border-t border-white/10 px-5 py-4 align-top">
                            <div className="max-w-md">
                              <p className="font-semibold text-white">{entry.name}</p>
                              <p className="mt-1 text-sm leading-6 text-white/66">
                                {entry.summary}
                              </p>
                            </div>
                          </td>
                          <td className="border-t border-white/10 px-5 py-4 align-top">
                            <StatusPill>{entry.status}</StatusPill>
                          </td>
                          <td className="border-t border-white/10 px-5 py-4 align-top text-sm text-white/72">
                            {entry.versionLabel}
                          </td>
                          <td className="border-t border-white/10 px-5 py-4 align-top text-sm text-white/72">
                            {entry.stepsCount}
                          </td>
                          <td className="border-t border-white/10 px-5 py-4 align-top text-sm text-white/72">
                            {entry.lastEditedBy}
                          </td>
                          <td className="border-t border-white/10 px-5 py-4 align-top text-sm text-white/72">
                            {entry.lastPublishedDate ?? "—"}
                          </td>
                          <td className="border-t border-white/10 px-5 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={entry.focusHref}
                                aria-current={isSelected ? "page" : undefined}
                                className={
                                  isSelected
                                    ? "inline-flex rounded-full bg-amber-200 px-3 py-1.5 text-sm font-semibold text-[#26180d]"
                                    : "inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                                }
                              >
                                {isSelected ? "Selected" : "Open in library"}
                              </Link>
                              <Link
                                href={entry.builderHref}
                                className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-sm font-semibold text-white"
                              >
                                Open Builder
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <section className="px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                  No matching campaigns
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  No campaign definitions match this search yet.
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/66">
                  Keep the route state intact, then clear or loosen the current
                  filters to reopen the broader SOP library.
                </p>
                <Link
                  href={workspace.filters.clearHref}
                  className="mt-4 inline-flex rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-[#26180d]"
                >
                  Reset library filters
                </Link>
              </section>
            )}
          </section>

          {workspace.selectedEntry ? (
            <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                Builder entry points
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {workspace.selectedEntry.entryPoints.map((entryPoint) => (
                  <Link
                    key={`${workspace.selectedEntry?.slug}-${entryPoint.label}`}
                    href={entryPoint.href}
                    className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    {entryPoint.label}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#071d1a]/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/54">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{props.value}</p>
    </article>
  );
}

function FocusStat(props: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/72">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{props.value}</p>
      <p className="mt-2 text-xs leading-5 text-white/62">{props.note}</p>
    </article>
  );
}

function StatusPill(props: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-white/72">
      {props.children}
    </span>
  );
}

function InfoPill(props: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/72">
      {props.children}
    </span>
  );
}
