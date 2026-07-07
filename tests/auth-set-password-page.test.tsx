import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";

vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  },
}));

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: vi.fn(),
}));

vi.mock("@/services/auth-session", async () => {
  const actual = await vi.importActual<typeof import("@/services/auth-session")>(
    "@/services/auth-session",
  );
  return {
    ...actual,
    getAuthSessionState: vi.fn(),
  };
});

describe("auth set password page", () => {
  it("redirects back to login when hosted auth is unavailable", async () => {
    vi.mocked(createLocalSupabaseServerClient).mockResolvedValueOnce({
      client: null,
      config: {
        enabled: false,
        mode: "disabled",
        isLocalOnly: false,
        isHostedStaging: false,
        environment: "production",
        reason: "Hosted production Supabase Auth is disabled.",
      },
    });

    const { default: SetPasswordPage } = await import(
      "@/app/auth/set-password/page"
    );

    await expect(
      SetPasswordPage({
        searchParams: Promise.resolve({ redirectTo: "/admin" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/login?redirectTo=%2Fadmin");
  });

  it("redirects back to login when there is no signed-in recovery session", async () => {
    vi.mocked(createLocalSupabaseServerClient).mockResolvedValueOnce({
      client: {} as Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"],
      config: {
        enabled: true,
        mode: "production_supabase",
        isLocalOnly: false,
        isHostedStaging: false,
        environment: "production",
        url: "https://fnlhontvvprwgooevzdl.supabase.co",
        anonKey: "anon-key",
        reason: "Hosted production auth is active.",
      },
    });
    vi.mocked(getAuthSessionState).mockResolvedValueOnce({
      status: "signed_out",
      isLocalOnly: false,
      isHostedStaging: false,
      environment: "production",
      message: "No hosted production Supabase Auth session is active.",
      user: null,
    });

    const { default: SetPasswordPage } = await import(
      "@/app/auth/set-password/page"
    );

    await expect(
      SetPasswordPage({
        searchParams: Promise.resolve({ redirectTo: "/admin" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/login?redirectTo=%2Fadmin");
  });

  it("renders the password setup flow for a signed-in recovery session", async () => {
    vi.mocked(createLocalSupabaseServerClient).mockResolvedValueOnce({
      client: {} as Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"],
      config: {
        enabled: true,
        mode: "production_supabase",
        isLocalOnly: false,
        isHostedStaging: false,
        environment: "production",
        url: "https://fnlhontvvprwgooevzdl.supabase.co",
        anonKey: "anon-key",
        reason: "Hosted production auth is active.",
      },
    });
    vi.mocked(getAuthSessionState).mockResolvedValueOnce({
      status: "signed_in",
      isLocalOnly: false,
      isHostedStaging: false,
      environment: "production",
      message: "Hosted production Supabase Auth session is active.",
      user: {
        id: "user-1",
        email: "afigueroa@medlifemovement.org",
        displayName: "Astrid",
      },
    });

    const { default: SetPasswordPage } = await import(
      "@/app/auth/set-password/page"
    );
    const html = renderToStaticMarkup(
      await SetPasswordPage({
        searchParams: Promise.resolve({ redirectTo: "/admin" }),
      }),
    );

    expect(html).toContain("Finish account setup");
    expect(html).toContain("afigueroa@medlifemovement.org");
    expect(html).toContain("Save password");
    expect(html).toContain('value="/admin"');
  });
});
