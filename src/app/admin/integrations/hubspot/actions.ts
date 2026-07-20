"use server";

import { redirect } from "next/navigation";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import { runHubSpotReadSync, type HubSpotSyncMode } from "@/services/hubspot-read-sync";

export async function submitHubSpotReadSyncAction(formData: FormData) {
  const mode = formData.get("mode") === "incremental" ? "incremental" : "backfill";
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  const expected = mode === "incremental" ? "SYNC HUBSPOT" : "BACKFILL HUBSPOT";

  if (confirmation !== expected) {
    redirect(`/admin/integrations/hubspot?hubspotSyncResult=confirmation_required&mode=${mode}`);
  }

  const { client } = await createLocalSupabaseServerClient();
  const session = client ? await getAuthSessionState(client) : null;
  const result = await runHubSpotReadSync(session?.user?.id ?? null, mode as HubSpotSyncMode);
  redirect(`/admin/integrations/hubspot?hubspotSyncResult=${result.code}${result.runId ? `&runId=${encodeURIComponent(result.runId)}` : ""}`);
}

export async function submitHubSpotReplayAction(formData: FormData) {
  const retryOfRunId = String(formData.get("retryOfRunId") ?? "").trim();
  const mode = formData.get("mode") === "incremental" ? "incremental" : "backfill";
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (!retryOfRunId || confirmation !== "REPLAY HUBSPOT") {
    redirect("/admin/integrations/hubspot?hubspotSyncResult=replay_confirmation_required");
  }

  const { client } = await createLocalSupabaseServerClient();
  const session = client ? await getAuthSessionState(client) : null;
  const result = await runHubSpotReadSync(session?.user?.id ?? null, mode as HubSpotSyncMode, {
    triggerSource: "replay",
    retryOfRunId,
  });
  redirect(`/admin/integrations/hubspot?hubspotSyncResult=${result.code}${result.runId ? `&runId=${encodeURIComponent(result.runId)}` : ""}`);
}
