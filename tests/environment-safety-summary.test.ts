import { describe, expect, it } from "vitest";
import { getEnvironmentSafetySummary } from "@/services/environment-safety-summary";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("environment safety summary", () => {
  it("shows admin-safe local environment posture without secrets or enabled writes", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const summary = getEnvironmentSafetySummary(actor, {
      MYMEDLIFE_DATA_SOURCE: "mock",
      MYMEDLIFE_AUTH_MODE: "disabled",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS: "false",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "false",
      MYMEDLIFE_ENABLE_ACTION_START_WRITE: "false",
      MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "false",
      MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "false",
      MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "false",
      MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "false",
      MYMEDLIFE_ALLOW_PROOF_UPLOADS: "false",
      MYMEDLIFE_LOCAL_ACTOR_EMAIL: "admin@mymedlife.test",
    });

    expect(summary.canReadSummary).toBe(true);
    expect(summary.items).toHaveLength(12);
    expect(summary.counts.secretsShown).toBe(0);
    expect(summary.counts.browserWritesEnabled).toBe(0);
    expect(summary.counts.externalWritesEnabled).toBe(0);
    expect(summary.counts.blocked).toBe(0);
  });

  it("marks unsafe write and upload flag combinations clearly", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const summary = getEnvironmentSafetySummary(actor, {
      MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
      MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
      MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
      MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
      MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
      MYMEDLIFE_ALLOW_PROOF_UPLOADS: "true",
    });

    expect(summary.counts.blocked).toBe(6);
    expect(
      summary.items.filter((item) => item.status === "blocked").map((item) => item.label),
    ).toEqual([
      "Action-start write",
      "Assignment-create write",
      "Proof metadata write",
      "HQ proof decision write",
      "Coach decision write",
      "Proof uploads",
    ]);
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

  it("shows hosted staging review auth and the staging action-start gate without enabling external sends", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const summary = getEnvironmentSafetySummary(actor, {
      MYMEDLIFE_AUTH_MODE: "staging_supabase",
      MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH: "true",
      MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE: "true",
    });

    expect(summary.counts.browserWritesEnabled).toBe(1);
    expect(summary.counts.externalWritesEnabled).toBe(0);
    expect(
      summary.items.filter((item) => item.status === "watch").map((item) => item.label),
    ).toEqual(["Action-start write"]);
  });

  it("counts approved local proof metadata writes without enabling uploads or external sends", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const summary = getEnvironmentSafetySummary(actor, {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
      MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
      MYMEDLIFE_ALLOW_PROOF_UPLOADS: "false",
    });

    expect(summary.counts.browserWritesEnabled).toBe(2);
    expect(summary.counts.externalWritesEnabled).toBe(0);
    expect(
      summary.items.filter((item) => item.status === "watch").map((item) => item.label),
    ).toEqual([
      "Local Supabase writes",
      "Action-start write",
      "Proof metadata write",
    ]);
  });

  it("counts approved local HQ proof decision writes without enabling public sharing", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const summary = getEnvironmentSafetySummary(actor, {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
      MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
      MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
      MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
      MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
      MYMEDLIFE_ALLOW_PROOF_UPLOADS: "false",
    });

    expect(summary.counts.browserWritesEnabled).toBe(5);
    expect(summary.counts.externalWritesEnabled).toBe(0);
    expect(
      summary.items.filter((item) => item.status === "watch").map((item) => item.label),
    ).toEqual([
      "Local Supabase writes",
      "Action-start write",
      "Assignment-create write",
      "Proof metadata write",
      "HQ proof decision write",
      "Coach decision write",
    ]);
  });

  it("keeps DS Admin eligible and hides operating roles", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getEnvironmentSafetySummary(dsAdmin).canReadSummary).toBe(true);
    expect(getEnvironmentSafetySummary(member).canReadSummary).toBe(false);
    expect(getEnvironmentSafetySummary(committeeMember).canReadSummary).toBe(false);
    expect(getEnvironmentSafetySummary(committeeChair).canReadSummary).toBe(false);
    expect(getEnvironmentSafetySummary(leader).canReadSummary).toBe(false);
    expect(getEnvironmentSafetySummary(coach).canReadSummary).toBe(false);
  });
});
