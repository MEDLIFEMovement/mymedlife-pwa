import {
  getProductionInviteBatchReadiness,
} from "./production-invite-batches.ts";
import {
  getProductionRolloutBootstrapReadiness,
  type ProductionBootstrapLaunchOwner,
  type ProductionRolloutBootstrapOptions,
  type ProductionRolloutBootstrapPacket,
} from "./production-rollout-bootstrap.ts";
import {
  getProductionRolloutChapterMatrix,
} from "./production-rollout-chapter-matrix.ts";
import {
  getProductionSignedInRouteProofReadiness,
} from "./production-signed-in-route-proof.ts";

export type ProductionRolloutApprovalSummary = {
  readyForFinalGateReview: boolean;
  title: string;
  counts: {
    activeChapters: number;
    approvedStudentLeaderInvitees: number;
    linkedLumaChapters: number;
    readyPilotEventProofChapters: number;
    plannedInviteBatches: number;
    largestBatchRecipients: number;
    passedSignedInRouteProofRows: number;
  };
  sections: Array<{
    title: string;
    items: string[];
  }>;
  blockers: string[];
  nextSteps: string[];
};

const requiredOwnerTypes: ProductionBootstrapLaunchOwner["ownerType"][] = [
  "support",
  "rollback",
  "production_apply",
];

export function getProductionRolloutApprovalSummary(
  packet: ProductionRolloutBootstrapPacket,
  options: ProductionRolloutBootstrapOptions = {},
): ProductionRolloutApprovalSummary {
  const rolloutReadiness = getProductionRolloutBootstrapReadiness(packet, options);
  const chapterMatrix = getProductionRolloutChapterMatrix(packet, options);
  const inviteBatches = getProductionInviteBatchReadiness(packet, options);
  const routeProof = getProductionSignedInRouteProofReadiness(packet);
  const readyForFinalGateReview =
    rolloutReadiness.ready &&
    chapterMatrix.ready &&
    inviteBatches.ready &&
    routeProof.ready;
  const ownerLines = getOwnerSignoffLines(packet);
  const blockers = [
    ...getHighLevelBlockers({
      packetReady: rolloutReadiness.ready,
      chapterMatrixReady: chapterMatrix.ready,
      inviteBatchesReady: inviteBatches.ready,
      routeProofReady: routeProof.ready,
    }),
    ...chapterMatrix.blockers,
    ...inviteBatches.blockers.map(redactEmails),
    ...routeProof.blockers.map(redactEmails),
  ];

  return {
    readyForFinalGateReview,
    title: readyForFinalGateReview
      ? "30-chapter approval summary: READY FOR FINAL GATE REVIEW"
      : "30-chapter approval summary: NOT READY",
    counts: {
      activeChapters: rolloutReadiness.counts.activeChapters,
      approvedStudentLeaderInvitees:
        rolloutReadiness.counts.approvedStudentMemberships,
      linkedLumaChapters: rolloutReadiness.counts.linkedLumaCalendars,
      readyPilotEventProofChapters:
        rolloutReadiness.counts.readyPilotEventProofChapters,
      plannedInviteBatches: inviteBatches.counts.plannedBatches,
      largestBatchRecipients: inviteBatches.counts.largestBatchRecipients,
      passedSignedInRouteProofRows: routeProof.counts.passedProofRows,
    },
    sections: [
      {
        title: "What this summary is",
        items: [
          "Redacted human approval artifact for the 30-chapter rollout packet.",
          "Does not create users, write Supabase rows, call Luma, send invites, or enable integrations.",
          "Does not replace production:invite-gate, production live-data counts, or final owner signoff.",
        ],
      },
      {
        title: "Chapter readiness",
        items: chapterMatrix.rows.map((row) =>
          [
            row.chapterName,
            `${row.inviteeCount} invitee(s)`,
            row.coreReady ? "core ready" : "core gaps",
            row.hasReadyPilotEventProof ? "pilot proof recorded" : "pilot proof not recorded",
            row.finalProofReady ? "route proof ok" : "route proof gap",
          ].join(" - "),
        ),
      },
      {
        title: "Invite batch preview",
        items: inviteBatches.batches.map((batch) =>
          `Batch ${batch.number} ${batch.kind}: ${batch.chapterCount} chapter(s), ${batch.recipientCount} recipient(s)`,
        ),
      },
      {
        title: "Owner signoff posture",
        items: ownerLines,
      },
      {
        title: "Final-gate commands still required",
        items: [
          "pnpm production:smoke https://www.mymedlife.org",
          "pnpm production:data-counts --out production-live-data-counts.txt",
          "pnpm production:invite-batches --packet production-rollout-packet.json --out production-invite-batches.md",
          "pnpm production:invite-gate --packet production-rollout-packet.json --live-data-counts production-live-data-counts.txt --public-url https://www.mymedlife.org --out production-invite-gate.md",
        ],
      },
    ],
    blockers: [...new Set(blockers)],
    nextSteps: readyForFinalGateReview
      ? [
          "Run public production smoke, production live-data counts, and the final invite gate.",
          "Have the support, rollback, production apply, and launch decision owners sign off before batch 1.",
          "Invite only batch 1 first, then pause for support and audit review before expanding.",
        ]
      : [
          "Fix the blockers shown below.",
          "Rebuild the production rollout packet from the corrected CSVs.",
          "Re-run the redacted approval summary before asking for final signoff.",
        ],
  };
}

export function formatProductionRolloutApprovalSummary(
  summary: ProductionRolloutApprovalSummary,
): string {
  return [
    summary.title,
    "",
    "Counts:",
    `- active chapters: ${summary.counts.activeChapters}`,
    `- approved student/leader invitees: ${summary.counts.approvedStudentLeaderInvitees}`,
    `- linked Luma chapters: ${summary.counts.linkedLumaChapters}`,
    `- ready pilot event-loop chapters: ${summary.counts.readyPilotEventProofChapters}`,
    `- planned invite batches: ${summary.counts.plannedInviteBatches}`,
    `- largest batch recipients: ${summary.counts.largestBatchRecipients}`,
    `- passed signed-in route proof rows: ${summary.counts.passedSignedInRouteProofRows}`,
    "",
    ...summary.sections.flatMap((section) => [
      `${section.title}:`,
      ...formatList(section.items, "None"),
      "",
    ]),
    "Blockers:",
    ...formatList(summary.blockers, "None"),
    "",
    "Next steps:",
    ...formatList(summary.nextSteps, "None"),
  ].join("\n");
}

function getOwnerSignoffLines(packet: ProductionRolloutBootstrapPacket) {
  const activeOwners = (packet.launchOwners ?? []).filter(
    (owner) => (owner.status ?? "active") === "active",
  );

  return [
    ...requiredOwnerTypes.map((ownerType) =>
      activeOwners.some((owner) => owner.ownerType === ownerType)
        ? `${formatOwnerType(ownerType)} owner is named`
        : `${formatOwnerType(ownerType)} owner is missing`,
    ),
    activeOwners.some((owner) => owner.ownerType === "launch_decision")
      ? "Launch decision owner is named"
      : "Launch decision owner is recommended but missing",
  ];
}

function getHighLevelBlockers(input: {
  packetReady: boolean;
  chapterMatrixReady: boolean;
  inviteBatchesReady: boolean;
  routeProofReady: boolean;
}) {
  const blockers: string[] = [];

  if (!input.packetReady) {
    blockers.push("Rollout packet is not ready.");
  }

  if (!input.chapterMatrixReady) {
    blockers.push("One or more chapters still have launch data gaps.");
  }

  if (!input.inviteBatchesReady) {
    blockers.push("Invite batches are not ready.");
  }

  if (!input.routeProofReady) {
    blockers.push("Signed-in route proof is not ready.");
  }

  return blockers;
}

function redactEmails(value: string) {
  return value.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    "<redacted-email>",
  );
}

function formatOwnerType(ownerType: ProductionBootstrapLaunchOwner["ownerType"]) {
  return ownerType.replace("_", " ");
}

function formatList(items: string[], fallback: string) {
  return items.length > 0 ? items.map((item) => `- ${item}`) : [`- ${fallback}`];
}
