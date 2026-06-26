import { getSopCampaignDefinition } from "@/data/mock-sop-builder";
import type {
  SopCampaignDefinition,
  SopRole,
  SopRuleStatus,
  SopStep,
} from "@/shared/types/sop-builder";
import type {
  ApprovalRule,
  AuditRecord,
  CampaignPhase,
  CampaignTemplate,
  CampaignVersion,
  CloseoutRequirement,
  CommunicationTriggerRule,
  CompletionRule,
  ExternalSystemKey,
  EscalationRule,
  EvidenceRule,
  FeatureFlagBinding,
  HandoffRule,
  ImportTraceRecord,
  IntegrationTriggerRule,
  KpiRule,
  PointsRule,
  ResourceLink,
  ReviewSummary,
  RiskRule,
  RoleActionRule,
  ScriptTemplate,
  SourceReference,
  TemplateSourceCertainty,
  ValidatorDefinition,
  WorkflowSourcePerspective,
  WorkflowOperationPermission,
} from "@/shared/types/sop-templates";

const planningSourceReferences: readonly SourceReference[] = [
  {
    id: "planning-package-start",
    label: "Full SOP rollout package start-here guide",
    sourceType: "rollout_package",
    certainty: "explicit_in_source",
    location: "00_START_HERE_CODEX_FULL_SOP_ROLLOUT.md",
    note: "Confirms phased rollout order and that Planning / Goal Setting should lead the first full structured import.",
  },
  {
    id: "planning-catalog-pages",
    label: "Campaign catalog and page map",
    sourceType: "campaign_catalog",
    certainty: "explicit_in_source",
    location: "02_SOP_CAMPAIGN_CATALOG_AND_PAGE_MAP.md",
    note: "Confirms coach and chapter/platform page boundaries for Planning / Goal Setting.",
  },
  {
    id: "planning-placement-map",
    label: "myMEDLIFE placement map",
    sourceType: "placement_map",
    certainty: "explicit_in_source",
    location: "03_MYMEDLIFE_PLACEMENT_MAP.md",
    note: "Confirms where planning workflow behavior should surface across leader, coach, staff, and backend views.",
  },
  {
    id: "planning-integrations",
    label: "Platform triggers and integrations",
    sourceType: "integration_map",
    certainty: "explicit_in_source",
    location: "04_PLATFORM_TRIGGERS_AND_INTEGRATIONS.md",
    note: "Confirms that workflow events should stay typed and blocked from live sends by default.",
  },
  {
    id: "planning-pdf-coach",
    label: "MED International SOP PDF coach section",
    sourceType: "sop_pdf",
    certainty: "explicit_in_source",
    location: "Pages 1-32",
    note: "Coach Planning / Goal Setting operating logic.",
  },
  {
    id: "planning-pdf-chapter",
    label: "MED International SOP PDF chapter section",
    sourceType: "sop_pdf",
    certainty: "explicit_in_source",
    location: "Pages 184-213",
    note: "Chapter/platform Planning / Goal Setting operating logic.",
  },
  {
    id: "planning-figma-route-map",
    label: "Existing Figma route and surface map",
    sourceType: "repo_context",
    certainty: "repo_only_placeholder",
    location: "docs/architecture/figma-route-and-surface-map.md",
    note: "Used to align planning workflow placement with the current route families while richer builder/runtime parity is still in progress.",
  },
];

const planningSourcePerspectives: readonly WorkflowSourcePerspective[] = [
  {
    id: "planning-perspective-coach",
    key: "coach",
    label: "Coach perspective",
    pdfPages: "1-32",
    summary:
      "Frames planning as a readiness review: validate owner coverage, risk posture, and whether the chapter should advance, hold, or receive intervention.",
    primaryRoles: ["coach", "sales_admin"],
    primaryRoutes: ["/coach?view=chapters", "/staff?view=campaigns"],
    sourceReferenceIds: [
      "planning-catalog-pages",
      "planning-pdf-coach",
      "planning-placement-map",
    ],
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-perspective-chapter-platform",
    key: "chapter_platform",
    label: "Chapter / platform perspective",
    pdfPages: "184-213",
    summary:
      "Frames planning as execution: make the chapter goal, owner map, first actions, and launch-ready visibility concrete inside member and leader-owned routes.",
    primaryRoles: ["president", "vice_president", "committee_chair"],
    primaryRoutes: [
      "/campaigns/planning-goal-setting",
      "/chapter?view=overview",
      "/chapter?view=committees",
    ],
    sourceReferenceIds: [
      "planning-catalog-pages",
      "planning-pdf-chapter",
      "planning-placement-map",
    ],
    sourceCertainty: "explicit_in_source",
  },
];

const planningRoleActionRules: readonly RoleActionRule[] = [
  {
    id: "planning-president-chapter",
    role: "president",
    scope: "chapter",
    actionSummary:
      "Set the chapter goal, confirm the accountable owner, and keep launch readiness visible across the chapter.",
    visibleInRoutes: ["/campaigns/planning-goal-setting", "/chapter?view=overview"],
    blockedByDefault: false,
  },
  {
    id: "planning-vice-president-chapter",
    role: "vice_president",
    scope: "chapter",
    actionSummary:
      "Translate the goal into owner lanes, committee coverage, and the first two weeks of visible chapter actions.",
    visibleInRoutes: ["/campaigns/planning-goal-setting", "/chapter?view=committees"],
    blockedByDefault: false,
  },
  {
    id: "planning-committee-chair-committee",
    role: "committee_chair",
    scope: "committee",
    actionSummary:
      "Turn planning into the first committee-owned actions, proof prompts, and follow-up cadence.",
    visibleInRoutes: ["/campaigns/planning-goal-setting", "/chapter?view=members"],
    blockedByDefault: false,
  },
  {
    id: "planning-coach-portfolio",
    role: "coach",
    scope: "assigned_coach_portfolio",
    actionSummary:
      "Review planning quality, flag risk posture, and decide whether the chapter should advance, hold, or receive intervention.",
    visibleInRoutes: ["/campaigns/planning-goal-setting", "/coach?view=chapters"],
    blockedByDefault: false,
  },
  {
    id: "planning-sales-admin-department",
    role: "sales_admin",
    scope: "department",
    actionSummary:
      "Inspect planning readiness, compare chapter quality, and keep the workflow configuration mock-safe.",
    visibleInRoutes: ["/campaigns/planning-goal-setting", "/staff?view=campaigns"],
    blockedByDefault: false,
  },
  {
    id: "planning-ds-admin-platform",
    role: "ds_admin",
    scope: "all_platform",
    actionSummary:
      "Review workflow configuration, audit posture, and blocked integration bindings without opening live writes.",
    visibleInRoutes: ["/admin/sop-library", "/admin/sop-builder/planning-goal-setting"],
    blockedByDefault: false,
  },
];

const planningOperationPermissions: readonly WorkflowOperationPermission[] = [
  {
    id: "planning-draft-edit",
    operation: "draft_edit",
    allowedRoles: ["ds_admin", "super_admin"],
    allowedScopes: ["all_platform", "breakglass"],
    approvalRequired: false,
    authorityStatus: "repo_preview_only",
    note: "Local builder posture allows draft editing conceptually while final authority still depends on the external permissions matrix.",
  },
  {
    id: "planning-review-submit",
    operation: "review_submit",
    allowedRoles: ["sales_admin", "ds_admin", "super_admin"],
    allowedScopes: ["department", "all_platform", "breakglass"],
    approvalRequired: false,
    authorityStatus: "permissions_matrix_missing_local_copy",
    note: "Review submission stays visible, but the final authority map still depends on the matrix link.",
  },
  {
    id: "planning-publish-approve",
    operation: "publish_approve",
    allowedRoles: ["sales_admin", "super_admin"],
    allowedScopes: ["department", "breakglass"],
    approvalRequired: true,
    authorityStatus: "permissions_matrix_missing_local_copy",
    note: "Publishing remains approval-gated until the permissions matrix is attached and reconciled.",
  },
  {
    id: "planning-integration-binding-change",
    operation: "integration_binding_change",
    allowedRoles: ["ds_admin", "super_admin"],
    allowedScopes: ["all_platform", "breakglass"],
    approvalRequired: true,
    authorityStatus: "permissions_matrix_missing_local_copy",
    note: "Integration bindings stay blocked until permissions, security, and downstream ownership are confirmed.",
  },
];

const planningCompletionRules: readonly CompletionRule[] = [
  {
    id: "planning-goal-brief-complete",
    label: "Goal brief is specific, owned, and time-bound",
    successSignal: "The chapter goal, accountable owner, and deadline are all visible in the planning record.",
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-owner-map-complete",
    label: "Owner lanes cover the full chapter workflow",
    successSignal: "Every major lane has an owner and no core lane is left ambiguous.",
    sourceCertainty: "inferred_from_source",
  },
  {
    id: "planning-calendar-complete",
    label: "First two weeks of actions are visible",
    successSignal: "Students and leaders can see the first concrete actions, events, and follow-up moments.",
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-risk-review-complete",
    label: "Top risks are named with next steps",
    successSignal: "Risks, follow-ups, and coach-support posture are recorded before launch.",
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-coach-review-complete",
    label: "Coach readiness check is captured",
    successSignal: "The chapter has a coach review note showing whether it should advance, hold, or receive intervention.",
    sourceCertainty: "inferred_from_source",
  },
];

const planningEvidenceRules: readonly EvidenceRule[] = [
  {
    id: "planning-goal-note",
    label: "Leadership goal note",
    required: true,
    acceptedFormats: ["structured_note", "meeting_summary"],
    approvalRequired: false,
    sourceCertainty: "repo_only_placeholder",
  },
  {
    id: "planning-owner-matrix",
    label: "Owner matrix",
    required: true,
    acceptedFormats: ["table", "spreadsheet", "structured_note"],
    approvalRequired: true,
    sourceCertainty: "inferred_from_source",
  },
  {
    id: "planning-first-calendar",
    label: "First action calendar",
    required: true,
    acceptedFormats: ["calendar", "structured_note", "task_list"],
    approvalRequired: true,
    sourceCertainty: "explicit_in_source",
  },
];

const planningApprovalRules: readonly ApprovalRule[] = [
  {
    id: "planning-coach-approval",
    label: "Coach readiness validation",
    reviewerRoles: ["coach", "sales_admin"],
    requiredToAdvance: true,
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-backend-review",
    label: "Backend workflow review",
    reviewerRoles: ["ds_admin", "super_admin"],
    requiredToAdvance: false,
    sourceCertainty: "repo_only_placeholder",
  },
];

const planningPointsRules: readonly PointsRule[] = [
  {
    id: "planning-leader-readiness-points",
    label: "Leader readiness recognition",
    pointsByRole: {
      president: 40,
      vice_president: 30,
      committee_chair: 20,
    },
    repeatability: "once",
    leaderboardVisible: false,
    sourceCertainty: "repo_only_placeholder",
  },
];

const planningKpiRules: readonly KpiRule[] = [
  {
    id: "planning-goals-set",
    metricKey: "goals_set",
    displayLabel: "Goals set",
    thresholdLabel: "One chapter goal per launch cycle",
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-owners-assigned",
    metricKey: "owners_assigned",
    displayLabel: "Owners assigned",
    thresholdLabel: "Every lane has a named owner",
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-calendar-published",
    metricKey: "calendar_published",
    displayLabel: "Calendar published",
    thresholdLabel: "First two weeks visible",
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-risks-identified",
    metricKey: "risks_identified",
    displayLabel: "Risks identified",
    thresholdLabel: "Top risks named before launch",
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-coach-checkins",
    metricKey: "coach_checkins",
    displayLabel: "Coach check-ins",
    thresholdLabel: "Coach review completed before launch",
    sourceCertainty: "inferred_from_source",
  },
];

const planningCommunicationRules: readonly CommunicationTriggerRule[] = [
  {
    id: "planning-coach-checkin-reminder",
    triggerCondition: "When the owner map and first action calendar are complete",
    audience: "coach and president",
    timing: "Before launch readiness review",
    sourceSystem: "hubspot",
    hubspotWorkflowRef: null,
    mockStatus: "approval_required",
  },
  {
    id: "planning-student-visibility-message",
    triggerCondition: "When the chapter publishes first actions",
    audience: "student members",
    timing: "Same day as chapter launch plan publish",
    sourceSystem: "mymedlife",
    hubspotWorkflowRef: null,
    mockStatus: "mock_only",
  },
];

const planningIntegrationRules: readonly IntegrationTriggerRule[] = [
  {
    id: "planning-phase-started",
    eventName: "campaign.phase.started",
    externalSystem: "mymedlife",
    mode: "internal_only",
    direction: "emit",
    outboxTopic: null,
    detail: "Internal workflow event for planning phase changes.",
  },
  {
    id: "planning-kpi-event-created",
    eventName: "kpi.event.created",
    externalSystem: "warehouse",
    mode: "disabled_pending_approval",
    direction: "emit",
    outboxTopic: "analytics.kpi_events",
    detail: "Future analytics export remains blocked until DS approval.",
  },
  {
    id: "planning-coach-decision",
    eventName: "coach.decision.advance_hold_intervene",
    externalSystem: "hubspot",
    mode: "disabled_pending_approval",
    direction: "emit",
    outboxTopic: "crm.coach_decisions",
    detail: "Potential coach decision export stays disabled in the first rollout pass.",
  },
];

const planningRiskRules: readonly RiskRule[] = [
  {
    id: "planning-missing-owner-risk",
    label: "Missing owner on a core lane",
    severity: "high",
    triggerCondition: "Any core campaign lane lacks an accountable owner by review time.",
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-calendar-slip-risk",
    label: "First action calendar not visible",
    severity: "high",
    triggerCondition: "Students cannot see the first concrete action before launch week.",
    sourceCertainty: "inferred_from_source",
  },
  {
    id: "planning-coach-support-risk",
    label: "Coach support needed before launch",
    severity: "medium",
    triggerCondition: "Leadership names unresolved blockers that would delay safe launch.",
    sourceCertainty: "explicit_in_source",
  },
];

const planningEscalationRules: readonly EscalationRule[] = [
  {
    id: "planning-owner-gap-escalation",
    label: "Escalate missing owner gaps",
    ownerRoles: ["president", "vice_president", "coach"],
    action: "Pause launch readiness and assign a named owner before moving forward.",
    sourceCertainty: "inferred_from_source",
  },
  {
    id: "planning-blocker-escalation",
    label: "Escalate unresolved launch blockers",
    ownerRoles: ["coach", "sales_admin"],
    action: "Record hold posture and route the chapter into additional coaching support.",
    sourceCertainty: "explicit_in_source",
  },
];

const planningCloseoutRequirements: readonly CloseoutRequirement[] = [
  {
    id: "planning-closeout-goal-brief",
    label: "Approved goal brief",
    description: "A readable planning brief exists with goal, deadline, and accountable owner.",
    requiredByRoles: ["president", "vice_president"],
    sourceCertainty: "inferred_from_source",
  },
  {
    id: "planning-closeout-calendar",
    label: "Visible first action calendar",
    description: "The first student-facing actions and events are visible before launch.",
    requiredByRoles: ["committee_chair", "president"],
    sourceCertainty: "explicit_in_source",
  },
];

const planningScriptTemplates: readonly ScriptTemplate[] = [
  {
    id: "planning-goal-alignment-script",
    label: "Goal alignment meeting prompt",
    audience: "E-board leaders",
    summary: "Prompt set for turning broad ambition into one concrete chapter goal with a deadline and owner.",
    sourceCertainty: "repo_only_placeholder",
  },
  {
    id: "planning-coach-checkin-script",
    label: "Coach check-in prompt",
    audience: "coach and chapter president",
    summary: "Prompt set for deciding whether the chapter should advance, hold, or receive intervention support.",
    sourceCertainty: "inferred_from_source",
  },
];

const planningResourceLinks: readonly ResourceLink[] = [
  {
    id: "planning-resource-source-map",
    label: "Run A source map",
    href: "/docs/sop-rollout/source-map",
    sourceCertainty: "repo_only_placeholder",
  },
  {
    id: "planning-resource-gap-map",
    label: "Run A import gap map",
    href: "/docs/sop-rollout/import-gap-map",
    sourceCertainty: "repo_only_placeholder",
  },
];

const planningAuditRecords: readonly AuditRecord[] = [
  {
    id: "planning-audit-template-view",
    eventType: "audit.record.created",
    required: true,
    note: "Template inspection should remain auditable even while the workflow is still read-only.",
  },
  {
    id: "planning-audit-coach-decision-preview",
    eventType: "coach.decision.advance_hold_intervene",
    required: true,
    note: "Coach decision posture should be visible in audit planning before live writes are enabled.",
  },
];

const planningPhases: readonly CampaignPhase[] = [
  {
    id: "planning-gsw-preparation",
    label: "GSW Preparation",
    sequence: 1,
    objective:
      "Define one concrete chapter goal and anchor the launch window before downstream tasks begin.",
    entryCriteria: ["Chapter planning cycle has opened.", "Leaders are available to define the goal together."],
    exitCriteria: ["Goal brief is visible.", "Goal owner and deadline are both named."],
    coachValidationRequired: false,
    sourceCertainty: "explicit_in_source",
    steps: [
      {
        id: "planning-goal-brief",
        label: "Define the chapter goal and deadline",
        sequence: 1,
        objective:
          "Turn broad chapter ambition into a single visible goal with a deadline, owner, and why-it-matters context.",
        ownerRoles: ["president", "vice_president"],
        supportingRoles: ["committee_chair", "coach"],
        roleActionRuleIds: ["planning-president-chapter", "planning-vice-president-chapter"],
        completionRuleIds: ["planning-goal-brief-complete"],
        evidenceRuleIds: ["planning-goal-note"],
        approvalRuleIds: [],
        pointsRuleIds: ["planning-leader-readiness-points"],
        kpiRuleIds: ["planning-goals-set"],
        integrationTriggerRuleIds: ["planning-phase-started"],
        riskRuleIds: ["planning-missing-owner-risk"],
        expectedOutputs: ["chapter_goal", "goal_deadline", "goal_owner"],
        sourceCertainty: "explicit_in_source",
      },
    ],
  },
  {
    id: "planning-systems-setup",
    label: "Systems Setup & Officer Training Validation",
    sequence: 2,
    objective:
      "Translate the goal into owner lanes and clarify who is responsible for each operating move.",
    entryCriteria: ["Goal brief exists."],
    exitCriteria: ["Owner matrix is complete.", "Committee and e-board lanes are visible."],
    coachValidationRequired: false,
    sourceCertainty: "explicit_in_source",
    steps: [
      {
        id: "planning-owner-map",
        label: "Map owners to every chapter lane",
        sequence: 1,
        objective:
          "Assign accountable owners for outreach, events, proof, follow-up, and chapter operations.",
        ownerRoles: ["vice_president", "committee_chair"],
        supportingRoles: ["president", "coach"],
        roleActionRuleIds: [
          "planning-vice-president-chapter",
          "planning-committee-chair-committee",
        ],
        completionRuleIds: ["planning-owner-map-complete"],
        evidenceRuleIds: ["planning-owner-matrix"],
        approvalRuleIds: ["planning-backend-review"],
        pointsRuleIds: ["planning-leader-readiness-points"],
        kpiRuleIds: ["planning-owners-assigned"],
        integrationTriggerRuleIds: ["planning-phase-started"],
        riskRuleIds: ["planning-missing-owner-risk"],
        expectedOutputs: ["owner_matrix", "committee_lane_map"],
        sourceCertainty: "inferred_from_source",
      },
    ],
  },
  {
    id: "planning-campaign-review",
    label: "Campaign Planning Review & Action Committee Validation",
    sequence: 3,
    objective:
      "Turn the owner map into the first visible student-facing actions and proof prompts.",
    entryCriteria: ["Owner matrix exists."],
    exitCriteria: ["The first action calendar is visible.", "Committee lanes know the first action to open."],
    coachValidationRequired: false,
    sourceCertainty: "explicit_in_source",
    steps: [
      {
        id: "planning-first-calendar",
        label: "Publish the first action calendar",
        sequence: 1,
        objective:
          "Create the first two weeks of actions, proof prompts, and follow-up dates before launch.",
        ownerRoles: ["committee_chair", "vice_president"],
        supportingRoles: ["president", "coach"],
        roleActionRuleIds: [
          "planning-committee-chair-committee",
          "planning-vice-president-chapter",
        ],
        completionRuleIds: ["planning-calendar-complete"],
        evidenceRuleIds: ["planning-first-calendar"],
        approvalRuleIds: ["planning-coach-approval"],
        pointsRuleIds: ["planning-leader-readiness-points"],
        kpiRuleIds: ["planning-calendar-published"],
        integrationTriggerRuleIds: ["planning-kpi-event-created"],
        riskRuleIds: ["planning-calendar-slip-risk"],
        expectedOutputs: ["first_two_weeks_calendar", "student_visible_actions", "proof_prompts"],
        sourceCertainty: "explicit_in_source",
      },
    ],
  },
  {
    id: "planning-gsw-execution",
    label: "GSW Execution",
    sequence: 4,
    objective:
      "Name the main blockers early enough that the chapter can still correct course.",
    entryCriteria: ["First action calendar is visible."],
    exitCriteria: ["Risks and follow-ups are named.", "Any needed coach support is explicit."],
    coachValidationRequired: false,
    sourceCertainty: "inferred_from_source",
    steps: [
      {
        id: "planning-risk-review",
        label: "Review launch risks and follow-ups",
        sequence: 1,
        objective:
          "Turn vague concern into owned follow-up so launch readiness stays grounded.",
        ownerRoles: ["president", "coach"],
        supportingRoles: ["vice_president", "sales_admin"],
        roleActionRuleIds: [
          "planning-president-chapter",
          "planning-coach-portfolio",
          "planning-sales-admin-department",
        ],
        completionRuleIds: ["planning-risk-review-complete"],
        evidenceRuleIds: [],
        approvalRuleIds: [],
        pointsRuleIds: [],
        kpiRuleIds: ["planning-risks-identified"],
        integrationTriggerRuleIds: ["planning-kpi-event-created"],
        riskRuleIds: ["planning-coach-support-risk"],
        expectedOutputs: ["risk_register", "follow_up_owner_list"],
        sourceCertainty: "explicit_in_source",
      },
    ],
  },
  {
    id: "planning-launch-readiness",
    label: "Launch Readiness",
    sequence: 5,
    objective:
      "Capture the coach decision and confirm whether the chapter can move forward safely.",
    entryCriteria: ["Risks are reviewed.", "Coach sees the current planning packet."],
    exitCriteria: ["Advance, hold, or intervene posture is visible."],
    coachValidationRequired: true,
    sourceCertainty: "explicit_in_source",
    steps: [
      {
        id: "planning-coach-checkin",
        label: "Complete the coach readiness check",
        sequence: 1,
        objective:
          "Document the coach decision and keep the chapter launch posture explicit.",
        ownerRoles: ["coach", "sales_admin"],
        supportingRoles: ["president", "vice_president"],
        roleActionRuleIds: [
          "planning-coach-portfolio",
          "planning-sales-admin-department",
        ],
        completionRuleIds: ["planning-coach-review-complete"],
        evidenceRuleIds: [],
        approvalRuleIds: ["planning-coach-approval"],
        pointsRuleIds: [],
        kpiRuleIds: ["planning-coach-checkins"],
        integrationTriggerRuleIds: ["planning-coach-decision"],
        riskRuleIds: ["planning-coach-support-risk"],
        expectedOutputs: ["coach_decision", "launch_posture", "support_next_step"],
        sourceCertainty: "inferred_from_source",
      },
    ],
  },
];

const planningValidatorDefinitions: readonly ValidatorDefinition[] = [
  {
    id: "planning-goal-brief-validator",
    label: "Goal brief validator",
    validatorRoles: ["president", "vice_president"],
    prompt: "Confirm the chapter goal is specific, owned, and time-bound before owner lanes are published.",
    phaseIds: ["planning-phase-1"],
    stepIds: ["planning-goal-brief"],
    authorityStatus: "permissions_matrix_missing_local_copy",
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-owner-map-validator",
    label: "Owner map validator",
    validatorRoles: ["committee_chair", "president"],
    prompt: "Confirm every major lane has an accountable owner and no committee coverage is ambiguous.",
    phaseIds: ["planning-phase-2", "planning-phase-3"],
    stepIds: ["planning-owner-map", "planning-first-calendar"],
    authorityStatus: "permissions_matrix_missing_local_copy",
    sourceCertainty: "inferred_from_source",
  },
  {
    id: "planning-coach-gate-validator",
    label: "Coach readiness validator",
    validatorRoles: ["coach", "sales_admin"],
    prompt: "Confirm launch posture, risk treatment, and coach recommendation before the workflow can advance.",
    phaseIds: ["planning-phase-4", "planning-phase-5"],
    stepIds: ["planning-risk-review", "planning-coach-checkin"],
    authorityStatus: "permissions_matrix_missing_local_copy",
    sourceCertainty: "explicit_in_source",
  },
];

const planningHandoffRules: readonly HandoffRule[] = [
  {
    id: "planning-phase-1-to-2",
    fromPhaseId: "planning-phase-1",
    toPhaseId: "planning-phase-2",
    triggerLabel: "Goal brief is specific, owned, and time-bound",
    ownerRoles: ["president", "vice_president"],
    destinationRoutes: ["/campaigns/planning-goal-setting", "/chapter?view=overview"],
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-phase-2-to-3",
    fromPhaseId: "planning-phase-2",
    toPhaseId: "planning-phase-3",
    triggerLabel: "Owner lanes cover the full chapter workflow",
    ownerRoles: ["vice_president", "committee_chair"],
    destinationRoutes: ["/chapter?view=committees", "/campaigns/planning-goal-setting"],
    sourceCertainty: "inferred_from_source",
  },
  {
    id: "planning-phase-3-to-4",
    fromPhaseId: "planning-phase-3",
    toPhaseId: "planning-phase-4",
    triggerLabel: "First two weeks of actions are visible",
    ownerRoles: ["committee_chair", "president"],
    destinationRoutes: ["/chapter?view=overview", "/coach?view=chapters"],
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-phase-4-to-5",
    fromPhaseId: "planning-phase-4",
    toPhaseId: "planning-phase-5",
    triggerLabel: "Top risks are named with next steps",
    ownerRoles: ["president", "coach"],
    destinationRoutes: ["/coach?view=chapters", "/staff?view=campaigns"],
    sourceCertainty: "explicit_in_source",
  },
];

const planningFeatureFlagBindings: readonly FeatureFlagBinding[] = [
  {
    id: "planning-builder-preview",
    flagKey: "workflow.planning_goal_setting.builder_preview",
    description: "Keeps the Planning / Goal Setting builder and review posture visible in mock-safe form.",
    defaultState: "enabled",
    rolloutStage: "review_only",
    sourceCertainty: "repo_only_placeholder",
  },
  {
    id: "planning-runtime-reads",
    flagKey: "workflow.planning_goal_setting.runtime_reads",
    description: "Allows app surfaces to read the structured planning template before any writes or external sends open.",
    defaultState: "enabled",
    rolloutStage: "pilot_ready",
    sourceCertainty: "repo_only_placeholder",
  },
];

const planningImportTraceRecords: readonly ImportTraceRecord[] = [
  {
    id: "planning-trace-template",
    sourceReferenceId: "planning-package-start",
    targetType: "template",
    targetId: "template-planning-goal-setting",
    mappingType: "explicit_copy",
    note: "The rollout package explicitly sets Planning / Goal Setting as the first full structured import target.",
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-trace-phase-1",
    sourceReferenceId: "planning-pdf-coach",
    targetType: "phase",
    targetId: "planning-phase-1",
    mappingType: "inferred_structure",
    note: "Goal alignment phase normalized from the coach PDF range and rollout package campaign map.",
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-trace-step-goal-brief",
    sourceReferenceId: "planning-pdf-chapter",
    targetType: "step",
    targetId: "planning-goal-brief",
    mappingType: "inferred_structure",
    note: "Goal brief step captures the chapter/platform planning requirement in structured form.",
    sourceCertainty: "explicit_in_source",
  },
  {
    id: "planning-trace-publish-permission",
    sourceReferenceId: "planning-catalog-pages",
    targetType: "operation_permission",
    targetId: "planning-publish-approve",
    mappingType: "repo_placeholder",
    note: "Publish approval posture stays provisional until the external permissions matrix is attached.",
    sourceCertainty: "missing_source_confirmation",
  },
  {
    id: "planning-trace-feature-flag",
    sourceReferenceId: "planning-figma-route-map",
    targetType: "feature_flag",
    targetId: "planning-runtime-reads",
    mappingType: "repo_placeholder",
    note: "Runtime-read flag exists so the planning template can feed product surfaces before any write path opens.",
    sourceCertainty: "repo_only_placeholder",
  },
];

const planningImportedReviewSummary: ReviewSummary = {
  extractedPhaseCount: planningPhases.length,
  extractedStepCount: planningPhases.reduce(
    (total, phase) => total + phase.steps.length,
    0,
  ),
  rolesAffected: [
    "committee_chair",
    "vice_president",
    "president",
    "coach",
    "sales_admin",
    "ds_admin",
  ],
  integrationsImplied: ["mymedlife", "hubspot", "warehouse"],
  unresolvedAmbiguities: [
    "Permissions matrix is still not bundled locally for operation-level approval constraints.",
  ],
  sensitiveDataWarnings: [
    "No live sends, auth changes, or chapter writes are enabled from this template registry.",
  ],
  figmaSurfacesAffected: [
    "/chapter?view=overview",
    "/coach?view=chapters",
    "/staff?view=campaigns",
    "/admin/sop-builder/planning-goal-setting",
  ],
  suggestedRolloutOrder: 1,
};

const planningReviewedSummary: ReviewSummary = {
  ...planningImportedReviewSummary,
  unresolvedAmbiguities: [
    "Permissions matrix still needs to be attached before operation-level publish rules can be finalized.",
  ],
};

function createPlanningVersion({
  id,
  label,
  status,
  importSummary,
  reviewSummary,
}: {
  id: string;
  label: string;
  status: CampaignVersion["status"];
  importSummary: string;
  reviewSummary: ReviewSummary;
}): CampaignVersion {
  return {
    id,
    label,
    status,
    workflowName: "Chapter Annual Planning Workflow / Chapter Operational Launch System",
    coachPdfPages: "1-32",
    chapterPlatformPdfPages: "184-213",
    sourcePerspectives: planningSourcePerspectives,
    importSummary,
    sourceReferences: planningSourceReferences,
    phases: planningPhases,
    roleActionRules: planningRoleActionRules,
    operationPermissions: planningOperationPermissions,
    validatorDefinitions: planningValidatorDefinitions,
    handoffRules: planningHandoffRules,
    completionRules: planningCompletionRules,
    evidenceRules: planningEvidenceRules,
    approvalRules: planningApprovalRules,
    pointsRules: planningPointsRules,
    kpiRules: planningKpiRules,
    communicationTriggerRules: planningCommunicationRules,
    integrationTriggerRules: planningIntegrationRules,
    riskRules: planningRiskRules,
    escalationRules: planningEscalationRules,
    closeoutRequirements: planningCloseoutRequirements,
    scriptTemplates: planningScriptTemplates,
    resourceLinks: planningResourceLinks,
    featureFlagBindings: planningFeatureFlagBindings,
    importTraceRecords: planningImportTraceRecords,
    auditRecords: planningAuditRecords,
    reviewSummary,
  };
}

const planningGoalSettingTemplate: CampaignTemplate = {
  id: "template-planning-goal-setting",
  slug: "planning-goal-setting",
  name: "Chapter Organization, Planning & Goal Setting",
  period: "July-September",
  primaryAppLocations: [
    "/campaigns/planning-goal-setting",
    "/chapter?view=overview",
    "/coach?view=chapters",
    "/staff?view=campaigns",
    "/admin/sop-library",
    "/admin/sop-builder/planning-goal-setting",
  ],
  primaryExternalSystems: ["mymedlife", "hubspot", "warehouse"],
  purpose:
    "Turn chapter planning into a structured workflow with visible ownership, first actions, launch risk review, and coach readiness posture.",
  objective:
    "Make Planning / Goal Setting the first full structured SOP import without opening live writes or external sends.",
  includedScope: ["chapter planning", "owner mapping", "launch readiness", "coach review"],
  excludedScope: [
    "live chapter mutations",
    "external sends",
    "browser writes",
    "auth changes",
    "warehouse export enablement",
  ],
  operatingPrinciples: [
    "Keep the workflow typed, auditable, and mock-safe.",
    "Separate first full PDF import from later runtime-adapter work.",
    "Use the permissions matrix as authorization truth once it is attached.",
  ],
  qualityStandards: [
    "Every phase has an objective, entry, exit, owners, and expected outputs.",
    "Integration posture is explicit and blocked by default.",
    "Coach and chapter launch posture remains human-decided.",
  ],
  versions: [
    createPlanningVersion({
      id: "planning-goal-setting-v0-import",
      label: "v0 imported",
      status: "draft_imported",
      importSummary:
        "First structured extraction of Planning / Goal Setting from the rollout package and SOP PDF into workflow-template form.",
      reviewSummary: planningImportedReviewSummary,
    }),
    createPlanningVersion({
      id: "planning-goal-setting-v0-review",
      label: "v0 reviewed",
      status: "draft_reviewed",
      importSummary:
        "Reviewed draft template aligned to current route families and mock-safe workflow posture, still awaiting permissions-matrix reconciliation.",
      reviewSummary: planningReviewedSummary,
    }),
  ],
  liveVersionId: null,
};

type DefinitionBackedTemplateSeed = {
  slug:
    | "rush-month"
    | "chapter-engagement"
    | "slt-promotion"
    | "moving-mountains"
    | "leadership-transition"
    | "grow-the-movement"
    | "start-a-chapter";
  templateName: string;
  workflowName: string;
  period: string;
  coachPdfPages: string;
  chapterPlatformPdfPages: string;
  primaryAppLocations: readonly string[];
  primaryExternalSystems: readonly ExternalSystemKey[];
  purpose: string;
  objective: string;
  includedScope: readonly string[];
  excludedScope: readonly string[];
  operatingPrinciples: readonly string[];
  qualityStandards: readonly string[];
  figmaSurfacesAffected: readonly string[];
  suggestedRolloutOrder: number;
  catalogCertainty?: TemplateSourceCertainty;
  catalogLocation?: string;
  catalogNote?: string;
  coachPdfCertainty?: TemplateSourceCertainty;
  coachPdfNote?: string;
  chapterPlatformPdfCertainty?: TemplateSourceCertainty;
  chapterPlatformPdfNote?: string;
  extraSourceReferences?: readonly SourceReference[];
  phaseTraceSourceReferenceId?: string;
  phaseTraceNote?: string;
  additionalReviewedAmbiguities?: readonly string[];
  additionalImportedAmbiguities?: readonly string[];
  importedVersionLabel?: string;
  reviewedVersionLabel?: string;
};

const definitionBackedTemplateSeeds: readonly DefinitionBackedTemplateSeed[] = [
  {
    slug: "rush-month",
    templateName: "Rush Month",
    workflowName: "Chapter Recruitment Workflow",
    period: "August-September",
    coachPdfPages: "33-59",
    chapterPlatformPdfPages: "214-240",
    primaryAppLocations: [
      "/rush-month/dashboard",
      "/rush-month/actions",
      "/rush-month/events",
      "/rush-month/evidence",
      "/rush-month/leaderboard",
      "/admin/sop-library",
      "/admin/sop-builder/rush-month",
    ],
    primaryExternalSystems: ["mymedlife", "luma", "hubspot", "warehouse"],
    purpose:
      "Turn Rush Month into a structured recruitment workflow with visible student momentum, event posture, proof expectations, and chapter recognition.",
    objective:
      "Represent Rush Month as a package-backed structured draft template while preserving its strongest current runtime/product surface as the first workflow-driven proving path.",
    includedScope: [
      "campus visibility",
      "lead capture and engagement",
      "member conversion",
      "proof expectations",
      "recognition and chapter momentum",
    ],
    excludedScope: [
      "live auth changes",
      "external sends",
      "browser-write expansion beyond approved lanes",
      "production uploads",
    ],
    operatingPrinciples: [
      "Keep the member-facing loop intact while shifting workflow configuration into the structured template system.",
      "Treat Rush Month as the strongest proving lane for runtime-owned reads before any broader live expansion.",
      "Keep downstream systems explicit, typed, and blocked unless separately approved.",
    ],
    qualityStandards: [
      "Student actions, event posture, proof review, and recognition should stay inside one coherent workflow family.",
      "Every stage should expose a visible chapter signal and owned next action.",
      "No external system should quietly become the source of truth for campaign state.",
    ],
    figmaSurfacesAffected: [
      "/rush-month/dashboard",
      "/rush-month/actions",
      "/rush-month/events",
      "/rush-month/evidence",
      "/rush-month/leaderboard",
      "/admin/sop-builder/rush-month",
    ],
    suggestedRolloutOrder: 2,
    importedVersionLabel: "v2.1 imported",
    reviewedVersionLabel: "v2.1",
  },
  {
    slug: "chapter-engagement",
    templateName: "Chapter Engagement / Bi-Weekly Management",
    workflowName:
      "Chapter Performance Management / Culture, Retention & Leadership Development Workflow",
    period: "October-April",
    coachPdfPages: "122-151",
    chapterPlatformPdfPages: "295-322",
    primaryAppLocations: [
      "/campaigns/chapter-engagement",
      "/chapter?view=overview",
      "/coach?view=chapters",
      "/staff?view=campaigns",
      "/admin/sop-library",
      "/admin/sop-builder/chapter-engagement",
    ],
    primaryExternalSystems: ["mymedlife", "luma", "hubspot", "warehouse"],
    purpose:
      "Turn recurring chapter energy into a visible weekly workflow with event posture, proof expectations, recognition, and coach-readable follow-through.",
    objective:
      "Represent Chapter Engagement as a structured draft template inside the SOP builder backbone without opening live writes or external sends.",
    includedScope: [
      "member engagement",
      "chapter events",
      "recognition",
      "proof collection",
      "coach follow-up",
    ],
    excludedScope: [
      "live event mutations",
      "external sends",
      "browser writes",
      "production auth changes",
    ],
    operatingPrinciples: [
      "Keep recurring chapter behavior readable as a workflow, not as scattered dashboard copy.",
      "Keep all downstream systems explicit and blocked by default.",
      "Let chapter-owned routes stay primary even when staff can inspect the campaign.",
    ],
    qualityStandards: [
      "Every phase has visible ownership and success signals.",
      "Proof and recognition rules stay tied to the same workflow.",
      "Disabled integrations stay visible as posture, not hidden magic.",
    ],
    figmaSurfacesAffected: [
      "/campaigns/chapter-engagement",
      "/chapter?view=events",
      "/staff?view=campaigns",
      "/admin/sop-builder/chapter-engagement",
    ],
    suggestedRolloutOrder: 3,
  },
  {
    slug: "slt-promotion",
    templateName: "SLT Promotion & Recruitment",
    workflowName: "Traveler Conversion Workflow",
    period: "Year-round with trip-cycle peaks",
    coachPdfPages: "60-92",
    chapterPlatformPdfPages: "241-266",
    primaryAppLocations: [
      "/campaigns/slt-promotion",
      "/slt-prep",
      "/slt-prep/staff",
      "/coach?view=campaigns",
      "/admin/sop-library",
      "/admin/sop-builder/slt-promotion",
    ],
    primaryExternalSystems: ["mymedlife", "shopify", "hubspot", "luma", "warehouse"],
    purpose:
      "Turn SLT interest into a structured chapter workflow with belief-building proof, follow-up discipline, and traveler-readiness handoff.",
    objective:
      "Represent SLT Promotion as a structured draft template that can later drive both chapter recruitment and traveler-readiness surfaces.",
    includedScope: [
      "info sessions",
      "follow-up ownership",
      "belief-building proof",
      "trip-interest signals",
      "staff readiness visibility",
    ],
    excludedScope: [
      "live payments",
      "live auth changes",
      "production uploads",
      "external sends",
    ],
    operatingPrinciples: [
      "Keep belief-building and operational readiness in one typed workflow family.",
      "Model Shopify, Luma, and HubSpot posture without enabling them.",
      "Preserve the mobile/student and staff-readiness route split.",
    ],
    qualityStandards: [
      "Recruitment and readiness remain distinguishable but connected.",
      "Deposit, proof, and follow-up posture stay auditable.",
      "No external system becomes source of truth for campaign state.",
    ],
    figmaSurfacesAffected: [
      "/campaigns/slt-promotion",
      "/slt-prep",
      "/slt-prep/staff",
      "/admin/sop-builder/slt-promotion",
    ],
    suggestedRolloutOrder: 4,
  },
  {
    slug: "moving-mountains",
    templateName: "Moving Mountains",
    workflowName: "Chapter Fundraising Activation Workflow",
    period: "Mission campaign windows",
    coachPdfPages: "93-121",
    chapterPlatformPdfPages: "267-294",
    primaryAppLocations: [
      "/campaigns/moving-mountains",
      "/chapter?view=impact",
      "/staff?view=campaigns",
      "/admin/sop-library",
      "/admin/sop-builder/moving-mountains",
    ],
    primaryExternalSystems: ["mymedlife", "hubspot", "warehouse"],
    purpose:
      "Turn mission-centered fundraising, storytelling, and movement-building into a typed campaign workflow instead of disconnected chapter inspiration.",
    objective:
      "Represent Moving Mountains as a structured draft template with visible owner lanes, proof posture, and blocked reporting boundaries.",
    includedScope: [
      "movement actions",
      "fundraising posture",
      "storytelling proof",
      "chapter participation",
    ],
    excludedScope: [
      "live fundraising syncs",
      "browser writes",
      "warehouse exports",
      "production auth changes",
    ],
    operatingPrinciples: [
      "Keep movement storytelling attached to concrete chapter work.",
      "Block external reporting and syncs until explicitly approved.",
      "Preserve chapter and staff read paths without admin mutation.",
    ],
    qualityStandards: [
      "Mission copy should stay tied to owned actions and proof.",
      "Every stage should expose a measurable chapter signal.",
      "Audit posture should stay visible even while templates are draft-only.",
    ],
    figmaSurfacesAffected: [
      "/campaigns/moving-mountains",
      "/chapter?view=impact",
      "/staff?view=campaigns",
      "/admin/sop-builder/moving-mountains",
    ],
    suggestedRolloutOrder: 5,
  },
  {
    slug: "leadership-transition",
    templateName: "Leadership Transition",
    workflowName: "Chapter Leadership Continuity Workflow",
    period: "Election and handoff windows",
    coachPdfPages: "152-183",
    chapterPlatformPdfPages: "323-end",
    primaryAppLocations: [
      "/campaigns/leadership-transition",
      "/chapter?view=succession",
      "/coach?view=support_notes",
      "/admin/sop-library",
      "/admin/sop-builder/leadership-transition",
    ],
    primaryExternalSystems: ["mymedlife", "hubspot", "warehouse"],
    purpose:
      "Turn leadership turnover into a structured, auditable handoff workflow so chapters do not lose momentum between teams.",
    objective:
      "Represent Leadership Transition as a structured draft template that can later drive succession and coach handoff flows.",
    includedScope: [
      "successor naming",
      "handoff notes",
      "coach validation",
      "open-risk review",
    ],
    excludedScope: [
      "live role writes",
      "member mutations",
      "external sends",
      "production auth changes",
    ],
    operatingPrinciples: [
      "Keep chapter succession readable before mutation paths exist.",
      "Separate coach validation from chapter-owned successor planning.",
      "Preserve audit posture for every handoff checkpoint.",
    ],
    qualityStandards: [
      "Every critical role should have a visible successor or risk note.",
      "Coach gate should be explicit before the handoff is treated as done.",
      "Role and ownership history should stay mock-safe and reviewable.",
    ],
    figmaSurfacesAffected: [
      "/campaigns/leadership-transition",
      "/chapter?view=succession",
      "/coach?view=support_notes",
      "/admin/sop-builder/leadership-transition",
    ],
    suggestedRolloutOrder: 6,
  },
  {
    slug: "grow-the-movement",
    templateName: "Grow the Movement",
    workflowName: "Chapter Growth & Referral Activation Workflow",
    period: "Any chapter growth push outside Rush Month",
    coachPdfPages: "No mapped coach SOP pages in current package",
    chapterPlatformPdfPages: "No mapped chapter/platform SOP pages in current package",
    primaryAppLocations: [
      "/campaigns/grow-the-movement",
      "/chapter?view=members",
      "/coach?view=chapters",
      "/staff?view=campaigns",
      "/admin/sop-library",
      "/admin/sop-builder/grow-the-movement",
    ],
    primaryExternalSystems: ["mymedlife", "hubspot", "warehouse"],
    purpose:
      "Turn chapter growth into a structured campaign with referral ownership, campus partnerships, alumni proof, conversion follow-up, and coach-readable growth health.",
    objective:
      "Represent Grow the Movement as a structured draft template without pretending it already has a dedicated SOP PDF decomposition pass.",
    includedScope: [
      "referral owner planning",
      "campus partnership outreach",
      "alumni and peer proof posture",
      "conversion follow-up",
      "coach growth review",
    ],
    excludedScope: [
      "live CRM writes",
      "live messages",
      "browser writes",
      "production auth changes",
    ],
    operatingPrinciples: [
      "Keep chapter growth tied to visible owners, proof, and follow-up instead of generic inspiration copy.",
      "Carry package-level integration posture forward even when campaign-specific SOP pages do not exist yet.",
      "Preserve the existing campaign detail lane while the deeper structured import remains review-only.",
    ],
    qualityStandards: [
      "Every phase should expose a named owner and a believable next action.",
      "Growth proof should stay tied to conversion follow-up rather than float as disconnected marketing.",
      "Disabled integrations and sends must stay explicit.",
    ],
    figmaSurfacesAffected: [
      "/campaigns/grow-the-movement",
      "/staff?view=campaigns",
      "/admin/sop-builder/grow-the-movement",
    ],
    suggestedRolloutOrder: 7,
    catalogCertainty: "missing_source_confirmation",
    catalogLocation: "No explicit entry in 02_SOP_CAMPAIGN_CATALOG_AND_PAGE_MAP.md",
    catalogNote:
      "This campaign is part of the repo's seven-lane starter inventory but is not enumerated in the current rollout package campaign catalog.",
    coachPdfCertainty: "missing_source_confirmation",
    coachPdfNote:
      "No coach-page range is mapped for this campaign in the current rollout package or SOP PDF intake notes.",
    chapterPlatformPdfCertainty: "missing_source_confirmation",
    chapterPlatformPdfNote:
      "No chapter/platform page range is mapped for this campaign in the current rollout package or SOP PDF intake notes.",
    extraSourceReferences: [
      {
        id: "grow-the-movement-goal-doc",
        label: "Goal 105 Grow the Movement campaign plan",
        sourceType: "repo_context",
        certainty: "repo_only_placeholder",
        location: "docs/architecture/goal-105-grow-the-movement-campaign-plan.md",
        note: "Current structured campaign detail plan that defines phases, roles, proof prompts, KPI signals, and blocked-write posture.",
      },
    ],
    phaseTraceSourceReferenceId: "grow-the-movement-goal-doc",
    phaseTraceNote:
      "Phase normalized from the current campaign plan doc, placement map, and builder-backed route inventory while source-package coverage remains incomplete.",
    additionalReviewedAmbiguities: [
      "The rollout package does not yet provide a catalog or PDF section for Grow the Movement, so the current structured draft still leans on repo-defined campaign-plan artifacts.",
    ],
    additionalImportedAmbiguities: [
      "The rollout package does not yet provide a catalog or PDF section for Grow the Movement, so this import is structured from repo-defined campaign-plan artifacts plus package-level placement and integration guidance.",
    ],
  },
  {
    slug: "start-a-chapter",
    templateName: "Start a Chapter",
    workflowName: "Chapter Expansion & Founding Team Activation Workflow",
    period: "Expansion and campus-launch windows",
    coachPdfPages: "No mapped coach SOP pages in current package",
    chapterPlatformPdfPages: "No mapped chapter/platform SOP pages in current package",
    primaryAppLocations: [
      "/campaigns/start-a-chapter",
      "/coach?view=chapters",
      "/staff?view=campaigns",
      "/admin/sop-library",
      "/admin/sop-builder/start-a-chapter",
    ],
    primaryExternalSystems: ["mymedlife", "hubspot", "luma", "warehouse"],
    purpose:
      "Turn campus expansion into a structured workflow with founding-team formation, first-event planning, readiness gates, and coach handoff.",
    objective:
      "Represent Start a Chapter as a structured draft template while keeping its source pedigree honest about current package gaps.",
    includedScope: [
      "campus interest qualification",
      "founding team formation",
      "first event planning",
      "readiness gate review",
      "coach handoff",
    ],
    excludedScope: [
      "live chapter creation",
      "role writes",
      "membership writes",
      "external sends",
    ],
    operatingPrinciples: [
      "Keep expansion readiness visible as a workflow instead of a vague admin process.",
      "Model HubSpot, Luma, and downstream analytics posture without enabling them.",
      "Preserve coach and staff oversight while chapters remain uncreated and mock-safe.",
    ],
    qualityStandards: [
      "A founding team should never appear ready without named owners and visible gates.",
      "First-event planning should lead to concrete student action, not only awareness.",
      "Blocked chapter, role, and membership writes must stay explicit.",
    ],
    figmaSurfacesAffected: [
      "/campaigns/start-a-chapter",
      "/staff?view=campaigns",
      "/admin/sop-builder/start-a-chapter",
    ],
    suggestedRolloutOrder: 8,
    catalogCertainty: "missing_source_confirmation",
    catalogLocation: "No explicit entry in 02_SOP_CAMPAIGN_CATALOG_AND_PAGE_MAP.md",
    catalogNote:
      "This campaign is part of the repo's seven-lane starter inventory but is not enumerated in the current rollout package campaign catalog.",
    coachPdfCertainty: "missing_source_confirmation",
    coachPdfNote:
      "No coach-page range is mapped for this campaign in the current rollout package or SOP PDF intake notes.",
    chapterPlatformPdfCertainty: "missing_source_confirmation",
    chapterPlatformPdfNote:
      "No chapter/platform page range is mapped for this campaign in the current rollout package or SOP PDF intake notes.",
    extraSourceReferences: [
      {
        id: "start-a-chapter-goal-doc",
        label: "Goal 106 Start a Chapter campaign plan",
        sourceType: "repo_context",
        certainty: "repo_only_placeholder",
        location: "docs/architecture/goal-106-start-a-chapter-campaign-plan.md",
        note: "Current structured campaign detail plan that defines phases, owners, readiness gates, and blocked-write posture.",
      },
    ],
    phaseTraceSourceReferenceId: "start-a-chapter-goal-doc",
    phaseTraceNote:
      "Phase normalized from the current campaign plan doc, placement map, and builder-backed route inventory while source-package coverage remains incomplete.",
    additionalReviewedAmbiguities: [
      "The rollout package does not yet provide a catalog or PDF section for Start a Chapter, so the current structured draft still leans on repo-defined campaign-plan artifacts.",
    ],
    additionalImportedAmbiguities: [
      "The rollout package does not yet provide a catalog or PDF section for Start a Chapter, so this import is structured from repo-defined campaign-plan artifacts plus package-level placement and integration guidance.",
    ],
  },
];

const definitionBackedTemplates = definitionBackedTemplateSeeds.map((seed) =>
  createDefinitionBackedTemplate(seed),
);

export const sopTemplateRegistry: readonly CampaignTemplate[] = [
  planningGoalSettingTemplate,
  ...definitionBackedTemplates,
];

function createDefinitionBackedTemplate(
  seed: DefinitionBackedTemplateSeed,
): CampaignTemplate {
  const definition = getSopCampaignDefinition(seed.slug);

  if (!definition) {
    throw new Error(`Missing SOP campaign definition for ${seed.slug}`);
  }

  return {
    id: `template-${seed.slug}`,
    slug: seed.slug,
    name: seed.templateName,
    period: seed.period,
    primaryAppLocations: seed.primaryAppLocations,
    primaryExternalSystems: seed.primaryExternalSystems,
    purpose: seed.purpose,
    objective: seed.objective,
    includedScope: seed.includedScope,
    excludedScope: seed.excludedScope,
    operatingPrinciples: seed.operatingPrinciples,
    qualityStandards: seed.qualityStandards,
    versions: [
      createDefinitionBackedVersion(seed, definition, {
        id: `${seed.slug}-v0-import`,
        label: seed.importedVersionLabel ?? "v0 imported",
        status: "draft_imported",
        importSummary:
          "Structured draft created from the current SOP builder definition, rollout source map, and route inventory. A dedicated campaign-by-campaign PDF decomposition pass is still pending.",
      }),
      createDefinitionBackedVersion(seed, definition, {
        id: `${seed.slug}-v0-review`,
        label: seed.reviewedVersionLabel ?? "v0 reviewed",
        status: "draft_reviewed",
        importSummary:
          "Reviewed draft aligned to the current route family and mock-safe workflow posture while the deeper SOP source pass remains pending.",
      }),
    ],
    liveVersionId: null,
  };
}

function createDefinitionBackedVersion(
  seed: DefinitionBackedTemplateSeed,
  definition: SopCampaignDefinition,
  meta: {
    id: string;
    label: string;
    status: CampaignVersion["status"];
    importSummary: string;
  },
): CampaignVersion {
  const integrationTriggerRules = buildDefinitionIntegrationRules(seed, definition);
  const phases = buildDefinitionPhases(seed, definition, integrationTriggerRules);
  const reviewSummary = buildDefinitionReviewSummary(
    seed,
    definition,
    phases,
    meta.status,
  );

  return {
    id: meta.id,
    label: meta.label,
    status: meta.status,
    workflowName: seed.workflowName,
    coachPdfPages: seed.coachPdfPages,
    chapterPlatformPdfPages: seed.chapterPlatformPdfPages,
    sourcePerspectives: buildDefinitionSourcePerspectives(seed, definition),
    importSummary: meta.importSummary,
    sourceReferences: buildDefinitionSourceReferences(seed),
    phases,
    roleActionRules: buildDefinitionRoleActionRules(definition),
    operationPermissions: buildDefinitionOperationPermissions(),
    validatorDefinitions: buildDefinitionValidatorDefinitions(phases),
    handoffRules: buildDefinitionHandoffRules(phases),
    completionRules: buildDefinitionCompletionRules(definition),
    evidenceRules: buildDefinitionEvidenceRules(definition),
    approvalRules: buildDefinitionApprovalRules(definition),
    pointsRules: buildDefinitionPointsRules(definition),
    kpiRules: buildDefinitionKpiRules(definition),
    communicationTriggerRules: buildDefinitionCommunicationRules(seed, definition),
    integrationTriggerRules,
    riskRules: buildDefinitionRiskRules(definition),
    escalationRules: buildDefinitionEscalationRules(definition),
    closeoutRequirements: buildDefinitionCloseoutRequirements(definition),
    scriptTemplates: buildDefinitionScriptTemplates(seed, definition),
    resourceLinks: buildDefinitionResourceLinks(seed),
    featureFlagBindings: buildDefinitionFeatureFlagBindings(seed),
    importTraceRecords: buildDefinitionImportTraceRecords(seed, phases),
    auditRecords: buildDefinitionAuditRecords(definition),
    reviewSummary,
  };
}

function buildDefinitionSourceReferences(
  seed: DefinitionBackedTemplateSeed,
): readonly SourceReference[] {
  return [
    {
      id: `${seed.slug}-package-start`,
      label: "Full SOP rollout package start-here guide",
      sourceType: "rollout_package",
      certainty: "explicit_in_source",
      location: "00_START_HERE_CODEX_FULL_SOP_ROLLOUT.md",
      note: "Confirms that the campaign should become a structured workflow inside myMEDLIFE rather than stay as loose route copy.",
    },
    {
      id: `${seed.slug}-catalog`,
      label: "Campaign catalog and page map",
      sourceType: "campaign_catalog",
      certainty: seed.catalogCertainty ?? "explicit_in_source",
      location:
        seed.catalogLocation ?? "02_SOP_CAMPAIGN_CATALOG_AND_PAGE_MAP.md",
      note:
        seed.catalogNote ??
        `Confirms the ${seed.templateName} campaign family and its place in the rollout.`,
    },
    {
      id: `${seed.slug}-placement`,
      label: "myMEDLIFE placement map",
      sourceType: "placement_map",
      certainty: "explicit_in_source",
      location: "03_MYMEDLIFE_PLACEMENT_MAP.md",
      note: "Confirms where the workflow should appear across student, leader, coach, staff, and backend lanes.",
    },
    {
      id: `${seed.slug}-integrations`,
      label: "Platform triggers and integrations",
      sourceType: "integration_map",
      certainty: "explicit_in_source",
      location: "04_PLATFORM_TRIGGERS_AND_INTEGRATIONS.md",
      note: "Confirms that integration posture should be typed, explicit, and blocked by default.",
    },
    {
      id: `${seed.slug}-coach-pdf`,
      label: `${seed.templateName} coach SOP section`,
      sourceType: "sop_pdf",
      certainty: seed.coachPdfCertainty ?? "inferred_from_source",
      location: `Pages ${seed.coachPdfPages}`,
      note:
        seed.coachPdfNote ??
        "Coach operating logic range inferred from the source-map page inventory.",
    },
    {
      id: `${seed.slug}-chapter-pdf`,
      label: `${seed.templateName} chapter/platform SOP section`,
      sourceType: "sop_pdf",
      certainty: seed.chapterPlatformPdfCertainty ?? "inferred_from_source",
      location: `Pages ${seed.chapterPlatformPdfPages}`,
      note:
        seed.chapterPlatformPdfNote ??
        "Chapter/platform operating logic range inferred from the source-map page inventory.",
    },
    {
      id: `${seed.slug}-repo-definition`,
      label: "Current repo SOP builder definition",
      sourceType: "repo_context",
      certainty: "repo_only_placeholder",
      location: `src/data/mock-sop-builder.ts#${seed.slug}`,
      note: "Used as the current structured source while a campaign-specific PDF decomposition pass is still pending.",
    },
    ...(seed.extraSourceReferences ?? []),
  ];
}

function buildDefinitionSourcePerspectives(
  seed: DefinitionBackedTemplateSeed,
  definition: SopCampaignDefinition,
): readonly WorkflowSourcePerspective[] {
  const coachRoutes = uniqueStrings(
    seed.primaryAppLocations.filter(
      (route) => route.startsWith("/coach") || route.startsWith("/staff"),
    ),
  );
  const chapterPlatformRoutes = uniqueStrings(
    seed.primaryAppLocations.filter(
      (route) =>
        !route.startsWith("/coach") &&
        !route.startsWith("/staff") &&
        !route.startsWith("/admin"),
    ),
  );
  const chapterRoles = uniqueStrings(
    definition.roleActionRules
      .filter((rule) => rule.role !== "coach")
      .map((rule) => rule.role),
  ) as SopRole[];

  return [
    {
      id: `${seed.slug}-perspective-coach`,
      key: "coach",
      label: "Coach perspective",
      pdfPages: seed.coachPdfPages,
      summary:
        `Frames ${seed.templateName} as a review and support workflow: coach/staff roles inspect risk, proof, KPI posture, and whether the chapter should advance, hold, or receive intervention.`,
      primaryRoles: ["coach", "sales_admin"],
      primaryRoutes:
        coachRoutes.length > 0 ? coachRoutes : ["/coach?view=chapters"],
      sourceReferenceIds: [
        `${seed.slug}-catalog`,
        `${seed.slug}-coach-pdf`,
        `${seed.slug}-placement`,
      ],
      sourceCertainty: seed.coachPdfCertainty ?? "inferred_from_source",
    },
    {
      id: `${seed.slug}-perspective-chapter-platform`,
      key: "chapter_platform",
      label: "Chapter / platform perspective",
      pdfPages: seed.chapterPlatformPdfPages,
      summary:
        `Frames ${seed.templateName} as visible chapter execution inside myMEDLIFE: members and leaders should be able to read the next step, owner lanes, proof posture, and progress without opening live writes.`,
      primaryRoles: chapterRoles,
      primaryRoutes:
        chapterPlatformRoutes.length > 0
          ? chapterPlatformRoutes
          : [`/campaigns/${seed.slug}`],
      sourceReferenceIds: [
        `${seed.slug}-catalog`,
        `${seed.slug}-chapter-pdf`,
        `${seed.slug}-placement`,
      ],
      sourceCertainty:
        seed.chapterPlatformPdfCertainty ?? "inferred_from_source",
    },
  ];
}

function buildDefinitionRoleActionRules(
  definition: SopCampaignDefinition,
): readonly RoleActionRule[] {
  return definition.roleActionRules.map((rule) => ({
    id: rule.id,
    role: rule.role,
    scope: rule.scope,
    actionSummary: rule.actionSummary,
    visibleInRoutes: [rule.route],
    blockedByDefault: rule.status !== "ready_readonly",
  }));
}

function buildDefinitionOperationPermissions(): readonly WorkflowOperationPermission[] {
  return [
    {
      id: "definition-draft-edit",
      operation: "draft_edit",
      allowedRoles: ["ds_admin", "super_admin"],
      allowedScopes: ["all_platform", "breakglass"],
      approvalRequired: false,
      authorityStatus: "repo_preview_only",
      note: "Definition-backed drafts can model edit posture locally while final authority still depends on the external permissions matrix.",
    },
    {
      id: "definition-review-submit",
      operation: "review_submit",
      allowedRoles: ["department_staff", "sales_admin", "ds_admin", "super_admin"],
      allowedScopes: ["department", "all_platform", "breakglass"],
      approvalRequired: false,
      authorityStatus: "permissions_matrix_missing_local_copy",
      note: "Review submission remains visible while the permissions matrix is still a linked external source.",
    },
    {
      id: "definition-publish-approve",
      operation: "publish_approve",
      allowedRoles: ["sales_admin", "super_admin"],
      allowedScopes: ["department", "breakglass"],
      approvalRequired: true,
      authorityStatus: "permissions_matrix_missing_local_copy",
      note: "Publish approval stays provisional until the matrix is attached and reconciled against the repo role model.",
    },
  ];
}

function buildDefinitionValidatorDefinitions(
  phases: readonly CampaignPhase[],
): readonly ValidatorDefinition[] {
  return phases.map((phase, index) => ({
    id: `${phase.id}-validator`,
    label: `${phase.label} validator`,
    validatorRoles: phase.coachValidationRequired
      ? ["coach", "sales_admin"]
      : index === 0
        ? ["president", "committee_chair"]
        : ["president", "coach"],
    prompt: phase.coachValidationRequired
      ? "Confirm the phase is ready to advance without opening live writes or external sends."
      : "Confirm owners, proof posture, and visible outcomes are clear before advancing to the next phase.",
    phaseIds: [phase.id],
    stepIds: phase.steps.map((step) => step.id),
    authorityStatus: "permissions_matrix_missing_local_copy",
    sourceCertainty: phase.sourceCertainty,
  }));
}

function buildDefinitionHandoffRules(
  phases: readonly CampaignPhase[],
): readonly HandoffRule[] {
  return phases.slice(0, -1).map((phase, index) => {
    const nextPhase = phases[index + 1];
    const nextRoute = nextPhase.steps[0]?.ownerRoles[0] === "coach"
      ? "/coach?view=chapters"
      : nextPhase.steps[0]?.ownerRoles[0] === "department_staff"
        ? "/staff?view=campaigns"
        : nextPhase.steps[0]?.ownerRoles[0] === "president"
          ? "/chapter?view=overview"
          : nextPhase.steps[0]?.ownerRoles[0] === "committee_chair"
            ? "/chapter?view=committees"
            : "/campaigns";

    return {
      id: `${phase.id}-to-${nextPhase.id}`,
      fromPhaseId: phase.id,
      toPhaseId: nextPhase.id,
      triggerLabel: `${phase.label} exit criteria are visible`,
      ownerRoles: uniqueStrings(
        phase.steps.flatMap((step) => [step.ownerRoles[0] ?? "student_member"]),
      ) as SopRole[],
      destinationRoutes: [nextRoute],
      sourceCertainty: nextPhase.sourceCertainty,
    };
  });
}

function buildDefinitionCompletionRules(
  definition: SopCampaignDefinition,
): readonly CompletionRule[] {
  return definition.completionRules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    successSignal: rule.successSignal,
    sourceCertainty: certaintyFromRuleStatus(rule.status),
  }));
}

function buildDefinitionEvidenceRules(
  definition: SopCampaignDefinition,
): readonly EvidenceRule[] {
  return definition.evidenceRules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    required: true,
    acceptedFormats: rule.acceptedFormats,
    approvalRequired: true,
    sourceCertainty: certaintyFromRuleStatus(rule.status),
  }));
}

function buildDefinitionApprovalRules(
  definition: SopCampaignDefinition,
): readonly ApprovalRule[] {
  return definition.approvalRules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    reviewerRoles: [rule.reviewerRole],
    requiredToAdvance: rule.status === "ready_readonly",
    sourceCertainty: certaintyFromRuleStatus(rule.status),
  }));
}

function buildDefinitionPointsRules(
  definition: SopCampaignDefinition,
): readonly PointsRule[] {
  const pointRoles = uniqueStrings(
    definition.steps.filter((step) => step.pointsEnabled).map((step) => step.ownerRole),
  ) as SopRole[];

  return definition.pointsRules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    pointsByRole: Object.fromEntries(
      pointRoles.map((role) => [role, rule.points]),
    ),
    repeatability: "once",
    leaderboardVisible: true,
    sourceCertainty: certaintyFromRuleStatus(rule.status),
  }));
}

function buildDefinitionKpiRules(
  definition: SopCampaignDefinition,
): readonly KpiRule[] {
  return definition.kpiRules.map((rule) => ({
    id: rule.id,
    metricKey: rule.metricKey,
    displayLabel: rule.displayLabel,
    thresholdLabel: rule.sourceOfTruth,
    targetValue: rule.targetValue ?? null,
    sourceCertainty: certaintyFromRuleStatus(rule.status),
  }));
}

function buildDefinitionCommunicationRules(
  seed: DefinitionBackedTemplateSeed,
  definition: SopCampaignDefinition,
): readonly CommunicationTriggerRule[] {
  return definition.communicationRules.map((rule) => ({
    id: rule.id,
    triggerCondition: rule.trigger,
    audience: rule.audience,
    timing: "Route-visible while sends remain disabled",
    sourceSystem:
      rule.deliveryMode === "internal_only"
        ? "mymedlife"
        : seed.primaryExternalSystems.find((system) => system !== "mymedlife") ??
          "mymedlife",
    hubspotWorkflowRef: null,
    mockStatus:
      rule.deliveryMode === "future_external"
        ? "approval_required"
        : "mock_only",
  }));
}

function buildDefinitionIntegrationRules(
  seed: DefinitionBackedTemplateSeed,
  definition: SopCampaignDefinition,
): readonly IntegrationTriggerRule[] {
  return uniqueById(
    definition.steps.flatMap((step) =>
      getStepIntegrationRules(step, seed),
    ),
  );
}

function buildDefinitionRiskRules(
  definition: SopCampaignDefinition,
): readonly RiskRule[] {
  return definition.steps.map((step) => ({
    id: `${step.id}-risk`,
    label: `${step.title} risk posture`,
    severity: step.required ? "high" : "medium",
    triggerCondition: step.riskEscalation,
    sourceCertainty: certaintyFromRuleStatus(step.status),
  }));
}

function buildDefinitionEscalationRules(
  definition: SopCampaignDefinition,
): readonly EscalationRule[] {
  return definition.steps
    .filter(
      (step) =>
        step.approvalRequired ||
        step.supportingRoles.includes("coach") ||
        step.supportingRoles.includes("department_staff"),
    )
    .map((step) => ({
      id: `${step.id}-escalation`,
      label: `${step.title} escalation`,
      ownerRoles: uniqueStrings([
        step.ownerRole,
        ...step.supportingRoles.filter(
          (role) => role === "coach" || role === "department_staff" || role === "president",
        ),
      ]) as SopRole[],
      action: step.riskEscalation,
      sourceCertainty: certaintyFromRuleStatus(step.status),
    }));
}

function buildDefinitionCloseoutRequirements(
  definition: SopCampaignDefinition,
): readonly CloseoutRequirement[] {
  return groupDefinitionStepsByPhase(definition).map((phase, index) => ({
    id: `${definition.slug}-closeout-${index + 1}`,
    label: `${phase.label} closeout`,
    description:
      phase.steps.at(-1)?.exitCriteria ??
      "Phase closeout should keep ownership, proof, and review posture visible.",
    requiredByRoles: uniqueStrings(
      phase.steps.flatMap((step) => [step.ownerRole, ...step.supportingRoles]),
    ) as SopRole[],
    sourceCertainty: phase.steps.some((step) => step.status === "mock_only")
      ? "repo_only_placeholder"
      : "inferred_from_source",
  }));
}

function buildDefinitionScriptTemplates(
  seed: DefinitionBackedTemplateSeed,
  definition: SopCampaignDefinition,
): readonly ScriptTemplate[] {
  return [
    {
      id: `${seed.slug}-student-script`,
      label: "Student-facing campaign explanation",
      audience: "student members",
      summary: definition.studentPromise,
      sourceCertainty: "inferred_from_source",
    },
    {
      id: `${seed.slug}-coach-script`,
      label: "Coach review framing",
      audience: "coaches and staff",
      summary: definition.operatingRhythm,
      sourceCertainty: "repo_only_placeholder",
    },
  ];
}

function buildDefinitionResourceLinks(
  seed: DefinitionBackedTemplateSeed,
): readonly ResourceLink[] {
  return seed.primaryAppLocations.slice(0, 4).map((href, index) => ({
    id: `${seed.slug}-resource-${index + 1}`,
    label: `Open ${href}`,
    href,
    sourceCertainty: "repo_only_placeholder",
  }));
}

function buildDefinitionFeatureFlagBindings(
  seed: DefinitionBackedTemplateSeed,
): readonly FeatureFlagBinding[] {
  return [
    {
      id: `${seed.slug}-builder-preview`,
      flagKey: `workflow.${seed.slug}.builder_preview`,
      description: "Keeps the definition-backed draft visible in the SOP builder without implying hosted rollout.",
      defaultState: "enabled",
      rolloutStage: "review_only",
      sourceCertainty: "repo_only_placeholder",
    },
    {
      id: `${seed.slug}-runtime-reads`,
      flagKey: `workflow.${seed.slug}.runtime_reads`,
      description: "Allows product surfaces to read the structured draft before any browser writes or external sends are approved.",
      defaultState: "enabled",
      rolloutStage: "pilot_ready",
      sourceCertainty: "repo_only_placeholder",
    },
  ];
}

function buildDefinitionImportTraceRecords(
  seed: DefinitionBackedTemplateSeed,
  phases: readonly CampaignPhase[],
): readonly ImportTraceRecord[] {
  return [
    {
      id: `${seed.slug}-trace-template`,
      sourceReferenceId: `${seed.slug}-repo-definition`,
      targetType: "template",
      targetId: `template-${seed.slug}`,
      mappingType: "repo_placeholder",
      note: "Current structured draft still leans on the existing builder definition while campaign-specific PDF decomposition remains pending.",
      sourceCertainty: "repo_only_placeholder",
    },
    ...phases.slice(0, 2).map((phase) => ({
      id: `${phase.id}-trace`,
      sourceReferenceId:
        seed.phaseTraceSourceReferenceId ?? `${seed.slug}-catalog`,
      targetType: "phase" as const,
      targetId: phase.id,
      mappingType: "inferred_structure" as const,
      note:
        seed.phaseTraceNote ??
        "Phase normalized from the campaign catalog, placement map, and current builder-backed route inventory.",
      sourceCertainty: phase.sourceCertainty,
    })),
    {
      id: `${seed.slug}-trace-publish-permission`,
      sourceReferenceId: `${seed.slug}-placement`,
      targetType: "operation_permission",
      targetId: "definition-publish-approve",
      mappingType: "repo_placeholder",
      note: "Publish authority remains provisional until the external permissions matrix is attached locally.",
      sourceCertainty: "missing_source_confirmation",
    },
    {
      id: `${seed.slug}-trace-feature-flag`,
      sourceReferenceId: `${seed.slug}-repo-definition`,
      targetType: "feature_flag",
      targetId: `${seed.slug}-runtime-reads`,
      mappingType: "repo_placeholder",
      note: "Runtime-read flag keeps the draft useful in product surfaces before any write path is approved.",
      sourceCertainty: "repo_only_placeholder",
    },
  ];
}

function buildDefinitionAuditRecords(
  definition: SopCampaignDefinition,
): readonly AuditRecord[] {
  return definition.auditRecords.map((record) => ({
    id: record.id,
    eventType: record.eventType,
    required: true,
    note: record.auditExpectation,
  }));
}

function buildDefinitionReviewSummary(
  seed: DefinitionBackedTemplateSeed,
  definition: SopCampaignDefinition,
  phases: readonly CampaignPhase[],
  status: CampaignVersion["status"],
): ReviewSummary {
  return {
    extractedPhaseCount: phases.length,
    extractedStepCount: definition.steps.length,
    rolesAffected: uniqueStrings(
      definition.steps.flatMap((step) => [
        step.ownerRole,
        ...step.supportingRoles,
        ...step.affectedRoles,
      ]),
    ) as SopRole[],
    integrationsImplied: seed.primaryExternalSystems,
    unresolvedAmbiguities:
      status === "draft_reviewed"
        ? [
            "Permissions matrix still needs to be attached before operation-level publish rules can be finalized.",
            "A dedicated PDF decomposition pass for this campaign still remains ahead of the current definition-backed draft.",
            ...(seed.additionalReviewedAmbiguities ?? []),
          ]
        : [
            "This template currently leans on the existing SOP builder definition and source-map evidence more than on a campaign-specific PDF extraction pass.",
            "Permissions matrix still needs to be attached before operation-level publish rules can be finalized.",
            ...(seed.additionalImportedAmbiguities ?? []),
          ],
    sensitiveDataWarnings: [
      "No live sends, auth changes, uploads, or external writes are enabled from this template registry.",
    ],
    figmaSurfacesAffected: seed.figmaSurfacesAffected,
    suggestedRolloutOrder: seed.suggestedRolloutOrder,
  };
}

function buildDefinitionPhases(
  seed: DefinitionBackedTemplateSeed,
  definition: SopCampaignDefinition,
  integrationTriggerRules: readonly IntegrationTriggerRule[],
): readonly CampaignPhase[] {
  const integrationRuleIds = new Set(integrationTriggerRules.map((rule) => rule.id));

  return groupDefinitionStepsByPhase(definition).map((phaseSteps, index) => ({
    id: `${seed.slug}-phase-${index + 1}`,
    label: phaseSteps.label,
    sequence: index + 1,
    objective:
      phaseSteps.steps[0]?.purpose ??
      `${phaseSteps.label} keeps the campaign readable inside the owned route family.`,
    entryCriteria: uniqueStrings(phaseSteps.steps.map((step) => step.entryCriteria)),
    exitCriteria: uniqueStrings(phaseSteps.steps.map((step) => step.exitCriteria)),
    coachValidationRequired: phaseSteps.steps.some(
      (step) =>
        step.ownerRole === "coach" || step.supportingRoles.includes("coach"),
    ),
    steps: phaseSteps.steps.map((step) =>
      buildDefinitionCampaignStep(seed, definition, step, integrationRuleIds),
    ),
    sourceCertainty: phaseSteps.steps.some((step) => step.status === "mock_only")
      ? "repo_only_placeholder"
      : "inferred_from_source",
  }));
}

function buildDefinitionCampaignStep(
  seed: Pick<DefinitionBackedTemplateSeed, "slug" | "primaryExternalSystems">,
  definition: SopCampaignDefinition,
  step: SopStep,
  integrationRuleIds: ReadonlySet<string>,
) {
  const stepIntegrationIds = getStepIntegrationRules(step, seed)
    .map((rule) => rule.id)
    .filter((id) => integrationRuleIds.has(id));
  const relatedRoleRules = definition.roleActionRules.filter((rule) =>
    step.affectedRoles.includes(rule.role) || step.ownerRole === rule.role,
  );
  const relatedCompletionRules = definition.completionRules.filter(
    (rule) =>
      step.pointsEnabled ||
      step.required ||
      rule.label.toLowerCase().includes(step.phaseLabel.toLowerCase()),
  );
  const relatedEvidenceRules = definition.evidenceRules.filter(
    (rule) => step.evidenceRequired && normalizeRoute(rule.route) === normalizeRoute(step.linkedRoute),
  );
  const relatedApprovalRules = definition.approvalRules.filter(
    (rule) =>
      step.approvalRequired ||
      normalizeRoute(rule.route) === normalizeRoute(step.linkedRoute),
  );
  const relatedPointsRules = definition.pointsRules.filter(
    (rule) => step.pointsEnabled && rule.status !== "blocked",
  );
  const relatedKpiRules = definition.kpiRules.filter((rule) =>
    matchesKpiTag(step.kpiTag, rule.displayLabel, rule.metricKey),
  );

  return {
    id: step.id,
    label: step.title,
    sequence: step.stepNumber,
    objective: step.purpose,
    route: step.linkedRoute,
    whyItMatters: step.whyItMatters,
    completionSignal: step.completionSignal,
    dueTiming: step.dueTiming,
    ownerRoles: [step.ownerRole],
    supportingRoles: step.supportingRoles,
    roleActionRuleIds: uniqueStrings(relatedRoleRules.map((rule) => rule.id)),
    completionRuleIds: uniqueStrings(relatedCompletionRules.map((rule) => rule.id)),
    evidenceRuleIds: uniqueStrings(relatedEvidenceRules.map((rule) => rule.id)),
    approvalRuleIds: uniqueStrings(relatedApprovalRules.map((rule) => rule.id)),
    pointsRuleIds: uniqueStrings(relatedPointsRules.map((rule) => rule.id)),
    kpiRuleIds: uniqueStrings(relatedKpiRules.map((rule) => rule.id)),
    integrationTriggerRuleIds: uniqueStrings(stepIntegrationIds),
    riskRuleIds: [`${step.id}-risk`],
    expectedOutputs: uniqueStrings([step.completionSignal, step.exitCriteria]),
    sourceCertainty: certaintyFromRuleStatus(step.status),
  };
}

function groupDefinitionStepsByPhase(definition: SopCampaignDefinition) {
  const grouped = new Map<string, SopStep[]>();

  for (const step of definition.steps) {
    const current = grouped.get(step.phaseLabel) ?? [];
    current.push(step);
    grouped.set(step.phaseLabel, current);
  }

  return Array.from(grouped.entries()).map(([label, steps]) => ({
    label,
    steps,
  }));
}

function getStepIntegrationRules(
  step: SopStep,
  seed: Pick<DefinitionBackedTemplateSeed, "slug" | "primaryExternalSystems">,
): readonly IntegrationTriggerRule[] {
  const rules: IntegrationTriggerRule[] = [
    {
      id: `${step.id}-app-state`,
      eventName: `${seed.slug}.${step.id}.state_visible`,
      externalSystem: "mymedlife",
      mode: "internal_only",
      direction: "emit",
      outboxTopic: null,
      detail: step.completionSignal,
    },
  ];

  if (
    seed.primaryExternalSystems.includes("luma") &&
    step.linkedRoute.includes("/events")
  ) {
    rules.push({
      id: `${step.id}-luma-attendance`,
      eventName: "luma.attendance.import.mocked",
      externalSystem: "luma",
      mode: "disabled_pending_approval",
      direction: "consume",
      outboxTopic: `${seed.slug}.luma.attendance`,
      detail: "Luma-linked event posture remains visible, but attendance sync stays disabled.",
    });
  }

  if (
    seed.primaryExternalSystems.includes("shopify") &&
    step.linkedRoute.includes("/slt-prep")
  ) {
    rules.push({
      id: `${step.id}-shopify-payment`,
      eventName: "shopify.payment.status.mocked",
      externalSystem: "shopify",
      mode: "disabled_pending_approval",
      direction: "consume",
      outboxTopic: `${seed.slug}.shopify.payment`,
      detail: "Shopify payment posture stays mock-safe until the SLT live lane is approved.",
    });
  }

  if (
    seed.primaryExternalSystems.includes("hubspot") &&
    (step.approvalRequired || step.evidenceRequired)
  ) {
    rules.push({
      id: `${step.id}-hubspot-handoff`,
      eventName: "hubspot.lifecycle.handoff.mocked",
      externalSystem: "hubspot",
      mode: "disabled_pending_approval",
      direction: "emit",
      outboxTopic: `${seed.slug}.hubspot.handoff`,
      detail: "HubSpot handoff intent is typed here but blocked from live execution.",
    });
  }

  if (
    seed.primaryExternalSystems.includes("warehouse") &&
    (step.pointsEnabled || step.kpiTag.length > 0)
  ) {
    rules.push({
      id: `${step.id}-warehouse-export`,
      eventName: "warehouse.metric.export.mocked",
      externalSystem: "warehouse",
      mode: "disabled_pending_approval",
      direction: "emit",
      outboxTopic: `${seed.slug}.warehouse.metrics`,
      detail: "Warehouse and analytics exports remain disabled while the template is draft-only.",
    });
  }

  return rules;
}

function certaintyFromRuleStatus(
  status: SopRuleStatus,
): TemplateSourceCertainty {
  switch (status) {
    case "ready_readonly":
      return "inferred_from_source";
    case "mock_only":
      return "repo_only_placeholder";
    case "blocked":
      return "missing_source_confirmation";
  }
}

function matchesKpiTag(
  stepTag: string,
  displayLabel: string,
  metricKey: string,
) {
  const normalizedTag = normalizeToken(stepTag);
  const normalizedLabel = normalizeToken(displayLabel);
  const normalizedKey = normalizeToken(metricKey);

  return (
    normalizedLabel.includes(normalizedTag) ||
    normalizedKey.includes(normalizedTag) ||
    normalizedTag.includes(normalizedLabel)
  );
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeRoute(route: string) {
  return route.split("?")[0] ?? route;
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.filter((value) => value.length > 0)));
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
