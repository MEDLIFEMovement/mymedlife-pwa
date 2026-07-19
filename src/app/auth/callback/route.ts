import { NextRequest } from "next/server";

import { handleAuthCallback } from "@/services/auth-callback-handler";

export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}
