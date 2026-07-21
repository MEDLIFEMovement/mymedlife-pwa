import type { Metadata } from "next";

export type StaticRouteMetadataKey =
  | "home"
  | "app"
  | "appStories"
  | "profile"
  | "onboarding"
  | "login"
  | "chapter"
  | "leader"
  | "chapterMembers"
  | "campaigns"
  | "campaignDetail"
  | "actionCommittees"
  | "sltPrep"
  | "sltPrepChecklist"
  | "sltPrepChecklistDetail"
  | "sltPrepForms"
  | "sltPrepPayments"
  | "sltPrepFlights"
  | "sltPrepMeetings"
  | "sltPrepExtensions"
  | "sltPrepTimeline"
  | "sltPrepNotifications"
  | "sltPrepProfile"
  | "sltPrepStaff"
  | "rushMonth"
  | "rushMonthDashboard"
  | "rushMonthLeaderboard"
  | "rushMonthLoop"
  | "rushMonthEvents"
  | "rushMonthEventDetail"
  | "rushMonthActions"
  | "rushMonthActionDetail"
  | "rushMonthEvidence"
  | "rushMonthReview"
  | "proofLibrary"
  | "proofUpload"
  | "coach"
  | "staff"
  | "admin"
  | "adminPhase2"
  | "adminReviewPath"
  | "adminNickReview"
  | "adminReleaseReadiness"
  | "adminLaunchGate"
  | "adminAuditLog"
  | "adminIntegrations"
  | "adminFeatureFlags"
  | "adminTheme"
  | "adminLumaLivePilot"
  | "adminIntegrationProvider"
  | "adminIntegrationAudit"
  | "adminIntegrationOutbox"
  | "adminMasterData"
  | "adminPermissions"
  | "adminCommittees"
  | "adminWorkflows"
  | "adminSopLibrary"
  | "adminSopBuilder"
  | "adminDatabaseSecurity"
  | "adminSystemHealth"
  | "adminPhase2Review"
  | "adminEnvironmentSetup"
  | "adminAuthOnboarding"
  | "adminSecurityGate"
  | "adminDesignQa"
  | "adminOperations"
  | "adminFirstWrite"
  | "adminWriteSequence"
  | "adminProofWrite"
  | "adminHqProofWrite"
  | "adminPointsWrite"
  | "adminSltChecklistWrite"
  | "adminAssignmentWrite"
  | "adminCoachWrite"
  | "adminPilotScope"
  | "adminStaffDryRun";

const routeMetadata: Record<StaticRouteMetadataKey, Metadata> = {
  home: {
    title: "Home",
    description:
      "Member-first myMEDLIFE home with the current campaign, next action, events, points, and profile routing.",
  },
  app: {
    title: "Member App",
    description:
      "General member myMEDLIFE app with Rush Month actions, events, proof, points, leaderboard, and profile routing.",
  },
  appStories: {
    title: "MEDLIFE Stories",
    description:
      "Read-only member stories feed with staff-curated moments, blocked publishing controls, and route-backed member navigation.",
  },
  profile: {
    title: "Profile",
    description:
      "Read-only local profile, role scope, next action, and future onboarding posture.",
  },
  onboarding: {
    title: "Onboarding",
    description:
      "Read-only auth, profile, chapter join, membership approval, and role assignment readiness.",
  },
  login: {
    title: "Local Sign In",
    description:
      "Sign in to myMEDLIFE and let the app route each user into the correct workspace.",
  },
  chapter: {
    title: "Student Leadership Command Center",
    description:
      "Chapter leadership home, member pipeline, committees, events, impact, succession, and feed analytics for the student leader surface.",
  },
  leader: {
    title: "Leader Command Center",
    description:
      "Student leader command center with chapter overview, member pipeline, committees, events, impact, succession, and feed analytics.",
  },
  chapterMembers: {
    title: "Chapter Members",
    description:
      "Read-only chapter roster, join-request, role coverage, and membership approval posture.",
  },
  campaigns: {
    title: "Campaigns",
    description: "Reusable MEDLIFE campaign shells and operating models.",
  },
  campaignDetail: {
    title: "Campaign Detail",
    description: "Campaign actions, events, proof posture, KPIs, and disabled integrations.",
  },
  actionCommittees: {
    title: "Action Committees",
    description: "Action committee event planning, owners, feedback, and proof prompts.",
  },
  sltPrep: {
    title: "SLT Trip Prep",
    description:
      "Mobile-first Peru SLT traveler readiness, countdown, alerts, checklist, payments, flights, and notifications.",
  },
  sltPrepChecklist: {
    title: "SLT Checklist",
    description:
      "Traveler readiness checklist with owner, evidence, due date, and mock-safe completion posture.",
  },
  sltPrepChecklistDetail: {
    title: "SLT Checklist Detail",
    description:
      "One traveler-readiness checkpoint with context, evidence, owner, and preview-only completion posture.",
  },
  sltPrepForms: {
    title: "SLT Forms",
    description:
      "Required traveler forms, review states, and signature blockers without enabling live form writes.",
  },
  sltPrepPayments: {
    title: "SLT Payments",
    description:
      "Mock-safe payment milestones shaped for future Shopify-backed travel finance states.",
  },
  sltPrepFlights: {
    title: "SLT Flights",
    description:
      "Dedicated flight itinerary review for outbound and return segments, airport timing, and mock-safe travel coordination.",
  },
  sltPrepMeetings: {
    title: "SLT Meetings",
    description:
      "Pre-trip meetings and traveler attendance posture shaped for future Luma-backed readiness tracking.",
  },
  sltPrepExtensions: {
    title: "SLT Extensions",
    description:
      "Optional extensions and tours with readable status, price, and mock-safe decision posture.",
  },
  sltPrepTimeline: {
    title: "SLT Timeline",
    description:
      "Trip prep timeline from current readiness through departure for Peru SLT July 2026.",
  },
  sltPrepNotifications: {
    title: "SLT Notifications",
    description:
      "Traveler notifications, reminders, and update posture with live sends still disabled.",
  },
  sltPrepProfile: {
    title: "SLT Profile",
    description:
      "Traveler profile, alerts, communication posture, and flights in one mock-safe SLT destination.",
  },
  sltPrepStaff: {
    title: "SLT Staff Dashboard",
    description:
      "Coach and staff traveler-readiness dashboard with risk filters, bulk-action previews, and no live writes.",
  },
  rushMonth: {
    title: "Rush Month",
    description: "Rush Month campaign shell, closeout readiness, events, proof, and KPIs.",
  },
  rushMonthDashboard: {
    title: "Rush Month Dashboard",
    description: "Role-aware Rush Month dashboard, actions, metrics, proof, and recognition.",
  },
  rushMonthLeaderboard: {
    title: "Rush Month Leaderboard",
    description:
      "Mock-safe member points, recognition, leaderboard, and chapter impact readout.",
  },
  rushMonthLoop: {
    title: "Rush Month MVP Loop",
    description: "Mock-safe end-to-end Rush Month operating loop for reviewers.",
  },
  rushMonthEvents: {
    title: "Rush Month Events",
    description:
      "Mock-safe Rush Month event, Luma, NPS, proof, and outbox readiness.",
  },
  rushMonthEventDetail: {
    title: "Rush Month Event Detail",
    description:
      "Role-aware Rush Month event detail with RSVP status, next action, proof prompt, and event context.",
  },
  rushMonthActions: {
    title: "Rush Month Actions",
    description: "Role-aware assignments, follow-up board, and disabled assignment creation.",
  },
  rushMonthActionDetail: {
    title: "Action Detail",
    description: "Assignment detail, evidence expectations, and disabled proof/action write gates.",
  },
  rushMonthEvidence: {
    title: "Proof And Evidence",
    description:
      "Member evidence submission queue, proof prep checklist, proof status, and disabled upload posture.",
  },
  rushMonthReview: {
    title: "HQ Proof Review",
    description: "HQ proof-sharing review posture and disabled sharing decision gates.",
  },
  proofLibrary: {
    title: "Proof Library",
    description: "Bridge videos, testimonials, and proof-sharing review states.",
  },
  proofUpload: {
    title: "Proof Upload Readiness",
    description:
      "Mock-safe proof and bridge-video upload intake requirements with uploads disabled.",
  },
  coach: {
    title: "Staff Command Center",
    description: "Staff-supported chapter readiness, risks, KPI movement, and disabled decisions.",
  },
  staff: {
    title: "Staff Command Center",
    description:
      "Desktop-first chapter portfolio, proof review, feed curation, HubSpot posture, and admin health with live writes still disabled.",
  },
  admin: {
    title: "Admin",
    description: "Admin review, smoke checks, write readiness, outbox, and launch posture.",
  },
  adminPhase2: {
    title: "Admin Phase 2",
    description:
      "Read-only Phase 2 closeout review packet that brings together release posture, dry run, onboarding, pilot scope, design QA, and the first hosted write decision.",
  },
  adminReviewPath: {
    title: "Admin Review Path",
    description:
      "Read-only no-code stakeholder review path with fake actor emails, routes, and safety boundaries.",
  },
  adminNickReview: {
    title: "Nick Final Review",
    description:
      "Read-only final local MVP review packet with owner lanes, pass signals, and launch boundaries.",
  },
  adminReleaseReadiness: {
    title: "Admin Release Readiness",
    description:
      "Read-only MVP release-readiness summary, local review posture, launch blockers, and next approvals.",
  },
  adminLaunchGate: {
    title: "Admin Launch Gate",
    description:
      "Read-only production launch gate, missing evidence, owner sign-off, rollback, and pilot-readiness review.",
  },
  adminAuditLog: {
    title: "Admin Audit Log",
    description:
      "Read-only audit-log posture with admin readback, DS safety review, and writes disabled.",
  },
  adminIntegrations: {
    title: "Admin Integrations",
    description:
      "DS-only secure provider configuration with write-only credential posture, masked metadata, and audited server-only actions.",
  },
  adminFeatureFlags: {
    title: "Admin Feature Flags",
    description:
      "Supabase-backed rollout controls for review auth, write gates, Luma loop posture, and blocked production integrations.",
  },
  adminTheme: {
    title: "Admin Theme Settings",
    description:
      "Supabase-backed theme tokens for the white-blue app shell across local, staging, and production review.",
  },
  adminLumaLivePilot: {
    title: "Admin Luma Live Pilot",
    description:
      "Staging-only Luma event, RSVP, attendance, points, audit, and outbox proof route with production still blocked.",
  },
  adminIntegrationProvider: {
    title: "Provider Configuration",
    description:
      "DS-only provider detail with environment-separated metadata, write-only credential entry, safe tests, and audit history.",
  },
  adminIntegrationAudit: {
    title: "Integrations Security Audit",
    description:
      "DS-only audit history for secure provider access, step-up, credential changes, connection tests, and disable actions.",
  },
  adminIntegrationOutbox: {
    title: "Admin Integration Outbox",
    description:
      "Read-only integration events, automation outbox, audit posture, and blocked live-send controls.",
  },
  adminMasterData: {
    title: "Admin Master Data",
    description:
      "Read-only users, roles, chapters, and campaign template inventory with admin writes disabled.",
  },
  adminPermissions: {
    title: "Admin Permissions",
    description:
      "Read-only canonical role, scope, landing-route, and route-family registry for the myMEDLIFE backend.",
  },
  adminCommittees: {
    title: "Admin Committees",
    description:
      "Read-only committee registry showing owner lanes, linked campaigns, and blocked admin mutation posture.",
  },
  adminWorkflows: {
    title: "Admin Workflows",
    description:
      "Read-only backend workflow registry for onboarding, writes, proof review, SLT readiness, coach intervention, and SOP configuration.",
  },
  adminSopLibrary: {
    title: "Admin SOP Library",
    description:
      "Read-only campaign workflow library with route-owned SOP definitions and admin edits still blocked.",
  },
  adminSopBuilder: {
    title: "Admin SOP Builder",
    description:
      "Read-only workflow builder tabs for steps, role matrix, completion, points/KPI, comms, preview, and version history.",
  },
  adminDatabaseSecurity: {
    title: "Admin Database Security",
    description:
      "Read-only Supabase versus PlanetScale security decision, RLS approval, and vendor-risk review.",
  },
  adminSystemHealth: {
    title: "Admin System Health",
    description:
      "Read-only system health, launch blocker, environment, audit, outbox, and production readiness review.",
  },
  adminPhase2Review: {
    title: "Admin Phase 2 Review",
    description:
      "Read-only Phase 2 readiness, issue map, write gates, owner responsibilities, and mock-only boundary review.",
  },
  adminEnvironmentSetup: {
    title: "Admin Environment Setup",
    description:
      "Read-only environment setup checklist covering local, preview, staging, production, env vars, and secret ownership boundaries.",
  },
  adminAuthOnboarding: {
    title: "Admin Auth Onboarding",
    description:
      "Read-only auth and onboarding foundation covering callback flow, role routing, ownership, duplicate handling, and rollback boundaries.",
  },
  adminSecurityGate: {
    title: "Admin Security Gate",
    description:
      "Read-only RLS and security gate covering schema exposure, direct-write denials, audit proof, storage gating, and hosted review requirements.",
  },
  adminDesignQa: {
    title: "Admin Design QA",
    description:
      "Read-only Figma, mobile viewport, accessibility, role complexity, and pilot-safety QA review.",
  },
  adminOperations: {
    title: "Admin Operations",
    description:
      "Read-only production operations runbook, incident response, rollback, backup, and support review.",
  },
  adminFirstWrite: {
    title: "First Write Drill",
    description:
      "Staff-only local action-start write drill for proving the first guarded Rush Month save.",
  },
  adminWriteSequence: {
    title: "Write Sequence",
    description:
      "Staff-only Rush Month write promotion order, expected proof, and disabled external-send posture.",
  },
  adminProofWrite: {
    title: "Proof Metadata Packet",
    description:
      "Staff-only local proof/testimonial metadata packet with uploads and external sends disabled.",
  },
  adminHqProofWrite: {
    title: "HQ Story Review",
    description:
      "Staff-only proof moderation queue with authenticated member-feed approval and public publishing disabled.",
  },
  adminPointsWrite: {
    title: "Points And KPI Packet",
    description:
      "Staff-only local packet for reviewing points/KPI materialization, duplicate posture, and audit linkage.",
  },
  adminSltChecklistWrite: {
    title: "SLT Checklist Packet",
    description:
      "Staff-only local packet for reviewing traveler-owned checklist completion, readiness deltas, and locked external travel systems.",
  },
  adminAssignmentWrite: {
    title: "Leader Assignment Packet",
    description:
      "Staff-only local leader assignment creation packet with reminders and external sends disabled.",
  },
  adminCoachWrite: {
    title: "Coach Decision Packet",
    description:
      "Staff-only local coach decision packet with escalation packets and external sends disabled.",
  },
  adminPilotScope: {
    title: "Pilot Scope",
    description:
      "Staff-only first pilot scope planner for choosing the smallest safe Rush Month pilot.",
  },
  adminStaffDryRun: {
    title: "Staff Dry Run",
    description:
      "Staff-only fake-user rehearsal path for the Rush Month MVP before staging or student pilot approval.",
  },
};

export function getStaticRouteMetadata(key: StaticRouteMetadataKey): Metadata {
  return routeMetadata[key];
}

export function getStaticRouteMetadataEntries() {
  return Object.entries(routeMetadata).map(([key, metadata]) => ({
    key: key as StaticRouteMetadataKey,
    metadata,
  }));
}
