import { describe, expect, it } from "vitest";
import { getAdminPermissionsWorkspace } from "@/services/admin-permissions-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("admin permissions workspace", () => {
  it("gives HQ a read-only permission registry with canonical role and route-family coverage", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminPermissionsWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Admin permission registry");
    expect(workspace.counts.personas).toBe(15);
    expect(workspace.counts.backendRoutes).toBe(26);
    expect(workspace.routeFamilies.map((family) => family.key)).toContain(
      "admin_backend",
    );
    expect(workspace.routeFamilies.find((family) => family.key === "admin_backend"))
      .toMatchObject({
        label: "Admin review and tooling",
      });
    expect(
      workspace.routeFamilies.find((family) => family.key === "admin_backend")?.routes,
    ).toEqual(
      expect.arrayContaining([
        "/admin/phase-2",
        "/admin/review-path",
        "/admin/launch-gate",
        "/admin/integration-outbox",
        "/admin/database-security",
        "/admin/system-health",
        "/admin/operations",
        "/admin/staff-dry-run",
      ]),
    );
    expect(workspace.personaRows.find((row) => row.email === "traveler.a@mymedlife.test"))
      .toMatchObject({
        defaultRoute: "/app/slt-prep",
        ownedSurface: "slt prep",
      });
    expect(workspace.personaRows.find((row) => row.email === "leader.a@mymedlife.test"))
      .toMatchObject({
        defaultRoute: "/leader?view=overview",
        ownedSurface: "student leadership command center",
      });
    expect(workspace.workflowPermissionInventory.length).toBeGreaterThan(0);
    expect(
      workspace.workflowPermissionInventory.find(
        (row) =>
          row.workflowSlug === "planning-goal-setting" &&
          row.operation === "publish_approve",
      ),
    ).toMatchObject({
      approvalRequired: true,
      backendOnly: true,
    });
  });

  it("keeps section and focus state route-owned for the permission registry", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminPermissionsWorkspace(actor, undefined, {
      section: "personas",
      focus: "leader.a@mymedlife.test",
    });

    expect(workspace.selectedSection).toBe("personas");
    expect(workspace.sectionOptions.find((option) => option.selected)?.href).toBe(
      "/admin/permissions?section=personas",
    );
    expect(workspace.focusedSection.selectedKey).toBe("leader.a@mymedlife.test");
    expect(workspace.focusedSection.selectedCard?.focusHref).toBe(
      "/admin/permissions?section=personas&focus=leader.a%40mymedlife.test",
    );
    expect(workspace.focusedSection.title).toBe("Local actor registry");
  });

  it("opens a mock-safe workflow permission config without changing authority", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminPermissionsWorkspace(actor, undefined, {
      section: "routes",
      focus: "admin_backend",
      permission: "planning-goal-setting-publish_approve",
    });

    expect(workspace.permissionConfigState).toEqual(
      expect.objectContaining({
        title: "Mock-safe workflow permission config",
        returnHref: "/admin/permissions?section=routes&focus=admin_backend",
        builderHref: "/admin/sop-builder/planning-goal-setting?tab=role-matrix",
      }),
    );
    expect(workspace.permissionConfigState?.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Operation",
          value: "publish approve",
        }),
      ]),
    );
    expect(workspace.permissionConfigState?.guardrails).toContain(
      "Final authority still belongs to the permissions matrix, not this local review route.",
    );
  });

  it("keeps DS Admin in read-only safety posture", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getAdminPermissionsWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("DS Admin permission registry");
    expect(workspace.nextStep.href).toBe("/admin/integration-outbox");
    expect(workspace.guardrails.join(" ")).toContain("DS Admin");
  });

  it("shows breakglass scope for Super Admin personas in the registry", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getAdminPermissionsWorkspace(actor);

    expect(
      workspace.personaRows.find((row) => row.email === "super.admin@mymedlife.test")?.scopes,
    ).toContain("breakglass");
  });

  it("hides the permission registry from operating roles", () => {
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getAdminPermissionsWorkspace(committeeMember).canReadWorkspace).toBe(
      false,
    );
    expect(getAdminPermissionsWorkspace(committeeChair).canReadWorkspace).toBe(
      false,
    );
    expect(getAdminPermissionsWorkspace(coach).canReadWorkspace).toBe(false);
  });
});
