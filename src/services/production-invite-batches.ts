import type {
  ProductionRolloutBootstrapOptions,
  ProductionRolloutBootstrapPacket,
} from "./production-rollout-bootstrap.ts";
import {
  getProductionRolloutBootstrapReadiness,
} from "./production-rollout-bootstrap.ts";

type BatchKind = "pilot" | "expansion";

export type ProductionInviteBatchChapter = {
  chapterId: string;
  chapterName: string;
  recipientCount: number;
};

export type ProductionInviteBatch = {
  number: number;
  kind: BatchKind;
  chapterCount: number;
  recipientCount: number;
  chapters: ProductionInviteBatchChapter[];
};

export type ProductionInviteBatchReadinessOptions =
  ProductionRolloutBootstrapOptions & {
    maxRecipientsPerBatch?: number;
  };

export type ProductionInviteBatchReadiness = {
  ready: boolean;
  minimums: {
    chapters: number;
    students: number;
    pilotChapters: number;
    maxRecipientsPerBatch: number;
  };
  counts: {
    activeChapters: number;
    studentInvitees: number;
    pilotReadyChapters: number;
    plannedBatches: number;
    largestBatchRecipients: number;
  };
  batches: ProductionInviteBatch[];
  blockers: string[];
  warnings: string[];
  nextSteps: string[];
};

const inviteRoleKeys = new Set([
  "general_member",
  "action_committee_member",
  "action_committee_chair",
  "e_board_member",
  "president_vp",
]);

export function getProductionInviteBatchReadiness(
  packet: ProductionRolloutBootstrapPacket,
  options: ProductionInviteBatchReadinessOptions = {},
): ProductionInviteBatchReadiness {
  const minimums = {
    chapters: options.minimumChapterCount ?? 30,
    students: options.minimumStudentMembershipCount ?? 500,
    pilotChapters: options.minimumPilotChapterCount ?? 5,
    maxRecipientsPerBatch: options.maxRecipientsPerBatch ?? 75,
  };
  const blockers: string[] = [];
  const warnings: string[] = [];
  const packetReadiness = getProductionRolloutBootstrapReadiness(packet, {
    ...options,
    minimumChapterCount: minimums.chapters,
    minimumStudentMembershipCount: minimums.students,
    minimumPilotChapterCount: minimums.pilotChapters,
    allowSandboxTestData: options.allowSandboxTestData,
  });
  const activeChapters = packet.chapters.filter(
    (chapter) => (chapter.status ?? "active") === "active",
  );
  const activeChapterIds = new Set(activeChapters.map((chapter) => chapter.id));
  const readyPilotChapterIds = new Set(
    (packet.pilotEventProof ?? [])
      .filter((proof) => (proof.status ?? "ready") === "ready")
      .map((proof) => proof.chapterId),
  );
  const inviteesByChapter = getInviteesByChapter(packet, activeChapterIds);
  const duplicateInviteeChapters = getDuplicateInviteeChapters(inviteesByChapter);
  const pilotChapters = activeChapters
    .filter((chapter) => readyPilotChapterIds.has(chapter.id))
    .slice(0, minimums.pilotChapters);
  const expansionChapters = activeChapters.filter(
    (chapter) => !pilotChapters.some((pilotChapter) => pilotChapter.id === chapter.id),
  );
  const batches = [
    ...createPilotBatch(pilotChapters, inviteesByChapter),
    ...createExpansionBatches(
      expansionChapters,
      inviteesByChapter,
      minimums.maxRecipientsPerBatch,
    ),
  ];
  const inviteeEmails = new Set(
    Array.from(inviteesByChapter.values()).flatMap((emails) => Array.from(emails)),
  );
  const largestBatchRecipients = Math.max(
    0,
    ...batches.map((batch) => batch.recipientCount),
  );

  if (!packetReadiness.ready) {
    blockers.push(
      "Fix the production rollout packet blockers before preparing invite batches.",
    );
  }

  if (activeChapters.length < minimums.chapters) {
    blockers.push(
      `Need ${minimums.chapters} active chapters before 30-chapter invite batching. Current active chapters: ${activeChapters.length}.`,
    );
  }

  if (inviteeEmails.size < minimums.students) {
    blockers.push(
      `Need ${minimums.students} unique student/leader invitees before broad launch. Current invitees: ${inviteeEmails.size}.`,
    );
  }

  if (pilotChapters.length < minimums.pilotChapters) {
    blockers.push(
      `Need ${minimums.pilotChapters} pilot-ready chapters in batch 1. Current pilot-ready chapters: ${pilotChapters.length}.`,
    );
  }

  for (const chapter of activeChapters) {
    const chapterInvitees = inviteesByChapter.get(chapter.id) ?? new Set();

    if (chapterInvitees.size === 0) {
      blockers.push(`${chapter.name} has no approved student or leader invitees.`);
    }

    if (chapterInvitees.size > minimums.maxRecipientsPerBatch) {
      blockers.push(
        `${chapter.name} has ${chapterInvitees.size} invitees, which exceeds the batch cap of ${minimums.maxRecipientsPerBatch}. Split this chapter manually before sending invites.`,
      );
    }
  }

  for (const duplicate of duplicateInviteeChapters) {
    blockers.push(
      `${duplicate.email} appears in multiple launch chapters (${duplicate.chapterIds.join(", ")}). Resolve the chapter assignment before invite batching.`,
    );
  }

  for (const batch of batches) {
    if (batch.recipientCount > minimums.maxRecipientsPerBatch) {
      blockers.push(
        `Batch ${batch.number} has ${batch.recipientCount} invitees, which exceeds the cap of ${minimums.maxRecipientsPerBatch}.`,
      );
    }
  }

  if (minimums.maxRecipientsPerBatch > 75) {
    warnings.push(
      "Batch cap is above the recommended 75-person launch limit. Use this only after the first pilot batch is clean.",
    );
  }

  return {
    ready: blockers.length === 0,
    minimums,
    counts: {
      activeChapters: activeChapters.length,
      studentInvitees: inviteeEmails.size,
      pilotReadyChapters: pilotChapters.length,
      plannedBatches: batches.length,
      largestBatchRecipients,
    },
    batches,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    nextSteps:
      blockers.length === 0
        ? [
            "Review batch 1 with the support and rollback owner before sending invites.",
            "Invite batch 1 only, then verify login, events, RSVP, attendance, points, and leaderboard health before opening the next batch.",
            "Keep every later batch paused until the previous batch has clean support and audit readback.",
          ]
        : [
            "Fix the invite-batch blockers before sending any production student invites.",
            "Re-run the rollout packet, Luma mapping, signed-in route, pilot event proof, and invite gate checks before sending batch 1.",
            "Do not send email invites from this report; it is a read-only planning gate.",
          ],
  };
}

export function formatProductionInviteBatchReadiness(
  readiness: ProductionInviteBatchReadiness,
): string {
  return [
    readiness.ready
      ? "Production invite batch readiness: READY"
      : "Production invite batch readiness: NOT READY",
    "",
    "Minimums:",
    `- active chapters: ${readiness.minimums.chapters}`,
    `- student/leader invitees: ${readiness.minimums.students}`,
    `- pilot-ready chapters in batch 1: ${readiness.minimums.pilotChapters}`,
    `- max recipients per batch: ${readiness.minimums.maxRecipientsPerBatch}`,
    "",
    "Counts:",
    `- active chapters: ${readiness.counts.activeChapters}`,
    `- student/leader invitees: ${readiness.counts.studentInvitees}`,
    `- pilot-ready chapters in batch 1: ${readiness.counts.pilotReadyChapters}`,
    `- planned batches: ${readiness.counts.plannedBatches}`,
    `- largest batch recipients: ${readiness.counts.largestBatchRecipients}`,
    "",
    "Batches:",
    ...formatBatches(readiness.batches),
    "",
    "Blockers:",
    ...formatList(readiness.blockers, "None"),
    "",
    "Warnings:",
    ...formatList(readiness.warnings, "None"),
    "",
    "Next steps:",
    ...formatList(readiness.nextSteps, "None"),
  ].join("\n");
}

function getInviteesByChapter(
  packet: ProductionRolloutBootstrapPacket,
  activeChapterIds: Set<string>,
) {
  const inviteesByChapter = new Map<string, Set<string>>();

  for (const membership of packet.memberships) {
    if (
      (membership.status ?? "approved") !== "approved" ||
      !inviteRoleKeys.has(membership.roleKey) ||
      !activeChapterIds.has(membership.chapterId)
    ) {
      continue;
    }

    const chapterInvitees =
      inviteesByChapter.get(membership.chapterId) ?? new Set<string>();

    chapterInvitees.add(normalizeEmail(membership.email));
    inviteesByChapter.set(membership.chapterId, chapterInvitees);
  }

  return inviteesByChapter;
}

function getDuplicateInviteeChapters(inviteesByChapter: Map<string, Set<string>>) {
  const chapterIdsByEmail = new Map<string, Set<string>>();

  for (const [chapterId, emails] of inviteesByChapter.entries()) {
    for (const email of emails) {
      const chapterIds = chapterIdsByEmail.get(email) ?? new Set<string>();

      chapterIds.add(chapterId);
      chapterIdsByEmail.set(email, chapterIds);
    }
  }

  return Array.from(chapterIdsByEmail.entries())
    .filter(([, chapterIds]) => chapterIds.size > 1)
    .map(([email, chapterIds]) => ({
      email,
      chapterIds: Array.from(chapterIds),
    }));
}

function createPilotBatch(
  chapters: ProductionRolloutBootstrapPacket["chapters"],
  inviteesByChapter: Map<string, Set<string>>,
): ProductionInviteBatch[] {
  if (chapters.length === 0) {
    return [];
  }

  return [createBatch(1, "pilot", chapters, inviteesByChapter)];
}

function createExpansionBatches(
  chapters: ProductionRolloutBootstrapPacket["chapters"],
  inviteesByChapter: Map<string, Set<string>>,
  maxRecipientsPerBatch: number,
): ProductionInviteBatch[] {
  const batches: ProductionInviteBatch[] = [];
  let currentChapters: ProductionRolloutBootstrapPacket["chapters"] = [];
  let currentRecipientCount = 0;

  for (const chapter of chapters) {
    const chapterRecipientCount = inviteesByChapter.get(chapter.id)?.size ?? 0;
    const wouldExceedCap =
      currentChapters.length > 0 &&
      currentRecipientCount + chapterRecipientCount > maxRecipientsPerBatch;

    if (wouldExceedCap) {
      batches.push(
        createBatch(batches.length + 2, "expansion", currentChapters, inviteesByChapter),
      );
      currentChapters = [];
      currentRecipientCount = 0;
    }

    currentChapters.push(chapter);
    currentRecipientCount += chapterRecipientCount;
  }

  if (currentChapters.length > 0) {
    batches.push(
      createBatch(batches.length + 2, "expansion", currentChapters, inviteesByChapter),
    );
  }

  return batches;
}

function createBatch(
  number: number,
  kind: BatchKind,
  chapters: ProductionRolloutBootstrapPacket["chapters"],
  inviteesByChapter: Map<string, Set<string>>,
): ProductionInviteBatch {
  const batchChapters = chapters.map((chapter) => ({
    chapterId: chapter.id,
    chapterName: chapter.name,
    recipientCount: inviteesByChapter.get(chapter.id)?.size ?? 0,
  }));

  return {
    number,
    kind,
    chapterCount: batchChapters.length,
    recipientCount: batchChapters.reduce(
      (total, chapter) => total + chapter.recipientCount,
      0,
    ),
    chapters: batchChapters,
  };
}

function formatBatches(batches: ProductionInviteBatch[]) {
  if (batches.length === 0) {
    return ["- None"];
  }

  return batches.map((batch) => {
    const chapterSummary = batch.chapters
      .map((chapter) => `${chapter.chapterName} (${chapter.recipientCount})`)
      .join("; ");

    return `- Batch ${batch.number} ${batch.kind}: ${batch.chapterCount} chapter(s), ${batch.recipientCount} recipient(s) — ${chapterSummary}`;
  });
}

function formatList(items: string[], fallback: string) {
  return items.length > 0 ? items.map((item) => `- ${item}`) : [`- ${fallback}`];
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
