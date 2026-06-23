import { describe, expect, it } from "vitest";

import { assignments } from "@/data/mock-rush-month";
import { getMemberActionDetailWorkspace } from "@/services/member-action-detail-workspace";

describe("member action detail workspace", () => {
  const assignment = assignments.find((item) => item.id === "member-push");

  if (!assignment) {
    throw new Error("Expected member-push mock assignment");
  }

  it("maps the member action detail screen to the mockup copy and structure", () => {
    const workspace = getMemberActionDetailWorkspace(assignment);

    expect(workspace.campaignLabel).toBe("Rush Month");
    expect(workspace.statusLabel).toBe("Not started");
    expect(workspace.title).toBe("Invite 3 friends to the Intro GBM");
    expect(workspace.dueLabel).toBe("Due Nov 15");
    expect(workspace.assignedByLabel).toBe("Assigned by Marcus T.");
    expect(workspace.pointsApprovalLabel).toBe("30 points if approved");
    expect(workspace.appliesToLabel).toBe("Applies to: Rush Month · Lead Capture KPI");
    expect(workspace.submitEvidenceHref).toBe(
      "/rush-month/actions/member-push?step=submit#submit-evidence",
    );
    expect(workspace.submitEvidenceLabel).toBe("Submit evidence");
    expect(workspace.steps).toEqual([
      "Think of 3 friends who care about global health, medicine, or community service.",
      "Send them a personal message — DM, text, or in person. Share the Luma link.",
      "Screenshot or note their RSVP confirmation to submit as evidence.",
    ]);
    expect(workspace.evidenceItems).toEqual([
      {
        label: "Screenshot",
        detail: "Screenshot of RSVP confirmation or messages sent",
      },
      {
        label: "Short update",
        detail: "Who did you invite? Did they RSVP?",
      },
    ]);
    expect(workspace.helperLabel).toBe("Not sure what to do? Ask your chapter leader");
  });
});
