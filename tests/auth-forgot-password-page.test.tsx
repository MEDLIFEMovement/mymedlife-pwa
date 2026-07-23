import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: vi.fn(),
}));

describe("forgot password page", () => {
  it("renders the real recovery form when hosted auth is enabled", async () => {
    vi.mocked(createLocalSupabaseServerClient).mockResolvedValueOnce({
      client: {} as Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"],
      config: {
        enabled: true,
        mode: "production_supabase",
        environment: "production",
        isLocalOnly: false,
        isHostedStaging: false,
        url: "https://fnlhontvvprwgooevzdl.supabase.co",
        anonKey: "anon-key",
        reason: "enabled",
      },
    });

    const { default: ForgotPasswordPage } = await import(
      "@/app/auth/forgot-password/page"
    );
    const html = renderToStaticMarkup(
      await ForgotPasswordPage({
        searchParams: Promise.resolve({ redirectTo: "/app" }),
      }),
    );

    expect(html).toContain("Reset your password");
    expect(html).toContain("Send password reset link");
    expect(html).toContain('value="/app"');
  });

  it("shows an expired-link error while allowing another recovery request", async () => {
    vi.mocked(createLocalSupabaseServerClient).mockResolvedValueOnce({
      client: {} as Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"],
      config: {
        enabled: true,
        mode: "production_supabase",
        environment: "production",
        isLocalOnly: false,
        isHostedStaging: false,
        url: "https://fnlhontvvprwgooevzdl.supabase.co",
        anonKey: "anon-key",
        reason: "enabled",
      },
    });

    const { default: ForgotPasswordPage } = await import(
      "@/app/auth/forgot-password/page"
    );
    const html = renderToStaticMarkup(
      await ForgotPasswordPage({
        searchParams: Promise.resolve({
          recoveryError: "recovery_invalid_or_expired",
          redirectTo: "/app",
        }),
      }),
    );

    expect(html).toContain("This password reset link is invalid or has expired");
    expect(html).toContain("Send password reset link");
    expect(html).toContain('value="/app"');
  });
});
