import { getTestProductionSeedEnvironment } from "@/services/test-production-seed-environment";
import {
  getDefaultWorkspace,
  getWorkspaceHref,
  type WorkspaceAccessUser,
} from "@/services/workspace-access";
import type { DatabaseRoleKey } from "@/shared/types/persistence";

const localSandboxSupportedRoles = new Set<DatabaseRoleKey>([
  "general_member",
  "action_committee_chair",
  "president_vp",
  "coach",
  "admin",
  "ds_admin",
  "super_admin",
]);

export function getLocalSandboxAuthLandingRoute(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const login = getTestProductionSeedEnvironment().logins.find(
    (candidate) => candidate.email.toLowerCase() === normalizedEmail,
  );

  if (!login || !localSandboxSupportedRoles.has(login.role as DatabaseRoleKey)) {
    return null;
  }

  return getWorkspaceHref(
    getDefaultWorkspace({
      databaseRoleKeys: [login.role as DatabaseRoleKey],
    } satisfies WorkspaceAccessUser),
  );
}

