import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getProductionRolloutCsvTemplateContent,
  productionRolloutCsvTemplates,
} from "@/services/production-rollout-csv-templates";

describe("production rollout intake status script", () => {
  it("reports missing launch rows before packet build", () => {
    const directory = makeCsvDirectory(Object.fromEntries(
      productionRolloutCsvTemplates.map((template) => [
        template.filename,
        getProductionRolloutCsvTemplateContent(template),
      ]),
    ));
    const output = runFailedIntakeStatus(directory);

    expect(output).toContain("Production rollout CSV intake: NOT READY");
    expect(output).toContain("Current: 0; needed: 30");
    expect(output).toContain("Current: 0; needed: 500");
    expect(output).toContain("Add launch users to users.csv.");
  });
});

function makeCsvDirectory(files: Record<string, string>) {
  const directory = mkdtempSync(join(tmpdir(), "mymedlife-rollout-intake-"));

  for (const [filename, content] of Object.entries(files)) {
    writeFileSync(join(directory, filename), `${content.trimEnd()}\n`);
  }

  return directory;
}

function runFailedIntakeStatus(directory: string) {
  try {
    return execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-production-rollout-intake-status.mjs",
        "--dir",
        directory,
      ],
      {
        encoding: "utf8",
      },
    );
  } catch (error) {
    return [
      getProcessOutput(error, "stdout"),
      getProcessOutput(error, "stderr"),
    ].join("\n");
  }
}

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
