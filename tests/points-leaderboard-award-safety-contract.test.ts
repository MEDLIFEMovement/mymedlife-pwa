import { afterEach, describe, expect, it, vi } from "vitest";

import * as rolloutControls from "@/services/admin-rollout-controls-registry";
import {
  formatPointsLeaderboardAwardSafetyContract,
  getPointsLeaderboardAwardSafetyContract,
} from "@/services/points-leaderboard-award-safety-contract";

describe("points / leaderboard award authority safety contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps points and leaderboard surfaces read-only while acknowledging there is no approved award write path", () => {
    const contract = getPointsLeaderboardAwardSafetyContract();

    expect(contract.currentWritePath).toMatchObject({
      exists: false,
    });
    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
    expect(
      contract.lanes.find((lane) => lane.key === "member_points_readback"),
    ).toMatchObject({
      route: "/app/points",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "event_attendance_award_boundary"),
    ).toMatchObject({
      route: "/app/events",
      status: "blocked_pending_future_lane",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "proof_review_and_points_materialization"),
    ).toMatchObject({
      route: "/rush-month/review",
      status: "read_only_preview",
    });
  });

  it("pins assignment, campaign, rewards, and rollout-proof drift as blocked", () => {
    const contract = getPointsLeaderboardAwardSafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "assignment_and_follow_up_points_boundary")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake points award on assignment create or follow-up.",
        "No notification-driven points side effect.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "campaign_and_rush_points_credit")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake campaign points award from shell review copy.",
        "No fake SLT or traveler activity counted as points movement.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "rewards_provider_and_notifications")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake Smile.io reward grant or coupon issuance.",
        "No fake points reminder or celebration send.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_proof_and_rollout_evidence")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Test/Figma/sandbox/mock points row counts as production proof.",
        "No local rehearsal artifact counts as real attendance-plus-points completion proof.",
      ]),
    );
  });

  it("formats the award boundary in plain English for operators", () => {
    const output = formatPointsLeaderboardAwardSafetyContract();

    expect(output).toContain(
      "Points / leaderboard award authority safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("Current write path:");
    expect(output).toContain("exists: false");
    expect(output).toContain("Event attendance and RSVP award authority");
    expect(output).toContain("Smile.io, rewards, notifications, and provider/outbox sends");
    expect(output).toContain(
      "Member, leader, staff, and admin shells may read points differently by role, but preview visibility must never stand in for real member award authority or production proof.",
    );
    expect(output).toContain(
      "A server-only award/materialization boundary with explicit sources, duplicate protection, correction rules, and audit linkage.",
    );
  });

  it("fails closed when a required external-write rollout control is missing", () => {
    const originalGetFeatureFlagDefinition = rolloutControls.getFeatureFlagDefinition;
    vi.spyOn(rolloutControls, "getFeatureFlagDefinition").mockImplementation((key) =>
      key === "warehouse_export" ? null : originalGetFeatureFlagDefinition(key),
    );

    expect(() => getPointsLeaderboardAwardSafetyContract()).toThrow(
      "Missing warehouse_export rollout control definition.",
    );
  });
});
