"use client";

import { Heart } from "lucide-react";

import { submitMemberStoryReactionAction } from "@/app/app/stories/actions";
import type { MemberStoryReactionReadbackStatus } from "@/services/member-story-reactions";

export function getMemberStoryReactionSurfaceCopy(
  writeEnabled: boolean,
  readbackStatus: MemberStoryReactionReadbackStatus,
) {
  if (readbackStatus === "unavailable") {
    return {
      subtitle: "Approved myMEDLIFE stories - reaction readback unavailable",
      status: "Counts unavailable",
      feedNote: "Approved myMEDLIFE metadata - reaction counts could not be verified, so reacting, shares, and saves remain disabled.",
      readerNote: "Approved myMEDLIFE story metadata. Reaction counts could not be verified; reacting, saves, and external source opening remain disabled.",
    };
  }

  return writeEnabled
    ? {
        subtitle: "Approved myMEDLIFE stories with live reactions",
        status: "Live reactions",
        feedNote: "Approved myMEDLIFE metadata - reactions are live; shares and saves remain disabled.",
        readerNote: "Approved myMEDLIFE story metadata. Reactions are live and auditable; saves and external source opening remain disabled.",
      }
    : {
        subtitle: "Approved myMEDLIFE stories with live reaction counts",
        status: "Live counts - read-only",
        feedNote: "Approved myMEDLIFE metadata - persisted reaction counts are live; reacting, shares, and saves remain disabled.",
        readerNote: "Approved myMEDLIFE story metadata. Persisted reaction counts are live and auditable; reacting, saves, and external source opening remain disabled.",
      };
}

export function getMemberStoryReactionCountLabel(story: {
  persisted?: boolean;
  reactionStatus?: MemberStoryReactionReadbackStatus;
  likes: number;
}) {
  if (story.persisted && story.reactionStatus === "unavailable") {
    return "Reaction count unavailable";
  }
  if (!story.persisted) return `${story.likes.toLocaleString()} preview likes`;
  return `${story.likes.toLocaleString()} ${story.likes === 1 ? "reaction" : "reactions"}`;
}

export function MemberStoryReactionForm({
  storyId,
  liked,
  reactionCount,
  filter,
  openStory,
  showCount = false,
}: Readonly<{
  storyId: string;
  liked: boolean;
  reactionCount: number;
  filter: string;
  openStory?: boolean;
  showCount?: boolean;
}>) {
  return (
    <form action={submitMemberStoryReactionAction}>
      <input type="hidden" name="storyId" value={storyId} />
      <input type="hidden" name="filter" value={filter} />
      {openStory ? <input type="hidden" name="openStory" value={storyId} /> : null}
      <button
        type="submit"
        aria-label={liked ? "Remove reaction" : "React to story"}
        aria-pressed={liked}
        title={liked ? "Remove your reaction" : "React to this approved story"}
        className="inline-flex items-center gap-2 text-rose-600 transition hover:text-rose-700 active:scale-[0.97]"
      >
        <Heart size={showCount ? 20 : 26} fill={liked ? "currentColor" : "none"} />
        {showCount ? (
          <span className="text-sm font-semibold text-foreground">
            {reactionCount.toLocaleString()} {reactionCount === 1 ? "reaction" : "reactions"}
          </span>
        ) : null}
      </button>
    </form>
  );
}

export function MemberStoryReactionResultBanner({ result }: Readonly<{ result?: string | null }>) {
  if (!result) return null;

  const success = result === "story_liked" || result === "story_unliked";
  const message = result === "story_liked"
    ? "Reaction saved in myMEDLIFE."
    : result === "story_unliked"
      ? "Reaction removed from the count. Its audit history was retained."
      : "The reaction was not changed. Please try again after the write gate is available.";

  return (
    <div
      role="status"
      className={`mx-4 mt-3 rounded-lg border px-3 py-2 text-sm font-semibold ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      {message}
    </div>
  );
}
