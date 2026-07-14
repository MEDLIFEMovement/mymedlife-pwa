import { afterEach, describe, expect, it, vi } from "vitest";

import { mapSupabaseSnapshotToAdminDirectory } from "@/services/admin-management-data";
import type {
  AuditLogRow,
  ChapterEventRow,
  ChapterRow,
  CoachChapterAssignmentRow,
  EventRow,
  KpiEventRow,
  MembershipRow,
  PointsEventRow,
  ProfileRow,
  StaffRoleAssignmentRow,
} from "@/shared/types/persistence";

type AdminSnapshot = Parameters<typeof mapSupabaseSnapshotToAdminDirectory>[0];

const now = "2026-07-04T12:00:00.000Z";

describe("admin management Supabase directory data", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/lib/supabase-readonly");
    vi.doUnmock("@/services/read-only-app-data");
    vi.doUnmock("@/services/local-actor-context");
  });

  it("maps Supabase profiles, roles, chapters, events, points, KPIs, and audit rows into admin directory records", () => {
    const directory = mapSupabaseSnapshotToAdminDirectory(
      buildAdminSnapshot({
        profiles: [
          profileRow({
            id: "00000000-0000-4000-8000-000000000101",
            display_name: "Sofia Student",
            email: "sofia.student@mymedlife.test",
          }),
          profileRow({
            id: "00000000-0000-4000-8000-000000000102",
            display_name: "Diego Director",
            email: "diego.director@mymedlife.test",
            hubspot_contact_id: "hubspot-contact-diego",
          }),
          profileRow({
            id: "00000000-0000-4000-8000-000000000103",
            display_name: "Cora Coach",
            email: "cora.coach@mymedlife.test",
          }),
          profileRow({
            id: "00000000-0000-4000-8000-000000000104",
            display_name: "Inactive Admin",
            email: "inactive.admin@mymedlife.test",
            status: "inactive",
          }),
          profileRow({
            id: "00000000-0000-4000-8000-000000000105",
            display_name: "Eva Eboard",
            email: "eva.eboard@mymedlife.test",
          }),
          profileRow({
            id: "00000000-0000-4000-8000-000000000106",
            display_name: "Pat President",
            email: "pat.president@mymedlife.test",
          }),
          profileRow({
            id: "00000000-0000-4000-8000-000000000107",
            display_name: "Dana DS",
            email: "dana.ds@mymedlife.test",
          }),
          profileRow({
            id: "00000000-0000-4000-8000-000000000108",
            display_name: "Sam Super",
            email: "sam.super@mymedlife.test",
          }),
        ],
        chapters: [
          chapterRow({
            id: "10000000-0000-4000-8000-000000000201",
            name: "UCLA MEDLIFE",
            campus: "UCLA",
            region: null,
            country: "United States",
            hubspot_company_id: "hubspot-company-ucla",
          }),
          chapterRow({
            id: "10000000-0000-4000-8000-000000000202",
            name: "Archived Chapter",
            campus: "Archived Campus",
            chapter_type: "needs_review",
            status: "inactive",
            region: "West",
          }),
        ],
        memberships: [
          membershipRow({
            id: "20000000-0000-4000-8000-000000000301",
            user_id: "00000000-0000-4000-8000-000000000101",
            chapter_id: "10000000-0000-4000-8000-000000000201",
            role_key: "general_member",
          }),
          membershipRow({
            id: "20000000-0000-4000-8000-000000000302",
            user_id: "00000000-0000-4000-8000-000000000102",
            chapter_id: "10000000-0000-4000-8000-000000000201",
            role_key: "action_committee_chair",
            role_term_start_year: 2024,
            role_term_end_year: 2025,
            role_term_label: "Action Committee Chair for 2024-2025",
          }),
          membershipRow({
            id: "20000000-0000-4000-8000-000000000303",
            user_id: "00000000-0000-4000-8000-000000000104",
            chapter_id: "10000000-0000-4000-8000-000000000201",
            role_key: "president_vp",
            status: "inactive",
            role_term_start_year: 2023,
            role_term_end_year: 2024,
            role_term_label: "President for 2023-2024",
          }),
          membershipRow({
            id: "20000000-0000-4000-8000-000000000304",
            user_id: "00000000-0000-4000-8000-000000000105",
            chapter_id: "10000000-0000-4000-8000-000000000201",
            role_key: "e_board_member",
          }),
          membershipRow({
            id: "20000000-0000-4000-8000-000000000305",
            user_id: "00000000-0000-4000-8000-000000000106",
            chapter_id: "10000000-0000-4000-8000-000000000201",
            role_key: "president_vp",
          }),
          membershipRow({
            id: "20000000-0000-4000-8000-000000000306",
            user_id: "00000000-0000-4000-8000-000000000107",
            chapter_id: "10000000-0000-4000-8000-000000000201",
            role_key: "action_committee_member",
          }),
        ],
        staffRoles: [
          staffRoleRow({
            id: "30000000-0000-4000-8000-000000000401",
            user_id: "00000000-0000-4000-8000-000000000103",
            role_key: "coach",
          }),
          staffRoleRow({
            id: "30000000-0000-4000-8000-000000000402",
            user_id: "00000000-0000-4000-8000-000000000104",
            role_key: "ds_admin",
            status: "inactive",
          }),
          staffRoleRow({
            id: "30000000-0000-4000-8000-000000000403",
            user_id: "00000000-0000-4000-8000-000000000107",
            role_key: "admin",
          }),
          staffRoleRow({
            id: "30000000-0000-4000-8000-000000000404",
            user_id: "00000000-0000-4000-8000-000000000107",
            role_key: "ds_admin",
          }),
          staffRoleRow({
            id: "30000000-0000-4000-8000-000000000405",
            user_id: "00000000-0000-4000-8000-000000000108",
            role_key: "super_admin",
          }),
        ],
        coachAssignments: [
          coachAssignmentRow({
            id: "40000000-0000-4000-8000-000000000501",
            coach_user_id: "00000000-0000-4000-8000-000000000103",
            chapter_id: "10000000-0000-4000-8000-000000000201",
          }),
        ],
        chapterEventRows: [
          chapterEventRow({
            id: "50000000-0000-4000-8000-000000000601",
            chapter_id: "10000000-0000-4000-8000-000000000201",
            status: "published",
          }),
          chapterEventRow({
            id: "50000000-0000-4000-8000-000000000602",
            chapter_id: "10000000-0000-4000-8000-000000000201",
            status: "canceled",
          }),
        ],
        eventRows: [
          eventRow({
            id: "60000000-0000-4000-8000-000000000701",
            chapter_id: "10000000-0000-4000-8000-000000000201",
          }),
        ],
        pointsEventRows: [
          pointsEventRow({
            id: "70000000-0000-4000-8000-000000000801",
            chapter_id: "10000000-0000-4000-8000-000000000201",
          }),
        ],
        kpiEventRows: [
          kpiEventRow({
            id: "80000000-0000-4000-8000-000000000901",
            chapter_id: "10000000-0000-4000-8000-000000000201",
          }),
        ],
        auditLogs: [
          auditLogRow({
            id: "90000000-0000-4000-8000-000000001001",
            chapter_id: "10000000-0000-4000-8000-000000000201",
          }),
        ],
      }),
    );

    expect(directory.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "00000000-0000-4000-8000-000000000101",
          chapterMemberships: expect.arrayContaining([
            expect.objectContaining({
              chapterId: "10000000-0000-4000-8000-000000000201",
              roleKey: "General Member",
            }),
          ]),
          inviteStatus: "accepted",
          status: "active",
        }),
        expect.objectContaining({
          id: "00000000-0000-4000-8000-000000000102",
          hubspotContactId: "hubspot-contact-diego",
          chapterMemberships: expect.arrayContaining([
            expect.objectContaining({
              chapterId: "10000000-0000-4000-8000-000000000201",
              roleKey: "Action Committee Chair",
              roleTermEndYear: 2025,
              roleTermLabel: "Action Committee Chair for 2024-2025",
              roleTermStartYear: 2024,
              status: "approved",
            }),
          ]),
        }),
        expect.objectContaining({
          id: "00000000-0000-4000-8000-000000000103",
          staffRoles: ["Coach"],
          portfolioChapterIds: ["10000000-0000-4000-8000-000000000201"],
        }),
        expect.objectContaining({
          id: "00000000-0000-4000-8000-000000000104",
          inviteStatus: "not_sent",
          status: "deactivated",
        }),
        expect.objectContaining({
          id: "00000000-0000-4000-8000-000000000105",
          chapterMemberships: expect.arrayContaining([
            expect.objectContaining({
              chapterId: "10000000-0000-4000-8000-000000000201",
              roleKey: "E-Board Member",
            }),
          ]),
        }),
        expect.objectContaining({
          id: "00000000-0000-4000-8000-000000000106",
          chapterMemberships: expect.arrayContaining([
            expect.objectContaining({
              chapterId: "10000000-0000-4000-8000-000000000201",
              roleKey: "President / VP",
            }),
          ]),
        }),
        expect.objectContaining({
          id: "00000000-0000-4000-8000-000000000107",
          chapterMemberships: expect.arrayContaining([
            expect.objectContaining({
              chapterId: "10000000-0000-4000-8000-000000000201",
              roleKey: "Action Committee Member",
            }),
          ]),
          staffRoles: ["Staff", "DS Admin"],
        }),
        expect.objectContaining({
          id: "00000000-0000-4000-8000-000000000108",
          staffRoles: ["Super Admin"],
        }),
      ]),
    );
    expect(directory.chapters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "10000000-0000-4000-8000-000000000201",
          region: "Unassigned",
          country: "United States",
          hubspotCompanyId: "hubspot-company-ucla",
          chapterType: "college_university",
          coachOwnerId: "00000000-0000-4000-8000-000000000103",
          coachAssignments: [
            expect.objectContaining({
              coachUserId: "00000000-0000-4000-8000-000000000103",
              status: "active",
            }),
          ],
          studentLeaderIds: [
            "00000000-0000-4000-8000-000000000102",
            "00000000-0000-4000-8000-000000000105",
            "00000000-0000-4000-8000-000000000106",
          ],
          studentLeaderAssignments: expect.arrayContaining([
            expect.objectContaining({
              userId: "00000000-0000-4000-8000-000000000102",
              roleKey: "Action Committee Chair",
              roleTermLabel: "Action Committee Chair for 2024-2025",
            }),
            expect.objectContaining({
              userId: "00000000-0000-4000-8000-000000000104",
              roleKey: "President / VP",
              roleTermLabel: "President for 2023-2024",
              status: "inactive",
            }),
          ]),
          activeMemberCount: 5,
          activeEventCount: 1,
          historicalRecordCount: 4,
          activeModules: ["Events", "RSVP", "Attendance", "Points"],
        }),
        expect.objectContaining({
          id: "10000000-0000-4000-8000-000000000202",
          chapterType: "needs_review",
          status: "disabled",
          region: "West",
        }),
      ]),
    );
  });

  it("keeps Supabase Auth users visible when their profile row is missing", () => {
    const directory = mapSupabaseSnapshotToAdminDirectory(
      buildAdminSnapshot({
        profiles: [
          profileRow({
            id: "00000000-0000-4000-8000-000000000201",
            display_name: "Morgan Member",
            email: "morgan.member@mymedlife.test",
          }),
        ],
        memberships: [],
        chapters: [],
        chapterEventRows: [],
        eventRows: [],
        pointsEventRows: [],
        kpiEventRows: [],
        auditLogs: [],
        staffRoles: [],
        coachAssignments: [],
      }),
      [
        {
          id: "00000000-0000-4000-8000-000000000201",
          email: "morgan.member@mymedlife.test",
          confirmed_at: now,
          email_confirmed_at: now,
        },
        {
          id: "00000000-0000-4000-8000-000000000202",
          email: "nick.admin@mymedlife.org",
          user_metadata: { full_name: "Nick Admin" },
          confirmed_at: now,
          email_confirmed_at: now,
        },
        {
          id: "00000000-0000-4000-8000-000000000203",
          email: "pending.invite@mymedlife.org",
        },
      ],
    );

    expect(directory.users).toEqual([
      expect.objectContaining({
        id: "00000000-0000-4000-8000-000000000201",
        email: "morgan.member@mymedlife.test",
        staffRoles: [],
      }),
      expect.objectContaining({
        id: "00000000-0000-4000-8000-000000000202",
        name: "Nick Admin",
        email: "nick.admin@mymedlife.org",
        status: "active",
        staffRoles: ["Auth user (profile missing)"],
        inviteStatus: "accepted",
      }),
      expect.objectContaining({
        id: "00000000-0000-4000-8000-000000000203",
        name: "pending.invite",
        status: "pending",
        staffRoles: ["Auth user (profile missing)"],
        inviteStatus: "sent",
      }),
    ]);
  });

  it("uses mock fixtures when Supabase read access is disabled", async () => {
    const directory = await loadDirectoryWithMocks({
      enabled: false,
      reason: "Readonly Supabase is intentionally off.",
    });

    expect(directory.source).toMatchObject({
      mode: "mock",
      status: "mock_fallback",
      message: "Readonly Supabase is intentionally off.",
    });
    expect(directory.users.length).toBeGreaterThan(0);
    expect(directory.writeConfig.enabled).toBe(false);
  });

  it("loads the Supabase directory when readonly data succeeds", async () => {
    const directory = await loadDirectoryWithMocks(
      {
        enabled: true,
        reason: "Reading local Supabase data.",
        client: {},
      },
      buildAdminSnapshot({
        profiles: [
          profileRow({
            id: "00000000-0000-4000-8000-000000000201",
            display_name: "Morgan Member",
            email: "morgan.member@mymedlife.test",
          }),
        ],
        memberships: [],
        chapters: [
          chapterRow({
            id: "10000000-0000-4000-8000-000000000301",
            name: "Boston College MEDLIFE",
            campus: "Boston College",
            chapter_type: "college_university",
          }),
        ],
        chapterEventRows: [],
        eventRows: [],
        pointsEventRows: [],
        kpiEventRows: [],
        auditLogs: [],
        staffRoles: [],
        coachAssignments: [],
      }),
    );

    expect(directory.source).toMatchObject({
      mode: "supabase",
      status: "supabase_ready",
    });
    expect(directory.users[0]).toMatchObject({
      email: "morgan.member@mymedlife.test",
    });
    expect(directory.chapters[0]).toMatchObject({
      name: "Boston College MEDLIFE",
      chapterType: "college_university",
    });
  });

  it("falls back to mock data when the Supabase directory read fails", async () => {
    const directory = await loadDirectoryWithMocks(
      {
        enabled: true,
        reason: "Reading local Supabase data.",
        client: {},
      },
      new Error("profiles table unavailable"),
    );

    expect(directory.source).toMatchObject({
      mode: "mock",
      status: "supabase_error",
    });
    expect(directory.source.message).toContain("profiles table unavailable");
    expect(directory.users.length).toBeGreaterThan(0);
  });
});

type SupabaseAccessStub =
  | {
      enabled: false;
      reason: string;
    }
  | {
      enabled: true;
      reason: string;
      client: object;
    };

async function loadDirectoryWithMocks(
  access: SupabaseAccessStub,
  snapshotOrError: AdminSnapshot | Error = buildAdminSnapshot({
    profiles: [],
    memberships: [],
    chapters: [],
    chapterEventRows: [],
    eventRows: [],
    pointsEventRows: [],
    kpiEventRows: [],
    auditLogs: [],
    staffRoles: [],
    coachAssignments: [],
  }),
) {
  vi.resetModules();
  vi.doMock("@/lib/supabase-readonly", () => ({
    createSupabaseReadonlyAccess: vi.fn(async () => access),
  }));
  vi.doMock("@/services/read-only-app-data", async (importOriginal) => {
    const actual =
      await importOriginal<typeof import("@/services/read-only-app-data")>();

    return {
      ...actual,
      readLocalDataSnapshot: vi.fn(async () => {
        if (snapshotOrError instanceof Error) {
          throw snapshotOrError;
        }

        return snapshotOrError;
      }),
    };
  });
  vi.doMock("@/services/local-actor-context", async (importOriginal) => {
    const actual =
      await importOriginal<typeof import("@/services/local-actor-context")>();

    return {
      ...actual,
      readStaffRoleAssignments: vi.fn(async () =>
        snapshotOrError instanceof Error ? [] : snapshotOrError.staffRoles,
      ),
      readCoachChapterAssignments: vi.fn(async () =>
        snapshotOrError instanceof Error ? [] : snapshotOrError.coachAssignments,
      ),
    };
  });

  const { getAdminManagementDirectory } = await import(
    "@/services/admin-management-data"
  );

  return getAdminManagementDirectory();
}

function buildAdminSnapshot(
  input: Pick<
    AdminSnapshot,
    | "profiles"
    | "memberships"
    | "chapters"
    | "chapterEventRows"
    | "eventRows"
    | "pointsEventRows"
    | "kpiEventRows"
    | "auditLogs"
    | "staffRoles"
    | "coachAssignments"
  >,
): AdminSnapshot {
  return {
    ...input,
    campaigns: [],
    phases: [],
    assignments: [],
    campaignTemplates: [],
    campaignPhaseTemplates: [],
    campaignRoleAssignments: [],
    readinessReviews: [],
    riskFlags: [],
    closeouts: [],
    evidenceItems: [],
    lumaEventLinkRows: [],
    chapterLumaCalendarRows: [],
    integrationEventRows: [],
    automationOutboxRows: [],
  };
}

function profileRow(input: {
  id: string;
  display_name: string;
  email: string;
  hubspot_contact_id?: string | null;
  status?: ProfileRow["status"];
}): ProfileRow {
  return {
    id: input.id,
    display_name: input.display_name,
    email: input.email,
    hubspot_contact_id: input.hubspot_contact_id ?? null,
    status: input.status ?? "active",
    created_at: now,
    updated_at: now,
  };
}

function chapterRow(input: {
  id: string;
  name: string;
  campus: string;
  chapter_type?: ChapterRow["chapter_type"];
  country?: string | null;
  hubspot_company_id?: string | null;
  region?: string | null;
  status?: ChapterRow["status"];
}): ChapterRow {
  return {
    id: input.id,
    name: input.name,
    campus: input.campus,
    region: input.region === undefined ? "Northeast" : input.region,
    country: input.country ?? null,
    hubspot_company_id: input.hubspot_company_id ?? null,
    chapter_type: input.chapter_type,
    status: input.status ?? "active",
    created_by: null,
    created_at: now,
    updated_at: now,
  };
}

function membershipRow(input: {
  id: string;
  user_id: string;
  chapter_id: string;
  role_key: MembershipRow["role_key"];
  role_term_end_year?: number | null;
  role_term_label?: string | null;
  role_term_start_year?: number | null;
  status?: MembershipRow["status"];
}): MembershipRow {
  return {
    id: input.id,
    user_id: input.user_id,
    chapter_id: input.chapter_id,
    role_key: input.role_key,
    status: input.status ?? "approved",
    role_term_start_year: input.role_term_start_year ?? null,
    role_term_end_year: input.role_term_end_year ?? null,
    role_term_label: input.role_term_label ?? null,
    requested_at: now,
    approved_at: now,
    approved_by: null,
    created_at: now,
    updated_at: now,
  };
}

function staffRoleRow(input: {
  id: string;
  user_id: string;
  role_key: StaffRoleAssignmentRow["role_key"];
  status?: StaffRoleAssignmentRow["status"];
}): StaffRoleAssignmentRow {
  return {
    id: input.id,
    user_id: input.user_id,
    role_key: input.role_key,
    status: input.status ?? "active",
    assigned_by: null,
    assigned_at: now,
    ended_at: null,
    created_at: now,
    updated_at: now,
  };
}

function coachAssignmentRow(input: {
  id: string;
  coach_user_id: string;
  chapter_id: string;
  status?: CoachChapterAssignmentRow["status"];
}): CoachChapterAssignmentRow {
  return {
    id: input.id,
    coach_user_id: input.coach_user_id,
    chapter_id: input.chapter_id,
    coach_type: "portfolio",
    status: input.status ?? "active",
    starts_at: now,
    ends_at: null,
    assigned_by: null,
    handoff_reason: null,
    created_at: now,
    updated_at: now,
  };
}

function chapterEventRow(input: {
  id: string;
  chapter_id: string;
  status: ChapterEventRow["status"];
}): ChapterEventRow {
  return {
    id: input.id,
    chapter_id: input.chapter_id,
    campaign_id: null,
    phase_id: null,
    action_committee_id: null,
    assignment_id: null,
    title: "Test event",
    event_type: "rush_month",
    status: input.status,
    planned_by_user_id: null,
    owner_user_id: null,
    starts_at: now,
    ends_at: null,
    promotion_summary: null,
    attendance_count: null,
    eligible_member_count: null,
    attendance_rate: null,
    nps_score: null,
    feedback_summary: null,
    warehouse_status: "disabled",
    luma_event_link_id: null,
    created_at: now,
    updated_at: now,
  };
}

function eventRow(input: { id: string; chapter_id: string }): EventRow {
  return {
    id: input.id,
    event_type: "admin_access_changed",
    actor_user_id: null,
    chapter_id: input.chapter_id,
    campaign_id: null,
    assignment_id: null,
    chapter_event_id: null,
    payload: {},
    correlation_id: null,
    occurred_at: now,
    created_at: now,
  };
}

function pointsEventRow(input: { id: string; chapter_id: string }): PointsEventRow {
  return {
    id: input.id,
    chapter_id: input.chapter_id,
    campaign_id: null,
    assignment_id: null,
    chapter_event_id: null,
    evidence_item_id: null,
    approval_id: null,
    awarded_to_user_id: "00000000-0000-4000-8000-000000000101",
    points_delta: 10,
    reason: "Test points",
    created_by: null,
    created_at: now,
  };
}

function kpiEventRow(input: { id: string; chapter_id: string }): KpiEventRow {
  return {
    id: input.id,
    chapter_id: input.chapter_id,
    campaign_id: null,
    phase_id: null,
    assignment_id: null,
    chapter_event_id: null,
    evidence_item_id: null,
    metric_key: "attendance",
    metric_value: 10,
    unit: "people",
    source: "test",
    created_by: null,
    created_at: now,
  };
}

function auditLogRow(input: { id: string; chapter_id: string }): AuditLogRow {
  return {
    id: input.id,
    actor_user_id: null,
    chapter_id: input.chapter_id,
    action: "admin.access.changed",
    target_table: "memberships",
    target_id: null,
    before_value: {},
    after_value: {},
    reason: "Test audit reason",
    created_at: now,
  };
}
