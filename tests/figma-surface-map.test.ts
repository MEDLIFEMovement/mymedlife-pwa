import { describe, expect, it } from "vitest";

import {
  getChapterLeaderCommandCenter,
} from "@/services/chapter-leader-command-center";
import { getCoachPortfolioReadiness } from "@/services/coach-portfolio-readiness";
import { getCoachSupportNotesWorkspace } from "@/services/coach-support-notes";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberRushMonthCampaignOverview } from "@/services/member-rush-month-campaign-overview";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaffCommandCenter } from "@/services/staff-command-center";
import { getStudentHomeWorkspace } from "@/services/student-home-workspace";
import { getAdminPermissionsWorkspace } from "@/services/admin-permissions-workspace";
import { getSopBuilderWorkspace } from "@/services/sop-builder-workspace";
import {
  getSltTripPrepWorkspace,
  sltTripPrepMobileQuickNavItems,
  sltTripPrepSubnavItems,
} from "@/services/slt-trip-prep-workspace";
import { homeSurfaceJumps } from "@/services/home-role-jumps";

const data = getMockReadOnlyAppData("Testing Figma-backed route and surface map.");

describe("Figma surface map", () => {
  it("keeps the member mobile app wired to the core route family from the prototype", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getStudentHomeWorkspace(actor, data);

    expect(workspace.greeting).toContain("Hi, Sofia");
    expect(workspace.campaign.href).toBe("/campaigns?source=home");
    expect(workspace.campaign.campaignsHref).toBe("/campaigns");
    expect(workspace.startNextAction.href).toBe("/rush-month/actions/member-push?source=home");
    expect(workspace.points.href).toBe("/rush-month/leaderboard");
    expect(workspace.upcomingEvents.map((event) => event.href)).toEqual([
      "/rush-month/events/event-rush-med-talk-001?source=home",
      "/rush-month/events/event-rush-social-001?source=home",
    ]);
    expect(workspace.upcomingEvents.map((event) => event.rsvpLabel)).toEqual([
      "RSVP",
      "RSVP'd",
    ]);
    expect(workspace.assignedActions.every((action) => {
      return action.href.startsWith("/rush-month/actions/");
    })).toBe(true);
    expect(homeSurfaceJumps).toEqual([
      {
        label: "Leader Hub",
        selectedEmail: "leader.a@mymedlife.test",
        helper: "Chapter command center",
        returnTo: "/chapter?view=overview&source=member_home",
      },
      {
        label: "Coach View",
        selectedEmail: "coach@mymedlife.test",
        helper: "Portfolio support view",
        returnTo: "/coach?view=chapters&source=member_home",
      },
      {
        label: "Admin",
        selectedEmail: "admin@mymedlife.test",
        helper: "Admin Console",
        returnTo: "/staff?view=admin&source=member_home",
      },
    ]);
  });

  it("keeps the member campaign clickthrough aligned to the specific Rush Month operating loop", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const overview = getMemberRushMonthCampaignOverview(actor, data);

    expect(overview.campaignName).toBe("Rush Month");
    expect(overview.currentPhaseTitle).toBe("Week 1: Visibility + Lead Capture");
    expect(overview.kpis.map((kpi) => kpi.label)).toEqual([
      "Leads Captured",
      "Intro GBM RSVPs",
      "Follow-ups Done",
      "New Members",
    ]);
    expect(overview.assignedActionsByRole.map((group) => group.roleLabel)).toEqual([
      "General Members",
      "Action Committee Chairs",
      "E-Board",
      "President / VP",
    ]);
    expect(overview.primaryActions).toEqual({
      viewActionsHref: "/rush-month/actions?source=campaigns",
      submitEvidenceHref:
        "/rush-month/actions/share-rush-flyer?step=submit&source=campaigns#submit-evidence",
    });
  });

  it("keeps the chapter leader command center aligned to the clickable leadership views", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);

    expect(commandCenter.viewOptions.map((option) => option.label)).toEqual([
      "Chapter Home",
      "Leaderboard",
      "Member Pipeline",
      "Member Profile",
      "Committees",
      "Events",
      "Impact",
      "Bridge Videos",
      "Succession",
      "Feed Analytics",
    ]);
    expect(commandCenter.quickActions.map((action) => action.label)).toEqual([
      "Create Event",
      "Assign Action",
      "Review Members",
      "Promote Emerging Leader",
      "Share Bridge Video",
    ]);
  });

  it("keeps the staff command center aligned to the eight-screen internal nav from the mockup", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(actor, data, {
      routeBase: "/staff",
      view: "admin",
    });

    expect(commandCenter.viewOptions.map((option) => option.label)).toEqual([
      "Chapters",
      "Campaigns",
      "Proof / UGC",
      "Feed Studio",
      "Feed Analytics",
      "HubSpot",
      "Best Practices",
      "Admin",
    ]);
    expect(commandCenter.selectedView).toBe("admin");
    expect(commandCenter.adminWorkspace.title).toBe("System Health");
    expect(commandCenter.quickActions.map((action) => action.label)).toEqual([
      "Review risk chapters",
      "Open proof queue",
      "Check feed drafts",
      "Open admin health",
    ]);
  });

  it("keeps the staff campaign operations tabs aligned to the Figma command-center campaign family", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(actor, data, {
      routeBase: "/staff",
      view: "campaigns",
      campaign: "rush-month",
    });

    expect(commandCenter.campaignOperations.tabs.map((tab) => tab.name)).toEqual([
      "Rush Month",
      "SLT Promotion",
      "Moving Mountains",
      "Chapter Engagement",
      "Leadership Transition",
      "Grow the Movement",
      "Start a Chapter",
    ]);
  });

  it("keeps the coach route family aligned to its owned overview, campaigns, detail, and notes states", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data, {
      routeBase: "/coach",
    });
    const commandCenter = getStaffCommandCenter(actor, data, {
      routeBase: "/coach",
      view: "chapters",
      chapterId: "chapter-ucsd",
      risk: "high",
    });
    const supportNotes = getCoachSupportNotesWorkspace(actor, data);

    expect(portfolio.campaignsHref).toBe("/coach?view=campaigns");
    expect(portfolio.notesHref).toBe("/coach?view=support_notes#support-notes");
    expect(portfolio.riskReviewHref).toBe("/coach?view=chapter_detail&risk=high");
    expect(portfolio.rows[0]?.detailHref).toBe(
      "/coach?view=chapter_detail&chapter=chapter-ucsd",
    );
    expect(commandCenter.selectedChapter?.chapterName).toBe("UCSD MEDLIFE");
    expect(supportNotes.title).toBe("Coach support notes");
  });

  it("keeps the SLT prep route family aligned to the overview hub and traveler subpages", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getSltTripPrepWorkspace(actor);

    expect(sltTripPrepSubnavItems.map((item) => item.label)).toEqual([
      "Overview",
      "Checklist",
      "Forms",
      "Payments",
      "Flights",
      "Meetings",
      "Extensions",
      "Timeline",
      "Notifications",
      "Profile",
      "Staff",
    ]);
    expect(sltTripPrepMobileQuickNavItems).toEqual([
      { href: "/slt-prep", label: "Home", helper: "Trip" },
      { href: "/slt-prep/checklist", label: "Trip Prep", helper: "Steps" },
      { href: "/slt-prep/timeline", label: "Events", helper: "Dates" },
      { href: "/slt-prep/profile", label: "Profile", helper: "Me" },
    ]);
    expect(workspace.nextStep.href).toBe("/slt-prep/checklist/flight-itinerary?source=overview");
    expect(workspace.notificationActions.map((action) => action.href)).toEqual([
      "/slt-prep/flights",
      "/slt-prep/meetings",
      "/slt-prep/payments",
      "/slt-prep/extensions",
    ]);
  });

  it("keeps the admin backend route family aligned to the packet-required internal lanes", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const permissions = getAdminPermissionsWorkspace(actor);
    const builder = getSopBuilderWorkspace(actor, "rush-month", "steps");

    expect(
      permissions.routeFamilies.find((family) => family.key === "admin_backend")
        ?.routes,
    ).toEqual([
      "/admin",
      "/admin/permissions",
      "/admin/committees",
      "/admin/workflows",
      "/admin/sop-library",
      "/admin/sop-builder/rush-month?tab=steps",
    ]);
    expect(builder.tabs.map((tab) => tab.href)).toContain(
      "/admin/sop-builder/rush-month?tab=version",
    );
  });
});
