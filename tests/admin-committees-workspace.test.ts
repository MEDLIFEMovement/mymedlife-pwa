import { describe, expect, it } from "vitest";
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
