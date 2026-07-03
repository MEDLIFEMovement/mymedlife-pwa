import { describe, expect, it } from "vitest";
import { assignments } from "@/data/mock-rush-month";
import {
  getActionDetailFacts,
  getActionSteps,
  getActionWhyItMatters,
} from "@/services/member-action-detail";

describe("member action detail copy", () => {
  const assignment = assignments.find((item) => item.id === "member-push");

  if (!assignment) {
    throw new Error("Expected member-push mock assignment");
  }

  it("builds a why-it-matters summary around the current action and KPI", () => {
    expect(getActionWhyItMatters(assignment)).toContain("30-point action");
    expect(getActionWhyItMatters(assignment)).toContain("Student invites sent");
  });

  it("keeps the steps explicit about evidence and local confirmation", () => {
    expect(getActionSteps(assignment)).toEqual([
      "Invite three students to the Intro GBM using the approved chapter message, then submit proof that shows the real outreach happened.",
      "Capture proof that answers this requirement: Message screenshot, invite list, or event RSVP link.",
      "Confirm the proof is accurate, preview the submission locally, and use the confirmation state before any real save path is approved.",
    ]);
  });

  it("surfaces due date, assignee, status, and the 30-point detail facts", () => {
    expect(getActionDetailFacts(assignment)).toEqual([
      expect.objectContaining({ label: "Due date", value: "Nov 15" }),
      expect.objectContaining({ label: "Assignee", value: "General Member" }),
      expect.objectContaining({ label: "Status", value: "not started" }),
      expect.objectContaining({ label: "Points", value: "30" }),
    ]);
  });
});
