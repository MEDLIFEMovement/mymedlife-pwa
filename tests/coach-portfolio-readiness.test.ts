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
    expect(portfolio.title).toBe("Coach portfolio readiness");
    expect(portfolio.counts.totalChapters).toBe(4);
    expect(portfolio.counts.coachChangesEnabled).toBe(0);
    expect(portfolio.counts.handoffsPending).toBe(1);
    expect(portfolio.rows[0]?.decision).toBe("intervene");
    expect(portfolio.rows.every((row) => row.coachChangePosture === "read_only")).toBe(
      true,
    );
  });

  it("includes the current local chapter in the coach portfolio", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data);

    expect(portfolio.rows.some((row) => row.chapterId === data.chapter.id)).toBe(true);
    expect(
      portfolio.rows.find((row) => row.chapterId === data.chapter.id)?.decision,
    ).toBe(data.kpiSummary.coachDecision);
  });

  it("allows admin to read portfolio support posture", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data);

    expect(portfolio.canReadPortfolio).toBe(true);
    expect(portfolio.title).toBe("HQ coach portfolio support");
    expect(portfolio.counts.intervene).toBe(
      portfolio.rows.filter((row) => row.decision === "intervene").length,
    );
    expect(portfolio.counts.intervene).toBeGreaterThan(0);
  });

  it("allows super admin to read the full local portfolio", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data);

    expect(portfolio.canReadPortfolio).toBe(true);
    expect(portfolio.title).toBe("Full local coach portfolio");
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

  it("hides portfolio data from DS Admin", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const portfolio = getCoachPortfolioReadiness(actor, data);

    expect(portfolio.canReadPortfolio).toBe(false);
    expect(portfolio.rows).toEqual([]);
    expect(portfolio.counts.coachChangesEnabled).toBe(0);
  });
});
