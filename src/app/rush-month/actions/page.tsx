import { AppShell } from "@/components/app-shell";
import { AssignmentCreateResultStatesPanel } from "@/components/assignment-create-result-states-panel";
import { AssignmentCard } from "@/components/assignment-card";
import { BrowserWriteGateNotice } from "@/components/browser-write-gate-notice";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { LeaderFollowUpBoardPanel } from "@/components/leader-follow-up-board-panel";
import { RestrictedState } from "@/components/restricted-state";
import { WriteReadinessNotice } from "@/components/write-readiness-notice";
import {
  getAssignmentCreateBrowserWriteGate,
} from "@/services/browser-write-activation";
import {
  getAssignmentCreateResultStates,
  getDisabledAssignmentCreateResultPreview,
} from "@/services/assignment-create-result-states";
import {
  canCreateChapterAssignment,
  createChapterAssignmentMock,
  type ChapterAssignmentInput,
} from "@/services/local-action-contracts";
import { getLeaderFollowUpBoard } from "@/services/leader-follow-up-board";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getVisibleAssignmentsForActor } from "@/services/role-visibility";
import { prepareDisabledAssignmentCreateWrite } from "@/services/write-readiness";

export const dynamic = "force-dynamic";

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

export default async function ActionsPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const followUpBoard = getLeaderFollowUpBoard(actor, data);
  const canCreateAssignment = canCreateChapterAssignment(actor);
  const shouldShowAssignmentCreateGate =
    canCreateAssignment || actor.audience === "admin" || actor.audience === "ds_admin";
  const assignmentCreatePreview = createChapterAssignmentMock(actor, sampleAssignmentInput);
  const assignmentCreateGate = getAssignmentCreateBrowserWriteGate(
    actor,
    sampleAssignmentInput,
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

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />

      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          This week actions
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {actor.audienceLabel} visible assignments
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          This read-only view shows who owns what, what evidence is needed, and
          what this local role should act on next.
        </p>
      </section>

      <LeaderFollowUpBoardPanel board={followUpBoard} />

      {canCreateAssignment ? (
        <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
              Leader assignment path
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Create the next student action, but keep saving locked.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/66">
              This is the first leader-side write path the MVP needs:
              create one clear assignment, tell the owner what proof to collect,
              and record the event/outbox/audit trail when writes are approved.
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
        </section>
      ) : null}

      {shouldShowAssignmentCreateGate ? (
        <BrowserWriteGateNotice gate={assignmentCreateGate} />
      ) : null}

      {visibleAssignments.length > 0 ? (
        <section className="grid gap-3 lg:grid-cols-2">
          {visibleAssignments.map((assignment) => (
            <AssignmentCard key={`${actor.audience}-${assignment.id}`} assignment={assignment} />
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
