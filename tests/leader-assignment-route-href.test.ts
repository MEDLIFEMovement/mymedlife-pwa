import { describe, expect, it } from "vitest";

import { buildLeaderAssignmentRouteHref } from "@/services/leader-assignment-route-href";

describe("leader assignment route href", () => {
  it("builds the base assignment handoff route", () => {
    expect(buildLeaderAssignmentRouteHref("assignment-123")).toBe(
      "/rush-month/actions?assignmentId=assignment-123",
    );
  });

  it("preserves the caller source when a packet or review surface links into the action list", () => {
    expect(
      buildLeaderAssignmentRouteHref("assignment-123", {
        source: "proof_metadata_packet",
      }),
    ).toBe(
      "/rush-month/actions?assignmentId=assignment-123&source=proof_metadata_packet",
    );
  });
});
