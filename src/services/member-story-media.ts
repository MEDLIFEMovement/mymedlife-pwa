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

type ListResponse = {
  data: Array<{ id?: string | null; name: string }> | null;
  error: { message?: string } | null;
};

export type MemberStoryMediaClient = {
  storage: {
    from(bucket: string): {
      list(
        path: string,
        options: { limit: number; search: string },
      ): Promise<ListResponse>;
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
  availability: "ready" | "missing" | "unavailable";
};

export async function getMemberStoryMediaReadbacks(
  client: MemberStoryMediaClient,
  evidenceRows: EvidenceItemRow[],
): Promise<MemberStoryMediaReadback[]> {
  const approvedStoredRows = evidenceRows.filter(isApprovedStoredStory);

  return Promise.all(
    approvedStoredRows.map(async (row) => {
      const storagePath = row.storage_path!;
      const objectAvailability = await getObjectAvailability(client, storagePath);

      if (objectAvailability !== "ready") {
        return {
          evidenceItemId: row.id,
          thumbnailUrl: null,
          mediaUrl: null,
          availability: objectAvailability,
        };
      }

      if (row.evidence_type === "bridge_video") {
        const mediaUrl = await createSignedUrl(client, storagePath);
        return {
          evidenceItemId: row.id,
          thumbnailUrl: null,
          mediaUrl,
          availability: mediaUrl ? "ready" as const : "unavailable" as const,
        };
      }

      const thumbnailUrl = await createSignedUrl(client, storagePath, {
        transform: {
          width: 1200,
          height: 1200,
          resize: "cover",
          quality: 82,
        },
      });
      return {
        evidenceItemId: row.id,
        thumbnailUrl,
        mediaUrl: null,
        availability: thumbnailUrl ? "ready" as const : "unavailable" as const,
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

async function getObjectAvailability(
  client: MemberStoryMediaClient,
  storagePath: string,
) {
  const pathSegments = storagePath.split("/");
  const fileName = pathSegments.pop();
  const folder = pathSegments.join("/");

  if (!fileName || !folder) return "unavailable" as const;

  const response = await client.storage
    .from(PRIVATE_STORY_BUCKET)
    .list(folder, { limit: 2, search: fileName });

  if (response.error || !Array.isArray(response.data)) {
    return "unavailable" as const;
  }

  return response.data.some((object) => object.id && object.name === fileName)
    ? "ready" as const
    : "missing" as const;
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
