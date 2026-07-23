import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createLeaderEventForSupabase,
  getLeaderEventCreateWriteConfig,
  mapLeaderEventCreateRpcError,
  validateLeaderEventCreateInput,
  type LeaderEventCreateInput,
} from "@/services/leader-event-create-write";

const validInput = {
  requestId: "82000000-0000-4000-8000-000000000101",
  chapterId: "10000000-0000-4000-8000-000000000001",
  title: "TEST App-Owned Service Night",
  eventType: "volunteer",
  description: "A TEST service event created inside myMEDLIFE.",
  startsAt: "2030-08-01T18:00:00.000Z",
  endsAt: "2030-08-01T20:00:00.000Z",
  locationType: "hybrid",
  locationName: "Student center",
  virtualUrl: "https://example.org/test-meeting",
  capacity: 40,
  rsvpDeadline: "2030-07-31T23:59:59.000Z",
  organizingGroup: "Service Learning Prep & Awareness",
  campaignLabel: "Moving Mountains",
  auditReason: "Leader creates the app-owned launch test event.",
} satisfies LeaderEventCreateInput;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("leader app-owned event create write", () => {
  it("stays disabled by default and requires an environment-specific approval", () => {
    expect(getLeaderEventCreateWriteConfig({})).toMatchObject({
      enabled: false,
      environment: "local",
      externalWritesEnabled: false,
    });

    expect(
      getLeaderEventCreateWriteConfig({
        ...productionAuthEnv(),
        MYMEDLIFE_ENABLE_LEADER_EVENT_CREATE_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: false,
      environment: "production",
    });

    expect(
      getLeaderEventCreateWriteConfig({
        ...productionAuthEnv(),
        MYMEDLIFE_ENABLE_LEADER_EVENT_CREATE_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_LEADER_EVENT_CREATE_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      environment: "production",
      externalWritesEnabled: false,
    });

    expect(
      getLeaderEventCreateWriteConfig({
        ...stagingAuthEnv(),
        MYMEDLIFE_ENABLE_LEADER_EVENT_CREATE_WRITE: "true",
        MYMEDLIFE_ALLOW_STAGING_LEADER_EVENT_CREATE_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: false,
      environment: "staging",
    });

    expect(
      getLeaderEventCreateWriteConfig({
        ...stagingAuthEnv(),
        MYMEDLIFE_ENABLE_LEADER_EVENT_CREATE_WRITE: "true",
        MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES: "true",
        MYMEDLIFE_ALLOW_STAGING_LEADER_EVENT_CREATE_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      environment: "staging",
      externalWritesEnabled: false,
    });
  });

  it("validates the app-owned event contract before calling Supabase", () => {
    expect(validateLeaderEventCreateInput(validInput)).toBeNull();
    expect(
      validateLeaderEventCreateInput({
        ...validInput,
        title: "No",
      }),
    ).toBe("Event name must be between 3 and 160 characters.");
    expect(
      validateLeaderEventCreateInput({
        ...validInput,
        endsAt: "2030-08-01T17:00:00.000Z",
      }),
    ).toBe("Event end time cannot be before the start time.");
    expect(
      validateLeaderEventCreateInput({
        ...validInput,
        virtualUrl: "http://example.org/not-secure",
      }),
    ).toBe("Add a valid HTTPS meeting link.");
    expect(
      validateLeaderEventCreateInput({
        ...validInput,
        auditReason: "Too short",
      }),
    ).toBe("Add a clear audit reason of at least 12 characters.");
  });

  it("requires an authenticated Supabase session", async () => {
    enableLocalWriteEnv();
    const fakeClient = buildRpcClient(
      vi.fn().mockResolvedValue({ data: [], error: null }),
    );

    const result = await createLeaderEventForSupabase(validInput, {
      createServerClient: async () => ({
        client: fakeClient,
        config: { reason: "Test client available." },
      }),
      getSessionState: async () => ({
        status: "signed_out",
        isLocalOnly: true,
        isHostedStaging: false,
        environment: "local",
        message: "No session.",
        user: null,
      }),
    });

    expect(result).toMatchObject({
      success: false,
      code: "missing_auth",
      externalWritesEnabled: false,
    });
  });

  it("calls the authenticated RPC and maps its audited result", async () => {
    enableLocalWriteEnv();
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          chapter_event_id: "51000000-0000-4000-8000-000000000101",
          event_id: "71000000-0000-4000-8000-000000000101",
          audit_log_id: "91000000-0000-4000-8000-000000000101",
          deduplicated: false,
        },
      ],
      error: null,
    });
    const fakeClient = buildRpcClient(rpc);

    const result = await createLeaderEventForSupabase(validInput, {
      createServerClient: async () => ({
        client: fakeClient,
        config: { reason: "Test client available." },
      }),
      getSessionState: async () => signedInSession(),
    });

    expect(fakeClient.schema).toHaveBeenCalledWith("app");
    expect(rpc).toHaveBeenCalledWith(
      "create_chapter_event_for_leader",
      expect.objectContaining({
        request_uuid: validInput.requestId,
        chapter_uuid: validInput.chapterId,
        title_input: validInput.title,
        event_type_input: "volunteer",
        location_type_input: "hybrid",
        capacity_input: 40,
        audit_reason_input: validInput.auditReason,
      }),
    );
    expect(result).toMatchObject({
      success: true,
      code: "chapter_event_created",
      chapterEventId: "51000000-0000-4000-8000-000000000101",
      eventId: "71000000-0000-4000-8000-000000000101",
      auditLogId: "91000000-0000-4000-8000-000000000101",
      deduplicated: false,
      externalWritesEnabled: false,
    });
  });

  it("preserves idempotency readback from the RPC", async () => {
    enableLocalWriteEnv();

    const result = await createLeaderEventForSupabase(validInput, {
      createServerClient: async () => ({
        client: buildRpcClient(
          vi.fn().mockResolvedValue({
            data: [
              {
                chapter_event_id: "51000000-0000-4000-8000-000000000101",
                event_id: "71000000-0000-4000-8000-000000000101",
                audit_log_id: "91000000-0000-4000-8000-000000000101",
                deduplicated: true,
              },
            ],
            error: null,
          }),
        ),
        config: { reason: "Test client available." },
      }),
      getSessionState: async () => signedInSession(),
    });

    expect(result).toMatchObject({
      success: true,
      deduplicated: true,
    });
    if (!result.success) {
      throw new Error("Expected idempotent event creation to succeed.");
    }
    expect(result.plainEnglishMessage).toContain("no duplicate event");
  });

  it("maps permission, chapter, validation, and unknown errors without claiming success", () => {
    expect(
      mapLeaderEventCreateRpcError({
        code: "42501",
        message: "actor cannot create chapter events",
      }),
    ).toMatchObject({ success: false, code: "permission_denied" });
    expect(
      mapLeaderEventCreateRpcError({
        code: "P0002",
        message: "active chapter not found",
      }),
    ).toMatchObject({ success: false, code: "chapter_not_found" });
    expect(
      mapLeaderEventCreateRpcError({
        code: "22023",
        message: "event end time cannot be before start time",
      }),
    ).toMatchObject({ success: false, code: "validation_error" });
    expect(
      mapLeaderEventCreateRpcError({
        code: "XX000",
        message: "unexpected database error",
      }),
    ).toMatchObject({ success: false, code: "server_error" });
  });
});

function enableLocalWriteEnv() {
  vi.stubEnv("MYMEDLIFE_AUTH_MODE", "local_supabase");
  vi.stubEnv("MYMEDLIFE_ENABLE_LEADER_EVENT_CREATE_WRITE", "true");
  vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "local-anon-key");
}

function productionAuthEnv() {
  return {
    MYMEDLIFE_AUTH_MODE: "production_supabase",
    NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
    NEXT_PUBLIC_SUPABASE_URL:
      "https://fnlhontvvprwgooevzdl.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "production-browser-key",
  };
}

function stagingAuthEnv() {
  return {
    MYMEDLIFE_AUTH_MODE: "staging_supabase",
    NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
    NEXT_PUBLIC_SUPABASE_URL:
      "https://rceupryepjgkdeqgxzrc.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "staging-browser-key",
  };
}

function buildRpcClient(rpcImpl: ReturnType<typeof vi.fn>) {
  return {
    schema: vi.fn().mockReturnValue({
      rpc: rpcImpl,
    }),
  };
}

function signedInSession() {
  return {
    status: "signed_in" as const,
    isLocalOnly: true,
    isHostedStaging: false,
    environment: "local" as const,
    message: "Signed in.",
    user: {
      id: "00000000-0000-4000-8000-000000000002",
      email: "leader.a@mymedlife.test",
      displayName: "Leader A",
    },
  };
}
