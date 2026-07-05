import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { productionRolloutCsvTemplates } from "@/services/production-rollout-csv-templates";

describe("production rollout data collection doc", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/production-rollout-data-collection.md"),
    "utf8",
  );

  it("names every required CSV template", () => {
    for (const template of productionRolloutCsvTemplates) {
      expect(doc).toContain(`\`${template.filename}\``);
    }
  });

  it("keeps launch safety boundaries visible", () => {
    expect(doc).toContain("Do not put passwords, API keys, tokens, secrets");
    expect(doc).toContain("External writes remain off");
    expect(doc).toContain("This packet does not apply data by itself");
  });

  it("points reviewers to the build, validation, handoff, and launch checks", () => {
    expect(doc).toContain("pnpm rollout:build");
    expect(doc).toContain("pnpm rollout:check production-rollout-packet.json");
    expect(doc).toContain("pnpm rollout:handoff production-rollout-packet.json");
    expect(doc).toContain("pnpm production:launch-check --packet");
    expect(doc).toContain("pnpm production:data-counts > production-live-data-counts.txt");
    expect(doc).toContain("pnpm production:signed-in-route-proof --packet");
    expect(doc).toContain("--live-data-counts production-live-data-counts.txt");
  });
});
