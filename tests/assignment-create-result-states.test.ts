import { describe, expect, it } from "vitest";
import { assignments } from "@/data/mock-rush-month";
import type { ChapterAssignmentInput } from "@/services/local-action-contracts";
import {
  getAssignmentCreateResultState,
  getAssignmentCreateResultStates,
  getDisabledAssignmentCreateResultPreview,
  getFutureAssignmentCreateResultIfEnabled,
} from "@/services/assignment-create-result-states";
import { getMockLocalActorContext } from "@/services/local-actor-context";

const validAssignmentInput = {
  title: "Assign a Rush Month event owner",
  instructions:
    "Choose one student owner, confirm the event goal, and tell them what proof should be collected afterward.",
  ownerRole: "Action Committee Member",
  dueLabel: "Next Friday",
  evidenceRequired: "Owner name, event link, and proof collection plan.",
  points: 15,
  kpi: "Rush Month event owner assigned",
} as const satisfies ChapterAssignmentInput;

describe("assignment creation result states", () => {
  it("defines plain-English states for the future assignment-create save", () => {
    const states = getAssignmentCreateResultStates();

    expect(states.map((state) => state.code)).toEqual([
      "assignment_created",
      "write_disabled",
      "reminders_disabled",
      "duplicate_assignment",
      "permission_denied",
      "missing_auth",
      "title_too_short",
      "instructions_too_short",
      "evidence_requirement_too_short",
      "kpi_required",
      "invalid_points",
      "server_error",
    ]);
    expect(states.every((state) => state.plainEnglishMessage.length > 30)).toBe(true);
    expect(states.every((state) => state.sendsReminder === false)).toBe(true);
  });

  it("keeps the current browser assignment-create result disabled", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const preview = getDisabledAssignmentCreateResultPreview(
      actor,
      validAssignmentInput,
      assignments,
    );

    expect(preview.operation).toBe("action_assigned");
    expect(preview.currentResult.code).toBe("write_disabled");
    expect(preview.currentResult.createsAssignment).toBe(false);
    expect(preview.currentResult.createsOutboxItem).toBe(false);
    expect(preview.currentResult.sendsReminder).toBe(false);
    expect(preview.serverResultShape).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "write_disabled",
        title: validAssignmentInput.title,
      }),
    );
  });

  it("previews success for a chapter leader with valid assignment input", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");

    expect(
      getFutureAssignmentCreateResultIfEnabled(actor, validAssignmentInput, assignments),
    ).toEqual(
      expect.objectContaining({
        code: "assignment_created",
        createsAssignment: true,
        createsOutboxItem: true,
        sendsReminder: false,
        success: true,
      }),
    );
  });

  it("blocks duplicate assignment titles", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");

    expect(
      getFutureAssignmentCreateResultIfEnabled(
        actor,
        {
          ...validAssignmentInput,
          title: "Invite 3 friends to the Intro GBM",
        },
        assignments,
      ),
    ).toEqual(
      expect.objectContaining({
        code: "duplicate_assignment",
        createsAssignment: false,
      }),
    );
  });

  it("blocks roles that do not own assignment truth", () => {
    for (const email of [
      "member.a@mymedlife.test",
      "coach@mymedlife.test",
      "admin@mymedlife.test",
      "ds.admin@mymedlife.test",
    ]) {
      const actor = getMockLocalActorContext(email);

      expect(
        getFutureAssignmentCreateResultIfEnabled(
          actor,
          validAssignmentInput,
          assignments,
        ),
      ).toEqual(
        expect.objectContaining({
          code: "permission_denied",
          createsAssignment: false,
        }),
      );
    }
  });

  it("validates required assignment fields before future save", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");

    expect(
      getFutureAssignmentCreateResultIfEnabled(actor, {
        ...validAssignmentInput,
        title: "Go",
      }),
    ).toEqual(expect.objectContaining({ code: "title_too_short" }));
    expect(
      getFutureAssignmentCreateResultIfEnabled(actor, {
        ...validAssignmentInput,
        instructions: "Too short",
      }),
    ).toEqual(expect.objectContaining({ code: "instructions_too_short" }));
    expect(
      getFutureAssignmentCreateResultIfEnabled(actor, {
        ...validAssignmentInput,
        evidenceRequired: "",
      }),
    ).toEqual(expect.objectContaining({ code: "evidence_requirement_too_short" }));
    expect(
      getFutureAssignmentCreateResultIfEnabled(actor, {
        ...validAssignmentInput,
        kpi: "",
      }),
    ).toEqual(expect.objectContaining({ code: "kpi_required" }));
    expect(
      getFutureAssignmentCreateResultIfEnabled(actor, {
        ...validAssignmentInput,
        points: 1001,
      }),
    ).toEqual(expect.objectContaining({ code: "invalid_points" }));
  });

  it("keeps reminders disabled as a documented non-send state", () => {
    expect(getAssignmentCreateResultState("reminders_disabled")).toEqual(
      expect.objectContaining({
        title: "Reminder automation is not turned on yet",
        createsAssignment: false,
        sendsReminder: false,
      }),
    );
  });
});
