import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  createHubSpotReadOnlyClient,
  getHubSpotMembershipQualification,
  type HubSpotCompanyRecord,
  type HubSpotContactRecord,
  type HubSpotReadClient,
} from "@/services/hubspot-read-sync";

type AppClient = SupabaseClient;

type ChapterSnapshot = {
  id: string;
  name: string;
  status: string | null;
  hubspotCompanyId: string | null;
};

type ProfileSnapshot = {
  id: string;
  email: string | null;
  hubspotContactId: string | null;
};

type MembershipSnapshot = {
  id: string;
  profileId: string;
  chapterId: string;
  status: string | null;
  hubspotAssociationKey: string | null;
};

export type HubSpotReadSyncPreflightCounts = {
  sourceCompanies: number;
  sourceContacts: number;
  sourceAssociations: number;
  qualifiedContacts: number;
  qualifiedAssociations: number;
  chapters: {
    stableMatches: number;
    nameMatches: number;
    creates: number;
    conflicts: number;
    deactivations: number;
  };
  profiles: {
    stableMatches: number;
    emailMatches: number;
    unmatched: number;
    conflicts: number;
  };
  memberships: {
    stableMatches: number;
    links: number;
    creates: number;
    conflicts: number;
    blockedByProfile: number;
    blockedByChapter: number;
    deactivations: number;
  };
};

export type HubSpotReadSyncPreflightResult =
  | {
      success: true;
      code: "hubspot_preflight_succeeded";
      counts: HubSpotReadSyncPreflightCounts;
      chapterCreateSamples: string[];
      chapterConflictSamples: string[];
      message: string;
    }
  | {
      success: false;
      code: "missing_auth" | "permission_denied" | "preflight_disabled" | "server_error";
      message: string;
    };

type HubSpotReadSyncPreflightDeps = {
  env?: Record<string, string | undefined>;
  appClient?: AppClient;
  hubspotClient?: HubSpotReadClient;
};

type HubSpotReadSyncPreflightInput = {
  companies: HubSpotCompanyRecord[];
  contacts: HubSpotContactRecord[];
  activeMemberTerms: string[];
  chapters: ChapterSnapshot[];
  profiles: ProfileSnapshot[];
  memberships: MembershipSnapshot[];
};

type ResolvedChapter =
  | { status: "resolved"; chapterId: string; match: "stable" | "name" | "create" }
  | { status: "conflict" };

type ResolvedProfile =
  | { status: "resolved"; profileId: string; match: "stable" | "email" }
  | { status: "unmatched" | "conflict" };

export async function runHubSpotReadSyncPreflight(
  actorUserId: string | null,
  deps: HubSpotReadSyncPreflightDeps = {},
): Promise<HubSpotReadSyncPreflightResult> {
  if (!actorUserId) {
    return failure(
      "missing_auth",
      "Sign in with a DS Admin or Super Admin account before previewing HubSpot reconciliation.",
    );
  }

  const env = deps.env ?? process.env;
  const activeMemberTerms = parseDelimitedValues(env.MYMEDLIFE_HUBSPOT_ACTIVE_MEMBER_TERMS);
  if (!env.HUBSPOT_ACCESS_TOKEN) {
    return failure(
      "preflight_disabled",
      "HubSpot preflight is disabled because the server-only access token is missing.",
    );
  }
  if (activeMemberTerms.length === 0) {
    return failure(
      "preflight_disabled",
      "HubSpot preflight is disabled until the current member-term allowlist is configured.",
    );
  }

  const appClient = deps.appClient ?? createPreflightAppClient(env);
  const hubspotClient = deps.hubspotClient
    ?? createHubSpotReadOnlyClient(env.HUBSPOT_ACCESS_TOKEN);
  if (!appClient) {
    return failure(
      "preflight_disabled",
      "HubSpot preflight is disabled because the server-only Supabase client is incomplete.",
    );
  }

  const roleResult = await appClient.schema("app").from("staff_role_assignments")
    .select("role_key")
    .eq("user_id", actorUserId)
    .eq("status", "active");
  if (roleResult.error) {
    return failure("server_error", "Could not verify the HubSpot preflight administrator role.");
  }
  const authorized = (roleResult.data ?? []).some((row) => {
    const role = String(row.role_key);
    return role === "ds_admin" || role === "super_admin";
  });
  if (!authorized) {
    return failure(
      "permission_denied",
      "Only a DS Admin or Super Admin can preview HubSpot reconciliation.",
    );
  }

  try {
    const companies = await hubspotClient.readActiveChapterCompanies();
    const activeCompanyIds = new Set(companies.map((company) => company.id));
    const contacts = (await hubspotClient.readContactsWithCompanies(
      null,
      [...activeCompanyIds],
    ))
      .map((contact) => ({
        ...contact,
        companyIds: contact.companyIds.filter((companyId) => activeCompanyIds.has(companyId)),
      }))
      .filter((contact) => contact.companyIds.length > 0);

    const [chaptersResult, profilesResult, membershipsResult] = await Promise.all([
      appClient.schema("app").from("chapters")
        .select("id,name,status,hubspot_company_id"),
      appClient.schema("app").from("profiles")
        .select("id,email,hubspot_contact_id"),
      appClient.schema("app").from("memberships")
        .select("id,profile_id,chapter_id,status,hubspot_association_key"),
    ]);
    const queryError = [chaptersResult, profilesResult, membershipsResult]
      .find((result) => result.error)?.error;
    if (queryError) {
      return failure(
        "server_error",
        `HubSpot preflight could not read app-owned reconciliation targets: ${queryError.message}`,
      );
    }

    return buildHubSpotReadSyncPreflight({
      companies,
      contacts,
      activeMemberTerms,
      chapters: (chaptersResult.data ?? []).map((row) => ({
        id: String(row.id),
        name: String(row.name ?? ""),
        status: optionalString(row.status),
        hubspotCompanyId: optionalString(row.hubspot_company_id),
      })),
      profiles: (profilesResult.data ?? []).map((row) => ({
        id: String(row.id),
        email: optionalString(row.email),
        hubspotContactId: optionalString(row.hubspot_contact_id),
      })),
      memberships: (membershipsResult.data ?? []).map((row) => ({
        id: String(row.id),
        profileId: String(row.profile_id),
        chapterId: String(row.chapter_id),
        status: optionalString(row.status),
        hubspotAssociationKey: optionalString(row.hubspot_association_key),
      })),
    });
  } catch (error) {
    return failure(
      "server_error",
      `HubSpot preflight failed safely without app-data writes: ${safeErrorMessage(error)}`,
    );
  }
}

export function buildHubSpotReadSyncPreflight(
  input: HubSpotReadSyncPreflightInput,
): Extract<HubSpotReadSyncPreflightResult, { success: true }> {
  const chaptersByHubSpotId = groupBy(input.chapters, (chapter) => chapter.hubspotCompanyId);
  const chaptersByName = groupBy(input.chapters, (chapter) => normalize(chapter.name));
  const resolvedChapters = new Map<string, ResolvedChapter>();
  const chapterCreateSamples: string[] = [];
  const chapterConflictSamples: string[] = [];
  const chapterCounts = {
    stableMatches: 0,
    nameMatches: 0,
    creates: 0,
    conflicts: 0,
    deactivations: 0,
  };

  for (const company of input.companies) {
    const stableMatches = chaptersByHubSpotId.get(company.id) ?? [];
    if (stableMatches.length === 1) {
      chapterCounts.stableMatches += 1;
      resolvedChapters.set(company.id, {
        status: "resolved",
        chapterId: stableMatches[0].id,
        match: "stable",
      });
      continue;
    }
    if (stableMatches.length > 1) {
      chapterCounts.conflicts += 1;
      resolvedChapters.set(company.id, { status: "conflict" });
      addSample(chapterConflictSamples, company.name);
      continue;
    }

    const nameMatches = chaptersByName.get(normalize(company.name)) ?? [];
    const linkedElsewhere = nameMatches.some((chapter) =>
      chapter.hubspotCompanyId && chapter.hubspotCompanyId !== company.id);
    if (nameMatches.length > 1 || linkedElsewhere) {
      chapterCounts.conflicts += 1;
      resolvedChapters.set(company.id, { status: "conflict" });
      addSample(chapterConflictSamples, company.name);
      continue;
    }
    if (nameMatches.length === 1) {
      chapterCounts.nameMatches += 1;
      resolvedChapters.set(company.id, {
        status: "resolved",
        chapterId: nameMatches[0].id,
        match: "name",
      });
      continue;
    }

    chapterCounts.creates += 1;
    resolvedChapters.set(company.id, {
      status: "resolved",
      chapterId: `new:${company.id}`,
      match: "create",
    });
    addSample(chapterCreateSamples, company.name);
  }

  const activeCompanyIds = new Set(input.companies.map((company) => company.id));
  chapterCounts.deactivations = input.chapters.filter((chapter) =>
    chapter.status === "active"
    && Boolean(chapter.hubspotCompanyId)
    && !activeCompanyIds.has(chapter.hubspotCompanyId ?? ""))
    .length;

  const profilesByHubSpotId = groupBy(input.profiles, (profile) => profile.hubspotContactId);
  const profilesByEmail = groupBy(input.profiles, (profile) => normalizeEmail(profile.email));
  const resolvedProfiles = new Map<string, ResolvedProfile>();
  const profileCounts = {
    stableMatches: 0,
    emailMatches: 0,
    unmatched: 0,
    conflicts: 0,
  };

  for (const contact of input.contacts) {
    const stableMatches = profilesByHubSpotId.get(contact.id) ?? [];
    if (stableMatches.length === 1) {
      profileCounts.stableMatches += 1;
      resolvedProfiles.set(contact.id, {
        status: "resolved",
        profileId: stableMatches[0].id,
        match: "stable",
      });
      continue;
    }
    if (stableMatches.length > 1) {
      profileCounts.conflicts += 1;
      resolvedProfiles.set(contact.id, { status: "conflict" });
      continue;
    }

    const emailMatches = profilesByEmail.get(normalizeEmail(contact.email)) ?? [];
    const linkedElsewhere = emailMatches.some((profile) =>
      profile.hubspotContactId && profile.hubspotContactId !== contact.id);
    if (emailMatches.length > 1 || linkedElsewhere) {
      profileCounts.conflicts += 1;
      resolvedProfiles.set(contact.id, { status: "conflict" });
      continue;
    }
    if (emailMatches.length === 1) {
      profileCounts.emailMatches += 1;
      resolvedProfiles.set(contact.id, {
        status: "resolved",
        profileId: emailMatches[0].id,
        match: "email",
      });
      continue;
    }

    profileCounts.unmatched += 1;
    resolvedProfiles.set(contact.id, { status: "unmatched" });
  }

  const membershipsByAssociation = groupBy(
    input.memberships,
    (membership) => membership.hubspotAssociationKey,
  );
  const membershipsByProfileChapter = groupBy(
    input.memberships,
    (membership) => `${membership.profileId}:${membership.chapterId}`,
  );
  const membershipCounts = {
    stableMatches: 0,
    links: 0,
    creates: 0,
    conflicts: 0,
    blockedByProfile: 0,
    blockedByChapter: 0,
    deactivations: 0,
  };
  const activeAssociationKeys = new Set<string>();
  let qualifiedContacts = 0;
  let qualifiedAssociations = 0;

  for (const contact of input.contacts) {
    const qualification = getHubSpotMembershipQualification(contact, {
      activeMemberTerms: input.activeMemberTerms,
    });
    if (!qualification) continue;
    qualifiedContacts += 1;

    for (const companyId of contact.companyIds) {
      qualifiedAssociations += 1;
      const associationKey = `${contact.id}:${companyId}`;
      activeAssociationKeys.add(associationKey);
      const profile = resolvedProfiles.get(contact.id);
      if (!profile || profile.status !== "resolved") {
        membershipCounts.blockedByProfile += 1;
        continue;
      }
      const chapter = resolvedChapters.get(companyId);
      if (!chapter || chapter.status !== "resolved") {
        membershipCounts.blockedByChapter += 1;
        continue;
      }

      const stableMatches = membershipsByAssociation.get(associationKey) ?? [];
      if (stableMatches.length === 1) {
        membershipCounts.stableMatches += 1;
        continue;
      }
      if (stableMatches.length > 1) {
        membershipCounts.conflicts += 1;
        continue;
      }

      if (chapter.match === "create") {
        membershipCounts.creates += 1;
        continue;
      }
      const profileChapterMatches = membershipsByProfileChapter.get(
        `${profile.profileId}:${chapter.chapterId}`,
      ) ?? [];
      const linkedElsewhere = profileChapterMatches.some((membership) =>
        membership.hubspotAssociationKey
        && membership.hubspotAssociationKey !== associationKey);
      if (profileChapterMatches.length > 1 || linkedElsewhere) {
        membershipCounts.conflicts += 1;
      } else if (profileChapterMatches.length === 1) {
        membershipCounts.links += 1;
      } else {
        membershipCounts.creates += 1;
      }
    }
  }

  membershipCounts.deactivations = input.memberships.filter((membership) =>
    membership.status === "active"
    && Boolean(membership.hubspotAssociationKey)
    && !activeAssociationKeys.has(membership.hubspotAssociationKey ?? ""))
    .length;

  return {
    success: true,
    code: "hubspot_preflight_succeeded",
    counts: {
      sourceCompanies: input.companies.length,
      sourceContacts: input.contacts.length,
      sourceAssociations: input.contacts.reduce(
        (total, contact) => total + contact.companyIds.length,
        0,
      ),
      qualifiedContacts,
      qualifiedAssociations,
      chapters: chapterCounts,
      profiles: profileCounts,
      memberships: membershipCounts,
    },
    chapterCreateSamples,
    chapterConflictSamples,
    message:
      "Read-only HubSpot preflight completed. No HubSpot or app-owned records were changed.",
  };
}

function createPreflightAppClient(
  env: Record<string, string | undefined>,
): AppClient | null {
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function groupBy<T>(
  rows: T[],
  getKey: (row: T) => string | null,
): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const row of rows) {
    const key = getKey(row);
    if (!key) continue;
    result.set(key, [...(result.get(key) ?? []), row]);
  }
  return result;
}

function parseDelimitedValues(value: string | undefined): string[] {
  return [...new Set((value ?? "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean))];
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeEmail(value: string | null | undefined): string {
  return normalize(value);
}

function optionalString(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function addSample(samples: string[], value: string) {
  if (samples.length < 8) samples.push(value);
}

function failure(
  code: Extract<HubSpotReadSyncPreflightResult, { success: false }>["code"],
  message: string,
): Extract<HubSpotReadSyncPreflightResult, { success: false }> {
  return { success: false, code, message };
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : "Unknown server error.";
}
