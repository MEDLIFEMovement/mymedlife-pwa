import { getLandingRouteForActor } from "@/services/landing-route";
import {
  isEventsPointsLaunchLaneEnabled,
  shouldShowTravelerPrepEntry,
} from "@/services/launch-lane-product-focus";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { MemberActionRouteSource } from "@/services/member-action-route-href";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

export type LaunchLaneNextStep = {
  label: string;
  href: string;
  ctaLabel: string;
  detail: string;
};

export type LaunchLaneFocusTarget = "home" | "events" | "points";

export { isEventsPointsLaunchLaneEnabled, shouldShowTravelerPrepEntry };

export function getLaunchLaneMemberEventsHref(
  source?: MemberActionRouteSource | null,
) {
  return withOptionalSource("/app/events", source);
}

export function getLaunchLaneMemberPointsHref(
  source?: MemberActionRouteSource | null,
) {
  return withOptionalSource("/app/points", source);
}

export function getLaunchLaneMemberCoreHref(
  source?: MemberActionRouteSource | null,
) {
  switch (source) {
    case "points":
    case "evidence":
      return getLaunchLaneMemberPointsHref("points");
    case "profile":
      return "/profile";
    case "home":
    case "campaigns":
    case "events":
      return getLaunchLaneMemberEventsHref(source);
    default:
      return getLaunchLaneMemberEventsHref();
  }
}

export function getLaunchLaneHomeHref(
  surfaceFamily: ActorSurfaceFamily,
): string {
  switch (surfaceFamily) {
    case "member":
      return "/app";
    case "leader":
      return "/leader?view=overview";
    case "coach":
    case "staff":
      return "/staff?view=chapters";
    case "ds_admin":
    case "super_admin":
      return "/admin";
  }
}

export function getLaunchLaneLeaderEventsHref(eventId?: string | null) {
  return withQuery("/leader", {
    view: "events",
    event: eventId ?? undefined,
  });
}

export function getLaunchLaneLeaderAttendanceHref() {
  return "/leader?view=attendance";
}

export function getLaunchLaneLeaderPointsHref() {
  return "/leader?view=leaderboard";
}

export function getLaunchLaneStaffEventsHref(
  options: {
    campaignSlug?: string | null;
    eventId?: string | null;
  } = {},
) {
  return withQuery("/staff", {
    view: "events",
    campaign: options.campaignSlug ?? undefined,
    event: options.eventId ?? undefined,
  });
}

export function getLaunchLaneStaffPointsHref() {
  return "/staff?view=leaderboard";
}

export function getLaunchLaneFocusHref(
  surfaceFamily: ActorSurfaceFamily,
  target: LaunchLaneFocusTarget,
): string {
  switch (target) {
    case "home":
      return getLaunchLaneHomeHref(surfaceFamily);
    case "events":
      switch (surfaceFamily) {
        case "member":
          return getLaunchLaneMemberEventsHref();
        case "leader":
          return getLaunchLaneLeaderEventsHref();
        case "coach":
        case "staff":
          return getLaunchLaneStaffEventsHref({ campaignSlug: "rush-month" });
        case "ds_admin":
        case "super_admin":
          return "/admin";
      }
    case "points":
      switch (surfaceFamily) {
        case "member":
          return getLaunchLaneMemberPointsHref();
        case "leader":
          return getLaunchLaneLeaderPointsHref();
        case "coach":
        case "staff":
          return getLaunchLaneStaffPointsHref();
        case "ds_admin":
        case "super_admin":
          return "/admin";
      }
  }
}

export function getLaunchLaneCampaignsRedirectHref(
  actor: LocalActorContext,
  options: {
    campaignSlug?: string | null;
  } = {},
) {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return getLaunchLaneMemberEventsHref("campaigns");
    case "leader":
      return getLaunchLaneLeaderEventsHref();
    case "coach":
    case "staff":
      return getLaunchLaneStaffEventsHref({
        campaignSlug: options.campaignSlug,
      });
    case "ds_admin":
    case "super_admin":
      return getLandingRouteForActor(actor);
  }
}

export function getLaunchLaneProofRedirectHref(actor: LocalActorContext) {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return getLaunchLaneMemberPointsHref("points");
    case "leader":
      return getLaunchLaneLeaderPointsHref();
    case "coach":
    case "staff":
      return getLaunchLaneStaffPointsHref();
    case "ds_admin":
    case "super_admin":
      return getLandingRouteForActor(actor);
  }
}

export function getLaunchLaneLegacyCoachRedirectHref(
  actor: LocalActorContext,
  searchParams: Record<string, string | undefined> = {},
) {
  switch (getActorSurfaceFamily(actor)) {
    case "coach":
    case "staff": {
      const restSearchParams = { ...searchParams };

      delete restSearchParams.view;

      return withQuery("/staff", {
        view: mapLegacyCoachViewToStaffView(searchParams.view),
        ...restSearchParams,
      });
    }
    case "member":
    case "leader":
    case "ds_admin":
    case "super_admin":
      return getLandingRouteForActor(actor);
  }
}

export function getLaunchLaneWorkspaceNextStep(
  surfaceFamily: ActorSurfaceFamily,
): LaunchLaneNextStep {
  switch (surfaceFamily) {
    case "member":
      return {
        label: "Open the next event",
        href: getLaunchLaneMemberEventsHref("points"),
        ctaLabel: "Open events",
        detail:
          "Use the next chapter event as the front door. RSVP, show up, and let attendance drive points.",
      };
    case "leader":
      return {
        label: "Open leader events",
        href: getLaunchLaneLeaderEventsHref(),
        ctaLabel: "Open leader events",
        detail:
          "Create events, watch RSVPs, confirm attendance, and keep chapter points moving from one leader surface.",
      };
    case "coach":
      return {
        label: "Open portfolio chapters",
        href: "/staff?view=chapters",
        ctaLabel: "Open chapters",
        detail:
          "Use the chapter list to spot attendance gaps, low RSVP posture, and point movement across the pilot.",
      };
    case "staff":
      return {
        label: "Open staff chapters",
        href: "/staff?view=chapters",
        ctaLabel: "Open chapters",
        detail:
          "Keep the staff view grounded in chapter events, attendance counts, point totals, and visible chapter movement.",
      };
    case "ds_admin":
    case "super_admin":
      return {
        label: "Open admin backend",
        href: "/admin",
        ctaLabel: "Open admin",
        detail:
          "Use the backend for rollout controls, audit posture, and integration safety while the live loop stays chapter-facing.",
      };
  }
}

function withOptionalSource(baseHref: string, source?: string | null) {
  if (!source) {
    return baseHref;
  }

  return withQuery(baseHref, { source });
}

function withQuery(baseHref: string, query: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();

  if (!queryString) {
    return baseHref;
  }

  return `${baseHref}?${queryString}`;
}

function mapLegacyCoachViewToStaffView(view: string | undefined) {
  switch (view) {
    case "events":
    case "campaigns":
      return "events";
    case "leaderboard":
      return "leaderboard";
    case "risks":
    case "support_notes":
      return "chapters";
    case "overview":
    case "chapter_detail":
    case "staff_fallback":
    default:
      return "chapters";
  }
}
