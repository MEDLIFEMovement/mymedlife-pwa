import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  createHubSpotReadClient,
  getHubSpotReadSyncConfig,
  mapChapterType,
} from "@/services/hubspot-read-sync";

const enabledEnv = {
  MYMEDLIFE_AUTH_MODE: "production_supabase",
  MYMEDLIFE_ENABLE_HUBSPOT_READ_SYNC: "true",
  MYMEDLIFE_ALLOW_PRODUCTION_HUBSPOT_READ_SYNC: "true",
  HUBSPOT_ACCESS_TOKEN: "server-only-token",
  SUPABASE_SERVICE_ROLE_KEY: "server-only-service-key",
  SUPABASE_URL: "https://example.supabase.co",
};

describe("HubSpot read sync foundation", () => {
  it("requires the feature flag, server-only credentials, and environment approval", () => {
    expect(getHubSpotReadSyncConfig({
      ...enabledEnv,
      MYMEDLIFE_ENABLE_HUBSPOT_READ_SYNC: undefined,
    })).toMatchObject({ enabled: false, environment: "production" });

    expect(getHubSpotReadSyncConfig({
      ...enabledEnv,
      HUBSPOT_ACCESS_TOKEN: undefined,
    })).toMatchObject({
      enabled: false,
      reason: "HubSpot read sync is disabled because the server-only access token is missing.",
    });

    expect(getHubSpotReadSyncConfig({
      ...enabledEnv,
      MYMEDLIFE_ALLOW_PRODUCTION_HUBSPOT_READ_SYNC: undefined,
    })).toMatchObject({ enabled: false, environment: "production" });

    expect(getHubSpotReadSyncConfig(enabledEnv)).toMatchObject({
      enabled: true,
      environment: "production",
    });
  });

  it("paginates active chapter companies and maps stable source fields", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        results: [{
          id: "company-1",
          properties: {
            name: "University One",
            domain: "one.edu",
            lifecyclestage: "23925577",
            chapter_status: "As expected",
            region__c: "Northeast",
            school_country: "United States",
            school_type__c: "University",
            hs_lastmodifieddate: "2026-07-19T20:00:00.000Z",
          },
        }],
        paging: { next: { after: "next-page" } },
      }))
      .mockResolvedValueOnce(jsonResponse({
        results: [{
          id: "company-2",
          properties: { name: "TEST High School", school_type__c: "High School" },
        }],
      }));

    const client = createHubSpotReadClient(enabledEnv, fetchMock);
    const companies = await client?.readActiveChapterCompanies();

    expect(companies).toHaveLength(2);
    expect(companies?.[0]).toMatchObject({
      id: "company-1",
      name: "University One",
      domain: "one.edu",
      region: "Northeast",
      schoolType: "University",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("23925577");
    expect(String(fetchMock.mock.calls[1]?.[1]?.body)).toContain("next-page");
  });

  it("reads contact-company associations without sending provider writes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      results: [{
        id: "contact-1",
        properties: {
          email: "STUDENT@EXAMPLE.ORG",
          firstname: "Test",
          lastname: "Student",
          graduation_year__c: "2028",
          hs_lastmodifieddate: "2026-07-19T21:00:00.000Z",
        },
        associations: { companies: { results: [{ id: "company-1" }] } },
      }],
    }));

    const client = createHubSpotReadClient(enabledEnv, fetchMock);
    const contacts = await client?.readContactsWithCompanies();

    expect(contacts).toEqual([expect.objectContaining({
      id: "contact-1",
      email: "STUDENT@EXAMPLE.ORG",
      graduationYear: 2028,
      companyIds: ["company-1"],
    })]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/crm/v3/objects/contacts?"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBeUndefined();
  });

  it("maps HubSpot school types into the app-owned chapter taxonomy", () => {
    expect(mapChapterType("High School")).toBe("high_school");
    expect(mapChapterType("University")).toBe("college_university");
    expect(mapChapterType("CGEP")).toBe("college_university");
    expect(mapChapterType("International Network")).toBe("needs_review");
  });

  it("keeps source data, sync status, failures, and admin-only RLS in the migration", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260719224854_hubspot_read_sync_foundation.sql"),
      "utf8",
    );

    expect(sql).toContain("create table app.hubspot_sync_runs");
    expect(sql).toContain("create table app.hubspot_company_imports");
    expect(sql).toContain("create table app.hubspot_contact_imports");
    expect(sql).toContain("create table app.hubspot_membership_imports");
    expect(sql).toContain("create table app.hubspot_sync_failures");
    expect(sql).toContain("memberships_hubspot_association_key_unique");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("using (app.is_ds_admin())");
    expect(sql).not.toContain("HUBSPOT_ACCESS_TOKEN");
  });
});

function jsonResponse(value: unknown) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
