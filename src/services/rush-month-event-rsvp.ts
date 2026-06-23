import type { LocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";
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
  if (getActorSurfaceFamily(actor) === "member") {
    if (eventPlan.lumaStatus === "mock_linked") {
      return {
        label: "You're on the list",
        detail:
          "Your RSVP is already marked here, so focus on showing up ready and capturing one useful follow-up moment after the event.",
        tone: "mocked",
      };
    }

    if (eventPlan.lumaStatus === "future_sync_disabled") {
      return {
        label: "RSVP ready",
        detail:
          "Your chapter can share the RSVP details from this page. Use the event plan to know what to show up for and what proof to capture after.",
        tone: "mocked",
      };
    }

    return {
      label: "RSVP details coming",
      detail:
        "Your chapter will share RSVP details here. For now, use the event plan to know the moment you are helping create and the follow-up proof that matters.",
      tone: "mocked",
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
