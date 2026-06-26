import Link from "next/link";
import type { ReactNode } from "react";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getAdminWorkflowsWorkspace } from "@/services/admin-workflows-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import type { WorkflowImportReadiness } from "@/services/sop-rollout-inventory";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminWorkflows");
export const dynamic = "force-dynamic";

type AdminWorkflowsPageProps = {
  searchParams?: Promise<{
    focus?: string;
    section?: string;
  }>;
};

export default async function AdminWorkflowsPage({
  searchParams,
}: AdminWorkflowsPageProps) {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const workspace = getAdminWorkflowsWorkspace(actor, data, resolvedSearchParams);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="workflows"
        builderLink={{
          href: "/admin/sop-builder/rush-month?tab=steps",
          label: "SOP Builder",
        }}
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
                  Admin workflows
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

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MiniStat label="Workflow lanes" value={`${workspace.counts.lanes}`} />
            <MiniStat
              label="Onboarding steps"
              value={`${workspace.counts.onboardingSteps}`}
            />
            <MiniStat
              label="Write operations"
              value={`${workspace.counts.writeOperations}`}
            />
            <MiniStat label="Browser writes" value="0" />
            <MiniStat label="External writes" value="0" />
          </section>

          <section className="app-surface-info rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Registry controls</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Keep the workflow registry route-owned. Each section and selected
                  record should stay on `/admin/workflows` instead of turning into
                  a disconnected backend screen.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {workspace.sectionOptions.map((option) => (
                  <Link
                    key={option.key}
                    href={option.href}
                    aria-current={option.selected ? "page" : undefined}
                    className={
                      option.selected
                        ? "rounded-full bg-[#2563eb] px-3 py-1.5 text-sm font-semibold text-white"
                        : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                    }
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="app-surface-info rounded-[2rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-slate-950">
                {workspace.focusedSection.title}
              </h2>
              <Pill>{workspace.focusedSection.cards.length}</Pill>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {workspace.focusedSection.summary}
            </p>

            {workspace.focusedSection.selectedCard ? (
              <section className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563eb]">
                  Selected in registry
                </p>
                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {workspace.focusedSection.selectedCard.eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">
                      {workspace.focusedSection.selectedCard.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {workspace.focusedSection.selectedCard.detail}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#2563eb]">
                      {workspace.focusedSection.selectedCard.footer}
                    </p>
                    {workspace.focusedSection.selectedCard.pills?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {workspace.focusedSection.selectedCard.pills.map((pill) => (
                          <span
                            key={`${workspace.focusedSection.selectedCard?.key}-${pill}`}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill>{workspace.focusedSection.selectedCard.statusLabel}</Pill>
                    {workspace.focusedSection.selectedCard.href ? (
                      <Link
                        href={workspace.focusedSection.selectedCard.href}
                        className="inline-flex rounded-full bg-[#2563eb] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
                      >
                        {workspace.focusedSection.selectedCard.hrefLabel ?? "Open route"}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {workspace.focusedSection.cards.map((card) => (
                <article
                  key={card.key}
                  className={[
                    "rounded-2xl border p-4",
                    workspace.focusedSection.selectedKey === card.key
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                        {card.eyebrow}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {card.title}
                      </h3>
                    </div>
                    <Pill>{card.statusLabel}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {card.detail}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#2563eb]">
                    {card.footer}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={card.focusHref}
                      aria-current={workspace.focusedSection.selectedKey === card.key ? "page" : undefined}
                      className={
                        workspace.focusedSection.selectedKey === card.key
                          ? "rounded-full bg-[#2563eb] px-3 py-1.5 text-sm font-semibold text-white"
                          : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                      }
                    >
                      {workspace.focusedSection.selectedKey === card.key
                        ? "Selected"
                        : "Open in registry"}
                    </Link>
                    {card.href ? (
                      <Link
                        href={card.href}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                      >
                        {card.hrefLabel ?? "Open route"}
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
                  Rollout package intake
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Workflow inventory
                </h2>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                  This is the normalized workflow inventory coming out of the SOP
                  rollout package and template registry. It keeps core MED International
                  campaigns, adjacent campaigns, source coverage, and import-readiness
                  posture visible in one backend lane.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill>{workspace.rolloutInventory.counts.totalWorkflows} workflows</Pill>
                <Pill>{workspace.rolloutInventory.counts.coreCampaigns} core package</Pill>
                <Pill>{workspace.rolloutInventory.counts.adjacentCampaigns} adjacent</Pill>
                <Pill>
                  {workspace.rolloutInventory.counts.needsPermissionsResolution} permissions pending
                </Pill>
                <Pill>
                  {workspace.rolloutInventory.counts.needsSourceClarification} source clarification
                </Pill>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {workspace.rolloutInventory.workflows.map((workflow) => (
                <article
                  key={workflow.slug}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                        {workflow.isCoreMedInternational ? "Core MED International" : "Adjacent campaign"}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {workflow.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {workflow.summary}
                      </p>
                    </div>
                    <Pill>{formatReadiness(workflow.importReadiness)}</Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {workflow.slug}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {workflow.versionLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {workflow.importStatus.replaceAll("_", " ")}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                      rollout order {workflow.rolloutOrder}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Owner roles
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {workflow.ownerRoles.join(", ").replaceAll("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Target surfaces
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {workflow.targetSurfaces.join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Template coverage
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {workflow.phaseCount} phases, {workflow.stepCount} steps, {workflow.sourceGapCount} source gaps
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Source references
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {workflow.sourceDocumentRefs.slice(0, 2).join(" · ")}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

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

function Pill(props: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

function formatReadiness(readiness: WorkflowImportReadiness) {
  switch (readiness) {
    case "ready_for_draft_import":
      return "ready for draft import";
    case "needs_permissions_resolution":
      return "needs permissions resolution";
    case "needs_figma_mapping":
      return "needs Figma mapping";
    case "needs_source_clarification":
      return "needs source clarification";
    case "blocked_by_security_boundary":
      return "blocked by security boundary";
  }
}
