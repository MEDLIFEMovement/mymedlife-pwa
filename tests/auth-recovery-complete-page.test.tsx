import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseAuthConfig: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/services/supabase-auth-config", () => ({
  getSupabaseAuthConfig: mocks.getSupabaseAuthConfig,
}));
vi.mock("@/components/auth-recovery-fragment-bridge", () => ({
  AuthRecoveryFragmentBridge: ({ redirectTo }: { redirectTo: string }) => (
    <div>Recovery bridge for {redirectTo}</div>
  ),
}));

describe("auth recovery complete page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the fragment bridge with a safe continuation", async () => {
    mocks.getSupabaseAuthConfig.mockReturnValue({
      enabled: true,
      url: "https://project.supabase.co",
      anonKey: "anon-key",
    });
    const { default: AuthRecoveryCompletePage } = await import(
      "@/app/auth/recovery/complete/[continuation]/page"
    );

    const html = renderToStaticMarkup(
      await AuthRecoveryCompletePage({
        params: Promise.resolve({ continuation: "L2FwcA" }),
      }),
    );

    expect(html).toContain("Complete password recovery");
    expect(html).toContain("Recovery bridge for /app");
  });

  it("returns to sign-in when hosted auth is disabled", async () => {
    mocks.getSupabaseAuthConfig.mockReturnValue({ enabled: false });
    mocks.redirect.mockImplementationOnce(() => {
      throw new Error("NEXT_REDIRECT");
    });
    const { default: AuthRecoveryCompletePage } = await import(
      "@/app/auth/recovery/complete/[continuation]/page"
    );

    await expect(
      AuthRecoveryCompletePage({
        params: Promise.resolve({ continuation: "L2FwcA" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/login?redirectTo=%2Fapp");
  });
});
