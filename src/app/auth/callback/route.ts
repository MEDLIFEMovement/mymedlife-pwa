import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import {
  buildAuthCallbackRedirectPath,
  isSupabaseEmailOtpType,
} from "@/services/auth-callback";
import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const redirectPath = buildAuthCallbackRedirectPath({
    next: requestUrl.searchParams.get("next"),
    redirectTo: requestUrl.searchParams.get("redirectTo"),
    type: requestUrl.searchParams.get("type"),
  });
  const fallbackUrl = new URL(redirectPath, requestUrl.origin);
  const config = getSupabaseAuthConfig(process.env);

  if (!config.enabled) {
    return NextResponse.redirect(fallbackUrl);
  }

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = requestUrl.searchParams.get("type");

  const cookieResponse = NextResponse.next();
  const client = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    await client.auth.exchangeCodeForSession(code);
  } else if (tokenHash && isSupabaseEmailOtpType(otpType)) {
    await client.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });
  }

  const redirectResponse = NextResponse.redirect(fallbackUrl);

  for (const cookie of cookieResponse.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }

  return redirectResponse;
}
