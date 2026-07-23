import { NextResponse } from "next/server";

import { getReleaseProvenance } from "@/services/release-provenance";

export const dynamic = "force-dynamic";

export async function GET() {
  const provenance = getReleaseProvenance();

  return NextResponse.json(provenance, {
    status: provenance.ready ? 200 : 503,
    headers: {
      "cache-control": "no-store, max-age=0",
      ...(provenance.releaseSha
        ? { "x-mymedlife-release": provenance.releaseSha }
        : {}),
    },
  });
}
