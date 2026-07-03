import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getLaunchLaneWorkspaceNextStep,
} from "@/services/events-points-launch-lane";
import type { MemberRecognitionSummary } from "@/services/member-recognition";
import {
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

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
  const surfaceFamily = getActorSurfaceFamily(actor);

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
    eyebrow: getEyebrow(surfaceFamily),
    title: getTitle(surfaceFamily),
    summary:
      "See points, rank, recognition, and chapter impact in one student-friendly readout. This recognition surface stays read-only until the approved points ledger is live.",
    nextStep: getNextStep(surfaceFamily),
    safetyNotes: [
      `Points ledger posture: ${recognition.pointsLedgerPosture}.`,
      "No points write, KPI write, leaderboard mutation, member nudge, or external send is expected from this page.",
      "Production points must come from approved evidence review and audited server-side write paths.",
    ],
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}

function getEyebrow(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "member":
      return "Your points";
    case "leader":
      return "Member recognition";
    case "coach":
      return "Portfolio recognition";
    case "staff":
      return "HQ recognition readout";
    case "super_admin":
      return "Full local recognition";
    case "ds_admin":
      return "Recognition restricted";
  }
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "member":
      return "Your chapter leaderboard";
    case "leader":
      return "Chapter member leaderboard";
    case "coach":
      return "Portfolio chapter leaderboard";
    case "staff":
      return "HQ member recognition readout";
    case "super_admin":
      return "Full local leaderboard readout";
    case "ds_admin":
      return "Leaderboard hidden for this role";
  }
}

function getNextStep(
  surfaceFamily: ActorSurfaceFamily,
): MemberLeaderboardNextStep {
  switch (surfaceFamily) {
    case "member":
      return {
        ...getLaunchLaneWorkspaceNextStep(surfaceFamily),
        label: "Move your rank by showing up to the next event",
        ctaLabel: "Open events",
        summary:
          "Start with the next chapter event. RSVP, attend, and let verified attendance move the chapter leaderboard.",
      };
    case "leader":
      return {
        ...getLaunchLaneWorkspaceNextStep(surfaceFamily),
        label: "Use recognition to guide event follow-through",
        ctaLabel: "Open leader events",
        summary:
          "Use the chapter board to see who is showing up, then keep event planning, attendance, and points in one leader loop.",
      };
    case "coach":
      return {
        ...getLaunchLaneWorkspaceNextStep(surfaceFamily),
        label: "Connect recognition to chapter event health",
        ctaLabel: "Open chapters",
        summary:
          "Use leaderboard changes as one signal alongside RSVP, attendance, and simple chapter risk posture.",
      };
    case "staff":
      return {
        ...getLaunchLaneWorkspaceNextStep(surfaceFamily),
        label: "Keep chapter points grounded in the chapter list",
        ctaLabel: "Open chapters",
        summary:
          "Review the org board, then drop back into chapter event posture instead of branching into unrelated modules.",
      };
    case "super_admin":
      return {
        ...getLaunchLaneWorkspaceNextStep(surfaceFamily),
        label: "Confirm the recognition boundary from admin",
        ctaLabel: "Open admin",
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
