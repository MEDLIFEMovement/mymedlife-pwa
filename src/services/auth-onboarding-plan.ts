export type OnboardingStepKey =
  | "user_signed_in"
  | "profile_created"
  | "chapter_join_requested"
  | "membership_approved"
  | "chapter_role_assigned"
  | "coach_assigned"
  | "staff_role_assigned";

export type OnboardingActor =
  | "student"
  | "chapter_president_vp"
  | "coach"
  | "admin"
  | "ds_admin"
  | "super_admin";

export type OnboardingStep = {
  key: OnboardingStepKey;
  label: string;
  owner: OnboardingActor;
  sourceOfTruth: "supabase";
  createsEvent: true;
  browserEnabled: false;
  notes: string;
};

export type AuthOnboardingPlan = {
  liveAuthEnabled: false;
  productionUsersEnabled: false;
  approvalRequired: string;
  steps: readonly OnboardingStep[];
  dsAdminBlockedFrom: readonly OnboardingStepKey[];
};

const approvalRequired =
  "Nick must approve a later auth goal before live sign-in, production users, browser sessions, or role approval writes are enabled.";

export const authOnboardingSteps = [
  {
    key: "user_signed_in",
    label: "User signs in",
    owner: "student",
    sourceOfTruth: "supabase",
    createsEvent: true,
    browserEnabled: false,
    notes:
      "Future Supabase Auth session only; no production auth is enabled in Goal 19.",
  },
  {
    key: "profile_created",
    label: "Profile is created",
    owner: "student",
    sourceOfTruth: "supabase",
    createsEvent: true,
    browserEnabled: false,
    notes: "Profile should map to auth user ID and remain app-owned.",
  },
  {
    key: "chapter_join_requested",
    label: "Student requests to join a chapter",
    owner: "student",
    sourceOfTruth: "supabase",
    createsEvent: true,
    browserEnabled: false,
    notes: "Student can request membership for self, not approve membership.",
  },
  {
    key: "membership_approved",
    label: "Chapter membership is approved",
    owner: "chapter_president_vp",
    sourceOfTruth: "supabase",
    createsEvent: true,
    browserEnabled: false,
    notes: "President/VP approves chapter-scoped membership inside their chapter.",
  },
  {
    key: "chapter_role_assigned",
    label: "Chapter role is assigned",
    owner: "chapter_president_vp",
    sourceOfTruth: "supabase",
    createsEvent: true,
    browserEnabled: false,
    notes: "Chapter-scoped role assignment stays inside chapter leadership.",
  },
  {
    key: "coach_assigned",
    label: "Coach is assigned to chapter",
    owner: "admin",
    sourceOfTruth: "supabase",
    createsEvent: true,
    browserEnabled: false,
    notes: "Admin/Super Admin manages coach portfolio assignment and handoff.",
  },
  {
    key: "staff_role_assigned",
    label: "Staff role is assigned",
    owner: "super_admin",
    sourceOfTruth: "supabase",
    createsEvent: true,
    browserEnabled: false,
    notes: "Super Admin owns Admin, DS Admin, and Super Admin role assignment.",
  },
] as const satisfies readonly OnboardingStep[];

export function getAuthOnboardingPlan(): AuthOnboardingPlan {
  return {
    liveAuthEnabled: false,
    productionUsersEnabled: false,
    approvalRequired,
    steps: authOnboardingSteps,
    dsAdminBlockedFrom: [
      "membership_approved",
      "chapter_role_assigned",
      "coach_assigned",
      "staff_role_assigned",
    ],
  };
}

export function canActorOwnOnboardingStep(
  actor: OnboardingActor,
  stepKey: OnboardingStepKey,
): boolean {
  const step = authOnboardingSteps.find((item) => item.key === stepKey);
  return step?.owner === actor;
}
