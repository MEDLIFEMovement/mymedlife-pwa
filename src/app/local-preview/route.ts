import { NextResponse, type NextRequest } from "next/server";

import { normalizeLocalRoleSwitcherReturnTo } from "@/components/local-role-switcher/return-to";
import { getLandingRouteForLocalActorEmail } from "@/services/landing-route";
import {
  localActorOptions,
  localActorPreviewCookieName,
} from "@/services/local-actor-context";

const previewCookieMaxAgeSeconds = 60 * 60 * 24 * 30;

export function GET(request: NextRequest) {
  const selectedEmail = request.nextUrl.searchParams.get("selectedEmail")?.trim().toLowerCase();
  const returnTo = normalizeLocalRoleSwitcherReturnTo(
    request.nextUrl.searchParams.get("returnTo"),
  ) ?? (selectedEmail ? getLandingRouteForLocalActorEmail(selectedEmail) : "/");
  const redirectUrl = new URL(returnTo, request.url);
  const response = NextResponse.redirect(redirectUrl);

  if (selectedEmail) {
    const isKnownActor = localActorOptions.some((option) => option.email === selectedEmail);

    if (isKnownActor) {
      response.cookies.set(localActorPreviewCookieName, selectedEmail, {
        httpOnly: true,
        maxAge: previewCookieMaxAgeSeconds,
        path: "/",
        sameSite: "lax",
      });
    }
  }

  return response;
}
