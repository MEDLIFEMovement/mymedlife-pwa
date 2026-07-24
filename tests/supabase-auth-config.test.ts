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
      mode: "local_supabase",
      url: "http://127.0.0.1:54321",
      isLocalOnly: true,
      isHostedStaging: false,
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
        "Local Supabase Auth refuses non-localhost URLs. Use staging_supabase or production_supabase for hosted auth.",
    });
  });

  it("requires the staging host and browser key before enabling hosted staging auth", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co",
      }),
    ).toMatchObject({
      enabled: false,
      mode: "staging_supabase",
      isHostedStaging: true,
    });
  });

  it("enables hosted staging auth only for the approved staging host and project", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co/",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "staging-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
      }),
    ).toMatchObject({
      enabled: true,
      mode: "staging_supabase",
      environment: "staging",
      url: "https://rceupryepjgkdeqgxzrc.supabase.co",
      isLocalOnly: false,
      isHostedStaging: true,
    });
  });

  it("refuses the production Supabase project in hosted staging mode", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "staging-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Hosted staging Supabase Auth refuses the production Supabase project until production auth is explicitly approved.",
    });
  });

  it("refuses the production site URL in hosted staging mode", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "staging-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Hosted staging Supabase Auth refuses the production site URL until production auth is explicitly approved.",
    });
  });

  it("keeps hosted staging auth disabled while any write flag is on", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "staging-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
        MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Hosted staging Supabase Auth stays disabled until write and upload flags are off. Turn off: MYMEDLIFE_ENABLE_ACTION_START_WRITE.",
    });
  });

  it("keeps hosted staging auth disabled when the future chapter-event update flag is on", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "staging-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
        MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Hosted staging Supabase Auth stays disabled until write and upload flags are off. Turn off: MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE.",
    });
  });

  it("keeps hosted staging auth available for the approved membership write lane", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "staging-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
        MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      mode: "staging_supabase",
      isHostedStaging: true,
    });
  });

  it("enables hosted production auth only for the approved production host and project", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co/",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
      }),
    ).toMatchObject({
      enabled: true,
      mode: "production_supabase",
      environment: "production",
      url: "https://fnlhontvvprwgooevzdl.supabase.co",
      isLocalOnly: false,
      isHostedStaging: false,
      reason:
        "Hosted production Supabase Auth is enabled only for www.mymedlife.org against the approved production Supabase project.",
    });
  });

  it("refuses the staging site URL in hosted production mode", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://staging.mymedlife.org",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Hosted production Supabase Auth only runs when NEXT_PUBLIC_SITE_URL resolves to https://www.mymedlife.org.",
    });
  });

  it("refuses the staging Supabase project in hosted production mode", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://rceupryepjgkdeqgxzrc.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Hosted production Supabase Auth refuses the staging Supabase project. Use the approved production Supabase project for www.mymedlife.org.",
    });
  });

  it("keeps hosted production auth disabled while any write or upload flag is on", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
        MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Hosted production Supabase Auth stays disabled until all write and upload flags are off. Turn off: MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE.",
    });
  });

  it("keeps hosted production auth disabled when the future chapter-event update flag is on", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
        MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Hosted production Supabase Auth stays disabled until all write and upload flags are off. Turn off: MYMEDLIFE_ENABLE_CHAPTER_EVENT_AUTHORITATIVE_UPDATE_WRITE.",
    });
  });

  it("keeps hosted production auth available for the approved member event-loop write lane", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
        MYMEDLIFE_ENABLE_MEMBER_EVENT_LOOP_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_MEMBER_EVENT_LOOP_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      mode: "production_supabase",
      environment: "production",
    });
  });

  it("keeps hosted production auth available for the separately gated HQ proof decision lane", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
        MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_HQ_PROOF_DECISION_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      mode: "production_supabase",
      environment: "production",
    });
  });

  it("keeps hosted production auth available for the separately gated proof-submission lane", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
        MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_PROOF_SUBMISSION_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      mode: "production_supabase",
      environment: "production",
    });
  });

  it("keeps hosted production auth available for the separately gated action-start lane", () => {
    expect(
      getSupabaseAuthConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://fnlhontvvprwgooevzdl.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "production-publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
        MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_ACTION_START_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      mode: "production_supabase",
      environment: "production",
    });
  });

  it("recognizes local Supabase URL forms", () => {
    expect(isLocalSupabaseUrl("http://127.0.0.1:54321")).toBe(true);
    expect(isLocalSupabaseUrl("http://localhost:54321")).toBe(true);
    expect(isLocalSupabaseUrl("https://example.supabase.co")).toBe(false);
    expect(isLocalSupabaseUrl("not a url")).toBe(false);
  });
});
