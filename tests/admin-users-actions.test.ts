import { redirect } from "next/navigation";
import { describe, expect, it, vi, afterEach } from "vitest";

import {
  submitAdminUserAccessAction,
  submitAdminUserAccessForLocalSupabase,
} from "@/app/admin/users/actions";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("admin user access server action", () => {
  it("stays locked until the explicit local admin write flags are enabled", async () => {
    const result = await submitAdminUserAccessForLocalSupabase(
      buildAdminAccessForm({
        operation: "set_staff_role",
        roleKey: "coach",
      }),
    );

    expect(result).toMatchObject({
      success: false,
      code: "write_disabled",
    });
  });

  it("requires confirmation text before destructive access changes", async () => {
    enableAdminAccessWrites();

    const result = await submitAdminUserAccessForLocalSupabase(
      buildAdminAccessForm({
        operation: "deactivate_user",
        confirmation: "",
      }),
    );

    expect(result).toMatchObject({
      success: false,
      code: "confirmation_required",
    });
  });

  it("redirects back to the admin user page with the safe result query", async () => {
    const formData = buildAdminAccessForm({
      operation: "set_staff_role",
      roleKey: "coach",
    });
    formData.set("returnTo", "https://example.test/steal-session");

    await submitAdminUserAccessAction(formData);

    expect(redirect).toHaveBeenCalledWith(
      "/admin/users?adminAccessResult=write_disabled&targetUserId=00000000-0000-4000-8000-000000000008&operation=set_staff_role",
    );
  });

  it("rejects unsupported operations, invalid scopes, invalid roles, and short reasons", async () => {
    enableAdminAccessWrites();

    await expectAdminAccessFailure(
      buildAdminAccessForm({
        operation: "drop_user",
      }),
      "invalid_operation",
    );
    await expectAdminAccessFailure(
      buildAdminAccessForm({
        operation: "set_chapter_role",
      }),
      "invalid_scope",
    );
    await expectAdminAccessFailure(
      buildAdminAccessForm({
        operation: "set_staff_role",
        roleKey: "owner",
      }),
      "invalid_role",
    );

    const shortReasonForm = buildAdminAccessForm({
      operation: "set_staff_role",
      roleKey: "coach",
    });
    shortReasonForm.set("auditReason", "too short");

    await expectAdminAccessFailure(shortReasonForm, "audit_reason_required");
  });

  it("keeps mock user and chapter ids from triggering real writes", async () => {
    enableAdminAccessWrites();

    const mockScopedForm = buildAdminAccessForm({
      operation: "set_chapter_role",
      roleKey: "action_committee_chair",
      chapterId: "mock-chapter",
    });

    await expectAdminAccessFailure(mockScopedForm, "target_not_found");
  });

  it("requires a local Supabase client and a signed-in admin session", async () => {
    enableAdminAccessWrites();

    await expectAdminAccessFailure(
      buildAdminAccessForm({
        operation: "set_staff_role",
        roleKey: "coach",
      }),
      "write_disabled",
      {
        createServerClient: async () => ({
          client: null,
          config: { reason: "Local Supabase is not configured." },
        }),
      },
    );

    const fakeClient = buildRpcClient(
      vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    );

    await expectAdminAccessFailure(
      buildAdminAccessForm({
        operation: "set_staff_role",
        roleKey: "coach",
      }),
      "missing_auth",
      {
        createServerClient: async () => ({
          client: fakeClient,
          config: { reason: "Test client is available." },
        }),
        getSessionState: async () => ({
          status: "signed_out",
          isLocalOnly: true,
          isHostedStaging: false,
          environment: "local",
          message: "No session.",
          user: null,
        }),
      },
    );
  });

  it("maps RPC errors and empty RPC responses without reporting success", async () => {
    enableAdminAccessWrites();

    await expectAdminAccessFailure(
      buildAdminAccessForm({
        operation: "set_staff_role",
        roleKey: "coach",
      }),
      "permission_denied",
      {
        createServerClient: async () => ({
          client: buildRpcClient(
            vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: "42501",
                message: "DS Admin or Super Admin access required",
              },
            }),
          ),
          config: { reason: "Test client is available." },
        }),
        getSessionState: async () => signedInSession(),
      },
    );

    await expectAdminAccessFailure(
      buildAdminAccessForm({
        operation: "set_staff_role",
        roleKey: "coach",
      }),
      "server_error",
      {
        createServerClient: async () => ({
          client: buildRpcClient(
            vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          ),
          config: { reason: "Test client is available." },
        }),
        getSessionState: async () => signedInSession(),
      },
    );
  });

  it("maps a successful audited RPC response into an access-change result", async () => {
    enableAdminAccessWrites();

    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          operation: "set_staff_role",
          target_user_id: "00000000-0000-4000-8000-000000000008",
          membership_id: null,
          staff_role_assignment_id: "30000000-0000-4000-8000-000000000099",
          coach_assignment_id: null,
          audit_log_id: "90000000-0000-4000-8000-000000000099",
          default_workspace: "staff_command_center",
          allowed_workspaces: [
            "student_app",
            "leader_command_center",
            "staff_command_center",
          ],
        },
      ],
      error: null,
    });
    const fakeClient = buildRpcClient(rpc);

    const result = await submitAdminUserAccessForLocalSupabase(
      buildAdminAccessForm({
        operation: "set_staff_role",
        roleKey: "coach",
      }),
      {
        createServerClient: async () => ({
          client: fakeClient,
          config: { reason: "Test client is available." },
        }),
        getSessionState: async () => signedInSession(),
      },
    );

    expect(fakeClient?.schema).toHaveBeenCalledWith("app");
    expect(rpc).toHaveBeenCalledWith("admin_change_user_access", {
      target_user_uuid: "00000000-0000-4000-8000-000000000008",
      operation_input: "set_staff_role",
      chapter_uuid: null,
      role_key_input: "coach",
      audit_reason_input: "MED-509 admin access test reason.",
    });
    expect(result).toMatchObject({
      success: true,
      code: "admin_access_changed",
      defaultWorkspace: "staff_command_center",
      auditLogId: "90000000-0000-4000-8000-000000000099",
    });
  });

  it("supports the approved hosted staging admin access rehearsal flags with a signed-in staging session", async () => {
    enableHostedStagingAdminAccessWrites();

    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          operation: "set_chapter_role",
          target_user_id: "00000000-0000-4000-8000-000000000008",
          membership_id: "20000000-0000-4000-8000-000000000099",
          staff_role_assignment_id: null,
          coach_assignment_id: null,
          audit_log_id: "90000000-0000-4000-8000-000000000109",
          default_workspace: "leader_command_center",
          allowed_workspaces: ["student_app", "leader_command_center"],
        },
      ],
      error: null,
    });
    const fakeClient = buildRpcClient(rpc);

    const result = await submitAdminUserAccessForLocalSupabase(
      buildAdminAccessForm({
        operation: "set_chapter_role",
        roleKey: "action_committee_chair",
        chapterId: "10000000-0000-4000-8000-000000000201",
      }),
      {
        createServerClient: async () => ({
          client: fakeClient,
          config: { reason: "Hosted staging Supabase client is available." },
        }),
        getSessionState: async () => signedInHostedStagingSession(),
      },
    );

    expect(rpc).toHaveBeenCalledWith("admin_change_user_access", {
      target_user_uuid: "00000000-0000-4000-8000-000000000008",
      operation_input: "set_chapter_role",
      chapter_uuid: "10000000-0000-4000-8000-000000000201",
      role_key_input: "action_committee_chair",
      audit_reason_input: "MED-509 admin access test reason.",
    });
    expect(result).toMatchObject({
      success: true,
      code: "admin_access_changed",
      defaultWorkspace: "leader_command_center",
      allowedWorkspaces: ["student_app", "leader_command_center"],
      auditLogId: "90000000-0000-4000-8000-000000000109",
    });
  });
});

type AdminAccessActionDeps = NonNullable<
  Parameters<typeof submitAdminUserAccessForLocalSupabase>[1]
>;
type AdminAccessCreateServerClient = NonNullable<
  AdminAccessActionDeps["createServerClient"]
>;
type AdminAccessClient = Awaited<ReturnType<AdminAccessCreateServerClient>>["client"];
type AdminAccessResultCode = Awaited<
  ReturnType<typeof submitAdminUserAccessForLocalSupabase>
>["code"];

async function expectAdminAccessFailure(
  formData: FormData,
  code: Exclude<AdminAccessResultCode, "admin_access_changed">,
  deps?: AdminAccessActionDeps,
) {
  await expect(
    submitAdminUserAccessForLocalSupabase(formData, deps),
  ).resolves.toMatchObject({
    success: false,
    code,
  });
}

function buildRpcClient(rpc: ReturnType<typeof vi.fn>): AdminAccessClient {
  return {
    schema: vi.fn(() => ({
      rpc,
    })),
  } as AdminAccessClient;
}

function signedInSession() {
  return {
    status: "signed_in" as const,
    isLocalOnly: true,
    isHostedStaging: false,
    environment: "local" as const,
    message: "Signed in.",
    user: {
      id: "00000000-0000-4000-8000-000000000006",
      email: "super.admin@mymedlife.test",
      displayName: "Sam Super",
    },
  };
}

function signedInHostedStagingSession() {
  return {
    status: "signed_in" as const,
    isLocalOnly: false,
    isHostedStaging: true,
    environment: "staging" as const,
    message: "Signed into hosted staging.",
    user: {
      id: "00000000-0000-4000-8000-000000000006",
      email: "super.admin@mymedlife.test",
      displayName: "Sam Super",
    },
  };
}

function enableAdminAccessWrites() {
  vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
  vi.stubEnv("MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE", "true");
}

function enableHostedStagingAdminAccessWrites() {
  vi.stubEnv("MYMEDLIFE_AUTH_MODE", "staging_supabase");
  vi.stubEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    "https://rceupryepjgkdeqgxzrc.supabase.co",
  );
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "staging-publishable-key");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.mymedlife.org");
  vi.stubEnv("MYMEDLIFE_ALLOW_STAGING_SUPABASE_WRITES", "true");
  vi.stubEnv("MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE", "true");
}

function buildAdminAccessForm(input: {
  operation: string;
  roleKey?: string;
  chapterId?: string;
  confirmation?: string;
}) {
  const formData = new FormData();
  formData.set("operation", input.operation);
  formData.set("targetUserId", "00000000-0000-4000-8000-000000000008");
  formData.set("auditReason", "MED-509 admin access test reason.");

  if (input.roleKey) {
    formData.set("roleKey", input.roleKey);
  }

  if (input.chapterId) {
    formData.set("chapterId", input.chapterId);
  }

  if (input.confirmation !== undefined) {
    formData.set("confirmation", input.confirmation);
  }

  return formData;
}
