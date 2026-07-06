export type LaunchLaneRouteWorkspace =
  | "public"
  | "member"
  | "leader"
  | "staff"
  | "admin";

export type LaunchLaneRouteStatus = "active";

export type LaunchLaneRouteAccess = "public" | "owner_or_preview" | "owner_only";

export type LaunchLaneRouteSandboxReview = "supported";

export type LaunchLaneRouteProductionProof = "required";

export type LaunchLaneRouteReadiness = {
  canonicalHref: string;
  smokePath?: string;
  label: string;
  workspace: LaunchLaneRouteWorkspace;
  status: LaunchLaneRouteStatus;
  authRequirement: "public" | "signed_in";
  access: LaunchLaneRouteAccess;
  readOnly: true;
  sandboxReview: LaunchLaneRouteSandboxReview;
  productionProof: LaunchLaneRouteProductionProof;
  rolloutEvidence: "exclude_test_and_preview";
  notes: string;
};

const launchLaneAuthReadiness: readonly LaunchLaneRouteReadiness[] = [
  {
    canonicalHref: "/login",
    smokePath: "/login",
    label: "Shared sign-in surface",
    workspace: "public",
    status: "active",
    authRequirement: "public",
    access: "public",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "Local sandbox and preview review can exercise the shared sign-in entry point, but real production account proof is still required before rollout evidence can count.",
  },
  {
    canonicalHref: "/app",
    smokePath: "/app",
    label: "Member home",
    workspace: "member",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_or_preview",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "Members own this workspace. Staff, coach, and admin roles may review it locally in preview mode without turning that review into rollout evidence.",
  },
  {
    canonicalHref: "/app/events",
    smokePath: "/app/events",
    label: "Member events",
    workspace: "member",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_or_preview",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "Member event review stays read-only in local sandbox and preview mode. Production signed-in proof still needs a real member account.",
  },
  {
    canonicalHref: "/app/events/chapter-event-ucla-kickoff",
    smokePath: "/app/events/chapter-event-ucla-kickoff",
    label: "Member event detail",
    workspace: "member",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_or_preview",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "The event detail loop is part of local sandbox role proof, but any approved rollout packet still needs real production rows and signed-in proof.",
  },
  {
    canonicalHref: "/app/points",
    smokePath: "/app/points",
    label: "Member points",
    workspace: "member",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_or_preview",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "Local points readback stays read-only and can be reviewed with sandbox Test users, but it must stay out of production proof packets.",
  },
  {
    canonicalHref: "/app/stories",
    label: "Member stories",
    workspace: "member",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_or_preview",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "The member stories route is now live on current main. Local sandbox and preview review remain useful, but real production signed-in proof still requires a real member account and approved packet inputs.",
  },
  {
    canonicalHref: "/leader?view=overview",
    smokePath: "/leader",
    label: "Leader overview",
    workspace: "leader",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_or_preview",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "Leaders own this workspace. Staff and admin reviewers may open it in local preview mode, but production leader proof still needs a real signed-in leader account.",
  },
  {
    canonicalHref: "/staff?view=chapters",
    smokePath: "/staff",
    label: "Staff chapter portfolio",
    workspace: "staff",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_only",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "Staff and coach roles own this workspace. It should stay separate from member and leader proofs even when local sandbox reviewers can sign in safely.",
  },
  {
    canonicalHref: "/admin",
    smokePath: "/admin",
    label: "Admin home",
    workspace: "admin",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_only",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "Admin review routes can be exercised locally with sandbox DS/admin accounts, but they still need real production account proof before rollout approval.",
  },
  {
    canonicalHref: "/admin/users",
    smokePath: "/admin/users",
    label: "Admin users",
    workspace: "admin",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_only",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "User review stays in the admin-only safety lane and must not treat sandbox rows as launch-owner evidence.",
  },
  {
    canonicalHref: "/admin/chapters",
    smokePath: "/admin/chapters",
    label: "Admin chapters",
    workspace: "admin",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_only",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "Chapter review is admin-owned, read-only in sandbox, and still separate from any approved production packet evidence.",
  },
  {
    canonicalHref: "/admin/access",
    smokePath: "/admin/access",
    label: "Admin access matrix",
    workspace: "admin",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_only",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "The access matrix is an admin-only review surface and should remain a proof aid, not a substitute for production auth evidence.",
  },
  {
    canonicalHref: "/admin/launch-gate",
    smokePath: "/admin/launch-gate",
    label: "Admin launch gate",
    workspace: "admin",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_only",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "The launch gate can be reviewed locally, but sandbox Test/Figma rows must never satisfy the real production gate.",
  },
  {
    canonicalHref: "/admin/audit-log",
    smokePath: "/admin/audit-log",
    label: "Admin audit log",
    workspace: "admin",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_only",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "Audit review remains admin-only and must keep local sandbox artifacts clearly separated from production approval evidence.",
  },
  {
    canonicalHref: "/admin/integration-outbox",
    smokePath: "/admin/integration-outbox",
    label: "Admin integration outbox",
    workspace: "admin",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_only",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "The outbox route remains read-only here and should never trigger sends or turn sandbox fixtures into rollout evidence.",
  },
  {
    canonicalHref: "/admin/integrations/luma",
    smokePath: "/admin/integrations/luma",
    label: "Admin Luma integration",
    workspace: "admin",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_only",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "The Luma review surface is admin-only and must remain a no-write review step until a separate production readiness lane approves it.",
  },
  {
    canonicalHref: "/admin/pilot-scope",
    smokePath: "/admin/pilot-scope",
    label: "Admin pilot scope",
    workspace: "admin",
    status: "active",
    authRequirement: "signed_in",
    access: "owner_only",
    readOnly: true,
    sandboxReview: "supported",
    productionProof: "required",
    rolloutEvidence: "exclude_test_and_preview",
    notes:
      "Pilot-scope review belongs to the admin safety lane and still requires real production proof outside sandbox.",
  },
];

export function getLaunchLaneAuthReadiness(): LaunchLaneRouteReadiness[] {
  return [...launchLaneAuthReadiness];
}

export function getActiveLaunchLaneAuthReadiness(): LaunchLaneRouteReadiness[] {
  return launchLaneAuthReadiness.filter((route) => route.status === "active");
}

export function getBlockedLaunchLaneAuthReadiness(): LaunchLaneRouteReadiness[] {
  return [];
}

export function getLaunchLaneAuthReadinessByHref(
  canonicalHref: string,
): LaunchLaneRouteReadiness | undefined {
  return launchLaneAuthReadiness.find((route) => route.canonicalHref === canonicalHref);
}
