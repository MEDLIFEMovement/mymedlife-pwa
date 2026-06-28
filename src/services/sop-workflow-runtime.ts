import { getSopCampaignDefinition } from "@/data/mock-sop-builder";
import { getModuleFeatureAvailability } from "@/modules/feature-flags";
import {
  buildOutboxPreviewRecords,
  getPreferredCampaignVersion,
  getSopTemplateBySlug,
} from "@/services/sop-template-registry";
import { buildSopRolePreviewHref as buildWorkflowRolePreviewHref } from "@/services/sop-role-preview";
import { getSopRolePreviewLabel } from "@/services/sop-role-preview";
import { getTemplateBuilderSurface } from "@/services/sop-template-builder-read-model";
import type {
  SopCampaignDefinition,
  SopRole,
  SopRuleStatus,
  SopScope,
  SopSourceCertainty,
} from "@/shared/types/sop-builder";
import type { IntegrationEvent, OutboxItem } from "@/shared/types/domain";
import type { CampaignVersion, TemplateSourceCertainty } from "@/shared/types/sop-templates";

export type WorkflowRuntimeSourceKind =
  | "template_version"
  | "builder_definition";

export type WorkflowRuntimeStep = {
  id: string;
  phaseLabel: string;
  title: string;
  route: string;
  primaryRole: SopRole;
  supportingRoles: readonly SopRole[];
  whyItMatters: string;
  completionSignal: string;
  kpiLabels: readonly string[];
  evidenceRequired: boolean;
  approvalRequired: boolean;
  pointsEnabled: boolean;
  status: SopRuleStatus;
};

export type WorkflowRuntimePhase = {
  id: string;
  label: string;
  sequence: number;
  objective: string;
  entryCriteria: readonly string[];
  exitCriteria: readonly string[];
  stepIds: readonly string[];
  status: SopRuleStatus;
  sourceCertainty: SopSourceCertainty | TemplateSourceCertainty;
  riskSignals: readonly string[];
};

export type WorkflowRuntimeRoleLane = {
  id: string;
  role: SopRole;
  scope: SopScope;
  route: string;
  summary: string;
  status: SopRuleStatus;
  guardrail: string;
};

export type WorkflowRuntimeKpi = {
  id: string;
  metricKey: string;
  label: string;
  targetValue: number | null;
  sourceLabel: string;
  status: SopRuleStatus;
};

export type WorkflowRuntimePreviewScenario = {
  id: string;
  title: string;
  primaryRole: SopRole;
  route: string;
  visibleStates: readonly string[];
  successSignal: string;
  proofRequested: string;
  approvalRequired: string;
  pointsEarned: string;
  kpiChanges: string;
  communicationTrigger: string;
};

export type WorkflowRoleSummary = {
  evidenceSummary: string;
  approvalSummary: string;
  pointSummary: string;
  kpiSummary: string;
  messagingSummary: string;
};

export type WorkflowRoleImpactRow = {
  id: string;
  role: SopRole;
  scope: SopScope;
  route: string;
  summary: string;
  evidenceSummary: string;
  approvalSummary: string;
  pointSummary: string;
  kpiSummary: string;
  messagingSummary: string;
};

export type WorkflowRolePointsRow = {
  role: SopRole;
  chapterPoints: string;
  pointValue: string;
  kpiImpact: string;
  approvalBeforePoints: string;
  leaderboardVisible: string;
  capsOverride: string;
};

export type WorkflowCommunicationRow = {
  id: string;
  enabled: boolean;
  trigger: string;
  detail: string;
  audience: string;
  sourceSystemLabel: string;
  timingLabel: string;
  approvalLabel: string;
  deliveryModeLabel: string;
  workflowReference: string;
};

export type WorkflowCommunicationSummary = {
  enabledInternallyCount: number;
  blockedExternalCount: number;
};

export type WorkflowPreviewRow = {
  id: string;
  title: string;
  primaryRole: SopRole;
  route: string;
  visibleStates: readonly string[];
  successSignal: string;
  actionAppears: string;
  proofRequested: string;
  approvalRequired: string;
  pointsEarned: string;
  kpiChanges: string;
  communicationTrigger: string;
};

export type WorkflowPreviewScenarioSource = {
  id: string;
  title: string;
  primaryRole: SopRole;
  route: string;
  visibleStates: readonly string[];
  successSignal: string;
  proofRequested: string;
  approvalRequired: string;
  pointsEarned: string;
  kpiChanges: string;
  communicationTrigger: string;
};

export type WorkflowEvidenceTypeEntry = {
  label: string;
  state: "available" | "unused" | "modeled" | "future";
  note: string;
};

export type WorkflowCompletionRow = {
  id: string;
  label: string;
  family: "Completion rule" | "Evidence rule" | "Approval rule";
  completionType: string;
  evidenceType: string;
  reviewerRole: string;
  approvalRequired: string;
  overdueEscalation: string;
  auditBehavior: string;
  route: string;
  focusHref: string;
  previewHref: string;
  previewLabel: string;
};

export type WorkflowRuntimeEnginePosture = {
  operationPermissionCount: number;
  validatorCount: number;
  handoffCount: number;
  featureFlagCount: number;
  sourceTraceCount: number;
  missingSourceConfirmationCount: number;
};

export type WorkflowRuntimeSnapshot = {
  campaignSlug: string;
  name: string;
  summary: string;
  studentPromise: string;
  operatingRhythm: string;
  sourceKind: WorkflowRuntimeSourceKind;
  sourceVersionLabel: string;
  phases: readonly WorkflowRuntimePhase[];
  currentPhase: WorkflowRuntimePhase | null;
  steps: readonly WorkflowRuntimeStep[];
  currentStep: WorkflowRuntimeStep | null;
  roleLanes: readonly WorkflowRuntimeRoleLane[];
  kpis: readonly WorkflowRuntimeKpi[];
  previewScenarios: readonly WorkflowRuntimePreviewScenario[];
  enginePosture: WorkflowRuntimeEnginePosture;
  whatGoodLooksLike: readonly string[];
  futureStructuredEvents: readonly IntegrationEvent[];
  disabledOutboxItems: readonly OutboxItem[];
  safetyNotes: readonly string[];
};

export function getSopWorkflowRuntime(
  campaignSlug: string,
): WorkflowRuntimeSnapshot | null {
  if (!getModuleFeatureAvailability("sop_workflows_next_action").enabled) {
    return null;
  }

  const template = getSopTemplateBySlug(campaignSlug);
  const preferredVersion = template
    ? getPreferredCampaignVersion(template)
    : null;

  if (template && preferredVersion) {
    return buildTemplateRuntime(template.slug, template.name, preferredVersion);
  }

  const definition = getSopCampaignDefinition(campaignSlug);

  if (!definition) {
    return null;
  }

  return buildDefinitionRuntime(definition);
}

export function getWorkflowCheckpointLabel(
  runtime: WorkflowRuntimeSnapshot | null,
  fallbackLabel: string,
) {
  const currentStep = runtime?.currentStep;

  if (!runtime || !currentStep) {
    return fallbackLabel;
  }

  const stepIndex = runtime.steps.findIndex((step) => step.id === currentStep.id);
  const checkpointNumber = stepIndex >= 0 ? Math.max(1, stepIndex + 1) : null;

  if (!checkpointNumber) {
    return currentStep.title;
  }

  return `Week ${Math.min(4, checkpointNumber)}: ${currentStep.title}`;
}

export function getWorkflowCurrentPhaseObjective(
  runtime: WorkflowRuntimeSnapshot | null,
  fallbackObjective: string,
) {
  return (
    runtime?.currentPhase?.objective ??
    runtime?.currentStep?.whyItMatters ??
    fallbackObjective
  );
}

export function getWorkflowCurrentPhaseExitSignal(
  runtime: WorkflowRuntimeSnapshot | null,
  fallbackExitSignal: string,
) {
  return (
    runtime?.currentPhase?.exitCriteria[0] ??
    runtime?.currentStep?.completionSignal ??
    fallbackExitSignal
  );
}

export function getWorkflowRoleSummary(
  definition: SopCampaignDefinition,
  role: SopRole,
): WorkflowRoleSummary {
  const relevantSteps = definition.steps.filter(
    (step) => step.ownerRole === role || step.affectedRoles.includes(role),
  );

  return {
    evidenceSummary: relevantSteps.some((step) => step.evidenceRequired)
      ? "Required"
      : "None",
    approvalSummary: relevantSteps.some((step) => step.approvalRequired)
      ? "Required"
      : "None",
    pointSummary: getWorkflowRolePointSummary(definition, role, relevantSteps),
    kpiSummary: [...new Set(relevantSteps.map((step) => step.kpiTag))].join(", ") || "—",
    messagingSummary: getWorkflowRoleMessagingSummary(relevantSteps),
  };
}

export function getWorkflowRoleImpactRows(
  definition: SopCampaignDefinition,
): readonly WorkflowRoleImpactRow[] {
  return definition.roleActionRules.map((rule) => ({
    id: rule.id,
    role: rule.role,
    scope: rule.scope,
    route: rule.route,
    summary: rule.actionSummary,
    ...getWorkflowRoleSummary(definition, rule.role),
  }));
}

export function getWorkflowRolePointsRows(
  definition: SopCampaignDefinition,
): readonly WorkflowRolePointsRow[] {
  return getRolesWithPoints(definition).map((role) => {
    const roleSummary = getWorkflowRoleSummary(definition, role);

    return {
      role,
      chapterPoints: getWorkflowChapterPointLabel(role),
      pointValue: roleSummary.pointSummary,
      kpiImpact: roleSummary.kpiSummary,
      approvalBeforePoints: roleSummary.approvalSummary,
      leaderboardVisible: getWorkflowLeaderboardVisibilityLabel(role),
      capsOverride: getWorkflowRoleCapsSummary(role),
    };
  });
}

export function getWorkflowCommunicationRows(
  definition: SopCampaignDefinition,
): readonly WorkflowCommunicationRow[] {
  return definition.communicationRules.map((rule) => ({
    id: rule.id,
    enabled: rule.deliveryMode !== "disabled",
    trigger: rule.trigger,
    detail: rule.detail,
    audience: rule.audience,
    sourceSystemLabel: getWorkflowCommunicationSourceSystemLabel(rule.deliveryMode),
    timingLabel: getWorkflowCommunicationTimingLabel(rule.trigger, rule.detail),
    approvalLabel: getWorkflowCommunicationApprovalLabel(rule.deliveryMode),
    deliveryModeLabel: rule.deliveryMode.replaceAll("_", " "),
    workflowReference: `${definition.name} workflow`,
  }));
}

export function getWorkflowCommunicationSummary(
  definition: SopCampaignDefinition,
): WorkflowCommunicationSummary {
  const rows = getWorkflowCommunicationRows(definition);

  return {
    enabledInternallyCount: rows.filter((row) => row.enabled).length,
    blockedExternalCount: rows.filter((row) => !row.enabled).length,
  };
}

export function getWorkflowCompletionRows(
  definition: SopCampaignDefinition,
): readonly WorkflowCompletionRow[] {
  const auditBehavior =
    definition.auditRecords[0]?.auditExpectation ??
    "Audit rows should persist when live writes are approved later.";

  return [
    ...definition.completionRules.map((rule) => ({
      id: rule.id,
      label: rule.label,
      family: "Completion rule" as const,
      completionType: getWorkflowCompletionTypeLabel(rule.label),
      evidenceType: "State readback",
      reviewerRole: "—",
      approvalRequired: "No",
      overdueEscalation: getWorkflowCompletionEscalationLabel(definition, "completion"),
      auditBehavior,
      route: getWorkflowDefaultCompletionRoute(definition),
      focusHref: buildWorkflowBuilderHref(definition.slug, "completion", rule.id),
      previewHref: buildWorkflowRolePreviewHref(
        "student_member",
        getWorkflowDefaultCompletionRoute(definition),
      ),
      previewLabel: "Preview as student member",
    })),
    ...definition.evidenceRules.map((rule) => ({
      id: rule.id,
      label: rule.label,
      family: "Evidence rule" as const,
      completionType: "Evidence",
      evidenceType: formatWorkflowEvidenceFormats(rule.acceptedFormats),
      reviewerRole: "Visible before reviewer handoff",
      approvalRequired: "Conditional",
      overdueEscalation: getWorkflowCompletionEscalationLabel(definition, "evidence"),
      auditBehavior,
      route: rule.route,
      focusHref: buildWorkflowBuilderHref(definition.slug, "completion", rule.id),
      previewHref: buildWorkflowRolePreviewHref("committee_member", rule.route),
      previewLabel: "Preview as committee member",
    })),
    ...definition.approvalRules.map((rule) => ({
      id: rule.id,
      label: rule.label,
      family: "Approval rule" as const,
      completionType: "Approval",
      evidenceType: "Review packet",
      reviewerRole: getWorkflowReadableRole(rule.reviewerRole),
      approvalRequired: "Yes",
      overdueEscalation: getWorkflowCompletionEscalationLabel(definition, "approval"),
      auditBehavior,
      route: rule.route,
      focusHref: buildWorkflowBuilderHref(definition.slug, "completion", rule.id),
      previewHref: buildWorkflowRolePreviewHref(rule.reviewerRole, rule.route),
      previewLabel: `Preview as ${getWorkflowReadableRole(rule.reviewerRole)}`,
    })),
  ];
}

export function getWorkflowAccessTypeLabel(role: SopRole) {
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

export function getWorkflowActionRequiredLabel(role: SopRole) {
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

export function buildWorkflowPreviewRow(
  scenario: WorkflowPreviewScenarioSource,
): WorkflowPreviewRow {
  return {
    id: scenario.id,
    title: scenario.title,
    primaryRole: scenario.primaryRole,
    route: scenario.route,
    visibleStates: scenario.visibleStates,
    successSignal: scenario.successSignal,
    actionAppears: scenario.title,
    proofRequested: scenario.proofRequested,
    approvalRequired: scenario.approvalRequired,
    pointsEarned: scenario.pointsEarned,
    kpiChanges: scenario.kpiChanges,
    communicationTrigger: scenario.communicationTrigger,
  };
}

export function getWorkflowPreviewRows(
  definition: SopCampaignDefinition,
  runtimePreviewScenarios: readonly WorkflowPreviewScenarioSource[] | null | undefined,
  templatePreviewScenarios: readonly WorkflowPreviewScenarioSource[] | null | undefined,
): readonly WorkflowPreviewRow[] {
  if (runtimePreviewScenarios?.length) {
    return runtimePreviewScenarios.map((scenario) => buildWorkflowPreviewRow(scenario));
  }

  if (templatePreviewScenarios?.length) {
    return templatePreviewScenarios.map((scenario) => buildWorkflowPreviewRow(scenario));
  }

  return definition.previewScenarios.map((scenario) => ({
    id: scenario.id,
    title: scenario.title,
    primaryRole: scenario.primaryRole,
    route: scenario.route,
    visibleStates: scenario.visibleStates,
    successSignal: scenario.successSignal,
    actionAppears: scenario.title,
    proofRequested: "None",
    approvalRequired: "No",
    pointsEarned: "None",
    kpiChanges: "—",
    communicationTrigger: "No workflow-triggered messages",
  }));
}

export function getWorkflowPreviewDistinctRoleCount(
  rows: readonly WorkflowPreviewRow[],
) {
  return new Set(rows.map((row) => row.primaryRole)).size;
}

export function buildWorkflowRolePreviewFields(role: SopRole, route: string) {
  return {
    previewHref: buildWorkflowRolePreviewHref(role, route),
    previewLabel: `Preview as ${getSopRolePreviewLabel(role)}`,
  };
}

export function getWorkflowDistinctRoleCount(definition: SopCampaignDefinition) {
  return new Set(definition.roleActionRules.map((rule) => rule.role)).size;
}

export function getWorkflowDistinctScopeCount(definition: SopCampaignDefinition) {
  return new Set(definition.roleActionRules.map((rule) => rule.scope)).size;
}

export function getWorkflowIntegrationBoundaryFocusId(system: string) {
  return `boundary-${system.toLowerCase().replaceAll(" ", "-")}`;
}

export function getWorkflowEvidenceTypeEntries(
  definition: SopCampaignDefinition,
): readonly WorkflowEvidenceTypeEntry[] {
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

function buildDefinitionRuntime(
  definition: SopCampaignDefinition,
): WorkflowRuntimeSnapshot {
  const phases = buildDefinitionPhases(definition);
  const steps = definition.steps.map((step) => ({
    id: step.id,
    phaseLabel: step.phaseLabel,
    title: step.title,
    route: step.linkedRoute,
    primaryRole: step.ownerRole,
    supportingRoles: step.supportingRoles,
    whyItMatters: step.whyItMatters,
    completionSignal: step.completionSignal,
    kpiLabels: [step.kpiTag],
    evidenceRequired: step.evidenceRequired,
    approvalRequired: step.approvalRequired,
    pointsEnabled: step.pointsEnabled,
    status: step.status,
  }));
  const currentStep = getCurrentRuntimeStep(steps);

  return {
    campaignSlug: definition.slug,
    name: definition.name,
    summary: definition.summary,
    studentPromise: definition.studentPromise,
    operatingRhythm: definition.operatingRhythm,
    sourceKind: "builder_definition",
    sourceVersionLabel: definition.version.currentLabel,
    phases,
    currentPhase: getCurrentRuntimePhase(phases, currentStep?.id),
    steps,
    currentStep,
    roleLanes: definition.roleActionRules.map((rule) => ({
      id: rule.id,
      role: rule.role,
      scope: rule.scope,
      route: rule.route,
      summary: rule.actionSummary,
      status: rule.status,
      guardrail: rule.guardrail,
    })),
    kpis: definition.kpiRules.map((rule) => ({
      id: rule.id,
      metricKey: rule.metricKey,
      label: rule.displayLabel,
      targetValue: rule.targetValue ?? null,
      sourceLabel: rule.sourceOfTruth,
      status: rule.status,
    })),
    previewScenarios: buildDefinitionPreviewScenarios(definition, steps),
    enginePosture: {
      operationPermissionCount: definition.operationPermissions.length,
      validatorCount: definition.validators.length,
      handoffCount: definition.handoffRules.length,
      featureFlagCount: definition.featureFlagBindings.length,
      sourceTraceCount: definition.sourceTraces.length,
      missingSourceConfirmationCount: definition.sourceTraces.filter(
        (trace) => trace.certainty === "missing_source_confirmation",
      ).length,
    },
    whatGoodLooksLike: [
      ...definition.completionRules.map((rule) => rule.label),
      ...definition.evidenceRules.map((rule) => rule.label),
      ...definition.approvalRules.map((rule) => rule.label),
    ],
    futureStructuredEvents: buildDefinitionIntegrationEvents(definition),
    disabledOutboxItems: buildDefinitionOutboxItems(definition),
    safetyNotes: buildDefinitionSafetyNotes(definition),
  };
}

function getWorkflowRolePointSummary(
  definition: SopCampaignDefinition,
  role: SopRole,
  relevantSteps: readonly SopCampaignDefinition["steps"][number][],
) {
  if (!relevantSteps.some((step) => step.pointsEnabled)) {
    return "None";
  }

  const basePoints =
    definition.pointsRules.reduce((sum, rule) => sum + rule.points, 0) /
    Math.max(definition.pointsRules.length, 1);

  const modifier = role === "president" ? 10 : role === "committee_chair" ? 5 : 0;
  return `${Math.round(basePoints + modifier)} avg`;
}

function getWorkflowRoleMessagingSummary(
  relevantSteps: readonly SopCampaignDefinition["steps"][number][],
) {
  const totalMessages = relevantSteps.reduce(
    (sum, step) => sum + step.communicationCount,
    0,
  );

  return `${totalMessages} workflow-triggered messages across ${relevantSteps.length} step${
    relevantSteps.length === 1 ? "" : "s"
  }`;
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

function getWorkflowChapterPointLabel(role: SopRole) {
  return role === "president" || role === "committee_chair"
    ? "Visible in chapter total"
    : "Rolls up after approval";
}

function getWorkflowLeaderboardVisibilityLabel(role: SopRole) {
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

function getWorkflowRoleCapsSummary(role: SopRole) {
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

function getWorkflowCommunicationSourceSystemLabel(
  mode: "disabled" | "internal_only" | "future_external",
) {
  switch (mode) {
    case "internal_only":
      return "myMEDLIFE app";
    case "future_external":
      return "Downstream system";
    case "disabled":
      return "HubSpot / downstream only";
  }
}

function getWorkflowCommunicationTimingLabel(trigger: string, detail: string) {
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

function getWorkflowCommunicationApprovalLabel(
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

function buildWorkflowBuilderHref(
  campaignSlug: string,
  tab: "completion" | "steps" | "role-matrix" | "points-kpi" | "comms" | "preview" | "version",
  focusId: string,
) {
  return `/admin/sop-builder/${campaignSlug}?tab=${tab}&focus=${focusId}`;
}

function getWorkflowCompletionTypeLabel(label: string) {
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

function getWorkflowCompletionEscalationLabel(
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

function getWorkflowDefaultCompletionRoute(definition: SopCampaignDefinition) {
  return (
    definition.steps.find((step) => step.ownerRole === "student_member")?.linkedRoute ??
    definition.steps[0]?.linkedRoute ??
    "/rush-month/actions"
  );
}

function formatWorkflowEvidenceFormats(formats: readonly string[]) {
  const readable = formats.map((format) => format.replaceAll("_", " "));
  return readable.join(", ");
}

function getWorkflowReadableRole(role: SopRole) {
  return role.replaceAll("_", " ");
}

function buildTemplateRuntime(
  campaignSlug: string,
  campaignName: string,
  version: CampaignVersion,
): WorkflowRuntimeSnapshot {
  const templateBuilderSurface = getTemplateBuilderSurface(campaignSlug);
  const phases = buildTemplatePhases(version);
  const steps = version.phases.flatMap((phase) =>
    phase.steps.map((step) => ({
      id: step.id,
      phaseLabel: phase.label,
      title: step.label,
      route: pickTemplateStepRoute(version, step),
      primaryRole:
        step.ownerRoles[0] ??
        version.roleActionRules.find((rule) =>
          step.roleActionRuleIds.includes(rule.id),
        )?.role ??
        "student_member",
      supportingRoles: step.supportingRoles,
      whyItMatters: step.whyItMatters ?? step.objective,
      completionSignal:
        step.completionSignal ??
        version.completionRules.find((rule) =>
          step.completionRuleIds.includes(rule.id),
        )?.successSignal ?? phase.objective,
      kpiLabels: step.kpiRuleIds.flatMap((ruleId) => {
        const rule = version.kpiRules.find((candidate) => candidate.id === ruleId);
        return rule ? [rule.displayLabel] : [];
      }),
      evidenceRequired: step.evidenceRuleIds.length > 0,
      approvalRequired: step.approvalRuleIds.length > 0,
      pointsEnabled: step.pointsRuleIds.length > 0,
      status: getTemplateStepStatus(version, step),
    })),
  );
  const currentStep = getCurrentRuntimeStep(steps);

  return {
    campaignSlug,
    name: campaignName,
    summary: version.importSummary,
    studentPromise: version.phases[0]?.objective ?? version.importSummary,
    operatingRhythm: version.workflowName,
    sourceKind: "template_version",
    sourceVersionLabel: version.label,
    phases,
    currentPhase: getCurrentRuntimePhase(phases, currentStep?.id),
    steps,
    currentStep,
    roleLanes: version.roleActionRules.map((rule) => ({
      id: rule.id,
      role: rule.role,
      scope: rule.scope,
      route: rule.visibleInRoutes[0] ?? "/admin/sop-library",
      summary: rule.actionSummary,
      status: rule.blockedByDefault ? "blocked" : "ready_readonly",
      guardrail: rule.blockedByDefault
        ? "This role lane stays blocked by default until the workflow is approved."
        : "This lane is readable in the current mock-safe workflow runtime.",
    })),
    kpis: version.kpiRules.map((rule) => ({
      id: rule.id,
      metricKey: rule.metricKey,
      label: rule.displayLabel,
      targetValue: rule.targetValue ?? null,
      sourceLabel: rule.thresholdLabel ?? "Structured workflow KPI",
      status: getTemplateStatus(rule.sourceCertainty),
    })),
    previewScenarios: buildTemplatePreviewScenarios(
      templateBuilderSurface?.previewScenarios,
      version,
      steps,
    ),
    enginePosture: {
      operationPermissionCount: version.operationPermissions.length,
      validatorCount: version.validatorDefinitions.length,
      handoffCount: version.handoffRules.length,
      featureFlagCount: version.featureFlagBindings.length,
      sourceTraceCount: version.importTraceRecords.length,
      missingSourceConfirmationCount: version.importTraceRecords.filter(
        (trace) => trace.sourceCertainty === "missing_source_confirmation",
      ).length,
    },
    whatGoodLooksLike: [
      ...version.completionRules.map((rule) => rule.label),
      ...version.evidenceRules.map((rule) => rule.label),
      ...version.approvalRules.map((rule) => rule.label),
      ...version.closeoutRequirements.map((requirement) => requirement.label),
    ],
    futureStructuredEvents: buildTemplateIntegrationEvents(campaignSlug, version),
    disabledOutboxItems: buildTemplateOutboxItems(campaignSlug, version),
    safetyNotes: buildTemplateSafetyNotes(version),
  };
}

function buildTemplatePreviewScenarios(
  previewScenarios: readonly {
    id: string;
    title: string;
    primaryRole: SopRole;
    route: string;
    visibleStates: readonly string[];
    successSignal: string;
    proofRequested: string;
    approvalRequired: string;
    pointsEarned: string;
    kpiChanges: string;
    communicationTrigger: string;
  }[] | null | undefined,
  version: CampaignVersion,
  steps: readonly WorkflowRuntimeStep[],
): readonly WorkflowRuntimePreviewScenario[] {
  if (previewScenarios?.length) {
    return previewScenarios.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      primaryRole: scenario.primaryRole,
      route: scenario.route,
      visibleStates: scenario.visibleStates,
      successSignal: scenario.successSignal,
      proofRequested: scenario.proofRequested,
      approvalRequired: scenario.approvalRequired,
      pointsEarned: scenario.pointsEarned,
      kpiChanges: scenario.kpiChanges,
      communicationTrigger: scenario.communicationTrigger,
    }));
  }

  return steps.map((step) => ({
    id: step.id,
    title: step.title,
    primaryRole: step.primaryRole,
    route: step.route,
    visibleStates: step.kpiLabels,
    successSignal: step.completionSignal,
    proofRequested: step.evidenceRequired ? "Evidence required" : "None",
    approvalRequired: step.approvalRequired ? "Yes" : "No",
    pointsEarned: getRuntimeStepPoints(version, step),
    kpiChanges: step.kpiLabels.join(", ") || "—",
    communicationTrigger: step.pointsEnabled
      ? `${step.primaryRole.replaceAll("_", " ")} workflow-triggered message`
      : "No workflow-triggered messages",
  }));
}

function buildDefinitionPreviewScenarios(
  definition: SopCampaignDefinition,
  steps: readonly WorkflowRuntimeStep[],
): readonly WorkflowRuntimePreviewScenario[] {
  return definition.previewScenarios.map((scenario) => {
    const relevantSteps = getRuntimePreviewScenarioSteps(steps, scenario);

    return {
      id: scenario.id,
      title: scenario.title,
      primaryRole: scenario.primaryRole,
      route: scenario.route,
      visibleStates: scenario.visibleStates,
      successSignal: scenario.successSignal,
      proofRequested: relevantSteps.some((step) => step.evidenceRequired)
        ? "Evidence required"
        : "None",
      approvalRequired: relevantSteps.some((step) => step.approvalRequired)
        ? "Yes"
        : "No",
      pointsEarned: getRuntimeScenarioPoints(definition, scenario.primaryRole, relevantSteps),
      kpiChanges: [...new Set(relevantSteps.flatMap((step) => step.kpiLabels))].join(", ") || "—",
      communicationTrigger:
        relevantSteps.length > 0
          ? `${relevantSteps.length} workflow-triggered message${relevantSteps.length === 1 ? "" : "s"}`
          : "No workflow-triggered messages",
    };
  });
}

function buildDefinitionPhases(
  definition: SopCampaignDefinition,
): readonly WorkflowRuntimePhase[] {
  return definition.phases.map((phase) => {
    const phaseSteps = definition.steps.filter((step) => phase.stepIds.includes(step.id));

    return {
      id: phase.id,
      label: phase.label,
      sequence: phase.sequence,
      objective: phase.objective,
      entryCriteria: phase.entryCriteria,
      exitCriteria: phase.exitCriteria,
      stepIds: phase.stepIds,
      status: phase.status,
      sourceCertainty: phase.sourceCertainty,
      riskSignals: unique(phaseSteps.map((step) => step.riskEscalation)),
    };
  });
}

function buildTemplatePhases(version: CampaignVersion): readonly WorkflowRuntimePhase[] {
  return version.phases.map((phase) => {
    const riskSignals = unique(
      phase.steps.flatMap((step) =>
        step.riskRuleIds.flatMap((ruleId) => {
          const rule = version.riskRules.find((candidate) => candidate.id === ruleId);
          return rule ? [rule.label, rule.triggerCondition] : [];
        }),
      ),
    );

    return {
      id: phase.id,
      label: phase.label,
      sequence: phase.sequence,
      objective: phase.objective,
      entryCriteria: phase.entryCriteria,
      exitCriteria: phase.exitCriteria,
      stepIds: phase.steps.map((step) => step.id),
      status: getTemplateStatus(phase.sourceCertainty),
      sourceCertainty: phase.sourceCertainty,
      riskSignals,
    };
  });
}

function getRuntimePreviewScenarioSteps(
  steps: readonly WorkflowRuntimeStep[],
  scenario: {
    route: string;
    primaryRole: SopRole;
  },
) {
  const matchingByRoute = steps.filter(
    (step) =>
      step.route === scenario.route ||
      scenario.route.startsWith(step.route) ||
      step.route.startsWith(scenario.route),
  );

  const matchingByRole = steps.filter(
    (step) =>
      step.primaryRole === scenario.primaryRole ||
      step.supportingRoles.includes(scenario.primaryRole),
  );

  return dedupeRuntimeSteps([...matchingByRoute, ...matchingByRole]);
}

function getRuntimeScenarioPoints(
  definition: SopCampaignDefinition,
  role: SopRole,
  relevantSteps: readonly WorkflowRuntimeStep[],
) {
  const hasRelevantPointStep = definition.steps.some(
    (step) =>
      relevantSteps.some((runtimeStep) => runtimeStep.id === step.id) &&
      step.pointsEnabled &&
      (step.ownerRole === role || step.affectedRoles.includes(role)),
  );

  if (!hasRelevantPointStep) {
    return "None";
  }

  const totalPoints = definition.pointsRules.reduce((sum, rule) => sum + rule.points, 0);

  return `${totalPoints} points`;
}

function getRuntimeStepPoints(version: CampaignVersion, step: WorkflowRuntimeStep) {
  const relevantSteps = version.phases.flatMap((phase) =>
    phase.steps.filter((candidate) => candidate.id === step.id),
  );
  const role = step.primaryRole;
  const hasRelevantPointStep = relevantSteps.some(
    (candidate) =>
      candidate.ownerRoles.includes(role) ||
      candidate.supportingRoles.includes(role),
  );

  if (!hasRelevantPointStep) {
    return "None";
  }

  const totalPoints = version.pointsRules.reduce(
    (sum, rule) => sum + (rule.pointsByRole[role] ?? 0),
    0,
  );

  return totalPoints > 0 ? `${totalPoints} points` : "None";
}

function dedupeRuntimeSteps<T extends { id: string }>(steps: readonly T[]): readonly T[] {
  return steps.filter(
    (step, index, allSteps) => allSteps.findIndex((candidate) => candidate.id === step.id) === index,
  );
}

function getCurrentRuntimeStep(
  steps: readonly WorkflowRuntimeStep[],
): WorkflowRuntimeStep | null {
  return steps.find((step) => step.status === "ready_readonly") ?? steps[0] ?? null;
}

function getCurrentRuntimePhase(
  phases: readonly WorkflowRuntimePhase[],
  currentStepId: string | undefined,
): WorkflowRuntimePhase | null {
  if (!phases.length) {
    return null;
  }

  if (!currentStepId) {
    return phases[0] ?? null;
  }

  return phases.find((phase) => phase.stepIds.includes(currentStepId)) ?? phases[0] ?? null;
}

function buildDefinitionIntegrationEvents(
  definition: SopCampaignDefinition,
): readonly IntegrationEvent[] {
  const events: IntegrationEvent[] = [];

  if (definition.integrationBoundaries.some((boundary) => boundary.system === "Luma")) {
    events.push(
      {
        id: `${definition.slug}-luma-link`,
        eventType: "luma_event_linked",
        title: "Future Luma event linked",
        destination: "Luma",
        status: "disabled",
        detail: "Future Luma event creation or linking stays blocked until approved.",
        occurredAt: "local-mock-time",
      },
      {
        id: `${definition.slug}-luma-attendance`,
        eventType: "luma_attendance_import_mocked",
        title: "Future attendance import mocked",
        destination: "Luma",
        status: "disabled",
        detail: "Attendance import posture remains mock-safe and disabled.",
        occurredAt: "local-mock-time",
      },
    );
  }

  if (
    definition.integrationBoundaries.some((boundary) =>
      boundary.system.toLowerCase().includes("warehouse"),
    ) || definition.kpiRules.length > 0
  ) {
    events.push({
      id: `${definition.slug}-kpi-event`,
      eventType: "kpi_event_recorded",
      title: "Future KPI event recorded",
      destination: "warehouse",
      status: "disabled",
      detail: "Future analytics export remains blocked until the workflow write path is approved.",
      occurredAt: "local-mock-time",
    });
  }

  if (definition.evidenceRules.length > 0) {
    events.push({
      id: `${definition.slug}-evidence-submitted`,
      eventType: "evidence_submitted",
      title: "Future evidence submission recorded",
      destination: "internal",
      status: "disabled",
      detail: "Evidence and proof posture stay readable before uploads or external sharing are enabled.",
      occurredAt: "local-mock-time",
    });
  }

  if (definition.auditRecords.length > 0) {
    events.push({
      id: `${definition.slug}-audit-log`,
      eventType: "audit_log_recorded",
      title: "Future audit log recorded",
      destination: "internal",
      status: "disabled",
      detail: definition.auditRecords[0]?.auditExpectation ?? "Approved workflow actions should remain auditable.",
      occurredAt: "local-mock-time",
    });
  }

  if (definition.integrationBoundaries.some((boundary) => boundary.system === "HubSpot")) {
    events.push({
      id: `${definition.slug}-hubspot-handoff`,
      eventType: "hubspot_handoff_mocked",
      title: "Future HubSpot handoff mocked",
      destination: "HubSpot",
      status: "disabled",
      detail: "CRM lifecycle remains outside the app until explicitly approved.",
      occurredAt: "local-mock-time",
    });
  }

  return events;
}

function buildDefinitionOutboxItems(
  definition: SopCampaignDefinition,
): readonly OutboxItem[] {
  const sourceEventId = `${definition.slug}-workflow-runtime`;
  const items: OutboxItem[] = [];

  if (definition.integrationBoundaries.some((boundary) => boundary.system === "Luma")) {
    items.push(
      {
        id: `${definition.slug}-outbox-luma-create`,
        sourceEventId,
        destination: "Luma",
        status: "disabled",
        payloadSummary: "Future Luma event creation or update remains blocked until approved.",
      },
      {
        id: `${definition.slug}-outbox-luma-attendance`,
        sourceEventId,
        destination: "Luma",
        status: "disabled",
        payloadSummary: "Future Luma attendance import remains blocked until approved.",
      },
    );
  }

  if (definition.integrationBoundaries.some((boundary) => boundary.system === "n8n")) {
    items.push({
      id: `${definition.slug}-outbox-n8n-reminder`,
      sourceEventId,
      destination: "n8n",
      status: "disabled",
      payloadSummary: "Future reminder or automation jobs remain blocked until approved.",
    });
  }

  if (
    definition.integrationBoundaries.some((boundary) =>
      boundary.system.toLowerCase().includes("warehouse"),
    )
  ) {
    items.push({
      id: `${definition.slug}-outbox-warehouse-export`,
      sourceEventId,
      destination: "warehouse",
      status: "disabled",
      payloadSummary: "Future warehouse and reporting export remains blocked until approved.",
    });
  }

  if (definition.integrationBoundaries.some((boundary) => boundary.system === "HubSpot")) {
    items.push({
      id: `${definition.slug}-outbox-hubspot-handoff`,
      sourceEventId,
      destination: "HubSpot",
      status: "disabled",
      payloadSummary: "Future CRM handoff remains blocked until approved.",
    });
  }

  return items;
}

function buildDefinitionSafetyNotes(
  definition: SopCampaignDefinition,
): readonly string[] {
  const boundaryNotes = definition.integrationBoundaries.map((boundary) => boundary.note);
  const communicationNotes = definition.communicationRules.map((rule) => rule.detail);

  return unique([
    ...boundaryNotes,
    ...communicationNotes,
    ...definition.operationPermissions.map((permission) => permission.note),
    ...definition.featureFlagBindings.map((binding) => binding.description),
    "No production sends, uploads, auth changes, or external automation are enabled from this workflow runtime.",
  ]);
}

function buildTemplateIntegrationEvents(
  campaignSlug: string,
  version: CampaignVersion,
): readonly IntegrationEvent[] {
  const triggerEvents = version.integrationTriggerRules.map((rule) => ({
    id: `${campaignSlug}-${rule.id}`,
    eventType: rule.eventName,
    title: `${rule.eventName} posture`,
    destination: mapRuntimeDestination(rule.externalSystem),
    status:
      rule.mode === "internal_only"
        ? ("mocked" as const)
        : ("disabled" as const),
    detail: rule.detail,
    occurredAt: "local-mock-time",
  }));
  const auditEvents =
    version.auditRecords.length > 0
      ? [
          {
            id: `${campaignSlug}-audit-log`,
            eventType: "audit_log_recorded",
            title: "Future audit log recorded",
            destination: "internal" as const,
            status: "disabled" as const,
            detail: version.auditRecords[0]?.note ?? "Approved workflow actions should remain auditable.",
            occurredAt: "local-mock-time",
          },
        ]
      : [];
  const evidenceEvents =
    version.evidenceRules.length > 0
      ? [
          {
            id: `${campaignSlug}-evidence-submitted`,
            eventType: "evidence_submitted",
            title: "Future evidence submission recorded",
            destination: "internal" as const,
            status: "disabled" as const,
            detail: "Evidence posture stays mock-safe until upload and review approval exists.",
            occurredAt: "local-mock-time",
          },
        ]
      : [];

  const normalizedEvents: IntegrationEvent[] = [];

  if (version.integrationTriggerRules.some((rule) => rule.externalSystem === "luma")) {
    normalizedEvents.push(
      {
        id: `${campaignSlug}-luma-link`,
        eventType: "luma_event_linked",
        title: "Future Luma event linked",
        destination: "Luma",
        status: "disabled",
        detail: "Future Luma event creation or linking stays blocked until approved.",
        occurredAt: "local-mock-time",
      },
      {
        id: `${campaignSlug}-luma-attendance`,
        eventType: "luma_attendance_import_mocked",
        title: "Future attendance import mocked",
        destination: "Luma",
        status: "disabled",
        detail: "Attendance import posture remains mock-safe and disabled.",
        occurredAt: "local-mock-time",
      },
    );
  }

  if (version.integrationTriggerRules.some((rule) => rule.externalSystem === "warehouse")) {
    normalizedEvents.push({
      id: `${campaignSlug}-kpi-event`,
      eventType: "kpi_event_recorded",
      title: "Future KPI event recorded",
      destination: "warehouse",
      status: "disabled",
      detail: "Future analytics export remains blocked until the workflow write path is approved.",
      occurredAt: "local-mock-time",
    });
  }

  if (version.integrationTriggerRules.some((rule) => rule.externalSystem === "hubspot")) {
    normalizedEvents.push({
      id: `${campaignSlug}-hubspot-handoff`,
      eventType: "hubspot_handoff_mocked",
      title: "Future HubSpot handoff mocked",
      destination: "HubSpot",
      status: "disabled",
      detail: "CRM lifecycle remains outside the app until explicitly approved.",
      occurredAt: "local-mock-time",
    });
  }

  return [...triggerEvents, ...normalizedEvents, ...auditEvents, ...evidenceEvents];
}

function buildTemplateOutboxItems(
  campaignSlug: string,
  version: CampaignVersion,
): readonly OutboxItem[] {
  const previewItems = buildOutboxPreviewRecords({
    campaignSlug,
    versionId: version.id,
  }).flatMap((record) => {
    if (!record.outboxTopic || record.externalSystem === "mymedlife") {
      return [];
    }

    const destination = mapOutboxDestination(record.externalSystem);

    if (!destination) {
      return [];
    }

    return [
      {
        id: `${record.integrationTriggerId}-outbox`,
        sourceEventId: record.eventName,
        destination,
        status: "disabled" as const,
        payloadSummary: `${record.eventName} remains blocked until the workflow write path is approved.`,
      },
    ];
  });

  const communicationItems =
    version.communicationTriggerRules.length > 0
      ? [
          {
            id: `${campaignSlug}-outbox-n8n-reminder`,
            sourceEventId: `${campaignSlug}-communication-intent`,
            destination: "n8n" as const,
            status: "disabled" as const,
            payloadSummary: "Future reminder or automation jobs remain blocked until approved.",
          },
        ]
      : [];

  return [...previewItems, ...communicationItems];
}

function buildTemplateSafetyNotes(
  version: CampaignVersion,
): readonly string[] {
  return unique([
    ...version.reviewSummary.sensitiveDataWarnings,
    ...version.integrationTriggerRules.map((rule) => rule.detail),
    ...version.operationPermissions.map((permission) => permission.note),
    ...version.featureFlagBindings.map((binding) => binding.description),
    "No production sends, uploads, auth changes, or external automation are enabled from this workflow runtime.",
  ]);
}

function getTemplateStepStatus(
  version: CampaignVersion,
  step: CampaignVersion["phases"][number]["steps"][number],
): SopRuleStatus {
  const matchingRoleRule = version.roleActionRules.find((rule) =>
    step.roleActionRuleIds.includes(rule.id),
  );

  if (matchingRoleRule?.blockedByDefault) {
    return "blocked";
  }

  return getTemplateStatus(step.sourceCertainty);
}

function getTemplateStatus(sourceCertainty: string): SopRuleStatus {
  switch (sourceCertainty) {
    case "repo_only_placeholder":
    case "missing_source_confirmation":
      return "mock_only";
    default:
      return "ready_readonly";
  }
}

function pickTemplateStepRoute(
  version: CampaignVersion,
  step: CampaignVersion["phases"][number]["steps"][number],
) {
  if (step.route) {
    return step.route;
  }

  const roleRule = version.roleActionRules.find((rule) =>
    step.roleActionRuleIds.includes(rule.id),
  );
  return (
    roleRule?.visibleInRoutes.find((route) => !route.startsWith("/admin/")) ??
    roleRule?.visibleInRoutes[0] ??
    `/campaigns/${version.id}`
  );
}

function mapRuntimeDestination(system: string): IntegrationEvent["destination"] {
  switch (system) {
    case "hubspot":
      return "HubSpot";
    case "luma":
      return "Luma";
    case "n8n":
      return "n8n";
    case "warehouse":
    case "power_bi":
      return "warehouse";
    default:
      return "internal";
  }
}

function mapOutboxDestination(system: string): OutboxItem["destination"] | null {
  switch (system) {
    case "hubspot":
      return "HubSpot";
    case "luma":
      return "Luma";
    case "n8n":
      return "n8n";
    case "warehouse":
    case "power_bi":
      return "warehouse";
    default:
      return null;
  }
}

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}
