import { describe, expect, it } from "vitest";
import type { SupabaseReadonlyClient } from "@/lib/supabase-readonly";
import {
  filterChapterLumaCalendarRowsForEnvironment,
  readChapterLumaCalendarRows,
} from "@/services/chapter-luma-calendar-store";

describe("chapter Luma calendar store", () => {
  it("filters saved rows to the active runtime environment", () => {
    const rows = filterChapterLumaCalendarRowsForEnvironment(
      [
        {
          id: "chapter-luma-local",
          chapter_id: "chapter-ucla",
          environment: "local",
          calendar_id: "cal-local",
          calendar_label: "Local UCLA calendar",
          is_default: false,
          status: "linked",
          linked_by: "leader-1",
          linked_at: "2026-06-30T00:00:00Z",
          notes: null,
          created_at: "2026-06-30T00:00:00Z",
          updated_at: "2026-06-30T00:00:00Z",
        },
        {
          id: "chapter-luma-staging",
          chapter_id: "chapter-ucla",
          environment: "staging",
          calendar_id: "cal-staging",
          calendar_label: "Staging UCLA calendar",
          is_default: false,
          status: "linked",
          linked_by: "leader-1",
          linked_at: "2026-06-30T00:00:00Z",
          notes: null,
          created_at: "2026-06-30T00:00:00Z",
          updated_at: "2026-06-30T00:00:00Z",
        },
      ],
      { VERCEL_ENV: "preview" },
    );

    expect(rows).toEqual([
      expect.objectContaining({
        id: "chapter-luma-staging",
        calendar_id: "cal-staging",
      }),
    ]);
  });

  it("fails open to an empty list when the new table is not present yet", async () => {
    const client: SupabaseReadonlyClient = {
      async selectRows() {
        throw new Error(
          'Supabase read failed for chapter_luma_calendars: 404 relation "app.chapter_luma_calendars" does not exist',
        );
      },
    };

    await expect(readChapterLumaCalendarRows(client)).resolves.toEqual([]);
  });
});
