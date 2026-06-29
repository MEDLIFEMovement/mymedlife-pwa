import { describe, expect, it } from "vitest";
import {
  createSupabaseReadonlyAccess,
  createSupabaseReadonlyClient,
  getSupabaseReadConfig,
} from "@/lib/supabase-readonly";

describe("supabase read-only client", () => {
  it("uses mock fallback unless Supabase reads are explicitly enabled", () => {
    expect(getSupabaseReadConfig({}).enabled).toBe(false);
    expect(
      getSupabaseReadConfig({
        MYMEDLIFE_DATA_SOURCE: "supabase",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        SUPABASE_SERVICE_ROLE_KEY: "fake-key",
      }).enabled,
    ).toBe(false);
  });

  it("allows only localhost Supabase URLs for Goal 8", () => {
    const config = getSupabaseReadConfig({
      MYMEDLIFE_DATA_SOURCE: "supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "fake-key",
    });

    expect(config).toEqual(
      expect.objectContaining({
        enabled: false,
        reason: expect.stringContaining("localhost"),
      }),
    );
  });

  it("creates a read-only REST request for the app schema", async () => {
    const requests: Request[] = [];
    const fetchFn: typeof fetch = async (input, init) => {
      requests.push(new Request(input, init));
      return Response.json([{ id: "chapter-1" }]);
    };
    const config = getSupabaseReadConfig({
      MYMEDLIFE_DATA_SOURCE: "supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS: "true",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_SERVICE_ROLE_KEY: "fake-key",
    });

    if (!config.enabled) {
      throw new Error("Expected local Supabase config to be enabled.");
    }

    const client = createSupabaseReadonlyClient(config, fetchFn);
    const rows = await client.selectRows<{ id: string }>("chapters", {
      query: { order: "name.asc" },
    });

    expect(rows).toEqual([{ id: "chapter-1" }]);
    expect(requests[0]?.method).toBe("GET");
    expect(requests[0]?.url).toBe(
      "http://127.0.0.1:54321/rest/v1/chapters?select=*&order=name.asc",
    );
    expect(requests[0]?.headers.get("accept-profile")).toBe("app");
    expect(requests[0]?.headers.get("authorization")).toBe("Bearer fake-key");
  });

  it("can build a hosted staging read-only client from the signed-in reviewer session", async () => {
    const requests: Request[] = [];
    const fetchFn: typeof fetch = async (input, init) => {
      requests.push(new Request(input, init));
      return Response.json([{ id: "chapter-1" }]);
    };

    const access = await createSupabaseReadonlyAccess(
      {
        MYMEDLIFE_DATA_SOURCE: "supabase",
      },
      fetchFn,
      {
        createServerClient: async () => ({
          client: {
            auth: {
              getSession: async () => ({
                data: {
                  session: {
                    access_token: "reviewer-token",
                  },
                },
                error: null,
              }),
            },
          } as never,
          config: {
            enabled: true,
            mode: "staging_supabase",
            reviewEnvironment: "staging",
            url: "https://example.supabase.co",
            anonKey: "anon-key",
            isLocalOnly: false,
            reason: "Hosted staging Supabase Auth is enabled for approved pilot review.",
          } as const,
        }),
      },
    );

    expect(access).toMatchObject({
      enabled: true,
      isLocalOnly: false,
      mode: "auth_session",
      reason: "Reading hosted staging Supabase data with the signed-in reviewer session.",
    });

    if (!access.enabled) {
      throw new Error("Expected hosted staging read access to be enabled.");
    }

    const rows = await access.client.selectRows<{ id: string }>("chapters", {
      query: { order: "name.asc" },
    });

    expect(rows).toEqual([{ id: "chapter-1" }]);
    expect(requests[0]?.url).toBe(
      "https://example.supabase.co/rest/v1/chapters?select=*&order=name.asc",
    );
    expect(requests[0]?.headers.get("apikey")).toBe("anon-key");
    expect(requests[0]?.headers.get("authorization")).toBe("Bearer reviewer-token");
  });

  it("falls back when staged Supabase auth is available but no reviewer session token exists", async () => {
    const access = await createSupabaseReadonlyAccess(
      {
        MYMEDLIFE_DATA_SOURCE: "supabase",
      },
      fetch,
      {
        createServerClient: async () => ({
          client: {
            auth: {
              getSession: async () => ({
                data: { session: null },
                error: null,
              }),
            },
          } as never,
          config: {
            enabled: true,
            mode: "staging_supabase",
            reviewEnvironment: "staging",
            url: "https://example.supabase.co",
            anonKey: "anon-key",
            isLocalOnly: false,
            reason: "Hosted staging Supabase Auth is enabled for approved pilot review.",
          } as const,
        }),
      },
    );

    expect(access).toEqual({
      enabled: false,
      isLocalOnly: false,
      mode: "mock_fallback",
      reason:
        "Using mock data because no signed-in hosted staging reviewer session is active.",
    });
  });
});
