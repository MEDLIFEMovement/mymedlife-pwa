import { describe, expect, it } from "vitest";
import { getSopCampaignDefinition } from "@/data/mock-sop-builder";
import { getTemplateBuilderSurface } from "@/services/sop-template-builder-read-model";
import {
  buildWorkflowPreviewRow,
  buildWorkflowRolePreviewFields,
  getSopWorkflowRuntime,
  getWorkflowAccessTypeLabel,
  getWorkflowActionRequiredLabel,
  getWorkflowCommunicationRows,
  getWorkflowCommunicationSummary,
  getWorkflowCompletionRows,
  getWorkflowDistinctRoleCount,
  getWorkflowDistinctScopeCount,
  getWorkflowEvidenceTypeEntries,
  getWorkflowIntegrationBoundaryFocusId,
  getWorkflowPreviewRows,
  getWorkflowPreviewDistinctRoleCount,
  getWorkflowRoleImpactRows,
  getWorkflowRolePointsRows,
  getWorkflowRoleSummary,
} from "@/services/sop-workflow-runtime";

describe("sop workflow runtime", () => {
  it("builds a Rush Month runtime snapshot from the structured template version", () => {
    const runtime = getSopWorkflowRuntime("rush-month");

    expect(runtime).not.toBeNull();
    expect(runtime?.sourceKind).toBe("template_version");
    expect(runtime?.sourceVersionLabel).toBe("v2.1");
    expect(runtime?.currentStep?.id).toBe("rush-visibility");
    expect(runtime?.currentPhase?.id).toBe("rush-month-phase-1");
    expect(runtime?.currentPhase?.label).toBe("Planning");
    expect(runtime?.currentPhase?.objective).toContain("visible campus energy");
    expect(runtime?.currentPhase?.riskSignals).toContain(
      "If visibility planning slips, intro-event attendance and member action confidence both drop.",
    );
    expect(runtime?.kpis).toEqual([
      expect.objectContaining({
        metricKey: "leads_captured",
        label: "Leads Captured",
        targetValue: 80,
      }),
      expect.objectContaining({
        metricKey: "intro_gbm_rsvps",
        label: "Intro GBM RSVPs",
        targetValue: 50,
      }),
      expect.objectContaining({
        metricKey: "followups_completed",
        label: "Follow-ups Done",
        targetValue: 47,
      }),
      expect.objectContaining({
        metricKey: "new_members",
        label: "New Members",
        targetValue: 25,
      }),
    ]);
    expect(runtime?.steps.map((step) => step.id)).toEqual([
      "rush-visibility",
      "rush-events",
      "rush-actions",
      "rush-proof",
      "rush-recognition",
    ]);
    expect(runtime?.roleLanes.map((lane) => lane.role)).toEqual([
      "student_member",
      "committee_chair",
      "president",
      "coach",
      "department_staff",
    ]);
    expect(runtime?.futureStructuredEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "luma_event_linked",
        "luma_attendance_import_mocked",
        "kpi_event_recorded",
        "evidence_submitted",
        "audit_log_recorded",
      ]),
    );
    expect(runtime?.disabledOutboxItems.map((item) => item.destination)).toEqual(
      expect.arrayContaining(["Luma", "n8n", "warehouse", "HubSpot"]),
    );
    expect(runtime?.enginePosture.operationPermissionCount).toBeGreaterThan(0);
    expect(runtime?.enginePosture.validatorCount).toBeGreaterThan(0);
    expect(runtime?.enginePosture.handoffCount).toBeGreaterThan(0);
    expect(runtime?.enginePosture.featureFlagCount).toBeGreaterThan(0);
    expect(runtime?.enginePosture.sourceTraceCount).toBeGreaterThan(0);
  });

  it("builds a Planning / Goal Setting runtime snapshot from the structured template version", () => {
    const runtime = getSopWorkflowRuntime("planning-goal-setting");
    const builderSurface = getTemplateBuilderSurface("planning-goal-setting");

    expect(runtime).not.toBeNull();
    expect(builderSurface).not.toBeNull();
    expect(runtime?.sourceKind).toBe("template_version");
    expect(runtime?.sourceVersionLabel).toBe("v0 reviewed");
    expect(runtime?.currentStep?.id).toBe("planning-goal-brief");
    expect(runtime?.currentPhase?.id).toBe("planning-gsw-preparation");
    expect(runtime?.currentPhase?.label).toBe("GSW Preparation");
    expect(runtime?.currentPhase?.riskSignals).toContain("Missing owner on a core lane");
    expect(runtime?.steps.map((step) => step.id)).toEqual([
      "planning-goal-brief",
      "planning-owner-map",
      "planning-first-calendar",
      "planning-risk-review",
      "planning-coach-checkin",
    ]);
    expect(runtime?.kpis.map((kpi) => kpi.label)).toEqual(
      expect.arrayContaining([
        "Goals set",
        "Owners assigned",
        "Calendar published",
      ]),
    );
    expect(runtime?.futureStructuredEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "campaign.phase.started",
        "kpi.event.created",
        "coach.decision.advance_hold_intervene",
        "audit_log_recorded",
      ]),
    );
    expect(runtime?.enginePosture.operationPermissionCount).toBeGreaterThan(0);
    expect(runtime?.enginePosture.validatorCount).toBeGreaterThan(0);
    expect(runtime?.enginePosture.handoffCount).toBeGreaterThan(0);
    expect(runtime?.enginePosture.featureFlagCount).toBeGreaterThan(0);
    expect(runtime?.enginePosture.sourceTraceCount).toBeGreaterThan(0);
    expect(runtime?.enginePosture.missingSourceConfirmationCount).toBeGreaterThanOrEqual(1);
    expect(runtime?.safetyNotes.join(" ")).toContain("permissions matrix");
    expect(runtime?.previewScenarios).toEqual(
      builderSurface?.previewScenarios.map((scenario) =>
        expect.objectContaining({
          id: scenario.id,
          title: scenario.title,
          primaryRole: scenario.primaryRole,
          route: scenario.route,
          visibleStates: scenario.visibleStates,
          successSignal: scenario.successSignal,
        }),
      ),
    );
    expect(runtime?.previewScenarios[0]).toMatchObject({
      proofRequested: "Leadership goal note",
      approvalRequired: "No",
      kpiChanges: expect.stringContaining("Goals set"),
    });
    const planningDefinition = getSopCampaignDefinition("planning-goal-setting");

    expect(planningDefinition).not.toBeNull();
    expect(
      getWorkflowRoleSummary(planningDefinition!, "president"),
    ).toMatchObject({
      evidenceSummary: "Required",
      approvalSummary: "None",
      pointSummary: "30 avg",
      kpiSummary: "Chapter Health",
    });
    expect(
      getWorkflowRoleImpactRows(planningDefinition!).find((row) => row.role === "president"),
    ).toMatchObject({
      role: "president",
      scope: "chapter",
      route: "/chapter?view=overview",
      summary: expect.stringContaining("Keep chapter priorities"),
      evidenceSummary: "Required",
      approvalSummary: "None",
      pointSummary: "30 avg",
      kpiSummary: "Chapter Health",
      messagingSummary: expect.stringContaining("workflow-triggered messages"),
    });
    expect(
      getWorkflowRolePointsRows(planningDefinition!).find((row) => row.role === "president"),
    ).toMatchObject({
      role: "president",
      chapterPoints: "Visible in chapter total",
      pointValue: "30 avg",
      kpiImpact: "Chapter Health",
      approvalBeforePoints: "None",
      leaderboardVisible: "Visible",
      capsOverride: "Chapter cap later",
    });
  });

  it("derives communication rows and summary from the shared workflow runtime", () => {
    const runtimeDefinition = getSopCampaignDefinition("rush-month");

    expect(runtimeDefinition).not.toBeNull();
    expect(getWorkflowCommunicationSummary(runtimeDefinition!)).toEqual({
      enabledInternallyCount: 1,
      blockedExternalCount: 1,
    });
    expect(getWorkflowCommunicationRows(runtimeDefinition!)).toEqual([
      expect.objectContaining({
        id: "rush-month-internal",
        enabled: true,
        trigger: "Keep internal reminders visible as future automation intent",
        detail: expect.stringContaining("route copy and status pills"),
        audience: "chapter members and leaders",
        sourceSystemLabel: "myMEDLIFE app",
        timingLabel: "Reminder cadence",
        approvalLabel: "No external approval needed",
        deliveryModeLabel: "internal only",
        workflowReference: "Rush Month workflow",
      }),
      expect.objectContaining({
        id: "rush-month-external",
        enabled: false,
        trigger: "Block external sends until the workflow is approved",
        detail: expect.stringContaining("No email, SMS, AI action"),
        audience: "students and staff",
        sourceSystemLabel: "HubSpot / downstream only",
        timingLabel: "After approval",
        approvalLabel: "Blocked until approved",
        deliveryModeLabel: "disabled",
        workflowReference: "Rush Month workflow",
      }),
    ]);
  });

  it("derives completion, evidence, and approval rows from the shared workflow runtime", () => {
    const runtimeDefinition = getSopCampaignDefinition("rush-month");

    expect(runtimeDefinition).not.toBeNull();
    expect(getWorkflowCompletionRows(runtimeDefinition!)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "rush-action-started",
          family: "Completion rule",
          completionType: "Manual",
          evidenceType: "State readback",
          reviewerRole: "—",
          approvalRequired: "No",
          route: "/rush-month/events",
          previewLabel: "Preview as student member",
        }),
        expect.objectContaining({
          id: "rush-proof-ready",
          family: "Completion rule",
          completionType: "Evidence",
          previewLabel: "Preview as student member",
        }),
        expect.objectContaining({
          id: "rush-leaderboard-context",
          family: "Completion rule",
          completionType: "Checklist",
          previewLabel: "Preview as student member",
        }),
        expect.objectContaining({
          id: "rush-month-story-proof",
          family: "Evidence rule",
          completionType: "Evidence",
          evidenceType: "testimonial text, bridge video, event photo",
          reviewerRole: "Visible before reviewer handoff",
          approvalRequired: "Conditional",
          previewLabel: "Preview as committee member",
        }),
        expect.objectContaining({
          id: "rush-month-leader-review",
          family: "Approval rule",
          completionType: "Approval",
          evidenceType: "Review packet",
          reviewerRole: "president",
          approvalRequired: "Yes",
          previewLabel: "Preview as president",
        }),
        expect.objectContaining({
          id: "rush-month-hq-review",
          family: "Approval rule",
          completionType: "Approval",
          reviewerRole: "department staff",
          approvalRequired: "Yes",
          previewLabel: "Preview as department staff",
        }),
      ]),
    );
  });

  it("derives access and action labels from the shared workflow runtime", () => {
    expect(getWorkflowAccessTypeLabel("president")).toBe("approve");
    expect(getWorkflowAccessTypeLabel("department_staff")).toBe("configure");
    expect(getWorkflowActionRequiredLabel("president")).toBe("Yes");
    expect(getWorkflowActionRequiredLabel("department_staff")).toBe("Optional review");
  });

  it("builds shared preview rows from workflow preview scenarios", () => {
    const runtime = getSopWorkflowRuntime("rush-month");

    expect(runtime).not.toBeNull();
    expect(buildWorkflowPreviewRow(runtime!.previewScenarios[0]!)).toMatchObject({
      id: "rush-member-loop",
      title: "Member mobile loop",
      actionAppears: "Member mobile loop",
      primaryRole: "student_member",
      route: "/rush-month/dashboard",
      proofRequested: "None",
      approvalRequired: "Conditional",
    });
  });

  it("builds shared role preview fields from workflow roles", () => {
    expect(buildWorkflowRolePreviewFields("president", "/chapter?view=overview")).toEqual({
      previewHref: "/local-preview?selectedEmail=leader.a%40mymedlife.test&returnTo=%2Fchapter%3Fview%3Doverview",
      previewLabel: "Preview as president",
    });
  });

  it("selects workflow preview rows from runtime, template, or definition data", () => {
    const runtime = getSopWorkflowRuntime("rush-month");
    const planningDefinition = getSopCampaignDefinition("planning-goal-setting");
    const planningSurface = getTemplateBuilderSurface("planning-goal-setting");

    expect(runtime).not.toBeNull();
    expect(
      getWorkflowPreviewRows(planningDefinition!, runtime?.previewScenarios, null)[0],
    ).toMatchObject({
      id: "rush-member-loop",
      title: "Member mobile loop",
      primaryRole: "student_member",
    });
    expect(getWorkflowPreviewRows(planningDefinition!, null, planningSurface?.previewScenarios)[0]).toMatchObject({
      id: "planning-goal-brief",
      title: "Define the chapter goal and deadline",
      primaryRole: "president",
    });
    expect(getWorkflowPreviewRows(planningDefinition!, null, null)[0]).toMatchObject({
      id: "planning-goal-setting-student",
      title: "Student-facing campaign state",
      proofRequested: "None",
      approvalRequired: "No",
      communicationTrigger: "No workflow-triggered messages",
    });
    expect(
      getWorkflowPreviewDistinctRoleCount(
        getWorkflowPreviewRows(planningDefinition!, runtime?.previewScenarios, planningSurface?.previewScenarios),
      ),
    ).toBeGreaterThan(0);
  });

  it("derives workflow counts, evidence entries, and boundary ids from the shared runtime", () => {
    const definition = getSopCampaignDefinition("rush-month");

    expect(definition).not.toBeNull();
    expect(getWorkflowDistinctRoleCount(definition!)).toBe(5);
    expect(getWorkflowDistinctScopeCount(definition!)).toBe(5);
    expect(getWorkflowIntegrationBoundaryFocusId("HubSpot")).toBe("boundary-hubspot");
    expect(getWorkflowEvidenceTypeEntries(definition!)).toEqual([
      expect.objectContaining({
        label: "None",
        state: "unused",
      }),
      expect.objectContaining({
        label: "Text",
        state: "modeled",
      }),
      expect.objectContaining({
        label: "Link",
        state: "future",
      }),
      expect.objectContaining({
        label: "File",
        state: "future",
      }),
      expect.objectContaining({
        label: "Image",
        state: "modeled",
      }),
      expect.objectContaining({
        label: "Video",
        state: "modeled",
      }),
      expect.objectContaining({
        label: "Attendance",
        state: "modeled",
      }),
    ]);
  });

  it("reuses the existing SOP builder preview scenarios for Rush Month runtime states", () => {
    const runtime = getSopWorkflowRuntime("rush-month");
    const builderSurface = getTemplateBuilderSurface("rush-month");

    expect(runtime).not.toBeNull();
    expect(builderSurface).not.toBeNull();
    expect(runtime?.previewScenarios).toEqual(
      builderSurface?.previewScenarios.map((scenario) =>
        expect.objectContaining({
          id: scenario.id,
          title: scenario.title,
          primaryRole: scenario.primaryRole,
          route: scenario.route,
          visibleStates: scenario.visibleStates,
          successSignal: scenario.successSignal,
        }),
      ),
    );
    expect(runtime?.previewScenarios[0]).toMatchObject({
      proofRequested: "None",
      approvalRequired: "Conditional",
    });
  });

  it("uses structured template versions for the additional required SOP families", () => {
    const chapterEngagement = getSopWorkflowRuntime("chapter-engagement");
    const sltPromotion = getSopWorkflowRuntime("slt-promotion");
    const movingMountains = getSopWorkflowRuntime("moving-mountains");
    const leadershipTransition = getSopWorkflowRuntime("leadership-transition");
    const growTheMovement = getSopWorkflowRuntime("grow-the-movement");
    const startAChapter = getSopWorkflowRuntime("start-a-chapter");

    expect(chapterEngagement?.sourceKind).toBe("template_version");
    expect(chapterEngagement?.sourceVersionLabel).toBe("v0 reviewed");
    expect(sltPromotion?.sourceKind).toBe("template_version");
    expect(sltPromotion?.steps.map((step) => step.id)).toEqual([
      "slt-belief-proof",
      "slt-info-session",
      "slt-question-followup",
      "slt-commitment-path",
      "slt-coach-review",
    ]);
    expect(sltPromotion?.futureStructuredEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining(["shopify.payment.status.mocked"]),
    );
    expect(movingMountains?.sourceKind).toBe("template_version");
    expect(movingMountains?.steps.map((step) => step.id)).toEqual([
      "moving-mountains-story",
      "moving-mountains-advocacy",
      "moving-mountains-fundraising",
      "moving-mountains-supporters",
      "moving-mountains-coach-review",
    ]);
    expect(movingMountains?.kpis.length).toBeGreaterThan(0);
    expect(leadershipTransition?.sourceKind).toBe("template_version");
    expect(leadershipTransition?.currentPhase?.label).toBe("Successor map");
    expect(leadershipTransition?.steps.map((step) => step.id)).toEqual([
      "leadership-transition-successors",
      "leadership-transition-role-notes",
      "leadership-transition-committee-chairs",
      "leadership-transition-coach-review",
      "leadership-transition-risk-closeout",
    ]);
    expect(leadershipTransition?.roleLanes.map((lane) => lane.role)).toEqual(
      expect.arrayContaining([
        "president",
        "eboard_officer",
        "committee_chair",
        "coach",
      ]),
    );
    expect(growTheMovement?.sourceKind).toBe("template_version");
    expect(growTheMovement?.sourceVersionLabel).toBe("v0 reviewed");
    expect(growTheMovement?.currentPhase?.label).toBe("Phase 1");
    expect(growTheMovement?.enginePosture.missingSourceConfirmationCount).toBeGreaterThan(0);
    expect(startAChapter?.sourceKind).toBe("template_version");
    expect(startAChapter?.sourceVersionLabel).toBe("v0 reviewed");
    expect(startAChapter?.steps.length).toBeGreaterThan(0);
    expect(startAChapter?.enginePosture.missingSourceConfirmationCount).toBeGreaterThan(0);
  });
});
