import {
  archiveManagedChapter,
  createManagedChapter,
  deleteManagedChapter,
  searchManagedChapters,
  updateManagedChapter,
  type AdminAuditRecord,
  type AdminMutationFailure,
  type ManagedChapter,
  type ManagedChapterStatus,
  type ManagedUser,
} from "@/services/admin-management";
import {
  managedChapterFixtures,
  managedUserFixtures,
} from "@/services/admin-management-fixtures";
import {
  chapterTypeFilterOptions,
  chapterTypeOptions,
  getChapterTypeLabel,
  type ChapterTypeFilter,
} from "@/services/chapter-type";
import { AdminReviewShellHeader } from "@/components/admin-review-shell-header";
import type { AdminAccessWriteConfig } from "@/services/admin-management-write";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { DataSourceMeta } from "@/services/read-only-app-data";
import type { ChapterType } from "@/shared/types/persistence";
import type { ReactNode } from "react";

export type AdminChaptersSearchParams = {
  q?: string | string[];
  region?: string | string[];
  coachOwnerId?: string | string[];
  chapterType?: string | string[];
  status?: string | string[];
  chapterId?: string | string[];
  adminChapterResult?: string | string[];
  operation?: string | string[];
};

type AdminChaptersManagementPanelProps = {
  actor: LocalActorContext;
  chapterAction?: (formData: FormData) => Promise<void> | void;
  embeddedInFigmaShell?: boolean;
  source?: DataSourceMeta;
  testAction?: (formData: FormData) => Promise<void> | void;
  chapters?: ManagedChapter[];
  searchParams?: AdminChaptersSearchParams;
  users?: ManagedUser[];
  writeConfig?: AdminAccessWriteConfig;
};

type ChapterActionPreview = {
  label: string;
  description: string;
  result:
    | {
        ok: true;
        audit: AdminAuditRecord;
        warnings: string[];
        nextChapter: ManagedChapter;
      }
    | AdminMutationFailure;
};

const statusOptions: Array<ManagedChapterStatus | "all"> = [
  "all",
  "active",
  "disabled",
  "archived",
  "deleted",
];

function getChapterWritePostureCopy(writeConfig: AdminAccessWriteConfig) {
  if (writeConfig.isLocalOnly) {
    return {
      status: writeConfig.enabled ? "writes-local-only" : "write_disabled",
      rpcBoundary:
        "These forms submit to the audited admin_manage_chapter RPC only when local Supabase writes and the admin access write gate are explicitly enabled.",
      reviewBoundary: writeConfig.enabled
        ? "Local chapter mutation rehearsal is enabled. Hosted and production chapter writes remain disabled."
        : "This local review keeps chapter mutation verbs visibly blocked until the audited local write path is approved.",
    };
  }

  if (writeConfig.isHostedStaging) {
    return {
      status: writeConfig.enabled ? "writes-staging-only" : "write_disabled",
      rpcBoundary:
        "These forms submit to the audited admin_manage_chapter RPC only when the hosted staging and admin access write gates are explicitly enabled.",
      reviewBoundary: writeConfig.enabled
        ? "Hosted staging chapter mutation rehearsal is enabled. Production chapter writes remain disabled."
        : "Hosted staging chapter mutations remain visibly blocked until the audited staging write path is approved.",
    };
  }

  return {
    status: "write_disabled",
    rpcBoundary:
      "Production chapter mutations are disabled. The server rejects these writes before the admin_manage_chapter RPC runs; any future production write path requires separate implementation, approval, and proof.",
    reviewBoundary:
      "Production chapter management is review-only while live chapter readback remains available.",
  };
}

export function AdminChaptersManagementPanel({
  actor,
  chapterAction,
  embeddedInFigmaShell = false,
  source = {
    mode: "mock",
    status: "mock_fallback",
    message: "Using mock admin directory data.",
  },
  testAction,
  chapters = managedChapterFixtures,
  searchParams = {},
  users = managedUserFixtures,
  writeConfig = {
    enabled: false,
    externalWritesEnabled: false,
    isLocalOnly: true,
    reason: "Admin chapter writes are locked until local Supabase write flags are approved.",
  },
}: AdminChaptersManagementPanelProps) {
  const query = getSingleParam(searchParams.q);
  const region = getSingleParam(searchParams.region) || "all";
  const coachOwnerId = getSingleParam(searchParams.coachOwnerId);
  const rawChapterType = getSingleParam(searchParams.chapterType) || "all";
  const chapterType = chapterTypeFilterOptions.some((option) => option.value === rawChapterType)
    ? (rawChapterType as ChapterTypeFilter)
    : "all";
  const rawStatus = getSingleParam(searchParams.status) || "all";
  const status = statusOptions.includes(rawStatus as ManagedChapterStatus | "all")
    ? (rawStatus as ManagedChapterStatus | "all")
    : "all";
  const filteredChapters = searchManagedChapters(chapters, {
    query,
    region,
    coachOwnerId,
    chapterType,
    status,
  });
  const selectedChapter =
    chapters.find(
      (chapter) => chapter.id === getSingleParam(searchParams.chapterId),
    ) ??
    filteredChapters[0] ??
    chapters[0];
  const Container = embeddedInFigmaShell ? "div" : "main";

  if (!selectedChapter) {
    return (
      <Container
        className={`${embeddedInFigmaShell ? "px-6 py-6" : "min-h-screen px-6 py-8"} bg-[#0d1117] text-slate-100`}
      >
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-5">
            <p className="text-xs font-semibold uppercase text-rose-200">
              Live admin directory unavailable
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">
              No app-owned chapter records are available.
            </h2>
            <p className="mt-2 text-sm leading-6 text-rose-100">
              {source.message}
            </p>
            <p className="mt-3 text-xs leading-5 text-slate-300">
              Chapter controls are locked until the Supabase directory can be
              read again. No TEST fixture has been substituted.
            </p>
          </section>
        </div>
      </Container>
    );
  }

  const previews = buildChapterActionPreviews(actor, selectedChapter);
  const regions = Array.from(
    new Set(chapters.map((chapter) => chapter.region)),
  );
  const coaches = users.filter((user) =>
    user.staffRoles.some((role) => role.toLowerCase().includes("coach")),
  );
  const studentCandidates = users.filter(
    (user) => user.chapterMemberships.length > 0 || user.staffRoles.length === 0,
  );
  const selectedStudentLeaderId = selectedChapter.studentLeaderIds[0] ?? "";
  const chapterResult = getSingleParam(searchParams.adminChapterResult);
  const resultOperation = getSingleParam(searchParams.operation);
  const formsEnabled = Boolean(writeConfig.enabled && chapterAction);
  const writePostureCopy = getChapterWritePostureCopy(writeConfig);
  const selectedChapterReturnTo = `/admin/chapters?chapterId=${selectedChapter.id}`;

  return (
    <Container className={`${embeddedInFigmaShell ? "px-6 py-6" : "min-h-screen px-6 py-8"} bg-[#0d1117] text-slate-100`}>
      <div className="mx-auto max-w-7xl space-y-6">
        {!embeddedInFigmaShell && (
          <AdminReviewShellHeader
            activeView="chapters"
            eyebrow="DS / Super Admin"
            title="Chapter Management"
            description="Manage chapter records, coach ownership, staff scope, student leaders, enabled launch modules, and archive/delete safeguards. Events, attendance, and points history are preserved by default. Return to the Command Center after this chapter review pass to keep the embedded DS Admin walkthrough coherent."
          />
        )}

        <section className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Managed chapters" value={String(chapters.length)} />
          <SummaryCard label="Filtered chapters" value={String(filteredChapters.length)} />
          <SummaryCard
            label="Active members"
            value={String(
              chapters.reduce(
                (total, chapter) => total + chapter.activeMemberCount,
                0,
              ),
            )}
          />
          <SummaryCard
            label="Historical records"
            value={String(
              chapters.reduce(
                (total, chapter) => total + chapter.historicalRecordCount,
                0,
              ),
            )}
          />
        </section>

        <form className="rounded-lg border border-white/10 bg-[#161b22] p-4">
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]">
            <label className="space-y-1 text-xs text-slate-400">
              Search chapter or school
              <input
                className="w-full rounded border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-slate-100"
                name="q"
                placeholder="TEST UCLA, TEST Boston, TEST Howard"
                type="search"
                defaultValue={query}
              />
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              Region
              <select
                className="w-full rounded border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-slate-100"
                name="region"
                defaultValue={region}
              >
                <option value="all">all</option>
                {regions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              Coach
              <select
                className="w-full rounded border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-slate-100"
                name="coachOwnerId"
                defaultValue={coachOwnerId}
              >
                <option value="">all</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              Chapter type
              <select
                className="w-full rounded border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-slate-100"
                name="chapterType"
                defaultValue={chapterType}
              >
                {chapterTypeFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
            <button
              className="self-end rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
              type="submit"
            >
              Apply preview filters
            </button>
          </div>
        </form>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#161b22]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
                Chapters
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Chapter</th>
                    <th className="px-5 py-3">Owners</th>
                    <th className="px-5 py-3">Student leaders</th>
                    <th className="px-5 py-3">Launch modules</th>
                    <th className="px-5 py-3">Data risk</th>
                    <th className="px-5 py-3">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredChapters.map((chapter) => (
                    <tr key={chapter.id}>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{getVisibleChapterName(chapter)}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {getVisibleSchoolName(chapter)} - {chapter.region}
                        </div>
                        <div className="mt-1">
                          <TypePill type={chapter.chapterType} />
                        </div>
                        {chapter.isTest ? <TestPill /> : null}
                        <StatusPill value={chapter.status} />
                      </td>
                      <td className="px-5 py-4 text-xs leading-5 text-slate-400">
                        <div>Coach: {getUserName(users, chapter.coachOwnerId)}</div>
                        <div>Country: {chapter.country || "Unassigned"}</div>
                        <div>
                          HubSpot company: {chapter.hubspotCompanyId || "Not linked"}
                        </div>
                        <div>
                          Staff:{" "}
                          {chapter.staffOwnerIds.map((id) => getUserName(users, id)).join(", ") ||
                            "Unassigned"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <ChipList
                          values={chapter.studentLeaderIds.map((id) => getUserName(users, id))}
                          empty="No student leaders"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <ChipList values={chapter.activeModules} empty="No modules" />
                      </td>
                      <td className="px-5 py-4 text-xs leading-5 text-slate-400">
                        <div>{chapter.activeMemberCount} active members</div>
                        <div>{chapter.activeEventCount} active events</div>
                        <div>{chapter.historicalRecordCount} history rows</div>
                      </td>
                      <td className="px-5 py-4">
                        <a
                          className="font-semibold text-sky-300 hover:text-sky-200"
                          href={`/admin/chapters?chapterId=${chapter.id}`}
                        >
                          View detail
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-[#161b22] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
              Chapter Detail
            </h2>
            <div className="mt-4">
              <h3 className="text-xl font-bold text-white">{getVisibleChapterName(selectedChapter)}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {getVisibleSchoolName(selectedChapter)} - {selectedChapter.region}
              </p>
              <div className="mt-2">
                <TypePill type={selectedChapter.chapterType} />
                {selectedChapter.isTest ? <TestPill /> : null}
              </div>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <DetailRow
                label="Chapter type"
                value={getChapterTypeLabel(selectedChapter.chapterType)}
              />
              <DetailRow label="Coach owner" value={getUserName(users, selectedChapter.coachOwnerId)} />
              <DetailRow
                label="Staff owners"
                value={
                  selectedChapter.staffOwnerIds.map((id) => getUserName(users, id)).join(", ") ||
                  "Unassigned"
                }
              />
              <DetailRow label="Country" value={selectedChapter.country || "Unassigned"} />
              <DetailRow
                label="HubSpot company ID"
                value={selectedChapter.hubspotCompanyId || "Not linked"}
              />
              <DetailRow
                label="Student leaders"
                value={
                  selectedChapter.studentLeaderIds.map((id) => getUserName(users, id)).join(", ") ||
                  "Unassigned"
                }
              />
              <DetailRow
                label="Active modules"
                value={selectedChapter.activeModules.join(", ") || "None"}
              />
            </dl>

            <ChapterRoleHistory chapter={selectedChapter} users={users} />

            <div className="mt-5 rounded border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
              Archive is preferred over delete. Hard delete is blocked when
              active members, active events, or historical event/attendance/points
              records exist. Production hard delete requires Super Admin approval.
            </div>

            <div className="mt-5 space-y-3 rounded border border-white/10 bg-[#0d1117] p-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Server-backed chapter changes
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {writePostureCopy.rpcBoundary} Chapter type classification is
                  shown here for readback and review; changing it stays subject
                  to the same environment-specific write boundary.
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  HubSpot company/contact IDs are stored as app-side references
                  for review and matching. This page does not send live HubSpot
                  updates yet.
                </p>
                <p className="mt-2 text-xs leading-5 text-sky-200/80">
                  {writePostureCopy.reviewBoundary}
                </p>
              </div>
              <StatusPill value={writePostureCopy.status} />
              <p className="text-xs leading-5 text-slate-500">{writeConfig.reason}</p>
              {chapterResult ? (
                <div className="rounded border border-sky-400/20 bg-sky-400/10 p-3 text-xs leading-5 text-sky-100">
                  Last chapter action: <strong>{resultOperation || "unknown"}</strong>{" "}
                  returned <strong>{chapterResult}</strong>.
                </div>
              ) : null}

              <ChapterCreateForm action={chapterAction} disabled={!formsEnabled} />
              <ChapterEditForm
                action={chapterAction}
                chapter={selectedChapter}
                disabled={!formsEnabled}
                returnTo={selectedChapterReturnTo}
              />
              <ChapterCoachForm
                action={chapterAction}
                chapter={selectedChapter}
                coaches={coaches}
                disabled={!formsEnabled || coaches.length === 0}
                returnTo={selectedChapterReturnTo}
              />
              <ChapterStudentLeaderForm
                action={chapterAction}
                chapter={selectedChapter}
                disabled={!formsEnabled || studentCandidates.length === 0}
                returnTo={selectedChapterReturnTo}
                users={studentCandidates}
              />
              <ChapterRemoveStudentLeaderForm
                action={chapterAction}
                chapter={selectedChapter}
                disabled={!formsEnabled || selectedStudentLeaderId.length === 0}
                returnTo={selectedChapterReturnTo}
                selectedStudentLeaderId={selectedStudentLeaderId}
                users={users}
              />
              <ChapterArchiveForm
                action={chapterAction}
                chapter={selectedChapter}
                disabled={!formsEnabled}
                returnTo={selectedChapterReturnTo}
              />
              <ChapterDeleteForm
                action={chapterAction}
                chapter={selectedChapter}
                disabled={!formsEnabled}
                returnTo={selectedChapterReturnTo}
              />
              <ChapterLifecycleForm
                action={chapterAction}
                chapter={selectedChapter}
                disabled={!formsEnabled}
                returnTo={selectedChapterReturnTo}
              />
              <ChapterTestMarkerForm
                action={testAction}
                chapter={selectedChapter}
                disabled={!formsEnabled || !testAction}
                returnTo={selectedChapterReturnTo}
              />
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
    </Container>
  );
}

function ChapterCreateForm({
  action,
  disabled,
}: {
  action?: (formData: FormData) => Promise<void> | void;
  disabled: boolean;
}) {
  return (
    <AdminChapterForm
      action={action}
      buttonLabel="Create chapter"
      disabled={disabled}
      operation="create_chapter"
      title="Create chapter"
    >
      <FormInput disabled={disabled} label="Chapter name" name="name" placeholder="TEST Pilot MEDLIFE" />
      <FormInput disabled={disabled} label="School" name="campus" placeholder="TEST Pilot University" />
      <FormInput disabled={disabled} label="Region / portfolio" name="region" placeholder="TEST West Coast" />
      <FormInput disabled={disabled} label="Country" name="country" placeholder="United States" />
      <FormInput
        disabled={disabled}
        label="HubSpot company ID"
        name="hubspotCompanyId"
        placeholder="HubSpot company ID"
      />
      <SelectField
        disabled={disabled}
        label="Chapter type"
        name="chapterType"
        options={chapterTypeOptions}
        value="college_university"
      />
      <input name="status" type="hidden" value="active" />
    </AdminChapterForm>
  );
}

function ChapterEditForm({
  action,
  chapter,
  disabled,
  returnTo,
}: Readonly<{
  action?: (formData: FormData) => Promise<void> | void;
  chapter: ManagedChapter;
  disabled: boolean;
  returnTo: string;
}>) {
  return (
    <AdminChapterForm
      action={action}
      buttonLabel="Save chapter profile"
      chapterId={chapter.id}
      disabled={disabled}
      operation="update_chapter"
      returnTo={returnTo}
      title="Edit chapter profile"
    >
      <FormInput disabled={disabled} label="Chapter name" name="name" value={chapter.name} />
      <FormInput disabled={disabled} label="School" name="campus" value={chapter.school} />
      <FormInput disabled={disabled} label="Region / portfolio" name="region" value={chapter.region} />
      <FormInput
        disabled={disabled}
        label="Country"
        name="country"
        value={chapter.country ?? ""}
      />
      <FormInput
        disabled={disabled}
        label="HubSpot company ID"
        name="hubspotCompanyId"
        value={chapter.hubspotCompanyId ?? ""}
      />
      <SelectField
        disabled={disabled}
        label="Chapter type"
        name="chapterType"
        options={chapterTypeOptions}
        value={chapter.chapterType}
      />
      <label className="space-y-1 text-xs text-slate-400">
        Status
        <select
          className="w-full rounded border border-white/10 bg-[#161b22] px-3 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          defaultValue={chapter.status === "disabled" ? "inactive" : chapter.status}
          disabled={disabled}
          name="status"
        >
          <option value="active">active</option>
          <option value="inactive">disabled</option>
          <option value="archived">archived</option>
        </select>
      </label>
    </AdminChapterForm>
  );
}

function ChapterCoachForm({
  action,
  chapter,
  coaches,
  disabled,
  returnTo,
}: {
  action?: (formData: FormData) => Promise<void> | void;
  chapter: ManagedChapter;
  coaches: ManagedUser[];
  disabled: boolean;
  returnTo: string;
}) {
  return (
    <AdminChapterForm
      action={action}
      buttonLabel="Assign coach"
      chapterId={chapter.id}
      disabled={disabled}
      operation="assign_coach"
      returnTo={returnTo}
      title="Assign coach owner"
    >
      <SelectField
        disabled={disabled}
        label="Coach"
        name="targetUserId"
        options={userOptions(coaches)}
        value={chapter.coachOwnerId ?? coaches[0]?.id ?? ""}
      />
    </AdminChapterForm>
  );
}

function ChapterStudentLeaderForm({
  action,
  chapter,
  disabled,
  returnTo,
  users,
}: {
  action?: (formData: FormData) => Promise<void> | void;
  chapter: ManagedChapter;
  disabled: boolean;
  returnTo: string;
  users: ManagedUser[];
}) {
  return (
    <AdminChapterForm
      action={action}
      buttonLabel="Assign student leader"
      chapterId={chapter.id}
      disabled={disabled}
      operation="assign_student_leader"
      returnTo={returnTo}
      title="Assign student leader"
    >
      <SelectField
        disabled={disabled}
        label="Student"
        name="targetUserId"
        options={userOptions(users)}
        value={chapter.studentLeaderIds[0] ?? users[0]?.id ?? ""}
      />
      <SelectField
        disabled={disabled}
        label="Leader role"
        name="roleKey"
        options={[
          { label: "Action Committee Chair", value: "action_committee_chair" },
          { label: "E-Board Member", value: "e_board_member" },
          { label: "President / VP", value: "president_vp" },
        ]}
        value="action_committee_chair"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <FormInput
          disabled={disabled}
          label="Role start year"
          name="roleTermStartYear"
          placeholder="2024"
        />
        <FormInput
          disabled={disabled}
          label="Role end year"
          name="roleTermEndYear"
          placeholder="2025"
        />
      </div>
      <FormInput
        disabled={disabled}
        label="Role term label"
        name="roleTermLabel"
        placeholder="President for 2024-2025"
      />
    </AdminChapterForm>
  );
}

function ChapterRemoveStudentLeaderForm({
  action,
  chapter,
  disabled,
  returnTo,
  selectedStudentLeaderId,
  users,
}: {
  action?: (formData: FormData) => Promise<void> | void;
  chapter: ManagedChapter;
  disabled: boolean;
  returnTo: string;
  selectedStudentLeaderId: string;
  users: ManagedUser[];
}) {
  return (
    <AdminChapterForm
      action={action}
      buttonLabel="Remove student leader"
      chapterId={chapter.id}
      confirmation="REMOVE STUDENT LEADER"
      disabled={disabled}
      operation="remove_student_leader"
      returnTo={returnTo}
      title="Remove student leader"
    >
      <SelectField
        disabled={disabled}
        label="Student leader"
        name="targetUserId"
        options={userOptions(
          users.filter((user) => chapter.studentLeaderIds.includes(user.id)),
        )}
        value={selectedStudentLeaderId}
      />
    </AdminChapterForm>
  );
}

function ChapterArchiveForm({
  action,
  chapter,
  disabled,
  returnTo,
}: Readonly<{
  action?: (formData: FormData) => Promise<void> | void;
  chapter: ManagedChapter;
  disabled: boolean;
  returnTo: string;
}>) {
  return (
    <AdminChapterForm
      action={action}
      buttonLabel="Archive chapter"
      chapterId={chapter.id}
      confirmation="ARCHIVE CHAPTER"
      disabled={disabled}
      operation="archive_chapter"
      returnTo={returnTo}
      title="Archive chapter"
    />
  );
}

function ChapterDeleteForm({
  action,
  chapter,
  disabled,
  returnTo,
}: Readonly<{
  action?: (formData: FormData) => Promise<void> | void;
  chapter: ManagedChapter;
  disabled: boolean;
  returnTo: string;
}>) {
  return (
    <AdminChapterForm
      action={action}
      buttonLabel="Soft delete chapter"
      chapterId={chapter.id}
      confirmation="DELETE CHAPTER"
      disabled={disabled}
      operation="delete_chapter"
      returnTo={returnTo}
      title="Delete chapter"
    >
      <p className="text-xs leading-5 text-slate-500">
        Soft delete removes the chapter from active administration while preserving
        events, attendance, points, coach assignments, and role history.
      </p>
    </AdminChapterForm>
  );
}

function ChapterLifecycleForm({
  action,
  chapter,
  disabled,
  returnTo,
}: Readonly<{
  action?: (formData: FormData) => Promise<void> | void;
  chapter: ManagedChapter;
  disabled: boolean;
  returnTo: string;
}>) {
  const isActive = chapter.status === "active";

  return (
    <AdminChapterForm
      action={action}
      buttonLabel={isActive ? "Deactivate / suspend chapter" : "Reactivate chapter"}
      chapterId={chapter.id}
      confirmation={isActive ? "DEACTIVATE CHAPTER" : undefined}
      disabled={disabled}
      operation={isActive ? "disable_chapter" : "update_chapter"}
      returnTo={returnTo}
      title="Chapter lifecycle"
    >
      <input name="status" type="hidden" value={isActive ? "inactive" : "active"} />
      <p className="text-xs leading-5 text-slate-500">
        Deactivate / suspend removes the chapter from active operations without deleting history. Reactivate restores its active status.
      </p>
    </AdminChapterForm>
  );
}

function ChapterTestMarkerForm({
  action,
  chapter,
  disabled,
  returnTo,
}: Readonly<{
  action?: (formData: FormData) => Promise<void> | void;
  chapter: ManagedChapter;
  disabled: boolean;
  returnTo: string;
}>) {
  const nextValue = !chapter.isTest;

  return (
    <AdminChapterForm
      action={action}
      buttonLabel={nextValue ? "Mark chapter TEST" : "Clear TEST marker"}
      chapterId={chapter.id}
      confirmation={nextValue ? "MARK CHAPTER TEST" : "CLEAR CHAPTER TEST"}
      disabled={disabled}
      operation="set_test_marker"
      returnTo={returnTo}
      title="Staff/Admin TEST visibility"
    >
      <input name="isTest" type="hidden" value={String(nextValue)} />
      <p className="text-xs leading-5 text-slate-500">
        TEST chapters are visible to Staff/Admin only and are excluded from member and leader readbacks.
      </p>
    </AdminChapterForm>
  );
}

function ChapterRoleHistory({
  chapter,
  users,
}: Readonly<{
  chapter: ManagedChapter;
  users: ManagedUser[];
}>) {
  const coachAssignments = chapter.coachAssignments ?? [];
  const currentCoaches = coachAssignments.filter(
    (assignment) => assignment.status === "active",
  );
  const roleAssignments = chapter.studentLeaderAssignments ?? [];
  const currentRoles = roleAssignments.filter(
    (assignment) => assignment.status === "approved",
  );
  const previousRoles = roleAssignments.filter(
    (assignment) => assignment.status !== "approved",
  );

  return (
    <div className="mt-5 space-y-3 rounded border border-white/10 bg-[#0d1117] p-4 text-xs leading-5 text-slate-400">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Coach and student role history
      </h3>
      <HistorySection
        empty="No current coach assignment."
        label="Current coach"
        rows={currentCoaches.map((assignment) =>
          [
            getUserName(users, assignment.coachUserId),
            `status: ${assignment.status}`,
            `started: ${formatNullableDate(assignment.startsAt)}`,
          ].join(" - "),
        )}
      />
      <HistorySection
        empty="No coach history yet."
        label="Coach history"
        rows={coachAssignments.map((assignment) =>
          [
            getUserName(users, assignment.coachUserId),
            `status: ${assignment.status}`,
            `started: ${formatNullableDate(assignment.startsAt)}`,
            assignment.endsAt ? `ended: ${formatNullableDate(assignment.endsAt)}` : null,
            assignment.handoffReason ? `reason: ${assignment.handoffReason}` : null,
          ]
            .filter(Boolean)
            .join(" - "),
        )}
      />
      <HistorySection
        empty="No current Action Committee Chairs."
        label="Current Action Committee Chairs"
        rows={currentRoles
          .filter((assignment) => assignment.roleKey === "Action Committee Chair")
          .map((assignment) => formatRoleAssignment(assignment, users))}
      />
      <HistorySection
        empty="No current E-Boarders."
        label="Current E-Boarders"
        rows={currentRoles
          .filter((assignment) => assignment.roleKey === "E-Board Member")
          .map((assignment) => formatRoleAssignment(assignment, users))}
      />
      <HistorySection
        empty="No current President / VP."
        label="Current President / VP"
        rows={currentRoles
          .filter((assignment) => assignment.roleKey === "President / VP")
          .map((assignment) => formatRoleAssignment(assignment, users))}
      />
      <HistorySection
        empty="No prior role history yet."
        label="Previous role holders"
        rows={previousRoles.map((assignment) =>
          formatRoleAssignment(assignment, users),
        )}
      />
    </div>
  );
}

function HistorySection({
  empty,
  label,
  rows,
}: Readonly<{
  empty: string;
  label: string;
  rows: string[];
}>) {
  return (
    <div className="rounded border border-white/10 bg-[#161b22] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      {rows.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {rows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-slate-500">{empty}</p>
      )}
    </div>
  );
}

function AdminChapterForm({
  action,
  buttonLabel,
  chapterId,
  children,
  confirmation,
  disabled,
  operation,
  returnTo = "/admin/chapters",
  title,
}: {
  action?: (formData: FormData) => Promise<void> | void;
  buttonLabel: string;
  chapterId?: string;
  children?: ReactNode;
  confirmation?: string;
  disabled: boolean;
  operation: string;
  returnTo?: string;
  title: string;
}) {
  const renderedButtonLabel = disabled ? `${buttonLabel} (blocked)` : buttonLabel;

  return (
    <form action={action} className="space-y-3 rounded border border-white/10 bg-[#161b22] p-3">
      <input name="operation" type="hidden" value={operation} />
      <input name="returnTo" type="hidden" value={returnTo} />
      {chapterId ? <input name="chapterId" type="hidden" value={chapterId} /> : null}
      {confirmation ? <input name="confirmation" type="hidden" value={confirmation} /> : null}
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <div className="grid gap-3">{children}</div>
      <FormInput
        disabled={disabled}
        label="Audit reason"
        name="auditReason"
        placeholder="Explain the approved admin change."
      />
      <button
        className="w-full rounded bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        disabled={disabled}
        title={
          disabled
            ? "This chapter-management change is blocked until an audited write path is approved for this environment."
            : undefined
        }
        type="submit"
      >
        {renderedButtonLabel}
      </button>
    </form>
  );
}

function FormInput({
  disabled,
  label,
  name,
  placeholder,
  value,
}: {
  disabled: boolean;
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
}) {
  return (
    <label className="space-y-1 text-xs text-slate-400">
      {label}
      <input
        className="w-full rounded border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        defaultValue={value}
        disabled={disabled}
        name={name}
        placeholder={placeholder}
      />
    </label>
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
        className="w-full rounded border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        defaultValue={value}
        disabled={disabled || options.length === 0}
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

function userOptions(users: ManagedUser[]) {
  return users.map((user) => ({
    label: `${getVisibleUserName(user)} (${user.email})`,
    value: user.id,
  }));
}

function buildChapterActionPreviews(
  actor: LocalActorContext,
  chapter: ManagedChapter,
): ChapterActionPreview[] {
  const reason = "Review chapter management change during DS admin staging rehearsal.";
  const create = createManagedChapter({
    actor,
    reason: "Create a pilot chapter record during DS admin staging rehearsal.",
    chapter: {
      ...chapter,
      id: "chapter-new-pilot",
      name: "New Pilot Chapter",
      school: "New Pilot University",
      chapterType: "college_university",
      status: "active",
      activeMemberCount: 0,
      activeEventCount: 0,
      historicalRecordCount: 0,
    },
  });
  const update = updateManagedChapter({
    actor,
    chapter,
    reason,
    next: {
      coachOwnerId: "user-cam",
      staffOwnerIds: Array.from(new Set([...chapter.staffOwnerIds, "user-sky"])),
      studentLeaderIds: Array.from(
        new Set([...chapter.studentLeaderIds, "user-casey"]),
      ),
      activeModules: ["Events", "RSVP", "Attendance", "Points"],
      chapterType: chapter.chapterType,
    },
  });
  const archive = archiveManagedChapter({
    actor,
    chapter,
    reason: "Archive this chapter during DS admin staging rehearsal.",
    confirmation: "ARCHIVE CHAPTER",
  });
  const softDelete = deleteManagedChapter({
    actor,
    chapter,
    reason: "Soft-delete this chapter during DS admin staging rehearsal.",
    confirmation: "DELETE CHAPTER",
  });
  const hardDelete = deleteManagedChapter({
    actor,
    chapter,
    reason: "Hard-delete safeguard review during DS admin staging rehearsal.",
    confirmation: "DELETE CHAPTER",
    hardDelete: true,
  });

  return [
    {
      label: "Create chapter",
      description:
        "Create a new chapter record with no active or historical data yet.",
      result: toChapterPreviewResult(create),
    },
    {
      label: "Edit chapter ownership and modules",
      description:
        "Assign coach, staff owner, student leaders, and active launch modules.",
      result: toChapterPreviewResult(update),
    },
    {
      label: "Archive chapter",
      description:
        "Prefer archive when a chapter should stop operating but history must remain.",
      result: toChapterPreviewResult(archive),
    },
    {
      label: "Soft delete chapter",
      description:
        "Mark the chapter deleted while preserving event, attendance, and points records.",
      result: toChapterPreviewResult(softDelete),
    },
    {
      label: "Hard delete safeguard",
      description:
        "Block destructive delete when active or historical chapter data exists.",
      result: toChapterPreviewResult(hardDelete),
    },
  ];
}

function toChapterPreviewResult(
  result:
    | ReturnType<typeof createManagedChapter>
    | ReturnType<typeof updateManagedChapter>
    | ReturnType<typeof archiveManagedChapter>
    | ReturnType<typeof deleteManagedChapter>,
): ChapterActionPreview["result"] {
  if (!result.ok) return result;
  return {
    ok: true,
    audit: result.audit,
    warnings: result.warnings,
    nextChapter: result.value,
  };
}

function ActionPreview({ preview }: { preview: ChapterActionPreview }) {
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
            New status:{" "}
            <strong className="text-sky-300">{result.nextChapter.status}</strong>
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

function TypePill({ type }: { type: ChapterType }) {
  return (
    <span className="inline-flex rounded border border-blue-400/20 bg-blue-400/10 px-2 py-1 text-[11px] font-semibold text-blue-100">
      {getChapterTypeLabel(type)}
    </span>
  );
}

function TestPill() {
  return (
    <span className="ml-2 inline-flex rounded border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[11px] font-semibold text-amber-100">
      TEST
    </span>
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
    "write_disabled",
    "missing_auth",
    "permission_denied",
    "target_not_found",
    "audit_reason_required",
    "invalid_operation",
    "invalid_chapter",
    "invalid_user",
    "invalid_role",
    "invalid_status",
    "invalid_profile",
    "server_error",
  ].includes(value);

  return (
    <span
      className={
        danger
          ? "mt-2 inline-flex rounded border border-rose-400/20 bg-rose-400/10 px-2 py-1 text-[11px] font-semibold text-rose-200"
          : "mt-2 inline-flex rounded border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[11px] font-semibold text-emerald-200"
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

function getUserName(users: ManagedUser[], userId: string | null | undefined): string {
  if (!userId) {
    return "Unassigned";
  }

  const user = users.find((item) => item.id === userId);
  return user ? getVisibleUserName(user) : userId;
}

function formatRoleAssignment(
  assignment: NonNullable<ManagedChapter["studentLeaderAssignments"]>[number],
  users: ManagedUser[],
) {
  let label = assignment.roleKey;
  if (assignment.roleTermLabel) {
    label = assignment.roleTermLabel;
  } else if (assignment.roleTermStartYear && assignment.roleTermEndYear) {
    label = `${assignment.roleKey} for ${assignment.roleTermStartYear}-${assignment.roleTermEndYear}`;
  }

  return [
    getUserName(users, assignment.userId),
    label,
    `status: ${assignment.status}`,
    assignment.approvedAt ? `approved: ${formatNullableDate(assignment.approvedAt)}` : null,
  ]
    .filter(Boolean)
    .join(" - ");
}

function formatNullableDate(value: string | null | undefined) {
  if (!value) {
    return "not recorded";
  }

  return value.slice(0, 10);
}

function getVisibleUserName(user: ManagedUser) {
  return isFixtureUser(user) ? prefixTestLabel(user.name) : user.name;
}

function getVisibleChapterName(chapter: ManagedChapter) {
  return isFixtureChapter(chapter) ? prefixTestLabel(chapter.name) : chapter.name;
}

function getVisibleSchoolName(chapter: ManagedChapter) {
  return isFixtureChapter(chapter) ? prefixTestLabel(chapter.school) : chapter.school;
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
