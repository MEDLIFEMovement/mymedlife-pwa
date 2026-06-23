import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { AssignmentCreateResultStatesPanel } from "@/components/assignment-create-result-states-panel";
import { AssignmentCard } from "@/components/assignment-card";
import { BrowserWriteGateNotice } from "@/components/browser-write-gate-notice";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { LeaderAssignmentServerActionPanel } from "@/components/leader-assignment-server-action-panel";
import { LeaderFollowUpBoardPanel } from "@/components/leader-follow-up-board-panel";
import { LeaderSelectedAssignmentPanel } from "@/components/leader-selected-assignment-panel";
import { MemberRushMonthActionsPanel } from "@/components/member-rush-month-actions-panel";
import { RestrictedState } from "@/components/restricted-state";
import { WriteReadinessNotice } from "@/components/write-readiness-notice";
import {
  getAssignmentCreateBrowserWriteGate,
} from "@/services/browser-write-activation";
import {
  getAssignmentCreateResultStates,
  getDisabledAssignmentCreateResultPreview,
  type AssignmentCreateResultCode,
} from "@/services/assignment-create-result-states";
import { getAssignmentCreateWriteReadiness } from "@/services/assignment-create-write";
import {
  canCreateChapterAssignment,
  createChapterAssignmentMock,
  type ChapterAssignmentInput,
} from "@/services/local-action-contracts";
import { getActorSurfaceNounLabel } from "@/services/actor-role-display";
import { getChapterMembershipWorkspace } from "@/services/chapter-membership-workspace";
import { getLeaderActionsFocus } from "@/services/leader-actions-focus";
import {
  buildLeaderAssignmentRouteHref,
  type LeaderAssignmentRouteSource,
} from "@/services/leader-assignment-route-href";
import { getLeaderFollowUpBoard } from "@/services/leader-follow-up-board";
import { getLocalActorContext } from "@/services/local-actor-context";
import { type MemberActionRouteSource } from "@/services/member-action-route-href";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getActorSurfaceFamily,
  getVisibleAssignmentsForActor,
} from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { prepareDisabledAssignmentCreateWrite } from "@/services/write-readiness";

export const metadata = getStaticRouteMetadata("rushMonthActions");
export const dynamic = "force-dynamic";

type ActionsPageProps = {
  searchParams?: Promise<ActionsSearchParams>;
};

type ActionsSearchParams = {
  assignmentId?: string;
  assignmentCreateResult?: string;
  member?: string;
  returnTo?: string;
  source?: string;
};

const sampleAssignmentInput = {
  title: "Assign a Rush Month event owner",
  instructions:
    "Choose one student owner, confirm the event goal, and tell them what proof/testimonial should be collected afterward.",
  ownerRole: "Action Committee Member",
  dueLabel: "Next Friday",
  evidenceRequired: "Owner name, Luma/event link, and proof collection plan.",
  points: 15,
  kpi: "Rush Month event owner assigned",
} satisfies ChapterAssignmentInput;

export default async function ActionsPage({ searchParams }: ActionsPageProps) {
  const emptySearchParams: ActionsSearchParams = {};
  const [data, actor, search] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
    searchParams ?? Promise.resolve(emptySearchParams),
  ]);
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const leaderActionsFocus = getLeaderActionsFocus(actor, data, visibleAssignments);
  const followUpBoard = getLeaderFollowUpBoard(actor, data);
  const actorSurfaceFamily = getActorSurfaceFamily(actor);
  const canCreateAssignment = canCreateChapterAssignment(actor);
  const shouldShowAssignmentCreateGate =
    canCreateAssignment ||
    actorSurfaceFamily === "staff" ||
    actorSurfaceFamily === "ds_admin";
  const assignmentCreatePreview = createChapterAssignmentMock(actor, sampleAssignmentInput);
  const assignmentCreateGate = getAssignmentCreateBrowserWriteGate(
    actor,
    sampleAssignmentInput,
    {
      chapterId: data.chapter.id,
      campaignId: data.campaign.id,
      existingAssignments: data.assignments,
    },
  );
  const assignmentCreateWriteReadiness = getAssignmentCreateWriteReadiness(
    actor,
    sampleAssignmentInput,
    {
      chapterId: data.chapter.id,
      campaignId: data.campaign.id,
      existingAssignments: data.assignments,
    },
  );
  const disabledAssignmentCreateWrite = prepareDisabledAssignmentCreateWrite(
    actor,
    sampleAssignmentInput,
  );
  const assignmentCreateResultPreview = getDisabledAssignmentCreateResultPreview(
    actor,
    sampleAssignmentInput,
    data.assignments,
  );
  const assignmentCreateResultCode = parseAssignmentCreateResultCode(
    search.assignmentCreateResult,
  );
  const isMemberActions = actorSurfaceFamily === "member";
  const memberActionSource = parseMemberActionSource(search.source);
  const chapterAssignmentContext = getChapterAssignmentSourceContext(
    actor,
    data,
    search.source,
    search.member,
    search.returnTo,
  );
  const assignmentFlowReturnTo = getAssignmentFlowReturnTo(
    search.source,
    search.member,
    search.returnTo,
  );
  const selectedLeaderAssignment = getSelectedLeaderAssignment(
    isMemberActions,
    visibleAssignments,
    search.assignmentId,
  );
  const leaderAssignmentSource = parseLeaderAssignmentSource(search.source);

  if (isMemberActions) {
    return (
      <AppShell
        actor={actor}
        hideTopHeader
        showMobileQuickItemHelpers={false}
        showDebugTools={false}
      >
        <MemberRushMonthActionsPanel
          assignments={visibleAssignments}
          source={memberActionSource}
        />
      </AppShell>
    );
  }

  return (
    <AppShell actor={actor}>
      {chapterAssignmentContext ? (
        <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
          <p className="app-eyebrow app-eyebrow-blue">{chapterAssignmentContext.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {chapterAssignmentContext.title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {chapterAssignmentContext.detail}
          </p>
          <Link
            href={chapterAssignmentContext.href}
            className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
          >
            {chapterAssignmentContext.backLabel}
          </Link>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
          This week actions
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {getActorSurfaceNounLabel(actor)} assignments
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">
          This read-only view shows who owns what, what evidence is needed, and
          what this local role should act on next.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <ActionsHeroStat label="Visible" value={`${visibleAssignments.length}`} />
          <ActionsHeroStat
            label="In progress"
            value={`${visibleAssignments.filter((assignment) => assignment.status === "in_progress").length}`}
          />
          <ActionsHeroStat
            label="Submitted"
            value={`${visibleAssignments.filter((assignment) => assignment.status === "submitted").length}`}
          />
        </div>
      </section>

      <DataSourceNotice source={data.source} />

      {selectedLeaderAssignment ? (
        <LeaderSelectedAssignmentPanel
          assignment={selectedLeaderAssignment}
          source={leaderAssignmentSource ?? undefined}
        />
      ) : null}

      {leaderActionsFocus.canReadFocus ? (
        <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
            {leaderActionsFocus.roleLabel}
          </p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {leaderActionsFocus.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
                {leaderActionsFocus.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={leaderActionsFocus.primaryHref}
                className="rounded-full bg-sky-200 px-4 py-2 text-sm font-semibold text-[#06211d]"
              >
                {leaderActionsFocus.primaryLabel}
              </Link>
              <Link
                href={leaderActionsFocus.secondaryHref}
                className="rounded-full border border-white/14 bg-black/20 px-4 py-2 text-sm font-semibold text-white"
              >
                {leaderActionsFocus.secondaryLabel}
              </Link>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {leaderActionsFocus.items.map((item) => (
              <div key={item.label} className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-white/58">{item.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl border border-white/10 bg-black/18 p-3 text-sm leading-6 text-white/62">
            {leaderActionsFocus.safetyNote}
          </p>
        </section>
      ) : null}

      <LeaderFollowUpBoardPanel board={followUpBoard} />

      {canCreateAssignment ? (
        <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
              Leader assignment path
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {leaderActionsFocus.canReadFocus
                ? leaderActionsFocus.assignmentCreateTitle
                : "Create the next student action, but keep saving locked."}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/66">
              {leaderActionsFocus.canReadFocus
                ? leaderActionsFocus.assignmentCreateSummary
                : "This is the first leader-side write path the MVP needs: create one clear assignment, tell the owner what proof to collect, and record the event/outbox/audit trail when writes are approved."}
            </p>

            {assignmentCreatePreview.success ? (
              <div className="mt-4 rounded-2xl bg-black/20 p-3">
                <p className="text-sm font-semibold text-white">
                  Preview assignment: {assignmentCreatePreview.data.assignment.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/58">
                  Owner: {assignmentCreatePreview.data.assignment.ownerRole}. Status:
                  {" "}
                  {assignmentCreatePreview.data.assignment.status}. Audit action:
                  {" "}
                  {assignmentCreatePreview.data.auditLog.action}.
                </p>
              </div>
            ) : null}
          </article>

          <div className="grid gap-3">
            <WriteReadinessNotice
              operationLabel="Assignment creation write remains disabled"
              wouldWriteTables={disabledAssignmentCreateWrite.wouldWriteTables}
            />
            {assignmentCreatePreview.success ? (
              <EventOutboxLog
                events={[assignmentCreatePreview.data.integrationEvent]}
                outboxItems={[assignmentCreatePreview.data.automationOutbox]}
              />
            ) : null}
          </div>
          <div className="lg:col-span-2">
            <AssignmentCreateResultStatesPanel
              preview={assignmentCreateResultPreview}
              states={getAssignmentCreateResultStates()}
            />
          </div>
          <div className="lg:col-span-2">
            <LeaderAssignmentServerActionPanel
              chapterId={data.chapter.id}
              campaignId={data.campaign.id}
              input={sampleAssignmentInput}
              existingAssignments={data.assignments}
              readiness={assignmentCreateWriteReadiness}
              returnTo={assignmentFlowReturnTo}
              resultCode={assignmentCreateResultCode}
            />
          </div>
        </section>
      ) : null}

      {shouldShowAssignmentCreateGate ? (
        <BrowserWriteGateNotice gate={assignmentCreateGate} />
      ) : null}

      {visibleAssignments.length > 0 ? (
        <section className="grid gap-3 lg:grid-cols-2">
          {visibleAssignments.map((assignment) => (
            <AssignmentCard
              key={`${actor.audience}-${assignment.id}`}
              assignment={assignment}
              actionHref={buildLeaderAssignmentRouteHref(assignment.id, {
                source: "leader_assignment_card",
              })}
            />
          ))}
        </section>
      ) : (
        <RestrictedState
          title="No assignment rows are visible to this role."
          message="DS Admin can inspect integration/outbox posture only. Student assignment truth stays in the app and is not owned by systems administration."
          nextHref="/admin"
          nextLabel="Open admin integration view"
        />
      )}
    </AppShell>
  );
}

function getSelectedLeaderAssignment(
  isMemberActions: boolean,
  assignments: Awaited<ReturnType<typeof getReadOnlyAppData>>["assignments"],
  assignmentId: string | undefined,
) {
  if (isMemberActions || !assignmentId) {
    return null;
  }

  return assignments.find((assignment) => assignment.id === assignmentId) ?? null;
}

function parseMemberActionSource(value: string | undefined): MemberActionRouteSource | null {
  switch (value) {
    case "home":
    case "campaigns":
    case "evidence":
    case "events":
    case "points":
    case "profile":
      return value;
    default:
      return null;
  }
}

function parseLeaderAssignmentSource(
  value: string | undefined,
): LeaderAssignmentRouteSource | null {
  switch (value) {
    case "leader_follow_up":
    case "leader_assignment_card":
    case "dashboard_assignment_card":
    case "proof_status":
    case "evidence_queue":
    case "first_write_packet":
    case "proof_metadata_packet":
    case "hq_proof_packet":
      return value;
    default:
      return null;
  }
}

function getAssignmentFlowReturnTo(
  source: string | undefined,
  memberId: string | undefined,
  returnTo: string | undefined,
) {
  if (source !== "chapter_assign_action") {
    return "/rush-month/actions";
  }

  const searchParams = new URLSearchParams({
    source: "chapter_assign_action",
  });

  if (memberId) {
    searchParams.set("member", memberId);
  }

  if (returnTo) {
    searchParams.set("returnTo", returnTo);
  }

  return `/rush-month/actions?${searchParams.toString()}`;
}

function getChapterAssignmentSourceContext(
  actor: Awaited<ReturnType<typeof getLocalActorContext>>,
  data: Awaited<ReturnType<typeof getReadOnlyAppData>>,
  source: string | undefined,
  memberId: string | undefined,
  returnTo: string | undefined,
) {
  if (source !== "chapter_assign_action") {
    return null;
  }

  const workspace = getChapterMembershipWorkspace(actor, data);
  const selectedMember = workspace.members.find((member) => member.id === memberId) ?? null;

  return {
    eyebrow: "From member pipeline",
    title: selectedMember
      ? `${selectedMember.displayName} is still the student in focus.`
      : "The member pipeline is still the review context.",
    detail: selectedMember
      ? `Stay anchored to ${selectedMember.displayName} while you use the broader assignment lane. The chapter-owned review state should stay legible, and the return path should take you back to the same member-pipeline handoff.`
      : "Use the broader assignment lane without losing the chapter-owned member-pipeline review state that opened it.",
    href: normalizeChapterReturnTo(returnTo),
    backLabel: "Back to member pipeline",
  };
}

function normalizeChapterReturnTo(value: string | undefined) {
  if (!value) {
    return "/chapter?view=members&quickAction=assign_action";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/chapter?view=members&quickAction=assign_action";
  }

  return value;
}

function parseAssignmentCreateResultCode(
  value: string | undefined,
): AssignmentCreateResultCode | undefined {
  const allowedCodes = new Set(
    getAssignmentCreateResultStates().map((state) => state.code),
  );

  return value && allowedCodes.has(value as AssignmentCreateResultCode)
    ? (value as AssignmentCreateResultCode)
    : undefined;
}

function ActionsHeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/12 bg-white/10 p-3 backdrop-blur-sm">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-white/56">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
