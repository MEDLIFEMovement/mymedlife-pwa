import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const mockCreateServerClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

describe("Supabase session refresh", () => {
  it("passes through without creating a client when auth is disabled", async () => {
    const { refreshSupabaseSession } = await import(
      "@/lib/supabase-session-refresh"
    );
    const response = await refreshSupabaseSession(
      new NextRequest("http://127.0.0.1:3000/app"),
      {},
    );

    expect(response.status).toBe(200);
    expect(mockCreateServerClient).not.toHaveBeenCalled();
  });

  it("validates claims and forwards refreshed cookies", async () => {
    const getClaims = vi.fn().mockImplementation(async () => {
      const options = mockCreateServerClient.mock.calls[0]?.[2] as {
        cookies: {
          setAll: (
            cookies: Array<{
              name: string;
              value: string;
              options: { path: string; httpOnly: boolean };
            }>,
          ) => void;
        };
      };
      options.cookies.setAll([
        {
          name: "sb-session",
          value: "refreshed",
          options: { path: "/", httpOnly: true },
        },
      ]);
      return { data: { claims: { sub: "user-1" } }, error: null };
    });
    mockCreateServerClient.mockReturnValueOnce({ auth: { getClaims } });

    const { refreshSupabaseSession } = await import(
      "@/lib/supabase-session-refresh"
    );
    const response = await refreshSupabaseSession(
      new NextRequest("https://www.mymedlife.org/app"),
      {
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
        NEXT_PUBLIC_SUPABASE_URL:
          "https://fnlhontvvprwgooevzdl.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      },
    );

    expect(getClaims).toHaveBeenCalledOnce();
    expect(response.cookies.get("sb-session")?.value).toBe("refreshed");
  });
});
