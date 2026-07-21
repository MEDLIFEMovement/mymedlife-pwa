import { describe, expect, it, vi, afterEach } from "vitest";

import {
  getAdminUserCreationConfig,
  parseAdminUserCreationRole,
  requiresAdminUserCreationChapter,
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
    expect(parseAdminUserCreationRole("e_board_member")).toBe("e_board_member");
    expect(parseAdminUserCreationRole("owner")).toBeNull();
    expect(requiresAdminUserCreationChapter("general_member")).toBe(true);
    expect(requiresAdminUserCreationChapter("e_board_member")).toBe(true);
    expect(requiresAdminUserCreationChapter("coach")).toBe(false);
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

  it("rejects a General Member without an approved chapter before creating Auth", async () => {
    vi.stubEnv("MYMEDLIFE_ENABLE_ADMIN_USER_CREATION", "true");
    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "local_supabase");
    vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "local-service-role-key");
    vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");

    const formData = buildValidForm();
    formData.delete("chapterId");
    const createSessionClient = vi.fn();
    const createServiceClient = vi.fn();

    const result = await submitAdminUserCreationForSupabase(formData, {
      createSessionClient,
      createServiceClient,
    });

    expect(result).toMatchObject({
      success: false,
      code: "validation_error",
      plainEnglishMessage: expect.stringContaining("member or E-Board"),
    });
    expect(createSessionClient).not.toHaveBeenCalled();
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
    const insertedRows: Array<{ table: string; row: Record<string, unknown> }> = [];
    const insert = vi.fn((table: string, row: Record<string, unknown>) => {
      insertedRows.push({ table, row });
      return {
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: row.id ?? "90000000-0000-4000-8000-000000000099" },
            error: null,
          }),
        })),
      };
    });
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
          insert: (row: Record<string, unknown>) => insert(table, row),
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
    expect(insertedRows).toContainEqual({
      table: "profiles",
      row: expect.objectContaining({
        id: "00000000-0000-4000-8000-000000000099",
      }),
    });
    expect(insertedRows).toContainEqual({
      table: "memberships",
      row: expect.objectContaining({
        chapter_id: "10000000-0000-4000-8000-000000000001",
        role_key: "general_member",
        status: "approved",
      }),
    });
    expect(result).toMatchObject({
      success: true,
      code: "user_created",
      role: "general_member",
    });
  });

  it("creates an E-Board user with an approved chapter membership instead of a staff role", async () => {
    vi.stubEnv("MYMEDLIFE_ENABLE_ADMIN_USER_CREATION", "true");
    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "local_supabase");
    vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "local-service-role-key");
    vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");

    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000099", email: "new.eboard@example.com" } },
      error: null,
    });
    const insertedRows: Array<{ table: string; row: Record<string, unknown> }> = [];
    const insert = vi.fn((table: string, row: Record<string, unknown>) => {
      insertedRows.push({ table, row });
      return {
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: row.id ?? "90000000-0000-4000-8000-000000000099" },
            error: null,
          }),
        })),
      };
    });
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
          insert: (row: Record<string, unknown>) => insert(table, row),
        })),
      })),
    } as never;

    const formData = buildValidForm();
    formData.set("email", "new.eboard@example.com");
    formData.set("role", "e_board_member");
    formData.set("chapterId", "10000000-0000-4000-8000-000000000001");

    const result = await submitAdminUserCreationForSupabase(formData, {
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

    expect(result).toMatchObject({
      success: true,
      code: "user_created",
      role: "e_board_member",
    });
    expect(insertedRows).toContainEqual({
      table: "memberships",
      row: expect.objectContaining({
        chapter_id: "10000000-0000-4000-8000-000000000001",
        role_key: "e_board_member",
        status: "approved",
      }),
    });
    expect(insertedRows.some((entry) => entry.table === "staff_role_assignments" && entry.row.role_key === "e_board_member")).toBe(false);
  });

  it("creates a staff role assignment without a chapter membership", async () => {
    stubEnabledLocalCreation();
    const service = buildServiceClientForCreation();
    const formData = buildValidForm();
    formData.set("role", "admin");
    formData.delete("chapterId");

    const result = await submitAdminUserCreationForSupabase(formData, {
      createSessionClient: signedInSessionClient,
      getSessionState: async () => signedInAdminSession(),
      createServiceClient: () => service.client,
    });

    expect(result).toMatchObject({ success: true, role: "admin" });
    expect(service.insertedRows).toContainEqual({
      table: "staff_role_assignments",
      row: expect.objectContaining({ role_key: "admin", status: "active" }),
    });
    expect(service.insertedRows.some((entry) => entry.table === "memberships")).toBe(false);
  });

  it("rejects a signed-in user without a privileged role before Auth creation", async () => {
    stubEnabledLocalCreation();
    const service = buildServiceClientForCreation({ actorRoles: ["coach"] });

    const result = await submitAdminUserCreationForSupabase(buildValidForm(), {
      createSessionClient: signedInSessionClient,
      getSessionState: async () => signedInAdminSession(),
      createServiceClient: () => service.client,
    });

    expect(result).toMatchObject({ success: false, code: "permission_denied" });
    expect(service.createUser).not.toHaveBeenCalled();
  });

  it("rolls Auth back when the required member chapter membership cannot be written", async () => {
    stubEnabledLocalCreation();
    const service = buildServiceClientForCreation({ failTable: "memberships" });

    const result = await submitAdminUserCreationForSupabase(buildValidForm(), {
      createSessionClient: signedInSessionClient,
      getSessionState: async () => signedInAdminSession(),
      createServiceClient: () => service.client,
    });

    expect(result).toMatchObject({ success: false, code: "server_error" });
    expect(service.deleteUser).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000099");
    expect(service.insertedRows.some((entry) => entry.table === "audit_logs")).toBe(false);
  });

  it("rolls Auth and app rows back when the audit record cannot be written", async () => {
    stubEnabledLocalCreation();
    const service = buildServiceClientForCreation({ failTable: "audit_logs" });

    const result = await submitAdminUserCreationForSupabase(buildValidForm(), {
      createSessionClient: signedInSessionClient,
      getSessionState: async () => signedInAdminSession(),
      createServiceClient: () => service.client,
    });

    expect(result).toMatchObject({ success: false, code: "server_error" });
    expect(service.deleteUser).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000099");
  });
});

function stubEnabledLocalCreation() {
  vi.stubEnv("MYMEDLIFE_ENABLE_ADMIN_USER_CREATION", "true");
  vi.stubEnv("MYMEDLIFE_AUTH_MODE", "local_supabase");
  vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "local-service-role-key");
  vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");
}

async function signedInSessionClient() {
  return {
    client: { auth: { getUser: vi.fn() } },
    config: { reason: "Test auth client." },
  };
}

function signedInAdminSession() {
  return {
    status: "signed_in" as const,
    isLocalOnly: true,
    isHostedStaging: false,
    environment: "local" as const,
    message: "Signed in.",
    user: {
      id: "00000000-0000-4000-8000-000000000006",
      email: "ds.admin@example.com",
      displayName: "DS Admin",
    },
  };
}

function buildServiceClientForCreation({
  actorRoles = ["ds_admin"],
  failTable,
}: {
  actorRoles?: string[];
  failTable?: string;
} = {}) {
  const createUser = vi.fn().mockResolvedValue({
    data: {
      user: {
        id: "00000000-0000-4000-8000-000000000099",
        email: "new.user@example.com",
      },
    },
    error: null,
  });
  const deleteUser = vi.fn().mockResolvedValue({ error: null });
  const insertedRows: Array<{ table: string; row: Record<string, unknown> }> = [];
  const client = {
    auth: { admin: { createUser, deleteUser } },
    schema: vi.fn(() => ({
      from: vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: table === "staff_role_assignments"
                ? actorRoles.map((role_key) => ({ role_key }))
                : [],
              error: null,
            }),
          })),
        })),
        insert: (row: Record<string, unknown>) => {
          insertedRows.push({ table, row });
          return {
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: failTable === table
                  ? null
                  : { id: row.id ?? "90000000-0000-4000-8000-000000000099" },
                error: failTable === table ? { message: `${table} failed` } : null,
              }),
            })),
          };
        },
      })),
    })),
  } as never;

  return { client, createUser, deleteUser, insertedRows };
}

function buildValidForm() {
  const formData = new FormData();
  formData.set("email", "new.user@example.com");
  formData.set("displayName", "New User");
  formData.set("temporaryPassword", "long-temporary-password");
  formData.set("role", "general_member");
  formData.set("chapterId", "10000000-0000-4000-8000-000000000001");
  formData.set("auditReason", "Approved onboarding for new site user");
  return formData;
}
