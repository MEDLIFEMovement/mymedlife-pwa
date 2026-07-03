import { describe, expect, it } from "vitest";
import { getChapterLumaRolloutWorkspace } from "@/services/chapter-luma-rollout-workspace";

const visibleChapters = [
  {
    id: "chapter-northview",
    name: "UCLA MEDLIFE",
    campus: "UCLA",
    region: "West Coast",
  },
  {
    id: "chapter-lakeside",
    name: "Lakeside MEDLIFE",
    campus: "Lakeside College",
    region: "Northeast",
  },
  {
    id: "chapter-boston",
    name: "Boston College MEDLIFE",
    campus: "Boston College",
    region: "Northeast",
  },
  {
    id: "chapter-ucsd",
    name: "UC San Diego MEDLIFE",
    campus: "UC San Diego",
    region: "West Coast",
  },
  {
    id: "chapter-mcgill",
    name: "McGill MEDLIFE",
    campus: "McGill University",
    region: "Canada",
  },
] as const;

describe("chapter Luma rollout workspace", () => {
  it("recommends a pilot chapter and the next mappings for the first five rollout", () => {
    const workspace = getChapterLumaRolloutWorkspace({
      chapters: visibleChapters,
      env: {
        MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON: JSON.stringify([
          {
            chapterId: "chapter-northview",
            calendarId: "cal-ucla-1234",
            calendarLabel: "UCLA chapter calendar",
          },
        ]),
      },
    });

    expect(workspace.pilotChapter).toMatchObject({
      chapterName: "UCLA MEDLIFE",
      statusLabel: "Explicit map",
    });
    expect(workspace.firstFivePlan.mappedNowCount).toBe(1);
    expect(workspace.firstFivePlan.savedReadyCount).toBe(0);
    expect(workspace.firstFivePlan.temporaryReadyCount).toBe(1);
    expect(workspace.firstFivePlan.detail).toContain("1 of 5 chapters have a usable calendar path today");
    expect(workspace.firstFivePlan.detail).toContain("0 are already saved in myMEDLIFE");
    expect(workspace.nextAction.title).toContain("Save the temporary env-backed maps");
    expect(
      workspace.firstFivePlan.chaptersToMapNext.map((row) => row.chapterName),
    ).toEqual([
      "Lakeside MEDLIFE",
      "Boston College MEDLIFE",
      "UC San Diego MEDLIFE",
      "McGill MEDLIFE",
    ]);
    expect(workspace.scaleGaps.wave25.remainingExplicitMaps).toBe(24);
    expect(workspace.scaleGaps.wave300.remainingExplicitMaps).toBe(299);
  });

  it("treats a shared default as a temporary pilot path that still needs explicit follow-up", () => {
    const workspace = getChapterLumaRolloutWorkspace({
      chapters: visibleChapters,
      env: {
        LUMA_CALENDAR_ID: "cal-shared-1234",
        MYMEDLIFE_LUMA_SHARED_DEFAULT_CHAPTER_ID: "chapter-lakeside",
      },
    });

    expect(workspace.pilotChapter).toMatchObject({
      chapterName: "Lakeside MEDLIFE",
      statusLabel: "Shared default",
    });
    expect(workspace.firstFivePlan.caution).toContain("shared default");
    expect(workspace.firstFivePlan.detail).toContain("shared default");
    expect(workspace.nextAction.title).toContain("Replace the shared default");
    expect(workspace.scaleGaps.wave25.explicitMappedCount).toBe(0);
  });
});
