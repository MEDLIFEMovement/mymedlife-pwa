import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("production signed-in route proof drift script", () => {
  it("checks proof route expectations against active launch-lane metadata", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-production-signed-in-route-proof-drift.mjs",
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Production signed-in route proof drift check: READY");
    expect(output).toContain(
      "PASS General member lands in the student app stays aligned to active launch-lane route metadata at /app.",
    );
    expect(output).toContain(
      "PASS Production signed-in proof import still rejects preview, sandbox, Figma/Test, SOP sample, and staging markers.",
    );
    expect(output).toContain("does not collect production proof");
  });
});
