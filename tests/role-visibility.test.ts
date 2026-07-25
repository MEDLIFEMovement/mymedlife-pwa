import { describe, expect, it } from "vitest";
import { assignments } from "@/data/mock-rush-month";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  canAccessAdminWorkspace,
  canAccessLeaderWorkspace,
  canAccessMemberWorkspace,
  canAccessStaffWorkspace,
  canReadAdminIntegrationsSecurity,
  canReadChapterData,
  canReadIntegrationOutbox,
  getActorSurfaceFamily,
  getMobileQuickNavigationForActor,
  getNavigationForActor,
  getVisibleAdminPanelsForActor,
  getVisibleAssignmentsForActor,
  getVisibleRiskFlagsForActor,
  isMemberSurfaceFamily,
} from "@/services/role-visibility";
import {
  canAccessWorkspace,
  isPreviewWorkspaceAccess,
} from "@/services/workspace-access";
import type { RiskFlagRow } from "@/shared/types/persistence";

describe("role visibility service", () => {
  it("keeps member assignment visibility limited to member-lane work", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const visibleAssignments = getVisibleAssignmentsForActor(actor, assignments);

    expect(visibleAssignments).toHaveLength(3);
    expect(visibleAssignments.every((assignment) => assignment.lane === "Member")).toBe(true);
  });

  it("keeps action committee members in member-lane visibility", () => {
    const actor = getMockLocalActorContext("committee.member@mymedlife.test");
    const visibleAssignments = getVisibleAssignmentsForActor(actor, assignments);
    const navLabels = getNavigationForActor(actor).map((item) => item.label);

    expect(actor.chapterRoles).toEqual(["Action Committee Member"]);
    expect(visibleAssignments).toHaveLength(3);
    expect(visibleAssignments.every((assignment) => assignment.lane === "Member")).toBe(true);
    expect(navLabels).toEqual(["Home", "Stories", "Events", "Points", "Profile"]);
  });

  it("lets chapter leaders read member and leader work but not coach-only work", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const visibleAssignments = getVisibleAssignmentsForActor(actor, assignments);

    expect(visibleAssignments.map((assignment) => assignment.lane)).toContain("Member");
    expect(visibleAssignments.map((assignment) => assignment.lane)).toContain("Leader");
    expect(visibleAssignments.some((assignment) => assignment.lane === "Coach")).toBe(false);
  });

  it("lets action committee chairs use chapter-leader visibility", () => {
    const actor = getMockLocalActorContext("committee.chair@mymedlife.test");
    const visibleAssignments = getVisibleAssignmentsForActor(actor, assignments);

    expect(actor.chapterRoles).toEqual(["Action Committee Chair"]);
    expect(visibleAssignments.map((assignment) => assignment.lane)).toContain("Member");
    expect(visibleAssignments.map((assignment) => assignment.lane)).toContain("Leader");
    expect(visibleAssignments.some((assignment) => assignment.lane === "Coach")).toBe(false);
    expect(getNavigationForActor(actor).map((item) => item.label)).toContain("Attendance");
  });

  it("keeps DS Admin out of student and chapter truth while allowing outbox read", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(canReadChapterData(actor)).toBe(false);
    expect(getVisibleAssignmentsForActor(actor, assignments)).toEqual([]);
    expect(getVisibleRiskFlagsForActor(actor, fakeRisks)).toEqual([]);
    expect(canReadIntegrationOutbox(actor)).toBe(true);
    expect(canReadAdminIntegrationsSecurity(actor)).toBe(true);
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

  it("keeps staff out of the DS admin backend panels", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");

    expect(canReadChapterData(actor)).toBe(true);
    expect(canReadIntegrationOutbox(actor)).toBe(false);
    expect(canReadAdminIntegrationsSecurity(actor)).toBe(false);
    expect(getVisibleAdminPanelsForActor(actor)).toEqual([]);
  });

  it("gives super admin full local oversight", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(getVisibleAssignmentsForActor(actor, assignments)).toHaveLength(assignments.length);
    expect(getVisibleRiskFlagsForActor(actor, fakeRisks)).toHaveLength(fakeRisks.length);
    expect(canReadIntegrationOutbox(actor)).toBe(true);
    expect(canReadAdminIntegrationsSecurity(actor)).toBe(true);
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
    const coach = getMockLocalActorContext("coach@mymedlife.test");
    const admin = getMockLocalActorContext("admin@mymedlife.test");
    const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(getNavigationForActor(member).map((item) => item.label)).toEqual([
      "Home",
      "Stories",
      "Events",
      "Points",
      "Profile",
    ]);
    expect(getNavigationForActor(leader).map((item) => item.label)).toEqual([
      "Overview",
      "Events",
      "Attendance",
      "Leaderboard",
    ]);
    expect(getNavigationForActor(leader).find((item) => item.label === "Attendance")).toEqual({
      href: "/leader?view=attendance",
      label: "Attendance",
    });
    expect(getNavigationForActor(coach).map((item) => item.label)).toEqual([
      "Portfolio",
      "Events",
      "Leaderboard",
    ]);
    expect(getNavigationForActor(admin).map((item) => item.label)).toEqual([
      "Chapters",
      "Campaigns",
      "Proof / UGC",
      "Best Practices",
      "Campaign SOPs",
      "Admin",
    ]);
    expect(getNavigationForActor(superAdmin).map((item) => item.label)).toEqual([
      "Admin Home",
      "Users",
      "Chapters",
      "Access",
      "Outbox",
      "Luma",
      "HubSpot",
      "Audit Log",
      "Launch Gate",
      "Pilot Scope",
      "Profile",
    ]);
    expect(getNavigationForActor(dsAdmin)).toEqual([
      { href: "/admin", label: "Admin Home" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/chapters", label: "Chapters" },
      { href: "/admin/access", label: "Access" },
      { href: "/admin/integration-outbox", label: "Outbox" },
      { href: "/admin/integrations/luma", label: "Luma" },
      { href: "/admin/integrations/hubspot", label: "HubSpot" },
      { href: "/admin/audit-log", label: "Audit Log" },
      { href: "/admin/launch-gate", label: "Launch Gate" },
      { href: "/admin/pilot-scope", label: "Pilot Scope" },
      { href: "/profile", label: "Profile" },
    ]);
  });

  it("maps the richer canonical roles into the expected surface families", () => {
    expect(getActorSurfaceFamily(getMockLocalActorContext("committee.member@mymedlife.test"))).toBe(
      "member",
    );
    expect(getActorSurfaceFamily(getMockLocalActorContext("committee.chair@mymedlife.test"))).toBe(
      "leader",
    );
    expect(getActorSurfaceFamily(getMockLocalActorContext("coach@mymedlife.test"))).toBe(
      "coach",
    );
    expect(getActorSurfaceFamily(getMockLocalActorContext("admin@mymedlife.test"))).toBe(
      "staff",
    );
    expect(getActorSurfaceFamily(getMockLocalActorContext("ds.admin@mymedlife.test"))).toBe(
      "ds_admin",
    );
    expect(isMemberSurfaceFamily(getMockLocalActorContext("committee.member@mymedlife.test"))).toBe(
      true,
    );
    expect(isMemberSurfaceFamily(getMockLocalActorContext("leader.a@mymedlife.test"))).toBe(
      false,
    );
  });

  it("lets one assigned account access member, leader, and staff workspaces", () => {
    const actor = {
      ...getMockLocalActorContext("admin@mymedlife.test"),
      chapterRoles: ["General Member", "President / VP"],
      canonicalRoles: ["student_member", "president", "department_staff"],
      canonicalScopes: ["own", "chapter", "department"],
      primaryCanonicalRole: "department_staff",
    } satisfies ReturnType<typeof getMockLocalActorContext>;

    expect(getActorSurfaceFamily(actor)).toBe("staff");
    expect(getNavigationForActor(actor).map((item) => item.label)).toEqual([
      "Chapters",
      "Campaigns",
      "Proof / UGC",
      "Best Practices",
      "Campaign SOPs",
      "Admin",
    ]);
    expect(canAccessMemberWorkspace(actor)).toBe(true);
    expect(canAccessLeaderWorkspace(actor)).toBe(true);
    expect(canAccessStaffWorkspace(actor)).toBe(true);
    expect(canAccessAdminWorkspace(actor)).toBe(false);
  });

  it("keeps admin access explicit while allowing super admin staff review", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const superAdmin = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(canAccessAdminWorkspace(dsAdmin)).toBe(true);
    expect(canAccessAdminWorkspace(superAdmin)).toBe(true);
    expect(canAccessStaffWorkspace(dsAdmin)).toBe(false);
    expect(canAccessStaffWorkspace(superAdmin)).toBe(true);
    expect(canAccessMemberWorkspace(dsAdmin)).toBe(true);
    expect(canAccessLeaderWorkspace(dsAdmin)).toBe(true);
    expect(canAccessMemberWorkspace(superAdmin)).toBe(true);
    expect(canAccessLeaderWorkspace(superAdmin)).toBe(true);
    expect(isPreviewWorkspaceAccess(dsAdmin, "student_app")).toBe(true);
    expect(isPreviewWorkspaceAccess(superAdmin, "leader_command_center")).toBe(true);
    expect(canAccessWorkspace(dsAdmin, "student_app", { intent: "read" })).toBe(true);
    expect(canAccessWorkspace(dsAdmin, "student_app", { intent: "submit" })).toBe(false);
    expect(canAccessWorkspace(superAdmin, "leader_command_center", { intent: "approve" })).toBe(false);
  });

  it("gives members a mobile quick path to home, stories, events, points, and profile", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");

    expect(getMobileQuickNavigationForActor(actor)).toEqual([
      { href: "/app", label: "Home", helper: "Today" },
      { href: "/app/stories", label: "Stories", helper: "Field" },
      { href: "/app/events", label: "Events", helper: "Meet" },
      { href: "/app/points", label: "Points", helper: "Rank" },
      { href: "/profile", label: "Profile", helper: "Me" },
    ]);
  });

  it("keeps traveler accounts inside the same focused member navigation during the launch lane", () => {
    const actor = getMockLocalActorContext("traveler.a@mymedlife.test");

    expect(getNavigationForActor(actor).map((item) => item.label)).toEqual([
      "Home",
      "Stories",
      "Events",
      "Points",
      "Profile",
    ]);
    expect(getMobileQuickNavigationForActor(actor).map((item) => item.label)).toEqual([
      "Home",
      "Stories",
      "Events",
      "Points",
      "Profile",
    ]);
  });

  it("gives chapter leaders mobile shortcuts for planning, nudges, proof review, and loop demo", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");

    expect(getMobileQuickNavigationForActor(actor).map((item) => item.label)).toEqual([
      "Home",
      "Events",
      "Attendance",
      "Leaderboard",
    ]);
    expect(getMobileQuickNavigationForActor(actor)[2]).toEqual({
      href: "/leader?view=attendance",
      label: "Attendance",
      helper: "Check-in",
    });
  });

  it("keeps coach mobile navigation inside the owned portfolio flow", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");

    expect(getMobileQuickNavigationForActor(actor)).toEqual([
      { href: "/staff?view=chapters", label: "Portfolio", helper: "Chapters" },
      { href: "/staff?view=events", label: "Events", helper: "Health" },
      { href: "/staff?view=leaderboard", label: "Leaderboard", helper: "Rank" },
    ]);
  });

  it("keeps DS Admin mobile navigation focused on disabled outbox safety checks", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");

    expect(getMobileQuickNavigationForActor(actor)).toEqual([
      { href: "/admin", label: "Admin", helper: "Home" },
      { href: "/admin/integration-outbox", label: "Queue", helper: "Off" },
      { href: "/admin/audit-log", label: "Audit", helper: "Proof" },
      { href: "/admin/launch-gate", label: "Gate", helper: "Ready" },
      { href: "/admin/pilot-scope", label: "Scope", helper: "Pilot" },
    ]);
  });

  it("gives super admin mobile oversight without hiding the Rush Month reviewer paths", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");

    expect(getMobileQuickNavigationForActor(actor).map((item) => item.label)).toEqual([
      "Admin",
      "Queue",
      "Audit",
      "Gate",
      "Scope",
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
