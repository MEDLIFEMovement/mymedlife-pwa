import { getLandingRouteForLocalActorEmail } from "@/services/landing-route";

export function buildLocalPreviewHref(selectedEmail: string, returnTo?: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("selectedEmail", selectedEmail);
  searchParams.set("returnTo", returnTo ?? getLandingRouteForLocalActorEmail(selectedEmail));

  return `/local-preview?${searchParams.toString()}`;
}

export function buildStudentHomePreviewHref() {
  return buildLocalPreviewHref("member.a@mymedlife.test", "/");
}
