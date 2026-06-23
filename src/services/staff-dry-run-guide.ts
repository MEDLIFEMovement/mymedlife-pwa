import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";
import {
  getWriteSequencePlanner,
  type WriteSequenceOperation,
} from "@/services/write-sequence-planner";

type EnvSource = Record<string, string | undefined>;

export type StaffDryRunStep = {
  id: string;
  title: string;
  route: string;
  localActorEmail: string;
  actorLabel: string;
  rehearsalGoal: string;
  passCriteria: string[];
  safetyAssertion: string;
  structuredEventsToNotice: string[];
};

export type StaffDryRunWriteRehearsalStep = {
  operation: WriteSequenceOperation["key"];
  label: string;
  packetRoute: string;
  operatingRoute: string;
  localActorEmail: string;
  actorLabel: string;
  roleResponsibility: {
    roleLabel: string;
    responsibility: string;
    reviewPrompt: string;
    safetyBoundary: string;
  };
  packetStatus: string;
  packetDecision: string;
  observedReadbackItems: number;
  canPromoteToStagingReview: boolean;
  packetBrowserWritesExpected: 0 | 1;
  externalWritesExpected: 0;
  rehearsalAction: string;
  stopCondition: string;
};

export type StaffDryRunWriteRehearsal = {
  title: string;
  summary: string;
  steps: StaffDryRunWriteRehearsalStep[];
  counts: {
    steps: number;
    readyOrObserved: number;
    blocked: number;
    localBrowserWriteCandidates: number;
    externalWritesExpected: 0;
  };
};

export type StaffDryRunGuide = {
  canReadGuide: boolean;
  title: string;
  verdict: "ready_for_staff_dry_run";
  summary: string;
  staffInstructions: string[];
  writeRehearsal: StaffDryRunWriteRehearsal;
  steps: StaffDryRunStep[];
  counts: {
    steps: number;
    passCriteria: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

export function getStaffDryRunGuide(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  env: EnvSource = process.env,
): StaffDryRunGuide {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadGuide: false,
      title: "Staff dry run hidden for this role",
      verdict: "ready_for_staff_dry_run",
      summary:
        "Staff dry-run instructions are for HQ review contexts, not student or chapter operating routes.",
      staffInstructions: [],
      writeRehearsal: emptyWriteRehearsal(),
      steps: [],
      counts: emptyCounts(),
    };
  }

  const steps = getDryRunSteps();
  const writeRehearsal = buildWriteRehearsal(actor, data, env);

  return {
    canReadGuide: true,
    title: getTitle(surfaceFamily),
    verdict: "ready_for_staff_dry_run",
    summary:
      "Use this guide to rehearse the Rush Month MVP with fake users before staging, real student data, uploads, production writes, or integrations are approved.",
    staffInstructions: [
      "Run each step with the listed fake local actor email.",
      "Record whether each pass criterion is true in the staff review notes.",
      "Stop the dry run if any route implies real students, real uploads, production data, public proof, or external automation is active.",
      "Treat this as rehearsal evidence only. It does not approve a student pilot.",
    ],
    writeRehearsal,
    steps,
    counts: {
      steps: steps.length,
      passCriteria: steps.reduce(
        (total, step) => total + step.passCriteria.length,
        0,
      ),
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function getDryRunSteps(): StaffDryRunStep[] {
  return [
    {
      id: "admin-preflight",
      title: "Confirm the staff-only safety posture",
      route: "/admin",
      localActorEmail: "admin@mymedlife.test",
      actorLabel: "Admin",
      rehearsalGoal:
        "Start by confirming local review is allowed while real launch remains blocked.",
      passCriteria: [
        "Release readiness says local review is ready but live launch is not.",
        "Controlled pilot gate says staff dry run is ready but student pilot is blocked.",
        "Environment safety shows zero external sends.",
      ],
      safetyAssertion:
        "No production auth, browser writes, uploads, public proof, or external sends should be enabled.",
      structuredEventsToNotice: [
        "audit_log_recorded",
        "automation_outbox_recorded",
      ],
    },
    {
      id: "member-week",
      title: "Rehearse the member week",
      route: "/rush-month/dashboard",
      localActorEmail: "member.a@mymedlife.test",
      actorLabel: "General Member",
      rehearsalGoal:
        "Check whether a student can tell what to do next, see recognition, and understand chapter impact.",
      passCriteria: [
        "Member sees their next action without reading a long SOP.",
        "Points and recognition are understandable as local/mock posture.",
        "Leadership-only KPIs and integration controls stay hidden.",
      ],
      safetyAssertion:
        "No points ledger write, browser save, proof upload, or external send should happen.",
      structuredEventsToNotice: ["action_started", "points_awarded"],
    },
    {
      id: "leader-follow-up",
      title: "Rehearse leader follow-up",
      route: "/rush-month/actions",
      localActorEmail: "leader.a@mymedlife.test",
      actorLabel: "Chapter Leader",
      rehearsalGoal:
        "Check whether a chapter leader can see owner follow-up, assignment posture, and disabled creation gates.",
      passCriteria: [
        "Leader can identify who owns the next action.",
        "Leader can see follow-up needs and proof/testimonial posture.",
        "Assignment creation and reminders are visibly disabled.",
      ],
      safetyAssertion:
        "No assignment creation, reminder send, or browser write should happen.",
      structuredEventsToNotice: ["action_assigned", "audit_log_recorded"],
    },
    {
      id: "event-nps",
      title: "Rehearse event and NPS readiness",
      route: "/rush-month/events",
      localActorEmail: "leader.a@mymedlife.test",
      actorLabel: "Chapter Leader",
      rehearsalGoal:
        "Check whether action committee event plans, NPS prompts, proof prompts, and disabled Luma posture are clear.",
      passCriteria: [
        "Event owners and student actions are clear.",
        "NPS and proof prompts explain what will be collected later.",
        "Luma writes, attendance imports, reminders, and warehouse exports are disabled.",
      ],
      safetyAssertion:
        "No Luma event write, attendance import, NPS reminder, n8n workflow, or warehouse export should happen.",
      structuredEventsToNotice: [
        "luma_event_linked",
        "luma_attendance_import_mocked",
        "kpi_event_recorded",
      ],
    },
    {
      id: "proof-intake",
      title: "Rehearse proof upload intake",
      route: "/proof-library/upload",
      localActorEmail: "member.a@mymedlife.test",
      actorLabel: "General Member",
      rehearsalGoal:
        "Check whether a student understands consent, file expectations, and why uploads are still locked.",
      passCriteria: [
        "Consent and context requirements are plain English.",
        "Upload, publish, export, and AI controls remain disabled.",
        "HQ ownership of future sharing decisions is clear.",
      ],
      safetyAssertion:
        "No file upload, storage object, public URL, external export, or AI summary should happen.",
      structuredEventsToNotice: [
        "proof_upload_requested",
        "evidence_submitted",
        "proof_consent_recorded",
      ],
    },
    {
      id: "hq-proof-review",
      title: "Rehearse HQ proof review",
      route: "/proof-library",
      localActorEmail: "admin@mymedlife.test",
      actorLabel: "Admin",
      rehearsalGoal:
        "Check whether HQ can understand proof/testimonial sharing posture without public publishing.",
      passCriteria: [
        "Proof states distinguish internal learning, future public review, private, and needs-context items.",
        "Public publishing and warehouse export stay disabled.",
        "Chapter leaders do not own network-wide proof-sharing decisions.",
      ],
      safetyAssertion:
        "No public proof publish, HQ decision save, warehouse export, or AI summary should happen.",
      structuredEventsToNotice: [
        "hq_sharing_decision_logged",
        "evidence_approved",
        "evidence_rejected",
      ],
    },
    {
      id: "coach-readout",
      title: "Rehearse coach readout",
      route: "/coach",
      localActorEmail: "coach@mymedlife.test",
      actorLabel: "Coach",
      rehearsalGoal:
        "Check whether a coach can read risk, readiness, overdue work, proof posture, and advance/hold/intervene state.",
      passCriteria: [
        "Coach sees portfolio health and risk posture.",
        "Coach decision controls remain disabled.",
        "Escalation packet and reassignment sends remain disabled.",
      ],
      safetyAssertion:
        "No coach decision save, coach reassignment, n8n packet, or external send should happen.",
      structuredEventsToNotice: ["coach_decision_logged", "audit_log_recorded"],
    },
    {
      id: "ds-safety",
      title: "Rehearse DS Admin safety readout",
      route: "/admin",
      localActorEmail: "ds.admin@mymedlife.test",
      actorLabel: "DS Admin",
      rehearsalGoal:
        "Check whether DS Admin can inspect disabled outbox posture without owning student truth.",
      passCriteria: [
        "DS Admin sees integration/outbox safety rather than student operating truth.",
        "External sends stay at zero.",
        "Real HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes remain disabled.",
      ],
      safetyAssertion:
        "DS Admin should not change memberships, roles, assignments, proof decisions, points, KPIs, or campaign status.",
      structuredEventsToNotice: [
        "integration_event_recorded",
        "automation_outbox_recorded",
      ],
    },
  ];
}

function buildWriteRehearsal(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  env: EnvSource,
): StaffDryRunWriteRehearsal {
  const planner = getWriteSequencePlanner(actor, data, env);
  const steps = planner.operations.map(toWriteRehearsalStep);

  return {
    title: "Seven local write rehearsal",
    summary:
      "Use these packets to rehearse the guarded Rush Month local writes and the separate membership approval readiness packet in order. This section is a checklist and status mirror, not a write console.",
    steps,
    counts: {
      steps: steps.length,
      readyOrObserved: steps.filter((step) => isReadyOrObserved(step)).length,
      blocked: steps.filter((step) => !isReadyOrObserved(step)).length,
      localBrowserWriteCandidates: steps.length,
      externalWritesExpected: 0,
    },
  };
}

function toWriteRehearsalStep(
  operation: WriteSequenceOperation,
): StaffDryRunWriteRehearsalStep {
  return {
    operation: operation.key,
    label: operation.packetStatus.label,
    packetRoute: operation.packetStatus.route,
    operatingRoute: getOperatingRoute(operation),
    localActorEmail: operation.localActorEmail,
    actorLabel: operation.actorLabel,
    roleResponsibility: operation.roleResponsibility,
    packetStatus: operation.packetStatus.status,
    packetDecision: operation.packetStatus.plainEnglish,
    observedReadbackItems: operation.packetStatus.observedReadbackItems,
    canPromoteToStagingReview:
      operation.packetStatus.canPromoteToStagingReview,
    packetBrowserWritesExpected: operation.packetStatus.browserWritesExpected,
    externalWritesExpected: operation.packetStatus.externalWritesExpected,
    rehearsalAction: getRehearsalAction(operation),
    stopCondition: getStopCondition(operation),
  };
}

function getOperatingRoute(operation: WriteSequenceOperation): string {
  switch (operation.key) {
    case "action_started":
    case "evidence_submitted":
      return operation.route;
    case "leader_proof_decision_logged":
      return "/rush-month/review";
    case "hq_sharing_decision_logged":
      return "/rush-month/review";
    case "action_assigned":
      return "/rush-month/actions";
    case "coach_decision_logged":
      return "/coach";
    case "membership_approved":
      return "/chapter/members";
  }
}

function getRehearsalAction(operation: WriteSequenceOperation): string {
  switch (operation.key) {
    case "action_started":
      return "Open the action-start packet, sign in as the fake member, and start one assignment only if the packet says the local write is ready.";
    case "evidence_submitted":
      return "Open the proof metadata packet and rehearse testimonial metadata only; do not upload files or publish proof.";
    case "leader_proof_decision_logged":
      return "Open the leader proof decision panel only after Goal 115 SQL/RLS tests pass, then rehearse one local approve, request-changes, or reject decision with member nudges disabled.";
    case "hq_sharing_decision_logged":
      return "Open the HQ proof decision packet and rehearse the sharing posture decision without publishing proof publicly.";
    case "action_assigned":
      return "Open the leader assignment packet and rehearse one chapter-scoped assignment without reminders or external handoffs.";
    case "coach_decision_logged":
      return "Open the coach decision packet and rehearse advance / hold / intervene without escalation sends.";
    case "membership_approved":
      return "Open the membership approval readiness packet and rehearse one join-request approval without changing access, sending welcome messages, or syncing CRM.";
  }
}

function getStopCondition(operation: WriteSequenceOperation): string {
  return `${operation.safetyBoundary} Stop if the route implies production data, public proof, reminders, escalation packets, or external automation are active.`;
}

function isReadyOrObserved(step: StaffDryRunWriteRehearsalStep): boolean {
  return (
    step.canPromoteToStagingReview ||
    step.observedReadbackItems > 0 ||
    step.packetStatus.includes("ready")
  );
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "staff":
      return "Admin staff dry-run guide";
    case "ds_admin":
      return "DS Admin staff dry-run safety guide";
    case "super_admin":
      return "Full staff dry-run guide";
    case "member":
    case "leader":
    case "coach":
      return "Staff dry run hidden for this role";
  }
}

function emptyWriteRehearsal(): StaffDryRunWriteRehearsal {
  return {
    title: "Seven local write rehearsal hidden for this role",
    summary:
      "Write rehearsal packets are HQ safety surfaces, not student or chapter operating views.",
    steps: [],
    counts: {
      steps: 0,
      readyOrObserved: 0,
      blocked: 0,
      localBrowserWriteCandidates: 0,
      externalWritesExpected: 0,
    },
  };
}

function emptyCounts(): StaffDryRunGuide["counts"] {
  return {
    steps: 0,
    passCriteria: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
