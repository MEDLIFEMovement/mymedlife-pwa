import { afterEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";

import {
  submitAdminUserPasswordResetAction,
  submitAdminUserPasswordResetForSupabase,
} from "@/app/admin/users/password-reset-actions";
import {
  createAdminUserPasswordResetClient,
  getAdminUserPasswordResetConfig,
} from "@/services/admin-user-password-reset";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(redirect).mockClear();
});

describe("admin user password reset", () => {
  it("stays disabled until lifecycle approval and service key are present", () => {
    expect(getAdminUserPasswordResetConfig({
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      SUPABASE_SERVICE_ROLE_KEY: "server-only",
      NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
    })).toMatchObject({
      enabled: false,
      environment: "production",
    });

    expect(getAdminUserPasswordResetConfig({
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      SUPABASE_SERVICE_ROLE_KEY: "server-only",
      MYMEDLIFE_ENABLE_ADMIN_PASSWORD_RESET: "true",
      MYMEDLIFE_ALLOW_PRODUCTION_ADMIN_PASSWORD_RESET: "true",
      NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
    })).toMatchObject({
      enabled: true,
      environment: "production",
      redirectTo: "https://www.mymedlife.org/auth/callback/recovery/L2FkbWluL3VzZXJz",
    });
  });

  it("keeps reset disabled without the service role key or environment approval flag", () => {
    expect(getAdminUserPasswordResetConfig({
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      MYMEDLIFE_ENABLE_ADMIN_PASSWORD_RESET: "true",
      MYMEDLIFE_ALLOW_PRODUCTION_ADMIN_PASSWORD_RESET: "true",
      NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
    })).toMatchObject({
      enabled: false,
      environment: "production",
      reason: "Password reset emails are disabled because the server-only Supabase service-role key is missing.",
    });

    expect(getAdminUserPasswordResetConfig({
      MYMEDLIFE_AUTH_MODE: "staging_supabase",
      MYMEDLIFE_ENABLE_ADMIN_PASSWORD_RESET: "true",
      SUPABASE_SERVICE_ROLE_KEY: "server-only",
      VERCEL_URL: "mymedlife-preview.vercel.app",
    })).toMatchObject({
      enabled: false,
      environment: "staging",
      redirectTo: "https://mymedlife-preview.vercel.app/auth/callback/recovery/L2FkbWluL3VzZXJz",
      reason: "Staging password reset emails are disabled until the explicit password-reset approval flag is enabled.",
    });
  });

  it("keeps password reset disabled when only lifecycle writes are enabled", () => {
    expect(getAdminUserPasswordResetConfig({
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      MYMEDLIFE_ENABLE_ADMIN_USER_LIFECYCLE: "true",
      MYMEDLIFE_ALLOW_PRODUCTION_ADMIN_USER_LIFECYCLE: "true",
      SUPABASE_SERVICE_ROLE_KEY: "server-only",
      NEXT_PUBLIC_SITE_URL: "https://www.mymedlife.org",
    })).toMatchObject({
      enabled: false,
      reason: "Password reset emails are disabled by configuration.",
    });
  });

  it("creates the service-role client only when the reset gate, url, and key are present", () => {
    expect(createAdminUserPasswordResetClient({
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ENABLE_ADMIN_PASSWORD_RESET: "true",
      MYMEDLIFE_ALLOW_LOCAL_ADMIN_PASSWORD_RESET: "true",
      SUPABASE_SERVICE_ROLE_KEY: "server-only",
    })).toBeNull();

    expect(createAdminUserPasswordResetClient({
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ENABLE_ADMIN_PASSWORD_RESET: "true",
      MYMEDLIFE_ALLOW_LOCAL_ADMIN_PASSWORD_RESET: "true",
      SUPABASE_SERVICE_ROLE_KEY: "server-only",
      SUPABASE_URL: "http://127.0.0.1:54321",
    })).not.toBeNull();
  });

  it("redirects the server action back to the selected admin user with the safe result code", async () => {
    const formData = buildValidForm();
    formData.set("targetUserId", "00000000-0000-4000-8000-000000000123");

    await expect(submitAdminUserPasswordResetAction(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/users?userId=00000000-0000-4000-8000-000000000123&adminUserPasswordResetResult=reset_disabled",
    );
    expect(redirect).toHaveBeenCalledWith(
      "/admin/users?userId=00000000-0000-4000-8000-000000000123&adminUserPasswordResetResult=reset_disabled",
    );
  });

  it("rejects missing confirmation before any Supabase client is used", async () => {
    enableLocalResetEnv();
    const formData = buildValidForm();
    formData.set("confirmation", "reset");

    const createServiceClient = vi.fn();
    const result = await submitAdminUserPasswordResetForSupabase(formData, {
      createServiceClient,
    });

    expect(result).toMatchObject({ success: false, code: "confirmation_required" });
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("rejects missing target and short audit reasons before any Supabase client is used", async () => {
    enableLocalResetEnv();
    const missingTarget = buildValidForm();
    missingTarget.delete("targetUserId");
    const shortReason = buildValidForm();
    shortReason.set("auditReason", "short");
    const createServiceClient = vi.fn();

    await expect(submitAdminUserPasswordResetForSupabase(missingTarget, {
      createServiceClient,
    })).resolves.toMatchObject({ success: false, code: "target_not_found" });

    await expect(submitAdminUserPasswordResetForSupabase(shortReason, {
      createServiceClient,
    })).resolves.toMatchObject({ success: false, code: "reason_required" });

    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("requires an authenticated DS Admin or Super Admin session", async () => {
    enableLocalResetEnv();

    const result = await submitAdminUserPasswordResetForSupabase(buildValidForm(), {
      createSessionClient: async () => ({
        client: { auth: { getUser: vi.fn() } },
        config: { reason: "Test auth client." },
      }),
      getSessionState: async () => ({
        status: "signed_out",
        isLocalOnly: true,
        isHostedStaging: false,
        environment: "local",
        message: "No session.",
        user: null,
      }),
    });

    expect(result).toMatchObject({ success: false, code: "missing_auth" });
  });

  it("blocks when the session client or service client cannot be created", async () => {
    enableLocalResetEnv();

    await expect(submitAdminUserPasswordResetForSupabase(buildValidForm(), {
      createSessionClient: async () => ({
        client: null,
        config: { reason: "Auth client unavailable." },
      }),
    })).resolves.toMatchObject({
      success: false,
      code: "reset_disabled",
      plainEnglishMessage: "Auth client unavailable.",
    });

    await expect(submitAdminUserPasswordResetForSupabase(buildValidForm(), {
      ...signedInSessionDeps(),
      createServiceClient: () => null,
    })).resolves.toMatchObject({
      success: false,
      code: "reset_disabled",
    });
  });

  it("blocks signed-in users who are not DS Admin or Super Admin", async () => {
    enableLocalResetEnv();
    const resetPasswordForEmail = vi.fn();

    const result = await submitAdminUserPasswordResetForSupabase(buildValidForm(), {
      ...signedInSessionDeps(),
      createServiceClient: () => buildServiceClient({
        actorRoles: ["coach"],
        resetPasswordForEmail,
      }) as never,
    });

    expect(result).toMatchObject({ success: false, code: "permission_denied" });
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("sends the audited Supabase recovery email for a regular user", async () => {
    enableLocalResetEnv();

    const resetPasswordForEmail = vi.fn().mockResolvedValue({ data: {}, error: null });
    const getUserById = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000099",
          email: "member@example.com",
        },
      },
      error: null,
    });
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "audit-1" },
          error: null,
        }),
      })),
    }));
    const serviceClient = {
      auth: {
        admin: { getUserById },
        resetPasswordForEmail,
      },
      schema: vi.fn(() => ({
        from: vi.fn((table: string) => ({
          select: vi.fn(() => ({
            eq: vi.fn((_column: string, value: string) => ({
              eq: vi.fn().mockResolvedValue({
                data:
                  table === "staff_role_assignments" &&
                  value === "00000000-0000-4000-8000-000000000006"
                    ? [{ role_key: "ds_admin" }]
                    : [],
                error: null,
              }),
            })),
          })),
          insert,
        })),
      })),
    } as never;

    const result = await submitAdminUserPasswordResetForSupabase(buildValidForm(), {
      createSessionClient: async () => ({
        client: { auth: { getUser: vi.fn() } },
        config: { reason: "Test auth client." },
      }),
      getSessionState: async () => ({
        status: "signed_in",
        isLocalOnly: true,
        isHostedStaging: false,
        environment: "local",
        message: "Signed in.",
        user: {
          id: "00000000-0000-4000-8000-000000000006",
          email: "ds.admin@example.com",
          displayName: "DS Admin",
        },
      }),
      createServiceClient: () => serviceClient,
    });

    expect(getUserById).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000099");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      action: "admin_user_password_reset_requested",
      target_id: "00000000-0000-4000-8000-000000000099",
    }));
    expect(resetPasswordForEmail).toHaveBeenCalledWith("member@example.com", {
      redirectTo: "https://www.mymedlife.org/auth/callback/recovery/L2FkbWluL3VzZXJz",
    });
    expect(result).toMatchObject({
      success: true,
      code: "password_reset_sent",
      auditLogId: "audit-1",
    });
  });

  it("blocks DS Admin password resets against Super Admin accounts", async () => {
    enableLocalResetEnv();
    const resetPasswordForEmail = vi.fn();

    const result = await submitAdminUserPasswordResetForSupabase(buildValidForm(), {
      ...signedInSessionDeps(),
      createServiceClient: () => buildServiceClient({
        resetPasswordForEmail,
        targetRoles: ["super_admin"],
      }) as never,
    });

    expect(result).toMatchObject({ success: false, code: "permission_denied" });
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("allows Super Admin password resets against Super Admin accounts", async () => {
    enableLocalResetEnv();
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ data: {}, error: null });

    const result = await submitAdminUserPasswordResetForSupabase(buildValidForm(), {
      ...signedInSessionDeps({
        id: "00000000-0000-4000-8000-000000000007",
        email: "super.admin@example.com",
        displayName: "Super Admin",
      }),
      createServiceClient: () => buildServiceClient({
        actorId: "00000000-0000-4000-8000-000000000007",
        actorRoles: ["super_admin"],
        resetPasswordForEmail,
        targetRoles: ["super_admin"],
      }) as never,
    });

    expect(result).toMatchObject({ success: true, code: "password_reset_sent" });
    expect(resetPasswordForEmail).toHaveBeenCalledOnce();
  });

  it("blocks missing Auth users before auditing or sending email", async () => {
    enableLocalResetEnv();
    const resetPasswordForEmail = vi.fn();
    const insert = vi.fn();

    const result = await submitAdminUserPasswordResetForSupabase(buildValidForm(), {
      ...signedInSessionDeps(),
      createServiceClient: () => buildServiceClient({
        getUserResult: { data: { user: null }, error: null },
        insert,
        resetPasswordForEmail,
      }) as never,
    });

    expect(result).toMatchObject({ success: false, code: "target_not_found" });
    expect(insert).not.toHaveBeenCalled();
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("blocks the reset email if the audit record cannot be written", async () => {
    enableLocalResetEnv();
    const resetPasswordForEmail = vi.fn();

    const result = await submitAdminUserPasswordResetForSupabase(buildValidForm(), {
      ...signedInSessionDeps(),
      createServiceClient: () => buildServiceClient({
        auditError: { message: "audit insert failed" },
        resetPasswordForEmail,
      }) as never,
    });

    expect(result).toMatchObject({ success: false, code: "server_error" });
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("returns a safe generic message when Supabase Auth rejects the email send", async () => {
    enableLocalResetEnv();

    const result = await submitAdminUserPasswordResetForSupabase(buildValidForm(), {
      ...signedInSessionDeps(),
      createServiceClient: () => buildServiceClient({
        resetError: { message: "SMTP configuration leaked detail" },
      }) as never,
    });

    expect(result).toMatchObject({
      success: false,
      code: "server_error",
      plainEnglishMessage: "Supabase Auth could not send the password reset email. Check provider configuration and retry.",
    });
  });
});

function enableLocalResetEnv() {
  vi.stubEnv("MYMEDLIFE_ENABLE_ADMIN_PASSWORD_RESET", "true");
  vi.stubEnv("MYMEDLIFE_AUTH_MODE", "local_supabase");
  vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_ADMIN_PASSWORD_RESET", "true");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "local-service-role-key");
  vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.mymedlife.org");
}

function buildValidForm() {
  const formData = new FormData();
  formData.set("targetUserId", "00000000-0000-4000-8000-000000000099");
  formData.set("confirmation", "RESET PASSWORD");
  formData.set("auditReason", "Approved password reset request for account recovery");
  return formData;
}

function signedInSessionDeps(user = {
  id: "00000000-0000-4000-8000-000000000006",
  email: "ds.admin@example.com",
  displayName: "DS Admin",
}) {
  return {
    createSessionClient: async () => ({
      client: { auth: { getUser: vi.fn() } },
      config: { reason: "Test auth client." },
    }),
    getSessionState: async () => ({
      status: "signed_in" as const,
      isLocalOnly: true,
      isHostedStaging: false,
      environment: "local" as const,
      message: "Signed in.",
      user,
    }),
  };
}

function buildServiceClient(options: {
  actorId?: string;
  actorRoles?: string[];
  auditError?: { message?: string } | null;
  getUserResult?: {
    data: { user: { id: string; email?: string | null } | null };
    error: { message?: string } | null;
  };
  insert?: ReturnType<typeof vi.fn>;
  resetError?: { message?: string } | null;
  resetPasswordForEmail?: ReturnType<typeof vi.fn>;
  targetRoles?: string[];
} = {}) {
  const actorId = options.actorId ?? "00000000-0000-4000-8000-000000000006";
  const actorRoles = options.actorRoles ?? ["ds_admin"];
  const targetRoles = options.targetRoles ?? [];
  const resetPasswordForEmail =
    options.resetPasswordForEmail ??
    vi.fn().mockResolvedValue({ data: {}, error: options.resetError ?? null });
  const getUserById = vi.fn().mockResolvedValue(options.getUserResult ?? {
    data: {
      user: {
        id: "00000000-0000-4000-8000-000000000099",
        email: "member@example.com",
      },
    },
    error: null,
  });
  const insert = options.insert ?? vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({
        data: options.auditError ? null : { id: "audit-1" },
        error: options.auditError ?? null,
      }),
    })),
  }));

  return {
    auth: {
      admin: { getUserById },
      resetPasswordForEmail,
    },
    schema: vi.fn(() => ({
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn((_column: string, value: string) => ({
            eq: vi.fn().mockResolvedValue({
              data:
                table === "staff_role_assignments" &&
                value === actorId
                  ? actorRoles.map((role_key) => ({ role_key }))
                  : targetRoles.map((role_key) => ({ role_key })),
              error: null,
            }),
          })),
        })),
        insert,
      })),
    })),
  };
}
