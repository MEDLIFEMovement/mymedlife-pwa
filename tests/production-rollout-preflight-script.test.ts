import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getProductionRolloutCsvTemplateContent,
  productionRolloutCsvTemplates,
} from "@/services/production-rollout-csv-templates";

describe("production rollout preflight script", () => {
  it("writes a redacted not-ready report from blank rollout templates", () => {
    const directory = makeCsvDirectory(Object.fromEntries(
      productionRolloutCsvTemplates.map((template) => [
        template.filename,
        getProductionRolloutCsvTemplateContent(template),
      ]),
    ));
    const outPath = join(directory, "preflight.md");
    const output = runFailedPreflight(directory, outPath);
    const report = readFileSync(outPath, "utf8");

    expect(output).toContain("Production rollout preflight written to");
    expect(report).toContain("30-chapter rollout preflight: NOT READY");
    expect(report).toContain("Stage summary:");
    expect(report).toContain("Does not create users");
    expect(report).toContain("FAIL CSV intake");
  });
});

function makeCsvDirectory(files: Record<string, string>) {
  const directory = mkdtempSync(join(tmpdir(), "mymedlife-rollout-preflight-"));

  for (const [filename, content] of Object.entries(files)) {
    writeFileSync(join(directory, filename), `${content.trimEnd()}\n`);
  }

  return directory;
}

function runFailedPreflight(directory: string, outPath: string) {
  try {
    return execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-production-rollout-preflight.mjs",
        "--dir",
        directory,
        "--out",
        outPath,
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
