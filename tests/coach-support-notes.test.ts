import { describe, expect, it } from "vitest";
import { getCoachSupportNotesWorkspace } from "@/services/coach-support-notes";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import type { RiskFlagRow } from "@/shared/types/persistence";

const data = getMockReadOnlyAppData("Testing coach support notes.");

describe("coach support notes workspace", () => {
  it("gives coaches a note plan without enabling writes or sends", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getCoachSupportNotesWorkspace(actor, data);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Coach support notes");
    expect(workspace.decision).toBe("intervene");
    expect(workspace.browserWritesEnabled).toBe(0);
    expect(workspace.externalWritesEnabled).toBe(0);
    expect(workspace.counts).toEqual({
      total: 5,
      readyForCheckIn: 0,
      needsFollowUp: 3,
      escalationWatch: 2,
      coachPrivate: 2,
    });
    expect(workspace.interventionChecklist.title).toBe(
      "Coach intervention checklist",
    );
    expect(workspace.interventionChecklist.counts).toEqual({
      total: 5,
      ready: 1,
      watch: 2,
      blocked: 2,
      browserWritesEnabled: 0,
      externalWritesEnabled: 0,
    });
    expect(workspace.finalPrompt).toContain("Do not save coach notes");
  });

  it("turns assignments, proof, and KPI posture into concrete coach notes", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getCoachSupportNotesWorkspace(actor, data);

    expect(workspace.notes.map((note) => note.key)).toEqual([
      "decision_rationale",
      "pending_evidence",
      "risk_response",
      "owner_check_in",
      "escalation_packet",
    ]);
    expect(
      workspace.notes.find((note) => note.key === "escalation_packet")?.label,
    ).toBe("Escalation summary note");
    expect(workspace.notes.find((note) => note.key === "decision_rationale")?.note).toContain(
      "intervene",
    );
    expect(workspace.notes.find((note) => note.key === "pending_evidence")?.note).toContain(
      "2 proof item",
    );
    expect(
      workspace.notes.find((note) => note.key === "pending_evidence")?.routeEvidence,
    ).toContain("/rush-month/review");
    expect(
      workspace.notes.every(
        (note) => note.browserWritesExpected === 0 && note.externalWritesExpected === 0,
      ),
    ).toBe(true);
  });

  it("turns proof and stalled work into a coach intervention checklist", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getCoachSupportNotesWorkspace(actor, data);

    expect(workspace.interventionChecklist.items.map((item) => item.key)).toEqual([
      "proof_review",
      "stalled_work",
      "decision_note",
      "risk_response",
      "escalation_boundary",
    ]);
    expect(
      workspace.interventionChecklist.items.find((item) => item.key === "proof_review")
        ?.sourceSignal,
    ).toBe("2 proof item(s) pending or needing changes");
    expect(
      workspace.interventionChecklist.items.find((item) => item.key === "stalled_work")
        ?.status,
    ).toBe("blocked");
    expect(
      workspace.interventionChecklist.items.find((item) => item.key === "decision_note")
        ?.action,
    ).toContain("Draft a blocker summary");
    expect(
      workspace.interventionChecklist.items.find(
        (item) => item.key === "escalation_boundary",
      )?.action,
    ).toContain("AI writes disabled");
    expect(workspace.interventionChecklist.blockedControls).toEqual(
      expect.arrayContaining([
        "coach note save",
        "coach decision save",
        "escalation summary send",
        "external automation",
      ]),
    );
    expect(
      workspace.interventionChecklist.items.every(
        (item) => item.browserWritesExpected === 0 && item.externalWritesExpected === 0,
      ),
    ).toBe(true);
  });

  it("uses the highest active risk row when risk data is visible", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getCoachSupportNotesWorkspace(actor, {
      ...data,
      riskFlags: [mediumRisk(), criticalRisk()],
    });
    const riskNote = workspace.notes.find((note) => note.key === "risk_response");

    expect(riskNote?.status).toBe("escalation_watch");
    expect(riskNote?.note).toContain("Critical follow-up needed");
    expect(riskNote?.nextStep).toContain("Coach prepares a private escalation note");
    expect(riskNote?.sourceSignals).toEqual(["critical risk: escalated"]);
    expect(
      workspace.interventionChecklist.items.find((item) => item.key === "risk_response")
        ?.status,
    ).toBe("blocked");
    expect(
      workspace.interventionChecklist.items.find((item) => item.key === "risk_response")
        ?.action,
    ).toContain("Coach prepares a private escalation note");
  });

  it("allows HQ support and super admin to review notes", () => {
    const admin = getCoachSupportNotesWorkspace(
      getMockLocalActorContext("admin@mymedlife.test"),
      data,
    );
    const superAdmin = getCoachSupportNotesWorkspace(
      getMockLocalActorContext("super.admin@mymedlife.test"),
      data,
    );

    expect(admin.canReadWorkspace).toBe(true);
    expect(admin.title).toBe("HQ coach support notes");
    expect(superAdmin.canReadWorkspace).toBe(true);
    expect(superAdmin.title).toBe("Full coach support notes");
  });

  it("can reflect a selected chapter and decision when the route narrows the coach note lane", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getCoachSupportNotesWorkspace(actor, data, {
      chapterName: "USC MEDLIFE",
      decision: "hold",
    });

    expect(workspace.chapterName).toBe("USC MEDLIFE");
    expect(workspace.decision).toBe("hold");
  });

  it("hides coach notes from chapter members, chapter leaders, and DS Admin", () => {
    const member = getCoachSupportNotesWorkspace(
      getMockLocalActorContext("member.a@mymedlife.test"),
      data,
    );
    const leader = getCoachSupportNotesWorkspace(
      getMockLocalActorContext("leader.a@mymedlife.test"),
      data,
    );
    const dsAdmin = getCoachSupportNotesWorkspace(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
      data,
    );

    expect(member.canReadWorkspace).toBe(false);
    expect(leader.canReadWorkspace).toBe(false);
    expect(dsAdmin.canReadWorkspace).toBe(false);
    expect(dsAdmin.notes).toEqual([]);
    expect(dsAdmin.interventionChecklist.items).toEqual([]);
  });

  it("keeps committee members and chairs out of coach note ownership", () => {
    const committeeMember = getCoachSupportNotesWorkspace(
      getMockLocalActorContext("committee.member@mymedlife.test"),
      data,
    );
    const committeeChair = getCoachSupportNotesWorkspace(
      getMockLocalActorContext("committee.chair@mymedlife.test"),
      data,
    );

    expect(committeeMember.canReadWorkspace).toBe(false);
    expect(committeeChair.canReadWorkspace).toBe(false);
    expect(committeeMember.notes).toEqual([]);
    expect(committeeChair.notes).toEqual([]);
  });
});

function mediumRisk(): RiskFlagRow {
  return {
    id: "risk-medium",
    chapter_id: "chapter-northview",
    campaign_id: "rush-month-2026",
    phase_id: null,
    assignment_id: "member-push",
    chapter_event_id: null,
    severity: "medium",
    visibility: "leader_visible",
    signal: "Follow-up owner not confirmed.",
    root_cause: null,
    owner_user_id: null,
    response_plan: "Leader confirms owner before next event.",
    status: "watching",
    due_at: null,
    created_by: null,
    resolved_at: null,
    created_at: "2026-06-16T00:00:00Z",
    updated_at: "2026-06-16T00:00:00Z",
  };
}

function criticalRisk(): RiskFlagRow {
  return {
    id: "risk-critical",
    chapter_id: "chapter-northview",
    campaign_id: "rush-month-2026",
    phase_id: null,
    assignment_id: "coach-summary",
    chapter_event_id: null,
    severity: "critical",
    visibility: "coach_private",
    signal: "Critical follow-up needed before the next student push.",
    root_cause: "Coach is monitoring escalation risk.",
    owner_user_id: null,
    response_plan: "Coach prepares a private escalation note.",
    status: "escalated",
    due_at: null,
    created_by: null,
    resolved_at: null,
    created_at: "2026-06-16T00:00:00Z",
    updated_at: "2026-06-16T00:00:00Z",
  };
}
