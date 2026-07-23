import { describe, expect, it } from "vitest";

import { getAppOwnedCampaignReadback } from "@/services/campaign-readback";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import type { PhaseRow, RiskFlagRow } from "@/shared/types/persistence";

const phaseBase: PhaseRow = {
  id: "phase-1",
  chapter_id: "chapter-northview",
  campaign_id: "rush-month-2026",
  phase_template_id: null,
  title: "Recruit",
  objective: "Recruit the next member cohort.",
  starts_at: null,
  ends_at: null,
  status: "active",
  readiness_status: "ready",
  coach_validation_status: "not_required",
  required_outputs: [],
  entry_criteria: [],
  exit_criteria: "Ten members recruited",
  created_at: "2026-06-15T00:00:00Z",
  updated_at: "2026-06-15T00:00:00Z",
};

const riskBase: RiskFlagRow = {
  id: "risk-1",
  chapter_id: "chapter-northview",
  campaign_id: "rush-month-2026",
  phase_id: null,
  assignment_id: null,
  chapter_event_id: null,
  severity: "high",
  visibility: "coach_private",
  signal: "Registration pace is behind target.",
  root_cause: null,
  owner_user_id: null,
  response_plan: "Review outreach plan.",
  status: "open",
  due_at: null,
  created_by: null,
  resolved_at: null,
  created_at: "2026-06-15T00:00:00Z",
  updated_at: "2026-06-15T00:00:00Z",
};

describe("app-owned campaign readback", () => {
  it("builds campaign progress and action groups from persisted rows", () => {
    const data = getMockReadOnlyAppData("test");
    const campaignRow = {
      ...data.campaignRows[0],
      id: data.campaign.id,
      chapter_id: data.chapter.id,
      name: "Fall Service Campaign",
      slug: "fall-service-campaign",
      objective: "Serve the local community.",
      status: "complete" as const,
    };

    const readback = getAppOwnedCampaignReadback({
      ...data,
      source: {
        mode: "supabase",
        status: "supabase_ready",
        message: "App-owned campaign data loaded.",
      },
      campaignRows: [campaignRow],
      assignments: [
        {
          ...data.assignments[0],
          title: "Invite five members",
          ownerRole: "General Member",
          status: "approved",
          kpi: "member_invites",
        },
        {
          ...data.assignments[1],
          title: "Confirm the venue",
          ownerRole: "Chapter President / Vice President",
          status: "in_progress",
          kpi: "event_readiness",
        },
      ],
      evidenceItems: [],
      pointsEventRows: [],
      lumaEventLinkRows: [],
      chapterEventRows: [],
    });

    expect(readback.campaigns).toEqual([
      expect.objectContaining({
        name: "Fall Service Campaign",
        slug: "fall-service-campaign",
        status: "complete",
        primaryKpis: ["member_invites", "event_readiness"],
      }),
    ]);
    expect(readback.progressPercent).toBe(50);
    expect(readback.progressLabel).toBe("1/2 assignments approved");
    expect(readback.actionGroups).toEqual([
      expect.objectContaining({
        role: "General Member",
        completionLabel: "1/1 approved",
      }),
      expect.objectContaining({
        role: "Chapter President / Vice President",
        completionLabel: "0/1 approved",
      }),
    ]);
    expect(readback.nextEvent).toBeNull();
    expect(readback.goodLooksLike.join(" ")).toContain(
      "No app-owned chapter event",
    );
  });

  it("returns an honest empty campaign state without fixture substitution", () => {
    const data = getMockReadOnlyAppData("test");

    const readback = getAppOwnedCampaignReadback({
      ...data,
      source: {
        mode: "supabase",
        status: "chapter_access_missing",
        message: "No chapter access.",
      },
      campaignRows: [],
      assignments: [],
      phases: [],
      chapterEventRows: [],
      evidenceItems: [],
      pointsEventRows: [],
      lumaEventLinkRows: [],
    });

    expect(readback.campaigns).toEqual([]);
    expect(readback.progressPercent).toBe(0);
    expect(readback.actionGroups).toEqual([]);
    expect(readback.sourceMessage).toBe("No chapter access.");
  });

  it("summarizes app-owned phase, event, proof, risk, integration, and ledger rows", () => {
    const data = getMockReadOnlyAppData("test");
    const campaignRow = {
      ...data.campaignRows[0],
      id: data.campaign.id,
      chapter_id: data.chapter.id,
      status: "draft" as const,
    };
    const event = {
      ...data.chapterEventRows[0],
      status: "published" as const,
    };
    const evidenceItems = [
      {
        ...data.evidenceItems[0],
        status: "pending_review" as const,
      },
      {
        ...data.evidenceItems[0],
        id: "evidence-2",
        status: "changes_requested" as const,
      },
    ];
    const integrationEventRows = [
      {
        ...data.integrationEventRows[0],
        status: "disabled" as const,
      },
      {
        ...data.integrationEventRows[0],
        id: "integration-2",
        status: "failed" as const,
      },
    ];

    const readback = getAppOwnedCampaignReadback({
      ...data,
      campaignRows: [campaignRow],
      phases: [phaseBase],
      riskFlags: [riskBase],
      evidenceItems,
      chapterEventRows: [event],
      integrationEventRows,
      pointsEventRows: [data.pointsEventRows[0]],
      lumaEventLinkRows: [data.lumaEventLinkRows[0]],
    });

    expect(readback.campaigns[0]).toEqual(
      expect.objectContaining({
        status: "planned",
        operatingRhythm: "Recruit: Recruit the next member cohort.",
        proofUse: "2 app-owned proof records attached to this campaign.",
        coachFocus: "1 open campaign risk needs attention.",
        integrationPosture:
          "1 app-owned Luma event link is recorded. Provider writes remain separately gated.",
        workflowSnapshot: expect.objectContaining({
          currentPhaseExitSignal: "Ten members recruited",
        }),
      }),
    );
    expect(readback.summary).toEqual(
      expect.objectContaining({
        plannedCampaigns: 1,
        linkedMockEvents: 1,
        hqProofItems: 2,
        disabledIntegrationEvents: 2,
      }),
    );
    expect(readback.nextEvent).toEqual({
      id: event.id,
      title: event.title,
      statusLabel: "published",
    });
    expect(readback.goodLooksLike).toEqual([
      "1 app-owned chapter event is recorded",
      expect.stringContaining("assignments are visible"),
      "2 proof records are attached",
      "1 points ledger entry is recorded",
    ]);
  });

  it.each([
    ["rush-campaign", "rush_month"],
    ["annual-fundraiser", "fundraising"],
    ["volunteer-week", "local_volunteering"],
    ["med-talk-series", "med_talk"],
    ["social-week", "social"],
    ["slt-campaign", "slt_promotion"],
    ["moving-mountains", "moving_mountains"],
    ["leadership-transition", "leadership_transition"],
    ["grow-campaign", "grow_the_movement"],
    ["start-a-chapter", "start_a_chapter"],
    ["mobile-clinic", "mobile_clinic"],
    ["proof-drive", "proof_storytelling"],
    ["planning-cycle", "planning_goal_setting"],
    ["goal-setting", "planning_goal_setting"],
    ["chapter-week", "chapter_engagement"],
  ] as const)("maps campaign slug %s to %s", (slug, family) => {
    const data = getMockReadOnlyAppData("test");
    const campaignRow = {
      ...data.campaignRows[0],
      id: data.campaign.id,
      chapter_id: data.chapter.id,
      slug,
    };

    const readback = getAppOwnedCampaignReadback({
      ...data,
      campaignRows: [campaignRow],
      assignments: [],
      phases: [],
      chapterEventRows: [],
      evidenceItems: [],
      pointsEventRows: [],
      lumaEventLinkRows: [],
      riskFlags: [],
    });

    expect(readback.campaigns[0]?.family).toBe(family);
  });

  it.each([
    ["Array", ["one", 2, "three"] as Array<string | number>, "one; three"],
    ["Object", { attendance: "verified", count: 10 }, "attendance: verified; count: 10"],
    ["Missing", null, "No exit criteria recorded."],
  ] as const)("formats %s phase exit criteria", (_label, exitCriteria, expected) => {
    const data = getMockReadOnlyAppData("test");
    const campaignRow = {
      ...data.campaignRows[0],
      id: data.campaign.id,
      chapter_id: data.chapter.id,
    };

    const readback = getAppOwnedCampaignReadback({
      ...data,
      campaignRows: [campaignRow],
      phases: [
        {
          ...phaseBase,
          exit_criteria: exitCriteria,
        },
      ],
    });

    expect(
      readback.campaigns[0]?.workflowSnapshot?.currentPhaseExitSignal,
    ).toBe(expected);
  });

  it("uses the next not-started phase and the first event when no open event remains", () => {
    const data = getMockReadOnlyAppData("test");
    const campaignRow = {
      ...data.campaignRows[0],
      id: data.campaign.id,
      chapter_id: data.chapter.id,
    };
    const completedEvent = {
      ...data.chapterEventRows[0],
      status: "completed" as const,
    };

    const readback = getAppOwnedCampaignReadback({
      ...data,
      campaignRows: [campaignRow],
      phases: [
        { ...phaseBase, id: "complete", status: "complete" },
        { ...phaseBase, id: "next", title: "Activate", status: "not_started" },
      ],
      chapterEventRows: [completedEvent],
    });

    expect(readback.currentPhaseLabel).toBe("Activate");
    expect(readback.nextEvent?.id).toBe(completedEvent.id);
  });
});
