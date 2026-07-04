import { describe, expect, it } from "vitest";

import {
  archiveManagedChapter,
  buildPreviewWorkspaceAccessAudit,
  buildUnauthorizedAdminAttemptAudit,
  changeManagedUserAccess,
  createManagedChapter,
  deleteManagedChapter,
  deleteManagedUser,
  getManagedUserAccess,
  searchManagedChapters,
  searchManagedUsers,
  setManagedUserStatus,
  updateManagedChapter,
  type ManagedChapter,
  type ManagedUser,
} from "@/services/admin-management";
import { getMockLocalActorContext } from "@/services/local-actor-context";

const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");
const staff = getMockLocalActorContext("admin@mymedlife.test");

const baseUsers: ManagedUser[] = [
  {
    id: "user-sofia",
    name: "Sofia Alvarez",
    email: "sofia@example.test",
    status: "active",
    chapterMemberships: [{ chapterId: "chapter-ucla", roleKey: "General Member" }],
    staffRoles: [],
    portfolioChapterIds: [],
    inviteStatus: "accepted",
  },
  {
    id: "user-sam",
    name: "Sam Super",
    email: "sam@example.test",
    status: "active",
    chapterMemberships: [],
    staffRoles: ["super_admin"],
    portfolioChapterIds: [],
    inviteStatus: "accepted",
  },
];

const baseChapter: ManagedChapter = {
  id: "chapter-ucla",
  name: "UCLA MEDLIFE",
  school: "UCLA",
  region: "West Coast",
  status: "active",
  coachOwnerId: null,
  staffOwnerIds: [],
  studentLeaderIds: ["user-sofia"],
  activeModules: ["Events", "RSVP", "Points"],
  activeMemberCount: 24,
  activeEventCount: 2,
  historicalRecordCount: 48,
};

describe("admin management service", () => {
  it("searches users by name, email, role, chapter, and status", () => {
    expect(searchManagedUsers(baseUsers, { query: "sofia" })).toEqual([baseUsers[0]]);
    expect(searchManagedUsers(baseUsers, { role: "super_admin" })).toEqual([baseUsers[1]]);
    expect(searchManagedUsers(baseUsers, { chapterId: "chapter-ucla" })).toEqual([
      baseUsers[0],
    ]);
    expect(searchManagedUsers(baseUsers, { status: "active" })).toHaveLength(2);
  });

  it("changes roles and immediately changes allowed/default workspace access", () => {
    expect(getManagedUserAccess(baseUsers[0])).toMatchObject({
      allowedWorkspaces: ["student_app"],
      defaultWorkspace: "student_app",
    });

    const result = changeManagedUserAccess({
      actor: dsAdmin,
      environment: "staging",
      now: "2026-07-04T18:00:00.000Z",
      reason: "Promote selected student into chapter leadership for testing.",
      user: baseUsers[0],
      nextChapterMemberships: [
        { chapterId: "chapter-ucla", roleKey: "President / VP" },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(getManagedUserAccess(result.value)).toMatchObject({
      allowedWorkspaces: ["student_app", "leader_command_center"],
      defaultWorkspace: "leader_command_center",
    });
    expect(result.audit).toMatchObject({
      action: "user.access_change",
      actor: "ds.admin@mymedlife.test",
      environment: "staging",
      targetType: "user",
    });
  });

  it("blocks non-DS staff from admin mutations", () => {
    const result = changeManagedUserAccess({
      actor: staff,
      reason: "Staff should not be able to change roles.",
      user: baseUsers[0],
      nextStaffRoles: ["general_staff"],
    });

    expect(result).toMatchObject({
      ok: false,
      code: "admin_access_required",
    });
  });

  it("builds audit records for unauthorized admin attempts and preview access", () => {
    expect(
      buildUnauthorizedAdminAttemptAudit({
        actor: staff,
        attemptedPath: "/admin/users",
        environment: "staging",
        now: "2026-07-04T19:00:00.000Z",
      }),
    ).toMatchObject({
      action: "access.denied",
      actor: "admin@mymedlife.test",
      environment: "staging",
      newValue: "/admin/users",
      targetType: "access",
    });

    expect(
      buildPreviewWorkspaceAccessAudit({
        actor: getMockLocalActorContext("sales.coach@mymedlife.test"),
        workspace: "student_app",
        environment: "staging",
        now: "2026-07-04T19:01:00.000Z",
      }),
    ).toMatchObject({
      action: "access.preview_viewed",
      oldValue: "read_only_preview",
      newValue: "student_app",
      targetType: "access",
    });
  });

  it("requires confirmation and reason for user deactivation", () => {
    expect(
      setManagedUserStatus({
        actor: dsAdmin,
        confirmation: "wrong",
        nextStatus: "disabled",
        reason: "Disable during access review.",
        user: baseUsers[0],
      }),
    ).toMatchObject({ ok: false, code: "confirmation_required" });

    const result = setManagedUserStatus({
      actor: dsAdmin,
      confirmation: "CONFIRM USER STATUS CHANGE",
      nextStatus: "disabled",
      reason: "Disable during access review.",
      user: baseUsers[0],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("disabled");
    expect(result.audit.action).toBe("user.disabled");
    expect(result.warnings).toContain(
      "Historical event, attendance, and points records remain preserved.",
    );
  });

  it("prevents self-delete and protects super admins from non-super admins", () => {
    expect(
      deleteManagedUser({
        actor: dsAdmin,
        confirmation: "DELETE USER",
        reason: "Attempting self-delete should be blocked.",
        user: {
          ...baseUsers[0],
          email: "ds.admin@mymedlife.test",
        },
      }),
    ).toMatchObject({ ok: false, code: "self_destructive_action_blocked" });

    expect(
      deleteManagedUser({
        actor: dsAdmin,
        confirmation: "DELETE USER",
        reason: "Attempting super admin delete should be blocked.",
        user: baseUsers[1],
      }),
    ).toMatchObject({ ok: false, code: "super_admin_protected" });
  });

  it("creates and updates chapters with audit records", () => {
    const created = createManagedChapter({
      actor: dsAdmin,
      chapter: baseChapter,
      reason: "Create pilot chapter record for staging review.",
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.audit.action).toBe("chapter.created");

    const updated = updateManagedChapter({
      actor: dsAdmin,
      chapter: created.value,
      next: {
        coachOwnerId: "user-coach",
        staffOwnerIds: ["user-staff"],
        studentLeaderIds: ["user-sofia", "user-leader"],
        activeModules: ["Events", "RSVP", "Attendance", "Points"],
      },
      reason: "Assign coach, staff owner, student leaders, and active modules.",
    });

    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.coachOwnerId).toBe("user-coach");
    expect(updated.value.studentLeaderIds).toContain("user-leader");
    expect(updated.audit.action).toBe("chapter.updated");
  });

  it("searches chapters by school, region, coach, and status", () => {
    const chapters = [
      baseChapter,
      {
        ...baseChapter,
        id: "chapter-emory",
        name: "Emory MEDLIFE",
        school: "Emory University",
        region: "Southeast",
        coachOwnerId: "coach-1",
        status: "archived" as const,
      },
    ];

    expect(searchManagedChapters(chapters, { query: "emory" })).toEqual([chapters[1]]);
    expect(searchManagedChapters(chapters, { region: "west" })).toEqual([chapters[0]]);
    expect(searchManagedChapters(chapters, { coachOwnerId: "coach-1" })).toEqual([
      chapters[1],
    ]);
    expect(searchManagedChapters(chapters, { status: "archived" })).toEqual([
      chapters[1],
    ]);
  });

  it("archives chapters with confirmation, warning, and audit", () => {
    const result = archiveManagedChapter({
      actor: dsAdmin,
      chapter: baseChapter,
      confirmation: "ARCHIVE CHAPTER",
      environment: "staging",
      reason: "Archive chapter during controlled staging review.",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("archived");
    expect(result.audit.action).toBe("chapter.archived");
    expect(result.warnings).toContain("Chapter has active members.");
    expect(result.warnings).toContain(
      "Historical events, attendance, and points records must be preserved.",
    );
  });

  it("blocks destructive chapter delete when active data exists", () => {
    const result = deleteManagedChapter({
      actor: superAdmin,
      chapter: baseChapter,
      confirmation: "DELETE CHAPTER",
      hardDelete: true,
      reason: "Hard delete should be blocked while chapter has records.",
    });

    expect(result).toMatchObject({
      ok: false,
      code: "chapter_has_active_data",
    });
  });

  it("blocks production hard delete for DS Admin", () => {
    const result = deleteManagedChapter({
      actor: dsAdmin,
      chapter: {
        ...baseChapter,
        activeMemberCount: 0,
        activeEventCount: 0,
        historicalRecordCount: 0,
      },
      confirmation: "DELETE CHAPTER",
      environment: "production",
      hardDelete: true,
      reason: "Production hard delete must require stronger ownership.",
    });

    expect(result).toMatchObject({
      ok: false,
      code: "production_hard_delete_blocked",
    });
  });
});
