import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ChapterLeaderCommandCenterPanel } from "@/components/chapter-leader-command-center-panel";
import {
  buildChapterLeaderAssignmentFlowHref,
  buildChapterLeaderCommitteeFlowHref,
  buildChapterLeaderCommandCenterHref,
  buildChapterLeaderEventFlowHref,
  getChapterLeaderCommandCenter,
} from "@/services/chapter-leader-command-center";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing chapter leader command center.");

describe("chapter leader command center", () => {
  it("keeps action committee chairs inside the leader-owned chapter surface", () => {
    const actor = getMockLocalActorContext("committee.chair@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);

    expect(commandCenter.canReadCommandCenter).toBe(true);
    expect(commandCenter.selectedView).toBe("overview");
  });

  it("gives President / VP a Boston College sample leadership surface", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);

    expect(commandCenter.canReadCommandCenter).toBe(true);
    expect(commandCenter.chapterName).toBe("Boston College MEDLIFE");
    expect(commandCenter.sampleLabel).toBe("Boston College sample surface");
    expect(commandCenter.selectedView).toBe("overview");
    expect(commandCenter.healthTone).toBe("yellow");
    expect(commandCenter.quickActions.map((action) => action.label)).toEqual([
      "Create Event",
      "Confirm Attendance",
      "Review Members",
      "Review Leaderboard",
    ]);
    expect(commandCenter.quickActions.find((action) => action.label === "Create Event")?.href).toBe(
      "/leader?view=events&source=overview&quickAction=create_event",
    );
    expect(commandCenter.quickActions.find((action) => action.label === "Confirm Attendance")?.href).toBe(
      "/leader?view=events&source=overview&quickAction=assign_action",
    );
    expect(commandCenter.quickActions.find((action) => action.label === "Review Members")?.href).toBe(
      "/leader?view=members&quickAction=review_members",
    );
    expect(commandCenter.quickActions.find((action) => action.label === "Review Leaderboard")?.href).toBe(
      "/leader?view=leaderboard&source=overview&leaderboardMetric=attendance",
    );
    expect(commandCenter.activeCampaignLabel).toBe("Moving Mountains 🏔");
    expect(commandCenter.navGroups.map((group) => group.label)).toEqual([
      "Chapter",
      "Members",
      "Operations",
      "Impact & Culture",
      "Leadership",
    ]);
    expect(commandCenter.chapterPointsTrend).toHaveLength(10);
    expect(commandCenter.chapterPointsTrend[0]).toMatchObject({
      label: "Apr W1",
      value: 920,
    });
    expect(commandCenter.committeesOverview).toMatchObject({
      activeCommitteesLabel: "5 / 7",
      totalOpenActionsLabel: "29",
      committeesWithoutChairsLabel: "2",
    });
    expect(commandCenter.selectedMember?.displayName).toBe("Zara Events");
    expect(commandCenter.weeklyPriority?.title).toBe(
      "Create the next Luma event, confirm attendance, and make sure points move the leaderboard.",
    );
    expect(commandCenter.leadershipRoles.map((role) => role.label)).toEqual([
      "President / VP",
      "Recruitment lead",
      "Social lead",
      "Med Talk lead",
      "Local volunteering lead",
    ]);
    expect(commandCenter.riskAlerts[0]).toEqual(
      expect.objectContaining({
        severity: "high",
        title: "Next event needs an owner before RSVP momentum drops",
        href: "/leader?view=events&source=overview&eventCommittee=recruitment",
      }),
    );
    expect(commandCenter.riskAlerts[1]).toEqual(
      expect.objectContaining({
        title: "RSVP conversion needs attention before the next event",
        href: "/leader?view=events&source=overview&eventCommittee=recruitment",
      }),
    );
    expect(commandCenter.riskAlerts[2]).toEqual(
      expect.objectContaining({
        title: "Attendance confirmation is blocking points",
        href: "/leader?view=events&source=overview",
      }),
    );
    expect(commandCenter.riskAlerts[3]).toEqual(
      expect.objectContaining({
        title: "Leaderboard movement is waiting on event follow-up",
        href: "/leader?view=events&source=overview&eventCommittee=recruitment&event=bc-event-quad-tabling",
      }),
    );
  });

  it("renders the overview hero with the chapter-home framing from the mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.metrics.find((metric) => metric.label === "Luma RSVPs")).toMatchObject({
      value: "823",
      note: "Across visible events",
    });
    expect(commandCenter.metrics.find((metric) => metric.label === "Points This Week")).toMatchObject({
      value: "1,480",
      note: "+11% vs last week",
    });

    expect(markup).toContain("Chapter Home");
    expect(markup).toContain("Leadership Center");
    expect(markup).toContain("Chapter Dashboard · Jun 2025");
    expect(markup).toContain("TEST Sofia Reyes, President · New England Region");
    expect(markup).toContain("3rd in New England · top 15% globally");
    expect(markup).toContain("Create Event");
    expect(markup).toContain("Confirm Attendance");
    expect(markup).toContain("Open Event Committees");
    expect(markup).toContain("Open Leaderboard");
    expect(markup).toContain("Members");
    expect(markup).toContain("Operations");
    expect(markup).toContain("Impact &amp; Culture");
    expect(markup).toContain("Leadership");
    expect(markup).toContain("Feed Analytics");
    expect(markup).toContain("Current Leaders");
    expect(markup).toContain("Values");
    expect(markup).toContain("Leadership Training");
    expect(markup).toContain("Chapter Metrics — June 2025");
    expect(markup).toContain("E-Board roles");
    expect(markup).toContain("Health Score");
    expect(markup).toContain("Active Members");
    expect(markup).toContain("Events Created");
    expect(markup).toContain("Luma RSVPs");
    expect(markup).toContain("Attendance Rate");
    expect(markup).toContain("Points This Week");
    expect(markup).toContain("Chapter Rank");
    expect(markup).toContain("Org Rank");
    expect(markup).toContain("This Week&#x27;s Priority");
    expect(markup).toContain(
      "Create the next Luma event, confirm attendance, and make sure points move the leaderboard.",
    );
    expect(markup).toContain("Event + points pulse");
    expect(markup).toContain("Luma, RSVP, attendance, and points are the chapter story.");
    expect(markup).toContain("Quick Actions");
    expect(markup).toContain("Risk Alerts");
    expect(markup).toContain("Next event needs an owner before RSVP momentum drops");
    expect(markup).toContain("RSVP conversion needs attention before the next event");
    expect(markup).toContain("Attendance confirmation is blocking points");
    expect(markup).toContain("Leaderboard movement is waiting on event follow-up");
    expect(markup).toContain("Weekly Points Trend");
    expect(markup).toContain("Role coverage");
    expect(markup).toContain("4 active");
    expect(markup).not.toContain("Review mode");
    expect(markup).not.toContain("Member follow-up queue");
    expect(markup).not.toContain("Who needs a human touch right now?");
    expect(markup).not.toContain("Member detail");
    expect(markup).not.toContain("Committee operations");
    expect(markup).not.toContain("Event momentum");
    expect(markup).not.toContain("Impact signals");
    expect(markup).not.toContain("Leadership pipeline");
    expect(markup).not.toContain("Bridge stories");
    expect(markup.match(/>Create Event</g)?.length).toBe(3);
    expect(markup.match(/>Confirm Attendance</g)?.length).toBe(2);
    expect(markup.indexOf("Create Event")).toBeLessThan(markup.indexOf("Chapter Metrics"));
    expect(markup.indexOf("Confirm Attendance")).toBeLessThan(markup.indexOf("Chapter Metrics"));
    expect(markup.indexOf("Chapter Metrics")).toBeLessThan(markup.indexOf("Risk Alerts"));
    expect(markup.indexOf("Active Members")).toBeGreaterThan(markup.indexOf("Chapter Metrics"));
    expect(markup.indexOf("Risk Alerts")).toBeLessThan(markup.indexOf("This Week&#x27;s Priority"));
    expect(markup.indexOf("This Week&#x27;s Priority")).toBeLessThan(markup.indexOf("Quick Actions"));
    expect(markup.indexOf("Quick Actions")).toBeLessThan(markup.lastIndexOf("Confirm Attendance"));
    expect(markup.indexOf("Quick Actions")).toBeLessThan(markup.lastIndexOf("Create Event"));
    expect(markup.indexOf("Quick Actions")).toBeLessThan(markup.lastIndexOf("Open Event Committees"));
    expect(markup.indexOf("Quick Actions")).toBeLessThan(markup.lastIndexOf("Open Leaderboard"));
    expect(markup.indexOf("Risk Alerts")).toBeLessThan(markup.indexOf("Weekly Points Trend"));
    expect(markup.indexOf("Chapter Metrics")).toBeLessThan(markup.indexOf("Org Rank"));
    expect(markup.indexOf("Org Rank")).toBeLessThan(markup.indexOf("Risk Alerts"));
    expect(markup.indexOf("Quick Actions")).toBeLessThan(markup.indexOf("Weekly Points Trend"));
    expect(markup.indexOf("Weekly Points Trend")).toBeLessThan(markup.indexOf("Role coverage"));
    expect(markup).not.toContain(`Chapter health score ${commandCenter.healthScore} out of 100`);
    expect(markup).not.toContain("Chapter Pulse");
    expect(markup).not.toContain("Impact Snapshot");
    expect(markup.match(/>Current Leaders</g)?.length).toBe(1);
    expect(markup.match(/>Values</g)?.length).toBe(1);
    expect(markup.match(/>Leadership Training</g)?.length).toBe(1);
  });

  it("keeps chapter-home attendance follow-through inside the leader events shell before broader review", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "overview",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
      eventCommittee: "events",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(
      'href="/leader?view=events&amp;source=overview&amp;member=member-ivy&amp;eventCommittee=events&amp;pipeline=follow_up&amp;q=Ivy&amp;quickAction=assign_action"',
    );
    expect(markup).not.toContain("/rush-month/actions?source=chapter_assign_action");
  });

  it("keeps chapter-home source context visible through event-loop routes", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "events",
      source: "overview",
      memberId: "member-ivy",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
      quickAction: "assign_action",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedSource).toBe("overview");
    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Chapter home handoff",
      title: "Opened from the chapter command center",
      actions: [
        {
          label: "Back to chapter home",
          href: "/leader?view=overview&source=overview&member=member-ivy",
        },
      ],
    });
    expect(markup).toContain("Chapter home handoff");
    expect(markup).toContain("Opened from the chapter command center");
    expect(markup).toContain("Back to chapter home");
  });

  it("keeps chapter-home committee follow-through inside the same leader event loop", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "committees",
      source: "overview",
      memberId: "member-ivy",
      committeeId: "committee-events",
      pipeline: "follow_up",
      search: "Ivy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedSource).toBe("overview");
    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Chapter home handoff",
      title: "Opened from the chapter command center",
      actions: [
        {
          label: "Back to chapter home",
          href: "/leader?view=overview&source=overview&member=member-ivy",
        },
      ],
    });
    expect(markup).toContain("Chapter home handoff");
    expect(markup).toContain("Opened from the chapter command center");
    expect(markup).toContain("Back to chapter home");
  });

  it("keeps chapter-home leaderboard follow-through anchored to the event loop", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "leaderboard",
      source: "overview",
      memberId: "member-ivy",
      eventCommittee: "events",
      leaderboardMetric: "attendance",
      pipeline: "follow_up",
      search: "Ivy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedSource).toBe("overview");
    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Chapter home handoff",
      title: "Opened from the chapter command center",
      actions: [
        {
          label: "Back to chapter home",
          href: "/leader?view=overview&source=overview&member=member-ivy",
        },
      ],
    });
    expect(markup).toContain("Chapter home handoff");
    expect(markup).toContain("Opened from the chapter command center");
    expect(markup).toContain("Back to chapter home");
  });
  it("falls back to zeroed progress bars and chapter-posture copy when overview labels are not sample-formatted", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);
    const fallbackCommandCenter = {
      ...commandCenter,
      sampleLabel: null,
      successionOverview: {
        ...commandCenter.successionOverview,
        eboardRolesFilledLabel: "not started",
        activeCommitteesLabel: "4 / 0",
      },
    };
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter: fallbackCommandCenter }),
    );

    expect(markup).toContain("Watch closely chapter posture");
    expect(markup.match(/style=\"width:0%\"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps existing TEST prefixes visible without doubling them in the overview shell", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);
    const prefixedCommandCenter = {
      ...commandCenter,
      sidebarLeaderLabel: "TEST Sofia Reyes, President · New England Region",
      chapterName: "TEST Boston College MEDLIFE",
    };
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter: prefixedCommandCenter }),
    );

    expect(markup).toContain("TEST Sofia Reyes, President · New England Region");
    expect(markup).toContain("TEST Boston College MEDLIFE");
    expect(markup).not.toContain("TEST TEST Sofia Reyes");
    expect(markup).not.toContain("TEST TEST Boston College MEDLIFE");
  });

  it("keeps the service-backed leader menu visible for supabase-backed route state too", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const supabaseData = {
      ...data,
      source: {
        mode: "supabase" as const,
        status: "supabase_ready" as const,
        message: "Testing supabase-backed chapter leader command center.",
      },
    };
    const commandCenter = getChapterLeaderCommandCenter(actor, supabaseData, {
      view: "members",
      memberId: "member-maya",
    });

    expect(commandCenter.navGroups.map((group) => group.label)).toEqual([
      "Chapter",
      "Members",
      "Operations",
      "Impact & Culture",
      "Leadership",
    ]);
    expect(commandCenter.viewOptions.find((item) => item.key === "member_profile")?.href).toBe(
      "/leader?view=member_profile&member=member-maya",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "leaders")?.href).toBe(
      "/leader?view=leaders&member=member-maya",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "values")?.href).toBe(
      "/leader?view=values&member=member-maya",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "training")?.href).toBe(
      "/leader?view=training&member=member-maya",
    );
    expect(commandCenter.selectedMember?.displayName).toBe("Sofia Alvarez");
  });

  it("keeps leadership review views readable even when no member is currently selected", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const leadersCommandCenter = {
      ...getChapterLeaderCommandCenter(actor, data, { view: "leaders" }),
      selectedMember: null,
      navigationMemberId: null,
    };
    const valuesCommandCenter = {
      ...getChapterLeaderCommandCenter(actor, data, { view: "values" }),
      selectedMember: null,
      navigationMemberId: null,
    };

    const leadersMarkup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter: leadersCommandCenter }),
    );
    const valuesMarkup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter: valuesCommandCenter }),
    );

    expect(leadersMarkup).toContain("Current Leaders");
    expect(leadersMarkup).not.toContain("Leader in focus");
    expect(leadersMarkup).toContain("Preview Values Review");

    expect(valuesMarkup).toContain("MEDLIFE Values");
    expect(valuesMarkup).not.toContain("Values review in focus");
    expect(valuesMarkup).toContain("Values follow-through stays human-reviewed");
  });

  it("keeps Review Members wired from the overview hero into the member-pipeline quick-action state", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("href=\"/leader?view=members&amp;quickAction=review_members\"");
    expect(markup).toContain(">Review Members<");
  });

  it("keeps the desktop rail compact so navigation stays in the operating frame", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("Active Campaign");
    expect(markup).toContain("TEST Sofia Reyes");
    expect(markup).toContain("President");
    expect(markup).not.toContain("Navigation");
    expect(markup).not.toContain("Views");
    expect(markup).not.toContain(">Chapter Lead<");
    expect(markup.indexOf("Active Campaign")).toBeLessThan(markup.indexOf("Chapter Home"));
    expect(markup.indexOf("Feed Analytics")).toBeLessThan(markup.indexOf("TEST Sofia Reyes"));
    expect(markup).not.toContain("3 shortcuts");
    expect(markup).not.toContain("4 active alerts");
    expect(markup).not.toContain("Quick tools");
    expect(markup).not.toContain("Watch closely");
    expect(markup).not.toContain("Above the fold");
    expect(markup).not.toContain("Boston College sample surface");
    expect(markup).not.toContain(commandCenter.summary);
  });

  it("keeps the weekly-priority section compact instead of adding extra explainer callouts", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("This Week&#x27;s Priority");
    expect(markup).not.toContain("Why this week matters");
    expect(markup).not.toContain("Review posture");
  });

  it("falls back to a safe default view and selected member when search params are invalid", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "not-a-real-view",
      memberId: "missing-member",
    });

    expect(commandCenter.selectedView).toBe("overview");
    expect(commandCenter.selectedMember?.id).toBe("member-zara");
    expect(commandCenter.viewOptions.find((item) => item.key === "events")?.href).toBe(
      "/leader?view=events",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "leaderboard")?.href).toBe(
      "/leader?view=leaderboard",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "member_profile")?.href).toBe(
      "/leader?view=member_profile",
    );
  });

  it("keeps E-Board focused on owner movement and lets the selected member carry across views", () => {
    const actor = getMockLocalActorContext("eboard.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "members",
      memberId: "member-ivy",
    });

    expect(commandCenter.selectedView).toBe("members");
    expect(commandCenter.weeklyPriority?.title).toContain("Move owners and event prep");
    expect(commandCenter.weeklyPriority?.primaryHref).toBe("/leader?view=events");
    expect(commandCenter.selectedMember?.displayName).toBe("Ivy Invite");
    expect(commandCenter.quickActions.find((action) => action.label === "Review Members")?.href).toBe(
      "/leader?view=members&member=member-ivy&quickAction=review_members",
    );
    expect(commandCenter.quickActions.find((action) => action.label === "Create Event")?.href).toBe(
      "/leader?view=events&source=overview&member=member-ivy&quickAction=create_event",
    );
    expect(commandCenter.quickActions.find((action) => action.label === "Confirm Attendance")?.href).toBe(
      "/leader?view=events&source=overview&member=member-ivy&quickAction=assign_action",
    );
    expect(commandCenter.quickActions.find((action) => action.label === "Review Leaderboard")?.href).toBe(
      "/leader?view=leaderboard&source=overview&member=member-ivy&leaderboardMetric=attendance",
    );
    expect(commandCenter.pipelineItems.map((item) => item.displayName)).toEqual(
      expect.arrayContaining(["Avery New", "Sam Service", "Ivy Invite", "Zara Events"]),
    );
  });

  it("filters the member pipeline through URL state and keeps drill-in links scoped to that filter", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "members",
      pipeline: "follow_up",
      search: "Ivy",
    });

    expect(commandCenter.selectedView).toBe("members");
    expect(commandCenter.selectedPipelineFilter).toBe("follow_up");
    expect(commandCenter.pipelineSearchQuery).toBe("Ivy");
    expect(commandCenter.pipelineRows.map((row) => row.displayName)).toEqual(["Ivy Invite"]);
    expect(commandCenter.selectedMember?.displayName).toBe("Ivy Invite");
    expect(commandCenter.pipelineRows[0]?.href).toBe(
      "/leader?view=members&member=member-ivy&pipeline=follow_up&q=Ivy",
    );
    expect(commandCenter.pipelineRows[0]?.profileHref).toBe(
      "/leader?view=member_profile&member=member-ivy&pipeline=follow_up&q=Ivy",
    );
    expect(commandCenter.quickActions.find((action) => action.label === "Review Members")?.href).toBe(
      "/leader?view=members&member=member-ivy&pipeline=follow_up&q=Ivy&quickAction=review_members",
    );
    expect(commandCenter.quickActions.find((action) => action.label === "Confirm Attendance")?.href).toBe(
      "/leader?view=events&source=overview&member=member-ivy&quickAction=assign_action",
    );
    expect(commandCenter.quickActions.find((action) => action.label === "Review Leaderboard")?.href).toBe(
      "/leader?view=leaderboard&source=overview&member=member-ivy&leaderboardMetric=attendance",
    );
    expect(commandCenter.pipelineFilterOptions.map((option) => option.label)).toEqual([
      "All Pipeline Levels",
      "E-Board",
      "Chair",
      "Chair candidate",
      "Active contributor",
      "General member",
      "Needs Follow-Up",
    ]);
  });

  it("renders the members route as a dedicated pipeline table instead of a split detail workbench", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "members",
      memberId: "member-ivy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("Member Leaderboard");
    expect(markup).toContain(">Export<");
    expect(markup).toContain(">Add Member<");
    expect(markup).toContain("Search members…");
    expect(markup).toContain("All Pipeline Levels");
    expect(markup).toContain("E-Board");
    expect(markup).toContain("Chair");
    expect(markup).toContain("<h1");
    expect(markup).toContain('aria-label="Pipeline filter"');
    expect(markup).toContain("<select");
    expect(markup).toContain(`${commandCenter.pipelineRows.length} of ${commandCenter.pipelineTotalCount} members`);
    expect(markup).toContain('href="/leader?view=members&amp;member=member-ivy&amp;quickAction=export_members"');
    expect(markup).toContain('href="/leader?view=members&amp;member=member-ivy&amp;quickAction=add_member"');
    expect(markup).not.toContain('href="/leader?view=members&amp;member=member-zara&amp;quickAction=export_members"');
    expect(markup).not.toContain('href="/leader?view=members&amp;member=member-zara&amp;quickAction=add_member"');
    expect(markup).toContain("12 of 12 members");
    expect(markup).toContain("Sofia Reyes");
    expect(markup).toContain("Marcus Chen");
    expect(markup).toContain("VP of Events · Today");
    expect(markup).toContain("Chair candidate");
    expect(markup).toContain("$1,200");
    expect(markup).toContain('href="/leader?view=member_profile&amp;member=member-nina"');
    expect(markup).toContain('href="/leader?view=member_profile&amp;member=member-ivy"');
    expect(markup).not.toContain('href="/leader?view=members&amp;member=member-nina"');
    expect(markup).not.toContain("Member detail");
    expect(markup).not.toContain("Pending joins");
    expect(markup).not.toContain("Select a member from the pipeline table");
    expect(markup).not.toContain("Apply search");
    expect(markup).not.toContain("Ready Now");
    expect(markup).not.toContain("Emerging Leaders");
    expect(markup).not.toContain("Contributors");
  });

  it("keeps the plain member-pipeline route generic until a leader selects a person", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "members",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain('href="/leader?view=members&amp;quickAction=export_members"');
    expect(markup).toContain('href="/leader?view=members&amp;quickAction=add_member"');
    expect(markup).not.toContain('href="/leader?view=members&amp;member=member-zara&amp;quickAction=export_members"');
    expect(markup).not.toContain('href="/leader?view=members&amp;member=member-zara&amp;quickAction=add_member"');
    expect(markup).toContain('href="/leader?view=member_profile&amp;member=member-zara"');
    expect(markup).not.toContain('href="/leader?view=members&amp;member=member-zara">Zara Events<');
    expect(markup).toContain("General member");
    expect(markup).not.toContain("Needs Follow-Up");
  });

  it("treats the member-pipeline export and intake buttons as chapter-owned quick-action states", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "members",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(
      "/leader?view=members&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy&amp;quickAction=export_members",
    );
    expect(markup).toContain(
      "/leader?view=members&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy&amp;quickAction=add_member",
    );
  });

  it("opens assign action as a chapter-owned state before the broader action lane", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "events",
      memberId: "member-ivy",
      eventCommittee: "events",
      quickAction: "assign_action",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("assign_action");
    expect(markup).toContain("Confirm Attendance");
    expect(markup).toContain("Start from RSVPs, then review who attended and what is ready for points.");
    expect(markup).toContain("Open attendance review");
    expect(markup).toContain(
      "href=\"/rush-month/actions?source=chapter_assign_action&amp;returnTo=%2Fleader%3Fview%3Devents%26member%3Dmember-ivy%26eventCommittee%3Devents%26quickAction%3Dassign_action&amp;member=member-ivy\"",
    );
  });

  it("keeps the selected event attached when attendance review starts from event detail", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "events",
      memberId: "member-ivy",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
      quickAction: "assign_action",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("assign_action");
    expect(commandCenter.selectedEventId).toBe("bc-event-moving-mountains-kickoff");
    expect(markup).toContain(
      "Return to Moving Mountains Kickoff after the broader attendance review so this TEST event stays in view.",
    );
    expect(markup).toContain(
      "href=\"/rush-month/actions?source=chapter_assign_action&amp;returnTo=%2Fleader%3Fview%3Devents%26member%3Dmember-ivy%26eventCommittee%3Devents%26event%3Dbc-event-moving-mountains-kickoff%26quickAction%3Dassign_action&amp;member=member-ivy\"",
    );
    expect(markup).toContain(
      "href=\"/leader?view=leaderboard&amp;source=events&amp;member=member-ivy&amp;eventCommittee=events&amp;event=bc-event-moving-mountains-kickoff&amp;leaderboardMetric=attendance\"",
    );
  });

  it("keeps the events-to-leaderboard loop inside the leader shell", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "leaderboard",
      source: "events",
      memberId: "member-ivy",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
      leaderboardMetric: "attendance",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedSource).toBe("events");
    expect(commandCenter.selectedView).toBe("leaderboard");
    expect(markup).toContain("Event review handoff");
    expect(markup).toContain("Opened from event review into leaderboard follow-through");
    expect(markup).toContain("Back to event performance");
    expect(markup).toContain("Confirm attendance");
    expect(markup).toContain(
      "href=\"/leader?view=events&amp;source=events&amp;member=member-ivy&amp;eventCommittee=events&amp;event=bc-event-moving-mountains-kickoff\"",
    );
    expect(markup).toContain(
      "href=\"/leader?view=events&amp;source=events&amp;member=member-ivy&amp;eventCommittee=events&amp;event=bc-event-moving-mountains-kickoff&amp;quickAction=assign_action\"",
    );
  });

  it("keeps leaderboard comparison context attached when attendance review starts from event follow-through", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "events",
      source: "leaderboard",
      memberId: "member-ivy",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
      leaderboardMetric: "attendance",
      leaderboardRegion: "canada",
      bestPracticeChapterId: "leaderboard-mcgill",
      quickAction: "assign_action",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(
      "href=\"/rush-month/actions?source=chapter_assign_action&amp;returnTo=%2Fleader%3Fview%3Devents%26source%3Dleaderboard%26member%3Dmember-ivy%26eventCommittee%3Devents%26event%3Dbc-event-moving-mountains-kickoff%26leaderboardMetric%3Dattendance%26region%3Dcanada%26benchmark%3Dleaderboard-mcgill%26quickAction%3Dassign_action&amp;member=member-ivy\"",
    );
    expect(markup).toContain(
      "href=\"/leader?view=leaderboard&amp;source=leaderboard&amp;member=member-ivy&amp;eventCommittee=events&amp;event=bc-event-moving-mountains-kickoff&amp;leaderboardMetric=attendance&amp;region=canada&amp;benchmark=leaderboard-mcgill\"",
    );
  });

  it("keeps leaderboard comparison context attached to event-review actions after a leaderboard handoff", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "events",
      source: "leaderboard",
      memberId: "member-ivy",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
      leaderboardMetric: "attendance",
      leaderboardRegion: "canada",
      bestPracticeChapterId: "leaderboard-mcgill",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(
      "href=\"/leader?view=events&amp;source=leaderboard&amp;member=member-ivy&amp;eventCommittee=events&amp;event=bc-event-moving-mountains-kickoff&amp;leaderboardMetric=attendance&amp;region=canada&amp;benchmark=leaderboard-mcgill&amp;quickAction=assign_action\"",
    );
    expect(markup).toContain(
      "href=\"/leader?view=leaderboard&amp;source=leaderboard&amp;member=member-ivy&amp;eventCommittee=events&amp;event=bc-event-moving-mountains-kickoff&amp;leaderboardMetric=attendance&amp;region=canada&amp;benchmark=leaderboard-mcgill\"",
    );
  });
  it("keeps the event-review loop attached when a member profile is opened from event follow-through", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      source: "events",
      memberId: "member-ivy",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedMember?.backToContextLabel).toBe("Back to Event Performance");
    expect(commandCenter.selectedMember?.backToContextHref).toBe(
      "/leader?view=events&source=events&member=member-ivy&eventCommittee=events&event=bc-event-moving-mountains-kickoff",
    );
    expect(commandCenter.selectedMember?.reviewContext).toMatchObject({
      eyebrow: "Event review follow-through",
      actionLabel: "Back to event performance",
      actionHref:
        "/leader?view=events&source=events&member=member-ivy&eventCommittee=events&event=bc-event-moving-mountains-kickoff",
    });
    expect(commandCenter.selectedMember?.leadershipActions[0]?.href).toBe(
      "/leader?view=member_profile&source=events&member=member-ivy&eventCommittee=events&event=bc-event-moving-mountains-kickoff&quickAction=promote_to_chair",
    );
    expect(markup).toContain("Back to Event Performance");
    expect(markup).toContain("Attendance review context is active");
    expect(markup).toContain(
      "href=\"/leader?view=events&amp;source=events&amp;member=member-ivy&amp;eventCommittee=events&amp;event=bc-event-moving-mountains-kickoff\"",
    );
  });

  it("keeps leaderboard readback attached when a member profile is opened from the leaderboard", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      source: "leaderboard",
      memberId: "member-ivy",
      leaderboardMetric: "attendance",
      leaderboardRegion: "canada",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedMember?.backToContextLabel).toBe("Back to Leaderboard");
    expect(commandCenter.selectedMember?.backToContextHref).toBe(
      "/leader?view=leaderboard&source=leaderboard&member=member-ivy&leaderboardMetric=attendance&region=canada",
    );
    expect(commandCenter.selectedMember?.reviewContext).toMatchObject({
      eyebrow: "Leaderboard follow-through",
      actionLabel: "Back to leaderboard",
      actionHref:
        "/leader?view=leaderboard&source=leaderboard&member=member-ivy&leaderboardMetric=attendance&region=canada",
    });
    expect(commandCenter.selectedMember?.leadershipActions[0]?.href).toBe(
      "/leader?view=member_profile&source=leaderboard&member=member-ivy&leaderboardMetric=attendance&region=canada&quickAction=promote_to_chair",
    );
    expect(markup).toContain("Back to Leaderboard");
    expect(markup).toContain("Points readback context is active");
    expect(markup).toContain(
      "href=\"/leader?view=leaderboard&amp;source=leaderboard&amp;member=member-ivy&amp;leaderboardMetric=attendance&amp;region=canada\"",
    );
  });

  it("keeps event-owned leaderboard review tied to the selected member profile", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "leaderboard",
      source: "events",
      memberId: "member-ivy",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
      leaderboardMetric: "attendance",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedMember?.profileHref).toBe(
      "/leader?view=member_profile&source=events&member=member-ivy&eventCommittee=events&event=bc-event-moving-mountains-kickoff&leaderboardMetric=attendance",
    );
    expect(markup).toContain("Leaderboard review in focus");
    expect(markup).toContain(
      "href=\"/leader?view=member_profile&amp;source=events&amp;member=member-ivy&amp;eventCommittee=events&amp;event=bc-event-moving-mountains-kickoff&amp;leaderboardMetric=attendance\"",
    );
  });

  it("keeps leaderboard event follow-through readable when no member is selected", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = {
      ...getChapterLeaderCommandCenter(actor, data, {
        view: "leaderboard",
        source: "events",
        eventCommittee: "events",
        eventId: "bc-event-moving-mountains-kickoff",
        leaderboardMetric: "attendance",
      }),
      selectedMember: null,
      navigationMemberId: null,
    };
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("Opened from event review into leaderboard follow-through");
    expect(markup).toContain("Back to event performance");
    expect(markup).not.toContain("Leaderboard review in focus");
    expect(markup).not.toContain("through attendance-backed points");
  });
  it("opens review members as a chapter-owned member-pipeline state before the person-level review", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "members",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
      quickAction: "review_members",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("review_members");
    expect(markup).toContain("Review Members");
    expect(markup).toContain("Start from the member pipeline, then open the right member review.");
    expect(markup).toContain("Open member review");
    expect(markup).toContain(
      "href=\"/leader?view=member_profile&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy\"",
    );
  });

  it("opens export members as a chapter-owned member-pipeline state before the broader membership lane", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "members",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
      quickAction: "export_members",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("export_members");
    expect(markup).toContain("Export Members");
    expect(markup).toContain("Start from the member pipeline and keep the roster context visible.");
    expect(markup).toContain("Open member pipeline");
    expect(markup).toContain("href=\"/leader?view=members\"");
  });

  it("opens add member as a chapter-owned member-pipeline state before the broader membership lane", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "members",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
      quickAction: "add_member",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("add_member");
    expect(markup).toContain("Add Member");
    expect(markup).toContain("Start from the member pipeline and keep join pressure visible.");
    expect(markup).toContain("Open member pipeline");
    expect(markup).toContain("href=\"/leader?view=members\"");
  });

  it("builds a route-driven member profile workbench with leadership actions and timeline context", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
    });

    expect(commandCenter.selectedView).toBe("member_profile");
    expect(commandCenter.selectedMember?.displayName).toBe("Ivy Invite");
    expect(commandCenter.selectedMember?.backToPipelineHref).toBe(
      "/leader?view=members&member=member-ivy&pipeline=follow_up&q=Ivy",
    );
    expect(commandCenter.selectedMember?.badgeLabel).toBe(
      "Needs follow-up before promotion",
    );
    expect(commandCenter.selectedMember?.leadershipActions[0]?.href).toBe(
      "/leader?view=member_profile&member=member-ivy&pipeline=follow_up&q=Ivy&quickAction=promote_to_chair",
    );
    expect(commandCenter.selectedMember?.leadershipActions[1]?.href).toBe(
      "/leader?view=member_profile&member=member-ivy&pipeline=follow_up&q=Ivy&quickAction=schedule_values_interview",
    );
    expect(commandCenter.selectedMember?.leadershipActions[1]).toMatchObject({
      label: "Schedule Values Interview",
      tone: "primary",
    });
    expect(commandCenter.selectedMember?.leadershipActions[2]?.href).toBe(
      "/leader?view=member_profile&member=member-ivy&pipeline=follow_up&q=Ivy&quickAction=assign_leadership_action",
    );
    expect(commandCenter.selectedMember?.leadershipActions[3]?.href).toBe(
      "/leader?view=member_profile&member=member-ivy&pipeline=follow_up&q=Ivy&quickAction=nominate_for_eboard",
    );
    expect(commandCenter.selectedMember?.leadershipActions[4]?.href).toBe(
      "/leader?view=member_profile&member=member-ivy&pipeline=follow_up&q=Ivy&quickAction=add_leader_note",
    );
    expect(commandCenter.selectedMember?.reviewContext).toMatchObject({
      eyebrow: "Follow-up review",
      title: "Re-engagement context is active",
      actionLabel: "Open follow-up queue",
      actionHref: "/leader?view=members&member=member-ivy&pipeline=follow_up&q=Ivy",
    });
    expect(commandCenter.selectedMember?.valuesAlignment[1]?.label).toBe(
      "Needs consistency proof",
    );
    expect(commandCenter.selectedMember?.activityTimeline[0]?.dateLabel).toBe("Jun 13");
    expect(commandCenter.selectedMember?.leaderNotes[0]?.authorLabel).toBe(
      "Sofia Reyes (President)",
    );
  });

  it("renders the follow-up member profile as a distinct re-engagement review state", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("Follow-up review");
    expect(markup).toContain("Re-engagement context is active");
    expect(markup).toContain("Open follow-up queue");
    expect(markup).toContain("Leadership Actions");
    expect(markup).toContain("Points History — Weekly");
    expect(markup).toContain("Member loop");
    expect(markup).toContain("Events, points, and follow-through stay in one story.");
    expect(markup).toContain("Open event context");
    expect(markup).toContain("Jump to points history");
    expect(markup).toContain("Values Alignment");
    expect(markup).toContain("Activity Timeline");
    expect(markup).toContain("Coach &amp; Leader Notes");
    expect(markup).toContain("Promote to Chair");
    expect(markup).toContain("Schedule Values Interview");
    expect(markup).toContain("Open Event Context");
    expect(markup).toContain("Nominate for E-Board");
    expect(markup).toContain("Add Note");
    expect(markup.match(/Add Note/g)?.length).toBe(1);
    expect(markup).toContain("Leadership Actions");
    expect(markup.match(/Leadership Actions/g)?.length).toBe(1);
    expect(markup.indexOf("Leadership Actions")).toBeLessThan(markup.indexOf("Points History"));
    expect(markup.indexOf("Leadership Actions")).toBeLessThan(markup.indexOf("Add Note"));
    expect(markup.indexOf("Add Note")).toBeLessThan(markup.indexOf("Coach &amp; Leader Notes"));
    expect(markup.indexOf("Member loop")).toBeLessThan(markup.indexOf("Points History"));
    expect(markup).toContain(
      buildChapterLeaderEventFlowHref({
        memberId: "member-ivy",
        pipelineFilter: "follow_up",
        searchQuery: "Ivy",
        quickAction: "review_members",
      }).replace(/&/g, "&amp;"),
    );
    expect(markup).toContain("/leader?view=members&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy");
    expect(markup).toContain("#member-points-history");
  });

  it("keeps the selected event loop when member review reopens event context", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      source: "events",
      memberId: "member-ivy",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
      leaderboardMetric: "attendance",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedMember?.profileHref).toBe(
      "/leader?view=member_profile&source=events&member=member-ivy&eventCommittee=events&event=bc-event-moving-mountains-kickoff&leaderboardMetric=attendance",
    );
    expect(markup).toContain(
      buildChapterLeaderEventFlowHref({
        source: "events",
        memberId: "member-ivy",
        eventCommitteeFilter: "events",
        eventId: "bc-event-moving-mountains-kickoff",
        quickAction: "review_members",
      }).replace(/&/g, "&amp;"),
    );
    expect(markup).toContain(
      "href=\"/leader?view=leaderboard&amp;source=events&amp;member=member-ivy&amp;eventCommittee=events&amp;event=bc-event-moving-mountains-kickoff&amp;leaderboardMetric=attendance\"",
    );
  });

  it("keeps leaderboard comparison context when member review reopens leaderboard readback", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      source: "leaderboard",
      memberId: "member-ivy",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
      leaderboardMetric: "attendance",
      leaderboardRegion: "canada",
      bestPracticeChapterId: "leaderboard-mcgill",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(
      "href=\"/leader?view=leaderboard&amp;source=leaderboard&amp;member=member-ivy&amp;eventCommittee=events&amp;event=bc-event-moving-mountains-kickoff&amp;leaderboardMetric=attendance&amp;region=canada&amp;benchmark=leaderboard-mcgill\"",
    );
  });

  it("keeps the mock leader profile inside the event-owned member review loop", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      source: "events",
      memberId: "member-sofia-profile",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
      leaderboardMetric: "attendance",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedMember?.backToPipelineHref).toBe(
      "/leader?view=members&source=events&eventCommittee=events&event=bc-event-moving-mountains-kickoff",
    );
    expect(commandCenter.selectedMember?.backToContextHref).toBe(
      "/leader?view=events&source=events&member=member-sofia-profile&eventCommittee=events&event=bc-event-moving-mountains-kickoff",
    );
    expect(commandCenter.selectedMember?.reviewContext).toBeNull();
    expect(markup).toContain("Opened from event review into leaderboard follow-through");
  });

  it("keeps the member review shell honest until a leader selects someone", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = {
      ...getChapterLeaderCommandCenter(actor, data, {
        view: "member_profile",
        source: "events",
        eventCommittee: "events",
        eventId: "bc-event-moving-mountains-kickoff",
        leaderboardMetric: "attendance",
      }),
      selectedMember: null,
    };
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedMember).toBeNull();
    expect(markup).toContain("Select a member");
    expect(markup).toContain(
      "Choose a member from the pipeline first so this profile can show leadership context, history, and next-step ownership.",
    );
    expect(markup).not.toContain("Open event context");
  });

  it("keeps the member-profile header compact so the person workbench leads the viewport", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("Member Profile");
    expect(markup).toContain("Back to Member Pipeline");
    expect(markup).not.toContain(
      "Keep the selected person context and next leadership move visible before handing off into succession, assignment, or notes.",
    );
    expect(markup.match(/Add Note/g)?.length).toBe(1);
    expect(markup.match(/Leadership Actions/g)?.length).toBe(1);
    expect(markup.indexOf("Back to Member Pipeline")).toBeLessThan(
      markup.indexOf("Leadership Actions"),
    );
    expect(markup.indexOf("Leadership Actions")).toBeLessThan(markup.indexOf("Add Note"));
    expect(markup.indexOf("Add Note")).toBeLessThan(markup.indexOf("Coach &amp; Leader Notes"));
    expect(markup.indexOf("Leadership Actions")).toBeLessThan(
      markup.indexOf("Points History"),
    );
  });

  it("keeps a chapter-home return path visible from member profile with the active review context preserved", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("Back to Chapter Home");
    expect(markup).toContain("Open Chapter Home");
    expect(markup).toContain(
      "href=\"/leader?view=overview&amp;source=member_profile&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy\"",
    );
    expect(markup.indexOf("Back to Member Pipeline")).toBeLessThan(
      markup.indexOf("Back to Chapter Home"),
    );
    expect(markup.indexOf("Back to Chapter Home")).toBeLessThan(
      markup.indexOf("Leadership Actions"),
    );
  });

  it("keeps the Sofia profile aligned with the command-center Figma sample data", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "member-sofia-president",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("Sofia Reyes");
    expect(markup).toContain("Yes — signed up");
    expect(markup).toContain("12 hrs");
    expect(markup).toContain("$1,200");
    expect(markup).toContain("94%");
    expect(markup).toContain("Impeccable Character");
    expect(markup).toContain("Attended SLT Interest Meeting");
    expect(markup).toContain("Strong candidate for a larger role next semester.");
  });

  it("treats member-profile action buttons as profile-owned review states first", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(
      "/leader?view=member_profile&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy&amp;quickAction=promote_to_chair",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy&amp;quickAction=schedule_values_interview",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy&amp;quickAction=assign_leadership_action",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy&amp;quickAction=nominate_for_eboard",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy&amp;quickAction=add_leader_note",
    );
  });

  it("opens promote-to-chair as a member-profile-owned state before the succession lane", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
      quickAction: "promote_to_chair",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("promote_to_chair");
    expect(markup).toContain("Promote to Chair");
    expect(markup).toContain("Start from this member profile, then open chair-readiness review.");
    expect(markup).toContain("Open chair review");
    expect(markup).toContain(
      "href=\"/leader?view=succession&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy\"",
    );
  });

  it("opens add-note as a member-profile-owned review state", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
      quickAction: "add_leader_note",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("add_leader_note");
    expect(markup).toContain("Add Note");
    expect(markup).toContain("Keep this profile in focus while you decide what the next leader should inherit.");
    expect(markup).toContain("Focus on specific examples, what changed over time");
    expect(markup).not.toContain("mock-safe");
    expect(markup).toContain("Return to profile");
  });

  it("hands assign-leadership-action into the leader event shell with member context preserved", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
      quickAction: "assign_leadership_action",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("assign_leadership_action");
    expect(markup).toContain("Open Event Context");
    expect(markup).toContain(
      "Start from this member profile, then open the leader event shell.",
    );
    expect(markup).toContain("Open Event Performance");
    expect(markup).toContain(
      "href=\"/leader?view=events&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy&amp;quickAction=assign_action\"",
    );
  });

  it("preserves the feed-analytics handoff across the re-engagement member-review flow", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      source: "feed_analytics",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedSource).toBe("feed_analytics");
    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Feed analytics handoff",
      title: "Opened from a re-engagement workflow",
      actions: [
        {
          label: "Back to re-engagement queue",
          href: "/leader?view=members&source=feed_analytics&member=member-ivy&pipeline=follow_up&q=Ivy",
        },
      ],
    });
    expect(commandCenter.selectedMember?.backToPipelineHref).toBe(
      "/leader?view=members&source=feed_analytics&member=member-ivy&pipeline=follow_up&q=Ivy",
    );
    expect(commandCenter.selectedMember?.reviewContext).toMatchObject({
      eyebrow: "Feed analytics follow-up",
      actionLabel: "Back to re-engagement queue",
      actionHref:
        "/leader?view=members&source=feed_analytics&member=member-ivy&pipeline=follow_up&q=Ivy",
    });
    expect(markup).toContain("Feed analytics handoff");
    expect(markup).toContain("Feed analytics follow-up");
    expect(markup).toContain("Back to re-engagement queue");
    expect(markup).toContain(
      "/leader?view=members&amp;source=feed_analytics&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "events")?.href).toBe(
      "/leader?view=events&source=feed_analytics&member=member-ivy&pipeline=follow_up&q=Ivy",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "bridge_videos")?.href).toBe(
      "/leader?view=bridge_videos&source=feed_analytics&member=member-ivy&pipeline=follow_up&q=Ivy",
    );
  });

  it("keeps the selected feed post attached to member review opened from that post", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "member_profile",
      source: "feed_analytics",
      feedPostId: "feed-post-slt-recap",
      search: "Sofia",
      memberId: "member-maya",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedFeedPost?.id).toBe("feed-post-slt-recap");
    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Feed analytics handoff",
      title: "Opened from a selected feed post",
      actions: [
        {
          label: "Back to selected post",
          href: "/leader?view=feed_analytics&source=feed_analytics&member=member-maya&q=Sofia&feedPost=feed-post-slt-recap",
        },
        {
          label: "Open member pipeline",
          href: "/leader?view=members&source=feed_analytics&member=member-maya&q=Sofia&feedPost=feed-post-slt-recap",
        },
      ],
    });
    expect(markup).toContain("Opened from a selected feed post");
    expect(markup).toContain("SLT info meeting recap - 18 signed up!");
    expect(markup).toContain("Post in focus");
    expect(markup).toContain("DeShawn Williams · Jun 13");
    expect(markup).toContain("Actions After");
    expect(markup).toContain(
      "Review TEST Sofia Alvarez&#x27;s next move against this content signal first so the follow-up stays anchored to the actual post that surfaced them.",
    );
    expect(markup).toContain("Back to selected post");
    expect(markup).toContain("TEST Sofia Alvarez");
    expect(markup).toContain(
      "/leader?view=feed_analytics&amp;source=feed_analytics&amp;member=member-maya&amp;q=Sofia&amp;feedPost=feed-post-slt-recap",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-maya&amp;q=Sofia&amp;feedPost=feed-post-slt-recap&amp;quickAction=promote_to_chair",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-maya&amp;q=Sofia&amp;feedPost=feed-post-slt-recap&amp;quickAction=schedule_values_interview",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-maya&amp;pipeline=follow_up&amp;q=Sofia&amp;feedPost=feed-post-slt-recap&amp;quickAction=assign_leadership_action",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-maya&amp;q=Sofia&amp;feedPost=feed-post-slt-recap&amp;quickAction=nominate_for_eboard",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-maya&amp;q=Sofia&amp;feedPost=feed-post-slt-recap&amp;quickAction=add_leader_note",
    );
  });

  it("maps the committees view to the richer operating model shown in the leadership mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "committees",
    });

    expect(commandCenter.selectedView).toBe("committees");
    expect(commandCenter.committeesOverview.activeCommitteesLabel).toBe("5 / 7");
    expect(commandCenter.committees[0]).toMatchObject({
      name: "Recruitment",
      ownerLabel: "Jordan",
      memberCountLabel: "12 members",
      actionsDoneLabel: "14 actions done",
      eventsCountLabel: "5 events",
      kpiLabel: "82%",
      operatingStatusLabel: "Strong",
    });
    expect(commandCenter.committees.at(-1)).toMatchObject({
      name: "Member Engagement",
      ownerLabel: "No chair assigned",
      operatingStatusLabel: "Inactive",
    });
    expect(commandCenter.selectedCommitteeId).toBeNull();
    expect(commandCenter.selectedCommittee).toBeNull();
    expect(commandCenter.eventsOverview.monthLabel).toBe("June 2025");
  });

  it("keeps committee selection inside the chapter route and marks the selected lane", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "committees",
      committeeId: "committee-events",
    });

    expect(commandCenter.selectedCommitteeId).toBe("committee-events");
    expect(commandCenter.selectedCommittee?.name).toBe("Events");
    expect(
      commandCenter.committees.find((committee) => committee.id === "committee-events")?.href,
    ).toBe("/leader?view=committees&committee=committee-events");
    expect(commandCenter.viewOptions.find((item) => item.key === "committees")?.href).toBe(
      "/leader?view=committees&committee=committee-events",
    );
  });

  it("renders the committees route as the compact operating board from the mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "committees",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("Event Committees");
    expect(markup).toContain("<h1");
    expect(markup).toContain("Monitor whether each committee is moving the chapter forward - not just existing.");
    expect(markup).toContain("Add Committee");
    expect(markup).toContain("Active Committees");
    expect(markup).toContain("Total Open Actions");
    expect(markup).toContain("Committees Without Chairs");
    expect(markup).not.toContain("Committee in focus");
    expect(markup).not.toContain("Selected lane handoff");
    expect(markup).not.toContain("Review add committee handoff");
    expect(markup).not.toContain("Open selected committee flow");
    expect(markup).toContain(
      "/leader?view=committees&amp;quickAction=add_committee",
    );
    expect(markup).not.toContain(
      "/leader?view=committees&amp;committee=committee-recruitment&amp;quickAction=add_committee",
    );
    expect(markup).toContain("Needs Attention");
    expect(markup).toContain("Inactive");
    expect(markup).toContain("Marcus");
    expect(markup).toContain("Elena");
    expect(markup).not.toContain("Marcus + Elena");
    expect(markup).toContain("No TEST chair assigned");
    expect(markup).not.toContain("Selected Committee");
    expect(markup).not.toContain("Committee lane");
  });

  it("renders the selected committee as an explicit chapter-owned detail state", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "committees",
      memberId: "member-ivy",
      committeeId: "committee-events",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("Committee in focus");
    expect(markup).toContain("Events committee");
    expect(markup).toContain("Next event");
    expect(markup).toContain("Chapter General Meeting");
    expect(markup).toContain("Operating posture");
    expect(markup).toContain("94% healthy");
    expect(markup).toContain("Activity visible now");
    expect(markup).toContain("18 actions done");
    expect(markup).toContain("11 events linked to this lane");
    expect(markup).toContain("Next committee move");
    expect(markup).toContain("Keep the lane reusable for the next owner");
    expect(markup).toContain("Committee review in focus");
    expect(markup).toContain("Reviewing TEST Ivy Invite across committee ownership");
    expect(markup).toContain("Committee lane");
    expect(markup).toContain("Back to Chapter Home");
    expect(markup).toContain("Add another committee");
    expect(markup).toContain("Open Event Performance");
    expect(markup).toContain("Confirm Attendance");
    expect(markup).toContain("Create Event");
    expect(markup).toContain("Open committee lane");
    expect(markup).toContain(
      "/leader?view=committees&amp;member=member-ivy&amp;committee=committee-events",
    );
    expect(markup).toContain(
      "/leader?view=committees&amp;member=member-ivy&amp;committee=committee-events&amp;quickAction=add_committee",
    );
    expect(markup).toContain("href=\"/leader?view=overview&amp;member=member-ivy\"");
    expect(markup).toContain(
      "href=\"/leader?view=events&amp;member=member-ivy&amp;eventCommittee=events\"",
    );
    expect(markup).toContain(
      "href=\"/leader?view=events&amp;member=member-ivy&amp;eventCommittee=events&amp;quickAction=assign_action\"",
    );
    expect(markup).toContain(
      "href=\"/leader?view=events&amp;member=member-ivy&amp;eventCommittee=events&amp;quickAction=create_event\"",
    );
    expect(markup).toContain(
      "href=\"/leader?view=committees&amp;member=member-ivy&amp;committee=committee-events\"",
    );
    expect(markup).toContain("Selected");
  });

  it("maps every selected committee lane into the matching event follow-through filter", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const baseCommandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "committees",
      memberId: "member-ivy",
      committeeId: "committee-events",
    });

    expect(baseCommandCenter.selectedCommittee).not.toBeNull();

    const cases = [
      { committeeId: "committee-events", expectedHref: "/leader?view=events&amp;member=member-ivy&amp;eventCommittee=events" },
      {
        committeeId: "committee-slt-promotion",
        expectedHref: "/leader?view=events&amp;member=member-ivy&amp;eventCommittee=slt_promotion",
      },
      {
        committeeId: "committee-recruitment",
        expectedHref: "/leader?view=events&amp;member=member-ivy&amp;eventCommittee=recruitment",
      },
      {
        committeeId: "committee-fundraising",
        expectedHref: "/leader?view=events&amp;member=member-ivy&amp;eventCommittee=fundraising",
      },
      { committeeId: "committee-service", expectedHref: "/leader?view=events&amp;member=member-ivy&amp;eventCommittee=service" },
      {
        committeeId: "committee-communications",
        expectedHref: "/leader?view=events&amp;member=member-ivy&amp;eventCommittee=comms",
      },
      { committeeId: "committee-unknown", expectedHref: "/leader?view=events&amp;member=member-ivy" },
    ] as const;

    for (const { committeeId, expectedHref } of cases) {
      const commandCenter = {
        ...baseCommandCenter,
        selectedCommitteeId: committeeId,
        selectedCommittee: baseCommandCenter.selectedCommittee
          ? {
              ...baseCommandCenter.selectedCommittee,
              id: committeeId,
            }
          : baseCommandCenter.selectedCommittee,
      };
      const markup = renderToStaticMarkup(
        createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
      );

      expect(markup).toContain(`href="${expectedHref}"`);
    }
  });

  it("keeps selected committee owner copy honest when a chair is still unassigned", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "committees",
      committeeId: "committee-events",
    });
    const unassignedCommandCenter = {
      ...commandCenter,
      selectedCommittee: commandCenter.selectedCommittee
        ? {
            ...commandCenter.selectedCommittee,
            ownerLabel: "No chair assigned",
          }
        : commandCenter.selectedCommittee,
    };
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter: unassignedCommandCenter }),
    );

    expect(markup).toContain("No TEST chair assigned");
    expect(markup).not.toContain("TEST No chair assigned");
  });

  it("maps the events view to the attendance table and social recruiting panel from the mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "events",
    });

    expect(commandCenter.selectedView).toBe("events");
    expect(commandCenter.eventsOverview).toMatchObject({
      monthLabel: "June 2025",
      totalEventsThisMonth: 12,
      attendanceRateLabel: "67%",
      attendanceDeltaLabel: "-4% vs last month",
      rsvpConversionLabel: "79%",
      eventsWithProofLabel: "8/12",
      followUpsOverdue: 2,
      socialRecruitingLabel: "Chapter tracked",
      socialRecruitingNote:
        "Use these signals to judge whether chapter publishing and event promotion are turning into real student interest.",
    });
    expect(commandCenter.events[0]).toMatchObject({
      title: "Moving Mountains Kickoff",
      dateLabel: "Jun 10",
      lane: "Events",
      rsvpCount: 48,
      attendedCount: 39,
      attendanceRateLabel: "81%",
      eventStatusLabel: "Past",
      followUpStatusLabel: "Done",
      creatorLabel: "Marcus Chen",
      href: "/leader?view=events&event=bc-event-moving-mountains-kickoff",
      eventFlowHref: "/rush-month/events/event-rush-social-001",
    });
    expect(commandCenter.events.at(-1)).toMatchObject({
      title: "Bridge Video Workshop",
      lane: "Comms",
      eventStatusLabel: "Upcoming",
      creatorLabel: "Priya Sharma",
      lumaStatusLabel: "Manual check-in",
    });
    expect(commandCenter.selectedEventCommitteeFilter).toBe("all");
    expect(commandCenter.eventCommitteeFilters.map((filter) => filter.label)).toEqual([
      "All Committees",
      "Events",
      "SLT Promotion",
      "Recruitment",
      "Fundraising",
      "Service",
      "Comms",
    ]);
    expect(commandCenter.socialRecruitingMetrics).toEqual([
      { label: "Posts Published", value: "24" },
      { label: "Followers", value: "1,240" },
      { label: "Avg Engagement", value: "4.8%" },
      { label: "Clicks to Join", value: "84" },
      { label: "Leads Generated", value: "18" },
      { label: "Best Post Reach", value: "2,180" },
    ]);
    expect(commandCenter.viewOptions.find((item) => item.key === "events")?.href).toBe(
      "/leader?view=events",
    );
  });

  it("treats the event committee combobox as route-owned state and filters event rows", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "events",
      eventCommittee: "recruitment",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedEventCommitteeFilter).toBe("recruitment");
    expect(commandCenter.events).toHaveLength(1);
    expect(commandCenter.events[0]).toMatchObject({
      title: "Tabling: Quad Recruitment",
      lane: "Recruitment",
    });
    expect(commandCenter.eventCommitteeFilters.find((filter) => filter.key === "recruitment")).toMatchObject({
      isActive: true,
      href: "/leader?view=events&eventCommittee=recruitment",
    });
    expect(markup).toContain('aria-label="Committee filter"');
    expect(markup).toContain('id="chapter-events-committee-filter"');
    expect(markup).toContain("value=\"recruitment\"");
    expect(markup).toContain("Tabling: Quad Recruitment");
    expect(markup).not.toContain("Moving Mountains Kickoff");
    expect(markup).not.toContain(">Apply<");
  });

  it("opens create event as a chapter-owned events state before the broader event flow", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "events",
      memberId: "member-ivy",
      eventCommittee: "events",
      quickAction: "create_event",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("create_event");
    expect(markup).toContain("Create Event");
    expect(markup).toContain("Open the chapter event preview lane with ownership and follow-through in mind.");
    expect(markup).toContain(
      "Review TEST event creation, RSVP posture, attendance readback, proof follow-through, and point impact across the chapter.",
    );
    expect(markup).toContain("Preview-only event operations");
    expect(markup).toContain("Open event preview flow");
    expect(markup).toContain(
      "href=\"/rush-month/events?source=chapter_create_event&amp;returnTo=%2Fleader%3Fview%3Devents%26member%3Dmember-ivy%26eventCommittee%3Devents%26quickAction%3Dcreate_event\"",
    );
    expect(markup).toContain(
      "/leader?view=events&amp;member=member-ivy&amp;eventCommittee=events&amp;quickAction=create_event",
    );
  });

  it("keeps event drill-in inside the chapter events surface before the broader event flow", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "events",
      memberId: "member-ivy",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedEventId).toBe("bc-event-moving-mountains-kickoff");
    expect(commandCenter.selectedEvent?.title).toBe("Moving Mountains Kickoff");
    expect(commandCenter.events[0]?.href).toBe(
      "/leader?view=events&member=member-ivy&eventCommittee=events&event=bc-event-moving-mountains-kickoff",
    );
    expect(markup).toContain(">Event Performance</h1>");
    expect(markup).toContain("Event Detail");
    expect(markup).toContain("Event review in focus");
    expect(markup).toContain("Reviewing TEST Ivy Invite through event follow-through");
    expect(markup).toContain(
      "Keep the selected event in chapter context before you leave this surface.",
    );
    expect(markup).toContain(
      "Luma stays the source of truth, RSVP shows intent, attendance readback shows reviewed check-in posture, and points remain a follow-through step until the next approved route takes over.",
    );
    expect(markup).toContain("Event source of truth");
    expect(markup).toContain("Intent before check-in");
    expect(markup).toContain("Attendance unlocks the point step");
    expect(markup).toContain("Awarded");
    expect(markup).toContain("Back to Chapter Home");
    expect(markup).toContain("Open Event Committees");
    expect(markup).toContain("Confirm Attendance");
    expect(markup).toContain("href=\"/leader?view=overview&amp;member=member-ivy\"");
    expect(markup).toContain(
      "href=\"/leader?view=committees&amp;member=member-ivy&amp;committee=committee-events\"",
    );
    expect(markup).toContain(
      "href=\"/leader?view=events&amp;member=member-ivy&amp;eventCommittee=events&amp;event=bc-event-moving-mountains-kickoff&amp;quickAction=assign_action\"",
    );
    expect(markup).toContain(
      "href=\"/leader?view=events&amp;member=member-ivy&amp;eventCommittee=events&amp;quickAction=create_event\"",
    );
    expect(markup).toContain("Open event review flow");
    expect(markup).toContain(
      "href=\"/rush-month/events/bc-event-moving-mountains-kickoff?source=chapter_event_review&amp;returnTo=%2Fleader%3Fview%3Devents%26member%3Dmember-ivy%26eventCommittee%3Devents%26event%3Dbc-event-moving-mountains-kickoff\"",
    );
    expect(markup).toContain("Events This Month");
    expect(markup).toContain("RSVP vs. Actual Attendance Readback");
    expect(markup).toContain("Social Recruiting Data");
    expect(markup).toContain("Manual update");
    expect(markup).toContain(
      "Recruiting momentum is being summarized from chapter recaps for now, so use this as a directional signal while you plan the next push.",
    );
    expect(markup).not.toContain("Hootsuite / API integration pending");
    expect(markup).not.toContain("Placeholder data shown");
    expect(markup.indexOf("Events This Month")).toBeLessThan(
      markup.indexOf("All Events — June 2025"),
    );
    expect(markup.indexOf("All Events — June 2025")).toBeLessThan(
      markup.indexOf("Event Detail"),
    );
    expect(markup.indexOf("Event Detail")).toBeGreaterThan(
      markup.indexOf("Events This Month"),
    );
    expect(markup.indexOf("Event Detail")).toBeLessThan(markup.indexOf("RSVP vs. Actual Attendance Readback"));
  });

  it("maps every event follow-through filter back into the matching committee review lane", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const baseCommandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "events",
      memberId: "member-ivy",
      eventCommittee: "events",
      eventId: "bc-event-moving-mountains-kickoff",
    });

    const cases = [
      { eventCommitteeFilter: "events", expectedCommitteeId: "committee-events" },
      { eventCommitteeFilter: "slt_promotion", expectedCommitteeId: "committee-slt-promotion" },
      { eventCommitteeFilter: "recruitment", expectedCommitteeId: "committee-recruitment" },
      { eventCommitteeFilter: "fundraising", expectedCommitteeId: "committee-fundraising" },
      { eventCommitteeFilter: "service", expectedCommitteeId: "committee-service" },
      { eventCommitteeFilter: "comms", expectedCommitteeId: "committee-communications" },
      { eventCommitteeFilter: "all", expectedCommitteeId: null },
    ] as const;

    for (const { eventCommitteeFilter, expectedCommitteeId } of cases) {
      const commandCenter = {
        ...baseCommandCenter,
        selectedEventCommitteeFilter: eventCommitteeFilter,
      };
      const markup = renderToStaticMarkup(
        createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
      );

      if (expectedCommitteeId) {
        expect(markup).toContain(
          `href="/leader?view=committees&amp;member=member-ivy&amp;committee=${expectedCommitteeId}"`,
        );
      } else {
        expect(markup).toContain("href=\"/leader?view=committees&amp;member=member-ivy\"");
      }
    }
  });

  it("maps the leaderboard view to the cross-chapter comparison layout from the mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "leaderboard",
    });

    expect(commandCenter.selectedView).toBe("leaderboard");
    expect(commandCenter.leaderboardRegionLabel).toBe("All Regions");
    expect(commandCenter.leaderboardRegionOptions.map((option) => option.label)).toEqual([
      "All Regions",
      "Current Region",
      "United States",
      "Canada",
    ]);
    expect(commandCenter.leaderboardFilters.map((filter) => filter.label)).toEqual([
      "Chapter Health",
      "Events Created",
      "Active Members",
      "Attendance %",
      "Evidence",
      "Bridge Videos",
      "Funds Raised",
      "SLT Participants",
    ]);
    expect(commandCenter.leaderboardFilters[0]).toMatchObject({
      label: "Chapter Health",
      isActive: true,
      href: "/leader?view=leaderboard",
    });
    expect(commandCenter.leaderboardIdeaNote).toContain(
      "UCLA runs weekly SLT testimonial posts",
    );
    expect(commandCenter.leaderboardChapters[0]).toMatchObject({
      chapterName: "UCLA MEDLIFE",
      healthLabel: "Health 96",
    });
    expect(commandCenter.leaderboardChapters[2]).toMatchObject({
      chapterName: "Boston College MEDLIFE",
      badgeLabel: "Your Chapter",
      healthLabel: "Health 87",
    });
    expect(commandCenter.leaderboardChapters[0]?.bestPracticesHref).toBe(
      "/leader?view=feed_analytics&source=leaderboard&benchmark=leaderboard-ucla",
    );
  });

  it("treats leaderboard metric pills and region filtering as route-owned comparison state", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "leaderboard",
      leaderboardMetric: "attendance",
      leaderboardRegion: "canada",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedLeaderboardMetric).toBe("attendance");
    expect(commandCenter.selectedLeaderboardRegion).toBe("canada");
    expect(commandCenter.leaderboardRegionLabel).toBe("Canada");
    expect(commandCenter.leaderboardRegionOptions.find((option) => option.key === "canada")).toMatchObject({
      href: "/leader?view=leaderboard&leaderboardMetric=attendance&region=canada",
    });
    expect(commandCenter.leaderboardChapters).toHaveLength(1);
    expect(commandCenter.leaderboardChapters[0]?.chapterName).toBe("McGill MEDLIFE");
    expect(commandCenter.leaderboardFilters.find((filter) => filter.key === "attendance")).toMatchObject({
      isActive: true,
      href: "/leader?view=leaderboard&leaderboardMetric=attendance&region=canada",
    });
    expect(commandCenter.leaderboardFilters.find((filter) => filter.key === "chapter_health")).toMatchObject({
      isActive: false,
      href: "/leader?view=leaderboard&region=canada",
    });
    expect(commandCenter.leaderboardIdeaNote).toContain("attendance stay high");
    expect(markup).toContain('aria-label="Leaderboard region filter"');
    expect(markup).toContain('id="chapter-leaderboard-region-filter"');
    expect(markup).toContain(">Canada</option>");
    expect(markup).toContain("Chapter Leaderboard");
    expect(markup).toContain("Ideas to try");
    expect(markup).toContain("Learn from top chapters. Find ideas to try. Rise together.");
    expect(markup).not.toContain(">Apply<");
    expect(markup).toContain(
      "/leader?view=leaderboard&amp;leaderboardMetric=attendance&amp;region=canada",
    );
  });

  it("opens best practices as a leaderboard-owned handoff into feed analytics", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "feed_analytics",
      source: "leaderboard",
      bestPracticeChapterId: "leaderboard-ucla",
      leaderboardMetric: "attendance",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedSource).toBe("leaderboard");
    expect(commandCenter.selectedBestPracticeChapterId).toBe("leaderboard-ucla");
    expect(commandCenter.selectedBestPracticeChapter?.chapterName).toBe("UCLA MEDLIFE");
    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Leaderboard handoff",
      title: "Opened from UCLA MEDLIFE best practices",
    });
    expect(commandCenter.sourceContext?.actions?.[0]).toMatchObject({
      label: "Back to leaderboard",
      href: "/leader?view=leaderboard&leaderboardMetric=attendance",
    });
    expect(commandCenter.sourceContext?.actions?.[0]?.href).toBe(
      "/leader?view=leaderboard&leaderboardMetric=attendance",
    );
    expect(markup).toContain("Leaderboard handoff");
    expect(markup).toContain("Opened from UCLA MEDLIFE best practices");
    expect(markup).toContain("Benchmark chapter in focus");
    expect(markup).toContain("Health 96");
    expect(markup).toContain("Weekly SLT testimonial posts doubled sign-up rate");
    expect(markup).toContain("Back to leaderboard");
    expect(markup).toContain(
      "/leader?view=leaderboard&amp;leaderboardMetric=attendance",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "bridge_videos")?.href).toBe(
      "/leader?view=bridge_videos&source=leaderboard&leaderboardMetric=attendance&benchmark=leaderboard-ucla",
    );
  });

  it("keeps leaderboard region context attached to best-practice handoffs", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "leaderboard",
      leaderboardMetric: "attendance",
      leaderboardRegion: "canada",
    });

    expect(commandCenter.leaderboardChapters[0]?.bestPracticesHref).toBe(
      "/leader?view=feed_analytics&source=leaderboard&leaderboardMetric=attendance&region=canada&benchmark=leaderboard-mcgill",
    );
  });

  it("keeps leaderboard comparison context attached across command-center nav after a best-practice handoff", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "feed_analytics",
      source: "leaderboard",
      bestPracticeChapterId: "leaderboard-mcgill",
      leaderboardMetric: "attendance",
      leaderboardRegion: "canada",
    });

    expect(commandCenter.viewOptions.find((item) => item.key === "bridge_videos")?.href).toBe(
      "/leader?view=bridge_videos&source=leaderboard&leaderboardMetric=attendance&region=canada&benchmark=leaderboard-mcgill",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "members")?.href).toBe(
      "/leader?view=members&source=leaderboard&leaderboardMetric=attendance&region=canada&benchmark=leaderboard-mcgill",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "overview")?.href).toBe(
      "/leader?view=overview&source=leaderboard&leaderboardMetric=attendance&region=canada&benchmark=leaderboard-mcgill",
    );
  });

  it("preserves event review context when the leaderboard is opened from event follow-through", () => {
    expect(
      buildChapterLeaderCommandCenterHref("leaderboard", {
        source: "events",
        memberId: "member-ivy",
        eventCommitteeFilter: "events",
        eventId: "bc-event-moving-mountains-kickoff",
        leaderboardMetric: "attendance",
      }),
    ).toBe(
      "/leader?view=leaderboard&source=events&member=member-ivy&eventCommittee=events&event=bc-event-moving-mountains-kickoff&leaderboardMetric=attendance",
    );
  });

  it("keeps leaderboard best-practice context attached when a feed post is selected", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "feed_analytics",
      source: "leaderboard",
      bestPracticeChapterId: "leaderboard-mcgill",
      leaderboardMetric: "attendance",
      leaderboardRegion: "canada",
      feedPostId: "feed-post-info-night",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedSource).toBe("leaderboard");
    expect(commandCenter.selectedBestPracticeChapterId).toBe("leaderboard-mcgill");
    expect(commandCenter.selectedBestPracticeChapter?.chapterName).toBe("McGill MEDLIFE");
    expect(commandCenter.feedPostRows[0]).toMatchObject({
      href:
        "/leader?view=feed_analytics&source=leaderboard&leaderboardMetric=attendance&region=canada&benchmark=leaderboard-mcgill&feedPost=feed-post-info-night",
    });
    expect(commandCenter.sourceContext).toMatchObject({
      title: "Opened from McGill MEDLIFE best practices",
    });
    expect(markup).toContain("Opened from McGill MEDLIFE best practices");
    expect(markup).toContain("Benchmark chapter in focus");
    expect(markup).toContain("McGill MEDLIFE");
    expect(markup).toContain("Back to recent posts");
    expect(markup).toContain(
      "/leader?view=feed_analytics&amp;source=leaderboard&amp;leaderboardMetric=attendance&amp;region=canada&amp;benchmark=leaderboard-mcgill",
    );
  });

  it("keeps leaderboard best-practice context attached to feed follow-up CTAs after a feed post is selected", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "feed_analytics",
      source: "leaderboard",
      bestPracticeChapterId: "leaderboard-mcgill",
      leaderboardMetric: "attendance",
      leaderboardRegion: "canada",
      feedPostId: "feed-post-info-night",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedFeedPost?.nextActionHref).toBe(
      "/leader?view=member_profile&source=feed_analytics&member=member-ivy&leaderboardMetric=attendance&region=canada&benchmark=leaderboard-mcgill&pipeline=follow_up&q=Ivy&feedPost=feed-post-info-night",
    );
    expect(commandCenter.leastEngagedMembers[0]?.actionHref).toBe(
      "/leader?view=member_profile&source=feed_analytics&member=member-ivy&leaderboardMetric=attendance&region=canada&benchmark=leaderboard-mcgill&pipeline=follow_up&q=Ivy&feedPost=feed-post-info-night",
    );
    expect(markup).toContain(
      "/leader?view=bridge_videos&amp;source=feed_analytics&amp;leaderboardMetric=attendance&amp;region=canada&amp;benchmark=leaderboard-mcgill&amp;feedPost=feed-post-info-night&amp;quickAction=share_to_feed",
    );
    expect(markup).toContain(
      "/leader?view=members&amp;source=feed_analytics&amp;leaderboardMetric=attendance&amp;region=canada&amp;benchmark=leaderboard-mcgill&amp;pipeline=follow_up&amp;feedPost=feed-post-info-night&amp;quickAction=ask_members_to_respond",
    );
  });

  it("maps the impact view to the impact dashboard stories and campaign sections from the mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "impact",
    });

    expect(commandCenter.selectedView).toBe("impact");
    expect(commandCenter.selectedImpactHighlightId).toBeNull();
    expect(commandCenter.selectedImpactHighlight).toBeNull();
    expect(commandCenter.impactHighlights[0]).toMatchObject({
      icon: "🍽️",
      value: "1,840",
      label: "meals served",
      actionLabel: "Share this story",
      href: "/leader?view=impact&impactStory=impact-local-meals&quickAction=share_impact_story",
      tone: "blue",
    });
    expect(commandCenter.impactHighlights[2]).toMatchObject({
      icon: "💛",
      value: "#3",
      label: "network rank",
      tone: "amber",
    });
    expect(commandCenter.localImpactStats).toEqual([
      { label: "Meals Served", value: "1,840" },
      { label: "People Supported", value: "420" },
      { label: "Volunteer Hours", value: "284" },
      { label: "Local Partners", value: "4" },
    ]);
    expect(commandCenter.globalImpactStats[0]).toMatchObject({
      label: "SLT Participants",
      value: "18",
    });
    expect(commandCenter.campaignImpactOverview).toMatchObject({
      title: "Moving Mountains",
      raisedLabel: "$8,400",
      goalLabel: "$12,000",
      progressLabel: "70% of goal",
      donorsLabel: "94",
      rankLabel: "#3 in network",
    });
  });

  it("renders the impact route with the story-first header and impact sections from the mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "impact",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(">Impact Dashboard</h1>");
    expect(markup).toContain("This is why we do this. Real people. Real change.");
    expect(markup).toContain("Share Impact Story");
    expect(markup).toContain("Share Bridge Video");
    expect(markup).toContain(
      "/leader?view=impact&amp;quickAction=share_impact_story",
    );
    expect(markup).not.toContain("Story in focus");
    expect(markup.indexOf("1,840")).toBeLessThan(markup.indexOf("Local Community Impact"));
    expect(markup).toContain("#3");
    expect(markup).toContain("network rank");
    expect(markup).toContain("Moving Mountains");
    expect(markup).toContain("$8,400");
    expect(markup).toContain("70% of goal");
    expect(markup).toContain("Local Community Impact");
    expect(markup).toContain("MEDLIFE Global Impact");
    expect(markup).not.toContain("Impact focus");
  });

  it("keeps Share Bridge Video wired from the impact dashboard into the bridge-video handoff", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "impact",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(
      "href=\"/leader?view=impact&amp;quickAction=create_impact_bridge_video\"",
    );
    expect(markup).toContain(">Share Bridge Video<");
  });

  it("keeps the selected member visible when impact is opened from a member-specific route", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "impact",
      memberId: "member-ivy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedMember?.displayName).toBe("Ivy Invite");
    expect(commandCenter.impactHighlights[0]?.href).toBe(
      "/leader?view=impact&member=member-ivy&impactStory=impact-local-meals&quickAction=share_impact_story",
    );
    expect(markup).not.toContain("Impact focus");
    expect(markup).not.toContain("Keep Ivy Invite anchored to the story");
  });

  it("surfaces a route-owned impact story state when a highlight is selected", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "impact",
      impactStory: "impact-moving-mountains",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedImpactHighlight?.id).toBe("impact-moving-mountains");
    expect(markup).toContain("Story in focus");
    expect(markup).toContain("#3 network rank");
    expect(markup).toContain("Your Moving Mountains campaign ranks #3 globally");
    expect(markup.indexOf("Story in focus")).toBeLessThan(markup.indexOf("1,840"));
    expect(markup.indexOf("Story in focus")).toBeLessThan(
      markup.indexOf("Local Community Impact"),
    );
    expect(markup.indexOf("Story in focus")).toBeLessThan(
      markup.indexOf("Campaign Rank"),
    );
    expect(markup.match(/#3 network rank/g)?.length).toBe(1);
    expect(markup).not.toContain("Impact focus");
  });

  it("opens impact storytelling as an impact-owned review state before the bridge-video library", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "impact",
      memberId: "member-ivy",
      impactStory: "impact-moving-mountains",
      quickAction: "share_impact_story",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("share_impact_story");
    expect(commandCenter.selectedImpactHighlight?.id).toBe("impact-moving-mountains");
    expect(markup).toContain("Share Impact Story");
    expect(markup).toContain("Story in focus: #3 network rank");
    expect(markup).toContain("Open story library");
    expect(markup).toContain(
      "href=\"/leader?view=bridge_videos&amp;source=impact&amp;member=member-ivy&amp;impactStory=impact-moving-mountains\"",
    );
  });

  it("keeps the impact-owned bridge-video handoff labeled as Share Bridge Video", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "impact",
      memberId: "member-ivy",
      impactStory: "impact-moving-mountains",
      quickAction: "create_impact_bridge_video",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("create_impact_bridge_video");
    expect(markup).toContain("Share Bridge Video");
    expect(markup).not.toContain("Create Bridge Video");
    expect(markup).toContain("Open bridge-video lane");
  });

  it("keeps the selected impact story attached to the Share Bridge Video quick action", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "impact",
      memberId: "member-ivy",
      impactStory: "impact-moving-mountains",
    });

    expect(commandCenter.selectedImpactHighlight?.id).toBe("impact-moving-mountains");
    expect(commandCenter.quickActions.find((action) => action.label === "Share Bridge Video")).toBeUndefined();
  });

  it("keeps the impact handoff visible when bridge videos open from storytelling work", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      source: "impact",
      memberId: "member-ivy",
      impactStory: "impact-moving-mountains",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Impact handoff",
      title: "Opened from impact storytelling",
      actions: [
        {
          label: "Back to impact",
          href: "/leader?view=impact&member=member-ivy&impactStory=impact-moving-mountains",
        },
      ],
    });
    expect(commandCenter.selectedImpactHighlight?.id).toBe("impact-moving-mountains");
    expect(markup).toContain("Impact handoff");
    expect(markup).toContain("Opened from impact storytelling");
    expect(markup).toContain("Back to impact");
    expect(markup).toContain("Impact story in focus");
    expect(markup).toContain("#3 network rank");
    expect(markup).toContain("Back to story");
    expect(markup.indexOf("Impact story in focus")).toBeLessThan(
      markup.indexOf("Videos Submitted"),
    );
  });

  it("keeps both the impact-story handoff and selected-video review ahead of bridge metrics", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      source: "impact",
      memberId: "member-ivy",
      impactStory: "impact-moving-mountains",
      bridgeVideoId: "bridge-social-strategy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedImpactHighlight?.id).toBe("impact-moving-mountains");
    expect(commandCenter.selectedBridgeVideo?.id).toBe("bridge-social-strategy");
    expect(markup).toContain("Impact story in focus");
    expect(markup).toContain("Selected video");
    expect(markup).toContain("Social Media Posting Strategy for MEDLIFE");
    expect(markup).toContain("Back to story");
    expect(markup).toContain("Back to bridge library");
    expect(markup.indexOf("Impact story in focus")).toBeLessThan(
      markup.indexOf("Selected video"),
    );
    expect(markup.indexOf("Selected video")).toBeLessThan(
      markup.indexOf("Videos Submitted"),
    );
    expect(markup.match(/Social Media Posting Strategy for MEDLIFE/g)?.length).toBe(1);
  });

  it("keeps the member-home handoff attached to the first leader review actions", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "overview",
      source: "member_home",
    });

    expect(commandCenter.selectedSource).toBe("member_home");
    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Member app handoff",
      title: "Opened from UCLA MEDLIFE into Leader Hub",
    });
    expect(commandCenter.sourceContext?.preview).toMatchObject({
      heading: "Leader Hub",
      chapterLabel: "UCLA MEDLIFE",
    });
    expect(commandCenter.sourceContext?.preview?.stats.map((stat) => stat.label)).toEqual([
      "Members active",
      "Attendance rate",
      "Events with proof",
      "Follow-up needed",
    ]);
    expect(commandCenter.sourceContext?.preview?.sections.map((section) => section.title)).toEqual([
      "Event Pulse",
      "Risk Alerts",
      "Member Status",
      "Attendance Follow-Up",
    ]);
    expect(commandCenter.sourceContext?.actions?.[0]).toMatchObject({
      label: "Review members",
      href: "/leader?view=members&source=member_home&quickAction=review_members",
    });
    expect(commandCenter.sourceContext?.actions?.[1]).toMatchObject({
      label: "Confirm attendance",
      href: "/leader?view=events&source=member_home&quickAction=assign_action",
    });
    expect(commandCenter.quickActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Create Event",
          href: "/leader?view=events&source=member_home&quickAction=create_event",
        }),
        expect.objectContaining({
          label: "Confirm Attendance",
          href: "/leader?view=events&source=member_home&quickAction=assign_action",
        }),
        expect.objectContaining({
          label: "Review Members",
          href: "/leader?view=members&source=member_home&quickAction=review_members",
        }),
        expect.objectContaining({
          label: "Review Leaderboard",
          href: "/leader?view=leaderboard&source=member_home&leaderboardMetric=attendance",
        }),
      ]),
    );
  });

  it("maps the feed analytics view to the action-driven engagement dashboard from the mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "feed_analytics",
    });

    expect(commandCenter.selectedView).toBe("feed_analytics");
    expect(commandCenter.feedMetrics).toEqual([
      { label: "Posts Published", value: "5" },
      { label: "Total Views", value: "1120" },
      { label: "Total Likes", value: "194" },
      { label: "Actions After View", value: "24" },
      { label: "RSVPs From Feed", value: "31" },
    ]);
    expect(commandCenter.feedChartRows[0]).toMatchObject({
      label: "How to Run a S...",
      likes: 41,
      comments: 12,
      actionsAfter: 6,
    });
    expect(commandCenter.feedPostRows[0]).toMatchObject({
      title: "How to Run a Successful Info Night",
      typeLabel: "Bridge Video",
      authorLabel: "Sofia Reyes",
      viewsLabel: "284",
      rsvpsLabel: "11",
      isSelected: true,
      href: "/leader?view=feed_analytics&feedPost=feed-post-info-night",
    });
    expect(commandCenter.mostEngagedMembers[0]).toMatchObject({
      displayName: "Sofia Reyes",
      scoreLabel: "94 %",
    });
    expect(commandCenter.leastEngagedMembers[0]).toMatchObject({
      displayName: "Ivy Invite",
      actionLabel: "Re-engage",
      actionHref:
        "/leader?view=member_profile&source=feed_analytics&member=member-ivy&pipeline=follow_up&q=Ivy",
    });
    expect(commandCenter.leastEngagedMembers.slice(1)).toEqual([
      expect.objectContaining({
        displayName: "Omar Outreach",
        actionHref:
          "/leader?view=member_profile&source=feed_analytics&member=member-omar&pipeline=follow_up&q=Omar",
      }),
      expect.objectContaining({
        displayName: "Zara Events",
        actionHref:
          "/leader?view=member_profile&source=feed_analytics&member=member-zara&pipeline=follow_up&q=Zara",
      }),
      expect.objectContaining({
        displayName: "Sofia Alvarez",
        actionHref:
          "/leader?view=member_profile&source=feed_analytics&member=member-maya&pipeline=follow_up&q=Sofia",
      }),
    ]);
  });

  it("renders the feed analytics route with the action-driven dashboard sections from the mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "feed_analytics",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(">Feed &amp; Engagement Analytics</h1>");
    expect(markup).toContain("Understand what content drives real action");
    expect(markup).toContain("Share to Feed");
    expect(markup).toContain("Ask Members to Respond");
    expect(markup).toContain("Content Engagement — Actions Driven");
    expect(markup).toContain("Likes");
    expect(markup).toContain("Comments");
    expect(markup).toContain("Actions After");
    expect(markup).toContain(
      "/leader?view=bridge_videos&amp;source=feed_analytics&amp;quickAction=share_to_feed",
    );
    expect(markup).toContain(
      "/leader?view=members&amp;source=feed_analytics&amp;pipeline=follow_up&amp;quickAction=ask_members_to_respond",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-omar&amp;pipeline=follow_up&amp;q=Omar",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-zara&amp;pipeline=follow_up&amp;q=Zara",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-maya&amp;pipeline=follow_up&amp;q=Sofia",
    );
    expect(markup).toContain("Recent Posts");
    expect(markup).not.toContain("Selected post");
    expect(markup).toContain("Most Engaged Members");
    expect(markup).toContain("Re-engagement Targets");
    expect(markup).toContain("Sofia Reyes");
    expect(markup).toContain("94 %");
    expect(markup).not.toContain("Open member follow-up");
    expect(markup.indexOf("Most Engaged Members")).toBeLessThan(
      markup.indexOf("Re-engagement Targets"),
    );
  });

  it("surfaces a route-owned selected post state inside feed analytics", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "feed_analytics",
      feedPostId: "feed-post-slt-recap",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedFeedPost?.id).toBe("feed-post-slt-recap");
    expect(commandCenter.feedPostRows.find((row) => row.id === "feed-post-slt-recap")).toMatchObject({
      isSelected: true,
      href: "/leader?view=feed_analytics&feedPost=feed-post-slt-recap",
    });
    expect(markup).toContain("Impact Analysis");
    expect(markup).toContain("Back to recent posts");
    expect(markup).toContain("SLT info meeting recap - 18 signed up!");
    expect(markup).toContain("Open member review");
    expect(markup).toContain(
      "/leader?view=bridge_videos&amp;source=feed_analytics&amp;feedPost=feed-post-slt-recap&amp;quickAction=share_to_feed",
    );
    expect(markup).toContain(
      "/leader?view=members&amp;source=feed_analytics&amp;pipeline=follow_up&amp;feedPost=feed-post-slt-recap&amp;quickAction=ask_members_to_respond",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-maya&amp;q=Sofia&amp;feedPost=feed-post-slt-recap",
    );
    expect(markup.indexOf("Impact Analysis")).toBeLessThan(
      markup.indexOf("Posts Published"),
    );
    expect(markup.indexOf("Impact Analysis")).toBeLessThan(
      markup.indexOf("Recent Posts"),
    );
    expect(markup.indexOf("Impact Analysis")).toBeLessThan(
      markup.indexOf("Most Engaged Members"),
    );
    expect(markup.indexOf("Impact Analysis")).toBeLessThan(
      markup.indexOf("Re-engagement Targets"),
    );
  });

  it("keeps subviews focused on their own mockup content instead of repeating the home dashboard", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "feed_analytics",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("Feed Analytics");
    expect(markup).not.toContain("Chapter Dashboard · JUN 2025");
    expect(markup).not.toContain("How is chapter momentum moving week to week?");
    expect(markup).not.toContain("What could slow the chapter down?");
  });

  it("keeps the events table ahead of the secondary event reporting blocks", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "events",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(">Event Performance</h1>");
    expect(markup).toContain("All Events — June 2025");
    expect(markup).toContain("Events This Month");
    expect(markup).toContain("RSVP vs. Actual Attendance Readback");
    expect(markup.indexOf("Events This Month")).toBeLessThan(
      markup.indexOf("All Events — June 2025"),
    );
    expect(markup.indexOf("All Events — June 2025")).toBeLessThan(
      markup.indexOf("RSVP vs. Actual Attendance Readback"),
    );
  });

  it("opens share-to-feed as a feed-owned bridge-library state before the broader sharing flow", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      source: "feed_analytics",
      quickAction: "share_to_feed",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("share_to_feed");
    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Feed analytics handoff",
      title: "Opened from feed planning into bridge-video review",
      actions: [
        {
          label: "Back to feed analytics",
          href: "/leader?view=feed_analytics&source=feed_analytics",
        },
        {
          label: "Open re-engagement queue",
          href: "/leader?view=members&source=feed_analytics",
        },
      ],
    });
    expect(markup).toContain("Share to Feed");
    expect(markup).toContain("Opened from feed planning into bridge-video review");
    expect(markup).toContain(
      "Start from the bridge-video library, then choose what should travel back into feed planning.",
    );
    expect(markup).toContain("Share Bridge Video");
    expect(markup).toContain("Back to feed analytics");
    expect(markup).toContain("Open re-engagement queue");
    expect(markup).toContain(
      "href=\"/leader?view=feed_analytics&amp;source=bridge_videos&amp;bridge=recruitment\"",
    );
    expect(markup).toContain(
      "href=\"/leader?view=feed_analytics&amp;source=feed_analytics\"",
    );
  });

  it("keeps selected-post context attached when share-to-feed opens from feed analytics", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      source: "feed_analytics",
      feedPostId: "feed-post-slt-recap",
      quickAction: "share_to_feed",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.sourceContext).toMatchObject({
      title: "Opened from a selected feed post into bridge-video review",
      actions: [
        {
          label: "Back to selected post",
          href: "/leader?view=feed_analytics&source=feed_analytics&feedPost=feed-post-slt-recap",
        },
        {
          label: "Open re-engagement queue",
          href: "/leader?view=members&source=feed_analytics&feedPost=feed-post-slt-recap",
        },
      ],
    });
    expect(markup).toContain("Post in focus: SLT info meeting recap - 18 signed up!");
    expect(markup).toContain("Back to selected post");
    expect(markup).toContain(
      "href=\"/leader?view=feed_analytics&amp;source=bridge_videos&amp;feedPost=feed-post-slt-recap&amp;bridge=recruitment\"",
    );
  });

  it("keeps the selected feed post visible inside the bridge-video route opened from feed analytics", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      source: "feed_analytics",
      memberId: "member-maya",
      search: "Sofia",
      feedPostId: "feed-post-slt-recap",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedFeedPost?.id).toBe("feed-post-slt-recap");
    expect(commandCenter.sourceContext).toMatchObject({
      title: "Opened from a selected feed post into bridge-video review",
    });
    expect(markup).toContain("Post in focus");
    expect(markup).toContain("SLT info meeting recap - 18 signed up!");
    expect(markup).toContain("DeShawn Williams · Jun 13");
    expect(markup).toContain("Actions After");
    expect(markup).toContain(
      "Keep this feed signal visible while reviewing bridge assets so the library stays anchored to the real post that needs reinforcement, follow-up, or a better story handoff.",
    );
    expect(markup).toContain(
      "/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-maya&amp;q=Sofia&amp;feedPost=feed-post-slt-recap",
    );
    expect(markup.indexOf("Post in focus")).toBeLessThan(
      markup.indexOf("Videos Submitted"),
    );
  });

  it("opens ask-members-to-respond as a feed-owned member-review state before the broader pipeline workbench", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "members",
      source: "feed_analytics",
      pipeline: "follow_up",
      search: "Ivy",
      memberId: "member-ivy",
      quickAction: "ask_members_to_respond",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("ask_members_to_respond");
    expect(markup).toContain("Ask Members to Respond");
    expect(markup).toContain("Start from the re-engagement queue, then open a member review.");
    expect(markup).toContain("Open member review");
    expect(markup).toContain(
      "href=\"/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy\"",
    );
  });

  it("keeps selected-post context attached when ask-members-to-respond opens from feed analytics", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "members",
      source: "feed_analytics",
      pipeline: "follow_up",
      search: "Ivy",
      memberId: "member-ivy",
      feedPostId: "feed-post-slt-recap",
      quickAction: "ask_members_to_respond",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("Post in focus: SLT info meeting recap - 18 signed up!");
    expect(markup).toContain("Back to selected post");
    expect(markup).toContain(
      "href=\"/leader?view=feed_analytics&amp;source=feed_analytics&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy&amp;feedPost=feed-post-slt-recap\"",
    );
    expect(markup).toContain(
      "href=\"/leader?view=member_profile&amp;source=feed_analytics&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy&amp;feedPost=feed-post-slt-recap\"",
    );
  });

  it("keeps selected-post context attached when share-to-feed changes bridge-video categories", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      source: "feed_analytics",
      feedPostId: "feed-post-slt-recap",
      quickAction: "share_to_feed",
      bridgeFilter: "comms",
    });

    expect(commandCenter.bridgeVideoFilters.find((filter) => filter.key === "comms")).toMatchObject({
      isActive: true,
      href:
        "/leader?view=bridge_videos&source=feed_analytics&feedPost=feed-post-slt-recap&bridge=comms&quickAction=share_to_feed",
    });
    expect(commandCenter.bridgeVideoFilters.find((filter) => filter.key === "recruitment")).toMatchObject({
      href:
        "/leader?view=bridge_videos&source=feed_analytics&feedPost=feed-post-slt-recap&bridge=recruitment&quickAction=share_to_feed",
    });
  });

  it("keeps feed-post context attached to bridge-owned quick actions inside bridge-video review", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      source: "feed_analytics",
      memberId: "member-ivy",
      feedPostId: "feed-post-slt-recap",
      bridgeFilter: "comms",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.quickActions.find((action) => action.label === "Share Bridge Video")).toBeUndefined();
    expect(commandCenter.bridgeVideoEntries[0]?.featureHref).toBe(
      "/leader?view=bridge_videos&source=feed_analytics&member=member-ivy&feedPost=feed-post-slt-recap&bridge=comms&bridgeVideo=bridge-social-strategy&quickAction=feature_bridge_video",
    );
    expect(markup).toContain(
      "href=\"/leader?view=bridge_videos&amp;source=feed_analytics&amp;member=member-ivy&amp;feedPost=feed-post-slt-recap&amp;bridge=comms&amp;quickAction=submit_bridge_video\"",
    );
  });

  it("keeps feed-post context attached to the selected-video panel inside bridge-video review", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      source: "feed_analytics",
      memberId: "member-ivy",
      feedPostId: "feed-post-slt-recap",
      bridgeFilter: "comms",
      bridgeVideoId: "bridge-social-strategy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(
      "href=\"/leader?view=bridge_videos&amp;source=feed_analytics&amp;member=member-ivy&amp;feedPost=feed-post-slt-recap&amp;bridge=comms\"",
    );
    expect(markup).toContain(
      "href=\"/leader?view=bridge_videos&amp;source=feed_analytics&amp;member=member-ivy&amp;feedPost=feed-post-slt-recap&amp;bridge=comms&amp;bridgeVideo=bridge-social-strategy&amp;quickAction=feature_bridge_video\"",
    );
  });

  it("maps the bridge videos view to the hub-style asset library from the mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
    });

    expect(commandCenter.selectedView).toBe("bridge_videos");
    expect(commandCenter.bridgeVideoMetrics).toEqual([
      { label: "Videos Submitted", value: "5" },
      { label: "Total Views", value: "899" },
      { label: "Total Likes", value: "143" },
      { label: "Chapters Using", value: "20" },
    ]);
    expect(commandCenter.bridgeVideoFilters.map((filter) => filter.label)).toEqual([
      "All",
      "Recruitment",
      "Fundraising",
      "SLT Promotion",
      "Leadership Transition",
      "Communications",
    ]);
    expect(commandCenter.bridgeVideoEntries[0]).toMatchObject({
      title: "How to Run a Successful Info Night",
      badgeLabel: "Featured",
      categoryLabel: "Recruitment",
      authorLabel: "Sofia Reyes",
      chaptersUsingLabel: "6 chapters using",
    });
    expect(commandCenter.bridgeVideoEntries.at(-1)).toMatchObject({
      title: "Social Media Posting Strategy for MEDLIFE",
      categoryLabel: "Communications",
      chaptersUsingLabel: "2 chapters using",
    });
    expect(commandCenter.bridgeVideoCultureNote).toContain(
      "Every leader who submits a bridge video",
    );
  });

  it("treats bridge video category pills as route state and filters the visible library", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      bridgeFilter: "comms",
    });

    expect(commandCenter.selectedView).toBe("bridge_videos");
    expect(commandCenter.selectedBridgeVideoFilter).toBe("comms");
    expect(commandCenter.bridgeVideoFilters.find((filter) => filter.key === "comms")).toMatchObject({
      isActive: true,
      href: "/leader?view=bridge_videos&bridge=comms",
    });
    expect(commandCenter.bridgeVideoFilters.find((filter) => filter.key === "all")).toMatchObject({
      isActive: false,
      href: "/leader?view=bridge_videos",
    });
    expect(commandCenter.bridgeVideoEntries).toHaveLength(1);
    expect(commandCenter.bridgeVideoEntries[0]?.categoryLabel).toBe("Communications");
    expect(commandCenter.bridgeVideoEntries[0]?.title).toBe(
      "Social Media Posting Strategy for MEDLIFE",
    );
    expect(commandCenter.bridgeVideoEntries[0]?.featureHref).toBe(
      "/leader?view=bridge_videos&bridge=comms&bridgeVideo=bridge-social-strategy&quickAction=feature_bridge_video",
    );
    expect(commandCenter.bridgeVideoEntries[0]?.shareHref).toBe(
      "/leader?view=feed_analytics&source=bridge_videos&bridge=comms",
    );
    expect(commandCenter.quickActions.find((action) => action.label === "Share Bridge Video")).toBeUndefined();
  });

  it("treats the bridge-video feature button as a selected-video review state first", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      bridgeFilter: "comms",
      bridgeVideoId: "bridge-social-strategy",
      quickAction: "feature_bridge_video",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("feature_bridge_video");
    expect(commandCenter.selectedBridgeVideoId).toBe("bridge-social-strategy");
    expect(commandCenter.selectedBridgeVideo?.title).toBe(
      "Social Media Posting Strategy for MEDLIFE",
    );
    expect(markup).toContain("Feature Bridge Video");
    expect(markup).toContain(
      "Start from the bridge-video library, then review what should stay featured.",
    );
    expect(markup).toContain("Feature selected video");
    expect(markup).toContain(
      "href=\"/leader?view=bridge_videos&amp;bridge=comms&amp;bridgeVideo=bridge-social-strategy\"",
    );
    expect(commandCenter.bridgeVideoFilters.find((filter) => filter.key === "all")).toMatchObject({
      href:
        "/leader?view=bridge_videos&bridgeVideo=bridge-social-strategy&quickAction=feature_bridge_video",
    });
    expect(commandCenter.bridgeVideoFilters.find((filter) => filter.key === "comms")).toMatchObject({
      href:
        "/leader?view=bridge_videos&bridge=comms&bridgeVideo=bridge-social-strategy&quickAction=feature_bridge_video",
    });
    expect(commandCenter.bridgeVideoFilters.find((filter) => filter.key === "recruitment")).toMatchObject({
      href: "/leader?view=bridge_videos&bridge=recruitment",
    });
  });

  it("renders the bridge video route as the hub-style library from the mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      bridgeFilter: "comms",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(">Bridge Video Hub</h1>");
    expect(markup).toContain("&quot;MEDLIFE leaders build a bridge for the next generation.&quot;");
    expect(markup).toContain("Submit Bridge Video");
    expect(markup).toContain(
      "/leader?view=bridge_videos&amp;bridge=comms&amp;quickAction=submit_bridge_video",
    );
    expect(markup).toContain("Videos Submitted");
    expect(markup).toContain("Communications");
    expect(markup).toContain("Bridge Culture Reminder");
    expect(markup).toContain("/leader?view=bridge_videos&amp;bridge=comms");
    expect(markup).toContain("/leader?view=feed_analytics&amp;source=bridge_videos&amp;bridge=comms");
  });

  it("surfaces a route-owned selected video state when a bridge video is selected", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      bridgeFilter: "comms",
      bridgeVideoId: "bridge-social-strategy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedBridgeVideo?.id).toBe("bridge-social-strategy");
    expect(markup).toContain("Selected video");
    expect(markup).toContain("Back to bridge library");
    expect(markup).toContain("Social Media Posting Strategy for MEDLIFE");
    expect(markup).toContain("Feature selected video");
    expect(markup).toContain("No other bridge videos in this filter");
    expect(markup).toContain("Communications only has the selected video right now.");
    expect(markup.indexOf("Selected video")).toBeLessThan(
      markup.indexOf("Videos Submitted"),
    );
    expect(markup.match(/Social Media Posting Strategy for MEDLIFE/g)?.length).toBe(1);
    expect(markup.indexOf("Selected video")).toBeLessThan(
      markup.indexOf("Bridge Culture Reminder"),
    );
    expect(markup.indexOf("No other bridge videos in this filter")).toBeLessThan(
      markup.indexOf("Bridge Culture Reminder"),
    );
  });

  it("keeps the selected member visible when bridge videos are opened from a member-specific route", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      memberId: "member-ivy",
      bridgeFilter: "comms",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedMember?.displayName).toBe("Ivy Invite");
    expect(markup).toContain("Story owner context");
    expect(markup).toContain("Reviewing bridge content with TEST Ivy Invite in focus");
    expect(markup).toContain("General Member");
    expect(markup).toContain("Recruitment");
    expect(markup).toContain("Follow-up now");
    expect(markup).toContain("/leader?view=member_profile&amp;member=member-ivy");
  });

  it("keeps bridge-video category context when a leader opens feed analytics from the library", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "feed_analytics",
      source: "bridge_videos",
      bridgeFilter: "comms",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Bridge video handoff",
      title: "Opened from bridge-video review into feed planning",
      actions: [
        {
          label: "Back to bridge videos",
          href: "/leader?view=bridge_videos&source=bridge_videos&bridge=comms",
        },
      ],
    });
    expect(commandCenter.feedAnalyticsBridgeContext).toMatchObject({
      label: "Communications bridge videos",
      backHref: "/leader?view=bridge_videos&bridge=comms",
    });
    expect(commandCenter.viewOptions.find((item) => item.key === "feed_analytics")?.href).toBe(
      "/leader?view=feed_analytics&source=bridge_videos",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "bridge_videos")?.href).toBe(
      "/leader?view=bridge_videos&source=bridge_videos&bridge=comms",
    );
    expect(markup).toContain("Opened from bridge-video review into feed planning");
    expect(markup).toContain("Back to bridge videos");
    expect(markup).toContain("Bridge Video Context");
    expect(markup).toContain("Reviewing Communications bridge videos");
    expect(markup).toContain("/leader?view=bridge_videos&amp;source=bridge_videos&amp;bridge=comms");
  });

  it("keeps the selected-post review block ahead of bridge-video context when both states are present", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "feed_analytics",
      source: "bridge_videos",
      bridgeFilter: "comms",
      feedPostId: "feed-post-slt-recap",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedFeedPost?.id).toBe("feed-post-slt-recap");
    expect(commandCenter.feedAnalyticsBridgeContext).toMatchObject({
      label: "Communications bridge videos",
    });
    expect(markup).toContain("Impact Analysis");
    expect(markup).toContain("Bridge Video Context");
    expect(markup).toContain("Back to recent posts");
    expect(markup).toContain("Back to bridge library");
    expect(markup.indexOf("Impact Analysis")).toBeLessThan(
      markup.indexOf("Bridge Video Context"),
    );
    expect(markup.indexOf("Bridge Video Context")).toBeLessThan(
      markup.indexOf("Posts Published"),
    );
  });

  it("maps the succession view to the leadership gaps, candidate pipeline, and transition timeline from the mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "succession",
      memberId: "member-ivy",
    });

    expect(commandCenter.selectedView).toBe("succession");
    expect(commandCenter.selectedMember?.displayName).toBe("Ivy Invite");
    expect(commandCenter.successionOverview).toMatchObject({
      eboardRolesFilledLabel: "6 / 7",
      activeCommitteesLabel: "5 / 7",
      candidatesIdentifiedLabel: "4",
      transitionReadinessLabel: "62%",
      transitionReadinessNote: "needs improvement",
    });
    expect(commandCenter.successionGaps[0]).toMatchObject({
      severity: "high",
      title: "Member Engagement has no chair - inactive 3+ weeks",
    });
    expect(commandCenter.successionCandidates[0]).toMatchObject({
      displayName: "Priya President",
      pointsLabel: "1,240 pts",
      badgeLabel: "E-Board",
    });
    expect(commandCenter.successionCandidates.find((candidate) => candidate.displayName === "Ivy Invite")).toMatchObject({
      isSelected: true,
      href: "/leader?view=succession&member=member-ivy",
    });
    expect(commandCenter.successionCandidates.at(-1)).toMatchObject({
      displayName: "Omar Outreach",
      badgeLabel: "Chair candidate",
    });
    expect(commandCenter.successionTimeline[0]).toMatchObject({
      dateLabel: "Jun 2025",
      title: "Appoint Member Engagement chair",
    });
  });

  it("keeps the plain succession route in dashboard mode until a candidate is explicitly selected", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "succession",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.hasExplicitMemberSelection).toBe(false);
    expect(commandCenter.successionCandidates.some((candidate) => candidate.isSelected)).toBe(false);
    expect(markup).toContain(">Leadership Succession</h1>");
    expect(markup).toContain("Succession Planning");
    expect(markup).not.toContain("Selected candidate");
    expect(markup).not.toContain("Selected now");
    expect(markup).toContain("Open Candidate Review");
    expect(markup).toContain("Preview Transition Review");
    expect(markup).toContain(
      "before any nomination, promotion, or notify flow turns into a live write path.",
    );
    expect(markup).toContain("href=\"/leader?view=members\"");
  });

  it("renders the succession route with the gap, pipeline, and timeline sections from the mockup", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "succession",
      memberId: "member-ivy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain(">Leadership Succession</h1>");
    expect(markup).toContain("Succession Planning");
    expect(markup).toContain("Ensure the chapter can survive and grow beyond any single leader.");
    expect(markup).toContain("Selected candidate");
    expect(markup).toContain("Reviewing TEST Ivy Invite for succession readiness");
    expect(markup).toContain("Open member profile");
    expect(markup).toContain("Selected now");
    expect(markup).toContain("Open Candidate Review");
    expect(markup).toContain("Preview Transition Review");
    expect(markup).toContain("href=\"/leader?view=members\"");
    expect(markup).toContain("href=\"/leader?view=succession&amp;member=member-ivy\"");
    expect(markup.indexOf("Selected candidate")).toBeLessThan(
      markup.indexOf("E-Board Roles Filled"),
    );
    expect(markup).toContain("Leadership Gaps");
    expect(markup).toContain("Candidate Pipeline");
    expect(markup).toContain("Succession Timeline");
  });

  it("keeps chapter-home return links anchored to the active leadership review source", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "values",
      source: "leaders",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(markup).toContain("Back to Chapter Home");
    expect(markup).toContain(
      "href=\"/leader?view=overview&amp;source=leaders&amp;member=member-ivy&amp;pipeline=follow_up&amp;q=Ivy\"",
    );
    expect(markup.indexOf("Back to Chapter Home")).toBeLessThan(
      markup.indexOf("MEDLIFE Values"),
    );
  });

  it("opens promote emerging leader as a succession-owned quick-action state before nomination decisions", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "succession",
      memberId: "member-ivy",
      quickAction: "promote_emerging_leader",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("promote_emerging_leader");
    expect(markup).toContain("Promote Emerging Leader");
    expect(markup).toContain("Start from succession planning, then open the candidate review lane.");
    expect(markup).toContain("Open candidate review");
    expect(markup).toContain("href=\"/leader?view=succession&amp;member=member-ivy\"");
  });

  it("opens add committee as a chapter-owned committees state before the broader committee lane", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "committees",
      committeeId: "committee-events",
      quickAction: "add_committee",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("add_committee");
    expect(markup).toContain("Add Committee");
    expect(markup).toContain("Stay inside the committee lane while you review ownership and operating health.");
    expect(markup).toContain("Open committee lane");
    expect(markup).toContain(
      "href=\"/leader?view=committees&amp;committee=committee-events\"",
    );
  });

  it("opens share bridge video as a bridge-library-owned quick-action state before feed handoff", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      bridgeFilter: "comms",
      quickAction: "share_bridge_video",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("share_bridge_video");
    expect(markup).toContain("Share Bridge Video");
    expect(markup).toContain("Start from the bridge-video library, then open the sharing lane.");
    expect(markup).toContain("Share Bridge Video");
    expect(markup).toContain(
      "href=\"/leader?view=feed_analytics&amp;source=bridge_videos&amp;bridge=comms\"",
    );
  });

  it("opens share bridge video from the selected bridge video instead of the first library card", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      bridgeVideoId: "bridge-social-strategy",
      quickAction: "share_bridge_video",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedBridgeVideo?.id).toBe("bridge-social-strategy");
    expect(markup).toMatch(
      /href="\/leader\?view=feed_analytics&amp;source=bridge_videos&amp;bridge=comms"[^>]*>Share Bridge Video<\/a>/,
    );
  });

  it("opens share bridge video without inventing a selected card when the library is still on all videos", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      quickAction: "share_bridge_video",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedBridgeVideo).toBeNull();
    expect(markup).toMatch(
      /href="\/leader\?view=feed_analytics&amp;source=bridge_videos"[^>]*>Share Bridge Video<\/a>/,
    );
    expect(markup).not.toMatch(
      /href="\/leader\?view=feed_analytics&amp;source=bridge_videos&amp;bridge=recruitment"[^>]*>Share Bridge Video<\/a>/,
    );
  });

  it("opens submit bridge video as a bridge-library-owned quick-action state before the proof lane", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "bridge_videos",
      bridgeFilter: "comms",
      quickAction: "submit_bridge_video",
    });
    const markup = renderToStaticMarkup(
      createElement(ChapterLeaderCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.activeQuickAction).toBe("submit_bridge_video");
    expect(markup).toContain("Submit Bridge Video");
    expect(markup).toContain("Start from the bridge-video library, then keep the story in the bridge-video lane.");
    expect(markup).toContain("Open bridge-video lane");
    expect(markup).toContain(
      "href=\"/leader?view=bridge_videos&amp;bridge=comms\"",
    );
  });

  it("hides the command center from non-leader personas", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);

    expect(commandCenter.canReadCommandCenter).toBe(false);
    expect(commandCenter.quickActions).toEqual([]);
    expect(commandCenter.leaderboard).toEqual([]);
  });
});

describe("chapter leader command center href", () => {
  it("builds a clean overview href without unnecessary query params", () => {
    expect(buildChapterLeaderCommandCenterHref("overview")).toBe("/leader?view=overview");
    expect(buildChapterLeaderCommandCenterHref("overview", { memberId: "member-zara" })).toBe(
      "/leader?view=overview&member=member-zara",
    );
  });

  it("preserves member-pipeline search and filter state in command-center hrefs", () => {
    expect(
      buildChapterLeaderCommandCenterHref("members", {
        memberId: "member-zara",
        pipelineFilter: "follow_up",
        searchQuery: "Ivy",
      }),
    ).toBe("/leader?view=members&member=member-zara&pipeline=follow_up&q=Ivy");
  });

  it("builds the broader assignment lane href with chapter return context preserved", () => {
    expect(
      buildChapterLeaderAssignmentFlowHref({
        memberId: "member-zara",
        eventCommitteeFilter: "events",
        eventId: "bc-event-moving-mountains-kickoff",
        pipelineFilter: "follow_up",
        searchQuery: "Ivy",
      }),
    ).toBe(
      "/rush-month/actions?source=chapter_assign_action&returnTo=%2Fleader%3Fview%3Devents%26member%3Dmember-zara%26eventCommittee%3Devents%26event%3Dbc-event-moving-mountains-kickoff%26pipeline%3Dfollow_up%26q%3DIvy%26quickAction%3Dassign_action&member=member-zara",
    );
    expect(
      buildChapterLeaderAssignmentFlowHref({
        memberId: "member-zara",
        pipelineFilter: "follow_up",
        searchQuery: "Ivy",
      }),
    ).toBe(
      "/rush-month/actions?source=chapter_assign_action&returnTo=%2Fleader%3Fview%3Dmembers%26member%3Dmember-zara%26pipeline%3Dfollow_up%26q%3DIvy%26quickAction%3Dassign_action&member=member-zara",
    );
    expect(
      buildChapterLeaderAssignmentFlowHref({
        source: "leaderboard",
        memberId: "member-zara",
        bestPracticeChapterId: "leaderboard-mcgill",
        leaderboardMetric: "attendance",
        leaderboardRegion: "canada",
        eventCommitteeFilter: "events",
        eventId: "bc-event-moving-mountains-kickoff",
      }),
    ).toBe(
      "/rush-month/actions?source=chapter_assign_action&returnTo=%2Fleader%3Fview%3Devents%26source%3Dleaderboard%26member%3Dmember-zara%26eventCommittee%3Devents%26event%3Dbc-event-moving-mountains-kickoff%26leaderboardMetric%3Dattendance%26region%3Dcanada%26benchmark%3Dleaderboard-mcgill%26quickAction%3Dassign_action&member=member-zara",
    );
  });

  it("builds the broader event lane href with chapter return context preserved", () => {
    expect(
      buildChapterLeaderEventFlowHref({
        memberId: "member-zara",
        eventCommitteeFilter: "events",
        quickAction: "create_event",
      }),
    ).toBe(
      "/rush-month/events?source=chapter_create_event&returnTo=%2Fleader%3Fview%3Devents%26member%3Dmember-zara%26eventCommittee%3Devents%26quickAction%3Dcreate_event",
    );
    expect(
      buildChapterLeaderEventFlowHref({
        memberId: "member-zara",
        eventCommitteeFilter: "events",
        eventId: "bc-event-moving-mountains-kickoff",
      }),
    ).toBe(
      "/rush-month/events/bc-event-moving-mountains-kickoff?source=chapter_event_review&returnTo=%2Fleader%3Fview%3Devents%26member%3Dmember-zara%26eventCommittee%3Devents%26event%3Dbc-event-moving-mountains-kickoff",
    );
  });

  it("builds the committee lane href inside the leader workspace", () => {
    expect(
      buildChapterLeaderCommitteeFlowHref({
        committeeId: "committee-events",
      }),
    ).toBe(
      "/leader?view=committees&committee=committee-events",
    );
  });

  it("uses query state for bridge-video category filters only on the bridge hub route", () => {
    expect(
      buildChapterLeaderCommandCenterHref("bridge_videos", {
        bridgeVideoFilter: "comms",
      }),
    ).toBe("/leader?view=bridge_videos&bridge=comms");
    expect(
      buildChapterLeaderCommandCenterHref("bridge_videos", {
        bridgeVideoFilter: "all",
      }),
    ).toBe("/leader?view=bridge_videos");
    expect(
      buildChapterLeaderCommandCenterHref("feed_analytics", {
        bridgeVideoFilter: "comms",
      }),
    ).toBe("/leader?view=feed_analytics&bridge=comms");
    expect(
      buildChapterLeaderCommandCenterHref("feed_analytics", {
        source: "bridge_videos",
        bridgeVideoFilter: "comms",
      }),
    ).toBe("/leader?view=feed_analytics&source=bridge_videos&bridge=comms");
    expect(
      buildChapterLeaderCommandCenterHref("bridge_videos", {
        source: "impact",
        memberId: "member-ivy",
        impactStoryId: "impact-moving-mountains",
      }),
    ).toBe(
      "/leader?view=bridge_videos&source=impact&member=member-ivy&impactStory=impact-moving-mountains",
    );
  });

  it("uses query state for selected committees only on the committees route", () => {
    expect(
      buildChapterLeaderCommandCenterHref("committees", {
        committeeId: "committee-events",
      }),
    ).toBe("/leader?view=committees&committee=committee-events");
    expect(
      buildChapterLeaderCommandCenterHref("events", {
        committeeId: "committee-events",
      }),
    ).toBe("/leader?view=events");
  });

  it("uses query state for event committee filters only on the events route", () => {
    expect(
      buildChapterLeaderCommandCenterHref("events", {
        eventCommitteeFilter: "recruitment",
      }),
    ).toBe("/leader?view=events&eventCommittee=recruitment");
    expect(
      buildChapterLeaderCommandCenterHref("committees", {
        eventCommitteeFilter: "recruitment",
      }),
    ).toBe("/leader?view=committees");
    expect(
      buildChapterLeaderCommandCenterHref("events", {
        eventCommitteeFilter: "events",
        eventId: "bc-event-moving-mountains-kickoff",
      }),
    ).toBe(
      "/leader?view=events&eventCommittee=events&event=bc-event-moving-mountains-kickoff",
    );
    expect(
      buildChapterLeaderCommandCenterHref("committees", {
        eventId: "bc-event-moving-mountains-kickoff",
      }),
    ).toBe("/leader?view=committees");
    expect(
      buildChapterLeaderCommandCenterHref("member_profile", {
        source: "events",
        memberId: "member-zara",
        eventCommitteeFilter: "events",
        eventId: "bc-event-moving-mountains-kickoff",
      }),
    ).toBe(
      "/leader?view=member_profile&source=events&member=member-zara&eventCommittee=events&event=bc-event-moving-mountains-kickoff",
    );
  });

  it("uses query state for leaderboard metric filters and benchmark handoffs", () => {
    expect(
      buildChapterLeaderCommandCenterHref("leaderboard", {
        leaderboardMetric: "attendance",
      }),
    ).toBe("/leader?view=leaderboard&leaderboardMetric=attendance");
    expect(
      buildChapterLeaderCommandCenterHref("leaderboard", {
        leaderboardMetric: "chapter_health",
      }),
    ).toBe("/leader?view=leaderboard");
    expect(
      buildChapterLeaderCommandCenterHref("feed_analytics", {
        source: "leaderboard",
        bestPracticeChapterId: "leaderboard-ucla",
      }),
    ).toBe("/leader?view=feed_analytics&source=leaderboard&benchmark=leaderboard-ucla");
    expect(
      buildChapterLeaderCommandCenterHref("member_profile", {
        source: "leaderboard",
        memberId: "member-zara",
        leaderboardMetric: "attendance",
        leaderboardRegion: "canada",
      }),
    ).toBe(
      "/leader?view=member_profile&source=leaderboard&member=member-zara&leaderboardMetric=attendance&region=canada",
    );
  });
});
