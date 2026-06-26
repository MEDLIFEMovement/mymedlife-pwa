import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CoachPortfolioReadinessPanel } from "@/components/coach-portfolio-readiness-panel";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getCoachPortfolioReadiness } from "@/services/coach-portfolio-readiness";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("coach portfolio readiness panel", () => {
  it("renders the coach dashboard hierarchy from the prototype state", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const data = getMockReadOnlyAppData("Testing coach dashboard panel.");
    const portfolio = getCoachPortfolioReadiness(actor, data);

    const html = renderToStaticMarkup(
      createElement(CoachPortfolioReadinessPanel, { portfolio }),
    );

    expect(html).toContain("MEDLIFE National");
    expect(html).toContain("Staff Command Center");
    expect(html).toContain("Hi, Coach David Kim");
    expect(html).toContain("Avg Health");
    expect(html).toContain("Total Overdue");
    expect(html).toContain("Evidence Queue");
    expect(html).toContain("Assigned portfolio");
    expect(html).toContain("4 chapters assigned");
    expect(html).toContain("1 intervene now");
    expect(html).toContain("0 handoffs pending");
    expect(html).toContain("Chapter Portfolio");
    expect(html).toContain("Portfolio Overview");
    expect(html).toContain("Risk");
    expect(html).toContain("Campus");
    expect(html).toContain("Campaign");
    expect(html).toContain("Ownership");
    expect(html).toContain("AI Weekly Summary");
    expect(html).toContain("UCLA MEDLIFE");
    expect(html).toContain("USC MEDLIFE");
    expect(html).toContain("UCI MEDLIFE");
    expect(html).toContain("UCSD MEDLIFE");
    expect(html).toContain("82%");
    expect(html).toContain("61%");
    expect(html).toContain("45%");
    expect(html).toContain("Advance");
    expect(html).toContain("Hold");
    expect(html).toContain("Intervene");
    expect(html).toContain("Open chapter");
    expect(html).toContain("Coaching Priorities");
    expect(html).toContain("Write coach note");
    expect(html).toContain("Review risk reports");
    expect(html.indexOf("Assigned portfolio")).toBeLessThan(
      html.indexOf("AI Weekly Summary"),
    );
    expect(html.indexOf("AI Weekly Summary")).toBeLessThan(
      html.indexOf("Portfolio Overview"),
    );
    expect(html).toContain("/coach?view=chapter_detail&amp;chapter=chapter-ucsd");
    expect(html).toContain("/coach?view=chapters&amp;risk=high");
    expect(html).toContain("/coach?view=support_notes#support-notes");
    expect(html).toContain("/coach?view=chapter_detail&amp;risk=high");
    expect(html).toContain("/coach?view=chapter_detail&amp;chapter=chapter-ucsd");
  });
});
