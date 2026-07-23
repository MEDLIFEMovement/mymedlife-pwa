import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AdminChaptersManagementPanel } from "@/components/admin-chapters-management-panel";
import { AdminUsersManagementPanel } from "@/components/admin-users-management-panel";
import {
  managedChapterFixtures,
  managedUserFixtures,
} from "@/services/admin-management-fixtures";
import { getMockLocalActorContext } from "@/services/local-actor-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/integrations/luma",
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("@/app/login/actions", () => ({
  signOut: async () => undefined,
}));

const hubspotWorkspaceMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/admin-hubspot-sync-workspace", () => ({
  getAdminHubSpotSyncWorkspace: hubspotWorkspaceMock,
}));

hubspotWorkspaceMock.mockResolvedValue({
    canRead: true,
    config: { enabled: true, environment: "production", activeMemberTerms: ["2026-2027"], reason: "Enabled for test." },
    lastRun: {
      id: "run-1",
      mode: "backfill",
      status: "partial",
      startedAt: "2026-07-19T20:00:00.000Z",
      completedAt: "2026-07-19T20:05:00.000Z",
      heartbeatAt: "2026-07-19T20:04:00.000Z",
      triggerSource: "manual",
      retryOfRunId: null,
      sourceCompanies: 345,
      sourceContacts: 672,
      membershipDeactivations: 4,
      chapterDeactivations: 2,
      materializedChapters: 337,
      matchedProfiles: 110,
      conflicts: 2,
      failures: 1,
    },
    counts: {
      companies: 345,
      contacts: 672,
      memberships: 700,
      pendingCompanies: 6,
      pendingContacts: 562,
      pendingMemberships: 590,
      materializedMemberships: 100,
      ignoredMemberships: 10,
      openFailures: 1,
    },
    failures: [{
      id: "failure-1",
      objectType: "contact",
      externalId: "contact-1",
      code: "profile_link_failed",
      message: "TEST reconciliation failure",
      retryCount: 0,
      createdAt: "2026-07-19T20:04:00.000Z",
    }],
    message: "HubSpot reads and app-owned reconciliation writes are enabled. HubSpot writes and invitations remain off.",
});

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("admin management pages", () => {
  it("renders DS Admin user management with filters, access summary, safeguards, and audit previews", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: AdminUsersPage } = await import("@/app/admin/users/page");
    const html = renderToStaticMarkup(
      await AdminUsersPage({
        searchParams: Promise.resolve({ q: "sofia" }),
      }),
    );

    expect(html).toContain("User Access Management");
    expect(html).toContain("DS Admin · v2.4");
    expect(html).toContain("SYSTEMS OK");
    expect(html).toContain("Overview");
    expect(html).toContain("Users");
    expect(html).toContain("Chapters");
    expect(html).toContain("Modules");
    expect(html).toContain("Luma Events");
    expect(html).toContain("Points");
    expect(html).toContain("Integrations");
    expect(html).toContain("Audit Logs");
    expect(html).toContain("System Health");
    expect(html).toContain("API Keys");
    expect(html).toContain("MCP Connections");
    expect(html).toContain("Settings");
    expect(html).toContain("Disabled Modules");
    expect(html).toContain("SOP Builder");
    expect(html).toContain("Task Assignment");
    expect(html).toContain("UGC / Feed");
    expect(html).toContain("MCP Analytics");
    expect(html).toContain("Create a site user");
    expect(html).toContain("Create user");
    expect(html).toContain("Temporary password");
    expect(html).toContain("Chapter (required for members and E-Board)");
    expect(html).toContain("Select a chapter for member or E-Board");
    expect(html).not.toContain("Required only for E-Board");
    expect(html).toContain("Onboard approved staff member for chapter support");
    expect(html).toContain("Creation locked:");
    expect(html).toContain("Search name or email");
    expect(html).toContain("TEST Sofia Alvarez");
    expect(html).toContain("TEST Sofia, TEST coach, medlife.test");
    expect(html).toContain("sofia.alvarez@mymedlife.test");
    expect(html).toContain("General Student App");
    expect(html).toContain("Promote / demote role");
    expect(html).toContain("Return to General Student App only");
    expect(html).toContain("Apply preview filters");
    expect(html).toContain("Suspend / deactivate user");
    expect(html).toContain("Send password reset email");
    expect(html).toContain("RESET PASSWORD");
    expect(html).toContain("Admins never see");
    expect(html).toContain("Password reset locked:");
    expect(html).toContain("Permanently delete user");
    expect(html).toContain("Delete user safeguard");
    expect(html).toContain("Audit record preview");
    expect(html).toContain("Server-backed access changes");
    expect(html).toContain("admin_change_user_access");
    expect(html).toContain("Save chapter role (blocked)");
    expect(html).toContain("Assign staff role (blocked)");
    expect(html).toContain("Assign coach portfolio (blocked)");
    expect(html).toContain("Admin writes locked");
    expect(html).toContain(
      "Each write stays visibly blocked until its audited server path is approved for the current environment.",
    );
    expect(html).toContain(
      "This admin access change is blocked until audited Supabase writes are approved for this environment.",
    );
    expect(html).toContain("Historical event, attendance, and points records remain preserved.");
  });

  it("filters the admin user directory by query", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: AdminUsersPage } = await import("@/app/admin/users/page");
    const html = renderToStaticMarkup(
      await AdminUsersPage({
        searchParams: Promise.resolve({ q: "ivy" }),
      }),
    );

    expect(html).toContain("TEST Ivy Invite");
    expect(html).toContain("ivy.invite@mymedlife.test");
    expect(html).not.toContain("sofia.alvarez@mymedlife.test");
  });

  it("renders the query-string admin integrations page as route-backed readback", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: AdminPage } = await import("@/app/admin/page");
    const html = renderToStaticMarkup(
      await AdminPage({
        searchParams: Promise.resolve({ view: "integrations" }),
      }),
    );

    expect(html).toContain("Route-backed admin integrations");
    expect(html).toContain("Luma mode");
    expect(html).toContain("Open Luma status");
    expect(html).toContain("HubSpot");
    expect(html).toContain("Databricks");
    expect(html).toContain("Open Databricks export");
    expect(html).toContain("Integration events and outbox");
    expect(html).toContain("No browser-side provider writes");
    expect(html).toContain("Test blocked");
    expect(html).toContain("External writes");
    expect(html).not.toContain("this integrations surface is preview-only");
    expect(html).not.toContain("LUMA_API_KEY");
  });

  it("blocks non-DS staff from the admin user management page", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: AdminUsersPage } = await import("@/app/admin/users/page");

    await expect(AdminUsersPage({})).rejects.toThrow(
      "NEXT_REDIRECT:/staff?view=chapters",
    );
  });

  it("renders Super Admin chapter management with owner/module changes and destructive safeguards", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("super.admin@mymedlife.test"),
    );

    const { default: AdminChaptersPage } = await import("@/app/admin/chapters/page");
    const html = renderToStaticMarkup(
      await AdminChaptersPage({
        searchParams: Promise.resolve({ chapterId: "chapter-ucla" }),
      }),
    );

    expect(html).toContain("Chapter Management");
    expect(html).toContain("DS Admin · v2.4");
    expect(html).toContain("SYSTEMS OK");
    expect(html).toContain("Overview");
    expect(html).toContain("Users");
    expect(html).toContain("Chapters");
    expect(html).toContain("Modules");
    expect(html).toContain("Luma Events");
    expect(html).toContain("Points");
    expect(html).toContain("Integrations");
    expect(html).toContain("Audit Logs");
    expect(html).toContain("System Health");
    expect(html).toContain("API Keys");
    expect(html).toContain("MCP Connections");
    expect(html).toContain("Settings");
    expect(html).toContain("Disabled Modules");
    expect(html).toContain("SOP Builder");
    expect(html).toContain("Task Assignment");
    expect(html).toContain("UGC / Feed");
    expect(html).toContain("MCP Analytics");
    expect(html).toContain("TEST UCLA MEDLIFE");
    expect(html).toContain("TEST UCLA");
    expect(html).toContain("TEST West Coast");
    expect(html).toContain("TEST UCLA, TEST Boston, TEST Howard");
    expect(html).toContain("Chapter type");
    expect(html).toContain("College / University Chapter");
    expect(html).toContain("Needs Review");
    expect(html).toContain("Country");
    expect(html).toContain("HubSpot company ID");
    expect(html).toContain("Coach and student role history");
    expect(html).toContain("Current Action Committee Chairs");
    expect(html).toContain("Current E-Boarders");
    expect(html).toContain("Previous role holders");
    expect(html).toContain("HubSpot company/contact IDs are stored as app-side references");
    expect(html).toContain("Edit chapter ownership and modules");
    expect(html).toContain("Apply preview filters");
    expect(html).toContain("Archive chapter (blocked)");
    expect(html).toContain("Archive chapter");
    expect(html).toContain("Deactivate / suspend chapter");
    expect(html).toContain("Reactivate restores its active status");
    expect(html).toContain("Soft delete chapter");
    expect(html).toContain("Hard delete safeguard");
    expect(html).toContain("chapter_has_active_data");
    expect(html).toContain("Server-backed chapter changes");
    expect(html).toContain("admin_manage_chapter");
    expect(html).toContain("Create chapter (blocked)");
    expect(html).toContain("TEST Pilot MEDLIFE");
    expect(html).toContain("TEST Pilot University");
    expect(html).toContain("TEST West Coast");
    expect(html).toContain("Save chapter profile (blocked)");
    expect(html).toContain("Assign coach (blocked)");
    expect(html).toContain("Assign student leader (blocked)");
    expect(html).toContain("write_disabled");
    expect(html).toContain(
      "This chapter-management change is blocked until an audited write path is approved for this environment.",
    );
    expect(html).not.toContain("later chapter-type migration");
    expect(html).toContain("Historical events, attendance, and points records must be preserved.");
  });

  it("keeps admin access button labels clean when server-backed user writes are enabled", () => {
    const actor = getSignedInActor("ds.admin@mymedlife.test");
    const html = renderToStaticMarkup(
      <AdminUsersManagementPanel
        actor={actor}
        chapters={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            name: "TEST UCLA MEDLIFE",
            school: "TEST UCLA",
            region: "West Coast",
            chapterType: "college_university",
            status: "active",
            coachOwnerId: "33333333-3333-4333-8333-333333333333",
            staffOwnerIds: [],
            studentLeaderIds: [],
            activeModules: ["Events", "Points"],
            activeMemberCount: 12,
            activeEventCount: 2,
            historicalRecordCount: 24,
          },
        ]}
        users={[
          {
            id: "22222222-2222-4222-8222-222222222222",
            name: "TEST Sofia Alvarez",
            email: "test.sofia.alvarez@mymedlife.test",
            status: "active",
            chapterMemberships: [
              {
                chapterId: "11111111-1111-4111-8111-111111111111",
                roleKey: "General Member",
              },
            ],
            staffRoles: [],
            portfolioChapterIds: [],
            inviteStatus: "accepted",
          },
        ]}
        writeConfig={{
          enabled: true,
          isLocalOnly: true,
          externalWritesEnabled: false,
          reason: "Local DS Admin rehearsal.",
        }}
        passwordResetConfig={{
          enabled: true,
          environment: "local",
          reason: "Local password reset rehearsal.",
          redirectTo: "http://127.0.0.1:3100/auth/callback/recovery/L2FkbWluL3VzZXJz",
        }}
        searchParams={{
          adminUserCreationResult: "user_created",
          adminUserLifecycleResult: "target_inactive",
          adminUserPasswordResetResult: "password_reset_sent",
        }}
      />,
    );

    expect(html).toContain("Admin user creation: user created");
    expect(html).toContain("User created with an audited profile and role.");
    expect(html).toContain("Admin user lifecycle: target inactive");
    expect(html).toContain("The selected account is already inactive");
    expect(html).toContain("Admin password reset: password reset sent");
    expect(html).toContain("Password reset email was sent through Supabase Auth");
    expect(html).toContain("Password reset enabled for local.");
    expect(html).toContain("Send password reset email");
    expect(html).not.toContain("Send password reset email (blocked)");
    expect(html).toContain("Save chapter role");
    expect(html).toContain("Remove chapter access");
    expect(html).toContain("Assign staff role");
    expect(html).toContain("Remove staff role");
    expect(html).toContain("Assign coach portfolio");
    expect(html).toContain("Deactivate user");
    expect(html).not.toContain("Save chapter role (blocked)");
    expect(html).not.toContain("Deactivate user (blocked)");
    expect(html).not.toContain(
      "This admin access change is blocked until audited local Supabase writes are approved.",
    );
    expect(html).not.toContain("mock-only, so the admin RPC cannot run");
  });

  it("blocks password reset and repeat deactivation for an inactive account", () => {
    const actor = getSignedInActor("test.super.admin@mymedlife.test");
    const userId = "22222222-2222-4222-8222-222222222222";
    const html = renderToStaticMarkup(
      <AdminUsersManagementPanel
        actor={actor}
        lifecycleConfig={{
          enabled: true,
          environment: "production",
          reason: "Production lifecycle writes enabled.",
          permanentDeletionEnabled: false,
          permanentDeletionReason: "Permanent deletion remains review-only.",
        }}
        passwordResetConfig={{
          enabled: true,
          environment: "production",
          reason: "Production password reset enabled.",
          redirectTo: "https://mymedlife.org/auth/callback/recovery/L2FkbWluL3VzZXJz",
        }}
        searchParams={{ userId }}
        users={[{
          id: userId,
          name: "TEST Inactive Member",
          email: "test.inactive.member@mymedlife.test",
          status: "deactivated",
          chapterMemberships: [],
          staffRoles: [],
          portfolioChapterIds: [],
          inviteStatus: "accepted",
        }]}
      />,
    );

    expect(html).toContain("Password reset locked: The selected account is inactive.");
    expect(html).toContain("Send password reset email (blocked)");
    expect(html).toContain("Lifecycle locked: The selected account is already inactive.");
    expect(html).toContain("Suspend / deactivate user (blocked)");
    expect(html).toContain("Permanent deletion remains review-only.");
    expect(html).toContain("Permanently delete user (blocked)");
  });

  it("selects the requested user detail when only userId is present", () => {
    const actor = getSignedInActor("test.super.admin@mymedlife.test");
    const firstUserId = "22222222-2222-4222-8222-222222222222";
    const requestedUserId = "33333333-3333-4333-8333-333333333333";
    const html = renderToStaticMarkup(
      <AdminUsersManagementPanel
        actor={actor}
        searchParams={{ userId: requestedUserId }}
        users={[
          {
            id: firstUserId,
            name: "TEST First Table User",
            email: "test.first.table.user@mymedlife.test",
            status: "active",
            chapterMemberships: [],
            staffRoles: [],
            portfolioChapterIds: [],
            inviteStatus: "accepted",
          },
          {
            id: requestedUserId,
            name: "TEST Requested Detail User",
            email: "test.requested.detail.user@mymedlife.test",
            status: "active",
            chapterMemberships: [],
            staffRoles: [],
            portfolioChapterIds: [],
            inviteStatus: "accepted",
          },
        ]}
      />,
    );
    const detailPanel = html.slice(html.indexOf("User Detail"));

    expect(detailPanel).toContain("TEST Requested Detail User");
    expect(detailPanel).toContain("test.requested.detail.user@mymedlife.test");
    expect(detailPanel).toContain(`name="targetUserId" value="${requestedUserId}"`);
    expect(detailPanel).not.toContain("TEST First Table User");
    expect(detailPanel).not.toContain(`name="targetUserId" value="${firstUserId}"`);
  });

  it("keeps chapter management button labels clean when server-backed chapter writes are enabled", () => {
    const actor = getSignedInActor("super.admin@mymedlife.test");
    const html = renderToStaticMarkup(
      <AdminChaptersManagementPanel
        actor={actor}
        chapterAction={() => undefined}
        chapters={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            name: "TEST UCLA MEDLIFE",
            school: "TEST UCLA",
            region: "West Coast",
            country: "United States",
            hubspotCompanyId: "hubspot-company-ucla",
            chapterType: "college_university",
            status: "active",
            coachOwnerId: "33333333-3333-4333-8333-333333333333",
            coachAssignments: [
              {
                id: "55555555-5555-4555-8555-555555555555",
                coachUserId: "33333333-3333-4333-8333-333333333333",
                status: "active",
                startsAt: "2024-08-01T00:00:00.000Z",
                endsAt: null,
                handoffReason: null,
              },
            ],
            staffOwnerIds: [],
            studentLeaderIds: ["44444444-4444-4444-8444-444444444444"],
            studentLeaderAssignments: [
              {
                id: "66666666-6666-4666-8666-666666666666",
                userId: "44444444-4444-4444-8444-444444444444",
                roleKey: "President / VP",
                status: "approved",
                roleTermLabel: "President for 2024-2025",
                roleTermStartYear: 2024,
                roleTermEndYear: 2025,
                approvedAt: "2024-08-01T00:00:00.000Z",
                updatedAt: "2024-08-01T00:00:00.000Z",
              },
              {
                id: "77777777-7777-4777-8777-777777777777",
                userId: "55555555-5555-4555-8555-555555555556",
                roleKey: "E-Board Member",
                status: "inactive",
                roleTermLabel: "E-Board for 2023-2024",
                roleTermStartYear: 2023,
                roleTermEndYear: 2024,
                approvedAt: "2023-08-01T00:00:00.000Z",
                updatedAt: "2024-05-01T00:00:00.000Z",
              },
            ],
            activeModules: ["Events", "Points"],
            activeMemberCount: 12,
            activeEventCount: 2,
            historicalRecordCount: 24,
          },
        ]}
        users={[
          {
            id: "33333333-3333-4333-8333-333333333333",
            name: "TEST Cam Coach",
            email: "test.cam.coach@mymedlife.test",
            status: "active",
            chapterMemberships: [],
            staffRoles: ["Coach"],
            portfolioChapterIds: ["11111111-1111-4111-8111-111111111111"],
            inviteStatus: "accepted",
          },
          {
            id: "44444444-4444-4444-8444-444444444444",
            name: "TEST Priya President",
            email: "test.priya.president@mymedlife.test",
            status: "active",
            chapterMemberships: [
              {
                chapterId: "11111111-1111-4111-8111-111111111111",
                roleKey: "President / VP",
              },
            ],
            staffRoles: [],
            portfolioChapterIds: [],
            inviteStatus: "accepted",
          },
          {
            id: "55555555-5555-4555-8555-555555555556",
            name: "TEST Eva Eboard",
            email: "test.eva.eboard@mymedlife.test",
            status: "active",
            chapterMemberships: [
              {
                chapterId: "11111111-1111-4111-8111-111111111111",
                roleKey: "E-Board Member",
                status: "inactive",
                roleTermLabel: "E-Board for 2023-2024",
                roleTermStartYear: 2023,
                roleTermEndYear: 2024,
              },
            ],
            staffRoles: [],
            portfolioChapterIds: [],
            inviteStatus: "accepted",
          },
        ]}
        writeConfig={{
          enabled: true,
          isLocalOnly: true,
          externalWritesEnabled: false,
          reason: "Local DS Admin chapter rehearsal.",
        }}
      />,
    );

    expect(html).toContain("Create chapter");
    expect(html).toContain("HubSpot company ID");
    expect(html).toContain("hubspot-company-ucla");
    expect(html).toContain("United States");
    expect(html).toContain("Current coach");
    expect(html).toContain("TEST Cam Coach");
    expect(html).toContain("Current President / VP");
    expect(html).toContain("President for 2024-2025");
    expect(html).toContain("Previous role holders");
    expect(html).toContain("E-Board for 2023-2024");
    expect(html).toContain("Role term label");
    expect(html).toContain("Save chapter profile");
    expect(html).toContain("Assign coach");
    expect(html).toContain("Assign student leader");
    expect(html).toContain("Remove student leader");
    expect(html).toContain("Archive chapter");
    expect(html).not.toContain("Create chapter (blocked)");
    expect(html).not.toContain("Archive chapter (blocked)");
    expect(html).toContain(
      "Local chapter mutation rehearsal is enabled. Hosted and production chapter writes remain disabled.",
    );
    expect(html).toContain(
      "This chapter-management change is blocked until an audited write path is approved for this environment.",
    );
    expect(html).toContain("writes-local-only");
  });

  it("renders explicit and fallback chapter role-term labels", () => {
    const chapter = {
      ...managedChapterFixtures[0],
      studentLeaderIds: ["user-casey", "user-sofia", "user-priya"],
      studentLeaderAssignments: [
        {
          id: "role-complete-term",
          userId: "user-casey",
          roleKey: "Action Committee Chair",
          status: "approved",
          roleTermLabel: null,
          roleTermStartYear: 2024,
          roleTermEndYear: 2025,
        },
        {
          id: "role-missing-end",
          userId: "user-sofia",
          roleKey: "E-Board Member",
          status: "inactive",
          roleTermLabel: null,
          roleTermStartYear: 2023,
          roleTermEndYear: null,
        },
        {
          id: "role-missing-start",
          userId: "user-priya",
          roleKey: "President / VP",
          status: "inactive",
          roleTermLabel: null,
          roleTermStartYear: null,
          roleTermEndYear: 2022,
        },
      ],
    };
    const html = renderToStaticMarkup(
      <AdminChaptersManagementPanel
        actor={getSignedInActor("super.admin@mymedlife.test")}
        chapters={[chapter]}
        users={managedUserFixtures}
      />,
    );

    expect(html).toContain(
      "TEST Casey Chair - Action Committee Chair for 2024-2025 - status: approved",
    );
    expect(html).toContain("TEST Sofia Alvarez - E-Board Member - status: inactive");
    expect(html).toContain("TEST Priya President - President / VP - status: inactive");
  });

  it("keeps production chapter mutations visibly review-only without local-write claims", () => {
    const actor = getSignedInActor("super.admin@mymedlife.test");
    const html = renderToStaticMarkup(
      <AdminChaptersManagementPanel
        actor={actor}
        writeConfig={{
          enabled: false,
          isLocalOnly: false,
          isHostedStaging: false,
          externalWritesEnabled: false,
          reason: "Production admin access writes are disabled.",
        }}
      />,
    );

    expect(html).toContain(
      "Production chapter mutations are disabled. The server rejects these writes before the admin_manage_chapter RPC runs; any future production write path requires separate implementation, approval, and proof.",
    );
    expect(html).toContain(
      "Production chapter management is review-only while live chapter readback remains available.",
    );
    expect(html).toContain(
      "This chapter-management change is blocked until an audited write path is approved for this environment.",
    );
    expect(html).toContain("write_disabled");
    expect(html).not.toContain("local Supabase writes");
    expect(html).not.toContain("later chapter-type migration");
  });

  it.each([
    {
      name: "disabled local",
      writeConfig: {
        enabled: false as const,
        isLocalOnly: true,
        isHostedStaging: false,
        externalWritesEnabled: false as const,
        reason: "Local writes disabled for test.",
      },
      expected:
        "This local review keeps chapter mutation verbs visibly blocked until the audited local write path is approved.",
      status: "write_disabled",
    },
    {
      name: "disabled staging",
      writeConfig: {
        enabled: false as const,
        isLocalOnly: false,
        isHostedStaging: true,
        externalWritesEnabled: false as const,
        reason: "Staging writes disabled for test.",
      },
      expected:
        "Hosted staging chapter mutations remain visibly blocked until the audited staging write path is approved.",
      status: "write_disabled",
    },
    {
      name: "enabled staging",
      writeConfig: {
        enabled: true as const,
        isLocalOnly: false,
        isHostedStaging: true,
        externalWritesEnabled: false as const,
        reason: "Staging writes enabled for test.",
      },
      expected:
        "Hosted staging chapter mutation rehearsal is enabled. Production chapter writes remain disabled.",
      status: "writes-staging-only",
    },
  ])("renders the $name chapter-write posture honestly", ({ writeConfig, expected, status }) => {
    const html = renderToStaticMarkup(
      <AdminChaptersManagementPanel
        actor={getSignedInActor("super.admin@mymedlife.test")}
        chapterAction={writeConfig.enabled ? () => undefined : undefined}
        writeConfig={writeConfig}
      />,
    );

    expect(html).toContain(expected);
    expect(html).toContain(status);
  });

  it("renders the access matrix with managed users and audit posture", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: AdminAccessPage } = await import("@/app/admin/access/page");
    const html = renderToStaticMarkup(await AdminAccessPage());

    expect(html).toContain("Access Matrix");
    expect(html).toContain("Every person, chapter, and access row in this matrix is TEST inventory for shell review only.");
    expect(html).toContain("TEST managed users");
    expect(html).toContain("TEST managed chapters");
    expect(html).toContain("TEST preview users");
    expect(html).toContain("TEST audit event types");
    expect(html).toContain("TEST Directory Access");
    expect(html).toContain("General Student App");
    expect(html).toContain("Student Command Center");
    expect(html).toContain("Return to Command Center");
    expect(html).toContain("Failed unauthorized admin attempt");
    expect(html).toContain("Sensitive preview access");
    expect(html).toContain("access.denied");
    expect(html).toContain("access.preview_viewed");
  });

  it("renders DS Admin Luma provider setup without exposing keys", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: AdminLumaIntegrationPage } = await import(
      "@/app/admin/integrations/luma/page"
    );
    const html = renderToStaticMarkup(await AdminLumaIntegrationPage());

    expect(html).toContain("Luma integration status");
    expect(html).toContain("Safe test connection");
    expect(html).toContain("Outbox safety");
    expect(html).toContain("Secrets exposure");
    expect(html).toContain("Open outbox");
    expect(html).toContain("External writes");
    expect(html).not.toContain("LUMA_API_KEY");
  });

  it("redirects general staff away from Luma provider setup", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("general.staff@mymedlife.test"),
    );

    const { default: AdminLumaIntegrationPage } = await import(
      "@/app/admin/integrations/luma/page"
    );
    await expect(AdminLumaIntegrationPage()).rejects.toThrow(
      "NEXT_REDIRECT:/staff",
    );
  });

  it("redirects signed-out admin actors to login before loading Luma data", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "ds.admin@mymedlife.test",
        "Signed-out test actor.",
        "mock_fallback",
        "local_actor_email",
        "signed_out",
      ),
    );

    const { default: AdminLumaIntegrationPage } = await import(
      "@/app/admin/integrations/luma/page"
    );
    await expect(AdminLumaIntegrationPage()).rejects.toThrow(
      "NEXT_REDIRECT:/login?redirectTo=%2Fadmin%2Fintegrations%2Fluma",
    );
  });

  it("renders the HubSpot source-sync status and confirmed read-only controls", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: AdminHubSpotIntegrationPage } = await import(
      "@/app/admin/integrations/hubspot/page"
    );
    const html = renderToStaticMarkup(await AdminHubSpotIntegrationPage({}));

    expect(html).toContain("HubSpot chapter and member sync");
    expect(html).toContain("Imported companies");
    expect(html).toContain("345");
    expect(html).toContain("Reconciliation queue");
    expect(html).toContain("Current memberships materialized");
    expect(html).toContain("Historical/out-of-term ignored");
    expect(html).toContain("2026-2027");
    expect(html).toContain("BACKFILL HUBSPOT");
    expect(html).toContain("SYNC HUBSPOT");
    expect(html).toContain("HubSpot writes and invitations remain off");
    expect(html).toContain("TEST reconciliation failure");
    expect(html).not.toContain("server-only-token");
  });

  it("renders honest empty HubSpot run and failure states with action readback", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );
    hubspotWorkspaceMock.mockResolvedValueOnce({
      canRead: true,
      config: { enabled: false, environment: "production", activeMemberTerms: [], reason: "Disabled for test." },
      lastRun: null,
      counts: {
        companies: 0,
        contacts: 0,
        memberships: 0,
        pendingCompanies: 0,
        pendingContacts: 0,
        pendingMemberships: 0,
        materializedMemberships: 0,
        ignoredMemberships: 0,
        openFailures: 0,
      },
      failures: [],
      message: "Disabled for test.",
    });

    const { default: AdminHubSpotIntegrationPage } = await import(
      "@/app/admin/integrations/hubspot/page"
    );
    const html = renderToStaticMarkup(await AdminHubSpotIntegrationPage({
      searchParams: Promise.resolve({ hubspotSyncResult: ["confirmation_required"] }),
    }));

    expect(html).toContain("Last action result:");
    expect(html).toContain("confirmation required");
    expect(html).toContain("No sync run has completed yet");
    expect(html).toContain("No unresolved failures");
  });

  it("renders an explicit restricted state when HubSpot readback is unavailable", async () => {
    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );
    hubspotWorkspaceMock.mockResolvedValueOnce({
      canRead: false,
      config: { enabled: false, environment: "production", activeMemberTerms: [], reason: "Unavailable." },
      lastRun: null,
      counts: {
        companies: 0,
        contacts: 0,
        memberships: 0,
        pendingCompanies: 0,
        pendingContacts: 0,
        pendingMemberships: 0,
        materializedMemberships: 0,
        ignoredMemberships: 0,
        openFailures: 0,
      },
      failures: [],
      message: "Readback unavailable for test.",
    });

    const { default: AdminHubSpotIntegrationPage } = await import(
      "@/app/admin/integrations/hubspot/page"
    );
    const html = renderToStaticMarkup(await AdminHubSpotIntegrationPage({}));

    expect(html).toContain("HubSpot sync readback unavailable");
    expect(html).toContain("Readback unavailable for test");
    expect(html).not.toContain("Reconciliation queue");
  });
});
