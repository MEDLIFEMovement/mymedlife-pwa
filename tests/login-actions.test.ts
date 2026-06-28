import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieSet = vi.fn();
const cookieDelete = vi.fn();
const redirect = vi.fn(() => {
  throw new Error("redirect");
});

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: cookieSet,
    delete: cookieDelete,
  })),
}));

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: vi.fn(async () => ({
    client: null,
    config: {
      enabled: false,
      mode: "disabled",
      reviewEnvironment: "disabled",
      isLocalOnly: false,
      reason: "Hosted staging Supabase Auth is disabled for this test.",
    },
  })),
}));

describe("login actions", () => {
  beforeEach(() => {
    vi.resetModules();
    cookieSet.mockClear();
    cookieDelete.mockClear();
    redirect.mockClear();
  });

  it("lets the seeded reviewer sign in when hosted staging auth is disabled", async () => {
    const { signInWithPassword } = await import("@/app/login/actions");

    await expect(
      signInWithPassword(
        { status: "idle", message: "", email: "" },
        formDataFor({
          email: "nellis@medlifemovement.org",
          password: "6598",
          redirectTo: "/app",
        }),
      ),
    ).rejects.toThrow("redirect");

    expect(cookieSet).toHaveBeenCalledWith(
      "mymedlife_preview_actor_email",
      "nellis@medlifemovement.org",
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      }),
    );
  });

  it("rejects the wrong seeded password", async () => {
    const { signInWithPassword } = await import("@/app/login/actions");

    const result = await signInWithPassword(
      { status: "idle", message: "", email: "" },
      formDataFor({
        email: "nellis@medlifemovement.org",
        password: "wrong",
        redirectTo: "/app",
      }),
    );

    expect(result.status).toBe("error");
    expect(cookieSet).not.toHaveBeenCalled();
  });
});

function formDataFor(values: Record<string, string>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}
