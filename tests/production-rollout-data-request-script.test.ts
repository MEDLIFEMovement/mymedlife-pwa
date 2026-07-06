import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getProductionRolloutCsvTemplateContent,
  productionRolloutCsvTemplates,
} from "@/services/production-rollout-csv-templates";

describe("production rollout data request script", () => {
  it("writes an owner-by-owner request report for incomplete CSV data", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-data-request-"));
    const csvDirectory = join(directory, "rollout-csv");
    const outPath = join(directory, "production-rollout-data-request.md");
    createHeaderOnlyCsvDirectory(csvDirectory);

    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-rollout-data-request.mjs",
          "--dir",
          csvDirectory,
          "--out",
          outPath,
        ],
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      expect(getProcessOutput(error, "stdout")).toContain(
        "Production rollout data request written to",
      );
      expect(getProcessOutput(error, "stderr")).toBe("");
    }

    const report = readFileSync(outPath, "utf8");

    expect(existsSync(outPath)).toBe(true);
    expect(report).toContain("myMEDLIFE 30-chapter data request: NOT READY");
    expect(report).toContain("Nick / HQ launch owner");
    expect(report).toContain("DS / launch owner");
    expect(report).toContain("Add 30 more active launch chapter row(s).");
    expect(report).toContain("Add 500 more approved student/leader user(s).");
    expect(report).not.toContain("student@medlifemovement.org");
  });

  it("requires an output path", () => {
    try {
      execFileSync(
        process.execPath,
        [
          "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
          "scripts/create-production-rollout-data-request.mjs",
          "--dir",
          "rollout-csv",
        ],
        {
          encoding: "utf8",
          stdio: "pipe",
        },
      );
    } catch (error) {
      expect(getProcessOutput(error, "stderr")).toContain(
        "Missing required argument --out.",
      );
      return;
    }

    throw new Error("Expected data request script to require --out.");
  });
});

function createHeaderOnlyCsvDirectory(directory: string) {
  mkdirSync(directory, { recursive: true });

  for (const template of productionRolloutCsvTemplates) {
    writeFileSync(
      join(directory, template.filename),
      getProductionRolloutCsvTemplateContent(template),
    );
  }
}

function getProcessOutput(error: unknown, key: "stdout" | "stderr") {
  if (!error || typeof error !== "object" || !(key in error)) {
    return "";
  }

  const value = (error as Record<typeof key, unknown>)[key];

  return Buffer.isBuffer(value) ? value.toString("utf8") : String(value ?? "");
}
