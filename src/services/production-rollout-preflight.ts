import {
  formatProductionInviteBatchReadiness,
  getProductionInviteBatchReadiness,
} from "./production-invite-batches.ts";
import {
  formatProductionLumaMappingReadiness,
  getProductionLumaMappingReadiness,
} from "./production-luma-mapping-readiness.ts";
import {
  formatProductionPilotEventProofReadiness,
  getProductionPilotEventProofReadiness,
} from "./production-pilot-event-proof.ts";
import type {
  ProductionRolloutBootstrapOptions,
  ProductionRolloutBootstrapPacket,
} from "./production-rollout-bootstrap.ts";
import {
  formatProductionRolloutChapterMatrix,
  getProductionRolloutChapterMatrix,
} from "./production-rollout-chapter-matrix.ts";
import {
  formatProductionRolloutIntakeStatus,
  getProductionRolloutIntakeStatus,
} from "./production-rollout-intake-status.ts";
import {
  formatProductionSignedInRouteProofReadiness,
  getProductionSignedInRouteProofReadiness,
} from "./production-signed-in-route-proof.ts";

type ProductionRolloutPreflightStageKey =
  | "csv_intake"
  | "chapter_matrix"
  | "luma_mapping"
  | "pilot_event_proof"
  | "signed_in_route_proof"
  | "invite_batches";

export type ProductionRolloutPreflightStage = {
  key: ProductionRolloutPreflightStageKey;
  label: string;
  ready: boolean;
  report: string;
};

export type ProductionRolloutPreflightOptions =
  ProductionRolloutBootstrapOptions & {
    maxRecipientsPerBatch?: number;
    runtimeMappingJson?: string | null;
  };

export type ProductionRolloutPreflight = {
  ready: boolean;
  stages: ProductionRolloutPreflightStage[];
  nextSteps: string[];
};

export function getProductionRolloutPreflight(
  packet: ProductionRolloutBootstrapPacket,
  options: ProductionRolloutPreflightOptions = {},
): ProductionRolloutPreflight {
  const intakeStatus = getProductionRolloutIntakeStatus(packet, options);
  const chapterMatrix = getProductionRolloutChapterMatrix(packet, options);
  const lumaMapping = getProductionLumaMappingReadiness(packet, {
    ...options,
    runtimeMappingJson: options.runtimeMappingJson ?? null,
  });
  const pilotEventProof = getProductionPilotEventProofReadiness(packet, {
    minimumPilotChapterCount: options.minimumPilotChapterCount,
  });
  const signedInRouteProof = getProductionSignedInRouteProofReadiness(packet);
  const inviteBatches = getProductionInviteBatchReadiness(packet, {
    ...options,
    maxRecipientsPerBatch: options.maxRecipientsPerBatch,
  });
  const stages: ProductionRolloutPreflightStage[] = [
    {
      key: "csv_intake",
      label: "CSV intake",
      ready: intakeStatus.ready,
      report: formatProductionRolloutIntakeStatus(intakeStatus),
    },
    {
      key: "chapter_matrix",
      label: "Chapter matrix",
      ready: chapterMatrix.ready,
      report: formatProductionRolloutChapterMatrix(chapterMatrix),
    },
    {
      key: "luma_mapping",
      label: "Luma mapping",
      ready: lumaMapping.ready,
      report: formatProductionLumaMappingReadiness(lumaMapping),
    },
    {
      key: "pilot_event_proof",
      label: "Five-chapter event-loop proof",
      ready: pilotEventProof.ready,
      report: formatProductionPilotEventProofReadiness(pilotEventProof),
    },
    {
      key: "signed_in_route_proof",
      label: "Signed-in route proof",
      ready: signedInRouteProof.ready,
      report: formatProductionSignedInRouteProofReadiness(signedInRouteProof),
    },
    {
      key: "invite_batches",
      label: "Invite batches",
      ready: inviteBatches.ready,
      report: formatProductionInviteBatchReadiness(inviteBatches),
    },
  ];
  const failedStages = stages.filter((stage) => !stage.ready);

  return {
    ready: failedStages.length === 0,
    stages,
    nextSteps:
      failedStages.length === 0
        ? [
            "Run production live-data count proof after the approved production apply step.",
            "Run the final production invite gate before any 30-chapter student invites are sent.",
            "Invite only batch 1 first, then verify login, Luma events, RSVP, attendance, points, leaderboards, audit, and support health before opening later batches.",
          ]
        : [
            `Fix the first failing stage: ${failedStages[0].label}.`,
            "Re-run this preflight after each rollout packet update.",
            "Do not create users, send invites, call Luma writes, or enable external sends from an incomplete preflight.",
          ],
  };
}

export function formatProductionRolloutPreflight(
  preflight: ProductionRolloutPreflight,
): string {
  const readyStages = preflight.stages.filter((stage) => stage.ready).length;
  const lines = [
    preflight.ready
      ? "30-chapter rollout preflight: READY"
      : "30-chapter rollout preflight: NOT READY",
    "",
    "Scope:",
    "- Read-only check for the 30-chapter / 500-student rollout packet.",
    "- Does not create users, write Supabase rows, call Luma, send invites, or enable external systems.",
    "- Redacts email addresses in this report so it can be shared for review.",
    "",
    `Stage summary: ${readyStages}/${preflight.stages.length} passed`,
    ...preflight.stages.map(
      (stage) => `- ${stage.ready ? "PASS" : "FAIL"} ${stage.label}`,
    ),
    "",
    "Next steps:",
    ...formatList(preflight.nextSteps),
    "",
    "Detailed reports:",
    ...preflight.stages.flatMap((stage) => [
      "",
      `## ${stage.label}`,
      "",
      stage.report,
    ]),
  ];

  return redactSensitivePreflightText(lines.join("\n"));
}

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`);
}

function redactSensitivePreflightText(text: string) {
  return text.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    (email) => redactEmail(email),
  );
}

function redactEmail(email: string) {
  const [localPart, domain] = email.split("@");
  const firstCharacter = localPart?.[0] ?? "x";

  return `${firstCharacter}***@${domain ?? "redacted"}`;
}
