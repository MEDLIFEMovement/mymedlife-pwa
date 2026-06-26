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
  it("renders a workspace-oriented login surface instead of an internal milestone page", async () => {
    const { default: LoginPage } = await import("@/app/login/page");
    const html = renderToStaticMarkup(await LoginPage({}));

    expect(html).toContain("Sign in");
    expect(html).toContain("Choose your myMEDLIFE workspace.");
    expect(html).toContain("Eligible travelers also see SLT Prep");
    expect(html).toContain("General Member");
    expect(html).toContain("Student Leader");
    expect(html).toContain("Sales Coach / Sales Staff");
    expect(html).toContain("Staff");
    expect(html).toContain("Data Solutions / Admin");
    expect(html).toContain("general.staff@mymedlife.test");
    expect(html).toContain("nellis@medlifemovement.org");
    expect(html).toContain("6598");
    expect(html).toContain("Current access boundaries");
    expect(html).toContain("actual role and permission");
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
    expect(html).toContain("/staff");
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
});
