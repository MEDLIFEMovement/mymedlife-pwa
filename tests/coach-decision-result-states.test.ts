import { describe, expect, it } from "vitest";
import type { CoachDecisionInput } from "@/services/local-action-contracts";
import {
  getCoachDecisionResultState,
  getCoachDecisionResultStates,
  getDisabledCoachDecisionResultPreview,
  getFutureCoachDecisionResultIfEnabled,
} from "@/services/coach-decision-result-states";
import { getMockLocalActorContext } from "@/services/local-actor-context";

const holdDecisionInput = {
  decision: "hold",
  note: "Chapter should complete proof follow-up before advancing.",
} as const satisfies CoachDecisionInput;

describe("coach decision result states", () => {
  it("defines plain-English states for the future coach decision save", () => {
    const states = getCoachDecisionResultStates();

    expect(states.map((state) => state.code)).toEqual([
      "advance_recorded",
      "hold_recorded",
      "intervention_recorded",
      "write_disabled",
      "escalation_disabled",
      "permission_denied",
      "portfolio_not_assigned",
      "missing_auth",
      "note_too_short",
      "blocker_summary_required",
      "server_error",
    ]);
    expect(states.every((state) => state.plainEnglishMessage.length > 30)).toBe(true);
    expect(states.every((state) => state.sendsEscalationPacket === false)).toBe(true);
  });

  it("keeps the current browser coach decision result disabled", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const preview = getDisabledCoachDecisionResultPreview(actor, holdDecisionInput);

    expect(preview.operation).toBe("coach_decision_logged");
    expect(preview.currentResult.code).toBe("write_disabled");
    expect(preview.currentResult.createsReadinessReview).toBe(false);
    expect(preview.currentResult.createsOutboxItem).toBe(false);
    expect(preview.currentResult.sendsEscalationPacket).toBe(false);
    expect(preview.serverResultShape).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "write_disabled",
        decision: "hold",
      }),
    );
  });

  it("maps advance, hold, and intervene decisions to explicit success states", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");

    expect(
      getFutureCoachDecisionResultIfEnabled(actor, {
        decision: "advance",
        note: "Chapter is ready to move into the next phase.",
      }),
    ).toEqual(
      expect.objectContaining({
        code: "advance_recorded",
        createsReadinessReview: true,
        createsOutboxItem: true,
        sendsEscalationPacket: false,
      }),
    );
    expect(getFutureCoachDecisionResultIfEnabled(actor, holdDecisionInput)).toEqual(
      expect.objectContaining({
        code: "hold_recorded",
        success: true,
        sendsEscalationPacket: false,
      }),
    );
    expect(
      getFutureCoachDecisionResultIfEnabled(actor, {
        decision: "intervene",
        note: "Chapter needs active coach support this week.",
        blockerSummary: "Proof quality and owner follow-up are blocked.",
      }),
    ).toEqual(
      expect.objectContaining({
        code: "intervention_recorded",
        success: true,
        createsOutboxItem: true,
        sendsEscalationPacket: false,
      }),
    );
  });

  it("requires a blocker summary for intervention decisions", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");

    expect(
      getFutureCoachDecisionResultIfEnabled(actor, {
        decision: "intervene",
        note: "Chapter needs active coach support this week.",
      }),
    ).toEqual(
      expect.objectContaining({
        code: "blocker_summary_required",
        retryAllowed: true,
      }),
    );
  });

  it("blocks students, chapter leaders, and DS Admin from coach decisions", () => {
    for (const email of [
      "member.a@mymedlife.test",
      "leader.a@mymedlife.test",
      "ds.admin@mymedlife.test",
    ]) {
      const actor = getMockLocalActorContext(email);

      expect(getFutureCoachDecisionResultIfEnabled(actor, holdDecisionInput)).toEqual(
        expect.objectContaining({
          code: "permission_denied",
          createsReadinessReview: false,
        }),
      );
    }
  });

  it("requires a portfolio assignment for coach-scoped decisions", () => {
    const actor = {
      ...getMockLocalActorContext("coach@mymedlife.test"),
      coachPortfolioChapterNames: [],
    };

    expect(getFutureCoachDecisionResultIfEnabled(actor, holdDecisionInput)).toEqual(
      expect.objectContaining({
        code: "portfolio_not_assigned",
        createsOutboxItem: false,
      }),
    );
  });

  it("keeps escalation disabled as a documented non-send state", () => {
    expect(getCoachDecisionResultState("escalation_disabled")).toEqual(
      expect.objectContaining({
        title: "Escalation packets are not turned on yet",
        createsReadinessReview: false,
        sendsEscalationPacket: false,
      }),
    );
  });
});
