import { describe, expect, it } from "vitest";
import { getFirstWriteActivationDrill } from "@/services/first-write-activation-drill";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

const mockData = getMockReadOnlyAppData("Testing first-write activation drill.");

describe("first-write activation drill", () => {
  it("shows admin the first-write drill while blocked in mock fallback data", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const drill = getFirstWriteActivationDrill(actor, mockData, {});

    expect(drill.canReadDrill).toBe(true);
    expect(drill.title).toBe("Admin first-write activation drill");
    expect(drill.status).toBe("blocked_until_local_supabase");
    expect(drill.counts.browserWritesExpected).toBe(0);
    expect(drill.counts.externalWritesExpected).toBe(0);
    expect(
      drill.checks.find((check) => check.key === "candidate_assignment_uuid")
        ?.passed,
    ).toBe(false);
    expect(drill.verificationPacket.status).toBe("blocked");
    expect(drill.verificationPacket.plainEnglishDecision).toContain(
      "Do not run",
    );
    expect(drill.hostedCloseout.recommendedHostedWrite).toBe("`action_started`");
    expect(drill.hostedCloseout.stagingTarget).toBe("staging.mymedlife.org");
  });

  it("marks the drill ready only with local Supabase data, auth mode, flags, and UUID assignment", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const data = withSupabaseUuidAssignment(mockData);
    const drill = getFirstWriteActivationDrill(actor, data, {
      MYMEDLIFE_AUTH_MODE: "local_supabase",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
    });

    expect(drill.status).toBe("ready_for_local_action_start");
    expect(drill.verificationPacket.status).toBe("ready_to_run_locally");
    expect(drill.verificationPacket.canPromoteToStagingReview).toBe(false);
    expect(drill.counts.browserWritesExpected).toBe(1);
    expect(drill.counts.externalWritesExpected).toBe(0);
    expect(drill.checks.every((check) => check.passed)).toBe(true);
    expect(drill.verificationPacket.envSettings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "MYMEDLIFE_ENABLE_ACTION_START_WRITE",
          value: "true",
        }),
        expect.objectContaining({
          key: "MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE",
          value: "false",
        }),
      ]),
    );
    expect(drill.verificationPacket.fakeMemberCredential).toEqual({
      email: "member.a@mymedlife.test",
      passwordLabel: "password",
      route: "/login",
    });
    expect(
      drill.readbackEvidence.find((item) => item.key === "internal_event")?.status,
    ).toBe("missing");
    expect(drill.candidateAssignment?.route).toBe(
      "/rush-month/actions?assignmentId=00000000-0000-4000-8000-000000000101&source=first_write_packet",
    );
    expect(drill.hostedCloseout.requiredReadback).toContain(
      "Assignment status changes to `in_progress`.",
    );
  });

  it("keeps local Supabase UUID data blocked until write flags are explicitly enabled", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const drill = getFirstWriteActivationDrill(
      actor,
      withSupabaseUuidAssignment(mockData),
      {
        MYMEDLIFE_AUTH_MODE: "local_supabase",
      },
    );

    expect(drill.status).toBe("blocked_until_flags");
    expect(
      drill.checks.find((check) => check.key === "local_write_flag")?.passed,
    ).toBe(false);
    expect(
      drill.checks.find((check) => check.key === "action_start_flag")?.passed,
    ).toBe(false);
  });

  it("recognizes an explicitly approved staging review path for the first hosted write", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const drill = getFirstWriteActivationDrill(
      actor,
      withSupabaseUuidAssignment(mockData),
      {
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH: "true",
        MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE: "true",
      },
    );

    expect(drill.status).toBe("ready_for_local_action_start");
    expect(
      drill.checks.find((check) => check.key === "local_auth_mode")?.label,
    ).toBe("Hosted staging Supabase Auth mode is selected");
    expect(
      drill.checks.find((check) => check.key === "local_write_flag")?.detail,
    ).toContain("hosted staging action-start write flag");
    expect(drill.verificationPacket.envSettings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "MYMEDLIFE_AUTH_MODE",
          value: "staging_supabase",
          reason: expect.stringContaining("protected staging access path"),
        }),
        expect.objectContaining({
          key: "MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH",
          value: "true",
          reason: expect.stringContaining("Vercel gate"),
        }),
        expect.objectContaining({
          key: "MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE",
          value: "true",
        }),
      ]),
    );
    expect(
      drill.verificationPacket.operatorSequence.find((step) => step.route === "/login")
        ?.expectedProof,
    ).toContain("clears the approved staging access path");
    expect(drill.verificationPacket.safetyStops.join(" ")).toContain(
      "approved staging access path",
    );
    expect(drill.plainEnglishSummary).toContain("controlled staging proof run");
    expect(drill.verificationPacket.plainEnglishDecision).toContain(
      "hosted staging drill is ready to run",
    );
  });

  it("names the local action-start sequence and proof expected from staff", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const drill = getFirstWriteActivationDrill(actor, mockData, {});

    expect(drill.steps.map((step) => step.key)).toEqual([
      "setup_local_stack",
      "sign_in_member",
      "enable_narrow_flags",
      "start_assignment",
      "verify_audit",
    ]);
    expect(
      drill.steps.find((step) => step.key === "start_assignment")
        ?.structuredEvents,
    ).toContain("action_started");
    expect(drill.proofToCollect.join(" ")).toContain("audit log");
    expect(drill.proofToCollect.join(" ")).toContain("external writes stayed at zero");
    expect(drill.hostedCloseout.reviewSurfaces).toContain("/admin/audit-log");
    expect(drill.hostedCloseout.namedOwnersStillNeeded).toHaveLength(4);
  });

  it("uses recorded pilot approvals to shrink the hosted-write owner gap", () => {
    const originalWrite = process.env.MYMEDLIFE_PILOT_FIRST_HOSTED_WRITE;
    const originalRollback = process.env.MYMEDLIFE_PILOT_ROLLBACK_OWNER;
    const originalSupportOwner = process.env.MYMEDLIFE_PILOT_SUPPORT_OWNER;
    const originalSupport = process.env.MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL;

    process.env.MYMEDLIFE_PILOT_FIRST_HOSTED_WRITE = "`action_started`";
    process.env.MYMEDLIFE_PILOT_ROLLBACK_OWNER = "Kiomi Matsukawa";
    process.env.MYMEDLIFE_PILOT_SUPPORT_OWNER = "Maya Support";
    process.env.MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL = "#mymedlife-pilot-watch";

    try {
      const drill = getFirstWriteActivationDrill(
        getMockLocalActorContext("admin@mymedlife.test"),
        mockData,
        process.env,
      );

      expect(drill.hostedCloseout.recommendedHostedWrite).toBe("`action_started`");
      expect(drill.hostedCloseout.recordedOwnerAnswers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: "rollback_owner",
            value: "Kiomi Matsukawa",
          }),
          expect.objectContaining({
            key: "support_owner",
            value: "Maya Support",
          }),
          expect.objectContaining({
            key: "support_pause_channel",
            value: "#mymedlife-pilot-watch",
          }),
        ]),
      );
      expect(drill.hostedCloseout.approvalReplyBlock.join("\n")).toContain(
        "Rollback owner: Kiomi Matsukawa",
      );
      expect(drill.hostedCloseout.namedOwnersStillNeeded).toEqual([
        expect.objectContaining({
          key: "hosted_write_approver",
        }),
      ]);
    } finally {
      restoreEnv("MYMEDLIFE_PILOT_FIRST_HOSTED_WRITE", originalWrite);
      restoreEnv("MYMEDLIFE_PILOT_ROLLBACK_OWNER", originalRollback);
      restoreEnv("MYMEDLIFE_PILOT_SUPPORT_OWNER", originalSupportOwner);
      restoreEnv("MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL", originalSupport);
    }
  });

  it("shows observed readback evidence after the local action-start records exist", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const drill = getFirstWriteActivationDrill(
      actor,
      withFirstWriteReadback(withSupabaseUuidAssignment(mockData)),
      {
        MYMEDLIFE_AUTH_MODE: "local_supabase",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
      },
    );

    expect(drill.candidateAssignment?.status).toBe("in_progress");
    expect(drill.status).toBe("evidence_recorded");
    expect(Object.fromEntries(
      drill.readbackEvidence.map((item) => [item.key, item.status]),
    )).toEqual({
      assignment_status: "observed",
      internal_event: "observed",
      integration_event: "observed",
      audit_log: "observed",
      automation_outbox: "safe_zero",
    });
    expect(drill.verificationPacket.status).toBe("evidence_observed");
    expect(drill.verificationPacket.canPromoteToStagingReview).toBe(true);
    expect(drill.verificationPacket.plainEnglishDecision).toContain(
      "staging review",
    );
    expect(drill.plainEnglishSummary).toContain("already contains first-write readback evidence");
    expect(drill.counts.observedReadbackItems).toBe(5);
    expect(drill.counts.externalWritesExpected).toBe(0);
  });

  it("recognizes hosted action-start proof even after the assignment has advanced to submitted", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const drill = getFirstWriteActivationDrill(
      actor,
      withHostedAdvancedFirstWriteEvidence(withSupabaseUuidAssignment(mockData)),
      {
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH: "true",
        MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE: "true",
      },
    );

    expect(drill.candidateAssignment?.status).toBe("submitted");
    expect(drill.status).toBe("evidence_recorded");
    expect(
      drill.readbackEvidence.find((item) => item.key === "assignment_status")?.status,
    ).toBe("observed");
    expect(
      drill.readbackEvidence.find((item) => item.key === "assignment_status")?.detail,
    ).toContain("advanced beyond first-write into submitted");
    expect(drill.verificationPacket.status).toBe("evidence_observed");
    expect(drill.verificationPacket.canPromoteToStagingReview).toBe(true);
    expect(drill.plainEnglishSummary).toContain("Hosted staging already contains first-write readback evidence");
    expect(drill.hostedCloseout.currentObservedEvidence).toEqual(
      expect.objectContaining({
        assignmentId: drill.candidateAssignment?.id,
        assignmentStatus: "submitted",
        zeroOutboxSends: true,
      }),
    );
    expect(drill.hostedCloseout.currentObservedEvidence?.reviewerNote).toContain(
      "already moved beyond the first write",
    );
  });

  it("does not claim a startable assignment exists when the candidate is already in progress", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const drill = getFirstWriteActivationDrill(
      actor,
      withFirstWriteReadback(withSupabaseUuidAssignment(mockData)),
      {
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
        MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH: "true",
        MYMEDLIFE_ENABLE_STAGING_ACTION_START_WRITE: "true",
      },
    );

    expect(
      drill.checks.find((check) => check.key === "candidate_assignment")?.passed,
    ).toBe(false);
    expect(
      drill.checks.find((check) => check.key === "candidate_assignment")?.detail,
    ).toContain("Reset or seed one member assignment");
  });

  it("requires manual audit confirmation when core readback is visible but audit is missing", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const data = withFirstWriteReadback(withSupabaseUuidAssignment(mockData));
    const drill = getFirstWriteActivationDrill(
      actor,
      {
        ...data,
        auditLogs: [],
      },
      {
        MYMEDLIFE_AUTH_MODE: "local_supabase",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
      },
    );

    expect(drill.verificationPacket.status).toBe("needs_manual_audit_check");
    expect(drill.verificationPacket.canPromoteToStagingReview).toBe(false);
    expect(drill.readbackEvidence.find((item) => item.key === "audit_log")?.status).toBe(
      "manual_check_needed",
    );
  });

  it("keeps DS Admin eligible and operating roles hidden", () => {
    const dsAdmin = getMockLocalActorContext("ds.admin@mymedlife.test");
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getFirstWriteActivationDrill(dsAdmin, mockData).canReadDrill).toBe(true);
    expect(getFirstWriteActivationDrill(dsAdmin, mockData).title).toBe(
      "DS Admin first-write safety drill",
    );
    expect(getFirstWriteActivationDrill(member, mockData).canReadDrill).toBe(false);
    expect(getFirstWriteActivationDrill(committeeMember, mockData).canReadDrill).toBe(false);
    expect(getFirstWriteActivationDrill(committeeChair, mockData).canReadDrill).toBe(false);
    expect(getFirstWriteActivationDrill(leader, mockData).canReadDrill).toBe(false);
    expect(getFirstWriteActivationDrill(coach, mockData).canReadDrill).toBe(false);
  });
});

function withSupabaseUuidAssignment(data: ReadOnlyAppData): ReadOnlyAppData {
  return {
    ...data,
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "Testing local Supabase data.",
    },
    assignments: [
      {
        ...data.assignments[0],
        id: "00000000-0000-4000-8000-000000000101",
        status: "not_started",
        lane: "Member",
      },
      ...data.assignments.slice(1),
    ],
  };
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function withFirstWriteReadback(data: ReadOnlyAppData): ReadOnlyAppData {
  const assignmentId = "00000000-0000-4000-8000-000000000101";
  const eventId = "00000000-0000-4000-8000-000000000201";
  const integrationEventId = "00000000-0000-4000-8000-000000000301";

  return {
    ...data,
    assignments: data.assignments.map((assignment) => {
      if (assignment.id !== assignmentId) {
        return assignment;
      }

      return {
        ...assignment,
        status: "in_progress",
      };
    }),
    eventRows: [
      {
        id: eventId,
        event_type: "action_started",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: assignmentId,
        chapter_event_id: null,
        payload: {
          source: "app.start_assignment_action",
        },
        correlation_id: "action_started:test",
        occurred_at: "2026-06-16T19:00:00Z",
        created_at: "2026-06-16T19:00:00Z",
      },
    ],
    integrationEventRows: [
      {
        id: integrationEventId,
        source_event_id: eventId,
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "action_started",
        destination: "internal",
        external_object_type: "assignment",
        external_object_id: assignmentId,
        status: "recorded",
        payload: {
          liveExternalWrite: false,
        },
        created_by: "00000000-0000-4000-8000-000000000001",
        created_at: "2026-06-16T19:00:00Z",
        updated_at: "2026-06-16T19:00:00Z",
      },
    ],
    automationOutboxRows: [],
    auditLogs: [
      {
        id: "00000000-0000-4000-8000-000000000401",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        action: "action_started",
        target_table: "assignments",
        target_id: assignmentId,
        before_value: {
          status: "not_started",
        },
        after_value: {
          status: "in_progress",
          eventId,
          integrationEventId,
        },
        reason: "Local action start test.",
        created_at: "2026-06-16T19:00:00Z",
      },
    ],
  };
}

function withHostedAdvancedFirstWriteEvidence(data: ReadOnlyAppData): ReadOnlyAppData {
  const assignmentId = "50000000-0000-4000-8000-000000000002";
  const eventId = "80326f8b-2436-409b-9a7d-454006c76772";
  const integrationEventId = "20033a9c-f891-43c6-88ca-0e3bf0b03a8c";

  return {
    ...data,
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "Testing hosted staging first-write readback.",
    },
    assignments: data.assignments.map((assignment, index) => {
      if (index !== 0) {
        return assignment;
      }

      return {
        ...assignment,
        id: assignmentId,
        status: "submitted",
        lane: "Member",
        title: "Invite three more students to Rush Month",
      };
    }),
    eventRows: [
      {
        id: eventId,
        event_type: "action_started",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: assignmentId,
        chapter_event_id: null,
        payload: {
          source: "app.start_assignment_action",
        },
        correlation_id: "action_started:assignment-2:member-1",
        occurred_at: "2026-06-29T15:33:24Z",
        created_at: "2026-06-29T15:33:24Z",
      },
    ],
    integrationEventRows: [
      {
        id: integrationEventId,
        source_event_id: eventId,
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "action_started",
        destination: "internal",
        external_object_type: "assignment",
        external_object_id: assignmentId,
        status: "recorded",
        payload: {
          liveExternalWrite: false,
        },
        created_by: "00000000-0000-4000-8000-000000000001",
        created_at: "2026-06-29T15:33:24Z",
        updated_at: "2026-06-29T15:33:24Z",
      },
    ],
    automationOutboxRows: [],
    auditLogs: [
      {
        id: "99ad7242-b46c-48d4-a573-79eef122fa74",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        action: "action_started",
        target_table: "assignments",
        target_id: assignmentId,
        before_value: {
          status: "not_started",
        },
        after_value: {
          status: "in_progress",
          eventId,
        },
        reason: "Hosted preview action-start proof save.",
        created_at: "2026-06-29T15:33:24Z",
      },
    ],
  };
}
