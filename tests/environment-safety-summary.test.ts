import { describe, expect, it } from "vitest";
import { getEnvironmentSafetySummary } from "@/services/environment-safety-summary";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("environment safety summary", () => {
  it("shows admin-safe local environment posture without secrets or enabled writes", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const summary = getEnvironmentSafetySummary(actor, {
      MYMEDLIFE_DATA_SOURCE: "mock",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS: "false",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "false",
      MYMEDLIFE_ENABLE_ACTION_START_WRITE: "false",
      MYMEDLIFE_ALLOW_PROOF_UPLOADS: "false",
      MYMEDLIFE_LOCAL_ACTOR_EMAIL: "admin@mymedlife.test",
    });

    expect(summary.canReadSummary).toBe(true);
    expect(summary.items).toHaveLength(7);
    expect(summary.counts.secretsShown).toBe(0);
    expect(summary.counts.browserWritesEnabled).toBe(0);
    expect(summary.counts.externalWritesEnabled).toBe(0);
    expect(summary.counts.blocked).toBe(0);
  });

  it("marks unsafe write and upload flag combinations clearly", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const summary = getEnvironmentSafetySummary(actor, {
      MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
      MYMEDLIFE_ALLOW_PROOF_UPLOADS: "true",
    });

    expect(summary.counts.blocked).toBe(2);
    expect(
      summary.items.filter((item) => item.status === "blocked").map((item) => item.label),
    ).toEqual(["Action-start write", "Proof uploads"]);
  });

  it("counts the approved local action-start write without enabling external sends", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const summary = getEnvironmentSafetySummary(actor, {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
    });

    expect(summary.counts.browserWritesEnabled).toBe(1);
    expect(summary.counts.externalWritesEnabled).toBe(0);
    expect(
      summary.items.filter((item) => item.status === "watch").map((item) => item.label),
    ).toEqual(["Local Supabase writes", "Action-start write"]);
  });

  it("keeps DS Admin eligible and hides operating roles", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getEnvironmentSafetySummary(dsAdmin).canReadSummary).toBe(true);
    expect(getEnvironmentSafetySummary(member).canReadSummary).toBe(false);
    expect(getEnvironmentSafetySummary(leader).canReadSummary).toBe(false);
    expect(getEnvironmentSafetySummary(coach).canReadSummary).toBe(false);
  });
});
