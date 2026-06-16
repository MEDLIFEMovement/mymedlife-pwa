import type { Metadata } from "next";

export type StaticRouteMetadataKey =
  | "home"
  | "login"
  | "chapter"
  | "campaigns"
  | "campaignDetail"
  | "actionCommittees"
  | "rushMonth"
  | "rushMonthDashboard"
  | "rushMonthLoop"
  | "rushMonthActions"
  | "rushMonthActionDetail"
  | "rushMonthEvidence"
  | "rushMonthReview"
  | "proofLibrary"
  | "coach"
  | "admin";

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
  coach: {
    title: "Coach Dashboard",
    description: "Coach portfolio readiness, risks, KPI movement, and disabled decisions.",
  },
  admin: {
    title: "Admin",
    description: "Admin review, smoke checks, write readiness, outbox, and launch posture.",
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
