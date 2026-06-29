import type { LumaCalendarReadinessSnapshot } from "@/services/luma-calendar-readiness";
import {
  getLumaEventLoopPilotReadback,
  type LumaEventLoopPilotRole,
} from "@/services/luma-event-loop-pilot";
import type { StagingLumaEventLoopReadModel } from "@/services/staging-luma-event-loop";

export type LumaEventLoopProofSurface = {
  key: LumaEventLoopPilotRole;
  label: string;
  route: string;
  title: string;
  summary: string;
  statusLabel: string;
  reviewGoal: string;
  note: string;
  facts: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
};

export function getLumaEventLoopProofSurfaces(input: {
  snapshot: LumaCalendarReadinessSnapshot;
  activation?: StagingLumaEventLoopReadModel | null;
}): LumaEventLoopProofSurface[] {
  return roleConfigs.map((config) => {
    const readback = getLumaEventLoopPilotReadback(config.key, input.snapshot, {
      activation: input.activation ?? null,
    });

    return {
      key: config.key,
      label: config.label,
      route: config.route,
      title: readback.title,
      summary: readback.summary,
      statusLabel: readback.statusLabel,
      reviewGoal: config.reviewGoal,
      note: readback.statusDetail,
      facts: readback.cards.slice(1).map((card) => ({
        label: card.label,
        value: card.value,
        detail: card.detail,
      })),
    };
  });
}

const roleConfigs: Array<{
  key: LumaEventLoopPilotRole;
  label: string;
  route: string;
  reviewGoal: string;
}> = [
  {
    key: "member",
    label: "General member workspace",
    route: "/app",
    reviewGoal:
      "Verify a member can spot the event, understand RSVP status, and connect attendance to points and leaderboard movement without hunting for it.",
  },
  {
    key: "leader",
    label: "Student leader workspace",
    route: "/leader",
    reviewGoal:
      "Verify chapter leaders can review event posture, attendance gaps, and chapter leaderboard impact from the command center.",
  },
  {
    key: "staff",
    label: "Sales coach / staff workspace",
    route: "/staff",
    reviewGoal:
      "Verify staff can inspect chapter event health, attendance follow-through, and portfolio-level points posture without opening any write lane.",
  },
  {
    key: "admin",
    label: "DS / admin workspace",
    route: "/admin",
    reviewGoal:
      "Verify admin can compare the same event-to-points story against audit, outbox, and launch-gate posture before any pilot approval.",
  },
];
