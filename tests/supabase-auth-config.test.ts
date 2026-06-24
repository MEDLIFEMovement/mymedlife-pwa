import { describe, expect, it } from "vitest";
import {
  getSupabaseAuthConfig,
  isHostedSupabaseUrl,
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

  it("keeps staging auth disabled until the explicit hosted-review flag is approved", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "staging-anon-key",
      }),
    ).toMatchObject({
      enabled: false,
      mode: "staging_supabase",
      isLocalOnly: false,
      reason:
        "Hosted staging Supabase Auth is disabled until MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH=true is set for an approved staging review.",
    });
  });

  it("enables hosted staging auth only with an explicit staging-review flag and hosted URL", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH: "true",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "staging-anon-key",
      }),
    ).toMatchObject({
      enabled: true,
      mode: "staging_supabase",
      reviewEnvironment: "staging",
      url: "https://example.supabase.co",
      isLocalOnly: false,
    });
  });

  it("recognizes local Supabase URL forms", () => {
    expect(isLocalSupabaseUrl("http://127.0.0.1:54321")).toBe(true);
    expect(isLocalSupabaseUrl("http://localhost:54321")).toBe(true);
    expect(isLocalSupabaseUrl("https://example.supabase.co")).toBe(false);
    expect(isLocalSupabaseUrl("not a url")).toBe(false);
    expect(isHostedSupabaseUrl("https://example.supabase.co")).toBe(true);
    expect(isHostedSupabaseUrl("http://127.0.0.1:54321")).toBe(false);
  });
});
