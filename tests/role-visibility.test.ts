import { describe, expect, it } from "vitest";
import { assignments } from "@/data/mock-rush-month";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  canReadChapterData,
  canReadIntegrationOutbox,
  getMobileQuickNavigationForActor,
  getNavigationForActor,
  getVisibleAdminPanelsForActor,
  getVisibleAssignmentsForActor,
  getVisibleRiskFlagsForActor,
} from "@/services/role-visibility";
import type { RiskFlagRow } from "@/shared/types/persistence";

describe("role visibility service", () => {
  it("keeps member assignment visibility limited to member-lane work", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const visibleAssignments = getVisibleAssignmentsForActor(actor, assignments);

    expect(visibleAssignments).toHaveLength(1);
    expect(visibleAssignments.every((assignment) => assignment.lane === "Member")).toBe(true);
  });

  it("lets chapter leaders read member and leader work but not coach-only work", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const visibleAssignments = getVisibleAssignmentsForActor(actor, assignments);

    expect(visibleAssignments.map((assignment) => assignment.lane)).toContain("Member");
    expect(visibleAssignments.map((assignment) => assignment.lane)).toContain("Leader");
    expect(visibleAssignments.some((assignment) => assignment.lane === "Coach")).toBe(false);
  });

  it("keeps DS Admin out of student and chapter truth while allowing outbox read", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(canReadChapterData(actor)).toBe(false);
    expect(getVisibleAssignmentsForActor(actor, assignments)).toEqual([]);
    expect(getVisibleRiskFlagsForActor(actor, fakeRisks)).toEqual([]);
    expect(canReadIntegrationOutbox(actor)).toBe(true);
    expect(getVisibleAdminPanelsForActor(actor).map((panel) => panel.key)).toEqual([
      "integration_outbox",
    ]);
  });

  it("shows coach-private risks to coaches but not chapter leaders", () => {
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");

    expect(getVisibleRiskFlagsForActor(coach, fakeRisks)).toHaveLength(2);
    expect(getVisibleRiskFlagsForActor(leader, fakeRisks).map((risk) => risk.id)).toEqual([
      "risk-leader-visible",
    ]);
  });

  it("gives admin proof/support panels without DS outbox ownership", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");

    expect(canReadChapterData(actor)).toBe(true);
    expect(canReadIntegrationOutbox(actor)).toBe(false);
    expect(getVisibleAdminPanelsForActor(actor).map((panel) => panel.key)).toEqual([
      "support_context",
      "proof_sharing",
    ]);
  });

  it("gives super admin full local oversight", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(getVisibleAssignmentsForActor(actor, assignments)).toHaveLength(assignments.length);
    expect(getVisibleRiskFlagsForActor(actor, fakeRisks)).toHaveLength(fakeRisks.length);
    expect(canReadIntegrationOutbox(actor)).toBe(true);
    expect(getVisibleAdminPanelsForActor(actor).map((panel) => panel.key)).toEqual([
      "support_context",
      "proof_sharing",
      "integration_outbox",
      "full_oversight",
    ]);
  });

  it("labels navigation by actor role", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");

    expect(getNavigationForActor(member).map((item) => item.label)).toContain("My Actions");
    expect(getNavigationForActor(leader).map((item) => item.label)).toContain("Members");
    expect(getNavigationForActor(dsAdmin)).toEqual([
      { href: "/admin", label: "Integration Outbox" },
      { href: "/admin/first-write", label: "First Write Safety" },
      { href: "/admin/pilot-scope", label: "Pilot Safety" },
      { href: "/admin/staff-dry-run", label: "Dry Run Safety" },
    ]);
  });

  it("gives members a mobile quick path to their week, actions, proof, and chapter", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");

    expect(getMobileQuickNavigationForActor(actor)).toEqual([
      { href: "/rush-month/dashboard", label: "My Week", helper: "Next" },
      { href: "/rush-month/actions", label: "Actions", helper: "Do" },
      { href: "/proof-library", label: "Proof", helper: "Learn" },
      { href: "/chapter", label: "Chapter", helper: "Home" },
    ]);
  });

  it("gives chapter leaders mobile shortcuts for planning, nudges, proof review, and loop demo", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");

    expect(getMobileQuickNavigationForActor(actor).map((item) => item.label)).toEqual([
      "Rush",
      "People",
      "Review",
      "Loop",
    ]);
  });

  it("keeps DS Admin mobile navigation focused on disabled outbox safety checks", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getMobileQuickNavigationForActor(actor)).toEqual([
      { href: "/admin", label: "Outbox", helper: "Safety" },
      { href: "/admin/first-write", label: "Write", helper: "No sends" },
      { href: "/admin/pilot-scope", label: "Pilot", helper: "No sends" },
    ]);
  });

  it("gives super admin mobile oversight without hiding the Rush Month reviewer paths", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(getMobileQuickNavigationForActor(actor).map((item) => item.label)).toEqual([
      "Admin",
      "Write",
      "Pilot",
      "Dry Run",
    ]);
  });
});

const fakeRisks: RiskFlagRow[] = [
  {
    id: "risk-leader-visible",
    chapter_id: "chapter-northview",
    campaign_id: "rush-month-2026",
    phase_id: null,
    assignment_id: "member-push",
    chapter_event_id: null,
    severity: "medium",
    visibility: "leader_visible",
    signal: "Invite push is behind plan.",
    root_cause: "Owners need clearer next steps.",
    owner_user_id: null,
    response_plan: "Leader follows up in committee standup.",
    status: "open",
    due_at: null,
    created_by: null,
    resolved_at: null,
    created_at: "2026-06-16T00:00:00Z",
    updated_at: "2026-06-16T00:00:00Z",
  },
  {
    id: "risk-coach-private",
    chapter_id: "chapter-northview",
    campaign_id: "rush-month-2026",
    phase_id: null,
    assignment_id: "coach-summary",
    chapter_event_id: null,
    severity: "high",
    visibility: "coach_private",
    signal: "Chapter may need staff escalation.",
    root_cause: "Coach is monitoring handoff risk.",
    owner_user_id: null,
    response_plan: "Coach prepares a private escalation note.",
    status: "watching",
    due_at: null,
    created_by: null,
    resolved_at: null,
    created_at: "2026-06-16T00:00:00Z",
    updated_at: "2026-06-16T00:00:00Z",
  },
];
