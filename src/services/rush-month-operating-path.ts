import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";
import { getSopWorkflowRuntime } from "@/services/sop-workflow-runtime";
import {
  canReadChapterData,
  getActorSurfaceFamily,
} from "@/services/role-visibility";
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
  runtimeStepId?: string;
  fallbackTitle: string;
  fallbackSummary: string;
  fallbackDueLabel: string;
};

const rushMonthPathSpecs: RushMonthPathSpec[] = [
  {
    id: "open-home",
    ownerLabel: "President / VP",
    runtimeStepId: "rush-visibility",
    fallbackTitle: "Open the chapter home and align the leader team",
    fallbackSummary: "Start the week by making sure the chapter understands the path.",
    fallbackDueLabel: "Week start",
  },
  {
    id: "assign-eboard",
    ownerLabel: "Leader / E-Board",
    runtimeStepId: "rush-events",
    fallbackTitle: "Assign Rush Month outreach owners",
    fallbackSummary: "Name the owners, due dates, and proof expectations for the push.",
    fallbackDueLabel: "Midweek",
  },
  {
    id: "member-push",
    ownerLabel: "General Member",
    runtimeStepId: "rush-actions",
    fallbackTitle: "Run the general member invite push",
    fallbackSummary: "Members do the invite work and bring back proof of what happened.",
    fallbackDueLabel: "Invite window",
  },
  {
    id: "proof-pack",
    ownerLabel: "Action Committee Chair",
    runtimeStepId: "rush-proof",
    fallbackTitle: "Submit the outreach proof pack",
    fallbackSummary: "Collect the chapter proof into one reviewable story for the next decision.",
    fallbackDueLabel: "Proof review",
  },
  {
    id: "coach-summary",
    ownerLabel: "Coach",
    runtimeStepId: "rush-recognition",
    fallbackTitle: "Prepare the coach-readable progress summary",
    fallbackSummary: "Coach reads the week and decides whether to advance, hold, or intervene.",
    fallbackDueLabel: "Coach check-in",
  },
];

export function getRushMonthOperatingPathView(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): RushMonthOperatingPathView {
  const runtime = getSopWorkflowRuntime("rush-month");
  const eyebrow =
    runtime?.currentStep?.title
      ? `Current checkpoint: ${runtime.currentStep.title}`
      : data.campaign.weekLabel;

  if (!canReadChapterData(actor)) {
    return {
      eyebrow,
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
    eyebrow,
    title: getPathTitle(actor),
    summary: getPathSummary(actor, runtime),
    boundaryNote: getBoundaryNote(actor),
    focusStepId,
    steps: rushMonthPathSpecs.map((spec) =>
      toOperatingPathStep(spec, data.assignments, currentStepId, focusStepId, runtime),
    ),
  };
}

function toOperatingPathStep(
  spec: RushMonthPathSpec,
  assignments: Assignment[],
  currentStepId: string | null,
  focusStepId: string | null,
  runtime: ReturnType<typeof getSopWorkflowRuntime>,
): RushMonthOperatingPathStep {
  const assignment = assignments.find((item) => item.id === spec.id);
  const runtimeStep =
    runtime?.steps.find((step) => step.id === spec.runtimeStepId) ?? null;
  const status = assignment?.status ?? "not_started";

  return {
    id: spec.id,
    ownerLabel: spec.ownerLabel,
    title: assignment?.title ?? runtimeStep?.title ?? spec.fallbackTitle,
    summary:
      buildRuntimeStepSummary(spec, runtimeStep) ??
      assignment?.instructions ??
      spec.fallbackSummary,
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

function buildRuntimeStepSummary(
  spec: RushMonthPathSpec,
  runtimeStep:
    | NonNullable<ReturnType<typeof getSopWorkflowRuntime>>["steps"][number]
    | null,
) {
  if (!runtimeStep) {
    return null;
  }

  switch (spec.id) {
    case "open-home":
      return `${runtimeStep.whyItMatters} ${runtimeStep.completionSignal}`;
    case "assign-eboard":
      return `${runtimeStep.whyItMatters} Keep the route-owned handoff visible before the chapter scales the next push.`;
    case "member-push":
      return `${runtimeStep.whyItMatters} ${runtimeStep.completionSignal}`;
    case "proof-pack":
      return `${runtimeStep.whyItMatters} ${runtimeStep.completionSignal}`;
    case "coach-summary":
      return `Coach uses proof and recognition context to read whether the chapter should advance, hold, or intervene. ${runtimeStep.whyItMatters}`;
  }
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
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return "member-push";
    case "coach":
      return "coach-summary";
    case "staff":
      return "proof-pack";
    case "super_admin":
      return "coach-summary";
    case "leader":
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
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return "See where your work fits in this week's Rush Month path.";
    case "leader":
      return actor.chapterRoles.includes("President / VP")
        ? "Lead the week without turning on live writes."
        : "Keep the outreach owners moving as one operating path.";
    case "coach":
      return "Read the chapter path before recording the coach decision.";
    case "staff":
      return "Support the proof-sharing posture without publishing anything.";
    case "super_admin":
      return "Inspect the full MVP path before approving live systems.";
    case "ds_admin":
      return "Inspect system posture without opening student campaign truth.";
  }
}

function getPathSummary(
  actor: LocalActorContext,
  runtime: ReturnType<typeof getSopWorkflowRuntime>,
): string {
  const phaseObjective = runtime?.currentPhase?.objective;
  const phaseExit = runtime?.currentPhase?.exitCriteria[0];

  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return buildPhaseAwareSummary(
        "Leader setup, member outreach, proof collection, and coach review are one sequence. Your action is the student-facing middle of that loop.",
        phaseObjective,
        phaseExit,
      );
    case "leader":
      return actor.chapterRoles.includes("President / VP")
        ? buildPhaseAwareSummary(
            "Set the owner path, clear proof follow-up, and hand the coach a readable chapter state before the next push.",
            phaseObjective,
            phaseExit,
          )
        : buildPhaseAwareSummary(
            "Keep the team moving by naming owners, checking follow-up, and making sure proof becomes reviewable chapter context.",
            phaseObjective,
            phaseExit,
          );
    case "coach":
      return buildPhaseAwareSummary(
        "The coach decision should come after assignments, proof, and visible movement make the chapter's week legible.",
        phaseObjective,
        phaseExit,
      );
    case "staff":
      return buildPhaseAwareSummary(
        "HQ should support review and proof-sharing posture while keeping app writes, publishing, and external sends off.",
        phaseObjective,
        phaseExit,
      );
    case "super_admin":
      return buildPhaseAwareSummary(
        "This view keeps the MVP legible across leader, member, proof, and coach checkpoints before any write-activation decision.",
        phaseObjective,
        phaseExit,
      );
    case "ds_admin":
      return "Integration safety belongs beside the operating path, not in place of it.";
  }
}

function buildPhaseAwareSummary(
  baseSummary: string,
  phaseObjective: string | undefined,
  phaseExit: string | undefined,
) {
  const additions = [
    phaseObjective ? `Current phase objective: ${phaseObjective}` : null,
    phaseExit ? `Exit signal: ${phaseExit}` : null,
  ].filter((value): value is string => Boolean(value));

  return additions.length ? `${baseSummary} ${additions.join(" ")}` : baseSummary;
}

function getBoundaryNote(actor: LocalActorContext): string {
  switch (getActorSurfaceFamily(actor)) {
    case "member":
      return "Members should understand the whole path, but only their readable work, proof prompts, and recognition views belong to them.";
    case "leader":
      return actor.chapterRoles.includes("President / VP")
        ? "President / VP can steer chapter operating work, but HQ proof-sharing, external sends, and platform admin controls still stay off."
        : "Leader follow-up lives inside the chapter lane. HQ proof-sharing decisions and platform controls stay separate.";
    case "coach":
      return "Coach reads chapter state and logs intervention posture later. Coach does not own membership truth, HQ proof-sharing, or platform controls.";
    case "staff":
      return "Admin can support proof posture and chapter operations, but real publishing, live automation, and DS-only system controls remain off.";
    case "super_admin":
      return "Full local visibility is not approval to enable production auth, writes, uploads, or external automation.";
    case "ds_admin":
      return "DS Admin can inspect integration posture only. Student truth, proof, points, and KPI movement remain outside this role.";
  }
}
