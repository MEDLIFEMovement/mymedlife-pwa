import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { getVisibleAssignmentsForActor } from "@/services/role-visibility";
import type { Assignment } from "@/shared/types/domain";
import type { RiskFlagRow } from "@/shared/types/persistence";

export type CoachSupportNoteStatus =
  | "ready_for_check_in"
  | "needs_follow_up"
  | "escalation_watch";

export type CoachSupportNoteVisibility =
  | "coach_private"
  | "hq_support"
  | "chapter_follow_up";

export type CoachInterventionChecklistStatus = "ready" | "watch" | "blocked";

export type CoachInterventionChecklistItem = {
  key: string;
  label: string;
  status: CoachInterventionChecklistStatus;
  question: string;
  action: string;
  sourceSignal: string;
  routeEvidence: string[];
  browserWritesExpected: 0;
  externalWritesExpected: 0;
};

export type CoachInterventionChecklist = {
  title: string;
  summary: string;
  items: CoachInterventionChecklistItem[];
  blockedControls: string[];
  counts: {
    total: number;
    ready: number;
    watch: number;
    blocked: number;
    browserWritesEnabled: 0;
    externalWritesEnabled: 0;
  };
};

export type CoachSupportNote = {
  key: string;
  label: string;
  ownerLane: string;
  visibility: CoachSupportNoteVisibility;
  status: CoachSupportNoteStatus;
  note: string;
  nextStep: string;
  sourceSignals: string[];
  routeEvidence: string[];
  browserWritesExpected: 0;
  externalWritesExpected: 0;
};

export type CoachSupportNotesWorkspace = {
  canReadWorkspace: boolean;
  title: string;
  summary: string;
  chapterName: string;
  decision: ReadOnlyAppData["kpiSummary"]["coachDecision"];
  browserWritesEnabled: 0;
  externalWritesEnabled: 0;
  counts: {
    total: number;
    readyForCheckIn: number;
    needsFollowUp: number;
    escalationWatch: number;
    coachPrivate: number;
  };
  interventionChecklist: CoachInterventionChecklist;
  notes: CoachSupportNote[];
  finalPrompt: string;
};

export function getCoachSupportNotesWorkspace(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): CoachSupportNotesWorkspace {
  if (!canReadCoachSupportNotes(actor)) {
    return {
      canReadWorkspace: false,
      title: "Coach support notes hidden for this role",
      summary:
        "Coach notes are visible to coaches and HQ support roles, not chapter members, chapter leaders, or DS Admin.",
      chapterName: data.chapter.name,
      decision: data.kpiSummary.coachDecision,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      counts: emptyCounts(),
      interventionChecklist: emptyInterventionChecklist(),
      notes: [],
      finalPrompt: "",
    };
  }

  const visibleAssignments = getVisibleAssignmentsForActor(actor, data.assignments);
  const notes = buildSupportNotes(visibleAssignments, data);
  const interventionChecklist = buildInterventionChecklist(visibleAssignments, data);

  return {
    canReadWorkspace: true,
    title: getTitle(actor),
    summary:
      "A coach-readable note plan for the current chapter: decision rationale, pending proof, risk response, owner check-in, and escalation posture. Saving notes remains disabled until the approved write path is promoted.",
    chapterName: data.chapter.name,
    decision: data.kpiSummary.coachDecision,
    browserWritesEnabled: 0,
    externalWritesEnabled: 0,
    counts: {
      total: notes.length,
      readyForCheckIn: notes.filter((note) => note.status === "ready_for_check_in")
        .length,
      needsFollowUp: notes.filter((note) => note.status === "needs_follow_up").length,
      escalationWatch: notes.filter((note) => note.status === "escalation_watch")
        .length,
      coachPrivate: notes.filter((note) => note.visibility === "coach_private").length,
    },
    interventionChecklist,
    notes,
    finalPrompt:
      "Use these notes to prepare the next coach check-in. Do not save coach notes, send escalation packets, or notify external systems until auth, RLS, audit readback, and the coach decision write path are approved.",
  };
}

function canReadCoachSupportNotes(actor: LocalActorContext): boolean {
  return (
    actor.audience === "coach" ||
    actor.audience === "admin" ||
    actor.audience === "super_admin"
  );
}

function buildSupportNotes(
  assignments: Assignment[],
  data: ReadOnlyAppData,
): CoachSupportNote[] {
  const openAssignments = assignments.filter(
    (assignment) => assignment.status !== "approved",
  );
  const pendingEvidence = data.evidenceItems.filter(
    (item) => item.status !== "approved",
  );
  const activeOwnerCount = assignments.filter((assignment) => {
    return assignment.status === "not_started" || assignment.status === "in_progress";
  }).length;
  const topRisk = pickTopRisk(data.riskFlags);

  return [
    {
      key: "decision_rationale",
      label: "Decision rationale note",
      ownerLane: "Coach",
      visibility: "coach_private",
      status:
        data.kpiSummary.coachDecision === "intervene"
          ? "escalation_watch"
          : data.kpiSummary.coachDecision === "hold"
            ? "needs_follow_up"
            : "ready_for_check_in",
      note: `Current local decision is ${data.kpiSummary.coachDecision}; use proof flow, open work, and KPI movement before confirming the next coach action.`,
      nextStep:
        data.kpiSummary.coachDecision === "advance"
          ? "Confirm no hidden blockers remain before recommending the next chapter push."
          : "Name the blocker that must clear before the chapter can advance.",
      sourceSignals: [
        `${openAssignments.length} open assignment(s) in coach scope`,
        `${data.kpiSummary.proofPending} proof item(s) pending`,
        `${data.kpiSummary.invitePushes} invite push signal(s)`,
      ],
      routeEvidence: ["/coach", "/rush-month/dashboard"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "pending_evidence",
      label: "Pending evidence note",
      ownerLane: "Coach and Chapter Leader",
      visibility: "chapter_follow_up",
      status: pendingEvidence.length > 0 ? "needs_follow_up" : "ready_for_check_in",
      note:
        pendingEvidence.length > 0
          ? `${pendingEvidence.length} proof item(s) need clearer review context before the coach decision should advance.`
          : "No pending proof items are visible in the current read model.",
      nextStep:
        "Review submitted proof, request clearer testimonial context if needed, and keep upload/publish controls disabled.",
      sourceSignals: pendingEvidence.map(
        (item) => `${item.evidenceType.replaceAll("_", " ")}: ${item.status}`,
      ),
      routeEvidence: ["/rush-month/review", "/rush-month/evidence", "/proof-library"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "risk_response",
      label: "Risk response note",
      ownerLane: "Coach",
      visibility: "coach_private",
      status:
        topRisk?.severity === "critical" || topRisk?.severity === "high"
          ? "escalation_watch"
          : "needs_follow_up",
      note:
        topRisk?.signal ??
        "No persisted risk row is visible locally, so keep the coach decision conservative until proof and owner follow-up are clear.",
      nextStep:
        topRisk?.response_plan ??
        "Use the open work and pending proof signals to decide whether to hold or intervene.",
      sourceSignals: [
        topRisk ? `${topRisk.severity} risk: ${topRisk.status}` : "no risk row visible",
      ],
      routeEvidence: ["/coach", "/rush-month/loop"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "owner_check_in",
      label: "Owner check-in note",
      ownerLane: "Coach and E-Board",
      visibility: "chapter_follow_up",
      status: activeOwnerCount > 0 ? "needs_follow_up" : "ready_for_check_in",
      note:
        activeOwnerCount > 0
          ? `${activeOwnerCount} owner(s) still need movement before the next event or invite push.`
          : "Visible owners have no not-started or in-progress work in this local readout.",
      nextStep:
        "Ask leaders which owner, due date, and proof reminder will clear the next blocker.",
      sourceSignals: openAssignments.slice(0, 3).map(
        (assignment) => `${assignment.title}: ${assignment.status.replaceAll("_", " ")}`,
      ),
      routeEvidence: ["/rush-month/actions", "/rush-month/events"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "escalation_packet",
      label: "Escalation packet note",
      ownerLane: "Coach and HQ Operations",
      visibility: "hq_support",
      status:
        data.kpiSummary.coachDecision === "intervene"
          ? "escalation_watch"
          : "ready_for_check_in",
      note:
        data.kpiSummary.coachDecision === "intervene"
          ? "Prepare a private escalation summary for HQ, but keep n8n, email, SMS, and AI sends disabled."
          : "No escalation packet should be sent from the app while the chapter is in local hold or advance posture.",
      nextStep:
        "If intervention is needed, draft the blocker summary inside the approved coach decision flow before any future send is considered.",
      sourceSignals: [
        `decision: ${data.kpiSummary.coachDecision}`,
        "external sends: 0",
      ],
      routeEvidence: ["/coach", "/admin/coach-write"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  ];
}

function buildInterventionChecklist(
  assignments: Assignment[],
  data: ReadOnlyAppData,
): CoachInterventionChecklist {
  const stalledAssignments = assignments.filter((assignment) => {
    return assignment.status === "not_started" || assignment.status === "changes_requested";
  });
  const pendingReviewAssignments = assignments.filter(
    (assignment) => assignment.status === "submitted",
  );
  const pendingEvidence = data.evidenceItems.filter(
    (item) => item.status !== "approved",
  );
  const topRisk = pickTopRisk(data.riskFlags);

  const items: CoachInterventionChecklistItem[] = [
    {
      key: "proof_review",
      label: "Clear proof review",
      status: pendingEvidence.length > 0 ? "watch" : "ready",
      question: "Which proof needs leader or HQ review before the chapter can advance?",
      action:
        pendingEvidence.length > 0
          ? "Open the proof review route and ask leaders to resolve missing context before the next coach decision."
          : "Confirm there are no hidden proof blockers before advancing the chapter.",
      sourceSignal: `${pendingEvidence.length} proof item(s) pending or needing changes`,
      routeEvidence: ["/rush-month/review", "/rush-month/evidence"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "stalled_work",
      label: "Name stalled work",
      status:
        stalledAssignments.length >= 2
          ? "blocked"
          : stalledAssignments.length > 0
            ? "watch"
            : "ready",
      question: "Which assignment is stuck, and who owns the next movement?",
      action:
        stalledAssignments.length > 0
          ? "Ask the chapter leader to name the owner, due date, and proof needed to clear the stalled work."
          : "Confirm the next owner check-in is optional rather than a blocker.",
      sourceSignal: `${stalledAssignments.length} stalled assignment(s), ${pendingReviewAssignments.length} pending review assignment(s)`,
      routeEvidence: ["/rush-month/actions", "/chapter/members"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "decision_note",
      label: "Draft decision note",
      status:
        data.kpiSummary.coachDecision === "intervene"
          ? "blocked"
          : data.kpiSummary.coachDecision === "hold"
            ? "watch"
            : "ready",
      question: `Why is the current coach decision ${data.kpiSummary.coachDecision}?`,
      action:
        data.kpiSummary.coachDecision === "intervene"
          ? "Draft a blocker summary before any future coach decision save is tested."
          : "Write the plain-English reason a coach would hold or advance this chapter.",
      sourceSignal: `coach decision: ${data.kpiSummary.coachDecision}`,
      routeEvidence: ["/coach", "/admin/coach-write"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "risk_response",
      label: "Check risk response",
      status:
        topRisk?.severity === "critical" || topRisk?.severity === "high"
          ? "blocked"
          : "watch",
      question: "Is there a specific risk row or missing risk signal the coach should respond to?",
      action:
        topRisk?.response_plan ??
        "No local risk row is visible, so keep the coach decision conservative until proof and owner follow-up are clear.",
      sourceSignal: topRisk
        ? `${topRisk.severity} risk: ${topRisk.status}`
        : "no risk row visible",
      routeEvidence: ["/coach", "/rush-month/loop"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
    {
      key: "escalation_boundary",
      label: "Keep sends locked",
      status: "ready",
      question: "Will this coach follow-up avoid live escalation, reminders, exports, or AI summaries?",
      action:
        "Keep n8n, email, SMS, warehouse, Power BI, HubSpot, Luma, and AI writes disabled until Nick approves the send policy.",
      sourceSignal: "external sends: 0",
      routeEvidence: ["/coach", "/admin/integration-outbox"],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  ];

  return {
    title: "Coach intervention checklist",
    summary:
      "Use this before a coach check-in to turn proof, stalled work, risk, and KPI posture into one safe hold/intervene plan.",
    items,
    blockedControls: [
      "coach note save",
      "coach decision save",
      "member nudge",
      "escalation packet send",
      "external automation",
    ],
    counts: {
      total: items.length,
      ready: items.filter((item) => item.status === "ready").length,
      watch: items.filter((item) => item.status === "watch").length,
      blocked: items.filter((item) => item.status === "blocked").length,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
    },
  };
}

function pickTopRisk(risks: RiskFlagRow[]): RiskFlagRow | undefined {
  const priority: Record<RiskFlagRow["severity"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...risks]
    .filter((risk) => risk.status !== "resolved" && risk.status !== "dismissed")
    .sort((left, right) => priority[left.severity] - priority[right.severity])[0];
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "coach":
      return "Coach support notes";
    case "admin":
      return "HQ coach support notes";
    case "super_admin":
      return "Full coach support notes";
    case "chapter_member":
    case "chapter_leader":
    case "ds_admin":
      return "Coach support notes hidden for this role";
  }
}

function emptyCounts(): CoachSupportNotesWorkspace["counts"] {
  return {
    total: 0,
    readyForCheckIn: 0,
    needsFollowUp: 0,
    escalationWatch: 0,
    coachPrivate: 0,
  };
}

function emptyInterventionChecklist(): CoachInterventionChecklist {
  return {
    title: "Coach intervention checklist hidden for this role",
    summary:
      "Use a coach or HQ support role to inspect proof, stalled work, risk, and KPI posture.",
    items: [],
    blockedControls: [],
    counts: {
      total: 0,
      ready: 0,
      watch: 0,
      blocked: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
    },
  };
}
