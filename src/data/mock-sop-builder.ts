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
  SopFeatureFlagBinding,
  SopHandoffRule,
  SopIntegrationBoundary,
  SopLibraryStatus,
  SopOperationPermission,
  SopPhase,
  SopPreviewScenario,
  SopRole,
  SopRuleStatus,
  SopScope,
  SopSourceTrace,
  SopStep,
  SopValidator,
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
      case "chapter-engagement":
        return createChapterEngagementDefinition(shell);
      case "moving-mountains":
        return createMovingMountainsDefinition(shell);
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
      kpiTag: "Leads Captured",
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
      kpiTag: "Intro GBM RSVPs",
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
      kpiTag: "Follow-ups Done",
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
      kpiTag: "Follow-ups Done",
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
      kpiTag: "New Members",
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
    kpiRules: [
      {
        id: "rush-month-kpi-leads-captured",
        metricKey: "leads_captured",
        displayLabel: "Leads Captured",
        sourceOfTruth: "Structured Rush Month KPI events in the mock-safe ledger.",
        targetValue: 80,
        status: "ready_readonly",
      },
      {
        id: "rush-month-kpi-intro-gbm-rsvps",
        metricKey: "intro_gbm_rsvps",
        displayLabel: "Intro GBM RSVPs",
        sourceOfTruth: "Structured Rush Month KPI events in the mock-safe ledger.",
        targetValue: 50,
        status: "ready_readonly",
      },
      {
        id: "rush-month-kpi-followups-done",
        metricKey: "followups_completed",
        displayLabel: "Follow-ups Done",
        sourceOfTruth: "Structured Rush Month KPI events in the mock-safe ledger.",
        targetValue: 47,
        status: "ready_readonly",
      },
      {
        id: "rush-month-kpi-new-members",
        metricKey: "new_members",
        displayLabel: "New Members",
        sourceOfTruth: "Structured Rush Month KPI events in the mock-safe ledger.",
        targetValue: 25,
        status: "ready_readonly",
      },
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
      "Adds successor mapping, role notes, committee chair handoff, coach validation, and risk closeout to the packet-backed admin library.",
    lastEditedBy: "Chris Morgan",
    lastPublishedDate: null,
    builderSections: [
      "Successor map",
      "Role notes",
      "Committee chairs",
      "Coach handoff",
      "Risk closeout",
    ],
    roleActionRules: [
      createRoleRule(
        "president",
        "chapter",
        "Map successor coverage, keep open risks visible, and close the handoff loop without relying on informal memory.",
        "/chapter?view=succession",
        "ready_readonly",
        "Leadership transition remains reviewable here without opening live role or membership writes.",
      ),
      createRoleRule(
        "eboard_officer",
        "chapter",
        "Package role notes, recurring responsibilities, and open decisions into a handoff another leader can actually use.",
        "/chapter?view=member_profile",
        "mock_only",
        "Role-note editing posture stays mock-safe while the workflow engine remains read-first.",
      ),
      createRoleRule(
        "committee_chair",
        "committee",
        "Confirm committee chair ownership, next actions, and proof posture before the new team restarts committee work.",
        "/chapter?view=committees",
        "ready_readonly",
        "Committee handoff remains visible without enabling live assignment, membership, or reminder writes.",
      ),
      createRoleRule(
        "coach",
        "assigned_coach_portfolio",
        "Validate whether the chapter can advance, should hold, or needs intervention before the transition is treated as complete.",
        "/coach?view=support_notes#support-notes",
        "ready_readonly",
        "Coach review remains mock-safe and does not open CRM, notification, or automation writes.",
      ),
    ],
    steps: [
      {
        ...createStep(
          "leadership-transition-successors",
          "Successor map",
          "Map successor coverage",
          "president",
          "ready_readonly",
          "/chapter?view=succession",
          "A chapter cannot survive leadership turnover if successors are vague, unnamed, or disconnected from the work they inherit.",
          "Succession view names confirmed successors, open role gaps, and the first responsibility each incoming leader should understand.",
        ),
        stepNumber: 1,
        affectedRoles: ["president", "vice_president", "eboard_officer"],
        supportingRoles: ["vice_president"],
        entryCriteria:
          "Outgoing leaders can name the current officer roster and identify where successor certainty is still weak.",
        exitCriteria:
          "Every critical chapter role shows a named successor or a visible risk note with the current owner attached.",
        dueTiming: "As soon as the next leadership slate is forming",
        evidenceRequired: true,
        approvalRequired: false,
        pointsEnabled: false,
        required: true,
        kpiTag: "successors_confirmed",
        communicationCount: 1,
        riskEscalation:
          "If successor coverage is fuzzy, the chapter starts the handoff with hidden risk instead of a believable continuity plan.",
      },
      {
        ...createStep(
          "leadership-transition-role-notes",
          "Role notes",
          "Write role handoff notes",
          "eboard_officer",
          "mock_only",
          "/chapter?view=member_profile",
          "Incoming leaders need a boring, reliable record of first actions, recurring work, relationships, and open decisions.",
          "Role notes stay readable in the app so the next team does not have to rebuild chapter memory from scratch.",
        ),
        stepNumber: 2,
        affectedRoles: ["eboard_officer", "president", "committee_chair"],
        supportingRoles: ["president"],
        entryCriteria:
          "Named successors exist for the core chapter roles or the remaining gaps are explicitly visible.",
        exitCriteria:
          "Each outgoing role has a handoff note with first actions, recurring responsibilities, and open decisions.",
        dueTiming: "Immediately after successor coverage is visible",
        evidenceRequired: true,
        approvalRequired: false,
        pointsEnabled: true,
        required: true,
        kpiTag: "handoff_notes",
        communicationCount: 1,
        riskEscalation:
          "If role notes stay informal, the chapter loses practical knowledge even when successors are already named.",
      },
      {
        ...createStep(
          "leadership-transition-committee-chairs",
          "Committee chairs",
          "Confirm committee chair handoff",
          "committee_chair",
          "ready_readonly",
          "/chapter?view=committees",
          "Committee work stalls when new chairs inherit vague ownership, missing proof standards, or no next action at all.",
          "Committee handoff shows who owns each committee, what their first action is, and where questions should go.",
        ),
        stepNumber: 3,
        affectedRoles: ["committee_chair", "committee_member", "president"],
        supportingRoles: ["president"],
        entryCriteria:
          "Officer successor coverage and role notes are visible enough to hand committee lanes to the next owners.",
        exitCriteria:
          "Each committee chair has a named next owner, first action, and handoff posture before committee work restarts.",
        dueTiming: "Before the next committee cycle begins",
        evidenceRequired: true,
        approvalRequired: false,
        pointsEnabled: true,
        required: true,
        kpiTag: "roles_handed_off",
        communicationCount: 1,
        riskEscalation:
          "If committee ownership is vague, the chapter enters the next term with silent operational gaps even when officer roles look covered.",
      },
      {
        ...createStep(
          "leadership-transition-coach-review",
          "Coach handoff",
          "Prepare coach validation",
          "coach",
          "ready_readonly",
          "/coach?view=support_notes#support-notes",
          "Coach review keeps a risky transition from being mislabeled as complete just because the chapter filled a slate.",
          "Coach route shows whether the chapter can advance, should hold, or needs intervention before the new team takes over.",
        ),
        stepNumber: 4,
        affectedRoles: ["coach", "president", "eboard_officer"],
        supportingRoles: ["president"],
        entryCriteria:
          "Successor coverage, role notes, and committee chair handoff posture are visible enough for an external review.",
        exitCriteria:
          "Coach review clearly records whether the transition is ready, should hold, or needs intervention before closeout.",
        dueTiming: "After successor, role-note, and committee-chair review are visible together",
        evidenceRequired: true,
        approvalRequired: true,
        pointsEnabled: true,
        required: true,
        kpiTag: "coach_validations",
        communicationCount: 1,
        riskEscalation:
          "If the coach gate is shallow, the chapter can carry visible handoff work forward while still missing the real blockers.",
      },
      {
        ...createStep(
          "leadership-transition-risk-closeout",
          "Risk closeout",
          "Close transition risks",
          "president",
          "ready_readonly",
          "/campaigns/leadership-transition",
          "A transition is not done when people feel optimistic; it is done when open risks, gaps, and support needs are explicitly closed or owned.",
          "Campaign detail closes the loop with named risks, support posture, and a believable readiness signal for the incoming team.",
        ),
        stepNumber: 5,
        affectedRoles: ["president", "vice_president", "coach"],
        supportingRoles: ["coach"],
        entryCriteria:
          "Coach validation is visible and the chapter has a concrete list of remaining risks or support needs.",
        exitCriteria:
          "Open transition risks, support owners, and final readiness posture are visible before the chapter treats the handoff as complete.",
        dueTiming: "Before the incoming team fully owns the next chapter cycle",
        evidenceRequired: true,
        approvalRequired: true,
        pointsEnabled: false,
        required: true,
        kpiTag: "open_risks",
        communicationCount: 1,
        riskEscalation:
          "If risk closeout stays implicit, the chapter declares a healthy transition while known gaps are still floating between teams.",
      },
    ],
  });
}

function createChapterEngagementDefinition(
  shell: CampaignShell,
): SopCampaignDefinition {
  return createDefinition(shell, {
    builderStatus: "review_ready",
    libraryStatus: "live",
    versionLabel: "v4.0",
    versionState: "review_ready",
    versionSummary:
      "Turns Chapter Engagement into a fuller recurring workflow with participation, event follow-through, recognition, retention, and coach review inside the builder backbone.",
    lastEditedBy: "Sam Rivera",
    lastPublishedDate: "Apr 20, 2026",
    builderSections: [
      "Participation",
      "Event follow-through",
      "Recognition",
      "Retention",
      "Coach review",
    ],
    steps: [
      {
        ...createStep(
          "chapter-engagement-pulse",
          "Participation pulse",
          "Find this week's participation pulse",
          "eboard_officer",
          "ready_readonly",
          "/campaigns/chapter-engagement",
          "Recurring chapter energy starts when leaders define the simplest believable participation path for this week.",
          "Members can see one clear way to participate this week without needing leader context.",
        ),
        stepNumber: 1,
        affectedRoles: ["eboard_officer", "committee_chair", "student_member"],
        supportingRoles: ["committee_chair", "president"],
        entryCriteria:
          "The campaign detail route is readable and the chapter can name one concrete participation path.",
        exitCriteria:
          "The chapter has one visible participation lane and invite posture for the current week.",
        dueTiming: "Start of each weekly engagement loop",
        evidenceRequired: true,
        approvalRequired: false,
        pointsEnabled: false,
        required: true,
        kpiTag: "active_members",
        communicationCount: 2,
        riskEscalation:
          "If the participation pulse is vague, members drift because there is no obvious next step to join.",
      },
      {
        ...createStep(
          "chapter-engagement-events",
          "Event momentum",
          "Turn events into follow-up",
          "committee_chair",
          "ready_readonly",
          "/campaigns/chapter-engagement",
          "Attendance matters only if events lead to a next action, reflection, or follow-up moment.",
          "Event posture names the host, next action, and follow-up plan before the chapter calls the event done.",
        ),
        stepNumber: 2,
        affectedRoles: ["committee_chair", "committee_member", "student_member"],
        supportingRoles: ["eboard_officer"],
        entryCriteria:
          "The chapter has at least one current event or gathering worth turning into follow-through.",
        exitCriteria:
          "Event momentum stays readable through host ownership, feedback posture, and the next action after attendance.",
        dueTiming: "Before and during each engagement event",
        evidenceRequired: true,
        approvalRequired: false,
        pointsEnabled: true,
        required: true,
        kpiTag: "event_attendance",
        communicationCount: 3,
        riskEscalation:
          "If events end as attendance only, members do not build momentum or move into deeper chapter participation.",
      },
      {
        ...createStep(
          "chapter-engagement-recognition",
          "Recognition loop",
          "Recognize useful action",
          "committee_member",
          "mock_only",
          "/campaigns/chapter-engagement",
          "Recognition keeps helpful behavior visible so members can feel progress instead of invisible labor.",
          "Recognition posture links visible actions to points, stories, and chapter goals without turning points into decorative noise.",
        ),
        stepNumber: 3,
        affectedRoles: ["committee_member", "student_member", "president"],
        supportingRoles: ["committee_chair", "president"],
        entryCriteria:
          "The chapter can name at least one helpful student action or event contribution worth surfacing.",
        exitCriteria:
          "Recognition lane explains what counts, why it matters, and how it connects back to chapter action.",
        dueTiming: "Within the same weekly loop as visible student action",
        evidenceRequired: true,
        approvalRequired: false,
        pointsEnabled: true,
        required: true,
        kpiTag: "points_awarded",
        communicationCount: 2,
        riskEscalation:
          "If recognition is disconnected from real action, the chapter sees points but not the behavior they are supposed to reinforce.",
      },
      {
        ...createStep(
          "chapter-engagement-retention",
          "Retention follow-up",
          "Follow up before members disappear",
          "president",
          "ready_readonly",
          "/campaigns/chapter-engagement",
          "Retention is a workflow, not an afterthought, when quiet members get a named owner and a clear re-entry action.",
          "Leaders can spot drifting members, assign follow-up owners, and keep reconnection posture visible before anyone disappears silently.",
        ),
        stepNumber: 4,
        affectedRoles: ["president", "eboard_officer", "committee_member"],
        supportingRoles: ["coach"],
        entryCriteria:
          "The chapter can identify members who attended less, stopped responding, or never moved into action.",
        exitCriteria:
          "Retention follow-up names the member risk, the owner, and the next action that could help the person reconnect.",
        dueTiming: "At the end of each engagement cycle",
        evidenceRequired: true,
        approvalRequired: true,
        pointsEnabled: false,
        required: true,
        kpiTag: "retention_signals",
        communicationCount: 2,
        riskEscalation:
          "If quiet members are not surfaced with owners and next steps, engagement falls faster than the chapter realizes.",
      },
      {
        ...createStep(
          "chapter-engagement-coach-review",
          "Coach engagement review",
          "Prepare engagement review",
          "coach",
          "ready_readonly",
          "/coach?view=chapters",
          "Coach review helps the chapter interpret participation, recognition, and retention together before a weak loop repeats.",
          "Coach lane can see whether engagement is building, stalling, or needs intervention without opening live notes or external sends.",
        ),
        stepNumber: 5,
        affectedRoles: ["coach", "president", "department_staff"],
        supportingRoles: ["president", "department_staff"],
        entryCriteria:
          "Participation, event follow-through, recognition, and retention posture are visible enough to review together.",
        exitCriteria:
          "Coach review captures whether the chapter should keep going, intervene, or change the next engagement loop.",
        dueTiming: "End of the current engagement loop",
        evidenceRequired: true,
        approvalRequired: true,
        pointsEnabled: false,
        required: true,
        kpiTag: "retention_signals",
        communicationCount: 1,
        riskEscalation:
          "If the coach review is shallow, the chapter can repeat a weak participation loop without understanding what actually stalled.",
      },
    ],
  });
}

function createMovingMountainsDefinition(
  shell: CampaignShell,
): SopCampaignDefinition {
  return createDefinition(shell, {
    builderStatus: "review_ready",
    libraryStatus: "archived",
    versionLabel: "v2.0",
    versionState: "review_ready",
    versionSummary:
      "Turns Moving Mountains into a fuller story, advocacy, fundraising, supporter follow-up, and coach review workflow while keeping supporter systems and reporting blocked.",
    lastEditedBy: "Taylor Brooks",
    lastPublishedDate: "Aug 15, 2025",
    builderSections: [
      "Movement story",
      "Advocacy action",
      "Fundraising momentum",
      "Supporter follow-up",
      "Coach review",
    ],
    roleActionRules: [
      createRoleRule(
        "student_member",
        "own",
        "See the movement story, advocacy action, and fundraising context clearly enough to take a next step.",
        "/campaigns/moving-mountains",
        "ready_readonly",
        "Students can inspect the campaign but do not edit movement configuration from this lane.",
      ),
      createRoleRule(
        "committee_member",
        "committee",
        "Run fundraising and follow-up work that turns the movement story into repeatable chapter action.",
        "/chapter?view=committees",
        "mock_only",
        "Committee execution stays visible while live outreach and external writes remain blocked.",
      ),
      createRoleRule(
        "committee_chair",
        "committee",
        "Turn the chapter story into a real advocacy action with a named owner and proof posture.",
        "/chapter?view=committees",
        "ready_readonly",
        "Committee chairs can inspect movement execution but do not open live sends or supporter writes.",
      ),
      createRoleRule(
        "eboard_officer",
        "chapter",
        "Keep supporter follow-up and impact visibility attached to the same chapter workflow instead of a separate reporting lane.",
        "/chapter?view=impact",
        "ready_readonly",
        "E-Board follow-up posture remains read-only until supporter and CRM writes are explicitly approved.",
      ),
      createRoleRule(
        "president",
        "chapter",
        "Keep the chapter story, fundraising momentum, and supporter follow-up coherent across the campaign.",
        "/chapter?view=impact",
        "ready_readonly",
        "Leader writes remain guarded and no supporter mutations are enabled from the campaign lane.",
      ),
      createRoleRule(
        "coach",
        "assigned_coach_portfolio",
        "Review whether the movement push is turning mission energy into action, support, and believable follow-up.",
        "/coach?view=campaigns",
        "ready_readonly",
        "Coach review remains mock-safe and does not open CRM, supporter, or automation writes.",
      ),
    ],
    steps: [
      {
        ...createStep(
          "moving-mountains-story",
          "Movement story",
          "Set the movement story",
          "president",
          "ready_readonly",
          "/campaigns/moving-mountains",
          "Students need a concrete mission story so movement language turns into action instead of floating as inspiration only.",
          "Campaign detail explains how the chapter story, mission proof, and desired student action connect before the push begins.",
        ),
        stepNumber: 1,
        affectedRoles: ["president", "committee_chair", "student_member"],
        supportingRoles: ["committee_chair", "coach"],
        entryCriteria:
          "The chapter can point to one campaign story, one desired student action, and one proof point that makes the mission concrete.",
        exitCriteria:
          "Movement story is visible enough that a student can understand why the campaign matters and what action it wants.",
        dueTiming: "Before the movement push opens",
        evidenceRequired: true,
        approvalRequired: false,
        pointsEnabled: false,
        required: true,
        kpiTag: "proof_items",
        communicationCount: 2,
        riskEscalation:
          "If the story stays abstract, students hear the mission language but never see the concrete action attached to it.",
      },
      {
        ...createStep(
          "moving-mountains-advocacy",
          "Advocacy action",
          "Run the advocacy action",
          "committee_chair",
          "ready_readonly",
          "/campaigns/moving-mountains",
          "The movement becomes real when students get one specific advocacy action they can take without needing extra leader translation.",
          "Campaign route names the action, owner, participation prompt, and proof posture clearly enough for students to move.",
        ),
        stepNumber: 2,
        affectedRoles: ["committee_chair", "committee_member", "student_member"],
        supportingRoles: ["president"],
        entryCriteria:
          "The chapter has chosen the advocacy action and a named owner or host for it.",
        exitCriteria:
          "Advocacy posture is visible through the campaign route with participation target, proof prompt, and next action context.",
        dueTiming: "During the active campaign push",
        evidenceRequired: true,
        approvalRequired: false,
        pointsEnabled: true,
        required: true,
        kpiTag: "actions_completed",
        communicationCount: 3,
        riskEscalation:
          "If the advocacy action is vague, the movement loses energy because students cannot tell what to actually do.",
      },
      {
        ...createStep(
          "moving-mountains-fundraising",
          "Fundraising momentum",
          "Build fundraising momentum",
          "committee_member",
          "mock_only",
          "/campaigns/moving-mountains",
          "Fundraising only feels real when the chapter turns the mission story into a doable campaign moment with repeatable proof.",
          "Campaign route makes the fundraising action, proof prompt, and follow-up posture visible without opening live payment flows.",
        ),
        stepNumber: 3,
        affectedRoles: ["committee_member", "student_member", "president"],
        supportingRoles: ["committee_chair", "president"],
        entryCriteria:
          "The chapter has named the fundraising action, owner, and proof prompt for this push.",
        exitCriteria:
          "Fundraising momentum is visible through chapter-facing posture before any payment processor or warehouse sync is opened.",
        dueTiming: "During the fundraising push",
        evidenceRequired: true,
        approvalRequired: false,
        pointsEnabled: true,
        required: true,
        kpiTag: "funds_raised",
        communicationCount: 2,
        riskEscalation:
          "If fundraising posture is invisible or generic, the chapter cannot tell whether mission energy is turning into real support.",
      },
      {
        ...createStep(
          "moving-mountains-supporters",
          "Supporter follow-up",
          "Follow up with new supporters",
          "eboard_officer",
          "ready_readonly",
          "/chapter?view=impact",
          "A supporter moment should lead to the next chapter action instead of ending as a one-time interaction.",
          "Impact lane can show supporter follow-up ownership and the next chapter action without opening CRM or outbound messaging.",
        ),
        stepNumber: 4,
        affectedRoles: ["eboard_officer", "committee_member", "president"],
        supportingRoles: ["coach"],
        entryCriteria:
          "The chapter can identify new supporters or interested people who need a named follow-up owner.",
        exitCriteria:
          "Supporter follow-up names the next chapter action and keeps ownership visible before any HubSpot or email path exists.",
        dueTiming: "Right after visible mission or fundraising engagement",
        evidenceRequired: true,
        approvalRequired: true,
        pointsEnabled: false,
        required: true,
        kpiTag: "new_supporters",
        communicationCount: 2,
        riskEscalation:
          "If supporter follow-up is not owned, the campaign creates awareness but loses the relationship before it becomes chapter momentum.",
      },
      {
        ...createStep(
          "moving-mountains-coach-review",
          "Coach movement review",
          "Prepare Moving Mountains review",
          "coach",
          "ready_readonly",
          "/coach?view=campaigns",
          "Coach review needs one view that combines story, advocacy, fundraising, and supporter follow-up before a weak movement push repeats.",
          "Coach route can inspect whether the chapter should advance, adjust, or pause the campaign without opening supporter or external write paths.",
        ),
        stepNumber: 5,
        affectedRoles: ["coach", "president", "department_staff"],
        supportingRoles: ["president", "department_staff"],
        entryCriteria:
          "Movement story, action, fundraising, and supporter follow-up posture are visible enough to review together.",
        exitCriteria:
          "Coach review names whether the movement push should keep going, change course, or pause before the next loop.",
        dueTiming: "End of the current movement push",
        evidenceRequired: true,
        approvalRequired: true,
        pointsEnabled: false,
        required: true,
        kpiTag: "coach_review_ready",
        communicationCount: 1,
        riskEscalation:
          "If the coach review is shallow, the chapter can repeat a weak movement push without understanding whether story, action, or follow-up broke down.",
      },
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
      "Connects campaign storytelling to the traveler and staff SLT Prep surfaces through a fuller belief, follow-up, commitment, and readiness workflow while keeping Shopify and live attendance disabled.",
    lastEditedBy: "Alex Kim",
    lastPublishedDate: "Nov 10, 2025",
    builderSections: [
      "Belief",
      "Info session",
      "Follow-up",
      "Commitment",
      "Staff review",
    ],
    steps: [
      {
        ...createStep(
          "slt-belief-proof",
          "Belief proof",
          "Prepare belief-building proof",
          "president",
          "ready_readonly",
          "/campaigns/slt-promotion",
          "Students need a believable reason to care about the trip before they are willing to ask harder questions about cost, timing, or fit.",
          "Campaign detail shows the proof, the value of the SLT, and the first low-pressure next step clearly.",
        ),
        stepNumber: 1,
        affectedRoles: ["president", "committee_chair", "student_member"],
        supportingRoles: ["committee_chair", "coach"],
        entryCriteria:
          "The chapter can point to one real student story, trip outcome, or partner-community proof point worth showing.",
        exitCriteria:
          "Belief-building proof is visible and the campaign route names why the SLT matters before asking for commitment.",
        dueTiming: "Before the first SLT info push",
        evidenceRequired: true,
        approvalRequired: false,
        pointsEnabled: false,
        required: true,
        kpiTag: "proof_items",
        communicationCount: 2,
        riskEscalation:
          "If belief-building proof is weak, students disengage before they even reach the real questions about travel.",
      },
      {
        ...createStep(
          "slt-info-session",
          "Info session",
          "Run the SLT info session",
          "committee_chair",
          "ready_readonly",
          "/campaigns/slt-promotion",
          "Students need a concrete, low-pressure moment to learn what the trip is, how it works, and what happens next.",
          "The chapter can see who hosted, what questions surfaced, and what next step the session should lead to.",
        ),
        stepNumber: 2,
        affectedRoles: ["committee_chair", "committee_member", "student_member"],
        supportingRoles: ["president"],
        entryCriteria:
          "The chapter has a clear session objective, one proof item, and a named host or owner.",
        exitCriteria:
          "The info session route posture keeps the session objective, attendance, and next action visible instead of ending at awareness only.",
        dueTiming: "During the interest-building phase",
        evidenceRequired: true,
        approvalRequired: false,
        pointsEnabled: true,
        required: true,
        kpiTag: "info_sessions",
        communicationCount: 3,
        riskEscalation:
          "If the info session is vague, students leave curious but not actually closer to a next step.",
      },
      {
        ...createStep(
          "slt-question-followup",
          "Question follow-up",
          "Track questions and hesitations",
          "committee_member",
          "mock_only",
          "/campaigns/slt-promotion",
          "Interest becomes real only when questions about cost, parents, travel, and fit get a human response.",
          "Campaign follow-up posture shows which questions are open, who owns them, and whether students are moving toward clarity.",
        ),
        stepNumber: 3,
        affectedRoles: ["committee_member", "student_member", "president"],
        supportingRoles: ["committee_chair", "president"],
        entryCriteria:
          "The chapter has real student questions or hesitations to sort and assign.",
        exitCriteria:
          "Question follow-up is visible by theme and owner before any live reminders or CRM writes exist.",
        dueTiming: "Right after the info session and early follow-up",
        evidenceRequired: true,
        approvalRequired: false,
        pointsEnabled: true,
        required: true,
        kpiTag: "followups_completed",
        communicationCount: 2,
        riskEscalation:
          "If open hesitations are not tracked, interest fades because students never get a useful answer at the right time.",
      },
      {
        ...createStep(
          "slt-commitment-path",
          "Commitment path",
          "Move interested students to next step",
          "president",
          "mock_only",
          "/slt-prep/payments",
          "The chapter needs a clear handoff from interest into forms, deposit readiness, and real prep expectations.",
          "Traveler-prep routes show the next required step and what commitment readiness means without opening live payment or enrollment writes.",
        ),
        stepNumber: 4,
        affectedRoles: ["president", "student_member", "department_staff"],
        supportingRoles: ["committee_member", "department_staff"],
        entryCriteria:
          "The chapter can identify which students are ready for a personal next-step conversation or deposit-readiness review.",
        exitCriteria:
          "Commitment posture makes the next step visible through prep routes without hiding payment, form, or readiness expectations.",
        dueTiming: "After interest is qualified",
        evidenceRequired: true,
        approvalRequired: true,
        pointsEnabled: false,
        required: true,
        kpiTag: "deposits",
        communicationCount: 2,
        riskEscalation:
          "If the commitment path is fuzzy, students stall between interest and action because no route owns the real next step.",
      },
      {
        ...createStep(
          "slt-coach-review",
          "Staff review",
          "Prepare SLT promotion review",
          "coach",
          "ready_readonly",
          "/slt-prep/staff",
          "Coach and staff need one readiness view that combines interest, follow-up, and trip-prep posture before broader automation is approved.",
          "Staff dashboard can inspect traveler readiness, risk filters, and next-step posture without creating real reminders, payments, or external writes.",
        ),
        stepNumber: 5,
        affectedRoles: ["coach", "department_staff", "president"],
        supportingRoles: ["department_staff", "president"],
        entryCriteria:
          "Belief-building, question follow-up, and commitment readiness are visible enough to review together.",
        exitCriteria:
          "Coach and staff can see whether the SLT promotion loop should keep going, adjust, or pause before handing more students into prep.",
        dueTiming: "End of the current SLT promotion cycle",
        evidenceRequired: true,
        approvalRequired: true,
        pointsEnabled: false,
        required: true,
        kpiTag: "coach_review_ready",
        communicationCount: 1,
        riskEscalation:
          "If coach and staff review stays shallow, the chapter can keep generating interest without a clean path into readiness.",
      },
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
  }>,
): SopCampaignDefinition {
  const defaultRoute = getDefaultOperationalRoute(shell.slug);
  const steps =
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
    ];
  const phases = overrides.phases ?? buildPhasesFromSteps(shell.slug, steps);

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
    phases,
    steps,
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
    validators:
      overrides.validators ??
      buildDefaultValidators(phases, steps),
    handoffRules:
      overrides.handoffRules ??
      buildDefaultHandoffRules(phases, steps),
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
    featureFlagBindings:
      overrides.featureFlagBindings ??
      buildDefaultFeatureFlagBindings(shell.slug),
    operationPermissions:
      overrides.operationPermissions ??
      buildDefaultOperationPermissions(),
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
    sourceTraces:
      overrides.sourceTraces ??
      buildDefaultSourceTraces(shell.slug, phases, steps),
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

function buildPhasesFromSteps(
  campaignSlug: string,
  steps: readonly SopStep[],
): readonly SopPhase[] {
  const phaseMap = new Map<string, SopStep[]>();

  for (const step of steps) {
    const existing = phaseMap.get(step.phaseLabel) ?? [];
    phaseMap.set(step.phaseLabel, [...existing, step]);
  }

  return [...phaseMap.entries()].map(([label, phaseSteps], index) => {
    const firstStep = phaseSteps[0];
    const lastStep = phaseSteps.at(-1) ?? firstStep;

    return {
      id: `${campaignSlug}-phase-${index + 1}`,
      label,
      sequence: index + 1,
      objective: firstStep?.purpose ?? `${label} objective`,
      entryCriteria: firstStep ? [firstStep.entryCriteria] : [],
      exitCriteria: lastStep ? [lastStep.exitCriteria] : [],
      stepIds: phaseSteps.map((step) => step.id),
      status: phaseSteps.some((step) => step.status === "ready_readonly")
        ? "ready_readonly"
        : phaseSteps.some((step) => step.status === "mock_only")
          ? "mock_only"
          : "blocked",
      sourceCertainty: "repo_only_placeholder",
    };
  });
}

function buildDefaultValidators(
  phases: readonly SopPhase[],
  steps: readonly SopStep[],
): readonly SopValidator[] {
  return phases.map((phase, index) => ({
    id: `${phase.id}-validator`,
    label: `${phase.label} validator`,
    validatorRoles: index === phases.length - 1
      ? ["coach", "president"]
      : ["president", "committee_chair"],
    prompt:
      index === phases.length - 1
        ? "Confirm the chapter can advance without opening live writes, sends, or hidden admin shortcuts."
        : "Confirm owners, next actions, and proof expectations are explicit enough for the next phase.",
    phaseIds: [phase.id],
    stepIds: steps
      .filter((step) => phase.stepIds.includes(step.id))
      .map((step) => step.id),
    authorityStatus: "permissions_matrix_missing_local_copy",
    status: phase.status,
    sourceCertainty: "repo_only_placeholder",
  }));
}

function buildDefaultHandoffRules(
  phases: readonly SopPhase[],
  steps: readonly SopStep[],
): readonly SopHandoffRule[] {
  return phases.slice(0, -1).map((phase, index) => {
    const nextPhase = phases[index + 1];
    const nextPhaseFirstStep = steps.find((step) => nextPhase.stepIds.includes(step.id));

    return {
      id: `${phase.id}-to-${nextPhase.id}`,
      fromPhaseId: phase.id,
      toPhaseId: nextPhase.id,
      triggerLabel: `${phase.label} exit criteria are visible`,
      ownerRoles: ["president", "committee_chair"],
      destinationRoutes: nextPhaseFirstStep ? [nextPhaseFirstStep.linkedRoute] : [],
      status:
        phase.status === "blocked" || nextPhase.status === "blocked"
          ? "blocked"
          : phase.status === "mock_only" || nextPhase.status === "mock_only"
            ? "mock_only"
            : "ready_readonly",
      sourceCertainty: "repo_only_placeholder",
    };
  });
}

function buildDefaultFeatureFlagBindings(
  campaignSlug: string,
): readonly SopFeatureFlagBinding[] {
  return [
    {
      id: `${campaignSlug}-builder-preview`,
      flagKey: `workflow.${campaignSlug}.builder_preview`,
      description: "Keeps the backend workflow configuration lane visible in mock-safe form.",
      defaultState: "enabled",
      rolloutStage: "review_only",
      status: "ready_readonly",
      sourceCertainty: "repo_only_placeholder",
    },
    {
      id: `${campaignSlug}-runtime-reads`,
      flagKey: `workflow.${campaignSlug}.runtime_reads`,
      description: "Lets product surfaces read structured workflow data before any writes or external automation open.",
      defaultState: "enabled",
      rolloutStage: "pilot_ready",
      status: "mock_only",
      sourceCertainty: "repo_only_placeholder",
    },
  ];
}

function buildDefaultOperationPermissions(): readonly SopOperationPermission[] {
  return [
    {
      id: "workflow-draft-edit",
      operation: "draft_edit",
      allowedRoles: ["ds_admin", "super_admin"],
      allowedScopes: ["all_platform", "breakglass"],
      approvalRequired: false,
      authorityStatus: "repo_preview_only",
      note: "Local backend preview allows draft-edit posture conceptually while final authority still depends on the external permissions matrix.",
    },
    {
      id: "workflow-review-submit",
      operation: "review_submit",
      allowedRoles: ["department_staff", "sales_admin", "ds_admin", "super_admin"],
      allowedScopes: ["department", "all_platform", "breakglass"],
      approvalRequired: false,
      authorityStatus: "permissions_matrix_missing_local_copy",
      note: "Review submission remains visible while final operation-level authority still depends on the external matrix link.",
    },
    {
      id: "workflow-publish-approve",
      operation: "publish_approve",
      allowedRoles: ["sales_admin", "super_admin"],
      allowedScopes: ["department", "breakglass"],
      approvalRequired: true,
      authorityStatus: "permissions_matrix_missing_local_copy",
      note: "Publishing remains approval-gated and blocked from live behavior until the matrix is attached and reviewed.",
    },
    {
      id: "workflow-schedule-change",
      operation: "schedule_change",
      allowedRoles: ["sales_admin", "super_admin"],
      allowedScopes: ["department", "breakglass"],
      approvalRequired: true,
      authorityStatus: "permissions_matrix_missing_local_copy",
      note: "Scheduling changes are separate from draft edits and still await matrix-backed approval rules.",
    },
    {
      id: "workflow-rollback-change",
      operation: "rollback_change",
      allowedRoles: ["super_admin"],
      allowedScopes: ["breakglass"],
      approvalRequired: true,
      authorityStatus: "permissions_matrix_missing_local_copy",
      note: "Rollback stays a breakglass operation with audit expectations, not a casual admin action.",
    },
    {
      id: "workflow-archive-template",
      operation: "archive_template",
      allowedRoles: ["sales_admin", "super_admin"],
      allowedScopes: ["department", "breakglass"],
      approvalRequired: true,
      authorityStatus: "permissions_matrix_missing_local_copy",
      note: "Archiving affects future campaign availability and should stay explicitly approved.",
    },
    {
      id: "workflow-integration-binding-change",
      operation: "integration_binding_change",
      allowedRoles: ["ds_admin", "super_admin"],
      allowedScopes: ["all_platform", "breakglass"],
      approvalRequired: true,
      authorityStatus: "permissions_matrix_missing_local_copy",
      note: "Integration binding changes stay blocked until permissions and downstream system ownership are confirmed.",
    },
    {
      id: "workflow-feature-flag-change",
      operation: "feature_flag_change",
      allowedRoles: ["ds_admin", "super_admin"],
      allowedScopes: ["all_platform", "breakglass"],
      approvalRequired: true,
      authorityStatus: "repo_preview_only",
      note: "Feature-flag posture is modeled locally first and should not imply hosted rollout authority.",
    },
  ];
}

function buildDefaultSourceTraces(
  campaignSlug: string,
  phases: readonly SopPhase[],
  steps: readonly SopStep[],
): readonly SopSourceTrace[] {
  return [
    {
      id: `${campaignSlug}-campaign-trace`,
      label: "Current repo SOP builder definition",
      location: `src/data/mock-sop-builder.ts#${campaignSlug}`,
      mappedTargetType: "campaign",
      mappedTargetId: campaignSlug,
      certainty: "repo_only_placeholder",
      note: "Current backend builder definition used while deeper source import continues.",
    },
    ...phases.map((phase) => ({
      id: `${phase.id}-trace`,
      label: `${phase.label} phase trace`,
      location: "docs/architecture/figma-route-and-surface-map.md",
      mappedTargetType: "phase" as const,
      mappedTargetId: phase.id,
      certainty: "repo_only_placeholder" as const,
      note: "Phase remains aligned to the route-owned surface inventory while richer source attachments are reconciled.",
    })),
    ...steps.slice(0, 3).map((step) => ({
      id: `${step.id}-trace`,
      label: `${step.title} step trace`,
      location: step.linkedRoute,
      mappedTargetType: "step" as const,
      mappedTargetId: step.id,
      certainty: "repo_only_placeholder" as const,
      note: "Step stays tied to a real route family instead of becoming detached workflow prose.",
    })),
    {
      id: `${campaignSlug}-feature-flag-trace`,
      label: "Workflow feature flag posture",
      location: "/admin/sop-builder",
      mappedTargetType: "feature_flag",
      mappedTargetId: `${campaignSlug}-builder-preview`,
      certainty: "repo_only_placeholder",
      note: "Feature-flag posture is tracked locally in the builder before any hosted rollout is approved.",
    },
    {
      id: `${campaignSlug}-publish-permission-trace`,
      label: "Publish operation permission posture",
      location: "/admin/permissions",
      mappedTargetType: "operation_permission",
      mappedTargetId: "workflow-publish-approve",
      certainty: "missing_source_confirmation",
      note: "Final publish authority depends on the external permissions matrix, which is linked but not bundled locally.",
    },
  ];
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
    "grow-the-movement",
    "start-a-chapter",
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
