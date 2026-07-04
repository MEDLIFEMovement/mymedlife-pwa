import { describe, expect, it, vi, beforeEach } from "vitest";
import { localActorPreviewCookieName } from "@/services/local-actor-context";

const mocks = vi.hoisted(() => {
  return {
    cookieDelete: vi.fn(),
    createLocalSupabaseServerClient: vi.fn(),
    redirect: vi.fn((href: string) => {
      throw new Error(`NEXT_REDIRECT:${href}`);
    }),
    supabaseSignOut: vi.fn(),
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    delete: mocks.cookieDelete,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: mocks.createLocalSupabaseServerClient,
}));

describe("login actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs out of Supabase, clears the preview actor cookie, and redirects to login", async () => {
    mocks.createLocalSupabaseServerClient.mockResolvedValue({
      client: {
        auth: {
          signOut: mocks.supabaseSignOut,
        },
      },
      config: {
        enabled: true,
        mode: "local_supabase",
      },
    });

    const { signOut } = await import("@/app/login/actions");

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.supabaseSignOut).toHaveBeenCalledOnce();
    expect(mocks.cookieDelete).toHaveBeenCalledWith(localActorPreviewCookieName);
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("still clears local preview state and returns to login when Supabase Auth is disabled", async () => {
    mocks.createLocalSupabaseServerClient.mockResolvedValue({
      client: null,
      config: {
        enabled: false,
        mode: "disabled",
      },
    });

    const { signOut } = await import("@/app/login/actions");

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.supabaseSignOut).not.toHaveBeenCalled();
    expect(mocks.cookieDelete).toHaveBeenCalledWith(localActorPreviewCookieName);
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});
