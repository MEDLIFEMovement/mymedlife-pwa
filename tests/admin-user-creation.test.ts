import { describe, expect, it, vi, afterEach } from "vitest";

import {
  getAdminUserCreationConfig,
  parseAdminUserCreationRole,
} from "@/services/admin-user-creation";
import { submitAdminUserCreationForSupabase } from "@/app/admin/users/create-actions";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("admin user creation", () => {
  it("keeps creation disabled until the explicit environment gates and service key exist", () => {
    expect(getAdminUserCreationConfig({
      MYMEDLIFE_ENABLE_ADMIN_USER_CREATION: "true",
      MYMEDLIFE_AUTH_MODE: "production_supabase",
    })).toMatchObject({ enabled: false, environment: "production" });

    expect(parseAdminUserCreationRole("ds_admin")).toBe("ds_admin");
    expect(parseAdminUserCreationRole("owner")).toBeNull();
  });

  it("rejects malformed creation requests before any Supabase client is used", async () => {
    vi.stubEnv("MYMEDLIFE_ENABLE_ADMIN_USER_CREATION", "true");
    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "local_supabase");
    vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "local-service-role-key");
    vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");

    const formData = new FormData();
    formData.set("email", "bad");
    formData.set("displayName", "");
    formData.set("temporaryPassword", "short");
    formData.set("role", "owner");
    formData.set("auditReason", "short");

    const createServiceClient = vi.fn();
    const result = await submitAdminUserCreationForSupabase(formData, {
      createServiceClient,
    });

    expect(result).toMatchObject({ success: false, code: "validation_error" });
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("requires an authenticated session before account creation", async () => {
    vi.stubEnv("MYMEDLIFE_ENABLE_ADMIN_USER_CREATION", "true");
    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "local_supabase");
    vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "local-service-role-key");
    vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");

    const formData = buildValidForm();
    const result = await submitAdminUserCreationForSupabase(formData, {
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

  it("creates auth, profile, role, and audit records as one guarded sequence", async () => {
    vi.stubEnv("MYMEDLIFE_ENABLE_ADMIN_USER_CREATION", "true");
    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "local_supabase");
    vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "local-service-role-key");
    vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");

    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000099", email: "new.user@example.com" } },
      error: null,
    });
    const insert = vi.fn((row: Record<string, unknown>) => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: row.id ?? "90000000-0000-4000-8000-000000000099" },
          error: null,
        }),
      })),
    }));
    const serviceClient = {
      auth: { admin: { createUser, deleteUser: vi.fn() } },
      schema: vi.fn(() => ({
        from: vi.fn((table: string) => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: table === "staff_role_assignments" ? [{ role_key: "ds_admin" }] : [],
                error: null,
              }),
            })),
          })),
          insert,
        })),
      })),
    } as never;

    const result = await submitAdminUserCreationForSupabase(buildValidForm(), {
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
          email: "super.admin@example.com",
          displayName: "Super Admin",
        },
      }),
      createServiceClient: () => serviceClient,
    });

    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: "new.user@example.com",
      email_confirm: true,
    }));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      id: "00000000-0000-4000-8000-000000000099",
    }));
    expect(result).toMatchObject({
      success: true,
      code: "user_created",
      role: "general_member",
    });
  });
});

function buildValidForm() {
  const formData = new FormData();
  formData.set("email", "new.user@example.com");
  formData.set("displayName", "New User");
  formData.set("temporaryPassword", "long-temporary-password");
  formData.set("role", "general_member");
  formData.set("auditReason", "Approved onboarding for new site user");
  return formData;
}
