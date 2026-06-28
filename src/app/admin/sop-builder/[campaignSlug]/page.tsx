import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import {
  buildSopRolePreviewHref,
  getSopRolePreviewLabel,
} from "@/services/sop-role-preview";
import {
  getSopLocalDraftProposalEditor,
  getSopLocalDraftProposals,
  getSopLocalDraftSession,
  getSopLocalDraftSessionEditor,
} from "@/services/sop-local-draft-proposals";
import { getSopBuilderWorkspace } from "@/services/sop-builder-workspace";
import {
  buildWorkflowRolePreviewFields,
  getSopWorkflowRuntime,
  getWorkflowAccessTypeLabel,
  getWorkflowCommunicationRows,
  getWorkflowCommunicationSummary,
  getWorkflowCompletionRows,
  getWorkflowActionRequiredLabel,
  getWorkflowDistinctRoleCount,
  getWorkflowDistinctScopeCount,
  getWorkflowEvidenceTypeEntries,
  getWorkflowIntegrationBoundaryFocusId,
  getWorkflowPreviewDistinctRoleCount,
  getWorkflowPreviewRows,
  getWorkflowRoleImpactRows,
  getWorkflowRolePointsRows,
} from "@/services/sop-workflow-runtime";
import {
  getTemplateBuilderSurface,
  type TemplateBuilderStepView,
  type TemplateBuilderSurface,
} from "@/services/sop-template-builder-read-model";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import type {
  SopBuilderTab,
  SopCampaignDefinition,
  SopRole,
} from "@/shared/types/sop-builder";

export const metadata = getStaticRouteMetadata("adminSopBuilder");
export const dynamic = "force-dynamic";

type AdminSopBuilderPageProps = {
  params: Promise<{
    campaignSlug: string;
  }>;
  searchParams?: Promise<{
    focus?: string;
    mode?: string;
    tab?: string;
  }>;
};

type SopBuilderMode =
  | "filter"
  | "edit_proposal"
  | "edit_draft_session"
  | "add_step"
  | "add_step_after_last"
  | "duplicate_step"
  | "disable_step"
  | "publish"
  | "schedule"
  | "rollback";

export default async function AdminSopBuilderPage(
  props: AdminSopBuilderPageProps,
) {
  const searchParamsPromise: Promise<{ focus?: string; mode?: string; tab?: string }> =
    props.searchParams ??
    Promise.resolve({ focus: undefined, mode: undefined, tab: undefined });
  const [{ campaignSlug }, resolvedSearchParams, actor, data] = await Promise.all([
    props.params,
    searchParamsPromise,
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const workspace = getSopBuilderWorkspace(
    actor,
    campaignSlug,
    resolvedSearchParams.tab,
  );
  const selectedMode = normalizeBuilderMode(resolvedSearchParams.mode);
  const templateBuilderSurface =
    workspace.canReadWorkspace && workspace.definition
      ? getTemplateBuilderSurface(workspace.definition.slug)
      : null;
  const focusWorkspace =
    workspace.canReadWorkspace && workspace.definition
      ? getFocusWorkspace(
          workspace.definition,
          workspace.selectedTab,
          workspace.definition.slug,
          resolvedSearchParams.focus,
          templateBuilderSurface,
        )
      : null;

  if (workspace.canReadWorkspace && !workspace.definition) {
    notFound();
  }

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      {workspace.canReadWorkspace && workspace.definition ? (
        <AdminBackendLaneNav
          current="sop_builder"
          builderLink={{
            href: `/admin/sop-builder/${workspace.definition.slug}?tab=${workspace.selectedTab}`,
            label: `${workspace.definition.name} Builder`,
          }}
          showIntegrations={canReadAdminIntegrationsSecurity(actor)}
        />
      ) : (
        <AdminBackendLaneNav
          current="sop_library"
          showIntegrations={canReadAdminIntegrationsSecurity(actor)}
        />
      )}

      {!workspace.canReadWorkspace || !workspace.definition ? (
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
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
                  SOP builder
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {workspace.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {workspace.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill>{workspace.definition.libraryStatus}</Pill>
                  <Pill>{workspace.definition.version.currentLabel}</Pill>
                  <Pill>{workspace.definition.builderStatus.replaceAll("_", " ")}</Pill>
                  {workspace.templateReview ? (
                    <Pill>
                      import {workspace.templateReview.importStatus.replaceAll("_", " ")}
                    </Pill>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <ToplineFocusCard
                    label="Current tab"
                    value={getBuilderTabDisplayLabel(workspace.selectedTab)}
                    note={workspace.workbench?.title ?? "Builder workspace"}
                  />
                  <ToplineFocusCard
                    label="Current focus"
                    value={focusWorkspace?.selected?.title ?? workspace.workbench?.defaultFocusLabel ?? "Open default focus"}
                    note={
                      focusWorkspace?.selected?.eyebrow ??
                      "Selected route-owned builder record"
                    }
                  />
                  <ToplineFocusCard
                    label="Builder posture"
                    value="Mock-safe"
                    note="0 browser writes · 0 external writes"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/sop-library"
                  className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Library
                </Link>
                <Link
                  href={`/admin/sop-builder/${workspace.definition.slug}?tab=preview`}
                  className="w-fit rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Preview
                </Link>
                <Link
                  href={`/admin/sop-builder/${workspace.definition.slug}?tab=version&focus=current-version`}
                  className="w-fit rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
                >
                  Publish
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MiniStat label="Steps" value={`${workspace.counts.steps}`} />
            <MiniStat label="Role rules" value={`${workspace.counts.roleRules}`} />
            <MiniStat
              label="Completion rules"
              value={`${workspace.counts.completionRules}`}
            />
            <MiniStat label="Browser writes" value="0" />
            <MiniStat label="External writes" value="0" />
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
                  {workspace.definition.version.currentLabel}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {workspace.definition.name}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {workspace.definition.version.summary}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {workspace.tabs.map((tab) => (
                  <div key={tab.key} className="relative">
                    <span
                      aria-hidden="true"
                      className={[
                        "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition",
                        tab.selected ? "text-[var(--mymedlife-primary-button)]" : "text-slate-400",
                      ].join(" ")}
                    >
                      <BuilderTabIcon tab={tab.key} />
                    </span>
                    <Link
                      href={tab.href}
                      className={
                      tab.selected
                          ? "block rounded-full bg-[var(--mymedlife-primary-button)] px-3 py-1.5 pl-9 text-sm font-semibold text-white"
                          : "block rounded-full border border-slate-200 bg-white px-3 py-1.5 pl-9 text-sm font-semibold text-slate-700"
                      }
                    >
                      {tab.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {workspace.workbench ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
                    Tab workbench
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {workspace.workbench.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {workspace.workbench.summary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {workspace.workbench.defaultFocusHref ? (
                    <Link
                      href={workspace.workbench.defaultFocusHref}
                      className="rounded-full bg-[var(--mymedlife-badge-background)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-info)]"
                    >
                      Open default focus
                    </Link>
                  ) : null}
                  {workspace.workbench.adjacentTabs.map((tab) => (
                    <Link
                      key={tab.key}
                      href={tab.href}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                    >
                      {tab.label}
                    </Link>
                  ))}
                  </div>
                </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    {workspace.workbench.stats.map((stat) => (
                      <article
                        key={stat.label}
                        className="rounded-[1.35rem] border border-slate-200 bg-[var(--background)] p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-primary-button)]">
                          {stat.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">
                          {stat.value}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {stat.note}
                        </p>
                      </article>
                    ))}
                  </div>

                  {focusWorkspace?.selected ? (
                    <article className="rounded-[1.35rem] border border-[var(--mymedlife-border)] bg-[var(--mymedlife-surface-tint)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-primary-button)]">
                        Current workbench focus
                      </p>
                      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
                            {focusWorkspace.selected.eyebrow}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-950">
                            {focusWorkspace.selected.title}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {focusWorkspace.selected.detail}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Pill>{focusWorkspace.selected.status.replaceAll("_", " ")}</Pill>
                          {focusWorkspace.selected.previewHref ? (
                            <Link
                              href={focusWorkspace.selected.previewHref}
                              className="inline-flex rounded-full bg-[var(--mymedlife-badge-background)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-info)]"
                            >
                              {focusWorkspace.selected.previewLabel ?? "Open role preview"}
                            </Link>
                          ) : null}
                          {focusWorkspace.selected.href ? (
                            <Link
                              href={focusWorkspace.selected.href}
                              className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                            >
                              {focusWorkspace.selected.hrefLabel ?? "Open route"}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ) : null}
                </div>

                <article className="rounded-[1.35rem] border border-slate-200 bg-[var(--mymedlife-surface-tint)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-primary-button)]">
                    Guardrails
                  </p>
                  <ul className="mt-3 grid gap-3">
                    {workspace.workbench.guardrails.map((item) => (
                      <li
                        key={item}
                        className="rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Default focus: {workspace.workbench.defaultFocusLabel}
                  </p>
                </article>
              </div>
            </section>
          ) : null}

          {workspace.templateReview ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
                    Structured import review
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {workspace.templateReview.versionLabel} import posture
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {workspace.templateReview.workflowName} is now available as a
                    structured draft template for this campaign. The warnings
                    below stay visible until the imported draft is fully
                    reconciled and human-approved.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill>{workspace.templateReview.importStatus.replaceAll("_", " ")}</Pill>
                    <Pill>{workspace.templateReview.provenanceLabel}</Pill>
                    <Pill>{workspace.templateReview.coachPdfPages} coach pages</Pill>
                    <Pill>
                      {workspace.templateReview.chapterPlatformPdfPages} chapter pages
                    </Pill>
                    <Pill>{workspace.templateReview.sourceReferenceCount} sources</Pill>
                    <Pill>{workspace.templateReview.sourceGapCount} source gaps</Pill>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <ToplineFocusCard
                    label="Imported phases"
                    value={`${workspace.templateReview.phaseCount}`}
                    note="Structured campaign phases currently in the draft template"
                  />
                  <ToplineFocusCard
                    label="Imported steps"
                    value={`${workspace.templateReview.stepCount}`}
                    note="Structured steps extracted into the template registry"
                  />
                  <ToplineFocusCard
                    label="Warnings"
                    value={`${workspace.templateReview.unresolvedAmbiguities.length}`}
                    note="Open import-review items that still need human reconciliation"
                  />
                  <ToplineFocusCard
                    label="Suggested order"
                    value={`${workspace.templateReview.suggestedRolloutOrder}`}
                    note="Current rollout position from the structured review summary"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-primary-button)]">
                    Sensitive data warnings
                  </p>
                  <p className="mt-3 rounded-[1rem] border border-slate-200 bg-[var(--background)] px-3 py-3 text-sm leading-6 text-slate-700">
                    {workspace.templateReview.provenanceLabel ===
                    "package-backed structured draft"
                      ? "This template is grounded in the rollout package and mapped SOP source coverage."
                      : "This template is structured and usable in the runtime, but still leans on repo-defined campaign artifacts where the rollout package has source gaps."}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {workspace.templateReview.sensitiveDataWarnings.map((warning) => (
                      <p
                        key={warning}
                        className="rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700"
                      >
                        {warning}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-primary-button)]">
                    Unresolved import warnings
                  </p>
                  <div className="mt-3 grid gap-2">
                    {workspace.templateReview.unresolvedAmbiguities.map((warning) => (
                      <p
                        key={warning}
                        className="rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700"
                      >
                        {warning}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-primary-button)]">
                  Source perspectives
                </p>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {workspace.templateReview.sourcePerspectives.map((perspective) => (
                    <article
                      key={perspective.key}
                      className="rounded-[1rem] border border-slate-200 bg-[var(--mymedlife-surface-tint)] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-950">
                          {perspective.label}
                        </p>
                        <Pill>{perspective.pdfPages}</Pill>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {perspective.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {perspective.primaryRoles.map((role) => (
                          <Pill key={`${perspective.key}-${role}`}>{role}</Pill>
                        ))}
                      </div>
                      <ul className="mt-3 grid gap-2 text-sm text-slate-600">
                        {perspective.primaryRoutes.map((route) => (
                          <li
                            key={`${perspective.key}-${route}`}
                            className="rounded-[0.9rem] border border-slate-200 bg-white px-3 py-2"
                          >
                            {route}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {workspace.definition && selectedMode ? (
            <BuilderModeNotice
              notice={getBuilderModeNotice(
                workspace.definition,
                workspace.selectedTab,
                workspace.definition.slug,
                focusWorkspace?.selected?.id,
                selectedMode,
              )}
            />
          ) : null}

          {renderSelectedTab(
            workspace.definition,
            workspace.selectedTab,
            focusWorkspace ?? getFocusWorkspace(
              workspace.definition,
              workspace.selectedTab,
              workspace.definition.slug,
              resolvedSearchParams.focus,
              templateBuilderSurface,
            ),
            templateBuilderSurface,
          )}
        </>
      )}
    </AdminAppShell>
  );
}

function renderSelectedTab(
  definition: SopCampaignDefinition,
  selectedTab: SopBuilderTab,
  focusWorkspace: BuilderFocusWorkspace,
  templateBuilderSurface: TemplateBuilderSurface | null,
) {
  switch (selectedTab) {
    case "steps":
      return (
        <StepsBuilderSection
          definition={definition}
          focusWorkspace={focusWorkspace}
          templateBuilderSurface={templateBuilderSurface}
        />
      );
    case "role-matrix":
      return (
        <RoleMatrixSection
          definition={definition}
          focusWorkspace={focusWorkspace}
          templateBuilderSurface={templateBuilderSurface}
        />
      );
    case "completion":
      return (
        <CompletionSection
          definition={definition}
          focusWorkspace={focusWorkspace}
        />
      );
    case "points-kpi":
      return (
        <PointsKpiSection
          definition={definition}
          focusWorkspace={focusWorkspace}
          templateBuilderSurface={templateBuilderSurface}
        />
      );
    case "comms":
      return (
        <CommsSection
          definition={definition}
          focusWorkspace={focusWorkspace}
          templateBuilderSurface={templateBuilderSurface}
        />
      );
    case "preview":
      return (
        <RolePreviewSection
          definition={definition}
          focusWorkspace={focusWorkspace}
          templateBuilderSurface={templateBuilderSurface}
        />
      );
    case "version":
      return (
        <VersionReviewSection
          definition={definition}
          focusWorkspace={focusWorkspace}
          templateBuilderSurface={templateBuilderSurface}
        />
      );
  }
}

type BuilderFocusCard = {
  id: string;
  title: string;
  eyebrow: string;
  status: string;
  detail: string;
  footer: string;
  focusHref: string;
  href?: string;
  hrefLabel?: string;
  previewHref?: string;
  previewLabel?: string;
  pills?: readonly string[];
};

type BuilderFocusWorkspace = {
  cards: readonly BuilderFocusCard[];
  selected: BuilderFocusCard | null;
};

function getFocusWorkspace(
  definition: SopCampaignDefinition,
  selectedTab: SopBuilderTab,
  campaignSlug: string,
  focusId: string | undefined,
  templateBuilderSurface: TemplateBuilderSurface | null,
): BuilderFocusWorkspace {
  const cards = getFocusCards(
    definition,
    selectedTab,
    campaignSlug,
    templateBuilderSurface,
  );
  const selected =
    cards.find((card) => card.id === focusId) ??
    cards[0] ??
    null;

  return {
    cards: cards.map((card) => ({
      ...card,
      focusHref: buildSopBuilderHref(campaignSlug, selectedTab, card.id),
    })),
    selected,
  };
}

function getFocusCards(
  definition: SopCampaignDefinition,
  selectedTab: SopBuilderTab,
  campaignSlug: string,
  templateBuilderSurface: TemplateBuilderSurface | null,
): BuilderFocusCard[] {
  switch (selectedTab) {
    case "steps":
      if (templateBuilderSurface?.steps.length) {
        return templateBuilderSurface.steps.map((step) => ({
          id: step.id,
          title: step.title,
          eyebrow: step.phaseLabel,
          status: getTemplateFocusStatus(step.sourceCertainty),
          detail: step.objective,
          footer: `Outputs: ${step.expectedOutputs.join(", ") || "none named"}`,
          href: step.visibleRoutes[0],
          hrefLabel: "Open linked route",
          ...(step.visibleRoutes[0]
            ? buildWorkflowRolePreviewFields(step.primaryOwnerRole, step.visibleRoutes[0])
            : {}),
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, step.id),
          pills: [
            toReadableRole(step.primaryOwnerRole),
            ...step.kpiLabels,
          ],
        }));
      }

      return definition.steps.map((step) => ({
        id: step.id,
        title: step.title,
        eyebrow: step.phaseLabel,
        status: step.status,
        detail: step.whyItMatters,
        footer: `Completion signal: ${step.completionSignal}`,
        href: step.linkedRoute,
        hrefLabel: "Open linked route",
        ...buildWorkflowRolePreviewFields(step.ownerRole, step.linkedRoute),
        focusHref: buildSopBuilderHref(campaignSlug, selectedTab, step.id),
        pills: [step.ownerRole],
      }));
    case "role-matrix":
      if (templateBuilderSurface?.roleMatrix.length) {
        return templateBuilderSurface.roleMatrix.map((rule) => ({
          id: rule.id,
          title: toReadableRole(rule.role),
          eyebrow: "Role matrix",
          status: rule.blockedByDefault ? "blocked" : "ready_readonly",
          detail: rule.actionSummary,
          footer: `Routes: ${rule.visibleRoutes.join(", ") || "none mapped yet"}`,
          href: rule.visibleRoutes[0],
          hrefLabel: "Open role route",
          ...(rule.visibleRoutes[0]
            ? buildWorkflowRolePreviewFields(rule.role, rule.visibleRoutes[0])
            : {}),
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, rule.id),
          pills: [rule.scope, ...rule.kpiLabels],
        }));
      }

      return definition.roleActionRules.map((rule) => ({
        id: rule.id,
        title: rule.role,
        eyebrow: "Role matrix",
        status: rule.status,
        detail: rule.actionSummary,
        footer: `Guardrail: ${rule.guardrail}`,
        href: rule.route,
        hrefLabel: "Open role route",
        ...buildWorkflowRolePreviewFields(rule.role, rule.route),
        focusHref: buildSopBuilderHref(campaignSlug, selectedTab, rule.id),
        pills: [rule.scope],
      }));
    case "completion":
      if (templateBuilderSurface?.completionRows.length) {
        return [
          ...templateBuilderSurface.completionRows.map((row) => ({
            id: row.id,
            title: row.title,
            eyebrow:
              row.rowType === "completion"
                ? "Completion rule"
                : row.rowType === "evidence"
                  ? "Evidence rule"
                  : "Approval rule",
            status: getTemplateFocusStatus(row.sourceCertainty),
            detail: row.detail,
            footer: row.footer,
            focusHref: buildSopBuilderHref(campaignSlug, selectedTab, row.id),
            pills: row.linkedStepLabels,
          })),
          ...templateBuilderSurface.riskRows.map((row) => ({
            id: row.id,
            title: row.title,
            eyebrow: "Risk rule",
            status: getTemplateFocusStatus(row.sourceCertainty),
            detail: row.triggerCondition,
            footer: `Severity: ${row.severity}`,
            focusHref: buildSopBuilderHref(campaignSlug, selectedTab, row.id),
            pills: row.linkedStepLabels,
          })),
          ...templateBuilderSurface.escalationRows.map((row) => ({
            id: row.id,
            title: row.title,
            eyebrow: "Escalation rule",
            status: getTemplateFocusStatus(row.sourceCertainty),
            detail: row.action,
            footer: `Owner roles: ${row.ownerRoles.map(toReadableRole).join(", ")}`,
            focusHref: buildSopBuilderHref(campaignSlug, selectedTab, row.id),
            pills: row.linkedStepLabels.length
              ? row.linkedStepLabels
              : row.ownerRoles.map(toReadableRole),
          })),
          ...templateBuilderSurface.closeoutRows.map((row) => ({
            id: row.id,
            title: row.title,
            eyebrow: "Closeout requirement",
            status: getTemplateFocusStatus(row.sourceCertainty),
            detail: row.description,
            footer: `Required by: ${row.requiredByRoles.map(toReadableRole).join(", ")}`,
            focusHref: buildSopBuilderHref(campaignSlug, selectedTab, row.id),
            pills: row.requiredByRoles.map(toReadableRole),
          })),
        ];
      }

      return [
        ...definition.completionRules.map((rule) => ({
          id: rule.id,
          title: rule.label,
          eyebrow: "Completion rule",
          status: rule.status,
          detail: rule.successSignal,
          footer: `Evidence: ${rule.evidenceNeeded}`,
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, rule.id),
        })),
        ...definition.evidenceRules.map((rule) => ({
          id: rule.id,
          title: rule.label,
          eyebrow: "Evidence rule",
          status: rule.status,
          detail: rule.storagePosture,
          footer: `Formats: ${rule.acceptedFormats.join(", ")}`,
          href: rule.route,
          hrefLabel: "Open route",
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, rule.id),
        })),
        ...definition.approvalRules.map((rule) => ({
          id: rule.id,
          title: rule.label,
          eyebrow: "Approval rule",
          status: rule.status,
          detail: rule.outcome,
          footer: `Reviewer: ${rule.reviewerRole}`,
          href: rule.route,
          hrefLabel: "Open route",
          ...buildWorkflowRolePreviewFields(rule.reviewerRole, rule.route),
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, rule.id),
        })),
      ];
    case "points-kpi":
      if (templateBuilderSurface?.pointsRows.length) {
        return [
          ...templateBuilderSurface.pointsRows.map((row) => ({
            id: row.id,
            title: toReadableRole(row.role),
            eyebrow: "Points & KPI",
            status: "ready_readonly",
            detail: `${row.ruleLabels.join(", ") || "No point rule named"} · ${row.pointValues.join(", ")} points`,
            footer: `KPI: ${row.kpiLabels.join(", ") || "none named"}`,
            focusHref: buildSopBuilderHref(campaignSlug, selectedTab, row.id),
            pills: [...row.approvalLabels, ...row.repeatabilityLabels],
          })),
          ...templateBuilderSurface.kpiRows.map((row) => ({
            id: row.id,
            title: row.label,
            eyebrow: "KPI rule",
            status: getTemplateFocusStatus(row.sourceCertainty),
            detail:
              row.targetValue !== null
                ? `Target ${row.targetValue} · ${row.thresholdLabel ?? "No threshold note"}`
                : row.thresholdLabel ?? "No threshold note",
            footer: `Metric key: ${row.metricKey}`,
            focusHref: buildSopBuilderHref(campaignSlug, selectedTab, row.id),
            pills: [...row.linkedRoleLabels, ...row.linkedStepLabels],
          })),
        ];
      }

      return [
        ...definition.pointsRules.map((rule) => ({
          id: rule.id,
          title: `${rule.points} points`,
          eyebrow: "Points rule",
          status: rule.status,
          detail: rule.label,
          footer: rule.trigger,
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, rule.id),
        })),
        ...definition.kpiRules.map((rule) => ({
          id: rule.id,
          title: rule.displayLabel,
          eyebrow: "KPI rule",
          status: rule.status,
          detail: rule.sourceOfTruth,
          footer: rule.metricKey,
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, rule.id),
        })),
      ];
    case "comms":
      if (templateBuilderSurface) {
        return [
          ...templateBuilderSurface.commRows.map((row) => ({
            id: row.id,
            title: row.title,
            eyebrow: "Communication trigger",
            status:
              row.mockStatus === "mock_only"
                ? "mock_only"
                : row.mockStatus === "approval_required"
                  ? "blocked"
                  : "ready_readonly",
            detail: row.detail,
            footer: `Audience: ${row.audience}`,
            focusHref: buildSopBuilderHref(campaignSlug, selectedTab, row.id),
            pills: [row.sourceSystem, row.timing],
          })),
          ...templateBuilderSurface.integrationBoundaries.map((boundary) => ({
            id: boundary.id,
            title: boundary.system,
            eyebrow: "Integration boundary",
            status:
              boundary.mode === "disabled_pending_approval"
                ? "blocked"
                : "ready_readonly",
            detail: boundary.detail,
            footer: `Mode: ${boundary.mode}`,
            focusHref: buildSopBuilderHref(campaignSlug, selectedTab, boundary.id),
            pills: boundary.eventNames,
          })),
        ];
      }

      return [
        ...definition.communicationRules.map((rule) => ({
          id: rule.id,
          title: rule.trigger,
          eyebrow: "Communication trigger",
          status: rule.deliveryMode === "disabled" ? "blocked" : "ready_readonly",
          detail: rule.detail,
          footer: `Audience: ${rule.audience}`,
          pills: [rule.deliveryMode],
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, rule.id),
        })),
        ...definition.integrationBoundaries.map((boundary) => ({
          id: `boundary-${boundary.system.toLowerCase().replaceAll(" ", "-")}`,
          title: boundary.system,
          eyebrow: "Integration boundary",
          status: boundary.mode === "disabled" ? "blocked" : "ready_readonly",
          detail: boundary.note,
          footer: `Mode: ${boundary.mode}`,
          focusHref: buildSopBuilderHref(
            campaignSlug,
            selectedTab,
            `boundary-${boundary.system.toLowerCase().replaceAll(" ", "-")}`,
          ),
        })),
      ];
    case "preview":
      if (templateBuilderSurface?.previewScenarios.length) {
        return templateBuilderSurface.previewScenarios.map((scenario) => ({
          id: scenario.id,
          title: scenario.title,
          eyebrow: "Preview scenario",
          status: getTemplateFocusStatus(scenario.sourceCertainty),
          detail: scenario.successSignal,
          footer: `Primary role: ${toReadableRole(scenario.primaryRole)}`,
          href: scenario.route,
          hrefLabel: "Open raw route",
          ...buildWorkflowRolePreviewFields(scenario.primaryRole, scenario.route),
          pills: scenario.visibleStates,
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, scenario.id),
        }));
      }

      return definition.previewScenarios.map((scenario) => ({
        id: scenario.id,
        title: scenario.title,
        eyebrow: "Preview scenario",
        status: "ready_readonly",
        detail: scenario.successSignal,
        footer: `Primary role: ${scenario.primaryRole}`,
        href: scenario.route,
        hrefLabel: "Open raw route",
        previewHref: buildSopRolePreviewHref(scenario.primaryRole, scenario.route),
        previewLabel: `Preview as ${getSopRolePreviewLabel(scenario.primaryRole)}`,
        pills: scenario.visibleStates,
        focusHref: buildSopBuilderHref(campaignSlug, selectedTab, scenario.id),
      }));
    case "version":
      return [
        {
          id: "current-version",
          title: definition.version.currentLabel,
          eyebrow: "Current template posture",
          status:
            definition.version.state === "draft"
              ? "mock_only"
              : "ready_readonly",
          detail: definition.version.summary,
          footer: `${definition.version.updatedLabel} · ${definition.version.state.replaceAll("_", " ")}`,
          pills: [
            definition.builderStatus.replaceAll("_", " "),
            definition.shellStatus,
          ],
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, "current-version"),
        },
        ...definition.version.history.map((entry, index) => ({
          id: `version-${index}`,
          title: entry.label,
          eyebrow: "Version history",
          status:
            entry.state === "approved_template" ? "ready_readonly" : "mock_only",
          detail: entry.summary,
          footer: entry.updatedLabel,
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, `version-${index}`),
        })),
        ...(!templateBuilderSurface
          ? definition.auditRecords.map((record) => ({
              id: record.id,
              title: record.eventType,
              eyebrow: "Audit expectation",
              status: "ready_readonly",
              detail: record.auditExpectation,
              footer: record.targetTable,
              href: record.route,
              hrefLabel: "Open route",
              focusHref: buildSopBuilderHref(campaignSlug, selectedTab, record.id),
            }))
          : []),
        ...(templateBuilderSurface
          ? [
              ...templateBuilderSurface.featureFlagRows.map((flag) => ({
                id: flag.id,
                title: flag.flagKey,
                eyebrow: "Feature flag",
                status: getTemplateFocusStatus(flag.sourceCertainty),
                detail: flag.description,
                footer: `${flag.defaultState} by default · ${flag.rolloutStage.replaceAll("_", " ")}`,
                focusHref: buildSopBuilderHref(campaignSlug, selectedTab, flag.id),
                pills: [flag.defaultState, flag.rolloutStage.replaceAll("_", " ")],
              })),
              ...templateBuilderSurface.integrationBoundaries.map((boundary) => ({
                id: boundary.id,
                title: boundary.system,
                eyebrow: "Integration boundary",
                status:
                  boundary.mode === "disabled_pending_approval"
                    ? "blocked"
                    : "ready_readonly",
                detail: boundary.detail,
                footer: `Mode: ${boundary.mode.replaceAll("_", " ")}`,
                focusHref: buildSopBuilderHref(campaignSlug, selectedTab, boundary.id),
                pills: boundary.eventNames,
              })),
              ...templateBuilderSurface.auditRows.map((record) => ({
                id: record.id,
                title: record.eventType,
                eyebrow: "Audit posture",
                status: record.required ? "ready_readonly" : "mock_only",
                detail: record.detail,
                footer:
                  record.linkedOutboxTopics.length > 0
                    ? `Outbox topics: ${record.linkedOutboxTopics.join(", ")}`
                    : "No outbox topic linked on the imported draft",
                focusHref: buildSopBuilderHref(campaignSlug, selectedTab, record.id),
                pills: [
                  record.required ? "required" : "optional",
                  ...record.linkedIntegrationEvents,
                ],
              })),
              ...templateBuilderSurface.scriptTemplates.map((template) => ({
                id: template.id,
                title: template.title,
                eyebrow: "Script template",
                status: getTemplateFocusStatus(template.sourceCertainty),
                detail: template.summary,
                footer: `Audience: ${template.audience}`,
                focusHref: buildSopBuilderHref(campaignSlug, selectedTab, template.id),
                pills: [template.audience],
              })),
              ...templateBuilderSurface.resourceLinks.map((resource) => ({
                id: resource.id,
                title: resource.label,
                eyebrow: "Resource link",
                status: getTemplateFocusStatus(resource.sourceCertainty),
                detail: resource.href,
                footer: "Linked rollout/source reference",
                href: resource.href,
                hrefLabel: "Open reference",
                focusHref: buildSopBuilderHref(campaignSlug, selectedTab, resource.id),
              })),
            ]
          : []),
        ...getSopLocalDraftProposals(campaignSlug).map((proposal) => ({
          id: proposal.id,
          title: proposal.title,
          eyebrow: "Local draft proposal",
          status: proposal.status,
          detail: proposal.summary,
          footer: proposal.rationale,
          href: proposal.sourceRoute,
          hrefLabel: "Open source route",
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, proposal.id),
          pills: proposal.affectedRoles.map((role) => toReadableRole(role)),
        })),
        ...(getSopLocalDraftSession(campaignSlug)
          ? [
              {
                id: `draft-session-${campaignSlug}`,
                title: getSopLocalDraftSession(campaignSlug)?.title ?? "Local draft session",
                eyebrow: "Draft session package",
                status: "draft_session",
                detail:
                  getSopLocalDraftSession(campaignSlug)?.summary ??
                  "Bundled local proposal package",
                footer: `${getSopLocalDraftSession(campaignSlug)?.proposalIds.length ?? 0} proposals bundled`,
                focusHref: buildSopBuilderHref(
                  campaignSlug,
                  selectedTab,
                  `draft-session-${campaignSlug}`,
                ),
                pills:
                  getSopLocalDraftSession(campaignSlug)?.affectedRoles.map((role) =>
                    toReadableRole(role),
                  ) ?? [],
              },
            ]
          : []),
      ];
  }
}

function buildSopBuilderHref(
  campaignSlug: string,
  tab: SopBuilderTab,
  focusId?: string,
  mode?: SopBuilderMode | null,
) {
  const searchParams = new URLSearchParams();
  searchParams.set("tab", tab);

  if (focusId) {
    searchParams.set("focus", focusId);
  }

  if (mode) {
    searchParams.set("mode", mode);
  }

  return `/admin/sop-builder/${campaignSlug}?${searchParams.toString()}`;
}

function normalizeBuilderMode(requestedMode?: string): SopBuilderMode | null {
  switch (requestedMode) {
    case "filter":
    case "edit_proposal":
    case "edit_draft_session":
    case "add_step":
    case "add_step_after_last":
    case "duplicate_step":
    case "disable_step":
    case "publish":
    case "schedule":
    case "rollback":
      return requestedMode;
    default:
      return null;
  }
}

function BuilderFilterLink(props: {
  campaignSlug: string;
  tab: SopBuilderTab;
  focusId?: string;
}) {
  return (
    <Link
      href={buildSopBuilderHref(props.campaignSlug, props.tab, props.focusId, "filter")}
      className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
    >
      Filter
    </Link>
  );
}

function BuilderFocusLink(props: {
  campaignSlug: string;
  tab: SopBuilderTab;
  focusId: string;
  selected: boolean;
}) {
  return (
    <Link
      href={buildSopBuilderHref(props.campaignSlug, props.tab, props.focusId)}
      aria-current={props.selected ? "page" : undefined}
      className={
        props.selected
          ? "inline-flex rounded-full bg-[var(--mymedlife-border)] px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-on-gold)]"
          : "inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
      }
    >
      {props.selected ? "Selected" : "Open in workspace"}
    </Link>
  );
}

function getBuilderModeNotice(
  definition: SopCampaignDefinition,
  selectedTab: SopBuilderTab,
  campaignSlug: string,
  focusId: string | undefined,
  mode: SopBuilderMode,
) {
  const focusWorkspace = getFocusWorkspace(
    definition,
    selectedTab,
    campaignSlug,
    focusId,
    getTemplateBuilderSurface(definition.slug),
  );
  const selectedLabel =
    focusWorkspace.selected?.title ?? getBuilderTabDisplayLabel(selectedTab);
  const clearHref = buildSopBuilderHref(
    campaignSlug,
    selectedTab,
    focusWorkspace.selected?.id,
  );

  switch (mode) {
    case "filter":
      return {
        title: "Filter review state",
        summary:
          "This route keeps the filter posture visible on the same builder tab before any editable filter presets or saved views exist. Reviewers can inspect how a narrower workflow slice should read without opening a separate screen.",
        pills: [getBuilderTabDisplayLabel(selectedTab), selectedLabel],
        clearHref,
        guardrails: [
          "Filtering should narrow the current builder surface, not hide the selected workflow context.",
          "No saved-view mutation or preference write runs from this review state.",
          "Keep route state readable enough that a reviewer can share the exact filtered URL.",
        ],
      };
    case "edit_proposal": {
      const proposalEditor = focusWorkspace.selected
        ? getSopLocalDraftProposalEditor(focusWorkspace.selected.id)
        : null;

      return {
        title: proposalEditor
          ? proposalEditor.title
          : `Edit proposal: ${selectedLabel}`,
        summary:
          proposalEditor?.summary ??
          "This route reserves proposal editing inside the builder version lane, but the selected record is not a typed local draft proposal.",
        pills: ["version review", selectedLabel, "draft proposal"],
        clearHref,
        guardrails:
          proposalEditor?.guardrails ?? [
            "Proposal editing is limited to typed local draft proposals.",
            "No template, role, or permission write runs from this review state.",
            "Use the source route when the selected record is not proposal-backed.",
          ],
        rows: proposalEditor?.draftFields.map((field) => ({
          label: field.label,
          value: `${field.currentValue} -> ${field.draftValue}`,
          note: field.note,
        })),
      };
    }
    case "edit_draft_session": {
      const sessionEditor = getSopLocalDraftSessionEditor(campaignSlug);

      return {
        title:
          sessionEditor?.title ?? `Edit draft session: ${selectedLabel}`,
        summary:
          sessionEditor?.summary ??
          "This route reserves campaign-level draft session editing in the builder version lane.",
        pills: ["version review", selectedLabel, "draft session"],
        clearHref,
        guardrails:
          sessionEditor?.guardrails ?? [
            "Draft session editing is limited to campaign-scoped local proposal packages.",
            "No template, role, permission, or publish write runs from this review state.",
            "Use the source routes when the campaign has no bundled local draft session.",
          ],
        rows: sessionEditor?.draftRows,
      };
    }
    case "add_step":
      return {
        title: `Add step after ${selectedLabel}`,
        summary:
          "This mock-safe state shows where a new workflow step would land and what context should stay preserved before the real step editor is allowed to mutate the template.",
        pills: ["step flow", selectedLabel],
        clearHref,
        guardrails: [
          "New steps must remain attached to the same campaign phase and surrounding route-owned workflow context.",
          "Adding a step here cannot reorder, persist, or publish the template.",
          "Use this state to review insertion intent before any editable step form exists.",
        ],
      };
    case "add_step_after_last":
      return {
        title: "Add step after last visible stage",
        summary:
          "This route captures the end-of-flow insertion posture so staff can review how a new final step would extend the current campaign without treating the builder like a live editor.",
        pills: ["step flow", "end of sequence"],
        clearHref,
        guardrails: [
          "The final step should still inherit the campaign's route ownership and downstream review boundaries.",
          "No new step is persisted from this route.",
          "Sequence review stays visible before any approved workflow mutation path exists.",
        ],
      };
    case "duplicate_step":
      return {
        title: `Duplicate step: ${selectedLabel}`,
        summary:
          "This review state preserves the selected step context so staff can inspect what should copy forward, what must be renamed, and which route and proof rules should never duplicate blindly.",
        pills: ["step review", selectedLabel],
        clearHref,
        guardrails: [
          "Duplicated steps should never silently inherit live approval or communication behavior.",
          "Review the linked route, proof posture, and KPI tag before any actual duplicate is created.",
          "No template mutation or version history entry happens from this state.",
        ],
      };
    case "disable_step":
      return {
        title: `Disable step: ${selectedLabel}`,
        summary:
          "This route holds the disable/archive posture on the same builder surface so reviewers can inspect downstream impact before a step is removed from the visible flow.",
        pills: ["step review", "disable/archive"],
        clearHref,
        guardrails: [
          "Disabling a step should keep the surrounding workflow readable instead of collapsing the sequence without explanation.",
          "Review role, proof, and points impact before any archive behavior exists.",
          "No step is hidden or removed from the local definition here.",
        ],
      };
    case "publish":
      return {
        title: `Publish review: ${selectedLabel}`,
        summary:
          "This route captures the publish decision as a review state only. It keeps draft, live comparison, impact counts, and audit expectations visible without changing the active template.",
        pills: ["version review", "publish"],
        clearHref,
        guardrails: [
          "Publishing remains blocked until an approved mutation path exists.",
          "Version review must stay attached to impact, audit, and downstream hold posture.",
          "No live workflow or external send changes from this route.",
        ],
      };
    case "schedule":
      return {
        title: `Schedule review: ${selectedLabel}`,
        summary:
          "This mock-safe state frames the later publish posture so reviewers can inspect timing, impact, and rollback expectations before scheduled release behavior exists.",
        pills: ["version review", "schedule later"],
        clearHref,
        guardrails: [
          "Scheduling should stay visible as a version decision, not a hidden background setting.",
          "No queued publish job or calendar write runs from this route.",
          "Rollback expectations still need to remain visible beside the draft/live comparison.",
        ],
      };
    case "rollback":
      return {
        title: `Rollback review: ${selectedLabel}`,
        summary:
          "This state keeps rollback intent route-owned so staff can review what would be restored and what evidence should remain visible before any template reversal behavior exists.",
        pills: ["version review", "rollback"],
        clearHref,
        guardrails: [
          "Rollback should restore workflow posture without hiding why the reversal was considered.",
          "Audit expectations must stay visible beside the rollback decision.",
          "No history entry or live template swap occurs from this route.",
        ],
      };
  }
}

function BuilderTabIcon({ tab }: { tab: SopBuilderTab }) {
  const iconClassName = "h-[1rem] w-[1rem]";

  switch (tab) {
    case "steps":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M8 6h11" />
          <path d="M8 12h11" />
          <path d="M8 18h11" />
          <circle cx="4.5" cy="6" r="1.5" />
          <circle cx="4.5" cy="12" r="1.5" />
          <circle cx="4.5" cy="18" r="1.5" />
        </svg>
      );
    case "role-matrix":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M12 5v14" />
          <path d="M5 9h14" />
          <path d="M5 15h14" />
        </svg>
      );
    case "completion":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M5 12.5 9.2 16.5 19 7.5" />
        </svg>
      );
    case "points-kpi":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M5 19V9" />
          <path d="M10 19V5" />
          <path d="M15 19v-7" />
          <path d="M20 19v-4" />
        </svg>
      );
    case "comms":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M5 7.5h14v9H9l-4 3v-12Z" />
        </svg>
      );
    case "preview":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "version":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M12 4v4" />
          <path d="M12 12v8" />
          <path d="M8 8h8" />
        </svg>
      );
  }
}

function getTemplateFocusStatus(sourceCertainty: string) {
  switch (sourceCertainty) {
    case "repo_only_placeholder":
    case "missing_source_confirmation":
      return "mock_only";
    default:
      return "ready_readonly";
  }
}

function uniqueValues<T>(values: readonly T[]) {
  return [...new Set(values)];
}

function StepsBuilderSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
  templateBuilderSurface: TemplateBuilderSurface | null;
}) {
  if (props.templateBuilderSurface?.steps.length) {
    return (
      <TemplateStepsBuilderSection
        definition={props.definition}
        focusWorkspace={props.focusWorkspace}
        templateBuilderSurface={props.templateBuilderSurface}
      />
    );
  }

  const selectedStep = getSelectedStep(props.definition, props.focusWorkspace.selected?.id);

  return (
    <section className="grid gap-4 xl:grid-cols-[260px_minmax(0,1.2fr)_minmax(0,0.92fr)]">
      <aside className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-info)]">
          Sections
        </p>
        <div className="mt-3 grid gap-2">
          {props.definition.builderSections.map((section) => (
            <Link
              key={section}
              href={buildSopBuilderHref(
                props.definition.slug,
                "steps",
                getSectionFocusStepId(props.definition, section),
              )}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700"
            >
              {section}
            </Link>
          ))}
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-info)]">
          Versions
        </p>
        <div className="mt-3 grid gap-2">
          <Link
            href={buildSopBuilderHref(
              props.definition.slug,
              "version",
              "current-version",
            )}
            className="rounded-[1.2rem] border border-slate-200 bg-white px-3 py-3 text-left"
          >
            <p className="text-sm font-semibold text-slate-950">
              {props.definition.version.currentLabel}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--mymedlife-info)]">
              {props.definition.libraryStatus}
            </p>
          </Link>
          {props.definition.version.history.map((entry) => (
            <Link
              key={entry.label}
              href={buildSopBuilderHref(
                props.definition.slug,
                "version",
                `version-${props.definition.version.history.findIndex(
                  (candidate) => candidate.label === entry.label,
                )}`,
              )}
              className="rounded-[1.2rem] border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-3 py-3 text-left"
            >
              <p className="text-sm font-semibold text-slate-950">{entry.label}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--mymedlife-info)]">
                {entry.updatedLabel}
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-info)]">
          Settings
        </p>
        <div className="mt-3 grid gap-2">
          {props.definition.builderSettings.map((setting) => (
            <Link
              key={setting}
              href="/admin/workflows?section=lanes&focus=campaign-config"
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700"
            >
              {setting}
            </Link>
          ))}
        </div>
      </aside>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Workflow Steps</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {props.definition.steps.length} steps
            </p>
          </div>
          <Link
            href={buildSopBuilderHref(
              props.definition.slug,
              "steps",
              props.focusWorkspace.selected?.id,
              "filter",
            )}
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Filter
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {props.definition.steps.map((step, index) => {
            const isSelected = props.focusWorkspace.selected?.id === step.id;

            return (
              <div key={step.id} className="grid gap-3">
                <article
                  className={[
                    "rounded-[1.5rem] border p-4",
                    isSelected
                      ? "border-[var(--mymedlife-border)]/30 bg-[var(--mymedlife-badge-background)]"
                      : "border-slate-200 bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                        {step.stepNumber}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-950">{step.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {step.phaseLabel} · {toReadableRole(step.ownerRole)}
                        </p>
                      </div>
                    </div>
                    <Pill>{step.status.replaceAll("_", " ")}</Pill>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {step.evidenceRequired ? <SmallChip>Evidence</SmallChip> : null}
                    {step.approvalRequired ? <SmallChip>Approval</SmallChip> : null}
                    {step.pointsEnabled ? <SmallChip>Points</SmallChip> : null}
                    <SmallChip>{step.kpiTag}</SmallChip>
                    <SmallChip>{step.communicationCount} msgs</SmallChip>
                    {!step.required ? <SmallChip>optional</SmallChip> : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={buildSopBuilderHref(props.definition.slug, "steps", step.id)}
                      aria-current={isSelected ? "page" : undefined}
                      className={
                        isSelected
                          ? "inline-flex rounded-full bg-[var(--mymedlife-border)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-on-gold)]"
                          : "inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                      }
                    >
                      {isSelected ? "Selected" : "Open in workspace"}
                    </Link>
                    <Link
                      href={buildSopRolePreviewHref(step.ownerRole, step.linkedRoute)}
                      className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                    >
                      Preview as {toReadableRole(step.ownerRole)}
                    </Link>
                    <Link
                      href={step.linkedRoute}
                      className="inline-flex rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-info)]"
                    >
                      Open linked route
                    </Link>
                  </div>
                </article>

                {index < props.definition.steps.length - 1 ? (
                  <Link
                    href={buildSopBuilderHref(
                      props.definition.slug,
                      "steps",
                      step.id,
                      "add_step",
                    )}
                    className="justify-self-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Add Step
                  </Link>
                ) : null}
              </div>
            );
          })}

          <Link
            href={buildSopBuilderHref(
              props.definition.slug,
              "steps",
              props.definition.steps[props.definition.steps.length - 1]?.id,
              "add_step_after_last",
            )}
            className="justify-self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Add Step After Last
          </Link>
        </div>
      </section>

      <aside className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
              {selectedStep.stepNumber}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-info)]">
                Step Details
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {selectedStep.title}
              </p>
            </div>
          </div>
          <Pill>{selectedStep.status.replaceAll("_", " ")}</Pill>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildSopBuilderHref(
                props.definition.slug,
                "steps",
                selectedStep.id,
                "duplicate_step",
              )}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
            >
              Duplicate Step
            </Link>
            <Link
              href={buildSopBuilderHref(
                props.definition.slug,
                "steps",
                selectedStep.id,
                "disable_step",
              )}
              className="rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-info)]"
            >
              Disable Step
            </Link>
          </div>

          <DetailBlock label="Step Name">{selectedStep.title}</DetailBlock>
          <DetailBlock label="Phase">{selectedStep.phaseLabel}</DetailBlock>
          <DetailBlock label="Purpose">{selectedStep.purpose}</DetailBlock>
          <DetailBlock label="Owner Role">
            {toReadableRole(selectedStep.ownerRole)}
          </DetailBlock>
          <DetailBlock label="Supporting Roles">
            {selectedStep.supportingRoles.length
              ? selectedStep.supportingRoles.map(toReadableRole).join(", ")
              : "—"}
          </DetailBlock>
          <DetailBlock label="Entry Criteria">
            {selectedStep.entryCriteria}
          </DetailBlock>
          <DetailBlock label="Exit Criteria">{selectedStep.exitCriteria}</DetailBlock>
          <DetailBlock label="Due Timing">{selectedStep.dueTiming}</DetailBlock>

          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-info)]">
              Rules
            </p>
            <div className="mt-3 grid gap-2">
              <RuleRow label="Evidence Required" enabled={selectedStep.evidenceRequired} />
              <RuleRow label="Approval Required" enabled={selectedStep.approvalRequired} />
              <RuleRow label="Points Enabled" enabled={selectedStep.pointsEnabled} />
              <RuleRow label="Required Step" enabled={selectedStep.required} />
            </div>
          </div>

          <DetailBlock label="Risk / Escalation">
            {selectedStep.riskEscalation}
          </DetailBlock>
          <DetailBlock label="KPI Impact">{selectedStep.kpiTag}</DetailBlock>
        </div>
      </aside>
    </section>
  );
}

function getSelectedStep(definition: SopCampaignDefinition, stepId: string | undefined) {
  return definition.steps.find((step) => step.id === stepId) ?? definition.steps[0];
}

function RoleMatrixSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
  templateBuilderSurface: TemplateBuilderSurface | null;
}) {
  if (props.templateBuilderSurface?.roleMatrix.length) {
    return (
      <TemplateRoleMatrixSection
        definition={props.definition}
        focusWorkspace={props.focusWorkspace}
        templateBuilderSurface={props.templateBuilderSurface}
      />
    );
  }

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-info)]">
              Step-level workflow behavior
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Role Matrix</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              This matrix defines who can see a step, what action they take,
              what route changes, and which proof, approval, points, KPI, and
              communication rules travel with that role.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BuilderFilterLink
              campaignSlug={props.definition.slug}
              tab="role-matrix"
              focusId={props.focusWorkspace.selected?.id}
            />
            <Pill>{props.definition.roleActionRules.length} role rules</Pill>
            <Pill>{getWorkflowDistinctRoleCount(props.definition)} canonical roles</Pill>
            <Pill>{getWorkflowDistinctScopeCount(props.definition)} scopes</Pill>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Visible</th>
                <th className="px-4 py-3">Action Required</th>
                <th className="px-4 py-3">Access Type</th>
                <th className="px-4 py-3">Page / Surface</th>
                <th className="px-4 py-3">Action Expected</th>
                <th className="px-4 py-3">Evidence</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3">Point Value</th>
                <th className="px-4 py-3">KPI Impact</th>
                <th className="px-4 py-3">Messaging / Triggered Event</th>
              </tr>
            </thead>
            <tbody>
              {getWorkflowRoleImpactRows(props.definition).map((rule) => {
                const isSelected = props.focusWorkspace.selected?.id === rule.id;

                return (
                  <tr key={rule.id} className={isSelected ? "bg-[var(--mymedlife-border)]/10" : "bg-transparent"}>
                    <td className="border-t border-slate-200 px-4 py-4 align-top">
                      <div>
                        <p className="font-semibold text-slate-950">{toReadableRole(rule.role)}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--mymedlife-info)]">
                          {rule.scope.replaceAll("_", " ")}
                        </p>
                      </div>
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      Yes
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {getWorkflowActionRequiredLabel(rule.role)}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {getWorkflowAccessTypeLabel(rule.role)}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-slate-600">{rule.route}</span>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={buildSopRolePreviewHref(rule.role, rule.route)}
                            className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                          >
                            Preview
                          </Link>
                          <Link
                            href={rule.route}
                            className="inline-flex rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-info)]"
                          >
                            Open route
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                      {rule.summary}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {rule.evidenceSummary}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {rule.approvalSummary}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {rule.pointSummary}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {rule.kpiSummary}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                      {rule.messagingSummary}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <FocusedTabSection
        title="Selected role rule"
        focusWorkspace={props.focusWorkspace}
        columnsClassName="grid gap-3 lg:grid-cols-2"
      />
    </section>
  );
}

function TemplateStepsBuilderSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
  templateBuilderSurface: TemplateBuilderSurface;
}) {
  const selectedStep =
    props.templateBuilderSurface.steps.find(
      (step) => step.id === props.focusWorkspace.selected?.id,
    ) ?? props.templateBuilderSurface.steps[0];

  return (
    <section className="grid gap-4 xl:grid-cols-[260px_minmax(0,1.2fr)_minmax(0,0.92fr)]">
      <aside className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-info)]">
          Sections
        </p>
        <div className="mt-3 grid gap-2">
          {props.templateBuilderSurface.phaseLabels.map((section) => (
            <Link
              key={section}
              href={buildSopBuilderHref(
                props.definition.slug,
                "steps",
                getTemplateSectionFocusStepId(props.templateBuilderSurface.steps, section),
              )}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700"
            >
              {section}
            </Link>
          ))}
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-info)]">
          Versions
        </p>
        <div className="mt-3 grid gap-2">
          <Link
            href={buildSopBuilderHref(props.definition.slug, "version", "current-version")}
            className="rounded-[1.2rem] border border-slate-200 bg-white px-3 py-3 text-left"
          >
            <p className="text-sm font-semibold text-slate-950">
              {props.templateBuilderSurface.versionLabel}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--mymedlife-info)]">
              {props.templateBuilderSurface.importStatus.replaceAll("_", " ")}
            </p>
          </Link>
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-info)]">
          Settings
        </p>
        <div className="mt-3 grid gap-2">
          {props.definition.builderSettings.map((setting) => (
            <Link
              key={setting}
              href="/admin/workflows?section=lanes&focus=campaign-config"
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700"
            >
              {setting}
            </Link>
          ))}
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-info)]">
          Workflow
        </p>
        <div className="mt-3 rounded-[1.2rem] border border-slate-200 bg-[var(--mymedlife-badge-background)] px-3 py-3">
          <p className="text-sm font-semibold text-slate-950">
            {props.templateBuilderSurface.workflowName}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Structured imported draft
          </p>
        </div>
      </aside>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Workflow Steps</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {props.templateBuilderSurface.steps.length} imported steps
            </p>
          </div>
          <Link
            href={buildSopBuilderHref(
              props.definition.slug,
              "steps",
              props.focusWorkspace.selected?.id,
              "filter",
            )}
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Filter
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {props.templateBuilderSurface.steps.map((step, index) => {
            const isSelected = props.focusWorkspace.selected?.id === step.id;

            return (
              <div key={step.id} className="grid gap-3">
                <article
                  className={[
                    "rounded-[1.5rem] border p-4",
                    isSelected
                      ? "border-[var(--mymedlife-border)]/30 bg-[var(--mymedlife-badge-background)]"
                      : "border-slate-200 bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                        {step.sequence}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-950">{step.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {step.phaseLabel} · {toReadableRole(step.primaryOwnerRole)}
                        </p>
                      </div>
                    </div>
                    <Pill>{getTemplateFocusStatus(step.sourceCertainty).replaceAll("_", " ")}</Pill>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {step.evidenceLabels.length ? <SmallChip>Evidence</SmallChip> : null}
                    {step.approvalLabels.length ? <SmallChip>Approval</SmallChip> : null}
                    {step.pointsLabels.length ? <SmallChip>Points</SmallChip> : null}
                    {step.kpiLabels.map((label) => (
                      <SmallChip key={`${step.id}-${label}`}>{label}</SmallChip>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={buildSopBuilderHref(props.definition.slug, "steps", step.id)}
                      aria-current={isSelected ? "page" : undefined}
                      className={
                        isSelected
                          ? "inline-flex rounded-full bg-[var(--mymedlife-border)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-on-gold)]"
                          : "inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                      }
                    >
                      {isSelected ? "Selected" : "Open in workspace"}
                    </Link>
                    {step.visibleRoutes[0] ? (
                      <Link
                        href={buildSopRolePreviewHref(step.primaryOwnerRole, step.route)}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                      >
                        Preview as {toReadableRole(step.primaryOwnerRole)}
                      </Link>
                    ) : null}
                    {step.route ? (
                      <Link
                        href={step.route}
                        className="inline-flex rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-info)]"
                      >
                        Open linked route
                      </Link>
                    ) : null}
                  </div>
                </article>

                {index < props.templateBuilderSurface.steps.length - 1 ? (
                  <Link
                    href={buildSopBuilderHref(props.definition.slug, "steps", step.id, "add_step")}
                    className="justify-self-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Add Step
                  </Link>
                ) : null}
              </div>
            );
          })}

          <Link
            href={buildSopBuilderHref(
              props.definition.slug,
              "steps",
              props.templateBuilderSurface.steps[
                props.templateBuilderSurface.steps.length - 1
              ]?.id,
              "add_step_after_last",
            )}
            className="justify-self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Add Step After Last
          </Link>
        </div>
      </section>

      <aside className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
              {selectedStep.sequence}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-info)]">
                Step Details
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {selectedStep.title}
              </p>
            </div>
          </div>
          <Pill>{getTemplateFocusStatus(selectedStep.sourceCertainty).replaceAll("_", " ")}</Pill>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildSopBuilderHref(
                props.definition.slug,
                "steps",
                selectedStep.id,
                "duplicate_step",
              )}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
            >
              Duplicate Step
            </Link>
            <Link
              href={buildSopBuilderHref(
                props.definition.slug,
                "steps",
                selectedStep.id,
                "disable_step",
              )}
              className="rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-info)]"
            >
              Disable Step
            </Link>
          </div>
          <DetailBlock label="Step Name">{selectedStep.title}</DetailBlock>
          <DetailBlock label="Phase">{selectedStep.phaseLabel}</DetailBlock>
          <DetailBlock label="Objective">{selectedStep.objective}</DetailBlock>
          <DetailBlock label="Due Timing">{selectedStep.dueTiming}</DetailBlock>
          <DetailBlock label="Owner Roles">
            {selectedStep.ownerRoles.map(toReadableRole).join(", ")}
          </DetailBlock>
          <DetailBlock label="Supporting Roles">
            {selectedStep.supportingRoles.length
              ? selectedStep.supportingRoles.map(toReadableRole).join(", ")
              : "—"}
          </DetailBlock>
          <DetailBlock label="Visible Routes">
            {[selectedStep.route, ...selectedStep.visibleRoutes].filter(
              (route, index, routes) => route && routes.indexOf(route) === index,
            ).length
              ? [selectedStep.route, ...selectedStep.visibleRoutes]
                  .filter((route, index, routes) => route && routes.indexOf(route) === index)
                  .join(", ")
              : "No route mapped yet"}
          </DetailBlock>
          <DetailBlock label="Completion Rules">
            {selectedStep.completionLabels.length
              ? selectedStep.completionLabels.join(", ")
              : "—"}
          </DetailBlock>
          <DetailBlock label="Evidence Rules">
            {selectedStep.evidenceLabels.length
              ? selectedStep.evidenceLabels.join(", ")
              : "—"}
          </DetailBlock>
          <DetailBlock label="Approval Rules">
            {selectedStep.approvalLabels.length
              ? selectedStep.approvalLabels.join(", ")
              : "—"}
          </DetailBlock>
          <DetailBlock label="Risk / Escalation">
            {selectedStep.riskEscalation}
          </DetailBlock>
          <DetailBlock label="Expected Outputs">
            {selectedStep.expectedOutputs.length
              ? selectedStep.expectedOutputs.join(", ")
              : "—"}
          </DetailBlock>
          <DetailBlock label="Integration Events">
            {selectedStep.integrationEvents.length
              ? selectedStep.integrationEvents.join(", ")
              : "—"}
          </DetailBlock>
        </div>
      </aside>
    </section>
  );
}

function getTemplateSectionFocusStepId(
  steps: readonly TemplateBuilderStepView[],
  phaseLabel: string,
) {
  return steps.find((step) => step.phaseLabel === phaseLabel)?.id ?? steps[0]?.id;
}

function TemplateRoleMatrixSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
  templateBuilderSurface: TemplateBuilderSurface;
}) {
  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-white p-5 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
              Imported workflow behavior
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Role Matrix</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              This matrix now reads from the structured imported template for
              Planning / Goal Setting. It shows role scope, visible routes, step
              coverage, completion rules, and event posture without enabling edits.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BuilderFilterLink
              campaignSlug={props.definition.slug}
              tab="role-matrix"
              focusId={props.focusWorkspace.selected?.id}
            />
            <Pill>{props.templateBuilderSurface.roleMatrix.length} role rules</Pill>
            <Pill>
              {new Set(props.templateBuilderSurface.roleMatrix.map((rule) => rule.role)).size} canonical roles
            </Pill>
            <Pill>
              {new Set(props.templateBuilderSurface.roleMatrix.map((rule) => rule.scope)).size} scopes
            </Pill>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[var(--mymedlife-border)] bg-white shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full">
            <thead className="bg-[var(--mymedlife-badge-background)]">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Visible</th>
                <th className="px-4 py-3">Action Required</th>
                <th className="px-4 py-3">Access Type</th>
                <th className="px-4 py-3">Page / Surface</th>
                <th className="px-4 py-3">Step Coverage</th>
                <th className="px-4 py-3">Evidence</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3">Point Value</th>
                <th className="px-4 py-3">KPI Impact</th>
                <th className="px-4 py-3">Messaging / Triggered Event</th>
              </tr>
            </thead>
            <tbody>
              {props.templateBuilderSurface.roleMatrix.map((rule) => {
                const isSelected = props.focusWorkspace.selected?.id === rule.id;

                return (
                  <tr key={rule.id} className={isSelected ? "bg-[var(--background)]" : "bg-transparent"}>
                    <td className="border-t border-slate-200 px-4 py-4 align-top">
                      <div>
                        <p className="font-semibold text-slate-950">{toReadableRole(rule.role)}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                          {rule.scope.replaceAll("_", " ")}
                        </p>
                      </div>
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      Yes
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {getWorkflowActionRequiredLabel(rule.role)}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {getWorkflowAccessTypeLabel(rule.role)}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-slate-600">
                          {rule.visibleRoutes.join(", ") || "No route mapped yet"}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {rule.visibleRoutes[0] ? (
                            <Link
                              href={buildSopRolePreviewHref(rule.role, rule.visibleRoutes[0])}
                              className="inline-flex rounded-full border border-[var(--mymedlife-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-primary-button)]"
                            >
                              Preview
                            </Link>
                          ) : null}
                          {rule.visibleRoutes[0] ? (
                            <Link
                              href={rule.visibleRoutes[0]}
                              className="inline-flex rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-surface-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-primary-button)]"
                            >
                              Open route
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                      {rule.stepLabels.join(", ") || "—"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {rule.evidenceLabels.join(", ") || "None"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {rule.approvalLabels.join(", ") || "None"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {rule.pointsLabels.join(", ") || "None"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {rule.kpiLabels.join(", ") || "—"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                      {rule.integrationEvents.join(", ") || "No event named yet"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <FocusedTabSection
        title="Selected role rule"
        focusWorkspace={props.focusWorkspace}
        columnsClassName="grid gap-3 lg:grid-cols-2"
      />
    </section>
  );
}

function CompletionSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
}) {
  const templateBuilderSurface = getTemplateBuilderSurface(props.definition.slug);

  if (templateBuilderSurface?.completionRows.length) {
    return (
      <TemplateCompletionSection
        definition={props.definition}
        focusWorkspace={props.focusWorkspace}
        templateBuilderSurface={templateBuilderSurface}
      />
    );
  }

  const completionTypes = [
    {
      label: "Manual",
      note: "Member confirms the action inside the owned route before the workflow moves forward.",
      active: props.definition.completionRules.length > 0,
    },
    {
      label: "Evidence",
      note: "Proof expectations stay visible before uploads or sharing are opened.",
      active: props.definition.evidenceRules.length > 0,
    },
    {
      label: "Approval",
      note: "Human review keeps chapter completion and proof posture honest.",
      active: props.definition.approvalRules.length > 0,
    },
    {
      label: "Event / Checklist / Threshold",
      note: "Event attendance, checklist progress, and KPI thresholds remain modeled as workflow states, not separate admin magic.",
      active:
        props.definition.steps.some((step) => step.linkedRoute.includes("events")) ||
        props.definition.kpiRules.length > 0,
    },
  ] as const;
  const evidenceTypes = getWorkflowEvidenceTypeEntries(props.definition);
  const completionRows = getWorkflowCompletionRows(props.definition);

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-white p-5 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
              Completion / Proof / Approval
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Workflow completion gates
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Keep completion type, evidence type, reviewer role, approval posture,
              overdue logic, escalation, and audit behavior visible together before
              any live upload, review, or browser write is enabled.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BuilderFilterLink
              campaignSlug={props.definition.slug}
              tab="completion"
              focusId={props.focusWorkspace.selected?.id}
            />
            <Pill>{props.definition.completionRules.length} completion rules</Pill>
            <Pill>{props.definition.evidenceRules.length} evidence rules</Pill>
            <Pill>{props.definition.approvalRules.length} approval rules</Pill>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <article className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-white p-5 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Completion types
          </p>
          <div className="mt-4 grid gap-3">
            {completionTypes.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.3rem] border border-[var(--mymedlife-border)] bg-[var(--background)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-950">{item.label}</h3>
                  <Pill>{item.active ? "modeled" : "future"}</Pill>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-white p-5 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Imported completion rows
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Evidence types</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {evidenceTypes.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.3rem] border border-[var(--mymedlife-border)] bg-[var(--background)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-950">{item.label}</h3>
                  <Pill>{item.state}</Pill>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[var(--mymedlife-border)] bg-white shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full">
            <thead className="bg-[var(--mymedlife-badge-background)]">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Completion Type</th>
                <th className="px-4 py-3">Evidence Type</th>
                <th className="px-4 py-3">Reviewer Role</th>
                <th className="px-4 py-3">Approval Required</th>
                <th className="px-4 py-3">Overdue / Escalation</th>
                <th className="px-4 py-3">Audit Behavior</th>
                <th className="px-4 py-3">Route / Surface</th>
              </tr>
            </thead>
            <tbody>
              {completionRows.map((row) => {
                const isSelected = props.focusWorkspace.selected?.id === row.id;

                return (
                  <tr key={row.id} className={isSelected ? "bg-[var(--mymedlife-border)]/10" : "bg-transparent"}>
                    <td className="border-t border-white/10 px-4 py-4 align-top">
                      <div>
                        <p className="font-semibold text-white">{row.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/72">
                          {row.family}
                        </p>
                      </div>
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                      {row.completionType}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                      {row.evidenceType}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                      {row.reviewerRole}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                      {row.approvalRequired}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                      {row.overdueEscalation}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                      {row.auditBehavior}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-white/72">{row.route}</span>
                        <div className="flex flex-wrap gap-2">
                          {row.previewHref ? (
                            <Link
                              href={row.previewHref}
                              className="inline-flex rounded-full bg-[var(--mymedlife-border)] px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-on-gold)]"
                            >
                              {row.previewLabel ?? "Open role preview"}
                            </Link>
                          ) : null}
                          <Link
                            href={row.focusHref}
                            className={
                              isSelected
                                ? "inline-flex rounded-full bg-[var(--mymedlife-border)] px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-on-gold)]"
                                : "inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                            }
                          >
                            {isSelected ? "Selected" : "Open in workspace"}
                          </Link>
                          <Link
                            href={row.route}
                            className="inline-flex rounded-full border border-white/10 bg-[var(--mymedlife-border)]/40 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Open route
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <FocusedTabSection
        title="Selected completion rule"
        focusWorkspace={props.focusWorkspace}
        columnsClassName="grid gap-3 lg:grid-cols-3"
      />
    </section>
  );
}

function TemplateCompletionSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
  templateBuilderSurface: TemplateBuilderSurface;
}) {
  const evidenceTypes = getWorkflowEvidenceTypeEntries(props.definition);
  const completionRows = getWorkflowCompletionRows(props.definition);
  const completionTypes = [
    {
      label: "Completion",
      note: "Success-state rules extracted directly from the imported template.",
      active: props.templateBuilderSurface.completionRows.some(
        (row) => row.rowType === "completion",
      ),
    },
    {
      label: "Evidence",
      note: "Evidence requirements stay visible before uploads or sharing are opened.",
      active: props.templateBuilderSurface.completionRows.some(
        (row) => row.rowType === "evidence",
      ),
    },
    {
      label: "Approval",
      note: "Human review gates remain explicit inside the imported draft template.",
      active: props.templateBuilderSurface.completionRows.some(
        (row) => row.rowType === "approval",
      ),
    },
  ] as const;

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-white p-5 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
              Completion / Proof / Approval
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Workflow completion gates
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              This tab now reads from the structured imported template for
              Planning / Goal Setting, so completion, evidence, and approval
              rules stay attached to the real workflow data inside the existing
              SOP function.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BuilderFilterLink
              campaignSlug={props.definition.slug}
              tab="completion"
              focusId={props.focusWorkspace.selected?.id}
            />
            <Pill>
              {
                props.templateBuilderSurface.completionRows.filter(
                  (row) => row.rowType === "completion",
                ).length
              }{" "}
              completion rules
            </Pill>
            <Pill>
              {
                props.templateBuilderSurface.completionRows.filter(
                  (row) => row.rowType === "evidence",
                ).length
              }{" "}
              evidence rules
            </Pill>
            <Pill>
              {
                props.templateBuilderSurface.completionRows.filter(
                  (row) => row.rowType === "approval",
                ).length
              }{" "}
              approval rules
            </Pill>
            <Pill>{props.templateBuilderSurface.riskRows.length} risk rules</Pill>
            <Pill>{props.templateBuilderSurface.escalationRows.length} escalations</Pill>
            <Pill>{props.templateBuilderSurface.closeoutRows.length} closeout requirements</Pill>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <article className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-white p-5 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Completion types
          </p>
          <div className="mt-4 grid gap-3">
            {completionTypes.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.3rem] border border-[var(--mymedlife-border)] bg-[var(--background)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-950">{item.label}</h3>
                  <Pill>{item.active ? "modeled" : "future"}</Pill>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-white p-5 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Imported completion rows
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Evidence types</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {evidenceTypes.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.3rem] border border-[var(--mymedlife-border)] bg-[var(--background)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-950">{item.label}</h3>
                  <Pill>{item.state}</Pill>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[var(--mymedlife-border)] bg-white shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full">
            <thead className="bg-[var(--mymedlife-badge-background)]">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Completion Type</th>
                <th className="px-4 py-3">Evidence Type</th>
                <th className="px-4 py-3">Reviewer Role</th>
                <th className="px-4 py-3">Approval Required</th>
                <th className="px-4 py-3">Overdue / Escalation</th>
                <th className="px-4 py-3">Audit Behavior</th>
                <th className="px-4 py-3">Route / Surface</th>
              </tr>
            </thead>
            <tbody>
              {completionRows.map((row) => {
                const isSelected = props.focusWorkspace.selected?.id === row.id;

                return (
                  <tr key={row.id} className={isSelected ? "bg-[var(--background)]" : "bg-white"}>
                    <td className="border-t border-slate-200 px-4 py-4 align-top">
                      <div>
                        <p className="font-semibold text-slate-950">{row.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                          {row.family}
                        </p>
                      </div>
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {row.completionType}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {row.evidenceType}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {row.reviewerRole}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {row.approvalRequired}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                      {row.overdueEscalation}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                      {row.auditBehavior}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-slate-600">{row.route}</span>
                        <div className="flex flex-wrap gap-2">
                          {row.previewHref ? (
                            <Link
                              href={row.previewHref}
                              className="inline-flex rounded-full border border-[var(--mymedlife-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-primary-button)]"
                            >
                              {row.previewLabel ?? "Open role preview"}
                            </Link>
                          ) : null}
                          <Link
                            href={row.focusHref}
                            className={
                              isSelected
                                ? "inline-flex rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-info)]"
                                : "inline-flex rounded-full border border-[var(--mymedlife-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-primary-button)]"
                            }
                          >
                            {isSelected ? "Selected" : "Open in workspace"}
                          </Link>
                          <Link
                            href={row.route}
                            className="inline-flex rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-primary-button)]"
                          >
                            Open route
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
            Imported risk posture
          </p>
          <div className="mt-4 grid gap-3">
            {props.templateBuilderSurface.riskRows.map((row) => (
              <div
                key={row.id}
                className="rounded-[1.3rem] border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{row.title}</h3>
                    <p className="mt-1 text-sm text-white/66">
                      {row.severity} severity
                      {row.linkedStepLabels.length
                        ? ` · ${row.linkedStepLabels.join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <Pill>{getTemplateFocusStatus(row.sourceCertainty).replaceAll("_", " ")}</Pill>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/68">{row.triggerCondition}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <BuilderFocusLink
                    campaignSlug={props.definition.slug}
                    tab="completion"
                    focusId={row.id}
                    selected={props.focusWorkspace.selected?.id === row.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
            Escalation follow-through
          </p>
          <div className="mt-4 grid gap-3">
            {props.templateBuilderSurface.escalationRows.map((row) => (
              <div
                key={row.id}
                className="rounded-[1.3rem] border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{row.title}</h3>
                    <p className="mt-1 text-sm text-white/66">
                      {row.ownerRoles.map(toReadableRole).join(", ")}
                    </p>
                  </div>
                  <Pill>{getTemplateFocusStatus(row.sourceCertainty).replaceAll("_", " ")}</Pill>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/68">{row.action}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.linkedStepLabels.map((label) => (
                    <SmallChip key={`${row.id}-${label}`}>{label}</SmallChip>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <BuilderFocusLink
                    campaignSlug={props.definition.slug}
                    tab="completion"
                    focusId={row.id}
                    selected={props.focusWorkspace.selected?.id === row.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
            Closeout requirements
          </p>
          <div className="mt-4 grid gap-3">
            {props.templateBuilderSurface.closeoutRows.map((row) => (
              <div
                key={row.id}
                className="rounded-[1.3rem] border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{row.title}</h3>
                    <p className="mt-1 text-sm text-white/66">
                      {row.requiredByRoles.map(toReadableRole).join(", ")}
                    </p>
                  </div>
                  <Pill>{getTemplateFocusStatus(row.sourceCertainty).replaceAll("_", " ")}</Pill>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/68">{row.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <BuilderFocusLink
                    campaignSlug={props.definition.slug}
                    tab="completion"
                    focusId={row.id}
                    selected={props.focusWorkspace.selected?.id === row.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

        <FocusedTabSection
        title="Selected workflow rule"
        focusWorkspace={props.focusWorkspace}
        columnsClassName="grid gap-3 lg:grid-cols-2"
      />
    </section>
  );
}

function PointsKpiSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
  templateBuilderSurface: TemplateBuilderSurface | null;
}) {
  if (props.templateBuilderSurface?.pointsRows.length) {
    return (
      <TemplatePointsKpiSection
        definition={props.definition}
        focusWorkspace={props.focusWorkspace}
        templateBuilderSurface={props.templateBuilderSurface}
      />
    );
  }

  const roleImpactRows = getWorkflowRolePointsRows(props.definition);

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-white p-5 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
              Points & KPI Impact
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Recognition and measurement rules
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Keep role-based points, chapter points, KPI event logic, approval
              before points, leaderboard visibility, and internal-only tracking in
              the same workflow editor so recognition does not drift away from the
              campaign loop.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BuilderFilterLink
              campaignSlug={props.definition.slug}
              tab="points-kpi"
              focusId={props.focusWorkspace.selected?.id}
            />
            <Pill>{props.definition.pointsRules.length} points rules</Pill>
            <Pill>{props.definition.kpiRules.length} KPI rules</Pill>
            <Pill>{roleImpactRows.length} roles with points</Pill>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Role-based points" value={`${roleImpactRows.length}`} />
        <MiniStat label="Chapter points" value="Visible in chapter totals" />
        <MiniStat label="Approval before points" value="Guarded by workflow" />
        <MiniStat label="Leaderboard visible" value="Member-facing" />
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[var(--mymedlife-border)] bg-white shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full">
            <thead className="bg-[var(--mymedlife-badge-background)]">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Point Value</th>
                <th className="px-4 py-3">Chapter Points</th>
                <th className="px-4 py-3">KPI Event</th>
                <th className="px-4 py-3">Approval Before Points</th>
                <th className="px-4 py-3">Leaderboard Visible</th>
                <th className="px-4 py-3">Caps / Manual Override</th>
              </tr>
            </thead>
            <tbody>
              {roleImpactRows.map((row) => (
                <tr key={row.role} className="bg-white">
                  <td className="border-t border-slate-200 px-4 py-4 align-top">
                    <p className="font-semibold text-slate-950">{toReadableRole(row.role)}</p>
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                    {row.pointValue}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                    {row.chapterPoints}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                    {row.kpiImpact}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                    {row.approvalBeforePoints}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                    {row.leaderboardVisible}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                    {row.capsOverride}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <FocusedTabSection
        title="Selected points or KPI rule"
        focusWorkspace={props.focusWorkspace}
        columnsClassName="grid gap-3 lg:grid-cols-2"
      />
    </section>
  );
}

function CommsSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
  templateBuilderSurface: TemplateBuilderSurface | null;
}) {
  if (props.templateBuilderSurface) {
    return (
      <TemplateCommsSection
        definition={props.definition}
        focusWorkspace={props.focusWorkspace}
        templateBuilderSurface={props.templateBuilderSurface}
      />
    );
  }

  const communicationRows = getWorkflowCommunicationRows(props.definition);
  const communicationSummary = getWorkflowCommunicationSummary(props.definition);

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
              Comms
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Communication triggers
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-white/66">
              Communication is downstream from workflow steps. This tab defines when
              a trigger should fire, who it is for, what system owns delivery, and
              which messages must stay blocked until the workflow is approved.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BuilderFilterLink
              campaignSlug={props.definition.slug}
              tab="comms"
              focusId={props.focusWorkspace.selected?.id}
            />
            <Pill>
              {communicationSummary.enabledInternallyCount}{" "}
              enabled internally
            </Pill>
            <Pill>
              {communicationSummary.blockedExternalCount}{" "}
              blocked external
            </Pill>
            <Pill>{props.definition.integrationBoundaries.length} boundaries</Pill>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90">
        <div className="overflow-x-auto">
          <table className="min-w-[1160px] w-full">
            <thead className="bg-[var(--mymedlife-border)]/40">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                <th className="px-4 py-3">Enabled</th>
                <th className="px-4 py-3">Trigger Condition</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Source System</th>
                <th className="px-4 py-3">Timing</th>
                <th className="px-4 py-3">Approval Needed</th>
                <th className="px-4 py-3">Mock / Live Status</th>
                <th className="px-4 py-3">Workflow Reference</th>
                <th className="px-4 py-3">Workspace State</th>
              </tr>
            </thead>
            <tbody>
              {communicationRows.map((rule) => {
                const isSelected = props.focusWorkspace.selected?.id === rule.id;

                return (
                <tr key={rule.id} className={isSelected ? "bg-[var(--mymedlife-border)]/10" : "bg-transparent"}>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {rule.enabled ? "Yes" : "No"}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top">
                    <div>
                      <p className="font-semibold text-white">{rule.trigger}</p>
                      <p className="mt-2 text-sm leading-6 text-white/68">{rule.detail}</p>
                    </div>
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {rule.audience}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {rule.sourceSystemLabel}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                    {rule.timingLabel}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                    {rule.approvalLabel}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {rule.deliveryModeLabel}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                    {rule.workflowReference}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top">
                    <BuilderFocusLink
                      campaignSlug={props.definition.slug}
                      tab="comms"
                      focusId={rule.id}
                      selected={isSelected}
                    />
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {props.definition.integrationBoundaries.map((boundary) => (
          <article
            key={boundary.system}
            className={[
              "rounded-[1.5rem] border p-5",
              props.focusWorkspace.selected?.id === getWorkflowIntegrationBoundaryFocusId(boundary.system)
                ? "border-[var(--mymedlife-border)]/28 bg-[var(--mymedlife-border)]/10"
                : "border-white/10 bg-[var(--mymedlife-admin-blue)]/90",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                  Integration boundary
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{boundary.system}</h3>
              </div>
              <Pill>{boundary.mode.replaceAll("_", " ")}</Pill>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/68">{boundary.note}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <BuilderFocusLink
                campaignSlug={props.definition.slug}
                tab="comms"
                focusId={getWorkflowIntegrationBoundaryFocusId(boundary.system)}
                selected={
                  props.focusWorkspace.selected?.id ===
                  getWorkflowIntegrationBoundaryFocusId(boundary.system)
                }
              />
            </div>
          </article>
        ))}
      </section>

      <FocusedTabSection
        title="Selected communication trigger"
        focusWorkspace={props.focusWorkspace}
        columnsClassName="grid gap-3 lg:grid-cols-2"
      />
    </section>
  );
}

function TemplatePointsKpiSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
  templateBuilderSurface: TemplateBuilderSurface;
}) {
  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-white p-5 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
              Points & KPI Impact
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Recognition and measurement rules
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              This tab now reads imported point and KPI behavior from the
              structured workflow template inside the current SOP builder, so
              role-based recognition and KPI targets stay in the same source of
              truth.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BuilderFilterLink
              campaignSlug={props.definition.slug}
              tab="points-kpi"
              focusId={props.focusWorkspace.selected?.id}
            />
            <Pill>{props.templateBuilderSurface.pointsRows.length} roles with points</Pill>
            <Pill>{props.templateBuilderSurface.kpiRows.length} KPI rules</Pill>
            <Pill>
              {uniqueValues(props.templateBuilderSurface.pointsRows.flatMap((row) => row.approvalLabels)).length} approval gates
            </Pill>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MiniStat label="Role-based points" value={`${props.templateBuilderSurface.pointsRows.length}`} />
        <MiniStat label="KPI rules" value={`${props.templateBuilderSurface.kpiRows.length}`} />
        <MiniStat
          label="KPI targets"
          value={`${props.templateBuilderSurface.kpiRows.filter((row) => row.targetValue !== null).length}`}
        />
        <MiniStat label="Approval before points" value="Guarded by workflow" />
        <MiniStat
          label="Leaderboard visible"
          value={
            props.templateBuilderSurface.pointsRows.some((row) => row.leaderboardVisible)
              ? "Visible"
              : "Internal only"
          }
        />
        <MiniStat label="Chapter points" value="Visible in chapter totals" />
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[var(--mymedlife-border)] bg-white shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full">
            <thead className="bg-[var(--mymedlife-badge-background)]">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Point Value</th>
                <th className="px-4 py-3">Chapter Points</th>
                <th className="px-4 py-3">KPI Event</th>
                <th className="px-4 py-3">Approval Before Points</th>
                <th className="px-4 py-3">Leaderboard Visible</th>
                <th className="px-4 py-3">Caps / Manual Override</th>
              </tr>
            </thead>
            <tbody>
              {props.templateBuilderSurface.pointsRows.map((row) => (
                <tr key={row.id} className="bg-white">
                  <td className="border-t border-slate-200 px-4 py-4 align-top">
                    <p className="font-semibold text-slate-950">{toReadableRole(row.role)}</p>
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                    {row.pointValues.join(", ")} points
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                    {row.ruleLabels.join(", ") || "Visible in chapter totals"}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                    {row.kpiLabels.join(", ") || "—"}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                    {row.approvalLabels.join(", ") || "No approval rule linked"}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                    {row.leaderboardVisible ? "Yes" : "No"}
                  </td>
                  <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                    {row.repeatabilityLabels.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[var(--mymedlife-border)] bg-white shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="border-b border-[var(--mymedlife-border)] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Imported KPI rules
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            KPI rules stay first-class in the workflow builder so labels,
            metric keys, targets, and step linkage do not drift into
            dashboard-only display logic.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full">
            <thead className="bg-[var(--mymedlife-badge-background)]">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">KPI rule</th>
                <th className="px-4 py-3">Metric key</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Threshold / source note</th>
                <th className="px-4 py-3">Linked steps</th>
                <th className="px-4 py-3">Linked roles</th>
                <th className="px-4 py-3">Workspace state</th>
              </tr>
            </thead>
            <tbody>
              {props.templateBuilderSurface.kpiRows.map((row) => {
                const isSelected = props.focusWorkspace.selected?.id === row.id;

                return (
                  <tr key={row.id} className={isSelected ? "bg-[var(--background)]" : "bg-white"}>
                    <td className="border-t border-slate-200 px-4 py-4 align-top">
                      <p className="font-semibold text-slate-950">{row.label}</p>
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {row.metricKey}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {row.targetValue !== null ? row.targetValue : "No fixed target"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                      {row.thresholdLabel ?? "No threshold note"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                      {row.linkedStepLabels.join(", ") || "—"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                      {row.linkedRoleLabels.join(", ") || "—"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top">
                      <BuilderFocusLink
                        campaignSlug={props.definition.slug}
                        tab="points-kpi"
                        focusId={row.id}
                        selected={isSelected}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <FocusedTabSection
        title="Selected points or KPI rule"
        focusWorkspace={props.focusWorkspace}
        columnsClassName="grid gap-3 lg:grid-cols-2"
      />
    </section>
  );
}

function TemplateCommsSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
  templateBuilderSurface: TemplateBuilderSurface;
}) {
  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-white p-5 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
              Comms
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Communication triggers
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              This tab now reads communication and integration posture from the
              structured imported template, while keeping all real sends blocked.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BuilderFilterLink
              campaignSlug={props.definition.slug}
              tab="comms"
              focusId={props.focusWorkspace.selected?.id}
            />
            <Pill>
              {props.templateBuilderSurface.commRows.filter((row) => row.mockStatus !== "approval_required").length} internal/mock
            </Pill>
            <Pill>
              {props.templateBuilderSurface.commRows.filter((row) => row.mockStatus === "approval_required").length} approval required
            </Pill>
            <Pill>{props.templateBuilderSurface.integrationBoundaries.length} boundaries</Pill>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[var(--mymedlife-border)] bg-white shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1160px] w-full">
            <thead className="bg-[var(--mymedlife-badge-background)]">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Enabled</th>
                <th className="px-4 py-3">Trigger Condition</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Source System</th>
                <th className="px-4 py-3">Timing</th>
                <th className="px-4 py-3">Approval Needed</th>
                <th className="px-4 py-3">Mock / Live Status</th>
                <th className="px-4 py-3">Workflow Reference</th>
                <th className="px-4 py-3">Workspace State</th>
              </tr>
            </thead>
            <tbody>
              {props.templateBuilderSurface.commRows.map((row) => {
                const isSelected = props.focusWorkspace.selected?.id === row.id;

                return (
                  <tr key={row.id} className={isSelected ? "bg-[var(--background)]" : "bg-white"}>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {row.mockStatus === "approval_required" ? "No" : "Yes"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top">
                      <div>
                        <p className="font-semibold text-slate-950">{row.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{row.detail}</p>
                      </div>
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {row.audience}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {row.sourceSystem}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                      {row.timing}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                      {row.mockStatus === "approval_required" ? "Yes" : "No"}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm text-slate-600">
                      {row.mockStatus.replaceAll("_", " ")}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top text-sm leading-6 text-slate-600">
                      {props.templateBuilderSurface.workflowName}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-4 align-top">
                      <BuilderFocusLink
                        campaignSlug={props.definition.slug}
                        tab="comms"
                        focusId={row.id}
                        selected={isSelected}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {props.templateBuilderSurface.integrationBoundaries.map((boundary) => (
          <article
            key={boundary.id}
            className={[
              "rounded-[1.5rem] border p-5 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]",
              props.focusWorkspace.selected?.id === boundary.id
                ? "border-[var(--mymedlife-border)] bg-[var(--background)]"
                : "border-[var(--mymedlife-border)] bg-white",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Integration boundary
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">{boundary.system}</h3>
              </div>
              <Pill>{boundary.mode.replaceAll("_", " ")}</Pill>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{boundary.detail}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {boundary.eventNames.map((eventName) => (
                <SmallChip key={`${boundary.id}-${eventName}`}>{eventName}</SmallChip>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <BuilderFocusLink
                campaignSlug={props.definition.slug}
                tab="comms"
                focusId={boundary.id}
                selected={props.focusWorkspace.selected?.id === boundary.id}
              />
            </div>
          </article>
        ))}
      </section>

      <FocusedTabSection
        title="Selected communication trigger"
        focusWorkspace={props.focusWorkspace}
        columnsClassName="grid gap-3 lg:grid-cols-2"
      />
    </section>
  );
}

function RolePreviewSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
  templateBuilderSurface: TemplateBuilderSurface | null;
}) {
  const runtime = getSopWorkflowRuntime(props.definition.slug);
  const scenarioRows = getWorkflowPreviewRows(
    props.definition,
    runtime?.previewScenarios,
    props.templateBuilderSurface?.previewScenarios,
  );
  const distinctRoles = getWorkflowPreviewDistinctRoleCount(scenarioRows);

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
              Preview
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Preview by role
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-white/66">
              Preview the effect of the workflow by role so reviewers can see the
              screen or page that changes, the action that appears, the proof
              requested, approval posture, points earned, KPI changes, and the
              communication trigger generated.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BuilderFilterLink
              campaignSlug={props.definition.slug}
              tab="preview"
              focusId={props.focusWorkspace.selected?.id}
            />
            <Pill>{scenarioRows.length} preview scenarios</Pill>
            <Pill>{distinctRoles} role lanes in scope</Pill>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90">
        <div className="overflow-x-auto">
          <table className="min-w-[1320px] w-full">
            <thead className="bg-[var(--mymedlife-border)]/40">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Screen / Page Changes</th>
                <th className="px-4 py-3">Action That Appears</th>
                <th className="px-4 py-3">Proof Requested</th>
                <th className="px-4 py-3">Approval Required</th>
                <th className="px-4 py-3">Points Earned</th>
                <th className="px-4 py-3">KPI Changes</th>
                <th className="px-4 py-3">Communication Trigger Generated</th>
                <th className="px-4 py-3">Workspace State</th>
              </tr>
            </thead>
            <tbody>
              {scenarioRows.map((row) => {
                const isSelected = props.focusWorkspace.selected?.id === row.id;

                return (
                <tr key={row.id} className={isSelected ? "bg-[var(--mymedlife-border)]/10" : "bg-transparent"}>
                  <td className="border-t border-white/10 px-4 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="font-semibold text-white">
                          {toReadableRole(row.primaryRole)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/72">
                          {row.title}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={buildSopRolePreviewHref(
                            row.primaryRole,
                            row.route,
                          )}
                          className="inline-flex rounded-full bg-[var(--mymedlife-border)] px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-on-gold)]"
                        >
                          Preview as {toReadableRole(row.primaryRole)}
                        </Link>
                        <Link
                          href={row.route}
                          className="inline-flex rounded-full border border-white/10 bg-[var(--mymedlife-border)]/40 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Open raw route
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                    {row.visibleStates.join(", ")}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                    {row.actionAppears}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {row.proofRequested}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {row.approvalRequired}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {row.pointsEarned}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {row.kpiChanges}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                    {row.communicationTrigger}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top">
                    <BuilderFocusLink
                      campaignSlug={props.definition.slug}
                      tab="preview"
                      focusId={row.id}
                      selected={isSelected}
                    />
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </section>

      <FocusedTabSection
        title="Selected preview scenario"
        focusWorkspace={props.focusWorkspace}
        columnsClassName="grid gap-3 lg:grid-cols-2"
      />
    </section>
  );
}

function VersionReviewSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
  templateBuilderSurface: TemplateBuilderSurface | null;
}) {
  const liveVersion =
    props.definition.version.history.find((entry) => entry.state === "approved_template") ??
    null;
  const currentVersionSelected = props.focusWorkspace.selected?.id === "current-version";
  const localDraftProposals = getSopLocalDraftProposals(props.definition.slug);
  const localDraftSession = getSopLocalDraftSession(props.definition.slug);

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
              Compare live vs draft
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Version / Publish Review
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-white/66">
              Keep the current live template, current draft, impact summary,
              and publish controls visible together so the builder behaves like
              an operating workflow editor instead of a loose history list.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BuilderFilterLink
              campaignSlug={props.definition.slug}
              tab="version"
              focusId={props.focusWorkspace.selected?.id ?? "current-version"}
            />
            <Link
              href={buildSopBuilderHref(
                props.definition.slug,
                "version",
                props.focusWorkspace.selected?.id ?? "current-version",
                "publish",
              )}
              className="rounded-full bg-[var(--mymedlife-border)] px-4 py-2 text-sm font-semibold text-[var(--mymedlife-on-gold)]"
            >
              Publish now
            </Link>
            <Link
              href={buildSopBuilderHref(
                props.definition.slug,
                "version",
                props.focusWorkspace.selected?.id ?? "current-version",
                "schedule",
              )}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              Schedule later
            </Link>
            <Link
              href={buildSopBuilderHref(
                props.definition.slug,
                "version",
                props.focusWorkspace.selected?.id ?? "current-version",
                "rollback",
              )}
              className="rounded-full border border-white/10 bg-[var(--mymedlife-border)]/40 px-4 py-2 text-sm font-semibold text-white"
            >
              Rollback
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[2rem] border border-[var(--mymedlife-border)]/18 bg-[var(--mymedlife-border)]/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-badge-background)]/80">
            Current draft
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {props.definition.version.currentLabel}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/72">
            {props.definition.version.summary}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>{props.definition.libraryStatus}</Pill>
            <Pill>{props.definition.builderStatus.replaceAll("_", " ")}</Pill>
            <Pill>{props.definition.lastEditedBy}</Pill>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <BuilderFocusLink
              campaignSlug={props.definition.slug}
              tab="version"
              focusId="current-version"
              selected={currentVersionSelected}
            />
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/54">
            Current live version
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {liveVersion?.label ?? "No live template yet"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/72">
            {liveVersion?.summary ??
              "This campaign is still in draft-only posture, so live comparison remains intentionally narrow."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>{liveVersion ? "approved template" : "draft only"}</Pill>
            <Pill>{props.definition.lastPublishedDate ?? "not published"}</Pill>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <BuilderFocusLink
              campaignSlug={props.definition.slug}
              tab="version"
              focusId="current-version"
              selected={currentVersionSelected}
            />
          </div>
        </article>
      </section>

      {localDraftSession ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-[2rem] border border-[var(--mymedlife-border)]/18 bg-[var(--mymedlife-border)]/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-badge-background)]/80">
              Local draft session
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              {localDraftSession.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/72">
              {localDraftSession.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill>{localDraftSession.status.replaceAll("_", " ")}</Pill>
              <Pill>{localDraftSession.proposalIds.length} proposals</Pill>
              <Pill>{localDraftSession.affectedRoles.length} roles</Pill>
              <Pill>{localDraftSession.groups.length} review lanes</Pill>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <BuilderFocusLink
                campaignSlug={props.definition.slug}
                tab="version"
                focusId={localDraftSession.id}
                selected={props.focusWorkspace.selected?.id === localDraftSession.id}
              />
              <Link
                href={buildSopBuilderHref(
                  props.definition.slug,
                  "version",
                  localDraftSession.id,
                  "edit_draft_session",
                )}
                className="inline-flex rounded-full bg-[var(--mymedlife-border)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-on-gold)]"
              >
                Edit draft session
              </Link>
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/54">
              Draft session comparison
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              Current draft vs local draft session
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/72">
              Compare the current template posture against the bundled campaign-level
              draft session so reviewers can see what changed before any persisted
              builder mutation path exists.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <article className="rounded-[1.2rem] border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/72">
                  Current draft baseline
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {props.definition.version.currentLabel} · {props.definition.builderStatus.replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  {props.definition.steps.length} steps, {getWorkflowDistinctRoleCount(props.definition)} roles,
                  {" "}{props.definition.communicationRules.length} communication lanes.
                </p>
              </article>
              <article className="rounded-[1.2rem] border border-[var(--mymedlife-border)]/18 bg-[var(--mymedlife-border)]/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/72">
                  Draft session package
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {localDraftSession.proposalIds.length} proposals · {localDraftSession.affectedRoles.length} roles · {localDraftSession.sourceRoutes.length} source routes
                </p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  {localDraftSession.proposedChanges.length} proposed changes bundled into one local
                  campaign review package.
                </p>
              </article>
            </div>
          </article>
        </section>
      ) : null}

      {localDraftSession ? (
        <section className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/54">
                Draft session review lanes
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                Grouped packet review inside the builder
              </h3>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-white/72">
                The existing SOP Creation lane now bundles local proposals into named
                review groups so template linkage, committee ownership, and permission
                posture can be reviewed as one campaign packet.
              </p>
            </div>
            <Pill>{localDraftSession.groups.length}</Pill>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            {localDraftSession.groups.map((group) => (
              <article
                key={group.id}
                className="rounded-[1.35rem] border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/72">
                      Review lane
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-white">{group.title}</h4>
                  </div>
                  <Pill>{group.proposalIds.length}</Pill>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/72">{group.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill>{group.affectedRoles.length} roles</Pill>
                  <Pill>{group.sourceRoutes.length} source routes</Pill>
                </div>
                <div className="mt-4 space-y-2">
                  {group.proposalTitles.slice(0, 3).map((title) => (
                    <p key={`${group.id}-${title}`} className="text-sm leading-6 text-white/68">
                      {title}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Impacted roles" value={`${getWorkflowDistinctRoleCount(props.definition)}`} />
        <MiniStat label="Impacted steps" value={`${props.definition.steps.length}`} />
        <MiniStat
          label="Impacted points/KPIs"
          value={`${props.definition.pointsRules.length + props.definition.kpiRules.length}`}
        />
        <MiniStat
          label="Impacted communications"
          value={`${props.definition.communicationRules.length}`}
        />
      </section>

      {props.templateBuilderSurface ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                  Runtime controls
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Feature flags and rollout posture
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Keep workflow runtime switches visible on the same version lane so
                  reviewers can see what stays enabled for read-only use and what still
                  waits for broader rollout approval.
                </p>
              </div>
              <Pill>{props.templateBuilderSurface.featureFlagRows.length}</Pill>
            </div>
            <div className="mt-4 grid gap-3">
              {props.templateBuilderSurface.featureFlagRows.map((flag) => (
                <div
                  key={flag.id}
                  className="rounded-[1.3rem] border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-white">{flag.flagKey}</h4>
                      <p className="mt-2 text-sm leading-6 text-white/68">
                        {flag.description}
                      </p>
                    </div>
                    <Pill>{flag.defaultState}</Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill>{flag.rolloutStage.replaceAll("_", " ")}</Pill>
                    <Pill>{getTemplateFocusStatus(flag.sourceCertainty).replaceAll("_", " ")}</Pill>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                  Audit and rollout posture
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Integration boundaries and audit expectations
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Version review should show which downstream systems stay blocked and
                  which audit events must remain visible before any publish posture is
                  treated as operational truth.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill>{props.templateBuilderSurface.integrationBoundaries.length} boundaries</Pill>
                <Pill>{props.templateBuilderSurface.auditRows.length} audit rows</Pill>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {props.templateBuilderSurface.integrationBoundaries.map((boundary) => (
                <div
                  key={boundary.id}
                  className="rounded-[1.3rem] border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-white">{boundary.system}</h4>
                      <p className="mt-2 text-sm leading-6 text-white/68">
                        {boundary.detail}
                      </p>
                    </div>
                    <Pill>{boundary.mode.replaceAll("_", " ")}</Pill>
                  </div>
                </div>
              ))}
              {props.templateBuilderSurface.auditRows.map((record) => (
                <div
                  key={record.id}
                  className="rounded-[1.3rem] border border-[var(--mymedlife-border)]/18 bg-[var(--mymedlife-border)]/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-white">{record.eventType}</h4>
                      <p className="mt-2 text-sm leading-6 text-white/68">{record.detail}</p>
                    </div>
                    <Pill>{record.required ? "required" : "optional"}</Pill>
                  </div>
                  {record.linkedOutboxTopics.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {record.linkedOutboxTopics.map((topic) => (
                        <SmallChip key={`${record.id}-${topic}`}>{topic}</SmallChip>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                  Imported source coverage
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Script templates
                </h3>
              </div>
              <Pill>{props.templateBuilderSurface.scriptTemplates.length}</Pill>
            </div>
            <div className="mt-4 grid gap-3">
              {props.templateBuilderSurface.scriptTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-[1.3rem] border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-white">{template.title}</h4>
                      <p className="mt-1 text-sm text-white/66">{template.audience}</p>
                    </div>
                    <Pill>
                      {getTemplateFocusStatus(template.sourceCertainty).replaceAll("_", " ")}
                    </Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/68">{template.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <BuilderFocusLink
                      campaignSlug={props.definition.slug}
                      tab="version"
                      focusId={template.id}
                      selected={props.focusWorkspace.selected?.id === template.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-[var(--mymedlife-admin-blue)]/90 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                  Imported source coverage
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Resource links
                </h3>
              </div>
              <Pill>{props.templateBuilderSurface.resourceLinks.length}</Pill>
            </div>
            <div className="mt-4 grid gap-3">
              {props.templateBuilderSurface.resourceLinks.map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-[1.3rem] border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-white">{resource.label}</h4>
                      <p className="mt-1 text-sm break-all text-white/66">{resource.href}</p>
                    </div>
                    <Pill>
                      {getTemplateFocusStatus(resource.sourceCertainty).replaceAll("_", " ")}
                    </Pill>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <BuilderFocusLink
                      campaignSlug={props.definition.slug}
                      tab="version"
                      focusId={resource.id}
                      selected={props.focusWorkspace.selected?.id === resource.id}
                    />
                    <Link
                      href={resource.href}
                      className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Open reference
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {localDraftProposals.length ? (
        <section className="rounded-[2rem] border border-[var(--mymedlife-border)]/18 bg-[var(--mymedlife-border)]/10 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-badge-background)]/80">
                Local draft proposals
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                Backend config proposals feeding this workflow
              </h3>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-white/72">
                Committee and permission review routes can open typed local proposals here so
                workflow configuration changes stay attached to the builder version story before
                any persisted admin mutation path exists.
              </p>
            </div>
            <Pill>{localDraftProposals.length}</Pill>
          </div>
          {localDraftSession ? (
            <article className="mt-4 rounded-[1.35rem] border border-[var(--mymedlife-border)]/24 bg-[var(--mymedlife-border)]/40 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/72">
                    Draft session package
                  </p>
                  <h4 className="mt-2 text-xl font-semibold text-white">
                    {localDraftSession.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-white/72">
                    {localDraftSession.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill>{localDraftSession.status.replaceAll("_", " ")}</Pill>
                    <Pill>{localDraftSession.proposalIds.length} proposals</Pill>
                    <Pill>{localDraftSession.sourceRoutes.length} source routes</Pill>
                    <Pill>{localDraftSession.groups.length} review lanes</Pill>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <BuilderFocusLink
                    campaignSlug={props.definition.slug}
                    tab="version"
                    focusId={localDraftSession.id}
                    selected={props.focusWorkspace.selected?.id === localDraftSession.id}
                  />
                  <Link
                    href={buildSopBuilderHref(
                      props.definition.slug,
                      "version",
                      localDraftSession.id,
                      "edit_draft_session",
                    )}
                    className="inline-flex rounded-full bg-[var(--mymedlife-border)] px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-on-gold)]"
                  >
                    Edit draft session
                  </Link>
                </div>
              </div>
            </article>
          ) : null}
          {localDraftSession ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {localDraftSession.groups.map((group) => (
                <article
                  key={`session-group-${group.id}`}
                  className="rounded-[1.2rem] border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/72">
                        Review lane
                      </p>
                      <h4 className="mt-2 text-base font-semibold text-white">{group.title}</h4>
                    </div>
                    <Pill>{group.proposalIds.length}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/72">{group.summary}</p>
                </article>
              ))}
            </div>
          ) : null}
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {localDraftProposals.map((proposal) => (
              <article
                key={proposal.id}
                className={[
                  "rounded-[1.35rem] border p-4",
                  props.focusWorkspace.selected?.id === proposal.id
                    ? "border-[var(--mymedlife-border)]/28 bg-[var(--mymedlife-border)]/10"
                    : "border-white/10 bg-[var(--mymedlife-border)]/40",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--mymedlife-badge-background)]/72">
                      {proposal.sourceLabel}
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">{proposal.title}</p>
                  </div>
                  <Pill>{proposal.status.replaceAll("_", " ")}</Pill>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/72">{proposal.summary}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--mymedlife-badge-background)]/78">{proposal.rationale}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {proposal.affectedRoles.slice(0, 4).map((role) => (
                    <Pill key={`${proposal.id}-${role}`}>{toReadableRole(role)}</Pill>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <BuilderFocusLink
                    campaignSlug={props.definition.slug}
                    tab="version"
                    focusId={proposal.id}
                    selected={props.focusWorkspace.selected?.id === proposal.id}
                  />
                  <Link
                    href={buildSopBuilderHref(
                      props.definition.slug,
                      "version",
                      proposal.id,
                      "edit_proposal",
                    )}
                    className="inline-flex rounded-full bg-[var(--mymedlife-border)] px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-on-gold)]"
                  >
                    Edit draft proposal
                  </Link>
                  <Link
                    href={proposal.sourceRoute}
                    className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Open source route
                  </Link>
                  {proposal.builderRoleMatrixHref ? (
                    <Link
                      href={proposal.builderRoleMatrixHref}
                      className="inline-flex rounded-full border border-[var(--mymedlife-border)]/24 bg-[var(--mymedlife-border)]/12 px-3 py-1.5 text-xs font-semibold text-[var(--mymedlife-badge-background)]"
                    >
                      Open role matrix
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-white p-5 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Change log
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {props.definition.version.history.map((entry, index) => (
            <article
              key={entry.label}
              className={[
                "rounded-[1.35rem] border p-4",
                props.focusWorkspace.selected?.id === `version-${index}`
                  ? "border-[var(--mymedlife-border)] bg-[var(--background)]"
                  : "border-[var(--mymedlife-border)] bg-white",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-950">{entry.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {entry.state.replaceAll("_", " ")}
                  </p>
                </div>
                <Pill>{entry.updatedLabel}</Pill>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{entry.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <BuilderFocusLink
                  campaignSlug={props.definition.slug}
                  tab="version"
                  focusId={`version-${index}`}
                  selected={props.focusWorkspace.selected?.id === `version-${index}`}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <FocusedTabSection
        title="Selected version or source record"
        focusWorkspace={props.focusWorkspace}
        columnsClassName="grid gap-3 lg:grid-cols-2"
      />
    </section>
  );
}

function FocusedTabSection(props: {
  title: string;
  focusWorkspace: BuilderFocusWorkspace;
  columnsClassName: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
      <h2 className="text-2xl font-semibold text-slate-950">{props.title}</h2>
      {props.focusWorkspace.selected ? (
        <section className="mt-4 rounded-[1.5rem] border border-[var(--mymedlife-border)]/30 bg-[var(--mymedlife-badge-background)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-info)]">
            Selected in workspace
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-info)]">
                {props.focusWorkspace.selected.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                {props.focusWorkspace.selected.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {props.focusWorkspace.selected.detail}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--mymedlife-info)]">
                {props.focusWorkspace.selected.footer}
              </p>
              {props.focusWorkspace.selected.pills?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {props.focusWorkspace.selected.pills.map((pill) => (
                    <Pill key={`${props.focusWorkspace.selected?.id}-${pill}`}>{pill}</Pill>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill>{props.focusWorkspace.selected.status.replaceAll("_", " ")}</Pill>
              {props.focusWorkspace.selected.previewHref ? (
                <Link
                  href={props.focusWorkspace.selected.previewHref}
                  className="inline-flex rounded-full bg-[var(--mymedlife-border)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-on-gold)]"
                >
                  {props.focusWorkspace.selected.previewLabel ?? "Open role preview"}
                </Link>
              ) : null}
              {props.focusWorkspace.selected.href ? (
                <Link
                  href={props.focusWorkspace.selected.href}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                >
                  {props.focusWorkspace.selected.hrefLabel ?? "Open route"}
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <div className={`mt-4 ${props.columnsClassName}`}>
        {props.focusWorkspace.cards.map((card) => (
          <SelectableRuleCard
            key={card.id}
            card={card}
            selected={props.focusWorkspace.selected?.id === card.id}
          />
        ))}
      </div>
    </section>
  );
}

function BuilderModeNotice(props: {
  notice: {
    title: string;
    summary: string;
    pills: readonly string[];
    clearHref: string;
    guardrails: readonly string[];
    rows?: readonly {
      label: string;
      value: string;
      note: string;
    }[];
  } | null;
}) {
  if (!props.notice) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-[var(--mymedlife-border)]/30 bg-[var(--mymedlife-badge-background)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-info)]">
            Mock-safe builder action
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {props.notice.title}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            {props.notice.summary}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {props.notice.pills.map((pill) => (
              <Pill key={pill}>{pill}</Pill>
            ))}
          </div>
        </div>
        <Link
          href={props.notice.clearHref}
          className="w-fit rounded-full bg-[var(--mymedlife-border)] px-4 py-2 text-sm font-semibold text-[var(--mymedlife-on-gold)]"
        >
          Return to workflow
        </Link>
      </div>
      <ul className="mt-4 grid gap-3 lg:grid-cols-3">
        {props.notice.guardrails.map((item) => (
          <li
            key={item}
            className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600"
          >
            {item}
          </li>
        ))}
      </ul>
      {props.notice.rows?.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {props.notice.rows.map((row) => (
            <article
              key={row.label}
              className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-info)]">
                {row.label}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{row.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{row.note}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SelectableRuleCard(props: {
  card: BuilderFocusCard;
  selected: boolean;
}) {
  return (
    <article
      className={[
        "rounded-2xl border p-4",
        props.selected
          ? "border-[var(--mymedlife-border)]/30 bg-[var(--mymedlife-badge-background)]"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-info)]">
            {props.card.eyebrow}
          </p>
          <h3 className="mt-2 text-base font-semibold text-slate-950">{props.card.title}</h3>
        </div>
        <Pill>{props.card.status.replaceAll("_", " ")}</Pill>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{props.card.detail}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--mymedlife-info)]">{props.card.footer}</p>
      {props.card.pills?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {props.card.pills.map((pill) => (
            <span
              key={`${props.card.id}-${pill}`}
              className="rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-2.5 py-1 text-xs font-semibold text-[var(--mymedlife-info)]"
            >
              {pill}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={props.card.focusHref}
          aria-current={props.selected ? "page" : undefined}
          className={
            props.selected
              ? "inline-flex rounded-full bg-[var(--mymedlife-border)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-on-gold)]"
              : "inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
          }
        >
          {props.selected ? "Selected" : "Open in workspace"}
        </Link>
        {props.card.previewHref ? (
          <Link
            href={props.card.previewHref}
            className="inline-flex rounded-full bg-[var(--mymedlife-border)] px-3 py-1.5 text-sm font-semibold text-[var(--mymedlife-on-gold)]"
          >
            {props.card.previewLabel ?? "Open role preview"}
          </Link>
        ) : null}
        {props.card.href ? (
          <Link
            href={props.card.href}
            className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
          >
            {props.card.hrefLabel ?? "Open route"}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-info)]">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{props.value}</p>
    </article>
  );
}

function ToplineFocusCard(props: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-info)]">
        {props.label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{props.value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{props.note}</p>
    </article>
  );
}

function Pill(props: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)] px-3 py-1 text-xs font-semibold text-[var(--mymedlife-info)]">
      {props.children}
    </span>
  );
}

function SmallChip(props: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--mymedlife-border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--mymedlife-info)]">
      {props.children}
    </span>
  );
}

function DetailBlock(props: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-info)]">
        {props.label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{props.children}</p>
    </div>
  );
}

function getSectionFocusStepId(
  definition: SopCampaignDefinition,
  section: string,
) {
  return (
    definition.steps.find((step) => step.phaseLabel === section)?.id ??
    definition.steps[0]?.id
  );
}

function RuleRow(props: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
      <span>{props.label}</span>
      <span
        className={[
          "rounded-full px-2.5 py-1 text-xs font-semibold",
          props.enabled
            ? "bg-[var(--mymedlife-border)] text-[var(--mymedlife-on-gold)]"
            : "border border-slate-200 bg-slate-50 text-slate-500",
        ].join(" ")}
      >
        {props.enabled ? "On" : "Off"}
      </span>
    </div>
  );
}

function toReadableRole(role: SopRole) {
  return role.replaceAll("_", " ");
}

function getBuilderTabDisplayLabel(tab: SopBuilderTab) {
  switch (tab) {
    case "steps":
      return "Steps";
    case "role-matrix":
      return "Role Matrix";
    case "completion":
      return "Completion Rules";
    case "points-kpi":
      return "Points & KPI";
    case "comms":
      return "Comm Triggers";
    case "preview":
      return "Role Preview";
    case "version":
      return "Version Review";
  }
}
