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
    expect(checklist.counts.total).toBe(14);
    expect(checklist.counts.coveredMock).toBeGreaterThan(0);
    expect(checklist.counts.coveredReadonly).toBeGreaterThan(0);
    expect(checklist.counts.blockedUntilApproval).toBe(2);
  });

  it("gives DS Admin a safety-oriented checklist without raw student detail", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const checklist = getMvpCoverageChecklist(actor, data);

    expect(checklist.canReadChecklist).toBe(true);
    expect(checklist.title).toBe("DS Admin MVP safety checklist");
    expect(checklist.items.find((item) => item.key === "integration_outbox")).toBeDefined();
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
    expect(checklist.items.map((item) => item.key)).toContain("design_qa");
    expect(checklist.items.map((item) => item.key)).toContain("controlled_pilot");
    expect(
      checklist.items.find((item) => item.key === "controlled_pilot")?.routeEvidence,
    ).toContain("/admin/staff-dry-run");
  });

  it("hides the admin coverage checklist from chapter roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getMvpCoverageChecklist(member, data).canReadChecklist).toBe(false);
    expect(getMvpCoverageChecklist(leader, data).canReadChecklist).toBe(false);
    expect(getMvpCoverageChecklist(coach, data).canReadChecklist).toBe(false);
  });

  it("keeps live auth/writes and real integrations blocked", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const checklist = getMvpCoverageChecklist(actor, data);
    const liveAuth = checklist.items.find((item) => item.key === "live_auth_writes");
    const integrations = checklist.items.find((item) => item.key === "real_integrations");

    expect(liveAuth?.status).toBe("blocked_until_approval");
    expect(integrations?.status).toBe("blocked_until_approval");
    expect(liveAuth?.plainEnglish).toContain("not enabled");
    expect(integrations?.plainEnglish).toContain("remain disabled");
  });
});
