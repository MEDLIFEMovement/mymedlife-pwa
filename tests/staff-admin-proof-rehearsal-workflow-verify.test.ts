import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("staff-admin proof rehearsal workflow-chain verifier", () => {
  it("keeps the docs aligned with the chain command and TEST-only boundary", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/verify-staff-admin-proof-rehearsal-workflow-chain.mjs",
      ],
      {
        encoding: "utf8",
      },
    );

    expect(output).toContain("Staff/Admin TEST rehearsal workflow-chain verifier: PASS");
    expect(output).toContain("workflowPath=");
    expect(output).toContain("quickstartPath=");
    expect(output).toContain("opsNotePath=");
    expect(output).toContain("workflow_mentions_help_alias=true");
    expect(output).toContain("workflow_mentions_chain_command=true");
    expect(output).toContain("workflow_mentions_boundary=true");
    expect(output).toContain("quickstart_mentions_expected_pass=true");
    expect(output).toContain("quickstart_mentions_failure_cases=true");
    expect(output).toContain("ops_note_mentions_boundary=true");
  });
});
