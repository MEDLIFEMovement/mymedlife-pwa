import { NextRequest, NextResponse } from "next/server";

import { handleAuthCallback } from "@/services/auth-callback-handler";
import { decodeAuthRecoveryContinuation } from "@/services/auth-recovery";

type RecoveryCallbackContext = {
  params: Promise<{ continuation: string }>;
};

export async function GET(
  request: NextRequest,
  context: RecoveryCallbackContext,
) {
  const { continuation } = await context.params;
  const requestUrl = new URL(request.url);

  if (
    !requestUrl.searchParams.has("code") &&
    !requestUrl.searchParams.has("token_hash")
  ) {
    return NextResponse.redirect(
      new URL(
        `/auth/recovery/complete/${encodeURIComponent(continuation)}`,
        request.url,
      ),
    );
  }

  return handleAuthCallback(request, {
    next: "update-password",
    redirectTo: decodeAuthRecoveryContinuation(continuation),
    type: "recovery",
  });
}
