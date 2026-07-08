import type { ReactNode } from "react";
import { submitAdminUserAccessAction } from "@/app/admin/users/actions";
import {
  changeManagedUserAccess,
  deleteManagedUser,
  getManagedUserAccess,
  searchManagedUsers,
  setManagedUserStatus,
  type AdminAuditRecord,
  type AdminMutationFailure,
  type ManagedChapter,
  type ManagedUser,
  type ManagedUserStatus,
} from "@/services/admin-management";
import {
  managedChapterFixtures,
  managedUserFixtures,
} from "@/services/admin-management-fixtures";
import {
  hasAdminAccessSupabaseIds,
  type AdminAccessResultCode,
  type AdminAccessWriteConfig,
} from "@/services/admin-management-write";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { DataSourceMeta } from "@/services/read-only-app-data";
import { getWorkspaceLabel } from "@/services/workspace-access";

export type AdminUsersSearchParams = {
  q?: string | string[];
  role?: string | string[];
  chapterId?: string | string[];
  status?: string | string[];
  userId?: string | string[];
  targetUserId?: string | string[];
  adminAccessResult?: string | string[];
  operation?: string | string[];
};

type AdminUsersManagementPanelProps = {
  actor: LocalActorContext;
  chapters?: ManagedChapter[];
  source?: DataSourceMeta;
  searchParams?: AdminUsersSearchParams;
  users?: ManagedUser[];
  writeConfig?: AdminAccessWriteConfig;
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

const chapterRoleOptions = [
  { value: "general_member", label: "General Member" },
  { value: "action_committee_member", label: "Action Committee Member" },
  { value: "action_committee_chair", label: "Action Committee Chair" },
  { value: "e_board_member", label: "E-Board Member" },
  { value: "president_vp", label: "President / VP" },
];

const staffRoleOptions = [
  { value: "coach", label: "Coach" },
  { value: "admin", label: "Staff Admin" },
  { value: "ds_admin", label: "DS Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const resultText: Record<
  AdminAccessResultCode,
  { label: string; tone: "success" | "warning" | "error" | "neutral" }
> = {
  admin_access_changed: {
    label: "Access changed through the audited RPC. Reopen this user to verify allowed/default workspaces.",
    tone: "success",
  },
  write_disabled: {
    label: "Writes are disabled for this environment.",
    tone: "warning",
  },
  missing_auth: {
    label: "Sign in with a DS Admin or Super Admin account before changing access.",
    tone: "error",
  },
  permission_denied: {
    label: "This signed-in role is not allowed to change user access.",
    tone: "error",
  },
  target_not_found: {
    label: "The selected user or chapter is not backed by real Supabase UUID data.",
    tone: "error",
  },
  confirmation_required: {
    label: "The confirmation text was missing or did not match.",
    tone: "warning",
  },
  audit_reason_required: {
    label: "A clear audit reason is required.",
    tone: "warning",
  },
  invalid_operation: {
    label: "Choose a supported admin access operation.",
    tone: "error",
  },
  invalid_role: {
    label: "Choose a valid role for this access change.",
    tone: "error",
  },
  invalid_scope: {
    label: "Choose the required chapter or portfolio scope.",
    tone: "error",
  },
  self_destructive_action_blocked: {
    label: "Admins cannot perform destructive access changes on their own account.",
    tone: "error",
  },
  super_admin_protected: {
    label: "Only a Super Admin can change Super Admin access.",
    tone: "error",
  },
  server_error: {
    label: "The app could not safely change access. No external automation ran.",
    tone: "error",
  },
};

export function AdminUsersManagementPanel({
  actor,
  chapters = managedChapterFixtures,
  source = {
    mode: "mock",
    status: "mock_fallback",
    message: "Using mock admin directory data.",
  },
  searchParams = {},
  users = managedUserFixtures,
  writeConfig = {
    enabled: false,
    isLocalOnly: true,
    externalWritesEnabled: false,
    reason: "Admin access writes are disabled for this review.",
  },
}: AdminUsersManagementPanelProps) {
  const query = getSingleParam(searchParams.q);
  const role = getSingleParam(searchParams.role) || "all";
  const chapterId = getSingleParam(searchParams.chapterId);
  const rawStatus = getSingleParam(searchParams.status) || "all";
  const resultCode = getAdminAccessResultCode(
    getSingleParam(searchParams.adminAccessResult),
  );
  const status = statusOptions.includes(rawStatus as ManagedUserStatus | "all")
    ? (rawStatus as ManagedUserStatus | "all")
    : "all";
  const filteredUsers = searchManagedUsers(users, {
    query,
    role,
    chapterId,
    status,
  });
  const selectedUser =
    users.find(
      (user) =>
        user.id ===
        (getSingleParam(searchParams.targetUserId) ??
          getSingleParam(searchParams.userId)),
    ) ??
    filteredUsers[0] ??
    users[0] ??
    managedUserFixtures[0];
  const previews = buildUserActionPreviews(actor, selectedUser);
  const returnTo = selectedUser ? `/admin/users?userId=${selectedUser.id}` : "/admin/users";

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
          <SummaryCard label="Directory users" value={String(users.length)} />
          <SummaryCard label="Filtered users" value={String(filteredUsers.length)} />
          <SummaryCard
            label="Pending invites"
            value={String(
              users.filter((user) => user.inviteStatus === "sent").length,
            )}
          />
          <SummaryCard
            label="Protected admins"
            value={String(
              users.filter((user) =>
                user.staffRoles.some((role) =>
                  ["DS Admin", "Super Admin", "ds_admin", "super_admin"].includes(role),
                ),
              ).length,
            )}
          />
        </section>

        <section className="grid gap-3 rounded-lg border border-white/10 bg-[#161b22] p-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Data source
            </p>
            <p className="mt-1 font-semibold text-white">
              {source.mode === "supabase" ? "Supabase-backed directory" : "Mock review directory"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{source.message}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Write gate
            </p>
            <p className="mt-1 font-semibold text-white">
              {writeConfig.enabled ? "Local admin writes enabled" : "Admin writes locked"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{writeConfig.reason}</p>
          </div>
        </section>

        {resultCode ? <AdminAccessResultBanner code={resultCode} /> : null}

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
                {chapters.map((chapter) => (
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
              Apply preview filters
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
                          <div className="font-semibold text-white">{getVisibleUserName(user)}</div>
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
                                getChapterName(chapters, item.chapterId),
                              ),
                              ...user.portfolioChapterIds.map((id) =>
                                `Portfolio: ${getChapterName(chapters, id)}`,
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
              <h3 className="text-xl font-bold text-white">{getVisibleUserName(selectedUser)}</h3>
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

            {selectedUser ? (
              <AdminAccessServerForms
                chapters={chapters}
                returnTo={returnTo}
                selectedUser={selectedUser}
                writeConfig={writeConfig}
              />
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}

function AdminAccessResultBanner({ code }: { code: AdminAccessResultCode }) {
  const state = resultText[code];
  const toneClass =
    state.tone === "success"
      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
      : state.tone === "warning"
        ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
        : state.tone === "error"
          ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
          : "border-sky-300/30 bg-sky-300/10 text-sky-100";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${toneClass}`} role="status">
      <p className="font-semibold">Admin access result: {code.replaceAll("_", " ")}</p>
      <p className="mt-1">{state.label}</p>
    </div>
  );
}

function AdminAccessServerForms({
  chapters,
  returnTo,
  selectedUser,
  writeConfig,
}: {
  chapters: ManagedChapter[];
  returnTo: string;
  selectedUser: ManagedUser;
  writeConfig: AdminAccessWriteConfig;
}) {
  const hasRealIds = hasAdminAccessSupabaseIds({ targetUserId: selectedUser.id });
  const formsEnabled = writeConfig.enabled && hasRealIds;
  const defaultChapterId =
    selectedUser.chapterMemberships[0]?.chapterId ?? chapters[0]?.id ?? "";
  const currentStaffRole =
    selectedUser.staffRoles.map(toRoleValue).find(Boolean) ?? "coach";

  return (
    <div className="mt-6 space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Server-backed access changes
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          These forms submit to the audited `admin_change_user_access` RPC. They stay locked
          for mock IDs or when local Supabase write flags are off.
        </p>
        <p className="mt-2 text-xs leading-5 text-sky-200/80">
          This review shell keeps every write verb visibly blocked until the audited local
          write path is available.
        </p>
      </div>

      {!hasRealIds ? (
        <div className="rounded border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
          This selected user is mock-only, so the admin RPC cannot run. Sign in against
          Supabase-backed local/staging data to test real access changes.
        </div>
      ) : null}

      <AdminAccessFormShell
        buttonLabel="Save chapter role"
        disabled={!formsEnabled}
        operation="set_chapter_role"
        returnTo={returnTo}
        selectedUser={selectedUser}
      >
        <SelectField disabled={!formsEnabled} label="Chapter" name="chapterId" options={chapterOptions(chapters)} value={defaultChapterId} />
        <SelectField disabled={!formsEnabled} label="Role" name="roleKey" options={chapterRoleOptions} value="action_committee_chair" />
      </AdminAccessFormShell>

      <AdminAccessFormShell
        buttonLabel="Remove chapter access"
        confirmation="REMOVE CHAPTER ACCESS"
        disabled={!formsEnabled}
        operation="remove_chapter_membership"
        returnTo={returnTo}
        selectedUser={selectedUser}
      >
        <SelectField disabled={!formsEnabled} label="Chapter" name="chapterId" options={chapterOptions(chapters)} value={defaultChapterId} />
      </AdminAccessFormShell>

      <AdminAccessFormShell
        buttonLabel="Assign staff role"
        disabled={!formsEnabled}
        operation="set_staff_role"
        returnTo={returnTo}
        selectedUser={selectedUser}
      >
        <SelectField disabled={!formsEnabled} label="Staff role" name="roleKey" options={staffRoleOptions} value="coach" />
      </AdminAccessFormShell>

      <AdminAccessFormShell
        buttonLabel="Remove staff role"
        confirmation="REMOVE STAFF ROLE"
        disabled={!formsEnabled}
        operation="remove_staff_role"
        returnTo={returnTo}
        selectedUser={selectedUser}
      >
        <SelectField disabled={!formsEnabled} label="Staff role" name="roleKey" options={staffRoleOptions} value={currentStaffRole} />
      </AdminAccessFormShell>

      <AdminAccessFormShell
        buttonLabel="Assign coach portfolio"
        disabled={!formsEnabled}
        operation="set_coach_portfolio"
        returnTo={returnTo}
        selectedUser={selectedUser}
      >
        <SelectField disabled={!formsEnabled} label="Portfolio chapter" name="chapterId" options={chapterOptions(chapters)} value={defaultChapterId} />
      </AdminAccessFormShell>

      <AdminAccessFormShell
        buttonLabel="Deactivate user"
        confirmation="DEACTIVATE USER"
        disabled={!formsEnabled}
        operation="deactivate_user"
        returnTo={returnTo}
        selectedUser={selectedUser}
      />
    </div>
  );
}

function AdminAccessFormShell({
  buttonLabel,
  children,
  confirmation,
  disabled,
  operation,
  returnTo,
  selectedUser,
}: {
  buttonLabel: string;
  children?: ReactNode;
  confirmation?: string;
  disabled: boolean;
  operation: string;
  returnTo: string;
  selectedUser: ManagedUser;
}) {
  const renderedButtonLabel = disabled ? `${buttonLabel} (blocked)` : buttonLabel;

  return (
    <form action={submitAdminUserAccessAction} className="rounded border border-white/10 bg-[#0d1117] p-3">
      <input type="hidden" name="operation" value={operation} />
      <input type="hidden" name="targetUserId" value={selectedUser.id} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="grid gap-3">
        {children}
        {confirmation ? (
          <label className="space-y-1 text-xs text-slate-400">
            Confirmation
            <input
              className="w-full rounded border border-white/10 bg-[#161b22] px-3 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
              disabled={disabled}
              name="confirmation"
              placeholder={confirmation}
            />
          </label>
        ) : null}
        <label className="space-y-1 text-xs text-slate-400">
          Audit reason
          <textarea
            className="min-h-20 w-full rounded border border-white/10 bg-[#161b22] px-3 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
            defaultValue={`MED-509 admin access rehearsal for ${selectedUser.email}.`}
            disabled={disabled}
            name="auditReason"
          />
        </label>
        <button
          className="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
          disabled={disabled}
          title={
            disabled
              ? "This admin access change is blocked until audited local Supabase writes are approved."
              : undefined
          }
          type="submit"
        >
          {renderedButtonLabel}
        </button>
      </div>
    </form>
  );
}

function SelectField({
  disabled,
  label,
  name,
  options,
  value,
}: {
  disabled: boolean;
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="space-y-1 text-xs text-slate-400">
      {label}
      <select
        className="w-full rounded border border-white/10 bg-[#161b22] px-3 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
        defaultValue={value}
        disabled={disabled}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function chapterOptions(chapters: ManagedChapter[]) {
  return chapters.map((chapter) => ({
    label: getVisibleChapterName(chapter),
    value: chapter.id,
  }));
}

function getAdminAccessResultCode(
  value: string | undefined,
): AdminAccessResultCode | null {
  if (!value) {
    return null;
  }

  return value in resultText ? (value as AdminAccessResultCode) : null;
}

function toRoleValue(role: string): string | null {
  const normalized = role
    .trim()
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (staffRoleOptions.some((option) => option.value === normalized)) {
    return normalized;
  }

  if (normalized === "staff") {
    return "admin";
  }

  return null;
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

function getChapterName(chapters: ManagedChapter[], chapterId: string) {
  const chapter = chapters.find((item) => item.id === chapterId);
  return chapter ? getVisibleChapterName(chapter) : chapterId;
}

function getVisibleUserName(user: ManagedUser) {
  return isFixtureUser(user) ? prefixTestLabel(user.name) : user.name;
}

function getVisibleChapterName(chapter: ManagedChapter) {
  return isFixtureChapter(chapter) ? prefixTestLabel(chapter.name) : chapter.name;
}

function isFixtureUser(user: ManagedUser) {
  return managedUserFixtures.some((fixture) => fixture.id === user.id);
}

function isFixtureChapter(chapter: ManagedChapter) {
  return managedChapterFixtures.some((fixture) => fixture.id === chapter.id);
}

function prefixTestLabel(value: string) {
  return value.startsWith("TEST ") ? value : `TEST ${value}`;
}
