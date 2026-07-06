import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";

vi.mock("next/navigation", () => ({
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: vi.fn(async () => ({
    client: null,
    config: {
      enabled: false,
      mode: "disabled",
      isLocalOnly: true,
      reason: "Seeded sign-in is not configured for this test run.",
    },
  })),
}));

vi.mock("@/services/auth-session", () => ({
  getAuthSessionState: vi.fn(),
  getDisabledAuthSessionState: vi.fn(() => ({
    status: "disabled",
    isLocalOnly: true,
    message: "Seeded sign-in is not configured for this test run.",
    user: null,
  })),
  normalizeLoginRedirect: vi.fn((value: FormDataEntryValue | null | undefined) => {
    if (typeof value !== "string") {
      return "/";
    }

    const trimmed = value.trim();

    if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
      return "/";
    }

    if (trimmed.includes("\n") || trimmed.includes("\r")) {
      return "/";
    }

    if (trimmed === "/login") {
      return "/";
    }

    return trimmed;
  }),
}));

describe("login page", () => {
  it("renders the centered Figma-backed sign-in surface instead of the old review layout", async () => {
    const { default: LoginPage } = await import("@/app/login/page");
    const html = renderToStaticMarkup(await LoginPage({}));

    expect(html).toContain("myMEDLIFE");
    expect(html).toContain("Sign in to your workspace");
    expect(html).toContain("Email");
    expect(html).toContain("Password");
    expect(html).toContain('id="login-password"');
    expect(html).toContain('name="password"');
    expect(html).toContain('type="password"');
    expect(html).toContain("Forgot password?");
    expect(html).toContain("you@example.com");
    expect(html).toContain("Sign in");
    expect(html).toContain("All rights reserved.");
    expect(html).toContain('value="/"');
    expect(html).toContain("Seeded sign-in is not configured for this test run.");
    expect(html).toContain("disabled");
    expect(html).not.toContain("General Member");
    expect(html).not.toContain("Choose your myMEDLIFE workspace.");
    expect(html).not.toContain("Members");
    expect(html).not.toContain("Student leaders");
    expect(html).not.toContain("Coaches and staff");
    expect(html).not.toContain("DS and admin");
    expect(html).not.toContain("Review posture");
    expect(html).not.toContain("Use a seeded account");
    expect(html).not.toContain("No signed-in account yet");
    expect(html).not.toContain("/admin");
    expect(html).not.toContain('class="sr-only"');
    expect(html).not.toContain('value="password"');
  });

  it("preserves the signed-in continuation flow inside the login shell", async () => {
    vi.mocked(createLocalSupabaseServerClient).mockResolvedValueOnce({
      client: {} as Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"],
      config: {
        enabled: true,
        mode: "local_supabase",
        isLocalOnly: true,
        isHostedStaging: false,
        environment: "local",
        url: "http://127.0.0.1:54321",
        anonKey: "test-anon-key",
        reason: "Local Supabase Auth is active.",
      },
    });

    vi.mocked(getAuthSessionState).mockResolvedValueOnce({
      status: "signed_in",
      isLocalOnly: true,
      isHostedStaging: false,
      environment: "local",
      message: "Local Supabase Auth session is active.",
      user: {
        id: "user-1",
        email: "member.a@mymedlife.test",
        displayName: "Test Member",
      },
    });

    const { default: LoginPage } = await import("@/app/login/page");
    const html = renderToStaticMarkup(
      await LoginPage({
        searchParams: Promise.resolve({ redirectTo: "/leader?view=overview" }),
      }),
    );

    expect(html).toContain("myMEDLIFE");
    expect(html).toContain("Sign in to your workspace");
    expect(html).toContain("Current session");
    expect(html).toContain("Test Member");
    expect(html).toContain("member.a@mymedlife.test");
    expect(html).toContain("Continue into myMEDLIFE");
    expect(html).toContain('href="/leader?view=overview"');
    expect(html).toContain("Sign out");
  });

  it("keeps a nested workspace redirect such as SLT Prep intact", async () => {
    const { default: LoginPage } = await import("@/app/login/page");
    const html = renderToStaticMarkup(
      await LoginPage({
        searchParams: Promise.resolve({ redirectTo: "/app/slt-prep" }),
      }),
    );

    expect(html).toContain('value="/app/slt-prep"');
  });

  it("preserves the enabled signed-out login path without forcing disabled state", async () => {
    vi.mocked(createLocalSupabaseServerClient).mockResolvedValueOnce({
      client: {} as Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"],
      config: {
        enabled: true,
        mode: "local_supabase",
        isLocalOnly: true,
        isHostedStaging: false,
        environment: "local",
        url: "http://127.0.0.1:54321",
        anonKey: "test-anon-key",
        reason: "Local Supabase Auth is active.",
      },
    });

    vi.mocked(getAuthSessionState).mockResolvedValueOnce({
      status: "signed_out",
      isLocalOnly: true,
      isHostedStaging: false,
      environment: "local",
      message: "No local Supabase Auth session is active.",
      user: null,
    });

    const { default: LoginPage } = await import("@/app/login/page");
    const html = renderToStaticMarkup(await LoginPage({}));

    expect(html).toContain("Sign in to your workspace");
    expect(html).toContain("Sign in");
    expect(html).not.toContain("Seeded sign-in is not configured for this test run.");
    expect(html).not.toContain("Current session");
  });
});
