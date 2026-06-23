import { campaignShells } from "@/data/mock-campaigns";
import type { CampaignShell } from "@/shared/types/campaigns";
import type {
  ApprovalRule,
  CommunicationTriggerRule,
  CompletionRule,
  EvidenceRule,
  KpiRule,
  PointsRule,
  RoleActionRule,
  SopAuditRecord,
  SopCampaignDefinition,
  SopIntegrationBoundary,
  SopLibraryStatus,
  SopPreviewScenario,
  SopRole,
  SopRuleStatus,
  SopScope,
  SopStep,
} from "@/shared/types/sop-builder";

export const sopBuilderTabs = [
  "steps",
  "role-matrix",
  "completion",
  "points-kpi",
  "comms",
  "preview",
  "version",
] as const;

export const sopCampaignDefinitions: readonly SopCampaignDefinition[] = campaignShells
  .map((shell) => {
    switch (shell.slug) {
      case "rush-month":
        return createRushMonthDefinition(shell);
      case "leadership-transition":
        return createLeadershipTransitionDefinition(shell);
      case "slt-promotion":
        return createSltPromotionDefinition(shell);
      default:
        return createGenericDefinition(shell);
    }
  })
  .filter((definition) => isCoreSopLibraryCampaign(definition.slug));

export function getSopCampaignDefinition(
  campaignSlug: string,
): SopCampaignDefinition | null {
  return (
    sopCampaignDefinitions.find((definition) => definition.slug === campaignSlug) ??
    null
  );
}

function createRushMonthDefinition(shell: CampaignShell): SopCampaignDefinition {
  const steps: readonly SopStep[] = [
    {
      id: "rush-visibility",
      stepNumber: 1,
      phaseLabel: "Planning",
      title: "Make MEDLIFE visible on campus",
      ownerRole: "committee_chair",
      affectedRoles: ["committee_chair", "student_member", "president"],
      status: "ready_readonly",
      linkedRoute: "/rush-month/dashboard",
      whyItMatters:
        "Rush Month works only when students see momentum, not just announcements.",
      purpose:
        "Turn early campaign planning into visible campus energy before the first student-facing push goes out.",
      supportingRoles: ["president", "coach"],
      entryCriteria:
        "Rush Month calendar is confirmed and the chapter has a weekly visibility plan.",
      exitCriteria:
        "Members can see the campaign phase, KPI strip, and the first concrete action inside the app.",
      dueTiming: "7 days before the first intro event",
      evidenceRequired: true,
      approvalRequired: true,
      pointsEnabled: false,
      required: true,
      kpiTag: "Chapter Health",
      communicationCount: 2,
      riskEscalation:
        "If visibility planning slips, intro-event attendance and member action confidence both drop.",
      completionSignal:
        "Week KPI strip shows live invite, RSVP, and follow-up targets for the chapter.",
    },
    {
      id: "rush-events",
      stepNumber: 2,
      phaseLabel: "Launch",
      title: "Turn interest into RSVP and event attendance",
      ownerRole: "student_member",
      affectedRoles: ["student_member", "committee_member", "committee_chair"],
      status: "ready_readonly",
      linkedRoute: "/rush-month/events",
      whyItMatters:
        "Students need a concrete event to join before they believe the chapter is active.",
      purpose:
        "Move a warm lead from passive awareness into a real RSVP and event attendance state.",
      supportingRoles: ["committee_chair"],
      entryCriteria:
        "At least one intro event is visible in the member event list with RSVP posture.",
      exitCriteria:
        "The student can RSVP and see what happens next after the event.",
      dueTiming: "During launch week",
      evidenceRequired: true,
      approvalRequired: false,
      pointsEnabled: true,
      required: true,
      kpiTag: "Attendance Rate",
      communicationCount: 4,
      riskEscalation:
        "If the event route feels vague, interest dies before students reach the action loop.",
      completionSignal:
        "Event detail shows RSVP posture and the next event-owned action.",
    },
    {
      id: "rush-actions",
      stepNumber: 3,
      phaseLabel: "Recruitment",
      title: "Start one concrete member action",
      ownerRole: "student_member",
      affectedRoles: ["student_member", "committee_member", "president"],
      status: "ready_readonly",
      linkedRoute: "/rush-month/actions/member-push",
      whyItMatters:
        "The loop becomes real when a member can move work from not started to in progress.",
      purpose:
        "Translate campaign belief into a visible member-owned action with clear evidence and review posture.",
      supportingRoles: ["committee_member", "president"],
      entryCriteria:
        "The member has at least one assigned Rush Month task and understands why it matters.",
      exitCriteria:
        "Action status moves to in progress and the proof expectations are visible before submission.",
      dueTiming: "Within 48 hours of joining the campaign loop",
      evidenceRequired: true,
      approvalRequired: false,
      pointsEnabled: true,
      required: false,
      kpiTag: "Recruitment Rate",
      communicationCount: 3,
      riskEscalation:
        "If this action screen is weak, the entire campaign collapses into generic interest instead of movement.",
      completionSignal:
        "Assignment detail exposes due date, status, why-it-matters context, and the guarded start path.",
    },
    {
      id: "rush-proof",
      stepNumber: 4,
      phaseLabel: "Onboarding",
      title: "Collect proof and member story context",
      ownerRole: "committee_member",
      affectedRoles: ["committee_member", "student_member", "department_staff"],
      status: "mock_only",
      linkedRoute: "/rush-month/evidence",
      whyItMatters:
        "Rush Month proof helps future students trust the chapter before they join.",
      purpose:
        "Make proof expectations readable before uploads exist, so students and reviewers understand the standard.",
      supportingRoles: ["department_staff"],
      entryCriteria:
        "The assignment or event step has produced a concrete student action to document.",
      exitCriteria:
        "Evidence route names accepted formats, privacy posture, and review expectations.",
      dueTiming: "Within 24 hours of the student action",
      evidenceRequired: true,
      approvalRequired: false,
      pointsEnabled: false,
      required: true,
      kpiTag: "Proof Quality",
      communicationCount: 5,
      riskEscalation:
        "If proof expectations are fuzzy, members either skip submission or share the wrong artifact.",
      completionSignal:
        "Evidence route names required proof formats and keeps upload/public-sharing blocked.",
    },
    {
      id: "rush-recognition",
      stepNumber: 5,
      phaseLabel: "Review",
      title: "Reflect points and chapter momentum",
      ownerRole: "president",
      affectedRoles: ["president", "student_member", "coach"],
      status: "ready_readonly",
      linkedRoute: "/rush-month/leaderboard",
      whyItMatters:
        "Recognition keeps small actions feeling visible and chapter-wide.",
      purpose:
        "Turn approved work into visible member recognition and chapter health context.",
      supportingRoles: ["coach", "department_staff"],
      entryCriteria:
        "The chapter has at least one completed action or approved proof signal to reflect back to members.",
      exitCriteria:
        "Leaderboard route shows recent wins and the chapter can see why those points matter.",
      dueTiming: "End of each campaign push",
      evidenceRequired: true,
      approvalRequired: true,
      pointsEnabled: true,
      required: true,
      kpiTag: "Campaign Health",
      communicationCount: 1,
      riskEscalation:
        "If recognition is detached from real actions, points become decorative instead of motivational.",
      completionSignal:
        "Leaderboard route shows member points, recent wins, and chapter impact context.",
    },
  ];

  return createDefinition(shell, {
    builderStatus: "review_ready",
    libraryStatus: "draft",
    versionLabel: "v2.1",
    versionState: "review_ready",
    versionSummary:
      "Draft workflow aligned to the current member, leader, coach, and admin review routes without enabling live sends.",
    lastEditedBy: "Jordan Park",
    lastPublishedDate: "Mar 1, 2026",
    builderSections: [
      "Planning",
      "Launch",
      "Recruitment",
      "Onboarding",
      "Review",
    ],
    steps,
    roleActionRules: [
      createRoleRule(
        "student_member",
        "own",
        "Start the next assigned action and submit proof metadata after the task is clearly in progress.",
        "/rush-month/actions",
        "ready_readonly",
        "No uploads, reminders, or external sends run from the student loop.",
      ),
      createRoleRule(
        "committee_chair",
        "committee",
        "Organize committee-owned events and make sure visibility work turns into actual RSVP momentum.",
        "/chapter?view=committees",
        "ready_readonly",
        "Committee leaders can inspect progress but campaign admin editing stays disabled.",
      ),
      createRoleRule(
        "president",
        "chapter",
        "Assign work, review stalled follow-up, and keep the chapter priority visible.",
        "/chapter?view=overview",
        "ready_readonly",
        "Leader assignment writes remain packeted and guarded until separately approved.",
      ),
      createRoleRule(
        "coach",
        "assigned_coach_portfolio",
        "Watch risk posture and coach the chapter when invite energy is not translating into action.",
        "/coach?view=chapters",
        "ready_readonly",
        "Coach note writes and escalation packets remain disabled.",
      ),
      createRoleRule(
        "department_staff",
        "department",
        "Review proof, analytics, and chapter health without becoming the source of truth for chapter work.",
        "/staff?view=chapters",
        "ready_readonly",
        "HQ keeps oversight visibility but does not trigger external systems from this builder.",
      ),
    ],
    completionRules: [
      createCompletionRule(
        "rush-action-started",
        "Assignment can move to in progress",
        "ready_readonly",
        "Member can open the action detail, confirm accuracy, and start the action through the narrow guarded path.",
        "Assignment readback, internal event, integration event, and audit row all appear with zero outbox sends.",
      ),
      createCompletionRule(
        "rush-proof-ready",
        "Proof requirements are visible before submission",
        "mock_only",
        "Students can see what evidence is needed and why it matters before uploads exist.",
        "Evidence queue keeps uploads blocked and uses metadata-first review language.",
      ),
      createCompletionRule(
        "rush-leaderboard-context",
        "Points surface stays in the same loop",
        "ready_readonly",
        "Leaderboard reflects the same campaign and recent approved wins instead of drifting into a generic dead end.",
        "Member can move between home, actions, events, and points without losing route ownership.",
      ),
    ],
    previewScenarios: [
      createPreviewScenario(
        "rush-member-loop",
        "Member mobile loop",
        "student_member",
        "/rush-month/dashboard",
        [
          "campaign KPI strip",
          "next action",
          "events list",
          "leaderboard context",
        ],
        "A student can keep moving through the loop without touching a placeholder screen.",
      ),
      createPreviewScenario(
        "rush-leader-review",
        "Leader command-center handoff",
        "president",
        "/chapter?view=members",
        [
          "member pipeline",
          "assignment review",
          "quick actions",
          "proof follow-up",
        ],
        "Leader handoff stays inside the chapter-owned shell and does not borrow the student chrome.",
      ),
    ],
  });
}

function createLeadershipTransitionDefinition(
  shell: CampaignShell,
): SopCampaignDefinition {
  return createDefinition(shell, {
    builderStatus: "review_ready",
    libraryStatus: "draft",
    versionLabel: "v1.0",
    versionState: "review_ready",
    versionSummary:
      "Adds succession, role coverage, and coach handoff logic to the packet-backed admin library.",
    lastEditedBy: "Chris Morgan",
    lastPublishedDate: null,
    builderSections: ["Handoff", "Coach gate", "Incoming onboarding"],
    steps: [
      createStep(
        "transition-successors",
        "Handoff",
        "Name the next officer and chair owners",
        "president",
        "ready_readonly",
        "/chapter?view=succession",
        "A chapter cannot survive leadership turnover if successors are vague or unnamed.",
        "Succession view names who owns the next lane and what role still lacks a successor.",
      ),
      createStep(
        "transition-notes",
        "Handoff",
        "Package role notes and open risks",
        "eboard_officer",
        "mock_only",
        "/chapter?view=member_profile",
        "Leaders need a boring, reliable record of what the next person inherits.",
        "Role handoff notes stay readable even before admin editing is live.",
      ),
      createStep(
        "transition-coach-review",
        "Coach gate",
        "Coach confirms the chapter is ready for the handoff",
        "coach",
        "ready_readonly",
        "/coach?view=support_notes#support-notes",
        "Coach review keeps a risky leadership transition from getting mislabeled as complete.",
        "Coach route shows the next check-in posture without saving notes yet.",
      ),
    ],
  });
}

function createSltPromotionDefinition(
  shell: CampaignShell,
): SopCampaignDefinition {
  return createDefinition(shell, {
    builderStatus: "review_ready",
    libraryStatus: "scheduled",
    versionLabel: "v1.5",
    versionState: "review_ready",
    versionSummary:
      "Connects campaign storytelling to the traveler and staff SLT Prep surfaces while keeping Shopify and live attendance disabled.",
    lastEditedBy: "Alex Kim",
    lastPublishedDate: "Nov 10, 2025",
    builderSections: ["Belief", "Follow-up", "Staff review"],
    steps: [
      createStep(
        "slt-interest",
        "Belief",
        "Show proof that SLT is possible and worth exploring",
        "student_member",
        "ready_readonly",
        "/campaigns/slt-promotion",
        "Students need belief-building proof before they are willing to ask questions about an SLT.",
        "Campaign detail shows the proof use and next student action clearly.",
      ),
      createStep(
        "slt-followup",
        "Follow-up",
        "Move interested students into concrete prep next steps",
        "committee_member",
        "mock_only",
        "/slt-prep",
        "Interest matters only if students can move into forms, meetings, and readiness steps.",
        "Traveler route opens with countdown, checklist, and next step context.",
      ),
      createStep(
        "slt-staff",
        "Staff review",
        "Flag readiness risk before travel planning gets messy",
        "department_staff",
        "ready_readonly",
        "/slt-prep/staff",
        "Staff needs one focused readiness lane before they approve broader automation or payments.",
        "Staff dashboard shows traveler risk filters and mock-safe bulk actions.",
      ),
    ],
  });
}

function createGenericDefinition(shell: CampaignShell): SopCampaignDefinition {
  return createDefinition(shell, {});
}

function createDefinition(
  shell: CampaignShell,
  overrides: Partial<{
    builderStatus: SopCampaignDefinition["builderStatus"];
    libraryStatus: SopCampaignDefinition["libraryStatus"];
    versionLabel: string;
    versionState: SopCampaignDefinition["version"]["state"];
    versionSummary: string;
    lastEditedBy: string;
    lastPublishedDate: string | null;
    builderSections: readonly string[];
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
  }>,
): SopCampaignDefinition {
  const defaultRoute = getDefaultOperationalRoute(shell.slug);

  return {
    slug: shell.slug,
    name: shell.name,
    shellStatus: shell.status,
    builderStatus:
      overrides.builderStatus ??
      (shell.status === "active" ? "review_ready" : "draft"),
    libraryStatus: overrides.libraryStatus ?? getDefaultLibraryStatus(shell.slug),
    summary: shell.summary,
    studentPromise: shell.studentPromise,
    operatingRhythm: shell.operatingRhythm,
    lastEditedBy: overrides.lastEditedBy ?? getDefaultLastEditedBy(shell.slug),
    lastPublishedDate:
      overrides.lastPublishedDate ?? getDefaultLastPublishedDate(shell.slug),
    builderSections:
      overrides.builderSections ?? getDefaultBuilderSections(shell.slug),
    builderSettings: ["Campaign Config"],
    version: {
      currentLabel: overrides.versionLabel ?? getDefaultVersionLabel(shell.slug),
      state: overrides.versionState ?? "draft",
      updatedLabel: "June 22, 2026",
      summary:
        overrides.versionSummary ??
        "Structured local draft shaped from the send package, Figma route map, and current mock-safe product surfaces.",
      history: [
        {
          label:
            shell.slug === "rush-month"
              ? "v3.2 Live"
              : shell.slug === "chapter-engagement"
                ? "v4.0 Live"
                : shell.slug === "planning-goal-setting"
                  ? "v3.2 Live"
                  : "v0.1 packet-aligned draft",
          state:
            shell.slug === "rush-month" ||
            shell.slug === "chapter-engagement" ||
            shell.slug === "planning-goal-setting"
              ? "approved_template"
              : "draft",
          updatedLabel:
            getDefaultLastPublishedDate(shell.slug) ?? "June 22, 2026",
          summary:
            shell.slug === "rush-month"
              ? "Current live template preserved for comparison against the open draft."
              : "Initial backend workflow shape lifted from the full send package and current route inventory.",
        },
        {
          label:
            shell.slug === "rush-month" ? "v3.1" : "v0.0 shell import",
          state: "draft",
          updatedLabel: "June 21, 2026",
          summary:
            shell.slug === "rush-month"
              ? "Earlier draft preserved to show prior campaign sequencing and rule posture."
              : "Campaign shell summary, KPIs, and integration posture imported from the read-only catalog.",
        },
        ...(shell.slug === "rush-month"
          ? [
              {
                label: "v3.0",
                state: "draft" as const,
                updatedLabel: "February 15, 2026",
                summary:
                  "Legacy Rush Month sequence kept for change-log comparison inside the builder.",
              },
            ]
          : []),
      ],
    },
    steps:
      overrides.steps ??
      [
        createStep(
          `${shell.slug}-launch`,
          "Phase 1",
          `Open the ${shell.name} campaign lane`,
          "committee_chair",
          "ready_readonly",
          defaultRoute,
          shell.studentPromise,
          `The route should expose the first believable next step for ${shell.name}.`,
        ),
        createStep(
          `${shell.slug}-assign`,
          "Phase 2",
          "Assign work to the right role",
          "president",
          "mock_only",
          "/chapter?view=members",
          shell.operatingRhythm,
          "Leader review route keeps assignment intent visible before browser writes are approved.",
        ),
        createStep(
          `${shell.slug}-coach`,
          "Phase 3",
          "Coach reviews what still needs intervention",
          "coach",
          "ready_readonly",
          "/coach?view=chapters",
          shell.coachFocus,
          "Coach route calls out what still blocks the chapter from healthy execution.",
        ),
      ],
    roleActionRules:
      overrides.roleActionRules ??
      [
        createRoleRule(
          "student_member",
          "own",
          "See the current campaign story and the next small step that matters.",
          defaultRoute,
          "ready_readonly",
          "Students do not edit campaign configuration from this lane.",
        ),
        createRoleRule(
          "committee_chair",
          "committee",
          "Turn campaign intent into committee-owned follow-through.",
          "/chapter?view=committees",
          "ready_readonly",
          "Committee configuration stays read-only until admin tooling is approved.",
        ),
        createRoleRule(
          "president",
          "chapter",
          "Keep chapter priorities, member follow-up, and cross-committee visibility aligned.",
          "/chapter?view=overview",
          "ready_readonly",
          "Leader writes remain guarded and mock-safe unless explicitly opened.",
        ),
        createRoleRule(
          "coach",
          "assigned_coach_portfolio",
          "Watch for stalled behavior and coach the chapter through the next bottleneck.",
          "/coach?view=chapters",
          "ready_readonly",
          "Coach notes and external escalations remain disabled.",
        ),
      ],
    completionRules:
      overrides.completionRules ??
      [
        createCompletionRule(
          `${shell.slug}-readiness`,
          "Surface has a clear first next step",
          "ready_readonly",
          "The owned route names what this campaign wants the user to do next.",
          "Route-state parity is visible without generic filler content.",
        ),
        createCompletionRule(
          `${shell.slug}-guardrails`,
          "External systems stay blocked",
          "ready_readonly",
          "The campaign can reference systems like HubSpot or Luma without becoming dependent on them.",
          "No live send, upload, or sync is triggered from the route family.",
        ),
      ],
    evidenceRules:
      overrides.evidenceRules ??
      [
        createEvidenceRule(
          `${shell.slug}-story-proof`,
          "Story or outcome proof stays metadata-first",
          ["testimonial_text", "bridge_video", "event_photo"],
          "Uploads and publishing stay disabled until storage and moderation approval is explicit.",
          "mock_only",
          "/proof-library/upload",
        ),
      ],
    approvalRules:
      overrides.approvalRules ??
      [
        createApprovalRule(
          `${shell.slug}-leader-review`,
          "Leader review confirms chapter completion",
          "president",
          "Leader can approve or request changes later, but local parity work keeps the control packeted.",
          "mock_only",
          "/rush-month/review",
        ),
        createApprovalRule(
          `${shell.slug}-hq-review`,
          "HQ decides whether proof can leave the chapter context",
          "department_staff",
          "HQ sharing posture is visible, but public publishing and outbound sends remain blocked.",
          "mock_only",
          "/staff?view=proof_ugc",
        ),
      ],
    pointsRules:
      overrides.pointsRules ??
      shell.primaryKpis.slice(0, 3).map((kpi, index) => ({
        id: `${shell.slug}-points-${kpi}`,
        label: `Reward visible progress on ${formatToken(kpi)}`,
        points: 15 + index * 5,
        trigger: `Visible ${formatToken(kpi)} signal is recorded inside the owned route family.`,
        status: index === 0 ? "ready_readonly" : "mock_only",
      })),
    kpiRules:
      overrides.kpiRules ??
      shell.primaryKpis.map((kpi) => ({
        id: `${shell.slug}-kpi-${kpi}`,
        metricKey: kpi,
        displayLabel: formatToken(kpi),
        sourceOfTruth: "Supabase-backed event and ledger tables later; mock-safe route state today.",
        status: "ready_readonly",
      })),
    communicationRules:
      overrides.communicationRules ??
      [
        createCommunicationRule(
          `${shell.slug}-internal`,
          "Keep internal reminders visible as future automation intent",
          "chapter members and leaders",
          "internal_only",
          "Use route copy and status pills to show what a future n8n or HubSpot reminder would do.",
        ),
        createCommunicationRule(
          `${shell.slug}-external`,
          "Block external sends until the workflow is approved",
          "students and staff",
          "disabled",
          "No email, SMS, AI action, HubSpot write, or Luma mutation is opened from the SOP builder.",
        ),
      ],
    previewScenarios:
      overrides.previewScenarios ??
      [
        createPreviewScenario(
          `${shell.slug}-student`,
          "Student-facing campaign state",
          "student_member",
          defaultRoute,
          ["entry route", "next action", "campaign context"],
          "Students can tell what the campaign is for and what they should do next.",
        ),
        createPreviewScenario(
          `${shell.slug}-staff`,
          "HQ review state",
          "department_staff",
          "/staff?view=campaigns",
          ["status pills", "proof posture", "risk review"],
          "Staff can inspect the campaign without hijacking chapter-owned work.",
        ),
      ],
    auditRecords:
      overrides.auditRecords ??
      [
        createAuditRecord(
          `${shell.slug}-audit-entry`,
          "campaign_step_reviewed",
          "audit_logs",
          "/admin/audit-log",
          "When live writes arrive later, each step promotion should leave actor, target, and reason evidence.",
        ),
      ],
    integrationBoundaries:
      overrides.integrationBoundaries ??
      [
        createBoundary("HubSpot", "disabled", "CRM lifecycle remains outside the app until approved."),
        createBoundary("Luma", "disabled", "Event registration and attendance stay read-only or mocked."),
        createBoundary("Shopify", "disabled", "SLT payment state stays mocked until explicit approval."),
        createBoundary("n8n", "disabled", "Outbox consumers stay off and never become source of truth."),
        createBoundary(
          "warehouse / Power BI",
          "disabled",
          "Analytics export remains off until data contracts and freshness QA are approved.",
        ),
      ],
  };
}

function createRoleRule(
  role: SopRole,
  scope: SopScope,
  actionSummary: string,
  route: string,
  status: SopRuleStatus,
  guardrail: string,
): RoleActionRule {
  return {
    id: `${role}-${scope}-${route}`,
    role,
    scope,
    actionSummary,
    route,
    status,
    guardrail,
  };
}

function createCompletionRule(
  id: string,
  label: string,
  status: SopRuleStatus,
  successSignal: string,
  evidenceNeeded: string,
): CompletionRule {
  return {
    id,
    label,
    status,
    successSignal,
    evidenceNeeded,
  };
}

function createEvidenceRule(
  id: string,
  label: string,
  acceptedFormats: readonly string[],
  storagePosture: string,
  status: SopRuleStatus,
  route: string,
): EvidenceRule {
  return {
    id,
    label,
    acceptedFormats,
    storagePosture,
    status,
    route,
  };
}

function createApprovalRule(
  id: string,
  label: string,
  reviewerRole: SopRole,
  outcome: string,
  status: SopRuleStatus,
  route: string,
): ApprovalRule {
  return {
    id,
    label,
    reviewerRole,
    outcome,
    status,
    route,
  };
}

function createCommunicationRule(
  id: string,
  trigger: string,
  audience: string,
  deliveryMode: CommunicationTriggerRule["deliveryMode"],
  detail: string,
): CommunicationTriggerRule {
  return {
    id,
    trigger,
    audience,
    deliveryMode,
    detail,
  };
}

function createPreviewScenario(
  id: string,
  title: string,
  primaryRole: SopRole,
  route: string,
  visibleStates: readonly string[],
  successSignal: string,
): SopPreviewScenario {
  return {
    id,
    title,
    primaryRole,
    route,
    visibleStates,
    successSignal,
  };
}

function createAuditRecord(
  id: string,
  eventType: string,
  targetTable: string,
  route: string,
  auditExpectation: string,
): SopAuditRecord {
  return {
    id,
    eventType,
    targetTable,
    route,
    auditExpectation,
  };
}

function createBoundary(
  system: string,
  mode: SopIntegrationBoundary["mode"],
  note: string,
): SopIntegrationBoundary {
  return {
    system,
    mode,
    note,
  };
}

function createStep(
  id: string,
  phaseLabel: string,
  title: string,
  ownerRole: SopRole,
  status: SopRuleStatus,
  linkedRoute: string,
  whyItMatters: string,
  completionSignal: string,
): SopStep {
  return {
    id,
    stepNumber: inferDefaultStepNumber(id),
    phaseLabel,
    title,
    ownerRole,
    affectedRoles: [ownerRole],
    status,
    linkedRoute,
    whyItMatters,
    purpose: whyItMatters,
    supportingRoles: [],
    entryCriteria: "Current route and campaign context are visible.",
    exitCriteria: completionSignal,
    dueTiming: "Current campaign window",
    evidenceRequired: true,
    approvalRequired: false,
    pointsEnabled: status !== "blocked",
    required: true,
    kpiTag: "Chapter Health",
    communicationCount: 1,
    riskEscalation:
      "If this step stalls, the campaign loses visible operating momentum.",
    completionSignal,
  };
}

function inferDefaultStepNumber(id: string) {
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : 1;
}

function isCoreSopLibraryCampaign(slug: string) {
  return [
    "planning-goal-setting",
    "rush-month",
    "chapter-engagement",
    "slt-promotion",
    "moving-mountains",
    "leadership-transition",
  ].includes(slug);
}

function getDefaultLibraryStatus(slug: string): SopLibraryStatus {
  switch (slug) {
    case "planning-goal-setting":
    case "chapter-engagement":
      return "live";
    case "slt-promotion":
      return "scheduled";
    case "moving-mountains":
      return "archived";
    default:
      return "draft";
  }
}

function getDefaultLastEditedBy(slug: string) {
  switch (slug) {
    case "planning-goal-setting":
      return "Maya Chen";
    case "rush-month":
      return "Jordan Park";
    case "chapter-engagement":
      return "Sam Rivera";
    case "slt-promotion":
      return "Alex Kim";
    case "moving-mountains":
      return "Taylor Brooks";
    case "leadership-transition":
      return "Chris Morgan";
    default:
      return "MEDLIFE Staff";
  }
}

function getDefaultVersionLabel(slug: string) {
  switch (slug) {
    case "planning-goal-setting":
      return "v3.2";
    case "chapter-engagement":
      return "v4.0";
    case "slt-promotion":
      return "v1.5";
    case "moving-mountains":
      return "v2.0";
    case "leadership-transition":
      return "v1.0";
    default:
      return "v0.1 packet-aligned draft";
  }
}

function getDefaultLastPublishedDate(slug: string) {
  switch (slug) {
    case "planning-goal-setting":
      return "May 12, 2026";
    case "rush-month":
      return "Mar 1, 2026";
    case "chapter-engagement":
      return "Apr 20, 2026";
    case "slt-promotion":
      return "Nov 10, 2025";
    case "moving-mountains":
      return "Aug 15, 2025";
    default:
      return null;
  }
}

function getDefaultBuilderSections(slug: string) {
  switch (slug) {
    case "planning-goal-setting":
      return ["Planning", "Goal setting", "Execution", "Review"];
    case "chapter-engagement":
      return ["Attendance", "Connection", "Action", "Follow-up"];
    case "moving-mountains":
      return ["Partner setup", "Promotion", "Service day", "Wrap-up"];
    default:
      return ["Planning", "Launch", "Review"];
  }
}

function getDefaultOperationalRoute(campaignSlug: string): string {
  switch (campaignSlug) {
    case "rush-month":
      return "/rush-month/dashboard";
    case "slt-promotion":
      return "/slt-prep";
    default:
      return `/campaigns/${campaignSlug}`;
  }
}

function formatToken(token: string): string {
  return token.replaceAll("_", " ");
}
