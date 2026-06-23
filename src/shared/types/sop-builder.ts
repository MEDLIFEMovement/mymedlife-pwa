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
  steps: readonly SopStep[];
  roleActionRules: readonly RoleActionRule[];
  completionRules: readonly CompletionRule[];
  evidenceRules: readonly EvidenceRule[];
  approvalRules: readonly ApprovalRule[];
  pointsRules: readonly PointsRule[];
  kpiRules: readonly KpiRule[];
  communicationRules: readonly CommunicationTriggerRule[];
  previewScenarios: readonly SopPreviewScenario[];
  auditRecords: readonly SopAuditRecord[];
  integrationBoundaries: readonly SopIntegrationBoundary[];
};
