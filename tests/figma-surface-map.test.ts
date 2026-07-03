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
    expect(workspace.startNextAction.href).toBe("/app/events?source=home");
    expect(workspace.points.href).toBe("/app/points");
    expect(workspace.upcomingEvents.map((event) => event.href)).toEqual([
      "/app/events/chapter-event-ucla-kickoff?source=home",
    ]);
    expect(workspace.upcomingEvents.map((event) => event.rsvpLabel)).toEqual(["RSVP'd"]);
    expect(workspace.assignedActions.map((action) => action.href)).toEqual([
      "/app/events?source=home",
      "/app/events?source=home",
      "/app/points?source=points",
    ]);
    expect(homeSurfaceJumps).toEqual([
      {
        label: "Leader Hub",
        selectedEmail: "leader.a@mymedlife.test",
        helper: "Student leadership command center",
        returnTo: "/leader?view=overview&source=member_home",
      },
      {
        label: "Staff View",
        selectedEmail: "coach@mymedlife.test",
        helper: "Staff command center",
        returnTo: "/staff?view=chapters&source=member_home",
      },
      {
        label: "Admin",
        selectedEmail: "admin@mymedlife.test",
        helper: "Admin Console",
        returnTo: "/admin?source=member_home",
      },
    ]);
  });

  it("keeps the member campaign clickthrough aligned to the specific Rush Month operating loop", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const overview = getMemberRushMonthCampaignOverview(actor, data);

    expect(overview.campaignName).toBe("Rush Month");
    expect(overview.currentPhaseTitle).toBe("Planning: Make MEDLIFE visible on campus");
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
    expect(overview.whatGoodLooksLike.items).toEqual([
      "Assignment can move to in progress",
      "Proof requirements are visible before submission",
      "Points surface stays in the same loop",
      "Story or outcome proof stays metadata-first",
      "Leader review confirms chapter completion",
    ]);
    expect(overview.primaryActions).toEqual({
      openEventsHref: "/app/events?source=campaigns",
      openPointsHref: "/app/points?source=campaigns",
    });
  });

  it("keeps the chapter leader command center aligned to the launch-mode leadership views", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data);

    expect(commandCenter.viewOptions.map((option) => option.label)).toEqual([
      "Chapter Home",
      "Events",
      "Leaderboard",
    ]);
    expect(commandCenter.quickActions.map((action) => action.label)).toEqual([
      "Create Event",
      "Confirm Attendance",
      "Review Members",
      "Review Leaderboard",
    ]);
  });

  it("keeps the staff command center aligned to the launch-mode command-center route options", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(actor, data, {
      routeBase: "/staff",
      view: "admin",
    });

    expect(commandCenter.viewOptions.map((option) => option.label)).toEqual([
      "Chapters",
      "Events",
      "Leaderboard",
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
      "/admin/phase-2",
      "/admin/review-path",
      "/admin/nick-review",
      "/admin/release-readiness",
      "/admin/launch-gate",
      "/admin/audit-log",
      "/admin/integration-outbox",
      "/admin/master-data",
      "/admin/database-security",
      "/admin/system-health",
      "/admin/design-qa",
      "/admin/operations",
      "/admin/first-write",
      "/admin/write-sequence",
      "/admin/proof-write",
      "/admin/hq-proof-write",
      "/admin/assignment-write",
      "/admin/coach-write",
      "/admin/pilot-scope",
      "/admin/staff-dry-run",
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
