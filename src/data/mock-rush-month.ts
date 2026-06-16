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

export const mockChapter: Chapter = {
  id: "chapter-northview",
  name: "Northview University MEDLIFE",
  campus: "Northview University",
  region: "Midwest",
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
    title: "Run the general member invite push",
    ownerRole: "General Member",
    lane: "Member",
    dueLabel: "Thursday",
    status: "in_progress",
    evidenceRequired: "Message screenshot, invite list, or event RSVP link.",
    instructions:
      "Invite students to the Rush Month event using the approved chapter message. Submit proof after the invite push.",
    points: 15,
    kpi: "Student invites sent",
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
  },
];

export const pointsSummary: PointsSummary = {
  earned: 10,
  available: 80,
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
];
