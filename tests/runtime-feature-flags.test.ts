import { describe, expect, it, vi } from "vitest";
import {
  getResolvedFeatureFlagEnv,
  getRuntimeFeatureFlagValue,
  resolveRuntimeFeatureFlagEnvironment,
} from "@/services/runtime-feature-flags";

describe("runtime feature flags", () => {
  it("uses env fallback when the control layer is not Supabase-backed", async () => {
    await expect(
      getRuntimeFeatureFlagValue("staging_review_auth", {
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH: "true",
      }),
    ).resolves.toBe(true);
  });

  it("maps staging auth mode to the staging rollout environment", () => {
    expect(
      resolveRuntimeFeatureFlagEnvironment({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
      }),
    ).toBe("staging");
    expect(resolveRuntimeFeatureFlagEnvironment({ VERCEL_ENV: "production" })).toBe(
      "production",
    );
  });

  it("hydrates persisted staging flags and overlays the env shape expected by review services", async () => {
    const fetchFn = vi.fn(async () =>
      Response.json([
        { flag_key: "staging_review_auth", enabled: true },
        { flag_key: "action_started_write", enabled: true },
        { flag_key: "proof_metadata_write", enabled: false },
      ]),
    );

    const resolvedEnv = await getResolvedFeatureFlagEnv(
      ["staging_review_auth", "action_started_write", "proof_metadata_write"],
      {
        MYMEDLIFE_CONTROL_LAYER_SOURCE: "supabase",
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
      },
      fetchFn,
    );

    const firstCall = vi.mocked(fetchFn).mock.calls[0];

    if (!firstCall) {
      throw new Error("Expected the Supabase feature-flag fetch to run.");
    }

    const [url, init] = firstCall as unknown as [URL | string, RequestInit | undefined];

    expect(String(url)).toBe(
      "https://example.supabase.co/rest/v1/feature_flags?select=flag_key%2Cenabled&environment=eq.staging&flag_key=in.%28staging_review_auth%2Caction_started_write%2Cproof_metadata_write%29",
    );
    expect(init).toMatchObject({
      method: "GET",
      cache: "no-store",
      headers: {
        apikey: "service-role-secret",
        authorization: "Bearer service-role-secret",
        "accept-profile": "app",
      },
    });

    expect(resolvedEnv.MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH).toBe("true");
    expect(resolvedEnv.MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE).toBe("true");
    expect(resolvedEnv.MYMEDLIFE_ENABLE_STAGING_PROOF_SUBMISSION_WRITE).toBe(
      "false",
    );
  });
});
