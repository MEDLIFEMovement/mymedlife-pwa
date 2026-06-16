import { describe, expect, it } from "vitest";
import {
  getSupabaseAuthConfig,
  isLocalSupabaseUrl,
} from "@/services/supabase-auth-config";

describe("Supabase auth config", () => {
  it("keeps auth disabled by default", () => {
    expect(getSupabaseAuthConfig({})).toMatchObject({
      enabled: false,
      mode: "disabled",
    });
  });

  it("requires local URL and anon key before enabling auth", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "local_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      }),
    ).toMatchObject({
      enabled: false,
      mode: "local_supabase",
    });
  });

  it("enables auth only for localhost Supabase", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "local_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321/",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
      }),
    ).toMatchObject({
      enabled: true,
      url: "http://127.0.0.1:54321",
      isLocalOnly: true,
    });
  });

  it("refuses production-looking Supabase URLs", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "local_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Local Supabase Auth refuses non-localhost URLs until production auth is explicitly approved.",
    });
  });

  it("recognizes local Supabase URL forms", () => {
    expect(isLocalSupabaseUrl("http://127.0.0.1:54321")).toBe(true);
    expect(isLocalSupabaseUrl("http://localhost:54321")).toBe(true);
    expect(isLocalSupabaseUrl("https://example.supabase.co")).toBe(false);
    expect(isLocalSupabaseUrl("not a url")).toBe(false);
  });
});
