import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadChapterData } from "@/services/role-visibility";
import type { Assignment, AssignmentStatus } from "@/shared/types/domain";

export type RushMonthOperatingPathStepState = "complete" | "current" | "upcoming";

export type RushMonthOperatingPathStep = {
  id: string;
  ownerLabel: string;
  title: string;
  summary: string;
  dueLabel: string;
  status: AssignmentStatus;
  stepState: RushMonthOperatingPathStepState;
  isFocus: boolean;
};

export type RushMonthOperatingPathView = {
  eyebrow: string;
  title: string;
  summary: string;
  boundaryNote: string;
  focusStepId: string | null;
  steps: RushMonthOperatingPathStep[];
};

type RushMonthPathSpec = {
  id: string;
  ownerLabel: string;
  fallbackTitle: string;
  fallbackSummary: string;
  fallbackDueLabel: string;
};

const rushMonthPathSpecs: RushMonthPathSpec[] = [
  {
    id: "open-home",
    ownerLabel: "President / VP",
    fallbackTitle: "Open the chapter home and align the leader team",
    fallbackSummary: "Start the week by making sure the chapter understands the path.",
    fallbackDueLabel: "Week start",
  },
  {
    id: "assign-eboard",
    ownerLabel: "Leader / E-Board",
    fallbackTitle: "Assign Rush Month outreach owners",
    fallbackSummary: "Name the owners, due dates, and proof expectations for the push.",
    fallbackDueLabel: "Midweek",
  },
  {
    id: "member-push",
    ownerLabel: "General Member",
    fallbackTitle: "Run the general member invite push",
    fallbackSummary: "Members do the invite work and bring back proof of what happened.",
    fallbackDueLabel: "Invite window",
  },
  {
    id: "proof-pack",
    ownerLabel: "Action Committee Chair",
    fallbackTitle: "Submit the outreach proof pack",
    fallbackSummary: "Collect the chapter proof into one reviewable story for the next decision.",
    fallbackDueLabel: "Proof review",
  },
  {
    id: "coach-summary",
    ownerLabel: "Coach",
    fallbackTitle: "Prepare the coach-readable progress summary",
    fallbackSummary: "Coach reads the week and decides whether to advance, hold, or intervene.",
    fallbackDueLabel: "Coach check-in",
  },
];

export function getRushMonthOperatingPathView(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): RushMonthOperatingPathView {
  if (!canReadChapterData(actor)) {
    return {
      eyebrow: data.campaign.weekLabel,
      title: "Rush Month operating truth stays with the app and chapter roles.",
      summary:
        "DS Admin can inspect integration posture, disabled outbox rows, and system safety, but not the student operating path itself.",
      boundaryNote:
        "DS Admin should not read member assignments, proof content, points, KPI movement, or coach-facing chapter truth.",
      focusStepId: null,
      steps: [],
    };
  }

  const focusStepId = getFocusStepId(actor, data.assignments);
  const currentStepId = getCurrentStepId(data.assignments);

  return {
    eyebrow: data.campaign.weekLabel,
    title: getPathTitle(actor),
    summary: getPathSummary(actor),
    boundaryNote: getBoundaryNote(actor),
    focusStepId,
    steps: rushMonthPathSpecs.map((spec) =>
      toOperatingPathStep(spec, data.assignments, currentStepId, focusStepId),
    ),
  };
}

function toOperatingPathStep(
  spec: RushMonthPathSpec,
  assignments: Assignment[],
  currentStepId: string | null,
  focusStepId: string | null,
): RushMonthOperatingPathStep {
  const assignment = assignments.find((item) => item.id === spec.id);
  const status = assignment?.status ?? "not_started";

  return {
    id: spec.id,
    ownerLabel: spec.ownerLabel,
    title: assignment?.title ?? spec.fallbackTitle,
    summary: assignment?.instructions ?? spec.fallbackSummary,
    dueLabel: assignment?.dueLabel ?? spec.fallbackDueLabel,
    status,
    stepState:
      status === "approved"
        ? "complete"
        : spec.id === currentStepId
          ? "current"
          : "upcoming",
    isFocus: spec.id === focusStepId,
  };
}

function getCurrentStepId(assignments: Assignment[]): string | null {
  const currentStep = rushMonthPathSpecs.find((spec) => {
    const assignment = assignments.find((item) => item.id === spec.id);

    return assignment ? assignment.status !== "approved" : true;
  });

  return currentStep?.id ?? rushMonthPathSpecs.at(-1)?.id ?? null;
}

function getFocusStepId(
  actor: LocalActorContext,
  assignments: Assignment[],
): string | null {
  switch (actor.audience) {
    case "chapter_member":
      return "member-push";
    case "coach":
      return "coach-summary";
    case "admin":
      return "proof-pack";
    case "super_admin":
      return "coach-summary";
    case "chapter_leader":
      if (actor.chapterRoles.includes("President / VP")) {
        return hasProofFollowUp(assignments) ? "proof-pack" : "assign-eboard";
      }

      return "assign-eboard";
    case "ds_admin":
      return null;
  }
}

function hasProofFollowUp(assignments: Assignment[]): boolean {
  return assignments.some(
    (assignment) =>
      assignment.status === "submitted" || assignment.status === "changes_requested",
  );
}

function getPathTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "See where your work fits in this week's Rush Month path.";
    case "chapter_leader":
      return actor.chapterRoles.includes("President / VP")
        ? "Lead the week without turning on live writes."
        : "Keep the outreach owners moving as one operating path.";
    case "coach":
      return "Read the chapter path before recording the coach decision.";
    case "admin":
      return "Support the proof-sharing posture without publishing anything.";
    case "super_admin":
      return "Inspect the full MVP path before approving live systems.";
    case "ds_admin":
      return "Inspect system posture without opening student campaign truth.";
  }
}

function getPathSummary(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "Leader setup, member outreach, proof collection, and coach review are one sequence. Your action is the student-facing middle of that loop.";
    case "chapter_leader":
      return actor.chapterRoles.includes("President / VP")
        ? "Set the owner path, clear proof follow-up, and hand the coach a readable chapter state before the next push."
        : "Keep the team moving by naming owners, checking follow-up, and making sure proof becomes reviewable chapter context.";
    case "coach":
      return "The coach decision should come after assignments, proof, and visible movement make the chapter's week legible.";
    case "admin":
      return "HQ should support review and proof-sharing posture while keeping app writes, publishing, and external sends off.";
    case "super_admin":
      return "This view keeps the MVP legible across leader, member, proof, and coach checkpoints before any write-activation decision.";
    case "ds_admin":
      return "Integration safety belongs beside the operating path, not in place of it.";
  }
}

function getBoundaryNote(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "chapter_member":
      return "Members should understand the whole path, but only their readable work, proof prompts, and recognition views belong to them.";
    case "chapter_leader":
      return actor.chapterRoles.includes("President / VP")
        ? "President / VP can steer chapter operating work, but HQ proof-sharing, external sends, and platform admin controls still stay off."
        : "Leader follow-up lives inside the chapter lane. HQ proof-sharing decisions and platform controls stay separate.";
    case "coach":
      return "Coach reads chapter state and logs intervention posture later. Coach does not own membership truth, HQ proof-sharing, or platform controls.";
    case "admin":
      return "Admin can support proof posture and chapter operations, but real publishing, live automation, and DS-only system controls remain off.";
    case "super_admin":
      return "Full local visibility is not approval to enable production auth, writes, uploads, or external automation.";
    case "ds_admin":
      return "DS Admin can inspect integration posture only. Student truth, proof, points, and KPI movement remain outside this role.";
  }
}
