export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type DatabaseRoleKey =
  | "general_member"
  | "action_committee_member"
  | "action_committee_chair"
  | "e_board_member"
  | "president_vp"
  | "coach"
  | "admin"
  | "ds_admin"
  | "super_admin";

export type ProfileStatus = "active" | "inactive";
export type ChapterStatus = "active" | "inactive" | "archived";
export type MembershipStatus = "requested" | "approved" | "rejected" | "inactive";
export type StaffRoleStatus = "active" | "inactive" | "ended";
export type CoachAssignmentType = "expansion" | "portfolio";
export type AssignmentOwnerStatus = "active" | "inactive" | "ended";
export type CampaignStatus = "draft" | "active" | "complete" | "archived";
export type PhaseStatus = "not_started" | "active" | "complete";
export type AssignmentStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "changes_requested"
  | "canceled";
export type EvidenceType = "text" | "link" | "mock_file";
export type EvidenceStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "changes_requested";
export type ContentSharingStatus =
  | "submitted"
  | "in_hq_review"
  | "approved_for_sharing"
  | "not_shared"
  | "archived";
export type ApprovalDecision =
  | "approved_for_sharing"
  | "not_shared"
  | "changes_requested";
export type IntegrationDestination =
  | "internal"
  | "n8n"
  | "hubspot"
  | "luma"
  | "warehouse"
  | "power_bi";
export type IntegrationStatus =
  | "recorded"
  | "approved_for_mock"
  | "mocked"
  | "approved_for_live_send"
  | "sent"
  | "failed"
  | "disabled";
export type OutboxStatus =
  | "recorded"
  | "approved_for_mock"
  | "mocked"
  | "approved_for_live_send"
  | "sent"
  | "failed"
  | "dead_lettered"
  | "disabled";
export type ExternalSyncStatus =
  | "not_linked"
  | "linked"
  | "mocked"
  | "pending"
  | "failed"
  | "disabled";

type Timestamp = string;
type Uuid = string;

export type ProfileRow = {
  id: Uuid;
  display_name: string;
  email: string;
  status: ProfileStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type ChapterRow = {
  id: Uuid;
  name: string;
  campus: string;
  region: string | null;
  status: ChapterStatus;
  created_by: Uuid | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type MembershipRow = {
  id: Uuid;
  user_id: Uuid;
  chapter_id: Uuid;
  role_key: DatabaseRoleKey;
  status: MembershipStatus;
  requested_at: Timestamp;
  approved_at: Timestamp | null;
  approved_by: Uuid | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type StaffRoleAssignmentRow = {
  id: Uuid;
  user_id: Uuid;
  role_key: Extract<DatabaseRoleKey, "coach" | "admin" | "ds_admin" | "super_admin">;
  status: StaffRoleStatus;
  assigned_by: Uuid | null;
  assigned_at: Timestamp;
  ended_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type CoachChapterAssignmentRow = {
  id: Uuid;
  coach_user_id: Uuid;
  chapter_id: Uuid;
  coach_type: CoachAssignmentType;
  status: AssignmentOwnerStatus;
  starts_at: string;
  ends_at: string | null;
  assigned_by: Uuid | null;
  handoff_reason: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type CampaignRow = {
  id: Uuid;
  chapter_id: Uuid;
  name: string;
  slug: string;
  objective: string;
  status: CampaignStatus;
  opened_by: Uuid | null;
  opened_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type AssignmentRow = {
  id: Uuid;
  chapter_id: Uuid;
  campaign_id: Uuid;
  phase_id: Uuid | null;
  action_template_id: Uuid | null;
  action_committee_id: Uuid | null;
  chapter_event_id: Uuid | null;
  title: string;
  instructions: string;
  assigned_to_user_id: Uuid | null;
  assigned_to_role_key: DatabaseRoleKey | null;
  assigned_by_user_id: Uuid | null;
  status: AssignmentStatus;
  due_at: Timestamp | null;
  evidence_required: string;
  points: number;
  kpi_key: string;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type EvidenceItemRow = {
  id: Uuid;
  assignment_id: Uuid | null;
  chapter_id: Uuid;
  chapter_event_id: Uuid | null;
  submitted_by_user_id: Uuid;
  evidence_type: EvidenceType;
  summary: string;
  url: string | null;
  storage_path: string | null;
  target_audiences: string[];
  proof_categories: string[];
  messenger_type: string | null;
  lifecycle_stage: string | null;
  hesitation_addressed: string | null;
  status: EvidenceStatus;
  sharing_status: ContentSharingStatus;
  nps_score: number | null;
  activity_label: string | null;
  submitted_at: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type ApprovalRow = {
  id: Uuid;
  evidence_item_id: Uuid;
  chapter_id: Uuid;
  reviewer_user_id: Uuid;
  decision: ApprovalDecision;
  review_type: string;
  note: string;
  reviewed_at: Timestamp;
  created_at: Timestamp;
};

export type IntegrationEventRow = {
  id: Uuid;
  source_event_id: Uuid | null;
  chapter_id: Uuid | null;
  event_type: string;
  destination: IntegrationDestination;
  external_object_type: string | null;
  external_object_id: string | null;
  status: IntegrationStatus;
  payload: JsonValue;
  created_by: Uuid | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type AutomationOutboxRow = {
  id: Uuid;
  source_event_id: Uuid | null;
  integration_event_id: Uuid | null;
  chapter_id: Uuid | null;
  destination: IntegrationDestination;
  event_type: string;
  payload: JsonValue;
  idempotency_key: string;
  status: OutboxStatus;
  attempt_count: number;
  available_at: Timestamp;
  locked_at: Timestamp | null;
  sent_at: Timestamp | null;
  last_error: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};
