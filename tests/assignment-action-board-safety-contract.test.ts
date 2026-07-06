import { describe, expect, it } from "vitest";

import {
  formatAssignmentActionBoardSafetyContract,
  getAssignmentActionBoardSafetyContract,
} from "@/services/assignment-action-board-safety-contract";

describe("assignment / action board safety contract", () => {
  it("keeps only the localhost assignment-create lane implemented and leaves reminder-like behavior blocked", () => {
    const contract = getAssignmentActionBoardSafetyContract();
    const localCreateLane = contract.lanes.find(
      (lane) => lane.key === "local_assignment_create",
    );

    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
    expect(localCreateLane).toMatchObject({
      route: "/admin/assignment-write",
      status: "implemented_local_only",
    });
    expect(localCreateLane?.allowedActors).toEqual(
      expect.arrayContaining(["chapter_leader", "super_admin"]),
    );
    expect(localCreateLane?.blockedActors).toEqual(
      expect.arrayContaining(["admin", "ds_admin", "coach"]),
    );
    expect(localCreateLane?.forbiddenSideEffects).toEqual(
      expect.arrayContaining([
        "No live reminder delivery.",
        "No provider send, email, SMS, HubSpot, or n8n send.",
        "No points award from assignment creation alone.",
      ]),
    );
  });

  it("keeps member and leader boards read-only while blocking ownership transfer and production-proof drift", () => {
    const contract = getAssignmentActionBoardSafetyContract();

    expect(contract.lanes.find((lane) => lane.key === "member_action_board")).toMatchObject({
      status: "read_only_preview",
      route: "/rush-month/actions",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "leader_follow_up_board"),
    ).toMatchObject({
      status: "read_only_preview",
      route: "/rush-month/actions",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "ownership_transfer"),
    ).toMatchObject({
      status: "blocked_pending_future_lane",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "production_proof")?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Test/Figma/sandbox row counts as production proof.",
        "No localhost packet screenshot counts as rollout evidence.",
      ]),
    );
  });

  it("formats the action-board boundary in plain English", () => {
    const output = formatAssignmentActionBoardSafetyContract();

    expect(output).toContain(
      "Assignment / Action Board safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("Local server action: createLeaderAssignmentAction");
    expect(output).toContain("MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE=true");
    expect(output).toContain("Leader/staff follow-up board");
    expect(output).toContain("Task reminders and notifications");
    expect(output).toContain("Staff/leader ownership transfer");
    expect(output).toContain("No Test/Figma/sandbox row counts as production proof.");
  });
});
