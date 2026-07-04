import type {
  ApprovalRow,
  AssignmentPriority,
  AssignmentRow,
  AssignmentStatus,
  AuditLogRow,
  AutomationOutboxRow,
  CampaignRoleAssignmentRow,
  CampaignRow,
  ChapterEventRow,
  ChapterEventStatus,
  ChapterRow,
  CoachChapterAssignmentRow,
  DatabaseRoleKey,
  EvidenceItemRow,
  EvidenceStatus,
  EvidenceType,
  EventRow,
  IntegrationEventRow,
  KpiEventRow,
  LumaEventLinkRow,
  MembershipRow,
  PhaseReadinessReviewRow,
  PhaseRow,
  PointsEventRow,
  ProfileRow,
  RiskFlagRow,
  RiskSeverity,
  StaffRoleAssignmentRow,
} from "@/shared/types/persistence";

export const TEST_PRODUCTION_SEED_FAMILY = "test_production_v1";
export const TEST_PRODUCTION_SEED_PASSWORD = "TestMEDLIFE!2026";
export const TEST_PRODUCTION_SEED_TIMESTAMP = "2026-07-04T12:00:00.000Z";

type Uuid = string;

type TestStaffRole = Extract<DatabaseRoleKey, "coach" | "admin" | "ds_admin" | "super_admin">;

type TestChapterKey =
  | "boston-college"
  | "boston-university"
  | "duke"
  | "mcgill"
  | "new-york-university"
  | "ucla"
  | "university-of-texas";

type TestCommitteeKey =
  | "safe-homes"
  | "moving-mountains"
  | "slt-prep"
  | "recruitment"
  | "fundraising"
  | "advocacy"
  | "events"
  | "social-media"
  | "community-building";

type TestChapterScenario = {
  key: TestChapterKey;
  name: string;
  campus: string;
  region: string;
  shortCode: string;
  scenario: string;
  memberScale: number;
  committeeKeys: TestCommitteeKey[];
  assignmentStatuses: AssignmentStatus[];
  evidenceStatuses: EvidenceStatus[];
  eventHealth: {
    eventsYear: number;
    eventsMonth: number;
    rsvps: number;
    attended: number;
    eligibleMembers: number;
    nps: number | null;
  };
  basePoints: number;
  riskSeverity: RiskSeverity;
};

type TestCommitteeDefinition = {
  key: TestCommitteeKey;
  name: string;
  committeeType: string;
  lane: string;
};

type TestAuthUser = {
  id: Uuid;
  email: string;
  displayName: string;
  password: string;
};

type TestLogin = {
  email: string;
  password: string;
  displayName: string;
  role: string;
  chapterName: string | null;
  demonstrates: string;
};

export type TestProductionSeedEnvironment = {
  generatedAt: string;
  seedFamily: string;
  password: string;
  chapterScenarios: TestChapterScenario[];
  logins: TestLogin[];
  rows: {
    authUsers: TestAuthUser[];
    profiles: ProfileRow[];
    chapters: ChapterRow[];
    memberships: MembershipRow[];
    staffRoleAssignments: StaffRoleAssignmentRow[];
    coachChapterAssignments: CoachChapterAssignmentRow[];
    campaigns: CampaignRow[];
    phases: PhaseRow[];
    actionCommittees: TestActionCommitteeRow[];
    actionTemplates: TestActionTemplateRow[];
    assignments: AssignmentRow[];
    campaignRoleAssignments: CampaignRoleAssignmentRow[];
    phaseReadinessReviews: PhaseReadinessReviewRow[];
    riskFlags: RiskFlagRow[];
    chapterEvents: ChapterEventRow[];
    lumaEventLinks: LumaEventLinkRow[];
    evidenceItems: EvidenceItemRow[];
    approvals: ApprovalRow[];
    pointsEvents: PointsEventRow[];
    kpiEvents: KpiEventRow[];
    events: EventRow[];
    integrationEvents: IntegrationEventRow[];
    automationOutbox: AutomationOutboxRow[];
    auditLogs: AuditLogRow[];
  };
};

export type TestProductionSeedValidation = {
  ready: boolean;
  checks: Array<{
    key: string;
    passed: boolean;
    message: string;
  }>;
};

type TestActionCommitteeRow = {
  id: Uuid;
  chapter_id: Uuid;
  name: string;
  committee_type: string;
  status: "active" | "inactive" | "archived";
  chair_user_id: Uuid | null;
  created_at: string;
  updated_at: string;
};

type TestActionTemplateRow = {
  id: Uuid;
  chapter_id: Uuid;
  campaign_id: Uuid;
  title: string;
  instructions: string;
  default_owner_role_key: DatabaseRoleKey | null;
  evidence_required: string;
  points: number;
  kpi_key: string;
  created_at: string;
  updated_at: string;
};

type ChapterUserSet = {
  president: TestAuthUser;
  vicePresident: TestAuthUser;
  secretary: TestAuthUser;
  treasurer: TestAuthUser;
  committeeChairs: Record<TestCommitteeKey, TestAuthUser | undefined>;
  committeeMembers: TestAuthUser[];
  generalMembers: TestAuthUser[];
};

const committeeCatalog: Record<TestCommitteeKey, TestCommitteeDefinition> = {
  "safe-homes": {
    key: "safe-homes",
    name: "Test Safe Homes",
    committeeType: "safe_homes",
    lane: "safe_homes",
  },
  "moving-mountains": {
    key: "moving-mountains",
    name: "Test Moving Mountains",
    committeeType: "moving_mountains",
    lane: "moving_mountains",
  },
  "slt-prep": {
    key: "slt-prep",
    name: "Test Service Learning Trip Prep",
    committeeType: "slt_prep",
    lane: "slt_prep",
  },
  recruitment: {
    key: "recruitment",
    name: "Test Recruitment",
    committeeType: "recruitment",
    lane: "recruitment",
  },
  fundraising: {
    key: "fundraising",
    name: "Test Fundraising",
    committeeType: "fundraising",
    lane: "fundraising",
  },
  advocacy: {
    key: "advocacy",
    name: "Test Advocacy",
    committeeType: "advocacy",
    lane: "advocacy",
  },
  events: {
    key: "events",
    name: "Test Events",
    committeeType: "events",
    lane: "events",
  },
  "social-media": {
    key: "social-media",
    name: "Test Social Media",
    committeeType: "social_media",
    lane: "social_media",
  },
  "community-building": {
    key: "community-building",
    name: "Test Community Building",
    committeeType: "community_building",
    lane: "community_building",
  },
};

const chapterScenarios: TestChapterScenario[] = [
  {
    key: "boston-university",
    name: "Test Boston University",
    campus: "Boston University",
    region: "Northeast",
    shortCode: "bu",
    scenario:
      "Highly active chapter with complete leadership, many committees, completed tasks, and evidence awaiting review.",
    memberScale: 96,
    committeeKeys: [
      "safe-homes",
      "moving-mountains",
      "recruitment",
      "fundraising",
      "events",
      "social-media",
    ],
    assignmentStatuses: ["approved", "submitted", "in_progress", "approved", "not_started"],
    evidenceStatuses: ["pending_review", "approved", "changes_requested"],
    eventHealth: {
      eventsYear: 42,
      eventsMonth: 8,
      rsvps: 188,
      attended: 151,
      eligibleMembers: 220,
      nps: 76,
    },
    basePoints: 3400,
    riskSeverity: "low",
  },
  {
    key: "boston-college",
    name: "Test Boston College",
    campus: "Boston College",
    region: "Northeast",
    shortCode: "bc",
    scenario: "Excellent recruitment and large membership with moderate committee activity.",
    memberScale: 118,
    committeeKeys: ["recruitment", "events", "community-building", "fundraising"],
    assignmentStatuses: ["approved", "in_progress", "submitted", "not_started", "approved"],
    evidenceStatuses: ["approved", "pending_review", "approved"],
    eventHealth: {
      eventsYear: 35,
      eventsMonth: 6,
      rsvps: 212,
      attended: 174,
      eligibleMembers: 260,
      nps: 71,
    },
    basePoints: 2860,
    riskSeverity: "medium",
  },
  {
    key: "duke",
    name: "Test Duke",
    campus: "Duke University",
    region: "Southeast",
    shortCode: "duke",
    scenario: "Strong leadership with several overdue tasks and coach reminders.",
    memberScale: 74,
    committeeKeys: ["recruitment", "fundraising", "advocacy", "events"],
    assignmentStatuses: ["in_progress", "not_started", "changes_requested", "submitted", "approved"],
    evidenceStatuses: ["changes_requested", "pending_review", "approved"],
    eventHealth: {
      eventsYear: 28,
      eventsMonth: 4,
      rsvps: 94,
      attended: 61,
      eligibleMembers: 140,
      nps: 62,
    },
    basePoints: 1940,
    riskSeverity: "high",
  },
  {
    key: "mcgill",
    name: "Test McGill",
    campus: "McGill University",
    region: "Canada",
    shortCode: "mcgill",
    scenario: "Brand-new chapter with a small leadership team and minimal activity.",
    memberScale: 22,
    committeeKeys: ["recruitment", "events"],
    assignmentStatuses: ["not_started", "in_progress", "not_started", "submitted", "not_started"],
    evidenceStatuses: ["pending_review", "changes_requested", "pending_review"],
    eventHealth: {
      eventsYear: 6,
      eventsMonth: 1,
      rsvps: 28,
      attended: 17,
      eligibleMembers: 48,
      nps: null,
    },
    basePoints: 640,
    riskSeverity: "medium",
  },
  {
    key: "new-york-university",
    name: "Test New York University",
    campus: "New York University",
    region: "Northeast",
    shortCode: "nyu",
    scenario: "Outstanding event attendance and social engagement with weak task completion.",
    memberScale: 104,
    committeeKeys: ["events", "social-media", "community-building", "recruitment"],
    assignmentStatuses: ["submitted", "not_started", "changes_requested", "in_progress", "not_started"],
    evidenceStatuses: ["approved", "rejected", "pending_review"],
    eventHealth: {
      eventsYear: 48,
      eventsMonth: 10,
      rsvps: 260,
      attended: 223,
      eligibleMembers: 280,
      nps: 82,
    },
    basePoints: 2320,
    riskSeverity: "medium",
  },
  {
    key: "ucla",
    name: "Test UCLA",
    campus: "UCLA",
    region: "West Coast",
    shortCode: "ucla",
    scenario: "Excellent Safe Homes and Moving Mountains committees with many completed tasks.",
    memberScale: 88,
    committeeKeys: ["safe-homes", "moving-mountains", "events", "advocacy", "social-media"],
    assignmentStatuses: ["approved", "approved", "submitted", "in_progress", "approved"],
    evidenceStatuses: ["approved", "pending_review", "approved"],
    eventHealth: {
      eventsYear: 39,
      eventsMonth: 7,
      rsvps: 176,
      attended: 139,
      eligibleMembers: 210,
      nps: 78,
    },
    basePoints: 3180,
    riskSeverity: "low",
  },
  {
    key: "university-of-texas",
    name: "Test University of Texas",
    campus: "University of Texas",
    region: "Southwest",
    shortCode: "ut",
    scenario:
      "Large chapter with mixed engagement, several committees at different stages, and useful admin review examples.",
    memberScale: 132,
    committeeKeys: [
      "safe-homes",
      "recruitment",
      "fundraising",
      "events",
      "social-media",
      "community-building",
    ],
    assignmentStatuses: ["approved", "in_progress", "changes_requested", "submitted", "not_started"],
    evidenceStatuses: ["pending_review", "approved", "rejected"],
    eventHealth: {
      eventsYear: 44,
      eventsMonth: 7,
      rsvps: 198,
      attended: 121,
      eligibleMembers: 300,
      nps: 57,
    },
    basePoints: 2510,
    riskSeverity: "high",
  },
];

const staffUsers: Array<{
  key: string;
  displayName: string;
  email: string;
  roleKey: TestStaffRole;
  demonstrates: string;
}> = [
  {
    key: "sales-coach",
    displayName: "Test Sales Coach",
    email: "test.sales.coach@example.com",
    roleKey: "coach",
    demonstrates: "Sales coach portfolio review for chapter event and points health.",
  },
  {
    key: "marketing-manager",
    displayName: "Test Marketing Manager",
    email: "test.marketing.manager@example.com",
    roleKey: "admin",
    demonstrates: "Staff review of social proof, feed activity, and chapter recognition.",
  },
  {
    key: "revops-systems-manager",
    displayName: "Test RevOps Systems Manager",
    email: "test.revops.systems.manager@example.com",
    roleKey: "ds_admin",
    demonstrates: "DS Admin audit, outbox, and integration posture review.",
  },
  {
    key: "staff-member",
    displayName: "Test Staff Member",
    email: "test.staff.member@example.com",
    roleKey: "admin",
    demonstrates: "General staff access to the staff command center.",
  },
  {
    key: "coach",
    displayName: "Test Coach",
    email: "test.coach@example.com",
    roleKey: "coach",
    demonstrates: "Coach reminders, risk flags, and chapter support queues.",
  },
  {
    key: "administrator",
    displayName: "Test Administrator",
    email: "test.administrator@example.com",
    roleKey: "admin",
    demonstrates: "Admin review of organizations and launch-lane metrics.",
  },
  {
    key: "super-admin",
    displayName: "Test Super Admin",
    email: "test.super.admin@example.com",
    roleKey: "super_admin",
    demonstrates: "Super Admin backend and full test environment review.",
  },
];

const fakeFirstNames = [
  "Jamie",
  "Nick",
  "Brian",
  "Maya",
  "Sofia",
  "Priya",
  "Cam",
  "Nia",
  "Casey",
  "Eli",
  "Val",
  "Rae",
  "Ari",
  "Dee",
  "Sam",
  "Taylor",
  "Jordan",
  "Morgan",
  "Alex",
  "Riley",
  "Quinn",
  "Harper",
  "Noah",
  "Leah",
];

export function getTestProductionSeedEnvironment(): TestProductionSeedEnvironment {
  const generatedAt = TEST_PRODUCTION_SEED_TIMESTAMP;
  const authUsers: TestAuthUser[] = [];
  const profiles: ProfileRow[] = [];
  const chapters: ChapterRow[] = [];
  const memberships: MembershipRow[] = [];
  const staffRoleAssignments: StaffRoleAssignmentRow[] = [];
  const coachChapterAssignments: CoachChapterAssignmentRow[] = [];
  const campaigns: CampaignRow[] = [];
  const phases: PhaseRow[] = [];
  const actionCommittees: TestActionCommitteeRow[] = [];
  const actionTemplates: TestActionTemplateRow[] = [];
  const assignments: AssignmentRow[] = [];
  const campaignRoleAssignments: CampaignRoleAssignmentRow[] = [];
  const phaseReadinessReviews: PhaseReadinessReviewRow[] = [];
  const riskFlags: RiskFlagRow[] = [];
  const chapterEvents: ChapterEventRow[] = [];
  const lumaEventLinks: LumaEventLinkRow[] = [];
  const evidenceItems: EvidenceItemRow[] = [];
  const approvals: ApprovalRow[] = [];
  const pointsEvents: PointsEventRow[] = [];
  const kpiEvents: KpiEventRow[] = [];
  const events: EventRow[] = [];
  const integrationEvents: IntegrationEventRow[] = [];
  const automationOutbox: AutomationOutboxRow[] = [];
  const auditLogs: AuditLogRow[] = [];
  const logins: TestLogin[] = [];

  const staff = createStaffUsers();
  for (const user of staff) {
    authUsers.push(user.authUser);
    profiles.push(toProfileRow(user.authUser));
    staffRoleAssignments.push({
      id: testUuid(`staff-role:${user.key}`),
      user_id: user.authUser.id,
      role_key: user.roleKey,
      status: "active",
      assigned_by: null,
      assigned_at: generatedAt,
      ended_at: null,
      created_at: generatedAt,
      updated_at: generatedAt,
    });
    logins.push({
      email: user.authUser.email,
      password: TEST_PRODUCTION_SEED_PASSWORD,
      displayName: user.authUser.displayName,
      role: user.roleKey,
      chapterName: null,
      demonstrates: user.demonstrates,
    });
  }

  const salesCoach = staff.find((user) => user.key === "sales-coach")?.authUser;
  const supportCoach = staff.find((user) => user.key === "coach")?.authUser;
  const admin = staff.find((user) => user.key === "administrator")?.authUser;
  const dsAdmin = staff.find((user) => user.key === "revops-systems-manager")?.authUser;

  for (const scenario of chapterScenarios) {
    const chapter = toChapterRow(scenario, admin?.id ?? null);
    const campaign = toCampaignRow(scenario, chapter.id, admin?.id ?? null);
    const phase = toPhaseRow(scenario, chapter.id, campaign.id);
    const users = createChapterUsers(scenario);

    chapters.push(chapter);
    campaigns.push(campaign);
    phases.push(phase);

    for (const authUser of getChapterAuthUsers(users)) {
      authUsers.push(authUser);
      profiles.push(toProfileRow(authUser));
    }

    memberships.push(...toMembershipRows(scenario, chapter.id, users, admin?.id ?? null));
    campaignRoleAssignments.push(
      ...toCampaignRoleAssignments(scenario, chapter.id, campaign.id, users, admin?.id ?? null),
    );
    coachChapterAssignments.push(
      ...toCoachAssignments(scenario, chapter.id, salesCoach?.id, supportCoach?.id, admin?.id),
    );

    const committees = toCommitteeRows(scenario, chapter.id, users);
    const templates = toActionTemplateRows(scenario, chapter.id, campaign.id);
    const chapterAssignments = toAssignmentRows(
      scenario,
      chapter.id,
      campaign.id,
      phase.id,
      users,
      committees,
      templates,
    );
    const chapterEventRows = toChapterEventRows(
      scenario,
      chapter.id,
      campaign.id,
      phase.id,
      committees,
      chapterAssignments,
      users,
    );
    const lumaLinks = toLumaEventLinks(scenario, chapter.id, campaign.id, phase.id, chapterEventRows);
    const evidence = toEvidenceRows(
      scenario,
      chapter.id,
      chapterAssignments,
      chapterEventRows,
      users,
    );
    const approvalRows = toApprovalRows(scenario, chapter.id, evidence, users.president.id);
    const pointRows = toPointsRows(
      scenario,
      chapter.id,
      campaign.id,
      chapterAssignments,
      chapterEventRows,
      evidence,
      approvalRows,
      users,
    );

    actionCommittees.push(...committees);
    actionTemplates.push(...templates);
    assignments.push(...chapterAssignments);
    chapterEvents.push(...chapterEventRows);
    lumaEventLinks.push(...lumaLinks);
    evidenceItems.push(...evidence);
    approvals.push(...approvalRows);
    pointsEvents.push(...pointRows);
    kpiEvents.push(
      ...toKpiRows(scenario, chapter.id, campaign.id, phase.id, chapterAssignments, chapterEventRows, evidence),
    );
    events.push(
      ...toActivityRows(scenario, chapter.id, campaign.id, chapterAssignments, chapterEventRows, users),
    );
    integrationEvents.push(
      ...toIntegrationRows(scenario, chapter.id, events.slice(-4), dsAdmin?.id ?? null),
    );
    automationOutbox.push(...toOutboxRows(scenario, chapter.id, integrationEvents.slice(-2)));
    riskFlags.push(
      ...toRiskRows(scenario, chapter.id, campaign.id, phase.id, chapterAssignments, salesCoach?.id, admin?.id),
    );
    phaseReadinessReviews.push(
      ...toReadinessReviewRows(scenario, chapter.id, campaign.id, phase.id, salesCoach?.id ?? admin?.id),
    );
    auditLogs.push(
      ...toAuditRows(scenario, chapter.id, users.president.id, admin?.id ?? null, dsAdmin?.id ?? null),
    );

    for (const login of toChapterLoginRows(scenario, users)) {
      logins.push(login);
    }
  }

  return {
    generatedAt,
    seedFamily: TEST_PRODUCTION_SEED_FAMILY,
    password: TEST_PRODUCTION_SEED_PASSWORD,
    chapterScenarios,
    logins,
    rows: {
      authUsers,
      profiles,
      chapters,
      memberships,
      staffRoleAssignments,
      coachChapterAssignments,
      campaigns,
      phases,
      actionCommittees,
      actionTemplates,
      assignments,
      campaignRoleAssignments,
      phaseReadinessReviews,
      riskFlags,
      chapterEvents,
      lumaEventLinks,
      evidenceItems,
      approvals,
      pointsEvents,
      kpiEvents,
      events,
      integrationEvents,
      automationOutbox,
      auditLogs,
    },
  };
}

export function validateTestProductionSeedEnvironment(
  environment = getTestProductionSeedEnvironment(),
): TestProductionSeedValidation {
  const visibleLabels = getVisibleSeedLabels(environment);
  const emails = environment.rows.authUsers.map((user) => user.email);
  const assignmentStatuses = new Set(environment.rows.assignments.map((row) => row.status));
  const evidenceStatuses = new Set(environment.rows.evidenceItems.map((row) => row.status));
  const cleanupSql = buildTestProductionCleanupSql(environment);
  const seedSql = buildTestProductionSeedSql(environment);
  const checks = [
    {
      key: "seven_chapters",
      passed: environment.rows.chapters.length === 7,
      message: `Expected 7 Test chapters, found ${environment.rows.chapters.length}.`,
    },
    {
      key: "visible_test_prefix",
      passed: visibleLabels.every((label) => label.startsWith("Test")),
      message: "Every user-visible seeded label starts with Test.",
    },
    {
      key: "fake_emails",
      passed: emails.every((email) => email.startsWith("test.") && email.endsWith("@example.com")),
      message: "Every seeded login uses a fake test.*@example.com email.",
    },
    {
      key: "login_roles",
      passed:
        environment.logins.some((login) => login.role === "general_member") &&
        environment.logins.some((login) => login.role === "president_vp") &&
        environment.logins.some((login) => login.role === "coach") &&
        environment.logins.some((login) => login.role === "admin") &&
        environment.logins.some((login) => login.role === "ds_admin") &&
        environment.logins.some((login) => login.role === "super_admin"),
      message: "The login list covers member, leader, coach, admin, DS Admin, and Super Admin.",
    },
    {
      key: "assignment_status_coverage",
      passed: ["not_started", "in_progress", "submitted", "approved", "changes_requested"].every(
        (status) => assignmentStatuses.has(status as AssignmentStatus),
      ),
      message: "Assignments cover not-started, in-progress, submitted, approved, and returned states.",
    },
    {
      key: "evidence_status_coverage",
      passed: ["pending_review", "approved", "rejected", "changes_requested"].every((status) =>
        evidenceStatuses.has(status as EvidenceStatus),
      ),
      message: "Evidence covers pending, approved, rejected, and returned states.",
    },
    {
      key: "idempotent_seed",
      passed: seedSql.includes("on conflict") && seedSql.includes("do update"),
      message: "The seed SQL uses deterministic IDs and upserts to avoid duplicate rows.",
    },
    {
      key: "cleanup_command_safe_scope",
      passed:
        cleanupSql.includes("test.%@example.com") &&
        cleanupSql.includes("name like 'Test %'") &&
        cleanupSql.includes("display_name like 'Test %'"),
      message: "The cleanup SQL scopes deletion to Test names and fake example.com emails.",
    },
    {
      key: "external_writes_disabled",
      passed: environment.rows.automationOutbox.every((row) => row.status === "disabled"),
      message: "Automation outbox rows stay disabled so the test seed cannot send externally.",
    },
  ];

  return {
    ready: checks.every((check) => check.passed),
    checks,
  };
}

export function getTestProductionSeedSummary(
  environment = getTestProductionSeedEnvironment(),
) {
  return {
    chapters: environment.rows.chapters.length,
    users: environment.rows.authUsers.length,
    staffUsers: environment.rows.staffRoleAssignments.length,
    memberships: environment.rows.memberships.length,
    committees: environment.rows.actionCommittees.length,
    assignments: environment.rows.assignments.length,
    evidenceItems: environment.rows.evidenceItems.length,
    events: environment.rows.chapterEvents.length,
    pointsEvents: environment.rows.pointsEvents.length,
    activityEvents: environment.rows.events.length,
    auditLogs: environment.rows.auditLogs.length,
  };
}

export function buildTestProductionSeedSql(
  environment = getTestProductionSeedEnvironment(),
) {
  const rows = environment.rows;

  return [
    "-- myMEDLIFE Test Production seed data",
    "-- Generated from src/services/test-production-seed-environment.ts",
    "-- Every user-visible seeded object starts with Test and every login uses test.*@example.com.",
    "begin;",
    "",
    buildAuthUsersSql(rows.authUsers),
    buildAuthIdentitiesSql(rows.authUsers),
    buildInsertSql("app.profiles", rows.profiles, [
      "id",
      "display_name",
      "email",
      "status",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.chapters", rows.chapters, [
      "id",
      "name",
      "campus",
      "region",
      "status",
      "created_by",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.staff_role_assignments", rows.staffRoleAssignments, [
      "id",
      "user_id",
      "role_key",
      "status",
      "assigned_by",
      "assigned_at",
      "ended_at",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.memberships", rows.memberships, [
      "id",
      "user_id",
      "chapter_id",
      "role_key",
      "status",
      "requested_at",
      "approved_at",
      "approved_by",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.coach_chapter_assignments", rows.coachChapterAssignments, [
      "id",
      "coach_user_id",
      "chapter_id",
      "coach_type",
      "status",
      "starts_at",
      "ends_at",
      "assigned_by",
      "handoff_reason",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.campaigns", rows.campaigns, [
      "id",
      "chapter_id",
      "campaign_template_id",
      "name",
      "slug",
      "objective",
      "status",
      "semester",
      "academic_year",
      "opened_by",
      "opened_at",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.phases", rows.phases, [
      "id",
      "chapter_id",
      "campaign_id",
      "phase_template_id",
      "title",
      "objective",
      "starts_at",
      "ends_at",
      "status",
      "readiness_status",
      "coach_validation_status",
      "required_outputs",
      "entry_criteria",
      "exit_criteria",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.action_committees", rows.actionCommittees, [
      "id",
      "chapter_id",
      "name",
      "committee_type",
      "status",
      "chair_user_id",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.action_templates", rows.actionTemplates, [
      "id",
      "chapter_id",
      "campaign_id",
      "title",
      "instructions",
      "default_owner_role_key",
      "evidence_required",
      "points",
      "kpi_key",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.assignments", rows.assignments, [
      "id",
      "chapter_id",
      "campaign_id",
      "phase_id",
      "action_template_id",
      "action_committee_id",
      "chapter_event_id",
      "title",
      "instructions",
      "assigned_to_user_id",
      "assigned_to_role_key",
      "assigned_by_user_id",
      "status",
      "due_at",
      "evidence_required",
      "points",
      "kpi_key",
      "priority",
      "expected_output",
      "support_role_labels",
      "late_next_step",
      "risk_flagged",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.campaign_role_assignments", rows.campaignRoleAssignments, [
      "id",
      "chapter_id",
      "campaign_id",
      "user_id",
      "role_key",
      "role_label",
      "lane",
      "status",
      "starts_at",
      "ends_at",
      "assigned_by",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.phase_readiness_reviews", rows.phaseReadinessReviews, [
      "id",
      "chapter_id",
      "campaign_id",
      "phase_id",
      "reviewer_user_id",
      "readiness_status",
      "decision_note",
      "blocker_summary",
      "reviewed_at",
      "created_at",
    ]),
    buildInsertSql("app.risk_flags", rows.riskFlags, [
      "id",
      "chapter_id",
      "campaign_id",
      "phase_id",
      "assignment_id",
      "chapter_event_id",
      "severity",
      "visibility",
      "signal",
      "root_cause",
      "owner_user_id",
      "response_plan",
      "status",
      "due_at",
      "created_by",
      "resolved_at",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql(
      "app.chapter_events",
      rows.chapterEvents.map((event) => ({
        ...event,
        luma_event_link_id: null,
      })),
      [
        "id",
        "chapter_id",
        "campaign_id",
        "phase_id",
        "action_committee_id",
        "assignment_id",
        "title",
        "event_type",
        "status",
        "planned_by_user_id",
        "owner_user_id",
        "starts_at",
        "ends_at",
        "promotion_summary",
        "attendance_count",
        "eligible_member_count",
        "attendance_rate",
        "nps_score",
        "feedback_summary",
        "warehouse_status",
        "luma_event_link_id",
        "created_at",
        "updated_at",
      ],
    ),
    buildInsertSql("app.luma_event_links", rows.lumaEventLinks, [
      "id",
      "chapter_id",
      "campaign_id",
      "phase_id",
      "chapter_event_id",
      "luma_event_id",
      "luma_event_url",
      "status",
      "linked_by",
      "linked_at",
      "last_imported_at",
      "created_at",
      "updated_at",
    ]),
    ...rows.chapterEvents
      .filter((event) => event.luma_event_link_id)
      .map(
        (event) =>
          `update app.chapter_events set luma_event_link_id = ${sqlValue(
            event.luma_event_link_id,
          )} where id = ${sqlValue(event.id)};`,
      ),
    buildInsertSql("app.evidence_items", rows.evidenceItems, [
      "id",
      "assignment_id",
      "chapter_id",
      "chapter_event_id",
      "submitted_by_user_id",
      "evidence_type",
      "summary",
      "url",
      "storage_path",
      "target_audiences",
      "proof_categories",
      "messenger_type",
      "lifecycle_stage",
      "hesitation_addressed",
      "status",
      "sharing_status",
      "nps_score",
      "activity_label",
      "submitted_at",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.approvals", rows.approvals, [
      "id",
      "evidence_item_id",
      "chapter_id",
      "reviewer_user_id",
      "decision",
      "review_type",
      "note",
      "reviewed_at",
      "created_at",
    ]),
    buildInsertSql("app.points_events", rows.pointsEvents, [
      "id",
      "chapter_id",
      "campaign_id",
      "assignment_id",
      "chapter_event_id",
      "evidence_item_id",
      "approval_id",
      "awarded_to_user_id",
      "points_delta",
      "reason",
      "created_by",
      "created_at",
    ]),
    buildInsertSql("app.kpi_events", rows.kpiEvents, [
      "id",
      "chapter_id",
      "campaign_id",
      "phase_id",
      "assignment_id",
      "chapter_event_id",
      "evidence_item_id",
      "metric_key",
      "metric_value",
      "unit",
      "source",
      "created_by",
      "created_at",
    ]),
    buildInsertSql("app.events", rows.events, [
      "id",
      "event_type",
      "actor_user_id",
      "chapter_id",
      "campaign_id",
      "assignment_id",
      "chapter_event_id",
      "payload",
      "correlation_id",
      "occurred_at",
      "created_at",
    ]),
    buildInsertSql("app.integration_events", rows.integrationEvents, [
      "id",
      "source_event_id",
      "chapter_id",
      "event_type",
      "destination",
      "external_object_type",
      "external_object_id",
      "status",
      "payload",
      "created_by",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.automation_outbox", rows.automationOutbox, [
      "id",
      "source_event_id",
      "integration_event_id",
      "chapter_id",
      "destination",
      "event_type",
      "payload",
      "idempotency_key",
      "status",
      "attempt_count",
      "available_at",
      "locked_at",
      "sent_at",
      "last_error",
      "created_at",
      "updated_at",
    ]),
    buildInsertSql("app.audit_logs", rows.auditLogs, [
      "id",
      "actor_user_id",
      "chapter_id",
      "action",
      "target_table",
      "target_id",
      "before_value",
      "after_value",
      "reason",
      "created_at",
    ]),
    "",
    "commit;",
    "",
  ].join("\n\n");
}

export function buildTestProductionCleanupSql(
  environment = getTestProductionSeedEnvironment(),
) {
  void environment;

  return [
    "-- myMEDLIFE Test Production cleanup",
    "-- Removes only Test-prefixed/fake example.com seed data.",
    "begin;",
    "",
    "delete from app.automation_outbox where idempotency_key like 'test-production:%' or payload->>'seed_family' = 'test_production_v1';",
    "delete from app.integration_events where payload->>'seed_family' = 'test_production_v1' or event_type like 'test_%';",
    "delete from app.events where payload->>'seed_family' = 'test_production_v1' or event_type like 'test_%';",
    "delete from app.audit_logs where reason like 'Test production seed%' or action like 'test_%';",
    "delete from app.points_events where reason like 'Test %';",
    "delete from app.kpi_events where source = 'test_production_seed';",
    "delete from app.approvals where note like 'Test %';",
    "delete from app.evidence_items where summary like 'Test %' or activity_label like 'Test %';",
    "delete from app.luma_event_links where luma_event_id like 'test-%' or luma_event_url like 'https://lu.ma/test-%';",
    "update app.chapter_events set luma_event_link_id = null where title like 'Test %';",
    "delete from app.chapter_events where title like 'Test %';",
    "delete from app.risk_flags where signal like 'Test %' or response_plan like 'Test %';",
    "delete from app.phase_readiness_reviews where decision_note like 'Test %';",
    "delete from app.campaign_role_assignments where role_label like 'Test %' or lane like 'test_%';",
    "delete from app.assignments where title like 'Test %';",
    "delete from app.action_templates where title like 'Test %';",
    "delete from app.action_committees where name like 'Test %';",
    "delete from app.phases where title like 'Test %';",
    "delete from app.campaigns where name like 'Test %';",
    "delete from app.coach_chapter_assignments where handoff_reason like 'Test %' or chapter_id in (select id from app.chapters where name like 'Test %');",
    "delete from app.memberships where chapter_id in (select id from app.chapters where name like 'Test %') or user_id in (select id from app.profiles where display_name like 'Test %' or email like 'test.%@example.com');",
    "delete from app.staff_role_assignments where user_id in (select id from app.profiles where display_name like 'Test %' or email like 'test.%@example.com');",
    "delete from app.chapters where name like 'Test %';",
    "delete from app.profiles where display_name like 'Test %' or email like 'test.%@example.com';",
    "delete from auth.identities where provider = 'email' and provider_id like 'test.%@example.com';",
    "delete from auth.users where email like 'test.%@example.com' or raw_user_meta_data->>'name' like 'Test %';",
    "",
    "commit;",
    "",
  ].join("\n");
}

export function formatTestProductionSeedValidation(validation: TestProductionSeedValidation) {
  return [
    `Test production seed packet: ${validation.ready ? "READY" : "NOT READY"}`,
    "",
    ...validation.checks.map((check) => {
      const status = check.passed ? "PASS" : "FAIL";
      return `${status} ${check.key}: ${check.message}`;
    }),
  ].join("\n");
}

function createStaffUsers() {
  return staffUsers.map((user) => ({
    ...user,
    authUser: toAuthUser(user.key, user.displayName, user.email),
  }));
}

function createChapterUsers(scenario: TestChapterScenario): ChapterUserSet {
  const chapterName = scenario.name.replace(/^Test /, "");
  const roleUser = (role: string, index: number) =>
    toAuthUser(
      `${scenario.key}:${role}`,
      `Test ${chapterName} ${role} ${fakeFirstNames[index % fakeFirstNames.length]}`,
      `test.${scenario.shortCode}.${role.toLowerCase().replaceAll(" ", ".")}.${
        fakeFirstNames[index % fakeFirstNames.length].toLowerCase()
      }@example.com`,
    );
  const committeeChairs: Record<TestCommitteeKey, TestAuthUser | undefined> = {
    "safe-homes": undefined,
    "moving-mountains": undefined,
    "slt-prep": undefined,
    recruitment: undefined,
    fundraising: undefined,
    advocacy: undefined,
    events: undefined,
    "social-media": undefined,
    "community-building": undefined,
  };

  scenario.committeeKeys.forEach((committeeKey, index) => {
    const committee = committeeCatalog[committeeKey];
    committeeChairs[committeeKey] = toAuthUser(
      `${scenario.key}:${committeeKey}:chair`,
      `Test ${chapterName} ${committee.name.replace(/^Test /, "")} Chair ${
        fakeFirstNames[(index + 2) % fakeFirstNames.length]
      }`,
      `test.${scenario.shortCode}.${committeeKey}.chair@example.com`,
    );
  });

  return {
    president: roleUser("President", 0),
    vicePresident: roleUser("Vice President", 1),
    secretary: roleUser("Secretary", 2),
    treasurer: roleUser("Treasurer", 3),
    committeeChairs,
    committeeMembers: [0, 1, 2].map((index) =>
      toAuthUser(
        `${scenario.key}:committee-member:${index}`,
        `Test ${chapterName} Committee Member ${fakeFirstNames[(index + 8) % fakeFirstNames.length]}`,
        `test.${scenario.shortCode}.committee.member.${index + 1}@example.com`,
      ),
    ),
    generalMembers: [0, 1, 2, 3].map((index) =>
      toAuthUser(
        `${scenario.key}:general-member:${index}`,
        `Test ${chapterName} General Member ${fakeFirstNames[(index + 14) % fakeFirstNames.length]}`,
        `test.${scenario.shortCode}.general.member.${index + 1}@example.com`,
      ),
    ),
  };
}

function getChapterAuthUsers(users: ChapterUserSet) {
  return [
    users.president,
    users.vicePresident,
    users.secretary,
    users.treasurer,
    ...Object.values(users.committeeChairs).filter(Boolean),
    ...users.committeeMembers,
    ...users.generalMembers,
  ] as TestAuthUser[];
}

function toAuthUser(key: string, displayName: string, email: string): TestAuthUser {
  return {
    id: testUuid(`auth-user:${key}`),
    email,
    displayName,
    password: TEST_PRODUCTION_SEED_PASSWORD,
  };
}

function toProfileRow(user: TestAuthUser): ProfileRow {
  return {
    id: user.id,
    display_name: user.displayName,
    email: user.email,
    status: "active",
    created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
  };
}

function toChapterRow(scenario: TestChapterScenario, createdBy: Uuid | null): ChapterRow {
  return {
    id: testUuid(`chapter:${scenario.key}`),
    name: scenario.name,
    campus: scenario.campus,
    region: scenario.region,
    status: "active",
    created_by: createdBy,
    created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
  };
}

function toCampaignRow(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  openedBy: Uuid | null,
): CampaignRow {
  return {
    id: testUuid(`campaign:${scenario.key}:rush-month`),
    chapter_id: chapterId,
    campaign_template_id: null,
    name: "Test Rush Month",
    slug: `test-rush-month-${scenario.shortCode}`,
    objective: `Test ${scenario.name} event, RSVP, attendance, points, and evidence loop.`,
    status: "active",
    semester: "Test Fall",
    academic_year: "2026-2027",
    opened_by: openedBy,
    opened_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
  };
}

function toPhaseRow(scenario: TestChapterScenario, chapterId: Uuid, campaignId: Uuid): PhaseRow {
  return {
    id: testUuid(`phase:${scenario.key}:rush-month`),
    chapter_id: chapterId,
    campaign_id: campaignId,
    phase_template_id: null,
    title: "Test Rush Month Execution Phase",
    objective: `Test ${scenario.scenario}`,
    starts_at: "2026-07-01T12:00:00.000Z",
    ends_at: "2026-08-15T12:00:00.000Z",
    status: scenario.riskSeverity === "low" ? "active" : "not_started",
    readiness_status: scenario.riskSeverity === "high" ? "blocked" : "ready",
    coach_validation_status: scenario.riskSeverity === "low" ? "validated" : "pending",
    required_outputs: [
      "Test Luma event",
      "Test RSVP readback",
      "Test attendance proof",
      "Test points review",
    ],
    entry_criteria: ["Test leadership owner assigned", "Test Luma calendar mapped"],
    exit_criteria: ["Test attendance imported", "Test leaderboard updated"],
    created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
  };
}

function toMembershipRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  users: ChapterUserSet,
  approvedBy: Uuid | null,
): MembershipRow[] {
  const rows: Array<{ user: TestAuthUser; role: DatabaseRoleKey; status?: MembershipRow["status"] }> = [
    { user: users.president, role: "president_vp" },
    { user: users.vicePresident, role: "president_vp" },
    { user: users.secretary, role: "e_board_member" },
    { user: users.treasurer, role: "e_board_member" },
    ...Object.values(users.committeeChairs)
      .filter((user): user is TestAuthUser => Boolean(user))
      .map((user) => ({ user, role: "action_committee_chair" as const })),
    ...users.committeeMembers.map((user) => ({ user, role: "action_committee_member" as const })),
    ...users.generalMembers.map((user, index) => ({
      user,
      role: "general_member" as const,
      status: index === 3 && scenario.key === "mcgill" ? ("requested" as const) : undefined,
    })),
  ];

  return rows.map((row) => ({
    id: testUuid(`membership:${scenario.key}:${row.user.email}:${row.role}`),
    user_id: row.user.id,
    chapter_id: chapterId,
    role_key: row.role,
    status: row.status ?? "approved",
    requested_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    approved_at: row.status === "requested" ? null : TEST_PRODUCTION_SEED_TIMESTAMP,
    approved_by: row.status === "requested" ? null : approvedBy,
    created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
  }));
}

function toCampaignRoleAssignments(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  campaignId: Uuid,
  users: ChapterUserSet,
  assignedBy: Uuid | null,
): CampaignRoleAssignmentRow[] {
  return scenario.committeeKeys.map((committeeKey) => {
    const committee = committeeCatalog[committeeKey];
    const chair = users.committeeChairs[committeeKey] ?? users.president;
    return {
      id: testUuid(`campaign-role:${scenario.key}:${committeeKey}`),
      chapter_id: chapterId,
      campaign_id: campaignId,
      user_id: chair.id,
      role_key: `${committee.committeeType}_chair`,
      role_label: `${committee.name} Chair`,
      lane: `test_${committee.lane}`,
      status: "active",
      starts_at: "2026-07-01",
      ends_at: null,
      assigned_by: assignedBy,
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
      updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    };
  });
}

function toCoachAssignments(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  salesCoachId: Uuid | undefined,
  supportCoachId: Uuid | undefined,
  assignedBy: Uuid | undefined,
): CoachChapterAssignmentRow[] {
  return [
    {
      id: testUuid(`coach-assignment:${scenario.key}:sales`),
      coach_user_id: salesCoachId ?? testUuid("missing-sales-coach"),
      chapter_id: chapterId,
      coach_type: "portfolio",
      status: "active",
      starts_at: "2026-07-01",
      ends_at: null,
      assigned_by: assignedBy ?? null,
      handoff_reason: `Test ${scenario.name} is included in the event and points pilot portfolio.`,
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
      updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    },
    ...(scenario.riskSeverity === "high"
      ? [
          {
            id: testUuid(`coach-assignment:${scenario.key}:support`),
            coach_user_id: supportCoachId ?? testUuid("missing-support-coach"),
            chapter_id: chapterId,
            coach_type: "expansion" as const,
            status: "active" as const,
            starts_at: "2026-07-01",
            ends_at: null,
            assigned_by: assignedBy ?? null,
            handoff_reason: `Test ${scenario.name} needs coach reminder coverage for overdue work.`,
            created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
            updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
          },
        ]
      : []),
  ];
}

function toCommitteeRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  users: ChapterUserSet,
): TestActionCommitteeRow[] {
  return scenario.committeeKeys.map((committeeKey) => {
    const committee = committeeCatalog[committeeKey];
    return {
      id: testUuid(`committee:${scenario.key}:${committeeKey}`),
      chapter_id: chapterId,
      name: committee.name,
      committee_type: committee.committeeType,
      status: "active",
      chair_user_id: users.committeeChairs[committeeKey]?.id ?? null,
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
      updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    };
  });
}

function toActionTemplateRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  campaignId: Uuid,
): TestActionTemplateRow[] {
  return [
    {
      id: testUuid(`template:${scenario.key}:event`),
      chapter_id: chapterId,
      campaign_id: campaignId,
      title: "Test Create Luma event and RSVP plan",
      instructions: "Test create the event, confirm the Luma link, and publish the RSVP path.",
      default_owner_role_key: "action_committee_chair",
      evidence_required: "Test Luma link, RSVP goal, and owner note.",
      points: 30,
      kpi_key: "test_luma_event_created",
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
      updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    },
    {
      id: testUuid(`template:${scenario.key}:attendance`),
      chapter_id: chapterId,
      campaign_id: campaignId,
      title: "Test Confirm attendance and points",
      instructions: "Test verify who attended and document the points award.",
      default_owner_role_key: "e_board_member",
      evidence_required: "Test attendance list or event check-in screenshot.",
      points: 25,
      kpi_key: "test_attendance_confirmed",
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
      updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    },
    {
      id: testUuid(`template:${scenario.key}:proof`),
      chapter_id: chapterId,
      campaign_id: campaignId,
      title: "Test Submit event proof recap",
      instructions: "Test submit a story, photo, or reflection from the event.",
      default_owner_role_key: "general_member",
      evidence_required: "Test photo, URL, document, video, or written reflection.",
      points: 20,
      kpi_key: "test_proof_submitted",
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
      updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    },
  ];
}

function toAssignmentRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  campaignId: Uuid,
  phaseId: Uuid,
  users: ChapterUserSet,
  committees: TestActionCommitteeRow[],
  templates: TestActionTemplateRow[],
): AssignmentRow[] {
  const assignees = [
    users.president,
    users.vicePresident,
    users.committeeMembers[0],
    users.generalMembers[0],
    users.generalMembers[1],
  ];
  const priorities: AssignmentPriority[] = ["high", "urgent", "normal", "low", "high"];

  return scenario.assignmentStatuses.map((status, index) => {
    const committee = committees[index % committees.length];
    const template = templates[index % templates.length];
    return {
      id: testUuid(`assignment:${scenario.key}:${index}`),
      chapter_id: chapterId,
      campaign_id: campaignId,
      phase_id: phaseId,
      action_template_id: template.id,
      action_committee_id: committee.id,
      chapter_event_id: null,
      title: assignmentTitle(index),
      instructions: assignmentInstructions(index, scenario.name),
      assigned_to_user_id: assignees[index]?.id ?? users.president.id,
      assigned_to_role_key: index < 2 ? "action_committee_chair" : "general_member",
      assigned_by_user_id: users.president.id,
      status,
      due_at: dueAt(index, scenario.riskSeverity),
      evidence_required: template.evidence_required,
      points: template.points + index * 5,
      kpi_key: template.kpi_key,
      priority: priorities[index],
      expected_output: `Test ${scenario.name} has a reviewable output for ${assignmentTitle(index).toLowerCase()}.`,
      support_role_labels: ["Test President", "Test Sales Coach"],
      late_next_step:
        status === "not_started" || status === "changes_requested"
          ? `Test coach follows up with ${scenario.name} owner before the next event.`
          : null,
      risk_flagged: scenario.riskSeverity === "high" && index < 2,
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
      updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    };
  });
}

function toChapterEventRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  campaignId: Uuid,
  phaseId: Uuid,
  committees: TestActionCommitteeRow[],
  assignments: AssignmentRow[],
  users: ChapterUserSet,
): ChapterEventRow[] {
  const statuses: ChapterEventStatus[] =
    scenario.key === "mcgill"
      ? ["planning", "idea"]
      : scenario.key === "duke"
        ? ["published", "completed"]
        : ["feedback_collected", "published"];

  return [0, 1].map((index) => {
    const attendance = Math.max(0, scenario.eventHealth.attended - index * 9);
    const eligible = scenario.eventHealth.eligibleMembers;
    return {
      id: testUuid(`chapter-event:${scenario.key}:${index}`),
      chapter_id: chapterId,
      campaign_id: campaignId,
      phase_id: phaseId,
      action_committee_id: committees[index % committees.length]?.id ?? null,
      assignment_id: assignments[index]?.id ?? null,
      title:
        index === 0
          ? `Test ${scenario.name} Luma RSVP Night`
          : `Test ${scenario.name} Attendance and Points Review`,
      event_type: index === 0 ? "luma_rsvp" : "attendance_review",
      status: statuses[index],
      planned_by_user_id: users.president.id,
      owner_user_id: users.vicePresident.id,
      starts_at: index === 0 ? "2026-07-18T23:00:00.000Z" : "2026-07-25T23:00:00.000Z",
      ends_at: index === 0 ? "2026-07-19T01:00:00.000Z" : "2026-07-26T01:00:00.000Z",
      promotion_summary: `Test ${scenario.name} event promotion is visible in member, leader, and staff review.`,
      attendance_count: attendance,
      eligible_member_count: eligible,
      attendance_rate: roundRate(attendance, eligible),
      nps_score: scenario.eventHealth.nps,
      feedback_summary: `Test ${scenario.name} attendees can be reviewed for points and follow-up.`,
      warehouse_status: "disabled",
      luma_event_link_id: testUuid(`luma-link:${scenario.key}:${index}`),
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
      updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    };
  });
}

function toLumaEventLinks(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  campaignId: Uuid,
  phaseId: Uuid,
  events: ChapterEventRow[],
): LumaEventLinkRow[] {
  return events.map((event, index) => ({
    id: event.luma_event_link_id ?? testUuid(`luma-link:${scenario.key}:${index}`),
    chapter_id: chapterId,
    campaign_id: campaignId,
    phase_id: phaseId,
    chapter_event_id: event.id,
    luma_event_id: `test-luma-${scenario.shortCode}-${index + 1}`,
    luma_event_url: `https://lu.ma/test-${scenario.shortCode}-${index + 1}`,
    status: "mocked",
    linked_by: event.planned_by_user_id,
    linked_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    last_imported_at: index === 0 ? TEST_PRODUCTION_SEED_TIMESTAMP : null,
    created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
  }));
}

function toEvidenceRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  assignments: AssignmentRow[],
  events: ChapterEventRow[],
  users: ChapterUserSet,
): EvidenceItemRow[] {
  const evidenceTypes: EvidenceType[] = ["event_photo", "external_link", "testimonial_text"];

  return scenario.evidenceStatuses.map((status, index) => ({
    id: testUuid(`evidence:${scenario.key}:${index}`),
    assignment_id: assignments[index]?.id ?? null,
    chapter_id: chapterId,
    chapter_event_id: events[index % events.length]?.id ?? null,
    submitted_by_user_id: users.generalMembers[index % users.generalMembers.length]?.id ?? users.president.id,
    evidence_type: evidenceTypes[index],
    summary: evidenceSummary(status, scenario.name, index),
    url: index === 1 ? `https://example.com/test-${scenario.shortCode}-proof-${index + 1}` : null,
    storage_path: index === 0 ? `test/${scenario.shortCode}/event-photo-${index + 1}.jpg` : null,
    target_audiences: ["student", "chapter_leader", "staff"],
    proof_categories: ["test_event", "test_points", "test_follow_up"],
    messenger_type: "student",
    lifecycle_stage: "test_rush_month",
    hesitation_addressed: "Test will I find friends and earn points for showing up?",
    status,
    sharing_status:
      status === "approved"
        ? "approved_for_sharing"
        : status === "rejected"
          ? "not_shared"
          : "submitted",
    nps_score: scenario.eventHealth.nps,
    activity_label: `Test ${scenario.name} proof item ${index + 1}`,
    submitted_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
  }));
}

function toApprovalRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  evidence: EvidenceItemRow[],
  reviewerId: Uuid,
): ApprovalRow[] {
  return evidence
    .filter((item) => item.status !== "pending_review")
    .map((item) => ({
      id: testUuid(`approval:${scenario.key}:${item.id}`),
      evidence_item_id: item.id,
      chapter_id: chapterId,
      reviewer_user_id: reviewerId,
      decision:
        item.status === "approved"
          ? "approved_for_sharing"
          : item.status === "changes_requested"
            ? "changes_requested"
            : "not_shared",
      review_type: "test_leader_and_hq_review",
      note: `Test reviewer note for ${scenario.name}: ${approvalNote(item.status)}.`,
      reviewed_at: TEST_PRODUCTION_SEED_TIMESTAMP,
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    }));
}

function toPointsRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  campaignId: Uuid,
  assignments: AssignmentRow[],
  events: ChapterEventRow[],
  evidence: EvidenceItemRow[],
  approvals: ApprovalRow[],
  users: ChapterUserSet,
): PointsEventRow[] {
  const recipients = [
    users.president,
    users.vicePresident,
    users.committeeMembers[0],
    users.generalMembers[0],
    users.generalMembers[1],
  ];

  return recipients.map((recipient, index) => ({
    id: testUuid(`points:${scenario.key}:${recipient.email}`),
    chapter_id: chapterId,
    campaign_id: campaignId,
    assignment_id: assignments[index % assignments.length]?.id ?? null,
    chapter_event_id: events[index % events.length]?.id ?? null,
    evidence_item_id: evidence[index % evidence.length]?.id ?? null,
    approval_id: approvals[index % Math.max(approvals.length, 1)]?.id ?? null,
    awarded_to_user_id: recipient.id,
    points_delta: scenario.basePoints + index * 37,
    reason: `Test ${scenario.name} points for event attendance, proof, and follow-up.`,
    created_by: users.president.id,
    created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
  }));
}

function toKpiRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  campaignId: Uuid,
  phaseId: Uuid,
  assignments: AssignmentRow[],
  events: ChapterEventRow[],
  evidence: EvidenceItemRow[],
): KpiEventRow[] {
  return [
    {
      metric_key: "test_rsvps",
      metric_value: scenario.eventHealth.rsvps,
      unit: "people",
    },
    {
      metric_key: "test_attendance",
      metric_value: scenario.eventHealth.attended,
      unit: "people",
    },
    {
      metric_key: "test_points",
      metric_value: scenario.basePoints,
      unit: "points",
    },
    {
      metric_key: "test_member_scale",
      metric_value: scenario.memberScale,
      unit: "members",
    },
  ].map((metric, index) => ({
    id: testUuid(`kpi:${scenario.key}:${metric.metric_key}`),
    chapter_id: chapterId,
    campaign_id: campaignId,
    phase_id: phaseId,
    assignment_id: assignments[index % assignments.length]?.id ?? null,
    chapter_event_id: events[index % events.length]?.id ?? null,
    evidence_item_id: evidence[index % evidence.length]?.id ?? null,
    metric_key: metric.metric_key,
    metric_value: metric.metric_value,
    unit: metric.unit,
    source: "test_production_seed",
    created_by: null,
    created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
  }));
}

function toActivityRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  campaignId: Uuid,
  assignments: AssignmentRow[],
  events: ChapterEventRow[],
  users: ChapterUserSet,
): EventRow[] {
  const activity = [
    {
      type: "test_feed_post",
      actor: users.president,
      title: `Test ${scenario.name} celebrated event attendance`,
    },
    {
      type: "test_comment",
      actor: users.generalMembers[0],
      title: `Test ${scenario.name} member commented on earning points`,
    },
    {
      type: "test_notification",
      actor: users.vicePresident,
      title: `Test ${scenario.name} leader notification for proof review`,
    },
    {
      type: "test_task_update",
      actor: users.committeeMembers[0],
      title: `Test ${scenario.name} task status changed for coach visibility`,
    },
  ];

  return activity.map((item, index) => ({
    id: testUuid(`activity:${scenario.key}:${item.type}`),
    event_type: item.type,
    actor_user_id: item.actor.id,
    chapter_id: chapterId,
    campaign_id: campaignId,
    assignment_id: assignments[index % assignments.length]?.id ?? null,
    chapter_event_id: events[index % events.length]?.id ?? null,
    payload: {
      seed_family: TEST_PRODUCTION_SEED_FAMILY,
      title: item.title,
      body: `Test ${scenario.scenario}`,
    },
    correlation_id: `test-production:${scenario.key}:${item.type}`,
    occurred_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
  }));
}

function toIntegrationRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  recentEvents: EventRow[],
  createdBy: Uuid | null,
): IntegrationEventRow[] {
  return ["luma", "hubspot"].map((destination, index) => ({
    id: testUuid(`integration:${scenario.key}:${destination}`),
    source_event_id: recentEvents[index]?.id ?? null,
    chapter_id: chapterId,
    event_type:
      destination === "luma"
        ? "test_luma_attendance_import_mocked"
        : "test_hubspot_lead_score_blocked",
    destination: destination as "luma" | "hubspot",
    external_object_type: destination === "luma" ? "event" : "contact",
    external_object_id: destination === "luma" ? `test-luma-${scenario.shortCode}` : null,
    status: destination === "luma" ? "mocked" : "disabled",
    payload: {
      seed_family: TEST_PRODUCTION_SEED_FAMILY,
      liveWrite: false,
      summary: `Test ${scenario.name} ${destination} posture stays mock-safe.`,
    },
    created_by: createdBy,
    created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
  }));
}

function toOutboxRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  recentIntegrationEvents: IntegrationEventRow[],
): AutomationOutboxRow[] {
  return recentIntegrationEvents.map((event) => ({
    id: testUuid(`outbox:${scenario.key}:${event.destination}`),
    source_event_id: event.source_event_id,
    integration_event_id: event.id,
    chapter_id: chapterId,
    destination: event.destination,
    event_type: event.event_type,
    payload: {
      seed_family: TEST_PRODUCTION_SEED_FAMILY,
      liveWrite: false,
      reason: `Test ${scenario.name} outbox row is disabled for production testing.`,
    },
    idempotency_key: `test-production:${scenario.key}:${event.destination}`,
    status: "disabled",
    attempt_count: 0,
    available_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    locked_at: null,
    sent_at: null,
    last_error: null,
    created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
  }));
}

function toRiskRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  campaignId: Uuid,
  phaseId: Uuid,
  assignments: AssignmentRow[],
  ownerUserId: Uuid | undefined,
  createdBy: Uuid | undefined,
): RiskFlagRow[] {
  return [
    {
      id: testUuid(`risk:${scenario.key}:event-points`),
      chapter_id: chapterId,
      campaign_id: campaignId,
      phase_id: phaseId,
      assignment_id: assignments.find((assignment) => assignment.risk_flagged)?.id ?? null,
      chapter_event_id: null,
      severity: scenario.riskSeverity,
      visibility: scenario.riskSeverity === "high" ? "coach_private" : "leader_visible",
      signal: `Test ${scenario.name} event and points risk posture`,
      root_cause: `Test ${scenario.scenario}`,
      owner_user_id: ownerUserId ?? null,
      response_plan: `Test coach reviews Luma RSVP, attendance, proof, and leaderboard data before pilot onboarding.`,
      status: scenario.riskSeverity === "low" ? "watching" : "open",
      due_at: "2026-07-30T12:00:00.000Z",
      created_by: createdBy ?? null,
      resolved_at: null,
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
      updated_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    },
  ];
}

function toReadinessReviewRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  campaignId: Uuid,
  phaseId: Uuid,
  reviewerUserId: Uuid | undefined,
): PhaseReadinessReviewRow[] {
  return [
    {
      id: testUuid(`readiness:${scenario.key}:rush-month`),
      chapter_id: chapterId,
      campaign_id: campaignId,
      phase_id: phaseId,
      reviewer_user_id: reviewerUserId ?? testUuid("missing-reviewer"),
      readiness_status: scenario.riskSeverity === "high" ? "blocked" : "ready",
      decision_note: `Test ${scenario.name} readiness review reflects ${scenario.scenario.toLowerCase()}`,
      blocker_summary:
        scenario.riskSeverity === "high"
          ? `Test ${scenario.name} has overdue event or proof follow-up.`
          : null,
      reviewed_at: TEST_PRODUCTION_SEED_TIMESTAMP,
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    },
  ];
}

function toAuditRows(
  scenario: TestChapterScenario,
  chapterId: Uuid,
  leaderId: Uuid,
  adminId: Uuid | null,
  dsAdminId: Uuid | null,
): AuditLogRow[] {
  return [
    {
      id: testUuid(`audit:${scenario.key}:seed`),
      actor_user_id: dsAdminId,
      chapter_id: chapterId,
      action: "test_seed_created",
      target_table: "chapters",
      target_id: chapterId,
      before_value: null,
      after_value: {
        seed_family: TEST_PRODUCTION_SEED_FAMILY,
        chapter: scenario.name,
      },
      reason: `Test production seed created ${scenario.name}.`,
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    },
    {
      id: testUuid(`audit:${scenario.key}:review`),
      actor_user_id: adminId ?? leaderId,
      chapter_id: chapterId,
      action: "test_review_queue_populated",
      target_table: "evidence_items",
      target_id: null,
      before_value: null,
      after_value: {
        seed_family: TEST_PRODUCTION_SEED_FAMILY,
        scenario: scenario.scenario,
      },
      reason: `Test production seed populated evidence and points review data for ${scenario.name}.`,
      created_at: TEST_PRODUCTION_SEED_TIMESTAMP,
    },
  ];
}

function toChapterLoginRows(scenario: TestChapterScenario, users: ChapterUserSet): TestLogin[] {
  return [
    {
      email: users.generalMembers[0].email,
      password: TEST_PRODUCTION_SEED_PASSWORD,
      displayName: users.generalMembers[0].displayName,
      role: "general_member",
      chapterName: scenario.name,
      demonstrates: `Test member mobile app for ${scenario.name}.`,
    },
    {
      email: users.president.email,
      password: TEST_PRODUCTION_SEED_PASSWORD,
      displayName: users.president.displayName,
      role: "president_vp",
      chapterName: scenario.name,
      demonstrates: `Test student leader command center for ${scenario.name}.`,
    },
    {
      email: Object.values(users.committeeChairs).find(Boolean)?.email ?? users.vicePresident.email,
      password: TEST_PRODUCTION_SEED_PASSWORD,
      displayName:
        Object.values(users.committeeChairs).find(Boolean)?.displayName ??
        users.vicePresident.displayName,
      role: "action_committee_chair",
      chapterName: scenario.name,
      demonstrates: `Test committee owner view for ${scenario.name}.`,
    },
  ];
}

function assignmentTitle(index: number) {
  const titles = [
    "Test Create the Luma RSVP event",
    "Test Confirm attendance for points",
    "Test Submit event proof recap",
    "Test Follow up with new members",
    "Test Review leaderboard movement",
  ];
  return titles[index] ?? `Test Assignment ${index + 1}`;
}

function assignmentInstructions(index: number, chapterName: string) {
  const instructions = [
    `Test ${chapterName} creates or verifies the Luma event before sharing it with members.`,
    `Test ${chapterName} checks who attended and records the points impact.`,
    `Test ${chapterName} submits proof so leaders and staff can review what happened.`,
    `Test ${chapterName} contacts RSVP no-shows and new members after the event.`,
    `Test ${chapterName} reviews individual, committee, chapter, and organization leaderboard movement.`,
  ];
  return instructions[index] ?? `Test ${chapterName} completes one launch-lane task.`;
}

function dueAt(index: number, severity: RiskSeverity) {
  if (severity === "high" && index < 2) {
    return "2026-07-01T12:00:00.000Z";
  }

  const dates = [
    "2026-07-12T12:00:00.000Z",
    "2026-07-15T12:00:00.000Z",
    "2026-07-20T12:00:00.000Z",
    "2026-07-25T12:00:00.000Z",
    "2026-07-30T12:00:00.000Z",
  ];
  return dates[index] ?? null;
}

function evidenceSummary(status: EvidenceStatus, chapterName: string, index: number) {
  const statusCopy: Record<EvidenceStatus, string> = {
    pending_review: "pending leader review",
    approved: "approved for points and sharing",
    rejected: "rejected with a coach note",
    changes_requested: "returned for revision",
  };

  return `Test ${chapterName} evidence ${index + 1} is ${statusCopy[status]}.`;
}

function approvalNote(status: EvidenceStatus) {
  switch (status) {
    case "approved":
      return "Test approved because attendance and consent details were clear";
    case "changes_requested":
      return "Test returned because the proof needs clearer attendance context";
    case "rejected":
      return "Test rejected because the proof should not be shared";
    case "pending_review":
      return "Test pending";
  }
}

function roundRate(value: number, total: number) {
  return Number((value / Math.max(total, 1)).toFixed(4));
}

function testUuid(seed: string): Uuid {
  const hex = stableHex(seed);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(
    17,
    20,
  )}-${hex.slice(20, 32)}`;
}

function stableHex(input: string) {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  let h3 = 0x9e3779b9 ^ input.length;
  let h4 = 0x85ebca6b ^ input.length;

  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
    h3 = Math.imul(h3 ^ code, 2246822507);
    h4 = Math.imul(h4 ^ code, 3266489909);
  }

  return [h1, h2, h3, h4]
    .map((value) => (value >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

function getVisibleSeedLabels(environment: TestProductionSeedEnvironment) {
  const rows = environment.rows;
  return [
    ...rows.profiles.map((row) => row.display_name),
    ...rows.chapters.map((row) => row.name),
    ...rows.campaigns.map((row) => row.name),
    ...rows.phases.map((row) => row.title),
    ...rows.actionCommittees.map((row) => row.name),
    ...rows.actionTemplates.flatMap((row) => [
      row.title,
      row.instructions,
      row.evidence_required,
    ]),
    ...rows.assignments.flatMap((row) => [
      row.title,
      row.instructions,
      row.evidence_required,
      row.expected_output ?? "Test expected output",
      row.late_next_step ?? "Test next step",
    ]),
    ...rows.chapterEvents.flatMap((row) => [
      row.title,
      row.promotion_summary ?? "Test promotion",
      row.feedback_summary ?? "Test feedback",
    ]),
    ...rows.evidenceItems.flatMap((row) => [
      row.summary,
      row.activity_label ?? "Test activity",
      row.hesitation_addressed ?? "Test hesitation",
    ]),
    ...rows.approvals.map((row) => row.note),
    ...rows.pointsEvents.map((row) => row.reason),
    ...rows.riskFlags.flatMap((row) => [
      row.signal,
      row.root_cause ?? "Test root cause",
      row.response_plan,
    ]),
    ...rows.phaseReadinessReviews.flatMap((row) => [
      row.decision_note,
      row.blocker_summary ?? "Test blocker",
    ]),
  ];
}

function buildAuthUsersSql(users: TestAuthUser[]) {
  const values = users.map((user) =>
    [
      sqlValue("00000000-0000-0000-0000-000000000000"),
      sqlValue(user.id),
      sqlValue("authenticated"),
      sqlValue("authenticated"),
      sqlValue(user.email),
      `crypt(${sqlValue(user.password)}, gen_salt('bf'))`,
      sqlValue(TEST_PRODUCTION_SEED_TIMESTAMP),
      sqlJson({ provider: "email", providers: ["email"] }),
      sqlJson({ name: user.displayName, seed_family: TEST_PRODUCTION_SEED_FAMILY }),
      sqlValue(TEST_PRODUCTION_SEED_TIMESTAMP),
      sqlValue(TEST_PRODUCTION_SEED_TIMESTAMP),
    ].join(", "),
  );

  return [
    "insert into auth.users (",
    "  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,",
    "  raw_app_meta_data, raw_user_meta_data, created_at, updated_at",
    ") values",
    values.map((value) => `  (${value})`).join(",\n"),
    "on conflict (id) do update set",
    "  email = excluded.email,",
    "  encrypted_password = excluded.encrypted_password,",
    "  email_confirmed_at = excluded.email_confirmed_at,",
    "  raw_app_meta_data = excluded.raw_app_meta_data,",
    "  raw_user_meta_data = excluded.raw_user_meta_data,",
    "  updated_at = excluded.updated_at",
    "where auth.users.email like 'test.%@example.com' or auth.users.raw_user_meta_data->>'name' like 'Test %';",
  ].join("\n");
}

function buildAuthIdentitiesSql(users: TestAuthUser[]) {
  const values = users.map((user) =>
    [
      sqlValue(testUuid(`auth-identity:${user.email}`)),
      sqlValue(user.email),
      sqlValue(user.id),
      sqlJson({
        sub: user.id,
        email: user.email,
        email_verified: true,
        phone_verified: false,
        seed_family: TEST_PRODUCTION_SEED_FAMILY,
      }),
      sqlValue("email"),
      sqlValue(TEST_PRODUCTION_SEED_TIMESTAMP),
      sqlValue(TEST_PRODUCTION_SEED_TIMESTAMP),
      sqlValue(TEST_PRODUCTION_SEED_TIMESTAMP),
    ].join(", "),
  );

  return [
    "insert into auth.identities (",
    "  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at",
    ") values",
    values.map((value) => `  (${value})`).join(",\n"),
    "on conflict (provider, provider_id) do update set",
    "  user_id = excluded.user_id,",
    "  identity_data = excluded.identity_data,",
    "  updated_at = excluded.updated_at;",
  ].join("\n");
}

const jsonColumns = new Set([
  "after_value",
  "before_value",
  "entry_criteria",
  "exit_criteria",
  "identity_data",
  "payload",
  "raw_app_meta_data",
  "raw_user_meta_data",
  "required_outputs",
]);

const textArrayColumns = new Set([
  "proof_categories",
  "support_role_labels",
  "target_audiences",
]);

function buildInsertSql<Row>(
  table: string,
  rows: Row[],
  columns: Array<Extract<keyof Row, string>>,
) {
  if (!rows.length) {
    return `-- No rows for ${table}`;
  }

  const values = rows.map((row) =>
    columns
      .map((column) => sqlValueForColumn(column, (row as Record<string, unknown>)[column]))
      .join(", "),
  );
  const updateColumns = columns.filter((column) => column !== "id" && column !== "created_at");

  return [
    `insert into ${table} (${columns.join(", ")}) values`,
    values.map((value) => `  (${value})`).join(",\n"),
    "on conflict (id) do update set",
    updateColumns.map((column) => `  ${column} = excluded.${column}`).join(",\n"),
    ";",
  ].join("\n");
}

function sqlValueForColumn(column: string, value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (jsonColumns.has(column)) {
    return sqlJson(value);
  }

  if (textArrayColumns.has(column)) {
    return sqlTextArray(Array.isArray(value) ? value : [value]);
  }

  return sqlValue(value);
}

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "null";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    return sqlTextArray(value);
  }

  if (typeof value === "object") {
    return sqlJson(value);
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlTextArray(value: unknown[]) {
  if (!value.length) {
    return "'{}'::text[]";
  }

  return `array[${value.map((item) => sqlValue(String(item))).join(", ")}]`;
}

function sqlJson(value: unknown) {
  return `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
}
