import { describe, expect, it } from "vitest";
import {
  getChapterLumaCalendarSummary,
  getChapterLumaRolloutReadiness,
  resolveChapterLumaCalendar,
} from "@/services/chapter-luma-calendars";

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
] as const;

describe("chapter Luma calendar summary", () => {
  it("shows the visible chapters as blocked when no shared or explicit chapter calendar is configured", () => {
    const summary = getChapterLumaCalendarSummary({
      chapters: visibleChapters,
      env: {},
    });

    expect(summary.totalCount).toBe(3);
    expect(summary.readyCount).toBe(0);
    expect(summary.savedReadyCount).toBe(0);
    expect(summary.temporaryReadyCount).toBe(0);
    expect(summary.needsSetupCount).toBe(3);
    expect(summary.detail).toContain("No chapter calendars are configured yet");
    expect(summary.rows.map((row) => row.chapterName)).toEqual([
      "UCLA MEDLIFE",
      "Lakeside MEDLIFE",
      "Boston College MEDLIFE",
    ]);
  });

  it("uses the current shared staging calendar as a narrow launch default for one chapter", () => {
    const summary = getChapterLumaCalendarSummary({
      chapters: visibleChapters,
      env: {
        LUMA_CALENDAR_ID: "cal-7WNftYCpBJclZyG",
        MYMEDLIFE_LUMA_SHARED_DEFAULT_CHAPTER_ID: "chapter-lakeside",
      },
    });

    expect(summary.readyCount).toBe(1);
    expect(summary.explicitReadyCount).toBe(0);
    expect(summary.savedReadyCount).toBe(0);
    expect(summary.temporaryReadyCount).toBe(0);
    expect(summary.sharedDefaultCount).toBe(1);
    expect(summary.needsSetupCount).toBe(2);
    expect(summary.rows[1]).toMatchObject({
      chapterName: "Lakeside MEDLIFE",
      status: "shared_default",
      readyForPilot: true,
      wideningReady: false,
      mappingSourceLabel: "Shared default",
      calendarIdHint: "cal-...lZyG",
    });
    expect(summary.rows[0]).toMatchObject({
      chapterName: "UCLA MEDLIFE",
      status: "needs_setup",
      readyForPilot: false,
      mappingSourceLabel: "Needs saved map",
    });
  });

  it("accepts explicit chapter calendar assignments from a simple JSON registry", () => {
    const summary = getChapterLumaCalendarSummary({
      chapters: visibleChapters,
      env: {
        MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON: JSON.stringify([
          {
            chapterId: "chapter-northview",
            calendarId: "cal-ucla-1234",
            calendarLabel: "UCLA chapter calendar",
          },
          {
            chapterName: "Boston College MEDLIFE",
            calendarId: "cal-bc-5678",
            note: "Ready once the Boston pilot opens.",
          },
        ]),
      },
    });

    expect(summary.readyCount).toBe(2);
    expect(summary.explicitReadyCount).toBe(2);
    expect(summary.savedReadyCount).toBe(0);
    expect(summary.temporaryReadyCount).toBe(2);
    expect(summary.sharedDefaultCount).toBe(0);
    expect(summary.needsSetupCount).toBe(1);
    expect(summary.rows[0]).toMatchObject({
      chapterName: "UCLA MEDLIFE",
      status: "ready",
      calendarLabel: "UCLA chapter calendar",
      readyForPilot: true,
      wideningReady: false,
      mappingSourceLabel: "Temporary env map",
    });
    expect(summary.rows[2]).toMatchObject({
      chapterName: "Boston College MEDLIFE",
      status: "ready",
      readyForPilot: true,
      mappingSourceLabel: "Temporary env map",
      note: "Ready once the Boston pilot opens.",
    });
  });

  it("prefers saved in-app calendar rows over env fallback mappings for the same chapter", () => {
    const summary = getChapterLumaCalendarSummary({
      chapters: visibleChapters,
      persistedRows: [
        {
          id: "chapter-luma-ucla",
          chapter_id: "chapter-northview",
          environment: "staging",
          calendar_id: "cal-ucla-persisted",
          calendar_label: "UCLA saved calendar",
          is_default: false,
          status: "linked",
          linked_by: "leader-1",
          linked_at: "2026-06-30T00:00:00Z",
          notes: "Saved in app for staging.",
          created_at: "2026-06-30T00:00:00Z",
          updated_at: "2026-06-30T00:00:00Z",
        },
      ],
      env: {
        VERCEL_ENV: "preview",
        MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON: JSON.stringify([
          {
            chapterId: "chapter-northview",
            calendarId: "cal-ucla-env",
            calendarLabel: "UCLA env calendar",
          },
        ]),
      },
    });

    expect(summary.rows[0]).toMatchObject({
      chapterName: "UCLA MEDLIFE",
      status: "ready",
      calendarId: "cal-ucla-persisted",
      calendarLabel: "UCLA saved calendar",
      wideningReady: true,
      mappingSourceLabel: "Saved in myMEDLIFE",
      note: "Saved in app for staging.",
    });
  });

  it("includes configured chapters outside the seeded defaults when no visible chapter list is passed", () => {
    const summary = getChapterLumaCalendarSummary({
      env: {
        MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON: JSON.stringify([
          {
            chapterId: "chapter-georgia-tech",
            chapterName: "Georgia Tech MEDLIFE",
            calendarId: "cal-gt-9999",
          },
        ]),
      },
    });

    expect(summary.rows.map((row) => row.chapterName)).toEqual([
      "UCLA MEDLIFE",
      "Lakeside MEDLIFE",
      "Boston College MEDLIFE",
      "UC San Diego MEDLIFE",
      "McGill MEDLIFE",
      "Georgia Tech MEDLIFE",
    ]);
    expect(
      summary.rows.find((row) => row.chapterId === "chapter-georgia-tech"),
    ).toMatchObject({
      chapterId: "chapter-georgia-tech",
      chapterName: "Georgia Tech MEDLIFE",
      status: "ready",
      readyForPilot: true,
      calendarIdHint: "cal-...9999",
    });
  });

  it("resolves chapters by id, by name, and by shared-default fallback", () => {
    const options = {
      chapters: visibleChapters,
      env: {
        LUMA_CALENDAR_ID: "cal-7WNftYCpBJclZyG",
        MYMEDLIFE_LUMA_SHARED_DEFAULT_CHAPTER_ID: "chapter-northview",
        MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON: JSON.stringify([
          {
            chapterId: "chapter-lakeside",
            calendarId: "cal-lakeside-4321",
          },
        ]),
      },
    };

    expect(
      resolveChapterLumaCalendar(
        { chapterId: "chapter-lakeside" },
        options,
      )?.calendarId,
    ).toBe("cal-lakeside-4321");
    expect(
      resolveChapterLumaCalendar(
        { chapterName: "ucla medlife" },
        options,
      )?.chapterId,
    ).toBe("chapter-northview");
    expect(
      resolveChapterLumaCalendar(
        { chapterName: "Unknown MEDLIFE", allowSharedDefaultFallback: true },
        options,
      )?.chapterName,
    ).toBe("UCLA MEDLIFE");
  });

  it("can resolve an explicitly configured chapter even when it is outside the seeded fallback list", () => {
    const resolved = resolveChapterLumaCalendar(
      { chapterId: "chapter-georgia-tech" },
      {
        env: {
          MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON: JSON.stringify([
            {
              chapterId: "chapter-georgia-tech",
              chapterName: "Georgia Tech MEDLIFE",
              calendarId: "cal-gt-9999",
            },
          ]),
        },
      },
    );

    expect(resolved).toMatchObject({
      chapterId: "chapter-georgia-tech",
      chapterName: "Georgia Tech MEDLIFE",
      status: "ready",
      readyForPilot: true,
      calendarId: "cal-gt-9999",
    });
  });

  it("describes readiness for 1, 5, 25, and 300 chapter rollout waves", () => {
    const stages = getChapterLumaRolloutReadiness({
      chapters: visibleChapters,
      env: {
        LUMA_CALENDAR_ID: "cal-7WNftYCpBJclZyG",
        MYMEDLIFE_LUMA_SHARED_DEFAULT_CHAPTER_ID: "chapter-northview",
        MYMEDLIFE_LUMA_CHAPTER_CALENDARS_JSON: JSON.stringify([
          {
            chapterId: "chapter-lakeside",
            calendarId: "cal-lakeside-4321",
          },
        ]),
      },
    });

    expect(stages).toEqual([
      expect.objectContaining({
        key: "pilot_1",
        status: "ready",
        mappedChapters: 2,
      }),
      expect.objectContaining({
        key: "wave_5",
        status: "blocked",
        mappedChapters: 2,
      }),
      expect.objectContaining({
        key: "wave_25",
        status: "blocked",
        mappedChapters: 1,
      }),
      expect.objectContaining({
        key: "wave_300",
        status: "blocked",
        mappedChapters: 1,
      }),
    ]);
  });

  it("ignores saved in-app rows from the wrong environment", () => {
    const summary = getChapterLumaCalendarSummary({
      chapters: visibleChapters,
      persistedRows: [
        {
          id: "chapter-luma-ucla",
          chapter_id: "chapter-northview",
          environment: "production",
          calendar_id: "cal-ucla-prod",
          calendar_label: "UCLA production calendar",
          is_default: false,
          status: "linked",
          linked_by: "leader-1",
          linked_at: "2026-06-30T00:00:00Z",
          notes: null,
          created_at: "2026-06-30T00:00:00Z",
          updated_at: "2026-06-30T00:00:00Z",
        },
      ],
      env: {
        VERCEL_ENV: "preview",
      },
    });

    expect(summary.rows[0]).toMatchObject({
      chapterName: "UCLA MEDLIFE",
      status: "needs_setup",
      readyForPilot: false,
    });
  });

  it("uses saved staging rows as the local review fallback when no local mapping rows exist", () => {
    const summary = getChapterLumaCalendarSummary({
      chapters: visibleChapters,
      persistedRows: [
        {
          id: "chapter-luma-ucla",
          chapter_id: "chapter-northview",
          environment: "staging",
          calendar_id: "cal-ucla-staging",
          calendar_label: "UCLA saved calendar",
          is_default: false,
          status: "linked",
          linked_by: "leader-1",
          linked_at: "2026-06-30T00:00:00Z",
          notes: "Saved in app for the staging pilot.",
          created_at: "2026-06-30T00:00:00Z",
          updated_at: "2026-06-30T00:00:00Z",
        },
      ],
      env: {},
    });

    expect(summary.rows[0]).toMatchObject({
      chapterName: "UCLA MEDLIFE",
      status: "ready",
      readyForPilot: true,
      calendarId: "cal-ucla-staging",
      calendarLabel: "UCLA saved calendar",
      note: "Saved in app for the staging pilot.",
    });
  });
});
