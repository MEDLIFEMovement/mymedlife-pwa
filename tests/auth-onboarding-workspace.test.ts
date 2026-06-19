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

  it("lets DS Admin inspect safety without owning app-truth onboarding", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getAuthOnboardingWorkspace(actor);

    expect(workspace.title).toBe("DS Admin onboarding safety review");
    expect(workspace.nextStep.href).toBe("/admin");
    expect(workspace.counts.actorOwnedSteps).toBe(0);
    expect(workspace.stepRows.every((step) => !step.actorCanOwn)).toBe(true);
    expect(workspace.launchPreflight?.items).toHaveLength(9);
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "event_audit_outbox_boundary",
      )?.currentPosture,
    ).toContain("external sends remain at 0");
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
      total: 9,
      ready: 2,
      watch: 6,
      blocked: 1,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
      productionUsersEnabled: 0,
    });
    expect(workspace.launchPreflight?.items.map((item) => item.key)).toEqual([
      "callback_url_plan",
      "role_coverage_matrix",
      "auth_profile_mapping",
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
      )?.status,
    ).toBe("blocked");
    expect(
      workspace.launchPreflight?.items.find(
        (item) => item.key === "role_coverage_matrix",
      )?.currentPosture,
    ).toContain("8 of 8 required roles");
    expect(workspace.launchPreflight?.blockedControls).toEqual(
      expect.arrayContaining([
        "create production users",
        "assign staff roles",
        "enable external writes",
      ]),
    );
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
