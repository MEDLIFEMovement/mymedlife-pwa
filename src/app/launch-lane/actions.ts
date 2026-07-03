"use server";

import { redirect } from "next/navigation";

import {
  createOrUpdateLumaEvent,
  importLumaAttendance,
  type LumaImportedAttendanceRawRow,
  writeLumaRsvp,
} from "@/services/luma-live-pilot";
import {
  findLinkedChapterEventByChapterEventId,
  getLaunchLaneAttendanceImportAccessError,
  getLaunchLaneEventWriteAccessError,
  getLaunchLaneRsvpAccessError,
} from "@/services/launch-lane-event-access";
import { getLaunchLaneEventSnapshotById } from "@/services/launch-lane-event-snapshots";
import {
  getLumaPilotPersistenceReadiness,
  persistLumaAttendanceImportProof,
  persistLumaEventUpsertProof,
  persistLumaRsvpProof,
} from "@/services/luma-live-pilot-persistence";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canImportLaunchLaneAttendance,
  canManageLaunchLaneEvents,
  canWriteLaunchLaneMemberRsvp,
} from "@/services/role-visibility";

export async function runLaunchLaneLeaderEventUpsertAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/leader?view=events");

  if (!canManageLaunchLaneEvents(actor)) {
    redirectWithResult(
      returnTo,
      "error",
      "Only a chapter leader or admin reviewer can run the live event setup lane.",
    );
  }

  const readiness = await getLumaPilotPersistenceReadiness();

  if (!readiness.ready) {
    redirectWithResult(returnTo, "error", readiness.message);
  }

  const chapterEventId = normalizeString(formData.get("chapterEventId"));
  const data = await getReadOnlyAppData();
  const eventAccessError = getLaunchLaneEventWriteAccessError(actor, data, {
    chapterEventId,
    eventId: null,
    chapterId: null,
    chapterName: null,
  });

  if (eventAccessError) {
    redirectWithResult(returnTo, "error", eventAccessError);
  }

  const snapshot = chapterEventId
    ? getLaunchLaneEventSnapshotById(data, chapterEventId, {
        chapterEvents: data.allChapterEventRows,
        lumaEventLinks: data.allLumaEventLinkRows,
      })
    : null;

  if (!snapshot) {
    redirectWithResult(
      returnTo,
      "error",
      "The selected chapter event could not be found for this live event update.",
    );
  }

  const request = {
    eventId: snapshot.lumaEventId,
    chapterId: snapshot.chapterId,
    chapterName: snapshot.chapterName,
    name: snapshot.title,
    startAt: snapshot.startsAt ?? "",
    endAt: snapshot.endsAt,
    timezone: snapshot.timeZone,
    address: normalizeString(snapshot.memberLocationLabel),
    descriptionMd: normalizeString(snapshot.promotionSummary),
  };
  const result = await createOrUpdateLumaEvent(request);

  if (result.ok) {
    try {
      await persistLumaEventUpsertProof({
        actor,
        request,
        result,
      });
    } catch (error) {
      redirectWithResult(
        returnTo,
        "error",
        error instanceof Error
          ? `The Luma event call worked, but myMEDLIFE could not record the proof rows: ${error.message}`
          : "The Luma event call worked, but myMEDLIFE could not record the proof rows.",
      );
    }
  }

  redirectWithResult(
    returnTo,
    result.ok ? "success" : "error",
    result.eventId
      ? `${result.safeMessage} Event id: ${result.eventId}.`
      : result.safeMessage,
  );
}

export async function runLaunchLaneMemberRsvpAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/app");

  if (!canWriteLaunchLaneMemberRsvp(actor)) {
    redirectWithResult(
      returnTo,
      "error",
      "Only a signed-in member can write an RSVP from the member workspace.",
    );
  }

  const readiness = await getLumaPilotPersistenceReadiness();

  if (!readiness.ready) {
    redirectWithResult(returnTo, "error", readiness.message);
  }

  const chapterEventId = String(formData.get("chapterEventId") ?? "");
  const data = await getReadOnlyAppData();
  const rsvpAccessError = getLaunchLaneRsvpAccessError(actor, data, {
    chapterEventId,
  });

  if (rsvpAccessError) {
    redirectWithResult(returnTo, "error", rsvpAccessError);
  }

  const linkedEvent = findLinkedChapterEventByChapterEventId(data, chapterEventId);

  if (!linkedEvent?.link.luma_event_id) {
    redirectWithResult(
      returnTo,
      "error",
      "This RSVP lane is only available after the chapter event is linked to Luma.",
    );
  }

  const matchingProfile =
    data.profiles.find((profile) => profile.email.trim().toLowerCase() === actor.user.email.trim().toLowerCase()) ??
    null;

  if (
    hasRecordedMemberRsvp(
      data.allEventRows,
      chapterEventId,
      actor.user.email,
      matchingProfile?.id ?? null,
    )
  ) {
    redirectWithResult(
      returnTo,
      "success",
      "Your RSVP was already recorded for this live pilot event.",
    );
  }

  const request = {
    eventId: linkedEvent.link.luma_event_id,
    email: actor.user.email,
    name: actor.user.displayName,
  };
  const result = await writeLumaRsvp(request);

  if (result.ok) {
    try {
      await persistLumaRsvpProof({
        actor,
        request,
        result,
      });
    } catch (error) {
      redirectWithResult(
        returnTo,
        "error",
        error instanceof Error
          ? `The RSVP write worked in Luma, but myMEDLIFE could not record the proof rows: ${error.message}`
          : "The RSVP write worked in Luma, but myMEDLIFE could not record the proof rows.",
      );
    }
  }

  redirectWithResult(
    returnTo,
    result.ok ? "success" : "error",
    result.safeMessage,
  );
}

export async function runLaunchLaneAttendanceImportAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/leader?view=attendance");

  if (!canImportLaunchLaneAttendance(actor)) {
    redirectWithResult(
      returnTo,
      "error",
      "Only a leader, staff reviewer, or admin reviewer can import attendance from the launch lane.",
    );
  }

  const readiness = await getLumaPilotPersistenceReadiness();

  if (!readiness.ready) {
    redirectWithResult(returnTo, "error", readiness.message);
  }

  const chapterEventId = String(formData.get("chapterEventId") ?? "");
  const data = await getReadOnlyAppData();
  const attendanceAccessError = getLaunchLaneAttendanceImportAccessError(
    actor,
    data,
    {
      chapterEventId,
    },
  );

  if (attendanceAccessError) {
    redirectWithResult(returnTo, "error", attendanceAccessError);
  }

  const linkedEvent = findLinkedChapterEventByChapterEventId(data, chapterEventId);

  if (!linkedEvent?.link.luma_event_id) {
    redirectWithResult(
      returnTo,
      "error",
      "Import attendance only after the chapter event is linked to Luma.",
    );
  }

  const eventId = linkedEvent.link.luma_event_id;

  let rawRows: LumaImportedAttendanceRawRow[] = [];
  let persistenceResult:
    | Awaited<ReturnType<typeof persistLumaAttendanceImportProof>>
    | null = null;
  const result = await importLumaAttendance(
    {
      eventId,
      limit: Number(formData.get("limit") ?? 50),
    },
    {
      onImportedRows(rows) {
        rawRows = rows;
      },
    },
  );

  if (result.ok) {
    try {
      persistenceResult = await persistLumaAttendanceImportProof({
        actor,
        eventId,
        result,
        attendanceRows: rawRows,
      });
    } catch (error) {
      redirectWithResult(
        returnTo,
        "error",
        error instanceof Error
          ? `The attendance import worked, but myMEDLIFE could not record the proof rows: ${error.message}`
          : "The attendance import worked, but myMEDLIFE could not record the proof rows.",
      );
    }
  }

  redirectWithResult(
    returnTo,
    result.ok ? "success" : "error",
    result.ok
      ? buildAttendanceImportSuccessMessage(result.safeMessage, persistenceResult)
      : result.safeMessage,
  );
}

function redirectWithResult(
  returnTo: string,
  status: "success" | "error",
  message: string,
): never {
  const url = new URL(returnTo, "https://staging.mymedlife.org");
  url.searchParams.set("lumaResult", status);
  url.searchParams.set("lumaMessage", message.slice(0, 240));
  redirect(`${url.pathname}${url.search}`);
}

function normalizeReturnTo(
  value: FormDataEntryValue | null,
  fallback: string,
): string {
  const raw = typeof value === "string" ? value : fallback;

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }

  return raw;
}

function normalizeString(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function buildAttendanceImportSuccessMessage(
  safeMessage: string,
  persistenceResult: Awaited<ReturnType<typeof persistLumaAttendanceImportProof>> | null,
) {
  if (!persistenceResult) {
    return safeMessage;
  }

  return `${safeMessage} ${persistenceResult.attendanceCount} attendee(s) confirmed and ${persistenceResult.pointsCreated} point award(s) recorded.`;
}

function hasRecordedMemberRsvp(
  eventRows: Awaited<ReturnType<typeof getReadOnlyAppData>>["allEventRows"],
  chapterEventId: string,
  userEmail: string,
  profileId: string | null,
) {
  const normalizedEmail = userEmail.trim().toLowerCase();

  return eventRows.some((row) => {
    if (row.chapter_event_id !== chapterEventId || row.event_type !== "event_rsvp_recorded") {
      return false;
    }

    const payload =
      row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {};
    const payloadEmail =
      typeof payload.userEmail === "string"
        ? payload.userEmail
        : typeof payload.userEmailHint === "string"
          ? payload.userEmailHint
          : null;
    const payloadUserId = typeof payload.userId === "string" ? payload.userId : null;

    return payloadEmail?.trim().toLowerCase() === normalizedEmail || payloadUserId === profileId;
  });
}
