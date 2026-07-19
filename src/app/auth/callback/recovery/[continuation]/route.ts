import { NextRequest } from "next/server";

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

  return handleAuthCallback(request, {
    next: "update-password",
    redirectTo: decodeAuthRecoveryContinuation(continuation),
    type: "recovery",
  });
}
