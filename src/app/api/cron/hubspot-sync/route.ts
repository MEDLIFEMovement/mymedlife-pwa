import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { runHubSpotReadSync } from "@/services/hubspot-read-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  if (!secret || !matchesBearerSecret(authorization, secret)) {
    return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 });
  }

  const result = await runHubSpotReadSync(null, "incremental", {
    triggerSource: "scheduled",
  });
  if (result.success) {
    return NextResponse.json({ ok: true, code: result.code, runId: result.runId });
  }

  const status = result.code === "sync_already_running"
    ? 409
    : result.code === "sync_disabled"
      ? 503
      : 500;
  return NextResponse.json({ ok: false, code: result.code, runId: result.runId }, { status });
}

function matchesBearerSecret(authorization: string, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authorization);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
