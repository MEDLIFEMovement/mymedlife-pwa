import {
  changeManagedUserAccess,
  deleteManagedUser,
  getManagedUserAccess,
  searchManagedUsers,
  setManagedUserStatus,
  type AdminAuditRecord,
  type AdminMutationFailure,
  type ManagedUser,
  type ManagedUserStatus,
} from "@/services/admin-management";
import {
  getManagedChapterName,
  managedChapterFixtures,
  managedUserFixtures,
} from "@/services/admin-management-fixtures";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getWorkspaceLabel } from "@/services/workspace-access";

export type AdminUsersSearchParams = {
  q?: string | string[];
  role?: string | string[];
  chapterId?: string | string[];
  status?: string | string[];
  userId?: string | string[];
};

type AdminUsersManagementPanelProps = {
  actor: LocalActorContext;
  searchParams?: AdminUsersSearchParams;
};

type UserActionPreview = {
  label: string;
  description: string;
  result:
    | {
        ok: true;
        audit: AdminAuditRecord;
        warnings: string[];
        nextUser: ManagedUser;
      }
    | AdminMutationFailure;
};

const roleOptions = [
  "all",
  "general member",
  "action committee member",
  "action committee chair",
  "president",
  "coach",
  "sales coach",
  "general staff",
  "ds admin",
  "super admin",
];

const statusOptions: Array<ManagedUserStatus | "all"> = [
  "all",
  "active",
  "pending",
  "disabled",
  "deactivated",
  "deleted",
];

export function AdminUsersManagementPanel({
  actor,
  searchParams = {},
}: AdminUsersManagementPanelProps) {
  const query = getSingleParam(searchParams.q);
  const role = getSingleParam(searchParams.role) || "all";
  const chapterId = getSingleParam(searchParams.chapterId);
  const rawStatus = getSingleParam(searchParams.status) || "all";
  const status = statusOptions.includes(rawStatus as ManagedUserStatus | "all")
    ? (rawStatus as ManagedUserStatus | "all")
    : "all";
  const filteredUsers = searchManagedUsers(managedUserFixtures, {
    query,
    role,
    chapterId,
    status,
  });
  const selectedUser =
    managedUserFixtures.find(
      (user) => user.id === getSingleParam(searchParams.userId),
    ) ??
    filteredUsers[0] ??
    managedUserFixtures[0];
  const previews = buildUserActionPreviews(actor, selectedUser);

  return (
    <main className="min-h-screen bg-[#0d1117] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">
              DS / Super Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              User Access Management
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Search users, inspect their workspace access, and review the exact
              audited action packets for role, chapter, invite, status, and
              destructive access changes. These operations use the same service
              guards as the tests.
            </p>
          </div>
          <a
            href="/admin"
            className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            Back to Admin
          </a>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Directory users" value={String(managedUserFixtures.length)} />
          <SummaryCard label="Filtered users" value={String(filteredUsers.length)} />
          <SummaryCard
            label="Pending invites"
            value={String(
              managedUserFixtures.filter((user) => user.inviteStatus === "sent").length,
            )}
          />
          <SummaryCard
            label="Protected admins"
            value={String(
              managedUserFixtures.filter((user) =>
                user.staffRoles.some((role) =>
                  ["DS Admin", "Super Admin", "ds_admin", "super_admin"].includes(role),
                ),
              ).length,
            )}
          />
        </section>

        <form className="rounded-lg border border-white/10 bg-[#161b22] p-4">
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
            <label className="space-y-1 text-xs text-slate-400">
              Search name or email
              <input
                className="w-full rounded border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-slate-100"
                name="q"
                placeholder="sofia, coach, medlife.test"
                type="search"
                defaultValue={query}
              />
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              Role
              <select
                className="w-full rounded border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-slate-100"
                name="role"
                defaultValue={role}
              >
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              Chapter
              <select
                className="w-full rounded border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-slate-100"
                name="chapterId"
                defaultValue={chapterId}
              >
                <option value="">all</option>
                {managedChapterFixtures.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              Status
              <select
                className="w-full rounded border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-slate-100"
                name="status"
                defaultValue={status}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <button className="self-end rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400">
              Apply filters
            </button>
          </div>
        </form>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#161b22]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
                Users
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Roles</th>
                    <th className="px-5 py-3">Chapters / portfolio</th>
                    <th className="px-5 py-3">Workspace access</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => {
                    const access = getManagedUserAccess(user);
                    return (
                      <tr key={user.id}>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">{user.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-5 py-4">
                          <ChipList
                            values={[
                              ...user.chapterMemberships.map((item) => item.roleKey),
                              ...user.staffRoles,
                            ]}
                            empty="No role"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <ChipList
                            values={[
                              ...user.chapterMemberships.map((item) =>
                                getManagedChapterName(item.chapterId),
                              ),
                              ...user.portfolioChapterIds.map((id) =>
                                `Portfolio: ${getManagedChapterName(id)}`,
                              ),
                            ]}
                            empty="No chapter scope"
                          />
                        </td>
                        <td className="px-5 py-4 text-xs leading-5 text-slate-400">
                          <div>
                            Default:{" "}
                            <strong className="text-sky-300">
                              {getWorkspaceLabel(access.defaultWorkspace)}
                            </strong>
                          </div>
                          <div>{access.allowedWorkspaces.map(getWorkspaceLabel).join(", ")}</div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusPill value={user.status} />
                        </td>
                        <td className="px-5 py-4">
                          <a
                            className="font-semibold text-sky-300 hover:text-sky-200"
                            href={`/admin/users?userId=${user.id}`}
                          >
                            View detail
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-[#161b22] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
              User Detail
            </h2>
            <div className="mt-4">
              <h3 className="text-xl font-bold text-white">{selectedUser.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{selectedUser.email}</p>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <DetailRow label="Invite status" value={selectedUser.inviteStatus ?? "not_sent"} />
              <DetailRow label="Current status" value={selectedUser.status} />
              <DetailRow
                label="Default workspace"
                value={getWorkspaceLabel(getManagedUserAccess(selectedUser).defaultWorkspace)}
              />
              <DetailRow
                label="Preview permissions"
                value={
                  getManagedUserAccess(selectedUser).previewWorkspaces.map(getWorkspaceLabel).join(", ") ||
                  "None"
                }
              />
            </dl>

            <div className="mt-5 rounded border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
              Sensitive actions require a reason, confirmation text, and an audit
              record. Self-delete is blocked. DS Admin cannot disable, delete, or
              demote Super Admin users.
            </div>

            <div className="mt-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Action packet previews
              </h3>
              {previews.map((preview) => (
                <ActionPreview key={preview.label} preview={preview} />
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function buildUserActionPreviews(
  actor: LocalActorContext,
  user: ManagedUser,
): UserActionPreview[] {
  const chapterId = user.chapterMemberships[0]?.chapterId ?? "chapter-ucla";
  const reason = "Review access change during DS admin staging rehearsal.";

  const promote = changeManagedUserAccess({
    actor,
    user,
    reason,
    nextChapterMemberships: [{ chapterId, roleKey: "Action Committee Chair" }],
  });
  const demote = changeManagedUserAccess({
    actor,
    user,
    reason,
    nextChapterMemberships: [{ chapterId, roleKey: "General Member" }],
    nextStaffRoles: user.staffRoles.filter(
      (role) => !["Coach", "Sales Coach", "General Staff"].includes(role),
    ),
  });
  const portfolio = changeManagedUserAccess({
    actor,
    user,
    reason,
    nextPortfolioChapterIds: Array.from(
      new Set([...user.portfolioChapterIds, "chapter-ucla"]),
    ),
  });
  const deactivate = setManagedUserStatus({
    actor,
    user,
    reason: "Deactivate this user during DS admin staging rehearsal.",
    nextStatus: "deactivated",
    confirmation: "CONFIRM USER STATUS CHANGE",
  });
  const softDelete = deleteManagedUser({
    actor,
    user,
    reason: "Soft-delete this user during DS admin staging rehearsal.",
    confirmation: "DELETE USER",
  });

  return [
    {
      label: "Promote / demote role",
      description:
        "Promote a general member into the Student Command Center or return them to member-only access.",
      result: toUserPreviewResult(promote),
    },
    {
      label: "Return to General Student App only",
      description:
        "Remove leader/staff access while preserving General Student App access.",
      result: toUserPreviewResult(demote),
    },
    {
      label: "Assign staff portfolio scope",
      description:
        "Attach a staff or coach user to a chapter portfolio for staff review.",
      result: toUserPreviewResult(portfolio),
    },
    {
      label: "Deactivate user",
      description:
        "Disable access without destroying event, attendance, or points history.",
      result: toUserPreviewResult(deactivate),
    },
    {
      label: "Delete user safeguard",
      description:
        "Prefer a soft delete and block unsafe self-delete or protected admin deletion.",
      result: toUserPreviewResult(softDelete),
    },
  ];
}

function toUserPreviewResult(
  result:
    | ReturnType<typeof changeManagedUserAccess>
    | ReturnType<typeof setManagedUserStatus>
    | ReturnType<typeof deleteManagedUser>,
): UserActionPreview["result"] {
  if (!result.ok) return result;
  return {
    ok: true,
    audit: result.audit,
    warnings: result.warnings,
    nextUser: result.value,
  };
}

function ActionPreview({ preview }: { preview: UserActionPreview }) {
  const result = preview.result;

  return (
    <div className="rounded border border-white/10 bg-[#0d1117] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-white">{preview.label}</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">{preview.description}</p>
        </div>
        <StatusPill value={result.ok ? "audit-ready" : result.code} />
      </div>
      {result.ok ? (
        <div className="mt-3 space-y-2 text-xs leading-5 text-slate-400">
          <div>
            Audit record preview:{" "}
            <strong className="text-sky-300">{result.audit.action}</strong>
          </div>
          <div>
            New default workspace:{" "}
            <strong className="text-sky-300">
              {getWorkspaceLabel(getManagedUserAccess(result.nextUser).defaultWorkspace)}
            </strong>
          </div>
          <div>Reason: {result.audit.reason}</div>
          {result.warnings.length > 0 ? (
            <div className="text-amber-200">{result.warnings.join(" ")}</div>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-rose-200">{result.message}</p>
      )}
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

function ChipList({ values, empty }: { values: string[]; empty: string }) {
  if (values.length === 0) {
    return <span className="text-xs text-slate-600">{empty}</span>;
  }

  return (
    <div className="flex max-w-sm flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="rounded border border-sky-400/15 bg-sky-400/10 px-2 py-1 text-[11px] text-sky-200"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const danger = [
    "admin_access_required",
    "confirmation_required",
    "reason_required",
    "self_destructive_action_blocked",
    "super_admin_protected",
    "production_hard_delete_blocked",
    "chapter_has_active_data",
  ].includes(value);

  return (
    <span
      className={
        danger
          ? "inline-flex rounded border border-rose-400/20 bg-rose-400/10 px-2 py-1 text-[11px] font-semibold text-rose-200"
          : "inline-flex rounded border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[11px] font-semibold text-emerald-200"
      }
    >
      {value}
    </span>
  );
}

function getSingleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
