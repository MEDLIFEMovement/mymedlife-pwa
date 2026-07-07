import { describe, expect, it, vi } from "vitest";
import { submitPasswordFromRecovery } from "@/app/auth/set-password/actions";

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
});
