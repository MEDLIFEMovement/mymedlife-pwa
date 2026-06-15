export type RoleKey = "member" | "leader" | "coach" | "admin";

export type RoleContext = {
  key: RoleKey;
  label: string;
  audience: string;
  description: string;
  startPath: string;
};

export type AssignmentStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "changes_requested";

export type AssignmentLane = "Member" | "Leader" | "Coach";

export type ChapterRole =
  | "General Member"
  | "Action Committee Member"
  | "Action Committee Chair"
  | "E-Board Member"
  | "Chapter President / Vice President"
  | "Coach";

export type Chapter = {
  id: string;
  name: string;
  campus: string;
  region: string;
  coachName: string;
};

export type Campaign = {
  id: string;
  name: string;
  objective: string;
  weekLabel: string;
  status: "draft" | "active" | "complete";
};

export type Assignment = {
  id: string;
  title: string;
  ownerRole: ChapterRole;
  lane: AssignmentLane;
  dueLabel: string;
  status: AssignmentStatus;
  evidenceRequired: string;
  instructions: string;
  points: number;
  kpi: string;
};

export type EvidenceItem = {
  id: string;
  assignmentId: string;
  submittedBy: string;
  evidenceType: "text" | "link" | "mock_file";
  summary: string;
  status: "pending_review" | "approved" | "changes_requested";
};

export type PointsSummary = {
  earned: number;
  available: number;
  approvedActions: number;
};

export type KpiSummary = {
  invitePushes: number;
  proofPending: number;
  eventsLinked: number;
  coachDecision: "advance" | "hold" | "intervene";
};

export type IntegrationEvent = {
  id: string;
  eventType: string;
  title: string;
  destination: "internal" | "n8n" | "HubSpot" | "Luma" | "warehouse";
  status: "recorded" | "mocked" | "disabled";
  detail: string;
  occurredAt: string;
};

export type OutboxItem = {
  id: string;
  sourceEventId: string;
  destination: "n8n" | "HubSpot" | "Luma" | "warehouse";
  status: "recorded" | "mocked" | "disabled";
  payloadSummary: string;
};
