import type { LocalActorContext } from "@/services/local-actor-context";
import type { ChapterEventPlan } from "@/shared/types/campaigns";

export type RushMonthEventRsvpTone = "ready" | "mocked" | "disabled";

export type RushMonthEventRsvpPosture = {
  label: string;
  detail: string;
  tone: RushMonthEventRsvpTone;
};

export function getRushMonthEventRsvpPosture(
  actor: LocalActorContext,
  eventPlan: ChapterEventPlan,
): RushMonthEventRsvpPosture {
  if (actor.audience === "chapter_member") {
    if (eventPlan.lumaStatus === "mock_linked") {
      return {
        label: "Registered locally",
        detail:
          "Your RSVP is represented in local mock data only. No live Luma attendee record exists yet.",
        tone: "mocked",
      };
    }

    if (eventPlan.lumaStatus === "future_sync_disabled") {
      return {
        label: "RSVP not open",
        detail:
          "This event is planned, but the live RSVP flow is still intentionally disabled.",
        tone: "disabled",
      };
    }

    return {
      label: "Invite pending",
      detail: "No live RSVP link has been published yet for this event.",
      tone: "disabled",
    };
  }

  if (eventPlan.lumaStatus === "mock_linked") {
    return {
      label: "Mock RSVP link ready",
      detail:
        "A member-facing RSVP link is represented locally. No attendee import or reminder send is active.",
      tone: "mocked",
    };
  }

  if (eventPlan.lumaStatus === "future_sync_disabled") {
    return {
      label: "RSVP flow blocked",
      detail:
        "The future invite and RSVP flow is intentionally disabled until approval.",
      tone: "disabled",
    };
  }

  return {
    label: "No RSVP link yet",
    detail: "This event still needs a future RSVP path before launch.",
    tone: "disabled",
  };
}
