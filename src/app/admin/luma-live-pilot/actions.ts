"use server";

import { redirect } from "next/navigation";
import {
  createOrUpdateLumaEvent,
  importLumaAttendance,
  type LumaImportedAttendanceRawRow,
  writeLumaRsvp,
} from "@/services/luma-live-pilot";
import {
  persistLumaAttendanceImportProof,
  persistLumaEventUpsertProof,
  persistLumaRsvpProof,
} from "@/services/luma-live-pilot-persistence";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";

export async function runLumaEventUpsertAction(formData: FormData) {
  const actor = await getLocalActorContext();
  const returnTo = normalizeReturnTo(formData.get("returnTo"));

  if (!canReadAdminIntegrationsSecurity(actor)) {
    redirectWithResult(returnTo, "error", "Only DS Admin or Super Admin can run the staging Luma pilot.");
  }

  const result = await createOrUpdateLumaEvent({
    eventId: normalizeString(formData.get("eventId")),
    name: String(formData.get("name") ?? ""),
    startAt: String(formData.get("startAt") ?? ""),
    endAt: normalizeString(formData.get("endAt")),
    timezone: String(formData.get("timezone") ?? "America/New_York"),
    address: normalizeString(formData.get("address")),
    descriptionMd: normalizeString(formData.get("descriptionMd")),
  });

  if (result.ok) {
    try {
      await persistLumaEventUpsertProof({
        actor,
        request: {
          eventId: normalizeString(formData.get("eventId")),
          name: String(formData.get("name") ?? ""),
          startAt: String(formData.get("startAt") ?? ""),
          endAt: normalizeString(formData.get("endAt")),
          timezone: String(formData.get("timezone") ?? "America/New_York"),
          address: normalizeString(formData.get("address")),
          descriptionMd: normalizeString(formData.get("descriptionMd")),
        },
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

  const result = await writeLumaRsvp({
    eventId: String(formData.get("eventId") ?? ""),
    email: String(formData.get("email") ?? ""),
    name: normalizeString(formData.get("name")),
  });

  if (result.ok) {
    try {
      await persistLumaRsvpProof({
        actor,
        request: {
          eventId: String(formData.get("eventId") ?? ""),
          email: String(formData.get("email") ?? ""),
          name: normalizeString(formData.get("name")),
        },
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

  const eventId = String(formData.get("eventId") ?? "");
  let rawRows: LumaImportedAttendanceRawRow[] = [];
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
      await persistLumaAttendanceImportProof({
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
      ? `${result.safeMessage} Staging proof recorded. No secrets returned.`
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
