import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MemberRushMonthCampaignPanel } from "@/components/member-rush-month-campaign-panel";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberRushMonthCampaignOverview } from "@/services/member-rush-month-campaign-overview";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("member rush month campaign panel", () => {
  it("renders the mobile Rush Month campaign screen from the mockup map", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member campaign panel.");
    const overview = getMemberRushMonthCampaignOverview(actor, data);
    const html = renderToStaticMarkup(
      createElement(MemberRushMonthCampaignPanel, { overview }),
    );

    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("Rush Month");
    expect(html).toContain("Week 1 of 4");
    expect(html).toContain("Event loop");
    expect(html).toContain("Luma, RSVP, attendance, and points stay visible together.");
    expect(html).toContain("Source of truth for the event");
    expect(html).toContain("Leaderboard moves after review");
    expect(html).toContain("Current Phase");
    expect(html).toContain("Planning: Make MEDLIFE visible on campus");
    expect(html).toContain(
      "Exit signal: Members can see the campaign phase, KPI strip, and the first concrete action inside the app.",
    );
    expect(html).toContain("Why this campaign matters");
    expect(html).toContain("Campaign KPIs");
    expect(html).toContain("Assigned Actions by Role");
    expect(html).toContain("/campaigns?role=general-members#role-focus");
    expect(html).toContain("/campaigns?role=action-committee-chairs#role-focus");
    expect(html).toContain("View my actions");
    expect(html).toContain("/rush-month/actions?source=campaigns");
    expect(html).toContain("Submit evidence");
    expect(html).toContain(
      "/rush-month/actions/share-rush-flyer?step=submit&amp;source=campaigns#submit-evidence",
    );
  });

  it("can render a same-route role focus state inside the campaign surface", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member campaign role focus.");
    const overview = getMemberRushMonthCampaignOverview(actor, data);
    const html = renderToStaticMarkup(
      createElement(MemberRushMonthCampaignPanel, {
        overview,
        selectedRoleId: "general-members",
      }),
    );

    expect(html).toContain("Role focus");
    expect(html).toContain("General Members");
    expect(html).toContain(
      "Start the next assigned action and submit proof metadata after the task is clearly in progress.",
    );
    expect(html).toContain("aria-current=\"page\"");
  });

  it("preserves a profile-origin back path while keeping campaign focus on the same route", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing member campaign profile handoff.");
    const overview = getMemberRushMonthCampaignOverview(actor, data);
    const html = renderToStaticMarkup(
      createElement(MemberRushMonthCampaignPanel, {
        overview,
        source: "profile",
      }),
    );

    expect(html).toContain("From profile");
    expect(html).toContain(
      "Profile handed you into the real campaign loop. Review Rush Month here, then hop back when you are done.",
    );
    expect(html).toContain("Back to profile");
    expect(html).toContain("/campaigns?role=general-members&amp;source=profile#role-focus");
    expect(html).toContain("/campaigns?role=action-committee-chairs&amp;source=profile#role-focus");
    expect(html).toContain("/rush-month/actions?source=campaigns");
    expect(html.indexOf("Rush Month")).toBeLessThan(html.indexOf("From profile"));
  });
});
