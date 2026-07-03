import { resolveChapterLumaCalendar } from "@/services/chapter-luma-calendars";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

export type LinkedLaunchLaneEventOption = {
  chapterEventId: string;
  chapterId: string;
  chapterName: string;
  eventId: string;
  eventTitle: string;
  readyForPilot: boolean;
  calendarStatusLabel: "Explicit map" | "Shared default" | "Needs setup";
  optionLabel: string;
};

export function getLinkedLaunchLaneEventOptions(
  data: ReadOnlyAppData,
): LinkedLaunchLaneEventOption[] {
  const chapterNameById = new Map(
    data.chapterRows.map((chapter) => [chapter.id, chapter.name]),
  );

  return data.allLumaEventLinkRows
    .map((link) => {
      if (!link.chapter_event_id || !link.luma_event_id) {
        return null;
      }

      const chapterEvent = data.allChapterEventRows.find(
        (row) => row.id === link.chapter_event_id,
      );

      if (!chapterEvent) {
        return null;
      }

      const chapterName =
        chapterNameById.get(chapterEvent.chapter_id) ?? "Unknown chapter";
      const chapterCalendar = resolveChapterLumaCalendar(
        {
          chapterId: chapterEvent.chapter_id,
          chapterName,
          allowSharedDefaultFallback: true,
        },
        {
          chapters: data.chapterRows,
          persistedRows: data.chapterLumaCalendarRows,
        },
      );
      const calendarStatusLabel = chapterCalendar
        ? chapterCalendar.status === "ready"
          ? "Explicit map"
          : chapterCalendar.status === "shared_default"
            ? "Shared default"
            : "Needs setup"
        : "Needs setup";
      const readyForPilot = chapterCalendar?.readyForPilot ?? false;
      const timingLabel = chapterEvent.starts_at
        ? formatLinkedEventTimingLabel(chapterEvent.starts_at)
        : "Time pending";

      return {
        chapterEventId: chapterEvent.id,
        chapterId: chapterEvent.chapter_id,
        chapterName,
        eventId: link.luma_event_id,
        eventTitle: chapterEvent.title,
        readyForPilot,
        calendarStatusLabel,
        optionLabel: `${chapterName} - ${chapterEvent.title} - ${timingLabel} - ${calendarStatusLabel}`,
      };
    })
    .filter((option): option is LinkedLaunchLaneEventOption => option !== null)
    .sort(compareLinkedEventOptions);
}

export function getDefaultLinkedLaunchLaneEventOption(
  data: ReadOnlyAppData,
): LinkedLaunchLaneEventOption | null {
  return getLinkedLaunchLaneEventOptions(data)[0] ?? null;
}

export function findLinkedLaunchLaneEventOption(
  data: ReadOnlyAppData,
  input: {
    chapterEventId?: string | null;
    eventId?: string | null;
  },
): LinkedLaunchLaneEventOption | null {
  const chapterEventId = normalizeOptionalString(input.chapterEventId);
  const eventId = normalizeOptionalString(input.eventId);

  return (
    getLinkedLaunchLaneEventOptions(data).find((option) => {
      if (chapterEventId && option.chapterEventId === chapterEventId) {
        return true;
      }

      return eventId ? option.eventId === eventId : false;
    }) ?? null
  );
}

function compareLinkedEventOptions(
  left: LinkedLaunchLaneEventOption,
  right: LinkedLaunchLaneEventOption,
) {
  if (left.readyForPilot !== right.readyForPilot) {
    return left.readyForPilot ? -1 : 1;
  }

  return left.optionLabel.localeCompare(right.optionLabel);
}

function formatLinkedEventTimingLabel(startsAt: string) {
  const normalized = startsAt.replace("T", " ");
  return normalized.endsWith("Z") ? normalized.slice(0, -1) : normalized;
}

function normalizeOptionalString(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
