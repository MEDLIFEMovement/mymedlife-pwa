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
});
