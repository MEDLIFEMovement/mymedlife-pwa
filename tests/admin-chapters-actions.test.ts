import { redirect } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  submitAdminChapterAction,
  submitAdminChapterForLocalSupabase,
  submitAdminChapterTestMarkerForLocalSupabase,
} from "@/app/admin/chapters/actions";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("admin chapter management server action", () => {
  it("stays locked until explicit local admin write flags are enabled", async () => {
    const result = await submitAdminChapterForLocalSupabase(
      buildAdminChapterForm({
        operation: "create_chapter",
        name: "Test Pilot MEDLIFE",
        campus: "Test Pilot University",
      }),
    );

    expect(result).toMatchObject({
      success: false,
      code: "write_disabled",
    });
  });

  it("redirects back to the chapter page with a safe result query", async () => {
    const formData = buildAdminChapterForm({
      operation: "archive_chapter",
      chapterId: "00000000-0000-4000-8000-000000000201",
      confirmation: "ARCHIVE CHAPTER",
    });
    formData.set("returnTo", "https://example.test/steal-session");

    await submitAdminChapterAction(formData);

    expect(redirect).toHaveBeenCalledWith(
      "/admin/chapters?adminChapterResult=write_disabled&chapterId=00000000-0000-4000-8000-000000000201&operation=archive_chapter",
    );
  });

  it("rejects unsupported operations, missing create fields, invalid status, mock ids, and short reasons", async () => {
    enableAdminChapterWrites();

    await expectAdminChapterFailure(
      buildAdminChapterForm({ operation: "delete_chapter" }),
      "invalid_operation",
    );
    await expectAdminChapterFailure(
      buildAdminChapterForm({ operation: "create_chapter", name: "" }),
      "invalid_profile",
    );
    await expectAdminChapterFailure(
      buildAdminChapterForm({
        operation: "update_chapter",
        chapterId: "00000000-0000-4000-8000-000000000201",
        chapterType: "not-a-real-type",
      }),
      "invalid_chapter_type",
    );
    await expectAdminChapterFailure(
      buildAdminChapterForm({
        operation: "update_chapter",
        chapterId: "00000000-0000-4000-8000-000000000201",
        status: "deleted",
      }),
      "invalid_status",
    );
    await expectAdminChapterFailure(
      buildAdminChapterForm({
        operation: "archive_chapter",
        chapterId: "mock-chapter",
        confirmation: "ARCHIVE CHAPTER",
      }),
      "target_not_found",
    );

    const shortReasonForm = buildAdminChapterForm({
      operation: "create_chapter",
      name: "Test Pilot MEDLIFE",
      campus: "Test Pilot University",
    });
    shortReasonForm.set("auditReason", "too short");

    await expectAdminChapterFailure(shortReasonForm, "audit_reason_required");

    await expectAdminChapterFailure(
      buildAdminChapterForm({
        operation: "assign_student_leader",
        chapterId: "00000000-0000-4000-8000-000000000201",
        targetUserId: "00000000-0000-4000-8000-000000000008",
        roleKey: "president_vp",
        roleTermStartYear: "2025",
        roleTermEndYear: "2024",
      }),
      "invalid_profile",
    );
  });

  it("requires confirmation before destructive chapter changes", async () => {
    enableAdminChapterWrites();

    const result = await submitAdminChapterForLocalSupabase(
      buildAdminChapterForm({
        operation: "archive_chapter",
        chapterId: "00000000-0000-4000-8000-000000000201",
        confirmation: "",
      }),
    );

    expect(result).toMatchObject({
      success: false,
      code: "confirmation_required",
    });
  });

  it("requires confirmation before changing Staff/Admin-only TEST visibility", async () => {
    enableAdminChapterWrites();

    const formData = buildAdminChapterForm({
      operation: "set_test_marker",
      chapterId: "00000000-0000-4000-8000-000000000201",
    });
    formData.set("isTest", "true");

    const result = await submitAdminChapterTestMarkerForLocalSupabase(formData);

    expect(result).toMatchObject({
      success: false,
      code: "server_error",
    });
  });

  it("maps an audited TEST marker RPC response", async () => {
    enableAdminChapterWrites();

    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          chapter_id: "00000000-0000-4000-8000-000000000201",
          is_test: true,
          audit_log_id: "90000000-0000-4000-8000-000000000099",
        },
      ],
      error: null,
    });

    const formData = buildAdminChapterForm({
      operation: "set_test_marker",
      chapterId: "00000000-0000-4000-8000-000000000201",
    });
    formData.set("isTest", "true");
    formData.set("confirmation", "MARK CHAPTER TEST");

    const result = await submitAdminChapterTestMarkerForLocalSupabase(formData, {
      createServerClient: async () => ({
        client: buildRpcClient(rpc),
        config: { reason: "Test client is available." },
      }),
      getSessionState: async () => signedInSession(),
    });

    expect(rpc).toHaveBeenCalledWith("admin_set_chapter_test", {
      target_chapter_uuid: "00000000-0000-4000-8000-000000000201",
      is_test_input: true,
      audit_reason_input: "MED-509 admin chapter test reason.",
    });
    expect(result).toMatchObject({
      success: true,
      code: "admin_chapter_test_changed",
      isTest: true,
      auditLogId: "90000000-0000-4000-8000-000000000099",
    });
  });

  it("requires a local Supabase client and a signed-in admin session", async () => {
    enableAdminChapterWrites();

    await expectAdminChapterFailure(
      buildAdminChapterForm({
        operation: "create_chapter",
        name: "Test Pilot MEDLIFE",
        campus: "Test Pilot University",
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

    await expectAdminChapterFailure(
      buildAdminChapterForm({
        operation: "create_chapter",
        name: "Test Pilot MEDLIFE",
        campus: "Test Pilot University",
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

  it("maps RPC permission errors and empty RPC responses without reporting success", async () => {
    enableAdminChapterWrites();

    await expectAdminChapterFailure(
      buildAdminChapterForm({
        operation: "create_chapter",
        name: "Test Pilot MEDLIFE",
        campus: "Test Pilot University",
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

    await expectAdminChapterFailure(
      buildAdminChapterForm({
        operation: "create_chapter",
        name: "Test Pilot MEDLIFE",
        campus: "Test Pilot University",
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

  it("maps a successful audited RPC response into a chapter-change result", async () => {
    enableAdminChapterWrites();

    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          operation: "assign_student_leader",
          chapter_id: "00000000-0000-4000-8000-000000000201",
          membership_id: "20000000-0000-4000-8000-000000000099",
          coach_assignment_id: null,
          audit_log_id: "90000000-0000-4000-8000-000000000099",
          chapter_status: "active",
          active_member_count: 12,
          active_event_count: 2,
          historical_record_count: 30,
        },
      ],
      error: null,
    });
    const fakeClient = buildRpcClient(rpc);

    const result = await submitAdminChapterForLocalSupabase(
      buildAdminChapterForm({
        operation: "assign_student_leader",
        chapterId: "00000000-0000-4000-8000-000000000201",
        targetUserId: "00000000-0000-4000-8000-000000000008",
        roleKey: "action_committee_chair",
        roleTermStartYear: "2024",
        roleTermEndYear: "2025",
        roleTermLabel: "Action Committee Chair for 2024-2025",
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
    expect(rpc).toHaveBeenCalledWith("admin_manage_chapter", {
      operation_input: "assign_student_leader",
      chapter_uuid: "00000000-0000-4000-8000-000000000201",
      name_input: null,
      campus_input: null,
      region_input: null,
      country_input: null,
      hubspot_company_id_input: null,
      status_input: null,
      target_user_uuid: "00000000-0000-4000-8000-000000000008",
      role_key_input: "action_committee_chair",
      role_term_start_year_input: 2024,
      role_term_end_year_input: 2025,
      role_term_label_input: "Action Committee Chair for 2024-2025",
      audit_reason_input: "MED-509 admin chapter test reason.",
    });
    expect(result).toMatchObject({
      success: true,
      code: "admin_chapter_changed",
      chapterId: "00000000-0000-4000-8000-000000000201",
      auditLogId: "90000000-0000-4000-8000-000000000099",
    });
  });
});

type AdminChapterActionDeps = NonNullable<
  Parameters<typeof submitAdminChapterForLocalSupabase>[1]
>;
type AdminChapterCreateServerClient = NonNullable<
  AdminChapterActionDeps["createServerClient"]
>;
type AdminChapterClient = Awaited<
  ReturnType<AdminChapterCreateServerClient>
>["client"];
type AdminChapterResultCode = Awaited<
  ReturnType<typeof submitAdminChapterForLocalSupabase>
>["code"];

async function expectAdminChapterFailure(
  formData: FormData,
  code: Exclude<AdminChapterResultCode, "admin_chapter_changed">,
  deps?: AdminChapterActionDeps,
) {
  await expect(
    submitAdminChapterForLocalSupabase(formData, deps),
  ).resolves.toMatchObject({
    success: false,
    code,
  });
}

function buildRpcClient(rpc: ReturnType<typeof vi.fn>): AdminChapterClient {
  return {
    schema: vi.fn(() => ({
      rpc,
    })),
  } as AdminChapterClient;
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

function enableAdminChapterWrites() {
  vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
  vi.stubEnv("MYMEDLIFE_ENABLE_ADMIN_ACCESS_WRITE", "true");
}

function buildAdminChapterForm(input: {
  operation: string;
  auditReason?: string;
  campus?: string;
  chapterType?: string;
  chapterId?: string;
  confirmation?: string;
  name?: string;
  region?: string;
  roleKey?: string;
  roleTermEndYear?: string;
  roleTermLabel?: string;
  roleTermStartYear?: string;
  status?: string;
  targetUserId?: string;
}) {
  const formData = new FormData();
  formData.set("operation", input.operation);
  formData.set(
    "auditReason",
    input.auditReason ?? "MED-509 admin chapter test reason.",
  );

  if (input.campus !== undefined) formData.set("campus", input.campus);
  if (input.chapterType !== undefined) {
    formData.set("chapterType", input.chapterType);
  } else if (input.operation === "create_chapter") {
    formData.set("chapterType", "college_university");
  }
  if (input.chapterId) formData.set("chapterId", input.chapterId);
  if (input.confirmation !== undefined) {
    formData.set("confirmation", input.confirmation);
  }
  if (input.name !== undefined) formData.set("name", input.name);
  if (input.region) formData.set("region", input.region);
  if (input.roleKey) formData.set("roleKey", input.roleKey);
  if (input.roleTermEndYear) {
    formData.set("roleTermEndYear", input.roleTermEndYear);
  }
  if (input.roleTermLabel) formData.set("roleTermLabel", input.roleTermLabel);
  if (input.roleTermStartYear) {
    formData.set("roleTermStartYear", input.roleTermStartYear);
  }
  if (input.status) formData.set("status", input.status);
  if (input.targetUserId) formData.set("targetUserId", input.targetUserId);

  return formData;
}
