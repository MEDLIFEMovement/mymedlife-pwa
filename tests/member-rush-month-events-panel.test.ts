import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MemberRushMonthEventsPanel } from "@/components/member-rush-month-events-panel";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberLaunchLaneEventRows } from "@/services/member-launch-lane-events";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("member rush month events panel", () => {
  it("renders the student mobile events screen as one coming-up list from the mockup", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const rows = getMemberLaunchLaneEventRows(
      actor,
      getMockReadOnlyAppData("Testing member events panel."),
    );
    const html = renderToStaticMarkup(
      createElement(MemberRushMonthEventsPanel, {
        rows,
        chapterName: "UCLA MEDLIFE",
      }),
    );

    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Events");
    expect(html).toContain("Event loop");
    expect(html).toContain("Coming Up");
    expect(html).toContain("Rush Month kickoff social");
    expect(html).toContain("RSVP&#x27;d");
    expect(html).toContain("Luma");
    expect(html).toContain("20 pts for attending");
    expect(html).toContain("Bruin Plaza");
    expect(html).toContain("RSVP → attendance → points → leaderboard");
    expect(html).toContain("/app/events/chapter-event-ucla-kickoff?source=events");
    expect(html).not.toContain("This Week: 2");
    expect(html).not.toContain("RSVP Open: 3");
    expect(html).not.toContain("RSVP&#x27;d: 1");
  });

  it("preserves a home-origin handoff when the member events list was opened from home", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const rows = getMemberLaunchLaneEventRows(
      actor,
      getMockReadOnlyAppData("Testing member events home handoff."),
    );
    const html = renderToStaticMarkup(
      createElement(MemberRushMonthEventsPanel, {
        rows,
        chapterName: "UCLA MEDLIFE",
        source: "home",
      }),
    );

    expect(html).toContain("From home");
    expect(html).toContain(
      "Home surfaced this events list as the next place to show up. Keep that chapter moment tied to the weekly loop you came from.",
    );
    expect(html).toContain("Back to home");
    expect(html).toContain('href="/app"');
    expect(html).toContain("/app/events/chapter-event-ucla-kickoff?source=home");
    expect(html.indexOf("Events")).toBeLessThan(html.indexOf("From home"));
  });

  it("folds a legacy campaign-origin handoff into the standard member events loop", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const rows = getMemberLaunchLaneEventRows(
      actor,
      getMockReadOnlyAppData("Testing member events campaign handoff."),
    );
    const html = renderToStaticMarkup(
      createElement(MemberRushMonthEventsPanel, {
        rows,
        chapterName: "UCLA MEDLIFE",
        source: "campaigns",
      }),
    );

    expect(html).not.toContain("From campaigns");
    expect(html).not.toContain("Back to home");
    expect(html).toContain("/app/events/chapter-event-ucla-kickoff?source=events");
  });

  it("renders the active chapter label instead of hardcoding a single chapter name", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const rows = getMemberLaunchLaneEventRows(
      actor,
      getMockReadOnlyAppData("Testing dynamic chapter label on events."),
    );
    const html = renderToStaticMarkup(
      createElement(MemberRushMonthEventsPanel, {
        rows,
        chapterName: "Boston College MEDLIFE",
      }),
    );

    expect(html).toContain("Boston College MEDLIFE");
    expect(html).not.toContain("UCLA MEDLIFE");
  });
});
