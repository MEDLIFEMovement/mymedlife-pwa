import { describe, expect, it } from "vitest";
import { evidenceItems } from "@/data/mock-rush-month";
import type { HqSharingDecisionInput } from "@/services/local-action-contracts";
import {
  getDisabledHqProofDecisionResultPreview,
  getFutureHqProofDecisionResultIfEnabled,
  getHqProofDecisionResultState,
  getHqProofDecisionResultStates,
} from "@/services/hq-proof-decision-result-states";
import { getMockLocalActorContext } from "@/services/local-actor-context";

const approvedDecisionInput = {
  decision: "approved",
  note: "Useful proof to share with other chapters later.",
} as const satisfies HqSharingDecisionInput;

describe("HQ proof decision result states", () => {
  it("defines plain-English states for the future HQ decision save", () => {
    const states = getHqProofDecisionResultStates();

    expect(states.map((state) => state.code)).toEqual([
      "sharing_approved",
      "changes_requested",
      "decision_noted_without_sharing",
      "write_disabled",
      "public_sharing_disabled",
      "already_decided",
      "permission_denied",
      "missing_auth",
      "evidence_not_found",
      "note_too_short",
      "server_error",
    ]);
    expect(states.every((state) => state.plainEnglishMessage.length > 30)).toBe(true);
    expect(states.every((state) => state.publishesProof === false)).toBe(true);
  });

  it("keeps the current browser HQ decision result disabled", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const evidenceItem = requireEvidenceItem("evidence-assign-eboard");
    const preview = getDisabledHqProofDecisionResultPreview(
      actor,
      evidenceItem,
      approvedDecisionInput,
    );

    expect(preview.operation).toBe("hq_sharing_decision");
    expect(preview.currentResult.code).toBe("write_disabled");
    expect(preview.currentResult.createsApproval).toBe(false);
    expect(preview.currentResult.createsOutboxItem).toBe(false);
    expect(preview.currentResult.publishesProof).toBe(false);
    expect(preview.serverResultShape).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: "write_disabled",
        evidenceItemId: "evidence-assign-eboard",
      }),
    );
  });

  it("previews HQ approval without publishing proof", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const evidenceItem = requireEvidenceItem("evidence-assign-eboard");

    expect(
      getFutureHqProofDecisionResultIfEnabled(
        actor,
        evidenceItem,
        approvedDecisionInput,
      ),
    ).toEqual(
      expect.objectContaining({
        code: "sharing_approved",
        createsApproval: true,
        createsOutboxItem: true,
        publishesProof: false,
        success: true,
      }),
    );
  });

  it("maps changes requested and rejection decisions to explicit outcomes", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const evidenceItem = requireEvidenceItem("evidence-assign-eboard");

    expect(
      getFutureHqProofDecisionResultIfEnabled(actor, evidenceItem, {
        decision: "changes_requested",
        note: "Needs clearer student context before sharing.",
      }),
    ).toEqual(
      expect.objectContaining({
        code: "changes_requested",
        success: true,
        publishesProof: false,
      }),
    );
    expect(
      getFutureHqProofDecisionResultIfEnabled(actor, evidenceItem, {
        decision: "rejected",
        note: "Keep this proof internal to the chapter.",
      }),
    ).toEqual(
      expect.objectContaining({
        code: "decision_noted_without_sharing",
        success: true,
        publishesProof: false,
      }),
    );
  });

  it("blocks chapter leaders and DS Admin from HQ sharing decisions", () => {
    const evidenceItem = requireEvidenceItem("evidence-assign-eboard");

    for (const email of ["leader.a@mymedlife.test", "ds.admin@mymedlife.test"]) {
      const actor = getMockLocalActorContext(email);

      expect(
        getFutureHqProofDecisionResultIfEnabled(
          actor,
          evidenceItem,
          approvedDecisionInput,
        ),
      ).toEqual(
        expect.objectContaining({
          code: "permission_denied",
          createsApproval: false,
        }),
      );
    }
  });

  it("blocks duplicate final decisions for already-approved proof", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const evidenceItem = {
      ...requireEvidenceItem("evidence-assign-eboard"),
      status: "approved",
    } as const;

    expect(
      getFutureHqProofDecisionResultIfEnabled(
        actor,
        evidenceItem,
        approvedDecisionInput,
      ),
    ).toEqual(
      expect.objectContaining({
        code: "already_decided",
        createsApproval: false,
      }),
    );
  });

  it("requires a decision note before any future save", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const evidenceItem = requireEvidenceItem("evidence-assign-eboard");

    expect(
      getFutureHqProofDecisionResultIfEnabled(actor, evidenceItem, {
        decision: "approved",
        note: "Short",
      }),
    ).toEqual(
      expect.objectContaining({
        code: "note_too_short",
        retryAllowed: true,
      }),
    );
  });

  it("keeps public sharing disabled as a documented non-write state", () => {
    expect(getHqProofDecisionResultState("public_sharing_disabled")).toEqual(
      expect.objectContaining({
        title: "Public sharing is not turned on yet",
        createsApproval: false,
        publishesProof: false,
      }),
    );
  });
});

function requireEvidenceItem(evidenceItemId: string) {
  const evidenceItem = evidenceItems.find((item) => item.id === evidenceItemId);

  if (!evidenceItem) {
    throw new Error(`Missing mock evidence item ${evidenceItemId}`);
  }

  return evidenceItem;
}
