import { afterEach, describe, expect, it, vi } from "vitest";

import * as rolloutControls from "@/services/admin-rollout-controls-registry";
import {
  formatSopWorkflowDraftLiveSafetyContract,
  getSopWorkflowDraftLiveSafetyContract,
} from "@/services/sop-workflow-draft-live-safety-contract";

describe("SOP / workflow draft-live safety contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps SOP/workflow surfaces read-only with no approved live publish path", () => {
    const contract = getSopWorkflowDraftLiveSafetyContract();

    expect(contract.currentWritePath).toMatchObject({
      exists: false,
    });
    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
    expect(
      contract.lanes.find((lane) => lane.key === "template_and_sample_truth"),
    ).toMatchObject({
      route: "/admin/sop-library",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "campaign_sop_and_workflow_registry"),
    ).toMatchObject({
      route: "/admin/workflows",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "approval_publish_and_rollback_boundary"),
    ).toMatchObject({
      status: "blocked_pending_future_lane",
    });
  });

  it("pins task, points, proof, provider, and rollout-evidence drift as blocked", () => {
    const contract = getSopWorkflowDraftLiveSafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "task_generation_and_assignment_side_effects")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake task generation from SOP steps.",
        "No fake assignment creation, reminder send, or ownership transfer from workflow copy.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "points_kpi_and_scoreboard_effects")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake points award from SOP completion or checklist state.",
        "No fake leaderboard movement from campaign SOP review.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "provider_outbox_and_workflow_execution")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake n8n or workflow execution.",
        "No fake provider/outbox send, retry, or approval from SOP publish review.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_proof_and_rollout_evidence")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Test/Figma/SOP/sample/planning row counts as production proof.",
        "No local workflow artifact counts as production launch approval.",
      ]),
    );
  });

  it("formats the SOP/workflow boundary in plain English for operators", () => {
    const output = formatSopWorkflowDraftLiveSafetyContract();

    expect(output).toContain(
      "SOP / workflow draft-live safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("Current write path:");
    expect(output).toContain("exists: false");
    expect(output).toContain("Template, sample, and planning-content truth boundary");
    expect(output).toContain("Provider/outbox sends and workflow execution boundary");
    expect(output).toContain(
      "Do not treat Test/Figma/sandbox/localhost/staging SOP artifacts as production signed-in proof, rollout evidence, or invite-gate truth.",
    );
    expect(output).toContain(
      "A dedicated audited server-side SOP/workflow publish boundary with explicit local/dev and hosted gates.",
    );
  });

  it("fails closed when a required blocked-default rollout control is missing", () => {
    const originalGetFeatureFlagDefinition = rolloutControls.getFeatureFlagDefinition;
    vi.spyOn(rolloutControls, "getFeatureFlagDefinition").mockImplementation((key) =>
      key === "n8n_send" ? null : originalGetFeatureFlagDefinition(key),
    );

    expect(() => getSopWorkflowDraftLiveSafetyContract()).toThrow(
      "Missing n8n_send rollout control definition.",
    );
  });
});
