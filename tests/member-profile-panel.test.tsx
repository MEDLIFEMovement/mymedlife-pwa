import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MemberProfilePanel } from "@/components/member-profile-panel";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { getProfileWorkspace } from "@/services/profile-workspace";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getStudentHomeWorkspace } from "@/services/student-home-workspace";

describe("member profile panel", () => {
  it("renders a mobile-first member profile surface with real route links", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member profile panel.");
    const workspace = getProfileWorkspace(actor, data);
    const studentHome = getStudentHomeWorkspace(actor, data);
    const recognition = getMemberRecognitionSummary(actor, data);

    const html = renderToStaticMarkup(
      createElement(MemberProfilePanel, {
        chapterName: studentHome.chapterName,
        displayName: actor.user.displayName,
        workspace,
        studentHome,
        recognition,
      }),
    );

    expect(html).toContain("Hi, Sofia");
    expect(html).toContain("Profile snapshot");
    expect(html).toContain("Next event");
    expect(html).toContain("Event loop");
    expect(html).toContain("Keep events and points one tap away from profile.");
    expect(html).toContain("RSVP, attendance, and points should stay in view here too.");
    expect(html).toContain("Next event");
    expect(html).toContain("RSVP");
    expect(html).toContain("Attendance");
    expect(html).toContain("Points");
    expect(html).toContain("Next step");
    expect(html).toContain("Start next action");
    expect(html).toContain("Open campaign");
    expect(html).toContain("Open leaderboard");
    expect(html).toContain("Open points and recognition");
    expect(html).toContain("<h2 class=\"mt-2 text-2xl font-semibold text-slate-950\">Recognition</h2>");
    expect(html).toContain("About you");
    expect(html).toContain("Chapter access");
    expect(html).toContain("Keep identity easy to trust.");
    expect(html).toContain("How your name appears across myMEDLIFE.");
    expect(html).toContain("Email connected to this myMEDLIFE profile.");
    expect(html).toContain(
      "Keep this surface centered on identity, role, and the next step. Recognition and points stay visible lower on the route instead of turning profile into a second dashboard, so profile can hand you back to the event-and-points loop when you are ready to move again.",
    );
    expect(html).toContain("Finish: Invite 3 friends to the Intro GBM");
    expect(html).not.toContain("Earned across visible campaigns");
    expect(html).not.toContain("Friendly chapter-only visibility");
    expect(html).not.toContain("Show up");
    expect(html).not.toContain("Check the board");
    expect(html).not.toContain("Safety boundary");
    expect(html).not.toContain("Active campaign");
    expect(html).not.toContain("This week&#x27;s priority");
    expect(html).not.toContain("local preview cookie");
    expect(html).not.toContain("Fake local account used for role review.");
    expect(html).toContain("/campaigns?source=profile");
    expect(html).toContain("/rush-month/leaderboard?source=profile");
    expect(html).toContain("/rush-month/actions/member-push?source=profile");
    expect(html.indexOf("About you")).toBeLessThan(
      html.indexOf("<h2 class=\"mt-2 text-2xl font-semibold text-slate-950\">Recognition</h2>"),
    );
    expect(html.indexOf("Chapter access")).toBeLessThan(
      html.indexOf("<h2 class=\"mt-2 text-2xl font-semibold text-slate-950\">Recognition</h2>"),
    );
  });
});
