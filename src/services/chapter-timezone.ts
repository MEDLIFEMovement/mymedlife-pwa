import type { ChapterRow } from "@/shared/types/persistence";

type ChapterTimeZoneSource = Pick<ChapterRow, "id" | "name" | "campus" | "region">;

const westCoastTimeZone = "America/Los_Angeles";
const northeastTimeZone = "America/New_York";
const canadaEastTimeZone = "America/Toronto";

export function resolveChapterTimeZone(
  chapter: ChapterTimeZoneSource | null | undefined,
): string {
  if (!chapter) {
    return westCoastTimeZone;
  }

  if (
    chapter.id === "chapter-boston" ||
    chapter.campus === "Boston College" ||
    chapter.region === "Northeast"
  ) {
    return northeastTimeZone;
  }

  if (
    chapter.id === "chapter-mcgill" ||
    chapter.campus === "McGill University" ||
    chapter.region === "Canada"
  ) {
    return canadaEastTimeZone;
  }

  return westCoastTimeZone;
}
