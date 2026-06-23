import type { Assignment } from "@/shared/types/domain";

export type MemberActionDetailWorkspace = {
  campaignLabel: string;
  statusLabel: string;
  title: string;
  dueLabel: string;
  assignedByLabel: string;
  pointsApprovalLabel: string;
  appliesToLabel: string;
  submitEvidenceHref: string;
  submitEvidenceLabel: string;
  whyItMattersTitle: string;
  whyItMattersBody: string;
  stepsTitle: string;
  steps: string[];
  evidenceTitle: string;
  evidenceItems: Array<{
    label: string;
    detail: string;
  }>;
  helperLabel: string;
  previewAssignment: {
    title: string;
    evidenceRequired: string;
    points: number;
  };
};

export function getMemberActionDetailWorkspace(
  assignment: Assignment,
): MemberActionDetailWorkspace {
  const submitEvidenceHref = `/rush-month/actions/${assignment.id}?step=submit#submit-evidence`;

  if (assignment.id === "member-push") {
    return {
      campaignLabel: "Rush Month",
      statusLabel: "Not started",
      title: "Invite 3 friends to the Intro GBM",
      dueLabel: "Due Nov 15",
      assignedByLabel: "Assigned by Marcus T.",
      pointsApprovalLabel: "30 points if approved",
      appliesToLabel: "Applies to: Rush Month · Lead Capture KPI",
      submitEvidenceHref,
      submitEvidenceLabel: "Submit evidence",
      whyItMattersTitle: "Why This Matters",
      whyItMattersBody:
        "Personal invites convert at 3x higher than flyers. You reaching out to 3 friends directly can change whether they join a movement that improves healthcare access globally.",
      stepsTitle: "Step-by-Step Instructions",
      steps: [
        "Think of 3 friends who care about global health, medicine, or community service.",
        "Send them a personal message — DM, text, or in person. Share the Luma link.",
        "Screenshot or note their RSVP confirmation to submit as evidence.",
      ],
      evidenceTitle: "Evidence Required",
      evidenceItems: [
        {
          label: "Screenshot",
          detail: "Screenshot of RSVP confirmation or messages sent",
        },
        {
          label: "Short update",
          detail: "Who did you invite? Did they RSVP?",
        },
      ],
      helperLabel: "Not sure what to do? Ask your chapter leader",
      previewAssignment: {
        title: "Invite 3 friends to the Intro GBM",
        evidenceRequired: "Screenshot of RSVP confirmation or messages sent",
        points: assignment.points,
      },
    };
  }

  return {
    campaignLabel: "Rush Month",
    statusLabel: assignment.status.replaceAll("_", " "),
    title: assignment.title,
    dueLabel: `Due ${assignment.dueLabel}`,
    assignedByLabel: `Assigned to ${assignment.ownerRole}`,
    pointsApprovalLabel: `${assignment.points} points if approved`,
    appliesToLabel: `Applies to: Rush Month · ${assignment.kpi}`,
    submitEvidenceHref,
    submitEvidenceLabel: "Submit evidence",
    whyItMattersTitle: "Why This Matters",
    whyItMattersBody:
      "This action matters when it creates one believable chapter movement and one clean proof handoff for review.",
    stepsTitle: "Step-by-Step Instructions",
    steps: [
      assignment.instructions,
      `Capture proof that answers this requirement: ${assignment.evidenceRequired}`,
      "Confirm the proof is accurate before you submit the evidence preview.",
    ],
    evidenceTitle: "Evidence Required",
    evidenceItems: [
      {
        label: "Required proof",
        detail: assignment.evidenceRequired,
      },
    ],
    helperLabel: "Not sure what to do? Ask your chapter leader",
    previewAssignment: {
      title: assignment.title,
      evidenceRequired: assignment.evidenceRequired,
      points: assignment.points,
    },
  };
}
