import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MemberRushMonthEventsPanel } from "@/components/member-rush-month-events-panel";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getRushMonthEventReadinessWorkspace } from "@/services/rush-month-event-readiness";

describe("member rush month events panel", () => {
  it("renders the student mobile events screen as one coming-up list from the mockup", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getRushMonthEventReadinessWorkspace(actor);
    const html = renderToStaticMarkup(
      createElement(MemberRushMonthEventsPanel, { workspace }),
    );

    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Events");
    expect(html).toContain("Event loop");
    expect(html).toContain("Coming Up");
    expect(html).toContain("Tabling at Bruin Walk");
    expect(html).toContain("Intro GBM");
    expect(html).toContain("Rush Week Social");
    expect(html).toContain("Member Orientation");
    expect(html).toContain("RSVP&#x27;d");
    expect(html).toContain("Luma");
    expect(html).toContain("Staging-safe link attached");
    expect(html).toContain("QR ready for staging review");
    expect(html).toContain("1 RSVP / 1 attended");
    expect(html).toContain("20 points awarded once");
    expect(html).toContain("20 pts for attending");
    expect(html).toContain("Bruin Walk Table 7");
    expect(html).toContain("Engineering VI 289");
    expect(html).toContain("RSVP → attendance → points → leaderboard");
    expect(html).toContain("/rush-month/events/event-rush-social-001?source=events");
    expect(html).toContain("/rush-month/events/event-rush-med-talk-001?source=events");
    expect(html).not.toContain("This Week: 2");
    expect(html).not.toContain("RSVP Open: 3");
    expect(html).not.toContain("RSVP&#x27;d: 1");
  });

  it("preserves a home-origin handoff when the member events list was opened from home", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getRushMonthEventReadinessWorkspace(actor);
    const html = renderToStaticMarkup(
      createElement(MemberRushMonthEventsPanel, {
        workspace,
        source: "home",
      }),
    );

    expect(html).toContain("From home");
    expect(html).toContain(
      "Home surfaced this events list as the next place to show up. Keep that chapter moment tied to the weekly loop you came from.",
    );
    expect(html).toContain("Back to home");
    expect(html).toContain("/rush-month/events/event-rush-social-001?source=home");
    expect(html).toContain("/rush-month/events/event-rush-med-talk-001?source=home");
    expect(html.indexOf("Events")).toBeLessThan(html.indexOf("From home"));
  });
});
