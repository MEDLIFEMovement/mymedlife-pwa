import {
  getChapterTypeFilterLabel,
  getChapterTypeLabel,
  type ChapterTypeFilter,
} from "@/services/chapter-type";
import type { ChapterType } from "@/shared/types/persistence";

export type StaffLaunchChapterType = ChapterType;
export type StaffLaunchChapterTypeFilter = ChapterTypeFilter;

export type StaffChapterTypeSource = {
  chapterType: "established" | "new" | "growing";
  school: string;
};

export const staffChapterTypeFilterOptions: StaffLaunchChapterTypeFilter[] = [
  "all",
  "high_school",
  "college_university",
  "needs_review",
];

export function getStaffChapterTypeLabel(chapter: StaffChapterTypeSource) {
  return getChapterTypeLabel(getStaffChapterTypeValue(chapter));
}

export function getStaffChapterTypeFilterLabel(
  type: StaffLaunchChapterTypeFilter,
) {
  return getChapterTypeFilterLabel(type);
}

export function getStaffChapterTypeValue(
  chapter: StaffChapterTypeSource,
): StaffLaunchChapterType {
  if (chapter.school.toLowerCase().includes("high school")) {
    return "high_school";
  }

  return chapter.chapterType === "new" ? "needs_review" : "college_university";
}
