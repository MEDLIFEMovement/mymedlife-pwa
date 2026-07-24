import { describe, expect, it, vi } from "vitest";

import type {
  HubSpotCompanyRecord,
  HubSpotContactRecord,
} from "@/services/hubspot-read-sync";
import {
  buildHubSpotReadSyncPreflight,
  runHubSpotReadSyncPreflight,
} from "@/services/hubspot-read-sync-preflight";

function company(id: string, name: string): HubSpotCompanyRecord {
  return {
    id,
    name,
    domain: null,
    lifecycleStage: "23878512",
    chapterStatus: "As expected",
    region: null,
    country: null,
    schoolType: "University",
    updatedAt: "2026-07-24T12:00:00.000Z",
    source: {},
  };
}

function contact(
  id: string,
  email: string,
  companyIds: string[],
  activeYears: string[] = ["2026-2027"],
): HubSpotContactRecord {
  return {
    id,
    email,
    firstName: "Member",
    lastName: id,
    graduationYear: null,
    activeYears,
    eboard: false,
    eboardYears: [],
    eboardPosition: null,
    involvementTypes: ["QR contact"],
    qrYears: [],
    updatedAt: "2026-07-24T12:00:00.000Z",
    companyIds,
    source: {},
  };
}

describe("HubSpot read-sync preflight", () => {
  it("classifies the production write impact without changing provider or app data", () => {
    const result = buildHubSpotReadSyncPreflight({
      companies: [
        company("company-stable", "Stable University"),
        company("company-name", "Name Match University"),
        company("company-create", "New University"),
        company("company-conflict", "Duplicate University"),
      ],
      contacts: [
        contact("contact-stable", "stable@example.org", ["company-stable"]),
        contact("contact-email", "email@example.org", ["company-name"]),
        contact("contact-unmatched", "unmatched@example.org", ["company-create"]),
        contact("contact-create", "create@example.org", ["company-create"]),
        contact("contact-conflict", "conflict@example.org", ["company-conflict"]),
        contact("contact-ineligible", "ineligible@example.org", ["company-stable"], ["2025-2026"]),
      ],
      activeMemberTerms: ["2026-2027", "2026-27"],
      chapters: [
        {
          id: "chapter-stable",
          name: "Stable University",
          status: "active",
          hubspotCompanyId: "company-stable",
        },
        {
          id: "chapter-name",
          name: "Name Match University",
          status: "active",
          hubspotCompanyId: null,
        },
        {
          id: "chapter-conflict-a",
          name: "Duplicate University",
          status: "active",
          hubspotCompanyId: null,
        },
        {
          id: "chapter-conflict-b",
          name: "Duplicate University",
          status: "active",
          hubspotCompanyId: null,
        },
        {
          id: "chapter-deactivate",
          name: "Former University",
          status: "active",
          hubspotCompanyId: "former-company",
        },
      ],
      profiles: [
        {
          id: "profile-stable",
          email: "stable@example.org",
          hubspotContactId: "contact-stable",
        },
        {
          id: "profile-email",
          email: "email@example.org",
          hubspotContactId: null,
        },
        {
          id: "profile-create",
          email: "create@example.org",
          hubspotContactId: "contact-create",
        },
        {
          id: "profile-conflict",
          email: "conflict@example.org",
          hubspotContactId: "contact-conflict",
        },
      ],
      memberships: [
        {
          id: "membership-stable",
          profileId: "profile-stable",
          chapterId: "chapter-stable",
          status: "active",
          hubspotAssociationKey: "contact-stable:company-stable",
        },
        {
          id: "membership-link",
          profileId: "profile-email",
          chapterId: "chapter-name",
          status: "active",
          hubspotAssociationKey: null,
        },
        {
          id: "membership-deactivate",
          profileId: "former-profile",
          chapterId: "chapter-deactivate",
          status: "active",
          hubspotAssociationKey: "former-contact:former-company",
        },
      ],
    });

    expect(result).toMatchObject({
      success: true,
      code: "hubspot_preflight_succeeded",
      counts: {
        sourceCompanies: 4,
        sourceContacts: 6,
        sourceAssociations: 6,
        qualifiedContacts: 5,
        qualifiedAssociations: 5,
        chapters: {
          stableMatches: 1,
          nameMatches: 1,
          creates: 1,
          conflicts: 1,
          deactivations: 1,
        },
        memberships: {
          stableMatches: 1,
          links: 1,
          creates: 1,
          conflicts: 0,
          blockedByProfile: 1,
          blockedByChapter: 1,
          deactivations: 1,
        },
      },
      chapterCreateSamples: ["New University"],
      chapterConflictSamples: ["Duplicate University"],
    });
  });

  it("fails before reading app data when the server-only token is missing", async () => {
    const appClient = {
      schema: vi.fn(),
    };

    await expect(runHubSpotReadSyncPreflight("actor-1", {
      env: {
        MYMEDLIFE_HUBSPOT_ACTIVE_MEMBER_TERMS: "2026-2027,2026-27",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        SUPABASE_URL: "https://example.supabase.co",
      },
      appClient: appClient as never,
    })).resolves.toEqual({
      success: false,
      code: "preflight_disabled",
      message: "HubSpot preflight is disabled because the server-only access token is missing.",
    });
    expect(appClient.schema).not.toHaveBeenCalled();
  });

  it("runs the full provider and app-owned read path without mutation methods", async () => {
    const appClient = createReadOnlyAppClient({
      staff_role_assignments: ok([{ role_key: "super_admin" }]),
      chapters: ok([{
        id: "chapter-1",
        name: "University One",
        status: "active",
        hubspot_company_id: "company-1",
      }]),
      profiles: ok([{
        id: "profile-1",
        email: "member@example.org",
        hubspot_contact_id: null,
      }]),
      memberships: ok([]),
    });
    const hubspotClient = {
      readActiveChapterCompanies: vi.fn().mockResolvedValue([
        company("company-1", "University One"),
      ]),
      readContactsWithCompanies: vi.fn().mockResolvedValue([
        contact(
          "contact-1",
          "member@example.org",
          ["company-1", "inactive-company"],
        ),
      ]),
    };

    const result = await runHubSpotReadSyncPreflight("actor-1", {
      env: {
        HUBSPOT_ACCESS_TOKEN: "server-only-token",
        MYMEDLIFE_HUBSPOT_ACTIVE_MEMBER_TERMS: "2026-2027;2026-27",
      },
      appClient: appClient as never,
      hubspotClient,
    });

    expect(result).toMatchObject({
      success: true,
      counts: {
        sourceCompanies: 1,
        sourceContacts: 1,
        sourceAssociations: 1,
        qualifiedContacts: 1,
        chapters: { stableMatches: 1 },
        profiles: { emailMatches: 1 },
        memberships: { creates: 1 },
      },
    });
    expect(hubspotClient.readContactsWithCompanies).toHaveBeenCalledWith(
      null,
      ["company-1"],
    );
    expect(appClient.tablesRead).toEqual([
      "staff_role_assignments",
      "chapters",
      "profiles",
      "memberships",
    ]);
  });

  it("keeps configuration, authorization, query, and provider failures read-only", async () => {
    const enabledEnv = {
      HUBSPOT_ACCESS_TOKEN: "server-only-token",
      MYMEDLIFE_HUBSPOT_ACTIVE_MEMBER_TERMS: "2026-2027,2026-27",
    };
    const hubspotClient = {
      readActiveChapterCompanies: vi.fn().mockResolvedValue([]),
      readContactsWithCompanies: vi.fn().mockResolvedValue([]),
    };

    await expect(runHubSpotReadSyncPreflight(null, {
      env: enabledEnv,
      appClient: createReadOnlyAppClient({}) as never,
      hubspotClient,
    })).resolves.toMatchObject({ success: false, code: "missing_auth" });

    await expect(runHubSpotReadSyncPreflight("actor-1", {
      env: { HUBSPOT_ACCESS_TOKEN: "server-only-token" },
      appClient: createReadOnlyAppClient({}) as never,
      hubspotClient,
    })).resolves.toMatchObject({
      success: false,
      code: "preflight_disabled",
      message: expect.stringContaining("member-term allowlist"),
    });

    await expect(runHubSpotReadSyncPreflight("actor-1", {
      env: enabledEnv,
      appClient: null as never,
      hubspotClient,
    })).resolves.toMatchObject({
      success: false,
      code: "preflight_disabled",
      message: expect.stringContaining("Supabase client"),
    });

    await expect(runHubSpotReadSyncPreflight("actor-1", {
      env: enabledEnv,
      appClient: createReadOnlyAppClient({
        staff_role_assignments: ok([{ role_key: "coach" }]),
      }) as never,
      hubspotClient,
    })).resolves.toMatchObject({ success: false, code: "permission_denied" });

    await expect(runHubSpotReadSyncPreflight("actor-1", {
      env: enabledEnv,
      appClient: createReadOnlyAppClient({
        staff_role_assignments: failed("role read failed"),
      }) as never,
      hubspotClient,
    })).resolves.toMatchObject({
      success: false,
      code: "server_error",
      message: expect.stringContaining("administrator role"),
    });

    await expect(runHubSpotReadSyncPreflight("actor-1", {
      env: enabledEnv,
      appClient: createReadOnlyAppClient({
        staff_role_assignments: ok([{ role_key: "ds_admin" }]),
        chapters: failed("chapter read failed"),
        profiles: ok([]),
        memberships: ok([]),
      }) as never,
      hubspotClient,
    })).resolves.toMatchObject({
      success: false,
      code: "server_error",
      message: expect.stringContaining("chapter read failed"),
    });

    await expect(runHubSpotReadSyncPreflight("actor-1", {
      env: enabledEnv,
      appClient: createReadOnlyAppClient({
        staff_role_assignments: ok([{ role_key: "ds_admin" }]),
      }) as never,
      hubspotClient: {
        ...hubspotClient,
        readActiveChapterCompanies: vi.fn().mockRejectedValue(
          new Error("provider unavailable"),
        ),
      },
    })).resolves.toMatchObject({
      success: false,
      code: "server_error",
      message: expect.stringContaining("provider unavailable"),
    });
  });
});

type ReadResult = {
  data: Array<Record<string, unknown>> | null;
  error: { message: string } | null;
};

function ok(data: Array<Record<string, unknown>>): ReadResult {
  return { data, error: null };
}

function failed(message: string): ReadResult {
  return { data: null, error: { message } };
}

function createReadOnlyAppClient(results: Record<string, ReadResult>) {
  const tablesRead: string[] = [];

  return {
    tablesRead,
    schema: vi.fn(() => ({
      from: (table: string) => {
        tablesRead.push(table);
        return new ReadOnlyQuery(results[table] ?? ok([]));
      },
    })),
  };
}

class ReadOnlyQuery implements PromiseLike<ReadResult> {
  constructor(private readonly result: ReadResult) {}

  select() {
    return this;
  }

  eq() {
    return this;
  }

  then<TResult1 = ReadResult, TResult2 = never>(
    onfulfilled?: ((value: ReadResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}
