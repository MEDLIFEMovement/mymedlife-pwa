import Link from "next/link";
import type { ReactNode } from "react";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
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
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="sop_library"
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
                  Campaign SOP Library
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {workspace.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {workspace.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <InfoPill>{workspace.counts.totalSops} total SOPs</InfoPill>
                  <InfoPill>{workspace.counts.totalRules} modeled rules</InfoPill>
                  <InfoPill>{workspace.counts.structuredDrafts} structured drafts</InfoPill>
                  <InfoPill>{workspace.counts.reviewWarnings} review warnings</InfoPill>
                  <InfoPill>0 browser writes</InfoPill>
                  <InfoPill>0 external writes</InfoPill>
                </div>
              </div>
              <Link
                href={workspace.nextStep.href}
                className="w-fit rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                {workspace.nextStep.label}
              </Link>
            </div>
          </section>

          {workspace.selectedEntry ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563eb]">
                    Current library focus
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {workspace.selectedEntry.name}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {workspace.selectedEntry.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <InfoPill>{workspace.selectedEntry.status}</InfoPill>
                    <InfoPill>{workspace.selectedEntry.versionLabel}</InfoPill>
                    <InfoPill>{workspace.selectedEntry.lastEditedBy}</InfoPill>
                    {workspace.selectedEntry.templateImportStatus ? (
                      <InfoPill>
                        import {workspace.selectedEntry.templateImportStatus.replaceAll("_", " ")}
                      </InfoPill>
                    ) : null}
                    {workspace.selectedEntry.templateProvenanceLabel ? (
                      <InfoPill>{workspace.selectedEntry.templateProvenanceLabel}</InfoPill>
                    ) : null}
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
                  <FocusStat
                    label="Sources"
                    value={`${workspace.selectedEntry.templateSourceCount}`}
                    note="Structured source references on the imported template"
                  />
                  <FocusStat
                    label="Engine bindings"
                    value={`${workspace.selectedEntry.templateEngineBindingsCount}`}
                    note="Permissions, validators, handoffs, and feature flags modeled."
                  />
                  <FocusStat
                    label="Import traces"
                    value={`${workspace.selectedEntry.templateImportTraceCount}`}
                    note="Structured traces linking imported workflow content back to source."
                  />
                  <FocusStat
                    label="Warnings"
                    value={`${workspace.selectedEntry.templateReviewWarnings.length}`}
                    note="Open review items still called out on the template"
                  />
                  <FocusStat
                    label="Imported steps"
                    value={`${workspace.selectedEntry.templateStepCount}`}
                    note="Structured steps extracted into the draft template"
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
            <MiniStat
              label="Structured Drafts"
              value={`${workspace.counts.structuredDrafts}`}
            />
            <MiniStat
              label="Review Warnings"
              value={`${workspace.counts.reviewWarnings}`}
            />
          </section>

          <section className="app-surface-info rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
                  Library controls
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Search and filter campaign definitions
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Keep library state on this route so filters, selected campaign
                  detail, and builder entry points stay visible together.
                </p>
              </div>
              {workspace.filters.hasActiveFilters ? (
                <Link
                  href={workspace.filters.clearHref}
                  className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
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
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Search campaigns
                </span>
                <input
                  type="text"
                  name="query"
                  defaultValue={workspace.filters.query}
                  placeholder="Search campaigns..."
                  className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
                >
                  Apply search
                </button>
              </div>
            </form>

            <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563eb]">
                Status filters
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {workspace.filters.statusOptions.map((option) => (
                  <Link
                    key={option.key}
                    href={option.href}
                    className={
                      option.isActive
                        ? "rounded-full bg-[#2563eb] px-3 py-1.5 text-sm font-semibold text-white"
                        : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                    }
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563eb]">
                Active result set
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {workspace.filters.activeSummary}
              </p>
              {workspace.filters.query ? (
                <p className="mt-2 text-sm leading-6 text-[#2563eb]">
                  Search query: {workspace.filters.query}
                </p>
              ) : null}
            </div>
          </section>

          {workspace.selectedEntry ? (
            <section className="rounded-[2rem] border border-blue-200/18 bg-blue-200/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/80">
                Selected in library
              </p>
              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-blue-100/72">
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
                    {workspace.selectedEntry.templateVersionLabel ? (
                      <InfoPill>{workspace.selectedEntry.templateVersionLabel}</InfoPill>
                    ) : null}
                    {workspace.selectedEntry.templateImportStatus ? (
                      <InfoPill>
                        import {workspace.selectedEntry.templateImportStatus.replaceAll("_", " ")}
                      </InfoPill>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={workspace.selectedEntry.builderHref}
                    className="inline-flex rounded-full bg-[#2563eb] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
                  >
                    Open builder
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          {workspace.selectedEntry?.templateImportStatus ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563eb]">
                Structured import review
              </p>
              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">
                    {workspace.selectedEntry.name} imported template
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    This campaign now has a structured draft template in the new
                    workflow registry. Review warnings stay visible here so the
                    SOP library can distinguish a real imported draft from a
                    generic review card.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <InfoPill>{workspace.selectedEntry.templateVersionLabel}</InfoPill>
                    <InfoPill>
                      {workspace.selectedEntry.templateImportStatus.replaceAll("_", " ")}
                    </InfoPill>
                    {workspace.selectedEntry.templateProvenanceLabel ? (
                      <InfoPill>{workspace.selectedEntry.templateProvenanceLabel}</InfoPill>
                    ) : null}
                    <InfoPill>{workspace.selectedEntry.templatePhaseCount} phases</InfoPill>
                    <InfoPill>{workspace.selectedEntry.templateSourceCount} sources</InfoPill>
                    <InfoPill>{workspace.selectedEntry.templateSourceGapCount} source gaps</InfoPill>
                  </div>
                </div>
                <div className="grid gap-2">
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                    {workspace.selectedEntry.templateProvenanceLabel ===
                    "package-backed structured draft"
                      ? "This draft is backed by the rollout package and mapped SOP source coverage."
                      : "This draft is structured and runtime-readable, but it still depends on repo-defined campaign artifacts where the rollout package has source gaps."}
                  </p>
                  {workspace.selectedEntry.templateReviewWarnings.length > 0 ? (
                    workspace.selectedEntry.templateReviewWarnings.map((warning) => (
                      <p
                        key={warning}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600"
                      >
                        {warning}
                      </p>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                      No unresolved import warnings are currently recorded.
                    </p>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-2xl font-semibold text-slate-950">Campaign definitions</h2>
            </div>
            {workspace.entries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-5 py-3">Campaign</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Version</th>
                      <th className="px-5 py-3">Import</th>
                      <th className="px-5 py-3">Warnings</th>
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
                          className={isSelected ? "bg-blue-50" : "bg-transparent"}
                        >
                          <td className="border-t border-slate-200 px-5 py-4 align-top">
                            <div className="max-w-md">
                              <p className="font-semibold text-slate-950">{entry.name}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {entry.summary}
                              </p>
                            </div>
                          </td>
                          <td className="border-t border-slate-200 px-5 py-4 align-top">
                            <StatusPill>{entry.status}</StatusPill>
                          </td>
                          <td className="border-t border-slate-200 px-5 py-4 align-top text-sm text-slate-600">
                            {entry.versionLabel}
                          </td>
                          <td className="border-t border-slate-200 px-5 py-4 align-top text-sm text-slate-600">
                            {entry.templateImportStatus
                              ? entry.templateImportStatus.replaceAll("_", " ")
                              : "—"}
                          </td>
                          <td className="border-t border-slate-200 px-5 py-4 align-top text-sm text-slate-600">
                            {entry.templateReviewWarnings.length}
                          </td>
                          <td className="border-t border-slate-200 px-5 py-4 align-top text-sm text-slate-600">
                            {entry.stepsCount}
                          </td>
                          <td className="border-t border-slate-200 px-5 py-4 align-top text-sm text-slate-600">
                            {entry.lastEditedBy}
                          </td>
                          <td className="border-t border-slate-200 px-5 py-4 align-top text-sm text-slate-600">
                            {entry.lastPublishedDate ?? "—"}
                          </td>
                          <td className="border-t border-slate-200 px-5 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={entry.focusHref}
                                aria-current={isSelected ? "page" : undefined}
                                className={
                                  isSelected
                                    ? "inline-flex rounded-full bg-[#2563eb] px-3 py-1.5 text-sm font-semibold text-white"
                                    : "inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                                }
                              >
                                {isSelected ? "Selected" : "Open in library"}
                              </Link>
                              <Link
                                href={entry.builderHref}
                                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700"
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563eb]">
                  No matching campaigns
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                  No campaign definitions match this search yet.
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Keep the route state intact, then clear or loosen the current
                  filters to reopen the broader SOP library.
                </p>
                <Link
                  href={workspace.filters.clearHref}
                  className="mt-4 inline-flex rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
                >
                  Reset library filters
                </Link>
              </section>
            )}
          </section>

          {workspace.selectedEntry ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563eb]">
                Builder entry points
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {workspace.selectedEntry.entryPoints.map((entryPoint) => (
                  <Link
                    key={`${workspace.selectedEntry?.slug}-${entryPoint.label}`}
                    href={entryPoint.href}
                    className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                  >
                    {entryPoint.label}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </AdminAppShell>
  );
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{props.value}</p>
    </article>
  );
}

function FocusStat(props: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563eb]">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{props.value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{props.note}</p>
    </article>
  );
}

function StatusPill(props: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-700">
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
