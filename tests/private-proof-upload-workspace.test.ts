import { describe, expect, it } from "vitest";

import type { SupabaseReadonlyClient } from "@/lib/supabase-readonly";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getPrivateProofUploadWorkspace } from "@/services/private-proof-upload-workspace";

const actorUserId = "10000000-0000-4000-8000-000000000001";
const chapterId = "50000000-0000-4000-8000-000000000001";
const assignmentId = "70000000-0000-4000-8000-000000000001";
const evidenceItemId = "60000000-0000-4000-8000-000000000004";

const actor = {
  user: {
    id: actorUserId,
    email: "member.a@mymedlife.test",
    displayName: "TEST Member",
  },
  selectedEmail: "member.a@mymedlife.test",
  identitySource: "local_auth_session",
  authSessionStatus: "signed_in",
  audience: "chapter_member",
  audienceLabel: "General Member",
  accessSummary: "Signed-in member",
  chapterRoles: ["General Member"],
  staffRoles: [],
  canonicalRoleAssignments: [],
  canonicalRoles: ["student_member"],
  canonicalScopes: ["own"],
  primaryCanonicalRole: "student_member",
  defaultLandingSurface: "student_home_mobile",
  chapterNames: ["TEST Chapter"],
  coachPortfolioChapterNames: [],
  isLocalOnly: false,
  source: {
    mode: "supabase",
    status: "supabase_ready",
    message: "Authenticated production session.",
  },
} as LocalActorContext;

describe("private proof upload workspace", () => {
  it("uses an authenticated hosted read session to discover the submitter's queue", async () => {
    const client = createClient({
      profiles: [
        {
          id: actorUserId,
          display_name: "TEST Member",
          email: "member.a@mymedlife.test",
          status: "active",
          created_at: "2026-07-20T00:00:00Z",
          updated_at: "2026-07-20T00:00:00Z",
        },
      ],
      chapters: [
        {
          id: chapterId,
          name: "TEST Chapter",
          campus: "TEST Campus",
          region: null,
          status: "active",
          created_by: null,
          created_at: "2026-07-20T00:00:00Z",
          updated_at: "2026-07-20T00:00:00Z",
        },
      ],
      assignments: [
        {
          id: assignmentId,
          title: "TEST proof assignment",
          status: "submitted",
        },
      ],
      evidence_items: [
        {
          id: evidenceItemId,
          assignment_id: assignmentId,
          chapter_id: chapterId,
          chapter_event_id: null,
          submitted_by_user_id: actorUserId,
          evidence_type: "photo",
          summary: "TEST private proof",
          url: null,
          storage_path: null,
          target_audiences: [],
          proof_categories: [],
          messenger_type: null,
          lifecycle_stage: null,
          hesitation_addressed: null,
          status: "pending_review",
          sharing_status: "submitted",
          nps_score: null,
          activity_label: null,
          submitted_at: "2026-07-20T00:00:00Z",
          created_at: "2026-07-20T00:00:00Z",
          updated_at: "2026-07-20T00:00:00Z",
        },
      ],
    });

    const workspace = await getPrivateProofUploadWorkspace(actor, {
      createReadonlyAccess: async () => ({
        enabled: true,
        client,
        reason: "Authenticated production read session.",
        isLocalOnly: false,
        mode: "auth_session",
      }),
    });

    expect(workspace.sourceMode).toBe("supabase");
    expect(workspace.rows).toHaveLength(1);
    expect(workspace.rows[0]).toMatchObject({
      evidenceItemId,
      submittedBy: "TEST Member",
      canUpload: true,
    });
  });

  it("keeps the honest empty fallback when no authenticated read path exists", async () => {
    const workspace = await getPrivateProofUploadWorkspace(actor, {
      createReadonlyAccess: async () => ({
        enabled: false,
        reason: "No signed-in hosted session.",
        isLocalOnly: false,
        mode: "mock_fallback",
      }),
    });

    expect(workspace.sourceMode).toBe("mock");
    expect(workspace.rows).toEqual([]);
    expect(workspace.emptyStateTitle).toContain("Turn on local Supabase data");
  });
});

function createClient(
  rowsByTable: Record<string, unknown[]>,
): SupabaseReadonlyClient {
  return {
    async selectRows<TRow>(tableName: string) {
      return (rowsByTable[tableName] ?? []) as TRow[];
    },
  };
}
