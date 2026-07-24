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
});
