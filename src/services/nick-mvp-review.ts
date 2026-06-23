import type { LocalActorContext } from "@/services/local-actor-context";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
  type ActorSurfaceFamily,
} from "@/services/role-visibility";

export type NickMvpReviewStatus =
  | "ready_for_nick_review"
  | "blocked_before_live_launch";

export type NickMvpReviewItem = {
  key: string;
  title: string;
  route: string;
  reviewerActorEmail: string;
  ownerLane: string;
  status: NickMvpReviewStatus;
  plainEnglish: string;
  passSignal: string;
  launchBoundary: string;
};

export type NickMvpReviewPacket = {
  canReadPacket: boolean;
  title: string;
  summary: string;
  localReviewReady: true;
  liveLaunchReady: false;
  browserWritesExpected: 0;
  externalWritesExpected: 0;
  studentInvitationsExpected: 0;
  counts: {
    reviewItems: number;
    blockedBeforeLaunch: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
    studentInvitationsExpected: 0;
  };
  reviewItems: NickMvpReviewItem[];
  finalDecisionPrompts: string[];
};

export function getNickMvpReviewPacket(
  actor: LocalActorContext,
): NickMvpReviewPacket {
  const surfaceFamily = getActorSurfaceFamily(actor);

  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadPacket: false,
      title: "Nick review packet hidden for this role",
      summary:
        "The final local MVP review packet is for admin review contexts before pilot approval.",
      localReviewReady: true,
      liveLaunchReady: false,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
      studentInvitationsExpected: 0,
      counts: emptyCounts(),
      reviewItems: [],
      finalDecisionPrompts: [],
    };
  }

  return {
    canReadPacket: true,
    title: getTitle(surfaceFamily),
    summary:
      "Use this packet as the final local review handoff for Nick: the MVP can be reviewed end to end with fake actors, but live auth, production writes, uploads, external sends, and student invitations remain blocked.",
    localReviewReady: true,
    liveLaunchReady: false,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    studentInvitationsExpected: 0,
    counts: {
      reviewItems: nickReviewItems.length,
      blockedBeforeLaunch: nickReviewItems.filter(
        (item) => item.status === "blocked_before_live_launch",
      ).length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
      studentInvitationsExpected: 0,
    },
    reviewItems: nickReviewItems,
    finalDecisionPrompts: [
      "Can Nick follow the member, leader, coach, and admin story without engineering help?",
      "Does each role answer what the reviewer should do next before any live pilot is discussed?",
      "Does the Goal 150 launch evidence checklist and pilot scope route name the missing evidence, pilot group, support owner, and stop rules?",
      "Which owners must clear production auth, RLS/security, proof storage, visual QA, operations, and support before real students are invited?",
      "If any item is unclear, keep the app in local review and do not approve browser writes, external sends, uploads, or invitations.",
    ],
  };
}

const nickReviewItems: NickMvpReviewItem[] = [
  {
    key: "stakeholder_path",
    title: "Run the no-code route walkthrough",
    route: "/admin/review-path",
    reviewerActorEmail: "admin@mymedlife.test",
    ownerLane: "Nick + HQ",
    status: "ready_for_nick_review",
    plainEnglish:
      "Start with the phase map and route-by-route review path so the whole MVP story is visible before individual screens are opened.",
    passSignal:
      "Nick can identify the member, leader, proof, coach, admin, and write-packet phases plus the fake actor email for each route.",
    launchBoundary:
      "The review path is orientation only; it must not approve live auth, writes, uploads, sends, or invitations.",
  },
  {
    key: "member_flow",
    title: "Walk the student Rush Month flow",
    route: "/rush-month",
    reviewerActorEmail: "member.a@mymedlife.test",
    ownerLane: "Nick + Chapter Member Reviewer",
    status: "ready_for_nick_review",
    plainEnglish:
      "Review chapter home, Rush Month overview, assigned actions, action detail, proof/evidence, points, leaderboard, dashboard, and events as a student.",
    passSignal:
      "The member can tell what to do next and sees simple mission-driven copy without needing admin context.",
    launchBoundary:
      "Member proof saves, uploads, points writes, Luma actions, reminders, and external sends remain disabled.",
  },
  {
    key: "leader_flow",
    title: "Review leader operating accountability",
    route: "/rush-month/dashboard",
    reviewerActorEmail: "leader.a@mymedlife.test",
    ownerLane: "Nick + Chapter Leader Reviewer",
    status: "ready_for_nick_review",
    plainEnglish:
      "Review leader KPIs, assignment posture, completion tracking, member management, and proof review handoff.",
    passSignal:
      "A President / VP can understand which actions need follow-up and how proof decisions would be reviewed.",
    launchBoundary:
      "Assignment creation, proof decisions, member management writes, KPI writes, reminders, and external sends remain disabled unless explicit local flags are approved.",
  },
  {
    key: "coach_flow",
    title: "Review coach portfolio and intervention posture",
    route: "/coach",
    reviewerActorEmail: "coach@mymedlife.test",
    ownerLane: "Nick + Coach Reviewer",
    status: "ready_for_nick_review",
    plainEnglish:
      "Review assigned chapters, campaign health, overdue work, pending evidence, KPI movement, risk alerts, support notes, and advance / hold / intervene posture.",
    passSignal:
      "A coach can see where to intervene and what evidence is missing without seeing chapter-admin mutation controls.",
    launchBoundary:
      "Coach notes, coach decisions, reassignments, escalation packets, n8n workflows, and external sends remain disabled.",
  },
  {
    key: "data_security",
    title: "Confirm DS/security decision posture",
    route: "/admin/database-security",
    reviewerActorEmail: "ds.admin@mymedlife.test",
    ownerLane: "DS + Security",
    status: "blocked_before_live_launch",
    plainEnglish:
      "Review the Supabase Postgres/Auth/Storage recommendation, PlanetScale MySQL/Vitess tradeoff, RLS posture, service-key handling, proof storage, and compliance contracts.",
    passSignal:
      "DS/security can name the remaining approvals and agree that vendor switching is not a quiet MVP change.",
    launchBoundary:
      "Production Supabase, vendor switching, service-key exposure, PHI/ePHI handling, browser writes, proof uploads, and launch approval remain blocked.",
  },
  {
    key: "launch_gate",
    title: "Assign owners for live-launch blockers",
    route: "/admin/launch-gate",
    reviewerActorEmail: "admin@mymedlife.test",
    ownerLane: "Nick + Platform + Operations",
    status: "blocked_before_live_launch",
    plainEnglish:
      "Review the eight launch gates plus the Goal 150 evidence checklist for staging URL, Supabase posture, auth, RLS/CI, proof storage, device QA, monitoring, integration hold, and pilot support.",
    passSignal:
      "Every missing live evidence item has an owner, proof route, acceptance signal, and blocked-until note before any real pilot is discussed.",
    launchBoundary:
      "Launch gate review does not approve live launch, production auth, browser writes, proof uploads, vendor switching, external sends, or invitations.",
  },
  {
    key: "pilot_scope",
    title: "Choose the smallest safe pilot scope",
    route: "/admin/pilot-scope",
    reviewerActorEmail: "admin@mymedlife.test",
    ownerLane: "Nick + HQ Operations",
    status: "blocked_before_live_launch",
    plainEnglish:
      "Review the first-pilot candidates, minimum pilot path, manual-first event/NPS posture, support owner, and stop rules before any student invitation decision.",
    passSignal:
      "Nick can name the pilot group, who supports it on day one, which write path is first, which external systems stay disabled, and when to stop or rollback.",
    launchBoundary:
      "Pilot-scope review does not invite students, enable production auth, enable writes, upload proof, send integrations, or approve broad launch.",
  },
  {
    key: "design_qa",
    title: "Run mobile and Figma QA",
    route: "/admin/design-qa",
    reviewerActorEmail: "admin@mymedlife.test",
    ownerLane: "Nick + Product",
    status: "blocked_before_live_launch",
    plainEnglish:
      "Review the Figma target, mobile viewport, next-action clarity, accessibility, role complexity, mission tone, and offline recovery expectations.",
    passSignal:
      "Nick can decide which visual, mobile, and accessibility issues must be fixed before a pilot.",
    launchBoundary:
      "Design review does not approve staging claims, live launch, browser writes, uploads, public proof sharing, or external sends.",
  },
  {
    key: "operations_support",
    title: "Confirm day-one support readiness",
    route: "/admin/operations",
    reviewerActorEmail: "admin@mymedlife.test",
    ownerLane: "HQ Operations",
    status: "blocked_before_live_launch",
    plainEnglish:
      "Review incident response, auth/access recovery, database/RLS recovery, write rollback, proof moderation, integration recovery, mobile PWA support, and pilot communications.",
    passSignal:
      "Operations can name first-response owners and rollback paths before real students are invited.",
    launchBoundary:
      "Operations review does not approve live launch, monitoring claims, backup claims, support-owner claims, outbox sends, or student invitations.",
  },
];

function emptyCounts(): NickMvpReviewPacket["counts"] {
  return {
    reviewItems: 0,
    blockedBeforeLaunch: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
    studentInvitationsExpected: 0,
  };
}

function getTitle(surfaceFamily: ActorSurfaceFamily): string {
  switch (surfaceFamily) {
    case "staff":
      return "Nick final local MVP review packet";
    case "ds_admin":
      return "DS Admin Nick review packet";
    case "super_admin":
      return "Super Admin Nick review packet";
    case "member":
    case "leader":
    case "coach":
      return "Nick review packet hidden for this role";
  }
}
