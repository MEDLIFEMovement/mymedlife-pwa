import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMvpCoverageChecklist } from "@/services/mvp-coverage-checklist";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing MVP coverage checklist.");

describe("mvp coverage checklist", () => {
  it("gives admin a plain-English MVP coverage checklist", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const checklist = getMvpCoverageChecklist(actor, data);

    expect(checklist.canReadChecklist).toBe(true);
    expect(checklist.title).toBe("Admin MVP coverage checklist");
    expect(checklist.counts.total).toBe(15);
    expect(checklist.counts.coveredMock).toBeGreaterThan(0);
    expect(checklist.counts.coveredReadonly).toBeGreaterThan(0);
    expect(checklist.counts.blockedUntilApproval).toBe(2);
    expect(
      checklist.items.find((item) => item.key === "admin")?.plainEnglish,
    ).toContain("stakeholder review path");
    expect(
      checklist.items.find((item) => item.key === "admin")?.routeEvidence,
    ).toContain("/admin/review-path");
    expect(
      checklist.items.find((item) => item.key === "admin")?.plainEnglish,
    ).toContain("Nick final review packet");
    expect(
      checklist.items.find((item) => item.key === "admin")?.routeEvidence,
    ).toContain("/admin/nick-review");
    expect(
      checklist.items.find((item) => item.key === "admin")?.plainEnglish,
    ).toContain("master data inventory");
    expect(
      checklist.items.find((item) => item.key === "admin")?.plainEnglish,
    ).toContain("focused read-only master data inventory");
    expect(
      checklist.items.find((item) => item.key === "admin")?.routeEvidence,
    ).toContain("/admin/launch-gate");
    expect(
      checklist.items.find((item) => item.key === "admin")?.routeEvidence,
    ).toContain("/admin/master-data");
    expect(
      checklist.items.find((item) => item.key === "admin")?.routeEvidence,
    ).toContain("/admin/audit-log");
    expect(
      checklist.items.find((item) => item.key === "admin")?.routeEvidence,
    ).toContain("/admin/database-security");
    expect(
      checklist.items.find((item) => item.key === "admin")?.routeEvidence,
    ).toContain("/admin/system-health");
    expect(
      checklist.items.find((item) => item.key === "admin")?.routeEvidence,
    ).toContain("/admin/operations");
    expect(
      checklist.items.find((item) => item.key === "admin")?.plainEnglish,
    ).toContain("audit readback posture");
    expect(
      checklist.items.find((item) => item.key === "admin")?.plainEnglish,
    ).toContain("Goal 156 write-audit preflight");
    expect(
      checklist.items.find((item) => item.key === "admin")?.plainEnglish,
    ).toContain("auth preflight");
    expect(
      checklist.items.find((item) => item.key === "admin")?.plainEnglish,
    ).toContain("release readiness");
    expect(
      checklist.items.find((item) => item.key === "admin")?.routeEvidence,
    ).toContain("/admin/release-readiness");
    expect(
      checklist.items.find((item) => item.key === "admin")?.plainEnglish,
    ).toContain("launch gate");
    expect(
      checklist.items.find((item) => item.key === "admin")?.plainEnglish,
    ).toContain("Supabase/PlanetScale tradeoffs");
    expect(
      checklist.items.find((item) => item.key === "admin")?.plainEnglish,
    ).toContain("system health review");
    expect(
      checklist.items.find((item) => item.key === "admin")?.plainEnglish,
    ).toContain("production operations runbook");
    expect(
      checklist.items.find((item) => item.key === "roles")?.plainEnglish,
    ).toContain("local sign-in");
    expect(
      checklist.items.find((item) => item.key === "roles")?.plainEnglish,
    ).toContain("chapter home");
    expect(
      checklist.items.find((item) => item.key === "roles")?.plainEnglish,
    ).toContain("Rush Month overview");
    expect(
      checklist.items.find((item) => item.key === "roles")?.routeEvidence,
    ).toContain("/login");
    expect(
      checklist.items.find((item) => item.key === "roles")?.routeEvidence,
    ).toContain("/chapter");
    expect(
      checklist.items.find((item) => item.key === "roles")?.routeEvidence,
    ).toContain("/rush-month");
    expect(
      checklist.items.find((item) => item.key === "roles")?.plainEnglish,
    ).toContain("read-only profile/scope route");
    expect(
      checklist.items.find((item) => item.key === "roles")?.plainEnglish,
    ).toContain("auth/onboarding path");
    expect(
      checklist.items.find((item) => item.key === "roles")?.plainEnglish,
    ).toContain("staff-only production auth preflight");
    expect(
      checklist.items.find((item) => item.key === "roles")?.routeEvidence,
    ).toContain("/profile");
    expect(
      checklist.items.find((item) => item.key === "roles")?.routeEvidence,
    ).toContain("/onboarding");
    expect(
      checklist.items.find((item) => item.key === "recognition")?.plainEnglish,
    ).toContain("direct leaderboard route");
    expect(
      checklist.items.find((item) => item.key === "recognition")?.routeEvidence,
    ).toContain("/rush-month/leaderboard");
    expect(
      checklist.items.find((item) => item.key === "events_nps")?.plainEnglish,
    ).toContain("direct event detail");
    expect(
      checklist.items.find((item) => item.key === "events_nps")?.plainEnglish,
    ).toContain("member event list");
    expect(
      checklist.items.find((item) => item.key === "events_nps")?.plainEnglish,
    ).toContain("attend-reflect-share proof bridge");
    expect(
      checklist.items.find((item) => item.key === "events_nps")?.routeEvidence,
    ).toContain("/rush-month/events/[eventId]");
    expect(
      checklist.items.find((item) => item.key === "rush_loop")?.plainEnglish,
    ).toContain("Rush Month front door");
    expect(
      checklist.items.find((item) => item.key === "rush_loop")?.routeEvidence,
    ).toContain("/rush-month");
    expect(
      checklist.items.find((item) => item.key === "assignments")?.plainEnglish,
    ).toContain("assigned action detail");
    expect(
      checklist.items.find((item) => item.key === "assignments")?.plainEnglish,
    ).toContain("assigned-actions list");
    expect(
      checklist.items.find((item) => item.key === "assignments")?.routeEvidence,
    ).toContain("/rush-month/actions/[assignmentId]");
  });

  it("gives DS Admin a safety-oriented checklist without raw student detail", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const checklist = getMvpCoverageChecklist(actor, data);

    expect(checklist.canReadChecklist).toBe(true);
    expect(checklist.title).toBe("DS Admin MVP safety checklist");
    expect(checklist.items.find((item) => item.key === "integration_outbox")).toBeDefined();
    expect(
      checklist.items.find((item) => item.key === "integration_outbox")
        ?.plainEnglish,
    ).toContain("focused integration outbox route");
    expect(
      checklist.items.find((item) => item.key === "integration_outbox")
        ?.plainEnglish,
    ).toContain("Goal 155 live-send preflight");
    expect(
      checklist.items.find((item) => item.key === "integration_outbox")?.nextStep,
    ).toContain("queue retries");
    expect(
      checklist.items.find((item) => item.key === "integration_outbox")
        ?.routeEvidence,
    ).toContain("/admin/integration-outbox");
    expect(
      checklist.items.find((item) => item.key === "real_integrations")?.status,
    ).toBe("blocked_until_approval");
  });

  it("gives super admin the full local coverage checklist", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const checklist = getMvpCoverageChecklist(actor, data);

    expect(checklist.canReadChecklist).toBe(true);
    expect(checklist.title).toBe("Full local MVP coverage checklist");
    expect(checklist.items.map((item) => item.key)).toContain("rush_loop");
    expect(checklist.items.map((item) => item.key)).toContain("events_nps");
    expect(checklist.items.map((item) => item.key)).toContain("member_management");
    expect(
      checklist.items.find((item) => item.key === "member_management")
        ?.plainEnglish,
    ).toContain("Goal 160 membership approval packet");
    expect(
      checklist.items.find((item) => item.key === "member_management")
        ?.plainEnglish,
    ).toContain("Goal 161 membership result states");
    expect(checklist.items.map((item) => item.key)).toContain("first_write_drill");
    expect(checklist.items.map((item) => item.key)).toContain("design_qa");
    expect(checklist.items.map((item) => item.key)).toContain("controlled_pilot");
    expect(
      checklist.items.find((item) => item.key === "controlled_pilot")?.routeEvidence,
    ).toContain("/admin/operations");
    expect(
      checklist.items.find((item) => item.key === "controlled_pilot")?.routeEvidence,
    ).toContain("/admin/staff-dry-run");
    expect(
      checklist.items.find((item) => item.key === "controlled_pilot")?.routeEvidence,
    ).toContain("/admin/pilot-scope");
    expect(
      checklist.items.find((item) => item.key === "controlled_pilot")?.plainEnglish,
    ).toContain("launch evidence collection");
    expect(
      checklist.items.find((item) => item.key === "controlled_pilot")?.nextStep,
    ).toContain("Goal 150 launch evidence checklist");
    expect(
      checklist.items.find((item) => item.key === "coach")?.plainEnglish,
    ).toContain("support notes");
    expect(
      checklist.items.find((item) => item.key === "coach")?.plainEnglish,
    ).toContain("Goal 154 intervention checklists");
    expect(
      checklist.items.find((item) => item.key === "coach")?.nextStep,
    ).toContain("escalation sends");
    expect(
      checklist.items.find((item) => item.key === "design_qa")?.plainEnglish,
    ).toContain("offline recovery");
    expect(
      checklist.items.find((item) => item.key === "design_qa")?.plainEnglish,
    ).toContain("eight-route mobile smoke plan");
    expect(
      checklist.items.find((item) => item.key === "design_qa")?.plainEnglish,
    ).toContain("route-smoke metadata");
    expect(
      checklist.items.find((item) => item.key === "design_qa")?.plainEnglish,
    ).toContain("seven-check accessibility smoke plan");
    expect(
      checklist.items.find((item) => item.key === "design_qa")?.plainEnglish,
    ).toContain("seven-check device/PWA smoke matrix");
    expect(
      checklist.items.find((item) => item.key === "design_qa")?.routeEvidence,
    ).toContain("/offline");
    expect(
      checklist.items.find((item) => item.key === "design_qa")?.routeEvidence,
    ).toContain("/admin/design-qa");
    expect(
      checklist.items.find((item) => item.key === "design_qa")?.routeEvidence,
    ).toContain("/admin/nick-review");
    expect(
      checklist.items.find((item) => item.key === "design_qa")?.routeEvidence,
    ).toContain("/proof-library/upload");
    expect(
      checklist.items.find((item) => item.key === "design_qa")?.routeEvidence,
    ).toContain("/admin/system-health");
    expect(
      checklist.items.find((item) => item.key === "proof")?.plainEnglish,
    ).toContain("leader proof decisions");
    expect(
      checklist.items.find((item) => item.key === "proof")?.plainEnglish,
    ).toContain("member proof queues");
    expect(
      checklist.items.find((item) => item.key === "proof")?.plainEnglish,
    ).toContain("Goal 152 proof prep checklists");
    expect(
      checklist.items.find((item) => item.key === "proof")?.plainEnglish,
    ).toContain("Goal 158 proof submission packets");
    expect(
      checklist.items.find((item) => item.key === "proof")?.plainEnglish,
    ).toContain("Goal 159 proof storage intake packets");
    expect(
      checklist.items.find((item) => item.key === "proof")?.plainEnglish,
    ).toContain("Goal 153 leader proof review rubrics");
    expect(
      checklist.items.find((item) => item.key === "proof")?.routeEvidence,
    ).toContain("/rush-month/evidence");
    expect(
      checklist.items.find((item) => item.key === "proof")?.plainEnglish,
    ).toContain("leader decision result states");
    expect(
      checklist.items.find((item) => item.key === "proof")?.plainEnglish,
    ).toContain("Goal 115 SQL/RLS coverage");
    expect(
      checklist.items.find((item) => item.key === "proof")?.nextStep,
    ).toContain("leader proof browser decisions");
  });

  it("hides the admin coverage checklist from chapter roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getMvpCoverageChecklist(member, data).canReadChecklist).toBe(false);
    expect(getMvpCoverageChecklist(committeeMember, data).canReadChecklist).toBe(false);
    expect(getMvpCoverageChecklist(committeeChair, data).canReadChecklist).toBe(false);
    expect(getMvpCoverageChecklist(leader, data).canReadChecklist).toBe(false);
    expect(getMvpCoverageChecklist(coach, data).canReadChecklist).toBe(false);
  });

  it("keeps live auth/writes and real integrations blocked", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const checklist = getMvpCoverageChecklist(actor, data);
    const liveAuth = checklist.items.find((item) => item.key === "live_auth_writes");
    const integrations = checklist.items.find((item) => item.key === "real_integrations");

    expect(liveAuth?.status).toBe("blocked_until_approval");
    expect(liveAuth?.plainEnglish).toContain("Goal 157");
    expect(liveAuth?.plainEnglish).toContain("role assignment");
    expect(liveAuth?.nextStep).toContain("production auth preflight");
    expect(integrations?.status).toBe("blocked_until_approval");
    expect(liveAuth?.plainEnglish).toContain("not enabled");
    expect(liveAuth?.plainEnglish).toContain("onboarding writes");
    expect(liveAuth?.routeEvidence).toContain("/onboarding");
    expect(integrations?.plainEnglish).toContain("remain disabled");
  });
});
