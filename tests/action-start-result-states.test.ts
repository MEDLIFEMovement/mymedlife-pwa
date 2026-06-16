import { describe, expect, it } from "vitest";
import { assignments } from "@/data/mock-rush-month";
import {
  getActionStartResultState,
  getActionStartResultStates,
  getDisabledActionStartResultPreview,
  getFutureActionStartResultIfEnabled,
} from "@/services/action-start-result-states";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("action-start result states", () => {
  it("defines plain-English states for the future action-start save", () => {
    const states = getActionStartResultStates();

    expect(states.map((state) => state.code)).toEqual([
      "started",
      "write_disabled",
      "already_started",
      "permission_denied",
      "missing_auth",
      "assignment_not_found",
      "server_error",
    ]);
    expect(states.every((state) => state.plainEnglishMessage.length > 30)).toBe(true);
    expect(states.every((state) => !state.plainEnglishMessage.includes("undefined"))).toBe(
      true,
    );
  });

  it("keeps the current browser result disabled even when a future state exists", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = requireAssignment("member-push");
    const preview = getDisabledActionStartResultPreview(actor, assignment);

    expect(preview.operation).toBe("action_started");
    expect(preview.currentResult.code).toBe("write_disabled");
    expect(preview.currentResult.createsEvent).toBe(false);
    expect(preview.serverResultShape).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "write_disabled",
        assignmentId: "member-push",
      }),
    );
    expect(preview.serverResultShape.plainEnglishMessage).toContain(
      "not allowed to save",
    );
  });

  it("previews duplicate protection for an action that is already in progress", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = requireAssignment("member-push");

    expect(getFutureActionStartResultIfEnabled(actor, assignment)).toEqual(
      expect.objectContaining({
        code: "already_started",
        createsEvent: false,
        success: false,
      }),
    );
  });

  it("previews success only for a visible not-started action and approved role", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const assignment = requireAssignment("coach-summary");

    expect(getFutureActionStartResultIfEnabled(actor, assignment)).toEqual(
      expect.objectContaining({
        code: "started",
        createsEvent: true,
        success: true,
      }),
    );
  });

  it("blocks DS admin from creating action-start truth", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const assignment = requireAssignment("member-push");

    expect(getFutureActionStartResultIfEnabled(actor, assignment)).toEqual(
      expect.objectContaining({
        code: "permission_denied",
        retryAllowed: false,
      }),
    );
  });

  it("returns stable lookup records by code", () => {
    expect(getActionStartResultState("missing_auth")).toEqual(
      expect.objectContaining({
        title: "Sign-in is required",
        retryAllowed: true,
      }),
    );
  });
});

function requireAssignment(assignmentId: string) {
  const assignment = assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    throw new Error(`Missing mock assignment ${assignmentId}`);
  }

  return assignment;
}
