import {
  getEventPlansForCampaign,
  getProofLibraryItemsForCampaign,
} from "@/services/campaign-ops-service";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { getAssignmentStatusCounts } from "@/services/rush-month-dashboard-service";

export type CampaignReadinessState =
  | "advance_ready"
  | "hold_for_follow_up"
  | "intervention_needed";

export type CampaignCloseoutStatus = "ready" | "needs_work" | "blocked" | "mocked";

export type CampaignCloseoutRow = {
  key: string;
  label: string;
  status: CampaignCloseoutStatus;
  owner: "Leader" | "HQ" | "Coach" | "System";
  actionNeeded: string;
};

export type CampaignCloseoutReadiness = {
  canReadCloseout: boolean;
  title: string;
  summary: string;
  readinessState: CampaignReadinessState;
  rows: CampaignCloseoutRow[];
  counts: {
    approvedAssignments: number;
    totalAssignments: number;
    proofPending: number;
    eventPlans: number;
    closeoutWritesEnabled: 0;
    externalExportsEnabled: 0;
  };
};

export function getCampaignCloseoutReadiness(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
  campaignSlug = "rush-month",
): CampaignCloseoutReadiness {
  if (actor.audience === "chapter_member" || actor.audience === "ds_admin") {
    return {
      canReadCloseout: false,
      title: "Campaign closeout hidden for this role",
      summary:
        "Members see simple progress and recognition. DS Admin sees integration posture only.",
      readinessState: "hold_for_follow_up",
      rows: [],
      counts: emptyCounts(),
    };
  }

  const assignmentCounts = getAssignmentStatusCounts(data.assignments);
  const proofItems = getProofLibraryItemsForCampaign(campaignSlug);
  const eventPlans = getEventPlansForCampaign(campaignSlug);
  const incompleteAssignments =
    data.assignments.length - assignmentCounts.approved;
  const readinessState = getReadinessState(data, incompleteAssignments);

  return {
    canReadCloseout: true,
    title: getTitle(actor),
    summary:
      "This local readout previews whether Rush Month has enough assignment, proof, event, and coach-decision evidence to close out the phase.",
    readinessState,
    rows: [
      {
        key: "assignments",
        label: "Assignment completion",
        status: incompleteAssignments === 0 ? "ready" : "needs_work",
        owner: "Leader",
        actionNeeded:
          incompleteAssignments === 0
            ? "Assignments are complete enough for closeout review."
            : "Leaders should clear open assignments before requesting closeout.",
      },
      {
        key: "proof",
        label: "Proof/testimonial posture",
        status: data.kpiSummary.proofPending === 0 ? "ready" : "needs_work",
        owner: "HQ",
        actionNeeded:
          data.kpiSummary.proofPending === 0
            ? "Proof posture is ready for learning review."
            : "HQ should review proof/testimonials before the phase is treated as complete.",
      },
      {
        key: "events",
        label: "Event feedback and NPS",
        status: eventPlans.length > 0 ? "mocked" : "blocked",
        owner: "System",
        actionNeeded:
          eventPlans.length > 0
            ? "Event and feedback posture exists locally; Luma/NPS imports remain mocked."
            : "No event plan is visible for this campaign shell.",
      },
      {
        key: "coach",
        label: "Coach advance / hold / intervene",
        status:
          data.kpiSummary.coachDecision === "advance"
            ? "ready"
            : data.kpiSummary.coachDecision === "intervene"
              ? "blocked"
              : "needs_work",
        owner: "Coach",
        actionNeeded:
          data.kpiSummary.coachDecision === "advance"
            ? "Coach can consider advance once open follow-up is cleared."
            : "Coach should keep the chapter in hold/intervene until blockers are resolved.",
      },
    ],
    counts: {
      approvedAssignments: assignmentCounts.approved,
      totalAssignments: data.assignments.length,
      proofPending: proofItems.filter(
        (item) => item.sharingStatus === "needs_hq_review",
      ).length,
      eventPlans: eventPlans.length,
      closeoutWritesEnabled: 0,
      externalExportsEnabled: 0,
    },
  };
}

function getReadinessState(
  data: ReadOnlyAppData,
  incompleteAssignments: number,
): CampaignReadinessState {
  if (data.kpiSummary.coachDecision === "intervene") {
    return "intervention_needed";
  }

  if (incompleteAssignments > 0 || data.kpiSummary.proofPending > 0) {
    return "hold_for_follow_up";
  }

  return "advance_ready";
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_leader":
      return "Leader closeout readiness";
    case "coach":
      return "Coach closeout readiness";
    case "admin":
      return "HQ closeout readiness";
    case "super_admin":
      return "Full local closeout readiness";
    case "chapter_member":
    case "ds_admin":
      return "Campaign closeout hidden for this role";
  }
}

function emptyCounts(): CampaignCloseoutReadiness["counts"] {
  return {
    approvedAssignments: 0,
    totalAssignments: 0,
    proofPending: 0,
    eventPlans: 0,
    closeoutWritesEnabled: 0,
    externalExportsEnabled: 0,
  };
}
