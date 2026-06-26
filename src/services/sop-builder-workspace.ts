import {
  getSopCampaignDefinition,
  sopBuilderTabs,
} from "@/data/mock-sop-builder";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import {
  getPreferredCampaignVersion,
  getSopTemplateBySlug,
} from "@/services/sop-template-registry";
import { getTemplateBuilderSurface } from "@/services/sop-template-builder-read-model";
import type {
  SopBuilderTab,
  SopCampaignDefinition,
} from "@/shared/types/sop-builder";
import type {
  CampaignVersion,
  TemplateImportStatus,
} from "@/shared/types/sop-templates";

export type SopBuilderWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  nextStep: {
    href: string;
    label: string;
    detail: string;
  };
  definition: SopCampaignDefinition | null;
  tabs: readonly SopBuilderTabLink[];
  selectedTab: SopBuilderTab;
  workbench: SopBuilderTabWorkbench | null;
  templateReview: SopTemplateReviewSummary | null;
  counts: {
    steps: number;
    roleRules: number;
    completionRules: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export type SopBuilderTabLink = {
  key: SopBuilderTab;
  label: string;
  href: string;
  selected: boolean;
};

export type SopBuilderTabWorkbench = {
  title: string;
  summary: string;
  stats: readonly {
    label: string;
    value: string;
    note: string;
  }[];
  guardrails: readonly string[];
  adjacentTabs: readonly SopBuilderTabLink[];
  defaultFocusHref: string | null;
  defaultFocusLabel: string;
};

export type SopTemplateReviewSummary = {
  campaignSlug: string;
  versionLabel: string;
  importStatus: TemplateImportStatus;
  provenanceLabel: string;
  workflowName: string;
  coachPdfPages: string;
  chapterPlatformPdfPages: string;
  phaseCount: number;
  stepCount: number;
  sourceReferenceCount: number;
  sourceGapCount: number;
  suggestedRolloutOrder: number;
  sourcePerspectives: readonly {
    key: "coach" | "chapter_platform";
    label: string;
    pdfPages: string;
    summary: string;
    primaryRoles: readonly string[];
    primaryRoutes: readonly string[];
  }[];
  unresolvedAmbiguities: readonly string[];
  sensitiveDataWarnings: readonly string[];
};

export function getSopBuilderWorkspace(
  actor: LocalActorContext,
  campaignSlug: string,
  requestedTab?: string,
): SopBuilderWorkspace {
  if (!canReadSopBackend(actor)) {
    return {
      canReadWorkspace: false,
      title: "SOP builder hidden for this role",
      summary:
        "This builder is an internal backend configuration lane, not a student, coach, or DS reviewer surface.",
      nextStep: {
        href: "/admin",
        label: "Back to admin",
        detail: "Return to the admin control center.",
      },
      definition: null,
      tabs: [],
      selectedTab: "steps",
      workbench: null,
      templateReview: null,
      counts: emptyCounts(),
    };
  }

  const definition = getSopCampaignDefinition(campaignSlug);
  const selectedTab = normalizeTab(requestedTab);
  const template = definition ? getSopTemplateBySlug(definition.slug) : null;
  const preferredVersion = template
    ? getPreferredCampaignVersion(template)
    : null;
  const templateProvenance = preferredVersion
    ? getTemplateProvenance(preferredVersion)
    : null;
  const templateBuilderSurface = definition
    ? getTemplateBuilderSurface(definition.slug)
    : null;

  return {
    canReadWorkspace: true,
    title: definition
      ? `${definition.name} SOP builder`
      : "Campaign SOP builder",
    summary: definition
      ? `Structured backend workflow for ${definition.name}: steps, role matrix, completion, points/KPI, communications, preview, and version history stay visible without enabling admin editing yet.`
      : "Unknown campaign slug. Return to the SOP library.",
    nextStep: definition
      ? {
          href: "/admin/sop-library",
          label: "Back to SOP library",
          detail:
            "Use the library to switch campaigns or compare workflow definitions.",
        }
      : {
          href: "/admin/sop-library",
          label: "Open SOP library",
          detail: "Choose a valid campaign workflow from the library.",
        },
    definition,
    tabs: definition
      ? sopBuilderTabs.map((tab) => ({
          key: tab,
          label: getTabLabel(tab),
          href: `/admin/sop-builder/${definition.slug}?tab=${tab}`,
          selected: tab === selectedTab,
        }))
      : [],
    selectedTab,
    workbench: definition
      ? buildWorkbench(
          definition,
          selectedTab,
          definition && preferredVersion
            ? {
                campaignSlug: definition.slug,
                versionLabel: preferredVersion.label,
                importStatus: preferredVersion.status,
                provenanceLabel:
                  templateProvenance?.label ?? "repo-defined structured draft",
                workflowName: preferredVersion.workflowName,
                coachPdfPages: preferredVersion.coachPdfPages,
                chapterPlatformPdfPages: preferredVersion.chapterPlatformPdfPages,
                phaseCount: preferredVersion.phases.length,
                stepCount: preferredVersion.reviewSummary.extractedStepCount,
                sourceReferenceCount: preferredVersion.sourceReferences.length,
                sourceGapCount: templateProvenance?.sourceGapCount ?? 0,
                suggestedRolloutOrder:
                  preferredVersion.reviewSummary.suggestedRolloutOrder,
                sourcePerspectives: preferredVersion.sourcePerspectives.map(
                  (perspective) => ({
                    key: perspective.key,
                    label: perspective.label,
                    pdfPages: perspective.pdfPages,
                    summary: perspective.summary,
                    primaryRoles: perspective.primaryRoles.map(toReadableRole),
                    primaryRoutes: perspective.primaryRoutes,
                  }),
                ),
                unresolvedAmbiguities:
                  preferredVersion.reviewSummary.unresolvedAmbiguities,
                sensitiveDataWarnings:
                  preferredVersion.reviewSummary.sensitiveDataWarnings,
              }
            : null,
          templateBuilderSurface,
        )
      : null,
    templateReview: definition && preferredVersion
      ? {
          campaignSlug: definition.slug,
          versionLabel: preferredVersion.label,
          importStatus: preferredVersion.status,
          provenanceLabel:
            templateProvenance?.label ?? "repo-defined structured draft",
          workflowName: preferredVersion.workflowName,
          coachPdfPages: preferredVersion.coachPdfPages,
          chapterPlatformPdfPages: preferredVersion.chapterPlatformPdfPages,
          phaseCount: preferredVersion.phases.length,
          stepCount: preferredVersion.reviewSummary.extractedStepCount,
          sourceReferenceCount: preferredVersion.sourceReferences.length,
          sourceGapCount: templateProvenance?.sourceGapCount ?? 0,
          suggestedRolloutOrder:
            preferredVersion.reviewSummary.suggestedRolloutOrder,
          sourcePerspectives: preferredVersion.sourcePerspectives.map(
            (perspective) => ({
              key: perspective.key,
              label: perspective.label,
              pdfPages: perspective.pdfPages,
              summary: perspective.summary,
              primaryRoles: perspective.primaryRoles.map(toReadableRole),
              primaryRoutes: perspective.primaryRoutes,
            }),
          ),
          unresolvedAmbiguities:
            preferredVersion.reviewSummary.unresolvedAmbiguities,
          sensitiveDataWarnings:
            preferredVersion.reviewSummary.sensitiveDataWarnings,
        }
      : null,
    counts: definition
      ? {
          steps: templateBuilderSurface?.steps.length ?? definition.steps.length,
          roleRules:
            templateBuilderSurface?.roleMatrix.length ??
            definition.roleActionRules.length,
          completionRules:
            templateBuilderSurface?.completionRows.length ??
            definition.completionRules.length +
              definition.evidenceRules.length +
              definition.approvalRules.length,
          browserWritesExpected: 0,
          externalWritesExpected: 0,
        }
      : emptyCounts(),
  };
}

function canReadSopBackend(actor: LocalActorContext): boolean {
  const surfaceFamily = getActorSurfaceFamily(actor);

  return surfaceFamily === "staff" || surfaceFamily === "super_admin";
}

function getTemplateProvenance(version: CampaignVersion) {
  const hasCatalogCoverage = version.sourceReferences.some(
    (reference) =>
      reference.sourceType === "campaign_catalog" &&
      reference.certainty !== "missing_source_confirmation",
  );
  const hasPdfCoverage = version.sourceReferences.some(
    (reference) =>
      reference.sourceType === "sop_pdf" &&
      reference.certainty !== "missing_source_confirmation",
  );
  const sourceGapCount = version.sourceReferences.filter(
    (reference) => reference.certainty === "missing_source_confirmation",
  ).length;

  return {
    label:
      hasCatalogCoverage && hasPdfCoverage
        ? "package-backed structured draft"
        : "repo-defined structured draft",
    sourceGapCount,
  };
}

function buildWorkbench(
  definition: SopCampaignDefinition,
  selectedTab: SopBuilderTab,
  templateReview: SopTemplateReviewSummary | null,
  templateBuilderSurface: ReturnType<typeof getTemplateBuilderSurface>,
): SopBuilderTabWorkbench {
  const allTabs = sopBuilderTabs.map((tab) => ({
    key: tab,
    label: getTabLabel(tab),
    href: `/admin/sop-builder/${definition.slug}?tab=${tab}`,
    selected: tab === selectedTab,
  }));
  const adjacentTabs = getAdjacentTabs(allTabs, selectedTab);

  switch (selectedTab) {
    case "steps":
      if (templateBuilderSurface?.steps.length) {
        return {
          title: "Steps workbench",
          summary:
            "Use this tab to trace the campaign from visible student motion into leader and staff review without leaving the builder route family.",
          stats: [
            {
              label: "Visible steps",
              value: `${templateBuilderSurface.steps.length}`,
              note: "Workflow stages mapped from the structured template into real routes and owned surfaces.",
            },
            {
              label: "Linked routes",
              value: `${new Set(templateBuilderSurface.steps.map((step) => step.route)).size}`,
              note: "Distinct route destinations currently tied to the imported step flow.",
            },
            {
              label: "Ready steps",
              value: `${templateBuilderSurface.steps.filter((step) => step.sourceCertainty !== "missing_source_confirmation").length}`,
              note: "Structured steps that already read as real product flow instead of unresolved placeholders.",
            },
          ],
          guardrails: [
            "Keep selected builder detail on the same route through focus=... so a chosen step stays visible while you compare tabs.",
            "Treat linked routes as owned app surfaces, not as disconnected documentation exits.",
            "Do not enable admin editing or outbound sends from the step workbench.",
          ],
          adjacentTabs,
          defaultFocusHref: templateBuilderSurface.steps[0]
            ? buildFocusHref(definition.slug, selectedTab, templateBuilderSurface.steps[0].id)
            : null,
          defaultFocusLabel:
            templateBuilderSurface.steps[0]?.title ?? "Open default focus",
        };
      }

      return {
        title: "Steps workbench",
        summary:
          "Use this tab to trace the campaign from visible student motion into leader and staff review without leaving the builder route family.",
        stats: [
          {
            label: "Visible steps",
            value: `${definition.steps.length}`,
            note: "Workflow stages mapped to real routes and owned surfaces.",
          },
          {
            label: "Linked routes",
            value: `${new Set(definition.steps.map((step) => step.linkedRoute)).size}`,
            note: "Distinct route destinations currently tied to the step flow.",
          },
          {
            label: "Ready steps",
            value: `${definition.steps.filter((step) => step.status === "ready_readonly").length}`,
            note: "Steps that already behave like readable product flow, not placeholders.",
          },
        ],
        guardrails: [
          "Keep selected builder detail on the same route through focus=... so a chosen step stays visible while you compare tabs.",
          "Treat linked routes as owned app surfaces, not as disconnected documentation exits.",
          "Do not enable admin editing or outbound sends from the step workbench.",
        ],
        adjacentTabs,
        defaultFocusHref: definition.steps[0]
          ? buildFocusHref(definition.slug, selectedTab, definition.steps[0].id)
          : null,
        defaultFocusLabel: definition.steps[0]?.title ?? "Open default focus",
      };
    case "role-matrix":
      if (templateBuilderSurface?.roleMatrix.length) {
        return {
          title: "Role matrix workbench",
          summary:
            "Use this tab to confirm who owns each operating move and which scope boundary keeps the workflow role-based instead of generic.",
          stats: [
            {
              label: "Role rules",
              value: `${templateBuilderSurface.roleMatrix.length}`,
              note: "Role-to-route rules shaping the structured workflow model.",
            },
            {
              label: "Canonical roles",
              value: `${new Set(templateBuilderSurface.roleMatrix.map((rule) => rule.role)).size}`,
              note: "Distinct product roles visible in this campaign workflow.",
            },
            {
              label: "Scopes",
              value: `${new Set(templateBuilderSurface.roleMatrix.map((rule) => rule.scope)).size}`,
              note: "Operational scopes represented without schema renames.",
            },
          ],
          guardrails: [
            "Keep route ownership explicit so member, leader, coach, staff, and backend lanes do not collapse into one dashboard.",
            "Map current repo/runtime keys into the canonical role model at the app boundary first.",
            "Leave hosted database keys and RLS naming stable until a later approved migration pass.",
          ],
          adjacentTabs,
          defaultFocusHref: templateBuilderSurface.roleMatrix[0]
            ? buildFocusHref(
                definition.slug,
                selectedTab,
                templateBuilderSurface.roleMatrix[0].id,
              )
            : null,
          defaultFocusLabel:
            templateBuilderSurface.roleMatrix[0]?.actionSummary ??
            "Open default focus",
        };
      }

      return {
        title: "Role matrix workbench",
        summary:
          "Use this tab to confirm who owns each operating move and which scope boundary keeps the workflow role-based instead of generic.",
        stats: [
          {
            label: "Role rules",
            value: `${definition.roleActionRules.length}`,
            note: "Role-to-route rules shaping the operating model.",
          },
          {
            label: "Canonical roles",
            value: `${new Set(definition.roleActionRules.map((rule) => rule.role)).size}`,
            note: "Distinct product roles visible in this campaign workflow.",
          },
          {
            label: "Scopes",
            value: `${new Set(definition.roleActionRules.map((rule) => rule.scope)).size}`,
            note: "Operational scopes represented without schema renames.",
          },
        ],
        guardrails: [
          "Keep route ownership explicit so member, leader, coach, staff, and backend lanes do not collapse into one dashboard.",
          "Map current repo/runtime keys into the canonical role model at the app boundary first.",
          "Leave hosted database keys and RLS naming stable until a later approved migration pass.",
        ],
        adjacentTabs,
        defaultFocusHref: definition.roleActionRules[0]
          ? buildFocusHref(definition.slug, selectedTab, definition.roleActionRules[0].id)
          : null,
        defaultFocusLabel:
          definition.roleActionRules[0]?.actionSummary ?? "Open default focus",
      };
    case "completion":
      if (templateBuilderSurface) {
        return {
          title: "Completion workbench",
          summary:
            "Use this tab to keep completion, evidence, approval, risk, escalation, and closeout rules visible together before any live upload, review, or browser writes are opened.",
          stats: [
            {
              label: "Completion gates",
              value: `${templateBuilderSurface.completionRows.length}`,
              note: "Structured completion, evidence, and approval rows extracted from the imported template.",
            },
            {
              label: "Risk rules",
              value: `${templateBuilderSurface.riskRows.length}`,
              note: "Workflow risks that should stay visible before the lane is considered ready.",
            },
            {
              label: "Escalations",
              value: `${templateBuilderSurface.escalationRows.length}`,
              note: "Escalation actions and owner roles modeled inside the same builder lane.",
            },
            {
              label: "Closeout requirements",
              value: `${templateBuilderSurface.closeoutRows.length}`,
              note: "Required wrap-up outputs kept beside the imported workflow rules.",
            },
          ],
          guardrails: [
            "Keep evidence requirements visible before proof upload or sharing lanes are enabled.",
            "Approval language should explain the human gate without pretending the workflow can auto-complete itself.",
            "Risk, escalation, and closeout posture should stay attached to the workflow definition instead of drifting into separate review docs.",
          ],
          adjacentTabs,
          defaultFocusHref: templateBuilderSurface.completionRows[0]
            ? buildFocusHref(
                definition.slug,
                selectedTab,
                templateBuilderSurface.completionRows[0].id,
              )
            : null,
          defaultFocusLabel:
            templateBuilderSurface.completionRows[0]?.title ??
            "Open default focus",
        };
      }

      return {
        title: "Completion workbench",
        summary:
          "Use this tab to keep completion, evidence, and approval rules visible together before any live upload, review, or browser writes are opened.",
        stats: [
          {
            label: "Completion rules",
            value: `${definition.completionRules.length}`,
            note: "Success-state rules for moving the workflow forward.",
          },
          {
            label: "Evidence rules",
            value: `${definition.evidenceRules.length}`,
            note: "Proof and storage posture rules that stay mock-safe.",
          },
          {
            label: "Approval rules",
            value: `${definition.approvalRules.length}`,
            note: "Human review gates that still own the outcome.",
          },
        ],
        guardrails: [
          "Keep evidence requirements visible before proof upload or sharing lanes are enabled.",
          "Approval language should explain the human gate without pretending the workflow can auto-complete itself.",
          "Storage and browser writes remain blocked until explicitly approved elsewhere.",
        ],
        adjacentTabs,
        defaultFocusHref: definition.completionRules[0]
          ? buildFocusHref(definition.slug, selectedTab, definition.completionRules[0].id)
          : null,
        defaultFocusLabel:
          definition.completionRules[0]?.label ?? "Open default focus",
      };
    case "points-kpi":
      if (templateBuilderSurface?.pointsRows.length) {
        return {
          title: "Points and KPI workbench",
          summary:
            "Use this tab to keep recognition logic and campaign measurement tied to the same workflow, not separated into decorative dashboard metrics.",
          stats: [
            {
              label: "Points rules",
              value: `${templateBuilderSurface.pointsRows.length}`,
              note: "Role-based recognition rows resolved from the structured workflow template.",
            },
            {
              label: "KPI rules",
              value: `${templateBuilderSurface.kpiRows.length}`,
              note: "Structured KPI rules with source notes and optional targets.",
            },
            {
              label: "Total points",
              value: `${templateBuilderSurface.pointsRows.reduce(
                (total, row) =>
                  total + row.pointValues.reduce((sum, value) => sum + value, 0),
                0,
              )}`,
              note: "Aggregate point value currently visible in the structured workflow definition.",
            },
          ],
          guardrails: [
            "Points should reflect actual workflow movement, not separate gamification fluff.",
            "KPI labels should stay connected to a readable source-of-truth statement.",
            "Do not let metric cards outgrow the workflow rules they summarize.",
          ],
          adjacentTabs,
          defaultFocusHref: templateBuilderSurface.kpiRows[0]
            ? buildFocusHref(
                definition.slug,
                selectedTab,
                templateBuilderSurface.kpiRows[0].id,
              )
            : templateBuilderSurface.pointsRows[0]
              ? buildFocusHref(
                  definition.slug,
                  selectedTab,
                  templateBuilderSurface.pointsRows[0].id,
                )
              : null,
          defaultFocusLabel:
            templateBuilderSurface.kpiRows[0]?.label ??
            templateBuilderSurface.pointsRows[0]?.ruleLabels[0] ??
            templateBuilderSurface.pointsRows[0]?.role ??
            "Open default focus",
        };
      }

      return {
        title: "Points and KPI workbench",
        summary:
          "Use this tab to keep recognition logic and campaign measurement tied to the same workflow, not separated into decorative dashboard metrics.",
        stats: [
          {
            label: "Points rules",
            value: `${definition.pointsRules.length}`,
            note: "Reward triggers shaping member and leader recognition.",
          },
          {
            label: "KPI rules",
            value: `${definition.kpiRules.length}`,
            note: "Named measures that should stay route-backed and explainable.",
          },
          {
            label: "Total points",
            value: `${definition.pointsRules.reduce((total, rule) => total + rule.points, 0)}`,
            note: "Aggregate point value currently visible in the workflow definition.",
          },
        ],
        guardrails: [
          "Points should reflect actual workflow movement, not separate gamification fluff.",
          "KPI labels should stay connected to a readable source-of-truth statement.",
          "Do not let metric cards outgrow the workflow rules they summarize.",
        ],
        adjacentTabs,
        defaultFocusHref: definition.pointsRules[0]
          ? buildFocusHref(definition.slug, selectedTab, definition.pointsRules[0].id)
          : null,
        defaultFocusLabel:
          definition.pointsRules[0]?.label ?? "Open default focus",
      };
    case "comms":
      if (templateBuilderSurface) {
        return {
          title: "Communications workbench",
          summary:
            "Use this tab to keep trigger intent, integration boundaries, and hold posture visible without turning the builder into a live sending console.",
          stats: [
            {
              label: "Comms triggers",
              value: `${templateBuilderSurface.commRows.length}`,
              note: "Trigger definitions resolved from the structured workflow template.",
            },
            {
              label: "Boundaries",
              value: `${templateBuilderSurface.integrationBoundaries.length}`,
              note: "External systems that stay blocked, internal-only, or future-facing.",
            },
            {
              label: "Disabled lanes",
              value: `${templateBuilderSurface.integrationBoundaries.filter((boundary) => boundary.mode === "disabled_pending_approval").length}`,
              note: "Systems intentionally held off while the builder remains mock-safe.",
            },
          ],
          guardrails: [
            "Record downstream trigger intent here without enabling email, SMS, n8n, or AI actions.",
            "Use integration boundaries to state what remains blocked, not to imply hidden live behavior.",
            "Keep comms review tied to workflow logic instead of a detached campaign-copy editor.",
          ],
          adjacentTabs,
          defaultFocusHref: templateBuilderSurface.commRows[0]
            ? buildFocusHref(
                definition.slug,
                selectedTab,
                templateBuilderSurface.commRows[0].id,
              )
            : templateBuilderSurface.integrationBoundaries[0]
              ? buildFocusHref(
                  definition.slug,
                  selectedTab,
                  templateBuilderSurface.integrationBoundaries[0].id,
                )
              : null,
          defaultFocusLabel:
            templateBuilderSurface.commRows[0]?.title ??
            templateBuilderSurface.integrationBoundaries[0]?.system ??
            "Open default focus",
        };
      }

      return {
        title: "Communications workbench",
        summary:
          "Use this tab to keep trigger intent, integration boundaries, and hold posture visible without turning the builder into a live sending console.",
        stats: [
          {
            label: "Comms triggers",
            value: `${definition.communicationRules.length}`,
            note: "Trigger definitions that may later feed bounded automation.",
          },
          {
            label: "Boundaries",
            value: `${definition.integrationBoundaries.length}`,
            note: "External systems that stay blocked, internal-only, or future-facing.",
          },
          {
            label: "Disabled lanes",
            value: `${definition.integrationBoundaries.filter((boundary) => boundary.mode === "disabled").length}`,
            note: "Systems intentionally held off while the builder remains mock-safe.",
          },
        ],
        guardrails: [
          "Record downstream trigger intent here without enabling email, SMS, n8n, or AI actions.",
          "Use integration boundaries to state what remains blocked, not to imply hidden live behavior.",
          "Keep comms review tied to workflow logic instead of a detached campaign-copy editor.",
        ],
        adjacentTabs,
        defaultFocusHref: definition.communicationRules[0]
          ? buildFocusHref(definition.slug, selectedTab, definition.communicationRules[0].id)
          : null,
        defaultFocusLabel:
          definition.communicationRules[0]?.trigger ?? "Open default focus",
      };
    case "preview":
      if (templateBuilderSurface?.previewScenarios.length) {
        return {
          title: "Preview workbench",
          summary:
            "Use this tab to walk the role-based product surfaces the structured workflow expects, so each scenario stays tied to a real route and visible state stack.",
          stats: [
            {
              label: "Scenarios",
              value: `${templateBuilderSurface.previewScenarios.length}`,
              note: "Route-backed previews connected to the imported workflow definition.",
            },
            {
              label: "Primary roles",
              value: `${new Set(templateBuilderSurface.previewScenarios.map((scenario) => scenario.primaryRole)).size}`,
              note: "Distinct actors explicitly covered by the current preview set.",
            },
            {
              label: "Visible states",
              value: `${templateBuilderSurface.previewScenarios.reduce((total, scenario) => total + scenario.visibleStates.length, 0)}`,
              note: "State labels already called out across the preview scenarios.",
            },
          ],
          guardrails: [
            "Each preview route should open a real product surface, not a throwaway reference screen.",
            "Scenario text should stay honest about what the current app actually proves.",
            "Preview does not grant live writes or hidden integration behavior.",
          ],
          adjacentTabs,
          defaultFocusHref: templateBuilderSurface.previewScenarios[0]
            ? buildFocusHref(
                definition.slug,
                selectedTab,
                templateBuilderSurface.previewScenarios[0].id,
              )
            : null,
          defaultFocusLabel:
            templateBuilderSurface.previewScenarios[0]?.title ??
            "Open default focus",
        };
      }

      return {
        title: "Preview workbench",
        summary:
          "Use this tab to walk the role-based product surfaces the workflow expects, so each scenario stays tied to a real route and visible state stack.",
        stats: [
          {
            label: "Scenarios",
            value: `${definition.previewScenarios.length}`,
            note: "Route-backed previews connected to the workflow definition.",
          },
          {
            label: "Primary roles",
            value: `${new Set(definition.previewScenarios.map((scenario) => scenario.primaryRole)).size}`,
            note: "Distinct actors explicitly covered by the current preview set.",
          },
          {
            label: "Visible states",
            value: `${definition.previewScenarios.reduce((total, scenario) => total + scenario.visibleStates.length, 0)}`,
            note: "State labels already called out across the preview scenarios.",
          },
        ],
        guardrails: [
          "Each preview route should open a real product surface, not a throwaway reference screen.",
          "Scenario text should stay honest about what the current app actually proves.",
          "Preview does not grant live writes or hidden integration behavior.",
        ],
        adjacentTabs,
        defaultFocusHref: definition.previewScenarios[0]
          ? buildFocusHref(definition.slug, selectedTab, definition.previewScenarios[0].id)
          : null,
        defaultFocusLabel:
          definition.previewScenarios[0]?.title ?? "Open default focus",
      };
    case "version":
      if (templateReview) {
        return {
          title: "Version workbench",
          summary:
            "Use this tab to review imported-template posture, source coverage, and unresolved warnings before any publish lane opens.",
          stats: [
            {
              label: "Imported phases",
              value: `${templateReview.phaseCount}`,
              note: "Structured phases currently visible in the imported draft template.",
            },
            {
              label: "Engine bindings",
              value: `${(templateBuilderSurface?.engineCounts.operationPermissions ?? 0) + (templateBuilderSurface?.engineCounts.validators ?? 0) + (templateBuilderSurface?.engineCounts.handoffs ?? 0) + (templateBuilderSurface?.engineCounts.featureFlags ?? 0)}`,
              note: "Operation permissions, validators, handoffs, and feature flags now modeled beside the imported template.",
            },
            {
              label: "Import traces",
              value: `${templateBuilderSurface?.engineCounts.importTraces ?? 0}`,
              note: "Source-to-template trace records kept visible while the deeper source pass continues.",
            },
          ],
          guardrails: [
            "Imported template posture should stay distinct from final publish approval.",
            "Source-backed warnings stay visible until the permissions matrix and other missing authorities are reconciled.",
            "This tab is still read-only and does not publish anything live.",
          ],
          adjacentTabs,
          defaultFocusHref: buildFocusHref(definition.slug, selectedTab, "current-version"),
          defaultFocusLabel: templateReview.versionLabel,
        };
      }

      return {
        title: "Version workbench",
        summary:
          "Use this tab to keep version history, imported-template posture, and audit expectations attached to the same campaign workflow before any publish lane exists.",
        stats: [
          {
            label: "History entries",
            value: `${definition.version.history.length}`,
            note: "Version points captured in the local workflow history.",
          },
          {
            label: "Audit records",
            value: `${definition.auditRecords.length}`,
            note: "Audit expectations that still need to be visible in the backend story.",
          },
          {
            label: "Approved templates",
            value: `${definition.version.history.filter((entry) => entry.state === "approved_template").length}`,
            note: "Historical entries that read as approved templates, not just drafts.",
          },
        ],
        guardrails: [
          "Version entries should explain workflow change, not just restate a label.",
          "Audit expectations belong beside the builder definition so review posture stays visible.",
          "This tab is still read-only and does not publish anything live.",
        ],
        adjacentTabs,
        defaultFocusHref: buildFocusHref(definition.slug, selectedTab, "current-version"),
        defaultFocusLabel: definition.version.currentLabel,
      };
  }
}

function normalizeTab(requestedTab?: string): SopBuilderTab {
  return sopBuilderTabs.includes(requestedTab as SopBuilderTab)
    ? (requestedTab as SopBuilderTab)
    : "steps";
}

function getTabLabel(tab: SopBuilderTab): string {
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

function emptyCounts(): SopBuilderWorkspace["counts"] {
  return {
    steps: 0,
    roleRules: 0,
    completionRules: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}

function buildFocusHref(
  campaignSlug: string,
  tab: SopBuilderTab,
  focusId: string,
) {
  const searchParams = new URLSearchParams();
  searchParams.set("tab", tab);
  searchParams.set("focus", focusId);
  return `/admin/sop-builder/${campaignSlug}?${searchParams.toString()}`;
}

function getAdjacentTabs(
  tabs: readonly SopBuilderTabLink[],
  selectedTab: SopBuilderTab,
) {
  const orderedTabs = tabs.filter((tab) => tab.key !== selectedTab);

  switch (selectedTab) {
    case "steps":
      return orderedTabs.filter((tab) => tab.key === "role-matrix" || tab.key === "completion");
    case "role-matrix":
      return orderedTabs.filter((tab) => tab.key === "steps" || tab.key === "preview");
    case "completion":
      return orderedTabs.filter((tab) => tab.key === "steps" || tab.key === "comms");
    case "points-kpi":
      return orderedTabs.filter((tab) => tab.key === "preview" || tab.key === "version");
    case "comms":
      return orderedTabs.filter((tab) => tab.key === "completion" || tab.key === "version");
    case "preview":
      return orderedTabs.filter((tab) => tab.key === "role-matrix" || tab.key === "points-kpi");
    case "version":
      return orderedTabs.filter((tab) => tab.key === "comms" || tab.key === "preview");
  }
}

function toReadableRole(role: string) {
  return role.replaceAll("_", " ");
}
