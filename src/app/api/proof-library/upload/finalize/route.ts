import { NextResponse } from "next/server";

import {
  recordPrivateProofUploadForSupabase,
  type PreparedPrivateProofUploadTicket,
} from "@/app/proof-library/upload/actions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      {
        success: false,
        code: "permission_denied",
        evidenceItemId: "",
        plainEnglishMessage: "The private upload finalization request was refused.",
      },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: "server_error",
        evidenceItemId: "",
        plainEnglishMessage: "The private upload ticket could not be read.",
      },
      { status: 400 },
    );
  }

  if (!isPreparedPrivateProofUploadTicket(body)) {
    return NextResponse.json(
      {
        success: false,
        code: "server_error",
        evidenceItemId: "",
        plainEnglishMessage: "The private upload ticket was incomplete.",
      },
      { status: 400 },
    );
  }

  const ticket = body;

  const result = await recordPrivateProofUploadForSupabase(ticket);
  const status = result.success
    ? 200
    : result.code === "missing_auth"
      ? 401
      : result.code === "permission_denied"
        ? 403
        : result.code === "server_error"
          ? 500
          : 400;

  return NextResponse.json(result, { status });
}

function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const requestHost = forwardedHost?.split(",")[0]?.trim() ?? request.headers.get("host");

  if (!origin || !requestHost) {
    return false;
  }

  try {
    return new URL(origin).host.toLowerCase() === requestHost.toLowerCase();
  } catch {
    return false;
  }
}

function isPreparedPrivateProofUploadTicket(
  value: unknown,
): value is PreparedPrivateProofUploadTicket {
  if (!value || typeof value !== "object") {
    return false;
  }

  const ticket = value as Record<string, unknown>;
  const input = ticket.input;

  if (!input || typeof input !== "object") {
    return false;
  }

  const metadata = input as Record<string, unknown>;

  return (
    typeof ticket.evidenceItemId === "string" &&
    typeof ticket.bucket === "string" &&
    typeof ticket.storagePath === "string" &&
    typeof metadata.evidenceItemId === "string" &&
    typeof metadata.fileName === "string" &&
    typeof metadata.mimeType === "string" &&
    typeof metadata.byteSize === "number" &&
    Number.isFinite(metadata.byteSize) &&
    typeof metadata.consentToMedlifeReview === "boolean" &&
    typeof metadata.consentToFutureSharing === "boolean"
  );
}
