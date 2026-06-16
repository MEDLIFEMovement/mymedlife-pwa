import {
  getActionCommittees,
  getEventPlansForCampaign,
} from "@/services/campaign-ops-service";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ChapterEventPlan } from "@/shared/types/campaigns";

export type EventProofBridgeMode =
  | "member"
  | "committee_member"
  | "committee_chair"
  | "chapter_leader"
  | "coach"
  | "admin"
  | "ds_admin"
  | "super_admin";

export type EventProofBridgeStep = {
  label: string;
  detail: string;
  futureEventType: string;
};

export type EventProofBridgeRow = {
  eventId: string;
  title: string;
  committeeName: string;
  timing: string;
  lumaStatusLabel: string;
  expectedStudentAction: string;
  feedbackPrompt: string;
  proofPrompt: string;
  steps: EventProofBridgeStep[];
};

export type EventProofBridgeWorkspace = {
  canReadWorkspace: boolean;
  mode: EventProofBridgeMode;
  title: string;
  summary: string;
  primaryCta: {
    href: string;
    label: string;
  };
  rows: EventProofBridgeRow[];
  futureStructuredEvents: string[];
  disabledOutboxDestinations: string[];
  safetyNotes: string[];
};

export function getEventProofBridgeWorkspace(
  actor: LocalActorContext,
  eventPlans: ChapterEventPlan[] = getEventPlansForCampaign("rush-month"),
): EventProofBridgeWorkspace {
  const mode = getEventProofBridgeMode(actor);

  if (mode === "ds_admin") {
    return hiddenBridgeWorkspace();
  }

  return {
    canReadWorkspace: true,
    mode,
    ...getBridgeCopy(mode),
    rows: getVisibleBridgeEvents(mode, eventPlans).map(toEventProofBridgeRow),
    futureStructuredEvents: [
      "chapter_event_attended",
      "luma_attendance_import_mocked",
      "event_feedback_submitted",
      "kpi_event_recorded",
      "evidence_submitted",
      "proof_consent_recorded",
      "automation_outbox_recorded",
      "audit_log_recorded",
    ],
    disabledOutboxDestinations: [
      "Luma check-in import disabled",
      "n8n NPS reminder disabled",
      "warehouse event export disabled",
      "Power BI refresh disabled",
      "AI proof summary disabled",
    ],
    safetyNotes: [
      "This is a member-facing bridge, not a live attendance write.",
      "No Luma attendance, NPS reminder, proof upload, public sharing, or external export runs from this page.",
      "Proof remains a testimonial or bridge-video posture until upload/storage and HQ review are approved.",
    ],
  };
}

function toEventProofBridgeRow(eventPlan: ChapterEventPlan): EventProofBridgeRow {
  return {
    eventId: eventPlan.id,
    title: eventPlan.title,
    committeeName: getCommitteeName(eventPlan.committeeId),
    timing: eventPlan.timing,
    lumaStatusLabel: eventPlan.lumaStatus.replaceAll("_", " "),
    expectedStudentAction: eventPlan.expectedStudentAction,
    feedbackPrompt: eventPlan.npsQuestion,
    proofPrompt: eventPlan.proofPrompt,
    steps: [
      {
        label: "Show up or support the event",
        detail: eventPlan.expectedStudentAction,
        futureEventType: "chapter_event_attended",
      },
      {
        label: "Answer the feedback prompt",
        detail: eventPlan.npsQuestion,
        futureEventType: "event_feedback_submitted",
      },
      {
        label: "Prepare proof/testimonial context",
        detail: eventPlan.proofPrompt,
        futureEventType: "evidence_submitted",
      },
    ],
  };
}

function getEventProofBridgeMode(actor: LocalActorContext): EventProofBridgeMode {
  if (actor.chapterRoles.includes("Action Committee Chair")) {
    return "committee_chair";
  }

  if (actor.chapterRoles.includes("Action Committee Member")) {
    return "committee_member";
  }

  switch (actor.audience) {
    case "chapter_leader":
      return "chapter_leader";
    case "coach":
      return "coach";
    case "admin":
      return "admin";
    case "ds_admin":
      return "ds_admin";
    case "super_admin":
      return "super_admin";
    case "chapter_member":
    default:
      return "member";
  }
}

function getBridgeCopy(mode: Exclude<EventProofBridgeMode, "ds_admin">) {
  switch (mode) {
    case "committee_member":
      return {
        title: "Support the event, then help capture proof.",
        summary:
          "Committee members should know the event action, the feedback prompt, and the story to ask for afterward.",
        primaryCta: {
          href: "/proof-library/upload",
          label: "Preview proof intake",
        },
      };
    case "committee_chair":
      return {
        title: "Close the loop after the event.",
        summary:
          "Committee chairs should make sure attendance, feedback, proof, and owner follow-up are ready before the event is considered complete.",
        primaryCta: {
          href: "/action-committees",
          label: "Open committee workspace",
        },
      };
    case "chapter_leader":
      return {
        title: "Make every event produce learning.",
        summary:
          "Leaders should connect event attendance, NPS feedback, proof/testimonials, and follow-up assignments before reviewing progress.",
        primaryCta: {
          href: "/rush-month/review",
          label: "Open review queue",
        },
      };
    case "coach":
      return {
        title: "Use event follow-through as a health signal.",
        summary:
          "Coaches should watch whether the chapter turns events into feedback, proof, KPIs, and a clear advance/hold/intervene decision.",
        primaryCta: {
          href: "/coach",
          label: "Open coach readout",
        },
      };
    case "admin":
      return {
        title: "Review proof posture before sharing.",
        summary:
          "HQ can inspect how event proof should flow into review without publishing proof or exporting raw files.",
        primaryCta: {
          href: "/proof-library",
          label: "Open proof library",
        },
      };
    case "super_admin":
      return {
        title: "Inspect the full event-to-proof loop.",
        summary:
          "Super Admin can review the whole local bridge from event action to disabled outbox posture.",
        primaryCta: {
          href: "/admin",
          label: "Open admin safety",
        },
      };
    case "member":
    default:
      return {
        title: "Attend, reflect, and share what mattered.",
        summary:
          "Members should know what to do at a Rush Month event and what kind of testimonial or bridge-video proof may be useful afterward.",
        primaryCta: {
          href: "/proof-library/upload",
          label: "Preview proof intake",
        },
      };
  }
}

function getVisibleBridgeEvents(
  mode: EventProofBridgeMode,
  eventPlans: ChapterEventPlan[],
): ChapterEventPlan[] {
  if (mode === "ds_admin") {
    return [];
  }

  if (mode === "committee_chair") {
    return eventPlans.filter((eventPlan) => eventPlan.ownerRole === "Action Committee Chair");
  }

  return eventPlans;
}

function getCommitteeName(committeeId: string): string {
  return (
    getActionCommittees().find((committee) => committee.id === committeeId)?.name ??
    "Action Committee"
  );
}

function hiddenBridgeWorkspace(): EventProofBridgeWorkspace {
  return {
    canReadWorkspace: false,
    mode: "ds_admin",
    title: "Event proof bridge hidden for DS Admin",
    summary:
      "DS Admin can inspect disabled integration posture, but should not read student attendance, feedback, proof, point, KPI, or campaign truth.",
    primaryCta: {
      href: "/admin",
      label: "Open integration outbox",
    },
    rows: [],
    futureStructuredEvents: [],
    disabledOutboxDestinations: [],
    safetyNotes: [],
  };
}
