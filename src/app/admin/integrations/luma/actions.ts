"use server";

import { redirect } from "next/navigation";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import { runLumaEventSync, type LumaSyncMode } from "@/services/luma-event-sync";

export async function submitLumaEventSyncAction(formData: FormData) {
  const mode: LumaSyncMode = formData.get("mode") === "reconcile" ? "reconcile" : "backfill";
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  const expected = mode === "reconcile" ? "SYNC LUMA" : "BACKFILL LUMA";
  if (confirmation !== expected) {
    redirect(`/admin/integrations/luma?lumaSyncResult=confirmation_required&mode=${mode}`);
  }

  const { client } = await createLocalSupabaseServerClient();
  const session = client ? await getAuthSessionState(client) : null;
  const result = await runLumaEventSync(session?.user?.id ?? null, mode);
  redirect(`/admin/integrations/luma?lumaSyncResult=${result.code}${result.runId ? `&runId=${encodeURIComponent(result.runId)}` : ""}`);
}

export async function submitLumaReplayAction(formData: FormData) {
  const retryOfRunId = String(formData.get("retryOfRunId") ?? "").trim();
  const mode: LumaSyncMode = formData.get("mode") === "backfill" ? "backfill" : "reconcile";
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (!retryOfRunId || confirmation !== "REPLAY LUMA") {
    redirect("/admin/integrations/luma?lumaSyncResult=replay_confirmation_required");
  }

  const { client } = await createLocalSupabaseServerClient();
  const session = client ? await getAuthSessionState(client) : null;
  const result = await runLumaEventSync(session?.user?.id ?? null, mode, {
    triggerSource: "replay",
    retryOfRunId,
  });
  redirect(`/admin/integrations/luma?lumaSyncResult=${result.code}${result.runId ? `&runId=${encodeURIComponent(result.runId)}` : ""}`);
}
