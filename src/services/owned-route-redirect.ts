import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getLaunchLaneMemberCoreHref,
  getLaunchLaneMemberPointsHref,
  getLaunchLaneCampaignsRedirectHref,
  getLaunchLaneFocusHref,
  getLaunchLaneLeaderEventsHref,
  getLaunchLaneLegacyCoachRedirectHref,
  getLaunchLaneProofRedirectHref,
  getLaunchLaneStaffEventsHref,
} from "@/services/events-points-launch-lane";
import { getLeaderLaunchLaneCanonicalHref } from "@/services/leader-launch-lane";
import { buildMemberLaunchLaneEventDetailHref } from "@/services/member-launch-lane-events";
import { getActorSurfaceFamily } from "@/services/role-visibility";

type ChapterRouteSearchParams = Record<string, string | undefined>;
type LaunchLaneRouteFamily = "app" | "legacy";

export function getCampaignsRouteRedirectHref(
  actor: LocalActorContext,
  options: {
    campaignSlug?: string;
  } = {},
): string | null {
  return getLaunchLaneCampaignsRedirectHref(actor, {
    campaignSlug: options.campaignSlug,
  });
}

export function getProofLibraryRouteRedirectHref(
  actor: LocalActorContext,
): string | null {
  return getLaunchLaneProofRedirectHref(actor);
}

export function getRushMonthActionsRouteRedirectHref(
  actor: LocalActorContext,
  options: {
    source?: string;
  } = {},
): string | null {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return getLaunchLaneMemberCoreHref(parseMemberActionSource(options.source));
    case "leader":
      return getLaunchLaneLeaderEventsHref();
    case "coach":
    case "staff":
      return getLaunchLaneStaffEventsHref({ campaignSlug: "rush-month" });
    case "ds_admin":
    case "super_admin":
      return "/admin";
  }
}

export function getRushMonthHomeRouteRedirectHref(
  actor: LocalActorContext,
): string {
  return getLaunchLaneFocusHref(getActorSurfaceFamily(actor), "home");
}

export function getRushMonthNonCoreRouteRedirectHref(
  actor: LocalActorContext,
): string {
  return getLaunchLaneFocusHref(getActorSurfaceFamily(actor), "events");
}

export function getRushMonthEventsRouteRedirectHref(
  actor: LocalActorContext,
  options: {
    eventId?: string;
    source?: string;
    routeFamily?: LaunchLaneRouteFamily;
  } = {},
): string | null {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return options.routeFamily === "app"
        ? null
        : getMemberEventRedirectHref(options);
    case "leader":
      return getLaunchLaneLeaderEventsHref(options.eventId);
    case "coach":
    case "staff":
      return getLaunchLaneStaffEventsHref({
        campaignSlug: "rush-month",
        eventId: options.eventId,
      });
    case "ds_admin":
    case "super_admin":
      return "/admin";
  }
}

export function getRushMonthLeaderboardRouteRedirectHref(
  actor: LocalActorContext,
  options: {
    source?: string;
    routeFamily?: LaunchLaneRouteFamily;
  } = {},
): string | null {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return options.routeFamily === "app"
        ? null
        : getMemberLeaderboardRedirectHref(options.source);
    case "leader":
      return getLaunchLaneFocusHref("leader", "points");
    case "coach":
    case "staff":
      return getLaunchLaneFocusHref("staff", "points");
    case "ds_admin":
    case "super_admin":
      return "/admin";
  }
}

export function getRushMonthActionDetailRouteRedirectHref(
  actor: LocalActorContext,
  options: {
    eventId?: string;
    source?: string;
  } = {},
): string | null {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return getMemberActionDetailRedirectHref(options);
    case "leader":
      return getLaunchLaneLeaderEventsHref();
    case "coach":
    case "staff":
      return getLaunchLaneStaffEventsHref({ campaignSlug: "rush-month" });
    case "ds_admin":
    case "super_admin":
      return "/admin";
  }
}

export function getCoachRouteRedirectHref(
  actor: LocalActorContext,
  searchParams: Record<string, string | undefined> = {},
) {
  return getLaunchLaneLegacyCoachRedirectHref(actor, searchParams);
}

export function getActionCommitteesRouteRedirectHref(
  actor: LocalActorContext,
): string {
  return getLaunchLaneFocusHref(getActorSurfaceFamily(actor), "events");
}

export function getChapterRouteRedirectHref(
  actor: LocalActorContext,
  searchParams: ChapterRouteSearchParams = {},
): string {
  if (getActorSurfaceFamily(actor) !== "leader") {
    return getLaunchLaneFocusHref(getActorSurfaceFamily(actor), "home");
  }

  const leaderSearchParams = {
    ...searchParams,
    view: searchParams.view ?? "overview",
  };

  return (
    getLeaderLaunchLaneCanonicalHref(leaderSearchParams) ??
    withQuery("/leader", leaderSearchParams)
  );
}

export function getChapterMembersRouteRedirectHref(
  actor: LocalActorContext,
): string {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return "/app";
    case "leader":
      return "/leader?view=events";
    case "coach":
    case "staff":
      return "/staff?view=chapters";
    case "ds_admin":
    case "super_admin":
      return "/admin";
  }
}

export function getSltPrepRouteRedirectHref(actor: LocalActorContext): string {
  return getLaunchLaneFocusHref(getActorSurfaceFamily(actor), "events");
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

function parseMemberActionSource(source: string | undefined) {
  switch (source) {
    case "home":
    case "campaigns":
    case "evidence":
    case "events":
    case "points":
    case "profile":
      return source;
    default:
      return null;
  }
}

function getMemberActionDetailRedirectHref(options: {
  eventId?: string;
  source?: string;
}) {
  const source = parseMemberActionSource(options.source);

  if (source === "profile") {
    return "/profile";
  }

  if (source === "points" || source === "evidence") {
    return getLaunchLaneMemberPointsHref("points");
  }

  if (options.eventId) {
    return buildMemberLaunchLaneEventDetailHref(options.eventId, source ?? "events");
  }

  return getLaunchLaneMemberCoreHref(source);
}

function getMemberEventRedirectHref(options: {
  eventId?: string;
  source?: string;
}) {
  const source = parseMemberActionSource(options.source);

  if (options.eventId) {
    return buildMemberLaunchLaneEventDetailHref(options.eventId, source ?? "events");
  }

  return getLaunchLaneFocusHref("member", "events");
}

function getMemberLeaderboardRedirectHref(source: string | undefined) {
  const parsedSource = parseMemberActionSource(source);

  if (
    parsedSource === "home" ||
    parsedSource === "events" ||
    parsedSource === "points" ||
    parsedSource === "profile"
  ) {
    return getLaunchLaneMemberPointsHref(parsedSource);
  }

  return getLaunchLaneFocusHref("member", "points");
}
