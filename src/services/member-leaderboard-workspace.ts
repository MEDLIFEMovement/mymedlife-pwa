import type { LocalActorContext } from "@/services/local-actor-context";
import type { MemberRecognitionSummary } from "@/services/member-recognition";

export type MemberLeaderboardNextStep = {
  label: string;
  href: string;
  ctaLabel: string;
  summary: string;
};

export type MemberLeaderboardWorkspace = {
  canReadLeaderboard: boolean;
  eyebrow: string;
  title: string;
  summary: string;
  nextStep: MemberLeaderboardNextStep;
  safetyNotes: readonly string[];
  browserWritesExpected: 0;
  externalWritesExpected: 0;
};

export function getMemberLeaderboardWorkspace(
  actor: LocalActorContext,
  recognition: MemberRecognitionSummary,
): MemberLeaderboardWorkspace {
  if (!recognition.canReadRecognition) {
    return {
      canReadLeaderboard: false,
      eyebrow: "Recognition restricted",
      title: "Leaderboard hidden for this role",
      summary:
        "DS Admin can inspect integration and outbox posture, but student points, recognition, and chapter leaderboard truth stay app-owned.",
      nextStep: {
        label: "Open integration safety",
        href: "/admin",
        ctaLabel: "Open admin",
        summary: "Use the admin route for disabled external-send posture instead.",
      },
      safetyNotes: [
        "No points ledger rows are exposed to DS Admin.",
        "No leaderboard mutation, member nudge, or external send is available.",
      ],
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    };
  }

  return {
    canReadLeaderboard: true,
    eyebrow: getEyebrow(actor),
    title: getTitle(actor),
    summary:
      "See points, rank, recognition, and chapter impact in one student-friendly readout. This is a mock-safe recognition surface, not the final production points ledger.",
    nextStep: getNextStep(actor),
    safetyNotes: [
      `Points ledger posture: ${recognition.pointsLedgerPosture}.`,
      "No points write, KPI write, leaderboard mutation, member nudge, or external send is expected from this page.",
      "Production points must come from approved evidence review and audited server-side write paths.",
    ],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}

function getEyebrow(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "Your points";
    case "chapter_leader":
      return "Member recognition";
    case "coach":
      return "Portfolio recognition";
    case "admin":
      return "HQ recognition readout";
    case "super_admin":
      return "Full local recognition";
    case "ds_admin":
      return "Recognition restricted";
  }
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "Your Rush Month leaderboard";
    case "chapter_leader":
      return "Chapter member leaderboard";
    case "coach":
      return "Portfolio chapter leaderboard";
    case "admin":
      return "HQ member recognition readout";
    case "super_admin":
      return "Full local leaderboard readout";
    case "ds_admin":
      return "Leaderboard hidden for this role";
  }
}

function getNextStep(actor: LocalActorContext): MemberLeaderboardNextStep {
  switch (actor.audience) {
    case "chapter_member":
      return {
        label: "Move your rank by doing the next action",
        href: "/rush-month/actions",
        ctaLabel: "Open my actions",
        summary:
          "Complete your assigned Rush Month action and submit proof when the write path is approved.",
      };
    case "chapter_leader":
      return {
        label: "Use recognition to guide follow-up",
        href: "/rush-month/actions",
        ctaLabel: "Open team actions",
        summary:
          "Look for members who need a nudge, then keep assignment and proof decisions in the leader workflow.",
      };
    case "coach":
      return {
        label: "Connect recognition to campaign health",
        href: "/coach",
        ctaLabel: "Open coach readout",
        summary:
          "Use recognition as one signal alongside overdue work, pending evidence, KPIs, and risks.",
      };
    case "admin":
      return {
        label: "Keep points governance separate from launch approval",
        href: "/admin",
        ctaLabel: "Open admin review",
        summary:
          "Review recognition locally, then keep production points approval behind auth, RLS, and audit gates.",
      };
    case "super_admin":
      return {
        label: "Confirm the full local recognition boundary",
        href: "/admin",
        ctaLabel: "Open super admin review",
        summary:
          "Inspect the leaderboard while keeping production points, role, chapter, and integration writes disabled.",
      };
    case "ds_admin":
      return {
        label: "Open integration safety",
        href: "/admin",
        ctaLabel: "Open admin",
        summary: "Use the admin route for disabled external-send posture instead.",
      };
  }
}
