import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceFamily } from "@/services/role-visibility";

export function getLaunchLaneEventWriteAccessError(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  request: {
    chapterEventId?: string | null;
    eventId: string | null;
    chapterId: string | null;
    chapterName: string | null;
  },
) {
  const mappedChapterEvent = request.chapterEventId
    ? data.allChapterEventRows.find((row) => row.id === request.chapterEventId) ?? null
    : null;
  const requestedChapterId = mappedChapterEvent?.chapter_id ?? request.chapterId;
  const requestedChapterName =
    request.chapterName ??
    getChapterNameById(data, requestedChapterId);

  if (!requestedChapterId || !requestedChapterName) {
    return "The selected chapter could not be verified for this event update.";
  }

  if (!canActorAccessLaunchLaneChapter(actor, requestedChapterName)) {
    return "This account cannot manage the event loop for that chapter.";
  }

  if (!request.eventId) {
    return null;
  }

  const linkedEvent = findLinkedChapterEventByLumaEventId(data, request.eventId);

  if (!linkedEvent) {
    return "Update the mapped launch-lane event only after myMEDLIFE has already linked it to a chapter event.";
  }

  if (linkedEvent.chapterEvent.chapter_id !== requestedChapterId) {
    return "The selected Luma event belongs to a different chapter than the one you are trying to update.";
  }

  if (request.chapterEventId && linkedEvent.chapterEvent.id !== request.chapterEventId) {
    return "The selected Luma event no longer matches the mapped chapter event.";
  }

  return null;
}

export function getLaunchLaneRsvpAccessError(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  input: {
    chapterEventId?: string | null;
    eventId?: string | null;
  },
) {
  const linkedEvent = input.chapterEventId
    ? findLinkedChapterEventByChapterEventId(data, input.chapterEventId)
    : input.eventId
      ? findLinkedChapterEventByLumaEventId(data, input.eventId)
      : null;

  if (!linkedEvent) {
    return "This RSVP lane is only available for a mapped chapter event.";
  }

  if (input.chapterEventId && linkedEvent.chapterEvent.id !== input.chapterEventId) {
    return "The selected RSVP event no longer matches the mapped chapter event.";
  }

  if (input.eventId && linkedEvent.link.luma_event_id !== input.eventId) {
    return "The selected RSVP event no longer matches the mapped chapter event.";
  }

  const chapterName = getChapterNameById(data, linkedEvent.chapterEvent.chapter_id);

  if (!chapterName || !canActorAccessLaunchLaneChapter(actor, chapterName)) {
    return "This account cannot RSVP into another chapter's launch lane.";
  }

  return null;
}

export function getLaunchLaneAttendanceImportAccessError(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  input: {
    chapterEventId?: string | null;
    eventId?: string | null;
  },
) {
  const linkedEvent = input.chapterEventId
    ? findLinkedChapterEventByChapterEventId(data, input.chapterEventId)
    : input.eventId
      ? findLinkedChapterEventByLumaEventId(data, input.eventId)
      : null;

  if (!linkedEvent) {
    return "Import attendance only after myMEDLIFE has linked the Luma event to a chapter event.";
  }

  if (input.eventId && linkedEvent.link.luma_event_id !== input.eventId) {
    return "The selected attendance import event no longer matches the mapped chapter event.";
  }

  const chapterName = getChapterNameById(data, linkedEvent.chapterEvent.chapter_id);

  if (!chapterName || !canActorAccessLaunchLaneChapter(actor, chapterName)) {
    return "This reviewer cannot import attendance for a chapter outside the allowed launch lane.";
  }

  return null;
}

export function findLinkedChapterEventByLumaEventId(
  data: ReadOnlyAppData,
  eventId: string,
) {
  const link = data.allLumaEventLinkRows.find((row) => row.luma_event_id === eventId);

  if (!link?.chapter_event_id) {
    return null;
  }

  const chapterEvent =
    data.allChapterEventRows.find((row) => row.id === link.chapter_event_id) ?? null;

  if (!chapterEvent) {
    return null;
  }

  return {
    link,
    chapterEvent,
  };
}

export function findLinkedChapterEventByChapterEventId(
  data: ReadOnlyAppData,
  chapterEventId: string,
) {
  const link = data.allLumaEventLinkRows.find(
    (row) => row.chapter_event_id === chapterEventId && row.luma_event_id,
  );

  if (!link?.chapter_event_id) {
    return null;
  }

  const chapterEvent =
    data.allChapterEventRows.find((row) => row.id === link.chapter_event_id) ?? null;

  if (!chapterEvent) {
    return null;
  }

  return {
    link,
    chapterEvent,
  };
}

export function canActorAccessLaunchLaneChapter(
  actor: LocalActorContext,
  chapterName: string,
) {
  const normalizedChapterName = chapterName.trim().toLowerCase();
  const surfaceFamily = getActorSurfaceFamily(actor);

  switch (surfaceFamily) {
    case "member":
    case "leader":
      return actor.chapterNames.some(
        (value) => value.trim().toLowerCase() === normalizedChapterName,
      );
    case "coach":
      return actor.coachPortfolioChapterNames.some(
        (value) => value.trim().toLowerCase() === normalizedChapterName,
      );
    case "staff":
    case "ds_admin":
    case "super_admin":
      return true;
  }
}

export function getChapterNameById(
  data: ReadOnlyAppData,
  chapterId: string | null,
) {
  if (!chapterId) {
    return null;
  }

  return data.chapterRows.find((row) => row.id === chapterId)?.name ?? null;
}
