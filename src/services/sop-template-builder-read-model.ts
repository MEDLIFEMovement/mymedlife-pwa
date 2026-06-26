import { getSopCampaignDefinition } from "@/data/mock-sop-builder";
import {
  getPreferredCampaignVersion,
  getSopTemplateBySlug,
} from "@/services/sop-template-registry";
import type { SopRole, SopScope } from "@/shared/types/sop-builder";
import type {
  ApprovalRule,
  CampaignStep,
  CampaignVersion,
  CommunicationTriggerRule,
  CompletionRule,
  CloseoutRequirement,
  EscalationRule,
  EvidenceRule,
  IntegrationTriggerRule,
  KpiRule,
  PointsRule,
  ResourceLink,
  RiskRule,
  RoleActionRule,
  ScriptTemplate,
  TemplateImportStatus,
  TemplateSourceCertainty,
} from "@/shared/types/sop-templates";

export type TemplateBuilderStepView = {
  id: string;
  sequence: number;
  title: string;
  phaseLabel: string;
  objective: string;
  route: string;
  dueTiming: string;
  riskEscalation: string;
  primaryOwnerRole: SopRole;
  ownerRoles: readonly SopRole[];
  supportingRoles: readonly SopRole[];
  visibleRoutes: readonly string[];
  completionLabels: readonly string[];
  evidenceLabels: readonly string[];
  approvalLabels: readonly string[];
  pointsLabels: readonly string[];
  kpiLabels: readonly string[];
  integrationEvents: readonly string[];
  expectedOutputs: readonly string[];
  sourceCertainty: TemplateSourceCertainty;
};

export type TemplateBuilderRoleMatrixView = {
  id: string;
  role: SopRole;
  scope: SopScope;
  actionSummary: string;
  visibleRoutes: readonly string[];
  stepLabels: readonly string[];
  completionLabels: readonly string[];
  evidenceLabels: readonly string[];
  approvalLabels: readonly string[];
  pointsLabels: readonly string[];
  kpiLabels: readonly string[];
  integrationEvents: readonly string[];
  blockedByDefault: boolean;
};

export type TemplateBuilderCompletionRowView = {
  id: string;
  rowType: "completion" | "evidence" | "approval";
  title: string;
  detail: string;
  footer: string;
  linkedStepLabels: readonly string[];
  sourceCertainty: TemplateSourceCertainty;
};

export type TemplateBuilderRiskRowView = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  triggerCondition: string;
  linkedStepLabels: readonly string[];
  sourceCertainty: TemplateSourceCertainty;
};

export type TemplateBuilderEscalationRowView = {
  id: string;
  title: string;
  ownerRoles: readonly SopRole[];
  action: string;
  linkedStepLabels: readonly string[];
  sourceCertainty: TemplateSourceCertainty;
};

export type TemplateBuilderCloseoutRowView = {
  id: string;
  title: string;
  description: string;
  requiredByRoles: readonly SopRole[];
  sourceCertainty: TemplateSourceCertainty;
};

export type TemplateBuilderPointsRowView = {
  id: string;
  role: SopRole;
  pointValues: readonly number[];
  ruleLabels: readonly string[];
  kpiLabels: readonly string[];
  approvalLabels: readonly string[];
  leaderboardVisible: boolean;
  repeatabilityLabels: readonly string[];
};

export type TemplateBuilderKpiRowView = {
  id: string;
  label: string;
  metricKey: string;
  thresholdLabel: string | null;
  targetValue: number | null;
  linkedStepLabels: readonly string[];
  linkedRoleLabels: readonly string[];
  sourceCertainty: TemplateSourceCertainty;
};

export type TemplateBuilderCommRowView = {
  id: string;
  title: string;
  audience: string;
  sourceSystem: string;
  timing: string;
  mockStatus: "mock_only" | "approval_required" | "future_live";
  detail: string;
  linkedStepLabels: readonly string[];
  linkedIntegrationEvents: readonly string[];
};

export type TemplateBuilderIntegrationBoundaryView = {
  id: string;
  system: string;
  mode: string;
  detail: string;
  eventNames: readonly string[];
};

export type TemplateBuilderPreviewScenarioView = {
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
  sourceCertainty: TemplateSourceCertainty;
};

export type TemplateBuilderScriptTemplateView = {
  id: string;
  title: string;
  audience: string;
  summary: string;
  sourceCertainty: TemplateSourceCertainty;
};

export type TemplateBuilderResourceLinkView = {
  id: string;
  label: string;
  href: string;
  sourceCertainty: TemplateSourceCertainty;
};

export type TemplateBuilderFeatureFlagView = {
  id: string;
  flagKey: string;
  description: string;
  defaultState: "enabled" | "disabled";
  rolloutStage: string;
  sourceCertainty: TemplateSourceCertainty;
};

export type TemplateBuilderAuditRowView = {
  id: string;
  eventType: string;
  required: boolean;
  detail: string;
  linkedIntegrationEvents: readonly string[];
  linkedOutboxTopics: readonly string[];
};

export type TemplateBuilderSurface = {
  campaignSlug: string;
  campaignName: string;
  versionId: string;
  versionLabel: string;
  importStatus: TemplateImportStatus;
  workflowName: string;
  engineCounts: {
    operationPermissions: number;
    validators: number;
    handoffs: number;
    featureFlags: number;
    importTraces: number;
  };
  phaseLabels: readonly string[];
  steps: readonly TemplateBuilderStepView[];
  roleMatrix: readonly TemplateBuilderRoleMatrixView[];
  completionRows: readonly TemplateBuilderCompletionRowView[];
  riskRows: readonly TemplateBuilderRiskRowView[];
  escalationRows: readonly TemplateBuilderEscalationRowView[];
  closeoutRows: readonly TemplateBuilderCloseoutRowView[];
  scriptTemplates: readonly TemplateBuilderScriptTemplateView[];
  resourceLinks: readonly TemplateBuilderResourceLinkView[];
  featureFlagRows: readonly TemplateBuilderFeatureFlagView[];
  auditRows: readonly TemplateBuilderAuditRowView[];
  pointsRows: readonly TemplateBuilderPointsRowView[];
  kpiRows: readonly TemplateBuilderKpiRowView[];
  commRows: readonly TemplateBuilderCommRowView[];
  integrationBoundaries: readonly TemplateBuilderIntegrationBoundaryView[];
  previewScenarios: readonly TemplateBuilderPreviewScenarioView[];
};

export function getTemplateBuilderSurface(
  campaignSlug: string,
): TemplateBuilderSurface | null {
  const template = getSopTemplateBySlug(campaignSlug);
  const version = template ? getPreferredCampaignVersion(template) : null;
  const definition = getSopCampaignDefinition(campaignSlug);

  if (!template || !version) {
    return null;
  }

  return {
    campaignSlug: template.slug,
    campaignName: template.name,
    versionId: version.id,
    versionLabel: version.label,
    importStatus: version.status,
    workflowName: version.workflowName,
    engineCounts: {
      operationPermissions: version.operationPermissions.length,
      validators: version.validatorDefinitions.length,
      handoffs: version.handoffRules.length,
      featureFlags: version.featureFlagBindings.length,
      importTraces: version.importTraceRecords.length,
    },
    phaseLabels: version.phases.map((phase) => phase.label),
    steps: buildTemplateSteps(version),
    roleMatrix: buildRoleMatrix(version),
    completionRows: buildCompletionRows(version),
    riskRows: buildRiskRows(version),
    escalationRows: buildEscalationRows(version),
    closeoutRows: buildCloseoutRows(version),
    scriptTemplates: buildScriptTemplateRows(version),
    resourceLinks: buildResourceLinkRows(version),
    featureFlagRows: buildFeatureFlagRows(version),
    auditRows: buildAuditRows(version),
    pointsRows: buildPointsRows(version),
    kpiRows: buildKpiRows(version),
    commRows: buildCommRows(version),
    integrationBoundaries: buildIntegrationBoundaries(version),
    previewScenarios: buildPreviewScenarios(version, definition, campaignSlug),
  };
}

function buildTemplateSteps(
  version: CampaignVersion,
): readonly TemplateBuilderStepView[] {
  return version.phases.flatMap((phase) =>
    phase.steps.map((step) => {
      const roleRules = findRulesById(version.roleActionRules, step.roleActionRuleIds);
      const completionRules = findRulesById(
        version.completionRules,
        step.completionRuleIds,
      );
      const evidenceRules = findRulesById(version.evidenceRules, step.evidenceRuleIds);
      const approvalRules = findRulesById(version.approvalRules, step.approvalRuleIds);
      const pointsRules = findRulesById(version.pointsRules, step.pointsRuleIds);
      const kpiRules = findRulesById(version.kpiRules, step.kpiRuleIds);
      const integrationRules = findRulesById(
        version.integrationTriggerRules,
        step.integrationTriggerRuleIds,
      );
      const riskRules = findRulesById(version.riskRules, step.riskRuleIds);

      return {
        id: step.id,
        sequence: step.sequence,
        title: step.label,
        phaseLabel: phase.label,
        objective: step.objective,
        route: step.route ?? `/campaigns/${step.id}`,
        dueTiming: step.dueTiming ?? "Current campaign window",
        riskEscalation:
          riskRules.map((rule) => `${rule.label}: ${rule.triggerCondition}`).join(" ") ||
          "No named escalation on the imported template yet.",
        primaryOwnerRole: step.ownerRoles[0] ?? roleRules[0]?.role ?? "student_member",
        ownerRoles: step.ownerRoles,
        supportingRoles: step.supportingRoles,
        visibleRoutes: unique(roleRules.flatMap((rule) => rule.visibleInRoutes)),
        completionLabels: completionRules.map((rule) => rule.label),
        evidenceLabels: evidenceRules.map((rule) => rule.label),
        approvalLabels: approvalRules.map((rule) => rule.label),
        pointsLabels: pointsRules.map((rule) => rule.label),
        kpiLabels: kpiRules.map((rule) => rule.displayLabel),
        integrationEvents: integrationRules.map((rule) => rule.eventName),
        expectedOutputs: step.expectedOutputs,
        sourceCertainty: step.sourceCertainty,
      };
    }),
  );
}

function buildRoleMatrix(
  version: CampaignVersion,
): readonly TemplateBuilderRoleMatrixView[] {
  return version.roleActionRules.map((rule) => {
    const relatedSteps = version.phases.flatMap((phase) =>
      phase.steps.filter((step) => step.roleActionRuleIds.includes(rule.id)),
    );
    const completionRules = uniqueById(
      relatedSteps.flatMap((step) =>
        findRulesById(version.completionRules, step.completionRuleIds),
      ),
    );
    const evidenceRules = uniqueById(
      relatedSteps.flatMap((step) =>
        findRulesById(version.evidenceRules, step.evidenceRuleIds),
      ),
    );
    const approvalRules = uniqueById(
      relatedSteps.flatMap((step) =>
        findRulesById(version.approvalRules, step.approvalRuleIds),
      ),
    );
    const pointsRules = uniqueById(
      relatedSteps.flatMap((step) =>
        findRulesById(version.pointsRules, step.pointsRuleIds),
      ),
    );
    const kpiRules = uniqueById(
      relatedSteps.flatMap((step) =>
        findRulesById(version.kpiRules, step.kpiRuleIds),
      ),
    );
    const integrationRules = uniqueById(
      relatedSteps.flatMap((step) =>
        findRulesById(version.integrationTriggerRules, step.integrationTriggerRuleIds),
      ),
    );

    return {
      id: rule.id,
      role: rule.role,
      scope: rule.scope,
      actionSummary: rule.actionSummary,
      visibleRoutes: rule.visibleInRoutes,
      stepLabels: relatedSteps.map((step) => step.label),
      completionLabels: completionRules.map((item) => item.label),
      evidenceLabels: evidenceRules.map((item) => item.label),
      approvalLabels: approvalRules.map((item) => item.label),
      pointsLabels: pointsRules.map((item) => item.label),
      kpiLabels: kpiRules.map((item) => item.displayLabel),
      integrationEvents: integrationRules.map((item) => item.eventName),
      blockedByDefault: rule.blockedByDefault,
    };
  });
}

function buildCompletionRows(
  version: CampaignVersion,
): readonly TemplateBuilderCompletionRowView[] {
  return [
    ...version.completionRules.map((rule) => ({
      id: rule.id,
      rowType: "completion" as const,
      title: rule.label,
      detail: rule.successSignal,
      footer: "Structured completion rule",
      linkedStepLabels: getLinkedStepLabels(version, (step) =>
        step.completionRuleIds.includes(rule.id),
      ),
      sourceCertainty: rule.sourceCertainty,
    })),
    ...version.evidenceRules.map((rule) => ({
      id: rule.id,
      rowType: "evidence" as const,
      title: rule.label,
      detail: `Accepted formats: ${rule.acceptedFormats.join(", ")}`,
      footer: rule.approvalRequired
        ? "Evidence requires approval before advancing."
        : "Evidence is visible without a required approval gate.",
      linkedStepLabels: getLinkedStepLabels(version, (step) =>
        step.evidenceRuleIds.includes(rule.id),
      ),
      sourceCertainty: rule.sourceCertainty,
    })),
    ...version.approvalRules.map((rule) => ({
      id: rule.id,
      rowType: "approval" as const,
      title: rule.label,
      detail: `Reviewer roles: ${rule.reviewerRoles.join(", ")}`,
      footer: rule.requiredToAdvance
        ? "Approval is required to advance."
        : "Approval is advisory in the current imported draft.",
      linkedStepLabels: getLinkedStepLabels(version, (step) =>
        step.approvalRuleIds.includes(rule.id),
      ),
      sourceCertainty: rule.sourceCertainty,
    })),
  ];
}

function buildPointsRows(
  version: CampaignVersion,
): readonly TemplateBuilderPointsRowView[] {
  const roles = unique(
    version.pointsRules.flatMap((rule) =>
      Object.keys(rule.pointsByRole) as SopRole[],
    ),
  );

  return roles.map((role) => {
    const matchingPointRules = version.pointsRules.filter(
      (rule) => typeof rule.pointsByRole[role] === "number",
    );
    const relatedSteps = version.phases.flatMap((phase) =>
      phase.steps.filter((step) =>
        step.ownerRoles.includes(role) || step.supportingRoles.includes(role),
      ),
    );
    const approvalRules = uniqueById(
      relatedSteps.flatMap((step) =>
        findRulesById(version.approvalRules, step.approvalRuleIds),
      ),
    );
    const kpiRules = uniqueById(
      relatedSteps.flatMap((step) =>
        findRulesById(version.kpiRules, step.kpiRuleIds),
      ),
    );

    return {
      id: `points-${role}`,
      role,
      pointValues: matchingPointRules.map((rule) => rule.pointsByRole[role] ?? 0),
      ruleLabels: matchingPointRules.map((rule) => rule.label),
      kpiLabels: kpiRules.map((rule) => rule.displayLabel),
      approvalLabels: approvalRules.map((rule) => rule.label),
      leaderboardVisible: matchingPointRules.some((rule) => rule.leaderboardVisible),
      repeatabilityLabels: matchingPointRules.map((rule) => rule.repeatability),
    };
  });
}

function buildKpiRows(
  version: CampaignVersion,
): readonly TemplateBuilderKpiRowView[] {
  return version.kpiRules.map((rule) => {
    const linkedSteps = version.phases.flatMap((phase) =>
      phase.steps.filter((step) => step.kpiRuleIds.includes(rule.id)),
    );
    const linkedRoleRules = uniqueById(
      linkedSteps.flatMap((step) =>
        findRulesById(version.roleActionRules, step.roleActionRuleIds),
      ),
    );

    return {
      id: rule.id,
      label: rule.displayLabel,
      metricKey: rule.metricKey,
      thresholdLabel: rule.thresholdLabel,
      targetValue: rule.targetValue ?? null,
      linkedStepLabels: linkedSteps.map((step) => step.label),
      linkedRoleLabels: linkedRoleRules.map((roleRule) =>
        roleRule.role.replaceAll("_", " "),
      ),
      sourceCertainty: rule.sourceCertainty,
    };
  });
}

function buildRiskRows(
  version: CampaignVersion,
): readonly TemplateBuilderRiskRowView[] {
  return version.riskRules.map((rule) => ({
    id: rule.id,
    title: rule.label,
    severity: rule.severity,
    triggerCondition: rule.triggerCondition,
    linkedStepLabels: getLinkedStepLabels(version, (step) =>
      step.riskRuleIds.includes(rule.id),
    ),
    sourceCertainty: rule.sourceCertainty,
  }));
}

function buildEscalationRows(
  version: CampaignVersion,
): readonly TemplateBuilderEscalationRowView[] {
  return version.escalationRules.map((rule) => ({
    id: rule.id,
    title: rule.label,
    ownerRoles: rule.ownerRoles,
    action: rule.action,
    linkedStepLabels: unique(
      version.phases.flatMap((phase) =>
        phase.steps
          .filter((step) =>
            step.ownerRoles.some((role) => rule.ownerRoles.includes(role)) ||
            step.supportingRoles.some((role) => rule.ownerRoles.includes(role)),
          )
          .map((step) => step.label),
      ),
    ),
    sourceCertainty: rule.sourceCertainty,
  }));
}

function buildCloseoutRows(
  version: CampaignVersion,
): readonly TemplateBuilderCloseoutRowView[] {
  return version.closeoutRequirements.map((requirement) => ({
    id: requirement.id,
    title: requirement.label,
    description: requirement.description,
    requiredByRoles: requirement.requiredByRoles,
    sourceCertainty: requirement.sourceCertainty,
  }));
}

function buildScriptTemplateRows(
  version: CampaignVersion,
): readonly TemplateBuilderScriptTemplateView[] {
  return version.scriptTemplates.map((template) => ({
    id: template.id,
    title: template.label,
    audience: template.audience,
    summary: template.summary,
    sourceCertainty: template.sourceCertainty,
  }));
}

function buildResourceLinkRows(
  version: CampaignVersion,
): readonly TemplateBuilderResourceLinkView[] {
  return version.resourceLinks.map((link) => ({
    id: link.id,
    label: link.label,
    href: link.href,
    sourceCertainty: link.sourceCertainty,
  }));
}

function buildFeatureFlagRows(
  version: CampaignVersion,
): readonly TemplateBuilderFeatureFlagView[] {
  return version.featureFlagBindings.map((binding) => ({
    id: binding.id,
    flagKey: binding.flagKey,
    description: binding.description,
    defaultState: binding.defaultState,
    rolloutStage: binding.rolloutStage,
    sourceCertainty: binding.sourceCertainty,
  }));
}

function buildAuditRows(
  version: CampaignVersion,
): readonly TemplateBuilderAuditRowView[] {
  return version.auditRecords.map((record) => {
    const relatedIntegrationRules = version.integrationTriggerRules.filter(
      (rule) => rule.eventName === record.eventType,
    );

    return {
      id: record.id,
      eventType: record.eventType,
      required: record.required,
      detail: record.note,
      linkedIntegrationEvents: relatedIntegrationRules.map((rule) => rule.eventName),
      linkedOutboxTopics: relatedIntegrationRules
        .map((rule) => rule.outboxTopic)
        .filter((topic): topic is string => topic !== null),
    };
  });
}

function buildCommRows(
  version: CampaignVersion,
): readonly TemplateBuilderCommRowView[] {
  return version.communicationTriggerRules.map((rule) => ({
    id: rule.id,
    title: rule.triggerCondition,
    audience: rule.audience,
    sourceSystem: rule.sourceSystem,
    timing: rule.timing,
    mockStatus: rule.mockStatus,
    detail: rule.hubspotWorkflowRef
      ? `HubSpot workflow reference: ${rule.hubspotWorkflowRef}`
      : "Structured communication trigger",
    linkedStepLabels: getLinkedStepLabels(version, (step) =>
      step.integrationTriggerRuleIds.some((triggerId) =>
        version.integrationTriggerRules.some(
          (integrationRule) =>
            integrationRule.id === triggerId &&
            integrationRule.externalSystem === rule.sourceSystem,
        ),
      ),
    ),
    linkedIntegrationEvents: version.integrationTriggerRules
      .filter((integrationRule) => integrationRule.externalSystem === rule.sourceSystem)
      .map((integrationRule) => integrationRule.eventName),
  }));
}

function buildIntegrationBoundaries(
  version: CampaignVersion,
): readonly TemplateBuilderIntegrationBoundaryView[] {
  return unique(version.integrationTriggerRules.map((rule) => rule.externalSystem)).map(
    (system) => {
      const matchingRules = version.integrationTriggerRules.filter(
        (rule) => rule.externalSystem === system,
      );

      return {
        id: `boundary-${system}`,
        system,
        mode:
          matchingRules.every((rule) => rule.mode === "disabled_pending_approval")
            ? "disabled_pending_approval"
            : matchingRules.every((rule) => rule.mode === "internal_only")
              ? "internal_only"
              : "mixed",
        detail: matchingRules.map((rule) => rule.detail).join(" "),
        eventNames: matchingRules.map((rule) => rule.eventName),
      };
    },
  );
}

function buildPreviewScenarios(
  version: CampaignVersion,
  definition: ReturnType<typeof getSopCampaignDefinition>,
  campaignSlug: string,
): readonly TemplateBuilderPreviewScenarioView[] {
  if (campaignSlug === "rush-month" && definition?.previewScenarios.length) {
    return definition.previewScenarios.map((scenario) => {
      const matchingSteps = getScenarioMatchedTemplateSteps(version, scenario);
      const completionRules = uniqueById(
        matchingSteps.flatMap((step) =>
          findRulesById(version.completionRules, step.completionRuleIds),
        ),
      );
      const evidenceRules = uniqueById(
        matchingSteps.flatMap((step) =>
          findRulesById(version.evidenceRules, step.evidenceRuleIds),
        ),
      );
      const approvalRules = uniqueById(
        matchingSteps.flatMap((step) =>
          findRulesById(version.approvalRules, step.approvalRuleIds),
        ),
      );
      const pointsRules = uniqueById(
        matchingSteps.flatMap((step) =>
          findRulesById(version.pointsRules, step.pointsRuleIds),
        ),
      );
      const kpiRules = uniqueById(
        matchingSteps.flatMap((step) =>
          findRulesById(version.kpiRules, step.kpiRuleIds),
        ),
      );
      const integrationRules = uniqueById(
        matchingSteps.flatMap((step) =>
          findRulesById(version.integrationTriggerRules, step.integrationTriggerRuleIds),
        ),
      );
      const pointTotal = pointsRules.reduce(
        (total, rule) => total + (rule.pointsByRole[scenario.primaryRole] ?? 0),
        0,
      );
      const communicationRules = uniqueById([
        ...version.communicationTriggerRules.filter((rule) =>
          integrationRules.some(
            (integrationRule) => integrationRule.externalSystem === rule.sourceSystem,
          ),
        ),
        ...version.communicationTriggerRules.filter((rule) => {
          const audience = rule.audience.toLowerCase();
          return audience.includes(scenario.primaryRole.replaceAll("_", " "));
        }),
      ]);

      return {
        id: scenario.id,
        title: scenario.title,
        primaryRole: scenario.primaryRole,
        route: scenario.route,
        visibleStates: scenario.visibleStates,
        successSignal:
          completionRules[0]?.successSignal ?? scenario.successSignal,
        proofRequested: evidenceRules.length
          ? evidenceRules.map((rule) => rule.label).join(", ")
          : "None",
        approvalRequired: approvalRules.some((rule) => rule.requiredToAdvance)
          ? "Yes"
          : approvalRules.length
            ? "Conditional"
            : "No",
        pointsEarned: pointTotal > 0 ? `${pointTotal} points` : "None",
        kpiChanges:
          kpiRules.map(formatKpiLabelWithTarget).join(", ") || "—",
        communicationTrigger:
          communicationRules.map((rule) => rule.triggerCondition).join("; ") ||
          "No workflow-triggered messages",
        sourceCertainty: matchingSteps[0]?.sourceCertainty ?? "repo_only_placeholder",
      };
    });
  }

  return version.phases.flatMap((phase) =>
    phase.steps.map((step) => {
      const roleRules = findRulesById(version.roleActionRules, step.roleActionRuleIds);
      const completionRules = findRulesById(
        version.completionRules,
        step.completionRuleIds,
      );
      const evidenceRules = findRulesById(version.evidenceRules, step.evidenceRuleIds);
      const approvalRules = findRulesById(version.approvalRules, step.approvalRuleIds);
      const pointsRules = findRulesById(version.pointsRules, step.pointsRuleIds);
      const kpiRules = findRulesById(version.kpiRules, step.kpiRuleIds);
      const integrationRules = findRulesById(
        version.integrationTriggerRules,
        step.integrationTriggerRuleIds,
      );
      const primaryRole =
        step.ownerRoles[0] ?? roleRules[0]?.role ?? "student_member";
      const roleTerms = unique(
        [primaryRole, ...step.ownerRoles, ...step.supportingRoles].map((role) =>
          role.replaceAll("_", " "),
        ),
      );
      const communicationRules = uniqueById([
        ...version.communicationTriggerRules.filter((rule) =>
          integrationRules.some(
            (integrationRule) => integrationRule.externalSystem === rule.sourceSystem,
          ),
        ),
        ...version.communicationTriggerRules.filter((rule) => {
          const audience = rule.audience.toLowerCase();
          return roleTerms.some((term) => audience.includes(term));
        }),
      ]);
      const primaryRoleRule =
        roleRules.find((rule) => rule.role === primaryRole) ?? roleRules[0] ?? null;
      const route = pickPreferredPreviewRoute(
        primaryRoleRule?.visibleInRoutes ?? [],
        step,
      );
      const pointTotal = pointsRules.reduce(
        (total, rule) => total + (rule.pointsByRole[primaryRole] ?? 0),
        0,
      );
      const visibleStates = unique([
        ...step.expectedOutputs.map(formatTokenLabel),
        ...completionRules.map((rule) => rule.label),
      ]);

      return {
        id: step.id,
        title: step.label,
        primaryRole,
        route,
        visibleStates:
          visibleStates.length > 0 ? visibleStates : [phase.label, step.objective],
        successSignal: completionRules[0]?.successSignal ?? step.objective,
        proofRequested: evidenceRules.length
          ? evidenceRules.map((rule) => rule.label).join(", ")
          : "None",
        approvalRequired: approvalRules.some((rule) => rule.requiredToAdvance)
          ? "Yes"
          : approvalRules.length
            ? "Conditional"
            : "No",
        pointsEarned: pointTotal > 0 ? `${pointTotal} points` : "None",
        kpiChanges:
          kpiRules.map(formatKpiLabelWithTarget).join(", ") || "—",
        communicationTrigger:
          communicationRules.map((rule) => rule.triggerCondition).join("; ") ||
          "No workflow-triggered messages",
        sourceCertainty: step.sourceCertainty,
      };
    }),
  );
}

function getScenarioMatchedTemplateSteps(
  version: CampaignVersion,
  scenario: NonNullable<ReturnType<typeof getSopCampaignDefinition>>["previewScenarios"][number],
): readonly CampaignStep[] {
  const routeMatches = version.phases.flatMap((phase) =>
    phase.steps.filter(
      (step) =>
        (step.route ?? "").length > 0 &&
        ((step.route ?? "") === scenario.route ||
          scenario.route.startsWith(step.route ?? "") ||
          (step.route ?? "").startsWith(scenario.route)),
    ),
  );
  const roleMatches = version.phases.flatMap((phase) =>
    phase.steps.filter(
      (step) =>
        step.ownerRoles.includes(scenario.primaryRole) ||
        step.supportingRoles.includes(scenario.primaryRole),
    ),
  );

  return uniqueById<CampaignStep>([...routeMatches, ...roleMatches]);
}

function findRulesById<T extends { id: string }>(
  rules: readonly T[],
  ids: readonly string[],
): readonly T[] {
  return ids
    .map((id) => rules.find((rule) => rule.id === id) ?? null)
    .filter((rule): rule is T => rule !== null);
}

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}

function uniqueById<
  T extends
    | CampaignStep
    | RoleActionRule
    | CompletionRule
    | EvidenceRule
    | ApprovalRule
    | PointsRule
    | KpiRule
    | CommunicationTriggerRule
    | IntegrationTriggerRule
    | RiskRule
    | EscalationRule
    | CloseoutRequirement
    | ScriptTemplate
    | ResourceLink,
>(values: readonly T[]): readonly T[] {
  const seen = new Set<string>();

  return values.filter((value) => {
    if (seen.has(value.id)) {
      return false;
    }

    seen.add(value.id);
    return true;
  });
}

function getLinkedStepLabels(
  version: CampaignVersion,
  matcher: (step: CampaignVersion["phases"][number]["steps"][number]) => boolean,
) {
  return version.phases.flatMap((phase) =>
    phase.steps.filter(matcher).map((step) => step.label),
  );
}

function pickPreferredPreviewRoute(
  routes: readonly string[],
  step: CampaignVersion["phases"][number]["steps"][number],
) {
  return (
    routes.find((route) => !route.startsWith("/campaigns/") && !route.startsWith("/admin/")) ??
    routes.find((route) => !route.startsWith("/admin/")) ??
    routes[0] ??
    `/campaigns/${step.id}`
  );
}

function formatTokenLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatKpiLabelWithTarget(rule: {
  displayLabel: string;
  targetValue?: number | null;
}) {
  return rule.targetValue !== null && rule.targetValue !== undefined
    ? `${rule.displayLabel} (target ${rule.targetValue})`
    : rule.displayLabel;
}
