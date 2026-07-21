import { afterEach, describe, expect, it, vi } from "vitest";

import { submitAdminUserLifecycleForSupabase } from "@/app/admin/users/lifecycle-actions";
import { getAdminUserLifecycleConfig } from "@/services/admin-user-lifecycle";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("admin user lifecycle production gates", () => {
  it("stays disabled without explicit lifecycle approval", () => {
    expect(getAdminUserLifecycleConfig({
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      SUPABASE_SERVICE_ROLE_KEY: "server-only",
    })).toMatchObject({
      enabled: false,
      environment: "production",
    });
  });

  it("requires the production lifecycle flag", () => {
    expect(getAdminUserLifecycleConfig({
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      SUPABASE_SERVICE_ROLE_KEY: "server-only",
      MYMEDLIFE_ENABLE_ADMIN_USER_LIFECYCLE: "true",
    })).toMatchObject({ enabled: false });
  });

  it("enables the server path only with both explicit production flags", () => {
    expect(getAdminUserLifecycleConfig({
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      SUPABASE_SERVICE_ROLE_KEY: "server-only",
      MYMEDLIFE_ENABLE_ADMIN_USER_LIFECYCLE: "true",
      MYMEDLIFE_ALLOW_PRODUCTION_ADMIN_USER_LIFECYCLE: "true",
    })).toMatchObject({
      enabled: true,
      environment: "production",
    });
  });
});

describe("admin user lifecycle deactivation", () => {
  it("suspends Auth and transactionally deactivates every app assignment", async () => {
    enableLifecycleWrites();
    const rpc = vi.fn().mockResolvedValue({
      data: [{ audit_log_id: "90000000-0000-4000-8000-000000000010" }],
      error: null,
    });
    const updateUserById = vi.fn().mockResolvedValue({ error: null });
    const { client: serviceClient, from } = buildServiceClient(updateUserById);

    const result = await submitAdminUserLifecycleForSupabase(
      buildLifecycleForm(),
      buildLifecycleDeps({ rpc, serviceClient }),
    );

    expect(updateUserById).toHaveBeenCalledTimes(1);
    expect(updateUserById).toHaveBeenCalledWith(targetUserId, {
      ban_duration: "876000h",
    });
    expect(rpc).toHaveBeenCalledWith("admin_change_user_access", {
      target_user_uuid: targetUserId,
      operation_input: "deactivate_user",
      chapter_uuid: null,
      role_key_input: null,
      audit_reason_input: auditReason,
    });
    expect(from).toHaveBeenCalledTimes(2);
    expect(from).toHaveBeenCalledWith("staff_role_assignments");
    expect(result).toEqual({
      success: true,
      code: "user_deactivated",
      userId: targetUserId,
      auditLogId: "90000000-0000-4000-8000-000000000010",
      plainEnglishMessage:
        "User access was suspended in Auth, all app assignments were marked inactive, and the change was audited.",
    });
  });

  it("restores Auth when the transactional app deactivation fails", async () => {
    enableLifecycleWrites();
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "42501", message: "membership update blocked" },
    });
    const updateUserById = vi.fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });
    const { client: serviceClient } = buildServiceClient(updateUserById);

    const result = await submitAdminUserLifecycleForSupabase(
      buildLifecycleForm(),
      buildLifecycleDeps({ rpc, serviceClient }),
    );

    expect(updateUserById).toHaveBeenNthCalledWith(1, targetUserId, {
      ban_duration: "876000h",
    });
    expect(updateUserById).toHaveBeenNthCalledWith(2, targetUserId, {
      ban_duration: "none",
    });
    expect(result).toMatchObject({
      success: false,
      code: "server_error",
      plainEnglishMessage: expect.stringContaining("Auth suspension was rolled back"),
    });
  });

  it("reports both failures when the app transaction and Auth rollback fail", async () => {
    enableLifecycleWrites();
    const rpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const updateUserById = vi.fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "rollback rejected" } });
    const { client: serviceClient } = buildServiceClient(updateUserById);

    const result = await submitAdminUserLifecycleForSupabase(
      buildLifecycleForm(),
      buildLifecycleDeps({ rpc, serviceClient }),
    );

    expect(result).toMatchObject({
      success: false,
      code: "server_error",
      plainEnglishMessage: expect.stringContaining("Auth rollback also failed"),
    });
    expect(result.plainEnglishMessage).toContain("rollback rejected");
  });

  it("does not touch app access when Supabase Auth rejects suspension", async () => {
    enableLifecycleWrites();
    const rpc = vi.fn();
    const updateUserById = vi.fn().mockResolvedValue({
      error: { message: "Auth write rejected" },
    });
    const { client: serviceClient } = buildServiceClient(updateUserById);

    const result = await submitAdminUserLifecycleForSupabase(
      buildLifecycleForm(),
      buildLifecycleDeps({ rpc, serviceClient }),
    );

    expect(rpc).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      success: false,
      code: "server_error",
      plainEnglishMessage: expect.stringContaining("Auth write rejected"),
    });
  });
});

const actorUserId = "00000000-0000-4000-8000-000000000006";
const targetUserId = "00000000-0000-4000-8000-000000000008";
const auditReason = "Suspend the TEST member during lifecycle regression proof.";

type LifecycleDeps = NonNullable<
  Parameters<typeof submitAdminUserLifecycleForSupabase>[1]
>;
type LifecycleServiceClient = NonNullable<
  ReturnType<NonNullable<LifecycleDeps["createServiceClient"]>>
>;

function buildLifecycleForm() {
  const formData = new FormData();
  formData.set("operation", "deactivate_user");
  formData.set("targetUserId", targetUserId);
  formData.set("confirmation", "DEACTIVATE USER");
  formData.set("auditReason", auditReason);
  return formData;
}

function buildLifecycleDeps(input: {
  rpc: ReturnType<typeof vi.fn>;
  serviceClient: LifecycleServiceClient;
}): LifecycleDeps {
  const sessionClient = {
    auth: {
      getUser: vi.fn(),
    },
    schema: vi.fn(() => ({
      rpc: input.rpc,
    })),
  };

  return {
    createSessionClient: async () => ({
      client: sessionClient,
      config: { reason: "Test session client is configured." },
    }),
    createServiceClient: () => input.serviceClient,
    getSessionState: async () => ({
      status: "signed_in",
      isLocalOnly: true,
      isHostedStaging: false,
      environment: "local",
      message: "Signed in.",
      user: {
        id: actorUserId,
        email: "super.admin@mymedlife.test",
        displayName: "TEST Super Admin",
      },
    }),
  } as LifecycleDeps;
}

function buildServiceClient(updateUserById: ReturnType<typeof vi.fn>) {
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn((_column: string, userId: string) => ({
        eq: vi.fn().mockResolvedValue({
          data: userId === actorUserId ? [{ role_key: "super_admin" }] : [],
          error: null,
        }),
      })),
    })),
  }));
  const client = {
    auth: {
      admin: {
        updateUserById,
        deleteUser: vi.fn(),
      },
    },
    schema: vi.fn(() => ({ from })),
  } as unknown as LifecycleServiceClient;
  return { client, from };
}

function enableLifecycleWrites() {
  vi.stubEnv("MYMEDLIFE_ENABLE_ADMIN_USER_LIFECYCLE", "true");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-only");
  vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
}
