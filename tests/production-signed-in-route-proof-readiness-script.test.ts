import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("production signed-in route proof readiness script", () => {
  it("writes a read-only production proof checklist without requiring a packet", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-proof-readiness-"));
    const outPath = join(directory, "production-signed-in-route-proof-readiness.md");

    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-production-signed-in-route-proof-readiness.mjs",
        "--out",
        outPath,
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Production signed-in route proof readiness written to");
    expect(output).toContain(
      "PASS Checklist still names the four required production proof classes and their exact routes.",
    );
    expect(readFileSync(outPath, "utf8")).toContain(
      "Production signed-in route proof readiness: READ-ONLY OPERATOR CHECKLIST",
    );
    expect(readFileSync(outPath, "utf8")).toContain(
      "An approved production rollout packet is still missing",
    );
  });
});
