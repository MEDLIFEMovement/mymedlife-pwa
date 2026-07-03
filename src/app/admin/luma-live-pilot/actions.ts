"use server";

import { redirect } from "next/navigation";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import {
  createOrUpdateLumaEvent,
  importLumaAttendance,
  type LumaImportedAttendanceRawRow,
  writeLumaRsvp,
} from "@/services/luma-live-pilot";
import {
  findLinkedLaunchLaneEventOption,
} from "@/services/launch-lane-linked-events";
import {
  getChapterNameById,
  getLaunchLaneAttendanceImportAccessError,
  getLaunchLaneEventWriteAccessError,
  getLaunchLaneRsvpAccessError,
} from "@/services/launch-lane-event-access";
import {
  getLumaPilotPersistenceReadiness,
  persistLumaAttendanceImportProof,
  persistLumaEventUpsertProof,
  persistLumaRsvpProof,
} from "@/services/luma-live-pilot-persistence";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";

export async function saveChapterLumaCalendarAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeReturnTo(formData.get("returnTo"));

  if (!canReadAdminIntegrationsSecurity(actor)) {
    redirectWithResult(
      returnTo,
      "error",
      "Only DS Admin or Super Admin can save chapter Luma calendar mappings.",
    );
  }

  const data = await getReadOnlyAppData();
  const chapterId = normalizeString(formData.get("chapterId"));
  const chapterName =
    getChapterNameById(data, chapterId) ??
    normalizeString(formData.get("chapterName"));
  const environment = normalizeRolloutEnvironment(formData.get("environment"));
  const calendarId = normalizeString(formData.get("calendarId"));
  const calendarLabel =
    normalizeString(formData.get("calendarLabel")) ??
    (chapterName ? `${chapterName} calendar` : "Chapter Luma calendar");
  const notes = normalizeString(formData.get("notes"));
  const reason = normalizeString(formData.get("reason"));
  const isDefault = formData.has("isDefault");
  const confirmation = normalizeString(formData.get("productionConfirmation"));

  if (!chapterId || !chapterName) {
    redirectWithResult(
      returnTo,
      "error",
      "Choose a visible chapter before saving a Luma calendar mapping.",
    );
  }

  if (!calendarId) {
    redirectWithResult(
      returnTo,
      "error",
      "Enter a Luma calendar id before saving this chapter mapping.",
    );
  }

  if (!reason || reason.length < 8) {
    redirectWithResult(
      returnTo,
      "error",
      "Add a short reason so the audit log explains this chapter mapping change.",
    );
  }

  if (environment === "production" && confirmation !== "PRODUCTION") {
    redirectWithResult(
      returnTo,
      "error",
      "Type PRODUCTION before saving a production chapter calendar mapping.",
    );
  }

  const { client, config } = await createLocalSupabaseServerClient();

  if (!client) {
    redirectWithResult(returnTo, "error", config.reason);
  }

  const authState = await getAuthSessionState(client, {
    isLocalOnly: config.isLocalOnly,
    sessionLabel: config.isLocalOnly
      ? "local Supabase Auth"
      : "hosted staging Supabase Auth",
  });

  if (authState.status !== "signed_in") {
    redirectWithResult(
      returnTo,
      "error",
      "Sign in with a DS Admin or Super Admin Supabase session before saving chapter mappings.",
    );
  }

  const { data: rpcData, error } = await client
    .schema("app")
    .rpc("set_chapter_luma_calendar", {
      chapter_id_input: chapterId,
      environment_input: environment,
      calendar_id_input: calendarId,
      calendar_label_input: calendarLabel,
      status_input: "linked",
      is_default_input: isDefault,
      notes_input: notes,
      reason_input: reason,
      confirmation_input: confirmation,
    });

  if (error) {
    redirectWithResult(
      returnTo,
      "error",
      mapChapterLumaCalendarRpcError(error.message),
    );
  }

  const firstRow = Array.isArray(rpcData) ? rpcData[0] : null;

  if (!firstRow) {
    redirectWithResult(
      returnTo,
      "error",
      "Supabase did not return the saved chapter mapping row.",
    );
  }

  redirectWithResult(
    returnTo,
    "success",
    isDefault
      ? `Saved ${chapterName} as the shared ${environment} chapter calendar mapping.`
      : `Saved the ${environment} Luma calendar mapping for ${chapterName}.`,
  );
}

export async function runLumaEventUpsertAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeReturnTo(formData.get("returnTo"));

  if (!canReadAdminIntegrationsSecurity(actor)) {
    redirectWithResult(returnTo, "error", "Only DS Admin or Super Admin can run the staging Luma pilot.");
  }

  const readiness = await getLumaPilotPersistenceReadiness();

  if (!readiness.ready) {
    redirectWithResult(returnTo, "error", readiness.message);
  }

  const data = await getReadOnlyAppData();
  const request = {
    eventId: normalizeString(formData.get("eventId")),
    chapterId: normalizeString(formData.get("chapterId")),
    chapterName:
      normalizeString(formData.get("chapterName")) ??
      getChapterNameById(data, normalizeString(formData.get("chapterId"))),
    name: String(formData.get("name") ?? ""),
    startAt: String(formData.get("startAt") ?? ""),
    endAt: normalizeString(formData.get("endAt")),
    timezone: String(formData.get("timezone") ?? "America/New_York"),
    address: normalizeString(formData.get("address")),
    descriptionMd: normalizeString(formData.get("descriptionMd")),
  };
  const eventAccessError = getLaunchLaneEventWriteAccessError(actor, data, request);

  if (eventAccessError) {
    redirectWithResult(returnTo, "error", eventAccessError);
  }

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
          ? `Luma event call succeeded, but myMEDLIFE could not record the staging proof rows: ${error.message}`
          : "Luma event call succeeded, but myMEDLIFE could not record the staging proof rows.",
      );
    }
  }

  redirectWithResult(
    returnTo,
    result.ok ? "success" : "error",
    result.eventId
      ? `${result.safeMessage} Event id: ${result.eventId}. Staging proof recorded.`
      : result.safeMessage,
  );
}

export async function runLumaRsvpWriteAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeReturnTo(formData.get("returnTo"));

  if (!canReadAdminIntegrationsSecurity(actor)) {
    redirectWithResult(returnTo, "error", "Only DS Admin or Super Admin can run the staging Luma pilot.");
  }

  const readiness = await getLumaPilotPersistenceReadiness();

  if (!readiness.ready) {
    redirectWithResult(returnTo, "error", readiness.message);
  }

  const data = await getReadOnlyAppData();
  const chapterEventId = normalizeString(formData.get("chapterEventId"));
  const linkedEvent = findLinkedLaunchLaneEventOption(data, {
    chapterEventId,
  });
  const rsvpRequest = {
    chapterEventId,
    eventId: linkedEvent?.eventId ?? null,
  };
  const rsvpAccessError = getLaunchLaneRsvpAccessError(actor, data, rsvpRequest);

  if (rsvpAccessError) {
    redirectWithResult(returnTo, "error", rsvpAccessError);
  }

  const request = {
    eventId: linkedEvent?.eventId ?? "",
    email: String(formData.get("email") ?? ""),
    name: normalizeString(formData.get("name")),
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
          ? `Luma RSVP write succeeded, but myMEDLIFE could not record the staging proof rows: ${error.message}`
          : "Luma RSVP write succeeded, but myMEDLIFE could not record the staging proof rows.",
      );
    }
  }

  redirectWithResult(
    returnTo,
    result.ok ? "success" : "error",
    result.ok ? `${result.safeMessage} Staging proof recorded.` : result.safeMessage,
  );
}

export async function runLumaAttendanceImportAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeReturnTo(formData.get("returnTo"));

  if (!canReadAdminIntegrationsSecurity(actor)) {
    redirectWithResult(returnTo, "error", "Only DS Admin or Super Admin can run the staging Luma pilot.");
  }

  const readiness = await getLumaPilotPersistenceReadiness();

  if (!readiness.ready) {
    redirectWithResult(returnTo, "error", readiness.message);
  }

  const chapterEventId = normalizeString(formData.get("chapterEventId"));
  const data = await getReadOnlyAppData();
  const linkedEvent = findLinkedLaunchLaneEventOption(data, {
    chapterEventId,
  });
  const eventId = linkedEvent?.eventId ?? "";
  const attendanceAccessError = getLaunchLaneAttendanceImportAccessError(
    actor,
    data,
    {
      chapterEventId,
      eventId: linkedEvent?.eventId ?? null,
    },
  );

  if (attendanceAccessError) {
    redirectWithResult(returnTo, "error", attendanceAccessError);
  }

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
          ? `Luma attendance import succeeded, but myMEDLIFE could not record the staging proof rows: ${error.message}`
          : "Luma attendance import succeeded, but myMEDLIFE could not record the staging proof rows.",
      );
    }
  }

  redirectWithResult(
    returnTo,
    result.ok ? "success" : "error",
    result.ok
      ? `${buildAttendanceImportSuccessMessage(result.safeMessage, persistenceResult)} Staging proof recorded. No secrets returned.`
      : `${result.safeMessage} No secrets returned.`,
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

function normalizeReturnTo(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "/admin/luma-live-pilot";

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/admin/luma-live-pilot";
  }

  return raw;
}

function normalizeString(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function normalizeRolloutEnvironment(
  value: FormDataEntryValue | null,
): "local" | "staging" | "production" {
  const raw = normalizeString(value)?.toLowerCase();

  if (raw === "local" || raw === "production") {
    return raw;
  }

  return "staging";
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

function mapChapterLumaCalendarRpcError(message: string) {
  if (message.includes("actor cannot manage chapter Luma calendars")) {
    return "Only DS Admin or Super Admin can save chapter Luma calendar mappings.";
  }

  if (message.includes("approval reason is required")) {
    return "Add a short reason so the audit log explains this chapter mapping change.";
  }

  if (message.includes("calendar id is required")) {
    return "Enter a Luma calendar id before saving this chapter mapping.";
  }

  if (message.includes("type PRODUCTION to confirm")) {
    return "Type PRODUCTION before saving a production chapter calendar mapping.";
  }

  if (message.includes("unknown chapter id")) {
    return "The selected chapter could not be verified before saving this mapping.";
  }

  return `Could not save the chapter Luma calendar mapping: ${message}`;
}
