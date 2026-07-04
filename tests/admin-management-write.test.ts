import { describe, expect, it } from "vitest";

import {
  getAdminAccessWriteConfig,
  hasAdminAccessSupabaseIds,
  mapAdminAccessRpcError,
  mapAdminAccessRpcSuccess,
  parseAdminAccessOperation,
  parseAdminAccessRole,
} from "@/services/admin-management-write";

describe("admin management write mapping", () => {
  it("keeps admin access writes disabled unless the explicit local flag is set", () => {
    expect(getAdminAccessWriteConfig({})).toMatchObject({
      enabled: false,
      externalWritesEnabled: false,
    });

    expect(
      getAdminAccessWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      }),
    ).toMatchObject({
      enabled: false,
    });

    expect(
      getAdminAccessWriteConfig({
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE: "true",
      }),
    ).toMatchObject({
      enabled: true,
      externalWritesEnabled: false,
    });
  });

  it("parses operations, roles, and Supabase UUID scope safely", () => {
    expect(parseAdminAccessOperation("set_chapter_role")).toBe("set_chapter_role");
    expect(parseAdminAccessOperation("delete_everything")).toBeNull();
    expect(parseAdminAccessOperation(null)).toBeNull();

    expect(parseAdminAccessRole("action_committee_chair")).toBe(
      "action_committee_chair",
    );
    expect(parseAdminAccessRole("owner")).toBeNull();

    expect(
      hasAdminAccessSupabaseIds({
        targetUserId: "00000000-0000-4000-8000-000000000001",
        chapterId: "10000000-0000-4000-8000-000000000001",
      }),
    ).toBe(true);
    expect(
      hasAdminAccessSupabaseIds({
        targetUserId: "mock-user",
        chapterId: "10000000-0000-4000-8000-000000000001",
      }),
    ).toBe(false);
  });

  it("maps audited RPC success into an admin access result", () => {
    expect(
      mapAdminAccessRpcSuccess({
        operation: "set_chapter_role",
        target_user_id: "00000000-0000-4000-8000-000000000001",
        membership_id: "20000000-0000-4000-8000-000000000001",
        staff_role_assignment_id: null,
        coach_assignment_id: null,
        audit_log_id: "90000000-0000-4000-8000-000000000001",
        default_workspace: "leader_command_center",
        allowed_workspaces: ["student_app", "leader_command_center"],
      }),
    ).toMatchObject({
      success: true,
      code: "admin_access_changed",
      operation: "set_chapter_role",
      defaultWorkspace: "leader_command_center",
      allowedWorkspaces: ["student_app", "leader_command_center"],
      auditLogId: "90000000-0000-4000-8000-000000000001",
    });
  });

  it("maps RPC errors into plain admin access states", () => {
    expect(
      mapAdminAccessRpcError({
        code: "42501",
        message: "DS Admin or Super Admin access required",
      }),
    ).toMatchObject({
      success: false,
      code: "permission_denied",
    });

    expect(
      mapAdminAccessRpcError({
        code: "22023",
        message: "admin access change reason must be at least 12 characters",
      }),
    ).toMatchObject({
      success: false,
      code: "audit_reason_required",
    });

    expect(
      mapAdminAccessRpcError({
        code: "42501",
        message: "only a Super Admin can change a Super Admin account",
      }),
    ).toMatchObject({
      success: false,
      code: "super_admin_protected",
    });

    expect(
      mapAdminAccessRpcError({
        code: "42501",
        message:
          "admins cannot perform destructive access changes on their own account",
      }),
    ).toMatchObject({
      success: false,
      code: "self_destructive_action_blocked",
    });

    expect(
      mapAdminAccessRpcError({
        code: "P0002",
        message: "target profile not found",
      }),
    ).toMatchObject({
      success: false,
      code: "target_not_found",
    });
  });
});
