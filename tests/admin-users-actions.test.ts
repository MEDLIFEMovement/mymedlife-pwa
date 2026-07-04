import { describe, expect, it, vi, afterEach } from "vitest";

import { submitAdminUserAccessForLocalSupabase } from "@/app/admin/users/actions";

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
    type AdminAccessActionDeps = NonNullable<
      Parameters<typeof submitAdminUserAccessForLocalSupabase>[1]
    >;
    type AdminAccessCreateServerClient = NonNullable<
      AdminAccessActionDeps["createServerClient"]
    >;
    const fakeClient = {
      schema: vi.fn(() => ({
        rpc,
      })),
    } as Awaited<
      ReturnType<AdminAccessCreateServerClient>
    >["client"];

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
        getSessionState: async () => ({
          status: "signed_in",
          isLocalOnly: true,
          isHostedStaging: false,
          environment: "local",
          message: "Signed in.",
          user: {
            id: "00000000-0000-4000-8000-000000000006",
            email: "super.admin@mymedlife.test",
            displayName: "Sam Super",
          },
        }),
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
});

function enableAdminAccessWrites() {
  vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
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
