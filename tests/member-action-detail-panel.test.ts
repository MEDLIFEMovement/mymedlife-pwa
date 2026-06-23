import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MemberActionDetailPanel } from "@/components/member-action-detail-panel";
import { assignments } from "@/data/mock-rush-month";
import { getMemberActionDetailWorkspace } from "@/services/member-action-detail-workspace";

describe("member action detail panel", () => {
  const assignment = assignments.find((item) => item.id === "member-push");

  if (!assignment) {
    throw new Error("Expected member-push mock assignment");
  }

  it("renders the member mobile action-detail screen from the mockup map", () => {
    const workspace = getMemberActionDetailWorkspace(assignment);
    const html = renderToStaticMarkup(
      createElement(MemberActionDetailPanel, { workspace }),
    );

    expect(html).toContain("Action Detail");
    expect(html).toContain("Rush Month");
    expect(html).toContain("Not started");
    expect(html).toContain("Invite 3 friends to the Intro GBM");
    expect(html).toContain("Due Nov 15");
    expect(html).toContain("Assigned by Marcus T.");
    expect(html).toContain("30 points if approved");
    expect(html).toContain("Applies to: Rush Month · Lead Capture KPI");
    expect(html).toContain("Why This Matters");
    expect(html).toContain("Step-by-Step Instructions");
    expect(html).toContain("Evidence Required");
    expect(html).toContain("Not sure what to do? Ask your chapter leader");
    expect(html).toContain("Submit evidence");
    expect(html.match(/Evidence Required/g)?.length).toBe(1);
    expect(html.match(/Submit evidence/g)?.length).toBe(1);
    expect(html).toContain(
      "href=\"/rush-month/actions/member-push?step=submit#submit-evidence\"",
    );
  });
});
