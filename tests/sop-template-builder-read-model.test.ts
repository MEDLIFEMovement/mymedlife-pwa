import { describe, expect, it } from "vitest";
import { getTemplateBuilderSurface } from "@/services/sop-template-builder-read-model";

describe("sop template builder read model", () => {
  it("exposes structured Planning / Goal Setting step data for the builder", () => {
    const surface = getTemplateBuilderSurface("planning-goal-setting");

    expect(surface).not.toBeNull();
    expect(surface?.versionLabel).toBe("v0 reviewed");
    expect(surface?.importStatus).toBe("draft_reviewed");
    expect(surface?.phaseLabels).toEqual([
      "GSW Preparation",
      "Systems Setup & Officer Training Validation",
      "Campaign Planning Review & Action Committee Validation",
      "GSW Execution",
      "Launch Readiness",
    ]);
    expect(surface?.steps.map((step) => step.id)).toEqual([
      "planning-goal-brief",
      "planning-owner-map",
      "planning-first-calendar",
      "planning-risk-review",
      "planning-coach-checkin",
    ]);
    expect(surface?.steps[0]).toMatchObject({
      phaseLabel: "GSW Preparation",
      primaryOwnerRole: "president",
    });
    expect(surface?.steps[2]?.visibleRoutes).toEqual(
      expect.arrayContaining(["/campaigns/planning-goal-setting"]),
    );
  });

  it("exposes structured role-matrix data for the imported template", () => {
    const surface = getTemplateBuilderSurface("planning-goal-setting");
    const presidentRule = surface?.roleMatrix.find(
      (rule) => rule.id === "planning-president-chapter",
    );

    expect(presidentRule).toMatchObject({
      role: "president",
      scope: "chapter",
      blockedByDefault: false,
    });
    expect(presidentRule?.stepLabels).toEqual(
      expect.arrayContaining([
        "Define the chapter goal and deadline",
        "Review launch risks and follow-ups",
      ]),
    );
    expect(presidentRule?.kpiLabels).toEqual(
      expect.arrayContaining(["Goals set", "Risks identified"]),
    );
  });

  it("exposes structured completion, evidence, and approval rows", () => {
    const surface = getTemplateBuilderSurface("planning-goal-setting");

    expect(
      surface?.completionRows.filter((row) => row.rowType === "completion").map((row) => row.id),
    ).toEqual(
      expect.arrayContaining([
        "planning-goal-brief-complete",
        "planning-coach-review-complete",
      ]),
    );
    expect(
      surface?.completionRows.filter((row) => row.rowType === "evidence").map((row) => row.id),
    ).toEqual(
      expect.arrayContaining([
        "planning-goal-note",
        "planning-first-calendar",
      ]),
    );
    expect(
      surface?.completionRows.filter((row) => row.rowType === "approval").map((row) => row.id),
    ).toEqual(
      expect.arrayContaining([
        "planning-coach-approval",
      ]),
    );
    expect(surface?.riskRows.map((row) => row.id)).toEqual(
      expect.arrayContaining([
        "planning-missing-owner-risk",
        "planning-calendar-slip-risk",
        "planning-coach-support-risk",
      ]),
    );
    expect(surface?.escalationRows.map((row) => row.id)).toEqual(
      expect.arrayContaining([
        "planning-owner-gap-escalation",
        "planning-blocker-escalation",
      ]),
    );
    expect(surface?.closeoutRows.map((row) => row.id)).toEqual(
      expect.arrayContaining([
        "planning-closeout-goal-brief",
        "planning-closeout-calendar",
      ]),
    );
  });

  it("exposes structured points, KPI, communication, and boundary rows", () => {
    const surface = getTemplateBuilderSurface("planning-goal-setting");

    expect(surface?.pointsRows.map((row) => row.role)).toEqual(
      expect.arrayContaining(["president", "vice_president", "committee_chair"]),
    );
    expect(surface?.pointsRows.find((row) => row.role === "president")).toMatchObject({
      pointValues: [40],
      leaderboardVisible: false,
    });
    expect(surface?.kpiRows.find((row) => row.id === "planning-goals-set")).toMatchObject({
      label: "Goals set",
      metricKey: "goals_set",
      thresholdLabel: "One chapter goal per launch cycle",
    });
    expect(surface?.commRows.map((row) => row.id)).toEqual(
      expect.arrayContaining([
        "planning-coach-checkin-reminder",
        "planning-student-visibility-message",
      ]),
    );
    expect(surface?.integrationBoundaries.map((row) => row.system)).toEqual(
      expect.arrayContaining(["mymedlife", "warehouse", "hubspot"]),
    );
    expect(surface?.featureFlagRows.map((row) => row.id)).toEqual(
      expect.arrayContaining([
        "planning-builder-preview",
        "planning-runtime-reads",
      ]),
    );
    expect(surface?.auditRows.map((row) => row.id)).toEqual(
      expect.arrayContaining([
        "planning-audit-template-view",
        "planning-audit-coach-decision-preview",
      ]),
    );
    expect(
      surface?.auditRows.find((row) => row.id === "planning-audit-coach-decision-preview"),
    ).toMatchObject({
      linkedOutboxTopics: ["crm.coach_decisions"],
    });
    expect(surface?.engineCounts).toMatchObject({
      operationPermissions: expect.any(Number),
      validators: expect.any(Number),
      handoffs: expect.any(Number),
      featureFlags: expect.any(Number),
      importTraces: expect.any(Number),
    });
    expect(surface?.engineCounts.operationPermissions).toBeGreaterThan(0);
    expect(surface?.engineCounts.validators).toBeGreaterThan(0);
  });

  it("exposes structured preview scenarios for the imported template", () => {
    const surface = getTemplateBuilderSurface("planning-goal-setting");
    const goalBriefPreview = surface?.previewScenarios.find(
      (scenario) => scenario.id === "planning-goal-brief",
    );

    expect(surface?.previewScenarios.map((scenario) => scenario.id)).toEqual(
      expect.arrayContaining([
        "planning-goal-brief",
        "planning-first-calendar",
        "planning-coach-checkin",
      ]),
    );
    expect(goalBriefPreview).toMatchObject({
      primaryRole: "president",
      route: "/chapter?view=overview",
      proofRequested: "Leadership goal note",
      approvalRequired: "No",
      pointsEarned: "40 points",
      kpiChanges: "Goals set",
    });
  });

  it("exposes a structured builder surface for Rush Month", () => {
    const surface = getTemplateBuilderSurface("rush-month");

    expect(surface).not.toBeNull();
    expect(surface?.campaignName).toBe("Rush Month");
    expect(surface?.versionLabel).toBe("v2.1");
    expect(surface?.importStatus).toBe("draft_reviewed");
    expect(surface?.phaseLabels).toEqual([
      "Planning",
      "Launch",
      "Recruitment",
      "Onboarding",
      "Review",
    ]);
    expect(surface?.steps.map((step) => step.id)).toEqual([
      "rush-visibility",
      "rush-events",
      "rush-actions",
      "rush-proof",
      "rush-recognition",
    ]);
    expect(surface?.steps[0]).toMatchObject({
      phaseLabel: "Planning",
      primaryOwnerRole: "committee_chair",
    });
    expect(surface?.engineCounts.importTraces).toBeGreaterThan(0);
    expect(surface?.kpiRows.find((row) => row.id === "rush-month-kpi-leads-captured")).toMatchObject({
      label: "Leads Captured",
      targetValue: 80,
      metricKey: "leads_captured",
    });
    expect(
      surface?.previewScenarios.find((scenario) => scenario.id === "rush-member-loop"),
    ).toMatchObject({
      kpiChanges:
        "Leads Captured (target 80), Intro GBM RSVPs (target 50), Follow-ups Done (target 47)",
    });
  });

  it("builds a template-backed builder surface for another required SOP family", () => {
    const surface = getTemplateBuilderSurface("chapter-engagement");

    expect(surface).not.toBeNull();
    expect(surface?.importStatus).toBe("draft_reviewed");
    expect(surface?.campaignName).toBe("Chapter Engagement / Bi-Weekly Management");
    expect(surface?.steps.map((step) => step.id)).toEqual([
      "chapter-engagement-pulse",
      "chapter-engagement-events",
      "chapter-engagement-recognition",
      "chapter-engagement-retention",
      "chapter-engagement-coach-review",
    ]);
    expect(surface?.steps[0]).toMatchObject({
      title: "Find this week's participation pulse",
      primaryOwnerRole: "eboard_officer",
    });
    expect(surface?.roleMatrix.length).toBeGreaterThan(0);
    expect(surface?.integrationBoundaries.length).toBeGreaterThanOrEqual(1);
  });

  it("builds a richer template-backed builder surface for SLT Promotion", () => {
    const surface = getTemplateBuilderSurface("slt-promotion");

    expect(surface).not.toBeNull();
    expect(surface?.importStatus).toBe("draft_reviewed");
    expect(surface?.campaignName).toBe("SLT Promotion & Recruitment");
    expect(surface?.steps.map((step) => step.id)).toEqual([
      "slt-belief-proof",
      "slt-info-session",
      "slt-question-followup",
      "slt-commitment-path",
      "slt-coach-review",
    ]);
    expect(surface?.steps[3]).toMatchObject({
      route: "/slt-prep/payments",
      primaryOwnerRole: "president",
    });
    expect(surface?.steps[4]?.integrationEvents).toEqual(
      expect.arrayContaining(["shopify.payment.status.mocked"]),
    );
  });

  it("builds a richer template-backed builder surface for Moving Mountains", () => {
    const surface = getTemplateBuilderSurface("moving-mountains");

    expect(surface).not.toBeNull();
    expect(surface?.importStatus).toBe("draft_reviewed");
    expect(surface?.campaignName).toBe("Moving Mountains");
    expect(surface?.steps.map((step) => step.id)).toEqual([
      "moving-mountains-story",
      "moving-mountains-advocacy",
      "moving-mountains-fundraising",
      "moving-mountains-supporters",
      "moving-mountains-coach-review",
    ]);
    expect(surface?.steps[3]).toMatchObject({
      route: "/chapter?view=impact",
      primaryOwnerRole: "eboard_officer",
    });
    expect(surface?.steps[4]?.visibleRoutes).toEqual(
      expect.arrayContaining(["/coach?view=campaigns"]),
    );
  });

  it("builds a richer template-backed builder surface for Leadership Transition", () => {
    const surface = getTemplateBuilderSurface("leadership-transition");

    expect(surface).not.toBeNull();
    expect(surface?.importStatus).toBe("draft_reviewed");
    expect(surface?.campaignName).toBe("Leadership Transition");
    expect(surface?.steps.map((step) => step.id)).toEqual([
      "leadership-transition-successors",
      "leadership-transition-role-notes",
      "leadership-transition-committee-chairs",
      "leadership-transition-coach-review",
      "leadership-transition-risk-closeout",
    ]);
    expect(surface?.steps[2]).toMatchObject({
      route: "/chapter?view=committees",
      primaryOwnerRole: "committee_chair",
    });
    expect(surface?.steps[4]?.kpiLabels).toEqual(
      expect.arrayContaining(["open risks"]),
    );
    expect(surface?.roleMatrix.map((rule) => rule.role)).toEqual(
      expect.arrayContaining([
        "president",
        "eboard_officer",
        "committee_chair",
        "coach",
      ]),
    );
  });

  it("exposes script templates and resource links for imported review surfaces", () => {
    const surface = getTemplateBuilderSurface("planning-goal-setting");

    expect(surface?.scriptTemplates.map((row) => row.id)).toEqual(
      expect.arrayContaining([
        "planning-goal-alignment-script",
        "planning-coach-checkin-script",
      ]),
    );
    expect(surface?.resourceLinks.map((row) => row.id)).toEqual(
      expect.arrayContaining([
        "planning-resource-source-map",
        "planning-resource-gap-map",
      ]),
    );
  });
});
