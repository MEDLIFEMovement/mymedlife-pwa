import { describe, expect, it } from "vitest";
import type { SupabaseReadonlyClient } from "@/lib/supabase-readonly";
import {
  getMockLocalActorContext,
  getSupabaseLocalActorContext,
  readLocalActorSnapshot,
  resolveActorEmailFromSession,
  resolveLocalActorPreviewSelection,
} from "@/services/local-actor-context";

describe("local actor context service", () => {
  it("keeps a mock local actor fallback available", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");

    expect(actor.source.status).toBe("mock_fallback");
    expect(actor.identitySource).toBe("local_actor_email");
    expect(actor.authSessionStatus).toBe("disabled");
    expect(actor.audience).toBe("chapter_member");
    expect(actor.chapterRoles).toContain("General Member");
    expect(actor.isLocalOnly).toBe(true);
  });

  it("keeps separate mock personas for action committee roles", () => {
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");

    expect(committeeMember.audience).toBe("chapter_member");
    expect(committeeMember.chapterRoles).toEqual(["Action Committee Member"]);
    expect(committeeChair.audience).toBe("chapter_leader");
    expect(committeeChair.chapterRoles).toEqual(["Action Committee Chair"]);
  });

  it("keeps separate mock personas for President/VP and E-Board roles", () => {
    const president = getMockLocalActorContext("leader.a@mymedlife.test");
    const eBoard = getMockLocalActorContext("eboard.a@mymedlife.test");

    expect(president.audience).toBe("chapter_leader");
    expect(president.chapterRoles).toEqual(["President / VP"]);
    expect(eBoard.audience).toBe("chapter_leader");
    expect(eBoard.chapterRoles).toEqual(["E-Board Member"]);
  });

  it("reads every Goal 9 actor context table", async () => {
    const requestedTables: string[] = [];
    const client = createFakeClient({}, requestedTables);

    await readLocalActorSnapshot(client);

    expect(requestedTables).toEqual([
      "profiles",
      "memberships",
      "staff_role_assignments",
      "coach_chapter_assignments",
      "chapters",
    ]);
  });

  it("derives chapter member context from fake local rows", async () => {
    const actor = await getSupabaseLocalActorContext(
      createFakeClient(fakeActorRows),
      "member.a@mymedlife.test",
    );

    expect(actor.source.status).toBe("supabase_ready");
    expect(actor.identitySource).toBe("local_actor_email");
    expect(actor.user.displayName).toBe("Sofia Alvarez");
    expect(actor.audience).toBe("chapter_member");
    expect(actor.chapterRoles).toEqual(["General Member"]);
    expect(actor.chapterNames).toEqual(["UCLA MEDLIFE"]);
  });

  it("derives leader, coach, and staff contexts from fake local rows", async () => {
    await expectAudience("committee.member@mymedlife.test", "chapter_member", [
      "Action Committee Member",
    ]);
    await expectAudience("committee.chair@mymedlife.test", "chapter_leader", [
      "Action Committee Chair",
    ]);
    await expectAudience("leader.a@mymedlife.test", "chapter_leader", [
      "President / VP",
    ]);
    await expectAudience("eboard.a@mymedlife.test", "chapter_leader", [
      "E-Board Member",
    ]);
    await expectAudience("coach@mymedlife.test", "coach", ["Coach"]);
    await expectAudience("admin@mymedlife.test", "admin", ["Admin"]);
    await expectAudience("ds.admin@mymedlife.test", "ds_admin", ["DS Admin"]);
    await expectAudience("super.admin@mymedlife.test", "super_admin", ["Super Admin"]);
  });

  it("can mark Supabase actor context as auth-session derived", async () => {
    const actor = await getSupabaseLocalActorContext(
      createFakeClient(fakeActorRows),
      "leader.a@mymedlife.test",
      "Using signed-in local user.",
      "local_auth_session",
      "signed_in",
    );

    expect(actor.identitySource).toBe("local_auth_session");
    expect(actor.authSessionStatus).toBe("signed_in");
    expect(actor.audience).toBe("chapter_leader");
  });

  it("resolves signed-in auth email before the debug actor email", () => {
    const resolution = resolveActorEmailFromSession(
      {
        status: "signed_in",
        isLocalOnly: true,
        message: "Signed in.",
        user: {
          id: "user-3",
          email: "coach@mymedlife.test",
          displayName: "Cam Coach",
        },
      },
      "member.a@mymedlife.test",
    );

    expect(resolution).toMatchObject({
      email: "coach@mymedlife.test",
      identitySource: "local_auth_session",
      authSessionStatus: "signed_in",
    });
  });

  it("falls back to debug actor email when auth is disabled or signed out", () => {
    expect(
      resolveActorEmailFromSession(
        {
          status: "disabled",
          isLocalOnly: true,
          message: "Auth disabled.",
          user: null,
        },
        "leader.a@mymedlife.test",
      ),
    ).toMatchObject({
      email: "leader.a@mymedlife.test",
      identitySource: "local_actor_email",
      authSessionStatus: "disabled",
    });

    expect(
      resolveActorEmailFromSession(
        {
          status: "signed_out",
          isLocalOnly: true,
          message: "Signed out.",
          user: null,
        },
        "admin@mymedlife.test",
      ),
    ).toMatchObject({
      email: "admin@mymedlife.test",
      identitySource: "local_actor_email",
      authSessionStatus: "signed_out",
    });
  });

  it("prefers the local preview cookie over the configured env actor", () => {
    expect(
      resolveLocalActorPreviewSelection(
        "coach@mymedlife.test",
        "member.a@mymedlife.test",
      ),
    ).toEqual({
      email: "coach@mymedlife.test",
      identitySource: "local_preview_cookie",
    });
  });

  it("ignores unknown preview cookies and falls back to the configured actor", () => {
    expect(
      resolveLocalActorPreviewSelection(
        "unknown@mymedlife.test",
        "leader.a@mymedlife.test",
      ),
    ).toEqual({
      email: "leader.a@mymedlife.test",
      identitySource: "local_actor_email",
    });
  });
});

async function expectAudience(
  email: string,
  audience: string,
  expectedRoles: string[],
) {
  const actor = await getSupabaseLocalActorContext(createFakeClient(fakeActorRows), email);

  expect(actor.audience).toBe(audience);
  for (const expectedRole of expectedRoles) {
    expect([...actor.chapterRoles, ...actor.staffRoles]).toContain(expectedRole);
  }
}

function createFakeClient(
  rows: Record<string, unknown[]> = fakeActorRows,
  requestedTables: string[] = [],
): SupabaseReadonlyClient {
  return {
    async selectRows<TRow>(tableName: string): Promise<TRow[]> {
      requestedTables.push(tableName);
      return (rows[tableName] ?? []) as TRow[];
    },
  };
}

const fakeActorRows: Record<string, unknown[]> = {
  profiles: [
    profile("user-1", "Sofia Alvarez", "member.a@mymedlife.test"),
    profile("user-2", "Priya President", "leader.a@mymedlife.test"),
    profile("user-3", "Cam Coach", "coach@mymedlife.test"),
    profile("user-4", "Ari Admin", "admin@mymedlife.test"),
    profile("user-5", "Dee Systems", "ds.admin@mymedlife.test"),
    profile("user-6", "Sam Super", "super.admin@mymedlife.test"),
    profile("user-9", "Nia Committee", "committee.member@mymedlife.test"),
    profile("user-10", "Casey Chair", "committee.chair@mymedlife.test"),
    profile("user-11", "Eli E-Board", "eboard.a@mymedlife.test"),
  ],
  memberships: [
    membership("membership-1", "user-1", "chapter-1", "general_member"),
    membership("membership-2", "user-2", "chapter-1", "president_vp"),
    membership("membership-3", "user-11", "chapter-1", "e_board_member"),
    membership("membership-6", "user-9", "chapter-1", "action_committee_member"),
    membership("membership-7", "user-10", "chapter-1", "action_committee_chair"),
  ],
  staff_role_assignments: [
    staffRole("staff-1", "user-3", "coach"),
    staffRole("staff-2", "user-4", "admin"),
    staffRole("staff-3", "user-5", "ds_admin"),
    staffRole("staff-4", "user-6", "super_admin"),
  ],
  coach_chapter_assignments: [
    {
      id: "coach-assignment-1",
      coach_user_id: "user-3",
      chapter_id: "chapter-1",
      coach_type: "portfolio",
      status: "active",
      starts_at: "2026-06-15",
      ends_at: null,
      assigned_by: "user-4",
      handoff_reason: "Fake portfolio.",
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
  chapters: [
    {
      id: "chapter-1",
      name: "UCLA MEDLIFE",
      campus: "UCLA",
      region: "Midwest",
      status: "active",
      created_by: "user-4",
      created_at: "2026-06-15T00:00:00Z",
      updated_at: "2026-06-15T00:00:00Z",
    },
  ],
};

function profile(id: string, displayName: string, email: string) {
  return {
    id,
    display_name: displayName,
    email,
    status: "active",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  };
}

function membership(id: string, userId: string, chapterId: string, roleKey: string) {
  return {
    id,
    user_id: userId,
    chapter_id: chapterId,
    role_key: roleKey,
    status: "approved",
    requested_at: "2026-06-15T00:00:00Z",
    approved_at: "2026-06-15T00:00:00Z",
    approved_by: "user-4",
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  };
}

function staffRole(id: string, userId: string, roleKey: string) {
  return {
    id,
    user_id: userId,
    role_key: roleKey,
    status: "active",
    assigned_by: "user-6",
    assigned_at: "2026-06-15T00:00:00Z",
    ended_at: null,
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  };
}
