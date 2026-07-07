import { describe, expect, it, vi } from "vitest";
import { submitPasswordFromRecovery } from "@/app/auth/set-password/actions";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";

vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  },
}));

vi.mock("@/lib/supabase-server", () => ({
  createLocalSupabaseServerClient: vi.fn(),
}));

describe("set password action", () => {
  it("blocks short passwords before touching auth", async () => {
    const formData = new FormData();
    formData.set("password", "short");
    formData.set("confirmPassword", "short");
    formData.set("redirectTo", "/admin");

    const result = await submitPasswordFromRecovery(formData, {
      createServerClient: vi.fn(),
    });

    expect(result).toEqual({
      status: "error",
      message: "Choose a password with at least 12 characters.",
    });
  });

  it("blocks mismatched confirmation", async () => {
    const formData = new FormData();
    formData.set("password", "long-enough-password");
    formData.set("confirmPassword", "different-password");
    formData.set("redirectTo", "/admin");

    const result = await submitPasswordFromRecovery(formData, {
      createServerClient: vi.fn(),
    });

    expect(result).toEqual({
      status: "error",
      message: "The password confirmation does not match.",
    });
  });

  it("returns the auth config reason when hosted auth is unavailable", async () => {
    const formData = new FormData();
    formData.set("password", "long-enough-password");
    formData.set("confirmPassword", "long-enough-password");
    formData.set("redirectTo", "/admin");

    const result = await submitPasswordFromRecovery(formData, {
      createServerClient: async () => ({
        client: null,
        config: {
          reason: "Hosted production Supabase Auth is disabled.",
        },
      }),
    });

    expect(result).toEqual({
      status: "error",
      message: "Hosted production Supabase Auth is disabled.",
    });
  });

  it("returns the auth update error when Supabase rejects the password", async () => {
    const formData = new FormData();
    formData.set("password", "long-enough-password");
    formData.set("confirmPassword", "long-enough-password");
    formData.set("redirectTo", "/admin");

    const result = await submitPasswordFromRecovery(formData, {
      createServerClient: async () => ({
        client: {
          auth: {
            updateUser: async () => ({
              error: {
                message: "Session missing.",
              },
            }),
          },
        },
        config: {
          reason: "ignored",
        },
      }),
    });

    expect(result).toEqual({
      status: "error",
      message: "Session missing.",
    });
  });

  it("uses the default server client helper for a successful password save", async () => {
    vi.mocked(createLocalSupabaseServerClient).mockResolvedValueOnce({
      client: {
        auth: {
          updateUser: async () => ({
            error: null,
          }),
        },
      } as Awaited<ReturnType<typeof createLocalSupabaseServerClient>>["client"],
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

    const formData = new FormData();
    formData.set("password", "long-enough-password");
    formData.set("confirmPassword", "long-enough-password");
    formData.set("redirectTo", "/admin");

    await expect(submitPasswordFromRecovery(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin",
    );
  });

  it("exposes the wrapper action for useActionState", async () => {
    vi.mocked(createLocalSupabaseServerClient).mockResolvedValueOnce({
      client: null,
      config: {
        enabled: false,
        mode: "disabled",
        isLocalOnly: false,
        isHostedStaging: false,
        environment: "production",
        reason: "wrapped",
      },
    });

    const formData = new FormData();
    formData.set("password", "long-enough-password");
    formData.set("confirmPassword", "long-enough-password");
    formData.set("redirectTo", "/admin");
    const { savePasswordFromRecovery } = await import(
      "@/app/auth/set-password/actions"
    );
    const result = await savePasswordFromRecovery(
      {
        status: "idle",
        message: "idle",
      },
      formData,
    );

    expect(result).toEqual({
      status: "error",
      message: "wrapped",
    });
  });
});
