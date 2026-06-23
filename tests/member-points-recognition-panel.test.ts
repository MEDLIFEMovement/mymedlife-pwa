import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MemberPointsRecognitionPanel } from "@/components/member-points-recognition-panel";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("member points recognition panel", () => {
  it("renders the mobile points route with the full leaderboard, recent approvals, and explainer sections visible in the Figma prototype", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member points recognition.");
    const recognition = getMemberRecognitionSummary(actor, data);
    const html = renderToStaticMarkup(
      createElement(MemberPointsRecognitionPanel, { recognition }),
    );

    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Points &amp; Recognition");
    expect(html).toContain("Points come from meaningful action.");
    expect(html).toContain("Total Points");
    expect(html).toContain("Points by Campaign");
    expect(html).toContain("Rush Month");
    expect(html).toContain("Spring Showcase (prev.)");
    expect(html).toContain("Badges Earned");
    expect(html).toContain("Rush Starter");
    expect(html).toContain("Complete first Rush Month action");
    expect(html).toContain("Top 3 on leaderboard for 2 weeks");
    expect(html).toContain("Chapter Leaderboard — Rush Month");
    expect(html).toContain("Recent Approved Actions");
    expect(html).toContain("How points work");
    expect(html).toContain("See how to earn more points");
    expect(html).toContain("/rush-month/actions/member-push?source=points");
    expect(html).toContain("/rush-month/leaderboard?campaign=rush-month#campaign-focus");
    expect(html).toContain("/rush-month/leaderboard?campaign=spring-showcase#campaign-focus");
    expect(html).toContain("Welcome one new student at tabling");
    expect(html).toContain("href=\"/rush-month/actions/welcome-table?source=points\"");
    expect(html).not.toContain("Open the chapter home and align the leader team");
    expect(html).not.toContain("Assign Rush Month outreach owners");
  });

  it("can render a same-route campaign focus state inside the points surface", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member points campaign focus.");
    const recognition = getMemberRecognitionSummary(actor, data);
    const html = renderToStaticMarkup(
      createElement(MemberPointsRecognitionPanel, {
        recognition,
        selectedCampaignId: "rush-month",
      }),
    );

    expect(html).toContain("Campaign focus");
    expect(html).toContain("Recognition on this campaign should reward the real invite");
    expect(html).toContain("See how to earn more points");
    expect(html).toContain("aria-current=\"page\"");
  });

  it("preserves a home-origin back path while staying on the points route", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member points home handoff.");
    const recognition = getMemberRecognitionSummary(actor, data);
    const html = renderToStaticMarkup(
      createElement(MemberPointsRecognitionPanel, {
        recognition,
        source: "home",
      }),
    );

    expect(html).toContain("From home");
    expect(html).toContain(
      "Home handed you into recognition as part of the weekly loop. Review progress here and still jump back without losing the member-home context.",
    );
    expect(html).toContain("Back to home");
    expect(html).toContain("/rush-month/leaderboard?campaign=rush-month&amp;source=home#campaign-focus");
    expect(html).toContain("/rush-month/leaderboard?campaign=spring-showcase&amp;source=home#campaign-focus");
    expect(html).toContain("/rush-month/actions/member-push?source=points");
    expect(html.indexOf("Points &amp; Recognition")).toBeLessThan(html.indexOf("From home"));
  });
});
