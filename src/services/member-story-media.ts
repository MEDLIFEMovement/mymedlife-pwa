import type { EvidenceItemRow } from "@/shared/types/persistence";

const PRIVATE_STORY_BUCKET = "proof-submissions-private";
const SIGNED_MEDIA_TTL_SECONDS = 15 * 60;

type SignedUrlOptions = {
  transform?: {
    width: number;
    height: number;
    resize: "cover";
    quality: number;
  };
};

type SignedUrlResponse = {
  data: { signedUrl: string } | null;
  error: { message?: string } | null;
};

export type MemberStoryMediaClient = {
  storage: {
    from(bucket: string): {
      createSignedUrl(
        path: string,
        expiresIn: number,
        options?: SignedUrlOptions,
      ): Promise<SignedUrlResponse>;
    };
  };
};

export type MemberStoryMediaReadback = {
  evidenceItemId: string;
  thumbnailUrl: string | null;
  mediaUrl: string | null;
};

export async function getMemberStoryMediaReadbacks(
  client: MemberStoryMediaClient,
  evidenceRows: EvidenceItemRow[],
): Promise<MemberStoryMediaReadback[]> {
  const approvedStoredRows = evidenceRows.filter(isApprovedStoredStory);

  return Promise.all(
    approvedStoredRows.map(async (row) => {
      if (row.evidence_type === "bridge_video") {
        return {
          evidenceItemId: row.id,
          thumbnailUrl: null,
          mediaUrl: await createSignedUrl(client, row.storage_path!),
        };
      }

      return {
        evidenceItemId: row.id,
        thumbnailUrl: await createSignedUrl(client, row.storage_path!, {
          transform: {
            width: 1200,
            height: 1200,
            resize: "cover",
            quality: 82,
          },
        }),
        mediaUrl: null,
      };
    }),
  );
}

export function isApprovedStoredStory(row: EvidenceItemRow) {
  if (
    row.status !== "approved" ||
    row.sharing_status !== "approved_for_sharing" ||
    !row.storage_path ||
    (row.evidence_type !== "event_photo" && row.evidence_type !== "bridge_video")
  ) {
    return false;
  }

  const expectedPrefix = `chapters/${row.chapter_id}/evidence/${row.id}/`;
  return row.storage_path.startsWith(expectedPrefix) && !row.storage_path.includes("..");
}

async function createSignedUrl(
  client: MemberStoryMediaClient,
  storagePath: string,
  options?: SignedUrlOptions,
) {
  const response = await client.storage
    .from(PRIVATE_STORY_BUCKET)
    .createSignedUrl(storagePath, SIGNED_MEDIA_TTL_SECONDS, options);

  return response.error ? null : response.data?.signedUrl ?? null;
}
