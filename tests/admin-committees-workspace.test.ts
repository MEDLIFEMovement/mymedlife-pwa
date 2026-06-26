import { describe, expect, it } from "vitest";
import { getCampaignShells } from "@/services/campaign-ops-service";
import { getAdminCommitteesWorkspace } from "@/services/admin-committees-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing committee registry.");

describe("admin committees workspace", () => {
  it("turns action committees into a reusable backend registry", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminCommitteesWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Committee registry and owner lanes");
    expect(workspace.counts.committees).toBeGreaterThan(3);
    expect(workspace.committees[0]).toMatchObject({
      chapterRoute: "/chapter?view=committees",
    });
    expect(workspace.committees.map((committee) => committee.name)).toContain(
      "Recruitment Action Committee",
    );
    expect(workspace.nextStep).toEqual({
      href: "/admin/sop-builder/rush-month?tab=steps",
      label: "Open SOP builder",
      detail:
        "Committee lanes should map into the same SOP builder that already owns campaign steps, owner rules, and workflow review.",
    });
    expect(workspace.campaigns).toHaveLength(getCampaignShells().length);
    expect(workspace.campaigns.find((campaign) => campaign.slug === "rush-month")).toEqual(
      expect.objectContaining({
        workflowSnapshot: expect.objectContaining({
          sourceKind: "template_version",
          versionLabel: "v2.1",
        }),
      }),
    );
  });

  it("keeps section and focus state route-owned for the committee registry", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminCommitteesWorkspace(actor, data, {
      section: "campaigns",
      focus: "rush-month",
    });

    expect(workspace.selectedSection).toBe("campaigns");
    expect(workspace.sectionOptions.find((option) => option.selected)?.href).toBe(
      "/admin/committees?section=campaigns",
    );
    expect(workspace.focusedSection.selectedKey).toBe("rush-month");
    expect(workspace.focusedSection.selectedCard?.focusHref).toBe(
      "/admin/committees?section=campaigns&focus=rush-month",
    );
    expect(workspace.focusedSection.title).toBe("Campaign lane coverage");
    expect(workspace.focusedSection.selectedCard).toEqual(
      expect.objectContaining({
        eyebrow: "Workflow-backed campaign",
        workflowSnapshot: expect.objectContaining({
          sourceKind: "template_version",
          versionLabel: "v2.1",
        }),
      }),
    );
  });

  it("opens a mock-safe configuration state without enabling real admin writes", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getAdminCommitteesWorkspace(actor, data, {
      section: "campaigns",
      focus: "rush-month",
      mode: "template_link",
    });

    expect(workspace.configState).toEqual(
      expect.objectContaining({
        mode: "template_link",
        title: "Mock-safe campaign link config",
        returnHref: "/admin/committees?section=campaigns&focus=rush-month",
        primaryHref: "/admin/sop-builder/rush-month?tab=steps",
        secondaryHref: "/campaigns/rush-month",
      }),
    );
    expect(workspace.configState?.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Workflow source",
          value: "v2.1 · template version",
        }),
      ]),
    );
    expect(workspace.configState?.guardrails).toContain(
      "No chapter writes, outbox sends, or external configuration changes run from here.",
    );
  });

  it("keeps DS Admin in the safety lanes instead of the committee registry", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getAdminCommitteesWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(false);
    expect(workspace.title).toBe("Committee registry hidden for this role");
    expect(workspace.nextStep).toEqual({
      href: "/admin",
      label: "Back to admin",
      detail: "Return to the admin control center.",
    });
    expect(workspace.committees).toEqual([]);
    expect(workspace.campaigns).toEqual([]);
  });
});
