import {
  getCanonicalRoleAssignments,
} from "@/services/canonical-role-scope";
import {
  localActorOptions,
  type LocalActorContext,
  type LocalActorOption,
} from "@/services/local-actor-context";
import {
  getDefaultWorkspace,
  getWorkspaceHref,
  type WorkspaceAccessUser,
  type WorkspaceKey,
} from "@/services/workspace-access";

export type LandingRouteSource =
  | "member_home"
  | "chapter_command_center"
  | "coach_command_center"
  | "staff_command_center"
  | "admin_backend";

export function getLandingRouteForActor(
  actor: Pick<
    LocalActorContext,
    | "canonicalRoleAssignments"
    | "canonicalRoles"
    | "chapterRoles"
    | "defaultLandingSurface"
    | "primaryCanonicalRole"
    | "source"
    | "staffRoles"
  >,
  source?: LandingRouteSource,
): string {
  if (actor.source.status === "auth_profile_missing") {
    return appendLandingRouteSource("/onboarding", source);
  }

  return appendLandingRouteSource(
    getWorkspaceRoute(getDefaultWorkspace(actor)),
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
    getWorkspaceRoute(
      getDefaultWorkspace({
        canonicalRoleAssignments: assignments,
        chapterRoles: option.chapterRoles,
        staffRoles: option.staffRoles,
        includeTravelerRole: option.includeTravelerRole,
      } satisfies WorkspaceAccessUser),
    ),
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

function getWorkspaceRoute(workspace: WorkspaceKey): string {
  return getWorkspaceHref(workspace);
}
