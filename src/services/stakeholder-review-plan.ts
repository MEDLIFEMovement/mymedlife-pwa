import type { LocalActorContext } from "@/services/local-actor-context";

export type StakeholderReviewStep = {
  id: string;
  title: string;
  route: string;
  localActorEmail: string;
  actorLabel: string;
  expectedReview: string;
  safetyBoundary: string;
};

export type StakeholderReviewPlan = {
  canReadPlan: boolean;
  title: string;
  summary: string;
  steps: StakeholderReviewStep[];
  counts: {
    steps: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

const reviewSteps: StakeholderReviewStep[] = [
  {
    id: "member-week",
    title: "Start with the member week",
    route: "/rush-month/dashboard",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A student can see what to do next, their points, recognition, and chapter-level impact.",
    safetyBoundary: "No points write, proof save, login, or external send should happen.",
  },
  {
    id: "leader-follow-up",
    title: "Review leader follow-up",
    route: "/rush-month/actions",
    localActorEmail: "leader.a@mymedlife.test",
    actorLabel: "Chapter Leader",
    expectedReview:
      "A leader can see assignment follow-up, owner nudges, proof needs, and disabled assignment creation posture.",
    safetyBoundary: "No assignment creation, reminder send, or browser write should happen.",
  },
  {
    id: "operating-loop",
    title: "Click through the Rush Month loop",
    route: "/rush-month/loop",
    localActorEmail: "leader.a@mymedlife.test",
    actorLabel: "Chapter Leader",
    expectedReview:
      "A reviewer can walk through assignment, action start, proof, review, points/KPIs, coach decision, events, outbox, and audit logs.",
    safetyBoundary: "The loop stays browser-local and does not save to Supabase or send automation.",
  },
  {
    id: "proof-review",
    title: "Check HQ proof-sharing posture",
    route: "/proof-library",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can see which proof/testimonials need consent, context, internal learning review, or future public review.",
    safetyBoundary: "No proof upload, public publish, AI summary, or warehouse export should happen.",
  },
  {
    id: "coach-readiness",
    title: "Inspect coach readiness",
    route: "/coach",
    localActorEmail: "coach@mymedlife.test",
    actorLabel: "Coach",
    expectedReview:
      "A coach can see portfolio posture, risk flags, closeout readiness, and disabled decision controls.",
    safetyBoundary: "No coach decision save, reassignment, or escalation packet should happen.",
  },
  {
    id: "admin-safety",
    title: "Finish with admin safety",
    route: "/admin",
    localActorEmail: "ds.admin@mymedlife.test",
    actorLabel: "DS Admin",
    expectedReview:
      "DS Admin can inspect disabled integration/outbox safety, route coverage, smoke manifest, and release posture.",
    safetyBoundary: "All browser writes and external sends should remain at zero.",
  },
];

export function getStakeholderReviewPlan(
  actor: LocalActorContext,
): StakeholderReviewPlan {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadPlan: false,
      title: "Stakeholder review path hidden for this role",
      summary: "This no-code review guide is for admin review contexts.",
      steps: [],
      counts: emptyCounts(),
    };
  }

  return {
    canReadPlan: true,
    title: getTitle(actor),
    summary:
      "Use this sequence to review the local MVP in plain English without turning on auth, writes, uploads, public proof sharing, or integrations.",
    steps: reviewSteps,
    counts: {
      steps: reviewSteps.length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin stakeholder review path";
    case "ds_admin":
      return "DS Admin stakeholder review path";
    case "super_admin":
      return "Full local stakeholder review path";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Stakeholder review path hidden for this role";
  }
}

function emptyCounts(): StakeholderReviewPlan["counts"] {
  return {
    steps: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
