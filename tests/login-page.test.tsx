import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

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
}));

describe("login page", () => {
  it("renders a product-facing seeded sign-in surface instead of an internal milestone page", async () => {
    const { default: LoginPage } = await import("@/app/login/page");
    const html = renderToStaticMarkup(await LoginPage());

    expect(html).toContain("Sign in");
    expect(html).toContain("Sign in to continue into your myMEDLIFE role.");
    expect(html).toContain("Current access boundaries");
    expect(html).toContain("See onboarding flow");
    expect(html).toContain("Use a seeded account");
    expect(html).toContain("Sign in with a seeded account");
    expect(html).toContain("Seeded account access");
    expect(html).toContain("Continue");
    expect(html).toContain("No signed-in account yet");
    expect(html).not.toContain("Goal 58");
    expect(html).not.toContain("Local sign-in is the bridge from review mode to real MVP behavior.");
    expect(html).not.toContain("How to test locally");
    expect(html).not.toContain("Local Supabase Auth");
    expect(html).not.toContain("Sign in to the local MVP");
    expect(html).not.toContain("Sign in locally");
  });
});
