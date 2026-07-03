import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MemberPointsRecognitionPanel } from "@/components/member-points-recognition-panel";
import { getLaunchLaneMemberPointsReadback } from "@/services/launch-lane-points-readback";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("member points recognition panel", () => {
  it("renders the mobile points route with event-loop readback, recent approvals, and explainer sections visible in the simplified launch lane", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member points recognition.");
    const recognition = getMemberRecognitionSummary(actor, data);
    const liveReadback = getLaunchLaneMemberPointsReadback(actor, data);
    const html = renderToStaticMarkup(
      createElement(MemberPointsRecognitionPanel, {
        recognition,
        chapterName: "UCLA MEDLIFE",
        liveReadback,
      }),
    );

    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Points &amp; Recognition");
    expect(html).toContain("Points come from meaningful action.");
    expect(html).toContain("Events");
    expect(html).toContain("Show up first");
    expect(html).toContain("Leaderboard");
    expect(html).toContain("Event loop");
    expect(html).toContain("Events create attendance, attendance creates points.");
    expect(html).toContain("Live pilot readback");
    expect(html).toContain("Attendance confirmed; points pending");
    expect(html).toContain("Your event points");
    expect(html).toContain("Next step in this event loop");
    expect(html).toContain("Open event detail");
    expect(html).toContain("Total Points");
    expect(html).not.toContain("Launch lane focus");
    expect(html).not.toContain("Spring Showcase (prev.)");
    expect(html).toContain("Badges Earned");
    expect(html).toContain("Event Starter");
    expect(html).toContain("Attend your first chapter event");
    expect(html).toContain("Top 3 on leaderboard for 2 weeks");
    expect(html).toContain("Chapter Leaderboard");
    expect(html).toContain("Recent points activity");
    expect(html).toContain("How points work");
    expect(html).toContain("Open events →");
    expect(html).toContain("/app/events?source=points");
    expect(html).toContain("Welcome one new student at tabling");
    expect(html).toContain("Open event loop");
    expect(html).not.toContain("Open the chapter home and align the leader team");
    expect(html).not.toContain("Assign Rush Month outreach owners");
  });

  it("ignores the old campaign selector and keeps the points surface focused on the core loop", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member points campaign focus.");
    const recognition = getMemberRecognitionSummary(actor, data);
    const liveReadback = getLaunchLaneMemberPointsReadback(actor, data);
    const html = renderToStaticMarkup(
      createElement(MemberPointsRecognitionPanel, {
        recognition,
        chapterName: "UCLA MEDLIFE",
        liveReadback,
      }),
    );

    expect(html).toContain("Event loop");
    expect(html).toContain("Events create attendance, attendance creates points.");
    expect(html).not.toContain("Launch lane focus");
    expect(html).not.toContain("Spring Showcase (prev.)");
  });

  it("preserves a home-origin back path while staying on the points route", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member points home handoff.");
    const recognition = getMemberRecognitionSummary(actor, data);
    const liveReadback = getLaunchLaneMemberPointsReadback(actor, data);
    const html = renderToStaticMarkup(
      createElement(MemberPointsRecognitionPanel, {
        recognition,
        chapterName: "UCLA MEDLIFE",
        source: "home",
        liveReadback,
      }),
    );

    expect(html).toContain("From home");
    expect(html).toContain(
      "Home handed you into recognition as part of the weekly loop. Review progress here and still jump back without losing the member-home context.",
    );
    expect(html).toContain("Back to home");
    expect(html).toContain('href="/app"');
    expect(html).toContain("/app/events?source=points");
    expect(html.indexOf("Points &amp; Recognition")).toBeLessThan(html.indexOf("From home"));
  });

  it("renders the active chapter label instead of hardcoding a single chapter name", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing dynamic chapter label on points.");
    const recognition = getMemberRecognitionSummary(actor, data);
    const liveReadback = getLaunchLaneMemberPointsReadback(actor, data);
    const html = renderToStaticMarkup(
      createElement(MemberPointsRecognitionPanel, {
        recognition,
        chapterName: "McGill MEDLIFE",
        liveReadback,
      }),
    );

    expect(html).toContain("McGill MEDLIFE");
    expect(html).not.toContain("UCLA MEDLIFE");
  });
});
