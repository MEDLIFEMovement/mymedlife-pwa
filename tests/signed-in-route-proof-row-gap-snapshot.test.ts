import { describe, expect, it } from "vitest";
import {
  formatSignedInRouteProofRowGapSnapshot,
  getSignedInRouteProofRowGapSnapshot,
} from "@/services/signed-in-route-proof-row-gap-snapshot";

describe("signed-in route proof row-gap snapshot", () => {
  it("summarizes accepted, missing, and unsafe signed-in proof source rows without touching readiness logic", () => {
    const snapshot = getSignedInRouteProofRowGapSnapshot([
      {
        email: "member@medlifemovement.org",
        workspace: "member",
        observedPath: "/app",
        status: "passed",
        checkedAt: "2026-07-05T15:00:00Z",
      },
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
        status: "passed",
        checkedAt: "2026-07-05T15:02:00Z",
        notes: "preview-cookie role switch",
      },
    ]);

    expect(snapshot.sourceRowCount).toBe(3);
    expect(snapshot.normalizedRowCount).toBe(2);
    expect(snapshot.acceptedWorkspaces).toEqual([
      "student_app",
      "leader_command_center",
    ]);
    expect(snapshot.missingWorkspaces).toEqual([
      "staff_command_center",
      "admin_backend",
    ]);
    expect(snapshot.unsafeSourceRows).toHaveLength(1);
    expect(formatSignedInRouteProofRowGapSnapshot(snapshot)).toContain(
      "Signed-in proof row-gap snapshot",
    );
  });

  it("stays local-only when every signed-in workspace is represented", () => {
    const snapshot = getSignedInRouteProofRowGapSnapshot([
      {
        email: "member@medlifemovement.org",
        workspace: "member",
        observedPath: "/app",
        status: "passed",
        checkedAt: "2026-07-05T15:00:00Z",
      },
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
        status: "passed",
        checkedAt: "2026-07-05T15:02:00Z",
      },
      {
        email: "ds@medlifemovement.org",
        workspace: "admin",
        observedPath: "/admin",
        status: "passed",
        checkedAt: "2026-07-05T15:03:00Z",
      },
    ]);

    expect(snapshot.missingWorkspaces).toEqual([]);
    expect(snapshot.unsafeSourceRows).toEqual([]);
    expect(snapshot.acceptedWorkspaces).toEqual([
      "student_app",
      "leader_command_center",
      "staff_command_center",
      "admin_backend",
    ]);
  });
});
