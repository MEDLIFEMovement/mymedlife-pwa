import { describe, expect, it } from "vitest";
import { getAdminWorkflowsWorkspace } from "@/services/admin-workflows-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing workflow registry.");

describe("admin workflows workspace", () => {
  it("maps the backend workflow lanes and guarded write sequence together", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminWorkflowsWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.lanes.map((lane) => lane.key)).toEqual(
      expect.arrayContaining([
        "auth_onboarding",
        "chapter_membership",
        "rush_month_write_sequence",
        "sop_builder",
      ]),
    );
    expect(workspace.onboardingSteps.map((step) => step.key)).toContain(
      "membership_approved",
    );
    expect(workspace.writeOperations[0]?.key).toBe("action_started");
    expect(workspace.lanes.find((lane) => lane.key === "sop_builder")?.route).toBe(
      "/admin/sop-library",
    );
    expect(workspace.lanes.find((lane) => lane.key === "sop_builder")?.pills).toEqual(
      expect.arrayContaining([
        expect.stringContaining("campaign definitions"),
        expect.stringContaining("structured drafts"),
        expect.stringContaining("review warnings"),
        "source of truth: SOP library + builder",
      ]),
    );
    expect(
      workspace.lanes.find((lane) => lane.key === "sop_builder")?.currentPosture,
    ).toContain("The live app already carries this lane");
    expect(workspace.nextStep.href).toBe("/admin/sop-builder/rush-month?tab=steps");
    expect(workspace.nextStep.label).toBe("Open SOP builder");
    expect(workspace.rolloutInventory.workflows.find((workflow) => workflow.slug === "planning-goal-setting"))
      .toMatchObject({
        importReadiness: "needs_permissions_resolution",
      });
    expect(workspace.rolloutInventory.workflows.find((workflow) => workflow.slug === "start-a-chapter"))
      .toMatchObject({
        importReadiness: "needs_source_clarification",
      });
  });

  it("keeps section and focus state route-owned for the workflow registry", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminWorkflowsWorkspace(actor, data, {
      section: "writes",
      focus: "evidence_submitted",
    });

    expect(workspace.selectedSection).toBe("writes");
    expect(workspace.sectionOptions.find((option) => option.selected)?.href).toBe(
      "/admin/workflows?section=writes",
    );
    expect(workspace.focusedSection.selectedKey).toBe("evidence_submitted");
    expect(workspace.focusedSection.selectedCard?.focusHref).toBe(
      "/admin/workflows?section=writes&focus=evidence_submitted",
    );
    expect(workspace.focusedSection.title).toBe("Write sequence");
  });

  it("keeps DS Admin on the workflow registry's safety path", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getAdminWorkflowsWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("DS Admin workflow registry");
    expect(workspace.nextStep.href).toBe("/admin/integration-outbox");
  });

  it("hides the workflow registry from operating roles", () => {
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getAdminWorkflowsWorkspace(committeeMember, data).canReadWorkspace).toBe(
      false,
    );
    expect(getAdminWorkflowsWorkspace(committeeChair, data).canReadWorkspace).toBe(
      false,
    );
    expect(getAdminWorkflowsWorkspace(coach, data).canReadWorkspace).toBe(false);
  });
});
