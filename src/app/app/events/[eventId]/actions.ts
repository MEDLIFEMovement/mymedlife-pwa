"use server";

import { redirect } from "next/navigation";

import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import { getAuthSessionState } from "@/services/auth-session";
import {
  createMemberEventLoopWriteClient,
  getMemberEventLoopWriteConfig,
  memberEventLoopWriteResultParam,
  recordMemberEventLoopStep,
  type MemberEventLoopWriteResult,
} from "@/services/member-event-loop-write";

type EventDetailStep = "rsvp" | "checkin" | "points";

export async function submitMemberEventRsvpAction(formData: FormData) {
  const routeEventId = getFormString(formData, "eventId");
  const result = await submitMemberEventLoopStepForSupabase("rsvp", formData);

  redirect(buildRedirectHref(result.eventId || routeEventId, "rsvp", formData, result.code));
}

export async function submitMemberEventCancelRsvpAction(formData: FormData) {
  const routeEventId = getFormString(formData, "eventId");
  const result = await submitMemberEventLoopStepForSupabase("cancel_rsvp", formData);

  redirect(buildRedirectHref(result.eventId || routeEventId, "rsvp", formData, result.code));
}

export async function submitMemberEventCheckInAction(formData: FormData) {
  const routeEventId = getFormString(formData, "eventId");
  const result = await submitMemberEventLoopStepForSupabase("checkin", formData);

  redirect(buildRedirectHref(result.eventId || routeEventId, "points", formData, result.code));
}

export async function submitMemberEventLoopStepForSupabase(
  operation: "rsvp" | "cancel_rsvp" | "checkin",
  formData: FormData,
): Promise<MemberEventLoopWriteResult> {
  const routeEventId = getFormString(formData, "eventId");
  const config = getMemberEventLoopWriteConfig();

  if (!config.enabled) {
    return {
      success: false,
      code: "write_disabled",
      eventId: routeEventId,
      externalWritesEnabled: false,
      plainEnglishMessage: config.reason,
    };
  }

  const { client: sessionClient, config: authConfig } =
    await createLocalSupabaseServerClient();

  if (!sessionClient) {
    return {
      success: false,
      code: "missing_auth",
      eventId: routeEventId,
      externalWritesEnabled: false,
      plainEnglishMessage: authConfig.reason,
    };
  }

  const session = await getAuthSessionState(sessionClient, authConfig);

  if (session.status !== "signed_in" || !session.user?.email) {
    return {
      success: false,
      code: "missing_auth",
      eventId: routeEventId,
      externalWritesEnabled: false,
      plainEnglishMessage:
        "Sign in before recording RSVP, check-in, attendance, or points.",
    };
  }

  const serviceClient = createMemberEventLoopWriteClient();

  if (!serviceClient) {
    return {
      success: false,
      code: "write_disabled",
      eventId: routeEventId,
      externalWritesEnabled: false,
      plainEnglishMessage:
        "The server-only member event-loop write client is not configured.",
    };
  }

  return recordMemberEventLoopStep(serviceClient, {
    operation,
    routeEventId,
    actorUserId: session.user.id,
    actorEmail: session.user.email,
  });
}

function buildRedirectHref(
  eventId: string,
  step: EventDetailStep,
  formData: FormData,
  resultCode: string,
) {
  const url = new URL(`https://mymedlife.local/app/events/${eventId}`);
  const source = getFormString(formData, "source");
  const profileSource = getFormString(formData, "profileSource");
  const campaign = getFormString(formData, "campaign");
  const storyFilter = getFormString(formData, "storyFilter");
  const story = getFormString(formData, "story");

  if (source) url.searchParams.set("source", source);
  if (step) url.searchParams.set("step", step);
  if (source === "profile" && profileSource) {
    url.searchParams.set("profileSource", profileSource);
  }
  if (campaign) url.searchParams.set("campaign", campaign);
  if (source === "stories" && storyFilter) {
    url.searchParams.set("storyFilter", storyFilter);
  }
  if (source === "stories" && story) {
    url.searchParams.set("story", story);
  }
  url.searchParams.set(memberEventLoopWriteResultParam, resultCode);

  return `${url.pathname}${url.search}`;
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
