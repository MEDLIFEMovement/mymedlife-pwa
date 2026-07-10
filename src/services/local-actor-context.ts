import { cookies } from "next/headers";
import { mockChapter } from "@/data/mock-rush-month";
import {
  createSupabaseReadonlyClient,
  getHostedSessionReadonlyClient,
  getSupabaseReadConfig,
  type SupabaseReadonlyClient,
} from "@/lib/supabase-readonly";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import {
  getAuthSessionState,
  getDisabledAuthSessionState,
  type AuthSessionState,
  type AuthSessionStatus,
} from "@/services/auth-session";
import {
  getCanonicalLandingSurface,
  getCanonicalRoleAssignments,
  getCanonicalRoles,
  getCanonicalScopes,
  getHighestOperationalCanonicalRole,
  type CanonicalLandingSurface,
  type CanonicalRole,
  type CanonicalRoleAssignment,
  type CanonicalScope,
} from "@/services/canonical-role-scope";
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

export type ActorIdentitySource =
  | "local_actor_email"
  | "local_preview_cookie"
  | "local_auth_session";
export type LocalActorPreviewIdentitySource = Exclude<
  ActorIdentitySource,
  "local_auth_session"
>;

export type LocalActorContext = {
  source: DataSourceMeta;
  user: User;
  selectedEmail: string;
  identitySource: ActorIdentitySource;
  authSessionStatus: AuthSessionStatus;
  audience: ActorAudience;
  audienceLabel: string;
  accessSummary: string;
  chapterRoles: string[];
  staffRoles: string[];
  canonicalRoleAssignments: CanonicalRoleAssignment[];
  canonicalRoles: CanonicalRole[];
  canonicalScopes: CanonicalScope[];
  primaryCanonicalRole: CanonicalRole;
  defaultLandingSurface: CanonicalLandingSurface;
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
  includeTravelerRole?: boolean;
};

type LocalActorSnapshot = {
  profiles: ProfileRow[];
  memberships: MembershipRow[];
  staffRoles: StaffRoleAssignmentRow[];
  coachAssignments: CoachChapterAssignmentRow[];
  chapters: ChapterRow[];
};

type LocalActorPreviewSelection = {
  email: string;
  identitySource: LocalActorPreviewIdentitySource;
};

type SupabaseActorContextOptions = {
  allowMockFallbackWhenProfileMissing?: boolean;
};

export const localActorPreviewCookieName = "mymedlife_preview_actor_email";

export type ActorEmailResolution = {
  email: string;
  identitySource: ActorIdentitySource;
  authSessionStatus: AuthSessionStatus;
  authSessionEmail: string | null;
  message: string;
};

export const localActorOptions: LocalActorOption[] = [
  {
    email: "member.a@mymedlife.test",
    displayName: "Sofia Alvarez",
    audience: "chapter_member",
    chapterRoles: ["General Member"],
    staffRoles: [],
    chapterNames: [mockChapter.name],
    coachPortfolioChapterNames: [],
  },
  {
    email: "traveler.a@mymedlife.test",
    displayName: "Taylor Traveler",
    audience: "chapter_member",
    chapterRoles: ["General Member"],
    staffRoles: [],
    chapterNames: [mockChapter.name],
    coachPortfolioChapterNames: [],
    includeTravelerRole: true,
  },
  {
    email: "committee.member@mymedlife.test",
    displayName: "Nia Committee",
    audience: "chapter_member",
    chapterRoles: ["Action Committee Member"],
    staffRoles: [],
    chapterNames: [mockChapter.name],
    coachPortfolioChapterNames: [],
  },
  {
    email: "committee.chair@mymedlife.test",
    displayName: "Casey Chair",
    audience: "chapter_leader",
    chapterRoles: ["Action Committee Chair"],
    staffRoles: [],
    chapterNames: [mockChapter.name],
    coachPortfolioChapterNames: [],
  },
  {
    email: "leader.a@mymedlife.test",
    displayName: "Priya President",
    audience: "chapter_leader",
    chapterRoles: ["President / VP"],
    staffRoles: [],
    chapterNames: [mockChapter.name],
    coachPortfolioChapterNames: [],
  },
  {
    email: "vice.president@mymedlife.test",
    displayName: "Val Vice President",
    audience: "chapter_leader",
    chapterRoles: ["Vice President"],
    staffRoles: [],
    chapterNames: [mockChapter.name],
    coachPortfolioChapterNames: [],
  },
  {
    email: "eboard.a@mymedlife.test",
    displayName: "Eli E-Board",
    audience: "chapter_leader",
    chapterRoles: ["E-Board Member"],
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
    email: "sales.coach@mymedlife.test",
    displayName: "Sky Sales Coach",
    audience: "coach",
    chapterRoles: [],
    staffRoles: ["Sales Coach"],
    chapterNames: [],
    coachPortfolioChapterNames: [mockChapter.name],
  },
  {
    email: "admin@mymedlife.test",
    displayName: "Ari Staff",
    audience: "admin",
    chapterRoles: [],
    staffRoles: ["Staff", "Admin"],
    chapterNames: [],
    coachPortfolioChapterNames: [],
  },
  {
    email: "general.staff@mymedlife.test",
    displayName: "Gina General Staff",
    audience: "admin",
    chapterRoles: [],
    staffRoles: ["General Staff"],
    chapterNames: [],
    coachPortfolioChapterNames: [],
  },
  {
    email: "sales.admin@mymedlife.test",
    displayName: "Rae Sales Admin",
    audience: "admin",
    chapterRoles: [],
    staffRoles: ["Sales Admin"],
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
  const previewSelection = await getLocalActorPreviewSelection();
  const authSession = await getLocalAuthSessionState();
  const resolvedActor = resolveActorEmailFromSession(
    authSession,
    previewSelection.email,
    previewSelection.identitySource,
  );
  const config = getSupabaseReadConfig();

  if (config.enabled) {
    try {
      return await getSupabaseLocalActorContext(
        createSupabaseReadonlyClient(config),
        resolvedActor.email,
        actorContextMessage(resolvedActor, config.reason),
        resolvedActor.identitySource,
        resolvedActor.authSessionStatus,
      );
    } catch (error) {
      return getMockLocalActorContext(
        resolvedActor.email,
        error instanceof Error
          ? actorContextMessage(
              resolvedActor,
              `Local actor read failed, so mock fallback is active: ${error.message}`,
            )
          : "Local actor read failed, so mock fallback is active.",
        "supabase_error",
        resolvedActor.identitySource,
        resolvedActor.authSessionStatus,
      );
    }
  }

  const hostedSession = await getHostedSessionReadonlyClient();

  if (hostedSession.enabled) {
    try {
      return await getSupabaseLocalActorContext(
        hostedSession.client,
        resolvedActor.email,
        actorContextMessage(resolvedActor, hostedSession.reason),
        resolvedActor.identitySource,
        resolvedActor.authSessionStatus,
        false,
        {
          allowMockFallbackWhenProfileMissing:
            resolvedActor.authSessionStatus !== "signed_in",
        },
      );
    } catch (error) {
      return getMockLocalActorContext(
        resolvedActor.email,
        error instanceof Error
          ? actorContextMessage(
              resolvedActor,
              `Hosted actor read failed, so mock fallback is active: ${error.message}`,
            )
          : "Hosted actor read failed, so mock fallback is active.",
        "supabase_error",
        resolvedActor.identitySource,
        resolvedActor.authSessionStatus,
      );
    }
  }

  return getMockLocalActorContext(
    resolvedActor.email,
    actorContextMessage(resolvedActor, hostedSession.reason),
    "mock_fallback",
    resolvedActor.identitySource,
    resolvedActor.authSessionStatus,
  );
}

export async function getSupabaseLocalActorContext(
  client: SupabaseReadonlyClient,
  selectedEmail = defaultLocalActorEmail,
  message = "Reading local Supabase actor context in read-only mode.",
  identitySource: ActorIdentitySource = "local_actor_email",
  authSessionStatus: AuthSessionStatus = "disabled",
  isLocalOnly = true,
  options: SupabaseActorContextOptions = {},
): Promise<LocalActorContext> {
  const snapshot = await readLocalActorSnapshot(client);
  const normalizedEmail = selectedEmail.toLowerCase();
  const matchedProfile = snapshot.profiles.find(
    (item) => item.email.toLowerCase() === normalizedEmail,
  );

  if (!matchedProfile) {
    const shouldTreatAsMissingProfile =
      options.allowMockFallbackWhenProfileMissing === false ||
      (identitySource === "local_auth_session" && authSessionStatus === "signed_in");

    if (shouldTreatAsMissingProfile) {
      return getMissingProfileActorContext(
        selectedEmail,
        "Supabase Auth is signed in, but this user does not have a myMEDLIFE profile or role assignment yet.",
        identitySource,
        authSessionStatus,
        isLocalOnly,
      );
    }
  }

  const profile = matchedProfile ?? snapshot.profiles[0];

  if (!profile) {
    if (options.allowMockFallbackWhenProfileMissing === false) {
      return getMissingProfileActorContext(
        selectedEmail,
        "Supabase Auth is signed in, but this user does not have a myMEDLIFE profile or role assignment yet.",
        identitySource,
        authSessionStatus,
        isLocalOnly,
      );
    }

    return getMockLocalActorContext(
      selectedEmail,
      "Supabase returned no profiles, so mock actor fallback is active.",
    );
  }

  const actorMemberships = snapshot.memberships.filter(
    (item) => item.user_id === profile.id && isReadableMembershipStatus(item.status),
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
  const chapterRoles = actorMemberships.map((item) => roleKeyToLabel(item.role_key));
  const staffRoles = actorStaffRoles.map((item) => roleKeyToLabel(item.role_key));
  const canonicalRoleAssignments = getCanonicalRoleAssignments({
    audience,
    chapterRoles,
    staffRoles,
    databaseRoleKeys: [
      ...actorMemberships.map((item) => item.role_key),
      ...actorStaffRoles.map((item) => item.role_key),
    ],
    includeBreakglassScope:
      audience === "super_admin" ||
      actorStaffRoles.some((item) => item.role_key === "super_admin"),
  });
  const canonicalRoles = getCanonicalRoles(canonicalRoleAssignments);
  const canonicalScopes = getCanonicalScopes(canonicalRoleAssignments);
  const primaryCanonicalRole =
    getHighestOperationalCanonicalRole(canonicalRoleAssignments);

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
    identitySource,
    authSessionStatus,
    audience,
    audienceLabel: audienceToLabel(audience),
    accessSummary: audienceToAccessSummary(audience),
    chapterRoles,
    staffRoles,
    canonicalRoleAssignments,
    canonicalRoles,
    canonicalScopes,
    primaryCanonicalRole,
    defaultLandingSurface: getCanonicalLandingSurface(primaryCanonicalRole),
    chapterNames,
    coachPortfolioChapterNames,
    isLocalOnly,
  };
}

export function getMissingProfileActorContext(
  selectedEmail: string,
  message: string,
  identitySource: ActorIdentitySource = "local_auth_session",
  authSessionStatus: AuthSessionStatus = "signed_in",
  isLocalOnly = false,
): LocalActorContext {
  const displayName =
    selectedEmail
      .split("@")[0]
      ?.split(".")
      .filter(Boolean)
      .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
      .join(" ") || "Pending user";
  const canonicalRoleAssignments = getCanonicalRoleAssignments({
    audience: "chapter_member",
    chapterRoles: [],
    staffRoles: [],
  });
  const canonicalRoles = getCanonicalRoles(canonicalRoleAssignments);
  const canonicalScopes = getCanonicalScopes(canonicalRoleAssignments);
  const primaryCanonicalRole =
    getHighestOperationalCanonicalRole(canonicalRoleAssignments);

  return {
    source: {
      mode: "supabase",
      status: "auth_profile_missing",
      message,
    },
    user: {
      id: "auth-profile-missing",
      displayName,
      email: selectedEmail,
    },
    selectedEmail,
    identitySource,
    authSessionStatus,
    audience: "chapter_member",
    audienceLabel: "Profile setup required",
    accessSummary:
      "This signed-in user needs a myMEDLIFE profile, chapter, and role before workspace access is enabled.",
    chapterRoles: [],
    staffRoles: [],
    canonicalRoleAssignments,
    canonicalRoles,
    canonicalScopes,
    primaryCanonicalRole,
    defaultLandingSurface: getCanonicalLandingSurface(primaryCanonicalRole),
    chapterNames: [],
    coachPortfolioChapterNames: [],
    isLocalOnly,
  };
}

export function getMockLocalActorContext(
  selectedEmail = defaultLocalActorEmail,
  message = "Using mock actor context because local Supabase reads are disabled.",
  status: DataSourceStatus = "mock_fallback",
  identitySource: ActorIdentitySource = "local_actor_email",
  authSessionStatus: AuthSessionStatus = "disabled",
): LocalActorContext {
  const option = findLocalActorOption(selectedEmail);
  const canonicalRoleAssignments = getCanonicalRoleAssignments({
    audience: option.audience,
    chapterRoles: option.chapterRoles,
    staffRoles: option.staffRoles,
    includeTravelerRole: option.includeTravelerRole,
    includeBreakglassScope: option.audience === "super_admin",
  });
  const canonicalRoles = getCanonicalRoles(canonicalRoleAssignments);
  const canonicalScopes = getCanonicalScopes(canonicalRoleAssignments);
  const primaryCanonicalRole =
    getHighestOperationalCanonicalRole(canonicalRoleAssignments);

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
    identitySource,
    authSessionStatus,
    audience: option.audience,
    audienceLabel: audienceToLabel(option.audience),
    accessSummary: audienceToAccessSummary(option.audience),
    chapterRoles: option.chapterRoles,
    staffRoles: option.staffRoles,
    canonicalRoleAssignments,
    canonicalRoles,
    canonicalScopes,
    primaryCanonicalRole,
    defaultLandingSurface: getCanonicalLandingSurface(primaryCanonicalRole),
    chapterNames: option.chapterNames,
    coachPortfolioChapterNames: option.coachPortfolioChapterNames,
    isLocalOnly: true,
  };
}

export function resolveActorEmailFromSession(
  authSession: AuthSessionState,
  fallbackEmail = defaultLocalActorEmail,
  fallbackIdentitySource: LocalActorPreviewIdentitySource = "local_actor_email",
): ActorEmailResolution {
  if (authSession.status === "signed_in" && authSession.user?.email) {
    return {
      email: authSession.user.email,
      identitySource: "local_auth_session",
      authSessionStatus: authSession.status,
      authSessionEmail: authSession.user.email,
      message:
        "Using the signed-in Supabase Auth user for role-aware app context.",
    };
  }

  return {
    email: fallbackEmail,
    identitySource: fallbackIdentitySource,
    authSessionStatus: authSession.status,
    authSessionEmail: authSession.user?.email ?? null,
    message:
      fallbackIdentitySource === "local_preview_cookie"
        ? "Using the local preview role switch because no signed-in local auth user is active."
        : "Using MYMEDLIFE_LOCAL_ACTOR_EMAIL because no signed-in local auth user is active.",
  };
}

export function resolveLocalActorPreviewSelection(
  cookieEmail: string | null | undefined,
  envEmail = defaultLocalActorEmail,
): LocalActorPreviewSelection {
  const cookieActor = findKnownLocalActorOption(cookieEmail);
  if (cookieActor) {
    return {
      email: cookieActor.email,
      identitySource: "local_preview_cookie",
    };
  }

  const envActor = findKnownLocalActorOption(envEmail) ?? localActorOptions[0];
  return {
    email: envActor.email,
    identitySource: "local_actor_email",
  };
}

async function getLocalAuthSessionState(): Promise<AuthSessionState> {
  const { client, config } = await createLocalSupabaseServerClient();

  if (!client) {
    return getDisabledAuthSessionState(config);
  }

  return getAuthSessionState(client, config);
}

function actorContextMessage(resolution: ActorEmailResolution, dataSourceReason: string) {
  return `${resolution.message} ${dataSourceReason}`;
}

async function getLocalActorPreviewSelection(): Promise<LocalActorPreviewSelection> {
  const cookieStore = await cookies();
  return resolveLocalActorPreviewSelection(
    cookieStore.get(localActorPreviewCookieName)?.value,
    process.env.MYMEDLIFE_LOCAL_ACTOR_EMAIL?.trim() || defaultLocalActorEmail,
  );
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

function isReadableMembershipStatus(status: MembershipRow["status"] | string | null | undefined) {
  return status === "approved" || status === "active";
}

function findChapterName(chapters: ChapterRow[], chapterId: string) {
  return chapters.find((chapter) => chapter.id === chapterId)?.name ?? "";
}

function findKnownLocalActorOption(selectedEmail: string | null | undefined) {
  const normalizedEmail = normalizeLocalActorEmail(selectedEmail);
  if (!normalizedEmail) {
    return null;
  }

  return localActorOptions.find((option) => option.email === normalizedEmail) ?? null;
}

function findLocalActorOption(selectedEmail: string) {
  const normalizedEmail = normalizeLocalActorEmail(selectedEmail) ?? defaultLocalActorEmail;

  return (
    findKnownLocalActorOption(normalizedEmail) ??
    localActorOptions[0]
  );
}

function normalizeLocalActorEmail(selectedEmail: string | null | undefined) {
  const trimmedEmail = selectedEmail?.trim();
  if (!trimmedEmail) {
    return null;
  }

  try {
    return decodeURIComponent(trimmedEmail).trim().toLowerCase();
  } catch {
    return trimmedEmail.toLowerCase();
  }
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
      return "Staff";
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
      return "Staff";
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
      return "Staff view: assigned portfolio chapters, readiness, risk signals, closeouts, and KPI movement.";
    case "admin":
      return "Staff view: approved department dashboards, queues, proof-sharing, and support context.";
    case "ds_admin":
      return "DS Admin view: integration configuration context only; student truth stays in the app.";
    case "super_admin":
      return "Super Admin view: full local staff oversight for testing permission boundaries.";
    case "chapter_member":
    default:
      return "Member view: own actions, points, recognition, and chapter-level progress.";
  }
}
