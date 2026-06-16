import { describe, expect, it } from "vitest";
import {
  authOnboardingSteps,
  canActorOwnOnboardingStep,
  getAuthOnboardingPlan,
} from "@/services/auth-onboarding-plan";

describe("auth onboarding plan", () => {
  it("keeps live auth and production users disabled", () => {
    expect(getAuthOnboardingPlan()).toEqual(
      expect.objectContaining({
        liveAuthEnabled: false,
        productionUsersEnabled: false,
        approvalRequired: expect.stringContaining("Nick must approve"),
      }),
    );
  });

  it("keeps every onboarding step Supabase-owned and event-producing", () => {
    expect(
      authOnboardingSteps.every((step) => {
        return (
          step.sourceOfTruth === "supabase" &&
          step.createsEvent &&
          !step.browserEnabled
        );
      }),
    ).toBe(true);
  });

  it("assigns student-owned steps only to students", () => {
    expect(canActorOwnOnboardingStep("student", "user_signed_in")).toBe(true);
    expect(canActorOwnOnboardingStep("student", "profile_created")).toBe(true);
    expect(canActorOwnOnboardingStep("student", "chapter_join_requested")).toBe(
      true,
    );
    expect(canActorOwnOnboardingStep("student", "membership_approved")).toBe(
      false,
    );
  });

  it("keeps chapter membership and role approval with chapter leadership", () => {
    expect(
      canActorOwnOnboardingStep("chapter_president_vp", "membership_approved"),
    ).toBe(true);
    expect(
      canActorOwnOnboardingStep("chapter_president_vp", "chapter_role_assigned"),
    ).toBe(true);
    expect(canActorOwnOnboardingStep("coach", "membership_approved")).toBe(false);
    expect(canActorOwnOnboardingStep("admin", "membership_approved")).toBe(false);
  });

  it("blocks DS Admin from app-truth onboarding ownership", () => {
    const plan = getAuthOnboardingPlan();

    expect(plan.dsAdminBlockedFrom).toEqual([
      "membership_approved",
      "chapter_role_assigned",
      "coach_assigned",
      "staff_role_assigned",
    ]);
    expect(canActorOwnOnboardingStep("ds_admin", "staff_role_assigned")).toBe(
      false,
    );
  });

  it("keeps staff-role assignment with Super Admin", () => {
    expect(canActorOwnOnboardingStep("super_admin", "staff_role_assigned")).toBe(
      true,
    );
    expect(canActorOwnOnboardingStep("admin", "staff_role_assigned")).toBe(false);
  });
});
