import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { StaffCommandCenterPanel } from "@/components/staff-command-center-panel";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaffCommandCenter } from "@/services/staff-command-center";

describe("staff command center", () => {
  const data = getMockReadOnlyAppData("Mock staff review");

  it("allows coach, admin, and super admin to read the staff surface", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(getStaffCommandCenter(coach, data).canReadCommandCenter).toBe(true);
    expect(getStaffCommandCenter(coach, data).title).toBe("Coach Command Center");
    expect(getStaffCommandCenter(admin, data).canReadCommandCenter).toBe(true);
    expect(getStaffCommandCenter(admin, data).title).toBe("Staff Command Center");
    expect(getStaffCommandCenter(superAdmin, data).canReadCommandCenter).toBe(true);
    expect(getStaffCommandCenter(superAdmin, data).title).toBe("Staff Command Center");
    expect(getStaffCommandCenter(admin, data).viewOptions.map((item) => item.label)).toEqual([
      "Chapters",
      "Events",
      "Leaderboard",
      "Campaigns",
      "Proof / UGC",
      "Feed Studio",
      "Feed Analytics",
      "HubSpot",
      "Best Practices",
      "Campaign SOPs",
      "Admin",
    ]);
  });

  it("keeps the default staff nav neutral when campaign context was not explicitly chosen", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "chapters",
    });

    expect(commandCenter.selectedCampaignSlug).toBe("rush-month");
    expect(commandCenter.viewOptions.find((item) => item.key === "chapters")?.href).toBe(
      "/staff?view=chapters",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "events")?.href).toBe(
      "/staff?view=events",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "leaderboard")?.href).toBe(
      "/staff?view=leaderboard",
    );
  });

  it("keeps the route hidden from member-facing roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getStaffCommandCenter(member, data).canReadCommandCenter).toBe(false);
    expect(getStaffCommandCenter(committeeChair, data).canReadCommandCenter).toBe(false);
    expect(getStaffCommandCenter(leader, data).canReadCommandCenter).toBe(false);
    expect(getStaffCommandCenter(dsAdmin, data).canReadCommandCenter).toBe(false);
  });

  it("keeps coach command-center links inside the coach route", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const commandCenter = getStaffCommandCenter(coach, data, {
      routeBase: "/coach",
      view: "chapters",
      chapterId: "chapter-ucsd",
      country: "usa",
      risk: "high",
      proof: "proof-uc-berkeley-rush-video",
      proofQueue: "pending",
      proofType: "proof_video",
      feedDraft: "proof-florida-event-recap-feed",
      feedPost: "feed-post-faith-story",
      hubspotChapter: "hubspot-yale",
      feedAudience: "selected_chapters",
      feedRole: "leader",
    });

    expect(commandCenter.routeBase).toBe("/coach");
    expect(commandCenter.closeChapterHref.startsWith("/coach?")).toBe(true);
    expect(commandCenter.viewOptions.every((item) => item.href.startsWith("/coach"))).toBe(true);
    expect(commandCenter.quickActions.every((item) => item.href.startsWith("/coach"))).toBe(true);
    expect(commandCenter.chapterRows.every((row) => row.detailHref.startsWith("/coach"))).toBe(true);
    expect(commandCenter.selectedChapter?.closeHref.startsWith("/coach?") ?? true).toBe(true);
    expect(
      commandCenter.selectedProofReview?.requestChangesHref.startsWith("/coach?") ?? true,
    ).toBe(true);
    expect(commandCenter.feedStudio.audienceOptions[0]?.href.startsWith("/coach?")).toBe(true);
    expect(commandCenter.feedAnalytics.posts[0]?.selectHref.startsWith("/coach?")).toBe(true);
    expect(commandCenter.hubspotWorkspace.chapterOptions[0]?.href.startsWith("/coach?")).toBe(
      true,
    );
  });

  it("filters portfolio rows by risk and search query", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const highRisk = getStaffCommandCenter(admin, data, { risk: "high" });
    const yale = getStaffCommandCenter(admin, data, {
      query: "Yale",
      view: "chapters",
    });
    const usaRush = getStaffCommandCenter(admin, data, {
      view: "chapters",
      country: "usa",
      portfolioCampaign: "rush_month",
    });

    expect(highRisk.chapterRows).toHaveLength(3);
    expect(highRisk.chapterRows.map((row) => row.chapterName)).toContain(
      "UNMSM Lima",
    );
    expect(highRisk.chapterRows.map((row) => row.chapterName)).toContain(
      "University of Ghana",
    );
    expect(yale.chapterRows).toHaveLength(1);
    expect(yale.chapterRows[0]?.chapterName).toBe("Yale University");
    expect(usaRush.chapterRows.every((row) => row.country === "USA")).toBe(true);
    expect(usaRush.chapterRows.every((row) => row.campaignName === "Rush Month")).toBe(true);
  });

  it("keeps the default portfolio state on the table until a chapter is explicitly selected", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "chapters",
    });

    expect(commandCenter.selectedChapterId).toBeNull();
    expect(commandCenter.selectedChapter).toBeNull();
    expect(commandCenter.portfolioCampaignViewHref).toBe(
      "/staff?view=campaigns&campaign=rush-month&source=portfolio_overview",
    );
    expect(commandCenter.portfolioBestPracticesViewHref).toBe(
      "/staff?view=best_practices&campaign=rush-month&source=portfolio_overview",
    );
    expect(commandCenter.closeChapterHref).toBe("/staff?view=chapters&campaign=rush-month");
  });

  it("selects the chapter drawer from the route state", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      chapterId: "chapter-yale",
      view: "chapters",
      risk: "medium",
      country: "usa",
      coach: "james",
      portfolioCampaign: "rush_month",
      query: "Yale",
      decision: "intervene",
    });

    expect(commandCenter.selectedChapter?.chapterName).toBe("Yale University");
    expect(commandCenter.selectedChapter?.closeHref).toBe(
      "/staff?view=chapters&campaign=rush-month&risk=medium&country=usa&coach=james&portfolioCampaign=rush_month&q=Yale",
    );
    const proofQueueHref = commandCenter.selectedChapter?.quickLinks.find(
      (item) => item.label === "Open proof queue",
    )?.href;
    const feedStudioHref = commandCenter.selectedChapter?.quickLinks.find(
      (item) => item.label === "Open feed studio",
    )?.href;
    const hubspotHref = commandCenter.selectedChapter?.quickLinks.find(
      (item) => item.label === "Open HubSpot view",
    )?.href;

    expect(proofQueueHref).toBe(
      "/staff?view=proof_ugc&campaign=rush-month&risk=medium&country=usa&coach=james&portfolioCampaign=rush_month&q=Yale&chapter=chapter-yale&decision=intervene&proofQueue=pending",
    );
    expect(feedStudioHref).toContain("/staff?view=feed_studio&campaign=rush-month");
    expect(feedStudioHref).toContain("risk=medium");
    expect(feedStudioHref).toContain("country=usa");
    expect(feedStudioHref).toContain("coach=james");
    expect(feedStudioHref).toContain("portfolioCampaign=rush_month");
    expect(feedStudioHref).toContain("q=Yale");
    expect(feedStudioHref).toContain("chapter=chapter-yale");
    expect(feedStudioHref).toContain("decision=intervene");
    expect(feedStudioHref).toContain("feedRole=leader");
    expect(feedStudioHref).toContain("feedAudience=one_chapter");
    expect(hubspotHref).toBe(
      "/staff?view=hubspot&campaign=rush-month&risk=medium&country=usa&coach=james&portfolioCampaign=rush_month&q=Yale&chapter=chapter-yale&decision=intervene&hubspotChapter=hubspot-yale",
    );
    expect(commandCenter.portfolioBestPracticesViewHref).toContain("chapter=chapter-yale");
    expect(commandCenter.portfolioBestPracticesViewHref).toContain("decision=intervene");
    expect(commandCenter.viewOptions.find((item) => item.key === "events")?.href).toContain(
      "chapter=chapter-yale",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "events")?.href).toContain(
      "decision=intervene",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "leaderboard")?.href).toContain(
      "decision=intervene",
    );
  });

  it("supports a mock-safe decision preview inside the chapter drawer without writing anything", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      chapterId: "chapter-yale",
      view: "chapters",
      decision: "intervene",
      country: "usa",
      portfolioCampaign: "rush_month",
    });

    expect(commandCenter.selectedChapter?.selectedDecision).toBe("intervene");
    expect(commandCenter.selectedChapter?.campaignKpis).toHaveLength(8);
    expect(commandCenter.selectedChapter?.hubspotPanel.title).toBe("HubSpot CRM");
    expect(commandCenter.selectedChapter?.lumaPanel.title).toBe("Luma Events");
    expect(commandCenter.selectedChapter?.activityPanel.title).toBe("Feed & myMEDLIFE Activity");
    expect(
      commandCenter.selectedChapter?.decisionOptions.find((item) => item.key === "intervene")?.href,
    ).toContain("decision=intervene");
    expect(commandCenter.selectedChapter?.footerActions[0]?.label).toBe("Assign Intervention");
    expect(commandCenter.selectedChapter?.footerActions[1]?.label).toBe("Open Proof Queue");
    expect(commandCenter.selectedChapter?.recommendedDecision).toBe("Hold");
  });

  it("changes drawer footer actions with the selected decision posture", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const holdCenter = getStaffCommandCenter(admin, data, {
      chapterId: "chapter-yale",
      view: "chapters",
    });
    const advanceCenter = getStaffCommandCenter(admin, data, {
      chapterId: "chapter-florida",
      view: "chapters",
    });

    expect(holdCenter.selectedChapter?.selectedDecision).toBe("hold");
    expect(holdCenter.selectedChapter?.footerActions.map((action) => action.label)).toEqual([
      "Open Proof Queue",
      "Open HubSpot View",
    ]);
    expect(advanceCenter.selectedChapter?.selectedDecision).toBe("advance");
    expect(advanceCenter.selectedChapter?.footerActions.map((action) => action.label)).toEqual([
      "Advance Chapter",
      "Send Coach Packet",
    ]);
  });

  it("builds proof, hubspot, and outbox summaries from the mock-safe data model", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "proof_ugc",
      proof: "proof-uc-berkeley-rush-video",
    });

    expect(commandCenter.selectedProofId).toBe("proof-uc-berkeley-rush-video");
    expect(commandCenter.selectedProofReview?.title).toContain("UC Berkeley");
    expect(commandCenter.proofReviewItems.some((item) => item.visibilityLabel === "No Consent")).toBe(
      true,
    );
    expect(commandCenter.hubspotSignals.some((item) => item.title.includes("HubSpot"))).toBe(
      true,
    );
    expect(commandCenter.outboxSummary).toMatchObject({
      total: 4,
      disabled: 1,
      mocked: 3,
      hubspot: 1,
      luma: 1,
      n8n: 1,
      warehouse: 1,
    });
  });

  it("keeps the proof queue review panel empty until a content card is explicitly selected", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "proof_ugc",
    });

    expect(commandCenter.selectedProofId).toBeNull();
    expect(commandCenter.selectedProofReview).toBeNull();
  });

  it("preserves staff portfolio filters in route state for chapter drill-in and cross-view links", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "chapters",
      risk: "medium",
      country: "usa",
      coach: "james",
      portfolioCampaign: "rush_month",
      query: "Yale",
    });

    expect(commandCenter.countryFilter).toBe("usa");
    expect(commandCenter.coachFilter).toBe("james");
    expect(commandCenter.portfolioCampaignFilter).toBe("rush_month");
    expect(commandCenter.riskFilter).toBe("medium");
    expect(commandCenter.chapterRows[0]?.detailHref).toContain("country=usa");
    expect(commandCenter.chapterRows[0]?.detailHref).toContain("coach=james");
    expect(commandCenter.chapterRows[0]?.detailHref).toContain("portfolioCampaign=rush_month");
    expect(commandCenter.viewOptions.find((item) => item.key === "events")?.href).toContain(
      "country=usa",
    );
    expect(commandCenter.quickActions.find((item) => item.label === "Open proof queue")?.href).toContain(
      "country=usa",
    );
    expect(commandCenter.quickActions.find((item) => item.label === "Open proof queue")?.href).toContain(
      "coach=james",
    );
    expect(commandCenter.quickActions.find((item) => item.label === "Open proof queue")?.href).toContain(
      "portfolioCampaign=rush_month",
    );
    expect(commandCenter.quickActions.find((item) => item.label === "Open proof queue")?.href).toContain(
      "q=Yale",
    );
  });

  it("filters the proof queue and preserves selected proof review state in the route", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "proof_ugc",
      proofQueue: "selected",
      proofType: "bridge_video",
      proof: "proof-unam-bridge-video",
    });

    expect(commandCenter.proofQueueFilter).toBe("selected");
    expect(commandCenter.proofTypeFilter).toBe("bridge_video");
    expect(commandCenter.proofReviewItems).toHaveLength(1);
    expect(commandCenter.proofReviewItems[0]?.chapterLabel).toBe("UNAM Mexico City");
    expect(commandCenter.selectedProofReview?.recommendedUse).toBe(
      "Use this in selected chapter onboarding and mission-belief moments.",
    );
    expect(commandCenter.selectedProofReview?.approvalOptions.find((item) => item.key === "global_public")?.enabled).toBe(false);
    expect(commandCenter.proofQueueFilters.find((item) => item.key === "selected")?.href).toContain(
      "proofType=bridge_video",
    );
    expect(commandCenter.selectedProofReview?.bestPracticeHref).toContain(
      "/staff?view=best_practices&campaign=rush-month&source=proof_review",
    );
    expect(commandCenter.selectedProofReview?.bestPracticeHref).toContain(
      "proof=proof-unam-bridge-video",
    );
    expect(commandCenter.selectedProofReview?.bestPracticeHref).toContain(
      "proofQueue=selected",
    );
    expect(commandCenter.selectedProofReview?.bestPracticeHref).toContain(
      "proofType=bridge_video",
    );
  });

  it("builds a route-driven feed studio workspace from the selected draft and audience state", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "feed_studio",
      proofQueue: "selected",
      proofType: "bridge_video",
      proof: "proof-unam-bridge-video",
      feedDraft: "proof-unam-bridge-video-feed",
      feedRole: "leader",
      feedAudience: "selected_chapters",
    });

    expect(commandCenter.feedStudio.selectedDraft?.chapterLabel).toBe("UNAM Mexico City");
    expect(commandCenter.feedStudio.sourceContext).toMatchObject({
      eyebrow: "Proof review source",
      title: "Opened from a reviewed content item",
      actionLabel: "Return to proof queue",
      actionHref:
        "/staff?view=proof_ugc&campaign=rush-month&proofQueue=selected&proofType=bridge_video&proof=proof-unam-bridge-video",
    });
    expect(commandCenter.feedStudio.previewRole).toBe("leader");
    expect(commandCenter.feedStudio.audienceMode).toBe("selected_chapters");
    expect(commandCenter.feedStudio.audienceOptions.find((item) => item.key === "all_chapters")?.href).toContain(
      "feedRole=leader",
    );
    expect(commandCenter.feedDrafts.find((item) => item.id === "proof-unam-bridge-video-feed")?.sourceHref).toContain(
      "feedAudience=selected_chapters",
    );
  });

  it("builds a route-driven feed analytics workspace with a selected post impact panel", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "feed_analytics",
      feedDraft: "proof-florida-event-recap-feed",
      feedRole: "leader",
      feedAudience: "selected_chapters",
      feedPost: "feed-post-faith-story",
    });

    expect(commandCenter.selectedFeedPostId).toBe("feed-post-faith-story");
    expect(commandCenter.feedAnalytics.sourceContext).toMatchObject({
      eyebrow: "Feed Studio source",
      title: "Opened from a curation draft",
      actionLabel: "Return to Feed Studio",
      actionHref:
        "/staff?view=feed_studio&campaign=rush-month&feedDraft=proof-florida-event-recap-feed&feedPost=feed-post-faith-story&feedRole=leader&feedAudience=selected_chapters",
    });
    expect(commandCenter.feedAnalytics.selectedPost?.title).toBe(
      "Faith's story — why community health matters",
    );
    expect(commandCenter.feedAnalytics.summaryCards[0]?.value).toBe("12,630");
    expect(commandCenter.feedAnalytics.posts[1]?.selectHref).toContain(
      "feedAudience=selected_chapters",
    );
    expect(commandCenter.feedAnalytics.posts[1]?.selectHref).toContain("feedRole=leader");
    expect(commandCenter.feedAnalytics.selectedPost?.impactMetrics[0]?.value).toBe(
      "41 actions",
    );
    expect(commandCenter.feedAnalytics.selectedPost?.topEngagement[0]).toMatchObject({
      chapterLabel: "University of Nairobi",
      actionLabel: "Open chapter",
      href:
        "/staff?view=chapters&campaign=rush-month&chapter=chapter-nairobi&feedDraft=proof-florida-event-recap-feed&feedPost=feed-post-faith-story&feedRole=leader&feedAudience=selected_chapters",
    });
    expect(commandCenter.feedAnalytics.selectedPost?.lowEngagement[0]).toMatchObject({
      chapterLabel: "University of Ghana",
      actionLabel: "Open member review",
      href:
        "/staff?view=chapters&campaign=rush-month&chapter=chapter-ghana&decision=intervene&feedDraft=proof-florida-event-recap-feed&feedPost=feed-post-faith-story&feedRole=leader&feedAudience=selected_chapters",
    });
  });

  it("leaves feed analytics in the overview state until a post is selected", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "feed_analytics",
    });

    expect(commandCenter.selectedFeedPostId).toBeNull();
    expect(commandCenter.feedAnalytics.selectedPost).toBeNull();
    expect(commandCenter.feedAnalytics.posts[0]?.selectHref).toContain(
      "feedPost=feed-post-stanford-leads",
    );
    expect(commandCenter.quickActions.every((item) => !item.href.includes("feedDraft="))).toBe(true);
    expect(commandCenter.quickActions.every((item) => !item.href.includes("feedRole="))).toBe(true);
    expect(commandCenter.quickActions.every((item) => !item.href.includes("feedAudience="))).toBe(
      true,
    );
    expect(commandCenter.viewOptions.every((item) => !item.href.includes("feedDraft="))).toBe(true);
    expect(commandCenter.viewOptions.every((item) => !item.href.includes("feedRole="))).toBe(true);
    expect(commandCenter.viewOptions.every((item) => !item.href.includes("feedAudience="))).toBe(
      true,
    );
    expect(commandCenter.viewOptions.every((item) => !item.href.includes("hubspotChapter="))).toBe(
      true,
    );
  });

  it("builds a route-driven HubSpot workspace with chapter selection and warning state", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "hubspot",
      chapterId: "chapter-yale",
      risk: "medium",
      country: "usa",
      coach: "james",
      portfolioCampaign: "rush_month",
      query: "Yale",
      decision: "intervene",
      hubspotChapter: "hubspot-pucp",
      feedPost: "feed-post-faith-story",
    });

    expect(commandCenter.selectedHubSpotChapterId).toBe("hubspot-pucp");
    expect(commandCenter.hubspotWorkspace.sourceContext).toMatchObject({
      eyebrow: "Portfolio source",
      title: "Opened from the chapter portfolio",
      actionLabel: "Return to chapter portfolio",
      actionHref:
        "/staff?view=chapters&campaign=rush-month&risk=medium&country=usa&coach=james&portfolioCampaign=rush_month&q=Yale&chapter=chapter-yale&decision=intervene",
    });
    expect(commandCenter.hubspotWorkspace.selectedChapterLabel).toBe("PUCP Lima");
    expect(commandCenter.hubspotWorkspace.warningLabel).toBe(
      "Leads captured but low follow-up rate",
    );
    expect(commandCenter.hubspotWorkspace.crmProfileMetrics.find((item) => item.label === "Owner")?.value).toBe(
      "Carlos",
    );
    expect(commandCenter.hubspotWorkspace.matchedActivityMetrics[0]).toMatchObject({
      label: "Attended Event",
      current: 14,
      total: 22,
    });
    expect(commandCenter.hubspotWorkspace.chapterOptions[0]?.href).toContain(
      "feedPost=feed-post-faith-story",
    );
  });

  it("filters the best practices library by campaign and country", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "best_practices",
      practiceCampaign: "moving_mountains",
      practiceCountry: "mexico",
    });

    expect(commandCenter.bestPracticeCards).toHaveLength(1);
    expect(commandCenter.bestPracticeCards[0]?.title).toBe(
      "'Why I Travel' Bridge Video Campaign",
    );
    expect(commandCenter.bestPracticeCards[0]?.shareHref).toContain("view=feed_studio");
    expect(commandCenter.bestPracticeCards[0]?.shareHref).toContain(
      "bestPractice=practice-why-i-travel",
    );
    expect(
      commandCenter.bestPracticeCampaignFilters.find((item) => item.key === "moving_mountains")
        ?.href,
    ).toContain("practiceCountry=mexico");
  });

  it("keeps the best-practices library attached to the portfolio-overview coach-brief handoff", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "best_practices",
      source: "portfolio_overview",
      risk: "medium",
      country: "usa",
      coach: "james",
      portfolioCampaign: "rush_month",
      query: "Yale",
    });

    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Portfolio overview source",
      title: "Opened from the chapter portfolio",
    });
    expect(commandCenter.bestPracticeCountryFilters[1]?.href).toContain(
      "source=portfolio_overview",
    );
    expect(commandCenter.bestPracticeCards[0]?.shareHref).toContain(
      "source=portfolio_overview",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "leaderboard")?.href).toContain(
      "source=portfolio_overview",
    );
    expect(commandCenter.viewOptions.find((item) => item.key === "events")?.href).toContain(
      "source=portfolio_overview",
    );
  });

  it("keeps the best-practices library attached to the proof-review handoff", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "best_practices",
      source: "proof_review",
      proofQueue: "selected",
      proofType: "bridge_video",
      proof: "proof-unam-bridge-video",
      practiceCampaign: "moving_mountains",
      practiceCountry: "mexico",
    });

    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Proof review source",
      title: "Opened from proof review",
      actions: [
        {
          label: "Return to proof queue",
          href:
            expect.stringContaining("/staff?view=proof_ugc&campaign=rush-month&proofQueue=selected&proofType=bridge_video"),
        },
      ],
    });
    expect(commandCenter.sourceContext?.actions?.[0]?.href).toContain("proof=proof-unam-bridge-video");
    expect(commandCenter.bestPracticeCountryFilters[0]?.href).toContain("source=proof_review");
    expect(commandCenter.bestPracticeCountryFilters[0]?.href).toContain(
      "proof=proof-unam-bridge-video",
    );
    expect(commandCenter.bestPracticeCards[0]?.shareHref).toContain("source=proof_review");
  });

  it("keeps the member-home admin handoff attached to the admin-owned view", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "admin",
      source: "member_home",
    });

    expect(commandCenter.selectedView).toBe("admin");
    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Member app handoff",
      title: "Opened from UCLA MEDLIFE into Admin Console",
    });
    expect(commandCenter.sourceContext?.actions?.[0]).toMatchObject({
      label: "View integration events",
      href: "/staff?view=admin&source=member_home#integration-status",
    });
    expect(commandCenter.adminWorkspace.handoffSummaryCards.map((card) => card.label)).toEqual([
      "Total Chapters",
      "Active Users",
      "Campaigns Running",
      "Automation Jobs",
    ]);
    expect(commandCenter.adminWorkspace.handoffConsoleCards.map((lane) => lane.title)).toEqual([
      "User & Role Management",
      "Portfolio Management",
      "Campaign Templates",
      "Audit Logs",
      "Automation Outbox (n8n)",
      "Stakeholder Review Path",
      "Nick Review Packet",
      "Release Readiness",
      "Production Launch Gate",
      "Production Operations",
    ]);
    expect(commandCenter.viewOptions.find((item) => item.key === "chapters")?.href).toContain(
      "source=member_home",
    );
  });

  it("keeps the member-home coach handoff attached to coach-owned follow-up routes", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const commandCenter = getStaffCommandCenter(coach, data, {
      view: "chapters",
      source: "member_home",
    });

    expect(commandCenter.selectedView).toBe("chapters");
    expect(commandCenter.sourceContext).toMatchObject({
      eyebrow: "Member app handoff",
      title: "Opened from UCLA MEDLIFE into Staff Command Center",
    });
    expect(commandCenter.sourceContext?.actions?.[0]).toMatchObject({
      label: "Open chapter",
      href: "/staff?view=chapter_detail&source=member_home&chapter=chapter-northview",
    });
    expect(commandCenter.sourceContext?.actions?.[1]).toMatchObject({
      label: "Write coach note",
      href: "/staff?view=support_notes&source=member_home#support-notes",
    });
    expect(commandCenter.sourceContext?.actions?.[2]).toMatchObject({
      label: "Review risk reports",
      href: "/staff?view=chapters&source=member_home&risk=high",
    });
  });

  it("preserves the selected best-practice card when staff opens Feed Studio from the library", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "feed_studio",
      bestPractice: "practice-why-i-travel",
      practiceCampaign: "moving_mountains",
      practiceCountry: "mexico",
    });

    expect(commandCenter.selectedBestPracticeId).toBe("practice-why-i-travel");
    expect(commandCenter.feedStudio.sourceContext).toMatchObject({
      eyebrow: "Best practice source",
      title: "Opened from the best-practice library",
      actionLabel: "Return to best practices",
      actionHref:
        "/staff?view=best_practices&campaign=rush-month&bestPractice=practice-why-i-travel&practiceCountry=mexico&practiceCampaign=moving_mountains",
    });
    expect(commandCenter.feedStudio.sourceContext?.summary).toContain(
      "'Why I Travel' Bridge Video Campaign",
    );
    expect(commandCenter.feedStudio.sourceContext?.summary).toContain("UNAM Mexico City");
  });

  it("keeps the best-practice share flow attached to the portfolio-overview handoff", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "feed_studio",
      source: "portfolio_overview",
      bestPractice: "practice-why-i-travel",
      practiceCampaign: "moving_mountains",
      practiceCountry: "mexico",
      risk: "medium",
      country: "usa",
      coach: "james",
      portfolioCampaign: "rush_month",
      query: "Yale",
    });

    expect(commandCenter.feedStudio.sourceContext).toMatchObject({
      eyebrow: "Best practice source",
      actionHref:
        "/staff?view=best_practices&campaign=rush-month&source=portfolio_overview&risk=medium&country=usa&coach=james&portfolioCampaign=rush_month&q=Yale&bestPractice=practice-why-i-travel&practiceCountry=mexico&practiceCampaign=moving_mountains",
    });
  });

  it("builds the admin system health workspace from the mock-safe review map", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "admin",
    });

    expect(commandCenter.adminWorkspace.title).toBe("System Health");
    expect(commandCenter.adminWorkspace.integrationStatuses).toHaveLength(6);
    expect(commandCenter.adminWorkspace.integrationStatuses[3]).toMatchObject({
      title: "Power BI Reports",
      status: "degraded",
      note: "Refresh token expiring soon",
    });
    expect(commandCenter.adminWorkspace.failedCount).toBe(2);
    expect(commandCenter.adminWorkspace.retryFailedHref).toBe("/admin/integration-outbox");
    expect(commandCenter.adminWorkspace.backendLanes.map((lane) => lane.title)).toEqual([
      "Permission Registry",
      "Workflow Registry",
      "Committee Registry",
      "SOP Library",
      "Design QA",
      "Pilot Scope",
    ]);
    expect(commandCenter.adminWorkspace.outboxRows[2]).toMatchObject({
      eventLabel: "evidence.approved",
      status: "failed",
      retries: 3,
      errorLabel: "503 Service Unavailable",
    });
    expect(commandCenter.adminWorkspace.auditRows[2]).toMatchObject({
      actorLabel: "admin@medlife.org",
      roleLabel: "Admin",
      actionLabel: "Shared post to 28 chapters",
      chapterLabel: "Global",
    });
  });

  it("renders the admin screen with the tighter system-health hierarchy from the mockup", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "admin",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain(">System Health</h1>");
    expect(html).toContain("System health: 5 of 6 integrations active");
    expect(html).toContain("Event and points pulse");
    expect(html).toContain("Integration Status");
    expect(html).toContain("Automation Outbox");
    expect(html).toContain("Audit Log");
    expect(html).not.toContain("Portfolio chapters");
    expect(html).not.toContain("HubSpot posture");
    expect(html).not.toContain("Why this admin surface is still safe to review");
    expect(html).not.toContain("What is healthy, degraded, or mock-safe?");
    expect(html).not.toContain("What is reviewable before writes are approved?");
  });

  it("renders the member-home admin handoff with the figma-aligned admin console cards", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "admin",
      source: "member_home",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain("Total Chapters");
    expect(html).toContain("Active Users");
    expect(html).toContain("Campaigns Running");
    expect(html).toContain("Automation Jobs");
    expect(html).toContain("User &amp; Role Management");
    expect(html).toContain("Portfolio Management");
    expect(html).toContain("Campaign Templates");
    expect(html).toContain("Audit Logs");
    expect(html).toContain("Automation Outbox (n8n)");
    expect(html).toContain("Integration Status");
    expect(html).not.toContain("Permission Registry");
    expect(html).not.toContain("Committee Registry");
  });

  it("renders the chapters view with no drawer by default and an overlay drawer when selected", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const defaultCenter = getStaffCommandCenter(admin, data, {
      view: "chapters",
    });
    const selectedCenter = getStaffCommandCenter(admin, data, {
      view: "chapters",
      chapterId: "chapter-yale",
    });

    const defaultHtml = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter: defaultCenter }),
    );
    const selectedHtml = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter: selectedCenter }),
    );

    expect(defaultHtml).toContain("Portfolio Overview");
    expect(defaultHtml).toContain("Luma, RSVP, attendance, and points should stay visible together.");
    expect(defaultHtml).toContain("Luma calendar");
    expect(defaultHtml).toContain("Next event");
    expect(defaultHtml).toContain("RSVPs");
    expect(defaultHtml).toContain("Attendance");
    expect(defaultHtml).toContain("Points");
    expect(defaultHtml).toContain("UCLA MEDLIFE");
    expect(defaultHtml).toContain("UCLA chapter calendar");
    expect(defaultHtml).not.toContain("Evidence Pending");
    expect(defaultHtml).not.toContain("HubSpot Tasks");
    expect(defaultHtml).not.toContain('aria-label="Risk filter"');
    expect(defaultHtml).not.toContain('aria-label="Country filter"');
    expect(defaultHtml).not.toContain('aria-label="Campaign filter"');
    expect(defaultHtml).not.toContain('aria-label="Coach filter"');
    expect(defaultHtml).toContain("Healthy");
    expect(defaultHtml).toContain("No RSVPs");
    expect(defaultHtml).toContain("Low attendance");
    expect(defaultHtml).toContain(">Open Events<");
    expect(defaultHtml).toContain(">Open Leaderboard<");
    expect(defaultHtml).not.toContain('type="submit"');
    expect(defaultHtml).not.toContain("Command center nav");
    expect(defaultHtml).not.toContain("Evidence ⏳");
    expect(defaultHtml).not.toContain("Last Active");
    expect(defaultHtml).not.toContain("Which support signals are moving across the portfolio?");
    expect(defaultHtml).not.toContain("Live rows");
    expect(defaultHtml).not.toContain("Scan chapter health, open the drawer, and move support where risk is rising.");
    expect(defaultHtml).not.toContain("Close chapter detail drawer");
    expect(selectedHtml).toContain("Close chapter detail drawer");
    expect(selectedHtml).not.toContain("Hold posture selected");
    expect(selectedHtml).not.toContain("Recommended move: Hold");
    expect(selectedHtml).not.toContain("Selected for review: Hold");
    expect(selectedHtml).toContain("Open Proof Queue");
    expect(selectedHtml).toContain("Open HubSpot View");
    expect(selectedHtml).toContain("Close");
    expect(selectedHtml).toContain("At Risk");
    expect(selectedHtml).toContain("Campaign KPIs");
    expect(selectedHtml).toContain("Quick links");
    expect(selectedHtml).toContain("HubSpot CRM");
    expect(selectedHtml).toContain("Open proof queue");
    expect(selectedHtml).toContain("Open feed studio");
    expect(selectedHtml).toContain("Open HubSpot view");
    expect(selectedHtml).not.toContain("Decision workspace");
    expect(selectedHtml).not.toContain("Focus now");
    expect(selectedHtml).not.toContain("Recent signals");
    expect(selectedHtml).not.toContain("Follow-up debt is growing");
    expect(selectedHtml).not.toContain("Proof review is backing up");
    expect(selectedHtml).not.toContain("Rush Month momentum is slipping");
    expect(selectedHtml).not.toContain("Luma Events");
    expect(selectedHtml).not.toContain("Feed & myMEDLIFE Activity");
    expect(selectedHtml).not.toContain("Coach note");
    expect(selectedHtml).not.toContain("Focus this week");
    expect(selectedHtml).not.toContain("Open coach dashboard");
    expect(selectedHtml).not.toContain("Lead:");
    expect(selectedHtml).not.toContain("Coach:");
    expect(selectedHtml).not.toContain("Future n8n reminder workflow");
    expect(selectedHtml).not.toContain("Future CRM handoff payload");
  });

  it("keeps the chapter recommendation visible when the reviewer previews a different posture", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "chapters",
      chapterId: "chapter-yale",
      decision: "intervene",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(commandCenter.selectedChapter?.recommendedDecision).toBe("Hold");
    expect(commandCenter.selectedChapter?.selectedDecision).toBe("intervene");
    expect(html).not.toContain("Intervention posture selected");
    expect(html).not.toContain("Recommended move: Hold");
    expect(html).not.toContain("Selected for review: Intervene");
    expect(html).toContain("Assign Intervention");
  });

  it("preserves feed-analytics context when staff opens a chapter drawer from an engagement breakdown", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "chapters",
      chapterId: "chapter-yale",
      feedDraft: "proof-florida-event-recap-feed",
      feedPost: "feed-post-faith-story",
      feedRole: "leader",
      feedAudience: "selected_chapters",
    });

    expect(commandCenter.selectedChapter?.sourceContext).toMatchObject({
      eyebrow: "Feed analytics source",
      title: "Opened from a feed-engagement review",
      actionLabel: "Return to feed analytics",
      actionHref:
        "/staff?view=feed_analytics&campaign=rush-month&feedDraft=proof-florida-event-recap-feed&feedPost=feed-post-faith-story&feedRole=leader&feedAudience=selected_chapters",
    });
    expect(commandCenter.selectedChapter?.closeHref).toBe(
      "/staff?view=feed_analytics&campaign=rush-month&feedDraft=proof-florida-event-recap-feed&feedPost=feed-post-faith-story&feedRole=leader&feedAudience=selected_chapters",
    );
    expect(
      commandCenter.selectedChapter?.quickLinks.find((item) => item.label === "Open proof queue")?.href,
    ).toContain("feedPost=feed-post-faith-story");
  });

  it("opens low-engagement feed analytics drill-ins with an intervention posture already selected", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "chapters",
      chapterId: "chapter-ghana",
      decision: "intervene",
      feedDraft: "proof-florida-event-recap-feed",
      feedPost: "feed-post-faith-story",
      feedRole: "leader",
      feedAudience: "selected_chapters",
    });

    expect(commandCenter.selectedChapter?.selectedDecision).toBe("intervene");
    expect(commandCenter.selectedChapter?.sourceContext).toMatchObject({
      eyebrow: "Feed analytics source",
      title: "Opened from a feed-engagement review",
    });
    expect(commandCenter.selectedChapter?.footerActions[0]?.label).toBe("Assign Intervention");
    expect(commandCenter.selectedChapter?.decisionOptions.find((item) => item.key === "intervene")?.href).toContain(
      "feedPost=feed-post-faith-story",
    );
  });

  it("keeps staff quick tools attached to the same feed-review context instead of resetting the route", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "feed_analytics",
      chapterId: "chapter-yale",
      proofQueue: "pending",
      proofType: "proof_video",
      feedDraft: "proof-florida-event-recap-feed",
      feedPost: "feed-post-faith-story",
      feedRole: "leader",
      feedAudience: "selected_chapters",
    });

    expect(commandCenter.selectedFeedDraftId).toBe("proof-uc-berkeley-rush-video-feed");
    expect(commandCenter.quickActions.find((item) => item.label === "Open proof queue")?.href).toBe(
      `/staff?view=proof_ugc&campaign=rush-month&chapter=chapter-yale&proofQueue=pending&proofType=proof_video&feedDraft=${commandCenter.selectedFeedDraftId}&feedPost=feed-post-faith-story&feedRole=leader&feedAudience=selected_chapters`,
    );
    expect(commandCenter.quickActions.find((item) => item.label === "Check feed drafts")?.href).toBe(
      `/staff?view=feed_studio&campaign=rush-month&chapter=chapter-yale&proofQueue=pending&proofType=proof_video&feedDraft=${commandCenter.selectedFeedDraftId}&feedPost=feed-post-faith-story&feedRole=leader&feedAudience=selected_chapters`,
    );
  });

  it("keeps campaign operations attached to the selected chapter context instead of flattening the route", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const commandCenter = getStaffCommandCenter(coach, data, {
      routeBase: "/coach",
      view: "campaigns",
      campaign: "rush-month",
      chapterId: "chapter-ucsd",
      decision: "intervene",
      feedDraft: "proof-florida-event-recap-feed",
      feedPost: "feed-post-faith-story",
      feedRole: "leader",
      feedAudience: "selected_chapters",
    });

    expect(commandCenter.campaignOperations.sourceContext).toBeNull();
    expect(commandCenter.launchLaneFocused).toBe(true);
  });

  it("keeps the staff rail compact so navigation stays primary in the desktop frame", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "chapters",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).not.toContain("Command center nav");
    expect(html).toContain("Chapters");
    expect(html).toContain("Events");
    expect(html).toContain("Leaderboard");
    expect(html).not.toContain(
      "Move across chapters, campaigns, proof, content, CRM, and admin health.",
    );
    expect(html).not.toContain("Quick tools");
    expect(html).toContain("Portfolio Overview");
    expect(html).toContain("Luma, RSVP, attendance, and points should stay visible together.");
    expect(html).toContain("Open Events");
    expect(html).toContain("Open Leaderboard");
    expect(html).not.toContain("Search chapter, school, student...");
    expect(html).not.toContain("Open Campaign View");
    expect(html).not.toContain("Review posture");
    expect(html).not.toContain("Read-only");
    expect(html).not.toContain("Staff Command Center sample");
    expect(html).not.toContain(commandCenter.summary);
  });

  it("renders the campaigns view with the mockup-aligned heading and milestone states", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "campaigns",
      campaign: "rush-month",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain(">Campaign Operations</h1>");
    expect(html).toContain("Bulk Actions:");
    expect(html).toContain("Rush Month - Chapter Execution");
    expect(html).toContain("Rush Month");
    expect(html).toContain("SLT Promotion");
    expect(html).toContain("Moving Mountains");
    expect(html).toContain("Chapter Engagement");
    expect(html).toContain("Leadership Transition");
    expect(html).toContain("Grow the Movement");
    expect(html).toContain("Start a Chapter");
    expect(html).not.toContain("Planning / Goal Setting");
    expect(html).not.toContain("Fundraising Sprint");
    expect(html).not.toContain("Local Volunteering Push");
    expect(html).not.toContain("Med Talk Series");
    expect(html).not.toContain("Social Belonging Events");
    expect(html).toContain("20 chapters");
    expect(html).toContain("✓ 4");
    expect(html).toContain("✗ None");
    expect(html).not.toContain("Visible chapters");
    expect(html).not.toContain("High risk");
    expect(html).not.toContain("Proof queue");
    expect(html).not.toContain("chapters in the visible review set");
    expect(html).not.toContain("Live rows");
    expect(html).not.toContain("Current support posture");
    expect(html).not.toContain("Which support signals are moving across the portfolio?");
  });

  it("treats campaign risk cards as route state and filters the execution table to the selected risk lane", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "campaigns",
      campaign: "rush-month",
      campaignRisk: "low_rsvp",
    });

    expect(commandCenter.campaignOperations.selectedRiskGroup).toBe("low_rsvp");
    expect(commandCenter.campaignOperations.selectedRiskGroupLabel).toBe("Low RSVP (< 20)");
    expect(commandCenter.campaignOperations.riskCards.find((card) => card.key === "low_rsvp")).toMatchObject({
      isActive: true,
      href: "/staff?view=campaigns&campaign=rush-month&campaignRisk=low_rsvp",
    });
    expect(commandCenter.campaignOperations.executionRows.map((row) => row.chapterName)).toEqual([
      "Yale University",
      "UFMG Belo Horizonte",
      "Johns Hopkins",
    ]);
    expect(commandCenter.campaignOperations.executionRows[0]?.href).toBe(
      "/staff?view=chapters&campaign=rush-month&campaignRisk=low_rsvp&chapter=chapter-yale",
    );
    expect(commandCenter.campaignOperations.clearRiskGroupHref).toBe(
      "/staff?view=campaigns&campaign=rush-month",
    );
  });

  it("keeps campaign operations attached to the portfolio-overview handoff when staff opens the campaign screen from the table", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "campaigns",
      source: "portfolio_overview",
      campaign: "rush-month",
      campaignRisk: "no_event",
      risk: "medium",
      country: "usa",
      coach: "james",
      portfolioCampaign: "rush_month",
      query: "Yale",
    });

    expect(commandCenter.campaignOperations.sourceContext).toMatchObject({
      eyebrow: "Portfolio overview source",
      title: "Opened from the chapter portfolio",
      actionLabel: "Return to portfolio overview",
      actionHref:
        "/staff?view=chapters&campaign=rush-month&risk=medium&country=usa&coach=james&portfolioCampaign=rush_month&q=Yale",
    });
    expect(commandCenter.campaignOperations.tabs[1]?.href).toContain(
      "source=portfolio_overview",
    );
    expect(commandCenter.campaignOperations.tabs[1]?.href).toContain(
      "campaignRisk=no_event",
    );
    expect(commandCenter.campaignOperations.bulkActions[0]?.href).toContain(
      "source=portfolio_overview",
    );
    expect(commandCenter.campaignOperations.bulkActions[0]?.href).toContain(
      "campaignRisk=no_event",
    );
  });

  it("renders selected campaign context so the reviewer can return to the chosen chapter lane", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const commandCenter = getStaffCommandCenter(coach, data, {
      routeBase: "/coach",
      view: "campaigns",
      campaign: "rush-month",
      chapterId: "chapter-ucsd",
      decision: "intervene",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain("Event and points pulse");
    expect(html).toContain("Luma, RSVP, attendance, and points should stay visible together.");
    expect(html).toContain("Review risk chapters");
  });

  it("renders the proof queue with the mockup-aligned default summary and an empty review panel", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "proof_ugc",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain(">Proof / UGC Review Queue</h1>");
    expect(html).toContain("5 items pending review");
    expect(html).toContain("All Types");
    expect(html).toContain("Select a content card to review");
    expect(html).toContain("All");
    expect(html).toContain("Pending");
    expect(html).toContain("Chapter Only");
    expect(html).not.toContain("Visible chapters");
    expect(html).not.toContain("20 visible chapters");
    expect(html).not.toContain("High risk");
    expect(html).not.toContain("Approve for");
  });

  it("renders the proof review panel with plain-language recommendation and tier helpers", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "proof_ugc",
      proofQueue: "selected",
      proofType: "bridge_video",
      proof: "proof-unam-bridge-video",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain("Recommended use");
    expect(html).toContain("Selected review state");
    expect(html).toContain("Use this in selected chapter onboarding and mission-belief moments.");
    expect(html).toContain(
      "Each lane shows what the current consent posture actually permits before anything is curated or shared.",
    );
    expect(html).toContain("Allowed now");
    expect(html).toContain(
      "Selected-chapter consent directly covers narrow onboarding and coaching use.",
    );
    expect(html).toContain("All chapters");
    expect(html).toContain(
      "Network-wide sharing needs broader consent than selected-chapter reuse.",
    );
    expect(html).toContain("Keep the story inside the originating chapter.");
    expect(html).toContain("Use it for broader public-facing storytelling if consent supports it.");
    expect(html).toContain("Blocked right now");
    expect(html).toContain(
      "Public storytelling needs broader consent than selected-chapter reuse.",
    );
  });

  it("renders blocked approval lanes with explicit consent reasons when review is still pending", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "proof_ugc",
      proofQueue: "pending",
      proofType: "event_recap",
      proof: "proof-makerere-consent-pending",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain("Allowed now");
    expect(html).toContain("Only internal review should continue while the consent form is still pending.");
    expect(html).toContain("Blocked right now");
    expect(html).toContain(
      "Wait for the consent form before approving anything beyond internal holding review.",
    );
  });

  it("keeps chapter-only proof approval scoped to the originating chapter", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "proof_ugc",
      proofQueue: "chapter_only",
      proofType: "proof_video",
      proof: "proof-pucp-chapter-only",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain("Chapter Only");
    expect(html).toContain(
      "This stays fully inside the originating chapter, which matches the current consent posture.",
    );
    expect(html).toContain(
      "This story has not been cleared for wider chapter distribution or public reuse.",
    );
    expect(html).toContain("Blocked right now");
  });

  it("renders the feed studio with the mockup-aligned page heading and compact targeting copy", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "feed_studio",
      proofQueue: "selected",
      proofType: "bridge_video",
      proof: "proof-unam-bridge-video",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain(">Feed Curation Studio</h1>");
    expect(html).toContain("Compose and target content to student feeds");
    expect(html).toContain("Proof review source");
    expect(html).toContain("Opened from a reviewed content item");
    expect(html).toContain("Return to proof queue");
    expect(html).toContain("Audience targeting");
    expect(html).toContain("1 Chapter");
    expect(html).toContain("Campaign Chapters");
    expect(html).toContain("10 chapters");
    expect(html).toContain("~350 students");
    expect(html).toContain("Select campaign");
    expect(html).toContain("Feed preview");
    expect(html).toContain("Schedule");
    expect(html).not.toContain("Visible chapters");
    expect(html).not.toContain("High risk");
    expect(html).not.toContain("Proof queue");
  });

  it("renders the feed studio best-practice handoff as an explicit share context", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "feed_studio",
      bestPractice: "practice-why-i-travel",
      practiceCampaign: "moving_mountains",
      practiceCountry: "mexico",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain("Best practice source");
    expect(html).toContain("Opened from the best-practice library");
    expect(html).toContain("Return to best practices");
    expect(html).toContain("Why I Travel");
  });

  it("renders feed analytics as an overview first and reveals impact details only after selection", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const overviewCenter = getStaffCommandCenter(admin, data, {
      view: "feed_analytics",
    });
    const selectedCenter = getStaffCommandCenter(admin, data, {
      view: "feed_analytics",
      feedPost: "feed-post-stanford-leads",
    });

    const overviewHtml = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter: overviewCenter }),
    );
    const selectedHtml = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter: selectedCenter }),
    );

    expect(overviewHtml).toContain(">Feed Analytics</h1>");
    expect(overviewHtml).toContain("Connecting feed engagement to chapter outcomes");
    expect(overviewHtml).toContain("Total Views");
    expect(overviewHtml).toContain("How Stanford captured 91 leads in one weekend");
    expect(overviewHtml).toContain("Post Performance");
    expect(overviewHtml).toContain("Actions");
    expect(overviewHtml).toContain("Evidence");
    expect(overviewHtml).not.toContain("Visible chapters");
    expect(overviewHtml).not.toContain("High risk");
    expect(overviewHtml).not.toContain("Proof queue");
    expect(overviewHtml).not.toContain("Feed Studio source");
    expect(overviewHtml).not.toContain("Opened from a curation draft");
    expect(overviewHtml).not.toContain("Impact Analysis");
    expect(overviewHtml).not.toContain("Select a post to inspect impact");

    expect(selectedHtml).toContain("Impact Analysis");
    expect(selectedHtml).toContain("Did content drive action?");
    expect(selectedHtml).toContain("Open member review");
    expect(selectedHtml).toContain("Feed Studio source");
    expect(selectedHtml).toContain("Opened from a curation draft");
    expect(selectedHtml).toContain("Return to Feed Studio");
    expect(selectedHtml).toContain("How Stanford captured 91 leads in one weekend");
    expect(selectedHtml).toContain("Top Engagement");
    expect(selectedHtml).toContain("Low / No Engagement");
    expect(selectedHtml).toContain("Open chapter");
    expect(selectedHtml).toContain("Open member review");
    expect(selectedHtml.indexOf("Impact Analysis")).toBeLessThan(
      selectedHtml.indexOf("Total Views"),
    );
    expect(selectedHtml).toContain(
      "/staff?view=chapters&amp;campaign=rush-month&amp;chapter=chapter-ghana&amp;decision=intervene&amp;feedDraft=proof-uc-berkeley-rush-video-feed&amp;feedPost=feed-post-stanford-leads&amp;feedRole=member&amp;feedAudience=campaign_chapters",
    );
  });

  it("renders chapter-drawer analytics context when staff drills in from feed performance", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "chapters",
      chapterId: "chapter-yale",
      feedDraft: "proof-florida-event-recap-feed",
      feedPost: "feed-post-faith-story",
      feedRole: "leader",
      feedAudience: "selected_chapters",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain("Feed analytics source");
    expect(html).toContain("Opened from a feed-engagement review");
    expect(html).toContain("Return to feed analytics");
  });

  it("renders the hubspot view with the mockup-aligned page heading and simpler funnel layout", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "hubspot",
      chapterId: "chapter-yale",
      risk: "medium",
      country: "usa",
      coach: "james",
      portfolioCampaign: "rush_month",
      query: "Yale",
      decision: "intervene",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain(">HubSpot + Portfolio Intelligence</h1>");
    expect(html).toContain("Portfolio source");
    expect(html).toContain("Opened from the chapter portfolio");
    expect(html).toContain("Return to chapter portfolio");
    expect(html).toContain("HubSpot CRM Profile");
    expect(html).toContain("Matched myMEDLIFE activity");
    expect(html).toContain("Conversion Funnel");
    expect(html).not.toContain("Visible chapters");
    expect(html).not.toContain("High risk");
    expect(html).not.toContain("Proof queue");
    expect(html).toContain("HubSpot CRM data matched to myMEDLIFE activity");
    expect(html).toContain("HubSpot CRM Profile");
    expect(html).toContain("Matched myMEDLIFE activity");
    expect(html).toContain("Conversion Funnel — UC Berkeley");
    expect(html).toContain("Attended Event");
    expect(html).toContain("Became Member");
    expect(html).not.toContain("HubSpot handoff mocked");
    expect(html).not.toContain("Yale University follow-up posture");
  });

  it("renders the best practices view with the mockup-aligned library header and live filter menus", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "best_practices",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain(">Best Practices Library</h1>");
    expect(html).toContain("5 verified best practices ready to share");
    expect(html).toContain("All Campaigns");
    expect(html).toContain("All Countries");
    expect(html).toContain("5 best practices");
    expect(html).toContain("Share to Feed");
    expect(html).toContain("Send to Coaches");
    expect(html).toContain("QR Code Lead Capture at Multi-Event Weekend");
    expect(html).toContain("Morning Motivation Text Sequence for Members");
    expect(html).toContain("Eng. Score");
    expect(html).not.toContain("Visible chapters");
    expect(html).not.toContain("20 visible chapters");
    expect(html).not.toContain("High risk");
    expect(html).not.toContain(">Apply<");
    expect(html).not.toContain("Live rows");
    expect(html).not.toContain("Current support posture");
    expect(html).not.toContain("Which support signals are moving across the portfolio?");
  });

  it("renders the selected best-practice state when the library is reopened from a share flow", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "best_practices",
      bestPractice: "practice-why-i-travel",
      practiceCampaign: "moving_mountains",
      practiceCountry: "mexico",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain("Selected practice");
    expect(html).toContain("Selected for sharing");
    expect(html).toContain("Share to Feed");
    expect(html).toContain("Send to Coaches");
    expect(html).toContain("Why I Travel");
    expect(html).toContain("UNAM Mexico City is the currently selected practice");
  });

  it("renders the best-practices proof-review handoff as an explicit review context", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "best_practices",
      source: "proof_review",
      proofQueue: "selected",
      proofType: "bridge_video",
      proof: "proof-unam-bridge-video",
      practiceCampaign: "moving_mountains",
      practiceCountry: "mexico",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain("Proof review source");
    expect(html).toContain("Opened from proof review");
    expect(html).toContain("Return to proof queue");
    expect(html).toContain("UNAM Mexico City");
  });

  it("renders the admin view with the mockup-aligned compact integration list and outbox header", () => {
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const commandCenter = getStaffCommandCenter(admin, data, {
      view: "admin",
    });

    const html = renderToStaticMarkup(
      createElement(StaffCommandCenterPanel, { commandCenter }),
    );

    expect(html).toContain(">System Health</h1>");
    expect(html).toContain("System health: 5 of 6 integrations active");
    expect(html).toContain("Integration Status");
    expect(html).toContain("Automation Outbox");
    expect(html).toContain("2 failed");
    expect(html).toContain("Retry Failed");
    expect(html).toContain("Permission Registry");
    expect(html).toContain("Workflow Registry");
    expect(html).toContain("Committee Registry");
    expect(html).toContain("SOP Library");
    expect(html).toContain("Design QA");
    expect(html).toContain("Pilot Scope");
    expect(html).toContain("HubSpot CRM");
    expect(html).toContain("Last sync: 2 min ago");
    expect(html).not.toContain(">Admin Console</h1>");
    expect(html).not.toContain("Portfolio chapters");
    expect(html).not.toContain("Review-safe integration queue");
  });

  it("preserves the detailed outbox boundary for non-ds staff roles", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(getStaffCommandCenter(coach, data).canReadDetailedOutbox).toBe(false);
    expect(getStaffCommandCenter(admin, data).canReadDetailedOutbox).toBe(false);
    expect(getStaffCommandCenter(superAdmin, data).canReadDetailedOutbox).toBe(true);
  });
});
