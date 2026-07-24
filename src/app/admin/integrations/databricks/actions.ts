"use server";

import { redirect } from "next/navigation";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import {
  runDatabricksEventMetricsExport,
  type DatabricksExportMode,
} from "@/services/databricks-event-metrics-export";

const ROUTE = "/admin/integrations/databricks";

export async function submitDatabricksExportAction(formData: FormData) {
  const mode: DatabricksExportMode = formData.get("mode") === "incremental"
    ? "incremental"
    : "backfill";
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  const expected = mode === "incremental"
    ? "EXPORT DATABRICKS"
    : "BACKFILL DATABRICKS";
  if (confirmation !== expected) {
    redirect(`${ROUTE}?databricksResult=confirmation_required&mode=${mode}`);
  }

  const { client } = await createLocalSupabaseServerClient();
  const session = client ? await getAuthSessionState(client) : null;
  const result = await runDatabricksEventMetricsExport(
    session?.user?.id ?? null,
    mode,
  );
  redirect(resultHref(result.code, result.runId));
}

export async function submitDatabricksReplayAction(formData: FormData) {
  const retryOfRunId = String(formData.get("retryOfRunId") ?? "").trim();
  const mode: DatabricksExportMode = formData.get("mode") === "backfill"
    ? "backfill"
    : "incremental";
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (!retryOfRunId || confirmation !== "REPLAY DATABRICKS") {
    redirect(`${ROUTE}?databricksResult=replay_confirmation_required`);
  }

  const { client } = await createLocalSupabaseServerClient();
  const session = client ? await getAuthSessionState(client) : null;
  const result = await runDatabricksEventMetricsExport(
    session?.user?.id ?? null,
    mode,
    { triggerSource: "replay", retryOfRunId },
  );
  redirect(resultHref(result.code, result.runId));
}

function resultHref(code: string, runId: string | null) {
  return `${ROUTE}?databricksResult=${encodeURIComponent(code)}${
    runId ? `&runId=${encodeURIComponent(runId)}` : ""
  }`;
}
