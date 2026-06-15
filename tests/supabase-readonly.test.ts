import { describe, expect, it } from "vitest";
import {
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
});
