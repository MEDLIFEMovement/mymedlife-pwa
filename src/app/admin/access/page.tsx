import { redirect } from "next/navigation";

import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import {
  getLocalActorContext,
  getMockLocalActorContext,
  localActorOptions,
} from "@/services/local-actor-context";
import { canAccessAdminWorkspace } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import {
  canAccessWorkspace,
  getAllowedWorkspaces,
  getDefaultWorkspace,
  getWorkspaceHref,
  getWorkspaceLabel,
  isPreviewWorkspaceAccess,
  type WorkspaceKey,
} from "@/services/workspace-access";

export const metadata = getStaticRouteMetadata("admin");
export const dynamic = "force-dynamic";

const previewWorkspaces: WorkspaceKey[] = [
  "student_app",
  "leader_command_center",
  "staff_command_center",
  "admin_backend",
  "slt_prep",
];

export default async function AdminAccessPage() {
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/admin/access"));
  }

  if (!canAccessAdminWorkspace(actor)) {
    redirect(getLandingRouteForActor(actor));
  }

  const rows = localActorOptions.map((option) => {
    const persona = getMockLocalActorContext(option.email);
    const defaultWorkspace = getDefaultWorkspace(persona);
    const allowedWorkspaces = getAllowedWorkspaces(persona);

    return {
      email: option.email,
      name: option.displayName,
      role: persona.audienceLabel,
      defaultWorkspace,
      allowedWorkspaces,
      readOnlyWorkspaces: previewWorkspaces.filter((workspace) =>
        isPreviewWorkspaceAccess(persona, workspace),
      ),
      canSubmitInStudentApp: canAccessWorkspace(persona, "student_app", {
        intent: "submit",
      }),
      canApproveInLeaderApp: canAccessWorkspace(
        persona,
        "leader_command_center",
        { intent: "approve" },
      ),
    };
  });

  return (
    <>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="admin_backend" />
      <main className="min-h-screen bg-[#0d1117] px-6 py-8 text-slate-100">
        <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">
              DS / Super Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Access Matrix
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              This read-only page shows how each role resolves into a default
              workspace, which workspaces are available, and where preview mode
              blocks writes. Role, membership, chapter, and preview changes
              should be audited before production rollout.
            </p>
          </div>
          <a
            href="/admin"
            className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            Back to Admin
          </a>
        </header>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#161b22]">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
              Workspace Access
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Default</th>
                  <th className="px-5 py-3">Allowed views</th>
                  <th className="px-5 py-3">Write posture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rows.map((row) => (
                  <tr key={row.email}>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{row.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{row.email}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{row.role}</td>
                    <td className="px-5 py-4">
                      <a
                        href={getWorkspaceHref(row.defaultWorkspace)}
                        className="font-semibold text-sky-300 hover:text-sky-200"
                      >
                        {getWorkspaceLabel(row.defaultWorkspace)}
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex max-w-xl flex-wrap gap-2">
                        {row.allowedWorkspaces.map((workspace) => (
                          <span
                            key={workspace.key}
                            className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-300"
                          >
                            {workspace.label}
                            {workspace.readOnly ? " (preview)" : ""}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs leading-5 text-slate-400">
                      <div>
                        Student submit:{" "}
                        <strong className={row.canSubmitInStudentApp ? "text-emerald-300" : "text-amber-300"}>
                          {row.canSubmitInStudentApp ? "allowed" : "blocked"}
                        </strong>
                      </div>
                      <div>
                        Leader approval:{" "}
                        <strong className={row.canApproveInLeaderApp ? "text-emerald-300" : "text-amber-300"}>
                          {row.canApproveInLeaderApp ? "allowed" : "blocked"}
                        </strong>
                      </div>
                      {row.readOnlyWorkspaces.length > 0 ? (
                        <div className="mt-1 text-sky-300">
                          Preview audit required:{" "}
                          {row.readOnlyWorkspaces
                            .map((workspace) => getWorkspaceLabel(workspace))
                            .join(", ")}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            "Failed unauthorized admin attempts",
            "Role and membership changes",
            "Sensitive preview access",
          ].map((title) => (
            <div
              key={title}
              className="rounded-lg border border-white/10 bg-[#161b22] p-4"
            >
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Record actor, target, old value, new value, reason, timestamp,
                and result before this moves from local/staging review to live
                production operations.
              </p>
            </div>
          ))}
        </section>
        </div>
      </main>
    </>
  );
}
