import { describe, expect, it } from "vitest";

import {
  getChapterTypeFilterLabel,
  getChapterTypeLabel,
  inferChapterTypeFromCampus,
  normalizeChapterType,
} from "@/services/chapter-type";

describe("chapter type helpers", () => {
  it("uses the approved chapter type labels", () => {
    expect(getChapterTypeLabel("high_school")).toBe("High School Chapter");
    expect(getChapterTypeLabel("college_university")).toBe(
      "College / University Chapter",
    );
    expect(getChapterTypeLabel("needs_review")).toBe("Needs Review");
    expect(getChapterTypeFilterLabel("all")).toBe("All");
    expect(getChapterTypeFilterLabel("college_university")).toBe(
      "College / University",
    );
  });

  it("normalizes unknown imports to needs_review", () => {
    expect(normalizeChapterType("high_school")).toBe("high_school");
    expect(normalizeChapterType("unknown")).toBe("needs_review");
    expect(normalizeChapterType(null)).toBe("needs_review");
  });

  it("infers obvious high school rows without blocking college rows", () => {
    expect(inferChapterTypeFromCampus("Northview High School")).toBe("high_school");
    expect(inferChapterTypeFromCampus("Central Prep School")).toBe("high_school");
    expect(inferChapterTypeFromCampus("Boston College")).toBe(
      "college_university",
    );
    expect(inferChapterTypeFromCampus("")).toBe("needs_review");
  });
});
