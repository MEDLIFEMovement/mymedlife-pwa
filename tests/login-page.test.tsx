import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
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

vi.mock("@/services/landing-route", () => ({
  getLandingRouteForActor: vi.fn(() => "/admin"),
}));

vi.mock("@/services/local-actor-context", () => ({
  getLocalActorContext: vi.fn(async () => ({
    authSessionStatus: "disabled",
  })),
}));

describe("login page", () => {
  it("renders a simple sign-in surface for myMEDLIFE", async () => {
    const { default: LoginPage } = await import("@/app/login/page");
    const html = renderToStaticMarkup(await LoginPage({}));

    expect(html).toContain("Sign in");
    expect(html).toContain("Sign in to myMEDLIFE.");
    expect(html).toContain("Use a seeded review account");
    expect(html).toContain("What this login does");
    expect(html).toContain("Routes by your actual role after authentication.");
    expect(html).toContain("Lets approved staging reviewers use the seeded access path when hosted auth is disabled.");
    expect(html).toContain("Keeps member, leader, staff, admin, and SLT Prep workspaces separate after sign-in.");
    expect(html).toContain("Use a seeded review account");
    expect(html).toContain("seeded review accounts");
    expect(html).toContain("Continue");
    expect(html).toContain("No signed-in account yet");
    expect(html).not.toContain("Choose your myMEDLIFE workspace.");
    expect(html).not.toContain("General Member");
    expect(html).not.toContain("Student Leader");
    expect(html).not.toContain("Sales Coach / Sales Staff");
    expect(html).not.toContain("Current access boundaries");
    expect(html).not.toContain("See onboarding flow");
    expect(html).not.toContain("Seeded account access");
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

  it("redirects an already signed-in actor to their owned workspace", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const navigationModule = await import("next/navigation");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValueOnce({
      authSessionStatus: "signed_in",
    } as Awaited<ReturnType<typeof actorModule.getLocalActorContext>>);

    const { default: LoginPage } = await import("@/app/login/page");
    const html = renderToStaticMarkup(await LoginPage({}));

    expect(vi.mocked(navigationModule.redirect)).toHaveBeenCalledWith("/admin");
    expect(html).toBe("");
  });
});
