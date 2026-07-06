import { describe, expect, it } from "vitest";

import {
  FIGMA_TEST_SEED_ENVIRONMENT,
  FIGMA_TEST_SEED_FAMILY,
  FIGMA_TEST_SEED_SOURCE,
  figmaTestSeedRecords,
  getFigmaOrTestSeedEvidenceReason,
  getFigmaTestSeedRecordsByShell,
  getFigmaTestSeedValidation,
  type FigmaSeedShell,
} from "@/data/figma-test-seed-map";

describe("figma test seed map", () => {
  it("marks every mapped record as Figma sandbox Test data", () => {
    const validation = getFigmaTestSeedValidation();

    expect(validation.ready).toBe(true);
    expect(
      figmaTestSeedRecords.every(
        (record) =>
          record.markers.is_test === true &&
          record.markers.source === FIGMA_TEST_SEED_SOURCE &&
          record.markers.seed_family === FIGMA_TEST_SEED_FAMILY &&
          record.markers.environment === FIGMA_TEST_SEED_ENVIRONMENT,
      ),
    ).toBe(true);
  });

  it("documents which Figma shell each Test or fixture record supports", () => {
    const shells: FigmaSeedShell[] = [
      "/app",
      "/app/events",
      "/campaigns",
      "/proof-library",
      "/app/slt-prep",
      "/leader",
      "/staff",
      "/admin",
    ];

    for (const shell of shells) {
      expect(getFigmaTestSeedRecordsByShell(shell).length).toBeGreaterThan(0);
    }
  });

  it("keeps seeded sandbox labels Test-prefixed and sensitive content fixture-only", () => {
    expect(
      figmaTestSeedRecords
        .filter((record) => record.disposition === "seeded_sandbox")
        .every((record) => record.testLabel.startsWith("Test ")),
    ).toBe(true);

    expect(
      figmaTestSeedRecords
        .filter((record) => ["proof_fixture", "admin_fixture", "slt_fixture"].includes(record.kind))
        .every((record) => record.disposition === "fixture_only"),
    ).toBe(true);
  });

  it("identifies markers that must never count as production rollout evidence", () => {
    expect(getFigmaOrTestSeedEvidenceReason("Test UCLA MEDLIFE")).toBe(
      "packet starts with Test",
    );
    expect(getFigmaOrTestSeedEvidenceReason({ source: "figma_seed" })).toBe(
      "packet.source is marked source=figma_seed",
    );
    expect(getFigmaOrTestSeedEvidenceReason({ is_test: true })).toBe(
      "packet.is_test is marked is_test=true",
    );
    expect(
      getFigmaOrTestSeedEvidenceReason({
        nested: [{ seed_family: "figma_seed_v1" }],
      }),
    ).toBe("packet.nested[0].seed_family is marked seed_family=figma_seed_v1");
  });
});

