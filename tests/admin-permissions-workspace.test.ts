import { describe, expect, it } from "vitest";
import { getAdminPermissionsWorkspace } from "@/services/admin-permissions-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("admin permissions workspace", () => {
  it("gives HQ a read-only permission registry with canonical role and route-family coverage", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminPermissionsWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Admin permission registry");
    expect(workspace.counts.personas).toBe(13);
    expect(workspace.routeFamilies.map((family) => family.key)).toContain(
      "admin_backend",
    );
    expect(workspace.personaRows.find((row) => row.email === "traveler.a@mymedlife.test"))
      .toMatchObject({
        defaultRoute: "/slt-prep",
        ownedSurface: "slt prep",
      });
    expect(workspace.personaRows.find((row) => row.email === "leader.a@mymedlife.test"))
      .toMatchObject({
        defaultRoute: "/chapter?view=overview",
        ownedSurface: "student leadership command center",
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

  it("keeps DS Admin in read-only safety posture", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getAdminPermissionsWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("DS Admin permission registry");
    expect(workspace.nextStep.href).toBe("/admin/integration-outbox");
    expect(workspace.guardrails.join(" ")).toContain("DS Admin");
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
