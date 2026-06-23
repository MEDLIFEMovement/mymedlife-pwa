import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MemberActionDetailPreview,
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

  it("renders the mockup-aligned submit surface and review CTA", () => {
    const html = renderToStaticMarkup(
      createElement(MemberActionDetailPreview, {
        assignment,
        sectionId: "submit-evidence",
      }),
    );

    expect(html).toContain("id=\"submit-evidence\"");
    expect(html).toContain("Submit Evidence");
    expect(html).toContain("Submitting for");
    expect(html).toContain("Screenshot");
    expect(html).toContain("Link");
    expect(html).toContain("Text");
    expect(html).toContain("Submit for review");
    expect(html).toContain("I confirm this evidence is accurate");
  });

  it("renders a route-backed confirmation state after submit", () => {
    const html = renderToStaticMarkup(
      createElement(MemberActionDetailPreview, {
        assignment,
        actionDetailHref: "/rush-month/actions/member-push",
        editHref: "/rush-month/actions/member-push?step=submit#submit-evidence",
        queueHref: "/rush-month/evidence",
        mode: "submitted",
        sectionId: "submit-evidence",
      }),
    );

    expect(html).toContain("Submitted for Review");
    expect(html).toContain("Pending leader review");
    expect(html).toContain("Edit evidence");
    expect(html).toContain("See your proof queue");
    expect(html).toContain("Back to action details");
  });
});
