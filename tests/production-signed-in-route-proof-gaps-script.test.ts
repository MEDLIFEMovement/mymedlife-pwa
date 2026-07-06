import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("production signed-in route proof gaps script", () => {
  it("prints a plain-English gap report and exits non-zero when proof classes are missing", () => {
    const directory = mkdtempSync(join(tmpdir(), "mymedlife-signed-in-gaps-"));
    const packetPath = join(directory, "production-rollout-packet.json");

    writeFileSync(
      packetPath,
      JSON.stringify({
        chapters: [{ id: "chapter-ucla", name: "UCLA MEDLIFE", campus: "UCLA" }],
        users: [{ email: "member@medlifemovement.org", displayName: "Launch Member" }],
        memberships: [
          {
            email: "member@medlifemovement.org",
            chapterId: "chapter-ucla",
            roleKey: "general_member",
          },
        ],
        staffRoles: [],
        coachAssignments: [],
        campaigns: [],
        signedInRouteProof: [
          {
            email: "member@medlifemovement.org",
            workspace: "student_app",
            expectedPath: "/app",
            observedPath: "/app",
            status: "passed",
            checkedAt: "2026-07-05T15:00:00Z",
          },
        ],
      }),
      "utf8",
    );

    const output = runFailedGapCheck(packetPath);

    expect(output).toContain("Production signed-in route proof gaps: OPEN");
    expect(output).toContain("PRESENT General member lands in the student app (/app)");
    expect(output).toContain(
      "MISSING Student leader lands in the command center (/leader?view=overview)",
    );
    expect(output).toContain(
      "Preview-cookie, local sandbox, Test/Figma/SOP sample, staging, fake screenshots, and missing-profile/setup-only sessions do not count as production signed-in proof.",
    );
  });
});

function runFailedGapCheck(packetPath: string) {
  try {
    return execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "scripts/check-production-signed-in-route-proof-gaps.mjs",
        "--packet",
        packetPath,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
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
