import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { productionLiveDataRelations } from "@/services/production-live-data-readiness";

describe("production live data counts script", () => {
  it("writes a count-proof report when --out is provided", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-live-counts-"));
    const binDir = join(directory, "bin");
    const outPath = join(directory, "production-live-data-counts.txt");

    mkdirSync(binDir);
    writeFakePnpm(binDir, createReadyCountCsv());

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-production-live-data-counts.mjs",
        "--minimum-chapters=30",
        "--minimum-approved-members=500",
        "--minimum-pilot-events=5",
        "--out",
        outPath,
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${binDir}:${process.env.PATH ?? ""}`,
        },
      },
    );
    const report = readFileSync(outPath, "utf8");

    expect(output).toContain("Production live data count check written to");
    expect(existsSync(outPath)).toBe(true);
    expect(report).toContain("Production live data count check: READY");
    expect(report).toContain("- app.chapters.active: 30");
    expect(report).toContain("- app.memberships.approved: 500");
  });
});

function createReadyCountCsv() {
  const counts: Record<string, number> = {
    "auth.users": 503,
    "app.profiles": 503,
    "app.chapters.active": 30,
    "app.memberships.approved": 500,
    "app.staff_role_assignments.active": 4,
    "app.coach_chapter_assignments.active": 30,
    "app.campaigns.active": 30,
    "app.chapter_events": 5,
    "app.luma_event_links": 5,
    "app.assignments": 30,
    "app.points_events": 5,
    "app.audit_logs": 5,
    "app.automation_outbox.total": 5,
    "app.automation_outbox.unsafe": 0,
  };

  return [
    "relation,rows",
    ...productionLiveDataRelations.map((relation) => `${relation},${counts[relation]}`),
  ].join("\n");
}

function writeFakePnpm(binDir: string, output: string) {
  const scriptPath = join(binDir, "pnpm");

  writeFileSync(
    scriptPath,
    ["#!/bin/sh", "cat <<'EOF'", output, "EOF"].join("\n"),
  );
  chmodSync(scriptPath, 0o755);
}
