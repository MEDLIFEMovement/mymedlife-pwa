import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { AdminManagementDirectory } from "@/services/admin-management-data";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";

const mockData = getMockReadOnlyAppData("Testing admin master data.");

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/master-data",
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("@/services/admin-management-data", () => ({
  getAdminManagementDirectory: vi.fn(),
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/read-only-app-data")>();

  return {
    ...actual,
    getReadOnlyAppData: vi.fn(),
  };
});

describe("admin master data page", () => {
  it("keeps fake users, mock chapter scope, and campaign shells visibly marked as TEST", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "ds.admin@mymedlife.test",
        "Using DS Admin test actor.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing admin master data TEST labels."),
    );

    const { default: AdminMasterDataPage } = await import(
      "@/app/admin/master-data/page"
    );
    const html = renderToStaticMarkup(await AdminMasterDataPage());

    expect(html).toContain("DS Admin master data safety inventory");
    expect(html).toContain(">Users<");
    expect(html).toContain("Chapters");
    expect(html).toContain("Campaign templates");
    expect(html).toContain("TEST Sofia Alvarez");
    expect(html).toContain("TEST Rush Month");
    expect(html).toContain("TEST UCLA MEDLIFE");
    expect(html).toContain("Coach: TEST Renato Coach.");
    expect(html).toContain("TEST Priya President previews President / VP permissions locally.");
    expect(html.match(/>TEST</g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it("hides the workspace for member-facing actors", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "member.a@mymedlife.test",
        "Using member test actor.",
        "mock_fallback",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing hidden admin master data route."),
    );

    const { default: AdminMasterDataPage } = await import(
      "@/app/admin/master-data/page"
    );
    const html = renderToStaticMarkup(await AdminMasterDataPage());

    expect(html).toContain("Master data hidden for this role");
    expect(html).toContain("Back to Rush Month");
    expect(html).not.toContain(">Users<");
  });

  it("renders hosted app-owned inventory without preview fixtures or TEST badges", async () => {
    const directoryModule = await import("@/services/admin-management-data");
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "super.admin@mymedlife.test",
        "Using Super Admin test actor.",
        "supabase_ready",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(getAppOwnedData());
    vi.mocked(directoryModule.getAdminManagementDirectory).mockResolvedValue(
      getAppOwnedDirectory(),
    );

    const { default: AdminMasterDataPage } = await import(
      "@/app/admin/master-data/page"
    );
    const html = renderToStaticMarkup(await AdminMasterDataPage());

    expect(html).toContain("Full master data inventory");
    expect(html).toContain("Morgan Member");
    expect(html).toContain("member@medlife.org");
    expect(html).toContain("Northview MEDLIFE");
    expect(html).toContain("Lakeside MEDLIFE");
    expect(html).toContain("Rush Month");
    expect(html).toContain("rsvps, attendance");
    expect(html).toContain("Recruitment, Events");
    expect(html).toContain(">ready readonly<");
    expect(html).toContain("Coach: Casey Coach.");
    expect(html).toContain("Coach: Unassigned.");
    expect(html).not.toContain("TEST Morgan Member");
    expect(html).not.toContain("TEST Rush Month");
    expect(html).not.toContain("TEST Northview MEDLIFE");
  });

  it("renders the hosted admin overview from app-owned data without invented production totals", async () => {
    const directoryModule = await import("@/services/admin-management-data");
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext(
        "super.admin@mymedlife.test",
        "Using Super Admin test actor.",
        "supabase_ready",
        "local_auth_session",
        "signed_in",
      ),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(getAppOwnedData());
    vi.mocked(directoryModule.getAdminManagementDirectory).mockResolvedValue(
      getAppOwnedDirectory(),
    );

    const { default: AdminPage } = await import("@/app/admin/page");
    const html = renderToStaticMarkup(await AdminPage({}));

    expect(html).toContain("App-owned operational readback");
    expect(html).toContain("Operational counts");
    expect(html).toContain("Route-backed workspaces");
    expect(html).toContain("Users and access");
    expect(html).toContain("Integration outbox");
    expect(html).toContain("Readback is not rollout proof");
    expect(html).not.toContain("TEST review data");
    expect(html).not.toContain("1,284");
    expect(html).not.toContain("18,340 mock pts");
    expect(html).not.toContain("Launch Mode Active");
  });
});

function getAppOwnedData(): ReadOnlyAppData {
  return {
    ...mockData,
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "App-owned master data loaded.",
    },
    profiles: [
      {
        ...mockData.profiles[0],
        id: "profile-member",
        display_name: "Morgan Member",
        email: "member@medlife.org",
      },
      {
        ...mockData.profiles[0],
        id: "profile-coach",
        display_name: "Casey Coach",
        email: "coach@medlife.org",
      },
    ],
    memberships: [
      {
        id: "membership-member",
        user_id: "profile-member",
        chapter_id: "chapter-northview",
        role_key: "general_member",
        status: "approved",
        requested_at: "2026-06-15T00:00:00Z",
        approved_at: "2026-06-15T00:00:00Z",
        approved_by: "profile-coach",
        created_at: "2026-06-15T00:00:00Z",
        updated_at: "2026-06-15T00:00:00Z",
      },
      {
        id: "membership-coach",
        user_id: "profile-coach",
        chapter_id: "chapter-northview",
        role_key: "coach",
        status: "approved",
        requested_at: "2026-06-15T00:00:00Z",
        approved_at: "2026-06-15T00:00:00Z",
        approved_by: "profile-coach",
        created_at: "2026-06-15T00:00:00Z",
        updated_at: "2026-06-15T00:00:00Z",
      },
    ],
    chapterRows: [
      {
        ...mockData.chapterRows[0],
        id: "chapter-northview",
        name: "Northview MEDLIFE",
        campus: "Northview University",
        chapter_type: "college_university",
      },
      {
        ...mockData.chapterRows[1],
        id: "chapter-lakeside",
        name: "Lakeside MEDLIFE",
        campus: "Lakeside College",
        chapter_type: "needs_review",
      },
    ],
    campaignTemplates: [
      {
        id: "template-rush",
        registry_key: "rush_month",
        name: "Rush Month",
        slug: "rush-month",
        audience: "chapter",
        summary: "Recruit and welcome new members.",
        annual_order: 1,
        status: "active",
        default_kpis: ["rsvps", "attendance"],
        source_metadata: {
          action_committee_lanes: ["Recruitment", "Events"],
        },
        created_by: "profile-coach",
        created_at: "2026-06-15T00:00:00Z",
        updated_at: "2026-06-15T00:00:00Z",
      },
    ],
  };
}

function getAppOwnedDirectory(): AdminManagementDirectory {
  return {
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "App-owned admin directory loaded.",
    },
    writeConfig: {
      enabled: false,
      isLocalOnly: false,
      externalWritesEnabled: false,
      reason: "Read-only test.",
    },
    users: [
      {
        id: "profile-member",
        name: "Morgan Member",
        email: "member@medlife.org",
        status: "active",
        chapterMemberships: [
          {
            chapterId: "chapter-northview",
            roleKey: "General Member",
            status: "approved",
          },
        ],
        staffRoles: [],
        portfolioChapterIds: [],
      },
      {
        id: "profile-coach",
        name: "Casey Coach",
        email: "coach@medlife.org",
        status: "active",
        chapterMemberships: [],
        staffRoles: ["Coach"],
        portfolioChapterIds: ["chapter-northview"],
      },
    ],
    chapters: [
      {
        id: "chapter-northview",
        name: "Northview MEDLIFE",
        school: "Northview University",
        region: "Northeast",
        chapterType: "college_university",
        status: "active",
        coachOwnerId: "profile-coach",
        staffOwnerIds: [],
        studentLeaderIds: [],
        activeModules: ["Events", "RSVP", "Attendance", "Points"],
        activeMemberCount: 1,
        activeEventCount: 0,
        historicalRecordCount: 0,
      },
      {
        id: "chapter-lakeside",
        name: "Lakeside MEDLIFE",
        school: "Lakeside College",
        region: "Unassigned",
        chapterType: "needs_review",
        status: "active",
        coachOwnerId: null,
        staffOwnerIds: [],
        studentLeaderIds: [],
        activeModules: ["Events", "RSVP", "Attendance", "Points"],
        activeMemberCount: 0,
        activeEventCount: 0,
        historicalRecordCount: 0,
      },
    ],
  };
}
