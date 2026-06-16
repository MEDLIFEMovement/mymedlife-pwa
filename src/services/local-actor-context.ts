import { mockChapter } from "@/data/mock-rush-month";
import {
  createSupabaseReadonlyClient,
  getSupabaseReadConfig,
  type SupabaseReadonlyClient,
} from "@/lib/supabase-readonly";
import type { DataSourceMeta, DataSourceStatus } from "@/services/read-only-app-data";
import type { User } from "@/shared/types/domain";
import type {
  ChapterRow,
  CoachChapterAssignmentRow,
  DatabaseRoleKey,
  MembershipRow,
  ProfileRow,
  StaffRoleAssignmentRow,
} from "@/shared/types/persistence";

const defaultLocalActorEmail = "member.a@mymedlife.test";

export type ActorAudience =
  | "chapter_member"
  | "chapter_leader"
  | "coach"
  | "admin"
  | "ds_admin"
  | "super_admin";

export type LocalActorContext = {
  source: DataSourceMeta;
  user: User;
  selectedEmail: string;
  audience: ActorAudience;
  audienceLabel: string;
  accessSummary: string;
  chapterRoles: string[];
  staffRoles: string[];
  chapterNames: string[];
  coachPortfolioChapterNames: string[];
  isLocalOnly: boolean;
};

export type LocalActorOption = {
  email: string;
  displayName: string;
  audience: ActorAudience;
  chapterRoles: string[];
  staffRoles: string[];
  chapterNames: string[];
  coachPortfolioChapterNames: string[];
};

type LocalActorSnapshot = {
  profiles: ProfileRow[];
  memberships: MembershipRow[];
  staffRoles: StaffRoleAssignmentRow[];
  coachAssignments: CoachChapterAssignmentRow[];
  chapters: ChapterRow[];
};

export const localActorOptions: LocalActorOption[] = [
  {
    email: "member.a@mymedlife.test",
    displayName: "Maya Member",
    audience: "chapter_member",
    chapterRoles: ["General Member"],
    staffRoles: [],
    chapterNames: [mockChapter.name],
    coachPortfolioChapterNames: [],
  },
  {
    email: "leader.a@mymedlife.test",
    displayName: "Leo Leader",
    audience: "chapter_leader",
    chapterRoles: ["President / VP", "E-Board Member"],
    staffRoles: [],
    chapterNames: [mockChapter.name],
    coachPortfolioChapterNames: [],
  },
  {
    email: "coach@mymedlife.test",
    displayName: "Cam Coach",
    audience: "coach",
    chapterRoles: [],
    staffRoles: ["Coach"],
    chapterNames: [],
    coachPortfolioChapterNames: [mockChapter.name],
  },
  {
    email: "admin@mymedlife.test",
    displayName: "Ari Admin",
    audience: "admin",
    chapterRoles: [],
    staffRoles: ["Admin"],
    chapterNames: [],
    coachPortfolioChapterNames: [],
  },
  {
    email: "ds.admin@mymedlife.test",
    displayName: "Dee Systems",
    audience: "ds_admin",
    chapterRoles: [],
    staffRoles: ["DS Admin"],
    chapterNames: [],
    coachPortfolioChapterNames: [],
  },
  {
    email: "super.admin@mymedlife.test",
    displayName: "Sam Super",
    audience: "super_admin",
    chapterRoles: [],
    staffRoles: ["Super Admin"],
    chapterNames: [],
    coachPortfolioChapterNames: [],
  },
];

export async function getLocalActorContext(): Promise<LocalActorContext> {
  const selectedEmail =
    process.env.MYMEDLIFE_LOCAL_ACTOR_EMAIL?.trim() || defaultLocalActorEmail;
  const config = getSupabaseReadConfig();

  if (!config.enabled) {
    return getMockLocalActorContext(selectedEmail, config.reason);
  }

  try {
    return await getSupabaseLocalActorContext(
      createSupabaseReadonlyClient(config),
      selectedEmail,
      config.reason,
    );
  } catch (error) {
    return getMockLocalActorContext(
      selectedEmail,
      error instanceof Error
        ? `Local actor read failed, so mock fallback is active: ${error.message}`
        : "Local actor read failed, so mock fallback is active.",
      "supabase_error",
    );
  }
}

export async function getSupabaseLocalActorContext(
  client: SupabaseReadonlyClient,
  selectedEmail = defaultLocalActorEmail,
  message = "Reading local Supabase actor context in read-only mode.",
): Promise<LocalActorContext> {
  const snapshot = await readLocalActorSnapshot(client);
  const normalizedEmail = selectedEmail.toLowerCase();
  const profile =
    snapshot.profiles.find((item) => item.email.toLowerCase() === normalizedEmail) ??
    snapshot.profiles[0];

  if (!profile) {
    return getMockLocalActorContext(
      selectedEmail,
      "Supabase returned no profiles, so mock actor fallback is active.",
    );
  }

  const actorMemberships = snapshot.memberships.filter(
    (item) => item.user_id === profile.id && item.status === "approved",
  );
  const actorStaffRoles = snapshot.staffRoles.filter(
    (item) => item.user_id === profile.id && item.status === "active",
  );
  const actorCoachAssignments = snapshot.coachAssignments.filter(
    (item) => item.coach_user_id === profile.id && item.status === "active",
  );
  const chapterNames = actorMemberships
    .map((membership) => findChapterName(snapshot.chapters, membership.chapter_id))
    .filter(Boolean);
  const coachPortfolioChapterNames = actorCoachAssignments
    .map((assignment) => findChapterName(snapshot.chapters, assignment.chapter_id))
    .filter(Boolean);
  const audience = getAudience(
    actorMemberships.map((item) => item.role_key),
    actorStaffRoles.map((item) => item.role_key),
  );

  return {
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message,
    },
    user: {
      id: profile.id,
      displayName: profile.display_name,
      email: profile.email,
    },
    selectedEmail,
    audience,
    audienceLabel: audienceToLabel(audience),
    accessSummary: audienceToAccessSummary(audience),
    chapterRoles: actorMemberships.map((item) => roleKeyToLabel(item.role_key)),
    staffRoles: actorStaffRoles.map((item) => roleKeyToLabel(item.role_key)),
    chapterNames,
    coachPortfolioChapterNames,
    isLocalOnly: true,
  };
}

export function getMockLocalActorContext(
  selectedEmail = defaultLocalActorEmail,
  message = "Using mock actor context because local Supabase reads are disabled.",
  status: DataSourceStatus = "mock_fallback",
): LocalActorContext {
  const option = findLocalActorOption(selectedEmail);

  return {
    source: {
      mode: "mock",
      status,
      message,
    },
    user: {
      id: `mock-${option.audience}`,
      displayName: option.displayName,
      email: selectedEmail,
    },
    selectedEmail,
    audience: option.audience,
    audienceLabel: audienceToLabel(option.audience),
    accessSummary: audienceToAccessSummary(option.audience),
    chapterRoles: option.chapterRoles,
    staffRoles: option.staffRoles,
    chapterNames: option.chapterNames,
    coachPortfolioChapterNames: option.coachPortfolioChapterNames,
    isLocalOnly: true,
  };
}

export async function readLocalActorSnapshot(
  client: SupabaseReadonlyClient,
): Promise<LocalActorSnapshot> {
  const [profiles, memberships, staffRoles, coachAssignments, chapters] = await Promise.all([
    readProfiles(client),
    readMemberships(client),
    readStaffRoleAssignments(client),
    readCoachChapterAssignments(client),
    readActorChapters(client),
  ]);

  return { profiles, memberships, staffRoles, coachAssignments, chapters };
}

export function readProfiles(client: SupabaseReadonlyClient) {
  return client.selectRows<ProfileRow>("profiles", { query: { order: "email.asc" } });
}

export function readMemberships(client: SupabaseReadonlyClient) {
  return client.selectRows<MembershipRow>("memberships", {
    query: { order: "created_at.asc" },
  });
}

export function readStaffRoleAssignments(client: SupabaseReadonlyClient) {
  return client.selectRows<StaffRoleAssignmentRow>("staff_role_assignments", {
    query: { order: "assigned_at.asc" },
  });
}

export function readCoachChapterAssignments(client: SupabaseReadonlyClient) {
  return client.selectRows<CoachChapterAssignmentRow>("coach_chapter_assignments", {
    query: { order: "starts_at.desc" },
  });
}

export function readActorChapters(client: SupabaseReadonlyClient) {
  return client.selectRows<ChapterRow>("chapters", { query: { order: "name.asc" } });
}

function getAudience(
  membershipRoles: DatabaseRoleKey[],
  staffRoles: StaffRoleAssignmentRow["role_key"][],
): ActorAudience {
  if (staffRoles.includes("super_admin")) {
    return "super_admin";
  }

  if (staffRoles.includes("ds_admin")) {
    return "ds_admin";
  }

  if (staffRoles.includes("admin")) {
    return "admin";
  }

  if (staffRoles.includes("coach")) {
    return "coach";
  }

  if (
    membershipRoles.includes("president_vp") ||
    membershipRoles.includes("e_board_member") ||
    membershipRoles.includes("action_committee_chair")
  ) {
    return "chapter_leader";
  }

  return "chapter_member";
}

function findChapterName(chapters: ChapterRow[], chapterId: string) {
  return chapters.find((chapter) => chapter.id === chapterId)?.name ?? "";
}

function findLocalActorOption(selectedEmail: string) {
  const normalizedEmail = selectedEmail.toLowerCase();

  return (
    localActorOptions.find((option) => option.email === normalizedEmail) ??
    localActorOptions[0]
  );
}

function roleKeyToLabel(roleKey: DatabaseRoleKey) {
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
      return "Admin";
    case "ds_admin":
      return "DS Admin";
    case "super_admin":
      return "Super Admin";
    case "general_member":
    default:
      return "General Member";
  }
}

function audienceToLabel(audience: ActorAudience) {
  switch (audience) {
    case "chapter_leader":
      return "Chapter leader";
    case "coach":
      return "Coach";
    case "admin":
      return "Admin";
    case "ds_admin":
      return "DS Admin";
    case "super_admin":
      return "Super Admin";
    case "chapter_member":
    default:
      return "Chapter member";
  }
}

function audienceToAccessSummary(audience: ActorAudience) {
  switch (audience) {
    case "chapter_leader":
      return "Leader view: chapter-scoped campaign progress, assignments, readiness, and member follow-up.";
    case "coach":
      return "Coach view: assigned portfolio chapters, readiness, risk signals, closeouts, and KPI movement.";
    case "admin":
      return "Admin view: staff-safe campaign, chapter, proof-sharing, and support context.";
    case "ds_admin":
      return "DS Admin view: integration configuration context only; student truth stays in the app.";
    case "super_admin":
      return "Super Admin view: full local staff oversight for testing permission boundaries.";
    case "chapter_member":
    default:
      return "Member view: own actions, points, recognition, and chapter-level progress.";
  }
}
