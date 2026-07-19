import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";

export async function refreshSupabaseSession(
  request: NextRequest,
  env: Record<string, string | undefined> = process.env,
) {
  const config = getSupabaseAuthConfig(env);

  if (!config.enabled) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Validates the access token and refreshes expired auth cookies when needed.
  await supabase.auth.getClaims();

  return response;
}
