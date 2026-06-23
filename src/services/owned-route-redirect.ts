import type { LocalActorContext } from "@/services/local-actor-context";

export function getCampaignsRouteRedirectHref(
  actor: LocalActorContext,
  options: {
    campaignSlug?: string;
  } = {},
): string | null {
  const campaignQuery = options.campaignSlug
    ? `&campaign=${options.campaignSlug}`
    : "";

  switch (actor.primaryCanonicalRole) {
    case "coach":
    case "sales_coach":
      return `/coach?view=campaigns${campaignQuery}`;
    case "department_staff":
    case "sales_admin":
    case "super_admin":
      return `/staff?view=campaigns${campaignQuery}`;
    case "ds_admin":
      return "/admin";
    case "student_member":
    case "traveler":
    case "committee_member":
    case "committee_chair":
    case "eboard_officer":
    case "vice_president":
    case "president":
      return null;
  }
}

export function getProofLibraryRouteRedirectHref(
  actor: LocalActorContext,
): string | null {
  switch (actor.primaryCanonicalRole) {
    case "coach":
    case "sales_coach":
      return "/coach?view=support_notes#support-notes";
    case "department_staff":
    case "sales_admin":
    case "super_admin":
      return "/staff?view=proof_ugc";
    case "ds_admin":
      return "/admin";
    case "student_member":
    case "traveler":
    case "committee_member":
    case "committee_chair":
    case "eboard_officer":
    case "vice_president":
    case "president":
      return null;
  }
}

export function getRushMonthEventsRouteRedirectHref(
  actor: LocalActorContext,
  options: {
    eventId?: string;
    source?: string;
  } = {},
): string | null {
  const eventQuery = options.eventId ? `&event=${options.eventId}` : "";

  switch (actor.primaryCanonicalRole) {
    case "coach":
    case "sales_coach":
      return `/coach?view=campaigns&campaign=rush-month${eventQuery}`;
    case "department_staff":
    case "sales_admin":
    case "super_admin":
      return `/staff?view=campaigns&campaign=rush-month${eventQuery}`;
    case "ds_admin":
      return "/admin";
    case "traveler":
      return "/slt-prep";
    case "student_member":
    case "committee_member":
    case "committee_chair":
      return null;
    case "eboard_officer":
    case "vice_president":
    case "president":
      if (
        options.source === "chapter_create_event" ||
        options.source === "chapter_event_review"
      ) {
        return null;
      }

      return eventQuery ? `/chapter?view=events${eventQuery}` : "/chapter?view=events";
  }
}

export function getRushMonthActionDetailRouteRedirectHref(
  actor: LocalActorContext,
): string | null {
  switch (actor.primaryCanonicalRole) {
    case "student_member":
    case "committee_member":
      return null;
    case "traveler":
      return "/slt-prep";
    case "committee_chair":
    case "eboard_officer":
    case "vice_president":
    case "president":
    case "coach":
    case "sales_coach":
    case "department_staff":
    case "sales_admin":
    case "super_admin":
    case "ds_admin":
      return "/rush-month/actions";
  }
}
