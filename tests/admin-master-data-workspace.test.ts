import { describe, expect, it } from "vitest";
import { campaignShells } from "@/data/mock-campaigns";
import { getAdminMasterDataWorkspace } from "@/services/admin-master-data-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing admin master data workspace.");

describe("admin master data workspace", () => {
  it("gives Admin a focused read-only inventory for users, roles, chapters, and templates", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminMasterDataWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Admin master data inventory");
    expect(workspace.nextStep.href).toBe("/onboarding");
    expect(workspace.counts).toEqual({
      users: 14,
      roles: 9,
      chapters: 1,
      campaignTemplates: campaignShells.length,
      mutationControlsEnabled: 0,
      productionAuthEnabled: 0,
      externalWritesExpected: 0,
    });
    expect(workspace.users.map((user) => user.email)).toContain(
      "leader.a@mymedlife.test",
    );
    expect(workspace.roles.map((role) => role.role)).toEqual([
      "General Member",
      "Action Committee Member",
      "Action Committee Chair",
      "E-Board Member",
      "President / VP",
      "Coach",
      "Admin",
      "DS Admin",
      "Super Admin",
    ]);
    expect(workspace.campaignTemplates.map((template) => template.slug)).toContain(
      "rush-month",
    );
  });

  it("keeps DS Admin eligible but routed back to safety review", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getAdminMasterDataWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("DS Admin master data safety inventory");
    expect(workspace.nextStep.href).toBe("/admin");
    expect(workspace.blockedWrites).toEqual(
      expect.arrayContaining([
        "production user creation",
        "role assignments",
        "campaign template edits",
        "external automation sends",
      ]),
    );
  });

  it("hides master data from chapter and coach operating roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getAdminMasterDataWorkspace(member, data).canReadWorkspace).toBe(false);
    expect(getAdminMasterDataWorkspace(leader, data).canReadWorkspace).toBe(false);
    expect(getAdminMasterDataWorkspace(coach, data).canReadWorkspace).toBe(false);
  });

  it("keeps mutation controls, production auth, and external writes disabled", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const workspace = getAdminMasterDataWorkspace(actor, data);

    expect(workspace.title).toBe("Full master data inventory");
    expect(workspace.counts.mutationControlsEnabled).toBe(0);
    expect(workspace.counts.productionAuthEnabled).toBe(0);
    expect(workspace.counts.externalWritesExpected).toBe(0);
    expect(workspace.safetyNotes.join(" ")).toContain("Production users");
    expect(workspace.safetyNotes.join(" ")).toContain("No HubSpot");
  });
});
