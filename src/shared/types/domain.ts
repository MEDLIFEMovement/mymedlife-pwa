export type RoleKey = "member" | "leader" | "coach" | "admin";

export type User = {
  id: string;
  displayName: string;
  email: string;
};

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
  | "Admin"
  | "Super Admin"
  | "Coach";

export type Membership = {
  id: string;
  userId: string;
  chapterId: string;
  roles: ChapterRole[];
  status: "requested" | "approved" | "inactive";
};

export type Role = {
  key: ChapterRole;
  label: string;
  chapterScoped: boolean;
};

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

export type Phase = {
  id: string;
  campaignId: string;
  title: string;
  objective: string;
  status: "not_started" | "active" | "complete";
};

export type ActionTemplate = {
  id: string;
  campaignId: string;
  title: string;
  defaultOwnerRole: ChapterRole;
  evidenceRequired: string;
  points: number;
  kpi: string;
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
  evidenceType:
    | "text"
    | "link"
    | "mock_file"
    | "testimonial_text"
    | "bridge_video"
    | "event_photo"
    | "attendance_log"
    | "feedback_form"
    | "tracker_screenshot"
    | "planning_doc"
    | "recap_note"
    | "external_link";
  summary: string;
  status: "pending_review" | "approved" | "rejected" | "changes_requested";
};

export type Approval = {
  id: string;
  evidenceItemId: string;
  reviewerRole: ChapterRole;
  decision: "approved" | "rejected" | "changes_requested";
  note: string;
};

export type PointsEvent = {
  id: string;
  assignmentId: string;
  userId: string;
  points: number;
  reason: string;
};

export type KPIEvent = {
  id: string;
  assignmentId: string;
  metric: string;
  value: number;
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

export type AutomationOutbox = {
  id: string;
  sourceEventId: string;
  destination: "n8n" | "HubSpot" | "Luma" | "warehouse";
  status: "recorded" | "mocked" | "disabled";
  payloadSummary: string;
};

export type AuditLog = {
  id: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
};

export type OutboxItem = AutomationOutbox;
