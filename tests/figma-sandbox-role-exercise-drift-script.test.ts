import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("figma sandbox role exercise drift script", () => {
  it("checks that sandbox exercise routes still match launch-lane metadata", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-figma-sandbox-role-exercise-drift.mjs",
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Figma sandbox role exercise drift check: READY");
    expect(output).toContain("PASS Member app default route stays aligned to /app");
    expect(output).toContain("not production evidence");
  });
});
