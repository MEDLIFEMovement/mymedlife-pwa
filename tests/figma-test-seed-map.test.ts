import { describe, expect, it } from "vitest";

import {
  FIGMA_TEST_SEED_ENVIRONMENT,
  FIGMA_TEST_SEED_FAMILY,
  FIGMA_TEST_SEED_SOURCE,
  buildFigmaTestSeedManifest,
  figmaTestSeedRecords,
  formatFigmaTestSeedLoginsMarkdown,
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

  it("builds a sandbox-only figma seed manifest for the visible shells", () => {
    const manifest = buildFigmaTestSeedManifest();

    expect(manifest.seedFamily).toBe(FIGMA_TEST_SEED_FAMILY);
    expect(manifest.source).toBe(FIGMA_TEST_SEED_SOURCE);
    expect(manifest.environment).toBe(FIGMA_TEST_SEED_ENVIRONMENT);
    expect(manifest.isTest).toBe(true);
    expect(manifest.shells.map((shell) => shell.primaryRoute)).toEqual([
      "/app",
      "/leader?view=overview",
      "/staff?view=chapters",
      "/admin",
      "/app/slt-prep",
    ]);
  });

  it("maps each shell to Test-prefixed sandbox logins", () => {
    const manifest = buildFigmaTestSeedManifest();

    for (const shell of manifest.shells) {
      expect(shell.excludedFromProductionEvidence).toBe(true);
      expect(shell.exclusionReason).toContain("must stay out of production rollout evidence");
      expect(shell.logins.length).toBeGreaterThan(0);
      for (const login of shell.logins) {
        expect(login.seedFamily).toBe(FIGMA_TEST_SEED_FAMILY);
        expect(login.source).toBe(FIGMA_TEST_SEED_SOURCE);
        expect(login.environment).toBe(FIGMA_TEST_SEED_ENVIRONMENT);
        expect(login.isTest).toBe(true);
        expect(login.displayName.startsWith("Test")).toBe(true);
        expect(login.email.startsWith("test.")).toBe(true);
        expect(login.email.endsWith("@example.com")).toBe(true);
        expect(login.chapterName === null || login.chapterName.startsWith("Test")).toBe(true);
      }
    }
  });

  it("renders a reviewer-friendly login report", () => {
    const report = formatFigmaTestSeedLoginsMarkdown();

    expect(report).toContain("# myMEDLIFE Figma Test Logins");
    expect(report).toContain("`figma_seed_v1`");
    expect(report).toContain("`sandbox`");
    expect(report).toContain("/app/slt-prep");
    expect(report).toContain("must stay out of production rollout evidence");
  });
});
