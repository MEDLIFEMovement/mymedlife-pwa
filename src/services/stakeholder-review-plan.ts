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
    id: "member-role-coverage",
    title: "Review member and role coverage",
    route: "/chapter/members",
    localActorEmail: "leader.a@mymedlife.test",
    actorLabel: "Chapter Leader",
    expectedReview:
      "A leader can see roster follow-up, join requests, action committee role coverage, and disabled membership controls.",
    safetyBoundary:
      "No join approval, role assignment, committee move, or member deactivation should happen.",
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
    id: "event-readiness",
    title: "Review Rush Month events and NPS",
    route: "/rush-month/events",
    localActorEmail: "leader.a@mymedlife.test",
    actorLabel: "Chapter Leader",
    expectedReview:
      "A reviewer can see Rush Month event owners, student actions, NPS prompts, proof prompts, disabled Luma posture, and disabled outbox rows.",
    safetyBoundary:
      "No Luma event write, attendance import, NPS reminder, warehouse export, or n8n workflow should happen.",
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
    id: "proof-upload-readiness",
    title: "Preview proof upload requirements",
    route: "/proof-library/upload",
    localActorEmail: "member.a@mymedlife.test",
    actorLabel: "General Member",
    expectedReview:
      "A student can understand consent, file requirements, context requirements, and why uploads are still locked.",
    safetyBoundary:
      "No file upload, storage object, public URL, external export, or AI summary should happen.",
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
  {
    id: "design-qa",
    title: "Run Figma and mobile QA",
    route: "/admin",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "A reviewer can compare the running app to the Figma target, phone viewport, accessibility expectations, role complexity, and plain-English next-action clarity.",
    safetyBoundary:
      "Design QA must not enable auth, browser writes, uploads, public proof sharing, or external sends.",
  },
  {
    id: "pilot-readiness",
    title: "Decide controlled pilot readiness",
    route: "/admin",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "A reviewer can see that staff dry run is ready, but staging, real student pilot, proof/storage, auth, writes, and external integration gates still need approval.",
    safetyBoundary:
      "The pilot readiness panel is a decision packet, not approval to invite students or enable production writes.",
  },
  {
    id: "staff-dry-run",
    title: "Run the staff dry-run guide",
    route: "/admin/staff-dry-run",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ staff can rehearse the member, leader, event/NPS, proof, coach, and DS Admin safety path with fake local actors.",
    safetyBoundary:
      "The dry run is rehearsal evidence only and must not enable real auth, writes, uploads, student invitations, or external sends.",
  },
  {
    id: "pilot-scope",
    title: "Choose the smallest safe pilot scope",
    route: "/admin/pilot-scope",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can compare staff-only, one-chapter, two-chapter, and broad-launch options and see which approvals block real student use.",
    safetyBoundary:
      "The pilot planner is a decision surface only and must not invite students, enable writes, upload proof, or send external automation.",
  },
  {
    id: "first-write-drill",
    title: "Review the first-write activation drill",
    route: "/admin/first-write",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can see the exact local checks, fake member route, and proof needed before action-start becomes the first localhost-only write.",
    safetyBoundary:
      "The drill does not approve production writes and must keep proof uploads, other browser writes, and external sends disabled.",
  },
  {
    id: "write-sequence",
    title: "Review the Rush Month write sequence",
    route: "/admin/write-sequence",
    localActorEmail: "admin@mymedlife.test",
    actorLabel: "Admin",
    expectedReview:
      "HQ can see why action-start is the first write to prove, which writes follow, what evidence each write must create, and what external sends stay disabled.",
    safetyBoundary:
      "The sequence planner is a promotion map only and must not enable auth, uploads, browser writes, public proof sharing, or external automation.",
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
