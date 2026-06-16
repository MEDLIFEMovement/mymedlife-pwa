import { describe, expect, it } from "vitest";
import type { SupabaseReadonlyClient } from "@/lib/supabase-readonly";
import {
  getMockLocalActorContext,
  getSupabaseLocalActorContext,
  readLocalActorSnapshot,
} from "@/services/local-actor-context";

describe("local actor context service", () => {
  it("keeps a mock local actor fallback available", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");

    expect(actor.source.status).toBe("mock_fallback");
    expect(actor.audience).toBe("chapter_member");
    expect(actor.chapterRoles).toContain("General Member");
    expect(actor.isLocalOnly).toBe(true);
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
    expect(actor.user.displayName).toBe("Maya Member");
    expect(actor.audience).toBe("chapter_member");
    expect(actor.chapterRoles).toEqual(["General Member"]);
    expect(actor.chapterNames).toEqual(["Northview MEDLIFE"]);
  });

  it("derives leader, coach, and staff contexts from fake local rows", async () => {
    await expectAudience("leader.a@mymedlife.test", "chapter_leader", [
      "President / VP",
      "E-Board Member",
    ]);
    await expectAudience("coach@mymedlife.test", "coach", ["Coach"]);
    await expectAudience("admin@mymedlife.test", "admin", ["Admin"]);
    await expectAudience("ds.admin@mymedlife.test", "ds_admin", ["DS Admin"]);
    await expectAudience("super.admin@mymedlife.test", "super_admin", ["Super Admin"]);
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
    profile("user-1", "Maya Member", "member.a@mymedlife.test"),
    profile("user-2", "Leo Leader", "leader.a@mymedlife.test"),
    profile("user-3", "Cam Coach", "coach@mymedlife.test"),
    profile("user-4", "Ari Admin", "admin@mymedlife.test"),
    profile("user-5", "Dee Systems", "ds.admin@mymedlife.test"),
    profile("user-6", "Sam Super", "super.admin@mymedlife.test"),
  ],
  memberships: [
    membership("membership-1", "user-1", "chapter-1", "general_member"),
    membership("membership-2", "user-2", "chapter-1", "president_vp"),
    membership("membership-3", "user-2", "chapter-1", "e_board_member"),
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
      name: "Northview MEDLIFE",
      campus: "Northview University",
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
