import {
  createSupabaseReadonlyClient,
  getSupabaseReadConfig,
} from "@/lib/supabase-readonly";
import type { LocalActorContext } from "@/services/local-actor-context";
import { readLocalDataSnapshot } from "@/services/read-only-app-data";
import {
  buildPrivateProofUploadRow,
  getPrivateProofUploadWorkspaceBase,
  type PrivateProofUploadWorkspace,
} from "@/services/private-proof-upload-write";
import type {
  AssignmentRow,
  ChapterRow,
  EvidenceItemRow,
  ProfileRow,
} from "@/shared/types/persistence";

export async function getPrivateProofUploadWorkspace(
  actor: LocalActorContext,
): Promise<PrivateProofUploadWorkspace> {
  const readConfig = getSupabaseReadConfig();

  if (!readConfig.enabled) {
    return getPrivateProofUploadWorkspaceBase(actor, [], "mock");
  }

  const snapshot = await readLocalDataSnapshot(createSupabaseReadonlyClient(readConfig));
  const assignmentById = new Map(
    snapshot.assignments.map((assignment) => [assignment.id, assignment]),
  );
  const chapterById = new Map(snapshot.chapters.map((chapter) => [chapter.id, chapter]));
  const profileById = new Map(snapshot.profiles.map((profile) => [profile.id, profile]));

  const rows = snapshot.evidenceItems
    .filter((row) => canInspectPrivateProofUpload(actor, row))
    .map((row) =>
      toPrivateProofUploadRow(row, assignmentById, chapterById, profileById, actor),
    )
    .filter(Boolean);

  return getPrivateProofUploadWorkspaceBase(
    actor,
    rows,
    "supabase",
  );
}

function canInspectPrivateProofUpload(
  actor: LocalActorContext,
  row: EvidenceItemRow,
): boolean {
  switch (actor.audience) {
    case "chapter_member":
    case "chapter_leader":
      return row.submitted_by_user_id === actor.user.id;
    case "admin":
    case "super_admin":
      return true;
    case "coach":
    case "ds_admin":
      return false;
  }
}

function toPrivateProofUploadRow(
  row: EvidenceItemRow,
  assignmentById: Map<string, AssignmentRow>,
  chapterById: Map<string, ChapterRow>,
  profileById: Map<string, ProfileRow>,
  actor: LocalActorContext,
) {
  const assignment = row.assignment_id ? assignmentById.get(row.assignment_id) : null;
  const chapter = chapterById.get(row.chapter_id);
  const submitter = profileById.get(row.submitted_by_user_id);

  return buildPrivateProofUploadRow({
    actor,
    assignmentId: row.assignment_id,
    assignmentStatus: assignment?.status ?? null,
    assignmentTitle:
      assignment?.title ??
      (row.chapter_event_id ? "Event proof follow-up" : "Proof metadata item"),
    chapterName: chapter?.name ?? "Chapter",
    evidenceItemId: row.id,
    submittedBy: submitter?.display_name ?? submitter?.email ?? "Unknown submitter",
    submittedByUserId: row.submitted_by_user_id,
    evidenceType: row.evidence_type,
    summary: row.summary,
    status: row.status,
    sharingStatus: row.sharing_status,
    storagePath: row.storage_path,
  });
}
