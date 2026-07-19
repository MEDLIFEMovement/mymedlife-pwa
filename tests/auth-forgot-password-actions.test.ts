import { describe, expect, it, vi } from "vitest";

import { submitPasswordRecoveryRequest } from "@/app/auth/forgot-password/actions";

describe("forgot password action", () => {
  it("validates the email before calling Supabase", async () => {
    const formData = new FormData();
    formData.set("email", "not-an-email");

    const createServerClient = vi.fn();
    await expect(
      submitPasswordRecoveryRequest(formData, { createServerClient }),
    ).resolves.toEqual({
      status: "error",
      message: "Enter a valid email address.",
      email: "not-an-email",
    });
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("returns the auth configuration reason when recovery is unavailable", async () => {
    const formData = recoveryForm();

    await expect(
      submitPasswordRecoveryRequest(formData, {
        createServerClient: async () => ({
          client: null,
          config: { reason: "Production auth is unavailable." },
        }),
      }),
    ).resolves.toEqual({
      status: "disabled",
      message: "Production auth is unavailable.",
      email: "member@example.com",
    });
  });

  it("sends the trusted callback URL to Supabase", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });

    const result = await submitPasswordRecoveryRequest(recoveryForm(), {
      createServerClient: async () => ({
        client: { auth: { resetPasswordForEmail } },
        config: { reason: "enabled" },
      }),
      env: {
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
      },
    });

    expect(resetPasswordForEmail).toHaveBeenCalledWith("member@example.com", {
      redirectTo:
        "https://www.mymedlife.org/auth/callback/recovery/L2FwcA",
    });
    expect(result.status).toBe("sent");
  });

  it("does not reveal whether Supabase accepted the address", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const resetPasswordForEmail = vi.fn().mockResolvedValue({
      error: { message: "Rate limit or unknown account" },
    });

    const result = await submitPasswordRecoveryRequest(recoveryForm(), {
      createServerClient: async () => ({
        client: { auth: { resetPasswordForEmail } },
        config: { reason: "enabled" },
      }),
      env: { MYMEDLIFE_AUTH_MODE: "local_supabase" },
    });

    expect(result).toEqual({
      status: "sent",
      message:
        "If an account exists for that email, a secure password reset link is on its way.",
      email: "member@example.com",
    });
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});

function recoveryForm() {
  const formData = new FormData();
  formData.set("email", " Member@Example.com ");
  formData.set("redirectTo", "/app");
  return formData;
}
