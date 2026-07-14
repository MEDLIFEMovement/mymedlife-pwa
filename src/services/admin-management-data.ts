import { createSupabaseReadonlyAccess } from "@/lib/supabase-readonly";
import {
  inferChapterTypeFromCampus,
  normalizeChapterType,
} from "@/services/chapter-type";
import {
  managedChapterFixtures,
  managedUserFixtures,
} from "@/services/admin-management-fixtures";
import {
  getAdminAccessWriteConfig,
  type AdminAccessWriteConfig,
} from "@/services/admin-management-write";
import {
  readCoachChapterAssignments,
  readStaffRoleAssignments,
} from "@/services/local-actor-context";
import {
  readLocalDataSnapshot,
  type DataSourceMeta,
} from "@/services/read-only-app-data";
import type {
  ChapterRow,
  DatabaseRoleKey,
  ProfileRow,
} from "@/shared/types/persistence";
import type { ManagedChapter, ManagedUser } from "@/services/admin-management";

type AdminDataSnapshot = Awaited<ReturnType<typeof readLocalDataSnapshot>> & {
  staffRoles: Awaited<ReturnType<typeof readStaffRoleAssignments>>;
  coachAssignments: Awaited<ReturnType<typeof readCoachChapterAssignments>>;
};

export type AdminManagementDirectory = {
  source: DataSourceMeta;
  writeConfig: AdminAccessWriteConfig;
  users: ManagedUser[];
  chapters: ManagedChapter[];
};

export async function getAdminManagementDirectory(): Promise<AdminManagementDirectory> {
  const writeConfig = getAdminAccessWriteConfig();
  const access = await createSupabaseReadonlyAccess();

  if (!access.enabled) {
    return getMockAdminManagementDirectory(access.reason, writeConfig);
  }

  try {
    const [appSnapshot, staffRoles, coachAssignments] = await Promise.all([
      readLocalDataSnapshot(access.client),
      readStaffRoleAssignments(access.client),
      readCoachChapterAssignments(access.client),
    ]);
    const snapshot: AdminDataSnapshot = {
      ...appSnapshot,
      staffRoles,
      coachAssignments,
    };
    return {
      source: {
        mode: "supabase",
        status: "supabase_ready",
        message: access.reason,
      },
      writeConfig,
      ...mapSupabaseSnapshotToAdminDirectory(snapshot),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? `Supabase admin directory read failed, so mock fallback is active: ${error.message}`
        : "Supabase admin directory read failed, so mock fallback is active.";

    return getMockAdminManagementDirectory(message, writeConfig, "supabase_error");
  }
}

export function mapSupabaseSnapshotToAdminDirectory(
  snapshot: AdminDataSnapshot,
): Pick<AdminManagementDirectory, "users" | "chapters"> {
  return {
    users: snapshot.profiles.map((profile) => mapProfileToManagedUser(profile, snapshot)),
    chapters: snapshot.chapters.map((chapter) =>
      mapChapterToManagedChapter(chapter, snapshot),
    ),
  };
}

function getMockAdminManagementDirectory(
  message: string,
  writeConfig: AdminAccessWriteConfig,
  status: DataSourceMeta["status"] = "mock_fallback",
): AdminManagementDirectory {
  return {
    source: {
      mode: "mock",
      status,
      message,
    },
    writeConfig,
    users: managedUserFixtures,
    chapters: managedChapterFixtures,
  };
}

function mapProfileToManagedUser(
  profile: ProfileRow,
  snapshot: AdminDataSnapshot,
): ManagedUser {
  const chapterMemberships = snapshot.memberships
    .filter((membership) => {
      return membership.user_id === profile.id && membership.status === "approved";
    })
    .map((membership) => ({
      chapterId: membership.chapter_id,
      roleKey: roleKeyToLabel(membership.role_key),
    }));
  const staffRoles = snapshot.staffRoles
    .filter((role) => role.user_id === profile.id && role.status === "active")
    .map((role) => roleKeyToLabel(role.role_key));
  const portfolioChapterIds = snapshot.coachAssignments
    .filter((assignment) => {
      return assignment.coach_user_id === profile.id && assignment.status === "active";
    })
    .map((assignment) => assignment.chapter_id);

  return {
    id: profile.id,
    name: profile.display_name,
    email: profile.email,
    status: profile.status === "active" ? "active" : "deactivated",
    chapterMemberships,
    staffRoles,
    portfolioChapterIds,
    inviteStatus: profile.status === "active" ? "accepted" : "not_sent",
  };
}

function mapChapterToManagedChapter(
  chapter: ChapterRow,
  snapshot: AdminDataSnapshot,
): ManagedChapter {
  const activeMemberships = snapshot.memberships.filter((membership) => {
    return membership.chapter_id === chapter.id && membership.status === "approved";
  });
  const studentLeaderIds = activeMemberships
    .filter((membership) =>
      ["action_committee_chair", "e_board_member", "president_vp"].includes(
        membership.role_key,
      ),
    )
    .map((membership) => membership.user_id);
  const coachAssignment = snapshot.coachAssignments.find((assignment) => {
    return assignment.chapter_id === chapter.id && assignment.status === "active";
  });
  const activeEventCount = snapshot.chapterEventRows.filter((event) => {
    return event.chapter_id === chapter.id && event.status !== "canceled";
  }).length;
  const historicalRecordCount =
    snapshot.eventRows.filter((row) => row.chapter_id === chapter.id).length +
    snapshot.pointsEventRows.filter((row) => row.chapter_id === chapter.id).length +
    snapshot.kpiEventRows.filter((row) => row.chapter_id === chapter.id).length +
    snapshot.auditLogs.filter((row) => row.chapter_id === chapter.id).length;

  return {
    id: chapter.id,
    name: chapter.name,
    school: chapter.campus,
    region: chapter.region ?? "Unassigned",
    chapterType: chapter.chapter_type
      ? normalizeChapterType(chapter.chapter_type)
      : inferChapterTypeFromCampus(chapter.campus),
    status: chapter.status === "inactive" ? "disabled" : chapter.status,
    isTest: chapter.is_test === true,
    coachOwnerId: coachAssignment?.coach_user_id ?? null,
    staffOwnerIds: [],
    studentLeaderIds,
    activeModules: ["Events", "RSVP", "Attendance", "Points"],
    activeMemberCount: activeMemberships.length,
    activeEventCount,
    historicalRecordCount,
  };
}

function roleKeyToLabel(roleKey: DatabaseRoleKey): string {
  switch (roleKey) {
    case "action_committee_member":
      return "Action Committee Member";
    case "action_committee_chair":
      return "Action Committee Chair";
    case "e_board_member":
      return "E-Board Member";
    case "president_vp":
      return "President / VP";
    case "coach":
      return "Coach";
    case "admin":
      return "Staff";
    case "ds_admin":
      return "DS Admin";
    case "super_admin":
      return "Super Admin";
    case "test":
      return "TEST";
    case "general_member":
    default:
      return "General Member";
  }
}
