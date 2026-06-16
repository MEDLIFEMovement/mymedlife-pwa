import type { LocalActorContext } from "@/services/local-actor-context";

export type ReleaseReadinessStatus =
  | "ready_for_local_review"
  | "blocked_for_live_launch";

export type ReleaseReadinessItem = {
  label: string;
  status: ReleaseReadinessStatus;
  plainEnglish: string;
};

export type MvpReleaseReadinessSummary = {
  canReadSummary: boolean;
  title: string;
  verdict: "local_review_ready_not_live";
  plainEnglishVerdict: string;
  localReviewReady: true;
  liveLaunchReady: false;
  externalWritesEnabled: 0;
  browserWritesEnabled: 0;
  achievements: ReleaseReadinessItem[];
  blockers: ReleaseReadinessItem[];
  nextApprovals: string[];
};

export function getMvpReleaseReadinessSummary(
  actor: LocalActorContext,
): MvpReleaseReadinessSummary {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadSummary: false,
      title: "Release readiness hidden for this role",
      verdict: "local_review_ready_not_live",
      plainEnglishVerdict:
        "Release readiness is an admin review surface, not a chapter operating view.",
      localReviewReady: true,
      liveLaunchReady: false,
      externalWritesEnabled: 0,
      browserWritesEnabled: 0,
      achievements: [],
      blockers: [],
      nextApprovals: [],
    };
  }

  return {
    canReadSummary: true,
    title: getTitle(actor),
    verdict: "local_review_ready_not_live",
    plainEnglishVerdict:
      "The Rush Month MVP is strong enough for local stakeholder review, but it is not ready for live student launch until auth, writes, uploads, production data, and integrations are approved.",
    localReviewReady: true,
    liveLaunchReady: false,
    externalWritesEnabled: 0,
    browserWritesEnabled: 0,
    achievements: [
      {
        label: "Rush Month operating loop",
        status: "ready_for_local_review",
        plainEnglish:
          "A reviewer can see the full assignment, proof, review, points/KPI, outbox, audit, and coach decision flow locally.",
      },
      {
        label: "Role-aware views",
        status: "ready_for_local_review",
        plainEnglish:
          "Member, leader, coach, admin, DS admin, and super admin views show different information.",
      },
      {
        label: "Admin review surfaces",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin can inspect coverage, route smoke expectations, write gates, result states, outbox posture, and safety blockers.",
      },
      {
        label: "Controlled pilot decision packet",
        status: "ready_for_local_review",
        plainEnglish:
          "Admin can see that staff dry run is ready while staging, real student pilot, and scale gates remain blocked until approval.",
      },
      {
        label: "Staff dry-run guide",
        status: "ready_for_local_review",
        plainEnglish:
          "HQ staff can rehearse member, leader, event/NPS, proof, coach, and DS Admin safety paths with fake local actor emails.",
      },
      {
        label: "First pilot scope planner",
        status: "ready_for_local_review",
        plainEnglish:
          "HQ staff can compare safe pilot sizes and see which approvals are still required before inviting real students.",
      },
      {
        label: "First-write activation drill",
        status: "ready_for_local_review",
        plainEnglish:
          "HQ staff can inspect the local action-start write drill before the first localhost-only save is tested.",
      },
    ],
    blockers: [
      {
        label: "Live auth and real users",
        status: "blocked_for_live_launch",
        plainEnglish:
          "The app still uses local actors and fake seed/mock data. Production sign-in is not enabled.",
      },
      {
        label: "Browser writes",
        status: "blocked_for_live_launch",
        plainEnglish:
          "Assignment, proof, HQ decision, coach decision, and admin mutation writes remain disabled.",
      },
      {
        label: "Proof uploads and public proof sharing",
        status: "blocked_for_live_launch",
        plainEnglish:
          "Bridge videos/testimonials cannot be uploaded or published from the app yet.",
      },
      {
        label: "External integrations",
        status: "blocked_for_live_launch",
        plainEnglish:
          "HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes remain disabled.",
      },
      {
        label: "Production environment and visual QA",
        status: "blocked_for_live_launch",
        plainEnglish:
          "Production Supabase/Vercel rollout, real data, and final Figma/mobile QA are still future work.",
      },
    ],
    nextApprovals: [
      "Approve live auth/onboarding plan.",
      "Run `/admin/first-write` and approve the first browser write path and rollback plan.",
      "Approve proof upload/storage and consent requirements.",
      "Approve production Supabase/Vercel environment setup.",
      "Approve first pilot chapter or internal test group from `/admin/pilot-scope`.",
      "Approve any real n8n, HubSpot, Luma, warehouse, Power BI, SMS, email, or AI integration.",
    ],
  };
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin release-readiness summary";
    case "ds_admin":
      return "DS Admin release-readiness summary";
    case "super_admin":
      return "Full local release-readiness summary";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Release readiness hidden for this role";
  }
}
