import type { ChapterEventPlan, ProofLibraryItem } from "@/shared/types/campaigns";
import type {
  Assignment,
  IntegrationEvent,
  KpiSummary,
  OutboxItem,
  PointsSummary,
} from "@/shared/types/domain";
import type { RiskFlagRow } from "@/shared/types/persistence";

export type DashboardAudience =
  | "chapter_member"
  | "chapter_leader"
  | "coach"
  | "admin"
  | "ds_admin"
  | "super_admin";

export type DashboardSurfaceFamily =
  | "member"
  | "leader"
  | "coach"
  | "staff"
  | "ds_admin"
  | "super_admin";

export type LeaderboardRow = {
  id: string;
  displayName: string;
  roleLabel: string;
  points: number;
  completedActions: number;
  recognition: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  note: string;
};

export type DashboardPhaseSummary = {
  label: string;
  status: string;
  note: string;
};

export type DashboardNextStep = {
  label: string;
  href: string;
  summary: string;
  ctaLabel: string;
};

export type DashboardActionGroup = {
  label: string;
  summary: string;
  href: string;
  linkLabel: string;
};

export type DashboardRoleFocusItem = {
  label: string;
  value: string;
  note: string;
};

export type DashboardRoleFocus = {
  roleLabel: string;
  title: string;
  summary: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  safetyNote: string;
  items: DashboardRoleFocusItem[];
};

export type RushMonthDashboard = {
  audience: DashboardAudience;
  surfaceFamily: DashboardSurfaceFamily;
  roleLabel: string;
  eyebrow: string;
  title: string;
  summary: string;
  canReadChapterTruth: boolean;
  phaseSummary: DashboardPhaseSummary;
  whyItMatters: string;
  nextStep: DashboardNextStep;
  actionGroups: DashboardActionGroup[];
  roleFocus: DashboardRoleFocus | null;
  metrics: DashboardMetric[];
  visibleAssignments: Assignment[];
  eventPlans: ChapterEventPlan[];
  proofItems: ProofLibraryItem[];
  leaderboard: LeaderboardRow[];
  pointsSummary: PointsSummary;
  kpiSummary: KpiSummary;
  risks: RiskFlagRow[];
  alerts: string[];
  integrationEvents: IntegrationEvent[];
  outboxItems: OutboxItem[];
};
