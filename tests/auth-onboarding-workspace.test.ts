import { describe, expect, it } from "vitest";
import { getAuthOnboardingWorkspace } from "@/services/auth-onboarding-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("auth onboarding workspace", () => {
  it("shows members the future onboarding path without enabling auth or writes", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getAuthOnboardingWorkspace(actor);

    expect(workspace.title).toBe("Your future onboarding path");
    expect(workspace.nextStep.href).toBe("/login");
    expect(workspace.nextStep.label).toBe("Open local sign-in");
    expect(workspace.counts.actorOwnedSteps).toBe(3);
    expect(workspace.counts.liveAuthEnabled).toBe(0);
    expect(workspace.counts.productionUsersEnabled).toBe(0);
    expect(workspace.counts.externalWritesExpected).toBe(0);
    expect(workspace.launchPreflight).toBeNull();
    expect(workspace.blockedWrites).toEqual(
      expect.arrayContaining([
        "production Supabase Auth sessions",
        "profile saves",
        "membership approvals",
        "staff role assignments",
        "external automation sends",
      ]),
    );
  });

  it("keeps chapter membership and role ownership with President / VP actors", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const workspace = getAuthOnboardingWorkspace(actor);

    expect(workspace.title).toBe("Chapter onboarding approval path");
    expect(workspace.nextStep.href).toBe("/chapter/members");
    expect(
      workspace.stepRows.find((step) => step.key === "membership_approved")
        ?.actorCanOwn,
    ).toBe(true);
    expect(
      workspace.stepRows.find((step) => step.key === "chapter_role_assigned")
        ?.actorCanOwn,
    ).toBe(true);
    expect(
      workspace.stepRows.find((step) => step.key === "staff_role_assigned")
        ?.actorCanOwn,
    ).toBe(false);
  });

  it("treats committee chairs as student leaders without overgranting President / VP onboarding ownership", () => {
    const chair = getAuthOnboardingWorkspace(
      getMockLocalActorContext("committee.chair@mymedlife.test"),
    );
    const member = getAuthOnboardingWorkspace(
      getMockLocalActorContext("committee.member@mymedlife.test"),
    );

    expect(chair.title).toBe("Chapter onboarding approval path");
    expect(chair.nextStep.href).toBe("/chapter/members");
    expect(
      chair.stepRows.find((step) => step.key === "membership_approved")?.actorCanOwn,
    ).toBe(false);
    expect(
      chair.stepRows.find((step) => step.key === "chapter_role_assigned")?.actorCanOwn,
    ).toBe(false);
    expect(member.title).toBe("Your future onboarding path");
    expect(member.nextStep.href).toBe("/login");
  });

  it("lets DS Admin inspect safety without owning app-truth onboarding", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getAuthOnboardingWorkspace(actor);

    expect(workspace.title).toBe("DS Admin onboarding safety review");
    expect(workspace.nextStep.href).toBe("/admin");
    expect(workspace.counts.actorOwnedSteps).toBe(0);
    expect(workspace.stepRows.every((step) => !step.actorCanOwn)).toBe(true);
    expect(workspace.launchPreflight?.items).toHaveLength(10);
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "event_audit_outbox_boundary",
      )?.currentPosture,
    ).toContain("external sends remain at 0");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "pilot_cohort_provisioning",
      )?.currentPosture,
    ).toContain("pre-provision the first pilot cohort manually");
    expect(workspace.safetyNotes.join(" ")).toContain(
      "DS Admin can inspect safety posture",
    );
  });

  it("shows staff a production auth preflight without enabling users or sends", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAuthOnboardingWorkspace(actor);

    expect(workspace.launchPreflight?.title).toBe(
      "Production auth preflight checklist",
    );
    expect(workspace.launchPreflight?.counts).toEqual({
      total: 10,
      ready: 2,
      watch: 8,
      blocked: 0,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      productionUsersEnabled: 0,
    });
    expect(workspace.launchPreflight?.items.map((item) => item.key)).toEqual([
      "callback_url_plan",
      "role_coverage_matrix",
      "auth_profile_mapping",
      "pilot_cohort_provisioning",
      "join_membership_approval",
      "chapter_role_assignment",
      "coach_assignment",
      "staff_role_assignment",
      "event_audit_outbox_boundary",
      "support_rollback",
    ]);
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "callback_url_plan",
      )?.currentPosture,
    ).toContain("Vercel SSO");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "callback_url_plan",
      )?.currentPosture,
    ).toContain("/login?next=/sso-api");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "callback_url_plan",
      )?.status,
    ).toBe("watch");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "callback_url_plan",
      )?.currentPosture,
    ).toContain("Hosted staging reviewer proof already exists");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "auth_profile_mapping",
      )?.currentPosture,
    ).toContain("seeded DS/Admin reviewer");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "role_coverage_matrix",
      )?.currentPosture,
    ).toContain("8 of 8 required roles have local reviewer actors.");
    expect(workspace.launchPreflight?.blockedControls).toEqual(
      expect.arrayContaining([
        "create production users",
        "assign staff roles",
        "open self-serve staging sign-up",
        "enable external writes",
      ]),
    );
    expect(workspace.launchPreflight?.summary).toContain(
      "staging reviewer access path",
    );
  });

  it("reflects recorded pilot defaults and owners in the auth preflight when present", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAuthOnboardingWorkspace(actor, {
      MYMEDLIFE_PILOT_CHAPTER: "Boston College MEDLIFE",
      MYMEDLIFE_PILOT_CAMPAIGN_SCOPE: "Rush Month only",
      MYMEDLIFE_PILOT_COHORT_SIZE: "8 students",
      MYMEDLIFE_PILOT_COACH_OWNER: "Coach Renee",
      MYMEDLIFE_PILOT_SUPPORT_OWNER: "Maya Support",
      MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL: "#mymedlife-pilot-support",
      MYMEDLIFE_PILOT_ROLLBACK_OWNER: "Kiomi Matsukawa",
    });

    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "pilot_cohort_provisioning",
      )?.status,
    ).toBe("ready");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "pilot_cohort_provisioning",
      )?.currentPosture,
    ).toContain("Boston College MEDLIFE");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "coach_assignment",
      )?.currentPosture,
    ).toContain("Coach Renee");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "support_rollback",
      )?.status,
    ).toBe("ready");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "support_rollback",
      )?.currentPosture,
    ).toContain("Maya Support");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "support_rollback",
      )?.currentPosture,
    ).toContain("#mymedlife-pilot-support");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "support_rollback",
      )?.label,
    ).toBe("Name support owner, channel, and rollback owner");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "support_rollback",
      )?.currentPosture,
    ).toContain("Kiomi Matsukawa");
  });

  it("names every future structured event while keeping all events disabled", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getAuthOnboardingWorkspace(actor);

    expect(workspace.futureStructuredEvents.map((event) => event.eventType)).toEqual([
      "user_signed_in",
      "profile_created",
      "chapter_join_requested",
      "membership_approved",
      "chapter_role_assigned",
      "coach_assigned",
      "staff_role_assigned",
    ]);
    expect(
      workspace.futureStructuredEvents.every((event) => {
        return event.status === "disabled" && event.destination === "internal";
      }),
    ).toBe(true);
  });
});
