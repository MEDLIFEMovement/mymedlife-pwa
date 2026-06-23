import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  buildSopRolePreviewHref,
  getSopRolePreviewLabel,
} from "@/services/sop-role-preview";
import { getSopBuilderWorkspace } from "@/services/sop-builder-workspace";
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
  const focusWorkspace =
    workspace.canReadWorkspace && workspace.definition
      ? getFocusWorkspace(
          workspace.definition,
          workspace.selectedTab,
          workspace.definition.slug,
          resolvedSearchParams.focus,
        )
      : null;

  if (workspace.canReadWorkspace && !workspace.definition) {
    notFound();
  }

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      {workspace.canReadWorkspace && workspace.definition ? (
        <AdminBackendLaneNav
          current="sop_builder"
          builderLink={{
            href: `/admin/sop-builder/${workspace.definition.slug}?tab=${workspace.selectedTab}`,
            label: `${workspace.definition.name} Builder`,
          }}
        />
      ) : (
        <AdminBackendLaneNav current="sop_library" />
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
          <section className="rounded-[2rem] border border-white/12 bg-[#1f1a12] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
                  SOP builder
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {workspace.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
                  {workspace.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill>{workspace.definition.libraryStatus}</Pill>
                  <Pill>{workspace.definition.version.currentLabel}</Pill>
                  <Pill>{workspace.definition.builderStatus.replaceAll("_", " ")}</Pill>
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
                  className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                >
                  Library
                </Link>
                <Link
                  href={`/admin/sop-builder/${workspace.definition.slug}?tab=preview`}
                  className="w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  Preview
                </Link>
                <Link
                  href={`/admin/sop-builder/${workspace.definition.slug}?tab=version&focus=current-version`}
                  className="w-fit rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-[#26180d]"
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

          <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
                  {workspace.definition.version.currentLabel}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {workspace.definition.name}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
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
                        tab.selected ? "text-[#26180d]" : "text-white/62",
                      ].join(" ")}
                    >
                      <BuilderTabIcon tab={tab.key} />
                    </span>
                    <Link
                      href={tab.href}
                      className={
                        tab.selected
                          ? "block rounded-full bg-amber-200 px-3 py-1.5 pl-9 text-sm font-semibold text-[#26180d]"
                          : "block rounded-full border border-white/10 bg-white/5 px-3 py-1.5 pl-9 text-sm font-semibold text-white"
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
            <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
                    Tab workbench
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {workspace.workbench.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
                    {workspace.workbench.summary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {workspace.workbench.defaultFocusHref ? (
                    <Link
                      href={workspace.workbench.defaultFocusHref}
                      className="rounded-full bg-amber-200 px-3 py-1.5 text-sm font-semibold text-[#26180d]"
                    >
                      Open default focus
                    </Link>
                  ) : null}
                  {workspace.workbench.adjacentTabs.map((tab) => (
                    <Link
                      key={tab.key}
                      href={tab.href}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
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
                        className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/72">
                          {stat.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          {stat.value}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/62">
                          {stat.note}
                        </p>
                      </article>
                    ))}
                  </div>

                  {focusWorkspace?.selected ? (
                    <article className="rounded-[1.35rem] border border-amber-200/18 bg-amber-200/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                        Current workbench focus
                      </p>
                      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-100/72">
                            {focusWorkspace.selected.eyebrow}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-white">
                            {focusWorkspace.selected.title}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-white/72">
                            {focusWorkspace.selected.detail}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Pill>{focusWorkspace.selected.status.replaceAll("_", " ")}</Pill>
                          {focusWorkspace.selected.previewHref ? (
                            <Link
                              href={focusWorkspace.selected.previewHref}
                              className="inline-flex rounded-full bg-amber-200 px-3 py-1.5 text-sm font-semibold text-[#26180d]"
                            >
                              {focusWorkspace.selected.previewLabel ?? "Open role preview"}
                            </Link>
                          ) : null}
                          {focusWorkspace.selected.href ? (
                            <Link
                              href={focusWorkspace.selected.href}
                              className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                            >
                              {focusWorkspace.selected.hrefLabel ?? "Open route"}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ) : null}
                </div>

                <article className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/72">
                    Guardrails
                  </p>
                  <ul className="mt-3 grid gap-3">
                    {workspace.workbench.guardrails.map((item) => (
                      <li
                        key={item}
                        className="rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3 text-sm leading-6 text-white/68"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs leading-5 text-amber-100/62">
                    Default focus: {workspace.workbench.defaultFocusLabel}
                  </p>
                </article>
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
            ),
          )}
        </>
      )}
    </AppShell>
  );
}

function renderSelectedTab(
  definition: SopCampaignDefinition,
  selectedTab: SopBuilderTab,
  focusWorkspace: BuilderFocusWorkspace,
) {
  switch (selectedTab) {
    case "steps":
      return <StepsBuilderSection definition={definition} focusWorkspace={focusWorkspace} />;
    case "role-matrix":
      return (
        <RoleMatrixSection
          definition={definition}
          focusWorkspace={focusWorkspace}
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
        />
      );
    case "comms":
      return (
        <CommsSection
          definition={definition}
          focusWorkspace={focusWorkspace}
        />
      );
    case "preview":
      return (
        <RolePreviewSection
          definition={definition}
          focusWorkspace={focusWorkspace}
        />
      );
    case "version":
      return (
        <VersionReviewSection
          definition={definition}
          focusWorkspace={focusWorkspace}
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
): BuilderFocusWorkspace {
  const cards = getFocusCards(definition, selectedTab, campaignSlug);
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
): BuilderFocusCard[] {
  switch (selectedTab) {
    case "steps":
      return definition.steps.map((step) => ({
        id: step.id,
        title: step.title,
        eyebrow: step.phaseLabel,
        status: step.status,
        detail: step.whyItMatters,
        footer: `Completion signal: ${step.completionSignal}`,
        href: step.linkedRoute,
        hrefLabel: "Open linked route",
        ...buildRolePreviewFields(step.ownerRole, step.linkedRoute),
        focusHref: buildSopBuilderHref(campaignSlug, selectedTab, step.id),
        pills: [step.ownerRole],
      }));
    case "role-matrix":
      return definition.roleActionRules.map((rule) => ({
        id: rule.id,
        title: rule.role,
        eyebrow: "Role matrix",
        status: rule.status,
        detail: rule.actionSummary,
        footer: `Guardrail: ${rule.guardrail}`,
        href: rule.route,
        hrefLabel: "Open role route",
        ...buildRolePreviewFields(rule.role, rule.route),
        focusHref: buildSopBuilderHref(campaignSlug, selectedTab, rule.id),
        pills: [rule.scope],
      }));
    case "completion":
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
          ...buildRolePreviewFields(rule.reviewerRole, rule.route),
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, rule.id),
        })),
      ];
    case "points-kpi":
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
        ...definition.auditRecords.map((record) => ({
          id: record.id,
          title: record.eventType,
          eyebrow: "Audit expectation",
          status: "ready_readonly",
          detail: record.auditExpectation,
          footer: record.targetTable,
          href: record.route,
          hrefLabel: "Open route",
          focusHref: buildSopBuilderHref(campaignSlug, selectedTab, record.id),
        })),
      ];
  }
}

function buildRolePreviewFields(role: SopRole, route: string) {
  return {
    previewHref: buildSopRolePreviewHref(role, route),
    previewLabel: `Preview as ${getSopRolePreviewLabel(role)}`,
  };
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
          ? "inline-flex rounded-full bg-amber-200 px-3 py-1.5 text-xs font-semibold text-[#26180d]"
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
  const focusWorkspace = getFocusWorkspace(definition, selectedTab, campaignSlug, focusId);
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

function StepsBuilderSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
}) {
  const selectedStep = getSelectedStep(props.definition, props.focusWorkspace.selected?.id);

  return (
    <section className="grid gap-4 xl:grid-cols-[260px_minmax(0,1.2fr)_minmax(0,0.92fr)]">
      <aside className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/54">
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
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-white"
            >
              {section}
            </Link>
          ))}
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-white/54">
          Versions
        </p>
        <div className="mt-3 grid gap-2">
          <Link
            href={buildSopBuilderHref(
              props.definition.slug,
              "version",
              "current-version",
            )}
            className="rounded-[1.2rem] border border-white/10 bg-white/5 px-3 py-3 text-left"
          >
            <p className="text-sm font-semibold text-white">
              {props.definition.version.currentLabel}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100/72">
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
              className="rounded-[1.2rem] border border-white/10 bg-black/20 px-3 py-3 text-left"
            >
              <p className="text-sm font-semibold text-white">{entry.label}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/54">
                {entry.updatedLabel}
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-white/54">
          Settings
        </p>
        <div className="mt-3 grid gap-2">
          {props.definition.builderSettings.map((setting) => (
            <Link
              key={setting}
              href="/admin/workflows?section=lanes&focus=campaign-config"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-white"
            >
              {setting}
            </Link>
          ))}
        </div>
      </aside>

      <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Workflow Steps</h2>
            <p className="mt-2 text-sm leading-6 text-white/66">
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
            className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
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
                      ? "border-amber-200/28 bg-amber-200/10"
                      : "border-white/10 bg-black/20",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
                        {step.stepNumber}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{step.title}</h3>
                        <p className="mt-1 text-sm text-white/66">
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
                          ? "inline-flex rounded-full bg-amber-200 px-3 py-1.5 text-sm font-semibold text-[#26180d]"
                          : "inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                      }
                    >
                      {isSelected ? "Selected" : "Open in workspace"}
                    </Link>
                    <Link
                      href={buildSopRolePreviewHref(step.ownerRole, step.linkedRoute)}
                      className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      Preview as {toReadableRole(step.ownerRole)}
                    </Link>
                    <Link
                      href={step.linkedRoute}
                      className="inline-flex rounded-full bg-black/20 px-3 py-1.5 text-sm font-semibold text-white"
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
                    className="justify-self-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
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
            className="justify-self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
          >
            Add Step After Last
          </Link>
        </div>
      </section>

      <aside className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
              {selectedStep.stepNumber}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/54">
                Step Details
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
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
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
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
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-sm font-semibold text-white"
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

          <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
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
}) {
  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
              Step-level workflow behavior
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Role Matrix</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-white/66">
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
            <Pill>{getDistinctRoles(props.definition)} canonical roles</Pill>
            <Pill>{getDistinctScopes(props.definition)} scopes</Pill>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#071d1a]/90">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full">
            <thead className="bg-black/20">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
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
              {props.definition.roleActionRules.map((rule) => {
                const isSelected = props.focusWorkspace.selected?.id === rule.id;
                const routeSteps = props.definition.steps.filter(
                  (step) => step.ownerRole === rule.role || step.affectedRoles.includes(rule.role),
                );
                const evidenceSummary = routeSteps.some((step) => step.evidenceRequired)
                  ? "Required"
                  : "None";
                const approvalSummary = routeSteps.some((step) => step.approvalRequired)
                  ? "Required"
                  : "None";
                const pointsSummary = getRolePointSummary(props.definition, rule.role);
                const kpiSummary =
                  [...new Set(routeSteps.map((step) => step.kpiTag))].join(", ") || "—";

                return (
                  <tr key={rule.id} className={isSelected ? "bg-amber-200/10" : "bg-transparent"}>
                    <td className="border-t border-white/10 px-4 py-4 align-top">
                      <div>
                        <p className="font-semibold text-white">{toReadableRole(rule.role)}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100/72">
                          {rule.scope.replaceAll("_", " ")}
                        </p>
                      </div>
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                      Yes
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                      {getActionRequiredLabel(rule.role)}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                      {getAccessTypeLabel(rule.role)}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-white/72">{rule.route}</span>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={buildSopRolePreviewHref(rule.role, rule.route)}
                            className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Preview
                          </Link>
                          <Link
                            href={rule.route}
                            className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Open route
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                      {rule.actionSummary}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                      {evidenceSummary}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                      {approvalSummary}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                      {pointsSummary}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                      {kpiSummary}
                    </td>
                    <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                      {getRoleMessagingSummary(props.definition, rule.role)}
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
  const evidenceTypes = getEvidenceTypeEntries(props.definition);
  const completionRows = getCompletionRows(props.definition);

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
              Completion / Proof / Approval
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Workflow completion gates
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-white/66">
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
        <article className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
            Completion types
          </p>
          <div className="mt-4 grid gap-3">
            {completionTypes.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{item.label}</h3>
                  <Pill>{item.active ? "modeled" : "future"}</Pill>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/68">{item.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
            Evidence types
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {evidenceTypes.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{item.label}</h3>
                  <Pill>{item.state}</Pill>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/68">{item.note}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#071d1a]/90">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full">
            <thead className="bg-black/20">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
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
                  <tr key={row.id} className={isSelected ? "bg-amber-200/10" : "bg-transparent"}>
                    <td className="border-t border-white/10 px-4 py-4 align-top">
                      <div>
                        <p className="font-semibold text-white">{row.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100/72">
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
                              className="inline-flex rounded-full bg-amber-200 px-3 py-1.5 text-xs font-semibold text-[#26180d]"
                            >
                              {row.previewLabel ?? "Open role preview"}
                            </Link>
                          ) : null}
                          <Link
                            href={row.focusHref}
                            className={
                              isSelected
                                ? "inline-flex rounded-full bg-amber-200 px-3 py-1.5 text-xs font-semibold text-[#26180d]"
                                : "inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                            }
                          >
                            {isSelected ? "Selected" : "Open in workspace"}
                          </Link>
                          <Link
                            href={row.route}
                            className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white"
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

function PointsKpiSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
}) {
  const pointRoles = getRolesWithPoints(props.definition);
  const roleImpactRows = pointRoles.map((role) => ({
    role,
    pointValue: getRolePointSummary(props.definition, role),
    chapterPoints: getChapterPointLabel(props.definition, role),
    kpiImpact: getRoleKpiSummary(props.definition, role),
    approvalBeforePoints: getRoleApprovalSummary(props.definition, role),
    leaderboardVisible: getLeaderboardVisibilityLabel(role),
    capsOverride: getRoleCapsSummary(role),
  }));

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
              Points & KPI Impact
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Recognition and measurement rules
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-white/66">
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
            <Pill>{pointRoles.length} roles with points</Pill>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Role-based points" value={`${pointRoles.length}`} />
        <MiniStat label="Chapter points" value="Visible in chapter totals" />
        <MiniStat label="Approval before points" value="Guarded by workflow" />
        <MiniStat label="Leaderboard visible" value="Member-facing" />
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#071d1a]/90">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full">
            <thead className="bg-black/20">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
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
                <tr key={row.role}>
                  <td className="border-t border-white/10 px-4 py-4 align-top">
                    <p className="font-semibold text-white">{toReadableRole(row.role)}</p>
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {row.pointValue}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {row.chapterPoints}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {row.kpiImpact}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {row.approvalBeforePoints}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {row.leaderboardVisible}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
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
}) {
  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
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
              {
                props.definition.communicationRules.filter(
                  (rule) => rule.deliveryMode !== "disabled",
                ).length
              }{" "}
              enabled internally
            </Pill>
            <Pill>
              {
                props.definition.communicationRules.filter(
                  (rule) => rule.deliveryMode === "disabled",
                ).length
              }{" "}
              blocked external
            </Pill>
            <Pill>{props.definition.integrationBoundaries.length} boundaries</Pill>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#071d1a]/90">
        <div className="overflow-x-auto">
          <table className="min-w-[1160px] w-full">
            <thead className="bg-black/20">
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
              {props.definition.communicationRules.map((rule) => {
                const isSelected = props.focusWorkspace.selected?.id === rule.id;

                return (
                <tr key={rule.id} className={isSelected ? "bg-amber-200/10" : "bg-transparent"}>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {rule.deliveryMode === "disabled" ? "No" : "Yes"}
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
                    {getSourceSystemLabel(rule.deliveryMode)}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                    {getCommunicationTimingLabel(rule.trigger, rule.detail)}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                    {getCommunicationApprovalLabel(rule.deliveryMode)}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm text-white/72">
                    {rule.deliveryMode.replaceAll("_", " ")}
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                    {props.definition.name} workflow
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
              props.focusWorkspace.selected?.id === getIntegrationBoundaryFocusId(boundary.system)
                ? "border-amber-200/28 bg-amber-200/10"
                : "border-white/10 bg-[#071d1a]/90",
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
                focusId={getIntegrationBoundaryFocusId(boundary.system)}
                selected={
                  props.focusWorkspace.selected?.id ===
                  getIntegrationBoundaryFocusId(boundary.system)
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

function RolePreviewSection(props: {
  definition: SopCampaignDefinition;
  focusWorkspace: BuilderFocusWorkspace;
}) {
  const scenarioRows = props.definition.previewScenarios.map((scenario) => {
    const relevantSteps = getPreviewScenarioSteps(props.definition, scenario);

    return {
      scenario,
      relevantSteps,
      actionAppears: relevantSteps[0]?.title ?? "Route state preview",
      proofRequested: relevantSteps.some((step) => step.evidenceRequired)
        ? getPreviewEvidenceSummary(props.definition)
        : "None",
      approvalRequired: relevantSteps.some((step) => step.approvalRequired) ? "Yes" : "No",
      pointsEarned: relevantSteps.some((step) => step.pointsEnabled)
        ? getRolePointSummary(props.definition, scenario.primaryRole)
        : "None",
      kpiChanges:
        [...new Set(relevantSteps.map((step) => step.kpiTag))].join(", ") || "—",
      communicationTrigger:
        relevantSteps.length > 0
          ? getRoleMessagingSummary(props.definition, scenario.primaryRole)
          : "No workflow-triggered messages",
    };
  });

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
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
            <Pill>{props.definition.previewScenarios.length} preview scenarios</Pill>
            <Pill>{getDistinctRoles(props.definition)} role lanes in scope</Pill>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#071d1a]/90">
        <div className="overflow-x-auto">
          <table className="min-w-[1320px] w-full">
            <thead className="bg-black/20">
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
                const isSelected = props.focusWorkspace.selected?.id === row.scenario.id;

                return (
                <tr key={row.scenario.id} className={isSelected ? "bg-amber-200/10" : "bg-transparent"}>
                  <td className="border-t border-white/10 px-4 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="font-semibold text-white">
                          {toReadableRole(row.scenario.primaryRole)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100/72">
                          {row.scenario.title}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={buildSopRolePreviewHref(
                            row.scenario.primaryRole,
                            row.scenario.route,
                          )}
                          className="inline-flex rounded-full bg-amber-200 px-3 py-1.5 text-xs font-semibold text-[#26180d]"
                        >
                          Preview as {toReadableRole(row.scenario.primaryRole)}
                        </Link>
                        <Link
                          href={row.scenario.route}
                          className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Open raw route
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="border-t border-white/10 px-4 py-4 align-top text-sm leading-6 text-white/72">
                    {row.scenario.visibleStates.join(", ")}
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
                      focusId={row.scenario.id}
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
}) {
  const liveVersion =
    props.definition.version.history.find((entry) => entry.state === "approved_template") ??
    null;

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
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
              className="rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-[#26180d]"
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
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-white"
            >
              Rollback
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[2rem] border border-amber-200/18 bg-amber-200/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/80">
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
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
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
        </article>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Impacted roles" value={`${getDistinctRoles(props.definition)}`} />
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

      <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
          Change log
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {props.definition.version.history.map((entry, index) => (
            <article
              key={entry.label}
              className={[
                "rounded-[1.35rem] border p-4",
                props.focusWorkspace.selected?.id === `version-${index}`
                  ? "border-amber-200/28 bg-amber-200/10"
                  : "border-white/10 bg-black/20",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{entry.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100/72">
                    {entry.state.replaceAll("_", " ")}
                  </p>
                </div>
                <Pill>{entry.updatedLabel}</Pill>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/68">{entry.summary}</p>
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
        title="Selected version detail"
        focusWorkspace={props.focusWorkspace}
        columnsClassName="grid gap-3 lg:grid-cols-2"
      />
    </section>
  );
}

function getDistinctRoles(definition: SopCampaignDefinition) {
  return new Set(definition.roleActionRules.map((rule) => rule.role)).size;
}

function getDistinctScopes(definition: SopCampaignDefinition) {
  return new Set(definition.roleActionRules.map((rule) => rule.scope)).size;
}

function getIntegrationBoundaryFocusId(system: string) {
  return `boundary-${system.toLowerCase().replaceAll(" ", "-")}`;
}

function getRolesWithPoints(definition: SopCampaignDefinition) {
  return definition.roleActionRules
    .map((rule) => rule.role)
    .filter((role, index, roles) => {
      const hasPoints = definition.steps.some(
        (step) =>
          step.pointsEnabled &&
          (step.ownerRole === role || step.affectedRoles.includes(role)),
      );
      return hasPoints && roles.indexOf(role) === index;
    });
}

function getChapterPointLabel(
  definition: SopCampaignDefinition,
  role: SopRole,
) {
  const relevantSteps = definition.steps.filter(
    (step) =>
      step.pointsEnabled &&
      (step.ownerRole === role || step.affectedRoles.includes(role)),
  );

  if (relevantSteps.length === 0) {
    return "None";
  }

  return role === "president" || role === "committee_chair"
    ? "Visible in chapter total"
    : "Rolls up after approval";
}

function getRoleKpiSummary(definition: SopCampaignDefinition, role: SopRole) {
  const tags = [
    ...new Set(
      definition.steps
        .filter((step) => step.ownerRole === role || step.affectedRoles.includes(role))
        .map((step) => step.kpiTag),
    ),
  ];

  return tags.join(", ") || "—";
}

function getRoleApprovalSummary(
  definition: SopCampaignDefinition,
  role: SopRole,
) {
  const requiresApproval = definition.steps.some(
    (step) =>
      step.pointsEnabled &&
      step.approvalRequired &&
      (step.ownerRole === role || step.affectedRoles.includes(role)),
  );

  return requiresApproval ? "Yes" : "No";
}

function getLeaderboardVisibilityLabel(role: SopRole) {
  switch (role) {
    case "student_member":
    case "committee_member":
    case "committee_chair":
    case "president":
      return "Visible";
    default:
      return "Internal only";
  }
}

function getRoleCapsSummary(role: SopRole) {
  switch (role) {
    case "department_staff":
    case "sales_admin":
    case "ds_admin":
    case "super_admin":
      return "Manual override later";
    case "president":
    case "committee_chair":
      return "Chapter cap later";
    default:
      return "User cap later";
  }
}

function getEvidenceTypeEntries(definition: SopCampaignDefinition) {
  const formats = new Set(
    definition.evidenceRules.flatMap((rule) => rule.acceptedFormats),
  );

  return [
    {
      label: "None",
      state: definition.steps.some((step) => !step.evidenceRequired) ? "available" : "unused",
      note: "Used when a workflow move is visible without requiring extra proof.",
    },
    {
      label: "Text",
      state: formats.has("testimonial_text") ? "modeled" : "future",
      note: "Member story context or chapter notes can stay metadata-first.",
    },
    {
      label: "Link",
      state: "future",
      note: "Reserved for future downstream references without opening uploads yet.",
    },
    {
      label: "File",
      state: "future",
      note: "General file upload remains blocked until storage and moderation approval.",
    },
    {
      label: "Image",
      state: formats.has("event_photo") ? "modeled" : "future",
      note: "Photo proof remains named and visible before storage writes are enabled.",
    },
    {
      label: "Video",
      state: formats.has("bridge_video") ? "modeled" : "future",
      note: "Bridge or testimonial video stays planned without opening public sharing.",
    },
    {
      label: "Attendance",
      state: definition.steps.some((step) => step.linkedRoute.includes("events"))
        ? "modeled"
        : "future",
      note: "Event attendance remains a workflow signal rather than a builder shortcut.",
    },
  ] as const;
}

function getCompletionRows(definition: SopCampaignDefinition) {
  const auditBehavior =
    definition.auditRecords[0]?.auditExpectation ??
    "Audit rows should persist when live writes are approved later.";

  return [
    ...definition.completionRules.map((rule) => ({
      id: rule.id,
      label: rule.label,
      family: "Completion rule",
      completionType: getCompletionTypeLabel(rule.label),
      evidenceType: "State readback",
      reviewerRole: "—",
      approvalRequired: "No",
      overdueEscalation: getCompletionEscalationLabel(definition, "completion"),
      auditBehavior,
      route: getDefaultCompletionRoute(definition),
      focusHref: buildSopBuilderHref(definition.slug, "completion", rule.id),
      previewHref: buildSopRolePreviewHref("student_member", getDefaultCompletionRoute(definition)),
      previewLabel: "Preview as student member",
    })),
    ...definition.evidenceRules.map((rule) => ({
      id: rule.id,
      label: rule.label,
      family: "Evidence rule",
      completionType: "Evidence",
      evidenceType: formatEvidenceFormats(rule.acceptedFormats),
      reviewerRole: "Visible before reviewer handoff",
      approvalRequired: "Conditional",
      overdueEscalation: getCompletionEscalationLabel(definition, "evidence"),
      auditBehavior,
      route: rule.route,
      focusHref: buildSopBuilderHref(definition.slug, "completion", rule.id),
      previewHref: buildSopRolePreviewHref("committee_member", rule.route),
      previewLabel: "Preview as committee member",
    })),
    ...definition.approvalRules.map((rule) => ({
      id: rule.id,
      label: rule.label,
      family: "Approval rule",
      completionType: "Approval",
      evidenceType: "Review packet",
      reviewerRole: toReadableRole(rule.reviewerRole),
      approvalRequired: "Yes",
      overdueEscalation: getCompletionEscalationLabel(definition, "approval"),
      auditBehavior,
      route: rule.route,
      focusHref: buildSopBuilderHref(definition.slug, "completion", rule.id),
      previewHref: buildSopRolePreviewHref(rule.reviewerRole, rule.route),
      previewLabel: `Preview as ${toReadableRole(rule.reviewerRole)}`,
    })),
  ];
}

function getCompletionTypeLabel(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("proof")) {
    return "Evidence";
  }
  if (normalized.includes("leaderboard")) {
    return "Threshold";
  }
  if (normalized.includes("move to in progress")) {
    return "Manual";
  }

  return "Checklist";
}

function getCompletionEscalationLabel(
  definition: SopCampaignDefinition,
  family: "completion" | "evidence" | "approval",
) {
  const relevantStep = definition.steps.find((step) => {
    if (family === "evidence") {
      return step.evidenceRequired;
    }
    if (family === "approval") {
      return step.approvalRequired;
    }
    return true;
  });

  return relevantStep
    ? `${relevantStep.dueTiming}; ${relevantStep.riskEscalation}`
    : "Timing and escalation remain packeted for this family.";
}

function getDefaultCompletionRoute(definition: SopCampaignDefinition) {
  return definition.steps.find((step) => step.ownerRole === "student_member")?.linkedRoute ??
    definition.steps[0]?.linkedRoute ??
    "/rush-month/actions";
}

function formatEvidenceFormats(formats: readonly string[]) {
  const readable = formats.map((format) => formatToken(format));
  return readable.join(", ");
}

function getSourceSystemLabel(mode: "disabled" | "internal_only" | "future_external") {
  switch (mode) {
    case "internal_only":
      return "myMEDLIFE app";
    case "future_external":
      return "Downstream system";
    case "disabled":
      return "HubSpot / downstream only";
  }
}

function getCommunicationTimingLabel(trigger: string, detail: string) {
  const normalized = `${trigger} ${detail}`.toLowerCase();

  if (normalized.includes("approved")) {
    return "After approval";
  }
  if (normalized.includes("reminder")) {
    return "Reminder cadence";
  }
  if (normalized.includes("visible progress")) {
    return "After visible progress";
  }

  return "Workflow-timed";
}

function getCommunicationApprovalLabel(
  mode: "disabled" | "internal_only" | "future_external",
) {
  switch (mode) {
    case "internal_only":
      return "No external approval needed";
    case "future_external":
      return "Yes before external send";
    case "disabled":
      return "Blocked until approved";
  }
}

function getPreviewScenarioSteps(
  definition: SopCampaignDefinition,
  scenario: SopCampaignDefinition["previewScenarios"][number],
) {
  const matchingByRoute = definition.steps.filter(
    (step) =>
      step.linkedRoute === scenario.route ||
      scenario.route.startsWith(step.linkedRoute) ||
      step.linkedRoute.startsWith(scenario.route),
  );

  const matchingByRole = definition.steps.filter(
    (step) =>
      step.ownerRole === scenario.primaryRole ||
      step.affectedRoles.includes(scenario.primaryRole),
  );

  return dedupeSteps([...matchingByRoute, ...matchingByRole]);
}

function dedupeSteps(steps: readonly SopCampaignDefinition["steps"][number][]) {
  return steps.filter(
    (step, index, allSteps) => allSteps.findIndex((candidate) => candidate.id === step.id) === index,
  );
}

function getPreviewEvidenceSummary(definition: SopCampaignDefinition) {
  const formats = definition.evidenceRules[0]?.acceptedFormats;
  return formats?.length ? formatEvidenceFormats(formats) : "Required";
}

function getAccessTypeLabel(role: SopRole) {
  switch (role) {
    case "department_staff":
    case "sales_admin":
    case "ds_admin":
    case "super_admin":
      return "configure";
    case "president":
    case "vice_president":
    case "coach":
      return "approve";
    case "student_member":
    case "committee_member":
    case "committee_chair":
    case "eboard_officer":
      return "submit";
    default:
      return "read";
  }
}

function getActionRequiredLabel(role: SopRole) {
  switch (role) {
    case "department_staff":
    case "sales_admin":
    case "ds_admin":
    case "super_admin":
      return "Optional review";
    default:
      return "Yes";
  }
}

function getRolePointSummary(definition: SopCampaignDefinition, role: SopRole) {
  const relevantSteps = definition.steps.filter(
    (step) => step.ownerRole === role || step.affectedRoles.includes(role),
  );

  if (!relevantSteps.some((step) => step.pointsEnabled)) {
    return "None";
  }

  const basePoints =
    definition.pointsRules.reduce((sum, rule) => sum + rule.points, 0) /
    Math.max(definition.pointsRules.length, 1);

  const modifier = role === "president" ? 10 : role === "committee_chair" ? 5 : 0;
  return `${Math.round(basePoints + modifier)} avg`;
}

function getRoleMessagingSummary(definition: SopCampaignDefinition, role: SopRole) {
  const routeSteps = definition.steps.filter(
    (step) => step.ownerRole === role || step.affectedRoles.includes(role),
  );
  const totalMessages = routeSteps.reduce(
    (sum, step) => sum + step.communicationCount,
    0,
  );

  return `${totalMessages} workflow-triggered messages across ${routeSteps.length} step${
    routeSteps.length === 1 ? "" : "s"
  }`;
}

function FocusedTabSection(props: {
  title: string;
  focusWorkspace: BuilderFocusWorkspace;
  columnsClassName: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
      <h2 className="text-2xl font-semibold text-white">{props.title}</h2>
      {props.focusWorkspace.selected ? (
        <section className="mt-4 rounded-[1.5rem] border border-amber-200/18 bg-amber-200/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/72">
            Selected in workspace
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-100/72">
                {props.focusWorkspace.selected.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {props.focusWorkspace.selected.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/72">
                {props.focusWorkspace.selected.detail}
              </p>
              <p className="mt-3 text-sm leading-6 text-amber-100/78">
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
                  className="inline-flex rounded-full bg-amber-200 px-3 py-1.5 text-sm font-semibold text-[#26180d]"
                >
                  {props.focusWorkspace.selected.previewLabel ?? "Open role preview"}
                </Link>
              ) : null}
              {props.focusWorkspace.selected.href ? (
                <Link
                  href={props.focusWorkspace.selected.href}
                  className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
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
  } | null;
}) {
  if (!props.notice) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-amber-200/24 bg-amber-200/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
            Mock-safe builder action
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {props.notice.title}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/72">
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
          className="w-fit rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-[#26180d]"
        >
          Return to workflow
        </Link>
      </div>
      <ul className="mt-4 grid gap-3 lg:grid-cols-3">
        {props.notice.guardrails.map((item) => (
          <li
            key={item}
            className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/68"
          >
            {item}
          </li>
        ))}
      </ul>
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
          ? "border-amber-200/28 bg-amber-200/10"
          : "border-white/10 bg-black/20",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-100/72">
            {props.card.eyebrow}
          </p>
          <h3 className="mt-2 text-base font-semibold text-white">{props.card.title}</h3>
        </div>
        <Pill>{props.card.status.replaceAll("_", " ")}</Pill>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/66">{props.card.detail}</p>
      <p className="mt-3 text-sm leading-6 text-amber-100/72">{props.card.footer}</p>
      {props.card.pills?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {props.card.pills.map((pill) => (
            <span
              key={`${props.card.id}-${pill}`}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/62"
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
              ? "inline-flex rounded-full bg-amber-200 px-3 py-1.5 text-sm font-semibold text-[#26180d]"
              : "inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
          }
        >
          {props.selected ? "Selected" : "Open in workspace"}
        </Link>
        {props.card.previewHref ? (
          <Link
            href={props.card.previewHref}
            className="inline-flex rounded-full bg-amber-200 px-3 py-1.5 text-sm font-semibold text-[#26180d]"
          >
            {props.card.previewLabel ?? "Open role preview"}
          </Link>
        ) : null}
        {props.card.href ? (
          <Link
            href={props.card.href}
            className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
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
    <article className="rounded-2xl border border-white/10 bg-[#071d1a]/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/54">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{props.value}</p>
    </article>
  );
}

function ToplineFocusCard(props: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/72">
        {props.label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{props.value}</p>
      <p className="mt-2 text-sm leading-6 text-white/62">{props.note}</p>
    </article>
  );
}

function Pill(props: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/72">
      {props.children}
    </span>
  );
}

function SmallChip(props: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/62">
      {props.children}
    </span>
  );
}

function DetailBlock(props: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
        {props.label}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/72">{props.children}</p>
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
    <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/72">
      <span>{props.label}</span>
      <span
        className={[
          "rounded-full px-2.5 py-1 text-xs font-semibold",
          props.enabled
            ? "bg-amber-200 text-[#26180d]"
            : "border border-white/10 bg-black/20 text-white/62",
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

function formatToken(value: string) {
  return value.replaceAll("_", " ");
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
