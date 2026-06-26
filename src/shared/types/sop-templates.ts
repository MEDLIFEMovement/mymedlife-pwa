import type { SopIntegrationMode, SopRole, SopScope } from "@/shared/types/sop-builder";

export type TemplateImportStatus =
  | "draft_imported"
  | "draft_reviewed"
  | "live"
  | "scheduled"
  | "archived";

export type TemplateSourceCertainty =
  | "explicit_in_source"
  | "inferred_from_source"
  | "repo_only_placeholder"
  | "missing_source_confirmation";

export type ExternalSystemKey =
  | "hubspot"
  | "luma"
  | "shopify"
  | "givelively"
  | "google_drive"
  | "google_forms"
  | "n8n"
  | "warehouse"
  | "power_bi"
  | "mymedlife";

export type WorkflowPermissionAuthorityStatus =
  | "permissions_matrix_linked"
  | "permissions_matrix_missing_local_copy"
  | "repo_preview_only";

export type WorkflowOperation =
  | "draft_edit"
  | "review_submit"
  | "publish_approve"
  | "schedule_change"
  | "rollback_change"
  | "archive_template"
  | "integration_binding_change"
  | "feature_flag_change";

export type FeatureFlagRolloutStage =
  | "draft_only"
  | "review_only"
  | "pilot_ready"
  | "launched";

export type SourceReference = {
  id: string;
  label: string;
  sourceType:
    | "rollout_package"
    | "campaign_catalog"
    | "placement_map"
    | "integration_map"
    | "sop_pdf"
    | "figma"
    | "repo_context";
  certainty: TemplateSourceCertainty;
  location: string;
  note: string;
};

export type ReviewSummary = {
  extractedPhaseCount: number;
  extractedStepCount: number;
  rolesAffected: readonly SopRole[];
  integrationsImplied: readonly ExternalSystemKey[];
  unresolvedAmbiguities: readonly string[];
  sensitiveDataWarnings: readonly string[];
  figmaSurfacesAffected: readonly string[];
  suggestedRolloutOrder: number;
};

export type WorkflowSourcePerspectiveKey = "coach" | "chapter_platform";

export type WorkflowSourcePerspective = {
  id: string;
  key: WorkflowSourcePerspectiveKey;
  label: string;
  pdfPages: string;
  summary: string;
  primaryRoles: readonly SopRole[];
  primaryRoutes: readonly string[];
  sourceReferenceIds: readonly string[];
  sourceCertainty: TemplateSourceCertainty;
};

export type WorkflowOperationPermission = {
  id: string;
  operation: WorkflowOperation;
  allowedRoles: readonly SopRole[];
  allowedScopes: readonly SopScope[];
  approvalRequired: boolean;
  authorityStatus: WorkflowPermissionAuthorityStatus;
  note: string;
};

export type ValidatorDefinition = {
  id: string;
  label: string;
  validatorRoles: readonly SopRole[];
  prompt: string;
  phaseIds: readonly string[];
  stepIds: readonly string[];
  authorityStatus: WorkflowPermissionAuthorityStatus;
  sourceCertainty: TemplateSourceCertainty;
};

export type HandoffRule = {
  id: string;
  fromPhaseId: string;
  toPhaseId: string;
  triggerLabel: string;
  ownerRoles: readonly SopRole[];
  destinationRoutes: readonly string[];
  sourceCertainty: TemplateSourceCertainty;
};

export type FeatureFlagBinding = {
  id: string;
  flagKey: string;
  description: string;
  defaultState: "enabled" | "disabled";
  rolloutStage: FeatureFlagRolloutStage;
  sourceCertainty: TemplateSourceCertainty;
};

export type ImportTraceRecord = {
  id: string;
  sourceReferenceId: string;
  targetType:
    | "template"
    | "phase"
    | "step"
    | "role_rule"
    | "completion_rule"
    | "approval_rule"
    | "integration_trigger"
    | "feature_flag"
    | "operation_permission";
  targetId: string;
  mappingType:
    | "explicit_copy"
    | "normalized_alias"
    | "inferred_structure"
    | "repo_placeholder";
  note: string;
  sourceCertainty: TemplateSourceCertainty;
};

export type RoleActionRule = {
  id: string;
  role: SopRole;
  scope: SopScope;
  actionSummary: string;
  visibleInRoutes: readonly string[];
  blockedByDefault: boolean;
};

export type CompletionRule = {
  id: string;
  label: string;
  successSignal: string;
  sourceCertainty: TemplateSourceCertainty;
};

export type EvidenceRule = {
  id: string;
  label: string;
  required: boolean;
  acceptedFormats: readonly string[];
  approvalRequired: boolean;
  sourceCertainty: TemplateSourceCertainty;
};

export type ApprovalRule = {
  id: string;
  label: string;
  reviewerRoles: readonly SopRole[];
  requiredToAdvance: boolean;
  sourceCertainty: TemplateSourceCertainty;
};

export type PointsRule = {
  id: string;
  label: string;
  pointsByRole: Partial<Record<SopRole, number>>;
  repeatability: "once" | "repeatable_capped" | "manual_override_only";
  leaderboardVisible: boolean;
  sourceCertainty: TemplateSourceCertainty;
};

export type KpiRule = {
  id: string;
  metricKey: string;
  displayLabel: string;
  thresholdLabel: string | null;
  targetValue?: number | null;
  sourceCertainty: TemplateSourceCertainty;
};

export type CommunicationTriggerRule = {
  id: string;
  triggerCondition: string;
  audience: string;
  timing: string;
  sourceSystem: ExternalSystemKey;
  hubspotWorkflowRef: string | null;
  mockStatus: "mock_only" | "approval_required" | "future_live";
};

export type IntegrationTriggerRule = {
  id: string;
  eventName: string;
  externalSystem: ExternalSystemKey;
  mode: SopIntegrationMode | "disabled_pending_approval";
  direction: "emit" | "consume";
  outboxTopic: string | null;
  detail: string;
};

export type RiskRule = {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  triggerCondition: string;
  sourceCertainty: TemplateSourceCertainty;
};

export type EscalationRule = {
  id: string;
  label: string;
  ownerRoles: readonly SopRole[];
  action: string;
  sourceCertainty: TemplateSourceCertainty;
};

export type CloseoutRequirement = {
  id: string;
  label: string;
  description: string;
  requiredByRoles: readonly SopRole[];
  sourceCertainty: TemplateSourceCertainty;
};

export type ScriptTemplate = {
  id: string;
  label: string;
  audience: string;
  summary: string;
  sourceCertainty: TemplateSourceCertainty;
};

export type ResourceLink = {
  id: string;
  label: string;
  href: string;
  sourceCertainty: TemplateSourceCertainty;
};

export type AuditRecord = {
  id: string;
  eventType: string;
  required: boolean;
  note: string;
};

export type CampaignStep = {
  id: string;
  label: string;
  sequence: number;
  objective: string;
  route?: string;
  whyItMatters?: string;
  completionSignal?: string;
  dueTiming?: string;
  ownerRoles: readonly SopRole[];
  supportingRoles: readonly SopRole[];
  roleActionRuleIds: readonly string[];
  completionRuleIds: readonly string[];
  evidenceRuleIds: readonly string[];
  approvalRuleIds: readonly string[];
  pointsRuleIds: readonly string[];
  kpiRuleIds: readonly string[];
  integrationTriggerRuleIds: readonly string[];
  riskRuleIds: readonly string[];
  expectedOutputs: readonly string[];
  sourceCertainty: TemplateSourceCertainty;
};

export type CampaignPhase = {
  id: string;
  label: string;
  sequence: number;
  objective: string;
  entryCriteria: readonly string[];
  exitCriteria: readonly string[];
  coachValidationRequired: boolean;
  steps: readonly CampaignStep[];
  sourceCertainty: TemplateSourceCertainty;
};

export type CampaignVersion = {
  id: string;
  label: string;
  status: TemplateImportStatus;
  workflowName: string;
  coachPdfPages: string;
  chapterPlatformPdfPages: string;
  sourcePerspectives: readonly WorkflowSourcePerspective[];
  importSummary: string;
  sourceReferences: readonly SourceReference[];
  phases: readonly CampaignPhase[];
  roleActionRules: readonly RoleActionRule[];
  operationPermissions: readonly WorkflowOperationPermission[];
  validatorDefinitions: readonly ValidatorDefinition[];
  handoffRules: readonly HandoffRule[];
  completionRules: readonly CompletionRule[];
  evidenceRules: readonly EvidenceRule[];
  approvalRules: readonly ApprovalRule[];
  pointsRules: readonly PointsRule[];
  kpiRules: readonly KpiRule[];
  communicationTriggerRules: readonly CommunicationTriggerRule[];
  integrationTriggerRules: readonly IntegrationTriggerRule[];
  riskRules: readonly RiskRule[];
  escalationRules: readonly EscalationRule[];
  closeoutRequirements: readonly CloseoutRequirement[];
  scriptTemplates: readonly ScriptTemplate[];
  resourceLinks: readonly ResourceLink[];
  featureFlagBindings: readonly FeatureFlagBinding[];
  importTraceRecords: readonly ImportTraceRecord[];
  auditRecords: readonly AuditRecord[];
  reviewSummary: ReviewSummary;
};

export type CampaignTemplate = {
  id: string;
  slug: string;
  name: string;
  period: string;
  primaryAppLocations: readonly string[];
  primaryExternalSystems: readonly string[];
  purpose: string;
  objective: string;
  includedScope: readonly string[];
  excludedScope: readonly string[];
  operatingPrinciples: readonly string[];
  qualityStandards: readonly string[];
  versions: readonly CampaignVersion[];
  liveVersionId: string | null;
};

export type StepRuleEvaluation = {
  roleMatches: boolean;
  scopeMatches: boolean;
  matchingRoleRules: readonly RoleActionRule[];
};

export type OutboxPreviewRecord = {
  templateSlug: string;
  versionId: string;
  stepId: string;
  integrationTriggerId: string;
  eventName: string;
  externalSystem: ExternalSystemKey;
  outboxTopic: string | null;
  mode: IntegrationTriggerRule["mode"];
  directSendEnabled: false;
};
