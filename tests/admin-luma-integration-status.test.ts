import { describe, expect, it } from "vitest";

import { getAdminLumaIntegrationStatus } from "@/services/admin-luma-integration-status";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("admin Luma integration status", () => {
  it("gives DS Admin a secret-free Luma setup readback", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing Luma setup route.");
    const status = getAdminLumaIntegrationStatus(actor, data, {
      MYMEDLIFE_LUMA_MODE: "staging",
    });

    expect(status.canReadWorkspace).toBe(true);
    expect(status.environment).toBe("staging");
    expect(status.counts.calendars).toBeGreaterThan(0);
    expect(status.counts.linkedEvents).toBeGreaterThan(0);
    expect(status.counts.browserSecretsShown).toBe(0);
    expect(status.counts.externalWritesEnabled).toBe(0);
    expect(status.blockedControls).toContain("show raw API key");
    expect(status.safetyNotes.join(" ")).toContain("does not call the Luma API");
    expect(status.setupChecks).toContainEqual(expect.objectContaining({
      label: "Provider event-link readback",
      value: "ready",
      status: "pass",
    }));
    expect(status.setupChecks).toContainEqual({
      label: "Member QR check-in",
      value: "preview-only",
      status: "blocked",
      detail:
        "The member event surface still labels its QR code as Preview only. QR scanning is not counted as production-ready.",
    });
  });

  it("does not count an unlinked provider URL as app-owned event readback", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing incomplete Luma event linking.");
    data.allLumaEventLinkRows = data.allLumaEventLinkRows.map((row) => ({
      ...row,
      chapter_event_id: null,
    }));

    const status = getAdminLumaIntegrationStatus(actor, data, {
      MYMEDLIFE_LUMA_MODE: "staging",
    });

    expect(status.setupChecks).toContainEqual({
      label: "Provider event-link readback",
      value: "pending",
      status: "needs_setup",
      detail: "No active Luma URL is attached to an app-owned chapter event yet.",
    });
  });

  it("shows live-ready credentials as not enabled without exposing secret values", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing live-ready Luma posture.");
    const status = getAdminLumaIntegrationStatus(actor, data, {
      LUMA_API_KEY: "should-not-render",
      LUMA_CALENDAR_ID: "cal-test",
    });

    expect(status.environment).toBe("live_ready_not_enabled");
    expect(status.environmentLabel).toBe("Live-ready, not enabled");
    expect(JSON.stringify(status)).not.toContain("should-not-render");
    expect(status.counts.browserSecretsShown).toBe(0);
  });

  it("reports approved server-only reads without implying provider writes", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing enabled Luma read sync posture.");
    const status = getAdminLumaIntegrationStatus(actor, data, {
      MYMEDLIFE_AUTH_MODE: "staging_supabase",
      MYMEDLIFE_ENABLE_LUMA_READ_SYNC: "true",
      MYMEDLIFE_ALLOW_STAGING_LUMA_READ_SYNC: "true",
      MYMEDLIFE_LUMA_CHAPTER_ID: "chapter-test",
      LUMA_API_KEY: "server-only-secret",
      LUMA_CALENDAR_ID: "calendar-test",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });

    expect(status.readSyncEnabled).toBe(true);
    expect(status.providerStatus).toBe("live_read_enabled");
    expect(status.environmentLabel).toBe("Staging read sync enabled");
    expect(status.testConnection.label).toBe("Provider read sync active");
    expect(status.counts.externalReadsEnabled).toBe(1);
    expect(status.counts.externalWritesEnabled).toBe(0);
    expect(status.safetyNotes.join(" ")).toContain("server-only Luma event reads");
    expect(status.safetyNotes.join(" ")).toContain("does not create, update, or delete provider-side Luma events");
    expect(JSON.stringify(status)).not.toContain("server-only-secret");
    expect(JSON.stringify(status)).not.toContain("service-role-secret");
  });

  it("keeps Supabase-backed production visibly disabled instead of calling it staging-ready", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing production Luma posture.");
    data.source = {
      mode: "supabase",
      status: "supabase_ready",
      message: "Reading hosted production Supabase data.",
    };
    const status = getAdminLumaIntegrationStatus(actor, data, {
      VERCEL_ENV: "production",
    });

    expect(status.environment).toBe("disabled");
    expect(status.environmentLabel).toBe("Production");
    expect(status.providerStatus).toBe("disabled");
    expect(status.testConnection.status).toBe("blocked");
    expect(status.testConnection.label).toBe("Connection disabled");
  });

  it("blocks non-DS staff from provider setup", () => {
    const actor = getMockLocalActorContext("general.staff@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing blocked Luma setup route.");

    expect(getAdminLumaIntegrationStatus(actor, data).canReadWorkspace).toBe(false);
  });

  it("redacts provider errors in the visible error log", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing Luma error redaction.");
    data.automationOutboxRows = [
      ...data.automationOutboxRows,
      {
        id: "outbox-luma-failed",
        source_event_id: null,
        integration_event_id: null,
        chapter_id: null,
        destination: "luma",
        event_type: "luma_event_update",
        payload: {},
        idempotency_key: "test-luma-failed",
        status: "failed",
        attempt_count: 1,
        available_at: "2026-07-04T20:00:00.000Z",
        locked_at: null,
        sent_at: null,
        last_error: "Bearer secret-token token=secret-refresh api_key=secret-key",
        created_at: "2026-07-04T20:00:00.000Z",
        updated_at: "2026-07-04T20:01:00.000Z",
      },
    ];

    const status = getAdminLumaIntegrationStatus(actor, data, {
      MYMEDLIFE_LUMA_MODE: "staging",
    });
    const messages = status.errorLog.map((item) => item.message).join(" ");

    expect(messages).toContain("Bearer [redacted]");
    expect(messages).toContain("token=[redacted]");
    expect(messages).toContain("api_key=[redacted]");
    expect(messages).not.toContain("secret-token");
    expect(messages).not.toContain("secret-refresh");
    expect(messages).not.toContain("secret-key");
  });
});
