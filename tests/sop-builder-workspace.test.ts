import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getSopBuilderWorkspace } from "@/services/sop-builder-workspace";

describe("SOP builder workspace", () => {
  it("keeps builder tabs and route-backed rules available for a campaign definition", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSopBuilderWorkspace(actor, "rush-month", "role-matrix");

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.definition?.slug).toBe("rush-month");
    expect(workspace.selectedTab).toBe("role-matrix");
    expect(workspace.workbench?.title).toBe("Role matrix workbench");
    expect(workspace.workbench?.defaultFocusHref).toContain(
      "/admin/sop-builder/rush-month?tab=role-matrix&focus=student_member-own-",
    );
    expect(workspace.workbench?.adjacentTabs.map((tab) => tab.key)).toEqual([
      "steps",
      "preview",
    ]);
    expect(workspace.tabs.map((tab) => tab.href)).toContain(
      "/admin/sop-builder/rush-month?tab=steps",
    );
    expect(workspace.definition?.roleActionRules[0]?.route).toContain("/");
    expect(workspace.definition?.phases.length).toBeGreaterThan(0);
    expect(workspace.definition?.validators.length).toBeGreaterThan(0);
    expect(workspace.definition?.handoffRules.length).toBeGreaterThan(0);
    expect(workspace.definition?.featureFlagBindings.length).toBeGreaterThan(0);
    expect(workspace.definition?.operationPermissions.length).toBeGreaterThan(0);
    expect(workspace.definition?.sourceTraces.length).toBeGreaterThan(0);
  });

  it("uses the current version posture as the default focus for the version lane", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSopBuilderWorkspace(actor, "rush-month", "version");

    expect(workspace.selectedTab).toBe("version");
    expect(workspace.workbench?.title).toBe("Version workbench");
    expect(workspace.workbench?.defaultFocusHref).toBe(
      "/admin/sop-builder/rush-month?tab=version&focus=current-version",
    );
    expect(workspace.workbench?.defaultFocusLabel).toBe("v2.1");
  });

  it("keeps SOP builder access with Admin and Super Admin only", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getSopBuilderWorkspace(admin, "rush-month", "steps").canReadWorkspace).toBe(
      true,
    );
    expect(
      getSopBuilderWorkspace(superAdmin, "rush-month", "steps").canReadWorkspace,
    ).toBe(true);
    expect(getSopBuilderWorkspace(dsAdmin, "rush-month", "steps").canReadWorkspace).toBe(
      false,
    );
  });

  it("exposes structured import review metadata for Planning / Goal Setting", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSopBuilderWorkspace(
      actor,
      "planning-goal-setting",
      "version",
    );

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.templateReview).toMatchObject({
      versionLabel: "v0 reviewed",
      importStatus: "draft_reviewed",
      provenanceLabel: "package-backed structured draft",
      coachPdfPages: "1-32",
      chapterPlatformPdfPages: "184-213",
      phaseCount: 5,
      stepCount: 5,
      suggestedRolloutOrder: 1,
    });
    expect(workspace.templateReview?.sourcePerspectives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "coach",
          label: "Coach perspective",
          pdfPages: "1-32",
        }),
        expect.objectContaining({
          key: "chapter_platform",
          label: "Chapter / platform perspective",
          pdfPages: "184-213",
        }),
      ]),
    );
    expect(workspace.templateReview?.unresolvedAmbiguities.length).toBeGreaterThan(0);
    expect(workspace.templateReview?.sensitiveDataWarnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("No live sends"),
      ]),
    );
  });

  it("surfaces imported risk and closeout posture on the completion workbench", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSopBuilderWorkspace(
      actor,
      "planning-goal-setting",
      "completion",
    );

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.workbench?.title).toBe("Completion workbench");
    expect(workspace.workbench?.stats.map((stat) => stat.label)).toEqual(
      expect.arrayContaining([
        "Completion gates",
        "Risk rules",
        "Escalations",
        "Closeout requirements",
      ]),
    );
    expect(workspace.workbench?.guardrails).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Risk, escalation, and closeout posture"),
      ]),
    );
  });

  it("uses template-backed workbench defaults and counts when structured workflow data exists", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const stepsWorkspace = getSopBuilderWorkspace(actor, "planning-goal-setting", "steps");
    const pointsWorkspace = getSopBuilderWorkspace(
      actor,
      "planning-goal-setting",
      "points-kpi",
    );
    const commsWorkspace = getSopBuilderWorkspace(actor, "planning-goal-setting", "comms");

    expect(stepsWorkspace.workbench?.defaultFocusHref).toBe(
      "/admin/sop-builder/planning-goal-setting?tab=steps&focus=planning-goal-brief",
    );
    expect(stepsWorkspace.workbench?.stats.find((stat) => stat.label === "Visible steps"))
      .toMatchObject({
        value: "5",
      });

    expect(pointsWorkspace.workbench?.defaultFocusHref).toBe(
      "/admin/sop-builder/planning-goal-setting?tab=points-kpi&focus=planning-goals-set",
    );
    expect(pointsWorkspace.workbench?.defaultFocusLabel).toBe("Goals set");
    expect(pointsWorkspace.workbench?.stats.find((stat) => stat.label === "KPI rules"))
      .toMatchObject({
        value: "5",
      });

    expect(commsWorkspace.workbench?.defaultFocusHref).toBe(
      "/admin/sop-builder/planning-goal-setting?tab=comms&focus=planning-coach-checkin-reminder",
    );
    expect(commsWorkspace.workbench?.stats.find((stat) => stat.label === "Boundaries"))
      .toMatchObject({
        value: "3",
      });
  });

  it("keeps the existing SOP builder available for grow-the-movement draft work", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSopBuilderWorkspace(actor, "grow-the-movement", "steps");

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.definition?.slug).toBe("grow-the-movement");
    expect(workspace.definition?.steps.length).toBeGreaterThan(0);
    expect(workspace.templateReview).toMatchObject({
      versionLabel: "v0 reviewed",
      importStatus: "draft_reviewed",
      provenanceLabel: "repo-defined structured draft",
      coachPdfPages: "No mapped coach SOP pages in current package",
      chapterPlatformPdfPages: "No mapped chapter/platform SOP pages in current package",
    });
    expect(workspace.templateReview?.sourceGapCount).toBeGreaterThan(0);
    expect(workspace.templateReview?.unresolvedAmbiguities).toEqual(
      expect.arrayContaining([
        expect.stringContaining("does not yet provide a catalog or PDF section"),
      ]),
    );
    expect(workspace.tabs.map((tab) => tab.href)).toContain(
      "/admin/sop-builder/grow-the-movement?tab=steps",
    );
  });
});
