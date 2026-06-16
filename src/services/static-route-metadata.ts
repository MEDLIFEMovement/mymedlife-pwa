import type { Metadata } from "next";

export type StaticRouteMetadataKey =
  | "home"
  | "login"
  | "chapter"
  | "chapterMembers"
  | "campaigns"
  | "campaignDetail"
  | "actionCommittees"
  | "rushMonth"
  | "rushMonthDashboard"
  | "rushMonthLoop"
  | "rushMonthEvents"
  | "rushMonthActions"
  | "rushMonthActionDetail"
  | "rushMonthEvidence"
  | "rushMonthReview"
  | "proofLibrary"
  | "proofUpload"
  | "coach"
  | "admin"
  | "adminFirstWrite"
  | "adminWriteSequence"
  | "adminProofWrite"
  | "adminHqProofWrite"
  | "adminAssignmentWrite"
  | "adminPilotScope"
  | "adminStaffDryRun";

const routeMetadata: Record<StaticRouteMetadataKey, Metadata> = {
  home: {
    title: "Home",
    description: "myMEDLIFE local review home for the Rush Month operating app.",
  },
  login: {
    title: "Local Sign In",
    description:
      "Local Supabase Auth sign-in for fake myMEDLIFE seed users and session readiness.",
  },
  chapter: {
    title: "Chapter",
    description: "Chapter operating context, role guidance, assignments, and progress.",
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
  rushMonth: {
    title: "Rush Month",
    description: "Rush Month campaign shell, closeout readiness, events, proof, and KPIs.",
  },
  rushMonthDashboard: {
    title: "Rush Month Dashboard",
    description: "Role-aware Rush Month dashboard, actions, metrics, proof, and recognition.",
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
    description: "Mock proof and testimonials for Rush Month action follow-up.",
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
    title: "Coach Dashboard",
    description: "Coach portfolio readiness, risks, KPI movement, and disabled decisions.",
  },
  admin: {
    title: "Admin",
    description: "Admin review, smoke checks, write readiness, outbox, and launch posture.",
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
    title: "HQ Proof Decision Packet",
    description:
      "Staff-only local HQ proof-sharing decision packet with public sharing and external sends disabled.",
  },
  adminAssignmentWrite: {
    title: "Leader Assignment Packet",
    description:
      "Staff-only local leader assignment creation packet with reminders and external sends disabled.",
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
