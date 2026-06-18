import { describe, expect, it } from "vitest";
import {
  createDefaultMemberActionPreviewDraft,
  getMemberActionPreviewState,
} from "@/components/member-action-detail-preview";

describe("member action detail preview", () => {
  const assignment = {
    title: "Run the general member invite push",
    evidenceRequired: "Message screenshot, invite list, or event RSVP link.",
    points: 30,
  };

  it("creates a concrete default draft from the assignment details", () => {
    expect(createDefaultMemberActionPreviewDraft(assignment)).toContain(
      "Run the general member invite push",
    );
    expect(createDefaultMemberActionPreviewDraft(assignment)).toContain(
      "event RSVP link",
    );
  });

  it("keeps submit disabled until the draft is confirmed", () => {
    expect(
      getMemberActionPreviewState(
        createDefaultMemberActionPreviewDraft(assignment),
        false,
        null,
      ),
    ).toEqual({
      canSubmit: false,
      hasConfirmation: false,
    });
  });

  it("enables submit only when the draft is long enough and confirmed", () => {
    expect(
      getMemberActionPreviewState(
        createDefaultMemberActionPreviewDraft(assignment),
        true,
        null,
      ),
    ).toEqual({
      canSubmit: true,
      hasConfirmation: false,
    });
  });

  it("marks the local confirmation state after preview submit", () => {
    expect(
      getMemberActionPreviewState(
        createDefaultMemberActionPreviewDraft(assignment),
        true,
        "Submitted locally.",
      ),
    ).toEqual({
      canSubmit: true,
      hasConfirmation: true,
    });
  });
});
