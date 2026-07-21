import type { MemberStory } from "@/services/member-stories-read-model";

export function getMemberStoryMediaSurfaceCopy(
  mediaStatus: MemberStory["mediaStatus"] | undefined,
) {
  if (mediaStatus === "approved_media_missing") {
    return {
      title: "Media unavailable",
      detail:
        "Approved story metadata is live, but the referenced media object is missing from storage.",
    };
  }
  if (mediaStatus === "approved_media_unavailable") {
    return {
      title: "Media temporarily unavailable",
      detail:
        "Approved story metadata is live, but storage could not verify or sign the media object.",
    };
  }
  if (mediaStatus === "private_media_protected") {
    return {
      title: "Media not published",
      detail: "Approved story metadata is live. The private original remains protected.",
    };
  }
  return {
    title: "Media not published",
    detail: "Approved story metadata is live. No publishable thumbnail is available.",
  };
}
