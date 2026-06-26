import {
  getCanonicalRoleAssignments,
  getHighestOperationalCanonicalRole,
  type CanonicalRole,
} from "@/services/canonical-role-scope";
import {
  localActorOptions,
  type LocalActorContext,
  type LocalActorOption,
} from "@/services/local-actor-context";

export type LandingRouteSource =
  | "member_home"
  | "chapter_command_center"
  | "coach_command_center"
  | "staff_command_center"
  | "admin_backend";

export function getLandingRouteForActor(
  actor: Pick<
    LocalActorContext,
    "defaultLandingSurface" | "primaryCanonicalRole"
  >,
  source?: LandingRouteSource,
): string {
  return appendLandingRouteSource(
    getDefaultLandingRouteForRole(
      actor.primaryCanonicalRole,
      actor.defaultLandingSurface,
    ),
    source,
  );
}

export function getLandingRouteForLocalActorOption(
  option: Pick<
    LocalActorOption,
    "audience" | "chapterRoles" | "staffRoles" | "includeTravelerRole"
  >,
  source?: LandingRouteSource,
): string {
  const assignments = getCanonicalRoleAssignments({
    audience: option.audience,
    chapterRoles: option.chapterRoles,
    staffRoles: option.staffRoles,
    includeTravelerRole: option.includeTravelerRole,
  });

  return appendLandingRouteSource(
    getDefaultLandingRouteForRole(getHighestOperationalCanonicalRole(assignments)),
    source,
  );
}

export function getLandingRouteForLocalActorEmail(
  selectedEmail: string,
  source?: LandingRouteSource,
): string {
  const option = localActorOptions.find(
    (candidate) => candidate.email.toLowerCase() === selectedEmail.toLowerCase(),
  );

  if (!option) {
    return appendLandingRouteSource("/", source);
  }

  return getLandingRouteForLocalActorOption(option, source);
}

export function appendLandingRouteSource(
  href: string,
  source?: LandingRouteSource,
): string {
  if (!source) {
    return href;
  }

  const [path, hash = ""] = href.split("#");
  const [pathname, query = ""] = path.split("?");
  const searchParams = new URLSearchParams(query);
  searchParams.set("source", source);

  const resolvedQuery = searchParams.toString();

  return `${pathname}${resolvedQuery ? `?${resolvedQuery}` : ""}${hash ? `#${hash}` : ""}`;
}

function getDefaultLandingRouteForRole(
  role: CanonicalRole,
  fallbackSurface?: LocalActorContext["defaultLandingSurface"],
): string {
  switch (role) {
    case "student_member":
    case "committee_member":
      return "/app";
    case "traveler":
      return "/app/slt-prep";
    case "committee_chair":
    case "eboard_officer":
    case "vice_president":
    case "president":
      return "/leader?view=overview";
    case "coach":
    case "sales_coach":
      return "/staff?view=chapters";
    case "department_staff":
      return "/staff?view=chapters";
    case "sales_admin":
      return "/staff?view=chapters";
    case "ds_admin":
    case "super_admin":
      return "/admin";
  }

  switch (fallbackSurface) {
    case "student_home_mobile":
      return "/app";
    case "student_leadership_command_center":
      return "/leader?view=overview";
    case "coach_command_center":
      return "/staff?view=chapters";
    case "staff_hq_command_center":
      return "/staff?view=chapters";
    case "admin_backend":
      return "/admin";
    case "slt_prep":
      return "/app/slt-prep";
    default:
      return "/app";
  }
}
