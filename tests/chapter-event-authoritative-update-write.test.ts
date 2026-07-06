import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hasChapterEventAuthoritativeUpdateSupabaseId,
  hasImplementedChapterEventAuthoritativeUpdateFields,
  mapChapterEventAuthoritativeUpdateRpcError,
  submitChapterEventAuthoritativeUpdateForLocalSupabase,
} from "@/services/chapter-event-authoritative-update-write";
import type { ChapterEventAuthoritativeUpdateInput } from "@/services/chapter-event-authoritative-update-readiness";

const validInput = {
  chapterEventId: "70000000-0000-4000-8000-000000000021",
  patch: {
    status: "scheduled",
    attendance_count: 18,
  },
  auditReason: "Correct local event status and attendance after chapter review.",
} satisfies ChapterEventAuthoritativeUpdateInput;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("chapter-event authoritative update write", () => {
  it("stays disabled by default", async () => {
    const result = await submitChapterEventAuthoritativeUpdateForLocalSupabase(
      validInput,
    );

    expect(result).toMatchObject({
      success: false,
      code: "write_disabled",
      chapterEventId: validInput.chapterEventId,
    });
  });

  it("validates the local Supabase UUID and first authoritative field subset", () => {
    expect(
      hasChapterEventAuthoritativeUpdateSupabaseId(validInput.chapterEventId),
    ).toBe(true);
    expect(hasChapterEventAuthoritativeUpdateSupabaseId("mock-event")).toBe(false);

    expect(
      hasImplementedChapterEventAuthoritativeUpdateFields(validInput.patch),
    ).toBe(true);
    expect(
      hasImplementedChapterEventAuthoritativeUpdateFields({
        title: "Test Event",
      }),
    ).toBe(false);
    expect(hasImplementedChapterEventAuthoritativeUpdateFields({})).toBe(false);
  });

  it("rejects mock ids, unsupported fields, and short audit reasons before any RPC call", async () => {
    const env = enableLocalChapterEventWrites();

    await expectChapterEventFailure(
      { ...validInput, chapterEventId: "mock-event" },
      "chapter_event_not_found",
      env,
    );
    await expectChapterEventFailure(
      {
        ...validInput,
        patch: {
          title: "Test Event",
        },
      },
      "field_subset_invalid",
      env,
    );
    await expectChapterEventFailure(
      {
        ...validInput,
        auditReason: "Too short",
      },
      "audit_reason_required",
      env,
    );
  });

  it("requires a local Supabase client and a signed-in session", async () => {
    const env = enableLocalChapterEventWrites();

    await expectChapterEventFailure(validInput, "write_disabled", env, {
      createServerClient: async () => ({
        client: null,
        config: { reason: "Local Supabase is not configured." },
      }),
    });

    const fakeClient = buildRpcClient(
      vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    );

    await expectChapterEventFailure(validInput, "missing_auth", env, {
      createServerClient: async () => ({
        client: fakeClient,
        config: { reason: "Test client is available." },
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
  });

  it("maps RPC permission and validation errors without reporting success", async () => {
    await expectChapterEventFailure(validInput, "permission_denied", enableLocalChapterEventWrites(), {
      createServerClient: async () => ({
        client: buildRpcClient(
          vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: "42501",
              message: "actor cannot update authoritative chapter event fields",
            },
          }),
        ),
        config: { reason: "Test client is available." },
      }),
      getSessionState: async () => signedInSession(),
    });

    await expectChapterEventFailure(validInput, "field_subset_invalid", enableLocalChapterEventWrites(), {
      createServerClient: async () => ({
        client: buildRpcClient(
          vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: "22023",
              message:
                "field title is outside the first audited chapter event update subset",
            },
          }),
        ),
        config: { reason: "Test client is available." },
      }),
      getSessionState: async () => signedInSession(),
    });

    await expectChapterEventFailure(validInput, "server_error", enableLocalChapterEventWrites(), {
      createServerClient: async () => ({
        client: buildRpcClient(
          vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        ),
        config: { reason: "Test client is available." },
      }),
      getSessionState: async () => signedInSession(),
    });
  });

  it("maps a successful audited RPC response into a chapter-event update result", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          chapter_event_id: validInput.chapterEventId,
          updated_fields: ["status", "attendance_count"],
          event_id: "80000000-0000-4000-8000-000000000044",
          audit_log_id: "90000000-0000-4000-8000-000000000044",
        },
      ],
      error: null,
    });
    const fakeClient = buildRpcClient(rpc);

    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "local_supabase");
    vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
    vi.stubEnv(
      "MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE",
      "true",
    );
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "local-anon-key");

    const result = await submitChapterEventAuthoritativeUpdateForLocalSupabase(
      validInput,
      {
        createServerClient: async () => ({
          client: fakeClient,
          config: { reason: "Test client is available." },
        }),
        getSessionState: async () => signedInSession(),
      },
    );

    expect(fakeClient.schema).toHaveBeenCalledWith("app");
    expect(rpc).toHaveBeenCalledWith(
      "update_chapter_event_authoritative_fields",
      {
        chapter_event_uuid: validInput.chapterEventId,
        field_patch: validInput.patch,
        audit_reason_input: validInput.auditReason,
      },
    );
    expect(result).toMatchObject({
      success: true,
      code: "chapter_event_updated",
      chapterEventId: validInput.chapterEventId,
      updatedFields: ["status", "attendance_count"],
      eventId: "80000000-0000-4000-8000-000000000044",
      auditLogId: "90000000-0000-4000-8000-000000000044",
    });
    if (!result.success) {
      throw new Error("Expected chapter-event update write to succeed.");
    }
    expect(result.plainEnglishMessage).toContain("audited local server-only wrapper");
  });

  it("maps known RPC errors into stable result codes", () => {
    expect(
      mapChapterEventAuthoritativeUpdateRpcError(validInput.chapterEventId, {
        code: "P0002",
        message: "chapter event not found",
      }),
    ).toMatchObject({
      success: false,
      code: "chapter_event_not_found",
    });
    expect(
      mapChapterEventAuthoritativeUpdateRpcError(validInput.chapterEventId, {
        code: "22023",
        message: "chapter event update reason must be at least 12 characters",
      }),
    ).toMatchObject({
      success: false,
      code: "audit_reason_required",
    });
  });
});

function enableLocalChapterEventWrites() {
  return {
    MYMEDLIFE_AUTH_MODE: "local_supabase",
    MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE: "true",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
  } satisfies Record<string, string>;
}

async function expectChapterEventFailure(
  input: ChapterEventAuthoritativeUpdateInput,
  code: string,
  env: Record<string, string>,
  deps?: Parameters<typeof submitChapterEventAuthoritativeUpdateForLocalSupabase>[1],
) {
  vi.stubEnv("MYMEDLIFE_AUTH_MODE", env.MYMEDLIFE_AUTH_MODE);
  vi.stubEnv(
    "MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES",
    env.MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES,
  );
  vi.stubEnv(
    "MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE",
    env.MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE,
  );
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const result = await submitChapterEventAuthoritativeUpdateForLocalSupabase(
    input,
    deps,
  );

  expect(result).toMatchObject({
    success: false,
    code,
    chapterEventId: input.chapterEventId,
  });
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
      id: "00000000-0000-4000-8000-000000000101",
      email: "leader.a@mymedlife.test",
      displayName: "Leader A",
    },
  };
}
