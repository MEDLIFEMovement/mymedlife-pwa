import type { CampaignShellStatus } from "@/shared/types/campaigns";

export type SopRole =
  | "student_member"
  | "traveler"
  | "committee_member"
  | "committee_chair"
  | "eboard_officer"
  | "vice_president"
  | "president"
  | "coach"
  | "department_staff"
  | "sales_coach"
  | "sales_admin"
  | "ds_admin"
  | "super_admin";

export type SopScope =
  | "own"
  | "committee"
  | "chapter"
  | "assigned_coach_portfolio"
  | "department"
  | "all_platform"
  | "breakglass";

export type SopBuilderTab =
  | "steps"
  | "role-matrix"
  | "completion"
  | "points-kpi"
  | "comms"
  | "preview"
  | "version";

export type SopRuleStatus = "ready_readonly" | "mock_only" | "blocked";
export type SopBuilderStatus = "draft" | "review_ready" | "active_template";
export type SopLibraryStatus = "live" | "draft" | "scheduled" | "archived";
export type SopIntegrationMode = "disabled" | "internal_only" | "future_external";
export type SopSourceCertainty =
  | "explicit_in_source"
  | "inferred_from_source"
  | "repo_only_placeholder"
  | "missing_source_confirmation";
export type SopPermissionAuthorityStatus =
  | "permissions_matrix_linked"
  | "permissions_matrix_missing_local_copy"
  | "repo_preview_only";
export type SopWorkflowOperation =
  | "draft_edit"
  | "review_submit"
  | "publish_approve"
  | "schedule_change"
  | "rollback_change"
  | "archive_template"
  | "integration_binding_change"
  | "feature_flag_change";
export type SopFeatureFlagRolloutStage =
  | "draft_only"
  | "review_only"
  | "pilot_ready"
  | "launched";

export type CampaignVersionEntry = {
  label: string;
  state: "draft" | "review_ready" | "approved_template";
  updatedLabel: string;
  summary: string;
};

export type CampaignVersion = {
  currentLabel: string;
  state: "draft" | "review_ready" | "approved_template";
  updatedLabel: string;
  summary: string;
  history: readonly CampaignVersionEntry[];
};

export type SopPhase = {
  id: string;
  label: string;
  sequence: number;
  objective: string;
  entryCriteria: readonly string[];
  exitCriteria: readonly string[];
  stepIds: readonly string[];
  status: SopRuleStatus;
  sourceCertainty: SopSourceCertainty;
};

export type SopStep = {
  id: string;
  stepNumber: number;
  phaseLabel: string;
  title: string;
  ownerRole: SopRole;
  affectedRoles: readonly SopRole[];
  status: SopRuleStatus;
  linkedRoute: string;
  whyItMatters: string;
  purpose: string;
  supportingRoles: readonly SopRole[];
  entryCriteria: string;
  exitCriteria: string;
  dueTiming: string;
  evidenceRequired: boolean;
  approvalRequired: boolean;
  pointsEnabled: boolean;
  required: boolean;
  kpiTag: string;
  communicationCount: number;
  riskEscalation: string;
  completionSignal: string;
};

export type RoleActionRule = {
  id: string;
  role: SopRole;
  scope: SopScope;
  actionSummary: string;
  route: string;
  status: SopRuleStatus;
  guardrail: string;
};

export type SopValidator = {
  id: string;
  label: string;
  validatorRoles: readonly SopRole[];
  prompt: string;
  phaseIds: readonly string[];
  stepIds: readonly string[];
  authorityStatus: SopPermissionAuthorityStatus;
  status: SopRuleStatus;
  sourceCertainty: SopSourceCertainty;
};

export type SopHandoffRule = {
  id: string;
  fromPhaseId: string;
  toPhaseId: string;
  triggerLabel: string;
  ownerRoles: readonly SopRole[];
  destinationRoutes: readonly string[];
  status: SopRuleStatus;
  sourceCertainty: SopSourceCertainty;
};

export type SopFeatureFlagBinding = {
  id: string;
  flagKey: string;
  description: string;
  defaultState: "enabled" | "disabled";
  rolloutStage: SopFeatureFlagRolloutStage;
  status: SopRuleStatus;
  sourceCertainty: SopSourceCertainty;
};

export type SopOperationPermission = {
  id: string;
  operation: SopWorkflowOperation;
  allowedRoles: readonly SopRole[];
  allowedScopes: readonly SopScope[];
  approvalRequired: boolean;
  authorityStatus: SopPermissionAuthorityStatus;
  note: string;
};

export type SopSourceTrace = {
  id: string;
  label: string;
  location: string;
  mappedTargetType:
    | "campaign"
    | "phase"
    | "step"
    | "role_rule"
    | "completion_rule"
    | "approval_rule"
    | "integration_boundary"
    | "feature_flag"
    | "operation_permission";
  mappedTargetId: string;
  certainty: SopSourceCertainty;
  note: string;
};

export type CompletionRule = {
  id: string;
  label: string;
  status: SopRuleStatus;
  successSignal: string;
  evidenceNeeded: string;
};

export type EvidenceRule = {
  id: string;
  label: string;
  acceptedFormats: readonly string[];
  storagePosture: string;
  status: SopRuleStatus;
  route: string;
};

export type ApprovalRule = {
  id: string;
  label: string;
  reviewerRole: SopRole;
  outcome: string;
  status: SopRuleStatus;
  route: string;
};

export type PointsRule = {
  id: string;
  label: string;
  points: number;
  trigger: string;
  status: SopRuleStatus;
};

export type KpiRule = {
  id: string;
  metricKey: string;
  displayLabel: string;
  sourceOfTruth: string;
  targetValue?: number | null;
  status: SopRuleStatus;
};

export type CommunicationTriggerRule = {
  id: string;
  trigger: string;
  audience: string;
  deliveryMode: SopIntegrationMode;
  detail: string;
};

export type SopPreviewScenario = {
  id: string;
  title: string;
  primaryRole: SopRole;
  route: string;
  visibleStates: readonly string[];
  successSignal: string;
};

export type SopAuditRecord = {
  id: string;
  eventType: string;
  targetTable: string;
  route: string;
  auditExpectation: string;
};

export type SopIntegrationBoundary = {
  system: string;
  mode: SopIntegrationMode;
  note: string;
};

export type SopCampaignDefinition = {
  slug: string;
  name: string;
  shellStatus: CampaignShellStatus;
  builderStatus: SopBuilderStatus;
  libraryStatus: SopLibraryStatus;
  summary: string;
  studentPromise: string;
  operatingRhythm: string;
  lastEditedBy: string;
  lastPublishedDate: string | null;
  builderSections: readonly string[];
  builderSettings: readonly string[];
  version: CampaignVersion;
  phases: readonly SopPhase[];
  steps: readonly SopStep[];
  roleActionRules: readonly RoleActionRule[];
  validators: readonly SopValidator[];
  handoffRules: readonly SopHandoffRule[];
  completionRules: readonly CompletionRule[];
  evidenceRules: readonly EvidenceRule[];
  approvalRules: readonly ApprovalRule[];
  pointsRules: readonly PointsRule[];
  kpiRules: readonly KpiRule[];
  communicationRules: readonly CommunicationTriggerRule[];
  featureFlagBindings: readonly SopFeatureFlagBinding[];
  operationPermissions: readonly SopOperationPermission[];
  previewScenarios: readonly SopPreviewScenario[];
  auditRecords: readonly SopAuditRecord[];
  integrationBoundaries: readonly SopIntegrationBoundary[];
  sourceTraces: readonly SopSourceTrace[];
};
