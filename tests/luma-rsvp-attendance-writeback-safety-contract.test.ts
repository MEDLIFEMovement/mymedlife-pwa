import { afterEach, describe, expect, it, vi } from "vitest";

import * as rolloutControls from "@/services/admin-rollout-controls-registry";
import {
  formatLumaRsvpAttendanceWritebackSafetyContract,
  getLumaRsvpAttendanceWritebackSafetyContract,
} from "@/services/luma-rsvp-attendance-writeback-safety-contract";

describe("Luma RSVP / attendance-import / event-writeback safety contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps Luma event, RSVP, attendance, points, and proof authority blocked", () => {
    const contract = getLumaRsvpAttendanceWritebackSafetyContract();

    expect(contract.currentWritePath).toMatchObject({
      exists: false,
    });
    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
    expect(
      contract.lanes.map((lane) => lane.key),
    ).toEqual([
      "luma_event_authority",
      "luma_reminders_and_webhooks",
      "rsvp_writeback_authority",
      "attendance_import_authority",
      "points_and_leaderboard_authority",
      "provider_replay_retry_rollback",
      "production_evidence_and_rollout_boundary",
    ]);
    expect(
      contract.lanes.find((lane) => lane.key === "luma_event_authority"),
    ).toMatchObject({
      route: "/admin/integrations/luma",
      status: "blocked_pending_future_lane",
      requiredFlags: ["luma_event_create", "luma_event_update"],
    });
    expect(
      contract.lanes.find((lane) => lane.key === "rsvp_writeback_authority"),
    ).toMatchObject({
      route: "/app/events",
      requiredFlags: ["luma_rsvp_writeback"],
    });
    expect(
      contract.lanes.find((lane) => lane.key === "attendance_import_authority"),
    ).toMatchObject({
      route: "/leader?view=events",
      requiredFlags: ["luma_attendance_import"],
    });
  });

  it("pins fake provider proof, zero-send, and points drift as blocked", () => {
    const contract = getLumaRsvpAttendanceWritebackSafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "luma_reminders_and_webhooks")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake reminder delivery.",
        "No provider replay, retry, rollback, or zero-send claim from preview-only outbox posture.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "points_and_leaderboard_authority")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake points awards from Luma RSVP or attendance rows.",
        "No local/Test/Figma points movement counts as production pilot evidence.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_evidence_and_rollout_boundary")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No provider/Test/Figma/sandbox/mock/staging/sample data counts as pilot proof.",
        "No provider-side zero-send or disabled rows count as final production approval evidence.",
      ]),
    );
  });

  it("formats the contract in plain English for operators", () => {
    const output = formatLumaRsvpAttendanceWritebackSafetyContract();

    expect(output).toContain(
      "Luma RSVP / attendance-import / event-writeback safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("Current write path:");
    expect(output).toContain("exists: false");
    expect(output).toContain("Luma event create, update, and delete authority");
    expect(output).toContain("Attendance and check-in import authority");
    expect(output).toContain("Provider replay, retry, rollback, and zero-send claims");
    expect(output).toContain(
      "Provider/Test/Figma/sandbox/mock/staging/sample evidence does not count as pilot proof, signed-in production proof, rollout packet evidence, live counts, or invite-gate truth.",
    );
    expect(output).toContain(
      "A separate audited points materialization lane proving provider attendance cannot directly move leaderboards without approval.",
    );
  });

  it("fails closed when a required Luma rollout control is missing", () => {
    const originalGetFeatureFlagDefinition = rolloutControls.getFeatureFlagDefinition;
    vi.spyOn(rolloutControls, "getFeatureFlagDefinition").mockImplementation((key) =>
      key === "luma_rsvp_writeback" ? null : originalGetFeatureFlagDefinition(key),
    );

    expect(() => getLumaRsvpAttendanceWritebackSafetyContract()).toThrow(
      "Missing luma_rsvp_writeback rollout control definition.",
    );
  });

  it("fails closed when a required Luma rollout control drifts from blocked defaults", () => {
    const originalGetFeatureFlagDefinition = rolloutControls.getFeatureFlagDefinition;
    vi.spyOn(rolloutControls, "getFeatureFlagDefinition").mockImplementation((key) => {
      const definition = originalGetFeatureFlagDefinition(key);

      if (key !== "luma_attendance_import" || !definition) {
        return definition;
      }

      return {
        ...definition,
        approvalPolicy: "production_confirmation",
        defaultEnabledByEnvironment: {
          local: true,
          staging: false,
          production: false,
        },
      };
    });

    expect(() => getLumaRsvpAttendanceWritebackSafetyContract()).toThrow(
      "luma_attendance_import rollout control drifted away from the blocked default.",
    );
  });
});
