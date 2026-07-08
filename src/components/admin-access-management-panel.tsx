import {
  buildPreviewWorkspaceAccessAudit,
  buildUnauthorizedAdminAttemptAudit,
  getManagedUserAccess,
} from "@/services/admin-management";
import {
  managedChapterFixtures,
  managedUserFixtures,
} from "@/services/admin-management-fixtures";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getWorkspaceLabel } from "@/services/workspace-access";

type AdminAccessManagementPanelProps = {
  actor: LocalActorContext;
};

export function AdminAccessManagementPanel({ actor }: AdminAccessManagementPanelProps) {
  const unauthorizedAudit = buildUnauthorizedAdminAttemptAudit({
    actor,
    attemptedPath: "/admin/users",
    environment: "staging",
  });
  const previewAudit = buildPreviewWorkspaceAccessAudit({
    actor,
    workspace: "student_app",
    environment: "staging",
  });

  return (
    <main className="min-h-screen bg-[#0d1117] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">
              DS / Super Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Access Matrix
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              This page shows user roles, chapter membership, allowed
              workspaces, default routing, module access, preview permissions,
              and the audit events expected for denied access or sensitive
              preview access.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100">
              <PreviewBadge />
              Mock users and chapters stay visibly labeled in this review surface.
            </div>
          </div>
          <a
            href="/admin"
            className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            Back to Admin
          </a>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Managed users" value={String(managedUserFixtures.length)} />
          <SummaryCard label="Managed chapters" value={String(managedChapterFixtures.length)} />
          <SummaryCard
            label="Preview users"
            value={String(
              managedUserFixtures.filter(
                (user) => getManagedUserAccess(user).previewWorkspaces.length > 0,
              ).length,
            )}
          />
          <SummaryCard label="Audit event types" value="2" />
        </section>

        <section className="overflow-hidden rounded-lg border border-white/10 bg-[#161b22]">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
              Managed Directory Access
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role and scope</th>
                  <th className="px-5 py-3">Default workspace</th>
                  <th className="px-5 py-3">Allowed workspaces</th>
                  <th className="px-5 py-3">Preview permissions</th>
                  <th className="px-5 py-3">Module access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {managedUserFixtures.map((user) => {
                  const access = getManagedUserAccess(user);
                  const roles = [
                    ...user.chapterMemberships.map((item) => item.roleKey),
                    ...user.staffRoles,
                  ];
                  return (
                    <tr key={user.id}>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-white">{user.name}</div>
                          <PreviewBadge />
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{user.email}</div>
                      </td>
                      <td className="px-5 py-4 text-xs leading-5 text-slate-400">
                        {roles.join(", ") || "No active role"}
                      </td>
                      <td className="px-5 py-4 font-semibold text-sky-300">
                        {getWorkspaceLabel(access.defaultWorkspace)}
                      </td>
                      <td className="px-5 py-4 text-xs leading-5 text-slate-400">
                        {access.allowedWorkspaces.map(getWorkspaceLabel).join(", ")}
                      </td>
                      <td className="px-5 py-4 text-xs leading-5 text-slate-400">
                        {access.previewWorkspaces.map(getWorkspaceLabel).join(", ") ||
                          "None"}
                      </td>
                      <td className="px-5 py-4 text-xs leading-5 text-slate-400">
                        Events, RSVP, attendance, points, and leaderboard modules
                        are visible according to role and chapter scope.
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-white/10 bg-[#161b22]">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
              Managed Chapter Scope
            </h2>
          </div>
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {managedChapterFixtures.map((chapter) => (
              <article
                key={chapter.id}
                className="rounded-lg border border-white/10 bg-[#0d1117] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{chapter.name}</h3>
                  <PreviewBadge />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {chapter.school} / {chapter.region}
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Active modules: {chapter.activeModules.join(", ")}. Members:{" "}
                  {chapter.activeMemberCount}. Events: {chapter.activeEventCount}.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <AuditCard title="Failed unauthorized admin attempt" audit={unauthorizedAudit} />
          <AuditCard title="Sensitive preview access" audit={previewAudit} />
        </section>
      </div>
    </main>
  );
}

function AuditCard({
  audit,
  title,
}: {
  audit: ReturnType<typeof buildUnauthorizedAdminAttemptAudit>;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#161b22] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
        {title}
      </h2>
      <dl className="mt-4 grid gap-2 text-sm">
        <DetailRow label="actor" value={audit.actor} />
        <DetailRow label="action" value={audit.action} />
        <DetailRow label="target" value={`${audit.targetType}: ${audit.targetLabel}`} />
        <DetailRow label="old value" value={audit.oldValue} />
        <DetailRow label="new value" value={audit.newValue} />
        <DetailRow label="reason" value={audit.reason} />
        <DetailRow label="environment" value={audit.environment} />
      </dl>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#161b22] p-4">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-[#0d1117] p-3">
      <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-slate-200">{value}</dd>
    </div>
  );
}

function PreviewBadge() {
  return (
    <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-amber-100">
      TEST
    </span>
  );
}
