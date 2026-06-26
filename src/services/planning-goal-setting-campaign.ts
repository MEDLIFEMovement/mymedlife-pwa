import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getPreferredCampaignVersion,
  getSopTemplateBySlug,
} from "@/services/sop-template-registry";
import { getSopWorkflowRuntime } from "@/services/sop-workflow-runtime";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import type {
  CampaignPhase,
  CampaignStep,
  CampaignVersion,
  CommunicationTriggerRule,
  IntegrationTriggerRule,
} from "@/shared/types/sop-templates";

export type PlanningGoalSettingPhaseKey =
  | "goal_alignment"
  | "owner_map"
  | "action_calendar"
  | "risk_review"
  | "coach_checkin";

export type PlanningGoalSettingPhase = {
  key: PlanningGoalSettingPhaseKey;
  label: string;
  ownerRole: string;
  studentVisibleOutcome: string;
  leaderTask: string;
  proofPrompt: string;
  kpiSignals: string[];
  structuredEvents: string[];
  disabledOutboxDestinations: string[];
  browserWritesExpected: 0;
  externalWritesExpected: 0;
};

export type PlanningOperationPosture = {
  operation: string;
  allowedRoles: readonly string[];
  scopeSummary: string;
  approvalLabel: string;
  authorityStatus: string;
  note: string;
};

export type PlanningValidatorPosture = {
  label: string;
  validatorRoles: readonly string[];
  phaseLabels: readonly string[];
  authorityStatus: string;
  prompt: string;
};

export type PlanningHandoffPosture = {
  label: string;
  ownerRoles: readonly string[];
  destinationRoutes: readonly string[];
  sourceCertainty: string;
};

export type PlanningFeatureFlagPosture = {
  flagKey: string;
  defaultState: string;
  rolloutStage: string;
  description: string;
};

export type PlanningRiskPosture = {
  label: string;
  severity: string;
  triggerCondition: string;
};

export type PlanningEscalationPosture = {
  label: string;
  ownerRoles: readonly string[];
  action: string;
};

export type PlanningSourceCoverage = {
  scriptTemplates: readonly {
    label: string;
    audience: string;
    summary: string;
  }[];
  resourceLinks: readonly {
    label: string;
    href: string;
  }[];
};

export type PlanningTracePosture = {
  sourceCount: number;
  traceCount: number;
  missingSourceConfirmations: number;
  note: string;
};

export type PlanningGoalSettingCampaignPlan = {
  canReadPlan: boolean;
  title: string;
  summary: string;
  workflowSource: "builder_definition" | "template_version" | "missing" | "hidden";
  workflowName: string;
  workflowVersionLabel: string;
  importStatus: string;
  currentPhaseLabel: string;
  currentPhaseObjective: string;
  currentPhaseExitSignal: string;
  route: "/campaigns/planning-goal-setting";
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  phases: PlanningGoalSettingPhase[];
  operationPosture: PlanningOperationPosture[];
  validators: PlanningValidatorPosture[];
  handoffs: PlanningHandoffPosture[];
  featureFlags: PlanningFeatureFlagPosture[];
  risks: PlanningRiskPosture[];
  escalations: PlanningEscalationPosture[];
  sourceCoverage: PlanningSourceCoverage;
  tracePosture: PlanningTracePosture;
  closeoutChecks: string[];
  safetyReminders: string[];
};

export function getPlanningGoalSettingCampaignPlan(
  actor: LocalActorContext,
): PlanningGoalSettingCampaignPlan {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "member" || surfaceFamily === "ds_admin") {
    return {
      canReadPlan: false,
      title: "Planning / Goal Setting hidden for this role",
      summary:
        "Members should see the active campaign and DS Admin should stay in integration safety views.",
      workflowSource: "hidden",
      workflowName: "Planning / Goal Setting",
      workflowVersionLabel: "unknown",
      importStatus: "hidden",
      currentPhaseLabel: "hidden",
      currentPhaseObjective: "hidden",
      currentPhaseExitSignal: "hidden",
      route: "/campaigns/planning-goal-setting",
      browserWritesExpected: 0,
      externalWritesExpected: 0,
      phases: [],
      operationPosture: [],
      validators: [],
      handoffs: [],
      featureFlags: [],
      risks: [],
      escalations: [],
      sourceCoverage: emptySourceCoverage(),
      tracePosture: emptyTracePosture(),
      closeoutChecks: [],
      safetyReminders: [],
    };
  }

  const template = getSopTemplateBySlug("planning-goal-setting");
  const preferredVersion = template
    ? getPreferredCampaignVersion(template)
    : null;
  const runtime = getSopWorkflowRuntime("planning-goal-setting");

  return {
    canReadPlan: true,
    title: getTitle(surfaceFamily),
    summary: buildPlanningSummary(runtime, preferredVersion),
    workflowSource: runtime?.sourceKind ?? "missing",
    workflowName:
      runtime?.operatingRhythm ??
      preferredVersion?.workflowName ??
      "Chapter Annual Planning Workflow / Chapter Operational Launch System",
    workflowVersionLabel: runtime?.sourceVersionLabel ?? preferredVersion?.label ?? "fallback",
    importStatus: preferredVersion?.status ?? "repo_only_placeholder",
    currentPhaseLabel: runtime?.currentPhase?.label ?? "Planning phase",
    currentPhaseObjective:
      runtime?.currentPhase?.objective ??
      "Keep the current planning phase explicit before launch review.",
    currentPhaseExitSignal:
      runtime?.currentPhase?.exitCriteria[0] ??
      "Current planning exit criteria stay visible before launch review.",
    route: "/campaigns/planning-goal-setting",
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    phases: preferredVersion
      ? buildPlanningGoalSettingPhases(preferredVersion)
      : planningGoalSettingFallbackPhases,
    operationPosture: preferredVersion
      ? buildOperationPosture(preferredVersion)
      : [],
    validators: preferredVersion
      ? buildValidatorPosture(preferredVersion)
      : [],
    handoffs: preferredVersion
      ? buildHandoffPosture(preferredVersion)
      : [],
    featureFlags: preferredVersion
      ? buildFeatureFlagPosture(preferredVersion)
      : [],
    risks: preferredVersion
      ? buildRiskPosture(preferredVersion)
      : [],
    escalations: preferredVersion
      ? buildEscalationPosture(preferredVersion)
      : [],
    sourceCoverage: preferredVersion
      ? buildSourceCoverage(preferredVersion)
      : emptySourceCoverage(),
    tracePosture: preferredVersion
      ? buildTracePosture(preferredVersion)
      : emptyTracePosture(),
    closeoutChecks: preferredVersion
      ? buildCloseoutChecks(preferredVersion)
      : fallbackCloseoutChecks,
    safetyReminders: preferredVersion
      ? buildSafetyReminders(preferredVersion)
      : fallbackSafetyReminders,
  };
}

function buildPlanningSummary(
  runtime: ReturnType<typeof getSopWorkflowRuntime>,
  preferredVersion: CampaignVersion | null,
) {
  if (runtime?.currentPhase) {
    const parts = [
      `This route now reads its operating phases from the ${runtime.sourceKind === "template_version" ? "structured" : "builder-backed"} ${runtime.sourceVersionLabel} Planning / Goal Setting workflow runtime.`,
      `Current phase objective: ${runtime.currentPhase.objective}`,
    ];

    if (runtime.currentPhase.exitCriteria[0]) {
      parts.push(`Exit signal: ${runtime.currentPhase.exitCriteria[0]}`);
    }

    return parts.join(" ");
  }

  if (preferredVersion) {
    return `This route now reads its operating phases from the structured ${preferredVersion.label} Planning / Goal Setting template, so goal alignment, owner lanes, first actions, risk review, and coach readiness stay inside the current app without enabling real writes.`;
  }

  return "This deepens the Planning / Goal Setting starter shell into a mock-safe operating plan: leaders define goals, assign owners, publish the first action calendar, review risks, and prepare a coach check-in before any real campaign writes are enabled.";
}

function buildPlanningGoalSettingPhases(
  version: CampaignVersion,
): PlanningGoalSettingPhase[] {
  const globalBlockedSystems = unique(
    version.integrationTriggerRules
      .filter((rule) => rule.mode === "disabled_pending_approval")
      .map((rule) => formatSystemLabel(rule.externalSystem)),
  );

  return version.phases.map((phase) => {
    const step = phase.steps[0];
    const evidenceRules = findEvidenceLabels(version, step);
    const kpiSignals = findKpiSignals(version, step);
    const structuredEvents = findStructuredEvents(version, step);
    const disabledOutboxDestinations = findBlockedSystems(
      version,
      step,
      globalBlockedSystems,
    );

    return {
      key: mapPlanningPhaseKey(step),
      label: step.label,
      ownerRole: step.ownerRoles.map(formatRoleLabel).join(" / "),
      studentVisibleOutcome: buildVisibleOutcome(phase, step),
      leaderTask: step.objective,
      proofPrompt:
        evidenceRules.length > 0
          ? `Capture ${evidenceRules.join(", ")} and keep the planning evidence readable before any live write or upload is approved.`
          : `Keep ${phase.exitCriteria.join(" and ").toLowerCase()} visible before launch review.`,
      kpiSignals: [...kpiSignals],
      structuredEvents: [...structuredEvents],
      disabledOutboxDestinations: [...disabledOutboxDestinations],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    };
  });
}

function buildVisibleOutcome(phase: CampaignPhase, step: CampaignStep) {
  if (step.expectedOutputs.length > 0) {
    return `Visible outputs: ${step.expectedOutputs.map(formatTokenLabel).join(", ")}.`;
  }

  return phase.objective;
}

function buildCloseoutChecks(version: CampaignVersion) {
  const checks = version.closeoutRequirements.map(
    (requirement) => `${requirement.label}: ${requirement.description}`,
  );

  return checks.length > 0 ? checks : fallbackCloseoutChecks;
}

function buildOperationPosture(
  version: CampaignVersion,
): PlanningOperationPosture[] {
  return version.operationPermissions.map((permission) => ({
    operation: permission.operation.replaceAll("_", " "),
    allowedRoles: permission.allowedRoles.map(formatRoleLabel),
    scopeSummary: unique(permission.allowedScopes.map(formatScopeLabel)).join(" / "),
    approvalLabel: permission.approvalRequired ? "Approval required" : "No extra approval",
    authorityStatus: permission.authorityStatus.replaceAll("_", " "),
    note: permission.note,
  }));
}

function buildValidatorPosture(
  version: CampaignVersion,
): PlanningValidatorPosture[] {
  return version.validatorDefinitions.map((validator) => ({
    label: validator.label,
    validatorRoles: validator.validatorRoles.map(formatRoleLabel),
    phaseLabels: validator.phaseIds.flatMap((phaseId) => {
      const phase = version.phases.find((candidate) => candidate.id === phaseId);
      return phase ? [phase.label] : [];
    }),
    authorityStatus: validator.authorityStatus.replaceAll("_", " "),
    prompt: validator.prompt,
  }));
}

function buildHandoffPosture(
  version: CampaignVersion,
): PlanningHandoffPosture[] {
  return version.handoffRules.map((handoff) => ({
    label: handoff.triggerLabel,
    ownerRoles: handoff.ownerRoles.map(formatRoleLabel),
    destinationRoutes: handoff.destinationRoutes,
    sourceCertainty: handoff.sourceCertainty.replaceAll("_", " "),
  }));
}

function buildFeatureFlagPosture(
  version: CampaignVersion,
): PlanningFeatureFlagPosture[] {
  return version.featureFlagBindings.map((flag) => ({
    flagKey: flag.flagKey,
    defaultState: flag.defaultState,
    rolloutStage: flag.rolloutStage.replaceAll("_", " "),
    description: flag.description,
  }));
}

function buildRiskPosture(version: CampaignVersion): PlanningRiskPosture[] {
  return version.riskRules.map((risk) => ({
    label: risk.label,
    severity: risk.severity,
    triggerCondition: risk.triggerCondition,
  }));
}

function buildEscalationPosture(
  version: CampaignVersion,
): PlanningEscalationPosture[] {
  return version.escalationRules.map((escalation) => ({
    label: escalation.label,
    ownerRoles: escalation.ownerRoles.map(formatRoleLabel),
    action: escalation.action,
  }));
}

function buildSourceCoverage(version: CampaignVersion): PlanningSourceCoverage {
  return {
    scriptTemplates: version.scriptTemplates.map((template) => ({
      label: template.label,
      audience: template.audience,
      summary: template.summary,
    })),
    resourceLinks: version.resourceLinks.map((resource) => ({
      label: resource.label,
      href: resource.href,
    })),
  };
}

function buildTracePosture(
  version: CampaignVersion,
): PlanningTracePosture {
  const missingSourceConfirmations = version.importTraceRecords.filter(
    (trace) => trace.sourceCertainty === "missing_source_confirmation",
  ).length;

  return {
    sourceCount: version.sourceReferences.length,
    traceCount: version.importTraceRecords.length,
    missingSourceConfirmations,
    note:
      missingSourceConfirmations > 0
        ? "Some workflow authority still depends on source material that is linked but not bundled locally."
        : "All current workflow traces point to bundled or repo-local source context.",
  };
}

function buildSafetyReminders(version: CampaignVersion) {
  const reminders = [
    ...version.reviewSummary.sensitiveDataWarnings,
    "This panel does not create goals, assignments, meetings, or campaign templates.",
    "Live writes still require auth, RLS, audit, rollback, and explicit approval.",
  ];

  return unique(reminders);
}

function findEvidenceLabels(version: CampaignVersion, step: CampaignStep) {
  return step.evidenceRuleIds.flatMap((ruleId) => {
    const rule = version.evidenceRules.find((candidate) => candidate.id === ruleId);
    return rule ? [rule.label] : [];
  });
}

function findKpiSignals(version: CampaignVersion, step: CampaignStep) {
  const signals = step.kpiRuleIds.flatMap((ruleId) => {
    const rule = version.kpiRules.find((candidate) => candidate.id === ruleId);
    return rule ? [rule.metricKey] : [];
  });

  return signals.length > 0 ? signals : ["workflow_visibility"];
}

function findStructuredEvents(version: CampaignVersion, step: CampaignStep) {
  const events = step.integrationTriggerRuleIds.flatMap((ruleId) => {
    const rule = version.integrationTriggerRules.find(
      (candidate) => candidate.id === ruleId,
    );
    return rule ? [rule.eventName] : [];
  });

  return events.length > 0 ? events : ["workflow.review.visible"];
}

function findBlockedSystems(
  version: CampaignVersion,
  step: CampaignStep,
  globalBlockedSystems: readonly string[],
) {
  const directBlockedSystems = step.integrationTriggerRuleIds.flatMap((ruleId) => {
    const rule = version.integrationTriggerRules.find(
      (candidate) => candidate.id === ruleId,
    );

    if (!rule || rule.mode !== "disabled_pending_approval") {
      return [];
    }

    return [formatSystemLabel(rule.externalSystem)];
  });
  const relatedCommunicationSystems = findRelatedCommunicationRules(
    version,
    step,
  ).flatMap((rule) =>
    rule.sourceSystem === "mymedlife" ? [] : [formatSystemLabel(rule.sourceSystem)],
  );
  const systems = unique([
    ...directBlockedSystems,
    ...relatedCommunicationSystems,
  ]);

  if (systems.length > 0) {
    return systems;
  }

  return globalBlockedSystems.length > 0 ? globalBlockedSystems : ["External systems"];
}

function findRelatedCommunicationRules(
  version: CampaignVersion,
  step: CampaignStep,
): readonly CommunicationTriggerRule[] {
  const ownerTerms = unique(
    [...step.ownerRoles, ...step.supportingRoles].map((role) =>
      role.replaceAll("_", " "),
    ),
  );
  const integrationSystems = step.integrationTriggerRuleIds.flatMap((ruleId) => {
    const rule = version.integrationTriggerRules.find(
      (candidate) => candidate.id === ruleId,
    );
    return rule ? [rule.externalSystem] : [];
  });

  return uniqueById([
    ...version.communicationTriggerRules.filter((rule) =>
      integrationSystems.includes(rule.sourceSystem),
    ),
    ...version.communicationTriggerRules.filter((rule) => {
      const audience = rule.audience.toLowerCase();
      return ownerTerms.some((term) => audience.includes(term));
    }),
  ]);
}

function mapPlanningPhaseKey(step: CampaignStep): PlanningGoalSettingPhaseKey {
  switch (step.id) {
    case "planning-goal-brief":
      return "goal_alignment";
    case "planning-owner-map":
      return "owner_map";
    case "planning-first-calendar":
      return "action_calendar";
    case "planning-risk-review":
      return "risk_review";
    case "planning-coach-checkin":
      return "coach_checkin";
    default:
      return "goal_alignment";
  }
}

function formatRoleLabel(role: string) {
  return role
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatScopeLabel(scope: string) {
  return scope.replaceAll("_", " ");
}

function formatTokenLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatSystemLabel(
  system: IntegrationTriggerRule["externalSystem"] | CommunicationTriggerRule["sourceSystem"],
) {
  switch (system) {
    case "power_bi":
      return "Power BI";
    case "google_drive":
      return "Google Drive";
    case "google_forms":
      return "Google Forms";
    default:
      return system.replaceAll("_", " ");
  }
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

function uniqueById<T extends { id: string }>(values: readonly T[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    if (seen.has(value.id)) {
      return false;
    }

    seen.add(value.id);
    return true;
  });
}

function emptyTracePosture(): PlanningTracePosture {
  return {
    sourceCount: 0,
    traceCount: 0,
    missingSourceConfirmations: 0,
    note: "No source trace posture is visible for this role.",
  };
}

function emptySourceCoverage(): PlanningSourceCoverage {
  return {
    scriptTemplates: [],
    resourceLinks: [],
  };
}

const fallbackCloseoutChecks = [
  "Every chapter goal has one accountable owner.",
  "The first two weeks of student-facing actions are visible.",
  "Risks have a named next step instead of becoming vague blockers.",
  "Coach check-in notes can be translated into future KPI events.",
  "No reminder, CRM, warehouse, Power BI, SMS, email, or AI send is enabled.",
];

const fallbackSafetyReminders = [
  "This panel does not create goals, assignments, meetings, or campaign templates.",
  "Use it as the review shape for a future Planning / Goal Setting campaign build.",
  "Live writes still require auth, RLS, audit, rollback, and explicit approval.",
];

const planningGoalSettingFallbackPhases: PlanningGoalSettingPhase[] = [
  {
    key: "goal_alignment",
    label: "Set the chapter goal",
    ownerRole: "President / VP",
    studentVisibleOutcome:
      "Members can understand what the chapter is trying to accomplish this month.",
    leaderTask:
      "Write one specific growth, engagement, fundraising, or SLT goal with a deadline and accountable owner.",
    proofPrompt:
      "Capture the before/after leadership note that explains why this goal matters.",
    kpiSignals: ["goals_set", "deadline_defined", "owner_named"],
    structuredEvents: ["campaign_goal_defined", "kpi_event_planned"],
    disabledOutboxDestinations: ["n8n", "Power BI", "warehouse"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "owner_map",
    label: "Assign owner lanes",
    ownerRole: "E-Board Member",
    studentVisibleOutcome:
      "Students see who owns outreach, events, proof, and follow-up instead of guessing.",
    leaderTask:
      "Map each goal to an E-Board owner, Action Committee Chair, and student-facing lane.",
    proofPrompt:
      "Record what changed once ownership became visible to the chapter.",
    kpiSignals: ["owners_assigned", "lanes_covered", "committee_roles_named"],
    structuredEvents: ["campaign_owner_assigned", "role_lane_reviewed"],
    disabledOutboxDestinations: ["HubSpot", "n8n", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "action_calendar",
    label: "Publish first actions",
    ownerRole: "Action Committee Chair",
    studentVisibleOutcome:
      "Members know the first concrete action or event they can join this week.",
    leaderTask:
      "Turn each owner lane into a first action, event, proof prompt, and follow-up date.",
    proofPrompt:
      "Collect a short student or leader note explaining which first action felt easiest to start.",
    kpiSignals: ["calendar_published", "actions_opened", "proof_prompts_ready"],
    structuredEvents: ["campaign_action_calendar_planned", "proof_prompt_planned"],
    disabledOutboxDestinations: ["Luma", "SMS", "email"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "risk_review",
    label: "Name the risks",
    ownerRole: "President / VP",
    studentVisibleOutcome:
      "Members experience fewer dropped commitments because leaders name blockers early.",
    leaderTask:
      "List the top risks, decide who owns each follow-up, and mark what would require coach support.",
    proofPrompt:
      "Capture one concrete risk that became easier to handle because it was named early.",
    kpiSignals: ["risks_identified", "followups_assigned", "coach_support_needed"],
    structuredEvents: ["campaign_risk_flagged", "leader_followup_planned"],
    disabledOutboxDestinations: ["n8n", "Power BI", "warehouse"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
  {
    key: "coach_checkin",
    label: "Prepare coach check-in",
    ownerRole: "Coach",
    studentVisibleOutcome:
      "The chapter gets practical support before the campaign loses momentum.",
    leaderTask:
      "Bring goals, owner lanes, first actions, proof prompts, and risks into the coach review.",
    proofPrompt:
      "Capture the coach note that explains whether the chapter should advance, hold, or receive intervention.",
    kpiSignals: ["coach_checkins", "readiness_status", "intervention_needed"],
    structuredEvents: ["coach_checkin_prepared", "coach_decision_planned"],
    disabledOutboxDestinations: ["HubSpot", "n8n", "AI summary"],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  },
];

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "leader":
      return "Leader Planning / Goal Setting campaign plan";
    case "coach":
      return "Coach Planning / Goal Setting campaign plan";
    case "staff":
      return "Admin Planning / Goal Setting campaign plan";
    case "super_admin":
      return "Full Planning / Goal Setting campaign plan";
    case "member":
    case "ds_admin":
      return "Planning / Goal Setting hidden for this role";
  }
}
