import type { LocalActorContext } from "@/services/local-actor-context";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

export type CoachPortfolioDecision = "advance" | "hold" | "intervene";
export type CoachPortfolioRisk = "low" | "medium" | "high";
export type CoachAssignmentMode =
  | "expansion_coach"
  | "portfolio_coach"
  | "handoff_pending";

export type CoachPortfolioChapter = {
  chapterId: string;
  chapterName: string;
  campus: string;
  coachAssignmentMode: CoachAssignmentMode;
  coachName: string;
  readinessScore: number;
  decision: CoachPortfolioDecision;
  risk: CoachPortfolioRisk;
  proofPending: number;
  openFollowUps: number;
  nextStep: string;
  coachChangePosture: "read_only";
};

export type CoachPortfolioReadiness = {
  canReadPortfolio: boolean;
  title: string;
  summary: string;
  rows: CoachPortfolioChapter[];
  counts: {
    totalChapters: number;
    advance: number;
    hold: number;
    intervene: number;
    handoffsPending: number;
    coachChangesEnabled: 0;
  };
};

export function getCoachPortfolioReadiness(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): CoachPortfolioReadiness {
  if (!canReadCoachPortfolio(actor)) {
    return {
      canReadPortfolio: false,
      title: "Coach portfolio hidden for this role",
      summary:
        "Coach portfolio assignments are visible to coaches and HQ staff, not general members, chapter leaders, or DS Admin.",
      rows: [],
      counts: emptyCounts(),
    };
  }

  const rows = buildPortfolioRows(actor, data);

  return {
    canReadPortfolio: true,
    title: getPortfolioTitle(actor),
    summary:
      "This local readout previews how expansion and portfolio coaches can compare assigned chapters. Coach reassignment remains an admin-controlled future workflow.",
    rows,
    counts: {
      totalChapters: rows.length,
      advance: rows.filter((row) => row.decision === "advance").length,
      hold: rows.filter((row) => row.decision === "hold").length,
      intervene: rows.filter((row) => row.decision === "intervene").length,
      handoffsPending: rows.filter(
        (row) => row.coachAssignmentMode === "handoff_pending",
      ).length,
      coachChangesEnabled: 0,
    },
  };
}

function canReadCoachPortfolio(actor: LocalActorContext): boolean {
  return (
    actor.audience === "coach" ||
    actor.audience === "admin" ||
    actor.audience === "super_admin"
  );
}

function buildPortfolioRows(
  actor: LocalActorContext,
  data: ReadOnlyAppData,
): CoachPortfolioChapter[] {
  const currentChapter: CoachPortfolioChapter = {
    chapterId: data.chapter.id,
    chapterName: data.chapter.name,
    campus: data.chapter.campus,
    coachAssignmentMode: "expansion_coach",
    coachName: actor.audience === "coach" ? actor.user.displayName : data.chapter.coachName,
    readinessScore: scoreFromDecision(data.kpiSummary.coachDecision),
    decision: data.kpiSummary.coachDecision,
    risk: riskFromDecision(data.kpiSummary.coachDecision),
    proofPending: data.kpiSummary.proofPending,
    openFollowUps: data.assignments.filter((assignment) => assignment.status !== "approved")
      .length,
    nextStep: "Review the Rush Month loop before the next chapter check-in.",
    coachChangePosture: "read_only",
  };

  return sortPortfolioRows([
    currentChapter,
    {
      chapterId: "chapter-lakeside",
      chapterName: "Lakeside University MEDLIFE",
      campus: "Lakeside University",
      coachAssignmentMode: "portfolio_coach",
      coachName: actor.audience === "coach" ? actor.user.displayName : "Cam Coach",
      readinessScore: 84,
      decision: "advance",
      risk: "low",
      proofPending: 1,
      openFollowUps: 2,
      nextStep: "Share the strongest social-event proof with HQ for future reuse.",
      coachChangePosture: "read_only",
    },
    {
      chapterId: "chapter-riverside",
      chapterName: "Riverside State MEDLIFE",
      campus: "Riverside State",
      coachAssignmentMode: "portfolio_coach",
      coachName: actor.audience === "coach" ? actor.user.displayName : "Cam Coach",
      readinessScore: 42,
      decision: "intervene",
      risk: "high",
      proofPending: 4,
      openFollowUps: 7,
      nextStep: "Schedule support because owners are stuck and proof quality is low.",
      coachChangePosture: "read_only",
    },
    {
      chapterId: "chapter-mesa",
      chapterName: "Mesa College MEDLIFE",
      campus: "Mesa College",
      coachAssignmentMode: "handoff_pending",
      coachName: "Expansion coach to portfolio coach",
      readinessScore: 61,
      decision: "hold",
      risk: "medium",
      proofPending: 2,
      openFollowUps: 5,
      nextStep: "Confirm the phase handoff before changing coach ownership.",
      coachChangePosture: "read_only",
    },
  ]);
}

function scoreFromDecision(decision: CoachPortfolioDecision): number {
  switch (decision) {
    case "advance":
      return 82;
    case "hold":
      return 64;
    case "intervene":
      return 38;
  }
}

function riskFromDecision(decision: CoachPortfolioDecision): CoachPortfolioRisk {
  switch (decision) {
    case "advance":
      return "low";
    case "hold":
      return "medium";
    case "intervene":
      return "high";
  }
}

function sortPortfolioRows(rows: CoachPortfolioChapter[]): CoachPortfolioChapter[] {
  const decisionPriority: Record<CoachPortfolioDecision, number> = {
    intervene: 0,
    hold: 1,
    advance: 2,
  };

  return [...rows].sort((left, right) => {
    const decisionSort = decisionPriority[left.decision] - decisionPriority[right.decision];

    if (decisionSort !== 0) {
      return decisionSort;
    }

    return left.readinessScore - right.readinessScore;
  });
}

function getPortfolioTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "coach":
      return "Coach portfolio readiness";
    case "admin":
      return "HQ coach portfolio support";
    case "super_admin":
      return "Full local coach portfolio";
    case "chapter_member":
    case "chapter_leader":
    case "ds_admin":
      return "Coach portfolio hidden for this role";
  }
}

function emptyCounts(): CoachPortfolioReadiness["counts"] {
  return {
    totalChapters: 0,
    advance: 0,
    hold: 0,
    intervene: 0,
    handoffsPending: 0,
    coachChangesEnabled: 0,
  };
}
