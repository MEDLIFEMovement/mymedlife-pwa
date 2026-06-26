import { describe, expect, it } from "vitest";
import { getCoachPortfolioReadiness } from "@/services/coach-portfolio-readiness";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing coach portfolio readiness.");

describe("coach portfolio readiness", () => {
  it("gives coaches a sorted portfolio with disabled coach changes", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data);

    expect(portfolio.canReadPortfolio).toBe(true);
    expect(portfolio.title).toBe("Staff Command Center");
    expect(portfolio.counts.totalChapters).toBe(4);
    expect(portfolio.counts.coachChangesEnabled).toBe(0);
    expect(portfolio.counts.handoffsPending).toBe(0);
    expect(portfolio.rows[0]?.decision).toBe("intervene");
    expect(portfolio.dashboardOwnerLabel).toContain("Coach David Kim");
    expect(portfolio.routeBase).toBe("/coach");
    expect(portfolio.campaignsHref).toBe("/coach?view=campaigns");
    expect(portfolio.notesHref).toBe("/coach?view=support_notes#support-notes");
    expect(portfolio.riskReviewHref).toBe("/coach?view=chapter_detail&risk=high");
    expect(portfolio.averageHealthLabel).toBe("66");
    expect(portfolio.totalOverdueLabel).toBe("30");
    expect(portfolio.evidenceQueueLabel).toBe("42");
    expect(portfolio.rows.every((row) => row.coachChangePosture === "read_only")).toBe(
      true,
    );
  });

  it("includes the current local chapter in the coach portfolio", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data);

    expect(portfolio.rows.some((row) => row.chapterId === data.chapter.id)).toBe(true);
    expect(portfolio.rows.find((row) => row.chapterId === data.chapter.id)).toMatchObject({
      chapterName: "UCLA MEDLIFE",
      decision: "advance",
      readinessScore: 82,
      activeCount: 28,
      overdueCount: 3,
      proofPending: 7,
      detailHref: `/coach?view=chapter_detail&chapter=${data.chapter.id}`,
    });
  });

  it("keeps the coach portfolio filters route-owned and narrows the rows when a filter is selected", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data, {
      routeBase: "/coach",
      risk: "high",
      campus: "UCSD",
      source: "member_home",
    });

    expect(portfolio.selectedScopeLabel).toBe(
      "1 of 4 assigned chapters match the current filters",
    );
    expect(portfolio.rows).toHaveLength(1);
    expect(portfolio.rows[0]).toMatchObject({
      chapterId: "chapter-ucsd",
      campaignSlug: "slt-promotion",
      detailHref:
        "/coach?view=chapter_detail&country=UCSD&chapter=chapter-ucsd&risk=high&source=member_home",
    });
    expect(portfolio.filterGroups.find((group) => group.key === "risk")?.resetHref).toBe(
      "/coach?view=chapters&country=UCSD&source=member_home",
    );
    expect(
      portfolio.filterGroups
        .find((group) => group.key === "campus")
        ?.options.find((option) => option.value === "UCSD"),
    ).toMatchObject({
      isActive: true,
      href: "/coach?view=chapters&country=UCSD&risk=high&source=member_home",
    });
  });

  it("allows admin to read portfolio support posture", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data);

    expect(portfolio.canReadPortfolio).toBe(true);
    expect(portfolio.title).toBe("Staff Command Center");
    expect(portfolio.counts.intervene).toBe(
      portfolio.rows.filter((row) => row.decision === "intervene").length,
    );
    expect(portfolio.counts.intervene).toBeGreaterThan(0);
  });

  it("allows super admin to read the full local portfolio", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data);

    expect(portfolio.canReadPortfolio).toBe(true);
    expect(portfolio.title).toBe("Staff Command Center");
    expect(portfolio.rows).toHaveLength(4);
  });

  it("hides portfolio data from chapter members", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data);

    expect(portfolio.canReadPortfolio).toBe(false);
    expect(portfolio.rows).toEqual([]);
    expect(portfolio.counts.totalChapters).toBe(0);
  });

  it("hides portfolio data from chapter leaders", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data);

    expect(portfolio.canReadPortfolio).toBe(false);
    expect(portfolio.summary).toContain("not general members, chapter leaders");
  });

  it("keeps committee members and chairs out of coach portfolio ownership", () => {
    const committeeMember = getCoachPortfolioReadiness(
      getMockLocalActorContext("committee.member@mymedlife.test"),
      data,
    );
    const committeeChair = getCoachPortfolioReadiness(
      getMockLocalActorContext("committee.chair@mymedlife.test"),
      data,
    );

    expect(committeeMember.canReadPortfolio).toBe(false);
    expect(committeeChair.canReadPortfolio).toBe(false);
    expect(committeeMember.rows).toEqual([]);
    expect(committeeChair.rows).toEqual([]);
  });

  it("hides portfolio data from DS Admin", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data);

    expect(portfolio.canReadPortfolio).toBe(false);
    expect(portfolio.rows).toEqual([]);
    expect(portfolio.counts.coachChangesEnabled).toBe(0);
  });
});
