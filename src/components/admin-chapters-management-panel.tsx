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
import type { LocalActorContext } from "@/services/local-actor-context";

export type AdminChaptersSearchParams = {
  q?: string | string[];
  region?: string | string[];
  coachOwnerId?: string | string[];
  status?: string | string[];
  chapterId?: string | string[];
};

type AdminChaptersManagementPanelProps = {
  actor: LocalActorContext;
  chapters?: ManagedChapter[];
  searchParams?: AdminChaptersSearchParams;
  users?: ManagedUser[];
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

export function AdminChaptersManagementPanel({
  actor,
  chapters = managedChapterFixtures,
  searchParams = {},
  users = managedUserFixtures,
}: AdminChaptersManagementPanelProps) {
  const query = getSingleParam(searchParams.q);
  const region = getSingleParam(searchParams.region) || "all";
  const coachOwnerId = getSingleParam(searchParams.coachOwnerId);
  const rawStatus = getSingleParam(searchParams.status) || "all";
  const status = statusOptions.includes(rawStatus as ManagedChapterStatus | "all")
    ? (rawStatus as ManagedChapterStatus | "all")
    : "all";
  const filteredChapters = searchManagedChapters(chapters, {
    query,
    region,
    coachOwnerId,
    status,
  });
  const selectedChapter =
    chapters.find(
      (chapter) => chapter.id === getSingleParam(searchParams.chapterId),
    ) ??
    filteredChapters[0] ??
    chapters[0] ??
    managedChapterFixtures[0];
  const previews = buildChapterActionPreviews(actor, selectedChapter);
  const regions = Array.from(
    new Set(chapters.map((chapter) => chapter.region)),
  );
  const coaches = users.filter((user) =>
    user.staffRoles.some((role) => role.toLowerCase().includes("coach")),
  );

  return (
    <main className="min-h-screen bg-[#0d1117] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">
              DS / Super Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Chapter Management
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Manage chapter records, coach ownership, staff scope, student
              leaders, enabled launch modules, and archive/delete safeguards.
              Events, attendance, and points history are preserved by default.
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
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
            <label className="space-y-1 text-xs text-slate-400">
              Search chapter or school
              <input
                className="w-full rounded border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-slate-100"
                name="q"
                placeholder="UCLA, Boston, Howard"
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
                        <div className="font-semibold text-white">{chapter.name}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {chapter.school} - {chapter.region}
                        </div>
                        <StatusPill value={chapter.status} />
                      </td>
                      <td className="px-5 py-4 text-xs leading-5 text-slate-400">
                        <div>Coach: {getUserName(users, chapter.coachOwnerId)}</div>
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
              <h3 className="text-xl font-bold text-white">{selectedChapter.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {selectedChapter.school} - {selectedChapter.region}
              </p>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <DetailRow label="Coach owner" value={getUserName(users, selectedChapter.coachOwnerId)} />
              <DetailRow
                label="Staff owners"
                value={
                  selectedChapter.staffOwnerIds.map((id) => getUserName(users, id)).join(", ") ||
                  "Unassigned"
                }
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

            <div className="mt-5 rounded border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
              Archive is preferred over delete. Hard delete is blocked when
              active members, active events, or historical event/attendance/points
              records exist. Production hard delete requires Super Admin approval.
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

  return users.find((user) => user.id === userId)?.name ?? userId;
}
