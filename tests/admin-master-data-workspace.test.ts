import { describe, expect, it } from "vitest";
import { campaignShells } from "@/data/mock-campaigns";
import type { AdminManagementDirectory } from "@/services/admin-management-data";
import { getAdminMasterDataWorkspace } from "@/services/admin-master-data-workspace";
import {
  getMockLocalActorContext,
  localActorOptions,
} from "@/services/local-actor-context";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing admin master data workspace.");

describe("admin master data workspace", () => {
  it("gives Admin a focused read-only inventory for users, roles, chapters, and templates", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminMasterDataWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Admin master data inventory");
    expect(workspace.nextStep.href).toBe("/onboarding");
    expect(workspace.counts).toEqual({
      users: 14,
      roles: 9,
      chapters: 1,
      campaignTemplates: campaignShells.length,
      mutationControlsEnabled: 0,
      productionAuthEnabled: 0,
      externalWritesExpected: 0,
    });
    expect(workspace.users.map((user) => user.email)).toContain(
      "leader.a@mymedlife.test",
    );
    expect(workspace.users[0]?.displayName).toContain("TEST ");
    expect(workspace.roles.map((role) => role.role)).toEqual([
      "General Member",
      "Action Committee Member",
      "Action Committee Chair",
      "E-Board Member",
      "President / VP",
      "Coach",
      "Admin",
      "DS Admin",
      "Super Admin",
    ]);
    expect(workspace.campaignTemplates.map((template) => template.slug)).toContain(
      "rush-month",
    );
    expect(workspace.campaignTemplates[0]?.name).toContain("TEST ");
    expect(workspace.chapters[0]?.name).toContain("TEST ");
    expect(workspace.chapters[0]?.coachName).toContain("TEST ");
    expect(
      workspace.roles.find((role) => role.role === "President / VP")?.detail,
    ).toContain("TEST Priya President previews President / VP permissions locally.");
    expect(workspace.users.find((user) => user.email === "leader.a@mymedlife.test")).toEqual(
      expect.objectContaining({
        displayName: "TEST Priya President",
        chapterNames: ["TEST UCLA MEDLIFE"],
      }),
    );
    expect(workspace.chapters[0]).toEqual(
      expect.objectContaining({
        name: "TEST UCLA MEDLIFE",
        campus: "TEST UCLA",
        coachName: "TEST Renato Coach",
      }),
    );
    expect(workspace.campaignTemplates[0]).toEqual(
      expect.objectContaining({
        name: "TEST Rush Month",
      }),
    );
  });

  it("keeps DS Admin eligible but routed back to safety review", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getAdminMasterDataWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("DS Admin master data safety inventory");
    expect(workspace.nextStep.href).toBe("/admin");
    expect(workspace.blockedWrites).toEqual(
      expect.arrayContaining([
        "production user creation",
        "role assignments",
        "campaign template edits",
        "external automation sends",
      ]),
    );
  });

  it("hides master data from chapter and coach operating roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getAdminMasterDataWorkspace(member, data).canReadWorkspace).toBe(false);
    expect(getAdminMasterDataWorkspace(leader, data).canReadWorkspace).toBe(false);
    expect(getAdminMasterDataWorkspace(coach, data).canReadWorkspace).toBe(false);
  });

  it("keeps mutation controls, production auth, and external writes disabled", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getAdminMasterDataWorkspace(actor, data);

    expect(workspace.title).toBe("Full master data inventory");
    expect(workspace.counts.mutationControlsEnabled).toBe(0);
    expect(workspace.counts.productionAuthEnabled).toBe(0);
    expect(workspace.counts.externalWritesExpected).toBe(0);
    expect(workspace.safetyNotes.join(" ")).toContain("Production users");
    expect(workspace.safetyNotes.join(" ")).toContain("No HubSpot");
  });

  it("builds hosted inventory only from app-owned profiles, memberships, chapters, and templates", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getAdminMasterDataWorkspace(actor, getAppOwnedData(), {
      directory: getAppOwnedDirectory(),
    });

    expect(workspace.counts).toEqual(
      expect.objectContaining({
        users: 2,
        chapters: 2,
        campaignTemplates: 1,
      }),
    );
    expect(workspace.users).toEqual([
      expect.objectContaining({
        email: "member@medlife.org",
        displayName: "Morgan Member",
        audience: "chapter_member",
        chapterRoles: ["General Member"],
        chapterNames: ["Northview MEDLIFE"],
        status: "ready_readonly",
      }),
      expect.objectContaining({
        email: "coach@medlife.org",
        displayName: "Casey Coach",
        audience: "coach",
        staffRoles: ["Coach"],
        coachPortfolioChapterNames: ["Northview MEDLIFE"],
        status: "ready_readonly",
      }),
    ]);
    expect(workspace.chapters).toEqual([
      expect.objectContaining({
        name: "Northview MEDLIFE",
        campus: "Northview University",
        coachName: "Casey Coach",
      }),
      expect.objectContaining({
        name: "Lakeside MEDLIFE",
        coachName: "Unassigned",
      }),
    ]);
    expect(workspace.campaignTemplates[0]).toEqual(
      expect.objectContaining({
        name: "Rush Month",
        primaryKpis: ["rsvps", "attendance"],
        actionCommitteeLanes: ["Recruitment", "Events"],
        integrationPosture: "Luma readback only",
        adminStatus: "ready_readonly",
      }),
    );
    expect(
      workspace.roles.find((role) => role.role === "General Member"),
    ).toEqual(
      expect.objectContaining({
        localActorEmail: "member@medlife.org",
        status: "ready_readonly",
      }),
    );
    expect(workspace.roles.find((role) => role.role === "Admin")?.status).toBe(
      "blocked",
    );
    expect(workspace.summary).toContain("app-owned profiles");
    expect(workspace.safetyNotes.join(" ")).toContain(
      "app-owned operational data source",
    );
    expect(workspace.users.map((user) => user.displayName).join(" ")).not.toContain(
      "TEST",
    );
    expect(
      workspace.campaignTemplates.map((template) => template.name).join(" "),
    ).not.toContain("TEST");
  });

  it("keeps hosted empty rows empty instead of substituting preview fixtures", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getAdminMasterDataWorkspace(actor, {
      ...data,
      source: {
        mode: "supabase",
        status: "chapter_access_missing",
        message: "No app-owned master data is available.",
      },
      profiles: [],
      memberships: [],
      chapterRows: [],
      campaignTemplates: [],
    });

    expect(workspace.users).toEqual([]);
    expect(workspace.chapters).toEqual([]);
    expect(workspace.campaignTemplates).toEqual([]);
    expect(workspace.roles.every((role) => role.status === "blocked")).toBe(true);
  });

  it("uses scoped app-owned rows when the broader admin directory is unavailable", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getAdminMasterDataWorkspace(actor, getAppOwnedData());

    expect(workspace.users).toEqual([
      expect.objectContaining({
        displayName: "Morgan Member",
        audience: "chapter_member",
        chapterRoles: ["General Member"],
      }),
      expect.objectContaining({
        displayName: "Casey Coach",
        audience: "coach",
        staffRoles: ["Coach"],
      }),
    ]);
    expect(workspace.chapters[0]).toEqual(
      expect.objectContaining({
        coachName: "Casey Coach",
      }),
    );
    expect(
      workspace.roles.find((role) => role.role === "Coach"),
    ).toEqual(
      expect.objectContaining({
        localActorEmail: "coach@medlife.org",
        status: "ready_readonly",
      }),
    );
  });

  it("maps hosted directory role priority and sparse template metadata honestly", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const directory = getAppOwnedDirectory();
    directory.users.push(
      {
        id: "profile-leader",
        name: "Lee Leader",
        email: "leader@medlife.org",
        status: "active",
        chapterMemberships: [
          {
            chapterId: "chapter-northview",
            roleKey: "President / VP",
            status: "approved",
          },
        ],
        staffRoles: [],
        portfolioChapterIds: [],
      },
      {
        id: "profile-admin",
        name: "Avery Admin",
        email: "admin@medlife.org",
        status: "active",
        chapterMemberships: [],
        staffRoles: ["Staff"],
        portfolioChapterIds: [],
      },
      {
        id: "profile-ds",
        name: "Devon DS",
        email: "ds@medlife.org",
        status: "active",
        chapterMemberships: [],
        staffRoles: ["DS Admin"],
        portfolioChapterIds: [],
      },
      {
        id: "profile-super",
        name: "Sam Super",
        email: "super@medlife.org",
        status: "active",
        chapterMemberships: [],
        staffRoles: ["Super Admin"],
        portfolioChapterIds: [],
      },
      {
        id: "profile-unassigned",
        name: "Uma Unassigned",
        email: "unassigned@medlife.org",
        status: "pending",
        chapterMemberships: [],
        staffRoles: ["Unknown"],
        portfolioChapterIds: ["missing-chapter"],
      },
    );
    const appData = getAppOwnedData();
    appData.campaignTemplates.push(
      {
        ...appData.campaignTemplates[0],
        id: "template-sparse",
        slug: "sparse-template",
        name: "Sparse Template",
        default_kpis: { unsupported: true },
        source_metadata: {
          actionCommitteeLanes: ["Storytelling"],
        },
      },
      {
        ...appData.campaignTemplates[0],
        id: "template-minimal",
        slug: "minimal-template",
        name: "Minimal Template",
        default_kpis: [],
        source_metadata: null,
      },
    );

    const workspace = getAdminMasterDataWorkspace(actor, appData, {
      directory,
    });

    expect(
      workspace.users.map((user) => [user.email, user.audience]),
    ).toEqual(
      expect.arrayContaining([
        ["leader@medlife.org", "chapter_leader"],
        ["admin@medlife.org", "admin"],
        ["ds@medlife.org", "ds_admin"],
        ["super@medlife.org", "super_admin"],
        ["unassigned@medlife.org", "unassigned"],
      ]),
    );
    expect(
      workspace.campaignTemplates.find(
        (template) => template.slug === "sparse-template",
      ),
    ).toEqual(
      expect.objectContaining({
        primaryKpis: [],
        actionCommitteeLanes: ["Storytelling"],
        integrationPosture:
          "No provider write is implied by this read-only template.",
      }),
    );
    expect(
      workspace.campaignTemplates.find(
        (template) => template.slug === "minimal-template",
      ),
    ).toEqual(
      expect.objectContaining({
        primaryKpis: [],
        actionCommitteeLanes: [],
      }),
    );
  });

  it("does not double-prefix TEST labels when seed data is already marked", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminMasterDataWorkspace(
      actor,
      {
        ...data,
        chapter: {
          ...data.chapter,
          name: "TEST UCLA MEDLIFE",
          campus: "TEST UCLA",
          coachName: "TEST Renato Coach",
        },
      },
      {
        actors: [
        {
          ...localActorOptions.find((option) => option.email === "leader.a@mymedlife.test")!,
          displayName: "TEST Priya President",
          chapterNames: ["TEST UCLA MEDLIFE"],
        },
        ],
      },
    );

    expect(workspace.users[0]).toEqual(
      expect.objectContaining({
        displayName: "TEST Priya President",
        chapterNames: ["TEST UCLA MEDLIFE"],
      }),
    );
    expect(workspace.chapters[0]).toEqual(
      expect.objectContaining({
        name: "TEST UCLA MEDLIFE",
        campus: "TEST UCLA",
        coachName: "TEST Renato Coach",
      }),
    );
  });
});

function getAppOwnedData(): ReadOnlyAppData {
  const profiles = [
    {
      ...data.profiles[0],
      id: "profile-member",
      display_name: "Morgan Member",
      email: "member@medlife.org",
    },
    {
      ...data.profiles[0],
      id: "profile-coach",
      display_name: "Casey Coach",
      email: "coach@medlife.org",
    },
  ];
  const chapters = [
    {
      ...data.chapterRows[0],
      id: "chapter-northview",
      name: "Northview MEDLIFE",
      campus: "Northview University",
      region: "Northeast",
      chapter_type: "college_university" as const,
    },
    {
      ...data.chapterRows[1],
      id: "chapter-lakeside",
      name: "Lakeside MEDLIFE",
      campus: "Lakeside College",
      region: null,
      chapter_type: "needs_review" as const,
    },
  ];

  return {
    ...data,
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "App-owned master data loaded.",
    },
    profiles,
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
    chapterRows: chapters,
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
          integration_posture: "Luma readback only",
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
