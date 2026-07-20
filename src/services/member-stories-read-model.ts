import type {
  ChapterEventRow,
  ChapterRow,
  EvidenceItemRow,
  ProfileRow,
} from "@/shared/types/persistence";
import type { MemberStoryReactionReadback } from "@/services/member-story-reactions";

export type MemberStorySource = "field";
export type MemberStoryType =
  | "Field Story"
  | "Student Story"
  | "Chapter Highlight"
  | "Event Highlight";
export type MemberStoryFilter =
  | "For You"
  | "Events"
  | "SLT"
  | "Fundraising"
  | "Leadership";

export type MemberStory = {
  id: string;
  title: string;
  caption: string;
  source: MemberStorySource;
  type: MemberStoryType;
  chapter: string;
  country: string;
  tag?: string;
  image: string | null;
  likes: number;
  liked: boolean;
  views: number;
  date: string;
  featured: boolean;
  isVideo?: boolean;
  body?: string;
  filters: MemberStoryFilter[];
  eventRouteId?: string;
  persisted: true;
  mediaStatus: "public_media_ready" | "private_media_protected" | "metadata_only";
};

export function buildMemberStoriesReadModel(input: {
  evidenceRows: EvidenceItemRow[];
  chapters: ChapterRow[];
  chapterEvents: ChapterEventRow[];
  profiles: ProfileRow[];
  accessibleEventIds?: Iterable<string>;
  reactionReadbacks?: MemberStoryReactionReadback[];
}): MemberStory[] {
  const chapters = new Map(input.chapters.map((row) => [row.id, row]));
  const events = new Map(input.chapterEvents.map((row) => [row.id, row]));
  const profiles = new Map(input.profiles.map((row) => [row.id, row]));
  const accessibleEventIds = input.accessibleEventIds
    ? new Set(input.accessibleEventIds)
    : null;
  const reactions = new Map(
    (input.reactionReadbacks ?? []).map((row) => [row.evidenceItemId, row]),
  );

  return input.evidenceRows
    .filter(
      (row) =>
        row.status === "approved" && row.sharing_status === "approved_for_sharing",
    )
    .sort((left, right) => right.submitted_at.localeCompare(left.submitted_at))
    .map((row) => {
      const chapter = chapters.get(row.chapter_id);
      const event = row.chapter_event_id ? events.get(row.chapter_event_id) : null;
      const profile = profiles.get(row.submitted_by_user_id);
      const publicImage = getPublicImageUrl(row.url);
      const mediaStatus = publicImage
        ? "public_media_ready"
        : row.storage_path
          ? "private_media_protected"
          : "metadata_only";
      const rawChapterLabel = chapter?.name ?? "MEDLIFE chapter";
      const summary = row.summary.trim();
      const testEvidence = isTestEvidence(row, rawChapterLabel);
      const chapterLabel = withVisibleTestLabel(rawChapterLabel, testEvidence);
      const title = withVisibleTestLabel(
        event?.title?.trim() || getStoryTitle(summary, chapterLabel),
        testEvidence,
      );

      return {
        id: row.id,
        title,
        caption: withVisibleTestLabel(summary, testEvidence),
        source: "field" as const,
        type: getStoryType(row.evidence_type, Boolean(event)),
        chapter: chapterLabel,
        country: chapter?.region ?? chapter?.campus ?? "MEDLIFE",
        tag: event ? "Event proof" : "Approved story",
        image: publicImage,
        likes: reactions.get(row.id)?.reactionCount ?? 0,
        liked: reactions.get(row.id)?.likedByActor ?? false,
        views: 0,
        date: formatStoryDate(row.submitted_at),
        featured: false,
        isVideo: row.evidence_type === "bridge_video",
        body: buildStoryBody(row.hesitation_addressed, profile?.display_name),
        filters: getStoryFilters(row.evidence_type, Boolean(event)),
        eventRouteId:
          event && (!accessibleEventIds || accessibleEventIds.has(event.id))
            ? event.id
            : undefined,
        persisted: true as const,
        mediaStatus,
      };
    });
}

function isTestEvidence(row: EvidenceItemRow, chapterLabel: string) {
  return (
    /^test\b/i.test(row.summary.trim()) ||
    /^test\b/i.test(chapterLabel.trim()) ||
    /^test\//i.test(row.storage_path ?? "")
  );
}

function withVisibleTestLabel(value: string, isTest: boolean) {
  if (!isTest) return value;
  return `TEST ${value.replace(/^test\s+/i, "").trim()}`;
}

function getPublicImageUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return /\.(avif|gif|jpe?g|png|webp)$/i.test(url.pathname) ? url.toString() : null;
  } catch {
    return null;
  }
}

function getStoryTitle(summary: string, chapterLabel: string) {
  const firstSentence = summary.split(/(?<=[.!?])\s+/)[0]?.trim();
  return firstSentence || `${chapterLabel} story`;
}

function getStoryType(
  evidenceType: EvidenceItemRow["evidence_type"],
  hasEvent: boolean,
): MemberStoryType {
  if (hasEvent || evidenceType === "event_photo") return "Event Highlight";
  if (evidenceType === "testimonial_text") return "Student Story";
  if (evidenceType === "bridge_video") return "Chapter Highlight";
  return "Field Story";
}

function getStoryFilters(
  evidenceType: EvidenceItemRow["evidence_type"],
  hasEvent: boolean,
): MemberStoryFilter[] {
  const filters: MemberStoryFilter[] = ["For You"];
  if (hasEvent || evidenceType === "event_photo") filters.push("Events");
  if (evidenceType === "testimonial_text" || evidenceType === "bridge_video") {
    filters.push("Leadership");
  }
  return filters;
}

function buildStoryBody(hesitation: string | null, submitter: string | undefined) {
  const parts = [
    hesitation ? `Question addressed: ${hesitation.trim()}` : null,
    submitter ? `Submitted by ${submitter}.` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function formatStoryDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}
