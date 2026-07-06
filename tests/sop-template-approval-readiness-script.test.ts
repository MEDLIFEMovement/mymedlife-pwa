import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("sop template approval readiness script", () => {
  it("writes a read-only approval readiness report", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-sop-readiness-"));
    const outPath = join(directory, "sop-template-approval-readiness.md");

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-sop-template-approval-readiness.mjs",
        "--out",
        outPath,
      ],
      {
        encoding: "utf8",
      },
    );
    const report = readFileSync(outPath, "utf8");

    expect(output).toContain("SOP/template approval readiness written to");
    expect(existsSync(outPath)).toBe(true);
    expect(report).toContain(
      "SOP/template approval readiness: REVIEW-ONLY SAFETY SPEC",
    );
    expect(report).toContain("SCHEDULED Scheduled for future publication");
    expect(report).toContain(
      "Preview-cookie, localhost, local sandbox, Test/Figma, staging, and sample screenshots do not count as proof that SOP content is production-live.",
    );
  });
});
