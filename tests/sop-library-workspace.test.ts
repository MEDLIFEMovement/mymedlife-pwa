import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getSopLibraryWorkspace } from "@/services/sop-library-workspace";

describe("SOP library workspace", () => {
  it("exposes campaign definitions with builder links for admin", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSopLibraryWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.entries.map((entry) => entry.slug)).toContain("rush-month");
    expect(workspace.entries.map((entry) => entry.slug)).toEqual(
      expect.arrayContaining(["grow-the-movement", "start-a-chapter"]),
    );
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

  it("surfaces structured import review metadata for Planning / Goal Setting", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSopLibraryWorkspace(actor, {
      focus: "planning-goal-setting",
    });

    expect(workspace.selectedEntry?.slug).toBe("planning-goal-setting");
    expect(workspace.selectedEntry?.templateImportStatus).toBe("draft_reviewed");
    expect(workspace.selectedEntry?.templateVersionLabel).toBe("v0 reviewed");
    expect(workspace.selectedEntry?.templateProvenanceLabel).toBe(
      "package-backed structured draft",
    );
    expect(workspace.selectedEntry?.templateSourceGapCount).toBe(0);
    expect(workspace.selectedEntry?.templatePhaseCount).toBe(5);
    expect(workspace.selectedEntry?.templateStepCount).toBe(5);
    expect(workspace.selectedEntry?.templateSourceCount).toBeGreaterThan(0);
    expect(workspace.selectedEntry?.templateEngineBindingsCount).toBeGreaterThan(0);
    expect(workspace.selectedEntry?.templateImportTraceCount).toBeGreaterThan(0);
    expect(workspace.selectedEntry?.stepsCount).toBe(5);
    expect(workspace.selectedEntry?.roleRulesCount).toBeGreaterThan(0);
    expect(workspace.selectedEntry?.integrationBoundariesCount).toBe(3);
    expect(workspace.selectedEntry?.modeledRuleCount).toBeGreaterThan(
      workspace.selectedEntry?.roleRulesCount ?? 0,
    );
    expect(workspace.selectedEntry?.templateReviewWarnings.length).toBeGreaterThan(0);
    expect(workspace.counts.structuredDrafts).toBeGreaterThanOrEqual(1);
    expect(workspace.counts.reviewWarnings).toBeGreaterThanOrEqual(
      workspace.selectedEntry?.templateReviewWarnings.length ?? 0,
    );
  });

  it("marks repo-defined structured drafts clearly when the rollout package lacks catalog coverage", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSopLibraryWorkspace(actor, {
      focus: "grow-the-movement",
    });

    expect(workspace.selectedEntry?.slug).toBe("grow-the-movement");
    expect(workspace.selectedEntry?.templateImportStatus).toBe("draft_reviewed");
    expect(workspace.selectedEntry?.templateVersionLabel).toBe("v0 reviewed");
    expect(workspace.selectedEntry?.templateProvenanceLabel).toBe(
      "repo-defined structured draft",
    );
    expect(workspace.selectedEntry?.templateSourceGapCount).toBeGreaterThan(0);
    expect(workspace.selectedEntry?.templateReviewWarnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("does not yet provide a catalog or PDF section"),
      ]),
    );
  });

  it("shows aligned coverage once leadership transition is lifted into the builder-backed workflow definition", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSopLibraryWorkspace(actor, {
      focus: "leadership-transition",
    });

    expect(workspace.selectedEntry?.slug).toBe("leadership-transition");
    expect(workspace.selectedEntry?.stepsCount).toBe(5);
    expect(workspace.selectedEntry?.templateStepCount).toBe(5);
    expect(workspace.selectedEntry?.templateReviewWarnings).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("Route-backed campaign detail currently shows"),
      ]),
    );
  });

  it("shows aligned step coverage once a richer route-backed campaign has been lifted into the builder definition", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getSopLibraryWorkspace(actor, {
      focus: "moving-mountains",
    });

    expect(workspace.selectedEntry?.slug).toBe("moving-mountains");
    expect(workspace.selectedEntry?.stepsCount).toBe(5);
    expect(workspace.selectedEntry?.templateStepCount).toBe(5);
    expect(workspace.selectedEntry?.templateReviewWarnings).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("Route-backed campaign detail currently shows"),
      ]),
    );
  });
});
