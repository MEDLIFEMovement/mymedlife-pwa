import {
  getSopCampaignDefinition,
  sopBuilderTabs,
} from "@/data/mock-sop-builder";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import type {
  SopBuilderTab,
  SopCampaignDefinition,
} from "@/shared/types/sop-builder";

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
      counts: emptyCounts(),
    };
  }

  const definition = getSopCampaignDefinition(campaignSlug);
  const selectedTab = normalizeTab(requestedTab);

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
      ? buildWorkbench(definition, selectedTab)
      : null,
    counts: definition
      ? {
          steps: definition.steps.length,
          roleRules: definition.roleActionRules.length,
          completionRules:
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

function buildWorkbench(
  definition: SopCampaignDefinition,
  selectedTab: SopBuilderTab,
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
      return {
        title: "Version workbench",
        summary:
          "Use this tab to keep version history and audit expectations attached to the same campaign workflow before any publish lane exists.",
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
