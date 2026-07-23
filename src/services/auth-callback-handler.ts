import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import {
  buildAuthCallbackFailureRedirectPath,
  buildAuthCallbackRedirectPath,
  getAuthCallbackFailureCode,
  isSupabaseEmailOtpType,
} from "@/services/auth-callback";
import { getSupabaseAuthConfig } from "@/services/supabase-auth-config";

type AuthCallbackOverride = {
  next: string | null;
  redirectTo: string | null;
  type: string | null;
};

export async function handleAuthCallback(
  request: NextRequest,
  override?: AuthCallbackOverride,
) {
  const requestUrl = new URL(request.url);
  const redirectPath = buildAuthCallbackRedirectPath({
    next: override?.next ?? requestUrl.searchParams.get("next"),
    redirectTo: override?.redirectTo ?? requestUrl.searchParams.get("redirectTo"),
    type: override?.type ?? requestUrl.searchParams.get("type"),
  });
  const fallbackUrl = new URL(redirectPath, requestUrl.origin);
  const config = getSupabaseAuthConfig(process.env);

  if (!config.enabled) {
    return NextResponse.redirect(
      new URL(
        buildAuthCallbackFailureRedirectPath(
          {
            next: override?.next ?? requestUrl.searchParams.get("next"),
            redirectTo:
              override?.redirectTo ?? requestUrl.searchParams.get("redirectTo"),
            type: override?.type ?? requestUrl.searchParams.get("type"),
          },
          getAuthCallbackFailureCode({
            authAvailable: false,
            next: override?.next ?? requestUrl.searchParams.get("next"),
            type: override?.type ?? requestUrl.searchParams.get("type"),
          }),
        ),
        requestUrl.origin,
      ),
    );
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

  let authError: { message?: string } | null | undefined;

  if (code) {
    ({ error: authError } = await client.auth.exchangeCodeForSession(code));
  } else if (tokenHash && isSupabaseEmailOtpType(otpType)) {
    ({ error: authError } = await client.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    }));
  } else {
    authError = { message: "Missing or unsupported auth callback credentials." };
  }

  if (authError) {
    const failurePath = buildAuthCallbackFailureRedirectPath(
      {
        next: override?.next ?? requestUrl.searchParams.get("next"),
        redirectTo:
          override?.redirectTo ?? requestUrl.searchParams.get("redirectTo"),
        type: override?.type ?? requestUrl.searchParams.get("type"),
      },
      getAuthCallbackFailureCode({
        authAvailable: true,
        next: override?.next ?? requestUrl.searchParams.get("next"),
        type: override?.type ?? requestUrl.searchParams.get("type"),
      }),
    );

    return copyAuthCookies(
      cookieResponse,
      NextResponse.redirect(new URL(failurePath, requestUrl.origin)),
    );
  }

  return copyAuthCookies(
    cookieResponse,
    NextResponse.redirect(fallbackUrl),
  );
}

function copyAuthCookies(
  source: NextResponse,
  destination: NextResponse,
) {
  for (const cookie of source.cookies.getAll()) {
    destination.cookies.set(cookie);
  }

  return destination;
}
