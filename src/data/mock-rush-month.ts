import type {
  Assignment,
  Campaign,
  Chapter,
  EvidenceItem,
  IntegrationEvent,
  KpiSummary,
  OutboxItem,
  PointsSummary,
  RoleContext,
} from "@/shared/types/domain";
import type { KpiEventRow, PointsEventRow } from "@/shared/types/persistence";

export const mockChapter: Chapter = {
  id: "chapter-northview",
  name: "UCLA MEDLIFE",
  campus: "UCLA",
  region: "West Coast",
  coachName: "Renato Coach",
};

export const mockCampaign: Campaign = {
  id: "rush-month-2026",
  name: "Rush Month",
  objective:
    "Help the chapter invite new students, collect proof of outreach, and prepare a coach-readable progress decision.",
  weekLabel: "Week 1: Invite and prove the first push",
  status: "active",
};

export const roleContexts: RoleContext[] = [
  {
    key: "member",
    label: "General Member",
    audience: "Chapter members",
    description: "See your assigned action, what proof is needed, and your points.",
    startPath: "/rush-month/actions/member-push",
  },
  {
    key: "leader",
    label: "Chapter Leader / E-Board",
    audience: "Leaders",
    description: "Assign work, review evidence, and keep the chapter on track.",
    startPath: "/rush-month/actions",
  },
  {
    key: "coach",
    label: "Coach",
    audience: "Coaches",
    description: "Read chapter health, risk, proof, KPIs, and the decision state.",
    startPath: "/coach",
  },
  {
    key: "admin",
    label: "Admin / Super Admin",
    audience: "Platform team",
    description: "View mock integration posture and future admin placeholders.",
    startPath: "/admin",
  },
];

export const assignments: Assignment[] = [
  {
    id: "open-home",
    title: "Open the chapter home and align the leader team",
    ownerRole: "Chapter President / Vice President",
    lane: "Leader",
    dueLabel: "Tuesday",
    status: "approved",
    evidenceRequired: "Leader note confirming the operating path was reviewed.",
    instructions:
      "Open the chapter home, read the Rush Month objective, and confirm the E-Board understands this week's path.",
    points: 10,
    kpi: "Leader alignment completed",
  },
  {
    id: "assign-eboard",
    title: "Assign Rush Month outreach owners",
    ownerRole: "E-Board Member",
    lane: "Leader",
    dueLabel: "Wednesday",
    status: "submitted",
    evidenceRequired: "Assignment list with owner, due date, and proof requirement.",
    instructions:
      "Assign outreach work to E-Board members, Action Committee chairs, and general members.",
    points: 20,
    kpi: "Role-based assignments created",
  },
  {
    id: "member-push",
    title: "Invite 3 friends to the Intro GBM",
    ownerRole: "General Member",
    lane: "Member",
    dueLabel: "Nov 15",
    status: "not_started",
    evidenceRequired: "Message screenshot, invite list, or event RSVP link.",
    instructions:
      "Invite three students to the Intro GBM using the approved chapter message, then submit proof that shows the real outreach happened.",
    points: 30,
    kpi: "Student invites sent",
  },
  {
    id: "share-rush-flyer",
    title: "Share Rush Week flyer on Instagram",
    ownerRole: "General Member",
    lane: "Member",
    dueLabel: "Nov 16",
    status: "in_progress",
    evidenceRequired: "Story screenshot or post link with chapter branding visible.",
    instructions:
      "Share the approved Rush Week flyer on Instagram and keep the screenshot or link ready for proof submission.",
    points: 15,
    kpi: "Rush Week flyer shared",
  },
  {
    id: "welcome-table",
    title: "Add 5 leads",
    ownerRole: "General Member",
    lane: "Member",
    dueLabel: "Nov 14",
    status: "submitted",
    evidenceRequired: "Lead list screenshot, QR sign-up export, or roster note with five new contacts.",
    instructions:
      "Capture five real student leads at tabling or after the Intro GBM, then submit the list or export so the chapter can follow up clearly.",
    points: 25,
    kpi: "Lead capture completed",
  },
  {
    id: "proof-pack",
    title: "Submit the outreach proof pack",
    ownerRole: "Action Committee Chair",
    lane: "Leader",
    dueLabel: "Friday",
    status: "changes_requested",
    evidenceRequired: "Combined proof bundle with photos, links, or attendance notes.",
    instructions:
      "Collect member proof into one reviewable package so leaders and coaches can understand what happened.",
    points: 20,
    kpi: "Proof package ready",
  },
  {
    id: "coach-summary",
    title: "Prepare the coach-readable progress summary",
    ownerRole: "Coach",
    lane: "Coach",
    dueLabel: "Friday",
    status: "not_started",
    evidenceRequired: "Advance / hold / intervene recommendation with rationale.",
    instructions:
      "Review overdue work, pending proof, and KPI movement before logging the chapter decision.",
    points: 15,
    kpi: "Coach decision logged",
  },
];

export const evidenceItems: EvidenceItem[] = [
  {
    id: "evidence-assign-eboard",
    assignmentId: "assign-eboard",
    submittedBy: "Kiomi Leader",
    evidenceType: "link",
    summary: "Shared assignment tracker link with owners and Friday due dates.",
    status: "pending_review",
  },
  {
    id: "evidence-proof-pack",
    assignmentId: "proof-pack",
    submittedBy: "Action Committee Chair",
    evidenceType: "bridge_video",
    summary: "Bridge video needs clearer context before HQ decides whether to share it.",
    status: "changes_requested",
    storagePath:
      "chapters/10000000-0000-4000-8000-000000000001/evidence/evidence-proof-pack/rush-proof-pack.mov",
  },
];

export const pointsSummary: PointsSummary = {
  earned: 10,
  available: 95,
  approvedActions: 1,
};

export const kpiSummary: KpiSummary = {
  invitePushes: 2,
  proofPending: 2,
  eventsLinked: 1,
  coachDecision: "hold",
};

export const integrationEvents: IntegrationEvent[] = [
  {
    id: "evt-001",
    eventType: "campaign_opened",
    title: "Rush Month opened",
    destination: "internal",
    status: "recorded",
    detail: "Chapter home routed into the Rush Month operating shell.",
    occurredAt: "08:05",
  },
  {
    id: "evt-002",
    eventType: "action_assigned",
    title: "Outreach owners assigned",
    destination: "n8n",
    status: "disabled",
    detail: "Future n8n reminder workflow would consume this event after approval.",
    occurredAt: "08:12",
  },
  {
    id: "evt-003",
    eventType: "luma_event_linked",
    title: "Luma event link stored",
    destination: "Luma",
    status: "mocked",
    detail: "Mock Luma URL recorded. No Luma API write happened.",
    occurredAt: "08:24",
  },
  {
    id: "evt-004",
    eventType: "hubspot_handoff_mocked",
    title: "HubSpot handoff mocked",
    destination: "HubSpot",
    status: "mocked",
    detail: "Future CRM handoff payload was shaped but not sent.",
    occurredAt: "08:31",
  },
  {
    id: "evt-005",
    eventType: "warehouse_export_mocked",
    title: "Warehouse export mocked",
    destination: "warehouse",
    status: "mocked",
    detail: "Governed warehouse and Power BI export payload was shaped but not sent.",
    occurredAt: "08:39",
  },
  {
    id: "evt-006",
    eventType: "ai_recommendation_contract_logged",
    title: "AI recommendation contract logged",
    destination: "internal",
    status: "recorded",
    detail:
      "Prompt, reviewer, and output-shape contract were recorded locally. No model call or outbound send happened.",
    occurredAt: "08:46",
  },
];

export const outboxItems: OutboxItem[] = [
  {
    id: "outbox-001",
    sourceEventId: "evt-002",
    destination: "n8n",
    status: "disabled",
    payloadSummary: "Reminder job for assigned Rush Month outreach owners.",
  },
  {
    id: "outbox-002",
    sourceEventId: "evt-003",
    destination: "Luma",
    status: "mocked",
    payloadSummary: "Mock event link and attendance import placeholder.",
  },
  {
    id: "outbox-003",
    sourceEventId: "evt-004",
    destination: "HubSpot",
    status: "mocked",
    payloadSummary: "Mock chapter outreach handoff for future CRM sync.",
  },
  {
    id: "outbox-004",
    sourceEventId: "evt-005",
    destination: "warehouse",
    status: "mocked",
    payloadSummary: "Mock governed export payload for warehouse and Power BI freshness checks.",
  },
];

export const pointsEventRows: PointsEventRow[] = [
  {
    id: "points-001",
    chapter_id: mockChapter.id,
    campaign_id: mockCampaign.id,
    assignment_id: "open-home",
    chapter_event_id: null,
    evidence_item_id: null,
    approval_id: null,
    awarded_to_user_id: "leader.a@mymedlife.test",
    points_delta: 10,
    reason: "Approved leader alignment check.",
    created_by: "admin@mymedlife.test",
    created_at: "2026-06-18T08:18:00.000Z",
  },
];

export const kpiEventRows: KpiEventRow[] = [
  {
    id: "kpi-001",
    chapter_id: mockChapter.id,
    campaign_id: mockCampaign.id,
    phase_id: null,
    assignment_id: "member-push",
    chapter_event_id: null,
    evidence_item_id: null,
    metric_key: "students_invited",
    metric_value: 2,
    unit: "students",
    source: "mock_assignment_review",
    created_by: "leader.a@mymedlife.test",
    created_at: "2026-06-18T08:22:00.000Z",
  },
  {
    id: "kpi-002",
    chapter_id: mockChapter.id,
    campaign_id: mockCampaign.id,
    phase_id: null,
    assignment_id: "welcome-table",
    chapter_event_id: null,
    evidence_item_id: null,
    metric_key: "leads_captured",
    metric_value: 47,
    unit: "leads",
    source: "mock_campaign_dashboard",
    created_by: "leader.a@mymedlife.test",
    created_at: "2026-06-18T08:23:00.000Z",
  },
  {
    id: "kpi-003",
    chapter_id: mockChapter.id,
    campaign_id: mockCampaign.id,
    phase_id: null,
    assignment_id: "member-push",
    chapter_event_id: null,
    evidence_item_id: null,
    metric_key: "intro_gbm_rsvps",
    metric_value: 23,
    unit: "students",
    source: "mock_luma_read_model",
    created_by: "leader.a@mymedlife.test",
    created_at: "2026-06-18T08:24:00.000Z",
  },
  {
    id: "kpi-004",
    chapter_id: mockChapter.id,
    campaign_id: mockCampaign.id,
    phase_id: null,
    assignment_id: "share-rush-flyer",
    chapter_event_id: null,
    evidence_item_id: null,
    metric_key: "followups_completed",
    metric_value: 18,
    unit: "followups",
    source: "mock_followup_tracker",
    created_by: "leader.a@mymedlife.test",
    created_at: "2026-06-18T08:25:00.000Z",
  },
  {
    id: "kpi-005",
    chapter_id: mockChapter.id,
    campaign_id: mockCampaign.id,
    phase_id: null,
    assignment_id: "proof-pack",
    chapter_event_id: null,
    evidence_item_id: null,
    metric_key: "new_members",
    metric_value: 9,
    unit: "students",
    source: "mock_membership_rollup",
    created_by: "leader.a@mymedlife.test",
    created_at: "2026-06-18T08:26:00.000Z",
  },
];
