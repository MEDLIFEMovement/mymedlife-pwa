import type { ChapterType } from "@/shared/types/persistence";

export type ChapterTypeFilter = ChapterType | "all";

export const chapterTypeOptions: Array<{
  value: ChapterType;
  label: string;
}> = [
  { value: "high_school", label: "High School Chapter" },
  { value: "college_university", label: "College / University Chapter" },
  { value: "needs_review", label: "Needs Review" },
];

export const chapterTypeFilterOptions: Array<{
  value: ChapterTypeFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "high_school", label: "High School" },
  { value: "college_university", label: "College / University" },
  { value: "needs_review", label: "Needs Review" },
];

const allowedChapterTypes = new Set<ChapterType>(
  chapterTypeOptions.map((option) => option.value),
);

export function isChapterType(value: unknown): value is ChapterType {
  return typeof value === "string" && allowedChapterTypes.has(value as ChapterType);
}

export function getChapterTypeLabel(type: ChapterType): string {
  return (
    chapterTypeOptions.find((option) => option.value === type)?.label ??
    "Needs Review"
  );
}

export function getChapterTypeFilterLabel(type: ChapterTypeFilter): string {
  return (
    chapterTypeFilterOptions.find((option) => option.value === type)?.label ??
    "All"
  );
}

export function normalizeChapterType(value: unknown): ChapterType {
  return isChapterType(value) ? value : "needs_review";
}

export function inferChapterTypeFromCampus(campus: string | null | undefined): ChapterType {
  const normalized = (campus ?? "").toLowerCase();

  if (
    normalized.includes("high school") ||
    normalized.includes("secondary school") ||
    normalized.includes("preparatory") ||
    normalized.includes("prep school")
  ) {
    return "high_school";
  }

  if (normalized.trim().length === 0) {
    return "needs_review";
  }

  return "college_university";
}
