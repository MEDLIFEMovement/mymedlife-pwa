import {
  calculateKpiSummary,
  calculatePointsSummary,
  getCoachDecisionState,
} from "@/services/rush-month-service";
import type {
  Assignment,
  IntegrationEvent,
  KPIEvent,
  KpiSummary,
  PointsEvent,
  PointsSummary,
} from "@/shared/types/domain";
import type { KpiEventRow, PointsEventRow } from "@/shared/types/persistence";

export type MetricsPostureSource =
  | "points_events"
  | "kpi_events"
  | "assignment_preview"
  | "unknown";

export type MetricsPosture = {
  points: MetricsPostureSource;
  kpis: MetricsPostureSource;
  leaderboard: "mock_safe" | "unknown";
};

export type PointsKpiLedger = {
  pointsEvents: PointsEvent[];
  kpiEvents: KPIEvent[];
  pointsSummary: PointsSummary;
  kpiSummary: KpiSummary;
  posture: MetricsPosture;
};

export function buildPointsKpiLedger(input: {
  assignments: Assignment[];
  integrationEvents: IntegrationEvent[];
  pointsEventRows?: PointsEventRow[];
  kpiEventRows?: KpiEventRow[];
}): PointsKpiLedger {
  const pointsEvents = (input.pointsEventRows ?? []).map(toDomainPointsEvent);
  const kpiEvents = (input.kpiEventRows ?? []).map(toDomainKpiEvent);

  return {
    pointsEvents,
    kpiEvents,
    pointsSummary: summarizePoints(input.assignments, pointsEvents),
    kpiSummary: summarizeKpis(input.assignments, input.integrationEvents, kpiEvents),
    posture: {
      points: getPointsPosture(input.assignments, pointsEvents),
      kpis: getKpiPosture(input.assignments, input.integrationEvents, kpiEvents),
      leaderboard:
        pointsEvents.length > 0 || input.assignments.length > 0
          ? "mock_safe"
          : "unknown",
    },
  };
}

export function toDomainPointsEvent(row: PointsEventRow): PointsEvent {
  return {
    id: row.id,
    assignmentId: row.assignment_id ?? row.id,
    userId: row.awarded_to_user_id,
    points: row.points_delta,
    reason: row.reason,
  };
}

export function toDomainKpiEvent(row: KpiEventRow): KPIEvent {
  return {
    id: row.id,
    assignmentId: row.assignment_id ?? row.id,
    metric: row.metric_key,
    value: Number(row.metric_value),
  };
}

function summarizePoints(
  assignments: Assignment[],
  pointsEvents: PointsEvent[],
): PointsSummary {
  const available = assignments.reduce(
    (total, assignment) => total + assignment.points,
    0,
  );

  if (pointsEvents.length > 0) {
    const approvedActions = new Set(pointsEvents.map((event) => event.assignmentId)).size;

    return {
      earned: pointsEvents.reduce((total, event) => total + event.points, 0),
      available,
      approvedActions,
    };
  }

  return calculatePointsSummary(assignments);
}

function summarizeKpis(
  assignments: Assignment[],
  integrationEvents: IntegrationEvent[],
  kpiEvents: KPIEvent[],
): KpiSummary {
  if (kpiEvents.length === 0) {
    return calculateKpiSummary(assignments, integrationEvents);
  }

  return {
    invitePushes: summarizeInvitePushes(kpiEvents),
    proofPending: assignments.filter(
      (assignment) =>
        assignment.status === "submitted" ||
        assignment.status === "changes_requested",
    ).length,
    eventsLinked: integrationEvents.filter(
      (event) => event.eventType === "luma_event_linked",
    ).length,
    coachDecision: getCoachDecisionState(assignments),
  };
}

function summarizeInvitePushes(kpiEvents: KPIEvent[]) {
  return Math.round(
    kpiEvents.reduce((total, event) => {
      if (!event.metric.toLowerCase().includes("invite")) {
        return total;
      }

      return total + event.value;
    }, 0),
  );
}

function getPointsPosture(
  assignments: Assignment[],
  pointsEvents: PointsEvent[],
): MetricsPostureSource {
  if (pointsEvents.length > 0) {
    return "points_events";
  }

  return assignments.length > 0 ? "assignment_preview" : "unknown";
}

function getKpiPosture(
  assignments: Assignment[],
  integrationEvents: IntegrationEvent[],
  kpiEvents: KPIEvent[],
): MetricsPostureSource {
  if (kpiEvents.length > 0) {
    return "kpi_events";
  }

  return assignments.length > 0 || integrationEvents.length > 0
    ? "assignment_preview"
    : "unknown";
}
