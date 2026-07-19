import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  createHubSpotReadClient,
  getHubSpotReadSyncConfig,
  mapChapterType,
  runHubSpotReadSync,
} from "@/services/hubspot-read-sync";
import { getAdminHubSpotSyncWorkspace } from "@/services/admin-hubspot-sync-workspace";

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

  it("runs the complete app-owned chapter, profile, and membership materialization path", async () => {
    const queries: FakeQuery[] = [];
    const appClient = createFakeAppClient((query) => {
      queries.push(query);
      if (query.table === "staff_role_assignments") return ok([{ role_key: "ds_admin" }]);
      if (query.table === "hubspot_sync_runs" && query.operation === "select") {
        return ok(query.filterValue("status") === "succeeded"
          ? [{ checkpoint_after: "2026-07-18T00:00:00.000Z" }]
          : []);
      }
      if (query.table === "hubspot_sync_runs" && query.operation === "insert") {
        return ok({ id: "run-1" });
      }
      if (query.table === "chapters" && query.operation === "select") return ok([]);
      if (query.table === "chapters" && query.operation === "insert") return ok({ id: "chapter-1" });
      if (query.table === "profiles" && query.operation === "select") {
        return ok([{ id: "profile-1", hubspot_contact_id: null }]);
      }
      if (query.table === "memberships" && query.operation === "select") return ok([]);
      if (query.table === "memberships" && query.operation === "insert") return ok({ id: "membership-1" });
      return ok([]);
    });
    const hubspotClient = {
      readActiveChapterCompanies: async () => [{
        id: "company-1",
        name: "University One",
        domain: "one.edu",
        lifecycleStage: "23925577",
        chapterStatus: "As expected",
        region: "Northeast",
        country: "United States",
        schoolType: "University",
        updatedAt: "2026-07-19T20:00:00.000Z",
        source: { id: "company-1" },
      }],
      readContactsWithCompanies: async () => [{
        id: "contact-1",
        email: "student@example.org",
        firstName: "TEST",
        lastName: "Student",
        graduationYear: 2028,
        updatedAt: "2026-07-19T21:00:00.000Z",
        companyIds: ["company-1", "inactive-company"],
        source: { id: "contact-1" },
      }],
    };

    const result = await runHubSpotReadSync("actor-1", "incremental", {
      env: enabledEnv,
      appClient: appClient as never,
      hubspotClient,
      now: () => new Date("2026-07-19T22:00:00.000Z"),
    });

    expect(result).toMatchObject({
      success: true,
      code: "hubspot_sync_succeeded",
      runId: "run-1",
      counts: {
        sourceCompanies: 1,
        sourceContacts: 1,
        materializedChapters: 1,
        matchedProfiles: 1,
        membershipUpserts: 1,
        conflicts: 0,
        failures: 0,
      },
    });
    expect(queries).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: "hubspot_company_imports", operation: "upsert" }),
      expect.objectContaining({ table: "hubspot_contact_imports", operation: "upsert" }),
      expect.objectContaining({ table: "hubspot_membership_imports", operation: "upsert" }),
      expect.objectContaining({ table: "chapters", operation: "insert" }),
      expect.objectContaining({ table: "profiles", operation: "update" }),
      expect.objectContaining({ table: "memberships", operation: "insert" }),
    ]));
    const finalRunUpdate = queries.findLast((query) => query.table === "hubspot_sync_runs" && query.operation === "update");
    expect(finalRunUpdate?.payload).toMatchObject({ status: "succeeded", source_company_count: 1, source_contact_count: 1 });
  });

  it("rejects non-admin actors and records provider failures without partial materialization", async () => {
    const memberClient = createFakeAppClient((query) => {
      if (query.table === "staff_role_assignments") return ok([{ role_key: "general_member" }]);
      return ok([]);
    });
    await expect(runHubSpotReadSync("member-1", "backfill", {
      env: enabledEnv,
      appClient: memberClient as never,
      hubspotClient: {
        readActiveChapterCompanies: vi.fn(),
        readContactsWithCompanies: vi.fn(),
      },
    })).resolves.toMatchObject({ success: false, code: "permission_denied" });

    const failureQueries: FakeQuery[] = [];
    const failureClient = createFakeAppClient((query) => {
      failureQueries.push(query);
      if (query.table === "staff_role_assignments") return ok([{ role_key: "super_admin" }]);
      if (query.table === "hubspot_sync_runs" && query.operation === "select") return ok([]);
      if (query.table === "hubspot_sync_runs" && query.operation === "insert") return ok({ id: "run-failed" });
      return ok([]);
    });
    const result = await runHubSpotReadSync("super-1", "backfill", {
      env: enabledEnv,
      appClient: failureClient as never,
      hubspotClient: {
        readActiveChapterCompanies: async () => { throw new Error("provider unavailable"); },
        readContactsWithCompanies: async () => [],
      },
      now: () => new Date("2026-07-19T22:00:00.000Z"),
    });

    expect(result).toMatchObject({ success: false, code: "server_error", runId: "run-failed" });
    expect(failureQueries).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: "hubspot_sync_failures", operation: "insert" }),
      expect.objectContaining({ table: "hubspot_sync_runs", operation: "update" }),
    ]));
  });

  it("returns database-backed admin sync readback and fails closed on query errors", async () => {
    const appClient = createFakeAppClient((query) => {
      if (query.table === "hubspot_sync_runs") return ok([{
        id: "run-1",
        mode: "backfill",
        status: "partial",
        started_at: "2026-07-19T20:00:00.000Z",
        completed_at: "2026-07-19T20:05:00.000Z",
        source_company_count: 345,
        source_contact_count: 672,
        materialized_chapter_count: 337,
        matched_profile_count: 110,
        conflict_count: 2,
        failure_count: 1,
      }]);
      if (query.table === "hubspot_sync_failures") return {
        data: [{
          id: "failure-1",
          object_type: "contact",
          external_id: "contact-1",
          error_code: "profile_link_failed",
          error_message: "Needs review",
          retry_count: 0,
          created_at: "2026-07-19T20:04:00.000Z",
        }],
        count: 1,
        error: null,
      };
      const pending = query.filterValue("reconciliation_status") === "pending";
      return { data: [], count: pending ? 4 : 10, error: null };
    });
    const workspace = await getAdminHubSpotSyncWorkspace({
      getSyncConfig: () => ({ enabled: true, environment: "production", reason: "Enabled." }),
      createServerClient: async () => ({
        client: appClient as never,
        config: { enabled: true, mode: "production_supabase", environment: "production", url: "https://example.supabase.co", anonKey: "browser", isLocalOnly: false, isHostedStaging: false, reason: "Enabled." },
      }),
    });

    expect(workspace).toMatchObject({
      canRead: true,
      lastRun: { status: "partial", sourceCompanies: 345, matchedProfiles: 110 },
      counts: { companies: 10, pendingCompanies: 4, openFailures: 1 },
      failures: [{ code: "profile_link_failed", message: "Needs review" }],
    });

    const unavailable = await getAdminHubSpotSyncWorkspace({
      getSyncConfig: () => ({ enabled: false, environment: "local", reason: "Disabled." }),
      createServerClient: async () => ({ client: null, config: { enabled: false, mode: "disabled", environment: "local", isLocalOnly: true, isHostedStaging: false, reason: "Auth unavailable." } }),
    });
    expect(unavailable).toMatchObject({ canRead: false, message: "Auth unavailable." });
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

type FakeResult = { data: unknown; error: { message: string } | null; count?: number | null };

class FakeQuery {
  operation = "select";
  payload: unknown = null;
  filters: Array<{ column: string; value: unknown }> = [];
  singleRow = false;

  constructor(
    readonly table: string,
    private readonly handler: (query: FakeQuery) => FakeResult,
  ) {}

  select() { return this; }
  insert(payload: unknown) { this.operation = "insert"; this.payload = payload; return this; }
  update(payload: unknown) { this.operation = "update"; this.payload = payload; return this; }
  upsert(payload: unknown) { this.operation = "upsert"; this.payload = payload; return this; }
  eq(column: string, value: unknown) { this.filters.push({ column, value }); return this; }
  ilike(column: string, value: unknown) { this.filters.push({ column, value }); return this; }
  is(column: string, value: unknown) { this.filters.push({ column, value }); return this; }
  order() { return this; }
  limit() { return this; }
  single() { this.singleRow = true; return Promise.resolve(this.handler(this)); }
  filterValue(column: string) { return this.filters.find((filter) => filter.column === column)?.value; }
  then(resolve: (value: FakeResult) => unknown, reject?: (reason: unknown) => unknown) {
    return Promise.resolve(this.handler(this)).then(resolve, reject);
  }
}

function createFakeAppClient(handler: (query: FakeQuery) => FakeResult) {
  return {
    schema: () => ({
      from: (table: string) => new FakeQuery(table, handler),
    }),
  };
}

function ok(data: unknown): FakeResult {
  return { data, error: null };
}
