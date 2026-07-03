import { describe, expect, it, vi } from "vitest";
import {
  getRuntimeTheme,
  getRuntimeThemeStyle,
  resolveRuntimeThemeEnvironment,
} from "@/services/runtime-theme";

describe("runtime theme", () => {
  it("uses local defaults when the Supabase control layer is off", async () => {
    const theme = await getRuntimeTheme({
      MYMEDLIFE_CONTROL_LAYER_SOURCE: "env",
    });

    expect(theme).toMatchObject({
      environment: "local",
      source: "defaults",
    });
    expect(theme.values.background).toBe("#f8fbff");
    expect(theme.values.accent).toBe("#5d8ff6");
  });

  it("maps staging review signals to the staging theme environment", () => {
    expect(
      resolveRuntimeThemeEnvironment({
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
      }),
    ).toBe("staging");
    expect(resolveRuntimeThemeEnvironment({ VERCEL_ENV: "preview" })).toBe("staging");
    expect(resolveRuntimeThemeEnvironment({ VERCEL_ENV: "production" })).toBe(
      "production",
    );
  });

  it("hydrates safe persisted theme values from Supabase without exposing secrets", async () => {
    const fetchFn = vi.fn(async () =>
      Response.json([
        { setting_key: "background", value: "#ffffff" },
        { setting_key: "accent", value: "#2563eb" },
        { setting_key: "line", value: "rgba(37, 99, 235, 0.18)" },
        { setting_key: "not_real", value: "#000000" },
        { setting_key: "foreground", value: "javascript:alert(1)" },
      ]),
    );

    const theme = await getRuntimeTheme(
      {
        MYMEDLIFE_CONTROL_LAYER_SOURCE: "supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "super-secret",
        VERCEL_ENV: "preview",
      },
      fetchFn,
    );

    const firstCall = vi.mocked(fetchFn).mock.calls[0];

    if (!firstCall) {
      throw new Error("Expected the Supabase theme fetch to run.");
    }

    const [url, init] = firstCall as unknown as [
      URL | string,
      RequestInit | undefined,
    ];

    expect(String(url)).toBe(
      "https://example.supabase.co/rest/v1/theme_settings?select=setting_key%2Cvalue&environment=eq.staging",
    );
    expect(init).toMatchObject({
      method: "GET",
      cache: "no-store",
      headers: {
        apikey: "super-secret",
        authorization: "Bearer super-secret",
        "accept-profile": "app",
      },
    });
    expect(theme).toMatchObject({
      environment: "staging",
      source: "supabase",
    });
    expect(theme.values.background).toBe("#ffffff");
    expect(theme.values.accent).toBe("#2563eb");
    expect(theme.values.line).toBe("rgba(37, 99, 235, 0.18)");
    expect(theme.values.foreground).toBe("#10223f");
  });

  it("returns CSS variables for the root layout", () => {
    const style = getRuntimeThemeStyle({
      environment: "local",
      source: "defaults",
      values: {
        background: "#ffffff",
        foreground: "#10223f",
        panel: "rgba(255,255,255,0.88)",
        panel_strong: "rgba(255,255,255,0.96)",
        line: "rgba(37,99,235,0.14)",
        accent: "#2563eb",
        accent_strong: "#1d4ed8",
      },
    });

    expect(style).toMatchObject({
      "--background": "#ffffff",
      "--accent": "#2563eb",
      "--accent-strong": "#1d4ed8",
    });
  });
});
