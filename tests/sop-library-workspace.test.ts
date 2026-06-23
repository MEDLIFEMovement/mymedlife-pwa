import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getSopLibraryWorkspace } from "@/services/sop-library-workspace";

describe("SOP library workspace", () => {
  it("exposes campaign definitions with builder links for admin", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSopLibraryWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.entries.map((entry) => entry.slug)).toContain("rush-month");
    expect(
      workspace.entries.find((entry) => entry.slug === "rush-month")?.builderHref,
    ).toBe("/admin/sop-builder/rush-month?tab=steps");
  });

  it("keeps search and filter state route-owned for the admin library", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSopLibraryWorkspace(actor, {
      focus: "rush-month",
      query: "rush",
      status: "draft",
    });

    expect(workspace.selectedEntry?.slug).toBe("rush-month");
    expect(workspace.selectedEntry?.focusHref).toBe(
      "/admin/sop-library?focus=rush-month&query=rush&status=draft",
    );
    expect(workspace.filters.query).toBe("rush");
    expect(workspace.filters.status).toBe("draft");
    expect(workspace.filters.hasActiveFilters).toBe(true);
    expect(workspace.filters.activeSummary).toContain("Showing 1 of");
    expect(workspace.entries.map((entry) => entry.slug)).toEqual(["rush-month"]);
    expect(workspace.filters.statusOptions.find((option) => option.isActive)?.href).toBe(
      "/admin/sop-library?focus=rush-month&query=rush&status=draft",
    );
  });

  it("keeps SOP library access with Admin and Super Admin only", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getSopLibraryWorkspace(admin).canReadWorkspace).toBe(true);
    expect(getSopLibraryWorkspace(superAdmin).canReadWorkspace).toBe(true);
    expect(getSopLibraryWorkspace(dsAdmin).canReadWorkspace).toBe(false);
  });
});
