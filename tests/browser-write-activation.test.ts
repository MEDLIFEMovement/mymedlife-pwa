import { describe, expect, it } from "vitest";
import { assignments, evidenceItems } from "@/data/mock-rush-month";
import {
  getAssignmentCreateBrowserWriteGate,
  getActionStartBrowserWriteGate,
  getBlockingActivationChecks,
  getCoachDecisionBrowserWriteGate,
  getHqSharingDecisionBrowserWriteGate,
  getLeaderProofDecisionBrowserWriteGate,
  getMembershipApprovalBrowserWriteGate,
  getPassedActivationChecks,
  getProofSubmissionBrowserWriteGate,
} from "@/services/browser-write-activation";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("browser write activation gate", () => {
  it("keeps assignment-create browser control disabled for an allowed chapter leader", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const gate = getAssignmentCreateBrowserWriteGate(actor, {
      title: "Assign tabling event owner",
      instructions: "Ask one student to own and promote the next Rush Month event.",
      ownerRole: "General Member",
      dueLabel: "Friday",
      evidenceRequired: "Owner name and proof plan.",
      points: 10,
      kpi: "Owner assigned",
    });

    expect(gate.operation).toBe("action_assigned");
    expect(gate.localFunction).toBe("app.create_chapter_assignment");
    expect(gate.functionSignature).toContain("app.create_chapter_assignment");
    expect(gate.canRenderEnabledControl).toBe(false);
    expect(gate.status).toBe("blocked_until_approval");
    expect(gate.preview.success).toBe(true);
    expect(getPassedActivationChecks(gate).map((check) => check.key)).toEqual([
      "actor_can_create_assignment",
      "actor_allowed_by_write_plan",
      "local_database_function_exists",
      "rls_tests_exist",
      "external_writes_disabled",
      "owner_role_valid",
      "duplicate_assignment",
      "reminders_disabled",
    ]);
    expect(getBlockingActivationChecks(gate).map((check) => check.key)).toEqual([
      "chapter_uuid",
      "campaign_uuid",
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("keeps action-start browser control disabled for an allowed member", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = requireAssignment("member-push");
    const gate = getActionStartBrowserWriteGate(actor, assignment);

    expect(gate.operation).toBe("action_started");
    expect(gate.localFunction).toBe("app.start_assignment_action");
    expect(gate.canRenderEnabledControl).toBe(false);
    expect(gate.status).toBe("blocked_until_approval");
    expect(gate.preview.success).toBe(true);
    expect(getPassedActivationChecks(gate).map((check) => check.key)).toEqual([
      "actor_can_read_assignment",
      "actor_allowed_by_write_plan",
      "local_database_function_exists",
      "rls_tests_exist",
      "external_writes_disabled",
    ]);
    expect(getBlockingActivationChecks(gate).map((check) => check.key)).toEqual([
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("keeps proof-submission browser control disabled for an allowed member", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const assignment = requireAssignment("member-push");
    const gate = getProofSubmissionBrowserWriteGate(actor, assignment, {
      evidenceType: "bridge_video",
      summary: "This bridge video explains why the Rush Month invite push worked.",
    });

    expect(gate.operation).toBe("evidence_submitted");
    expect(gate.localFunction).toBe("app.submit_assignment_proof_metadata");
    expect(gate.functionSignature).toContain("app.submit_assignment_proof_metadata");
    expect(gate.canRenderEnabledControl).toBe(false);
    expect(gate.status).toBe("blocked_until_approval");
    expect(gate.preview.success).toBe(true);
    expect(getPassedActivationChecks(gate).map((check) => check.key)).toEqual([
      "actor_can_submit_proof",
      "actor_allowed_by_write_plan",
      "local_database_function_exists",
      "rls_tests_exist",
      "assignment_ready_for_proof",
      "summary_long_enough",
      "proof_uploads_disabled",
      "external_writes_disabled",
    ]);
    expect(getBlockingActivationChecks(gate).map((check) => check.key)).toEqual([
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("keeps HQ sharing decision browser control disabled for an allowed admin", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const evidence = evidenceItems[0];
    const gate = getHqSharingDecisionBrowserWriteGate(actor, evidence, {
      decision: "approved",
      note: "Useful testimonial to share after HQ review.",
    });

    expect(gate.operation).toBe("hq_sharing_decision");
    expect(gate.localFunction).toBe("app.record_hq_proof_sharing_decision");
    expect(gate.functionSignature).toContain("app.record_hq_proof_sharing_decision");
    expect(gate.canRenderEnabledControl).toBe(false);
    expect(gate.status).toBe("blocked_until_approval");
    expect(gate.preview.success).toBe(true);
    expect(getPassedActivationChecks(gate).map((check) => check.key)).toEqual([
      "actor_can_make_hq_sharing_decision",
      "actor_allowed_by_write_plan",
      "local_database_function_exists",
      "rls_tests_exist",
      "evidence_not_final",
      "note_long_enough",
      "public_sharing_disabled",
      "external_writes_disabled",
    ]);
    expect(getBlockingActivationChecks(gate).map((check) => check.key)).toEqual([
      "evidence_uuid",
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("keeps leader proof decision browser control disabled for an allowed chapter leader", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const assignment = {
      ...requireAssignment("assign-eboard"),
      id: "00000000-0000-4000-8000-000000000101",
    };
    const evidence = {
      ...evidenceItems[0],
      id: "00000000-0000-4000-8000-000000000201",
      assignmentId: assignment.id,
    };
    const gate = getLeaderProofDecisionBrowserWriteGate(
      actor,
      assignment,
      evidence,
      {
        decision: "approve",
        note: "This proof has enough context to count for the action.",
      },
    );

    expect(gate.operation).toBe("leader_proof_decision");
    expect(gate.localFunction).toBe("app.record_leader_proof_decision");
    expect(gate.functionSignature).toContain("app.record_leader_proof_decision");
    expect(gate.canRenderEnabledControl).toBe(false);
    expect(gate.status).toBe("blocked_until_approval");
    expect(gate.preview.success).toBe(true);
    expect(getPassedActivationChecks(gate).map((check) => check.key)).toEqual([
      "actor_can_record_leader_proof_decision",
      "actor_allowed_by_write_plan",
      "local_database_function_exists",
      "rls_tests_exist",
      "evidence_uuid",
      "proof_ready_for_leader_decision",
      "note_long_enough",
      "member_nudges_disabled",
      "public_sharing_disabled",
      "external_writes_disabled",
    ]);
    expect(getBlockingActivationChecks(gate).map((check) => check.key)).toEqual([
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("keeps coach decision browser control disabled for an allowed coach", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const gate = getCoachDecisionBrowserWriteGate(actor, {
      decision: "intervene",
      note: "Local preview only: chapter needs coach support before advancing.",
      blockerSummary: "Rush ownership and proof quality need follow-up.",
    });

    expect(gate.operation).toBe("coach_decision_logged");
    expect(gate.route).toBe("/coach");
    expect(gate.localFunction).toBe("app.log_coach_decision");
    expect(gate.functionSignature).toContain("app.log_coach_decision");
    expect(gate.canRenderEnabledControl).toBe(false);
    expect(gate.status).toBe("blocked_until_approval");
    expect(gate.preview.success).toBe(true);
    expect(getPassedActivationChecks(gate).map((check) => check.key)).toEqual([
      "actor_can_log_coach_decision",
      "actor_allowed_by_write_plan",
      "local_database_function_exists",
      "rls_tests_exist",
      "external_writes_disabled",
      "coach_portfolio_or_staff",
      "note_long_enough",
      "blocker_summary_present",
      "escalation_packets_disabled",
    ]);
    expect(getBlockingActivationChecks(gate).map((check) => check.key)).toEqual([
      "phase_uuid",
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("can mark membership approval ready for a signed-in local leader with real UUIDs", () => {
    const actor = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const gate = getMembershipApprovalBrowserWriteGate(
      actor,
      {
        chapterId: "10000000-0000-4000-8000-000000000001",
        joinRequestId: "20000000-0000-4000-8000-000000000005",
        applicantEmail: "avery.new@mymedlife.test",
        requestedRoleKey: "general_member",
        requestedCommitteeLane: "Recruitment",
        auditReason: "Approve local Rush Month join request for chapter review.",
      },
      [],
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE: "true",
      },
    );

    expect(gate.operation).toBe("membership_approved");
    expect(gate.route).toBe("/chapter/members");
    expect(gate.canRenderEnabledControl).toBe(true);
    expect(gate.status).toBe("ready_for_local_write");
    expect(getBlockingActivationChecks(gate)).toEqual([]);
  });

  it("does not enable browser writes when the local write env var is requested", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const assignment = requireAssignment("assign-eboard");
    const gate = getActionStartBrowserWriteGate(actor, assignment, {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
    });

    expect(gate.envRequestedLocalWrites).toBe(true);
    expect(gate.canRenderEnabledControl).toBe(false);
    expect(
      getBlockingActivationChecks(gate).find((check) => {
        return check.key === "browser_write_approved";
      })?.detail,
    ).toContain("browser-facing writes remain disabled");
  });

  it("can mark action-start ready only for local auth and explicit approval flags", () => {
    const actor = getMockLocalActorContext(
      "member.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const assignment = {
      ...requireAssignment("member-push"),
      id: "00000000-0000-4000-8000-000000000101",
      status: "not_started" as const,
    };
    const gate = getActionStartBrowserWriteGate(actor, assignment, {
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ACTION_START_WRITE: "true",
    });

    expect(gate.status).toBe("ready_for_local_write");
    expect(gate.canRenderEnabledControl).toBe(true);
    expect(getBlockingActivationChecks(gate)).toEqual([]);
  });

  it("can mark assignment creation ready only for local auth and explicit approval flags", () => {
    const actor = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const gate = getAssignmentCreateBrowserWriteGate(
      actor,
      {
        title: "Assign tabling event owner",
        instructions: "Ask one student to own and promote the next Rush Month event.",
        ownerRole: "Action Committee Member",
        dueLabel: "Friday",
        evidenceRequired: "Owner name and proof plan.",
        points: 10,
        kpi: "Owner assigned",
      },
      {
        chapterId: "00000000-0000-4000-8000-000000000101",
        campaignId: "00000000-0000-4000-8000-000000000102",
        existingAssignments: [],
      },
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
      },
    );

    expect(gate.status).toBe("ready_for_local_write");
    expect(gate.canRenderEnabledControl).toBe(true);
    expect(getBlockingActivationChecks(gate)).toEqual([]);
  });

  it("can mark proof submission ready only for local auth and explicit approval flags", () => {
    const actor = getMockLocalActorContext(
      "member.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const assignment = {
      ...requireAssignment("member-push"),
      id: "00000000-0000-4000-8000-000000000101",
      status: "in_progress" as const,
    };
    const gate = getProofSubmissionBrowserWriteGate(
      actor,
      assignment,
      {
        evidenceType: "testimonial_text",
        summary:
          "This testimonial explains what happened and why another student should take action.",
      },
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE: "true",
      },
    );

    expect(gate.status).toBe("ready_for_local_write");
    expect(gate.canRenderEnabledControl).toBe(true);
    expect(getBlockingActivationChecks(gate)).toEqual([]);
  });

  it("can mark HQ proof decision ready only for local auth and explicit approval flags", () => {
    const actor = getMockLocalActorContext(
      "admin@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const evidence = {
      ...evidenceItems[0],
      id: "00000000-0000-4000-8000-000000000201",
      status: "pending_review" as const,
    };
    const gate = getHqSharingDecisionBrowserWriteGate(
      actor,
      evidence,
      {
        decision: "approved",
        note: "Useful testimonial to share after HQ review.",
      },
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE: "true",
      },
    );

    expect(gate.status).toBe("ready_for_local_write");
    expect(gate.canRenderEnabledControl).toBe(true);
    expect(getBlockingActivationChecks(gate)).toEqual([]);
  });

  it("can mark leader proof decision ready only for local auth and explicit approval flags", () => {
    const actor = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const assignment = {
      ...requireAssignment("assign-eboard"),
      id: "00000000-0000-4000-8000-000000000101",
    };
    const evidence = {
      ...evidenceItems[0],
      id: "00000000-0000-4000-8000-000000000201",
      assignmentId: assignment.id,
    };
    const gate = getLeaderProofDecisionBrowserWriteGate(
      actor,
      assignment,
      evidence,
      {
        decision: "approve",
        note: "This proof has enough context to count for the action.",
      },
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE: "true",
      },
    );

    expect(gate.status).toBe("ready_for_local_write");
    expect(gate.canRenderEnabledControl).toBe(true);
    expect(getBlockingActivationChecks(gate)).toEqual([]);
  });

  it("can mark coach decision ready only for local auth and explicit approval flags", () => {
    const actor = getMockLocalActorContext(
      "coach@mymedlife.test",
      "Signed in locally.",
      "mock_fallback",
      "local_auth_session",
      "signed_in",
    );
    const gate = getCoachDecisionBrowserWriteGate(
      actor,
      {
        decision: "hold",
        note: "Chapter should complete proof follow-up before advancing.",
      },
      {
        chapterId: "00000000-0000-4000-8000-000000000101",
        campaignId: "00000000-0000-4000-8000-000000000102",
        phaseId: "00000000-0000-4000-8000-000000000103",
      },
      {
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
        MYMEDLIFE_ENABLE_COACH_DECISION_WRITE: "true",
      },
    );

    expect(gate.status).toBe("ready_for_local_write");
    expect(gate.canRenderEnabledControl).toBe(true);
    expect(getBlockingActivationChecks(gate)).toEqual([]);
  });

  it("blocks Admin from the assignment-create write plan", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const gate = getAssignmentCreateBrowserWriteGate(actor, {
      title: "Assign event owner",
      instructions: "Ask one student to own the next Rush Month event.",
      ownerRole: "General Member",
      dueLabel: "Friday",
      evidenceRequired: "Owner name and event plan.",
      points: 10,
      kpi: "Owner assigned",
    });

    expect(gate.preview.success).toBe(false);
    expect(
      getBlockingActivationChecks(gate).map((check) => {
        return check.key;
      }),
    ).toEqual([
      "actor_can_create_assignment",
      "actor_allowed_by_write_plan",
      "chapter_uuid",
      "campaign_uuid",
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("blocks Coach from the proof-submission write plan", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const assignment = requireAssignment("member-push");
    const gate = getProofSubmissionBrowserWriteGate(actor, assignment, {
      evidenceType: "bridge_video",
      summary: "Coach should not submit student proof from this local contract.",
    });

    expect(gate.preview.success).toBe(false);
    expect(
      getBlockingActivationChecks(gate).map((check) => {
        return check.key;
      }),
    ).toEqual([
      "actor_can_submit_proof",
      "actor_allowed_by_write_plan",
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("blocks chapter leaders from HQ proof-sharing decisions", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const evidence = evidenceItems[0];
    const gate = getHqSharingDecisionBrowserWriteGate(actor, evidence, {
      decision: "approved",
      note: "Leader should not own HQ sharing decisions.",
    });

    expect(gate.preview.success).toBe(false);
    expect(
      getBlockingActivationChecks(gate).map((check) => {
        return check.key;
      }),
    ).toEqual([
      "actor_can_make_hq_sharing_decision",
      "actor_allowed_by_write_plan",
      "evidence_uuid",
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("blocks Admin from leader proof decision browser writes", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const assignment = requireAssignment("assign-eboard");
    const evidence = evidenceItems[0];
    const gate = getLeaderProofDecisionBrowserWriteGate(
      actor,
      assignment,
      evidence,
      {
        decision: "approve",
        note: "Admin should not own chapter proof completion truth.",
      },
    );

    expect(gate.preview.success).toBe(false);
    expect(
      getBlockingActivationChecks(gate).map((check) => {
        return check.key;
      }),
    ).toEqual([
      "actor_can_record_leader_proof_decision",
      "actor_allowed_by_write_plan",
      "evidence_uuid",
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("blocks chapter leaders from coach decision browser writes", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const gate = getCoachDecisionBrowserWriteGate(actor, {
      decision: "hold",
      note: "Chapter leaders should not own coach decision truth.",
    });

    expect(gate.preview.success).toBe(false);
    expect(
      getBlockingActivationChecks(gate).map((check) => {
        return check.key;
      }),
    ).toEqual([
      "actor_can_log_coach_decision",
      "actor_allowed_by_write_plan",
      "phase_uuid",
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("blocks DS Admin from coach decision browser writes", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const gate = getCoachDecisionBrowserWriteGate(actor, {
      decision: "hold",
      note: "DS Admin can inspect outbox posture but cannot own coach decisions.",
    });

    expect(gate.preview.success).toBe(false);
    expect(
      getBlockingActivationChecks(gate).map((check) => {
        return check.key;
      }),
    ).toEqual([
      "actor_can_log_coach_decision",
      "actor_allowed_by_write_plan",
      "phase_uuid",
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });

  it("blocks DS Admin from the action-start write plan", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const assignment = requireAssignment("member-push");
    const gate = getActionStartBrowserWriteGate(actor, assignment);

    expect(gate.preview.success).toBe(false);
    expect(
      getBlockingActivationChecks(gate).map((check) => {
        return check.key;
      }),
    ).toEqual([
      "actor_can_read_assignment",
      "actor_allowed_by_write_plan",
      "live_auth_approved",
      "browser_write_approved",
    ]);
  });
});

function requireAssignment(assignmentId: string) {
  const assignment = assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    throw new Error(`Missing mock assignment ${assignmentId}`);
  }

  return assignment;
}
