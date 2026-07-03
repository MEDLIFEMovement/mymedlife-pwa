import type { Phase2Owner } from "@/services/phase-2-safe-prep";

export type Phase2AuthFoundationStatus =
  | "ready_for_review"
  | "owner_input_required";

export type Phase2RoleRoute = {
  audience:
    | "member"
    | "chapter_leader"
    | "coach"
    | "staff"
    | "admin"
    | "ds_admin"
    | "super_admin";
  preferredRoute: string;
  fallbackRoute: string;
  reason: string;
};

export type Phase2ProfileRule = {
  key: string;
  label: string;
  status: Phase2AuthFoundationStatus;
  rule: string;
};

export type Phase2OwnerDecision = {
  key: string;
  label: string;
  owners: Phase2Owner[];
  status: Phase2AuthFoundationStatus;
  decision: string;
};

export type Phase2AuthFoundationPacket = {
  title: string;
  summary: string;
  liveAuthBlocked: true;
  callbackRoute: string;
  identitySourceOfTruth: string;
  roleRoutes: Phase2RoleRoute[];
  profileRules: Phase2ProfileRule[];
  ownerDecisions: Phase2OwnerDecision[];
  blockedLiveActions: string[];
  officialReferences: { label: string; url: string }[];
  counts: {
    roleRoutes: number;
    readyForReview: number;
    ownerInputRequired: number;
  };
};

const roleRoutes: Phase2RoleRoute[] = [
  {
    audience: "member",
    preferredRoute: "/",
    fallbackRoute: "/rush-month",
    reason: "Member flow should land in the mobile app home with the next action visible.",
  },
  {
    audience: "chapter_leader",
    preferredRoute: "/chapter",
    fallbackRoute: "/rush-month/dashboard",
    reason: "Leaders need the chapter operating system first, not the member-only shell.",
  },
  {
    audience: "coach",
    preferredRoute: "/coach",
    fallbackRoute: "/staff",
    reason: "Coach users need portfolio support posture before HQ admin tools.",
  },
  {
    audience: "staff",
    preferredRoute: "/staff",
    fallbackRoute: "/admin",
    reason: "HQ staff should land on the command center before the admin evidence routes.",
  },
  {
    audience: "admin",
    preferredRoute: "/admin",
    fallbackRoute: "/staff",
    reason: "Admin users should see review and control surfaces immediately after sign-in.",
  },
  {
    audience: "ds_admin",
    preferredRoute: "/admin/phase-2",
    fallbackRoute: "/admin",
    reason: "DS Admin needs the explicit review and security boundary first.",
  },
  {
    audience: "super_admin",
    preferredRoute: "/admin",
    fallbackRoute: "/staff",
    reason: "Super Admin owns the widest review surface and should land in admin.",
  },
];

const profileRules: Phase2ProfileRule[] = [
  {
    key: "one_auth_user_one_profile",
    label: "One auth identity maps to one app profile",
    status: "ready_for_review",
    rule: "Every Supabase Auth user must resolve to exactly one app profile before role routing runs.",
  },
  {
    key: "duplicate_handling",
    label: "Duplicate profile handling is explicit",
    status: "ready_for_review",
    rule: "If email or imported data suggests a duplicate, block auto-merge and route the case to admin review instead of silently picking a winner.",
  },
  {
    key: "membership_not_granted_on_signup",
    label: "Signup does not grant chapter access",
    status: "ready_for_review",
    rule: "Account creation or first sign-in can create a profile shell, but it must not create chapter membership or role grants automatically.",
  },
  {
    key: "server_actor_context",
    label: "Server actor context comes from auth and app roles",
    status: "ready_for_review",
    rule: "Protected reads and future writes should derive the acting user from validated auth identity plus app profile and role memberships, not from a preview cookie or browser-supplied email.",
  },
  {
    key: "authorization_claim_source",
    label: "Authorization does not depend on user-editable metadata",
    status: "ready_for_review",
    rule: "Role routing and RLS should read app-owned role membership data. JWT app metadata can support routing, but user-editable metadata cannot decide authorization.",
  },
  {
    key: "support_owner",
    label: "Rollback and support ownership is named",
    status: "owner_input_required",
    rule: "Kiomi / DS owns platform rollback and auth configuration; Nick owns launch go/no-go and pilot communication; the named support contact still needs to be confirmed.",
  },
];

const ownerDecisions: Phase2OwnerDecision[] = [
  {
    key: "join_request_owner",
    label: "Chapter join request owner",
    owners: ["Codex", "Kiomi / DS"],
    status: "ready_for_review",
    decision:
      "Students can request a chapter join for themselves; the app records the request but does not grant access.",
  },
  {
    key: "membership_approval_owner",
    label: "Membership approval owner",
    owners: ["Kiomi / DS", "Nick"],
    status: "ready_for_review",
    decision:
      "President / VP approves chapter membership for their chapter only, with audit evidence and no DS Admin override on routine student truth.",
  },
  {
    key: "chapter_role_assignment_owner",
    label: "Chapter role assignment owner",
    owners: ["Kiomi / DS", "Nick"],
    status: "ready_for_review",
    decision:
      "President / VP assigns chapter-scoped roles after membership is approved; leadership role changes remain chapter-scoped.",
  },
  {
    key: "coach_assignment_owner",
    label: "Coach assignment owner",
    owners: ["Kiomi / DS", "Nick"],
    status: "ready_for_review",
    decision:
      "Admin or Super Admin assigns coach portfolio scope; coaches do not self-attach to chapters.",
  },
  {
    key: "staff_assignment_owner",
    label: "Staff and DS role assignment owner",
    owners: ["Kiomi / DS", "Nick"],
    status: "ready_for_review",
    decision:
      "Super Admin assigns Admin, DS Admin, and Super Admin roles. DS Admin remains a review and safety lane, not a student-truth owner.",
  },
  {
    key: "support_and_rollback_owner",
    label: "Support and rollback owner",
    owners: ["Kiomi / DS", "Nick"],
    status: "owner_input_required",
    decision:
      "Kiomi / DS should own auth config and rollback execution. Nick should own pilot comms and the final stop/go decision. The named first responder still needs confirmation.",
  },
];

export function getPhase2AuthOnboardingFoundationPacket(): Phase2AuthFoundationPacket {
  return {
    title: "MED-473 auth and onboarding foundation",
    summary:
      "Turns the live auth plan into an explicit routing, ownership, duplicate-handling, and rollback packet before any real sessions or profile writes are enabled.",
    liveAuthBlocked: true,
    callbackRoute: "/auth/callback",
    identitySourceOfTruth:
      "Supabase Auth identity is the sign-in source of truth; app profile, chapter membership, and app role rows decide what the user can see after sign-in.",
    roleRoutes,
    profileRules,
    ownerDecisions,
    blockedLiveActions: [
      "Creating production users",
      "Saving chapter join requests against hosted Supabase",
      "Auto-approving membership from email domain alone",
      "Routing users from preview cookies instead of validated auth identity",
    ],
    officialReferences: [
      {
        label: "Supabase Auth overview",
        url: "https://supabase.com/docs/guides/auth",
      },
      {
        label: "Supabase SSR auth client setup",
        url: "https://supabase.com/docs/guides/auth/server-side/creating-a-client",
      },
      {
        label: "Supabase redirect URLs",
        url: "https://supabase.com/docs/guides/auth/redirect-urls",
      },
      {
        label: "Supabase auth general configuration",
        url: "https://supabase.com/docs/guides/auth/general-configuration",
      },
    ],
    counts: {
      roleRoutes: roleRoutes.length,
      readyForReview:
        profileRules.filter((rule) => rule.status === "ready_for_review").length +
        ownerDecisions.filter((item) => item.status === "ready_for_review").length,
      ownerInputRequired:
        profileRules.filter((rule) => rule.status === "owner_input_required").length +
        ownerDecisions.filter((item) => item.status === "owner_input_required").length,
    },
  };
}
