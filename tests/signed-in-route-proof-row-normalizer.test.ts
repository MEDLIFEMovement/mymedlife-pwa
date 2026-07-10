import { describe, expect, it } from "vitest";
import {
  normalizeSignedInRouteProofSourceRow,
  normalizeSignedInRouteProofSourceRows,
} from "@/services/signed-in-route-proof-row-normalizer";

describe("signed-in route proof row normalizer", () => {
  it("normalizes a raw member row into the canonical signed-in proof shape", () => {
    const [row] = normalizeSignedInRouteProofSourceRows([
      {
        email: " Member@medlifemovement.org ",
        workspace: "member",
        observedPath: " /app ",
        status: "passed",
        checkedAt: " 2026-07-05T15:00:00Z ",
        notes: "  ",
      },
    ]);

    expect(row).toEqual({
      email: "member@medlifemovement.org",
      workspace: "student_app",
      observedPath: "/app",
      status: "passed",
      checkedAt: "2026-07-05T15:00:00Z",
      notes: "",
    });
  });

  it("normalizes the leader, staff, and admin aliases in one pass", () => {
    const rows = normalizeSignedInRouteProofSourceRows([
      {
        email: "leader@medlifemovement.org",
        workspace: "leader",
        observedPath: "/leader?view=overview",
        status: "passed",
        checkedAt: "2026-07-05T15:01:00Z",
      },
      {
        email: "coach@medlifemovement.org",
        workspace: "staff",
        observedPath: "/staff?view=chapters",
        status: "failed",
        checkedAt: "2026-07-05T15:02:00Z",
      },
      {
        email: "ds@medlifemovement.org",
        workspace: "admin",
        observedPath: "/admin",
        status: "not_checked",
        checkedAt: "2026-07-05T15:03:00Z",
      },
    ]);

    expect(rows.map((row) => row.workspace)).toEqual([
      "leader_command_center",
      "staff_command_center",
      "admin_backend",
    ]);
    expect(rows.map((row) => row.status)).toEqual([
      "passed",
      "failed",
      "not_checked",
    ]);
  });

  it("rejects row-shape drift that would weaken the signed-in proof boundary", () => {
    expect(() =>
      normalizeSignedInRouteProofSourceRow(
        {
          email: "leader@medlifemovement.org",
          workspace: "pilot",
          observedPath: "/leader?view=overview",
          status: "passed",
          checkedAt: "2026-07-05T15:01:00Z",
        },
        2,
      ),
    ).toThrow(/unsupported workspace/i);

    expect(() =>
      normalizeSignedInRouteProofSourceRow(
        {
          email: "leader@medlifemovement.org",
          workspace: "leader",
          observedPath: "/leader?view=overview",
          status: "watch",
          checkedAt: "2026-07-05T15:01:00Z",
        },
        3,
      ),
    ).toThrow(/unsupported status/i);

    expect(() =>
      normalizeSignedInRouteProofSourceRow(
        {
          email: "leader@medlifemovement.org",
          workspace: "leader",
          observedPath: "/leader?view=overview",
          status: "passed",
          checkedAt: "",
        },
        4,
      ),
    ).toThrow(/checkedAt must be a valid timestamp/i);

    expect(() =>
      normalizeSignedInRouteProofSourceRow(
        {
          email: "leader@medlifemovement.org",
          workspace: "leader",
          observedPath: "/leader?view=overview",
          status: "passed",
          checkedAt: "2026-07-05T15:01:00Z",
          notes: "preview-cookie role switch",
        },
        5,
      ),
    ).toThrow(/cannot count as approved production signed-in proof/i);
  });
});
