import { describe, expect, it } from "vitest";
import { getWorkflowInventorySnapshot } from "@/services/sop-rollout-inventory";

describe("sop rollout inventory", () => {
  it("builds a normalized workflow inventory from the template registry", () => {
    const snapshot = getWorkflowInventorySnapshot();

    expect(snapshot.workflows.length).toBeGreaterThanOrEqual(6);
    expect(
      snapshot.workflows.find((workflow) => workflow.slug === "planning-goal-setting"),
    ).toMatchObject({
      isCoreMedInternational: true,
      importReadiness: "needs_permissions_resolution",
    });
    expect(
      snapshot.workflows.find((workflow) => workflow.slug === "rush-month")?.targetSurfaces,
    ).toEqual(
      expect.arrayContaining(["Student Mobile App", "DS/Admin Backend"]),
    );
    expect(
      snapshot.workflows.find((workflow) => workflow.slug === "start-a-chapter"),
    ).toMatchObject({
      importReadiness: "needs_source_clarification",
      isCoreMedInternational: false,
    });
    expect(snapshot.counts.coreCampaigns).toBeGreaterThanOrEqual(6);
  });

  it("exposes workflow operation permissions as a read-only inventory", () => {
    const snapshot = getWorkflowInventorySnapshot();

    expect(snapshot.permissions.length).toBeGreaterThan(0);
    expect(
      snapshot.permissions.find(
        (entry) =>
          entry.workflowSlug === "planning-goal-setting" &&
          entry.operation === "publish_approve",
      ),
    ).toMatchObject({
      approvalRequired: true,
      backendOnly: true,
      authorityStatus: "permissions_matrix_missing_local_copy",
    });
  });
});
